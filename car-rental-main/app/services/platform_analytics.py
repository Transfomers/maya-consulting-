"""Statistiques de la plateforme pour le Super Admin — uniquement des enregistrements réels.

Données de démonstration (is_test) exclues, comme sur le tableau de bord.
Les montants « reçus » sont ceux réellement enregistrés (aucun prestataire de paiement
n'est intégré : il n'existe pas de confirmation automatique par webhook).
"""
from collections import Counter, OrderedDict
from datetime import datetime, timedelta

from sqlalchemy import func, or_

from app import db
from app.models import (Apartment, ApartmentBooking, AuditLog, Booking, Bus, Contract, ContractPayment, Conversation,
                        Invoice, Payment, Trip, User)
from app.services.dashboard_kpis import real, resolve_period, revenue_between

SERVICES = OrderedDict([('vehicles', 'Véhicules & missions'), ('apartments', 'Résidences meublées'),
                        ('contracts', 'Contrats')])
BOOKING_STATUS = OrderedDict([('pending', 'En attente'), ('confirmed', 'Confirmées'),
                              ('completed', 'Terminées'), ('cancelled', 'Annulées')])
PAYMENT_STATUS = OrderedDict([('completed', 'Réussis'), ('pending', 'En attente'), ('failed', 'Échoués'),
                              ('refunded', 'Remboursés / annulés')])


def _between(q, col, start, end):
    if start is not None:
        q = q.filter(col >= start)
    if end is not None:
        q = q.filter(col < end)
    return q


def _clients():
    return User.query.filter(User.role == 'client', User.is_deleted == False, real(User))  # noqa: E712


def _staff_q():
    from app.services.permissions import staff_roles
    return User.query.filter(User.role.in_(['super_admin'] + list(staff_roles())), User.is_deleted == False)  # noqa: E712


def _vehicle_bookings():
    return Booking.query.filter(real(Booking))


def _stays():
    return ApartmentBooking.query.filter(real(ApartmentBooking), ApartmentBooking.status != 'maintenance_block')


def _vehicle_status(b):
    if b.status == 'cancelled':
        return 'cancelled'
    if b.status in ('locked', 'pending'):
        return 'pending'
    trip = b.trip
    if trip is not None and (trip.status in ('completed', 'arrived', 'returned', 'closed')):
        return 'completed'
    return 'confirmed'


def _stay_status(a):
    return {'cancelled': 'cancelled', 'checked_out': 'completed'}.get(a.status, 'confirmed')


def booking_rows(start=None, end=None):
    """[(date, service, statut, montant, libellé)] pour réservations véhicules + séjours + contrats."""
    rows = []
    for b in _between(_vehicle_bookings(), Booking.booking_date, start, end).all():
        bus = b.trip.bus if b.trip else None
        label = (f'{bus.brand or ""} {bus.model or ""}'.strip() if bus else '') or 'Véhicule'
        rows.append((b.booking_date, 'vehicles', _vehicle_status(b), float(b.price_paid or 0), label))
    for a in _between(_stays(), ApartmentBooking.created_at, start, end).all():
        rows.append((a.created_at, 'apartments', _stay_status(a), float(a.total_amount or 0),
                     a.apartment.title if a.apartment else 'Résidence'))
    cq = Contract.query.filter(Contract.is_deleted == False, real(Contract))  # noqa: E712
    for c in _between(cq, Contract.created_at, start, end).all():
        st = {'draft': 'pending', 'pending_approval': 'pending', 'cancelled': 'cancelled', 'terminated': 'cancelled',
              'completed': 'completed', 'expired': 'completed'}.get(c.status, 'confirmed')
        rows.append((c.created_at, 'contracts', st, float(c.total_value or 0), c.subject or c.reference))
    return [r for r in rows if r[0] is not None]


def transactions(start=None, end=None):
    """Transactions enregistrées : paiements de réservations + paiements de contrats."""
    out = []
    for p in _between(Payment.query, Payment.created_at, start, end).all():
        status = p.status if p.status in PAYMENT_STATUS else ('completed' if p.status == 'paid' else 'pending')
        out.append({'kind': 'payment', 'id': p.id, 'date': p.created_at, 'amount': float(p.amount or 0),
                    'status': status, 'method': p.payment_method or '—', 'reference': p.transaction_id,
                    'service': 'vehicles', 'label': f'Réservation #{p.booking_id}' if p.booking_id else 'Paiement'})
    cq = ContractPayment.query.join(Contract, ContractPayment.contract_id == Contract.id).filter(
        Contract.is_deleted == False, real(Contract))  # noqa: E712
    for p in _between(cq, ContractPayment.paid_at, start, end).all():
        out.append({'kind': 'contract', 'id': p.id, 'date': p.paid_at, 'amount': float(p.amount or 0),
                    'status': 'refunded' if p.is_void else 'completed', 'method': p.method or '—',
                    'reference': p.reference, 'service': 'contracts', 'deposit': bool(p.is_deposit),
                    'label': f'{p.contract.reference if p.contract else "Contrat"}' + (' · caution' if p.is_deposit else '')})
    return sorted([t for t in out if t['date']], key=lambda t: t['date'], reverse=True)


