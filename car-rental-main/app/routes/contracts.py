"""Gestion des contrats — 3M SERVICES (admin).

Cycle de vie : Brouillon → En attente d'approbation → Actif → Terminé / Résilié / Expiré.
Paiements, documents, renouvellement, archivage et historique complet.
"""
import csv
import io
import os
import re
import time
import uuid
import zipfile
from datetime import datetime, timedelta

from flask import (Blueprint, Response, abort, current_app, flash, jsonify,
                   redirect, render_template, request, send_file, session, url_for)
from flask_login import current_user, login_required
from sqlalchemy import inspect as sa_inspect, or_, text
from sqlalchemy.exc import IntegrityError

from app import db
from app.models import (Apartment, ApartmentBooking, AuditLog, Booking, Bus, Contract,
                        ContractDocument, ContractPayment, SystemNotification, Trip, User)
from app.routes.admin import admin_required, log_audit
from app.utils.security import csrf_protect

contracts_bp = Blueprint('contracts', __name__)

# ── Référentiels ────────────────────────────────────────────────────────
TYPE_LABELS = {
    'vehicle_rental': 'Location de véhicule',
    'apartment_rental': "Location d'appartement",
    'service_agreement': 'Contrat de service',
    'corporate_agreement': 'Contrat entreprise',
    'partnership': 'Partenariat',
}
STATUS_LABELS = {
    'draft': ('Brouillon', 'neutral'),
    'pending_approval': ("En attente d'approbation", 'warn'),
    'active': ('Actif', 'ok'),
    'completed': ('Terminé', 'info'),
    'terminated': ('Résilié', 'danger'),
    'expired': ('Expiré', 'danger'),
}
TRANSITIONS = {
    'draft': {'pending_approval'},
    'pending_approval': {'active', 'draft'},
    'active': {'completed'},            # résiliation : action dédiée (motif obligatoire)
    'expired': {'completed'},
    'completed': set(),
    'terminated': set(),
}
EDITABLE_STATUSES = {'draft', 'pending_approval'}
BLOCKING_STATUSES = ('pending_approval', 'active')   # bloquent l'actif sur la période
RENEWABLE_STATUSES = {'active', 'expired', 'completed'}
ARCHIVABLE_STATUSES = {'draft', 'completed', 'terminated', 'expired'}
APPROVER_ROLES = {'super_admin', 'admin_agence'}

METHOD_LABELS = {
    'cash': 'Espèces', 'mtn_momo': 'MTN Mobile Money', 'orange_money': 'Orange Money',
    'card': 'Carte bancaire', 'bank_transfer': 'Virement bancaire',
}
DOC_TYPE_LABELS = {
    'signed_contract': 'Contrat signé', 'id_document': "Pièce d'identité", 'driving_license': 'Permis de conduire',
    'insurance': 'Assurance', 'proof_of_payment': 'Preuve de paiement', 'inventory': 'État des lieux', 'other': 'Autre',
}
DOC_EXTS = {
    'pdf': 'application/pdf', 'docx': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'jpg': 'image/jpeg', 'jpeg': 'image/jpeg', 'png': 'image/png', 'webp': 'image/webp',
}
DOC_MAX = 50 * 1024 * 1024
CLOSED_TRIP_STATUSES = ('cancelled', 'completed', 'closed', 'returned', 'arrived', 'archived', 'rejected', 'no_show')
EXPIRY_WARNING_DAYS = 7

COMPANY = {
    'name': '3M SERVICES',
    'address': 'Omnisports, face Pharmacie Le Bon Berger, Yaoundé, Cameroun',
    'phone': '+237 691 78 64 47',
    'email': 'contact@3mservice.shop',
}
DEFAULT_TERMS = (
    "1. Le bien est remis en bon état et doit être restitué dans le même état.\n"
    "2. Toute journée (ou nuitée) entamée est due. Les dépassements sont facturés selon le tarif convenu.\n"
    "3. La caution est restituée après l'état des lieux de retour, déduction faite des éventuels dommages.\n"
    "4. Le client respecte la réglementation en vigueur ; les amendes et pénalités restent à sa charge.\n"
    "5. Annulation gratuite jusqu'à 24 h avant le début du contrat."
)


# ── Outils ──────────────────────────────────────────────────────────────
def _scoped(query, model=Contract):
    if model is Contract:   # contrats de démonstration exclus (voir flask test-data)
        query = query.filter(db.or_(Contract.is_test == False, Contract.is_test == None))  # noqa: E711,E712
    if current_user.role == 'super_admin':
        return query
    return query.filter(model.agency_id == current_user.agency_id)


def _get_contract_or_404(contract_id):
    c = _scoped(Contract.query.filter_by(id=contract_id, is_deleted=False)).first()
    if not c:
        abort(404)
    return c


def _money(value, allow_empty=False):
    raw = str(value or '').replace(' ', '').replace(' ', '').replace(',', '.')
    if raw == '':
        return None if allow_empty else 0.0
    try:
        v = float(raw)
    except ValueError:
        return False
    return v if v >= 0 else False


def _parse_dt(value):
    for fmt in ('%Y-%m-%dT%H:%M', '%Y-%m-%d'):
        try:
            return datetime.strptime((value or '').strip(), fmt)
        except ValueError:
            continue
    return None


def _next_reference():
    prefix = f'CTR-{datetime.utcnow().year}-'
    last = Contract.query.filter(Contract.reference.like(prefix + '%')).order_by(Contract.reference.desc()).first()
    seq = int(last.reference.rsplit('-', 1)[1]) + 1 if last else 1
    return f'{prefix}{seq:04d}'


def _docs_dir():
    path = os.path.join(current_app.instance_path, 'contracts')  # hors du dossier public
    os.makedirs(path, exist_ok=True)
    return path


_CONTRACT_EXTRA_COLUMNS = [
    ('apartment_id', 'VARCHAR(50)'),
    ('previous_contract_id', 'INTEGER'),
    ('approved_by_id', 'INTEGER'),
    ('approved_at', 'DATETIME'),
    ('terminated_at', 'DATETIME'),
    ('termination_reason', 'TEXT'),
    ('expiry_notified_at', 'DATETIME'),
    ('is_archived', 'BOOLEAN DEFAULT 0'),
    ('archived_at', 'DATETIME'),
]


def ensure_contract_schema():
    """Crée les tables contrat manquantes et ajoute les colonnes absentes sans perte de données."""
    try:
        db.create_all()
        insp = sa_inspect(db.engine)
        if 'contract' in insp.get_table_names():
            existing = {col['name'] for col in insp.get_columns('contract')}
            for col_name, col_type in _CONTRACT_EXTRA_COLUMNS:
                if col_name not in existing:
                    db.session.execute(text(f'ALTER TABLE contract ADD COLUMN {col_name} {col_type}'))
            db.session.execute(text('UPDATE contract SET is_archived = 0 WHERE is_archived IS NULL'))
            db.session.commit()
    except Exception as exc:
        db.session.rollback()
        current_app.logger.warning(f"Contract schema bootstrap warning: {exc}")


