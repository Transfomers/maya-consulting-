"""Contrôle d'accès par rôles (RBAC), centralisé et vérifié côté serveur.

- Rôles en base (`role`) : rôles système + rôles créés par le Super Admin.
- Permissions en base (`role_permission`) ; le Super Admin a toujours tout.
- `enforce_permissions()` (avant chaque requête) associe CHAQUE route d'administration à une
  permission : masquer un bouton ne suffit pas, l'accès est refusé côté serveur (403).
"""
import re
from functools import wraps

from flask import abort, flash, jsonify, redirect, render_template, request, url_for
from flask_login import current_user

from app import db

# ── Catalogue des permissions ────────────────────────────────────────────────
PERMISSIONS = {
    'Tableau de bord & rapports': [
        ('dashboard.view', 'Voir le tableau de bord'),
        ('reports.view', 'Voir les rapports et statistiques'),
        ('reports.export', 'Exporter des rapports (CSV / PDF)'),
    ],
    'Clients': [
        ('clients.view_assigned', 'Voir ses clients'),
        ('clients.view_all', 'Voir tous les clients'),
        ('clients.create', 'Créer des clients'),
        ('clients.edit', 'Modifier les profils clients'),
        ('clients.edit_username', 'Modifier le nom d’utilisateur d’un client'),
        ('clients.suspend', 'Suspendre / réactiver un client'),
        ('clients.delete', 'Supprimer un client'),
    ],
    'Conversations': [
        ('conversations.view_assigned', 'Voir ses conversations assignées'),
        ('conversations.view_unassigned', 'Voir les conversations non assignées'),
        ('conversations.view_all', 'Voir toutes les conversations'),
        ('conversations.reply', 'Répondre aux clients'),
        ('conversations.assign', 'Assigner / réassigner des conversations'),
        ('conversations.notes', 'Ajouter des notes internes'),
    ],
    'Réservations & missions': [
        ('bookings.view', 'Voir les réservations et missions'),
        ('bookings.create', 'Créer des réservations / missions'),
        ('bookings.update', 'Modifier des réservations / missions'),
        ('bookings.cancel', 'Annuler des réservations / missions'),
        ('bookings.delete', 'Supprimer des réservations / missions'),
    ],
    'Véhicules & chauffeurs': [
        ('vehicles.view', 'Voir la flotte'), ('vehicles.create', 'Ajouter des véhicules'),
        ('vehicles.update', 'Modifier des véhicules'), ('vehicles.delete', 'Supprimer des véhicules'),
        ('drivers.view', 'Voir les chauffeurs'), ('drivers.create', 'Ajouter des chauffeurs'),
        ('drivers.update', 'Modifier des chauffeurs'), ('drivers.delete', 'Supprimer des chauffeurs'),
    ],
    'Résidences meublées': [
        ('listings.view', 'Voir les biens et séjours'), ('listings.create', 'Ajouter des biens / séjours'),
        ('listings.update', 'Modifier des biens / séjours'), ('listings.delete', 'Supprimer des biens'),
    ],
    'Contrats & factures': [
        ('contracts.view', 'Voir les contrats'), ('contracts.create', 'Créer des contrats'),
        ('contracts.update', 'Modifier / faire évoluer des contrats'), ('contracts.delete', 'Supprimer des pièces de contrat'),
        ('invoices.view', 'Voir les factures'), ('invoices.create', 'Créer des factures'),
        ('invoices.update', 'Modifier des factures'), ('invoices.delete', 'Supprimer des factures'),
    ],
    'Paiements & finances': [
        ('payments.view', 'Voir les paiements et finances'),
        ('payments.create', 'Enregistrer des paiements'),
        ('payments.refund', 'Annuler / rembourser un paiement'),
    ],
    'Avis clients': [('ratings.view', 'Voir les avis'), ('ratings.update', 'Répondre / traiter les avis')],
    'Administration': [
        ('agencies.view', 'Voir les agences'), ('agencies.manage', 'Gérer les agences'),
        ('settings.manage', 'Gérer les paramètres de la plateforme'),
        ('audit_logs.view', 'Voir le journal d’activité'),
        ('legacy.access', 'Anciens modules transport / colis (masqués)'),
    ],
}
ALL_PERMISSIONS = [p for group in PERMISSIONS.values() for p, _ in group]
PERMISSION_LABELS = {p: label for group in PERMISSIONS.values() for p, label in group}

