"""Protection CSRF légère pour les actions admin qui modifient des données."""
import hmac
import secrets
from functools import wraps

from flask import abort, request, session

_SESSION_KEY = '_csrf_token'


def get_csrf_token():
    token = session.get(_SESSION_KEY)
    if not token:
        token = secrets.token_urlsafe(32)
        session[_SESSION_KEY] = token
    return token


def csrf_protect(f):
    """Exige POST + jeton CSRF valide (champ `csrf_token` ou en-tête `X-CSRFToken`)."""
    @wraps(f)
    def wrapper(*args, **kwargs):
        if request.method != 'POST':
            abort(405)
        sent = request.form.get('csrf_token') or request.headers.get('X-CSRFToken', '')
        expected = session.get(_SESSION_KEY, '')
        if not expected or not hmac.compare_digest(sent, expected):
            abort(400)
        return f(*args, **kwargs)
    return wrapper
