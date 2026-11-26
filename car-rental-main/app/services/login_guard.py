"""Protection contre le brute-force : verrouillage par compte et limite par adresse IP.
S'appuie sur le journal d'audit (échecs de connexion), sans dépendance supplémentaire."""
from datetime import datetime, timedelta

from flask import current_app

from app import db


def _window():
    return datetime.utcnow() - timedelta(minutes=current_app.config.get('LOGIN_LOCK_MINUTES', 15))


def _ip_failures(ip):
    from app.models import AuditLog
    if not ip:
        return 0
    return AuditLog.query.filter(AuditLog.action == 'LOGIN_FAILED', AuditLog.ip_address == ip,
                                 AuditLog.created_at >= _window()).count()


def _find(identifier):
    from app.models import User
    ident = (identifier or '').strip().lower()
    return User.query.filter((db.func.lower(User.username) == ident) | (db.func.lower(User.email) == ident)).first()


def blocked_message(identifier, ip):
    minutes = current_app.config.get('LOGIN_LOCK_MINUTES', 15)
    if _ip_failures(ip) >= current_app.config.get('LOGIN_MAX_FAILURES_PER_IP', 20):
        return f'Trop de tentatives depuis cet appareil. Réessayez dans {minutes} minutes.'
    user = _find(identifier)
    if user and user.locked_until and user.locked_until > datetime.utcnow():
        left = max(1, int((user.locked_until - datetime.utcnow()).total_seconds() // 60) + 1)
        return f'Compte temporairement verrouillé après plusieurs échecs. Réessayez dans {left} minute(s).'
    return None


def register_failure(user, identifier, ip):
    """Après l'enregistrement de l'échec : verrouille le compte si le seuil est atteint."""
    from app.models import AuditLog
    if not user:
        return None
    max_fail = current_app.config.get('LOGIN_MAX_FAILURES', 5)
    ident = (identifier or '')[:60]
    fails = AuditLog.query.filter(AuditLog.action == 'LOGIN_FAILED', AuditLog.target_label == ident,
                                  AuditLog.created_at >= _window()).count()
    if fails >= max_fail:
        minutes = current_app.config.get('LOGIN_LOCK_MINUTES', 15)
        user.locked_until = datetime.utcnow() + timedelta(minutes=minutes)
        db.session.commit()
        from app.services.activity import notify_super_admin, record
        record('ACCOUNT_LOCKED', 'security', 'User', user.id, user.username,
               meta={'echecs': fails, 'minutes': minutes}, actor=None, commit=False)
        if user.is_staff:
            notify_super_admin('🔐 Compte verrouillé', f'{user.real_name or user.username} : {fails} échecs de connexion. '
                               f'Verrouillé {minutes} min.', 'security', 'danger', commit=False)
        db.session.commit()
        return f'Compte temporairement verrouillé après {fails} échecs. Réessayez dans {minutes} minutes.'
    return None
