"""Rôles & permissions. Le Super Admin a toujours tout ; les autres rôles reçoivent les
permissions enregistrées dans `role_permission` (valeurs par défaut ci-dessous si rien n'est enregistré).
Toujours vérifié côté serveur (décorateur `permission_required`)."""
from functools import wraps

from flask import abort, flash, redirect, request, url_for
from flask_login import current_user

from app import db

PERMISSIONS = {
    'Conversations': [
        ('conversations.view_assigned', 'Voir ses conversations assignées'),
        ('conversations.view_unassigned', 'Voir les conversations non assignées'),
        ('conversations.view_all', 'Voir toutes les conversations'),
        ('conversations.reply', 'Répondre aux clients'),
        ('conversations.assign', 'Assigner / réassigner des conversations'),
        ('conversations.notes', 'Ajouter des notes internes'),
    ],
    'Clients': [
        ('clients.view_assigned', 'Voir ses clients'),
        ('clients.view_all', 'Voir tous les clients'),
        ('clients.edit', 'Modifier les profils clients (nom, téléphone, e-mail)'),
        ('clients.edit_username', 'Modifier le nom d’utilisateur d’un client'),
    ],
    'Opérations': [
        ('reservations.manage', 'Créer / modifier des réservations'),
        ('contracts.manage', 'Créer / modifier des contrats'),
        ('payments.manage', 'Enregistrer / ajuster des paiements'),
    ],
}
ALL_PERMISSIONS = [p for group in PERMISSIONS.values() for p, _ in group]

STAFF_ROLES = {
    'admin_agence': 'Administrateur',
    'finance_officer': 'Responsable financier',
    'teller': 'Guichetier',
    'driver': 'Chauffeur',
}
ROLE_LABELS = {'super_admin': 'Super Admin', **STAFF_ROLES, 'client': 'Client'}

DEFAULTS = {
    'admin_agence': {'conversations.view_assigned', 'conversations.view_unassigned', 'conversations.reply',
                     'conversations.notes', 'clients.view_assigned', 'clients.edit',
                     'reservations.manage', 'contracts.manage', 'payments.manage'},
    'finance_officer': {'payments.manage', 'contracts.manage'},
    'teller': {'reservations.manage', 'payments.manage'},
    'driver': set(),
}


def role_permissions(role):
    from app.models import RolePermission
    if role == 'super_admin':
        return set(ALL_PERMISSIONS)
    rows = RolePermission.query.filter_by(role=role).all()
    if not rows:
        return set(DEFAULTS.get(role, set()))
    return {r.permission for r in rows if r.permission in ALL_PERMISSIONS and not r.permission.startswith('!')}


def has_perm(user, perm):
    if not user or not getattr(user, 'is_authenticated', False):
        return False
    if user.role == 'super_admin':
        return True
    return perm in role_permissions(user.role)


def set_role_permissions(role, perms):
    """Remplace les permissions d'un rôle. Un rôle sans aucune permission garde un marqueur
    pour ne pas retomber sur les valeurs par défaut."""
    from app.models import RolePermission
    if role not in STAFF_ROLES:
        raise ValueError('Rôle non modifiable')
    perms = {p for p in perms if p in ALL_PERMISSIONS}
    RolePermission.query.filter_by(role=role).delete()
    for p in sorted(perms) or ['!none']:
        db.session.add(RolePermission(role=role, permission=p))


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
    """Accès Super Admin vérifié côté serveur (403 sinon, sans révéler la page)."""
    @wraps(f)
    def wrapper(*a, **kw):
        if not current_user.is_authenticated:
            return redirect(url_for('auth.login', next=request.path))
        if current_user.role != 'super_admin':
            abort(403)
        return f(*a, **kw)
    return wrapper