def _verify_csrf_request():
    """Valide le jeton CSRF pour les formulaires multipart POST."""
    import hmac
    sent = request.form.get('csrf_token') or request.headers.get('X-CSRFToken', '')
    expected = session.get('_csrf_token', '')
    if not expected or not hmac.compare_digest(sent, expected):
        abort(400)


def _notify(contract, title, message, kind='info'):
    db.session.add(SystemNotification(
        title=title[:150], message=message, type=kind, category='contract',
        agency_id=contract.agency_id, role_target=None,
    ))


# ── Documents ───────────────────────────────────────────────────────────
def _validate_document(file_storage):
    """Renvoie (octets, extension, erreur)."""
    name = file_storage.filename or ''
    ext = name.rsplit('.', 1)[-1].lower() if '.' in name else ''
    if ext not in DOC_EXTS:
        return None, None, f"« {name} » : formats acceptés PDF, DOCX, JPG, PNG ou WebP."
    data = file_storage.read(DOC_MAX + 1)
    if len(data) > DOC_MAX:
        return None, None, f"« {name} » dépasse 50 Mo."
    if not data:
        return None, None, f"« {name} » est vide."
    ok = {
        'pdf': data.startswith(b'%PDF'),
        'jpg': data.startswith(b'\xff\xd8\xff'), 'jpeg': data.startswith(b'\xff\xd8\xff'),
        'png': data.startswith(b'\x89PNG\r\n\x1a\n'),
        'webp': data[:4] == b'RIFF' and data[8:12] == b'WEBP',
    }.get(ext)
    if ext == 'docx':
        try:
            ok = data.startswith(b'PK') and 'word/document.xml' in zipfile.ZipFile(io.BytesIO(data)).namelist()
        except zipfile.BadZipFile:
            ok = False
    if not ok:
        return None, None, f"« {name} » n'est pas un fichier {ext.upper()} valide."
    return data, ext, None


def _store_documents(contract, files, doc_type):
    """Valide puis enregistre des documents. Renvoie (erreurs, nb_enregistres, chemins_ecrits)."""
    errors, saved, written_paths = [], 0, []
    doc_type = doc_type if doc_type in DOC_TYPE_LABELS else 'other'
    for f in files:
        if not f or not f.filename:
            continue
        data, ext, err = _validate_document(f)
        if err:
            errors.append(err)
            continue
        stored = f"{uuid.uuid4().hex}.{'jpg' if ext == 'jpeg' else ext}"
        full_path = os.path.join(_docs_dir(), stored)
        with open(full_path, 'wb') as out:
            out.write(data)
        written_paths.append(full_path)
        original = re.sub(r'[^\w\-. ()À-ÿ]', '_', os.path.basename(f.filename))[:200] or stored
        db.session.add(ContractDocument(
            contract_id=contract.id, stored_name=stored, original_name=original, mime_type=DOC_EXTS[ext],
            size_bytes=len(data), doc_type=doc_type, uploaded_by_id=current_user.id,
        ))
        saved += 1
    return errors, saved, written_paths


def _cleanup_paths(paths):
    for p in paths or ():
        try:
            if p and os.path.exists(p):
                os.remove(p)
        except OSError:
            pass


def _get_document_or_404(contract, doc_id):
    doc = ContractDocument.query.filter_by(id=doc_id, contract_id=contract.id, is_deleted=False).first()
    if not doc or not re.fullmatch(r'[a-f0-9]{32}\.(pdf|docx|jpg|png|webp)', doc.stored_name):
        abort(404)
    path = os.path.join(_docs_dir(), doc.stored_name)
    if not os.path.exists(path):
        abort(404)
    return doc, path


# ── Disponibilité des actifs ────────────────────────────────────────────
def _asset_conflicts(ctype, vehicle_id, apartment_id, start, end, exclude_id=None, linked_trip_id=None):
    problems = []
    base = Contract.query.filter(
        Contract.is_deleted == False, Contract.status.in_(BLOCKING_STATUSES),  # noqa: E712
        Contract.start_date < end, Contract.end_date > start,
    )
    if exclude_id:
        base = base.filter(Contract.id != exclude_id)
    if ctype == 'vehicle_rental' and vehicle_id:
        for c in base.filter(Contract.vehicle_id == vehicle_id).all():
            problems.append(f"Véhicule déjà engagé par le contrat {c.reference} du {c.start_date:%d/%m/%Y} au {c.end_date:%d/%m/%Y}.")
        tq = Trip.query.filter(
            Trip.bus_id == vehicle_id, Trip.is_deleted == False, ~Trip.status.in_(CLOSED_TRIP_STATUSES),  # noqa: E712
            Trip.departure_time < end, Trip.arrival_time > start,
        )
        if linked_trip_id:
            tq = tq.filter(Trip.id != linked_trip_id)
        for t in tq.all():
            problems.append(f"Véhicule affecté à la mission #{t.id} du {t.departure_time:%d/%m/%Y %H:%M} au {t.arrival_time:%d/%m/%Y %H:%M}.")
    if ctype == 'apartment_rental' and apartment_id:
        for c in base.filter(Contract.apartment_id == apartment_id).all():
            problems.append(f"Appartement déjà engagé par le contrat {c.reference} du {c.start_date:%d/%m/%Y} au {c.end_date:%d/%m/%Y}.")
        for b in ApartmentBooking.query.filter(
            ApartmentBooking.apartment_id == apartment_id, ApartmentBooking.status != 'cancelled',
            ApartmentBooking.check_in < end.date(), ApartmentBooking.check_out > start.date(),
        ).all():
            problems.append(f"Appartement réservé ({b.booking_ref}) du {b.check_in:%d/%m/%Y} au {b.check_out:%d/%m/%Y}.")
    return problems


# ── Échéances : expiration automatique + rappels ───────────────────────
_LAST_EXPIRY_RUN = {'t': 0.0}


def run_contract_expiry_checks(force=False):
    """Passe en « Expiré » les contrats actifs échus et crée les rappels (≤ 1 fois / minute)."""
    if not force and time.time() - _LAST_EXPIRY_RUN['t'] < 60:
        return
    _LAST_EXPIRY_RUN['t'] = time.time()
    now = datetime.utcnow()
    changed = False
    for c in Contract.query.filter_by(status='active', is_deleted=False).all():
        if c.end_date < now:
            c.status = 'expired'
            _notify(c, f'Contrat {c.reference} expiré',
                    f'« {c.subject} » est arrivé à échéance le {c.end_date:%d/%m/%Y}. Clôturez-le ou renouvelez-le.', 'danger')
            db.session.add(AuditLog(action='CONTRACT_STATUS', target_type='Contract', target_id=c.id,
                                    details=f'{c.reference} : Actif → Expiré (échéance automatique)'))
            changed = True
        elif not c.expiry_notified_at and c.end_date - now <= timedelta(days=EXPIRY_WARNING_DAYS):
            days = max(0, (c.end_date - now).days)
            _notify(c, f'Contrat {c.reference} : échéance dans {days} jour(s)',
                    f'« {c.subject} » se termine le {c.end_date:%d/%m/%Y}. Pensez au renouvellement ou au retour du bien.', 'warning')
            c.expiry_notified_at = now
            changed = True
    if changed:
        db.session.commit()


