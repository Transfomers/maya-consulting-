"""Identité client, conversations centralisées, Super Admin, audit immuable (idempotent)

Revision ID: 0006_identity_conversations
Revises: 0005_experience_ratings
Create Date: 2026-11-25
"""
from alembic import op

revision = '0006_identity_conversations'
down_revision = '0005_experience_ratings'
branch_labels = None
depends_on = None


def upgrade():
    from app.services.identity_schema import ensure_identity_schema
    ensure_identity_schema(op.get_bind())


def downgrade():
    pass   # ne jamais supprimer l'historique clients / conversations / audit
