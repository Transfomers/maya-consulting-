from flask import render_template, redirect, url_for, flash, request, jsonify, abort
from flask_login import login_required, current_user
from app.models import User, Agency, Bus, Route, Trip, Booking, Feedback, AuditLog, SystemNotification, Parcel, Payment, db
from app import db
from datetime import datetime, date, timedelta
from sqlalchemy import func, or_, and_
import random
from app.routes.admin import admin, teller_required, admin_required, log_audit, trigger_notification, super_admin_required

# Helper: Get current caisse session
def get_current_caisse(agency_id):
    from app.models import CaisseSession
    return CaisseSession.query.filter_by(agency_id=agency_id, status='open').first()

# Helper: Generate 6-digit OTP
def generate_otp():
    return "".join([str(random.randint(0, 9)) for _ in range(6)])

def get_agency_scope():
    from flask import session
    
    # 1. Query parameter (highest priority)
    agency_id = request.args.get('agency_id', type=int)
    if agency_id:
        agency = Agency.query.get(agency_id)
        if agency:
            if current_user.role == 'super_admin':
                session['active_agency_id'] = agency.id
            return agency
            
    # 2. Session parameter (for super_admin)
    if current_user.role == 'super_admin':
        session_agency_id = session.get('active_agency_id')
        if session_agency_id:
            agency = Agency.query.get(session_agency_id)
            if agency:
                return agency
        # For super_admin, do NOT fall back to a default agency
        return None
                
    # 3. User's profile agency
    if hasattr(current_user, 'agency') and current_user.agency:
        return current_user.agency
        
    # 4. Fallback: first active agency
    agency = Agency.query.filter_by(is_deleted=False).first()
    if not agency:
        # Auto-create default agency if database is fresh
        agency = Agency(name="Agence de Douala", city="Douala")
        db.session.add(agency)
        db.session.commit()
        
    return agency

@admin.context_processor
def inject_agencies():
    from flask import session
    from app.models import Agency
    context = {}
    if current_user.is_authenticated:
        if current_user.role == 'super_admin':
            context['all_agencies'] = Agency.query.filter_by(is_deleted=False).all()
            session_agency_id = session.get('active_agency_id')
            if session_agency_id:
                context['active_agency'] = Agency.query.get(session_agency_id)
            else:
                context['active_agency'] = None
        else:
            context['active_agency'] = current_user.agency
            context['all_agencies'] = []
    return context

@admin.route('/admin/select_agency', methods=['GET', 'POST'])
@login_required
@admin_required
def select_agency():
    from flask import session
    clear = request.form.get('clear') or request.args.get('clear')
    if clear:
        session.pop('active_agency_id', None)
        flash("Affichage global (toutes les agences).", "success")
        return redirect(request.referrer or url_for('admin.super_parcel_dashboard'))
        
    if request.method == 'POST':
        agency_id = request.form.get('agency_id', type=int)
        if agency_id:
            agency = Agency.query.get(agency_id)
            if agency:
                session['active_agency_id'] = agency.id
                flash(f"Agence active changée pour : {agency.name}", "success")
    return redirect(request.referrer or url_for('admin.dashboard'))

# =========================================================================
# 🧑💼 1. AGENCY ADMIN (OPERATIONS LEVEL - TELLER / DAILY WORKER)
# =========================================================================

@admin.route('/admin/parcel/ops/dashboard')
@login_required
@teller_required
def teller_parcel_dashboard():
    agency = get_agency_scope()
    if not agency:
        flash("Veuillez sélectionner ou être associé à une agence.", "warning")
        return redirect(url_for('admin.dashboard'))

    today = date.today()
    start_of_day = datetime.combine(today, datetime.min.time())
    end_of_day = datetime.combine(today, datetime.max.time())

    # Metrics
    parcels_today = Parcel.query.filter(
        Parcel.agency_id == agency.id,
        Parcel.created_at >= start_of_day,
        Parcel.created_at <= end_of_day
    ).count()

    in_transit = Parcel.query.filter(
        Parcel.agency_id == agency.id,
        Parcel.status.in_(['loaded', 'in_transit'])
    ).count()

    city_filter = f"%{agency.city}%" if agency.city else "%"
    arrived = Parcel.query.filter(
        Parcel.receiver_city.ilike(city_filter),
        Parcel.status == 'arrived'
    ).count()

    delivered = Parcel.query.filter(
        Parcel.receiver_city.ilike(city_filter),
        Parcel.status == 'delivered'
    ).count()

    pending_assignment = Parcel.query.filter(
        Parcel.agency_id == agency.id,
        Parcel.status.in_(['pending', 'validated', 'paid']),
        Parcel.trip_id.is_(None)
    ).count()

    daily_revenue = db.session.query(func.sum(Parcel.price)).filter(
        Parcel.agency_id == agency.id,
        Parcel.payment_status == 'paid',
        Parcel.created_at >= start_of_day,
        Parcel.created_at <= end_of_day
    ).scalar() or 0.0

    # Active trips today departing from this agency
    active_trips_query = Trip.query.join(Route).filter(
        Route.origin.ilike(f"%{agency.city}%"),
        Trip.departure_time >= start_of_day,
        Trip.departure_time <= end_of_day,
        Trip.is_deleted == False
    )
    active_trips = active_trips_query.all()
    active_trips_count = len(active_trips)

    # Recent activity
    recent_parcels = Parcel.query.filter(
        Parcel.agency_id == agency.id
    ).order_by(Parcel.created_at.desc()).limit(5).all()

    return render_template(
        'admin/parcel_ops_dashboard.html',
        agency=agency,
        parcels_today=parcels_today,
        in_transit=in_transit,
        arrived=arrived,
        delivered=delivered,
        pending_assignment=pending_assignment,
        daily_revenue=daily_revenue,
        active_trips_count=active_trips_count,
        recent_parcels=recent_parcels
    )

@admin.route('/admin/parcel/ops/requests')
@login_required
@teller_required
def teller_parcel_requests():
    agency = get_agency_scope()
    if not agency:
        flash("Aucune agence associée.", "danger")
        return redirect(url_for('admin.dashboard'))

    requests = Parcel.query.filter_by(
        agency_id=agency.id,
        status='pending'
    ).order_by(Parcel.created_at.desc()).all()

    return render_template('admin/parcel_ops_requests.html', requests=requests, agency=agency)

@admin.route('/admin/parcel/ops/request/<int:parcel_id>/validate', methods=['POST'])
@login_required
@teller_required
def validate_parcel_request(parcel_id):
    parcel = Parcel.query.get_or_404(parcel_id)
    weight = float(request.form.get('weight', parcel.weight))
    parcel_type = request.form.get('parcel_type', parcel.parcel_type)
    is_fragile = request.form.get('is_fragile') == 'true'
    has_insurance = request.form.get('has_insurance') == 'true'

    # Recalculate price
    base_price = max(1000, round(weight * 1000))
    insurance_fee = 1500 if has_insurance else 0
    price = base_price + insurance_fee

    parcel.weight = weight
    parcel.parcel_type = parcel_type
    parcel.is_fragile = is_fragile
    parcel.has_insurance = has_insurance
    parcel.price = price
    parcel.status = 'validated'
    db.session.commit()

    log_audit("PARCEL_VALIDATED", "Parcel", parcel.id, f"Weight: {weight}kg, Price: {price} FCFA")
    flash(f"Colis #{parcel.tracking_number} validé avec succès. Nouveau tarif : {price} FCFA.", "success")
    return redirect(url_for('admin.teller_parcel_requests'))

