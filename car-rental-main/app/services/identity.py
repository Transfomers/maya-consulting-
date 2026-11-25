"""Identité client permanente.

Au premier message d'une personne : on retrouve son profil (compte du site, téléphone, e-mail)
ou on le crée avec un identifiant permanent CLI-000001 et un nom d'utilisateur unique (client001).
Jamais d'identification sur le seul nom (deux « Jean » ne sont pas la même personne).
"""
import re
import secrets
from datetime import datetime

from sqlalchemy import func

from app import db

NO_EMAIL_DOMAIN = 'no-email.invalid'      # domaine réservé : un client sans e-mail n'a pas d'adresse inventée visible
USERNAME_RE = re.compile(r'^[a-z0-9][a-z0-9._-]{2,29}$')

SOURCES = {
    'web_chat': 'Chat du site', 'contact_form': 'Formulaire de contact', 'booking': 'Réservation véhicule',
    'apartment_booking': 'Réservation appartement', 'account': 'Compte client du site', 'admin': 'Créé par l’équipe',
    'whatsapp': 'WhatsApp',
}
CLIENT_STATUSES = {'active': 'Actif', 'vip': 'VIP', 'blocked': 'Bloqué', 'archived': 'Archivé'}


def get_setting(key, default=None):
    from app.models import SystemSetting
    row = db.session.get(SystemSetting, key)
    return row.value if row and row.value is not None else default


def set_setting(key, value, user_id=None):
    from app.models import SystemSetting
    row = db.session.get(SystemSetting, key) or SystemSetting(key=key)
    row.value, row.updated_at, row.updated_by_id = (None if value is None else str(value)), datetime.utcnow(), user_id
    db.session.add(row)


def phone_key(phone):
    """9 derniers chiffres (format camerounais) : même client avec ou sans +237 / espaces."""
    digits = re.sub(r'\D', '', phone or '')
    return digits[-9:] if len(digits) >= 8 else None


def real_email(email):
    email = (email or '').strip().lower()
    return email if email and '@' in email and not email.endswith('@' + NO_EMAIL_DOMAIN) \
        and not email.endswith('@visiteur.3mservices.cm') else ''


def _next_number():
    """Prochain numéro libre (CLI-000001…). Les numéros ne sont jamais réutilisés."""
    from app.models import User
    last = db.session.query(func.max(User.client_code)).filter(User.client_code.like('CLI-%')).scalar()
    n = int(last[4:]) if last and last[4:].isdigit() else 0
    return n + 1


def assign_identity(user):
    """Donne à un client existant son identifiant permanent et un nom d'utilisateur s'il n'en a pas."""
    from app.models import User
    if user.client_code:
        return user
    with db.session.no_autoflush:
        n = _next_number()
        while User.query.filter_by(client_code=f'CLI-{n:06d}').first():
            n += 1
    user.client_code = f'CLI-{n:06d}'
    uname_now = user.username or ''
    auto_generated = (uname_now.startswith('tmp-') or not USERNAME_RE.match(uname_now)
                      or ('_' in uname_now and uname_now.split('_')[-1].isdigit()))   # anciens visiteurs « jean_1234 »
    if auto_generated:
        base = f'client{n:03d}'
        uname, k = base, 1
        while db.session.query(User.id).filter(func.lower(User.username) == uname, User.id != user.id).first():
            k += 1
            uname = f'{base}{chr(96 + k)}' if k < 27 else f'{base}-{k}'
        user.username = uname
    user.phone_key = phone_key(user.phone)
    return user


def find_client(phone=None, email=None, account=None):
    """Doublons : compte du site, puis téléphone (9 chiffres), puis e-mail réel. Jamais le nom seul."""
    from app.models import User
    base = User.query.filter(User.role == 'client', User.is_deleted == False)  # noqa: E712
    if account:
        u = base.filter(User.external_account == account).first()
        if u:
            return u
    key = phone_key(phone)
    if key:
        u = base.filter(User.phone_key == key).order_by(User.id).first()
        if u:
            return u
        for cand in base.filter(User.phone_key == None, User.phone.isnot(None)).all():  # noqa: E711
            if phone_key(cand.phone) == key:
                cand.phone_key = key
                return cand
    mail = real_email(email)
    if mail:
        u = base.filter(func.lower(User.email) == mail).first()
        if u:
            return u
    return None