# ── Formulaire ──────────────────────────────────────────────────────────
def _form_options():
    clients = User.query.filter_by(is_deleted=False).order_by(User.real_name, User.username).all()
    vehicles = _scoped(Bus.query.filter_by(is_deleted=False), Bus).order_by(Bus.brand, Bus.model).all()
    apartments = Apartment.query.filter_by(is_deleted=False).order_by(Apartment.title).all()
    trip_query = Trip.query.filter(Trip.is_deleted == False, ~Trip.status.in_(CLOSED_TRIP_STATUSES))  # noqa: E712
    if current_user.role != 'super_admin' and current_user.agency_id:
        agency_bus_ids = [v.id for v in vehicles]
        trip_query = trip_query.filter(Trip.bus_id.in_(agency_bus_ids)) if agency_bus_ids else trip_query.filter(False)
    trips = trip_query.order_by(Trip.departure_time.desc()).limit(80).all()
    booking_query = Booking.query.filter_by(is_deleted=False)
    if current_user.role != 'super_admin' and current_user.agency_id:
        agency_trip_ids = [t.id for t in trips]
        booking_query = booking_query.filter(Booking.trip_id.in_(agency_trip_ids)) if agency_trip_ids else booking_query.filter(False)
    bookings = booking_query.order_by(Booking.booking_date.desc()).limit(80).all()
    return dict(clients=clients, vehicles=vehicles, apartments=apartments, trips=trips, bookings=bookings,
                type_labels=TYPE_LABELS, doc_type_labels=DOC_TYPE_LABELS, default_terms=DEFAULT_TERMS)


def _resolve_client(form, errors):
    if form.get('client_mode') == 'new':
        name = (form.get('new_client_name') or '').strip()
        phone = (form.get('new_client_phone') or '').strip()
        email = (form.get('new_client_email') or '').strip().lower()
        if not name or len(re.sub(r'\D', '', phone)) < 8:
            errors.append('Nouveau client : nom et téléphone valides obligatoires.')
            return None
        if email and not re.fullmatch(r'[^@\s]+@[^@\s]+\.[^@\s]+', email):
            errors.append('Nouveau client : adresse e-mail invalide.')
            return None
        digits = re.sub(r'\D', '', phone)[-9:]
        for u in User.query.filter_by(is_deleted=False).all():
            if (email and (u.email or '').lower() == email) or (u.phone and re.sub(r'\D', '', u.phone).endswith(digits)):
                flash(f"Client existant retrouvé ({u.real_name or u.username}) : il a été utilisé au lieu de créer un doublon.", 'info')
                return u
        base = re.sub(r'[^a-z0-9]', '', name.lower())[:16] or 'client'
        username, n = base, 1
        while User.query.filter_by(username=username).first():
            n += 1
            username = f'{base}{n}'
        from werkzeug.security import generate_password_hash
        user = User(username=username, real_name=name, phone=phone,
                    email=email or f'{username}@clients.3mservice.local', role='client',
                    password_hash=generate_password_hash(uuid.uuid4().hex, method='pbkdf2:sha256'))
        db.session.add(user)
        db.session.flush()
        log_audit('CLIENT_CREATED', 'User', user.id, f'Client créé depuis un contrat : {name}')
        return user
    client = User.query.filter_by(id=form.get('client_id', type=int), is_deleted=False).first()
    if not client:
        errors.append('Sélectionnez un client.')
    return client


