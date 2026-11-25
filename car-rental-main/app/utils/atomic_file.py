"""Écriture atomique de fichiers partagés (server/data/db.json, partagé avec Node).

On écrit dans un fichier temporaire du même dossier puis on le renomme : un lecteur
(Node ou Flask) voit soit l'ancien contenu complet, soit le nouveau, jamais un fichier
tronqué. Un fichier tronqué lu par Node était remplacé par une base vide (perte des chats).
"""
import contextlib
import os
import tempfile


@contextlib.contextmanager
def atomic_write(path, encoding='utf-8'):
    directory = os.path.dirname(os.path.abspath(path)) or '.'
    os.makedirs(directory, exist_ok=True)
    fd, tmp = tempfile.mkstemp(prefix='.' + os.path.basename(path) + '.', suffix='.tmp', dir=directory)
    try:
        with os.fdopen(fd, 'w', encoding=encoding) as f:
            yield f
            f.flush()
            os.fsync(f.fileno())
        try:
            os.chmod(tmp, os.stat(path).st_mode & 0o777)
        except OSError:
            os.chmod(tmp, 0o644)
        os.replace(tmp, path)
    except BaseException:
        with contextlib.suppress(OSError):
            os.unlink(tmp)
        raise