# Gestion des administrateurs et des rôles : Super Admin uniquement (jamais délégable).
SUPER_ADMIN_ONLY = 'Super Admin uniquement'

SYSTEM_ROLES = [
    # key, nom, description, staff
    ('super_admin', 'Super Admin', 'Contrôle total de la plateforme', True),
    ('admin_agence', 'Administrateur', 'Gestion opérationnelle complète de l’agence', True),
    ('finance_officer', 'Responsable financier', 'Paiements, factures, contrats et rapports', True),
    ('teller', 'Guichetier', 'Réservations et encaissements', True),
    ('driver', 'Chauffeur', 'Pas d’accès à l’administration', False),
    ('client', 'Client', 'Espace client du site', False),
]
SUGGESTED_ROLES = [
    ('operations_manager', 'Responsable des opérations', 'Missions, flotte, chauffeurs, réservations'),
    ('booking_manager', 'Gestionnaire des réservations', 'Réservations, séjours, clients'),
    ('customer_support', 'Service client', 'Conversations, clients, avis'),
    ('content_manager', 'Gestionnaire de contenu', 'Biens meublés et flotte publiés sur le site'),
    ('analyst', 'Analyste (lecture seule)', 'Consultation des tableaux de bord et rapports'),
]

_VIEW = {p for p in ALL_PERMISSIONS if p.endswith('.view')}
DEFAULTS = {
    'admin_agence': set(ALL_PERMISSIONS) - {'clients.view_all', 'clients.edit_username', 'clients.delete',
                                            'conversations.view_all', 'conversations.assign', 'payments.refund',
                                            'agencies.manage', 'settings.manage', 'legacy.access'},
    'finance_officer': {'dashboard.view', 'reports.view', 'reports.export', 'payments.view', 'payments.create',
                        'invoices.view', 'invoices.create', 'invoices.update', 'contracts.view', 'bookings.view',
                        'clients.view_assigned'},
    'teller': {'dashboard.view', 'bookings.view', 'bookings.create', 'bookings.update', 'payments.view',
               'payments.create', 'clients.view_assigned', 'clients.create'},
    'operations_manager': {'dashboard.view', 'reports.view', 'bookings.view', 'bookings.create', 'bookings.update',
                           'bookings.cancel', 'vehicles.view', 'vehicles.create', 'vehicles.update', 'drivers.view',
                           'drivers.create', 'drivers.update', 'clients.view_assigned', 'conversations.view_assigned',
                           'conversations.reply', 'conversations.notes'},
    'booking_manager': {'dashboard.view', 'bookings.view', 'bookings.create', 'bookings.update', 'bookings.cancel',
                        'listings.view', 'listings.update', 'clients.view_assigned', 'clients.create', 'clients.edit',
                        'conversations.view_assigned', 'conversations.view_unassigned', 'conversations.reply',
                        'conversations.notes', 'payments.view', 'payments.create'},
    'customer_support': {'dashboard.view', 'clients.view_assigned', 'clients.edit', 'conversations.view_assigned',
                         'conversations.view_unassigned', 'conversations.reply', 'conversations.notes',
                         'ratings.view', 'ratings.update', 'bookings.view'},
    'content_manager': {'dashboard.view', 'listings.view', 'listings.create', 'listings.update', 'vehicles.view',
                        'vehicles.update'},
    'analyst': {p for p in _VIEW if p not in ('legacy.access',)} | {'reports.view', 'clients.view_all'},
}


