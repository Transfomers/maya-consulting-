"""Super Admin — gestion complète des administrateurs, des rôles et ré-authentification.

Règles :
- seul le Super Admin gère les comptes staff et les rôles (vérifié côté serveur) ;
- on ne supprime jamais un compte staff : il est désactivé, son historique est conservé ;
- le dernier Super Admin actif ne peut être ni rétrogradé, ni suspendu, ni désactivé ;
- personne ne modifie son propre rôle ni son propre statut ;
- les actions sensibles redemandent le mot de passe (ré-authentification récente).
"""
import hashlib
import hmac
import json
import re
import secrets
from datetime import datetime, timedelta

from flask import abort, current_app, flash, redirect, render_template, request, url_for
from flask_login import current_user, login_required
from sqlalchemy import func, or_

from app import db
from app.models import AuditLog, Conversation, Role, RolePermission, User
from app.routes.superadmin import _check_csrf, _paginate, superadmin_bp
from app.services.activity import CATEGORY_LABELS, action_label, record
from app.services.permissions import (ALL_PERMISSIONS, PERMISSION_LABELS, PERMISSIONS, role_labels,
                                      role_permissions, set_role_permissions, staff_roles, super_admin_only)
from app.services.security_hooks import mark_reauthenticated, recent_auth_required
from app.utils.security import csrf_protect

MODULES = {
    'conversations': 'Conversations & clients', 'missions': 'Missions & réservations véhicules',
    'fleet': 'Véhicules & chauffeurs', 'apartments': 'Résidences meublées', 'contracts': 'Contrats',
    'finance': 'Factures & paiements', 'ratings': 'Avis clients',
}
STATUS_LABELS = {'active': 'Actif', 'invited': 'Invitation envoyée', 'suspended': 'Suspendu', 'deactivated': 'Désactivé'}
SETUP_PREFIX = 'setup$'
EMAIL_RE = re.compile(r'^[^@\s]+@[^@\s]+\.[a-z]{2,}$', re.I)


def _staff_query():
    return User.query.filter(User.role != 'client', User.role != 'driver')


def _active_super_admins(exclude_id=None):
    q = User.query.filter(User.role == 'super_admin', User.is_deleted == False,  # noqa: E712
                          or_(User.is_suspended == False, User.is_suspended == None),  # noqa: E711,E712
                          or_(User.account_status == None, User.account_status != 'deactivated'))  # noqa: E711
    if exclude_id:
        q = q.filter(User.id != exclude_id)
    return q.count()


def _safe_next(default):
    nxt = request.values.get('next') or ''
    return nxt if nxt.startswith('/') and not nxt.startswith('//') else default


# ── Lien de création du mot de passe (invitation / réinitialisation) ─────────
def issue_setup_link(user, hours=72):
    token = secrets.token_urlsafe(32)
    user.reset_token_hash = SETUP_PREFIX + hashlib.sha256(token.encode()).hexdigest()
    user.reset_token_expiry = datetime.utcnow() + timedelta(hours=hours)
    base = (current_app.config.get('APP_BASE_URL') or request.host_url).rstrip('/')
    return f"{base}{url_for('superadmin.setup_password', uid=user.id, token=token)}"


def verify_setup_token(user, token):
    if not user or not user.reset_token_hash or not user.reset_token_hash.startswith(SETUP_PREFIX):
        return False
    if not user.reset_token_expiry or user.reset_token_expiry < datetime.utcnow():
        return False
    expected = user.reset_token_hash[len(SETUP_PREFIX):]
    return hmac.compare_digest(expected, hashlib.sha256((token or '').encode()).hexdigest())