def outstanding():
    """Montants restant à encaisser (factures, contrats, séjours) — calculés sur les enregistrements."""
    inv = Invoice.query.filter(Invoice.status.notin_(('paid', 'cancelled', 'draft')))
    invoices = sum(max(0.0, float(i.total_amount or 0) - float(i.amount_paid or 0)) for i in inv.all())
    contracts = 0.0
    for c in Contract.query.filter(Contract.is_deleted == False, real(Contract),  # noqa: E712
                                   Contract.status.in_(('active', 'signed', 'approved'))).all():
        try:
            contracts += max(0.0, float(c.balance or 0))
        except Exception:
            pass
    stays = 0.0
    for a in _stays().filter(ApartmentBooking.status != 'cancelled', ApartmentBooking.payment_status != 'paid').all():
        stays += max(0.0, float(a.total_amount or 0) - float(a.deposit_paid or 0))
    return {'invoices': invoices, 'contracts': contracts, 'apartments': stays, 'total': invoices + contracts + stays}


def _buckets(period):
    days = max(1, period['days'])
    start, end = period['start'], period['end']
    if days <= 31:
        step, fmt = 'day', '%d/%m'
    elif days <= 190:
        step, fmt = 'week', 'S%W'
    else:
        step, fmt = 'month', '%m/%Y'
    keys, cur = [], start
    while cur < end:
        if step == 'day':
            k = cur.strftime('%Y-%m-%d'); label = cur.strftime(fmt); nxt = cur + timedelta(days=1)
        elif step == 'week':
            k = cur.strftime('%Y-%W'); label = 'Sem. ' + cur.strftime('%d/%m'); nxt = cur + timedelta(days=7)
        else:
            k = cur.strftime('%Y-%m'); label = cur.strftime(fmt)
            nxt = (cur.replace(day=1) + timedelta(days=32)).replace(day=1)
        if not keys or keys[-1][0] != k:
            keys.append((k, label))
        cur = nxt

    def key_of(dt):
        return dt.strftime({'day': '%Y-%m-%d', 'week': '%Y-%W', 'month': '%Y-%m'}[step])
    return keys, key_of