# ── Rôles ────────────────────────────────────────────────────────────────────
def seed_roles(bind=None):
    """Crée les rôles système et suggérés manquants (configuration, aucune donnée métier)."""
    from sqlalchemy import inspect as sa_inspect, text
    conn = bind or db.engine
    def run(c):
        if 'role' not in sa_inspect(c).get_table_names():
            return
        have = {r[0] for r in c.execute(text('SELECT key FROM role'))}
        for key, name, desc, staff in SYSTEM_ROLES:
            if key not in have:
                c.execute(text('INSERT INTO role (key, name, description, is_system, is_staff, created_at) '
                               'VALUES (:k, :n, :d, 1, :s, CURRENT_TIMESTAMP)'), {'k': key, 'n': name, 'd': desc, 's': staff})
        for key, name, desc in SUGGESTED_ROLES:
            if key not in have:
                c.execute(text('INSERT INTO role (key, name, description, is_system, is_staff, created_at) '
                               'VALUES (:k, :n, :d, 0, 1, CURRENT_TIMESTAMP)'), {'k': key, 'n': name, 'd': desc})
    if hasattr(conn, 'begin') and not hasattr(conn, 'in_transaction'):
        with conn.begin() as c:
            run(c)
    else:
        run(conn)


_role_cache = {}


def _roles():
    """{key: Role} (mis en cache pour la requête en cours)."""
    from flask import g, has_app_context
    from app.models import Role
    if has_app_context():
        if '_roles_cache' not in g:
            try:
                g._roles_cache = {r.key: r for r in Role.query.all()}
            except Exception:
                db.session.rollback()
                g._roles_cache = {}
        return g._roles_cache
    return {}


def staff_roles():
    """{key: nom} des rôles ayant accès à l'administration (hors Super Admin)."""
    roles = _roles()
    if not roles:
        return {k: n for k, n, _, s in SYSTEM_ROLES if s and k != 'super_admin'}
    return {k: r.name for k, r in sorted(roles.items(), key=lambda x: (not x[1].is_system, x[1].name))
            if r.is_staff and k != 'super_admin'}


def role_labels():
    labels = {k: n for k, n, _, _ in SYSTEM_ROLES}
    labels.update({k: r.name for k, r in _roles().items()})
    return labels


def is_staff_role(role):
    if role in ('super_admin', 'admin_agence', 'finance_officer', 'teller'):
        return True
    r = _roles().get(role)
    return bool(r and r.is_staff)


# Compatibilité avec le code existant
STAFF_ROLES = {k: n for k, n, _, s in SYSTEM_ROLES if s and k != 'super_admin'}
ROLE_LABELS = {k: n for k, n, _, _ in SYSTEM_ROLES}


def role_permissions(role):
    from app.models import RolePermission
    if role == 'super_admin':
        return set(ALL_PERMISSIONS)
    from flask import g, has_app_context
    cache = g.setdefault('_perm_cache', {}) if has_app_context() else {}
    if role in cache:
        return cache[role]
    rows = RolePermission.query.filter_by(role=role).all()
    perms = {r.permission for r in rows if r.permission in ALL_PERMISSIONS} if rows else set(DEFAULTS.get(role, set()))
    cache[role] = perms
    return perms


def has_perm(user, perm):
    if not user or not getattr(user, 'is_authenticated', False) or not getattr(user, 'is_active', True):
        return False
    if user.role == 'super_admin':
        return True
    return perm in role_permissions(user.role)


def has_any(user, perms):
    return any(has_perm(user, p) for p in perms)


def set_role_permissions(role, perms):
    from app.models import RolePermission
    if role == 'super_admin' or not is_staff_role(role):
        raise ValueError('Rôle non modifiable')
    perms = {p for p in perms if p in ALL_PERMISSIONS}
    RolePermission.query.filter_by(role=role).delete()
    for p in sorted(perms) or ['!none']:
        db.session.add(RolePermission(role=role, permission=p))
    from flask import g
    g.pop('_perm_cache', None)


