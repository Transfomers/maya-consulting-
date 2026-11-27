"""Super Admin — lieux (villes, arrondissements, quartiers, alias, repères) et tarifs des trajets."""
from flask import abort, flash, redirect, render_template, request, url_for
from flask_login import login_required

from app import db
from app.models import (Bus, LocAlias, LocCity, LocDistrict, LocLandmark, LocNeighbourhood, RentalRequest,
                        TripPriceRule)
from app.routes.superadmin import superadmin_bp
from app.services.activity import record
from app.services.permissions import super_admin_only
from app.utils.security import csrf_protect


def _clean(name, size=100):
    return ' '.join((request.form.get(name) or '').split())[:size]


def _log(action, obj, label, meta=None):
    record(action, 'settings', type(obj).__name__, obj.id, label, meta=meta, commit=False)


@superadmin_bp.route('/superadmin/locations')
@login_required
@super_admin_only
def locations():
    cities = LocCity.query.order_by(LocCity.name).all()
    city = db.session.get(LocCity, request.args.get('city', type=int) or (cities[0].id if cities else 0))
    status = request.args.get('status', '')
    pending = LocNeighbourhood.query.filter_by(status='pending').order_by(LocNeighbourhood.created_at).all()
    term = (request.args.get('q') or '').strip().lower()
    hoods = []
    if city:
        hoods = [n for n in city.neighbourhoods if n.status == 'approved'
                 and (not term or term in n.name.lower() or any(term in a.alias.lower() for a in n.aliases))]
    return render_template('superadmin/locations.html', cities=cities, city=city, hoods=hoods, pending=pending,
                           status=status, term=term)


def _back(city_id=None):
    return redirect(url_for('superadmin.locations', city=city_id or request.form.get('city_id') or None))


@superadmin_bp.route('/superadmin/locations/city', methods=['POST'])
@login_required
@super_admin_only
@csrf_protect
def city_save():
    cid = request.form.get('id', type=int)
    city = db.get_or_404(LocCity, cid) if cid else None
    if city and request.form.get('toggle'):
        city.is_active = not city.is_active
        _log('LOCATION_UPDATED', city, city.name, {'active': city.is_active})
    else:
        name = _clean('name', 80)
        if len(name) < 2 or LocCity.query.filter(db.func.lower(LocCity.name) == name.lower(), LocCity.id != (cid or 0)).first():
            flash('Nom de ville manquant ou déjà utilisé.', 'danger')
            return _back(cid)
        if not city:
            city = LocCity(name=name, country=_clean('country', 60) or 'Cameroun')
            db.session.add(city)
            db.session.flush()
            _log('LOCATION_CREATED', city, name)
        else:
            city.name = name
            _log('LOCATION_UPDATED', city, name)
    db.session.commit()
    flash('Ville enregistrée.', 'success')
    return _back(city.id)


@superadmin_bp.route('/superadmin/locations/district', methods=['POST'])
@login_required
@super_admin_only
@csrf_protect
def district_save():
    city = db.get_or_404(LocCity, request.form.get('city_id', type=int) or 0)
    did = request.form.get('id', type=int)
    district = db.get_or_404(LocDistrict, did) if did else None
    if district and request.form.get('toggle'):
        district.is_active = not district.is_active
    else:
        name = _clean('name', 80)
        if len(name) < 2 or LocDistrict.query.filter(LocDistrict.city_id == city.id, db.func.lower(LocDistrict.name) == name.lower(),
                                                     LocDistrict.id != (did or 0)).first():
            flash('Nom d’arrondissement manquant ou déjà utilisé.', 'danger')
            return _back(city.id)
        if not district:
            district = LocDistrict(city_id=city.id, name=name, position=len(city.districts) + 1)
            db.session.add(district)
        district.name = name
    db.session.flush()
    _log('LOCATION_UPDATED', district, f'{district.name} ({city.name})')
    db.session.commit()
    flash('Arrondissement enregistré.', 'success')
    return _back(city.id)