@admin.route('/admin/parcel/ops/request/<int:parcel_id>/reject', methods=['POST'])
@login_required
@teller_required
def reject_parcel_request(parcel_id):
    parcel = Parcel.query.get_or_404(parcel_id)
    reason = request.form.get('rejection_reason', 'Non spécifiée')

    parcel.status = 'rejected'
    parcel.rejection_reason = reason
    db.session.commit()

    log_audit("PARCEL_REJECTED", "Parcel", parcel.id, f"Reason: {reason}")
    flash(f"La demande de colis #{parcel.tracking_number} a été rejetée.", "warning")
    return redirect(url_for('admin.teller_parcel_requests'))

@admin.route('/admin/parcel/ops/list')
@login_required
@teller_required
def teller_parcel_list():
    agency = get_agency_scope()
    if not agency:
        flash("Aucune agence associée.", "danger")
        return redirect(url_for('admin.dashboard'))

    status_filter = request.args.get('status', '')
    query = Parcel.query.filter_by(agency_id=agency.id)

    if status_filter:
        query = query.filter_by(status=status_filter)

    search = request.args.get('search', '')
    if search:
        query = query.filter(
            or_(
                Parcel.tracking_number.ilike(f"%{search}%"),
                Parcel.sender_name.ilike(f"%{search}%"),
                Parcel.receiver_name.ilike(f"%{search}%"),
                Parcel.sender_phone.ilike(f"%{search}%"),
                Parcel.receiver_phone.ilike(f"%{search}%")
            )
        )

    parcels = query.order_by(Parcel.created_at.desc()).all()
    return render_template('admin/parcel_ops_list.html', parcels=parcels, selected_status=status_filter, search=search, agency=agency)

@admin.route('/admin/parcel/ops/payments')
@login_required
@teller_required
def teller_parcel_payments():
    agency = get_agency_scope()
    if not agency:
        flash("Aucune agence associée.", "danger")
        return redirect(url_for('admin.dashboard'))

    # Parcels that are validated but not yet paid
    parcels = Parcel.query.filter_by(
        agency_id=agency.id,
        payment_status='pending'
    ).filter(Parcel.status != 'rejected').order_by(Parcel.created_at.desc()).all()

    caisse = get_current_caisse(agency.id)

    return render_template('admin/parcel_ops_payments.html', parcels=parcels, caisse=caisse, agency=agency)

@admin.route('/admin/parcel/ops/parcel/<int:parcel_id>/pay', methods=['POST'])
@login_required
@teller_required
def process_parcel_payment(parcel_id):
    agency = get_agency_scope()
    caisse = get_current_caisse(agency.id)
    if not caisse:
        flash("La caisse doit être ouverte pour recevoir un paiement.", "danger")
        return redirect(url_for('admin.teller_parcel_payments'))

    parcel = Parcel.query.get_or_404(parcel_id)
    payment_method = request.form.get('payment_method', 'Cash')

    parcel.payment_status = 'paid'
    parcel.payment_method = payment_method
    if not parcel.otp_code:
        parcel.otp_code = generate_otp()
    if parcel.status == 'validated':
        parcel.status = 'paid' if not parcel.trip_id else 'assigned'
    db.session.commit()

    log_audit("PARCEL_PAID", "Parcel", parcel.id, f"Method: {payment_method}, OTP Code: {parcel.otp_code}")
    flash(f"Paiement enregistré pour le colis #{parcel.tracking_number}. Code de retrait généré : {parcel.otp_code}.", "success")
    return redirect(url_for('admin.teller_parcel_payments'))

@admin.route('/admin/parcel/ops/assign')
@login_required
@teller_required
def teller_parcel_assign():
    agency = get_agency_scope()
    if not agency:
        flash("Aucune agence associée.", "danger")
        return redirect(url_for('admin.dashboard'))

    # Paid or validated parcels with no trip assigned
    parcels = Parcel.query.filter(
        Parcel.agency_id == agency.id,
        Parcel.payment_status == 'paid',
        Parcel.trip_id.is_(None)
    ).filter(Parcel.status != 'rejected').order_by(Parcel.created_at.desc()).all()

    # Get available upcoming trips departing from this city
    trips = Trip.query.join(Route).filter(
        Route.origin.ilike(f"%{agency.city}%"),
        Trip.departure_time >= datetime.utcnow() - timedelta(hours=2),
        Trip.is_deleted == False
    ).order_by(Trip.departure_time.asc()).all()

    return render_template('admin/parcel_ops_assign.html', parcels=parcels, trips=trips, agency=agency)

@admin.route('/admin/parcel/ops/parcel/<int:parcel_id>/assign', methods=['POST'])
@login_required
@teller_required
def assign_parcel_trip(parcel_id):
    parcel = Parcel.query.get_or_404(parcel_id)
    trip_id = request.form.get('trip_id', type=int)

    trip = Trip.query.get_or_404(trip_id)
    parcel.trip_id = trip.id
    parcel.status = 'assigned'
    db.session.commit()

    log_audit("PARCEL_ASSIGNED", "Parcel", parcel.id, f"Trip ID: {trip.id}")
    flash(f"Colis #{parcel.tracking_number} assigné au Voyage de {trip.departure_time.strftime('%d/%m à %H:%M')} ({trip.bus.bus_number}).", "success")
    return redirect(url_for('admin.teller_parcel_assign'))

@admin.route('/admin/parcel/ops/loading')
@login_required
@teller_required
def teller_parcel_loading():
    agency = get_agency_scope()
    if not agency:
        flash("Aucune agence associée.", "danger")
        return redirect(url_for('admin.dashboard'))

    # Parcels assigned to upcoming trips that need to be loaded
    parcels = Parcel.query.filter_by(
        agency_id=agency.id,
        status='assigned'
    ).order_by(Parcel.created_at.desc()).all()

    return render_template('admin/parcel_ops_loading.html', parcels=parcels, agency=agency)

@admin.route('/admin/parcel/ops/parcel/<int:parcel_id>/load', methods=['POST'])
@login_required
@teller_required
def load_parcel(parcel_id):
    parcel = Parcel.query.get_or_404(parcel_id)
    
    parcel.status = 'loaded'
    db.session.commit()

    log_audit("PARCEL_LOADED", "Parcel", parcel.id, f"Loaded onto trip #{parcel.trip_id}")
    flash(f"Colis #{parcel.tracking_number} marqué comme CHARGÉ.", "success")
    return redirect(url_for('admin.teller_parcel_loading'))

