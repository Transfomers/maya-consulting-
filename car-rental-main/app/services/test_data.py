"""Données de démonstration / test : repérage, marquage (réversible) et exclusion des indicateurs.

Rien n'est supprimé : les enregistrements sont seulement marqués `is_test = 1`.
Commandes :
    flask test-data scan            # liste ce qui serait marqué, avec la raison
    flask test-data apply           # marque les enregistrements listés
    flask test-data undo            # retire toutes les marques
    flask test-data mark  user 12   # marque / démarque un enregistrement précis
    flask test-data unmark booking 34
"""
import re

import click
from flask.cli import AppGroup
from sqlalchemy import inspect as sa_inspect, text

from app import db

TABLES = ('user', 'booking', 'trip', 'apartment_booking', 'contract', 'experience_rating')

# Indices de données fictives (modèles de démo, numéros US, noms de test)
FAKE_EMAIL_DOMAINS = ('rentq.com', 'example.com', 'example.org', 'test.com', 'test.local')
FAKE_NAME_RE = re.compile(r'\b(test|tesyt|demo|démo|dummy|fake|transformers network)\b', re.I)
PLACEHOLDER_EMAILS = {'client@3mservice.shop'}          # client « VIP » créé automatiquement au démarrage
COMPANY_PHONES = ('691786447', '698668761')             # numéros de 3M SERVICES : jamais ceux d'un client réel


def ensure_test_flag_columns():
    """Ajoute la colonne is_test si elle manque (avant la migration), sans toucher aux données."""
    insp = sa_inspect(db.engine)
    existing_tables = set(insp.get_table_names())
    changed = False
    for table in TABLES:
        if table in existing_tables and 'is_test' not in {c['name'] for c in insp.get_columns(table)}:
            db.session.execute(text(f'ALTER TABLE "{table}" ADD COLUMN is_test BOOLEAN DEFAULT 0'))
            changed = True
    if changed:
        db.session.commit()


def _user_reason(u):
    email = (u.email or '').lower()
    if email in PLACEHOLDER_EMAILS:
        return 'client fictif créé automatiquement au démarrage'
    if any(email.endswith('@' + d) for d in FAKE_EMAIL_DOMAINS):
        return f'e-mail de démonstration ({email.split("@")[1]})'
    if (u.phone or '').strip().startswith('(555)'):
        return 'numéro fictif (555)'
    if re.sub(r'\D', '', u.phone or '')[-9:] in COMPANY_PHONES:
        return 'numéro de 3M SERVICES utilisé comme numéro client'
    if FAKE_NAME_RE.search(f'{u.real_name or ""} {u.username or ""}'):
        return 'nom de test'
    return None


def scan():
    """Renvoie {table: [(id, libellé, raison)]} des enregistrements à marquer (non encore marqués)."""
    from app.models import ApartmentBooking, Booking, Contract, Trip, User
    found = {t: [] for t in TABLES}
    test_user_ids = set()
    for u in User.query.filter(User.role == 'client').all():
        reason = _user_reason(u)
        if reason:
            test_user_ids.add(u.id)
            if not u.is_test:
                found['user'].append((u.id, u.real_name or u.username, reason))
    test_user_ids |= {u.id for u in User.query.filter(User.is_test == True).all()}  # noqa: E712

    test_booking_ids = set()
    for b in Booking.query.all():
        reason = None
        if b.user_id in test_user_ids:
            reason = 'réservation d’un client de test'
        elif FAKE_NAME_RE.search(b.passenger_name or ''):
            reason = 'nom de passager de test'
        if reason or b.is_test:
            test_booking_ids.add(b.id)
        if reason and not b.is_test:
            found['booking'].append((b.id, f'{b.booking_code or b.id} — {b.passenger_name or ""}', reason))

    # Mission : de test seulement si TOUTES ses réservations sont de test (jamais une mission réelle)
    for t in Trip.query.all():
        bookings = t.bookings.all() if hasattr(t.bookings, 'all') else list(t.bookings)
        if bookings and all(b.id in test_booking_ids for b in bookings) and not t.is_test:
            found['trip'].append((t.id, f'Mission #{t.id} du {t.departure_time:%d/%m/%Y}', 'uniquement des réservations de test'))

    for a in ApartmentBooking.query.all():
        if not a.is_test and (a.user_id in test_user_ids or FAKE_NAME_RE.search(a.guest_name or '')):
            found['apartment_booking'].append((a.id, f'{a.booking_ref} — {a.guest_name}', 'séjour de test'))

    for c in Contract.query.all():
        if not c.is_test and c.client_id in test_user_ids:
            found['contract'].append((c.id, f'{c.reference} — {c.subject}', 'contrat d’un client de test'))

    from app.models import ExperienceRating
    for r in ExperienceRating.query.all():
        if not r.is_test and r.user_id in test_user_ids:
            found['experience_rating'].append((r.id, f'{r.rating}/5 — {r.client_name}', 'avis d’un client de test'))
    return found