def _send_setup_email(user, link, kind='invitation'):
    """Renvoie True seulement si l'envoi a réellement réussi (jamais de faux « envoyé »)."""
    if not current_app.config.get('MAIL_PASSWORD') and not current_app.config.get('MAIL_SERVER'):
        return False
    try:
        from html import escape
        from app.services.email_service import send_email
        name = escape(user.real_name or user.username)
        subject = ('Votre accès administrateur 3M SERVICES' if kind == 'invitation'
                   else 'Réinitialisation de votre accès 3M SERVICES')
        html = (f"<p>Bonjour {name},</p><p>"
                + ("Un compte administrateur 3M SERVICES vient d'être créé pour vous."
                   if kind == 'invitation' else "Votre accès administrateur a été réinitialisé.")
                + f"</p><p><a href='{escape(link)}'>Choisir mon mot de passe</a> (lien valable 72 h, à usage unique).</p>"
                  "<p>Si vous n'êtes pas à l'origine de cette demande, ignorez ce message.</p>")
        return bool(send_email(user.email, subject, html, f"Choisir mon mot de passe : {link}"))
    except Exception:
        current_app.logger.exception('[admin] e-mail d’invitation non envoyé')
        return False


def password_problems(pw):
    problems = []
    if len(pw or '') < 10:
        problems.append('au moins 10 caractères')
    if not re.search(r'[A-Za-z]', pw or '') or not re.search(r'\d', pw or ''):
        problems.append('des lettres et des chiffres')
    return problems


@superadmin_bp.route('/auth/setup-password/<int:uid>/<token>', methods=['GET', 'POST'])
def setup_password(uid, token):
    """Page publique (lien e-mail) : le nouvel administrateur choisit son mot de passe."""
    user = db.session.get(User, uid)
    if not verify_setup_token(user, token) or not user.is_active:
        return render_template('superadmin/setup_password.html', invalid=True), 400
    error = None
    if request.method == 'POST':
        _check_csrf()
        pw, pw2 = request.form.get('password', ''), request.form.get('password2', '')
        problems = password_problems(pw)
        if problems:
            error = 'Le mot de passe doit contenir ' + ' et '.join(problems) + '.'
        elif pw != pw2:
            error = 'Les deux mots de passe ne correspondent pas.'
        else:
            user.set_password(pw)
            user.reset_token_hash = None
            user.reset_token_expiry = None
            user.password_set_at = datetime.utcnow()
            user.locked_until = None
            if user.account_status == 'invited':
                user.account_status = None
            record('PASSWORD_SET', 'security', 'User', user.id, user.username, actor=user, commit=False)
            db.session.commit()
            flash('Mot de passe enregistré. Vous pouvez vous connecter.', 'success')
            return redirect(url_for('auth.login'))
    return render_template('superadmin/setup_password.html', invalid=False, user=user, error=error)


# ── Ré-authentification ──────────────────────────────────────────────────────
@superadmin_bp.route('/superadmin/confirm', methods=['GET', 'POST'])
@login_required
@super_admin_only
def confirm_password():
    error = None
    if request.method == 'POST':
        _check_csrf()
        if current_user.check_password(request.form.get('password', '')):
            mark_reauthenticated()
            record('REAUTHENTICATED', 'security', 'User', current_user.id, current_user.username, commit=True)
            flash('Identité confirmée pour 10 minutes. Vous pouvez refaire l’action.', 'success')
            return redirect(_safe_next(url_for('superadmin.overview')))
        record('REAUTH_FAILED', 'security', 'User', current_user.id, current_user.username, commit=True)
        error = 'Mot de passe incorrect.'
    return render_template('superadmin/confirm_password.html', error=error, next=_safe_next(''))


