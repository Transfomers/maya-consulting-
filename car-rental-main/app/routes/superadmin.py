"""Espace Super Admin : vue d'ensemble, conversations centralisées, clients, administrateurs,
activité, notifications, journal d'audit, rôles & permissions, paramètres.

Toutes les routes /superadmin/* sont vérifiées côté serveur (rôle super_admin, sinon 403).
Les fiches clients (/admin/clients/…) sont aussi ouvertes aux administrateurs autorisés,
limitées à leurs clients selon leurs permissions.
"""
import csv
import io
import ipaddress
import json
import re
import socket
from datetime import datetime, timedelta
from urllib.parse import urlparse

from flask import (Blueprint, Response, abort, current_app, flash, jsonify, redirect, render_template, request,
                   url_for)
from flask_login import current_user, login_required
from sqlalchemy import func, or_

from app import db
from app.models import (ApartmentBooking, AuditLog, Booking, Conversation, ConversationNote, ExperienceRating,
                        NotificationPreference, NotificationRead, SystemNotification, User)
from app.services import conversations as convs
from app.services.activity import CATEGORY_LABELS, action_label, record
from app.services.identity import (CLIENT_STATUSES, FIELD_LABELS, SOURCES, get_setting, real_email, set_setting,
                                   update_client_profile)
from app.services.permissions import has_perm, role_labels, staff_roles, super_admin_only
from app.utils.security import csrf_protect

superadmin_bp = Blueprint('superadmin', __name__)
PER_PAGE = 25
STAFF = ('super_admin', 'admin_agence', 'finance_officer', 'teller', 'driver')
NOTIF_CATEGORIES = {
    'client': 'Nouveaux clients & profils', 'conversation': 'Conversations', 'reservation': 'Réservations',
    'contract': 'Contrats', 'payment': 'Paiements', 'security': 'Sécurité', 'permission': 'Rôles & permissions',
    'mission': 'Missions & véhicules', 'feedback': 'Avis clients', 'chat': 'Messages clients',
}


@superadmin_bp.app_template_filter('duration')
def duration(seconds):
    if seconds is None:
        return '—'
    seconds = int(seconds)
    if seconds < 60:
        return f'{seconds} s'
    if seconds < 3600:
        return f'{seconds // 60} min'
    if seconds < 86400:
        return f'{seconds // 3600} h {seconds % 3600 // 60:02d}'
    return f'{seconds // 86400} j {seconds % 86400 // 3600} h'


@superadmin_bp.app_context_processor
def _sa_helpers():
    waiting = 0
    try:
        if current_user.is_authenticated and current_user.role == 'super_admin' and request.blueprint == 'superadmin':
            waiting = Conversation.query.filter(Conversation.status.in_(('new', 'open')),
                                                Conversation.last_sender == 'client').count()
    except Exception:
        db.session.rollback()
    return {'action_label': action_label, 'category_labels': CATEGORY_LABELS, 'has_perm': has_perm,
            'role_labels': role_labels(), 'real_email': real_email, 'sa_waiting': waiting,
            'view_functions': current_app.view_functions, 'platform_setting': get_setting}


def _check_csrf():
    import hmac
    from flask import session
    from app.utils.security import _SESSION_KEY
    expected = session.get(_SESSION_KEY, '')
    if not expected or not hmac.compare_digest(request.form.get('csrf_token', ''), expected):
        abort(400)


def _page():
    return max(1, request.args.get('page', 1, type=int))


