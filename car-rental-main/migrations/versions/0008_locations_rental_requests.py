"""Lieux (villes, arrondissements, quartiers) et demandes de location (idempotent)

Revision ID: 0008_locations_rental
Revises: 0007_rbac_admin_platform
Create Date: 2026-11-27
"""
from alembic import op

revision = '0008_locations_rental'
down_revision = '0007_rbac_admin_platform'
branch_labels = None
depends_on = None


def upgrade():
    from app.services.rental_schema import ensure_rental_schema
    ensure_rental_schema(op.get_bind())


def downgrade():
    pass   # aucune suppression de données
