"""Notifications admin pour chaque message envoyé par un client (chat, réservation, contact)."""
import re

from app import db
from app.models import SystemNotification

KINDS = {
    'chat': ('💬', 'Nouveau message de', 'chat'),
    'booking': ('📩', 'Nouveau message réservation de', 'booking'),
    'contact': ('✉️', 'Nouveau message contact de', 'chat'),
}


def notify_client_message(kind, name, text, phone=None, ref=None):
    """Crée une nouvelle notification visible par les admins pour chaque message envoyé par un client."""
    icon, label, category = KINDS.get(kind, KINDS['chat'])
    name = (name or 'Client').strip()[:80] or 'Client'
    text = re.sub(r'\s+', ' ', (text or '').strip())
    if not text:
        return None
    title = f'{icon} {label} {name}'[:150]
    excerpt = text[:220] + ('…' if len(text) > 220 else '')
    details = [f'« {excerpt} »']
    if phone:
        details.append(f'Téléphone : {phone}')
    if ref:
        details.append(f'Référence : {ref}')
    message = '\n'.join(details)

    notif = SystemNotification(
        title=title,
        message=message,
        type='info',
        category=category,
        role_target=None,
    )
    db.session.add(notif)
    db.session.commit()
    return notif


def push_client_notification(chat, msg_id, title, message, sender_name, notif_type='chat', created_at=None):
    """Enregistre une notification côté client sur le fil Express et en base si un compte Flask existe."""
    from datetime import datetime
    from app.models import User

    now_iso = created_at or (datetime.utcnow().isoformat() + 'Z')
    notifs = chat.get('clientNotifications')
    if not isinstance(notifs, list):
        notifs = []
    entry = {
        'id': f"cnotif-{int(datetime.utcnow().timestamp() * 1000)}-{len(notifs)}",
        'msgId': msg_id,
        'title': (title or 'Nouveau message — Conciergerie 3M')[:140],
        'message': re.sub(r'\s+', ' ', (message or '').strip())[:220],
        'senderName': sender_name or 'Conciergerie VIP 3M',
        'type': notif_type or 'chat',
        'createdAt': now_iso,
        'read': False,
    }
    notifs.insert(0, entry)
    chat['clientNotifications'] = notifs[:50]

    try:
        email = (chat.get('clientEmail') or '').strip().lower()
        phone = (chat.get('clientPhone') or '').strip()
        user = None
        if email and '@' in email:
            user = User.query.filter(
                User.email == email, User.role == 'client', User.is_deleted == False  # noqa: E712
            ).first()
        if not user and phone:
            user = User.query.filter(
                User.phone == phone, User.role == 'client', User.is_deleted == False  # noqa: E712
            ).first()
        if user:
            db.session.add(SystemNotification(
                user_id=user.id,
                title=entry['title'][:150],
                message=entry['message'] or entry['title'],
                type='info',
                category='chat',
                role_target='client',
            ))
            db.session.commit()
    except Exception:
        db.session.rollback()
    return entry

