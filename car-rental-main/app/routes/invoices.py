"""Gestion des factures — 3M SERVICES (admin).

Remplace l'ancienne page Finances & Transactions par un module complet de facturation :
liste avec KPIs, tiroir de création rapide, édition, changement de statut / règlement,
aperçu imprimable et export PDF officiel 3M SERVICES.
"""
import csv
import hashlib
import hmac
import io
import json
import os
import re
from datetime import date, datetime, timedelta

from flask import (Blueprint, Response, abort, current_app, flash, jsonify,
                   redirect, render_template, request, send_file, url_for)
from flask_login import current_user, login_required
from sqlalchemy import or_
from werkzeug.security import generate_password_hash

from app import db
from app.models import (Apartment, Bus, Contract, Invoice, InvoiceItem,
                        Route, Trip, User)
from app.routes.admin import admin_required, log_audit
from app.utils.security import csrf_protect

invoices_bp = Blueprint('invoices', __name__)

CURRENCIES = {
    'XAF': ('FCFA (XAF)', 'FCFA'),
    'EUR': ('Euro (€)', '€'),
    'USD': ('Dollar ($)', '$'),
}

PAYMENT_METHODS = {
    'mtn_momo': 'MTN Mobile Money',
    'orange_money': 'Orange Money',
    'cash': 'Espèces',
    'bank_transfer': 'Virement bancaire',
    'card': 'Carte bancaire',
    'check': 'Chèque',
}

STATUS_LABELS = {
    'draft': ('Brouillon', 'neutral'),
    'sent': ('Envoyée', 'info'),
    'paid': ('Payée', 'ok'),
    'partially_paid': ('Partiellement payée', 'warn'),
    'overdue': ('En retard', 'danger'),
    'cancelled': ('Annulée', 'danger'),
}

DEFAULT_TERMS = (
    "Facture payable à réception selon le mode convenu (MTN MoMo, Orange Money, virement bancaire ou espèces en agence 3M SERVICES). "
    "Tout retard de paiement au-delà de la date d'échéance peut entraîner des pénalités ou la suspension de la prestation."
)


def ensure_invoice_schema():
    """Crée les tables invoice / invoice_item si absentes sans modifier les données existantes."""
    try:
        db.create_all()
    except Exception as exc:
        db.session.rollback()
        current_app.logger.warning(f"Invoice schema bootstrap warning: {exc}")


def _scoped_invoices():
    q = Invoice.query.filter_by(is_deleted=False)
    if current_user.role != 'super_admin' and getattr(current_user, 'agency_id', None):
        q = q.filter(or_(Invoice.agency_id == current_user.agency_id, Invoice.agency_id.is_(None)))
    return q


def _generate_reference():
    year = datetime.utcnow().year
    prefix = f'FAC-{year}-'
    last = (
        Invoice.query
        .filter(Invoice.reference.like(prefix + '%'))
        .order_by(Invoice.id.desc())
        .first()
    )
    seq = 1
    if last and last.reference:
        m = re.search(r'(\d+)$', last.reference)
        if m:
            seq = int(m.group(1)) + 1
    candidate = f'{prefix}{seq:04d}'
    while Invoice.query.filter_by(reference=candidate).first():
        seq += 1
        candidate = f'{prefix}{seq:04d}'
    return candidate


def _sanitize_html(raw):
    """Nettoie le HTML issu de l'éditeur riche sans dépendances externes."""
    if not raw:
        return ''
    cleaned = re.sub(r'<\s*(script|iframe|object|embed|style)[^>]*>.*?<\s*/\s*\1\s*>', '', raw, flags=re.I | re.S)
    cleaned = re.sub(r'\s+on\w+\s*=\s*(?:"[^"]*"|\'[^\']*\'|[^\s>]+)', '', cleaned, flags=re.I)
    cleaned = re.sub(r'javascript\s*:', '', cleaned, flags=re.I)
    return cleaned.strip()


def _float(val, default=0.0):
    try:
        return float(str(val).replace(',', '.').strip())
    except (TypeError, ValueError):
        return default


def _parse_date(val, default=None):
    if not val:
        return default
    try:
        return datetime.strptime(val.strip()[:10], '%Y-%m-%d').date()
    except ValueError:
        return default


def _format_money(amount, currency='XAF'):
    symbol = CURRENCIES.get(currency, ('FCFA', 'FCFA'))[1]
    if currency in ('EUR', 'USD'):
        return f"{(amount or 0):,.2f} {symbol}".replace(',', ' ')
    return f"{round(amount or 0):,} {symbol}".replace(',', ' ')


