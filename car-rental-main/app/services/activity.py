"""Journal d'activité des administrateurs (table `audit_log`, immuable) + notifications Super Admin.

- `record()` : écriture explicite d'une action (connexion, profil client, conversation…).
- Écouteur ORM : toute création / modification faite par un membre du staff sur les réservations,
  missions, contrats, paiements, factures et comptes est journalisée automatiquement.
- Jamais de mot de passe, jeton ou contenu de message dans le journal.
"""
import json
from datetime import datetime

from flask import has_request_context, request
from flask_login import current_user, user_logged_in, user_logged_out
from sqlalchemy import event, inspect as sa_inspect
from sqlalchemy.orm import Session

from app import db

SENSITIVE = {'password_hash', 'firebase_uid', 'auth0_id', 'reset_token_hash', 'reset_token_expiry',
             'verification_token_hash', 'verification_token_expiry', 'profile_picture', 'two_fa_secret',
             'last_login_ip'}
STAFF_ROLES = {'super_admin', 'admin_agence', 'finance_officer', 'teller'}

CATEGORY_LABELS = {
    'auth': 'Connexions', 'security': 'Sécurité', 'client': 'Clients', 'conversation': 'Conversations',
    'reservation': 'Réservations', 'mission': 'Missions & véhicules', 'contract': 'Contrats',
    'payment': 'Paiements', 'invoice': 'Factures', 'permission': 'Rôles & permissions',
    'settings': 'Paramètres', 'other': 'Autres',
}

ACTION_LABELS = {
    'LOGIN': 'Connexion', 'LOGOUT': 'Déconnexion', 'LOGIN_FAILED': 'Échec de connexion',
    'CLIENT_CREATED': 'Client créé', 'CLIENT_UPDATED': 'Profil client modifié',
    'CLIENT_USERNAME_CHANGED': 'Nom d’utilisateur modifié', 'CLIENT_NAME_CHANGED': 'Nom du client modifié',
    'CLIENT_ASSIGNED': 'Client assigné',
    'CONVERSATION_OPENED': 'Conversation ouverte', 'CONVERSATION_REPLIED': 'Réponse envoyée',
    'CONVERSATION_ASSIGNED': 'Conversation assignée', 'CONVERSATION_STATUS': 'Statut de conversation',
    'CONVERSATION_NOTE': 'Note interne ajoutée',
    'RESERVATION_CREATED': 'Réservation créée', 'RESERVATION_UPDATED': 'Réservation modifiée',
    'RESERVATION_CANCELLED': 'Réservation annulée',
    'MISSION_CREATED': 'Mission créée', 'MISSION_UPDATED': 'Mission modifiée', 'MISSION_CANCELLED': 'Mission annulée',
    'VEHICLE_ASSIGNED': 'Véhicule / chauffeur assigné',
    'CONTRACT_CREATED': 'Contrat créé', 'CONTRACT_UPDATED': 'Contrat modifié',
    'CONTRACT_TERMINATED': 'Contrat résilié', 'CONTRACT_CANCELLED': 'Contrat annulé',
    'PAYMENT_RECORDED': 'Paiement enregistré', 'PAYMENT_ADJUSTED': 'Paiement ajusté',
    'INVOICE_CREATED': 'Facture créée', 'INVOICE_UPDATED': 'Facture modifiée',
    'STAFF_CREATED': 'Compte staff créé', 'PERMISSION_CHANGED': 'Rôle / permissions modifiés',
    'ROLE_PERMISSIONS_UPDATED': 'Permissions d’un rôle modifiées', 'SETTINGS_UPDATED': 'Paramètres modifiés',
    'STAFF_UPDATED': 'Compte staff modifié', 'ADMIN_CREATED': 'Administrateur créé', 'ADMIN_UPDATED': 'Administrateur modifié',
    'ADMIN_SUSPENDED': 'Administrateur suspendu', 'ADMIN_ACTIVATED': 'Administrateur réactivé',
    'ADMIN_DEACTIVATED': 'Administrateur désactivé', 'ADMIN_ACCESS_RESET': 'Accès réinitialisé',
    'ROLE_CREATED': 'Rôle créé', 'ROLE_UPDATED': 'Rôle modifié', 'ROLE_DELETED': 'Rôle supprimé',
    'PASSWORD_SET': 'Mot de passe défini', 'ACCOUNT_LOCKED': 'Compte verrouillé (échecs de connexion)',
    'REAUTHENTICATED': 'Identité confirmée', 'REAUTH_FAILED': 'Échec de confirmation d’identité',
    'CLIENT_SUSPENDED': 'Client suspendu', 'CLIENT_REACTIVATED': 'Client réactivé',
    'CLIENT_NAME_SUGGESTION': 'Suggestion de nom recherchée', 'CLIENTS_EXPORTED': 'Export des clients',
    'REPORT_EXPORTED': 'Export de rapport', 'AUDIT_EXPORTED': 'Export du journal d’audit',
    'ANNOUNCEMENT_SENT': 'Annonce envoyée', 'IMPROVEMENT_CREATED': 'Tâche d’amélioration créée',
    'IMPROVEMENT_UPDATED': 'Tâche d’amélioration mise à jour', 'NOTIFICATIONS_DELETED_ALL': 'Notifications supprimées',
    'RATING_REPLIED': 'Réponse à un avis', 'RATING_STATUS': 'Statut d’un avis', 'RATING_HIDDEN': 'Avis masqué',
    'RATING_SHOWN': 'Avis réaffiché', 'APARTMENT_STAY_BOOKED': 'Séjour réservé',
    'RENTAL_REQUEST_CREATED': 'Demande de location reçue', 'RENTAL_REQUEST_CONVERTED': 'Demande convertie en mission',
    'LOCATION_CREATED': 'Lieu ajouté', 'LOCATION_UPDATED': 'Lieu modifié',
    'PRICING_CREATED': 'Tarif ajouté', 'PRICING_UPDATED': 'Tarif modifié',
}


