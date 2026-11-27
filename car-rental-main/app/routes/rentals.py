"""Demandes de location : API interne (appelée par Node pour le site) et traitement par l'équipe."""
import random
from datetime import datetime, timedelta

from flask import Blueprint, flash, jsonify, redirect, render_template, request, url_for
from flask_login import current_user, login_required

from app import db
from app.models import Bus, Driver, RentalRequest, Route, Trip
from app.routes.admin import admin_required, log_audit
from app.routes.internal import _authorized
from app.services import rental
from app.services.activity import record
from app.utils.security import csrf_protect

rentals_bp = Blueprint('rentals', __name__)           # administration (RBAC + CSRF)
rental_api_bp = Blueprint('rental_api', __name__)     # appels internes Node uniquement


@rental_api_bp.before_request
def _internal_only():
    if not _authorized():
        return jsonify({'error': 'Non autorisé'}), 403
    return None


@rental_api_bp.route('/api/internal/rental/options')
def api_options():
    return jsonify(rental.options())


@rental_api_bp.route('/api/internal/rental/quote', methods=['POST'])
def api_quote():
    v, errors = rental.parse(request.get_json(silent=True) or {}, partial=True)
    if errors:
        return jsonify({'errors': errors}), 400
    amount, lines, rule = rental.quote(v)
    ok, message, _ = rental.availability(v, rule)
    return jsonify({'available': ok, 'message': message, 'estimate': amount, 'lines': lines})


@rental_api_bp.route('/api/internal/rental/request', methods=['POST'])
def api_request():
    req, errors, duplicate = rental.create_request(request.get_json(silent=True) or {})
    if errors:
        db.session.rollback()
        return jsonify({'error': 'Veuillez corriger les champs signalés.', 'errors': errors}), 400
    return jsonify({'reference': req.reference, 'estimate': req.estimated_price, 'duplicate': duplicate,
                    'summary': rental.summary(req)}), 200 if duplicate else 201


@rental_api_bp.route('/api/internal/rental/suggest-neighbourhood', methods=['POST'])
def api_suggest():
    data = request.get_json(silent=True) or {}
    hood, error = rental.suggest_neighbourhood(data.get('cityId'), data.get('name'), data.get('districtId'), data.get('who'))
    if error:
        return jsonify({'error': error}), 400
    db.session.commit()
    return jsonify({'name': hood.name, 'status': hood.status}), 201


