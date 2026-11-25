"""Complément schéma Contrats — idempotent

Ajoute les colonnes de suivi (apartment_id, renouvellement, approbation,
résiliation, échéance, archivage) sur la table `contract` et crée
`contract_payment` / `contract_document` si absentes.

Revision ID: 0002_contracts_module
Revises: 0003_contract_lifecycle
Create Date: 2026-11-25
"""
from alembic import op
import sqlalchemy as sa


revision = '0002_contracts_module'
down_revision = '0003_contract_lifecycle'  # chaîne unique (idempotent, sans effet après 0003)
branch_labels = None
depends_on = None


def _ensure_columns(table_name, columns):
    insp = sa.inspect(op.get_bind())
    if table_name not in insp.get_table_names():
        return
    existing = {c['name'] for c in insp.get_columns(table_name)}
    missing = [col for col in columns if col.name not in existing]
    if missing:
        with op.batch_alter_table(table_name) as batch_op:
            for col in missing:
                batch_op.add_column(col)


def upgrade():
    insp = sa.inspect(op.get_bind())
    tables = set(insp.get_table_names())

    if 'contract' not in tables:
        op.create_table(
            'contract',
            sa.Column('id', sa.Integer(), primary_key=True),
            sa.Column('reference', sa.String(20), nullable=False, unique=True),
            sa.Column('subject', sa.String(150), nullable=False),
            sa.Column('contract_type', sa.String(30), nullable=False, server_default='vehicle_rental'),
            sa.Column('status', sa.String(20), nullable=False, server_default='draft'),
            sa.Column('client_id', sa.Integer(), nullable=False),
            sa.Column('vehicle_id', sa.Integer(), nullable=True),
            sa.Column('apartment_id', sa.String(50), nullable=True),
            sa.Column('trip_id', sa.Integer(), nullable=True),
            sa.Column('booking_id', sa.Integer(), nullable=True),
            sa.Column('agency_id', sa.Integer(), nullable=True),
            sa.Column('previous_contract_id', sa.Integer(), nullable=True),
            sa.Column('start_date', sa.DateTime(), nullable=False),
            sa.Column('end_date', sa.DateTime(), nullable=False),
            sa.Column('pickup_location', sa.String(200), nullable=True),
            sa.Column('return_location', sa.String(200), nullable=True),
            sa.Column('daily_rate', sa.Float(), nullable=False, server_default='0'),
            sa.Column('extra_charges', sa.Float(), nullable=False, server_default='0'),
            sa.Column('deposit', sa.Float(), nullable=False, server_default='0'),
            sa.Column('total_value', sa.Float(), nullable=False, server_default='0'),
            sa.Column('payment_terms', sa.Text(), nullable=True),
            sa.Column('terms', sa.Text(), nullable=True),
            sa.Column('notes', sa.Text(), nullable=True),
            sa.Column('attachment_path', sa.String(255), nullable=True),
            sa.Column('created_by_id', sa.Integer(), nullable=True),
            sa.Column('approved_by_id', sa.Integer(), nullable=True),
            sa.Column('created_at', sa.DateTime(), nullable=True),
            sa.Column('updated_at', sa.DateTime(), nullable=True),
            sa.Column('approved_at', sa.DateTime(), nullable=True),
            sa.Column('signed_at', sa.DateTime(), nullable=True),
            sa.Column('cancelled_at', sa.DateTime(), nullable=True),
            sa.Column('terminated_at', sa.DateTime(), nullable=True),
            sa.Column('termination_reason', sa.Text(), nullable=True),
            sa.Column('expiry_notified_at', sa.DateTime(), nullable=True),
            sa.Column('is_archived', sa.Boolean(), server_default='0'),
            sa.Column('archived_at', sa.DateTime(), nullable=True),
            sa.Column('is_deleted', sa.Boolean(), server_default='0'),
        )
    else:
        _ensure_columns('contract', [
            sa.Column('apartment_id', sa.String(50), nullable=True),
            sa.Column('previous_contract_id', sa.Integer(), nullable=True),
            sa.Column('approved_by_id', sa.Integer(), nullable=True),
            sa.Column('approved_at', sa.DateTime(), nullable=True),
            sa.Column('terminated_at', sa.DateTime(), nullable=True),
            sa.Column('termination_reason', sa.Text(), nullable=True),
            sa.Column('expiry_notified_at', sa.DateTime(), nullable=True),
            sa.Column('is_archived', sa.Boolean(), nullable=True, server_default='0'),
            sa.Column('archived_at', sa.DateTime(), nullable=True),
        ])

    if 'contract_payment' not in tables:
        op.create_table(
            'contract_payment',
            sa.Column('id', sa.Integer(), primary_key=True),
            sa.Column('contract_id', sa.Integer(), nullable=False),
            sa.Column('amount', sa.Float(), nullable=False),
            sa.Column('method', sa.String(30), nullable=False, server_default='cash'),
            sa.Column('reference', sa.String(80), nullable=True),
            sa.Column('note', sa.String(255), nullable=True),
            sa.Column('is_deposit', sa.Boolean(), server_default='0'),
            sa.Column('paid_at', sa.DateTime(), nullable=True),
            sa.Column('recorded_by_id', sa.Integer(), nullable=True),
            sa.Column('is_void', sa.Boolean(), server_default='0'),
            sa.Column('voided_at', sa.DateTime(), nullable=True),
            sa.Column('void_reason', sa.String(255), nullable=True),
        )

    if 'contract_document' not in tables:
        op.create_table(
            'contract_document',
            sa.Column('id', sa.Integer(), primary_key=True),
            sa.Column('contract_id', sa.Integer(), nullable=False),
            sa.Column('stored_name', sa.String(64), nullable=False),
            sa.Column('original_name', sa.String(200), nullable=False),
            sa.Column('mime_type', sa.String(100), nullable=False),
            sa.Column('size_bytes', sa.Integer(), nullable=False, server_default='0'),
            sa.Column('doc_type', sa.String(40), nullable=False, server_default='signed_contract'),
            sa.Column('uploaded_by_id', sa.Integer(), nullable=True),
            sa.Column('uploaded_at', sa.DateTime(), nullable=True),
            sa.Column('is_deleted', sa.Boolean(), server_default='0'),
        )


def downgrade():
    pass