def action_label(action):
    return ACTION_LABELS.get(action, action.replace('_', ' ').capitalize())


def _actor():
    try:
        if has_request_context() and current_user.is_authenticated:
            return current_user._get_current_object()
    except Exception:
        pass
    return None


def _actor_name(u):
    return (getattr(u, 'real_name', None) or getattr(u, 'username', None) or f'#{u.id}')[:120] if u else None


def _ip():
    try:
        if has_request_context():
            return (request.headers.get('X-Forwarded-For', '').split(',')[0].strip() or request.remote_addr or '')[:50]
    except Exception:
        pass
    return None


def _row(action, category, target_type=None, target_id=None, target_label=None, meta=None, actor=None):
    actor = actor if actor is not None else _actor()
    return {
        'user_id': actor.id if actor else None,
        'actor_name': _actor_name(actor),
        'actor_role': getattr(actor, 'role', None),
        'action': action[:100],
        'category': category,
        'target_type': target_type,
        'target_id': target_id if isinstance(target_id, int) else None,
        'target_label': (str(target_label)[:160] if target_label else None),
        'details': json.dumps(meta, ensure_ascii=False, default=str)[:4000] if meta else None,
        'ip_address': _ip(),
        'created_at': datetime.utcnow(),
    }


def record(action, category, target_type=None, target_id=None, target_label=None, meta=None, actor=None,
           notify=None, link=None, commit=True):
    """Écrit une ligne d'audit. `notify` = (titre, message, type) pour prévenir le Super Admin."""
    from app.models import AuditLog
    db.session.execute(AuditLog.__table__.insert().values(
        **_row(action, category, target_type, target_id, target_label, meta, actor)))
    if notify:
        title, message, ntype = notify
        notify_super_admin(title, message, category, ntype, link, commit=False)
    if commit:
        db.session.commit()


def notify_super_admin(title, message, category, ntype='info', link=None, commit=True, user_id=None):
    """Notification visible par le Super Admin (ou par un utilisateur précis si `user_id`)."""
    from app.models import SystemNotification
    db.session.add(SystemNotification(
        title=title[:150], message=(message or title)[:2000], type=ntype, category=category,
        role_target=None if user_id else 'super_admin', user_id=user_id, link=link))
    if commit:
        db.session.commit()