@admin.route('/admin/parcel/ops/tracking')
@login_required
@teller_required
def teller_parcel_tracking():
    agency = get_agency_scope()
    if not agency:
        flash("Aucune agence associée.", "danger")
        return redirect(url_for('admin.dashboard'))

    # Active parcels departing from or arriving to this agency that are loaded or in transit
    parcels = Parcel.query.filter(
        or_(Parcel.agency_id == agency.id, Parcel.receiver_city.ilike(f"%{agency.city}%")),
        Parcel.status.in_(['loaded', 'in_transit'])
    ).all()

    return render_template('admin/parcel_ops_tracking.html', parcels=parcels, agency=agency)

@admin.route('/admin/parcel/ops/delivery')
@login_required
@teller_required
def teller_parcel_delivery():
    agency = get_agency_scope()
    if not agency:
        flash("Aucune agence associée.", "danger")
        return redirect(url_for('admin.dashboard'))

    # Parcels whose destination is this agency city, and which are arrived/ready for pick-up
    parcels = Parcel.query.filter(
        Parcel.receiver_city.ilike(f"%{agency.city}%"),
        Parcel.status.in_(['loaded', 'in_transit', 'arrived'])
    ).order_by(Parcel.created_at.desc()).all()

    return render_template('admin/parcel_ops_delivery.html', parcels=parcels, agency=agency)

@admin.route('/admin/parcel/ops/parcel/<int:parcel_id>/arrive', methods=['POST'])
@login_required
@teller_required
def mark_parcel_arrived(parcel_id):
    parcel = Parcel.query.get_or_404(parcel_id)
    parcel.status = 'arrived'
    db.session.commit()

    log_audit("PARCEL_ARRIVED", "Parcel", parcel.id, f"Arrived at destination: {parcel.receiver_city}")
    
    # Notify client
    trigger_notification(
        title="Colis Arrivé 📍",
        message=f"Votre colis #{parcel.tracking_number} est arrivé à destination ({parcel.receiver_city}). Code de retrait : {parcel.otp_code}",
        type="success",
        user_id=parcel.user_id,
        category="parcel_client"
    )
    
    flash(f"Colis #{parcel.tracking_number} marqué comme ARRIVÉ. Client notifié.", "success")
    return redirect(url_for('admin.teller_parcel_delivery'))

@admin.route('/admin/parcel/ops/parcel/<int:parcel_id>/deliver', methods=['POST'])
@login_required
@teller_required
def deliver_parcel(parcel_id):
    parcel = Parcel.query.get_or_404(parcel_id)
    otp = request.form.get('otp', '').strip()
    id_type = request.form.get('receiver_id_type', '').strip()
    id_number = request.form.get('receiver_id_number', '').strip()

    if not otp or not id_type or not id_number:
        flash("Veuillez remplir tous les champs obligatoires pour la livraison.", "danger")
        return redirect(url_for('admin.teller_parcel_delivery'))

    if parcel.otp_code != otp:
        flash("Code OTP incorrect. Veuillez réessayer.", "danger")
        return redirect(url_for('admin.teller_parcel_delivery'))

    parcel.status = 'delivered'
    parcel.receiver_id_type = id_type
    parcel.receiver_id_number = id_number
    db.session.commit()

    log_audit("PARCEL_DELIVERED", "Parcel", parcel.id, f"Delivered to receiver. ID: {id_type} {id_number}")
    
    # Send email notification asynchronously
    from app.services.email_service import send_parcel_delivered
    from app.models import User
    parcel_owner = User.query.get(parcel.user_id) if parcel.user_id else None
    send_parcel_delivered(parcel_owner, parcel)
    
    trigger_notification(
        title="Colis Livré ✅",
        message=f"Votre colis #{parcel.tracking_number} a été livré à {parcel.receiver_name} avec succès.",
        type="success",
        user_id=parcel.user_id,
        category="parcel_client"
    )

    flash(f"Colis #{parcel.tracking_number} livré avec succès !", "success")
    return redirect(url_for('admin.teller_parcel_delivery'))

@admin.route('/admin/parcel/ops/report')
@login_required
@teller_required
def teller_parcel_report():
    agency = get_agency_scope()
    if not agency:
        flash("Aucune agence associée.", "danger")
        return redirect(url_for('admin.dashboard'))

    today = date.today()
    start_of_day = datetime.combine(today, datetime.min.time())
    end_of_day = datetime.combine(today, datetime.max.time())

    # Daily operations statistics
    parcels_handled = Parcel.query.filter(
        Parcel.agency_id == agency.id,
        Parcel.created_at >= start_of_day,
        Parcel.created_at <= end_of_day
    ).all()

    total_weight = sum(p.weight for p in parcels_handled if p.status != 'rejected')
    total_items = sum(p.num_items for p in parcels_handled if p.status != 'rejected')
    
    cash_revenue = sum(p.price for p in parcels_handled if p.payment_status == 'paid' and p.payment_method == 'Cash')
    momo_revenue = sum(p.price for p in parcels_handled if p.payment_status == 'paid' and p.payment_method == 'MoMo')
    orange_revenue = sum(p.price for p in parcels_handled if p.payment_status == 'paid' and p.payment_method == 'Orange Money')
    total_revenue = cash_revenue + momo_revenue + orange_revenue

    return render_template(
        'admin/parcel_ops_report.html',
        agency=agency,
        parcels=parcels_handled,
        total_weight=total_weight,
        total_items=total_items,
        cash_revenue=cash_revenue,
        momo_revenue=momo_revenue,
        orange_revenue=orange_revenue,
        total_revenue=total_revenue
    )


# =========================================================================
# 📊 2. HEAD OF AGENCY (MANAGEMENT LEVEL - ADMIN AGENCE / CHEF D'AGENCE)
# =========================================================================

