"""Gestion centralisée des conversations clients.

Chaque message client (chat, formulaire, réservation) arrive ici via l'API interne :
client identifié/créé → conversation reliée au client → assignée à un administrateur →
Super Admin notifié. Les réponses du staff mettent à jour les délais de réponse.
"""
import re
from datetime import datetime, timedelta

from sqlalchemy import func

from app import db
from app.services.activity import notify_super_admin, record
from app.services.identity import get_setting, identify_or_create

STATUSES = ('new', 'open', 'pending', 'resolved', 'closed')
KIND_DEPARTMENT = {'booking': 'vehicles', 'apartment_booking': 'apartments', 'chat': 'general', 'contact': 'general'}
KIND_SOURCE = {'chat': 'web_chat', 'contact': 'contact_form', 'booking': 'booking', 'apartment_booking': 'apartment_booking'}


def _url(endpoint, **kw):
    try:
        from flask import url_for
        return url_for(endpoint, **kw)
    except Exception:
        return None


def assignable_admins():
    """Administrateurs pouvant recevoir des conversations (actifs, non supprimés)."""
    from app.models import User
    from app.services.permissions import has_perm
    admins = User.query.filter(User.role == 'admin_agence', User.is_deleted == False).order_by(User.id).all()  # noqa: E712
    admins = [a for a in admins if getattr(a, 'is_active', True) and has_perm(a, 'conversations.reply')]
    return admins


def pick_admin(client):
    """Assignation automatique : administrateur du client, sinon le moins chargé (conversations ouvertes)."""
    from app.models import Conversation, User
    if get_setting('auto_assign', 'least_busy') == 'none':
        return None
    admins = assignable_admins()
    if client and client.assigned_admin_id and any(a.id == client.assigned_admin_id for a in admins):
        return db.session.get(User, client.assigned_admin_id)
    if not admins:
        return None
    load = dict(db.session.query(Conversation.assigned_admin_id, func.count())
                .filter(Conversation.status.in_(('new', 'open', 'pending')))
                .group_by(Conversation.assigned_admin_id).all())
    return min(admins, key=lambda a: (load.get(a.id, 0), a.id))


def record_client_message(thread_id, kind='chat', name=None, phone=None, email=None, account=None, text=''):
    """Appelée à chaque message client. Renvoie la conversation (ou None si fil inconnu)."""
    from app.models import Conversation
    thread_id = (thread_id or '').strip()[:80]
    if not thread_id:
        return None, None, False
    now = datetime.utcnow()
    source = KIND_SOURCE.get(kind, 'web_chat')
    client, created_client = identify_or_create(name, phone, email, account, source)

    conv = Conversation.query.filter_by(thread_id=thread_id).first()
    is_new_conv = conv is None
    if is_new_conv:
        conv = Conversation(thread_id=thread_id, status='new', source=source, created_at=now,
                            department=KIND_DEPARTMENT.get(kind, 'general'), first_client_message_at=now,
                            unread_admin=0, message_count=0)
        db.session.add(conv)
    if client and not conv.client_id:
        conv.client_id = client.id
    elif client and conv.client_id != client.id and conv.client_id is None:
        conv.client_id = client.id
    if conv.status in ('resolved', 'closed'):
        conv.status, conv.resolved_at, conv.closed_at = 'open', None, None   # le client relance : on rouvre
    elif conv.status == 'pending':
        conv.status = 'open'
    if kind in ('booking', 'apartment_booking') and conv.department == 'general':
        conv.department = KIND_DEPARTMENT[kind]
    preview = re.sub(r'\s+', ' ', text or '').strip()
    conv.last_message_preview = preview[:200] or conv.last_message_preview
    conv.last_sender, conv.last_message_at, conv.last_client_message_at = 'client', now, now
    conv.first_client_message_at = conv.first_client_message_at or now
    conv.unread_admin = (conv.unread_admin or 0) + 1
    conv.message_count = (conv.message_count or 0) + 1
    conv.unanswered_notified_at = None
    conv.updated_at = now

    assigned_now = None
    if not conv.assigned_admin_id:
        admin = pick_admin(client)
        if admin:
            conv.assigned_admin_id = assigned_now = admin.id
            if client and not client.assigned_admin_id:
                client.assigned_admin_id = admin.id
    db.session.flush()

    who = (client.display_name or client.real_name or '@' + client.username) if client else (name or 'Visiteur')
    code = f' ({client.client_code})' if client else ''
    link = _url('superadmin.conversation_detail', conv_id=conv.id)
    if is_new_conv:
        assigned = db.session.get(type(client), assigned_now).real_name if (assigned_now and client) else None
        notify_super_admin(f'💬 Nouvelle conversation — {who}{code}',
                           (f'« {preview[:160]} »' if preview else '')
                           + (f'\nAssignée à {assigned}' if assigned else '\nNon assignée'),
                           'conversation', 'info', link, commit=False)
        if assigned_now:
            record('CONVERSATION_ASSIGNED', 'conversation', 'Conversation', conv.id, f'{who}{code}',
                   meta={'mode': 'automatique', 'admin_id': assigned_now}, actor=None, commit=False)
            notify_super_admin(f'📥 Nouvelle conversation assignée — {who}', f'« {preview[:160]} »',
                               'conversation', 'info', _url('admin.chats', client_id=thread_id),
                               commit=False, user_id=assigned_now)
    db.session.commit()
    return conv, client, created_client