@superadmin_bp.route('/superadmin/locations/neighbourhood', methods=['POST'])
@login_required
@super_admin_only
@csrf_protect
def neighbourhood_save():
    nid = request.form.get('id', type=int)
    hood = db.get_or_404(LocNeighbourhood, nid) if nid else None
    action = request.form.get('action', 'save')
    if hood and action in ('approve', 'reject', 'toggle'):
        if action == 'toggle':
            hood.is_active = not hood.is_active
        else:
            hood.status = 'approved' if action == 'approve' else 'rejected'
        _log('LOCATION_UPDATED', hood, hood.name, {'action': action})
        db.session.commit()
        flash({'approve': 'Quartier publié.', 'reject': 'Proposition refusée.', 'toggle': 'Quartier mis à jour.'}[action], 'success')
        return _back(hood.city_id)
    city = db.get_or_404(LocCity, request.form.get('city_id', type=int) or (hood.city_id if hood else 0))
    name = _clean('name')
    district = db.session.get(LocDistrict, request.form.get('district_id', type=int) or 0)
    district_id = district.id if district and district.city_id == city.id else None
    duplicate = LocNeighbourhood.query.filter(LocNeighbourhood.city_id == city.id, LocNeighbourhood.status != 'rejected',
                                              db.func.lower(LocNeighbourhood.name) == name.lower(),
                                              LocNeighbourhood.district_id == district_id,
                                              LocNeighbourhood.id != (nid or 0)).first()
    if len(name) < 2 or duplicate:
        flash('Nom de quartier manquant ou déjà présent dans cet arrondissement.', 'danger')
        return _back(city.id)
    created = hood is None
    if created:
        hood = LocNeighbourhood(city_id=city.id, name=name, status='approved')
        db.session.add(hood)
    hood.name, hood.district_id, hood.status = name, district_id, 'approved'
    aliases = {a.strip()[:100] for a in (request.form.get('aliases') or '').split(',') if a.strip()}
    marks = {a.strip()[:140] for a in (request.form.get('landmarks') or '').split(',') if a.strip()}
    hood.aliases = [LocAlias(alias=a) for a in sorted(aliases)]
    hood.landmarks = [LocLandmark(name=m) for m in sorted(marks)]
    db.session.flush()
    _log('LOCATION_CREATED' if created else 'LOCATION_UPDATED', hood, f'{name} ({city.name})')
    db.session.commit()
    flash('Quartier enregistré.', 'success')
    return _back(city.id)


# ── Tarifs ───────────────────────────────────────────────────────────────────
@superadmin_bp.route('/superadmin/pricing', methods=['GET', 'POST'])
@login_required
@super_admin_only
def pricing():
    if request.method == 'POST':
        return _save_rule()
    rules = TripPriceRule.query.order_by(TripPriceRule.trip_type, TripPriceRule.id).all()
    edit = db.session.get(TripPriceRule, request.args.get('edit', type=int) or 0)
    return render_template('superadmin/pricing.html', rules=rules, edit=edit, types=RentalRequest.TYPES,
                           cities=LocCity.query.filter_by(is_active=True).order_by(LocCity.name).all(),
                           vehicles=Bus.query.filter_by(is_deleted=False).order_by(Bus.brand, Bus.model).all())


@csrf_protect
def _save_rule():
    rid = request.form.get('id', type=int)
    rule = db.get_or_404(TripPriceRule, rid) if rid else None
    if rule and request.form.get('toggle'):
        rule.is_active = not rule.is_active
        _log('PRICING_UPDATED', rule, f'Tarif #{rule.id}', {'active': rule.is_active})
        db.session.commit()
        flash('Tarif mis à jour.', 'success')
        return redirect(url_for('superadmin.pricing'))
    trip_type = request.form.get('trip_type')
    base = request.form.get('base_price', type=float)
    numbers = {k: request.form.get(k, type=float) for k in
               ('included_hours', 'extra_hour_price', 'empty_return_fee', 'estimated_hours', 'distance_km')}
    if trip_type not in RentalRequest.TYPES or base is None or base <= 0 or any(n is not None and n < 0 for n in numbers.values()):
        flash('Type de trajet et prix de base (positif) obligatoires ; les autres valeurs ne peuvent pas être négatives.', 'danger')
        return redirect(url_for('superadmin.pricing', edit=rid))
    created = rule is None
    if created:
        rule = TripPriceRule()
        db.session.add(rule)
    rule.trip_type, rule.base_price = trip_type, base
    rule.vehicle_id = request.form.get('vehicle_id', type=int)
    rule.origin_city_id = request.form.get('origin_city_id', type=int)
    rule.destination_city_id = request.form.get('destination_city_id', type=int) if trip_type != 'disposal' else None
    for k, n in numbers.items():
        setattr(rule, k, n)
    db.session.flush()
    _log('PRICING_CREATED' if created else 'PRICING_UPDATED', rule, f'{RentalRequest.TYPES[trip_type]} · {base:,.0f} FCFA',
         {'prix_base': base, **{k: v for k, v in numbers.items() if v is not None}})
    db.session.commit()
    flash('Tarif enregistré.', 'success')
    return redirect(url_for('superadmin.pricing'))