# ── Liste ────────────────────────────────────────────────────────────────────
@superadmin_bp.route('/superadmin/admins')
@login_required
@super_admin_only
def admins():
    q = _staff_query()
    term = (request.args.get('q') or '').strip()
    if term:
        like = f'%{term}%'
        q = q.filter(or_(User.real_name.ilike(like), User.username.ilike(like), User.email.ilike(like),
                         User.phone.ilike(like)))
    role = request.args.get('role', '')
    if role:
        q = q.filter(User.role == role)
    status = request.args.get('status', '')
    if status == 'suspended':
        q = q.filter(User.is_suspended == True, User.is_deleted == False)  # noqa: E712
    elif status == 'deactivated':
        q = q.filter(or_(User.is_deleted == True, User.account_status == 'deactivated'))  # noqa: E712
    elif status == 'invited':
        q = q.filter(User.account_status == 'invited', User.is_deleted == False)  # noqa: E712
    elif status != 'all':
        q = q.filter(User.is_deleted == False, or_(User.account_status == None, User.account_status != 'deactivated'))  # noqa: E711,E712
    sort = request.args.get('sort', 'name')
    order = {'name': User.real_name, 'created': User.created_at.desc(), 'role': User.role}.get(sort, User.real_name)
    items, pg = _paginate(q.order_by(order, User.username))
    ids = [u.id for u in items]
    last_login = dict(db.session.query(AuditLog.user_id, func.max(AuditLog.created_at)).filter(
        AuditLog.action == 'LOGIN', AuditLog.user_id.in_(ids)).group_by(AuditLog.user_id).all()) if ids else {}
    last_action = dict(db.session.query(AuditLog.user_id, func.max(AuditLog.created_at)).filter(
        AuditLog.user_id.in_(ids)).group_by(AuditLog.user_id).all()) if ids else {}
    open_convs = dict(db.session.query(Conversation.assigned_admin_id, func.count()).filter(
        Conversation.status.in_(('new', 'open', 'pending')), Conversation.assigned_admin_id.in_(ids)).group_by(
        Conversation.assigned_admin_id).all()) if ids else {}
    counts = {
        'total': _staff_query().filter(User.is_deleted == False).count(),  # noqa: E712
        'active': sum(1 for u in _staff_query().filter(User.is_deleted == False).all() if u.status_key == 'active'),  # noqa: E712
        'suspended': _staff_query().filter(User.is_suspended == True, User.is_deleted == False).count(),  # noqa: E712
        'invited': _staff_query().filter(User.account_status == 'invited', User.is_deleted == False).count(),  # noqa: E712
    }
    return render_template('superadmin/admins.html', items=items, pg=pg, last_login=last_login,
                           last_action=last_action, open_convs=open_convs, counts=counts, roles=role_labels(),
                           staff_roles=staff_roles(), modules=MODULES, status_labels=STATUS_LABELS)


# ── Création ─────────────────────────────────────────────────────────────────
def _form_values(user=None):
    f = request.form
    return {
        'real_name': (f.get('real_name') or '').strip()[:120],
        'email': (f.get('email') or '').strip().lower()[:120],
        'phone': (f.get('phone') or '').strip()[:40],
        'role': f.get('role') or (user.role if user else ''),
        'agency_id': f.get('agency_id', type=int),
        'modules': [m for m in f.getlist('modules') if m in MODULES],
    }


def _validate(values, user=None):
    errors = []
    if len(values['real_name']) < 2:
        errors.append('Le nom complet est obligatoire.')
    if not EMAIL_RE.match(values['email']):
        errors.append('Adresse e-mail invalide.')
    elif User.query.filter(func.lower(User.email) == values['email'], User.id != (user.id if user else 0)).first():
        errors.append('Cette adresse e-mail est déjà utilisée par un autre compte.')
    if values['phone'] and len(re.sub(r'\D', '', values['phone'])) < 8:
        errors.append('Numéro de téléphone invalide.')
    allowed = set(staff_roles()) | {'super_admin'}
    if values['role'] not in allowed:
        errors.append('Rôle invalide.')
    return errors


def _agencies():
    from app.models import Agency
    return Agency.query.filter_by(is_deleted=False).order_by(Agency.name).all() if hasattr(Agency, 'is_deleted') \
        else Agency.query.order_by(Agency.name).all()