# ── Association route → permission ───────────────────────────────────────────
# (expression sur le nom de la route, module). Première règle qui correspond.
MODULE_RULES = [
    (r'^admin\.(notifications|notifications_feed|read_notification|read_all_notifications|archive_notification|'
     r'delete_notification|delete_all_notifications|profile|select_agency|api_visitor_checkin)$', None),
    (r'^superadmin\.(my_clients|client_detail|client_edit|client_suggest|notification_preferences)$', None),
    (r'^superadmin\.', 'superadmin'),
    (r'^admin\.(admins|add_admin|edit_admin|delete_admin|toggle_admin_status)$', 'superadmin'),
    (r'^admin\.dashboard$', 'dashboard'),
    (r'^admin\.export_dashboard', 'reports'),
    (r'^admin\.export_', 'reports'),
    (r'^admin\.(users|edit_user|delete_user|toggle_user_status|search_client)$', 'clients'),
    (r'^missions\.qa_create_client$|^invoices\.quick_client$', 'clients'),
    (r'^admin\.(chats|send_admin_chat_reply|get_admin_chat_messages|upload_chat_attachment|edit_admin_chat_message|'
     r'delete_admin_chat_message|clear_admin_chat_thread|manage_contact_message)$', 'conversations'),
    (r'^admin\.(buses|add_bus|edit_bus|delete_bus|toggle_bus_maintenance|toggle_bus_promo|bulk_buses)$', 'vehicles'),
    (r'^admin\.(drivers|add_driver|edit_driver|delete_driver)$', 'drivers'),
    (r'^admin\.(apartments|add_apartment|edit_apartment|delete_apartment|toggle_apartment_status)$', 'listings'),
    (r'^missions\.qa_create_apartment$', 'listings'),
    (r'^properties\.(add_property|edit_property)$', 'listings'),
    (r'^properties\.', 'listings_bookings'),
    (r'^admin\.(finance|pay_booking)$', 'payments'),
    (r'^missions\.(record_mission_payment|qa_record_payment)$', 'payments'),
    (r'^contracts\.(add_payment|void_payment)$', 'payments'),
    (r'^contracts\.', 'contracts'),
    (r'^invoices\.', 'invoices'),
    (r'^ratings\.', 'ratings'),
    (r'^admin\.(agencies|add_agency|edit_agency|delete_agency|toggle_agency_status)$', 'agencies'),
    (r'^admin\.(settings|email_logs|privacy_records)$', 'settings'),
    (r'^admin\.logs$', 'audit_logs'),
    (r'^admin\.(bookings|edit_booking|cancel_booking|calendar_view|calendar_events|conflict_check|change_seat)$', 'bookings'),
    (r'^admin\.(trips|add_trip|edit_trip|delete_trip|archive_trip|restore_trip|duplicate_trip|move_trip|'
     r'toggle_trip_status|update_trip_status|get_trip_detail|create_trip_api|delete_trip_api|cancel_trip_api|'
     r'search_trips)$', 'bookings'),
    (r'^missions\.', 'bookings'),
    (r'^trips\.', 'bookings'),
    (r'^admin\.', 'legacy'),       # colis, guichet, caisse, lignes, horaires, scanner, shifts : anciens modules
]
_COMPILED = [(re.compile(p), m) for p, m in MODULE_RULES]
CREATE_WORDS = ('add', 'create', 'new', 'duplicate', 'generate', 'convert', 'upload', 'bulk', 'record', 'qa_', 'renew', 'save')
DELETE_WORDS = ('delete', 'remove', 'clear')
CANCEL_WORDS = ('cancel', 'void', 'terminate')

STAFF_BLUEPRINTS = {'admin', 'missions', 'properties', 'contracts', 'invoices', 'ratings', 'superadmin', 'trips'}
PUBLIC_ENDPOINTS = {'properties.api_public_apartment_booking', 'properties.serve_public_asset',
                    'properties.serve_uploaded_file', 'ratings.internal_rating', 'invoices.public_pdf',
                    'contracts.api_availability', 'superadmin.setup_password'}