def _parse_line_items(form):
    names = form.getlist('item_name[]') or form.getlist('item_name')
    qtys = form.getlist('item_qty[]') or form.getlist('item_qty')
    prices = form.getlist('item_price[]') or form.getlist('item_price')
    discs = form.getlist('item_discount[]') or form.getlist('item_discount')

    items = []
    for idx, raw_name in enumerate(names):
        name = (raw_name or '').strip()
        qty = max(0.0, _float(qtys[idx] if idx < len(qtys) else 1, 1.0))
        price = max(0.0, _float(prices[idx] if idx < len(prices) else 0, 0.0))
        disc = min(100.0, max(0.0, _float(discs[idx] if idx < len(discs) else 0, 0.0)))
        if not name and price <= 0:
            continue
        if not name:
            name = f'Prestation #{idx + 1}'
        line_amount = round(qty * price * (1.0 - disc / 100.0), 2)
        items.append({
            'item_name': name[:200],
            'quantity': qty,
            'unit_price': price,
            'discount_percent': disc,
            'amount': line_amount,
            'sort_order': idx,
        })
    return items


def _compute_totals(items, disc_pct, extra_disc_pct, tax_pct, fallback_amount=0.0):
    disc_pct = min(100.0, max(0.0, _float(disc_pct, 0.0)))
    extra_disc_pct = min(100.0, max(0.0, _float(extra_disc_pct, 0.0)))
    tax_pct = min(100.0, max(0.0, _float(tax_pct, 0.0)))

    subtotal = round(sum(i['amount'] for i in items), 2) if items else round(max(0.0, _float(fallback_amount, 0.0)), 2)
    disc_amt = round(subtotal * disc_pct / 100.0, 2)
    after_disc = max(0.0, subtotal - disc_amt)
    extra_amt = round(after_disc * extra_disc_pct / 100.0, 2)
    taxable = max(0.0, after_disc - extra_amt)
    tax_amt = round(taxable * tax_pct / 100.0, 2)
    total = round(taxable + tax_amt, 2)
    return {
        'subtotal': subtotal,
        'discount_percent': disc_pct,
        'discount_amount': disc_amt,
        'extra_discount_percent': extra_disc_pct,
        'extra_discount_amount': extra_amt,
        'tax_percent': tax_pct,
        'tax_amount': tax_amt,
        'total_amount': total,
    }


def _form_context():
    clients = (
        User.query.filter_by(role='client', is_deleted=False)
        .order_by(User.real_name.asc(), User.username.asc())
        .all()
    )
    cq = Contract.query.filter_by(is_deleted=False)
    if current_user.role != 'super_admin' and getattr(current_user, 'agency_id', None):
        cq = cq.filter(or_(Contract.agency_id == current_user.agency_id, Contract.agency_id.is_(None)))
    contracts = cq.order_by(Contract.created_at.desc()).limit(60).all()

    tq = Trip.query.filter_by(is_deleted=False)
    if current_user.role != 'super_admin' and getattr(current_user, 'agency_id', None):
        tq = tq.join(Route).filter(Route.agency_id == current_user.agency_id)
    trips = tq.order_by(Trip.departure_time.desc()).limit(60).all()

    apartments = Apartment.query.filter_by(is_deleted=False).order_by(Apartment.title.asc()).all()
    buses = Bus.query.filter_by(is_deleted=False).order_by(Bus.brand.asc(), Bus.model.asc()).all()

    catalog_items = []
    for b in buses:
        label = f"Location {b.brand or ''} {b.model} ({b.bus_number})".strip()
        price = (b.promo_price if b.is_promo and b.promo_price else None) or b.regular_price or b.promo_price or 0
        catalog_items.append({'label': label, 'price': int(price)})
    for a in apartments:
        catalog_items.append({'label': f"Séjour {a.title}", 'price': int(a.nightly_rate or 0)})

    return {
        'clients': clients,
        'contracts': contracts,
        'trips': trips,
        'apartments': apartments,
        'catalog_items': catalog_items,
        'currencies': CURRENCIES,
        'payment_methods': PAYMENT_METHODS,
        'status_labels': STATUS_LABELS,
        'default_terms': DEFAULT_TERMS,
        'today_iso': date.today().isoformat(),
        'due_default_iso': (date.today() + timedelta(days=7)).isoformat(),
    }


def _resolve_project_links(form):
    ref = (form.get('project_ref') or '').strip()
    contract_id = trip_id = apartment_id = None
    project_label = (form.get('project_label') or '').strip()
    if ref.startswith('contract:'):
        try:
            contract_id = int(ref.split(':', 1)[1])
            c = Contract.query.get(contract_id)
            if c and not project_label:
                project_label = f"{c.reference} — {c.subject}"
        except ValueError:
            contract_id = None
    elif ref.startswith('trip:'):
        try:
            trip_id = int(ref.split(':', 1)[1])
            t = Trip.query.get(trip_id)
            if t and not project_label:
                route_txt = f"{t.route.origin} → {t.route.destination}" if t.route else "Mission VIP"
                project_label = f"Mission #{t.id} — {route_txt}"
        except ValueError:
            trip_id = None
    elif ref.startswith('apt:'):
        apartment_id = ref.split(':', 1)[1] or None
        if apartment_id and not project_label:
            a = Apartment.query.get(apartment_id)
            if a:
                project_label = f"Résidence — {a.title}"
    return contract_id, trip_id, apartment_id, project_label[:200] if project_label else None