@superadmin_bp.route('/superadmin/admins/new', methods=['GET', 'POST'])
@login_required
@super_admin_only
@recent_auth_required
def admin_create():
    values, errors, invite = None, [], None
    if request.method == 'POST':
        _check_csrf()
        values = _form_values()
        errors = _validate(values)
        if not errors:
            base = re.sub(r'[^a-z0-9]', '', values['email'].split('@')[0].lower())[:20] or 'admin'
            uname, k = base, 1
            while User.query.filter(func.lower(User.username) == uname).first():
                k += 1
                uname = f'{base}{k}'
            user = User(username=uname, email=values['email'], real_name=values['real_name'],
                        phone=values['phone'] or None, role=values['role'], is_verified=True,
                        agency_id=values['agency_id'] or None, admin_modules=json.dumps(values['modules']),
                        account_status='invited', invited_by_id=current_user.id,
                        is_suspended=request.form.get('status') == 'suspended')
            parts = values['real_name'].split(' ', 1)
            user.first_name, user.last_name = parts[0], (parts[1] if len(parts) > 1 else '')
            user.set_password(secrets.token_urlsafe(32))     # inutilisable : le mot de passe est choisi via le lien
            db.session.add(user)
            db.session.flush()
            link = issue_setup_link(user)
            sent = _send_setup_email(user, link) if request.form.get('send_invite', '1') == '1' else False
            record('ADMIN_CREATED', 'permission', 'User', user.id, f'{user.real_name} ({role_labels().get(user.role, user.role)})',
                   meta={'role': user.role, 'modules': values['modules'], 'invitation_envoyee': sent}, commit=False)
            db.session.commit()
            invite = {'user': user, 'link': link, 'sent': sent}
            flash(f'Compte créé pour {user.real_name}.', 'success')
    return render_template('superadmin/admin_form.html', user=None, values=values or {}, errors=errors,
                           invite=invite, staff_roles=staff_roles(), modules=MODULES, agencies=_agencies())


# ── Fiche ────────────────────────────────────────────────────────────────────
@superadmin_bp.route('/superadmin/admins/<int:uid>')
@login_required
@super_admin_only
def admin_detail(uid):
    user = _staff_query().filter(User.id == uid).first_or_404()
    now = datetime.utcnow()
    since = now - timedelta(days=30)
    logins = AuditLog.query.filter(or_(AuditLog.user_id == uid, AuditLog.target_id == uid),
                                   AuditLog.action.in_(('LOGIN', 'LOGOUT', 'LOGIN_FAILED', 'ACCOUNT_LOCKED',
                                                        'PASSWORD_SET', 'REAUTHENTICATED', 'REAUTH_FAILED'))
                                   ).order_by(AuditLog.created_at.desc()).limit(25).all()
    activity_q = AuditLog.query.filter(AuditLog.user_id == uid).order_by(AuditLog.created_at.desc())
    activity, pg = _paginate(activity_q, 20)
    about = AuditLog.query.filter(AuditLog.target_type == 'User', AuditLog.target_id == uid,
                                  AuditLog.user_id != uid).order_by(AuditLog.created_at.desc()).limit(20).all()
    # Graphiques : actions / jour (30 j) et répartition par type
    per_day = dict(db.session.query(func.date(AuditLog.created_at), func.count()).filter(
        AuditLog.user_id == uid, AuditLog.created_at >= since).group_by(func.date(AuditLog.created_at)).all())
    days = [(since + timedelta(days=i + 1)).date().isoformat() for i in range(30)]
    per_cat = dict(db.session.query(AuditLog.category, func.count()).filter(
        AuditLog.user_id == uid, AuditLog.created_at >= since).group_by(AuditLog.category).all())
    convs = Conversation.query.filter_by(assigned_admin_id=uid)
    workload = {
        'open': convs.filter(Conversation.status.in_(('new', 'open', 'pending'))).count(),
        'waiting': convs.filter(Conversation.status.in_(('new', 'open')), Conversation.last_sender == 'client').count(),
        'clients': User.query.filter_by(role='client', assigned_admin_id=uid).count(),
        'replies': AuditLog.query.filter(AuditLog.user_id == uid, AuditLog.action == 'CONVERSATION_REPLIED',
                                         AuditLog.created_at >= since).count(),
        'bookings': AuditLog.query.filter(AuditLog.user_id == uid, AuditLog.category == 'reservation',
                                          AuditLog.created_at >= since).count(),
        'payments': AuditLog.query.filter(AuditLog.user_id == uid, AuditLog.category == 'payment',
                                          AuditLog.created_at >= since).count(),
        'failed': AuditLog.query.filter(or_(AuditLog.user_id == uid, AuditLog.target_label == user.username),
                                        AuditLog.action.in_(('LOGIN_FAILED', 'REAUTH_FAILED')),
                                        AuditLog.created_at >= since).count(),
    }
    resp = [c.first_response_seconds for c in Conversation.query.filter(
        Conversation.first_response_by_id == uid, Conversation.first_client_message_at >= since).all()
        if c.first_response_seconds is not None]
    workload['avg_response'] = sum(resp) // len(resp) if resp else None
    perms = sorted(role_permissions(user.role))
    return render_template('superadmin/admin_detail.html', user=user, logins=logins, activity=activity, pg=pg,
                           about=about, chart_days=[f'{d[8:10]}/{d[5:7]}' for d in days], chart_counts=[per_day.get(d, 0) for d in days],
                           per_cat=per_cat, workload=workload, perms=perms, perm_labels=PERMISSION_LABELS,
                           roles=role_labels(), modules=MODULES, status_labels=STATUS_LABELS,
                           last_super_admin=(user.role == 'super_admin' and _active_super_admins(user.id) == 0))