def _paginate(query, per_page=PER_PAGE):
    page = _page()
    total = query.order_by(None).count()
    items = query.offset((page - 1) * per_page).limit(per_page).all()
    return items, {'page': page, 'pages': max(1, -(-total // per_page)), 'total': total}


def _date_range():
    def parse(v):
        try:
            return datetime.strptime(v, '%Y-%m-%d')
        except (TypeError, ValueError):
            return None
    start, end = parse(request.args.get('date_from')), parse(request.args.get('date_to'))
    # Saisie en heure de Yaoundé (UTC+1) → UTC en base
    return (start - timedelta(hours=1) if start else None,
            end + timedelta(days=1) - timedelta(hours=1) if end else None)


def _staff_keys():
    return ['super_admin'] + list(staff_roles())


def _staff():
    return User.query.filter(User.role.in_(_staff_keys()), User.is_deleted == False).order_by(User.role, User.real_name).all()  # noqa: E712


def _admins_for_assignment():
    return [u for u in User.query.filter(User.role.in_(_staff_keys()), User.is_deleted == False).order_by(  # noqa: E712
        User.real_name, User.username).all() if u.is_active and (u.role == 'super_admin' or has_perm(u, 'conversations.reply'))]


# ── 1. Vue d'ensemble ────────────────────────────────────────────────────────
@superadmin_bp.route('/superadmin')
@login_required
@super_admin_only
def overview():
    now = datetime.utcnow()
    week, month = now - timedelta(days=7), now - timedelta(days=30)
    clients = User.query.filter(User.role == 'client', User.is_deleted == False,  # noqa: E712
                                or_(User.is_test == False, User.is_test == None))  # noqa: E711,E712
    active = Conversation.query.filter(Conversation.status.in_(('new', 'open', 'pending')))
    minutes = int(get_setting('unanswered_minutes', 15) or 15)
    unanswered_q = Conversation.query.filter(Conversation.status.in_(('new', 'open')), Conversation.last_sender == 'client')
    late = unanswered_q.filter(Conversation.last_client_message_at <= now - timedelta(minutes=minutes))
    responded = Conversation.query.filter(Conversation.first_response_at != None,  # noqa: E711
                                          Conversation.first_client_message_at >= month).all()
    resp_times = [c.first_response_seconds for c in responded if c.first_response_seconds is not None]
    resolved = Conversation.query.filter(Conversation.resolved_at != None, Conversation.resolved_at >= month).all()  # noqa: E711
    res_times = [c.resolution_seconds for c in resolved if c.resolution_seconds is not None]
    stats = {
        'clients': clients.count(),
        'clients_week': clients.filter(User.created_at >= week).count(),
        'active': active.count(),
        'unassigned': active.filter(Conversation.assigned_admin_id == None).count(),  # noqa: E711
        'unanswered': unanswered_q.count(),
        'late': late.count(),
        'avg_first_response': sum(resp_times) // len(resp_times) if resp_times else None,
        'avg_resolution': sum(res_times) // len(res_times) if res_times else None,
        'admins': User.query.filter(User.role.in_(list(staff_roles())), User.is_deleted == False).count(),  # noqa: E712
        'admins_today': db.session.query(func.count(func.distinct(AuditLog.user_id))).filter(
            AuditLog.created_at >= now - timedelta(hours=24), AuditLog.actor_role.in_(_staff_keys())).scalar() or 0,
        'minutes': minutes,
    }
    by_status = dict(db.session.query(Conversation.status, func.count()).group_by(Conversation.status).all())
    late_list = late.order_by(Conversation.last_client_message_at).limit(8).all()
    recent_activity = AuditLog.query.filter(AuditLog.actor_role.in_(_staff_keys())).order_by(AuditLog.created_at.desc()).limit(12).all()
    new_clients = clients.order_by(User.created_at.desc()).limit(6).all()
    return render_template('superadmin/overview.html', stats=stats, by_status=by_status, late_list=late_list,
                           recent_activity=recent_activity, new_clients=new_clients, now=now)


# ── 2. Conversations ─────────────────────────────────────────────────────────
@superadmin_bp.route('/superadmin/conversations')
@login_required
@super_admin_only
def conversations():
    q = Conversation.query.outerjoin(User, Conversation.client_id == User.id)
    term = (request.args.get('q') or '').strip()
    if term:
        like = f'%{term.lstrip("@")}%'
        q = q.filter(or_(User.real_name.ilike(like), User.display_name.ilike(like), User.username.ilike(like),
                         User.phone.ilike(like), User.client_code.ilike(like), Conversation.thread_id.ilike(like)))
    status, admin_id = request.args.get('status', ''), request.args.get('admin', '')
    if status in convs.STATUSES:
        q = q.filter(Conversation.status == status)
    elif status == 'active':
        q = q.filter(Conversation.status.in_(('new', 'open', 'pending')))
    if admin_id == 'none':
        q = q.filter(Conversation.assigned_admin_id == None)  # noqa: E711
    elif admin_id.isdigit():
        q = q.filter(Conversation.assigned_admin_id == int(admin_id))
    dept = request.args.get('department', '')
    if dept in Conversation.DEPARTMENTS:
        q = q.filter(Conversation.department == dept)
    if request.args.get('unanswered') == '1':
        q = q.filter(Conversation.status.in_(('new', 'open')), Conversation.last_sender == 'client')
    start, end = _date_range()
    if start:
        q = q.filter(Conversation.last_message_at >= start)
    if end:
        q = q.filter(Conversation.last_message_at < end)
    q = q.order_by(db.case((Conversation.status.in_(('new', 'open')) & (Conversation.last_sender == 'client'), 0), else_=1),
                   Conversation.last_message_at.desc().nullslast())
    items, pager = _paginate(q)
    counts = dict(db.session.query(Conversation.status, func.count()).group_by(Conversation.status).all())
    return render_template('superadmin/conversations.html', items=items, pg=pager, counts=counts,
                           admins=_admins_for_assignment(), departments=Conversation.DEPARTMENTS,
                           statuses=Conversation.STATUS_LABELS)


def _history(conv, limit=50):
    """Messages du fil (les plus récents), avec pagination « messages précédents »."""
    from app.services.chat_store import get_thread
    chat = get_thread(conv.thread_id) or {}
    msgs = [m for m in (chat.get('messages') or []) if m.get('sender') in ('client', 'admin')
            and not str(m.get('id') or '').startswith('msg-welcome')]
    before = request.args.get('before', type=int)
    end = len(msgs) if before is None else max(0, min(before, len(msgs)))
    start = max(0, end - limit)
    for m in msgs[start:end]:
        try:
            m['_dt'] = datetime.fromisoformat(str(m.get('timestamp', '')).replace('Z', '')[:26])
        except ValueError:
            m['_dt'] = None
    return chat, msgs[start:end], (start if start > 0 else None), len(msgs)


@superadmin_bp.route('/superadmin/conversations/<int:conv_id>')
@login_required
@super_admin_only
def conversation_detail(conv_id):
    conv = db.get_or_404(Conversation, conv_id)
    chat, messages, older, total = _history(conv)
    if request.args.get('before') is None:
        convs.mark_opened(conv.thread_id, current_user)
    activity = AuditLog.query.filter(AuditLog.target_type == 'Conversation', AuditLog.target_id == conv.id).order_by(
        AuditLog.created_at.desc()).limit(30).all()
    return render_template('superadmin/conversation_detail.html', conv=conv, chat=chat, messages=messages,
                           older=older, total=total, admins=_admins_for_assignment(), activity=activity,
                           statuses=Conversation.STATUS_LABELS, departments=Conversation.DEPARTMENTS)


@superadmin_bp.route('/superadmin/conversations/<int:conv_id>/assign', methods=['POST'])
@login_required
@super_admin_only
@csrf_protect
def conversation_assign(conv_id):
    conv = db.get_or_404(Conversation, conv_id)
    raw = request.form.get('admin_id', '')
    try:
        if convs.assign(conv, int(raw) if raw.isdigit() else None, current_user):
            flash('Conversation réassignée.', 'success')
    except ValueError as e:
        flash(str(e), 'danger')
    return redirect(request.form.get('next') or url_for('superadmin.conversation_detail', conv_id=conv.id))


@superadmin_bp.route('/superadmin/conversations/<int:conv_id>/status', methods=['POST'])
@login_required
@super_admin_only
@csrf_protect
def conversation_status(conv_id):
    conv = db.get_or_404(Conversation, conv_id)
    dept = request.form.get('department')
    if dept in Conversation.DEPARTMENTS and dept != conv.department:
        record('CONVERSATION_STATUS', 'conversation', 'Conversation', conv.id, conv.thread_id,
               meta={'service_avant': conv.department, 'service_apres': dept}, commit=False)
        conv.department = dept
        db.session.commit()
    if convs.set_status(conv, request.form.get('status', ''), current_user):
        flash(f'Statut : {conv.status_label}.', 'success')
    return redirect(url_for('superadmin.conversation_detail', conv_id=conv.id))


@superadmin_bp.route('/superadmin/conversations/<int:conv_id>/note', methods=['POST'])
@login_required
@super_admin_only
@csrf_protect
def conversation_note(conv_id):
    conv = db.get_or_404(Conversation, conv_id)
    if convs.add_note(conv, request.form.get('body'), current_user):
        flash('Note interne ajoutée (invisible pour le client).', 'success')
    return redirect(url_for('superadmin.conversation_detail', conv_id=conv.id) + '#notes')


@superadmin_bp.route('/superadmin/conversations/<int:conv_id>/reply', methods=['POST'])
@login_required
@super_admin_only
@csrf_protect
def conversation_reply(conv_id):
    conv = db.get_or_404(Conversation, conv_id)
    if not (request.form.get('text') or '').strip():
        flash('Le message est vide.', 'warning')
    else:
        from app.routes.admin import send_admin_chat_reply
        send_admin_chat_reply(conv.thread_id)        # même logique que la messagerie (fil, e-mail, notification client)
    return redirect(url_for('superadmin.conversation_detail', conv_id=conv.id) + '#bottom')


# ── 3. Clients (Super Admin : tous ; administrateur : selon permissions) ────
def _client_scope(query):
    if current_user.role == 'super_admin' or has_perm(current_user, 'clients.view_all'):
        return query
    if has_perm(current_user, 'clients.view_assigned'):
        mine = db.session.query(Conversation.client_id).filter(Conversation.assigned_admin_id == current_user.id)
        return query.filter(or_(User.assigned_admin_id == current_user.id, User.id.in_(mine)))
    return query.filter(db.false())


def _staff_only():
    if not current_user.is_authenticated or not current_user.is_staff:
        abort(403)


@superadmin_bp.route('/superadmin/clients')
@login_required
@super_admin_only
def clients():
    return _clients_list('superadmin/clients.html')


@superadmin_bp.route('/admin/mes-clients')
@login_required
def my_clients():
    _staff_only()
    return _clients_list('superadmin/clients.html')


def _clients_list(template):
    q = _client_scope(User.query.filter(User.role == 'client', User.is_deleted == False))  # noqa: E712
    term = (request.args.get('q') or '').strip()
    if term:
        like = f'%{term.lstrip("@")}%'
        q = q.filter(or_(User.real_name.ilike(like), User.display_name.ilike(like), User.username.ilike(like),
                         User.phone.ilike(like), User.email.ilike(like), User.client_code.ilike(like)))
    if request.args.get('status') in CLIENT_STATUSES:
        q = q.filter(User.client_status == request.args['status'])
    if request.args.get('source') in SOURCES:
        q = q.filter(User.client_source == request.args['source'])
    admin = request.args.get('admin', '')
    if admin == 'none':
        q = q.filter(User.assigned_admin_id == None)  # noqa: E711
    elif admin.isdigit():
        q = q.filter(User.assigned_admin_id == int(admin))
    if request.args.get('test') != '1':
        q = q.filter(or_(User.is_test == False, User.is_test == None))  # noqa: E711,E712
    if request.args.get('account') == 'suspended':
        q = q.filter(User.is_suspended == True)  # noqa: E712
    start, end = _date_range()
    if start:
        q = q.filter(User.created_at >= start)
    if end:
        q = q.filter(User.created_at < end)
    sort = {'name': User.real_name, 'code': User.client_code, 'old': User.created_at}.get(request.args.get('sort'), User.created_at.desc())
    q = q.order_by(sort)
    if request.args.get('export') == 'csv':
        if not has_perm(current_user, 'reports.export'):
            abort(403)
        out = io.StringIO()
        w = csv.writer(out, delimiter=';')
        w.writerow(['Identifiant', 'Utilisateur', 'Nom', 'Téléphone', 'E-mail', 'Source', 'Statut', 'Inscription'])
        for u in q.limit(20000).all():
            w.writerow([u.client_code or '', u.username, u.display_name or u.real_name or '', u.phone or '',
                        real_email(u.email), SOURCES.get(u.client_source, u.client_source or ''),
                        'Suspendu' if u.is_suspended else CLIENT_STATUSES.get(u.client_status or 'active', ''),
                        u.created_at.strftime('%d/%m/%Y') if u.created_at else ''])
        record('CLIENTS_EXPORTED', 'security', meta={'filtres': dict(request.args)})
        return Response('\ufeff' + out.getvalue(), mimetype='text/csv; charset=utf-8',
                        headers={'Content-Disposition': f'attachment; filename=clients-{datetime.now():%Y%m%d}.csv'})
    items, pager = _paginate(q)
    conv_counts = dict(db.session.query(Conversation.client_id, func.count()).filter(
        Conversation.client_id.in_([u.id for u in items])).group_by(Conversation.client_id).all()) if items else {}
    admins = {a.id: a for a in _admins_for_assignment()}
    return render_template(template, items=items, pg=pager, conv_counts=conv_counts, admins=admins,
                           statuses=CLIENT_STATUSES, sources=SOURCES)


def _get_client_or_403(cid):
    user = User.query.filter(User.id == cid, User.role == 'client').first_or_404()
    if not _client_scope(User.query.filter(User.id == cid)).first():
        abort(403)
    return user


@superadmin_bp.route('/admin/clients/<int:cid>')
@login_required
def client_detail(cid):
    _staff_only()
    return _render_client(_get_client_or_403(cid))


def _render_client(user, suggestion=None):
    conversations_q = Conversation.query.filter_by(client_id=user.id).order_by(Conversation.last_message_at.desc().nullslast())
    if current_user.role != 'super_admin' and not has_perm(current_user, 'conversations.view_all'):
        conversations_q = conversations_q.filter(or_(Conversation.assigned_admin_id == current_user.id,
                                                     Conversation.assigned_admin_id == None))  # noqa: E711
    history = AuditLog.query.filter(AuditLog.target_type == 'User', AuditLog.target_id == user.id).order_by(
        AuditLog.created_at.desc()).limit(50).all()
    history = [(h, json.loads(h.details) if h.details and h.details.startswith('{') else None) for h in history]
    bookings = Booking.query.filter_by(user_id=user.id).order_by(Booking.id.desc()).limit(10).all()
    stays = ApartmentBooking.query.filter_by(user_id=user.id).order_by(ApartmentBooking.id.desc()).limit(10).all()
    rating = ExperienceRating.query.filter_by(user_id=user.id).first()
    from app.models import Contract, ContractPayment, Invoice, Payment
    contracts = Contract.query.filter_by(client_id=user.id, is_deleted=False).order_by(Contract.id.desc()).all()
    invoices = Invoice.query.filter_by(client_id=user.id).order_by(Invoice.id.desc()).limit(15).all()
    all_bookings = Booking.query.filter_by(user_id=user.id).all()
    all_stays = ApartmentBooking.query.filter_by(user_id=user.id).all()
    payments = []
    for p in Payment.query.filter(Payment.booking_id.in_([b.id for b in all_bookings] or [0])).all():
        payments.append({'date': p.created_at, 'amount': p.amount or 0, 'label': f'Réservation #{p.booking_id}',
                         'status': p.status, 'method': p.payment_method, 'url': url_for('superadmin.transaction_detail', kind='payment', tid=p.id)})
    for p in ContractPayment.query.filter(ContractPayment.contract_id.in_([c.id for c in contracts] or [0])).all():
        payments.append({'date': p.paid_at, 'amount': p.amount or 0, 'label': (p.contract.reference if p.contract else 'Contrat') + (' · caution' if p.is_deposit else ''),
                         'status': 'refunded' if p.is_void else 'completed', 'method': p.method, 'deposit': p.is_deposit,
                         'url': url_for('superadmin.transaction_detail', kind='contract', tid=p.id)})
    for a in all_stays:
        if a.payment_status in ('paid', 'partial'):
            payments.append({'date': a.created_at, 'amount': (a.total_amount if a.payment_status == 'paid' else a.deposit_paid) or 0,
                             'label': f'Séjour {a.booking_ref}', 'status': 'completed', 'method': a.payment_method, 'url': None})
    payments = sorted([p for p in payments if p['date']], key=lambda p: p['date'], reverse=True)
    stats = {
        'bookings': len(all_bookings) + len(all_stays) + len(contracts),
        'completed': sum(1 for a in all_stays if a.status == 'checked_out') + sum(1 for c in contracts if c.status in ('completed', 'expired')),
        'cancelled': sum(1 for b in all_bookings if b.status == 'cancelled') + sum(1 for a in all_stays if a.status == 'cancelled')
                     + sum(1 for c in contracts if c.status in ('cancelled', 'terminated')),
        'spent': sum(p['amount'] for p in payments if p['status'] == 'completed' and not p.get('deposit')),
        'invoices_due': sum(max(0, (i.total_amount or 0) - (i.amount_paid or 0)) for i in invoices if i.status not in ('paid', 'cancelled', 'draft')),
    }
    layout = 'superadmin/_layout.html' if current_user.role == 'super_admin' else 'base.html'
    return render_template('superadmin/client_detail.html', client=user, conversations=conversations_q.all(),
                           history=history, bookings=bookings, stays=stays, rating=rating, layout=layout,
                           contracts=contracts, invoices=invoices, payments=payments[:20], stats=stats,
                           can_suspend=has_perm(current_user, 'clients.suspend'),
                           admins=_admins_for_assignment(), statuses=CLIENT_STATUSES, sources=SOURCES,
                           field_labels=FIELD_LABELS, suggestion=suggestion,
                           can_edit=has_perm(current_user, 'clients.edit'),
                           can_edit_username=has_perm(current_user, 'clients.edit_username'))


@superadmin_bp.route('/admin/clients/<int:cid>/edit', methods=['POST'])
@login_required
@csrf_protect
def client_edit(cid):
    _staff_only()
    user = _get_client_or_403(cid)
    if not has_perm(current_user, 'clients.edit'):
        abort(403)
    changes, errors = update_client_profile(user, request.form, current_user,
                                            can_edit_username=has_perm(current_user, 'clients.edit_username'))
    if errors:
        db.session.rollback()
        for e in errors:
            flash(e, 'danger')
    elif changes:
        db.session.commit()
        flash(f'Profil mis à jour ({len(changes)} champ(s)). L’identifiant {user.client_code} est inchangé.', 'success')
    else:
        flash('Aucune modification.', 'info')
    return redirect(url_for('superadmin.client_detail', cid=user.id))


@superadmin_bp.route('/admin/clients/<int:cid>/account', methods=['POST'])
@login_required
@csrf_protect
def client_account(cid):
    """Suspendre / réactiver le compte d'un client (connexion bloquée, données conservées)."""
    _staff_only()
    user = _get_client_or_403(cid)
    if not has_perm(current_user, 'clients.suspend'):
        abort(403)
    action = request.form.get('action')
    if action not in ('suspend', 'activate'):
        abort(400)
    user.is_suspended = action == 'suspend'
    user.status_reason = (request.form.get('reason') or '').strip()[:255] or None
    db.session.info['skip_activity'] = True
    db.session.flush()
    db.session.info.pop('skip_activity', None)
    record('CLIENT_SUSPENDED' if action == 'suspend' else 'CLIENT_REACTIVATED', 'client', 'User', user.id,
           f'{user.client_code} · {user.display_name or user.real_name or user.username}',
           meta={'motif': user.status_reason}, commit=False)
    db.session.commit()
    flash('Compte client suspendu : il ne peut plus se connecter.' if action == 'suspend' else 'Compte client réactivé.', 'success')
    return redirect(url_for('superadmin.client_detail', cid=cid))


@superadmin_bp.route('/admin/clients/<int:cid>/assign', methods=['POST'])
@login_required
@super_admin_only
@csrf_protect
def client_assign(cid):
    user = User.query.filter_by(id=cid, role='client').first_or_404()
    raw = request.form.get('admin_id', '')
    new = int(raw) if raw.isdigit() else None
    if new and not (db.session.get(User, new) and db.session.get(User, new).is_staff):
        flash('Administrateur invalide.', 'danger')
        return redirect(url_for('superadmin.client_detail', cid=cid))
    if new != user.assigned_admin_id:
        old = user.assigned_admin_id
        user.assigned_admin_id = new
        record('CLIENT_ASSIGNED', 'client', 'User', user.id, f'{user.client_code}',
               meta={'avant': old, 'apres': new}, commit=False)
        db.session.commit()
        flash('Administrateur du client mis à jour (utilisé pour ses prochaines conversations).', 'success')
    return redirect(url_for('superadmin.client_detail', cid=cid))


def _public_host(url):
    """URL http(s) vers une adresse publique uniquement (pas d'accès au réseau interne)."""
    p = urlparse(url)
    if p.scheme not in ('http', 'https') or not p.hostname:
        return False
    try:
        for info in socket.getaddrinfo(p.hostname, None):
            ip = ipaddress.ip_address(info[4][0])
            if ip.is_private or ip.is_loopback or ip.is_link_local or ip.is_reserved or ip.is_multicast:
                return False
    except (socket.gaierror, ValueError):
        return False
    return True


@superadmin_bp.route('/admin/clients/<int:cid>/suggest', methods=['POST'])
@login_required
@csrf_protect
def client_suggest(cid):
    """Suggestion de nom à partir du site web PUBLIC indiqué par l'admin. Jamais appliquée sans confirmation."""
    _staff_only()
    user = _get_client_or_403(cid)
    if not has_perm(current_user, 'clients.edit'):
        abort(403)
    url = (request.form.get('website') or '').strip()
    if url and not re.match(r'^https?://', url):
        url = 'https://' + url
    suggestion = {'source': url, 'names': [], 'error': None}
    if not url or not _public_host(url):
        suggestion['error'] = 'Adresse invalide ou non publique.'
    else:
        try:
            import requests
            r = requests.get(url, timeout=6, allow_redirects=False, stream=True,
                             headers={'User-Agent': '3M-Services-Admin/1.0'})
            html = r.raw.read(200_000, decode_content=True).decode(r.encoding or 'utf-8', 'ignore')
            found = []
            for pat in (r'<meta[^>]+property=["\']og:site_name["\'][^>]+content=["\']([^"\']+)',
                        r'<meta[^>]+content=["\']([^"\']+)["\'][^>]+property=["\']og:site_name',
                        r'"@type"\s*:\s*"(?:Organization|LocalBusiness)"[^}]*?"name"\s*:\s*"([^"]+)"',
                        r'<title[^>]*>([^<]{2,120})</title>'):
                for m in re.findall(pat, html, re.I | re.S):
                    name = re.sub(r'\s+', ' ', m).strip(' -|·')
                    if name and name not in found:
                        found.append(name[:120])
            suggestion['names'] = found[:4]
            if not found:
                suggestion['error'] = 'Aucun nom trouvé sur cette page.'
        except Exception:
            suggestion['error'] = 'Site injoignable.'
    record('CLIENT_NAME_SUGGESTION', 'client', 'User', user.id, user.client_code,
           meta={'source': url, 'resultats': len(suggestion['names'])})
    # Réaffiche la fiche avec les suggestions : rien n'est appliqué tant que l'admin ne confirme pas
    return _render_client(user, suggestion)


# ── 5 & 7. Activité et journal d'audit ───────────────────────────────────────
def _audit_query():
    q = AuditLog.query
    actor = request.args.get('admin', '')
    if actor.isdigit():
        q = q.filter(AuditLog.user_id == int(actor))
    cat = request.args.get('category', '')
    if cat in CATEGORY_LABELS:
        q = q.filter(AuditLog.category == cat)
    action = (request.args.get('action') or '').strip().upper()
    if action:
        q = q.filter(AuditLog.action == action)
    term = (request.args.get('q') or '').strip()
    if term:
        like = f'%{term}%'
        q = q.filter(or_(AuditLog.target_label.ilike(like), AuditLog.actor_name.ilike(like),
                         AuditLog.action.ilike(like), AuditLog.details.ilike(like)))
    start, end = _date_range()
    if start:
        q = q.filter(AuditLog.created_at >= start)
    if end:
        q = q.filter(AuditLog.created_at < end)
    return q.order_by(AuditLog.created_at.desc(), AuditLog.id.desc())


@superadmin_bp.route('/superadmin/activity')
@login_required
@super_admin_only
def activity():
    q = _audit_query().filter(or_(AuditLog.actor_role.in_(_staff_keys()), AuditLog.action == 'LOGIN_FAILED'))
    items, pager = _paginate(q, 40)
    since = datetime.utcnow() - timedelta(days=7)
    per_admin = db.session.query(AuditLog.user_id, AuditLog.actor_name, func.count()).filter(
        AuditLog.created_at >= since, AuditLog.actor_role.in_(_staff_keys())).group_by(AuditLog.user_id, AuditLog.actor_name).all()
    per_cat = dict(db.session.query(AuditLog.category, func.count()).filter(
        AuditLog.created_at >= since, AuditLog.actor_role.in_(_staff_keys())).group_by(AuditLog.category).all())
    return render_template('superadmin/activity.html', items=items, pg=pager, staff=_staff(),
                           per_admin=per_admin, per_cat=per_cat, mode='activity')


@superadmin_bp.route('/superadmin/audit')
@login_required
@super_admin_only
def audit():
    q = _audit_query()
    if request.args.get('export') == 'csv':
        out = io.StringIO()
        w = csv.writer(out, delimiter=';')
        w.writerow(['Date (UTC)', 'Acteur', 'Rôle', 'Action', 'Catégorie', 'Élément', 'Détails', 'IP'])
        for a in q.limit(20000).all():
            w.writerow([a.created_at.strftime('%d/%m/%Y %H:%M:%S') if a.created_at else '', a.actor_name or '',
                        a.actor_role or '', action_label(a.action), CATEGORY_LABELS.get(a.category, a.category or ''),
                        a.target_label or (f'{a.target_type} #{a.target_id}' if a.target_type else ''),
                        a.details or '', a.ip_address or ''])
        record('AUDIT_EXPORTED', 'security', meta={'filtres': dict(request.args)})
        return Response('﻿' + out.getvalue(), mimetype='text/csv; charset=utf-8',
                        headers={'Content-Disposition': f'attachment; filename=audit-{datetime.now():%Y%m%d-%H%M}.csv'})
    items, pager = _paginate(q, 50)
    return render_template('superadmin/activity.html', items=items, pg=pager, staff=_staff(),
                           per_admin=[], per_cat={}, mode='audit')


# ── 6. Notifications ─────────────────────────────────────────────────────────
@superadmin_bp.route('/superadmin/notifications')
@login_required
@super_admin_only
def notifications():
    q = SystemNotification.query.filter(SystemNotification.is_deleted == False,  # noqa: E712
                                        or_(SystemNotification.role_target.in_(('super_admin', 'admin_agence')),
                                            SystemNotification.role_target == None,  # noqa: E711
                                            SystemNotification.user_id == current_user.id))
    cat = request.args.get('category', '')
    if cat:
        q = q.filter(SystemNotification.category == cat)
    read_ids = {r.notification_id for r in NotificationRead.query.filter_by(user_id=current_user.id).all()}
    if request.args.get('unread') == '1':
        q = q.filter(SystemNotification.is_read == False, SystemNotification.id.notin_(read_ids or {0}))  # noqa: E712
    items, pager = _paginate(q.order_by(SystemNotification.created_at.desc()), 30)
    prefs = {p.category: p.enabled for p in NotificationPreference.query.filter_by(user_id=current_user.id).all()}
    cats = [r[0] for r in db.session.query(SystemNotification.category).distinct().all() if r[0]]
    return render_template('superadmin/notifications.html', items=items, pg=pager, read_ids=read_ids,
                           prefs=prefs, pref_categories=NOTIF_CATEGORIES, categories=sorted(set(cats)))


@superadmin_bp.route('/superadmin/notifications/preferences', methods=['POST'])
@login_required
@csrf_protect
def notification_preferences():
    _staff_only()
    for cat in NOTIF_CATEGORIES:
        enabled = request.form.get(f'pref_{cat}') == '1'
        pref = NotificationPreference.query.filter_by(user_id=current_user.id, category=cat).first()
        if not pref:
            pref = NotificationPreference(user_id=current_user.id, category=cat)
            db.session.add(pref)
        pref.enabled = enabled
    db.session.commit()
    flash('Préférences de notifications enregistrées.', 'success')
    return redirect(request.form.get('next') or url_for('superadmin.notifications'))


# ── 9. Paramètres ────────────────────────────────────────────────────────────
@superadmin_bp.route('/superadmin/settings', methods=['GET', 'POST'])
@login_required
@super_admin_only
def settings():
    if request.method == 'POST':
        _check_csrf()
        from app.services.security_hooks import recently_authenticated
        if not recently_authenticated():
            flash('Paramètres critiques : confirmez votre mot de passe puis enregistrez à nouveau.', 'warning')
            return redirect(url_for('superadmin.confirm_password', next=url_for('superadmin.settings')))
        minutes = request.form.get('unanswered_minutes', type=int)
        mode = request.form.get('auto_assign')
        tax = request.form.get('default_tax_percent', type=float)
        maint = '1' if request.form.get('maintenance_mode') == '1' else '0'
        msg = (request.form.get('maintenance_message') or '').strip()[:300]
        keys = ('unanswered_minutes', 'auto_assign', 'default_tax_percent', 'maintenance_mode', 'maintenance_message')
        before = {k: get_setting(k) for k in keys}
        if minutes and 1 <= minutes <= 1440:
            set_setting('unanswered_minutes', minutes, current_user.id)
        if mode in ('least_busy', 'none'):
            set_setting('auto_assign', mode, current_user.id)
        if tax is not None and 0 <= tax <= 50:
            set_setting('default_tax_percent', f'{tax:g}', current_user.id)
        set_setting('maintenance_mode', maint, current_user.id)
        set_setting('maintenance_message', msg or None, current_user.id)
        after = {k: get_setting(k) for k in keys}
        if before.get('maintenance_mode') != maint:
            from app.services.activity import notify_super_admin
            notify_super_admin('🛠️ Mode maintenance ' + ('activé' if maint == '1' else 'désactivé'),
                               f'Par {current_user.real_name or current_user.username}', 'settings',
                               'warning' if maint == '1' else 'info', commit=False)
        record('SETTINGS_UPDATED', 'settings', meta={'avant': before, 'apres': after}, commit=False)
        db.session.commit()
        flash('Paramètres enregistrés.', 'success')
        return redirect(url_for('superadmin.settings'))
    return render_template('superadmin/settings.html',
                           unanswered_minutes=int(get_setting('unanswered_minutes', 15) or 15),
                           auto_assign=get_setting('auto_assign', 'least_busy'),
                           default_tax=get_setting('default_tax_percent', '19.25'),
                           maintenance=get_setting('maintenance_mode', '0') == '1',
                           maintenance_message=get_setting('maintenance_message', '') or '',
                           assignable=convs.assignable_admins())


# Administrateurs, rôles, ré-authentification (module séparé, même blueprint)
from app.routes import sa_admins  # noqa: E402,F401
from app.routes import sa_platform  # noqa: E402,F401
from app.routes import sa_rental  # noqa: E402,F401
