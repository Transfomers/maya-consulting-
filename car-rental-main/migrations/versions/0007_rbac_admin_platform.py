"""Rôles personnalisés, statut des comptes, tâches d'amélioration, annonces (idempotent)

Revision ID: 0007_rbac_admin_platform
Revises: 0006_identity_conversations
Create Date: 2026-11-26
"""
from alembic import op

revision = '0007_rbac_admin_platform'
down_revision = '0006_identity_conversations'
branch_labels = None
depends_on = None


def upgrade():
    from app.services.identity_schema import ensure_identity_schema
    ensure_identity_schema(op.get_bind())
    from app.services.permissions import seed_roles
    seed_roles(op.get_bind())


def downgrade():
    pass   # aucune suppression de données