def required_permissions(endpoint, method):
    """Liste de permissions dont UNE suffit ; None = aucune vérification ; 'superadmin' = Super Admin."""
    module = None
    for rx, mod in _COMPILED:
        if rx.search(endpoint):
            module = mod
            break
    else:
        return ['legacy.access']
    if module is None:
        return None
    if module == 'superadmin':
        return 'superadmin'
    name = endpoint.split('.', 1)[1]
    write = method not in ('GET', 'HEAD', 'OPTIONS')
    if module == 'reports':
        return ['reports.export']
    if module == 'dashboard':
        return ['dashboard.view']
    if module == 'audit_logs':
        return ['audit_logs.view']
    if module == 'legacy':
        return ['legacy.access']
    if module == 'settings':
        return ['settings.manage']
    if module == 'agencies':
        return ['agencies.manage'] if write else ['agencies.view', 'agencies.manage']
    if module == 'conversations':
        if not write:
            return ['conversations.view_assigned', 'conversations.view_unassigned', 'conversations.view_all']
        return ['conversations.reply']
    if module == 'clients':
        if not write:
            return ['clients.view_all', 'clients.view_assigned']
        if any(w in name for w in DELETE_WORDS):
            return ['clients.delete']
        if 'toggle' in name:
            return ['clients.suspend']
        if any(w in name for w in CREATE_WORDS):
            return ['clients.create']
        return ['clients.edit']
    if module == 'payments':
        if not write:
            return ['payments.view']
        return ['payments.refund'] if any(w in name for w in CANCEL_WORDS) else ['payments.create']
    if module == 'ratings':
        return ['ratings.update'] if write else ['ratings.view']
    if module == 'listings_bookings':
        if not write:
            return ['listings.view', 'bookings.view']
        return ['bookings.create', 'listings.update'] if 'create' in name else ['bookings.update', 'listings.update']
    if not write:
        return [f'{module}.view']
    if any(w in name for w in DELETE_WORDS):
        return [f'{module}.delete']
    if module == 'bookings' and any(w in name for w in CANCEL_WORDS):
        return ['bookings.cancel']
    if any(w in name for w in CREATE_WORDS):
        return [f'{module}.create']
    return [f'{module}.update']


def _deny(message):
    if request.is_json or request.headers.get('X-Requested-With') or request.path.startswith('/api/'):
        return jsonify({'error': message}), 403
    return render_template('errors/error.html', code=403, icon='🔒', title='Accès refusé',
                           description=message), 403


def enforce_permissions():
    """before_request : contrôle d'accès de toutes les routes d'administration."""
    ep = request.endpoint or ''
    bp = ep.split('.', 1)[0] if '.' in ep else ''
    if bp not in STAFF_BLUEPRINTS or ep in PUBLIC_ENDPOINTS or not current_user.is_authenticated:
        return None
    if current_user.role == 'super_admin':
        return None
    if not current_user.is_staff:
        return None   # clients / chauffeurs : les décorateurs existants redirigent
    need = required_permissions(ep, request.method)
    if need is None:
        return None
    if need == 'superadmin':
        return _deny('Cette section est réservée au Super Admin.')
    if not has_any(current_user, need):
        return _deny('Votre rôle ne permet pas cette action (permission requise : '
                     + ' ou '.join(PERMISSION_LABELS.get(p, p) for p in need) + ').')
    return None


def permission_required(perm):
    def deco(f):
        @wraps(f)
        def wrapper(*a, **kw):
            if not has_perm(current_user, perm):
                if request.is_json or request.headers.get('X-Requested-With'):
                    abort(403)
                flash("Vous n'avez pas la permission d'effectuer cette action.", 'danger')
                return redirect(request.referrer or url_for('admin.dashboard'))
            return f(*a, **kw)
        return wrapper
    return deco


def super_admin_only(f):
    """Accès Super Admin vérifié côté serveur (403 sinon)."""
    @wraps(f)
    def wrapper(*a, **kw):
        if not current_user.is_authenticated:
            return redirect(url_for('auth.login', next=request.path))
        if current_user.role != 'super_admin' or not current_user.is_active:
            abort(403)
        return f(*a, **kw)
    return wrapper
