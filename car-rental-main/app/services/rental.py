"""Règles métier des demandes de location : validation, tarif, disponibilité. Tout est vérifié côté serveur."""
import re
import secrets
from datetime import datetime, timedelta

from app import db
from app.models import (Bus, Driver, LocCity, LocNeighbourhood, RentalRequest, TripPriceRule)

TYPES = RentalRequest.TYPES
MAX_HOURS = 240


def local_now():
    return datetime.utcnow() + timedelta(hours=1)     # Africa/Douala, UTC+1 toute l'année


def _int(v):
    try:
        return int(v)
    except (TypeError, ValueError):
        return None


def _txt(v, size):
    return re.sub(r'\s+', ' ', str(v or '')).strip()[:size]


def _dt(v):
    try:
        return datetime.strptime(str(v or '')[:16], '%Y-%m-%dT%H:%M')
    except ValueError:
        return None


def bookable_vehicles():
    return Bus.query.filter(Bus.is_deleted == False, Bus.status == 'active').order_by(Bus.brand, Bus.model).all()  # noqa: E712


def options():
    cities = []
    for c in LocCity.query.filter_by(is_active=True).order_by(LocCity.name).all():
        cities.append({
            'id': c.id, 'name': c.name, 'country': c.country,
            'districts': [{'id': d.id, 'name': d.name} for d in c.districts if d.is_active],
            'neighbourhoods': [{'id': n.id, 'name': n.name, 'districtId': n.district_id,
                                'aliases': [a.alias for a in n.aliases], 'landmarks': [l.name for l in n.landmarks]}
                               for n in c.neighbourhoods if n.is_active and n.status == 'approved'],
        })
    return {
        'cities': cities,
        'vehicles': [{'id': b.id, 'name': f'{b.brand or ""} {b.model}'.strip(), 'seats': b.capacity} for b in bookable_vehicles()],
        'tripTypes': TYPES,
    }


def parse(data, partial=False):
    """Renvoie (valeurs, erreurs). `partial` : estimation (sans coordonnées du client)."""
    errors, v = {}, {}
    v['trip_type'] = data.get('tripType')
    if v['trip_type'] not in TYPES:
        errors['tripType'] = 'Choisissez un type de trajet.'
    vehicle = db.session.get(Bus, _int(data.get('vehicleId')) or 0)
    if not vehicle or vehicle.is_deleted or vehicle.status != 'active':
        errors['vehicleId'] = 'Choisissez un véhicule disponible.'
    v['vehicle_id'] = vehicle.id if vehicle else None

    def place(side, key, required):
        city = db.session.get(LocCity, _int(data.get(f'{key}CityId')) or 0)
        if city and not city.is_active:
            city = None
        hood = db.session.get(LocNeighbourhood, _int(data.get(f'{key}NeighbourhoodId')) or 0)
        typed = _txt(data.get(f'{key}NeighbourhoodText'), 100)
        address = _txt(data.get(f'{key}Address'), 200)
        if hood and (not city or hood.city_id != city.id or hood.status != 'approved' or not hood.is_active):
            errors[f'{key}NeighbourhoodId'] = 'Ce quartier ne correspond pas à la ville choisie.'
            hood = None
        if required:
            if not city:
                errors[f'{key}CityId'] = 'Choisissez une ville.'
            if not hood and not typed and f'{key}NeighbourhoodId' not in errors:
                errors[f'{key}NeighbourhoodId'] = 'Choisissez un quartier (ou proposez-le s’il manque).'
        v[f'{side}_city_id'] = city.id if city else None
        v[f'{side}_neighbourhood_id'] = hood.id if hood else None
        v[f'{side}_neighbourhood_text'] = None if hood else (typed or None)
        v[f'{side}_address'] = address or None

    place('pickup', 'pickup', True)
    needs_destination = v['trip_type'] in ('one_way', 'round_trip')
    if needs_destination:
        place('destination', 'destination', True)
        same_hood = v['pickup_neighbourhood_id'] and v['pickup_neighbourhood_id'] == v['destination_neighbourhood_id']
        if same_hood and (v['pickup_address'] or '') == (v['destination_address'] or ''):
            errors['destinationNeighbourhoodId'] = 'La destination est identique au lieu de prise en charge.'
        v['stops'] = None
    else:
        for k in ('city_id', 'neighbourhood_id', 'neighbourhood_text', 'address'):
            v[f'destination_{k}'] = None
        v['stops'] = _txt(data.get('stops'), 600) or None

    now = local_now()
    dep = _dt(data.get('departureAt'))
    if not dep:
        errors['departureAt'] = 'Indiquez la date et l’heure de départ.'
    elif dep < now - timedelta(minutes=5):
        errors['departureAt'] = 'La date de départ est passée.'
    elif dep > now + timedelta(days=366):
        errors['departureAt'] = 'La date de départ est trop éloignée (1 an maximum).'
    v['departure_at'] = dep

    v['return_at'], v['duration_hours'] = None, None
    v['return_address'], v['return_notes'] = None, None
    if v['trip_type'] == 'round_trip':
        v['return_address'] = _txt(data.get('returnAddress'), 200) or None
        v['return_notes'] = _txt(data.get('returnNotes'), 300) or None
        ret = _dt(data.get('returnAt'))
        if not ret:
            errors['returnAt'] = 'Indiquez la date et l’heure du retour.'
        elif dep and ret <= dep:
            errors['returnAt'] = 'Le retour doit être après le départ.'
        elif dep and (ret - dep) > timedelta(days=60):
            errors['returnAt'] = 'Un aller-retour est limité à 60 jours.'
        v['return_at'] = ret
    elif v['trip_type'] == 'disposal':
        try:
            hours = float(str(data.get('durationHours') or '').replace(',', '.'))
        except ValueError:
            hours = 0
        if not 1 <= hours <= MAX_HOURS:
            errors['durationHours'] = f'Indiquez une durée entre 1 et {MAX_HOURS} heures.'
        else:
            v['duration_hours'] = hours

    # La location porte sur le véhicule seul : un chauffeur n'est prévu que s'il est explicitement demandé
    v['driver_required'] = data.get('driverRequired') in (True, 'true', '1', 1)
    # Aller simple : le véhicule ne reste jamais à destination, son retour à vide est compté
    v['driver_return_required'] = v['trip_type'] == 'one_way'

    passengers = _int(data.get('passengers'))
    if passengers is not None and vehicle and not 1 <= passengers <= vehicle.capacity:
        errors['passengers'] = f'Ce véhicule accueille de 1 à {vehicle.capacity} passagers.'
    v['passengers'] = passengers
    v['notes'] = _txt(data.get('notes'), 1000) or None

    if not partial:
        v['customer_name'] = _txt(data.get('name'), 120)
        v['customer_phone'] = _txt(data.get('phone'), 40)
        v['customer_email'] = _txt(data.get('email'), 120).lower() or None
        if len(v['customer_name']) < 2:
            errors['name'] = 'Indiquez votre nom.'
        if len(re.sub(r'\D', '', v['customer_phone'])) < 8:
            errors['phone'] = 'Indiquez un numéro de téléphone / WhatsApp valide.'
        if v['customer_email'] and '@' not in v['customer_email']:
            errors['email'] = 'Adresse e-mail invalide.'
    return v, errors