# ── Modification ─────────────────────────────────────────────────────────────
@superadmin_bp.route('/superadmin/admins/<int:uid>/edit', methods=['GET', 'POST'])
@login_required
@super_admin_only
def admin_edit(uid):
    user = _staff_query().filter(User.id == uid, User.is_deleted == False).first_or_404()  # noqa: E712
    errors = []
    if request.method == 'POST':
        _check_csrf()
        values = _form_values(user)
        if user.id == current_user.id:
            values['role'] = user.role                     # jamais son propre rôle
        errors = _validate(values, user)
        role_change = values['role'] != user.role
        if role_change and user.role == 'super_admin' and _active_super_admins(user.id) == 0:
            errors.append('Impossible : c’est le dernier Super Admin actif. Nommez-en un autre d’abord.')
        if role_change and 'super_admin' in (values['role'], user.role):
            from app.services.security_hooks import recently_authenticated
            if not recently_authenticated():
                flash('Changer un rôle Super Admin est une action sensible : confirmez votre mot de passe.', 'warning')
                return redirect(url_for('superadmin.confirm_password', next=url_for('superadmin.admin_edit', uid=uid)))
        if not errors:
            changes = {}
            for field in ('real_name', 'email', 'phone', 'role', 'agency_id'):
                old = getattr(user, field)
                new = values[field] or None
                if (old or None) != new:
                    changes[field] = [old, new]
                    setattr(user, field, new)
            if sorted(user.modules) != sorted(values['modules']):
                changes['modules'] = [user.modules, values['modules']]
                user.admin_modules = json.dumps(values['modules'])
            if changes:
                db.session.info['skip_activity'] = True
                db.session.flush()
                db.session.info.pop('skip_activity', None)
                record('PERMISSION_CHANGED' if 'role' in changes else 'ADMIN_UPDATED',
                       'permission' if 'role' in changes else 'client', 'User', user.id, user.real_name or user.username,
                       meta={'modifications': changes}, commit=False)
                db.session.commit()
                flash('Administrateur mis à jour.', 'success')
            else:
                flash('Aucune modification.', 'info')
            return redirect(url_for('superadmin.admin_detail', uid=uid))
    values = {'real_name': user.real_name, 'email': user.email, 'phone': user.phone, 'role': user.role,
              'agency_id': user.agency_id, 'modules': user.modules} if request.method == 'GET' or not errors else _form_values(user)
    return render_template('superadmin/admin_form.html', user=user, values=values, errors=errors, invite=None,
                           staff_roles=staff_roles(), modules=MODULES, agencies=_agencies())