# ── Connexions ───────────────────────────────────────────────────────────────
def _on_login(sender, user, **extra):
    try:
        if user.role in STAFF_ROLES:
            record('LOGIN', 'auth', 'User', user.id, _actor_name(user), actor=user)
    except Exception:
        db.session.rollback()


def _on_logout(sender, user, **extra):
    try:
        if user and getattr(user, 'role', None) in STAFF_ROLES:
            record('LOGOUT', 'auth', 'User', user.id, _actor_name(user), actor=user)
    except Exception:
        db.session.rollback()


def record_failed_login(identifier):
    """Échec de connexion : seul l'identifiant saisi (tronqué) est conservé, jamais le mot de passe."""
    try:
        from app.models import AuditLog
        ident = (identifier or '')[:60]
        record('LOGIN_FAILED', 'security', 'User', None, ident, meta={'identifiant': ident},
               commit=False)
        # Alerte si 5 échecs ou plus en 15 minutes pour le même identifiant
        since = datetime.utcnow().timestamp() - 900
        recent = AuditLog.query.filter(AuditLog.action == 'LOGIN_FAILED', AuditLog.target_label == ident,
                                       AuditLog.created_at >= datetime.utcfromtimestamp(since)).count()
        if recent in (5, 10, 20):
            notify_super_admin('🔐 Tentatives de connexion répétées',
                               f'{recent} échecs de connexion en 15 minutes pour « {ident} ».',
                               'security', 'danger', commit=False)
        db.session.commit()
    except Exception:
        db.session.rollback()


# ── Écouteur ORM : actions du staff sur les données métier ───────────────────
def _tracked():
    from app.models import ApartmentBooking, Booking, Contract, ContractPayment, Invoice, Payment, Trip, User
    return {
        Booking: ('reservation', 'Réservation', lambda o: o.booking_code or f'#{o.id}'),
        ApartmentBooking: ('reservation', 'Séjour', lambda o: o.booking_ref or f'#{o.id}'),
        Trip: ('mission', 'Mission', lambda o: f'Mission #{o.id}'),
        Contract: ('contract', 'Contrat', lambda o: o.reference or f'#{o.id}'),
        ContractPayment: ('payment', 'Paiement contrat', lambda o: f'{o.amount:,.0f} FCFA'.replace(',', ' ') if o.amount else f'#{o.id}'),
        Payment: ('payment', 'Paiement', lambda o: f'{o.amount:,.0f} FCFA'.replace(',', ' ') if getattr(o, 'amount', None) else f'#{o.id}'),
        Invoice: ('invoice', 'Facture', lambda o: getattr(o, 'number', None) or getattr(o, 'reference', None) or f'#{o.id}'),
        User: ('client', 'Compte', lambda o: o.real_name or o.username),
    }


def _changes(obj):
    out = {}
    state = sa_inspect(obj)
    for attr in state.mapper.column_attrs:
        key = attr.key
        if key in SENSITIVE or 'token' in key or 'password' in key:
            continue
        hist = state.attrs[key].history
        if not hist.has_changes():
            continue
        old = hist.deleted[0] if hist.deleted else None
        new = hist.added[0] if hist.added else None
        if old == new:
            continue
        def short(v):
            v = v.isoformat() if hasattr(v, 'isoformat') else v
            return (v[:80] + '…') if isinstance(v, str) and len(v) > 80 else v
        out[key] = [short(old), short(new)]
    return out