@admin.route('/admin/parcel/mgr/dashboard')
@login_required
@admin_required
def manager_parcel_dashboard():
    agency = get_agency_scope()
    if not agency:
        flash("Veuillez sélectionner ou être associé à une agence.", "warning")
        return redirect(url_for('admin.dashboard'))

    today = date.today()
    start_of_day = datetime.combine(today, datetime.min.time())
    end_of_day = datetime.combine(today, datetime.max.time())
    
    # Calculate last 30 days boundaries
    month_start = datetime.combine(today - timedelta(days=29), datetime.min.time())

    # Scoped trip IDs for overall statistics
    trip_ids_q = db.session.query(Trip.id).join(Route).filter(Route.agency_id == agency.id, Trip.is_deleted == False)
    trip_ids = [t[0] for t in trip_ids_q.all()]

    # 1. KPI Cards
    total_today = Parcel.query.filter(
        Parcel.agency_id == agency.id,
        Parcel.created_at >= start_of_day,
        Parcel.created_at <= end_of_day
    ).count()

    total_monthly = Parcel.query.filter(
        Parcel.agency_id == agency.id,
        Parcel.created_at >= month_start
    ).count()

    in_transit = Parcel.query.filter(
        Parcel.agency_id == agency.id,
        Parcel.status.in_(['loaded', 'in_transit'])
    ).count()

    city_filter = f"%{agency.city}%" if agency.city else "%"
    delivered_count = Parcel.query.filter(
        Parcel.receiver_city.ilike(city_filter),
        Parcel.status == 'delivered'
    ).count()
    total_valid = Parcel.query.filter(
        Parcel.receiver_city.ilike(city_filter),
        Parcel.status != 'rejected'
    ).count()
    delivered_rate = round((delivered_count / total_valid * 100), 1) if total_valid > 0 else 100.0

    # Revenues
    parcel_revenue = db.session.query(func.sum(Parcel.price)).filter(
        Parcel.agency_id == agency.id,
        Parcel.payment_status == 'paid'
    ).scalar() or 0.0

    if trip_ids:
        ticket_revenue = db.session.query(func.sum(Booking.price_paid)).filter(
            Booking.trip_id.in_(trip_ids),
            Booking.status == 'confirmed',
            Booking.is_deleted == False
        ).scalar() or 0.0
    else:
        ticket_revenue = 0.0
    total_revenue = parcel_revenue + ticket_revenue

    active_trips_count = Trip.query.join(Route).filter(
        Route.agency_id == agency.id,
        Trip.departure_time >= start_of_day,
        Trip.departure_time <= end_of_day,
        Trip.is_deleted == False
    ).count()

    # 2. Peak hours mock data / Top routes / Trends
    routes_perf = db.session.query(
        Route.origin, Route.destination, func.count(Parcel.id), func.sum(Parcel.price)
    ).join(Trip, Trip.id == Parcel.trip_id).join(Route, Route.id == Trip.route_id).filter(
        Parcel.agency_id == agency.id
    ).group_by(Route.origin, Route.destination).all()

    top_routes = []
    for origin, destination, count, amount in routes_perf:
        top_routes.append({
            'route': f"{origin} ➔ {destination}",
            'count': count,
            'revenue': amount or 0.0
        })
    
    if not top_routes:
        top_routes = [
            {'route': f"{agency.city} ➔ Yaoundé", 'count': 45, 'revenue': 45000.0},
            {'route': f"{agency.city} ➔ Douala", 'count': 32, 'revenue': 32000.0},
            {'route': f"{agency.city} ➔ Bafoussam", 'count': 18, 'revenue': 18000.0}
        ]

    return render_template(
        'admin/parcel_mgr_dashboard.html',
        agency=agency,
        total_today=total_today,
        total_monthly=total_monthly,
        in_transit=in_transit,
        delivered_rate=delivered_rate,
        total_revenue=total_revenue,
        parcel_revenue=parcel_revenue,
        ticket_revenue=ticket_revenue,
        active_trips_count=active_trips_count,
        top_routes=top_routes
    )

@admin.route('/admin/parcel/mgr/trips')
@login_required
@admin_required
def manager_trip_cargo():
    agency = get_agency_scope()
    if not agency:
        flash("Aucune agence associée.", "danger")
        return redirect(url_for('admin.dashboard'))

    # Load trips departing from this agency in the next 7 days
    trips = Trip.query.join(Route).filter(
        Route.agency_id == agency.id,
        Trip.departure_time >= datetime.utcnow() - timedelta(days=1),
        Trip.is_deleted == False
    ).order_by(Trip.departure_time.asc()).all()

    trip_performance = []
    for trip in trips:
        # Passengers booking count
        passengers_count = Booking.query.filter_by(trip_id=trip.id, status='confirmed').count()
        passenger_cap = trip.bus.capacity
        
        # Cargo parcel details
        parcels = Parcel.query.filter_by(trip_id=trip.id).all()
        parcel_weight = sum(p.weight for p in parcels if p.status != 'rejected')
        # Bus cargo max weight limit (e.g. default 500kg)
        cargo_cap = 500.0 
        
        # Revenue
        tickets_rev = db.session.query(func.sum(Booking.price_paid)).filter_by(trip_id=trip.id, status='confirmed').scalar() or 0.0
        parcels_rev = sum(p.price for p in parcels if p.payment_status == 'paid')
        total_rev = tickets_rev + parcels_rev

        trip_performance.append({
            'id': trip.id,
            'bus': trip.bus.bus_number,
            'route': f"{trip.route.origin} ➔ {trip.route.destination}",
            'departure': trip.departure_time,
            'passengers': f"{passengers_count}/{passenger_cap}",
            'cargo_weight': f"{parcel_weight:.1f}kg/{cargo_cap:.0f}kg",
            'tickets_revenue': tickets_rev,
            'parcels_revenue': parcels_rev,
            'total_revenue': total_rev
        })

    return render_template('admin/parcel_mgr_trips.html', trips=trip_performance, agency=agency)

@admin.route('/admin/parcel/mgr/monitoring')
@login_required
@admin_required
def manager_parcel_monitoring():
    agency = get_agency_scope()
    if not agency:
        flash("Aucune agence associée.", "danger")
        return redirect(url_for('admin.dashboard'))

    search = request.args.get('search', '').strip()
    parcel = None
    timeline = []
    all_parcels = []

    if search:
        parcel = Parcel.query.filter(
            Parcel.agency_id == agency.id,
            or_(
                Parcel.tracking_number == search,
                Parcel.sender_phone == search,
                Parcel.receiver_phone == search
            )
        ).first()

        if parcel:
            # Reconstruct timeline from statuses and audit logs
            logs = AuditLog.query.filter_by(target_type='Parcel', target_id=parcel.id).order_by(AuditLog.created_at.asc()).all()
            for log in logs:
                timeline.append({
                    'action': log.action,
                    'details': log.details,
                    'time': log.created_at,
                    'user': log.user.username if log.user else 'Système'
                })
            
            # Fallback if no logs exist (old data)
            if not timeline:
                timeline.append({'action': 'PARCEL_CREATED', 'details': 'Demande créée par le client', 'time': parcel.created_at, 'user': parcel.sender_name})
                if parcel.payment_status == 'paid':
                    timeline.append({'action': 'PARCEL_PAID', 'details': f'Paiement effectué via {parcel.payment_method}', 'time': parcel.created_at, 'user': 'Guichetier'})
                if parcel.trip_id:
                    timeline.append({'action': 'PARCEL_ASSIGNED', 'details': 'Assigné au voyage', 'time': parcel.created_at, 'user': 'Guichetier'})
                if parcel.status == 'loaded':
                    timeline.append({'action': 'PARCEL_LOADED', 'details': 'Chargé dans le bus', 'time': parcel.created_at, 'user': 'Guichetier'})
                if parcel.status == 'delivered':
                    timeline.append({'action': 'PARCEL_DELIVERED', 'details': 'Livré au destinataire final', 'time': parcel.created_at, 'user': 'Guichetier'})
    else:
        # Query all parcels sent from this agency
        all_parcels = Parcel.query.filter_by(
            agency_id=agency.id
        ).order_by(Parcel.created_at.desc()).all()

    return render_template('admin/parcel_mgr_monitoring.html', parcel=parcel, timeline=timeline, search=search, agency=agency, all_parcels=all_parcels)

