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

    # Identité client + conversation centralisée (jamais bloquant pour le client)
    out = {'success': True, 'notification_id': notif.id}
    if data.get('threadId'):
        try:
            from sqlalchemy.exc import IntegrityError
            from app.services.conversations import record_client_message
            args = dict(name=data.get('name'), phone=data.get('phone'), email=data.get('email'),
                        account=data.get('accountNumber'), text=data.get('text') or '')
            try:
                conv, client, created = record_client_message(data.get('threadId'), kind, **args)
            except IntegrityError:
                # Deux messages simultanés du même client : l'autre requête vient de créer la fiche /
                # la conversation. On recommence : elles sont maintenant retrouvées (aucun doublon).
                from app import db
                db.session.rollback()
                conv, client, created = record_client_message(data.get('threadId'), kind, **args)
            if conv:
                notif.link = notif.link or f"/admin/chats?client_id={conv.thread_id}"
                from app import db
                db.session.commit()
                out.update(conversation_id=conv.id, assigned_admin_id=conv.assigned_admin_id)
            if client:
                out.update(client_code=client.client_code, username=client.username, client_created=created)
        except Exception as e:  # noqa: BLE001
            current_app.logger.exception(f'[conversation] enregistrement impossible : {e}')
            from app import db
            db.session.rollback()
    return jsonify(out)