def identify_or_create(name=None, phone=None, email=None, account=None, source='web_chat'):
    """Renvoie (client, créé?) — ne crée JAMAIS un doublon à chaque message."""
    from app.models import User
    name = (name or '').strip()[:120]
    phone = (phone or '').strip()[:40]
    mail = real_email(email)
    account = (account or '').strip()[:60] or None
    if account and not account.upper().startswith(('3M-', 'CLI-')):
        account = None              # identifiants invités (GUEST-…) : ne désignent pas une personne

    user = find_client(phone, mail, account)
    if user:
        changed = False
        if not user.client_code:
            assign_identity(user)
            changed = True
        if account and not user.external_account:
            user.external_account, changed = account, True
        if phone and not user.phone:
            user.phone, user.phone_key, changed = phone, phone_key(phone), True
        if mail and real_email(user.email) == '' and not User.query.filter(func.lower(User.email) == mail).first():
            user.email, changed = mail, True
        if name and not (user.real_name or '').strip():
            user.real_name, user.display_name, changed = name, user.display_name or name, True
        user.last_seen_at = datetime.utcnow()
        return user, False

    if not phone_key(phone) and not mail and not account:
        return None, False          # rien de fiable pour identifier la personne : pas de fiche fantôme

    user = User(role='client', real_name=name or None, display_name=name or None,
                phone=phone or None, client_source=source if source in SOURCES else 'web_chat',
                external_account=account, client_status='active', is_verified=False,
                last_seen_at=datetime.utcnow(), username=f'tmp-{secrets.token_hex(6)}',
                email=f'tmp-{secrets.token_hex(6)}@{NO_EMAIL_DOMAIN}')
    if name:
        parts = name.split(' ', 1)
        user.first_name, user.last_name = parts[0], (parts[1] if len(parts) > 1 else '')
    user.set_password(secrets.token_urlsafe(24))      # aucun mot de passe connu : le client se connecte via le site
    db.session.add(user)
    db.session.flush()
    with db.session.no_autoflush:
        assign_identity(user)
    user.email = mail if mail and not User.query.filter(func.lower(User.email) == mail, User.id != user.id).first() \
        else f'{user.username}@{NO_EMAIL_DOMAIN}'
    db.session.flush()

    from app.services.activity import notify_super_admin, record
    link = _safe_url('superadmin.client_detail', cid=user.id)
    record('CLIENT_CREATED', 'client', 'User', user.id, f'{user.client_code} · {name or user.username}',
           meta={'source': user.client_source, 'telephone': bool(phone), 'email': bool(mail)},
           actor=None, commit=False)
    notify_super_admin(f'👤 Nouveau client {user.client_code} — {name or "@" + user.username}',
                       f'Source : {SOURCES.get(user.client_source, user.client_source)}'
                       + (f' · Tél. {phone}' if phone else ''), 'client', 'info', link, commit=False)
    return user, True


def _safe_url(endpoint, **kw):
    try:
        from flask import url_for
        return url_for(endpoint, **kw)
    except Exception:
        return None


EDITABLE = ('username', 'display_name', 'real_name', 'phone', 'email', 'city', 'address', 'client_status')
FIELD_LABELS = {'username': 'Nom d’utilisateur', 'display_name': 'Nom affiché', 'real_name': 'Nom complet',
                'phone': 'Téléphone', 'email': 'E-mail', 'city': 'Ville', 'address': 'Adresse',
                'client_status': 'Statut', 'assigned_admin_id': 'Administrateur assigné'}