def _save_invoice(inv, form):
    client_id_raw = (form.get('client_id') or '').strip()
    client_id = int(client_id_raw) if client_id_raw.isdigit() else None
    bill_to = (form.get('bill_to') or '').strip()
    ship_to = (form.get('ship_to') or '').strip()

    if not bill_to and client_id:
        c = User.query.get(client_id)
        if c:
            bill_to = f"{c.real_name or c.username}" + (f" · {c.phone}" if c.phone else '')
    if not ship_to:
        ship_to = bill_to

    errors = []
    if not bill_to:
        errors.append("Le champ « Facturer à » est obligatoire.")
    if not ship_to:
        errors.append("Le champ « Lieu de prestation / Livraison » est obligatoire.")

    currency = (form.get('currency') or 'XAF').strip().upper()
    if currency not in CURRENCIES:
        currency = 'XAF'

    issue_date = _parse_date(form.get('issue_date'), date.today())
    due_date = _parse_date(form.get('due_date'), issue_date + timedelta(days=7))
    if due_date < issue_date:
        errors.append("La date d'échéance ne peut pas être antérieure à la date d'émission.")

    payment_method = (form.get('payment_method') or 'mtn_momo').strip()
    if payment_method not in PAYMENT_METHODS:
        payment_method = 'mtn_momo'

    status = (form.get('status') or 'draft').strip()
    if status not in STATUS_LABELS:
        status = 'draft'

    items = _parse_line_items(form)
    fallback_amount = _float(form.get('amount'), 0.0)
    totals = _compute_totals(
        items,
        form.get('discount_percent', 0),
        form.get('extra_discount_percent', 0),
        form.get('tax_percent', 0),
        fallback_amount=fallback_amount,
    )
    if totals['total_amount'] <= 0 and not items and fallback_amount <= 0:
        errors.append("Ajoutez au moins une ligne ou un montant positif.")

    if errors:
        return False, errors

    contract_id, trip_id, apartment_id, project_label = _resolve_project_links(form)

    inv.client_id = client_id
    inv.bill_to = bill_to[:255]
    inv.ship_to = ship_to[:255]
    inv.contract_id = contract_id
    inv.trip_id = trip_id
    inv.apartment_id = apartment_id
    inv.project_label = project_label
    inv.currency = currency
    inv.issue_date = issue_date
    inv.due_date = due_date
    inv.payment_method = payment_method
    inv.status = status
    inv.description = _sanitize_html(form.get('description'))
    inv.subtotal = totals['subtotal']
    inv.discount_percent = totals['discount_percent']
    inv.discount_amount = totals['discount_amount']
    inv.extra_discount_percent = totals['extra_discount_percent']
    inv.extra_discount_amount = totals['extra_discount_amount']
    inv.tax_percent = totals['tax_percent']
    inv.tax_amount = totals['tax_amount']
    inv.total_amount = totals['total_amount']
    if status == 'paid':
        inv.amount_paid = inv.total_amount
    elif inv.amount_paid is None:
        inv.amount_paid = 0.0
    inv.notes = (form.get('notes') or '').strip()
    inv.terms = (form.get('terms') or '').strip() or DEFAULT_TERMS

    if not items and fallback_amount > 0:
        items = [{
            'item_name': project_label or 'Prestation 3M SERVICES',
            'quantity': 1.0,
            'unit_price': totals['subtotal'],
            'discount_percent': 0.0,
            'amount': totals['subtotal'],
            'sort_order': 0,
        }]

    inv.items.clear()
    for it in items:
        inv.items.append(InvoiceItem(**it))

    return True, []


def _filter_invoices(all_invs, status_filter, currency_filter, payment_filter, q_text):
    filtered = all_invs
    if status_filter != 'all' and status_filter in STATUS_LABELS:
        filtered = [i for i in filtered if i.status == status_filter]
    if currency_filter != 'all' and currency_filter in CURRENCIES:
        filtered = [i for i in filtered if i.currency == currency_filter]
    if payment_filter != 'all' and payment_filter in PAYMENT_METHODS:
        filtered = [i for i in filtered if i.payment_method == payment_filter]
    if q_text:
        q_low = q_text.lower()
        filtered = [
            i for i in filtered
            if q_low in (i.reference or '').lower()
            or q_low in (i.bill_to or '').lower()
            or q_low in (i.ship_to or '').lower()
            or q_low in (i.project_label or '').lower()
            or (i.client and q_low in (i.client.real_name or i.client.username or '').lower())
        ]
    return filtered


