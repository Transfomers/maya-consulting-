"""Points d'entrée internes (appelés par l'API Node, pas par le navigateur)."""
import hmac
import ipaddress

from flask import Blueprint, current_app, jsonify, request

from app.services.client_notifications import KINDS, notify_client_message

internal_bp = Blueprint('internal', __name__)


def _authorized():
    token = current_app.config.get('INTERNAL_API_TOKEN')
    if token:
        return hmac.compare_digest(request.headers.get('X-Internal-Token', ''), token)
    # Sans jeton configuré : uniquement appel direct local ou réseau privé Docker (sans X-Forwarded-For)
    if request.headers.get('X-Forwarded-For'):
        return False
    remote = (request.remote_addr or '').split('%')[0]
    try:
        ip = ipaddress.ip_address(remote)
        return ip.is_loopback or ip.is_private
    except ValueError:
        return remote in ('127.0.0.1', '::1')


@internal_bp.route('/api/internal/client-message', methods=['POST'])
def client_message():
    if not _authorized():
        return jsonify({'error': 'Non autorisé'}), 403
    data = request.get_json(silent=True) or {}
    kind = data.get('kind') if data.get('kind') in KINDS else 'chat'
    notif = notify_client_message(
        kind,
        data.get('name'),
        data.get('text'),
        phone=(data.get('phone') or '')[:40],
        ref=(data.get('ref') or data.get('clientId') or '')[:60],
    )
    if not notif:
        return jsonify({'error': 'Message vide'}), 400
    return jsonify({'success': True, 'notification_id': notif.id})