def build(args):
    period = resolve_period(args)
    start, end = period['start'], period['end']
    keys, key_of = _buckets(period)
    labels = [l for _, l in keys]
    idx = {k: i for i, (k, _) in enumerate(keys)}

    def series(pairs):
        arr = [0] * len(keys)
        for dt, val in pairs:
            i = idx.get(key_of(dt))
            if i is not None:
                arr[i] += val
        return arr

    clients = _clients()
    new_clients = _between(clients, User.created_at, start, end).all()
    staff = _staff_q().all()
    rows_all = booking_rows()
    rows = [r for r in rows_all if start <= r[0] < end]
    by_status = Counter(r[2] for r in rows)
    by_service_count = Counter(r[1] for r in rows)
    tx_all = transactions()
    tx = [t for t in tx_all if start <= t['date'] < end]
    pay_status = Counter(t['status'] for t in tx)
    rev = revenue_between(None, start, end)
    rev_service = {'vehicles': rev['reservations'], 'apartments': rev['apartments'], 'contracts': rev['contracts']}

    # Revenus par tranche (paiements contrats + paiements réservations + séjours payés)
    rev_pairs = [(t['date'], t['amount']) for t in tx if t['status'] == 'completed' and not t.get('deposit')]
    for a in _between(_stays(), ApartmentBooking.created_at, start, end).filter(
            ApartmentBooking.payment_status.in_(('paid', 'partial'))).all():
        rev_pairs.append((a.created_at, float(a.total_amount or 0) if a.payment_status == 'paid' else float(a.deposit_paid or 0)))
    paid_booking_ids = {t['label'] for t in tx if t['kind'] == 'payment'}
    for b in _between(_vehicle_bookings(), Booking.booking_date, start, end).filter(
            Booking.status == 'confirmed', Booking.payment_status == 'paid').all():
        if f'Réservation #{b.id}' not in paid_booking_ids:
            rev_pairs.append((b.booking_date, float(b.price_paid or 0)))

    # Activité des administrateurs / clients
    admin_actions = db.session.query(AuditLog.actor_name, func.count()).filter(
        AuditLog.created_at >= start, AuditLog.created_at < end, AuditLog.user_id != None,  # noqa: E711
        AuditLog.actor_role.in_([u.role for u in staff] or ['super_admin'])).group_by(AuditLog.actor_name).order_by(
        func.count().desc()).limit(10).all()
    client_msgs = Conversation.query.filter(Conversation.last_client_message_at >= start,
                                            Conversation.last_client_message_at < end).all()

    top_items = Counter(r[4] for r in rows if r[2] != 'cancelled').most_common(8)

    # Performance mensuelle (12 derniers mois)
    month_keys = []
    m = datetime.utcnow().replace(day=1, hour=0, minute=0, second=0, microsecond=0)
    for _ in range(12):
        month_keys.insert(0, m)
        m = (m - timedelta(days=1)).replace(day=1)
    monthly = []
    for i, ms in enumerate(month_keys):
        me = month_keys[i + 1] if i + 1 < len(month_keys) else (ms + timedelta(days=32)).replace(day=1)
        monthly.append({'label': ms.strftime('%m/%Y'), 'revenue': revenue_between(None, ms, me)['total'],
                        'bookings': sum(1 for r in rows_all if ms <= r[0] < me)})
    years = sorted({r[0].year for r in rows_all} | {datetime.utcnow().year})
    yearly = [{'label': str(y), 'revenue': revenue_between(None, datetime(y, 1, 1), datetime(y + 1, 1, 1))['total'],
               'bookings': sum(1 for r in rows_all if r[0].year == y)} for y in years[-5:]]

    pending_tx = [t for t in tx_all if t['status'] == 'pending']
    kpis = {
        'clients_total': clients.count(), 'clients_new': len(new_clients),
        'admins_total': len(staff),
        'admins_active': sum(1 for u in staff if u.status_key == 'active'),
        'admins_suspended': sum(1 for u in staff if u.status_key == 'suspended'),
        'bookings_total': len(rows), 'bookings_all_time': len(rows_all),
        'bookings': {k: by_status.get(k, 0) for k in BOOKING_STATUS},
        'revenue_total': rev['total'], 'revenue_service': rev_service,
        'payments': {k: pay_status.get(k, 0) for k in PAYMENT_STATUS},
        'payments_pending_amount': sum(t['amount'] for t in pending_tx),
        'services_total': Bus.query.filter_by(is_deleted=False).count() + Apartment.query.filter_by(is_deleted=False).count(),
        'listings_active': Bus.query.filter(Bus.is_deleted == False, Bus.status != 'maintenance').count()  # noqa: E712
                           + Apartment.query.filter(Apartment.is_deleted == False, Apartment.is_published == True).count(),  # noqa: E712
    }
    charts = {
        'labels': labels,
        'registrations': series((u.created_at, 1) for u in new_clients if u.created_at),
        'revenue': series(rev_pairs),
        'bookings': series((r[0], 1) for r in rows),
        'bookings_by_service': [by_service_count.get(k, 0) for k in SERVICES],
        'revenue_by_service': [round(rev_service[k]) for k in SERVICES],
        'booking_status': [by_status.get(k, 0) for k in BOOKING_STATUS],
        'payment_status': [pay_status.get(k, 0) for k in PAYMENT_STATUS],
        'admin_activity': {'labels': [n or '—' for n, _ in admin_actions], 'data': [c for _, c in admin_actions]},
        'client_activity': series((c.last_client_message_at, 1) for c in client_msgs),
        'top_items': {'labels': [n for n, _ in top_items], 'data': [c for _, c in top_items]},
        'monthly': monthly, 'yearly': yearly,
    }
    return period, kpis, charts


def export_rows(args):
    period, kpis, charts = build(args)
    out = [('Période', period['label']), ('Clients enregistrés', kpis['clients_total']),
           ('Nouveaux clients', kpis['clients_new']), ('Administrateurs', kpis['admins_total']),
           ('Administrateurs actifs', kpis['admins_active']), ('Administrateurs suspendus', kpis['admins_suspended']),
           ('Réservations (période)', kpis['bookings_total'])]
    out += [(f'Réservations — {BOOKING_STATUS[k]}', v) for k, v in kpis['bookings'].items()]
    out += [('Revenus encaissés (FCFA)', round(kpis['revenue_total']))]
    out += [(f'Revenus — {SERVICES[k]} (FCFA)', round(v)) for k, v in kpis['revenue_service'].items()]
    out += [(f'Paiements — {PAYMENT_STATUS[k]}', v) for k, v in kpis['payments'].items()]
    out += [('Services enregistrés', kpis['services_total']), ('Annonces actives', kpis['listings_active'])]
    out += [('', ''), ('Évolution', 'Inscriptions / Réservations / Revenus (FCFA)')]
    for i, l in enumerate(charts['labels']):
        out.append((l, f"{charts['registrations'][i]} / {charts['bookings'][i]} / {round(charts['revenue'][i])}"))
    return period, out