# ── Équipe ───────────────────────────────────────────────────────────────────
@rentals_bp.route('/admin/demandes')
@login_required
@admin_required
def index():
    status = request.args.get('status', 'pending')
    q = RentalRequest.query.filter(db.or_(RentalRequest.is_test == False, RentalRequest.is_test == None))  # noqa: E711,E712
    counts = dict(db.session.query(RentalRequest.status, db.func.count()).group_by(RentalRequest.status).all())
    if status in RentalRequest.STATUSES:
        q = q.filter(RentalRequest.status == status)
    if request.args.get('type') in RentalRequest.TYPES:
        q = q.filter(RentalRequest.trip_type == request.args['type'])
    term = (request.args.get('q') or '').strip()
    if term:
        like = f'%{term}%'
        q = q.filter(db.or_(RentalRequest.reference.ilike(like), RentalRequest.customer_name.ilike(like),
                            RentalRequest.customer_phone.ilike(like)))
    page = max(1, request.args.get('page', 1, type=int))
    total = q.count()
    items = q.order_by(RentalRequest.departure_at.asc() if status == 'pending' else RentalRequest.created_at.desc()
                       ).offset((page - 1) * 25).limit(25).all()
    return render_template('admin/rental_requests.html', items=items, counts=counts, status=status, total=total,
                           page=page, pages=max(1, -(-total // 25)), types=RentalRequest.TYPES,
                           statuses=RentalRequest.STATUSES)


@rentals_bp.route('/admin/demandes/<int:rid>')
@login_required
@admin_required
def detail(rid):
    r = db.get_or_404(RentalRequest, rid)
    rule = rental.find_rule({'trip_type': r.trip_type, 'vehicle_id': r.vehicle_id, 'pickup_city_id': r.pickup_city_id,
                             'destination_city_id': r.destination_city_id})
    start, end = rental.window(_values(r), rule)
    drivers = Driver.query.filter(Driver.is_deleted == False).order_by(Driver.name).all()  # noqa: E712
    from app.routes.missions import check_driver_availability, check_vehicle_availability
    free = {d.id: check_driver_availability(d.id, start, end)[0] for d in drivers}
    vehicle_ok, vehicle_error = (True, None) if r.trip_id else check_vehicle_availability(r.vehicle_id, start, end)
    return render_template('admin/rental_request_detail.html', r=r, start=start, end=end, drivers=drivers, free=free,
                           vehicle_ok=vehicle_ok, vehicle_error=vehicle_error)


def _values(r):
    return {'trip_type': r.trip_type, 'departure_at': r.departure_at, 'return_at': r.return_at,
            'duration_hours': r.duration_hours, 'driver_return_required': r.driver_return_required,
            'driver_required': r.driver_required, 'vehicle_id': r.vehicle_id}


@rentals_bp.route('/admin/demandes/<int:rid>/status', methods=['POST'])
@login_required
@admin_required
@csrf_protect
def update_status(rid):
    r = db.get_or_404(RentalRequest, rid)
    new = request.form.get('status')
    if r.status == 'converted':
        flash('Une mission existe déjà : modifiez-la depuis les missions.', 'warning')
    elif new in ('pending', 'confirmed', 'cancelled'):
        if new == 'confirmed':
            ok, message, _ = rental.availability(_values(r))
            if not ok:
                flash(message, 'danger')
                return redirect(url_for('rentals.detail', rid=rid))
        old = r.status
        r.status, r.updated_at = new, datetime.utcnow()
        record('RESERVATION_CANCELLED' if new == 'cancelled' else 'RESERVATION_UPDATED', 'reservation',
               'RentalRequest', r.id, r.reference, meta={'avant': old, 'apres': new}, commit=False)
        db.session.commit()
        flash(f'Demande {r.reference} : {r.status_label}.', 'success')
    return redirect(url_for('rentals.detail', rid=rid))


@rentals_bp.route('/admin/demandes/<int:rid>/create-mission', methods=['POST'])
@login_required
@admin_required
@csrf_protect
def create_mission_from_request(rid):
    r = db.get_or_404(RentalRequest, rid)
    back = redirect(url_for('rentals.detail', rid=rid))
    if r.trip_id or r.status == 'cancelled':
        flash('Cette demande ne peut pas être convertie.', 'warning')
        return back
    price = request.form.get('price', type=float)
    if price is None or price <= 0:
        flash('Indiquez le prix convenu avec le client.', 'danger')
        return back
    try:
        start = datetime.strptime(request.form.get('departure', '')[:16], '%Y-%m-%dT%H:%M')
        end = datetime.strptime(request.form.get('arrival', '')[:16], '%Y-%m-%dT%H:%M')
    except ValueError:
        flash('Dates de mission invalides.', 'danger')
        return back
    if end <= start:
        flash('La fin doit être après le départ.', 'danger')
        return back
    driver_id = request.form.get('driver_id', type=int)
    if r.driver_required and not driver_id:
        flash('Cette demande nécessite un chauffeur.', 'danger')
        return back
    from app.routes.missions import check_driver_availability, check_vehicle_availability
    ok, err = check_vehicle_availability(r.vehicle_id, start, end)
    if not ok:
        flash(err, 'danger')
        return back
    if driver_id:
        ok, err, warn = check_driver_availability(driver_id, start, end)
        if not ok:
            flash(err, 'danger')
            return back

    origin = r.pickup_city.name
    destination = r.destination_city.name if r.destination_city else origin
    route = Route.query.filter_by(origin=origin, destination=destination, is_deleted=False).first()
    if not route:
        route = Route(origin=origin, destination=destination)
        if hasattr(Route, 'agency_id'):
            route.agency_id = r.vehicle.agency_id
        db.session.add(route)
        db.session.flush()
    trip = Trip(route_id=route.id, bus_id=r.vehicle_id, driver_id=driver_id or None, departure_time=start,
                arrival_time=end, price=price, capacity=r.vehicle.capacity,
                status='assigned' if driver_id else 'confirmed',
                mission_ref=f"3M-MIS-{datetime.now():%y%m%d}-{random.randint(100, 999)}",
                mission_title=f'{r.type_label} · {origin} → {destination}',
                mission_type={'one_way': 'one_way', 'round_trip': 'round_trip', 'disposal': 'hourly'}[r.trip_type],
                mission_category='chauffeur_disposal' if r.trip_type == 'disposal'
                else ('intercity' if origin != destination else 'city_transport'),
                is_round_trip=r.trip_type == 'round_trip', pickup_location=r.place('pickup')[:200],
                destination_location=(r.place('destination') if r.trip_type != 'disposal' else r.stops or 'Mise à disposition')[:200],
                passenger_count=r.passengers or 1, contact_person=f'{r.customer_name} · {r.customer_phone}'[:160],
                special_instructions=' · '.join(x for x in (r.notes, f'Rendez-vous retour : {r.return_address}' if r.return_address else None,
                                                     r.return_notes) if x) or None,
        internal_notes=f'Créée depuis la demande {r.reference}'
                + (' · retour à vide du véhicule à prévoir' if r.driver_return_required else ''))
    if hasattr(Trip, 'agency_id'):
        trip.agency_id = r.vehicle.agency_id
    db.session.add(trip)
    db.session.flush()
    r.trip_id, r.status, r.updated_at = trip.id, 'converted', datetime.utcnow()
    db.session.commit()
    log_audit('RENTAL_REQUEST_CONVERTED', 'RentalRequest', r.id, f'{r.reference} → {trip.mission_ref}')
    flash(f'Mission {trip.mission_ref} créée.', 'success')
    return redirect(url_for('missions.mission_detail', id=trip.id))