@superadmin_bp.route('/superadmin/admins/<int:uid>/status', methods=['POST'])
@login_required
@super_admin_only
@csrf_protect
@recent_auth_required
def admin_status(uid):
    user = _staff_query().filter(User.id == uid).first_or_404()
    action = request.form.get('action')
    reason = (request.form.get('reason') or '').strip()[:255] or None
    if user.id == current_user.id:
        flash('Vous ne pouvez pas modifier le statut de votre propre compte.', 'danger')
        return redirect(url_for('superadmin.admin_detail', uid=uid))
    if action in ('suspend', 'deactivate') and user.role == 'super_admin' and _active_super_admins(user.id) == 0:
        flash('Impossible : c’est le dernier Super Admin actif.', 'danger')
        return redirect(url_for('superadmin.admin_detail', uid=uid))
    labels = {'suspend': 'ADMIN_SUSPENDED', 'activate': 'ADMIN_ACTIVATED', 'deactivate': 'ADMIN_DEACTIVATED'}
    if action not in labels:
        abort(400)
    before = user.status_key
    if action == 'suspend':
        user.is_suspended = True
    elif action == 'activate':
        user.is_suspended = False
        user.is_deleted = False
        if user.account_status == 'deactivated':
            user.account_status = None
        user.locked_until = None
    else:
        user.is_suspended = True
        user.account_status = 'deactivated'
        # Conversations actives remises en file (non assignées) : aucun client oublié
        for c in Conversation.query.filter(Conversation.assigned_admin_id == user.id,
                                           Conversation.status.in_(('new', 'open', 'pending'))).all():
            c.assigned_admin_id = None
    user.status_reason = reason
    db.session.info['skip_activity'] = True
    db.session.flush()
    db.session.info.pop('skip_activity', None)
    record(labels[action], 'permission', 'User', user.id, user.real_name or user.username,
           meta={'avant': before, 'apres': user.status_key, 'motif': reason}, commit=False)
    db.session.commit()
    flash({'suspend': 'Compte suspendu : la session en cours est fermée.',
           'activate': 'Compte réactivé.',
           'deactivate': 'Compte désactivé. Son historique est conservé ; ses conversations sont remises en file.'}[action],
          'success')
    return redirect(url_for('superadmin.admin_detail', uid=uid))


@superadmin_bp.route('/superadmin/admins/<int:uid>/reset-access', methods=['POST'])
@login_required
@super_admin_only
@csrf_protect
@recent_auth_required
def admin_reset_access(uid):
    user = _staff_query().filter(User.id == uid, User.is_deleted == False).first_or_404()  # noqa: E712
    link = issue_setup_link(user)
    user.locked_until = None
    sent = _send_setup_email(user, link, kind='reset')
    record('ADMIN_ACCESS_RESET', 'security', 'User', user.id, user.real_name or user.username,
           meta={'email_envoye': sent}, commit=False)
    db.session.commit()
    return render_template('superadmin/admin_invite.html', user=user, link=link, sent=sent, reset=True)


# ── Rôles ────────────────────────────────────────────────────────────────────
@superadmin_bp.route('/superadmin/roles', methods=['GET', 'POST'])
@login_required
@super_admin_only
def roles():
    roles_all = {r.key: r for r in Role.query.order_by(Role.is_system.desc(), Role.name).all()}
    staff = [r for k, r in roles_all.items() if r.is_staff and k != 'super_admin']
    if request.method == 'POST':
        _check_csrf()
        from app.services.security_hooks import recently_authenticated
        if not recently_authenticated():
            flash('Modifier les permissions est une action sensible : confirmez votre mot de passe.', 'warning')
            return redirect(url_for('superadmin.confirm_password', next=url_for('superadmin.roles')))
        changes = {}
        for r in staff:
            before = role_permissions(r.key)
            after = set(request.form.getlist(f'perm_{r.key}'))
            if before != after:
                set_role_permissions(r.key, after)
                changes[r.key] = {'ajoutees': sorted(after - before), 'retirees': sorted(before - after)}
        for key, diff in changes.items():
            record('ROLE_PERMISSIONS_UPDATED', 'permission', 'Role', roles_all[key].id, roles_all[key].name,
                   meta=diff, commit=False)
        db.session.commit()
        flash('Permissions mises à jour.' if changes else 'Aucune modification.', 'success' if changes else 'info')
        return redirect(url_for('superadmin.roles'))
    matrix = {r.key: role_permissions(r.key) for r in staff}
    counts = dict(db.session.query(User.role, func.count()).filter(User.is_deleted == False).group_by(User.role).all())  # noqa: E712
    return render_template('superadmin/roles.html', permissions=PERMISSIONS, matrix=matrix, staff=staff,
                           counts=counts, all_roles=list(roles_all.values()))


