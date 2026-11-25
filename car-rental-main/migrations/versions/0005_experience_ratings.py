"""Avis clients : note globale de l'expérience (idempotent)

Revision ID: 0005_experience_ratings
Revises: 0004_test_data_flag
Create Date: 2026-11-25
"""
from alembic import op
import sqlalchemy as sa

revision = '0005_experience_ratings'
down_revision = '0004_test_data_flag'
branch_labels = None
depends_on = None


def upgrade():
    if 'experience_rating' in sa.inspect(op.get_bind()).get_table_names():
        return
    op.create_table(
        'experience_rating',
        sa.Column('id', sa.Integer(), primary_key=True),
        sa.Column('account_number', sa.String(60), nullable=False, unique=True, index=True),
        sa.Column('user_id', sa.Integer(), sa.ForeignKey('user.id'), nullable=True),
        sa.Column('client_name', sa.String(120), nullable=False),
        sa.Column('client_phone', sa.String(40), nullable=True),
        sa.Column('client_email', sa.String(120), nullable=True),
        sa.Column('rating', sa.Integer(), nullable=False),
        sa.Column('comment', sa.Text(), nullable=True),
        sa.Column('status', sa.String(20), nullable=False, server_default='new'),
        sa.Column('admin_reply', sa.Text(), nullable=True),
        sa.Column('replied_at', sa.DateTime(), nullable=True),
        sa.Column('replied_by_id', sa.Integer(), sa.ForeignKey('user.id'), nullable=True),
        sa.Column('resolved_at', sa.DateTime(), nullable=True),
        sa.Column('is_hidden', sa.Boolean(), server_default='0'),
        sa.Column('is_test', sa.Boolean(), server_default='0'),
        sa.Column('created_at', sa.DateTime(), nullable=True),
        sa.Column('updated_at', sa.DateTime(), nullable=True),
    )


def downgrade():
    pass   # ne jamais supprimer des avis clients
