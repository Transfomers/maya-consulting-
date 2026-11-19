from flask import Blueprint, request, jsonify, current_app
from app import db
from app.models import Trip, Bus
from app.schemas.trip_schema import TripCreateSchema, TripUpdateSchema, TripReadSchema
from app.services.trip_service import check_conflict, create_round_trip

trips_bp = Blueprint('trips', __name__, url_prefix='/api/trips')

@trips_bp.route('/', methods=['GET'])
def list_trips():
    agency_id = request.args.get('agency_id', type=int)
    start = request.args.get('start')  # ISO date string
    end = request.args.get('end')
    query = Trip.query
    if agency_id:
        query = query.join(Trip.bus).filter(Bus.agency_id == agency_id)
    if start:
        query = query.filter(Trip.departure_time >= start)
    if end:
        query = query.filter(Trip.arrival_time <= end)
    trips = query.all()
    schema = TripReadSchema(many=True)
    return jsonify(schema.dump(trips))

@trips_bp.route('/', methods=['POST'])
def create_trip():
    data = request.get_json()
    schema = TripCreateSchema()
    errors = schema.validate(data)
    if errors:
        return jsonify(errors), 400
    # Conflict detection before creating
    if check_conflict(data['bus_id'], data['departure_time'], data['arrival_time']):
        return jsonify({"message": "Trip conflict detected for selected bus."}), 409
    trip = Trip(**schema.load(data))
    db.session.add(trip)
    db.session.commit()
    # Optional round‑trip creation
    if data.get('is_round_trip'):
        create_round_trip(trip)
    return jsonify(TripReadSchema().dump(trip)), 201

@trips_bp.route('/<int:trip_id>', methods=['PUT'])
def update_trip(trip_id):
    trip = Trip.query.get_or_404(trip_id)
    data = request.get_json()
    schema = TripUpdateSchema(partial=True)
    errors = schema.validate(data)
    if errors:
        return jsonify(errors), 400
    # If time changed, check conflict
    dep = data.get('departure_time', trip.departure_time)
    arr = data.get('arrival_time', trip.arrival_time)
    if (dep != trip.departure_time) or (arr != trip.arrival_time):
        if check_conflict(trip.bus_id, dep, arr, exclude_id=trip.id):
            return jsonify({"message": "Trip conflict detected for selected bus."}), 409
    for key, value in schema.load(data).items():
        setattr(trip, key, value)
    db.session.commit()
    return jsonify(TripReadSchema().dump(trip))

@trips_bp.route('/<int:trip_id>', methods=['DELETE'])
def delete_trip(trip_id):
    trip = Trip.query.get_or_404(trip_id)
    db.session.delete(trip)
    db.session.commit()
    return '', 204

@trips_bp.route('/<int:trip_id>/duplicate', methods=['POST'])
def duplicate_trip(trip_id):
    original = Trip.query.get_or_404(trip_id)
    new_trip = Trip(
        route_id=original.route_id,
        bus_id=original.bus_id,
        departure_time=original.departure_time,
        arrival_time=original.arrival_time,
        price=original.price,
        status='scheduled',
        is_round_trip=False,
        parent_trip_id=original.id
    )
    db.session.add(new_trip)
    db.session.commit()
    return jsonify(TripReadSchema().dump(new_trip)), 201