def record_admin_reply(thread_id, admin):
    """Réponse du staff : délais de réponse, statut, journal (sans contenu du message)."""
    from app.models import Conversation
    conv = Conversation.query.filter_by(thread_id=thread_id).first()
    if not conv:
        conv = Conversation(thread_id=thread_id, status='open', created_at=datetime.utcnow(), message_count=0)
        db.session.add(conv)
    now = datetime.utcnow()
    if not conv.first_response_at and conv.first_client_message_at:
        conv.first_response_at, conv.first_response_by_id = now, admin.id
    if conv.status == 'new':
        conv.status = 'open'
    if not conv.assigned_admin_id and admin.role != 'super_admin':
        conv.assigned_admin_id = admin.id
    conv.last_sender, conv.last_message_at, conv.last_admin_reply_at = 'admin', now, now
    conv.unread_admin = 0
    conv.message_count = (conv.message_count or 0) + 1
    conv.updated_at = now
    db.session.flush()
    record('CONVERSATION_REPLIED', 'conversation', 'Conversation', conv.id, _label(conv),
           meta={'premiere_reponse': conv.first_response_by_id == admin.id and conv.first_response_at == now},
           actor=admin, commit=False)
    db.session.commit()
    return conv


def mark_opened(thread_id, admin):
    """Conversation consultée : lus remis à zéro ; journal limité à une entrée / 10 min / admin."""
    from app.models import AuditLog, Conversation
    conv = Conversation.query.filter_by(thread_id=thread_id).first()
    if not conv:
        return None
    conv.unread_admin = 0
    recent = AuditLog.query.filter(AuditLog.action == 'CONVERSATION_OPENED', AuditLog.user_id == admin.id,
                                   AuditLog.target_id == conv.id,
                                   AuditLog.created_at >= datetime.utcnow() - timedelta(minutes=10)).first()
    if not recent:
        record('CONVERSATION_OPENED', 'conversation', 'Conversation', conv.id, _label(conv), actor=admin, commit=False)
    db.session.commit()
    return conv


def assign(conv, admin_id, actor):
    from app.models import User
    old = conv.assigned_admin_id
    new_admin = db.session.get(User, admin_id) if admin_id else None
    if admin_id and (not new_admin or new_admin.role not in ('admin_agence', 'super_admin') or new_admin.is_deleted):
        raise ValueError('Administrateur invalide.')
    if old == (new_admin.id if new_admin else None):
        return False
    conv.assigned_admin_id = new_admin.id if new_admin else None
    conv.updated_at = datetime.utcnow()
    old_admin = db.session.get(User, old) if old else None
    record('CONVERSATION_ASSIGNED', 'conversation', 'Conversation', conv.id, _label(conv),
           meta={'avant': old_admin.real_name or old_admin.username if old_admin else None,
                 'apres': new_admin.real_name or new_admin.username if new_admin else None, 'mode': 'manuel'},
           actor=actor, commit=False)
    if new_admin and new_admin.id != actor.id:
        notify_super_admin(f'📥 Conversation qui vous est assignée — {_label(conv)}',
                           f'Par {actor.real_name or actor.username}', 'conversation', 'info',
                           _url('admin.chats', client_id=conv.thread_id), commit=False, user_id=new_admin.id)
    db.session.commit()
    return True