@admin.route('/admin/parcel/mgr/exceptions')
@login_required
@admin_required
def manager_parcel_exceptions():
    agency = get_agency_scope()
    if not agency:
        flash("Aucune agence associée.", "danger")
        return redirect(url_for('admin.dashboard'))

    # Delayed: assigned or loaded but departure time has passed by 6+ hours and not arrived
    six_hours_ago = datetime.utcnow() - timedelta(hours=6)
    delayed_parcels = Parcel.query.join(Trip).filter(
        Parcel.agency_id == agency.id,
        Parcel.status.in_(['assigned', 'loaded']),
        Trip.departure_time < six_hours_ago
    ).all()

    # Rejected parcels
    rejected_parcels = Parcel.query.filter_by(
        agency_id=agency.id,
        status='rejected'
    ).all()

    # Disputed parcels (with dispute notes)
    disputed_parcels = Parcel.query.filter(
        Parcel.agency_id == agency.id,
        Parcel.dispute_notes.isnot(None)
    ).all()

    return render_template(
        'admin/parcel_mgr_exceptions.html',
        agency=agency,
        delayed=delayed_parcels,
        rejected=rejected_parcels,
        disputed=disputed_parcels
    )

@admin.route('/admin/parcel/mgr/parcel/<int:parcel_id>/dispute', methods=['POST'])
@login_required
@admin_required
def update_parcel_dispute(parcel_id):
    parcel = Parcel.query.get_or_404(parcel_id)
    notes = request.form.get('dispute_notes', '')

    parcel.dispute_notes = notes
    db.session.commit()

    log_audit("PARCEL_DISPUTE_UPDATED", "Parcel", parcel.id, f"Notes: {notes}")
    flash(f"Notes de litige mises à jour pour le colis #{parcel.tracking_number}.", "success")
    return redirect(url_for('admin.manager_parcel_exceptions'))


# =========================================================================
# 👑 3. SUPER ADMIN PARCEL MANAGEMENT console
# =========================================================================

@admin.route('/admin/parcel/super/dashboard')
@login_required
@super_admin_required
def super_parcel_dashboard():
    today = date.today()
    start_of_day = datetime.combine(today, datetime.min.time())
    end_of_day = datetime.combine(today, datetime.max.time())
    start_of_month = datetime.combine(today.replace(day=1), datetime.min.time())

    # 1. Global Metrics
    global_today_count = Parcel.query.filter(Parcel.created_at >= start_of_day, Parcel.created_at <= end_of_day).count()
    global_month_count = Parcel.query.filter(Parcel.created_at >= start_of_month).count()
    global_in_transit = Parcel.query.filter(Parcel.status.in_(['loaded', 'in_transit'])).count()

    global_delivered = Parcel.query.filter(Parcel.status == 'delivered').count()
    global_valid = Parcel.query.filter(Parcel.status != 'rejected').count()
    global_success_rate = round((global_delivered / global_valid * 100), 1) if global_valid > 0 else 100.0

    global_parcel_rev = db.session.query(func.sum(Parcel.price)).filter(Parcel.payment_status == 'paid').scalar() or 0.0
    global_ticket_rev = db.session.query(func.sum(Booking.price_paid)).filter(Booking.status == 'confirmed', Booking.is_deleted == False).scalar() or 0.0
    global_total_rev = global_parcel_rev + global_ticket_rev

    # 2. Scoped Metrics (Active Agency)
    agency = get_agency_scope()
    if agency:
        scoped_today_count = Parcel.query.filter(Parcel.agency_id == agency.id, Parcel.created_at >= start_of_day, Parcel.created_at <= end_of_day).count()
        scoped_month_count = Parcel.query.filter(Parcel.agency_id == agency.id, Parcel.created_at >= start_of_month).count()
        scoped_in_transit = Parcel.query.filter(Parcel.agency_id == agency.id, Parcel.status.in_(['loaded', 'in_transit'])).count()

        city_filter = f"%{agency.city}%" if agency.city else "%"
        scoped_delivered = Parcel.query.filter(Parcel.receiver_city.ilike(city_filter), Parcel.status == 'delivered').count()
        scoped_valid = Parcel.query.filter(Parcel.receiver_city.ilike(city_filter), Parcel.status != 'rejected').count()
        scoped_success_rate = round((scoped_delivered / scoped_valid * 100), 1) if scoped_valid > 0 else 100.0

        scoped_parcel_rev = db.session.query(func.sum(Parcel.price)).filter(Parcel.agency_id == agency.id, Parcel.payment_status == 'paid').scalar() or 0.0

        trip_ids_q = db.session.query(Trip.id).join(Route).filter(Route.agency_id == agency.id, Trip.is_deleted == False)
        trip_ids = [t[0] for t in trip_ids_q.all()]
        if trip_ids:
            scoped_ticket_rev = db.session.query(func.sum(Booking.price_paid)).filter(
                Booking.trip_id.in_(trip_ids),
                Booking.status == 'confirmed',
                Booking.is_deleted == False
            ).scalar() or 0.0
        else:
            scoped_ticket_rev = 0.0
        scoped_total_rev = scoped_parcel_rev + scoped_ticket_rev
    else:
        scoped_today_count = scoped_month_count = scoped_in_transit = 0
        scoped_success_rate = 100.0
        scoped_parcel_rev = scoped_ticket_rev = scoped_total_rev = 0.0

    active_trips_count = Trip.query.filter(
        Trip.departure_time >= start_of_day,
        Trip.departure_time <= end_of_day,
        Trip.is_deleted == False
    ).count()

    active_agencies_count = Agency.query.filter_by(is_deleted=False).count()

    # Recent global activity with date filters
    range_filter = request.args.get('range', 'all')
    query = Parcel.query
    if range_filter == 'day':
        start_time = datetime.combine(date.today(), datetime.min.time())
        query = query.filter(Parcel.created_at >= start_time)
    elif range_filter == 'week':
        start_time = datetime.combine(date.today() - timedelta(days=7), datetime.min.time())
        query = query.filter(Parcel.created_at >= start_time)
    elif range_filter == 'month':
        start_time = datetime.combine(date.today() - timedelta(days=30), datetime.min.time())
        query = query.filter(Parcel.created_at >= start_time)

    if range_filter == 'all':
        recent_parcels = query.order_by(Parcel.created_at.desc()).limit(50).all()
    else:
        recent_parcels = query.order_by(Parcel.created_at.desc()).all()

    return render_template(
        'admin/parcel_super_dashboard.html',
        selected_range=range_filter,
        global_today_count=global_today_count,
        global_month_count=global_month_count,
        global_in_transit=global_in_transit,
        global_success_rate=global_success_rate,
        global_parcel_rev=global_parcel_rev,
        global_ticket_rev=global_ticket_rev,
        global_total_rev=global_total_rev,
        scoped_today_count=scoped_today_count,
        scoped_month_count=scoped_month_count,
        scoped_in_transit=scoped_in_transit,
        scoped_success_rate=scoped_success_rate,
        scoped_parcel_rev=scoped_parcel_rev,
        scoped_ticket_rev=scoped_ticket_rev,
        scoped_total_rev=scoped_total_rev,
        active_trips_count=active_trips_count,
        active_agencies_count=active_agencies_count,
        recent_parcels=recent_parcels,
        agency=agency
    )

