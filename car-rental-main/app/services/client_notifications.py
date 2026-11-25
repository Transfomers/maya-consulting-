"""Notifications admin pour chaque message envoyé par un client (chat, réservation, contact)."""
import re
from datetime import datetime, timedelta

from app import db
from app.models import SystemNotification

KINDS = {
    'chat': ('💬', 'Message de', 'chat'),
    'booking': ('📩', 'Message sur une réservation de', 'booking'),
    'contact': ('✉️', 'Formulaire de contact :', 'chat'),
}
GROUP_WINDOW = timedelta(minutes=30)   # messages rapprochés d'un même client regroupés


def notify_client_message(kind, name, text, phone=None, ref=None):
    """Crée (ou regroupe) une notification visible par les admins. Renvoie la notification."""
    icon, label, category = KINDS.get(kind, KINDS['chat'])
    name = (name or 'Client').strip()[:80] or 'Client'
    text = re.sub(r'\s+', ' ', (text or '').strip())
    if not text:
        return None
    base_title = f'{icon} {label} {name}'
    excerpt = text[:220] + ('…' if len(text) > 220 else '')
    details = [f'« {excerpt} »']
    if phone:
        details.append(f'Téléphone : {phone}')
    if ref:
        details.append(f'Référence : {ref}')
    message = '\n'.join(details)

    recent = (SystemNotification.query
              .filter(SystemNotification.category == category,
                      SystemNotification.is_deleted == False,  # noqa: E712
                      SystemNotification.is_read == False,  # noqa: E712
                      SystemNotification.title.like(base_title + '%'),
                      SystemNotification.created_at >= datetime.utcnow() - GROUP_WINDOW)
              .order_by(SystemNotification.created_at.desc()).first())
    if recent:
        m = re.search(r'\((\d+) messages\)$', recent.title)
        count = (int(m.group(1)) if m else 1) + 1
        recent.title = f'{base_title} ({count} messages)'[:150]
        recent.message = message
        recent.created_at = datetime.utcnow()   # remonte en tête de liste
        notif = recent
    else:
        notif = SystemNotification(title=base_title[:150], message=message, type='info',
                                   category=category, role_target=None)
        db.session.add(notif)
    db.session.commit()
    return notif
