"""Indicateurs du tableau de bord (données réelles uniquement).

- Réservations véhicules : réservations admin (Booking), annulées exclues des actives.
- Nouveaux clients : comptes clients dédoublonnés par téléphone / e-mail.
- Réservations appartements : séjours (ApartmentBooking), annulés et blocages exclus.
- Chiffre d'affaires : paiements réellement enregistrés (jamais la valeur d'un contrat).
"""
import json
import os
import re
from datetime import date, datetime, timedelta

from flask import current_app
from sqlalchemy import func

from app import db
from app.models import (ApartmentBooking, Booking, Contract, ContractPayment, Payment,
                        Route, Trip, User)

PERIODS = {
    'today': "Aujourd'hui",
    '7d': '7 derniers jours',
    '30d': '30 derniers jours',
    'month': 'Ce mois-ci',
    'year': 'Cette année',
    'custom': 'Période personnalisée',
}
CLOSED_TRIP = ('cancelled', 'completed', 'closed', 'returned', 'arrived', 'archived', 'rejected', 'no_show')
BOOKING_PENDING = ('locked', 'pending')
APT_EXCLUDED = ('cancelled', 'maintenance_block')
APT_CONFIRMED = ('confirmed', 'checked_in', 'checked_out')
SITE_PENDING = ('demande reçue', 'en attente', 'en discussion', 'request received', 'pending')


# ── Période ─────────────────────────────────────────────────────────────
def resolve_period(args):
    """Renvoie un dict : key, label, start, end (datetime, fin exclusive), prev_start, prev_end, start_date, end_date."""
    key = args.get('period', '30d')
    today = date.today()
    start_d = end_d = None
    if key == 'custom':
        try:
            start_d = datetime.strptime(args.get('start', ''), '%Y-%m-%d').date()
            end_d = datetime.strptime(args.get('end', ''), '%Y-%m-%d').date()
            if end_d < start_d:
                start_d, end_d = end_d, start_d
            if (end_d - start_d).days > 3660:
                start_d = end_d - timedelta(days=3660)
        except ValueError:
            key = '30d'
    if key not in PERIODS or (key == 'custom' and not start_d):
        key = '30d'
    if key == 'today':
        start_d = end_d = today
    elif key == '7d':
        start_d, end_d = today - timedelta(days=6), today
    elif key == '30d':
        start_d, end_d = today - timedelta(days=29), today
    elif key == 'month':
        start_d, end_d = today.replace(day=1), today
    elif key == 'year':
        start_d, end_d = today.replace(month=1, day=1), today
    start = datetime.combine(start_d, datetime.min.time())
    end = datetime.combine(end_d + timedelta(days=1), datetime.min.time())
    span = end - start
    label = PERIODS[key] if key != 'custom' else f"Du {start_d:%d/%m/%Y} au {end_d:%d/%m/%Y}"
    return {'key': key, 'label': label, 'start': start, 'end': end,
            'prev_start': start - span, 'prev_end': start,
            'start_date': start_d, 'end_date': end_d, 'days': span.days}


def trend(current, previous):
    """Variation en % (None si pas de base de comparaison)."""
    if not previous:
        return None if not current else 100
    return round((current - previous) * 100.0 / previous)


# ── Données réelles uniquement : les enregistrements marqués « test » sont exclus ──
def real(model):
    return db.or_(model.is_test == False, model.is_test == None)  # noqa: E711,E712


# ── Requêtes de base (périmètre agence) ────────────────────────────────
def _booking_q(agency_id):
    q = Booking.query.filter(Booking.is_deleted == False, real(Booking))  # noqa: E712
    if agency_id:
        ids = db.session.query(Trip.id).join(Route).filter(Route.agency_id == agency_id, Trip.is_deleted == False)  # noqa: E712
        q = q.filter(Booking.trip_id.in_(ids))
    return q


def _apt_q():
    return ApartmentBooking.query.filter(~ApartmentBooking.status.in_(APT_EXCLUDED), real(ApartmentBooking))


def _site_requests():
    """Demandes de réservation reçues sur le site et pas encore traitées (fichier de l'API Node)."""
    try:
        path = current_app.config.get('EXPRESS_DB_JSON')
        if not path or not os.path.exists(path):
            return []
        with open(path, encoding='utf-8') as f:
            data = json.load(f)
    except (OSError, ValueError):
        return []
    out = []
    for b in data.get('bookings') or []:
        if str(b.get('status', '')).strip().lower() in SITE_PENDING:
            out.append(b)
    return out