def _model_for(table):
    from app.models import ApartmentBooking, Booking, Contract, ExperienceRating, Trip, User
    return {'user': User, 'booking': Booking, 'trip': Trip, 'apartment_booking': ApartmentBooking,
            'contract': Contract, 'experience_rating': ExperienceRating}[table]


def apply_scan():
    found = scan()
    total = 0
    for table, rows in found.items():
        model = _model_for(table)
        for rid, _label, _reason in rows:
            obj = db.session.get(model, rid)
            if obj is not None:
                obj.is_test = True
                total += 1
    db.session.commit()
    return found, total


test_data_cli = AppGroup('test-data', help='Repérer et marquer les données de démonstration (rien n’est supprimé).')


def _print(found):
    labels = {'user': 'Clients', 'booking': 'Réservations', 'trip': 'Missions',
              'apartment_booking': 'Séjours appartements', 'contract': 'Contrats', 'experience_rating': 'Avis clients'}
    n = 0
    for table, rows in found.items():
        if not rows:
            continue
        click.echo(f'\n{labels[table]} ({len(rows)})')
        for rid, label, reason in rows:
            click.echo(f'  #{rid:<5} {label}  → {reason}')
            n += 1
    click.echo(f'\n{n} enregistrement(s) concerné(s).' if n else 'Aucune donnée de test détectée.')


@test_data_cli.command('scan')
def scan_cmd():
    """Liste ce qui serait marqué comme donnée de test."""
    _print(scan())


@test_data_cli.command('apply')
def apply_cmd():
    """Marque les enregistrements détectés (réversible)."""
    found, total = apply_scan()
    _print(found)
    click.echo(f'{total} enregistrement(s) marqué(s) comme test. Annuler : flask test-data undo')


@test_data_cli.command('undo')
def undo_cmd():
    """Retire toutes les marques de test."""
    for table in TABLES:
        db.session.execute(text(f'UPDATE "{table}" SET is_test = 0 WHERE is_test = 1'))
    db.session.commit()
    click.echo('Toutes les marques de test ont été retirées.')


@test_data_cli.command('mark')
@click.argument('table', type=click.Choice(TABLES))
@click.argument('record_id')
def mark_cmd(table, record_id):
    """Marque un enregistrement précis comme test."""
    obj = db.session.get(_model_for(table), int(record_id) if record_id.isdigit() else record_id)
    if not obj:
        raise click.ClickException('Enregistrement introuvable.')
    obj.is_test = True
    db.session.commit()
    click.echo(f'{table} #{record_id} marqué comme test.')


@test_data_cli.command('unmark')
@click.argument('table', type=click.Choice(TABLES))
@click.argument('record_id')
def unmark_cmd(table, record_id):
    """Retire la marque de test d'un enregistrement."""
    obj = db.session.get(_model_for(table), int(record_id) if record_id.isdigit() else record_id)
    if not obj:
        raise click.ClickException('Enregistrement introuvable.')
    obj.is_test = False
    db.session.commit()
    click.echo(f'{table} #{record_id} n’est plus marqué comme test.')