def set_status(conv, status, actor):
    if status not in STATUSES or status == conv.status:
        return False
    old = conv.status
    now = datetime.utcnow()
    conv.status = status
    conv.resolved_at = now if status == 'resolved' else (conv.resolved_at if status == 'closed' else None)
    conv.closed_at = now if status == 'closed' else None
    conv.updated_at = now
    record('CONVERSATION_STATUS', 'conversation', 'Conversation', conv.id, _label(conv),
           meta={'avant': old, 'apres': status}, actor=actor, commit=False)
    db.session.commit()
    return True


def add_note(conv, body, actor):
    from app.models import ConversationNote
    body = (body or '').strip()[:3000]
    if not body:
        return None
    note = ConversationNote(conversation_id=conv.id, author_id=actor.id, body=body)
    db.session.add(note)
    db.session.flush()
    record('CONVERSATION_NOTE', 'conversation', 'Conversation', conv.id, _label(conv), actor=actor, commit=False)
    db.session.commit()
    return note


def _label(conv):
    c = conv.client
    if c:
        return f'{c.client_code or ""} · {c.display_name or c.real_name or "@" + c.username}'.strip(' ·')
    return conv.thread_id


def check_unanswered():
    """Prévient le Super Admin (et l'admin assigné) des conversations restées sans réponse."""
    from app.models import Conversation
    minutes = int(get_setting('unanswered_minutes', 15) or 15)
    limit = datetime.utcnow() - timedelta(minutes=minutes)
    late = Conversation.query.filter(Conversation.status.in_(('new', 'open')), Conversation.last_sender == 'client',
                                     Conversation.last_client_message_at <= limit,
                                     Conversation.unanswered_notified_at == None).limit(50).all()  # noqa: E711
    for conv in late:
        waited = int((datetime.utcnow() - conv.last_client_message_at).total_seconds() // 60)
        title = f'⏰ Sans réponse depuis {waited} min — {_label(conv)}'
        notify_super_admin(title, (conv.last_message_preview or '')[:160], 'conversation', 'warning',
                           _url('superadmin.conversation_detail', conv_id=conv.id), commit=False)
        if conv.assigned_admin_id:
            notify_super_admin(title, (conv.last_message_preview or '')[:160], 'conversation', 'warning',
                               _url('admin.chats', client_id=conv.thread_id), commit=False,
                               user_id=conv.assigned_admin_id)
        conv.unanswered_notified_at = datetime.utcnow()
    if late:
        db.session.commit()
    return len(late)


def sync_from_threads():
    """Relie au registre les fils déjà présents dans db.json (sans Conversation) : rien n'est perdu."""
    from app.models import Conversation
    from app.services.chat_store import load
    known = {t for (t,) in db.session.query(Conversation.thread_id).all()}
    created = 0
    for chat in load().get('chats', []) or []:
        tid = chat.get('id')
        if not tid or tid in known or chat.get('mergedInto'):
            continue
        msgs = [m for m in chat.get('messages', []) if m.get('sender') in ('client', 'admin')]
        client_msgs = [m for m in msgs if m.get('sender') == 'client']
        if not client_msgs:
            continue
        client, _ = identify_or_create(chat.get('clientName'), chat.get('clientPhone'), chat.get('clientEmail'),
                                       chat.get('clientId'), 'web_chat')

        def ts(m):
            try:
                return datetime.fromisoformat(str(m.get('timestamp', '')).replace('Z', '')[:26])
            except ValueError:
                return None
        first_client = ts(client_msgs[0])
        admin_after = [m for m in msgs if m.get('sender') == 'admin' and ts(m) and first_client and ts(m) >= first_client]
        last = msgs[-1]
        db.session.add(Conversation(
            thread_id=tid, client_id=client.id if client else None, source='web_chat',
            status='open' if admin_after else 'new', first_client_message_at=first_client,
            first_response_at=ts(admin_after[0]) if admin_after else None,
            last_sender=last.get('sender'), last_message_at=ts(last),
            last_client_message_at=ts(client_msgs[-1]), last_admin_reply_at=ts(admin_after[-1]) if admin_after else None,
            last_message_preview=re.sub(r'\s+', ' ', last.get('text') or '')[:200],
            unread_admin=int(chat.get('unreadAdmin') or 0), message_count=len(msgs)))
        created += 1
    if created:
        db.session.commit()
    return created