# ── Réservations véhicules ─────────────────────────────────────────────
def vehicle_reservations(agency_id, period):
    base = _booking_q(agency_id)
    now = datetime.now()
    in_period = base.filter(Booking.booking_date >= period['start'], Booking.booking_date < period['end'])
    prev = base.filter(Booking.booking_date >= period['prev_start'], Booking.booking_date < period['prev_end'],
                       Booking.status != 'cancelled')
    new = in_period.filter(Booking.status != 'cancelled').count()
    active = (base.join(Trip, Booking.trip_id == Trip.id)
              .filter(Booking.status == 'confirmed', Trip.arrival_time >= now, ~Trip.status.in_(CLOSED_TRIP), real(Trip))
              .count())
    return {
        'total': base.filter(Booking.status != 'cancelled').count(),
        'new': new,
        'confirmed': in_period.filter(Booking.status == 'confirmed').count(),
        'pending': in_period.filter(Booking.status.in_(BOOKING_PENDING)).count(),
        'cancelled': in_period.filter(Booking.status == 'cancelled').count(),
        'active': active,
        'site_pending': len(_site_requests()),
        'trend': trend(new, prev.count()),
    }


# ── Clients (dédoublonnés) ─────────────────────────────────────────────
def _client_key(u):
    digits = re.sub(r'\D', '', u.phone or '')
    if len(digits) >= 8:
        return 'tel:' + digits[-9:]
    email = (u.email or '').strip().lower()
    if email and not email.endswith('.local'):
        return 'mail:' + email
    return f'id:{u.id}'


def clients(period):
    users = User.query.filter(User.role == 'client', User.is_deleted == False, real(User)).all()  # noqa: E712
    first_seen = {}
    for u in users:
        k = _client_key(u)
        created = u.created_at or datetime(2000, 1, 1)
        if k not in first_seen or created < first_seen[k]:
            first_seen[k] = created
    new = sum(1 for d in first_seen.values() if period['start'] <= d < period['end'])
    prev = sum(1 for d in first_seen.values() if period['prev_start'] <= d < period['prev_end'])
    return {'total': len(first_seen), 'new': new, 'duplicates_merged': len(users) - len(first_seen), 'trend': trend(new, prev)}


# ── Réservations appartements ──────────────────────────────────────────
def apartment_reservations(period):
    base = _apt_q()
    today = date.today()
    in_period = base.filter(ApartmentBooking.created_at >= period['start'], ApartmentBooking.created_at < period['end'])
    prev = base.filter(ApartmentBooking.created_at >= period['prev_start'], ApartmentBooking.created_at < period['prev_end']).count()
    new = in_period.count()
    active = base.filter(
        db.or_(ApartmentBooking.status == 'checked_in',
               db.and_(ApartmentBooking.status == 'confirmed',
                       ApartmentBooking.check_in <= today, ApartmentBooking.check_out > today))
    ).count()
    return {
        'total': base.count(),
        'new': new,
        'confirmed': in_period.filter(ApartmentBooking.status.in_(APT_CONFIRMED)).count(),
        'unpaid': in_period.filter(ApartmentBooking.payment_status == 'pending').count(),
        'active': active,
        'upcoming': base.filter(ApartmentBooking.status == 'confirmed', ApartmentBooking.check_in > today).count(),
        'trend': trend(new, prev),
    }