@admin.route('/admin/parcel/super/registry')
@login_required
@admin_required
def super_parcel_registry():
    if current_user.role != 'super_admin':
        agency_id = current_user.agency_id
    else:
        agency_id = request.args.get('agency_id', type=int)

    status = request.args.get('status', '')
    search = request.args.get('search', '').strip()
    date_from = request.args.get('date_from', '')
    date_to = request.args.get('date_to', '')

    query = Parcel.query

    if current_user.role != 'super_admin':
        query = query.filter(Parcel.agency_id == agency_id)
    elif agency_id:
        query = query.filter(Parcel.agency_id == agency_id)

    if status:
        query = query.filter(Parcel.status == status)
    if search:
        query = query.filter(
            or_(
                Parcel.tracking_number.ilike(f"%{search}%"),
                Parcel.sender_name.ilike(f"%{search}%"),
                Parcel.receiver_name.ilike(f"%{search}%"),
                Parcel.sender_phone.ilike(f"%{search}%"),
                Parcel.receiver_phone.ilike(f"%{search}%")
            )
        )
    if date_from:
        try:
            df = datetime.strptime(date_from, "%Y-%m-%d")
            query = query.filter(Parcel.created_at >= df)
        except ValueError:
            pass
    if date_to:
        try:
            dt = datetime.strptime(date_to, "%Y-%m-%d") + timedelta(days=1)
            query = query.filter(Parcel.created_at < dt)
        except ValueError:
            pass

    parcels = query.order_by(Parcel.created_at.desc()).all()
    if current_user.role != 'super_admin':
        agencies = Agency.query.filter_by(id=agency_id, is_deleted=False).all()
    else:
        agencies = Agency.query.filter_by(is_deleted=False).all()

    return render_template(
        'admin/parcel_super_registry.html',
        parcels=parcels,
        agencies=agencies,
        selected_agency_id=agency_id,
        selected_status=status,
        search=search,
        date_from=date_from,
        date_to=date_to
    )

@admin.route('/admin/parcel/super/agencies')
@login_required
@super_admin_required
def super_parcel_agencies():
    agencies = Agency.query.filter_by(is_deleted=False).all()
    agency_stats = []

    for ag in agencies:
        total_pkg = Parcel.query.filter_by(agency_id=ag.id).count()
        in_transit = Parcel.query.filter(Parcel.agency_id == ag.id, Parcel.status.in_(['loaded', 'in_transit'])).count()
        delivered = Parcel.query.filter_by(agency_id=ag.id, status='delivered').count()
        valid = Parcel.query.filter(Parcel.agency_id == ag.id, Parcel.status != 'rejected').count()
        success_rate = round((delivered / valid * 100), 1) if valid > 0 else 100.0
        revenue = db.session.query(func.sum(Parcel.price)).filter_by(agency_id=ag.id, payment_status='paid').scalar() or 0.0

        agency_stats.append({
            'agency': ag,
            'total_packages': total_pkg,
            'in_transit': in_transit,
            'delivered': delivered,
            'success_rate': success_rate,
            'revenue': revenue
        })

    return render_template('admin/parcel_super_agencies.html', agency_stats=agency_stats)

@admin.route('/admin/parcel/super/trips')
@login_required
@super_admin_required
def super_parcel_trips():
    date_from = request.args.get('date_from', '')
    date_to = request.args.get('date_to', '')

    query = Trip.query.filter(Trip.is_deleted == False)

    if date_from:
        try:
            df = datetime.strptime(date_from, "%Y-%m-%d")
            query = query.filter(Trip.departure_time >= df)
        except ValueError:
            pass
    if date_to:
        try:
            dt = datetime.strptime(date_to, "%Y-%m-%d") + timedelta(days=1)
            query = query.filter(Trip.departure_time < dt)
        except ValueError:
            pass

    if not date_from and not date_to:
        trips = query.order_by(Trip.departure_time.desc()).limit(50).all()
    else:
        trips = query.order_by(Trip.departure_time.desc()).all()

    trip_cargo = []
    for trip in trips:
        parcels = Parcel.query.filter_by(trip_id=trip.id).all()
        if not parcels and trip.departure_time < datetime.utcnow() - timedelta(days=2):
            continue

        parcel_weight = sum(p.weight for p in parcels if p.status != 'rejected')
        cargo_cap = 500.0
        capacity_usage = round((parcel_weight / cargo_cap) * 100, 1)

        parcels_rev = sum(p.price for p in parcels if p.payment_status == 'paid')
        tickets_rev = db.session.query(func.sum(Booking.price_paid)).filter_by(trip_id=trip.id, status='confirmed').scalar() or 0.0

        trip_cargo.append({
            'trip': trip,
            'parcel_count': len(parcels),
            'total_weight': parcel_weight,
            'cargo_cap': cargo_cap,
            'capacity_usage': capacity_usage,
            'parcels_revenue': parcels_rev,
            'tickets_revenue': tickets_rev,
            'total_revenue': parcels_rev + tickets_rev,
            'parcels': parcels
        })

    return render_template(
        'admin/parcel_super_trips.html',
        trips=trip_cargo,
        date_from=date_from,
        date_to=date_to
    )

@admin.route('/admin/parcel/super/routes')
@login_required
@admin_required
def super_parcel_routes():
    routes_perf_q = db.session.query(
        Route.id, Route.origin, Route.destination, func.count(Parcel.id), func.sum(Parcel.price)
    ).join(Trip, Trip.id == Parcel.trip_id).join(Route, Route.id == Trip.route_id)

    if current_user.role != 'super_admin':
        routes_perf_q = routes_perf_q.filter(Route.agency_id == current_user.agency_id)

    routes_perf = routes_perf_q.group_by(
        Route.id, Route.origin, Route.destination
    ).all()

    route_stats = []
    for r_id, origin, destination, count, amount in routes_perf:
        delivered = Parcel.query.join(Trip).filter(Trip.route_id == r_id, Parcel.status == 'delivered').count()
        valid = Parcel.query.join(Trip).filter(Trip.route_id == r_id, Parcel.status != 'rejected').count()
        success_rate = round((delivered / valid * 100), 1) if valid > 0 else 100.0

        route_stats.append({
            'route_name': f"{origin} ➔ {destination}",
            'count': count,
            'revenue': amount or 0.0,
            'success_rate': success_rate
        })

    route_stats_by_volume = sorted(route_stats, key=lambda x: x['count'], reverse=True)
    route_stats_by_revenue = sorted(route_stats, key=lambda x: x['revenue'], reverse=True)

    return render_template(
        'admin/parcel_super_routes.html',
        route_stats=route_stats,
        route_stats_by_volume=route_stats_by_volume[:10],
        route_stats_by_revenue=route_stats_by_revenue[:10]
    )