@invoices_bp.route('/admin/invoices')
@login_required
@admin_required
def index():
    q_text = (request.args.get('q') or '').strip()
    status_filter = (request.args.get('status') or 'all').strip()
    currency_filter = (request.args.get('currency') or 'all').strip().upper() if (request.args.get('currency') or 'all').strip() != 'all' else 'all'
    payment_filter = (request.args.get('payment_method') or 'all').strip()
    view_mode = request.args.get('view', 'grid')
    if view_mode not in ('grid', 'list'):
        view_mode = 'grid'

    all_invs = _scoped_invoices().order_by(Invoice.created_at.desc()).all()
    today = date.today()
    for inv in all_invs:
        if inv.status in ('sent', 'partially_paid') and inv.due_date and inv.due_date < today and inv.balance > 0:
            inv.status = 'overdue'
    if db.session.dirty:
        db.session.commit()

    active_invs = [i for i in all_invs if i.status != 'cancelled']
    kpis = {
        'total_invoiced': sum(i.total_amount or 0 for i in active_invs),
        'total_paid': sum(i.amount_paid or 0 for i in active_invs),
        'total_due': sum(i.balance for i in active_invs if i.status != 'paid'),
        'overdue_count': sum(1 for i in active_invs if i.status == 'overdue'),
        'total_count': len(all_invs),
    }

    filtered = _filter_invoices(all_invs, status_filter, currency_filter, payment_filter, q_text)
    has_active_filters = (status_filter != 'all' or currency_filter != 'all' or payment_filter != 'all' or bool(q_text))

    _, active_chats = _load_active_chats()
    chat_matches = {inv.id: _find_matching_client_chat(inv, active_chats) for inv in filtered}

    ctx = _form_context()
    return render_template(
        'admin/invoices_list.html',
        invoices=filtered,
        kpis=kpis,
        chat_matches=chat_matches,
        q_text=q_text,
        status_filter=status_filter,
        currency_filter=currency_filter,
        payment_filter=payment_filter,
        view_mode=view_mode,
        has_active_filters=has_active_filters,
        open_new=(request.args.get('new') == '1'),
        format_money=_format_money,
        **ctx,
    )


@invoices_bp.route('/admin/invoices/export/csv')
@login_required
@admin_required
def export_csv():
    q_text = (request.args.get('q') or '').strip()
    status_filter = (request.args.get('status') or 'all').strip()
    currency_filter = (request.args.get('currency') or 'all').strip().upper() if (request.args.get('currency') or 'all').strip() != 'all' else 'all'
    payment_filter = (request.args.get('payment_method') or 'all').strip()

    all_invs = _scoped_invoices().order_by(Invoice.created_at.desc()).all()
    filtered = _filter_invoices(all_invs, status_filter, currency_filter, payment_filter, q_text)

    out = io.StringIO()
    writer = csv.writer(out)
    writer.writerow([
        'Référence', 'Client', 'Lieu de prestation', 'Prestation',
        'Date émission', 'Échéance', 'Devise', 'Sous-total', 'TVA',
        'Total', 'Payé', 'Solde dû', 'Mode paiement', 'Statut',
    ])
    for inv in filtered:
        writer.writerow([
            inv.reference,
            inv.bill_to or '',
            inv.ship_to or '',
            inv.project_label or 'Prestation 3M SERVICES',
            inv.issue_date.strftime('%Y-%m-%d') if inv.issue_date else '',
            inv.due_date.strftime('%Y-%m-%d') if inv.due_date else '',
            inv.currency,
            f"{inv.subtotal or 0:.2f}",
            f"{inv.tax_amount or 0:.2f}",
            f"{inv.total_amount or 0:.2f}",
            f"{inv.amount_paid or 0:.2f}",
            f"{inv.balance:.2f}",
            PAYMENT_METHODS.get(inv.payment_method, inv.payment_method),
            STATUS_LABELS.get(inv.status, (inv.status,))[0],
        ])

    payload = '\ufeff' + out.getvalue()
    return Response(
        payload.encode('utf-8'),
        mimetype='text/csv; charset=utf-8',
        headers={'Content-Disposition': 'attachment; filename=factures_3m_services.csv'},
    )


@invoices_bp.route('/admin/invoices/new')
@login_required
@admin_required
def new():
    return redirect(url_for('invoices.index', new='1'))


@invoices_bp.route('/admin/invoices/create', methods=['POST'])
@login_required
@admin_required
@csrf_protect
def create():
    inv = Invoice(
        reference=_generate_reference(),
        agency_id=getattr(current_user, 'agency_id', None),
        created_by_id=current_user.id,
        due_date=date.today() + timedelta(days=7),
    )
    ok, errors = _save_invoice(inv, request.form)
    if not ok:
        for err in errors:
            flash(err, 'danger')
        return redirect(url_for('invoices.index', new='1'))

    db.session.add(inv)
    db.session.commit()
    log_audit('INVOICE_CREATED', 'Invoice', inv.id, f"Facture {inv.reference} créée ({_format_money(inv.total_amount, inv.currency)})")
    flash(f"Facture {inv.reference} créée avec succès.", 'success')
    return redirect(url_for('invoices.detail', invoice_id=inv.id))


@invoices_bp.route('/admin/invoices/<int:invoice_id>')
@login_required
@admin_required
def detail(invoice_id):
    inv = _scoped_invoices().filter_by(id=invoice_id).first_or_404()
    _, active_chats = _load_active_chats()
    matched_chat = _find_matching_client_chat(inv, active_chats)
    return render_template(
        'admin/invoices_detail.html',
        invoice=inv,
        matched_chat=matched_chat,
        status_labels=STATUS_LABELS,
        payment_methods=PAYMENT_METHODS,
        currencies=CURRENCIES,
        format_money=_format_money,
    )