def find_rule(v):
    """Règle active la plus précise (véhicule > trajet de ville à ville > générale)."""
    best, best_score = None, -1
    for r in TripPriceRule.query.filter_by(trip_type=v.get('trip_type'), is_active=True).order_by(TripPriceRule.id).all():
        score = 0
        if r.vehicle_id:
            if r.vehicle_id != v.get('vehicle_id'):
                continue
            score += 4
        if r.origin_city_id:
            if r.origin_city_id != v.get('pickup_city_id'):
                continue
            score += 2
        if r.destination_city_id:
            if r.destination_city_id != v.get('destination_city_id'):
                continue
            score += 2
        if score > best_score:
            best, best_score = r, score
    return best


def quote(v):
    """(montant ou None, détail, règle). Aucun montant sans règle configurée."""
    rule = find_rule(v)
    if not rule:
        return None, [], None
    lines = [(TYPES[v['trip_type']], rule.base_price)]
    if v['trip_type'] == 'disposal' and v.get('duration_hours') and rule.included_hours:
        extra = max(0.0, v['duration_hours'] - rule.included_hours)
        if extra:
            if not rule.extra_hour_price:
                return None, [], rule
            lines.append((f'{extra:g} h supplémentaire(s)', extra * rule.extra_hour_price))
    if v['trip_type'] == 'one_way' and rule.empty_return_fee:
        lines.append(('Retour à vide du véhicule', rule.empty_return_fee))
    return round(sum(a for _, a in lines)), [{'label': l, 'amount': round(a)} for l, a in lines], rule


def window(v, rule=None):
    """Période pendant laquelle le véhicule et le chauffeur sont mobilisés."""
    start = v['departure_at']
    if v['trip_type'] == 'round_trip':
        return start, v['return_at']
    if v['trip_type'] == 'disposal':
        return start, start + timedelta(hours=v['duration_hours'])
    if rule and rule.estimated_hours:
        factor = 2 if v.get('driver_return_required') else 1
        return start, start + timedelta(hours=rule.estimated_hours * factor)
    return start, start.replace(hour=23, minute=59)      # durée inconnue : journée réservée


def availability(v, rule=None):
    """(véhicule libre ?, message pour le client, note interne)."""
    from app.routes.missions import check_driver_availability, check_vehicle_availability
    start, end = window(v, rule)
    if end <= start:
        end = start + timedelta(hours=1)
    ok, err = check_vehicle_availability(v['vehicle_id'], start, end)
    if not ok:
        return False, 'Ce véhicule n’est pas disponible sur ce créneau. Choisissez-en un autre ou une autre date.', err
    other = RentalRequest.query.filter(RentalRequest.vehicle_id == v['vehicle_id'],
                                       RentalRequest.status == 'confirmed').all()
    for r in other:
        s, e = window({'trip_type': r.trip_type, 'departure_at': r.departure_at, 'return_at': r.return_at,
                       'duration_hours': r.duration_hours, 'driver_return_required': r.driver_return_required})
        if s < end and e > start:
            return False, 'Ce véhicule est déjà réservé sur ce créneau.', f'Demande {r.reference} confirmée'
    note = None
    if v.get('driver_required'):
        drivers = Driver.query.filter(Driver.is_deleted == False).all()  # noqa: E712
        free = [d for d in drivers if check_driver_availability(d.id, start, end)[0]]
        if not free:
            note = 'Aucun chauffeur libre sur ce créneau : à organiser avant confirmation.'
    return True, None, note


