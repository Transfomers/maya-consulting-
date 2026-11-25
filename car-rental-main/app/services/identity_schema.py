"""Schéma « identité client, conversations, Super Admin » — idempotent.

Utilisé par la migration 0006 et au démarrage (comme les autres ensure_*). Ajoute des colonnes,
crée des tables, des index et les triggers qui rendent le journal d'audit immuable.
Ne supprime ni ne modifie aucune donnée existante.
"""
from sqlalchemy import inspect as sa_inspect, text

NEW_COLUMNS = {
    'user': [
        ('client_code', 'VARCHAR(20)'), ('display_name', 'VARCHAR(120)'), ('client_source', 'VARCHAR(30)'),
        ('external_account', 'VARCHAR(60)'), ('assigned_admin_id', 'INTEGER'), ('client_status', 'VARCHAR(20)'),
        ('phone_key', 'VARCHAR(12)'), ('last_seen_at', 'DATETIME'),
    ],
    'audit_log': [
        ('actor_name', 'VARCHAR(120)'), ('actor_role', 'VARCHAR(30)'), ('category', 'VARCHAR(30)'),
        ('target_label', 'VARCHAR(160)'),
    ],
    'system_notification': [('link', 'VARCHAR(255)')],
}

INDEXES = [
    ('ix_user_client_code', 'user', 'client_code', True),
    ('ix_user_external_account', 'user', 'external_account', False),
    ('ix_user_phone_key', 'user', 'phone_key', False),
    ('ix_user_assigned_admin_id', 'user', 'assigned_admin_id', False),
    ('ix_user_role', 'user', 'role', False),
    ('ix_audit_log_created_at', 'audit_log', 'created_at', False),
    ('ix_audit_log_user_id', 'audit_log', 'user_id', False),
    ('ix_audit_log_action', 'audit_log', 'action', False),
    ('ix_audit_log_category', 'audit_log', 'category', False),
    ('ix_system_notification_created_at', 'system_notification', 'created_at', False),
]

# Journal d'audit immuable : seule la mise à NULL de l'acteur (suppression d'un compte) reste permise.
TRIGGERS = {
    'audit_log_no_delete': '''CREATE TRIGGER audit_log_no_delete BEFORE DELETE ON audit_log
        BEGIN SELECT RAISE(ABORT, 'audit_log est immuable'); END''',
    'audit_log_no_update': '''CREATE TRIGGER audit_log_no_update BEFORE UPDATE OF
        action, category, target_type, target_id, target_label, details, ip_address, created_at, actor_name, actor_role
        ON audit_log BEGIN SELECT RAISE(ABORT, 'audit_log est immuable'); END''',
}


def ensure_identity_schema(bind):
    """`bind` : connexion ou moteur SQLAlchemy (op.get_bind() ou db.engine)."""
    from app.models import Conversation, ConversationNote, NotificationPreference, RolePermission, SystemSetting

    def run(conn):
        insp = sa_inspect(conn)
        tables = set(insp.get_table_names())
        for table, cols in NEW_COLUMNS.items():
            if table not in tables:
                continue
            existing = {c['name'] for c in insp.get_columns(table)}
            for name, ddl in cols:
                if name not in existing:
                    conn.execute(text(f'ALTER TABLE "{table}" ADD COLUMN {name} {ddl}'))
        for model in (Conversation, ConversationNote, RolePermission, NotificationPreference, SystemSetting):
            if model.__tablename__ not in tables:
                model.__table__.create(conn)
        for name, table, col, unique in INDEXES:
            conn.execute(text(f'CREATE {"UNIQUE " if unique else ""}INDEX IF NOT EXISTS {name} ON "{table}" ({col})'))
        # Un seul client actif par numéro (9 chiffres) / compte du site : protège contre les messages simultanés
        for name, col in (('uq_client_phone_key', 'phone_key'), ('uq_client_external_account', 'external_account')):
            try:
                conn.execute(text(f"CREATE UNIQUE INDEX IF NOT EXISTS {name} ON \"user\" ({col}) "
                                  f"WHERE role = 'client' AND is_deleted = 0 AND {col} IS NOT NULL"))
            except Exception:   # doublons déjà présents : l'index sera créé une fois ceux-ci fusionnés
                pass
        if conn.dialect.name == 'sqlite' and 'audit_log' in tables:
            have = {r[0] for r in conn.execute(text("SELECT name FROM sqlite_master WHERE type='trigger'"))}
            for name, ddl in TRIGGERS.items():
                if name not in have:
                    conn.execute(text(ddl))

    if hasattr(bind, 'begin') and not hasattr(bind, 'in_transaction'):
        with bind.begin() as conn:      # moteur
            run(conn)
    else:
        run(bind)                        # connexion (Alembic)