@invoices_bp.route('/admin/invoices/<int:invoice_id>/edit', methods=['GET', 'POST'])
@login_required
@admin_required
def edit(invoice_id):
    inv = _scoped_invoices().filter_by(id=invoice_id).first_or_404()
    if request.method == 'POST':
        from app.utils.security import validate_csrf_token
        token = request.form.get('csrf_token') or request.headers.get('X-CSRFToken')
        if not validate_csrf_token(token):
            abort(400)
        ok, errors = _save_invoice(inv, request.form)
        if not ok:
            for err in errors:
                flash(err, 'danger')
        else:
            db.session.commit()
            log_audit('INVOICE_UPDATED', 'Invoice', inv.id, f"Facture {inv.reference} mise à jour")
            flash(f"Facture {inv.reference} mise à jour.", 'success')
            return redirect(url_for('invoices.detail', invoice_id=inv.id))

    ctx = _form_context()
    return render_template(
        'admin/invoices_edit.html',
        edit_invoice=inv,
        format_money=_format_money,
        **ctx,
    )


@invoices_bp.route('/admin/invoices/<int:invoice_id>/status', methods=['POST'])
@login_required
@admin_required
@csrf_protect
def update_status(invoice_id):
    inv = _scoped_invoices().filter_by(id=invoice_id).first_or_404()
    new_status = (request.form.get('status') or '').strip()
    paid_input = request.form.get('amount_paid')

    if paid_input is not None and str(paid_input).strip() != '':
        added = max(0.0, _float(paid_input, 0.0))
        inv.amount_paid = round(min(inv.total_amount or 0.0, (inv.amount_paid or 0.0) + added), 2)
        if inv.amount_paid >= (inv.total_amount or 0.0):
            inv.status = 'paid'
        elif inv.amount_paid > 0:
            inv.status = 'partially_paid'
    elif new_status in STATUS_LABELS:
        inv.status = new_status
        if new_status == 'paid':
            inv.amount_paid = inv.total_amount or 0.0

    db.session.commit()
    log_audit('INVOICE_STATUS_UPDATED', 'Invoice', inv.id, f"Statut {inv.reference} → {inv.status}")
    flash(f"Statut de la facture {inv.reference} mis à jour.", 'success')
    return redirect(request.referrer or url_for('invoices.detail', invoice_id=inv.id))


@invoices_bp.route('/admin/invoices/<int:invoice_id>/delete', methods=['POST'])
@login_required
@admin_required
@csrf_protect
def delete(invoice_id):
    inv = _scoped_invoices().filter_by(id=invoice_id).first_or_404()
    inv.is_deleted = True
    db.session.commit()
    log_audit('INVOICE_DELETED', 'Invoice', inv.id, f"Facture {inv.reference} supprimée")
    flash(f"Facture {inv.reference} supprimée.", 'info')
    return redirect(url_for('invoices.index'))


def _load_active_chats():
    """Charge db.json Express et renvoie (exp_db, conversations actives non fusionnées)."""
    db_path = current_app.config.get('EXPRESS_DB_JSON')
    if not db_path or not os.path.exists(db_path):
        return None, []
    try:
        with open(db_path, 'r', encoding='utf-8') as f:
            exp_db = json.load(f)
        chats = [c for c in (exp_db.get('chats') or []) if not c.get('mergedInto')]
        return exp_db, chats
    except Exception as exc:
        current_app.logger.warning(f"Impossible de lire les chats Express: {exc}")
        return None, []


def _norm_phone_tail(raw):
    digits = re.sub(r'\D', '', str(raw or ''))
    return digits[-9:] if len(digits) >= 8 else ''


def _find_matching_client_chat(inv, chats):
    """Trouve le fil de chat existant correspondant au client de la facture (sinon None)."""
    if not chats or not inv:
        return None

    client = getattr(inv, 'client', None)
    bill_to = (inv.bill_to or '').strip()

    # 1. Identifiant exact (username du compte client)
    if client and client.username:
        uname = client.username.strip()
        for c in chats:
            ids = {str(c.get('id') or ''), str(c.get('clientId') or '')} | {str(a) for a in (c.get('aliases') or [])}
            if uname in ids:
                return c

    # 2. Correspondance par e-mail réel
    emails = set()
    for src in [client.email if client else '', bill_to]:
        for m in re.findall(r'[A-Za-z0-9._%+\-]+@[A-Za-z0-9.\-]+\.[A-Za-z]{2,}', src or ''):
            em = m.lower()
            if not em.endswith('.local') and not em.endswith('@visiteur.3mservices.cm'):
                emails.add(em)
    if emails:
        for c in chats:
            cem = (c.get('clientEmail') or '').strip().lower()
            if cem and cem in emails:
                return c

    # 3. Correspondance par téléphone normalisé (9 derniers chiffres)
    phones = set()
    for candidate in [client.phone if client else '', bill_to]:
        tail = _norm_phone_tail(candidate)
        if tail:
            phones.add(tail)
    if phones:
        for c in chats:
            ctail = _norm_phone_tail(c.get('clientPhone'))
            if ctail and ctail in phones:
                return c

    # 4. Correspondance exacte par nom réel (hors libellés génériques)
    generic_names = {'', 'client', 'client 3m', 'client vip 3m', 'client invité vip', 'client invite vip'}
    names = set()
    if client and client.real_name:
        names.add(client.real_name.strip().lower())
    if bill_to:
        bill_name = bill_to.split('·', 1)[0].strip().lower()
        if bill_name:
            names.add(bill_name)
    names -= generic_names
    if names:
        for c in chats:
            cname = (c.get('clientName') or '').strip().lower()
            if cname and cname not in generic_names and cname in names:
                return c

    return None