def new_reference():
    while True:
        ref = f"3M-REQ-{local_now():%y%m%d}-{secrets.randbelow(9000) + 1000}"
        if not RentalRequest.query.filter_by(reference=ref).first():
            return ref


def suggest_neighbourhood(city_id, name, district_id=None, who=None):
    """Quartier manquant proposé par un client : en attente de validation (jamais publié automatiquement)."""
    from app.models import LocDistrict
    name = _txt(name, 100)
    city = db.session.get(LocCity, _int(city_id) or 0)
    if not city or len(name) < 3:
        return None, 'Indiquez la ville et le nom du quartier.'
    existing = LocNeighbourhood.query.filter(LocNeighbourhood.city_id == city.id,
                                             db.func.lower(LocNeighbourhood.name) == name.lower()).first()
    if existing:
        return existing, None
    district = db.session.get(LocDistrict, _int(district_id) or 0)
    hood = LocNeighbourhood(city_id=city.id, district_id=district.id if district and district.city_id == city.id else None,
                            name=name, status='pending', suggested_by=_txt(who, 160) or None)
    db.session.add(hood)
    from app.services.activity import notify_super_admin
    notify_super_admin(f'📍 Quartier proposé : {name} ({city.name})', 'À valider dans Lieux & quartiers.',
                       'settings', 'info', '/superadmin/locations?status=pending', commit=False)
    return hood, None


def create_request(data):
    """Crée la demande (transaction). Renvoie (demande, erreurs, déjà_reçue)."""
    key = _txt(data.get('requestKey'), 64) or None
    if key:
        same = RentalRequest.query.filter_by(request_key=key).first()
        if same:
            return same, {}, True
    v, errors = parse(data)
    if errors:
        return None, errors, False
    amount, _, rule = quote(v)
    ok, message, note = availability(v, rule)
    if not ok:
        return None, {'vehicleId': message}, False

    from app.services.identity import identify_or_create
    client, _ = identify_or_create(v['customer_name'], v['customer_phone'], v['customer_email'],
                                   data.get('accountNumber'), 'booking')
    for side in ('pickup', 'destination'):
        if v.get(f'{side}_neighbourhood_text') and v.get(f'{side}_city_id'):
            suggest_neighbourhood(v[f'{side}_city_id'], v[f'{side}_neighbourhood_text'], who=v['customer_name'])
    req = RentalRequest(reference=new_reference(), request_key=key, estimated_price=amount,
                        price_rule_id=rule.id if rule else None, availability_note=note,
                        client_id=client.id if client else None, is_test=bool(client and client.is_test), **v)
    db.session.add(req)
    db.session.flush()

    from app.services.activity import notify_super_admin, record
    record('RENTAL_REQUEST_CREATED', 'reservation', 'RentalRequest', req.id, f'{req.reference} · {req.customer_name}',
           meta={'type': req.trip_type, 'source': 'site'}, actor=None, commit=False)
    notify_super_admin(f'🚘 Nouvelle demande {req.reference} — {req.type_label}',
                       f'{req.customer_name} · {req.departure_at:%d/%m/%Y %H:%M}', 'reservation', 'info',
                       f'/admin/demandes/{req.id}', commit=False)
    db.session.commit()
    return req, {}, False


def summary(req):
    """Texte envoyé dans la discussion du client."""
    lines = [f'🚘 Demande de location {req.reference} — {req.type_label}',
             f'• Véhicule : {req.vehicle.brand or ""} {req.vehicle.model}'.strip(),
             f'• Prise en charge : {req.place("pickup")}']
    if req.trip_type != 'disposal':
        lines.append(f'• Destination : {req.place("destination")}')
    elif req.stops:
        lines.append(f'• Déplacements prévus : {req.stops}')
    lines.append(f'• Départ : {req.departure_at:%d/%m/%Y à %H:%M}')
    if req.return_at:
        lines.append(f'• Retour : {req.return_at:%d/%m/%Y à %H:%M}')
        if req.return_address:
            lines.append(f'• Rendez-vous retour : {req.return_address}')
        if req.return_notes:
            lines.append(f'• Précisions retour : {req.return_notes}')
    if req.duration_hours:
        lines.append(f'• Durée : {req.duration_hours:g} h')
    if req.driver_required:
        lines.append('• Avec chauffeur')
    lines.append('• Estimation : ' + (f'{req.estimated_price:,.0f} FCFA'.replace(',', ' ') if req.estimated_price else 'sur devis'))
    lines.append(f'• Client : {req.customer_name} — {req.customer_phone}')
    return '\n'.join(lines)