@superadmin_bp.route('/superadmin/roles/new', methods=['POST'])
@login_required
@super_admin_only
@csrf_protect
@recent_auth_required
def role_create():
    name = (request.form.get('name') or '').strip()[:80]
    desc = (request.form.get('description') or '').strip()[:255] or None
    copy_from = request.form.get('copy_from') or ''
    key = re.sub(r'[^a-z0-9]+', '_', name.lower().encode('ascii', 'ignore').decode()).strip('_')[:28]
    if len(name) < 3 or not key:
        flash('Nom de rôle trop court.', 'danger')
    elif Role.query.filter(or_(Role.key == key, func.lower(Role.name) == name.lower())).first() or key in ('super_admin', 'client'):
        flash('Un rôle porte déjà ce nom.', 'danger')
    else:
        role = Role(key=key, name=name, description=desc, is_system=False, is_staff=True, created_by_id=current_user.id)
        db.session.add(role)
        db.session.flush()
        perms = role_permissions(copy_from) if copy_from and copy_from != 'super_admin' else {'dashboard.view'}
        set_role_permissions(key, perms)
        record('ROLE_CREATED', 'permission', 'Role', role.id, name, meta={'copie_de': copy_from or None,
                                                                            'permissions': sorted(perms)}, commit=False)
        db.session.commit()
        flash(f'Rôle « {name} » créé. Ajustez ses permissions dans le tableau.', 'success')
    return redirect(url_for('superadmin.roles'))


@superadmin_bp.route('/superadmin/roles/<int:rid>/update', methods=['POST'])
@login_required
@super_admin_only
@csrf_protect
def role_update(rid):
    role = db.get_or_404(Role, rid)
    if role.key == 'super_admin':
        abort(403)
    name = (request.form.get('name') or '').strip()[:80]
    desc = (request.form.get('description') or '').strip()[:255] or None
    if len(name) >= 3 and (name, desc) != (role.name, role.description):
        before = {'nom': role.name, 'description': role.description}
        role.name, role.description = name, desc
        record('ROLE_UPDATED', 'permission', 'Role', role.id, name, meta={'avant': before}, commit=False)
        db.session.commit()
        flash('Rôle mis à jour.', 'success')
    return redirect(url_for('superadmin.roles'))


@superadmin_bp.route('/superadmin/roles/<int:rid>/delete', methods=['POST'])
@login_required
@super_admin_only
@csrf_protect
@recent_auth_required
def role_delete(rid):
    role = db.get_or_404(Role, rid)
    users = User.query.filter(User.role == role.key, User.is_deleted == False).count()  # noqa: E712
    if role.is_system:
        flash('Les rôles système ne peuvent pas être supprimés.', 'danger')
    elif users:
        flash(f'{users} compte(s) ont encore ce rôle : changez-leur de rôle avant de le supprimer.', 'danger')
    else:
        RolePermission.query.filter_by(role=role.key).delete()
        record('ROLE_DELETED', 'permission', 'Role', role.id, role.name, commit=False)
        db.session.delete(role)
        db.session.commit()
        flash('Rôle supprimé.', 'success')
    return redirect(url_for('superadmin.roles'))