def _invoice_pdf_token(inv):
    secret = str(current_app.config.get('SECRET_KEY') or '3m-dev-secret').encode('utf-8')
    msg = f"inv-pdf:{inv.id}:{inv.reference}".encode('utf-8')
    return hmac.new(secret, msg, hashlib.sha256).hexdigest()[:32]


def _build_invoice_pdf(inv):
    from reportlab.lib import colors
    from reportlab.lib.pagesizes import A4
    from reportlab.lib.utils import ImageReader
    from reportlab.pdfgen import canvas

    buf = io.BytesIO()
    c = canvas.Canvas(buf, pagesize=A4)
    w, h = A4

    # Header band
    c.setFillColor(colors.HexColor('#101828'))
    c.rect(0, h - 88, w, 88, fill=1, stroke=0)
    c.setFillColor(colors.HexColor('#D62828'))
    c.rect(0, h - 92, w, 4, fill=1, stroke=0)

    logo_path = os.path.join(current_app.static_folder, 'logorv.png')
    text_x = 40
    if os.path.exists(logo_path):
        try:
            c.drawImage(ImageReader(logo_path), 40, h - 72, width=48, height=48, mask='auto', preserveAspectRatio=True)
            text_x = 98
        except Exception:
            pass

    c.setFillColor(colors.white)
    c.setFont('Helvetica-Bold', 16)
    c.drawString(text_x, h - 42, '3M SERVICES')
    c.setFont('Helvetica', 9)
    c.setFillColor(colors.HexColor('#cbd5e1'))
    c.drawString(text_x, h - 57, 'Location de véhicules VIP · Conciergerie · Résidences meublées')
    c.drawString(text_x, h - 70, 'Yaoundé — Omnisports & Tsinga (Face FECAFOOT) · +237 691 78 64 47')

    c.setFillColor(colors.white)
    c.setFont('Helvetica-Bold', 18)
    c.drawRightString(w - 40, h - 42, 'FACTURE')
    c.setFont('Helvetica-Bold', 11)
    c.drawRightString(w - 40, h - 58, inv.reference)
    c.setFont('Helvetica', 9)
    c.drawRightString(w - 40, h - 72, STATUS_LABELS.get(inv.status, (inv.status, ''))[0].upper())

    # Bill To / Ship To / Dates
    y = h - 125
    c.setFillColor(colors.HexColor('#667085'))
    c.setFont('Helvetica-Bold', 8)
    c.drawString(40, y, 'FACTURER À')
    c.drawString(240, y, 'LIEU DE PRESTATION / LIVRAISON')
    c.drawString(430, y, 'DÉTAILS')

    y -= 15
    c.setFillColor(colors.HexColor('#101828'))
    c.setFont('Helvetica-Bold', 10)
    c.drawString(40, y, (inv.bill_to or '')[:38])
    c.drawString(240, y, (inv.ship_to or '')[:34])
    c.setFont('Helvetica', 9)
    c.drawString(430, y, f"Émise le : {inv.issue_date.strftime('%d/%m/%Y') if inv.issue_date else '—'}")
    y -= 14
    c.drawString(430, y, f"Échéance : {inv.due_date.strftime('%d/%m/%Y') if inv.due_date else '—'}")
    y -= 14
    c.drawString(430, y, f"Paiement : {PAYMENT_METHODS.get(inv.payment_method, inv.payment_method)}")
    if inv.project_label:
        c.setFont('Helvetica', 9)
        c.setFillColor(colors.HexColor('#475467'))
        c.drawString(40, y, f"Prestation : {inv.project_label[:65]}")

    # Description plain text
    plain_desc = re.sub(r'<[^>]+>', ' ', inv.description or '').strip()
    plain_desc = re.sub(r'\s+', ' ', plain_desc)
    if plain_desc:
        y -= 24
        c.setFillColor(colors.HexColor('#344054'))
        c.setFont('Helvetica', 9)
        c.drawString(40, y, plain_desc[:110])

    # Line items table header
    y -= 28
    c.setFillColor(colors.HexColor('#f2f4f7'))
    c.rect(40, y - 6, w - 80, 22, fill=1, stroke=0)
    c.setFillColor(colors.HexColor('#344054'))
    c.setFont('Helvetica-Bold', 9)
    c.drawString(48, y, 'Désignation')
    c.drawRightString(330, y, 'Qté')
    c.drawRightString(415, y, 'Prix unit.')
    c.drawRightString(468, y, 'Rem.')
    c.drawRightString(w - 48, y, 'Montant')

    y -= 22
    c.setFont('Helvetica', 9)
    for item in inv.items:
        if y < 140:
            c.showPage()
            y = h - 60
        c.setFillColor(colors.HexColor('#101828'))
        c.drawString(48, y, (item.item_name or '')[:48])
        qty_str = f"{int(item.quantity)}" if item.quantity == int(item.quantity) else f"{item.quantity:.2f}"
        c.drawRightString(330, y, qty_str)
        c.drawRightString(415, y, _format_money(item.unit_price, inv.currency))
        c.drawRightString(468, y, f"{item.discount_percent or 0:.0f}%")
        c.setFont('Helvetica-Bold', 9)
        c.drawRightString(w - 48, y, _format_money(item.amount, inv.currency))
        c.setFont('Helvetica', 9)
        c.setStrokeColor(colors.HexColor('#eaecf0'))
        c.line(40, y - 6, w - 40, y - 6)
        y -= 20

    # Totals block
    y -= 14
    summary_rows = [('Sous-total', _format_money(inv.subtotal, inv.currency))]
    if inv.discount_percent:
        summary_rows.append((f"Remise ({inv.discount_percent:g}%)", f"-{_format_money(inv.discount_amount, inv.currency)}"))
    if inv.extra_discount_percent:
        summary_rows.append((f"Remise suppl. ({inv.extra_discount_percent:g}%)", f"-{_format_money(inv.extra_discount_amount, inv.currency)}"))
    if inv.tax_percent:
        summary_rows.append((f"TVA ({inv.tax_percent:g}%)", _format_money(inv.tax_amount, inv.currency)))

    for lbl, val in summary_rows:
        c.setFillColor(colors.HexColor('#475467'))
        c.setFont('Helvetica', 9)
        c.drawString(350, y, lbl)
        c.drawRightString(w - 48, y, val)
        y -= 16

    c.setFillColor(colors.HexColor('#f9fafb'))
    c.rect(340, y - 8, w - 380, 24, fill=1, stroke=0)
    c.setFillColor(colors.HexColor('#101828'))
    c.setFont('Helvetica-Bold', 11)
    c.drawString(350, y, 'TOTAL')
    c.setFillColor(colors.HexColor('#D62828'))
    c.drawRightString(w - 48, y, _format_money(inv.total_amount, inv.currency))

    y -= 20
    c.setFillColor(colors.HexColor('#027a48'))
    c.setFont('Helvetica', 9)
    c.drawString(350, y, 'Déjà réglé')
    c.drawRightString(w - 48, y, _format_money(inv.amount_paid, inv.currency))
    y -= 14
    c.setFillColor(colors.HexColor('#101828'))
    c.setFont('Helvetica-Bold', 9)
    c.drawString(350, y, 'Reste à payer')
    c.drawRightString(w - 48, y, _format_money(inv.balance, inv.currency))

    # Notes & Terms
    y -= 32
    if inv.notes and y > 90:
        c.setFillColor(colors.HexColor('#344054'))
        c.setFont('Helvetica-Bold', 9)
        c.drawString(40, y, 'Notes :')
        c.setFont('Helvetica', 8.5)
        c.drawString(40, y - 13, (inv.notes or '')[:115])
        y -= 30
    if inv.terms and y > 60:
        c.setFillColor(colors.HexColor('#667085'))
        c.setFont('Helvetica-Bold', 8.5)
        c.drawString(40, y, 'Conditions générales :')
        c.setFont('Helvetica', 8)
        c.drawString(40, y - 12, (inv.terms or '')[:125])

    c.save()
    buf.seek(0)
    return buf