@admin.route('/admin/parcel/super/revenue')
@login_required
@super_admin_required
def super_parcel_revenue():
    date_from = request.args.get('date_from', '')
    date_to = request.args.get('date_to', '')

    # Defaults
    start_date = date.today() - timedelta(days=29)
    end_date = date.today()

    if date_from:
        try:
            start_date = datetime.strptime(date_from, "%Y-%m-%d").date()
        except ValueError:
            pass
    if date_to:
        try:
            end_date = datetime.strptime(date_to, "%Y-%m-%d").date()
        except ValueError:
            pass

    num_days = (end_date - start_date).days
    if num_days < 0:
        start_date, end_date = end_date, start_date
        num_days = abs(num_days)
    if num_days > 90:
        start_date = end_date - timedelta(days=90)
        num_days = 90

    daily_labels = []
    daily_values = []
    for i in range(num_days + 1):
        d = start_date + timedelta(days=i)
        start = datetime.combine(d, datetime.min.time())
        end = datetime.combine(d, datetime.max.time())
        rev = db.session.query(func.sum(Parcel.price)).filter(
            Parcel.payment_status == 'paid',
            Parcel.created_at >= start,
            Parcel.created_at <= end
        ).scalar() or 0.0
        daily_labels.append(d.strftime("%d %b"))
        daily_values.append(rev)

    today = date.today()
    monthly_labels = []
    monthly_values = []
    for i in range(5, -1, -1):
        d = today - timedelta(days=30*i)
        first_day = d.replace(day=1)
        start = datetime.combine(first_day, datetime.min.time())
        if first_day.month == 12:
            next_month = first_day.replace(year=first_day.year+1, month=1)
        else:
            next_month = first_day.replace(month=first_day.month+1)
        end = datetime.combine(next_month, datetime.min.time())

        rev = db.session.query(func.sum(Parcel.price)).filter(
            Parcel.payment_status == 'paid',
            Parcel.created_at >= start,
            Parcel.created_at < end
        ).scalar() or 0.0
        monthly_labels.append(first_day.strftime("%b %Y"))
        monthly_values.append(rev)

    # Filtered totals for the KPI cards
    filtered_query = db.session.query(func.sum(Parcel.price), func.count(Parcel.id)).filter(Parcel.payment_status == 'paid')
    if date_from:
        try:
            df = datetime.strptime(date_from, "%Y-%m-%d")
            filtered_query = filtered_query.filter(Parcel.created_at >= df)
        except ValueError:
            pass
    if date_to:
        try:
            dt = datetime.strptime(date_to, "%Y-%m-%d") + timedelta(days=1)
            filtered_query = filtered_query.filter(Parcel.created_at < dt)
        except ValueError:
            pass

    total_parcel_revenue, total_parcel_count = filtered_query.first()
    total_parcel_revenue = total_parcel_revenue or 0.0
    total_parcel_count = total_parcel_count or 0
    avg_parcel_value = round(total_parcel_revenue / total_parcel_count, 1) if total_parcel_count > 0 else 0.0

    # Method breakdown query with date filters
    breakdown_query = db.session.query(
        Parcel.payment_method, func.count(Parcel.id), func.sum(Parcel.price)
    ).filter(Parcel.payment_status == 'paid')

    if date_from:
        try:
            df = datetime.strptime(date_from, "%Y-%m-%d")
            breakdown_query = breakdown_query.filter(Parcel.created_at >= df)
        except ValueError:
            pass
    if date_to:
        try:
            dt = datetime.strptime(date_to, "%Y-%m-%d") + timedelta(days=1)
            breakdown_query = breakdown_query.filter(Parcel.created_at < dt)
        except ValueError:
            pass

    method_breakdown = breakdown_query.group_by(Parcel.payment_method).all()

    methods = []
    for m_name, count, amount in method_breakdown:
        methods.append({
            'method': m_name or 'Inconnu',
            'count': count,
            'revenue': amount or 0.0
        })

    return render_template(
        'admin/parcel_super_revenue.html',
        date_from=date_from,
        date_to=date_to,
        daily_labels=daily_labels,
        daily_values=daily_values,
        monthly_labels=monthly_labels,
        monthly_values=monthly_values,
        total_revenue=total_parcel_revenue,
        total_count=total_parcel_count,
        avg_value=avg_parcel_value,
        methods=methods
    )

@admin.route('/admin/parcel/super/tracking')
@login_required
@super_admin_required
def super_parcel_tracking():
    tracking_code = request.args.get('tracking_code', '').strip()
    parcel = None
    timeline = []

    if tracking_code:
        parcel = Parcel.query.filter_by(tracking_number=tracking_code).first()
        if parcel:
            logs = AuditLog.query.filter_by(target_type='Parcel', target_id=parcel.id).order_by(AuditLog.created_at.asc()).all()
            for log in logs:
                timeline.append({
                    'action': log.action,
                    'details': log.details,
                    'time': log.created_at,
                    'user': log.user.username if log.user else 'Système'
                })

            if not timeline:
                timeline.append({'action': 'PARCEL_CREATED', 'details': 'Demande de colis enregistrée', 'time': parcel.created_at, 'user': parcel.sender_name})
                if parcel.payment_status == 'paid':
                    timeline.append({'action': 'PARCEL_PAID', 'details': f'Paiement effectué via {parcel.payment_method}', 'time': parcel.created_at, 'user': 'Guichetier'})
                if parcel.trip_id:
                    timeline.append({'action': 'PARCEL_ASSIGNED', 'details': f'Assigné au voyage #{parcel.trip_id}', 'time': parcel.created_at, 'user': 'Guichetier'})
                if parcel.status == 'loaded':
                    timeline.append({'action': 'PARCEL_LOADED', 'details': 'Colis chargé dans le bus', 'time': parcel.created_at, 'user': 'Guichetier'})
                if parcel.status == 'delivered':
                    timeline.append({'action': 'PARCEL_DELIVERED', 'details': 'Colis livré au destinataire', 'time': parcel.created_at, 'user': 'Guichetier'})

    return render_template('admin/parcel_super_tracking.html', parcel=parcel, timeline=timeline, tracking_code=tracking_code)



@admin.route('/admin/parcel/super/incidents')
@login_required
@admin_required
def super_parcel_incidents():
    from app.models import Incident
    
    # 1. Statistics
    # Total Open Incidents
    open_count = Incident.query.filter_by(status='Open').count()
    # Total In Progress Incidents
    in_progress_count = Incident.query.filter_by(status='In Progress').count()
    # Total Resolved Incidents
    resolved_count = Incident.query.filter_by(status='Resolved').count()
    
    # Incident list with filters
    status_filter = request.args.get('status', '').strip()
    type_filter = request.args.get('type', '').strip()
    agency_filter = request.args.get('agency_id', type=int)
    
    query = Incident.query
    
    if current_user.role != 'super_admin':
        # Agency Admin is scoped to their agency
        query = query.filter_by(agency_id=current_user.agency_id)
        open_count = Incident.query.filter_by(status='Open', agency_id=current_user.agency_id).count()
        in_progress_count = Incident.query.filter_by(status='In Progress', agency_id=current_user.agency_id).count()
        resolved_count = Incident.query.filter_by(status='Resolved', agency_id=current_user.agency_id).count()
    elif agency_filter:
        query = query.filter_by(agency_id=agency_filter)
        
    if status_filter:
        query = query.filter_by(status=status_filter)
    if type_filter:
        query = query.filter_by(type=type_filter)
        
    incidents = query.order_by(Incident.created_at.desc()).all()
    
    # Also fetch active agencies for super admin filter dropdown
    from app.models import Agency
    agencies = Agency.query.filter_by(is_deleted=False).all()
    
    # Keep legacy lists too so that existing template views don't break if they reference them
    six_hours_ago = datetime.utcnow() - timedelta(hours=6)
    if current_user.role != 'super_admin':
        delayed = Parcel.query.join(Trip).filter(
            Parcel.agency_id == current_user.agency_id,
            Parcel.status.in_(['assigned', 'loaded']),
            Trip.departure_time < six_hours_ago
        ).all()
        rejected = Parcel.query.filter_by(agency_id=current_user.agency_id, status='rejected').all()
        disputed = Parcel.query.filter(
            Parcel.agency_id == current_user.agency_id,
            Parcel.dispute_notes.isnot(None),
            Parcel.dispute_notes != ''
        ).all()
    else:
        delayed = Parcel.query.join(Trip).filter(
            Parcel.status.in_(['assigned', 'loaded']),
            Trip.departure_time < six_hours_ago
        ).all()
        rejected = Parcel.query.filter_by(status='rejected').all()
        disputed = Parcel.query.filter(
            Parcel.dispute_notes.isnot(None),
            Parcel.dispute_notes != ''
        ).all()

    return render_template(
        'admin/parcel_super_incidents.html',
        incidents=incidents,
        open_count=open_count,
        in_progress_count=in_progress_count,
        resolved_count=resolved_count,
        status_filter=status_filter,
        type_filter=type_filter,
        agency_filter=agency_filter,
        agencies=agencies,
        delayed=delayed,
        rejected=rejected,
        disputed=disputed
    )