def _apply_form(contract, form, is_new):
    errors = []
    subject = (form.get('subject') or '').strip()
    ctype = form.get('contract_type')
    start, end = _parse_dt(form.get('start_date')), _parse_dt(form.get('end_date'))
    daily_rate = _money(form.get('daily_rate'))
    extra = _money(form.get('extra_charges'))
    deposit = _money(form.get('deposit'))
    total = _money(form.get('total_value'), allow_empty=True)

    if not subject:
        errors.append("L'objet du contrat est obligatoire.")
    if ctype not in TYPE_LABELS:
        errors.append('Type de contrat invalide.')
    if not start or not end:
        errors.append('Les dates de début et de fin sont obligatoires.')
    elif end <= start:
        errors.append('La date de fin doit être postérieure à la date de début.')
    for label, v in (('Tarif unitaire', daily_rate), ('Frais supplémentaires', extra), ('Caution', deposit), ('Valeur du contrat', total)):
        if v is False:
            errors.append(f'{label} : montant invalide.')

    vehicle = apartment = None
    if ctype == 'vehicle_rental':
        vid = form.get('vehicle_id', type=int)
        vehicle = _scoped(Bus.query.filter_by(id=vid, is_deleted=False), Bus).first() if vid else None
        if not vehicle:
            errors.append('Sélectionnez un véhicule pour une location de véhicule.')
        elif vehicle.status == 'maintenance':
            errors.append(f'Le véhicule {vehicle.bus_number} est en maintenance : il ne peut pas être loué.')
    elif ctype == 'apartment_rental':
        aid = form.get('apartment_id')
        apartment = Apartment.query.filter_by(id=aid, is_deleted=False).first() if aid else None
        if not apartment:
            errors.append("Sélectionnez un appartement pour une location d'appartement.")
        elif (apartment.status or '').lower() in ('maintenance', 'non publié'):
            errors.append(f"L'appartement « {apartment.title} » est indisponible ({apartment.status}).")

    trip_id = form.get('trip_id', type=int) if ctype == 'vehicle_rental' else None
    if trip_id and not Trip.query.filter_by(id=trip_id, is_deleted=False).first():
        errors.append('Mission VIP introuvable.')
    booking_id = form.get('booking_id', type=int) or None
    if booking_id and not Booking.query.filter_by(id=booking_id, is_deleted=False).first():
        errors.append('Réservation introuvable.')

    client = _resolve_client(form, errors)

    if start and end and end > start and (vehicle or apartment):
        errors += _asset_conflicts(ctype, vehicle.id if vehicle else None, apartment.id if apartment else None,
                                   start, end, exclude_id=None if is_new else contract.id, linked_trip_id=trip_id)

    if not errors:
        days = max(1, int(-(-(end - start).total_seconds() // 86400)))
        computed = round((daily_rate or 0) * days + (extra or 0), 2)
        value = total if total not in (None, False) and total > 0 else computed
        if value <= 0:
            errors.append('Indiquez la valeur du contrat (ou un tarif unitaire).')
        elif not is_new and value < contract.amount_paid:
            errors.append(f"La valeur ne peut pas être inférieure au montant déjà encaissé ({contract.amount_paid:,.0f} FCFA).".replace(',', ' '))

    if errors:
        return errors

    contract.subject = subject[:150]
    contract.contract_type = ctype
    contract.client_id = client.id
    contract.vehicle_id = vehicle.id if vehicle else None
    contract.apartment_id = apartment.id if apartment else None
    contract.trip_id = trip_id
    contract.booking_id = booking_id
    contract.start_date, contract.end_date = start, end
    contract.pickup_location = (form.get('pickup_location') or '').strip()[:200]
    contract.return_location = (form.get('return_location') or '').strip()[:200]
    contract.daily_rate, contract.extra_charges, contract.deposit = daily_rate or 0, extra or 0, deposit or 0
    contract.total_value = value
    contract.payment_terms = (form.get('payment_terms') or '').strip()
    contract.terms = (form.get('terms') or '').strip()
    contract.notes = (form.get('notes') or '').strip()
    if is_new:
        contract.agency_id = (vehicle.agency_id if vehicle else None) or current_user.agency_id
        contract.created_by_id = current_user.id
        contract.status = 'draft'
    return []


# ── Liste ───────────────────────────────────────────────────────────────
def _filtered_query():
    q = _scoped(Contract.query.filter_by(is_deleted=False))
    q = q.filter(Contract.is_archived == (request.args.get('archived') == '1'))
    term = (request.args.get('q') or '').strip()
    if term:
        like = f'%{term}%'
        q = (q.outerjoin(User, Contract.client_id == User.id)
              .outerjoin(Bus, Contract.vehicle_id == Bus.id)
              .outerjoin(Apartment, Contract.apartment_id == Apartment.id)
              .filter(or_(Contract.reference.ilike(like), Contract.subject.ilike(like),
                          User.real_name.ilike(like), User.username.ilike(like), User.phone.ilike(like),
                          Bus.bus_number.ilike(like), Bus.model.ilike(like), Apartment.title.ilike(like))))
    status = request.args.get('status')
    if status in STATUS_LABELS:
        q = q.filter(Contract.status == status)
    ctype = request.args.get('type')
    if ctype in TYPE_LABELS:
        q = q.filter(Contract.contract_type == ctype)
    if request.args.get('due') == '1':
        q = q.filter(Contract.status == 'active', Contract.end_date <= datetime.utcnow() + timedelta(days=EXPIRY_WARNING_DAYS))
    d_from = _parse_dt(request.args.get('date_from'))
    if d_from:
        q = q.filter(Contract.end_date >= d_from)
    d_to = _parse_dt(request.args.get('date_to'))
    if d_to:
        q = q.filter(Contract.start_date < d_to + timedelta(days=1))
    return q.order_by(Contract.created_at.desc())


@contracts_bp.route('/admin/contracts')
@login_required
@admin_required
def index():
    run_contract_expiry_checks()
    page = max(1, request.args.get('page', 1, type=int) or 1)
    per_page = 12
    filtered_q = _filtered_query()
    total_filtered = filtered_q.count()
    total_pages = max(1, (total_filtered + per_page - 1) // per_page)
    if page > total_pages:
        page = total_pages
    contracts = filtered_q.offset((page - 1) * per_page).limit(per_page).all()

    base = _scoped(Contract.query.filter_by(is_deleted=False, is_archived=False))
    counts = {s: base.filter(Contract.status == s).count() for s in STATUS_LABELS}
    active = base.filter(Contract.status == 'active').all()
    totals = {
        'all': base.count(),
        'archived': _scoped(Contract.query.filter_by(is_deleted=False, is_archived=True)).count(),
        'active_value': sum(c.total_value or 0 for c in active),
        'outstanding': sum(c.balance for c in base.filter(Contract.status.in_(('active', 'expired', 'completed'))).all()),
        'due_soon': sum(1 for c in active if c.end_date <= datetime.utcnow() + timedelta(days=EXPIRY_WARNING_DAYS)),
    }
    return render_template('admin/contracts_list.html', contracts=contracts, counts=counts, totals=totals,
                           status_labels=STATUS_LABELS, type_labels=TYPE_LABELS,
                           view='list' if request.args.get('view') == 'list' else 'grid',
                           q=request.args.get('q', ''), sel_status=request.args.get('status', ''),
                           sel_type=request.args.get('type', ''), archived=request.args.get('archived') == '1',
                           due=request.args.get('due') == '1',
                           date_from=request.args.get('date_from', ''), date_to=request.args.get('date_to', ''),
                           page=page, total_pages=total_pages, total_filtered=total_filtered)


@contracts_bp.route('/admin/contracts/api/availability')
@login_required
@admin_required
def api_availability():
    ctype = request.args.get('contract_type', 'vehicle_rental')
    vehicle_id = request.args.get('vehicle_id', type=int)
    apartment_id = (request.args.get('apartment_id') or '').strip()
    exclude_id = request.args.get('exclude_id', type=int)
    trip_id = request.args.get('trip_id', type=int)
    start = _parse_dt(request.args.get('start_date'))
    end = _parse_dt(request.args.get('end_date'))

    if not start or not end:
        return jsonify({'ok': False, 'available': True, 'conflicts': [], 'days': 0, 'suggested_rate': None,
                        'message': 'Renseignez les dates de début et de fin.'})
    if end <= start:
        return jsonify({'ok': False, 'available': False, 'days': 0, 'suggested_rate': None,
                        'conflicts': ['La date de fin doit être postérieure à la date de début.']})

    days = max(1, int(-(-(end - start).total_seconds() // 86400)))
    conflicts = []
    suggested_rate = None

    if ctype == 'vehicle_rental' and vehicle_id:
        v = _scoped(Bus.query.filter_by(id=vehicle_id, is_deleted=False), Bus).first()
        if not v:
            conflicts.append('Véhicule introuvable ou hors de votre agence.')
        else:
            if v.status == 'maintenance':
                conflicts.append(f'Le véhicule {v.bus_number} est en maintenance.')
            suggested_rate = v.promo_price if (v.is_promo and v.promo_price) else v.regular_price
            conflicts.extend(_asset_conflicts(ctype, v.id, None, start, end, exclude_id=exclude_id, linked_trip_id=trip_id))
    elif ctype == 'apartment_rental' and apartment_id:
        a = Apartment.query.filter_by(id=apartment_id, is_deleted=False).first()
        if not a:
            conflicts.append('Appartement introuvable.')
        else:
            if (a.status or '').lower() in ('maintenance', 'non publié'):
                conflicts.append(f"L'appartement « {a.title} » est indisponible ({a.status}).")
            suggested_rate = a.price_per_night
            conflicts.extend(_asset_conflicts(ctype, None, a.id, start, end, exclude_id=exclude_id))

    return jsonify({'ok': True, 'available': len(conflicts) == 0, 'conflicts': conflicts,
                    'days': days, 'suggested_rate': suggested_rate})


@contracts_bp.route('/admin/contracts/export.csv')
@login_required
@admin_required
def export_csv():
    out = io.StringIO()
    w = csv.writer(out, delimiter=';')
    w.writerow(['Référence', 'Objet', 'Type', 'Statut', 'Client', 'Téléphone', 'Actif', 'Début', 'Fin',
                'Valeur (FCFA)', 'Encaissé (FCFA)', 'Reste à payer (FCFA)', 'Caution (FCFA)', 'Renouvelle'])
    for c in _filtered_query().all():
        asset = (f'{c.vehicle.brand or ""} {c.vehicle.model} ({c.vehicle.bus_number})'.strip() if c.vehicle
                 else (c.apartment.title if c.apartment else ''))
        w.writerow([c.reference, c.subject, TYPE_LABELS.get(c.contract_type, c.contract_type), STATUS_LABELS.get(c.status, (c.status,))[0],
                    (c.client.real_name or c.client.username) if c.client else '', c.client.phone if c.client else '', asset,
                    c.start_date.strftime('%d/%m/%Y'), c.end_date.strftime('%d/%m/%Y'),
                    int(c.total_value or 0), int(c.amount_paid), int(c.balance), int(c.deposit or 0),
                    c.previous_contract.reference if c.previous_contract else ''])
    log_audit('CONTRACTS_EXPORTED', 'Contract', None, 'Export CSV des contrats')
    return Response('﻿' + out.getvalue(), mimetype='text/csv; charset=utf-8',
                    headers={'Content-Disposition': f'attachment; filename=contrats_{datetime.utcnow():%Y%m%d}.csv'})


# ── Création / modification ─────────────────────────────────────────────
@contracts_bp.route('/admin/contracts/new', methods=['GET', 'POST'])
@login_required
@admin_required
def create():
    contract = Contract()
    if request.method == 'POST':
        _verify_csrf_request()
        errors = _apply_form(contract, request.form, is_new=True)
        written_paths = []
        if not errors:
            for _attempt in range(3):
                contract.reference = _next_reference()
                db.session.add(contract)
                try:
                    db.session.flush()
                    break
                except IntegrityError:
                    db.session.rollback()
            else:
                errors.append('Impossible de générer une référence unique, réessayez.')
        if not errors:
            doc_errors, saved, written_paths = _store_documents(contract, request.files.getlist('documents'), request.form.get('doc_type'))
            if doc_errors:
                errors += doc_errors
        if not errors:
            db.session.commit()
            log_audit('CONTRACT_CREATED', 'Contract', contract.id,
                      f'{contract.reference} créé — {contract.subject}' + (f' · {saved} document(s)' if saved else ''))
            if request.form.get('submit_mode') == 'submit':
                return _transition(contract, 'pending_approval')
            flash(f'Contrat {contract.reference} enregistré en brouillon.', 'success')
            return redirect(url_for('contracts.detail', contract_id=contract.id))
        db.session.rollback()
        _cleanup_paths(written_paths)
        for e in errors:
            flash(e, 'danger')
    return render_template('admin/contracts_form.html', contract=contract, form=request.form, is_new=True, **_form_options())


@contracts_bp.route('/admin/contracts/<int:contract_id>/edit', methods=['GET', 'POST'])
@login_required
@admin_required
def edit(contract_id):
    contract = _get_contract_or_404(contract_id)
    if contract.status not in EDITABLE_STATUSES or contract.is_archived:
        flash("Seuls les contrats en brouillon ou en attente d'approbation sont modifiables.", 'warning')
        return redirect(url_for('contracts.detail', contract_id=contract.id))
    if request.method == 'POST':
        _verify_csrf_request()
        errors = _apply_form(contract, request.form, is_new=False)
        written_paths = []
        if not errors:
            doc_errors, saved, written_paths = _store_documents(contract, request.files.getlist('documents'), request.form.get('doc_type'))
            errors += doc_errors
        if not errors:
            db.session.commit()
            log_audit('CONTRACT_UPDATED', 'Contract', contract.id, f'{contract.reference} modifié')
            flash('Contrat mis à jour.', 'success')
            return redirect(url_for('contracts.detail', contract_id=contract.id))
        db.session.rollback()
        _cleanup_paths(written_paths)
        for e in errors:
            flash(e, 'danger')
    return render_template('admin/contracts_form.html', contract=contract, form=request.form, is_new=False, **_form_options())


# ── Détail ──────────────────────────────────────────────────────────────
@contracts_bp.route('/admin/contracts/<int:contract_id>')
@login_required
@admin_required
def detail(contract_id):
    run_contract_expiry_checks()
    contract = _get_contract_or_404(contract_id)
    tab = request.args.get('tab', 'overview')
    if tab not in ('overview', 'client', 'assets', 'documents', 'payments', 'history'):
        tab = 'overview'
    history = AuditLog.query.filter_by(target_type='Contract', target_id=contract.id).order_by(AuditLog.created_at.desc()).all()
    documents = contract.documents.filter_by(is_deleted=False).all()
    payments = contract.payments.all()
    client_contracts = (Contract.query.filter(Contract.client_id == contract.client_id, Contract.is_deleted == False,  # noqa: E712
                                              Contract.id != contract.id).order_by(Contract.start_date.desc()).limit(10).all())
    asset_conflicts = []
    available_vehicles = []
    available_apartments = []
    if tab == 'assets':
        asset_conflicts = _asset_conflicts(
            contract.contract_type, contract.vehicle_id, contract.apartment_id,
            contract.start_date, contract.end_date, exclude_id=contract.id, linked_trip_id=contract.trip_id,
        )
        if contract.contract_type == 'vehicle_rental':
            available_vehicles = _scoped(Bus.query.filter_by(is_deleted=False), Bus).order_by(Bus.brand, Bus.model).all()
        elif contract.contract_type == 'apartment_rental':
            available_apartments = Apartment.query.filter_by(is_deleted=False).order_by(Apartment.title).all()

    return render_template(
        'admin/contracts_detail.html', c=contract, tab=tab, history=history, documents=documents, payments=payments,
        client_contracts=client_contracts, status_labels=STATUS_LABELS, type_labels=TYPE_LABELS,
        method_labels=METHOD_LABELS, doc_type_labels=DOC_TYPE_LABELS, transitions=TRANSITIONS,
        asset_conflicts=asset_conflicts, available_vehicles=available_vehicles, available_apartments=available_apartments,
        editable=contract.status in EDITABLE_STATUSES and not contract.is_archived,
        can_renew=contract.status in RENEWABLE_STATUSES, can_archive=contract.status in ARCHIVABLE_STATUSES,
        can_terminate=contract.status in ('active', 'expired', 'pending_approval'),
        can_pay=contract.status not in ('draft', 'terminated') and not contract.is_archived,
        today=datetime.utcnow().strftime('%Y-%m-%d'),
    )


@contracts_bp.route('/admin/contracts/<int:contract_id>/assign-asset', methods=['POST'])
@login_required
@admin_required
@csrf_protect
def assign_asset(contract_id):
    contract = _get_contract_or_404(contract_id)
    back = redirect(url_for('contracts.detail', contract_id=contract.id, tab='assets'))
    if contract.status not in EDITABLE_STATUSES or contract.is_archived:
        flash("L'actif ne peut être modifié que sur un contrat brouillon ou en attente.", 'danger')
        return back
    if contract.contract_type not in ('vehicle_rental', 'apartment_rental'):
        flash("Ce type de contrat n'accepte pas de véhicule ni d'appartement.", 'warning')
        return back

    if contract.contract_type == 'vehicle_rental':
        vid = request.form.get('vehicle_id', type=int)
        vehicle = _scoped(Bus.query.filter_by(id=vid, is_deleted=False), Bus).first() if vid else None
        if not vehicle:
            flash('Sélectionnez un véhicule valide.', 'danger')
            return back
        if vehicle.status == 'maintenance':
            flash(f'Le véhicule {vehicle.bus_number} est en maintenance.', 'danger')
            return back
        conflicts = _asset_conflicts('vehicle_rental', vehicle.id, None, contract.start_date, contract.end_date,
                                     exclude_id=contract.id, linked_trip_id=contract.trip_id)
        if conflicts:
            for p in conflicts:
                flash(p, 'danger')
            return back
        contract.vehicle_id = vehicle.id
        contract.apartment_id = None
        label = f"{vehicle.brand or ''} {vehicle.model} ({vehicle.bus_number})".strip()
    else:
        aid = (request.form.get('apartment_id') or '').strip()
        apt = Apartment.query.filter_by(id=aid, is_deleted=False).first() if aid else None
        if not apt:
            flash('Sélectionnez un appartement valide.', 'danger')
            return back
        if (apt.status or '').lower() in ('maintenance', 'non publié'):
            flash(f"L'appartement « {apt.title} » est indisponible ({apt.status}).", 'danger')
            return back
        conflicts = _asset_conflicts('apartment_rental', None, apt.id, contract.start_date, contract.end_date, exclude_id=contract.id)
        if conflicts:
            for p in conflicts:
                flash(p, 'danger')
            return back
        contract.apartment_id = apt.id
        contract.vehicle_id = None
        label = apt.title

    db.session.commit()
    log_audit('CONTRACT_ASSET_ASSIGNED', 'Contract', contract.id, f'{contract.reference} : actif affecté → {label}')
    flash(f'Actif affecté : {label}.', 'success')
    return back


# ── Cycle de vie ────────────────────────────────────────────────────────
def _transition(contract, target):
    if target not in TRANSITIONS.get(contract.status, set()):
        flash('Changement de statut non autorisé.', 'danger')
        return redirect(url_for('contracts.detail', contract_id=contract.id))
    if target == 'active':
        if current_user.role not in APPROVER_ROLES:
            flash("Vous n'avez pas le droit d'approuver un contrat.", 'danger')
            return redirect(url_for('contracts.detail', contract_id=contract.id))
        if not contract.documents.filter_by(is_deleted=False).count():
            flash("Ajoutez au moins un document (contrat signé, pièce d'identité…) avant l'activation.", 'danger')
            return redirect(url_for('contracts.detail', contract_id=contract.id, tab='documents'))
        problems = _asset_conflicts(contract.contract_type, contract.vehicle_id, contract.apartment_id,
                                    contract.start_date, contract.end_date, exclude_id=contract.id, linked_trip_id=contract.trip_id)
        if contract.vehicle and contract.vehicle.status == 'maintenance':
            problems.append(f'Le véhicule {contract.vehicle.bus_number} est en maintenance.')
        if problems:
            for p in problems:
                flash(p, 'danger')
            return redirect(url_for('contracts.detail', contract_id=contract.id, tab='assets'))
        contract.approved_by_id = current_user.id
        contract.approved_at = contract.signed_at = datetime.utcnow()
        contract.expiry_notified_at = None
    previous = contract.status
    contract.status = target
    if target == 'pending_approval':
        _notify(contract, f'Contrat {contract.reference} à approuver',
                f'« {contract.subject} » attend une approbation ({contract.client.real_name or contract.client.username}).', 'info')
    elif target == 'active':
        _notify(contract, f'Contrat {contract.reference} activé',
                f'« {contract.subject} » est désormais actif jusqu\'au {contract.end_date:%d/%m/%Y}.', 'success')
    db.session.commit()
    log_audit('CONTRACT_STATUS', 'Contract', contract.id,
              f'{contract.reference} : {STATUS_LABELS[previous][0]} → {STATUS_LABELS[target][0]}')
    flash(f'Statut : {STATUS_LABELS[target][0]}.', 'success')
    return redirect(url_for('contracts.detail', contract_id=contract.id))


@contracts_bp.route('/admin/contracts/<int:contract_id>/status', methods=['POST'])
@login_required
@admin_required
@csrf_protect
def change_status(contract_id):
    return _transition(_get_contract_or_404(contract_id), request.form.get('status'))


@contracts_bp.route('/admin/contracts/<int:contract_id>/terminate', methods=['POST'])
@login_required
@admin_required
@csrf_protect
def terminate(contract_id):
    contract = _get_contract_or_404(contract_id)
    reason = (request.form.get('reason') or '').strip()
    if contract.status not in ('active', 'expired', 'pending_approval'):
        flash('Ce contrat ne peut pas être résilié.', 'danger')
    elif len(reason) < 5:
        flash('Indiquez le motif de la résiliation (5 caractères minimum).', 'danger')
    else:
        previous = contract.status
        contract.status = 'terminated'
        contract.terminated_at = contract.cancelled_at = datetime.utcnow()
        contract.termination_reason = reason[:1000]
        _notify(contract, f'Contrat {contract.reference} résilié', f'« {contract.subject} » — motif : {reason[:200]}', 'warning')
        db.session.commit()
        log_audit('CONTRACT_TERMINATED', 'Contract', contract.id,
                  f'{contract.reference} : {STATUS_LABELS[previous][0]} → Résilié · motif : {reason[:200]}')
        flash('Contrat résilié.', 'success')
    return redirect(url_for('contracts.detail', contract_id=contract.id))


@contracts_bp.route('/admin/contracts/<int:contract_id>/renew', methods=['POST'])
@login_required
@admin_required
@csrf_protect
def renew(contract_id):
    old = _get_contract_or_404(contract_id)
    if old.status not in RENEWABLE_STATUSES:
        flash('Ce contrat ne peut pas être renouvelé.', 'danger')
        return redirect(url_for('contracts.detail', contract_id=old.id))
    duration = old.end_date - old.start_date
    new = Contract(
        subject=old.subject, contract_type=old.contract_type, status='draft', client_id=old.client_id,
        vehicle_id=old.vehicle_id, apartment_id=old.apartment_id, agency_id=old.agency_id,
        start_date=old.end_date, end_date=old.end_date + duration,
        pickup_location=old.pickup_location, return_location=old.return_location,
        daily_rate=old.daily_rate, extra_charges=old.extra_charges, deposit=old.deposit,
        total_value=old.total_value, payment_terms=old.payment_terms, terms=old.terms,
        notes=f'Renouvellement de {old.reference}.', previous_contract_id=old.id, created_by_id=current_user.id,
    )
    for _attempt in range(3):
        new.reference = _next_reference()
        db.session.add(new)
        try:
            db.session.commit()
            break
        except IntegrityError:
            db.session.rollback()
    log_audit('CONTRACT_RENEWED', 'Contract', old.id, f'{old.reference} renouvelé par {new.reference}')
    log_audit('CONTRACT_CREATED', 'Contract', new.id, f'{new.reference} créé — renouvellement de {old.reference}')
    flash(f'Renouvellement {new.reference} créé en brouillon : vérifiez les dates et le montant.', 'success')
    return redirect(url_for('contracts.edit', contract_id=new.id))


@contracts_bp.route('/admin/contracts/<int:contract_id>/archive', methods=['POST'])
@login_required
@admin_required
@csrf_protect
def archive(contract_id):
    contract = _get_contract_or_404(contract_id)
    if request.form.get('restore') == '1':
        contract.is_archived, contract.archived_at = False, None
        msg, action = 'Contrat restauré.', 'CONTRACT_RESTORED'
    elif contract.status not in ARCHIVABLE_STATUSES:
        flash('Seuls les contrats brouillon, terminés, résiliés ou expirés peuvent être archivés.', 'danger')
        return redirect(url_for('contracts.detail', contract_id=contract.id))
    else:
        contract.is_archived, contract.archived_at = True, datetime.utcnow()
        msg, action = 'Contrat archivé (conservé dans l\'historique).', 'CONTRACT_ARCHIVED'
    db.session.commit()
    log_audit(action, 'Contract', contract.id, f'{contract.reference} : {msg}')
    flash(msg, 'success')
    return redirect(url_for('contracts.detail', contract_id=contract.id))


# ── Paiements ───────────────────────────────────────────────────────────
@contracts_bp.route('/admin/contracts/<int:contract_id>/payments', methods=['POST'])
@login_required
@admin_required
@csrf_protect
def add_payment(contract_id):
    contract = _get_contract_or_404(contract_id)
    back = redirect(url_for('contracts.detail', contract_id=contract.id, tab='payments'))
    if contract.status in ('draft', 'terminated') or contract.is_archived:
        flash("Les paiements s'enregistrent sur un contrat soumis, actif, expiré ou terminé.", 'danger')
        return back
    amount = _money(request.form.get('amount'))
    method = request.form.get('method')
    is_deposit = request.form.get('is_deposit') == '1'
    paid_at = _parse_dt(request.form.get('paid_at')) or datetime.utcnow()
    errors = []
    if not amount:
        errors.append('Montant invalide.')
    if method not in METHOD_LABELS:
        errors.append('Mode de paiement invalide.')
    if paid_at > datetime.utcnow() + timedelta(days=1):
        errors.append('La date de paiement ne peut pas être dans le futur.')
    if amount and not is_deposit and amount > contract.balance + 0.5:
        errors.append(f'Le montant dépasse le reste à payer ({contract.balance:,.0f} FCFA).'.replace(',', ' '))
    if amount and is_deposit and contract.deposit and contract.deposit_received + amount > contract.deposit + 0.5:
        errors.append(f'La caution prévue est de {contract.deposit:,.0f} FCFA.'.replace(',', ' '))
    if errors:
        for e in errors:
            flash(e, 'danger')
        return back
    p = ContractPayment(contract_id=contract.id, amount=amount, method=method, is_deposit=is_deposit, paid_at=paid_at,
                        reference=(request.form.get('reference') or '').strip()[:80],
                        note=(request.form.get('note') or '').strip()[:255], recorded_by_id=current_user.id)
    db.session.add(p)
    db.session.flush()
    kind = 'Caution' if is_deposit else 'Paiement'
    msg_paid = f'{kind} de {amount:,.0f} FCFA ({METHOD_LABELS[method]}) · reste {contract.balance:,.0f} FCFA'.replace(',', ' ')
    _notify(contract, f'{kind} reçu · {contract.reference}',
            msg_paid if (is_deposit or contract.balance > 0) else f'{msg_paid} — Contrat intégralement soldé.',
            'success' if contract.balance == 0 else 'info')
    db.session.commit()
    log_audit('CONTRACT_PAYMENT', 'Contract', contract.id, msg_paid)
    flash(f'{kind} enregistré. Reste à payer : {contract.balance:,.0f} FCFA.'.replace(',', ' '), 'success')
    return back


@contracts_bp.route('/admin/contracts/<int:contract_id>/payments/<int:payment_id>/void', methods=['POST'])
@login_required
@admin_required
@csrf_protect
def void_payment(contract_id, payment_id):
    contract = _get_contract_or_404(contract_id)
    p = ContractPayment.query.filter_by(id=payment_id, contract_id=contract.id, is_void=False).first_or_404()
    reason = (request.form.get('reason') or '').strip()
    if len(reason) < 3:
        flash("Indiquez le motif de l'annulation du paiement.", 'danger')
    else:
        p.is_void, p.voided_at, p.void_reason = True, datetime.utcnow(), reason[:255]
        db.session.commit()
        log_audit('CONTRACT_PAYMENT_VOID', 'Contract', contract.id,
                  f'Paiement de {p.amount:,.0f} FCFA annulé · motif : {reason[:120]}'.replace(',', ' '))
        flash('Paiement annulé (conservé dans l’historique).', 'success')
    return redirect(url_for('contracts.detail', contract_id=contract.id, tab='payments'))


# ── Documents ───────────────────────────────────────────────────────────
@contracts_bp.route('/admin/contracts/<int:contract_id>/documents', methods=['POST'])
@login_required
@admin_required
@csrf_protect
def upload_documents(contract_id):
    contract = _get_contract_or_404(contract_id)
    errors, saved, written_paths = _store_documents(contract, request.files.getlist('documents'), request.form.get('doc_type'))
    if saved and not errors:
        db.session.commit()
        log_audit('CONTRACT_DOCUMENT', 'Contract', contract.id,
                  f'{saved} document(s) ajouté(s) : {DOC_TYPE_LABELS.get(request.form.get("doc_type"), "Autre")}')
        flash(f'{saved} document(s) ajouté(s).', 'success')
    else:
        db.session.rollback()
        _cleanup_paths(written_paths)
    for e in errors:
        flash(e, 'danger')
    if not saved and not errors:
        flash('Aucun fichier sélectionné.', 'warning')
    return redirect(url_for('contracts.detail', contract_id=contract.id, tab='documents'))


@contracts_bp.route('/admin/contracts/<int:contract_id>/documents/<int:doc_id>/<any(preview, download):mode>')
@login_required
@admin_required
def document_file(contract_id, doc_id, mode):
    contract = _get_contract_or_404(contract_id)
    doc, path = _get_document_or_404(contract, doc_id)
    inline = mode == 'preview' and doc.mime_type in ('application/pdf', 'image/jpeg', 'image/png', 'image/webp')
    resp = send_file(path, mimetype=doc.mime_type, as_attachment=not inline, download_name=doc.original_name)
    resp.headers['X-Content-Type-Options'] = 'nosniff'      # type vérifié à l'envoi (octets réels), pas de SVG
    resp.headers['Cache-Control'] = 'private, no-store'
    return resp


@contracts_bp.route('/admin/contracts/<int:contract_id>/documents/<int:doc_id>/delete', methods=['POST'])
@login_required
@admin_required
@csrf_protect
def delete_document(contract_id, doc_id):
    contract = _get_contract_or_404(contract_id)
    doc = ContractDocument.query.filter_by(id=doc_id, contract_id=contract.id, is_deleted=False).first_or_404()
    if contract.status not in EDITABLE_STATUSES and current_user.role != 'super_admin':
        flash("Les documents d'un contrat actif ou clos ne peuvent être retirés que par le super admin.", 'danger')
    else:
        doc.is_deleted = True   # fichier conservé sur disque (traçabilité)
        db.session.commit()
        log_audit('CONTRACT_DOCUMENT_REMOVED', 'Contract', contract.id, f'Document retiré : {doc.original_name}')
        flash('Document retiré.', 'success')
    return redirect(url_for('contracts.detail', contract_id=contract.id, tab='documents'))


# ── PDF ─────────────────────────────────────────────────────────────────
@contracts_bp.route('/admin/contracts/<int:contract_id>/pdf')
@login_required
@admin_required
def pdf(contract_id):
    from reportlab.lib import colors
    from reportlab.lib.pagesizes import A4
    from reportlab.lib.styles import ParagraphStyle, getSampleStyleSheet
    from reportlab.lib.units import mm
    from reportlab.platypus import Paragraph, SimpleDocTemplate, Spacer, Table, TableStyle

    c = _get_contract_or_404(contract_id)
    buf = io.BytesIO()
    doc = SimpleDocTemplate(buf, pagesize=A4, leftMargin=18 * mm, rightMargin=18 * mm, topMargin=16 * mm, bottomMargin=16 * mm,
                            title=f'Contrat {c.reference}', author=COMPANY['name'])
    ss = getSampleStyleSheet()
    red = colors.HexColor('#C92A2A')
    h1 = ParagraphStyle('h1', parent=ss['Title'], fontSize=17, textColor=colors.HexColor('#101828'), spaceAfter=2)
    h2 = ParagraphStyle('h2', parent=ss['Heading3'], fontSize=11, textColor=red, spaceBefore=10, spaceAfter=4)
    body = ParagraphStyle('b', parent=ss['BodyText'], fontSize=9.5, leading=13)
    small = ParagraphStyle('s', parent=body, fontSize=8.5, textColor=colors.HexColor('#667085'))
    fmt = lambda v: f"{int(round(v or 0)):,}".replace(',', ' ') + ' FCFA'  # noqa: E731
    esc = lambda s: (s or '—').replace('&', '&amp;').replace('<', '&lt;').replace('>', '&gt;').replace('\n', '<br/>')  # noqa: E731

    def grid(rows, widths=(45 * mm, 129 * mm)):
        t = Table(rows, colWidths=list(widths))
        t.setStyle(TableStyle([
            ('FONTSIZE', (0, 0), (-1, -1), 9), ('VALIGN', (0, 0), (-1, -1), 'TOP'),
            ('TEXTCOLOR', (0, 0), (0, -1), colors.HexColor('#667085')),
            ('LINEBELOW', (0, 0), (-1, -1), 0.3, colors.HexColor('#EAECF0')),
            ('BOTTOMPADDING', (0, 0), (-1, -1), 5), ('TOPPADDING', (0, 0), (-1, -1), 5),
        ]))
        return t

    cl = c.client
    story = [
        Paragraph(f"<b>{COMPANY['name']}</b>", ParagraphStyle('brand', parent=body, fontSize=13, textColor=red)),
        Paragraph(f"{COMPANY['address']} · {COMPANY['phone']} · {COMPANY['email']}", small),
        Spacer(1, 8),
        Paragraph(TYPE_LABELS.get(c.contract_type, 'Contrat').upper(), h1),
        Paragraph(f"Référence <b>{c.reference}</b> · Statut : {STATUS_LABELS[c.status][0]}"
                  + (f" · Renouvelle {c.previous_contract.reference}" if c.previous_contract else ''), small),
        Paragraph(f"Objet : <b>{esc(c.subject)}</b>", body),
        Paragraph('Parties', h2),
        grid([['Prestataire', Paragraph(f"{COMPANY['name']} — {COMPANY['address']}", body)],
              ['Client', Paragraph(esc(f"{cl.real_name or cl.username} · {cl.phone or ''} · {cl.email or ''}" if cl else ''), body)]]),
    ]
    rows = []
    if c.vehicle:
        rows.append(['Véhicule', Paragraph(esc(f"{c.vehicle.brand or ''} {c.vehicle.model} — {c.vehicle.bus_number}"), body)])
    if c.apartment:
        rows.append(['Appartement', Paragraph(esc(f"{c.apartment.title} — {c.apartment.location}"), body)])
    rows += [['Début', c.start_date.strftime('%d/%m/%Y %H:%M')], ['Fin', c.end_date.strftime('%d/%m/%Y %H:%M')],
             ['Durée', f'{c.days} jour(s)']]
    if c.pickup_location or c.return_location:
        rows += [['Prise en charge', Paragraph(esc(c.pickup_location), body)], ['Restitution', Paragraph(esc(c.return_location), body)]]
    story += [Paragraph('Objet du contrat & période', h2), grid(rows)]
    story += [Paragraph('Conditions financières', h2), grid([
        ['Valeur du contrat', Paragraph(f'<b>{fmt(c.total_value)}</b>', body)],
        ['Caution', fmt(c.deposit)],
        ['Déjà encaissé', fmt(c.amount_paid)],
        ['Reste à payer', fmt(c.balance)],
        ['Modalités de paiement', Paragraph(esc(c.payment_terms), body)],
    ])]
    story += [Paragraph('Conditions générales', h2), Paragraph(esc(c.terms or DEFAULT_TERMS), body)]
    story += [Spacer(1, 22), Table(
        [['Pour 3M SERVICES', 'Le client (lu et approuvé)'], ['\n\n\nSignature et cachet', '\n\n\nSignature']],
        colWidths=[87 * mm, 87 * mm],
        style=TableStyle([('FONTSIZE', (0, 0), (-1, -1), 9), ('TEXTCOLOR', (0, 1), (-1, 1), colors.HexColor('#98A2B3')),
                          ('BOX', (0, 1), (0, 1), 0.4, colors.HexColor('#D0D5DD')), ('BOX', (1, 1), (1, 1), 0.4, colors.HexColor('#D0D5DD'))]))]
    story += [Spacer(1, 10), Paragraph(f"Fait à Yaoundé, le {datetime.utcnow():%d/%m/%Y}.", small)]
    doc.build(story)
    buf.seek(0)
    log_audit('CONTRACT_PDF', 'Contract', c.id, f'PDF {c.reference} téléchargé')
    return send_file(buf, mimetype='application/pdf', as_attachment=True, download_name=f'{c.reference}.pdf')
