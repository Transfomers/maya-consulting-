"""Accès au fil de discussion partagé avec Node (server/data/db.json) : lecture et mise à jour atomique."""
import json
import os

from flask import current_app

from app.utils.atomic_file import atomic_write


def _path():
    return current_app.config['EXPRESS_DB_JSON']


def load():
    path = _path()
    if not os.path.exists(path):
        return {}
    with open(path, encoding='utf-8') as f:
        return json.load(f)


def get_thread(thread_id):
    for chat in load().get('chats', []) or []:
        if chat.get('id') == thread_id or chat.get('clientId') == thread_id:
            return chat
    return None


def update_threads(thread_ids, mutate):
    """Applique `mutate(chat)` aux fils indiqués et réécrit le fichier de façon atomique."""
    ids = set(thread_ids)
    data = load()
    touched = 0
    for chat in data.get('chats', []) or []:
        if chat.get('id') in ids or chat.get('clientId') in ids:
            mutate(chat)
            touched += 1
    if touched:
        with atomic_write(_path()) as f:
            json.dump(data, f, indent=2, ensure_ascii=False)
    return touched