@admin.route('/admin/parcel/super/incident/report', methods=['POST'])
@login_required
def report_incident():
    from app.models import Incident, Parcel
    parcel_id = request.form.get('parcel_id', type=int)
    incident_type = request.form.get('type')
    description = request.form.get('description')
    photo_file = request.files.get('photo')
    receipt_file = request.files.get('receipt_photo')
    
    parcel = Parcel.query.get_or_404(parcel_id)
    
    # Enforce scope: clients can only report incidents on their own parcels
    if current_user.role == 'client' and parcel.user_id != current_user.id:
        abort(403)
    
    # Read photo and convert to base64 Data URL if present
    photo_data_url = None
    if photo_file and photo_file.filename:
        import base64
        file_bytes = photo_file.read()
        encoded = base64.b64encode(file_bytes).decode('utf-8')
        mime_type = photo_file.content_type or 'image/png'
        photo_data_url = f"data:{mime_type};base64,{encoded}"

    # Read receipt photo and convert to base64 Data URL if present
    receipt_data_url = None
    if receipt_file and receipt_file.filename:
        import base64
        file_bytes_receipt = receipt_file.read()
        encoded_receipt = base64.b64encode(file_bytes_receipt).decode('utf-8')
        mime_type_receipt = receipt_file.content_type or 'image/png'
        receipt_data_url = f"data:{mime_type_receipt};base64,{encoded_receipt}"
        
    # Generate Case ID INC-XXXXXX
    import random
    case_number = f"INC-{random.randint(100, 999)}"
    # Ensure uniqueness
    while Incident.query.filter_by(case_number=case_number).first():
        case_number = f"INC-{random.randint(100, 999)}"
        
    # Create incident
    incident = Incident(
        case_number=case_number,
        parcel_id=parcel.id,
        trip_id=parcel.trip_id if parcel.trip_id else 1, # default/fallback trip
        agency_id=parcel.agency_id,
        type=incident_type,
        description=description,
        photo=photo_data_url,
        receipt_photo=receipt_data_url,
        status='Open',
        notes=f"Incident créé par {current_user.username} le {datetime.now().strftime('%Y-%m-%d %H:%M')}.\nDescription: {description}",
        created_at=datetime.utcnow()
    )
    
    db.session.add(incident)
    db.session.commit()
    
    log_audit("PARCEL_INCIDENT_REPORTED", "Parcel", parcel.id, f"Case: {case_number}, Type: {incident_type}")
    
    # Notify super admin or agency admin
    trigger_notification(
        title=f"Nouvel incident {case_number}",
        message=f"Incident de type '{incident_type}' signalé pour le colis {parcel.tracking_number}.",
        category="super_admin"
    )
    
    flash(f"Incident {case_number} signalé avec succès !", "success")
    return redirect(request.referrer or url_for('admin.super_parcel_incidents'))

@admin.route('/admin/parcel/super/incident/<int:incident_id>/notes', methods=['POST'])
@login_required
@admin_required
def add_investigation_notes(incident_id):
    from app.models import Incident
    incident = Incident.query.get_or_404(incident_id)
    if current_user.role != 'super_admin' and incident.agency_id != current_user.agency_id:
        abort(403)
        
    new_note = request.form.get('note', '').strip()
    if new_note:
        timestamp = datetime.now().strftime('%Y-%m-%d %H:%M')
        formatted_note = f"\n[{timestamp}] Par {current_user.username} : {new_note}"
        if incident.notes:
            incident.notes += formatted_note
        else:
            incident.notes = formatted_note
        db.session.commit()
        log_audit("INCIDENT_NOTE_ADDED", "Incident", incident.id, f"Case: {incident.case_number}")
        flash("Notes d'enquête mises à jour.", "success")
        
    return redirect(url_for('admin.super_parcel_incidents'))

@admin.route('/admin/parcel/super/incident/<int:incident_id>/assign', methods=['POST'])
@login_required
@admin_required
def assign_incident(incident_id):
    from app.models import Incident
    incident = Incident.query.get_or_404(incident_id)
    if current_user.role != 'super_admin' and incident.agency_id != current_user.agency_id:
        abort(403)
        
    assignee = request.form.get('assignee', '').strip()
    if assignee:
        incident.assigned_to = assignee
        incident.status = 'In Progress'
        
        timestamp = datetime.now().strftime('%Y-%m-%d %H:%M')
        formatted_note = f"\n[{timestamp}] Assigné à {assignee} par {current_user.username}."
        if incident.notes:
            incident.notes += formatted_note
        else:
            incident.notes = formatted_note
            
        db.session.commit()
        log_audit("INCIDENT_ASSIGNED", "Incident", incident.id, f"Assigned to: {assignee}")
        flash(f"Incident assigné à {assignee}.", "success")
        
    return redirect(url_for('admin.super_parcel_incidents'))

@admin.route('/admin/parcel/super/incident/<int:incident_id>/resolve', methods=['POST'])
@login_required
@admin_required
def resolve_incident(incident_id):
    from app.models import Incident
    incident = Incident.query.get_or_404(incident_id)
    if current_user.role != 'super_admin' and incident.agency_id != current_user.agency_id:
        abort(403)
        
    resolution = request.form.get('resolution', '').strip()
    if resolution:
        incident.resolution = resolution
        incident.status = 'Resolved'
        incident.resolved_at = datetime.utcnow()
        
        timestamp = datetime.now().strftime('%Y-%m-%d %H:%M')
        formatted_note = f"\n[{timestamp}] Résolu : {resolution} (Par {current_user.username})."
        if incident.notes:
            incident.notes += formatted_note
        else:
            incident.notes = formatted_note
            
        db.session.commit()
        log_audit("INCIDENT_RESOLVED", "Incident", incident.id, f"Resolution: {resolution}")
        flash("Incident marqué comme résolu.", "success")
        
    return redirect(url_for('admin.super_parcel_incidents'))

