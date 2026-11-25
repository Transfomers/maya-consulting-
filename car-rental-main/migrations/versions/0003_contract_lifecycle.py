"""Contrats : cycle de vie complet (paiements, documents, renouvellement, archivage)

Idempotent : ajoute colonnes / tables manquantes, convertit les anciens types et statuts,
reprend l'ancienne pièce jointe en document. Aucune donnée supprimée.

Revision ID: 0003_contract_lifecycle
Revises: 0002_contracts
Create Date: 2026-11-25
"""
from alembic import op
import sqlalchemy as sa


revision = '0003_contract_lifecycle'
down_revision = '0002_contracts'
branch_labels = None
depends_on = None

NEW_CONTRACT_COLUMNS = [
    sa.Column('apartment_id', sa.String(length=50), nullable=True),
    sa.Column('previous_contract_id', sa.Integer(), nullable=True),
    sa.Column('approved_by_id', sa.Integer(), nullable=True),
    sa.Column('approved_at', sa.DateTime(), nullable=True),
    sa.Column('terminated_at', sa.DateTime(), nullable=True),
    sa.Column('termination_reason', sa.Text(), nullable=True),
    sa.Column('expiry_notified_at', sa.DateTime(), nullable=True),
    sa.Column('is_archived', sa.Boolean(), nullable=True),
    sa.Column('archived_at', sa.DateTime(), nullable=True),
]

TYPE_MAP = {
    'location_courte': 'vehicle_rental', 'location_longue': 'vehicle_rental', 'mission_vip': 'vehicle_rental',
    'residence': 'apartment_rental', 'cadre_entreprise': 'corporate_agreement',
}
STATUS_MAP = {'pending_signature': 'pending_approval', 'cancelled': 'terminated'}


def upgrade():
    bind = op.get_bind()
    insp = sa.inspect(bind)
    tables = set(insp.get_table_names())

    if 'contract' in tables:
        existing = {c['name'] for c in insp.get_columns('contract')}
        missing = [c for c in NEW_CONTRACT_COLUMNS if c.name not in existing]
        if missing:
            with op.batch_alter_table('contract') as batch_op:
                for col in missing:
                    batch_op.add_column(col)

    if 'contract_payment' not in tables:
        op.create_table(
            'contract_payment',
            sa.Column('id', sa.Integer(), nullable=False),
            sa.Column('contract_id', sa.Integer(), nullable=False),
            sa.Column('amount', sa.Float(), nullable=False),
            sa.Column('method', sa.String(length=30), nullable=False),
            sa.Column('reference', sa.String(length=80), nullable=True),
            sa.Column('note', sa.String(length=255), nullable=True),
            sa.Column('is_deposit', sa.Boolean(), nullable=True),
            sa.Column('paid_at', sa.DateTime(), nullable=True),
            sa.Column('recorded_by_id', sa.Integer(), nullable=True),
            sa.Column('is_void', sa.Boolean(), nullable=True),
            sa.Column('voided_at', sa.DateTime(), nullable=True),
            sa.Column('void_reason', sa.String(length=255), nullable=True),
            sa.ForeignKeyConstraint(['contract_id'], ['contract.id']),
            sa.ForeignKeyConstraint(['recorded_by_id'], ['user.id']),
            sa.PrimaryKeyConstraint('id'),
        )
        op.create_index('ix_contract_payment_contract_id', 'contract_payment', ['contract_id'])

    if 'contract_document' not in tables:
        op.create_table(
            'contract_document',
            sa.Column('id', sa.Integer(), nullable=False),
            sa.Column('contract_id', sa.Integer(), nullable=False),
            sa.Column('stored_name', sa.String(length=64), nullable=False),
            sa.Column('original_name', sa.String(length=200), nullable=False),
            sa.Column('mime_type', sa.String(length=100), nullable=False),
            sa.Column('size_bytes', sa.Integer(), nullable=False),
            sa.Column('doc_type', sa.String(length=40), nullable=False),
            sa.Column('uploaded_by_id', sa.Integer(), nullable=True),
            sa.Column('uploaded_at', sa.DateTime(), nullable=True),
            sa.Column('is_deleted', sa.Boolean(), nullable=True),
            sa.ForeignKeyConstraint(['contract_id'], ['contract.id']),
            sa.ForeignKeyConstraint(['uploaded_by_id'], ['user.id']),
            sa.PrimaryKeyConstraint('id'),
        )
        op.create_index('ix_contract_document_contract_id', 'contract_document', ['contract_id'])

    if 'contract' in tables:
        for old, new in TYPE_MAP.items():
            bind.execute(sa.text('UPDATE contract SET contract_type = :n WHERE contract_type = :o'), {'n': new, 'o': old})
        for old, new in STATUS_MAP.items():
            bind.execute(sa.text('UPDATE contract SET status = :n WHERE status = :o'), {'n': new, 'o': old})
        bind.execute(sa.text('UPDATE contract SET is_archived = 0 WHERE is_archived IS NULL'))
        # Ancienne pièce jointe unique → document
        rows = bind.execute(sa.text(
            "SELECT id, attachment_path, reference, created_by_id, created_at FROM contract "
            "WHERE attachment_path IS NOT NULL AND attachment_path != ''")).fetchall()
        for cid, path, ref, by, at in rows:
            already = bind.execute(sa.text('SELECT 1 FROM contract_document WHERE contract_id = :c AND stored_name = :s'),
                                   {'c': cid, 's': path}).first()
            if already:
                continue
            ext = path.rsplit('.', 1)[-1].lower()
            mime = {'pdf': 'application/pdf', 'jpg': 'image/jpeg', 'png': 'image/png'}.get(ext, 'application/octet-stream')
            bind.execute(sa.text(
                'INSERT INTO contract_document (contract_id, stored_name, original_name, mime_type, size_bytes, doc_type, '
                'uploaded_by_id, uploaded_at, is_deleted) VALUES (:c, :s, :o, :m, 0, :t, :b, :a, 0)'),
                {'c': cid, 's': path, 'o': f'{ref}-piece-jointe.{ext}', 'm': mime, 't': 'signed_contract', 'b': by, 'a': at})


def downgrade():
    # Ne jamais supprimer de données : pas de retour arrière automatique.
    pass