# ── Chiffre d'affaires encaissé ────────────────────────────────────────
def revenue_between(agency_id, start=None, end=None):
    """Somme des paiements réellement enregistrés, par source. start/end = None : depuis toujours."""
    def window(q, col):
        if start is not None:
            q = q.filter(col >= start)
        if end is not None:
            q = q.filter(col < end)
        return q

    # 1) Réservations véhicules : paiements enregistrés…
    bq = _booking_q(agency_id)
    booking_ids = bq.with_entities(Booking.id)
    pay_q = window(Payment.query.filter(Payment.status == 'completed', Payment.booking_id.in_(booking_ids)), Payment.created_at)
    reservations = float(pay_q.with_entities(func.coalesce(func.sum(Payment.amount), 0)).scalar() or 0)
    # …ou, à défaut de ligne de paiement, réservation marquée payée (montant réglé)
    with_payment = db.session.query(Payment.booking_id).filter(Payment.status == 'completed')
    legacy_q = window(bq.filter(Booking.status == 'confirmed', Booking.payment_status == 'paid',
                                ~Booking.id.in_(with_payment)), Booking.booking_date)
    reservations += float(legacy_q.with_entities(func.coalesce(func.sum(Booking.price_paid), 0)).scalar() or 0)

    # 2) Contrats : paiements hors caution, hors annulés
    cq = ContractPayment.query.join(Contract, ContractPayment.contract_id == Contract.id).filter(
        ContractPayment.is_void == False, ContractPayment.is_deposit == False, Contract.is_deleted == False, real(Contract))  # noqa: E712
    if agency_id:
        cq = cq.filter(Contract.agency_id == agency_id)
    contracts = float(window(cq, ContractPayment.paid_at).with_entities(func.coalesce(func.sum(ContractPayment.amount), 0)).scalar() or 0)

    # 3) Appartements : montant réellement reçu (payé = total, partiel = acompte)
    apartments = 0.0
    if not agency_id:
        aq = window(_apt_q(), ApartmentBooking.created_at)
        for b in aq.filter(ApartmentBooking.payment_status.in_(('paid', 'partial'))).all():
            apartments += float(b.total_amount or 0) if b.payment_status == 'paid' else float(b.deposit_paid or 0)

    return {'reservations': reservations, 'contracts': contracts, 'apartments': apartments,
            'total': reservations + contracts + apartments}


def revenue(agency_id, period):
    cur = revenue_between(agency_id, period['start'], period['end'])
    prev = revenue_between(agency_id, period['prev_start'], period['prev_end'])['total']
    return {'total_all': revenue_between(agency_id)['total'], 'period': cur['total'], 'breakdown': cur,
            'trend': trend(cur['total'], prev)}


# ── Séries pour les graphiques (jour, ou mois au-delà de 62 jours) ────
def series(agency_id, period):
    monthly = period['days'] > 62
    buckets, labels = [], []
    if monthly:
        d = period['start_date'].replace(day=1)
        while d <= period['end_date']:
            nxt = (d.replace(day=28) + timedelta(days=4)).replace(day=1)
            buckets.append((datetime.combine(max(d, period['start_date']), datetime.min.time()),
                            datetime.combine(min(nxt, period['end_date'] + timedelta(days=1)), datetime.min.time())))
            labels.append(d.strftime('%m/%Y'))
            d = nxt
    else:
        d = period['start_date']
        while d <= period['end_date']:
            buckets.append((datetime.combine(d, datetime.min.time()), datetime.combine(d + timedelta(days=1), datetime.min.time())))
            labels.append(d.strftime('%d/%m'))
            d += timedelta(days=1)
    bq = _booking_q(agency_id).filter(Booking.status != 'cancelled')
    aq = _apt_q()
    vehicles, apartments, money = [], [], []
    for s, e in buckets:
        vehicles.append(bq.filter(Booking.booking_date >= s, Booking.booking_date < e).count())
        apartments.append(aq.filter(ApartmentBooking.created_at >= s, ApartmentBooking.created_at < e).count())
        money.append(round(revenue_between(agency_id, s, e)['total']))
    return {'labels': labels, 'vehicles': vehicles, 'apartments': apartments, 'revenue': money, 'monthly': monthly}


def excluded_test_counts():
    """Nombre d'enregistrements marqués « test » (affiché pour transparence)."""
    return {
        'clients': User.query.filter(User.role == 'client', User.is_test == True).count(),  # noqa: E712
        'bookings': Booking.query.filter(Booking.is_test == True).count(),  # noqa: E712
        'trips': Trip.query.filter(Trip.is_test == True).count(),  # noqa: E712
        'apartments': ApartmentBooking.query.filter(ApartmentBooking.is_test == True).count(),  # noqa: E712
        'contracts': Contract.query.filter(Contract.is_test == True).count(),  # noqa: E712
    }


def build_dashboard_kpis(agency_id, args):
    period = resolve_period(args)
    return {
        'excluded': excluded_test_counts(),
        'period': period,
        'periods': PERIODS,
        'vehicles': vehicle_reservations(agency_id, period),
        'clients': clients(period),
        'apartments': apartment_reservations(period),
        'revenue': revenue(agency_id, period),
        'series': series(agency_id, period),
    }
