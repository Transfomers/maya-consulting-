"""Points d'entrée internes (appelés par l'API Node, pas par le navigateur)."""
import hmac

from flask import Blueprint, current_app, jsonify, request

from app.services.client_notifications import KINDS, notify_client_message

internal_bp = Blueprint('internal', __name__)


def _authorized():
    token = current_app.config.get('INTERNAL_API_TOKEN')
    if token:
        return hmac.compare_digest(request.headers.get('X-Internal-Token', ''), token)
    # Sans jeton configuré : uniquement depuis la même machine (développement)
    return request.remote_addr in ('127.0.0.1', '::1')


@internal_bp.route('/api/internal/client-message', methods=['POST'])
def client_message():
    if not _authorized():
        return jsonify({'error': 'Non autorisé'}), 403
    data = request.get_json(silent=True) or {}
    kind = data.get('kind') if data.get('kind') in KINDS else 'chat'
    notif = notify_client_message(kind, data.get('name'), data.get('text'),
                                  phone=(data.get('phone') or '')[:40], ref=(data.get('ref') or '')[:60])
    if not notif:
        return jsonify({'error': 'Message vide'}), 400
    return jsonify({'success': True, 'notification_id': notif.id})