@invoices_bp.route('/admin/invoices/<int:invoice_id>/pdf')
@login_required
@admin_required
def download_pdf(invoice_id):
    inv = _scoped_invoices().filter_by(id=invoice_id).first_or_404()
    return send_file(_build_invoice_pdf(inv), as_attachment=True, download_name=f'{inv.reference}.pdf', mimetype='application/pdf')


@invoices_bp.route('/invoices/public/<int:invoice_id>/<token>/pdf')
def public_pdf(invoice_id, token):
    inv = Invoice.query.filter_by(id=invoice_id, is_deleted=False).first_or_404()
    if not hmac.compare_digest(str(token or ''), _invoice_pdf_token(inv)):
        abort(403)
    return send_file(_build_invoice_pdf(inv), as_attachment=True, download_name=f'{inv.reference}.pdf', mimetype='application/pdf')


@invoices_bp.route('/admin/invoices/<int:invoice_id>/send-to-chat', methods=['POST'])
@login_required
@admin_required
@csrf_protect
def send_to_chat(invoice_id):
    inv = _scoped_invoices().filter_by(id=invoice_id).first_or_404()
    exp_db, active_chats = _load_active_chats()
    chat = _find_matching_client_chat(inv, active_chats)
    if not chat or not exp_db:
        flash("Aucun fil de chat existant trouvé pour ce client.", 'warning')
        return redirect(request.referrer or url_for('invoices.detail', invoice_id=inv.id))

    base_url = (current_app.config.get('APP_BASE_URL') or request.host_url.rstrip('/')).rstrip('/')
    pdf_url = base_url + url_for('invoices.public_pdf', invoice_id=inv.id, token=_invoice_pdf_token(inv))
    total_str = _format_money(inv.total_amount, inv.currency)
    balance_str = _format_money(inv.balance, inv.currency)
    due_str = inv.due_date.strftime('%d/%m/%Y') if inv.due_date else '—'
    project_str = inv.project_label or 'Prestation 3M SERVICES'

    now_iso = datetime.utcnow().isoformat() + 'Z'
    msg_text = (
        f"🧾 Facture {inv.reference} — {project_str}\n"
        f"• Montant total : {total_str}\n"
        f"• Solde restant : {balance_str}\n"
        f"• Échéance : {due_str}"
    )
    new_msg = {
        'id': f"msg-inv-{inv.id}-{int(datetime.utcnow().timestamp() * 1000)}",
        'sender': 'admin',
        'senderName': f"Conciergerie VIP 3M ({current_user.username})",
        'text': msg_text,
        'timestamp': now_iso,
        'attachment': {
            'type': 'invoice',
            'reference': inv.reference,
            'project': project_str,
            'total': total_str,
            'balance': balance_str,
            'dueDate': due_str,
            'status': STATUS_LABELS.get(inv.status, (inv.status,))[0],
            'url': pdf_url,
        },
    }

    chat['messages'] = chat.get('messages') or []
    chat['messages'].append(new_msg)
    chat['lastMessage'] = f"🧾 Facture {inv.reference} ({total_str})"
    chat['lastMessageAt'] = now_iso
    chat['unreadClient'] = chat.get('unreadClient', 0) + 1
    chat['unreadAdmin'] = 0

    all_chats = exp_db.get('chats') or []
    exp_db['chats'] = [chat] + [c for c in all_chats if c is not chat]
    db_path = current_app.config.get('EXPRESS_DB_JSON')
    with open(db_path, 'w', encoding='utf-8') as f:
        json.dump(exp_db, f, indent=2, ensure_ascii=False)

    if inv.status == 'draft':
        inv.status = 'sent'
        db.session.commit()

    log_audit('INVOICE_SENT_TO_CHAT', 'Invoice', inv.id, f"Facture {inv.reference} transférée au chat {chat.get('id')}")
    flash(f"Facture {inv.reference} transférée dans le chat de {chat.get('clientName') or chat.get('id')} !", 'success')
    return redirect(request.referrer or url_for('invoices.detail', invoice_id=inv.id))


