"""add category extra fields

Revision ID: b2c3d4e5f6a7
Revises: a6b1c47915f2
Create Date: 2026-10-17 13:30:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = 'b2c3d4e5f6a7'
down_revision: Union[str, Sequence[str], None] = 'a6b1c47915f2'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    with op.batch_alter_table('categories', schema=None) as batch_op:
        batch_op.add_column(sa.Column('description', sa.Text(), nullable=True))
        batch_op.add_column(sa.Column('display_order', sa.Integer(), server_default='0', nullable=True))
        batch_op.add_column(sa.Column('is_archived', sa.Boolean(), server_default='0', nullable=True))


def downgrade() -> None:
    with op.batch_alter_table('categories', schema=None) as batch_op:
        batch_op.drop_column('is_archived')
        batch_op.drop_column('display_order')
        batch_op.drop_column('description')