def update_client_profile(user, data, actor, can_edit_username=True):
    """Met à jour un profil client. Renvoie (modifications, erreurs). L'identifiant CLI-… ne change jamais."""
    from app.models import User
    errors, changes = [], {}
    for field in EDITABLE:
        if field not in data:
            continue
        new = (data.get(field) or '').strip()
        old = getattr(user, field) or ''
        if field == 'email':
            old = real_email(old)
            new = new.lower()
        if new == old:
            continue
        if field == 'username':
            if not can_edit_username:
                errors.append("Vous n'avez pas la permission de modifier le nom d'utilisateur.")
                continue
            new = new.lstrip('@').lower()
            if not USERNAME_RE.match(new):
                errors.append("Nom d'utilisateur : 3 à 30 caractères (lettres minuscules, chiffres, . _ -).")
                continue
            if User.query.filter(func.lower(User.username) == new, User.id != user.id).first():
                errors.append(f"Le nom d'utilisateur « {new} » est déjà pris.")
                continue
        if field == 'email' and new:
            if '@' not in new:
                errors.append('Adresse e-mail invalide.')
                continue
            if User.query.filter(func.lower(User.email) == new, User.id != user.id).first():
                errors.append('Cette adresse e-mail appartient déjà à un autre compte.')
                continue
        if field == 'phone' and new:
            key = phone_key(new)
            if not key:
                errors.append('Numéro de téléphone invalide.')
                continue
            dup = User.query.filter(User.phone_key == key, User.id != user.id, User.role == 'client',
                                    User.is_deleted == False).first()  # noqa: E712
            if dup:
                errors.append(f'Ce numéro est déjà celui du client {dup.client_code or dup.username}.')
                continue
        if field == 'client_status' and new not in CLIENT_STATUSES:
            continue
        changes[field] = [old or None, new or None]
    if errors:
        return {}, errors
    for field, (old, new) in changes.items():
        if field == 'email':
            setattr(user, field, new or f'{user.username}@{NO_EMAIL_DOMAIN}')
        else:
            setattr(user, field, new or None)
        if field == 'phone':
            user.phone_key = phone_key(new)
    if not changes:
        return {}, []

    from app.services.activity import record
    db.session.info['skip_activity'] = True      # l'audit détaillé est écrit ci-dessous (une seule ligne par champ)
    try:
        db.session.flush()
    finally:
        db.session.info.pop('skip_activity', None)
    label = f'{user.client_code} · {user.display_name or user.real_name or user.username}'
    for field, (old, new) in changes.items():
        action = {'username': 'CLIENT_USERNAME_CHANGED', 'display_name': 'CLIENT_NAME_CHANGED',
                  'real_name': 'CLIENT_NAME_CHANGED'}.get(field, 'CLIENT_UPDATED')
        record(action, 'client', 'User', user.id, label,
               meta={'champ': FIELD_LABELS.get(field, field), 'ancienne_valeur': old, 'nouvelle_valeur': new},
               actor=actor, commit=False)
    if actor and actor.role != 'super_admin':
        from app.services.activity import notify_super_admin
        notify_super_admin(f'✏️ Profil client modifié — {label}',
                           f'Par {actor.real_name or actor.username} : ' + ', '.join(FIELD_LABELS.get(f, f) for f in changes),
                           'client', 'info', _safe_url('superadmin.client_detail', cid=user.id), commit=False)
    if {'display_name', 'real_name'} & set(changes):
        notify_client_of_name_change(user)
    return changes, []


def notify_client_of_name_change(user):
    """Prévient le client (espace client + fil de discussion) que son nom affiché a changé."""
    from app.models import Conversation, SystemNotification
    name = user.display_name or user.real_name or user.username
    db.session.add(SystemNotification(user_id=user.id, role_target='client', category='account', type='info',
                                      title='Votre profil a été mis à jour',
                                      message=f'Votre nom affiché est désormais « {name} ».'))
    threads = [c.thread_id for c in Conversation.query.filter_by(client_id=user.id).all()]
    if threads:
        from app.services.chat_store import update_threads

        def mutate(chat):
            chat['clientName'] = name
            notifs = chat.get('clientNotifications') if isinstance(chat.get('clientNotifications'), list) else []
            notifs.insert(0, {
                'id': f'cnotif-{int(datetime.utcnow().timestamp() * 1000)}-profile',
                'msgId': None, 'title': 'Votre profil a été mis à jour',
                'message': f'Votre nom affiché est désormais « {name} ».', 'senderName': 'Conciergerie VIP 3M',
                'type': 'account', 'createdAt': datetime.utcnow().isoformat() + 'Z', 'read': False,
            })
            chat['clientNotifications'] = notifs[:50]
        try:
            update_threads(threads, mutate)
        except Exception:
            pass
