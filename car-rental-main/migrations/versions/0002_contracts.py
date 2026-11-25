"""Table des contrats (location / mission VIP)

Revision ID: 0002_contracts
Revises: 0001_baseline
Create Date: 2026-11-25
"""
from alembic import op
import sqlalchemy as sa


revision = '0002_contracts'
down_revision = '0001_baseline'
branch_labels = None
depends_on = None


def upgrade():
    insp = sa.inspect(op.get_bind())
    if 'contract' not in insp.get_table_names():
        op.create_table('contract',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('reference', sa.String(length=20), nullable=False),
        sa.Column('subject', sa.String(length=150), nullable=False),
        sa.Column('contract_type', sa.String(length=30), nullable=False),
        sa.Column('status', sa.String(length=20), nullable=False),
        sa.Column('client_id', sa.Integer(), nullable=False),
        sa.Column('vehicle_id', sa.Integer(), nullable=True),
        sa.Column('trip_id', sa.Integer(), nullable=True),
        sa.Column('booking_id', sa.Integer(), nullable=True),
        sa.Column('agency_id', sa.Integer(), nullable=True),
        sa.Column('start_date', sa.DateTime(), nullable=False),
        sa.Column('end_date', sa.DateTime(), nullable=False),
        sa.Column('pickup_location', sa.String(length=200), nullable=True),
        sa.Column('return_location', sa.String(length=200), nullable=True),
        sa.Column('daily_rate', sa.Float(), nullable=False),
        sa.Column('extra_charges', sa.Float(), nullable=False),
        sa.Column('deposit', sa.Float(), nullable=False),
        sa.Column('total_value', sa.Float(), nullable=False),
        sa.Column('payment_terms', sa.Text(), nullable=True),
        sa.Column('terms', sa.Text(), nullable=True),
        sa.Column('notes', sa.Text(), nullable=True),
        sa.Column('attachment_path', sa.String(length=255), nullable=True),
        sa.Column('created_by_id', sa.Integer(), nullable=True),
        sa.Column('created_at', sa.DateTime(), nullable=True),
        sa.Column('updated_at', sa.DateTime(), nullable=True),
        sa.Column('signed_at', sa.DateTime(), nullable=True),
        sa.Column('cancelled_at', sa.DateTime(), nullable=True),
        sa.Column('is_deleted', sa.Boolean(), nullable=True),
        sa.ForeignKeyConstraint(['agency_id'], ['agency.id'], ),
        sa.ForeignKeyConstraint(['booking_id'], ['booking.id'], ),
        sa.ForeignKeyConstraint(['client_id'], ['user.id'], ),
        sa.ForeignKeyConstraint(['created_by_id'], ['user.id'], ),
        sa.ForeignKeyConstraint(['trip_id'], ['trip.id'], ),
        sa.ForeignKeyConstraint(['vehicle_id'], ['bus.id'], ),
        sa.PrimaryKeyConstraint('id')
        )
    existing = {i['name'] for i in sa.inspect(op.get_bind()).get_indexes('contract')}
    if 'ix_contract_reference' not in existing:
        op.create_index('ix_contract_reference', 'contract', ['reference'], unique=True)
    if 'ix_contract_status' not in existing:
        op.create_index('ix_contract_status', 'contract', ['status'], unique=False)


def downgrade():
    # Ne jamais supprimer de données : pas de retour arrière automatique.
    pass