def _classify(obj, cat, changes, is_new):
    from app.models import ApartmentBooking, Booking, Contract, ContractPayment, Invoice, Payment, Trip, User
    status = changes.get('status', [None, None])[1]
    if isinstance(obj, (Booking, ApartmentBooking)):
        if is_new:
            return 'RESERVATION_CREATED'
        return 'RESERVATION_CANCELLED' if status == 'cancelled' else 'RESERVATION_UPDATED'
    if isinstance(obj, Trip):
        if is_new:
            return 'MISSION_CREATED'
        if status == 'cancelled':
            return 'MISSION_CANCELLED'
        return 'VEHICLE_ASSIGNED' if ({'bus_id', 'driver_id'} & set(changes)) else 'MISSION_UPDATED'
    if isinstance(obj, Contract):
        if is_new:
            return 'CONTRACT_CREATED'
        if status == 'terminated':
            return 'CONTRACT_TERMINATED'
        return 'CONTRACT_CANCELLED' if status == 'cancelled' else 'CONTRACT_UPDATED'
    if isinstance(obj, (ContractPayment, Payment)):
        return 'PAYMENT_RECORDED' if is_new else 'PAYMENT_ADJUSTED'
    if isinstance(obj, Invoice):
        return 'INVOICE_CREATED' if is_new else 'INVOICE_UPDATED'
    if isinstance(obj, User):
        if 'role' in changes:
            return 'PERMISSION_CHANGED'
        if is_new:
            return 'CLIENT_CREATED' if obj.role == 'client' else 'STAFF_CREATED'
        return 'CLIENT_UPDATED' if obj.role == 'client' else 'STAFF_UPDATED'
    return f'{cat.upper()}_CHANGED'


NOTIFY_ACTIONS = {
    'RESERVATION_CREATED': 'info', 'RESERVATION_CANCELLED': 'warning', 'MISSION_CANCELLED': 'warning',
    'CONTRACT_CREATED': 'info', 'CONTRACT_TERMINATED': 'warning', 'CONTRACT_CANCELLED': 'warning',
    'PAYMENT_RECORDED': 'success', 'PAYMENT_ADJUSTED': 'warning', 'PERMISSION_CHANGED': 'danger',
    'STAFF_CREATED': 'warning', 'CLIENT_UPDATED': 'info',
}


@event.listens_for(Session, 'before_flush')
def _collect(session, flush_context, instances):
    actor = _actor()
    if not actor or actor.role not in STAFF_ROLES or session.info.get('skip_activity'):
        return
    tracked = _tracked()
    pending = session.info.setdefault('activity_pending', [])
    for obj in list(session.new) + list(session.dirty):
        spec = tracked.get(type(obj))
        if not spec:
            continue
        is_new = obj in session.new
        changes = {} if is_new else _changes(obj)
        if not is_new and not changes:
            continue
        if not is_new and set(changes) <= {'updated_at', 'last_seen_at', 'last_login', 'loyalty_points'}:
            continue
        pending.append((obj, is_new, changes))


@event.listens_for(Session, 'after_flush')
def _write(session, flush_context):
    pending = session.info.pop('activity_pending', None)
    if not pending:
        return
    from app.models import AuditLog, SystemNotification
    actor = _actor()
    tracked = _tracked()
    conn = session.connection()
    for obj, is_new, changes in pending:
        cat, label, describe = tracked[type(obj)]
        try:
            target_label = f'{label} {describe(obj)}'
        except Exception:
            target_label = f'{label} #{getattr(obj, "id", "?")}'
        action = _classify(obj, cat, changes, is_new)
        if action == 'PERMISSION_CHANGED':
            cat = 'permission'
        conn.execute(AuditLog.__table__.insert().values(**_row(
            action, cat, type(obj).__name__, getattr(obj, 'id', None), target_label,
            {'modifications': changes} if changes else None, actor)))
        level = NOTIFY_ACTIONS.get(action)
        if level and actor and actor.role != 'super_admin':
            conn.execute(SystemNotification.__table__.insert().values(
                title=f'{action_label(action)} — {target_label}'[:150],
                message=f'Par {_actor_name(actor)}' + (f' · champs : {", ".join(list(changes)[:6])}' if changes else ''),
                type=level, category=cat, role_target='super_admin', is_read=False, is_archived=False,
                is_deleted=False, created_at=datetime.utcnow()))


def init_activity(app):
    user_logged_in.connect(_on_login, app)
    user_logged_out.connect(_on_logout, app)