@invoices_bp.route('/admin/invoices/api/quick-client', methods=['POST'])
@login_required
@admin_required
@csrf_protect
def quick_client():
    data = request.get_json(silent=True) or request.form
    name = (data.get('name') or '').strip()[:100]
    phone = (data.get('phone') or '').strip()[:30]
    email = (data.get('email') or '').strip().lower()[:120]
    address = (data.get('address') or '').strip()[:200]

    if not name or (not phone and not email):
        return jsonify({'success': False, 'error': 'Nom complet et téléphone (ou e-mail) obligatoires.'}), 400

    existing = None
    if phone:
        existing = User.query.filter_by(phone=phone, is_deleted=False).first()
    if not existing and email:
        existing = User.query.filter_by(email=email, is_deleted=False).first()

    if existing:
        bill_to = f"{existing.real_name or existing.username}" + (f" · {existing.phone}" if existing.phone else '')
        return jsonify({
            'success': True,
            'existing': True,
            'client': {'id': existing.id, 'label': bill_to, 'bill_to': bill_to, 'address': existing.address or ''},
        })

    digits = re.sub(r'\D', '', phone or str(int(datetime.utcnow().timestamp())))
    base_uname = re.sub(r'[^a-z0-9]+', '_', name.lower()).strip('_') or 'client'
    uname = f"{base_uname}_{digits[-4:]}"
    while User.query.filter_by(username=uname).first():
        uname = f"{base_uname}_{digits[-4:]}_{os.urandom(2).hex()}"

    user = User(
        username=uname,
        real_name=name,
        phone=phone or None,
        email=email or f"{uname}@visiteur.3mservices.cm",
        address=address or None,
        city='Yaoundé',
        role='client',
        password_hash=generate_password_hash(os.urandom(12).hex(), method='pbkdf2:sha256'),
        agency_id=getattr(current_user, 'agency_id', None),
    )
    db.session.add(user)
    db.session.commit()
    log_audit('CLIENT_CREATED_FROM_INVOICE', 'User', user.id, f"Client {name} créé depuis Factures")
    bill_to = f"{user.real_name}" + (f" · {user.phone}" if user.phone else '')
    return jsonify({
        'success': True,
        'existing': False,
        'client': {'id': user.id, 'label': bill_to, 'bill_to': bill_to, 'address': user.address or ''},
    })
