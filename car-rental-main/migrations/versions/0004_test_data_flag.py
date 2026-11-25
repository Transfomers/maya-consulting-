"""Indicateur is_test (données de démonstration exclues des indicateurs)

Idempotent : ajoute la colonne si elle manque. Aucune donnée supprimée.

Revision ID: 0004_test_data_flag
Revises: 0002_contracts_module
Create Date: 2026-11-25
"""
from alembic import op
import sqlalchemy as sa

revision = '0004_test_data_flag'
down_revision = '0002_contracts_module'
branch_labels = None
depends_on = None

TABLES = ('user', 'booking', 'trip', 'apartment_booking', 'contract')


def upgrade():
    insp = sa.inspect(op.get_bind())
    tables = set(insp.get_table_names())
    for table in TABLES:
        if table in tables and 'is_test' not in {c['name'] for c in insp.get_columns(table)}:
            with op.batch_alter_table(table) as batch_op:
                batch_op.add_column(sa.Column('is_test', sa.Boolean(), nullable=True, server_default=sa.false()))


def downgrade():
    pass
