"""Protections globales : sessions de comptes suspendus, RBAC, CSRF, en-têtes, ré-authentification."""
import hmac
import time
from datetime import datetime, timedelta
from functools import wraps

from flask import current_app, flash, jsonify, redirect, request, session, url_for
from flask_login import current_user, logout_user

from app.services.permissions import PUBLIC_ENDPOINTS, STAFF_BLUEPRINTS, enforce_permissions

UNSAFE = {'POST', 'PUT', 'PATCH', 'DELETE'}
REAUTH_KEY = '_reauth_at'


def _csrf_ok():
    from app.utils.security import _SESSION_KEY
    expected = session.get(_SESSION_KEY, '')
    sent = request.form.get('csrf_token') or request.headers.get('X-CSRFToken') or request.headers.get('X-CSRF-Token') or ''
    if not sent and request.is_json:
        sent = (request.get_json(silent=True) or {}).get('csrf_token', '')
    return bool(expected) and hmac.compare_digest(str(sent), expected)


def init_security(app):
    @app.before_request
    def _inactive_accounts_out():
        # Un compte suspendu / désactivé pendant sa session est déconnecté immédiatement
        if current_user.is_authenticated and not current_user.is_active:
            logout_user()
            session.pop(REAUTH_KEY, None)
            if request.path.startswith('/api/') or request.is_json:
                return jsonify({'error': 'Compte suspendu ou désactivé.'}), 401
            flash('Votre compte a été suspendu ou désactivé. Contactez le Super Admin.', 'danger')
            return redirect(url_for('auth.login'))
        return None

    @app.before_request
    def _csrf_for_staff_actions():
        ep = request.endpoint or ''
        bp = ep.split('.', 1)[0] if '.' in ep else ''
        if request.method in UNSAFE and bp in STAFF_BLUEPRINTS and ep not in PUBLIC_ENDPOINTS \
                and not current_app.config.get('TESTING_DISABLE_CSRF'):
            if not _csrf_ok():
                if request.is_json or request.headers.get('X-Requested-With'):
                    return jsonify({'error': 'Session expirée : rechargez la page et réessayez.'}), 400
                flash('Session expirée : rechargez la page et réessayez.', 'warning')
                return redirect(request.referrer or url_for('admin.dashboard'))
        return None

    app.before_request(enforce_permissions)

    @app.before_request
    def _maintenance_mode():
        # Pages clients Flask fermées pendant une maintenance ; staff, connexion et API internes inchangés
        ep = request.endpoint or ''
        if not ep or ep == 'static' or ep.startswith(('auth.', 'internal.')) or ep.split('.')[0] in STAFF_BLUEPRINTS:
            return None
        if current_user.is_authenticated and current_user.is_staff:
            return None
        if ep in ('main.health_check', 'main.manifest', 'main.service_worker', 'main.favicon'):
            return None
        try:
            from app.services.identity import get_setting
            if get_setting('maintenance_mode', '0') != '1':
                return None
            message = get_setting('maintenance_message') or 'Le service est momentanément en maintenance. Merci de réessayer un peu plus tard.'
        except Exception:
            return None
        from flask import render_template
        if request.path.startswith('/api/') or request.is_json:
            return jsonify({'error': message, 'maintenance': True}), 503
        return render_template('errors/error.html', code=503, icon='🛠️', title='Maintenance en cours',
                               description=message), 503

    @app.after_request
    def _security_headers(resp):
        resp.headers.setdefault('X-Content-Type-Options', 'nosniff')
        resp.headers.setdefault('X-Frame-Options', 'SAMEORIGIN')
        resp.headers.setdefault('Referrer-Policy', 'strict-origin-when-cross-origin')
        resp.headers.setdefault('Permissions-Policy', 'camera=(self), microphone=(), geolocation=(self)')
        if current_app.config.get('APP_ENV') == 'production':
            resp.headers.setdefault('Strict-Transport-Security', 'max-age=31536000; includeSubDomains')
        if request.endpoint and request.endpoint.split('.')[0] in STAFF_BLUEPRINTS:
            resp.headers.setdefault('Cache-Control', 'no-store')   # pages d'administration jamais en cache
        return resp


# ── Ré-authentification pour les actions critiques ───────────────────────────
def mark_reauthenticated():
    session[REAUTH_KEY] = int(time.time())


def recently_authenticated():
    minutes = current_app.config.get('REAUTH_MINUTES', 10)
    return int(time.time()) - int(session.get(REAUTH_KEY, 0) or 0) <= minutes * 60


def recent_auth_required(f):
    """Action critique : redemande le mot de passe si la dernière confirmation est trop ancienne."""
    @wraps(f)
    def wrapper(*a, **kw):
        if not recently_authenticated():
            if request.method == 'POST':
                session['_reauth_pending'] = {'url': request.referrer or url_for('superadmin.overview')}
            flash('Pour cette action sensible, confirmez votre mot de passe.', 'warning')
            return redirect(url_for('superadmin.confirm_password',
                                    next=request.referrer if request.method == 'POST' else request.full_path))
        return f(*a, **kw)
    return wrapper
