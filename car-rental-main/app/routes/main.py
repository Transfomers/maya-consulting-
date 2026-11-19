from flask import Blueprint, render_template, request, flash, redirect, url_for, jsonify, make_response, current_app, send_file, session
from flask_login import login_required, current_user
from app.models import Route, Bus, Booking, Trip, Payment, Feedback, SystemNotification, Agency, Parcel, TripSchedule
from app import db
from datetime import datetime, timedelta
import io
from reportlab.lib.pagesizes import letter
from reportlab.pdfgen import canvas
import os
import random
from flask_mail import Message
import qrcode
from io import BytesIO

bp = Blueprint('main', __name__)

@bp.route('/set_language/<lang>')
def set_language(lang):
    if lang in ['fr', 'en']:
        session['lang'] = lang
    return redirect(request.referrer or url_for('main.index'))

@bp.route('/health')
def health_check():
    try:
        db.session.execute(db.text('SELECT 1'))
        return jsonify({"status": "ok", "database": "ok"}), 200
    except Exception as e:
        db.session.rollback()
        return jsonify({"status": "error", "database": "failed", "details": str(e)}), 503

@bp.route('/')
def index():
    # React app on port 3001 is the single customer homepage
    if current_user.is_authenticated and current_user.role in ['admin', 'super_admin']:
        return redirect(url_for('admin.dashboard'))
    return redirect('http://localhost:3001/')

@bp.route('/service-worker.js')
def service_worker():
    return send_file('static/service-worker.js', mimetype='application/javascript')

@bp.route('/manifest.json')
def manifest():
    return send_file('static/manifest.json', mimetype='application/json')

@bp.route('/offline.html')
def offline():
    return render_template('offline.html')

@bp.route('/test-email')
def test_email():
    from app.services.email_service import send_email
    
    recipient = request.args.get('email', 'safouraparadis@gmail.com')
    
    try:
        result = send_email(
            to_email=recipient,
            subject="3M SERVICES Test",
            html_content="<h2>Email service is working!</h2>"
        )
        return {"success": result, "recipient": recipient, "message": "Email request processed."}
    except Exception as e:
        db.session.rollback()
        return {"success": False, "error": str(e), "message": "Exception raised."}

@bp.route('/search')
def search():
    from app.services.trip_service import get_search_results, get_available_cities, get_available_agencies
    
    origin = request.args.get('origin', '')
    destination = request.args.get('destination', '')
    date = request.args.get('date', '')
    time_filter = request.args.get('time_filter', '')
    agency_id = request.args.get('agency_id', type=int)
    day_filter = request.args.get('day_filter', '')  # today, tomorrow, upcoming

    SUPPORTED_CITIES = [
        "Yaoundé", "Douala", "Bafoussam", "Bamenda", "Garoua", "Maroua", 
        "Ngaoundéré", "Bertoua", "Ebolowa", "Kribi", "Limbé", "Kumba", 
        "Buea", "Dschang", "Mbouda", "Foumban", "Sangmélima", "Edéa", 
        "Abong-Mbang", "Yagoua", "Meiganga", "Mokolo", "Guider"
    ]

    results = {'today': [], 'tomorrow': [], 'upcoming': [], 'total_count': 0, 'all': []}
    searched = bool(origin or destination or date)
    
    if searched:
        if origin and destination and origin == destination:
            flash("La ville de départ ne peut pas être la même que la ville d'arrivée.", "danger")
            return redirect(url_for('main.search'))
        if destination and destination not in SUPPORTED_CITIES:
            flash("Désolé, cette ville n'est pas au Cameroun ou n'est pas supportée.", "warning")
            return redirect(url_for('main.search'))
        try:
            search_date = None
            if date:
                try:
                    search_date = datetime.strptime(date, '%Y-%m-%d').date()
                except ValueError:
                    search_date = datetime.strptime(date, '%d/%m/%Y').date()
            
            results = get_search_results(
                origin=origin,
                destination=destination,
                search_date=search_date,
                time_filter=time_filter or None,
                agency_id=agency_id
            )
        except ValueError:
            flash('Format de date invalide. Utilisez AAAA-MM-JJ ou JJ/MM/AAAA.', 'danger')
        except Exception as e:
            import logging
            logging.getLogger(__name__).error(f"Search error: {e}")
            flash('Une erreur temporaire est survenue. Veuillez réessayer dans quelques instants.', 'danger')
    
    # For the legacy 'trips' variable (backwards compat with existing search.html)
    if day_filter == 'today':
        trips = results.get('today', [])
    elif day_filter == 'tomorrow':
        trips = results.get('tomorrow', [])
    elif day_filter == 'upcoming':
        trips = results.get('upcoming', [])
    else:
        trips = results.get('all', [])
    
    cities = get_available_cities()
    agencies = get_available_agencies()
    
    return render_template('search.html', 
                           trips=trips, 
                           results=results,
                           searched=searched,
                           cities=cities,
                           agencies=agencies,
                           origin=origin,
                           destination=destination,
                           date=date,
                           time_filter=time_filter,
                           agency_id=agency_id,
                           day_filter=day_filter)

@bp.route('/api/trips/search')
def api_search_trips():
    """JSON API for AJAX-based trip searching."""
    from app.services.trip_service import get_search_results
    
    origin = request.args.get('origin', '')
    destination = request.args.get('destination', '')
    date = request.args.get('date', '')
    time_filter = request.args.get('time_filter', '')
    agency_id = request.args.get('agency_id', type=int)
    
    SUPPORTED_CITIES = [
        "Yaoundé", "Douala", "Bafoussam", "Bamenda", "Garoua", "Maroua", 
        "Ngaoundéré", "Bertoua", "Ebolowa", "Kribi", "Limbé", "Kumba", 
        "Buea", "Dschang", "Mbouda", "Foumban", "Sangmélima", "Edéa", 
        "Abong-Mbang", "Yagoua", "Meiganga", "Mokolo", "Guider"
    ]
    
    if origin and destination and origin == destination:
        return jsonify({'error': "La ville de départ ne peut pas être la même que la ville d'arrivée."}), 400
    
    if destination and destination not in SUPPORTED_CITIES:
        return jsonify({'error': "Désolé, cette ville n'est pas au Cameroun ou n'est pas supportée."}), 400
    
    search_date = None
    if date:
        try:
            search_date = datetime.strptime(date, '%Y-%m-%d').date()
        except ValueError:
            try:
                search_date = datetime.strptime(date, '%d/%m/%Y').date()
            except ValueError:
                return jsonify({'error': 'Invalid date format'}), 400
    
    results = get_search_results(
        origin=origin, destination=destination,
        search_date=search_date, time_filter=time_filter or None,
        agency_id=agency_id
    )
    
    def trip_to_dict(trip):
        return {
            'id': trip.id,
            'origin': trip.route.origin,
            'destination': trip.route.destination,
            'departure_time': trip.departure_time.strftime('%Y-%m-%dT%H:%M'),
            'departure_date': trip.departure_time.strftime('%d/%m/%Y'),
            'departure_hour': trip.departure_time.strftime('%H:%M'),
            'arrival_time': trip.arrival_time.strftime('%Y-%m-%dT%H:%M'),
            'duration': trip.duration_display,
            'price': trip.price,
            'available_seats': trip.available_seats,
            'booking_status': trip.booking_status,
            'agency': trip.route.agency.name if trip.route.agency else '',
            'bus_info': f"{trip.bus.brand or ''} {trip.bus.model}" if trip.bus else '',
            'bus_number': trip.bus.bus_number if trip.bus else '',
        }
    
    return jsonify({
        'today': [trip_to_dict(t) for t in results['today']],
        'tomorrow': [trip_to_dict(t) for t in results['tomorrow']],
        'upcoming': [trip_to_dict(t) for t in results['upcoming']],
        'total_count': results['total_count']
    })

@bp.route('/api/trips/upcoming')
def api_upcoming_trips():
    """JSON API for homepage trip cards auto-refresh."""
    from app.services.trip_service import get_upcoming_trips
    
    limit = request.args.get('limit', 3, type=int)
    trips = get_upcoming_trips(limit=min(limit, 10))
    
    results = []
    for trip in trips:
        from app.services.trip_service import _today_wat
        today = _today_wat()
        trip_date = trip.departure_time.date()
        if trip_date == today:
            day_label = "Aujourd'hui"
        elif trip_date == today + timedelta(days=1):
            day_label = 'Demain'
        else:
            day_label = trip.departure_time.strftime('%d/%m/%Y')
        
        results.append({
            'id': trip.id,
            'origin': trip.route.origin,
            'destination': trip.route.destination,
            'day_label': day_label,
            'departure_hour': trip.departure_time.strftime('%H:%M'),
            'duration': trip.duration_display,
            'price': trip.price,
            'available_seats': trip.available_seats,
            'agency': trip.route.agency.name if trip.route.agency else '',
            'bus_info': f"{trip.bus.brand or ''} {trip.bus.model}" if trip.bus else '',
            'booking_status': trip.booking_status,
        })
    
    return jsonify(results)

@bp.route('/book/<int:trip_id>', methods=['GET'])
@login_required
def book(trip_id):
    trip = Trip.query.get_or_404(trip_id)
    now = datetime.utcnow()
    
    # A seat is unavailable if it is confirmed or locked (with active timer)
    booked_seats = [
        b.seat_number for b in trip.bookings 
        if b.status == 'confirmed' or (b.status == 'locked' and b.locked_until > now)
    ]
    
    return_trip_id = request.args.get('return_trip_id', type=int)
    return_trip = None
    return_booked_seats = []
    if return_trip_id:
        return_trip = Trip.query.get(return_trip_id)
        if return_trip:
            return_booked_seats = [
                b.seat_number for b in return_trip.bookings 
                if b.status == 'confirmed' or (b.status == 'locked' and b.locked_until > now)
            ]
            
    return render_template('book.html', 
                           trip=trip, 
                           booked_seats=booked_seats,
                           return_trip=return_trip,
                           return_booked_seats=return_booked_seats)

@bp.route('/book/<int:trip_id>/lock', methods=['POST'])
@login_required
def lock_seats(trip_id):
    trip = Trip.query.get_or_404(trip_id)
    seat_numbers = request.form.getlist('seat_numbers')
    return_trip_id = request.form.get('return_trip_id', type=int)
    return_seat_numbers = request.form.getlist('return_seat_numbers')
    passenger_name = request.form.get('passenger_name')
    
    if not seat_numbers:
        flash('Veuillez sélectionner au moins un siège pour le trajet aller.', 'danger')
        return redirect(url_for('main.book', trip_id=trip_id, return_trip_id=return_trip_id))
        
    if len(seat_numbers) > 6 or (return_seat_numbers and len(return_seat_numbers) > 6):
        flash('Vous ne pouvez pas réserver plus de 6 sièges par trajet.', 'danger')
        return redirect(url_for('main.book', trip_id=trip_id, return_trip_id=return_trip_id))

    now = datetime.utcnow()
    locked_until = now + timedelta(minutes=15)
    
    # Verify seat availability (Outbound)
    for seat in seat_numbers:
        existing = Booking.query.filter(
            Booking.trip_id == trip_id,
            Booking.seat_number == seat,
            db.or_(
                Booking.status == 'confirmed',
                db.and_(Booking.status == 'locked', Booking.locked_until > now)
            )
        ).first()
        
        if existing:
            flash(f'Le siège {seat} (Aller) vient d\'être réservé ou verrouillé par un autre utilisateur.', 'danger')
            return redirect(url_for('main.book', trip_id=trip_id, return_trip_id=return_trip_id))

    # Verify seat availability (Return)
    if return_trip_id and return_seat_numbers:
        for seat in return_seat_numbers:
            existing = Booking.query.filter(
                Booking.trip_id == return_trip_id,
                Booking.seat_number == seat,
                db.or_(
                    Booking.status == 'confirmed',
                    db.and_(Booking.status == 'locked', Booking.locked_until > now)
                )
            ).first()
            
            if existing:
                flash(f'Le siège {seat} (Retour) vient d\'être réservé ou verrouillé par un autre utilisateur.', 'danger')
                return redirect(url_for('main.book', trip_id=trip_id, return_trip_id=return_trip_id))

    # Generate a unique booking code per seat to avoid UNIQUE constraint conflicts
    base_code = f"LV-{datetime.now().year}-{random.randint(10000, 99999)}"
    booking_ids = []
    
    # Lock outbound seats
    for seat in seat_numbers:
        booking = Booking(
            user_id=current_user.id,
            trip_id=trip_id,
            seat_number=seat,
            passenger_name=passenger_name or current_user.username,
            status='locked',
            locked_until=locked_until,
            booking_code=f"{base_code}-{seat}",
            price_paid=trip.price,
            payment_status='pending'
        )
        db.session.add(booking)
        db.session.flush() # Get booking ID
        booking_ids.append(str(booking.id))
        
    # Lock return seats
    if return_trip_id and return_seat_numbers:
        return_trip = Trip.query.get(return_trip_id)
        if return_trip:
            for seat in return_seat_numbers:
                booking = Booking(
                    user_id=current_user.id,
                    trip_id=return_trip_id,
                    seat_number=seat,
                    passenger_name=passenger_name or current_user.username,
                    status='locked',
                    locked_until=locked_until,
                    booking_code=f"{base_code}-R-{seat}",
                    price_paid=return_trip.price,
                    payment_status='pending'
                )
                db.session.add(booking)
                db.session.flush() # Get booking ID
                booking_ids.append(str(booking.id))
        
    db.session.commit()
    
    # Redirect to the checkout page with the locked booking IDs
    return redirect(url_for('main.payment', booking_ids=",".join(booking_ids)))

@bp.route('/payment/<booking_ids>', methods=['GET', 'POST'])
@login_required
def payment(booking_ids):
    id_list = [int(x) for x in booking_ids.split(',')]
    bookings = Booking.query.filter(Booking.id.in_(id_list), Booking.user_id == current_user.id).all()
    
    if not bookings:
        flash('Aucune réservation trouvée.', 'danger')
        return redirect(url_for('main.search'))
        
    # Check if locks are still active
    now = datetime.utcnow()
    if any(b.status == 'locked' and b.locked_until < now for b in bookings):
        # Clean expired locks
        for b in bookings:
            if b.status == 'locked':
                db.session.delete(b)
        db.session.commit()
        flash('Le délai de réservation de 15 minutes a expiré. Veuillez sélectionner à nouveau vos sièges.', 'warning')
        return redirect(url_for('main.search'))

    trip = bookings[0].trip
    total_amount = sum((b.price_paid or 0.0) for b in bookings)
    
    # Calculate countdown remaining seconds
    time_left = max(0, int((bookings[0].locked_until - now).total_seconds()))

    if request.method == 'POST':
        payment_method = request.form.get('payment_method')
        phone_number = request.form.get('phone_number')
        card_number = request.form.get('card_number')
        
        # Simulate payment success
        transaction_id = f"TXN-{random.randint(100000, 999999)}"
        
        for booking in bookings:
            booking.status = 'confirmed'
            booking.payment_status = 'paid'
            booking.payment_method = payment_method
            booking.upi_reference = transaction_id
            
            # Create payment record
            payment = Payment(
                booking_id=booking.id,
                amount=booking.price_paid,
                status='completed',
                payment_method=payment_method,
                transaction_id=transaction_id
            )
            db.session.add(payment)
            
        db.session.commit()
        
        # Send Email Notifications and Generate QR Codes
        from app.utils.ticket_generator import generate_pdf_ticket
        from app.services.email_service import send_ticket_confirmation, send_payment_receipt
        from app.models import TicketQRCode
        
        for booking in bookings:
            try:
                # Generate PDF and QR
                pdf_bytes, b64_qr = generate_pdf_ticket(booking)
                
                # Save QR code to DB
                qr_record = TicketQRCode(booking_id=booking.id, qr_data=b64_qr)
                db.session.add(qr_record)
                
                # Dispatch async email
                send_ticket_confirmation(current_user, booking, pdf_bytes)
                
                # Dispatch payment receipt if payment is attached
                payment_record = Payment.query.filter_by(booking_id=booking.id).first()
                if payment_record:
                    send_payment_receipt(current_user, payment_record)
                
            except Exception as e:
                import traceback
                print(f"Error generating ticket or sending email for booking {booking.id}:", e)
                traceback.print_exc()
                
        db.session.commit()
                
        # Redirect to the new success page
        return redirect(url_for('main.booking_success', booking_ids=booking_ids))

    return render_template('booking.html', bookings=bookings, trip=trip, total_amount=total_amount, time_left=time_left)

@bp.route('/booking-success/<booking_ids>')
@login_required
def booking_success(booking_ids):
    id_list = [int(x) for x in booking_ids.split(',')]
    bookings = Booking.query.filter(Booking.id.in_(id_list), Booking.user_id == current_user.id).all()
    
    if not bookings:
        flash('Réservation introuvable.', 'danger')
        return redirect(url_for('main.my_bookings'))
        
    trip = bookings[0].trip
    return render_template('booking_success.html', bookings=bookings, trip=trip)

@bp.route('/my-bookings')
@login_required
def my_bookings():
    if current_user.role != 'client':
        if current_user.role == 'teller':
            return redirect(url_for('admin.teller_dashboard'))
        elif current_user.role in ['super_admin', 'admin_agence']:
            return redirect(url_for('admin.dashboard'))
        else:
            flash("Accès réservé aux clients.", "danger")
            return redirect(url_for('main.index'))

    now = datetime.now()
    today_start = datetime.combine(now.date(), datetime.min.time())
    
    # Unified bookings logic: Fetch ALL bookings (upcoming, past, cancelled) where payment was confirmed
    bookings = Booking.query.join(Trip).filter(
        Booking.user_id == current_user.id,
        Booking.user_deleted == False,
        Booking.payment_status == 'paid'
    ).order_by(Booking.booking_date.desc().nulls_last()).all()
    
    # Still providing confirmed for stats
    confirmed = [b for b in bookings if b.status == 'confirmed']
    total_tickets = len(confirmed)
    
    parcels = Parcel.query.filter(
        Parcel.user_id == current_user.id,
        Parcel.payment_status == 'paid'
    ).order_by(Parcel.created_at.desc()).all()
    
    total_spent = sum((b.price_paid or 0) for b in confirmed) + sum((p.price or 0) for p in parcels)
    average_fare = (total_spent / total_tickets) if total_tickets > 0 else 0
    
    return render_template('my_bookings.html', 
                           bookings=bookings, 
                           confirmed=confirmed,
                           total_spent=total_spent, 
                           total_tickets=total_tickets, 
                           average_fare=average_fare, 
                           parcels=parcels)

@bp.route('/api/booking/<int:booking_id>/update_info', methods=['POST'])
@login_required
def update_booking_info(booking_id):
    booking = Booking.query.get_or_404(booking_id)
    if booking.user_id != current_user.id:
        return jsonify({'success': False, 'message': 'Unauthorized'}), 403
        
    data = request.json
    if not data:
        return jsonify({'success': False, 'message': 'Données invalides'}), 400
        
    new_name = data.get('passenger_name')
    new_phone = data.get('phone')
    new_emergency = data.get('emergency_contact')
    
    if new_name:
        booking.passenger_name = new_name
        
    if current_user.id == booking.user_id:
        if new_phone:
            current_user.phone = new_phone
        if new_emergency:
            current_user.emergency_contact_phone = new_emergency
            
    # Add SystemNotification
    new_notif = SystemNotification(
        title="Mise à jour Réussie",
        message=f"Vos informations pour le contrat VIP {booking.booking_code or booking.id} ont été mises à jour avec succès.",
        type="success",
        category="passenger",
        user_id=current_user.id
    )
    db.session.add(new_notif)
    db.session.commit()
    
    return jsonify({
        'success': True,
        'message': 'Informations passager mises à jour avec succès.',
        'new_name': booking.passenger_name
    })

@bp.route('/api/modify_booking/<int:booking_id>', methods=['POST'])
@login_required
def modify_booking_logic(booking_id):
    booking = Booking.query.get_or_404(booking_id)
    if booking.user_id != current_user.id:
        return jsonify({'success': False, 'error': 'Unauthorized'}), 403
        
    data = request.json
    if not data:
        return jsonify({'success': False, 'error': 'Données invalides'}), 400
        
    new_name = data.get('passenger_name')
    new_phone = data.get('phone')
    new_emergency = data.get('emergency_contact')
    new_trip_id = data.get('trip_id')
    new_seat = data.get('seat_number')
    
    if not new_trip_id or not new_seat:
        return jsonify({'success': False, 'error': 'Le trajet et le siège sont obligatoires.'}), 400
        
    try:
        new_trip_id = int(new_trip_id)
    except ValueError:
        return jsonify({'success': False, 'error': 'ID de trajet invalide.'}), 400
        
    new_trip = Trip.query.get(new_trip_id)
    if not new_trip:
        return jsonify({'success': False, 'error': 'Trajet introuvable.'}), 404
        
    # Check if seat is available on the new trip (unless it's the same trip and same seat)
    if not (booking.trip_id == new_trip_id and booking.seat_number == new_seat):
        existing_booking = Booking.query.filter_by(trip_id=new_trip_id, seat_number=new_seat, status='confirmed').first()
        if existing_booking:
            return jsonify({'success': False, 'error': 'Le siège sélectionné est déjà pris.'}), 400
            
        # Update occupied seats logic
        # Free old seat
        if booking.trip.occupied_seats > 0:
            booking.trip.occupied_seats -= 1
            
        # Occupy new seat
        new_trip.occupied_seats += 1

    # Update booking details
    booking.trip_id = new_trip_id
    booking.seat_number = new_seat
    
    if new_name:
        booking.passenger_name = new_name
    if new_phone:
        current_user.phone = new_phone
    if new_emergency:
        current_user.emergency_contact_phone = new_emergency
        
    # Add SystemNotification
    new_notif = SystemNotification(
        title="Modification Réussie",
        message=f"Votre réservation {booking.booking_code or booking.id} a été modifiée avec succès. Vous voyagez désormais le {new_trip.departure_time.strftime('%d/%m/%Y à %H:%M')}.",
        type="success",
        category="passenger",
        user_id=current_user.id
    )
    db.session.add(new_notif)
    db.session.commit()
    
    return jsonify({
        'success': True,
        'message': 'Réservation modifiée avec succès.'
    })

@bp.route('/api/qr/<booking_code>')
@login_required
def generate_qr(booking_code):
    # Verify booking belongs to user or user is admin
    booking = Booking.query.filter_by(booking_code=booking_code).first_or_404()
    if current_user.role == 'client' and booking.user_id != current_user.id:
        return jsonify({'error': 'Unauthorized'}), 403
        
    qr = qrcode.QRCode(
        version=1,
        error_correction=qrcode.constants.ERROR_CORRECT_L,
        box_size=10,
        border=4,
    )
    # Generate secure verification URL
    from itsdangerous import URLSafeSerializer
    from flask import current_app, url_for
    serializer = URLSafeSerializer(current_app.config['SECRET_KEY'], salt='booking-qr')
    token = serializer.dumps(booking_code)
    
    # We want a full URL like https://3mservice.shop/verify/<token>
    verification_url = url_for('main.verify_ticket', token=token, _external=True)
    
    qr.add_data(verification_url)
    qr.make(fit=True)

    img = qr.make_image(fill_color="black", back_color="white")
    
    img_io = BytesIO()
    img.save(img_io, 'PNG')
    img_io.seek(0)
    
    return send_file(img_io, mimetype='image/png')

@bp.route('/generate_parcel_qr/<tracking_number>')
@login_required
def generate_parcel_qr(tracking_number):
    from app.models import Parcel
    parcel = Parcel.query.filter_by(tracking_number=tracking_number).first_or_404()
    
    qr = qrcode.QRCode(
        version=1,
        error_correction=qrcode.constants.ERROR_CORRECT_L,
        box_size=10,
        border=4,
    )
    
    # Generate secure verification URL
    from itsdangerous import URLSafeSerializer
    from flask import current_app, url_for
    serializer = URLSafeSerializer(current_app.config['SECRET_KEY'], salt='parcel-qr')
    token = serializer.dumps(tracking_number)
    
    verification_url = url_for('main.verify_ticket', token=token, _external=True)
    
    qr.add_data(verification_url)
    qr.make(fit=True)

    img = qr.make_image(fill_color="black", back_color="white")
    
    img_io = BytesIO()
    img.save(img_io, 'PNG')
    img_io.seek(0)
    
    return send_file(img_io, mimetype='image/png')

@bp.route('/api/trip/<int:trip_id>/seats')
def trip_seats(trip_id):
    trip = Trip.query.get_or_404(trip_id)
    now = datetime.utcnow()
    bookings = Booking.query.filter(
        Booking.trip_id == trip.id,
        db.or_(
            Booking.status == 'confirmed',
            db.and_(Booking.status == 'locked', Booking.locked_until > now)
        )
    ).all()
    
    booked_seats = []
    for b in bookings:
        if b.seat_number and b.seat_number != 'AUTO':
            # handle cases where multiple seats are booked under one booking, e.g. "1A, 1B"
            seats = [s.strip() for s in b.seat_number.split(',')]
            booked_seats.extend(seats)
            
    return jsonify({
        'capacity': trip.capacity,
        'booked_seats': booked_seats
    })

@bp.route('/about')
def about():
    from app.models import Route, Booking, Bus, User
    from app import db
    try:
        # Destinations count (unique cities from Route.origin and Route.destination)
        origins = db.session.query(Route.origin).distinct().all()
        destinations = db.session.query(Route.destination).distinct().all()
        unique_cities = set([o[0] for o in origins if o[0]] + [d[0] for d in destinations if d[0]])
        destinations_count = len(unique_cities)
        if destinations_count < 10:
            # Fallback to realistic/hardcoded dests if db is small
            destinations_count = 50
        
        # Clients/Users accompanied (clients count + bookings count)
        clients_count = db.session.query(User).filter_by(role='client').count()
        bookings_count = db.session.query(Booking).count()
        clients_accompanied = clients_count + bookings_count
        if clients_accompanied < 100:
            clients_accompanied = 10000
            
        # Partner Vehicles (Bus count)
        vehicles_count = db.session.query(Bus).count()
        partner_vehicles = vehicles_count
        if partner_vehicles < 5:
            partner_vehicles = 30
    except Exception as e:
        import logging
        logging.getLogger(__name__).error(f"Error fetching about stats: {e}")
        destinations_count = 50
        clients_accompanied = 10000
        partner_vehicles = 30

    return render_template('about.html',
                           destinations_count=destinations_count,
                           clients_accompanied=clients_accompanied,
                           partner_vehicles=partner_vehicles)

@bp.route('/contact')
def contact():
    return render_template('contact.html')

@bp.route('/contact_submit', methods=['POST'])
def contact_submit():
    from app.models import ContactMessage, SystemNotification
    from app import db
    
    name = request.form.get('name')
    email = request.form.get('email')
    message_text = request.form.get('message')
    
    if not name or not email or not message_text:
        flash("Veuillez remplir tous les champs obligatoires.", "danger")
        return redirect(url_for('main.contact'))
        
    try:
        # Save to database
        new_msg = ContactMessage(name=name, email=email, message=message_text)
        db.session.add(new_msg)
        
        # Create an admin notification
        notif = SystemNotification(
            title="Nouveau Message",
            message=f"Nouveau message de contact reçu de {name}",
            type="info",
            role_target="super_admin"
        )
        db.session.add(notif)
        db.session.commit()
        
        flash("Votre message a été envoyé avec succès ! Notre équipe vous contactera sous peu.", "success")
    except Exception as e:
        db.session.rollback()
        import logging
        logging.error(f"Error saving contact message: {e}")
        flash("Une erreur s'est produite. Veuillez réessayer.", "danger")
        
    return redirect(url_for('main.contact'))

@bp.route('/terms')
def terms():
    return render_template('terms.html')

@bp.route('/privacy-policy')
def privacy_policy():
    return render_template('privacy_policy.html')

@bp.route('/submit_feedback', methods=['POST'])
def submit_feedback():
    feedback_text = request.form.get('feedback')
    rating = int(request.form.get('rating', 5))
    comfort = int(request.form.get('comfort', 5))
    punctuality = int(request.form.get('punctuality', 5))
    
    if feedback_text:
        feedback = Feedback(
            message=feedback_text,
            rating=rating,
            comfort_rating=comfort,
            punctuality_rating=punctuality
        )
        db.session.add(feedback)
        db.session.commit()
        flash("Merci pour votre avis !", "success")
    return redirect(request.referrer or url_for('main.index'))

@bp.route('/api/search_buses')
def api_search_buses():
    origin = request.args.get('origin', '')
    destination = request.args.get('destination', '')
    date = request.args.get('date', '')

    buses = []
    if origin and destination and date:
        try:
            search_date = datetime.strptime(date, '%Y-%m-%d')
            trips = Trip.query.join(Route).filter(
                Route.origin.ilike(f'%{origin}%'),
                Route.destination.ilike(f'%{destination}%'),
                db.func.date(Trip.departure_time) == search_date.date(),
                Trip.status == 'scheduled'
            ).all()

            now = datetime.utcnow()
            for trip in trips:
                active_bookings = Booking.query.filter(
                    Booking.trip_id == trip.id,
                    db.or_(
                        Booking.status == 'confirmed',
                        db.and_(Booking.status == 'locked', Booking.locked_until > now)
                    )
                ).count()

                available_seats = trip.bus.capacity - active_bookings
                buses.append({
                    'id': trip.id,
                    'bus_name': f"{trip.bus.brand} {trip.bus.model} ({trip.route.agency.name})",
                    'departure_time': trip.departure_time.strftime('%H:%M'),
                    'arrival_time': trip.arrival_time.strftime('%H:%M'),
                    'duration': trip.route.duration,
                    'fare': trip.price,
                    'available_seats': available_seats
                })
        except ValueError:
            return jsonify({'buses': [], 'error': 'invalid_date'})
        except Exception as e:
            import logging
            logging.getLogger(__name__).error(f'[api_search_buses] Error: {e}')
            return jsonify({'buses': [], 'error': 'server_error'})

    return jsonify({'buses': buses})

@bp.route('/ticket/<int:booking_id>/pdf')
@login_required
def ticket_pdf(booking_id):
    booking = Booking.query.get_or_404(booking_id)
    
    # Optional Authorization Check: Super/Agency Admins can view any, Teller can view any, Client can only view their own
    if current_user.role == 'client' and booking.user_id != current_user.id:
        flash("Accès refusé. Ce contrat de location ne vous appartient pas.", "danger")
        return redirect(url_for('main.my_bookings'))
        
    from app.utils.ticket_generator import generate_pdf_ticket
    
    try:
        pdf_bytes, b64_str = generate_pdf_ticket(booking)
    except Exception as e:
        import traceback
        traceback.print_exc()
        flash("Erreur lors de la génération du contrat PDF.", "danger")
        return redirect(url_for('main.my_bookings'))
    
    response = make_response(pdf_bytes)
    response.headers['Content-Type'] = 'application/pdf'
    response.headers['Content-Disposition'] = f'inline; filename=contrat_location_{booking.booking_code or booking.id}.pdf'
    return response

@bp.route('/cancel-booking/<int:booking_id>', methods=['POST'])
@login_required
def cancel_booking(booking_id):
    booking = Booking.query.get_or_404(booking_id)
    trip = booking.trip
    
    if booking.user_id != current_user.id:
        flash('Vous n\'êtes pas autorisé à annuler cette réservation.', 'danger')
        return redirect(url_for('main.my_bookings'))
        
    if booking.status == 'cancelled':
        flash('Cette réservation est déjà annulée.', 'info')
        return redirect(url_for('main.my_bookings'))

    now = datetime.now()
    time_diff = trip.departure_time - now
    hours_diff = time_diff.total_seconds() / 3600.0
    
    # Calculate refund percentage based on 3M SERVICES Standard Policy
    if hours_diff > 48:
        refund_rate = 0.90 # 90% refund
    elif hours_diff >= 24:
        refund_rate = 0.50 # 50% refund
    else:
        refund_rate = 0.00 # 0% refund
        
    refund_amount = (booking.price_paid or 0.0) * refund_rate
    
    booking.status = 'cancelled'
    booking.payment_status = 'refunded' if refund_rate > 0 else 'no_refund'
    booking.refund_amount = refund_amount
    db.session.commit()
    
    if refund_rate > 0:
        flash(f'Réservation annulée avec succès. Un remboursement de {refund_amount:.0f} FCFA ({refund_rate*100:.0f}%) a été traité.', 'success')
    else:
        flash('Réservation annulée. Aucun remboursement possible à moins de 24h du départ.', 'warning')
        
    return redirect(url_for('main.my_bookings'))

@bp.route('/delete-booking/<int:booking_id>', methods=['POST'])
@login_required
def delete_booking(booking_id):
    booking = Booking.query.get_or_404(booking_id)
    if booking.user_id != current_user.id:
        flash('Vous n\'êtes pas autorisé à faire cela.', 'danger')
        return redirect(url_for('main.my_bookings'))
    if booking.status != 'cancelled':
        flash('Seules les réservations annulées peuvent être supprimées de l\'historique.', 'warning')
        return redirect(url_for('main.my_bookings'))
        
    booking.user_deleted = True
    db.session.commit()
    flash('Réservation masquée de votre historique.', 'success')
    return redirect(url_for('main.my_bookings'))

@bp.route('/clear-history', methods=['POST'])
@login_required
def clear_history():
    Booking.query.filter_by(user_id=current_user.id).update({'user_deleted': True}, synchronize_session=False)
    db.session.commit()
    flash('Votre historique de voyages a été effacé.', 'success')
    return redirect(url_for('main.my_bookings'))

@bp.route('/verify/<token>')
def verify_ticket(token):
    from itsdangerous import URLSafeSerializer, BadSignature
    from flask import current_app, render_template
    from app.models import Booking, Parcel
    
    # Check if it's a booking token
    serializer_booking = URLSafeSerializer(current_app.config['SECRET_KEY'], salt='booking-qr')
    try:
        booking_code = serializer_booking.loads(token)
        booking = Booking.query.filter_by(booking_code=booking_code).first()
        if booking:
            return render_template('verify.html', ticket_type='booking', data=booking)
    except BadSignature:
        pass
        
    # Check if it's a parcel token
    serializer_parcel = URLSafeSerializer(current_app.config['SECRET_KEY'], salt='parcel-qr')
    try:
        tracking_number = serializer_parcel.loads(token)
        parcel = Parcel.query.filter_by(tracking_number=tracking_number).first()
        if parcel:
            return render_template('verify.html', ticket_type='parcel', data=parcel)
    except BadSignature:
        pass
        
    return render_template('verify.html', ticket_type=None, data=None)

@bp.route('/api/verify_ticket', methods=['POST'])
def api_verify_ticket():
    name = request.form.get('name')
    email = request.form.get('email')
    message = request.form.get('message')
    admin_email = 'contact@3mservice.shop'

    subject = f'Nouveau message de contact de {name}'
    body = f"""
    Nom: {name}
    Email: {email}
    Message:
    {message}
    """

    mail = current_app.extensions.get('mail')
    if mail:
        try:
            msg = Message(subject, sender=current_app.config.get('MAIL_USERNAME'), recipients=[admin_email])
            msg.body = body
            mail.send(msg)
            flash('Votre message a été envoyé à l\'administration avec succès !', 'success')
        except Exception as e:
            db.session.rollback()
            print('Error sending contact email:', e)
            flash('Message enregistré localement. Merci de nous avoir contacté !', 'success')
    else:
        flash('Message enregistré. Merci de nous avoir contacté !', 'success')
        
    return redirect(url_for('main.contact'))

@bp.route('/api/notifications', methods=['GET'])
@login_required
def get_notifications():
    try:
        from app import db
        from app.models import NotificationRead
        
        # Fetch IDs into a Python list to avoid SQLAlchemy subquery compilation issues on Postgres
        dismissed_records = NotificationRead.query.filter_by(user_id=current_user.id).all()
        dismissed_ids = [r.notification_id for r in dismissed_records]
        
        base_query = SystemNotification.query.filter_by(is_deleted=False)
        if dismissed_ids:
            base_query = base_query.filter(SystemNotification.id.notin_(dismissed_ids))
            
        if current_user.role == 'super_admin':
            # Super admin sees: notifications explicitly for super_admin OR targeted at their user_id
            # They also see global notifications (role_target=None) for ALL agencies
            query = base_query.filter(
                db.or_(
                    SystemNotification.role_target == 'super_admin',
                    SystemNotification.role_target == None,
                    SystemNotification.user_id == current_user.id
                )
            )
        elif current_user.role == 'client':
            # Clients only see notifications targeted at their user_id
            query = base_query.filter(SystemNotification.user_id == current_user.id)
        else:
            # Agency staff (admin_agence, teller, finance_officer, manager, etc.)
            # See notifications for their role (or global None) AND their agency (or global None)
            query = base_query.filter(
                db.or_(
                    db.and_(
                        db.or_(SystemNotification.role_target == current_user.role, SystemNotification.role_target == None),
                        db.or_(SystemNotification.agency_id == current_user.agency_id, SystemNotification.agency_id == None)
                    ),
                    SystemNotification.user_id == current_user.id
                )
            )
            
        unread_count = query.count()
        notifications = query.order_by(SystemNotification.created_at.desc()).limit(10).all()
        
        return jsonify({
            'success': True,
            'notifications': [{
                'id': n.id,
                'title': n.title,
                'message': n.message,
                'type': n.type,
                'created_at': n.created_at.strftime('%Y-%m-%d %H:%M') if n.created_at else ''
            } for n in notifications],
            'unread_count': unread_count
        })
    except Exception as e:
        db.session.rollback()
        print(f"Notification Error: {e}")
        return jsonify({
            'success': False,
            'notifications': [],
            'unread_count': 0
        })

@bp.route('/api/notifications/<int:notification_id>/read', methods=['POST'])
@login_required
def mark_notification_read(notification_id):
    from app.models import NotificationRead
    notification = SystemNotification.query.get_or_404(notification_id)
    
    # If this notification is scoped to a specific user, only that user can mark it read
    if notification.user_id and notification.user_id != current_user.id:
        return jsonify({'success': False}), 403
    
    # For shared/role-targeted notifications, create a per-user dismissal record
    # This allows super_admin to still see the notification even after admin_agence dismisses it
    existing = NotificationRead.query.filter_by(
        notification_id=notification_id, user_id=current_user.id
    ).first()
    if not existing:
        record = NotificationRead(notification_id=notification_id, user_id=current_user.id)
        db.session.add(record)
        
        # Only mark global is_read=True if the dismisser is super_admin
        # (so their own bell counter drops; other roles use the NotificationRead table)
        if current_user.role == 'super_admin' and not notification.user_id:
            notification.is_read = True
        elif notification.user_id == current_user.id:
            notification.is_read = True
            
        db.session.commit()
    return jsonify({'success': True})

@bp.route('/favicon.ico')
def favicon():
    from flask import current_app, send_from_directory
    import os
    return send_from_directory(os.path.join(current_app.root_path, 'static'),
                               'logorv.png', mimetype='image/png')

# In-memory store for live bus tracking locations
TRIP_LOCATIONS = {}

@bp.route('/api/ticket/verify', methods=['POST'])
@login_required
def api_ticket_verify():
    booking_code = request.json.get('booking_code')
    action = request.json.get('action') # 'check-in' or 'board'
    
    if not booking_code:
        return jsonify({'success': False, 'message': 'Code de réservation manquant.'}), 400
        
    # Search for booking
    booking = Booking.query.filter(
        db.or_(Booking.booking_code == booking_code, Booking.id == booking_code)
    ).first()
    
    if not booking:
        return jsonify({'success': False, 'message': 'Billet introuvable.'}), 444
        
    if action in ['check-in', 'board']:
        booking.boarding_status = 'checked-in' if action == 'check-in' else 'boarded'
        db.session.commit()
        
    return jsonify({
        'success': True,
        'booking_id': booking.id,
        'booking_code': booking.booking_code,
        'passenger_name': booking.passenger_name or booking.user.real_name,
        'phone': booking.user.phone,
        'origin': booking.trip.route.origin,
        'destination': booking.trip.route.destination,
        'departure_time': booking.trip.departure_time.strftime('%d/%m/%Y %H:%M'),
        'seat_number': booking.seat_number,
        'payment_status': booking.payment_status,
        'boarding_status': booking.boarding_status,
        'price': booking.price_paid
    })

@bp.route('/api/trip/<int:trip_id>/location', methods=['GET', 'POST'])
def trip_location(trip_id):
    if request.method == 'POST':
        lat = request.json.get('latitude')
        lon = request.json.get('longitude')
        if lat is not None and lon is not None:
            TRIP_LOCATIONS[trip_id] = {
                'latitude': float(lat),
                'longitude': float(lon),
                'updated_at': datetime.utcnow().isoformat()
            }
            return jsonify({'success': True})
        return jsonify({'success': False, 'message': 'Coordinates missing'}), 400
        
    # GET method
    loc = TRIP_LOCATIONS.get(trip_id)
    if not loc:
        # Fallback static coordinates if not updated yet (Douala-Yaounde midway)
        return jsonify({
            'latitude': 3.95,
            'longitude': 10.6,
            'updated_at': datetime.utcnow().isoformat()
        })
    return jsonify(loc)

@bp.route('/api/agencies/nearest', methods=['GET'])
def get_nearest_agencies():
    user_lat = request.args.get('lat')
    user_lon = request.args.get('lon')
    
    if not user_lat or not user_lon:
        return jsonify({'success': False, 'message': 'User coordinates required'}), 400
        
    user_lat = float(user_lat)
    user_lon = float(user_lon)
    
    # Define static coordinates for Cameroon agencies
    agencies_coords = {
        'Douala': {'lat': 4.0511, 'lon': 9.7679, 'address': 'Terminal Bessengue'},
        'Yaoundé': {'lat': 3.8480, 'lon': 11.5021, 'address': 'Terminal Mvan'},
        'Bafoussam': {'lat': 5.4778, 'lon': 10.4178, 'address': 'Guichet Marché A'},
        'Kribi': {'lat': 2.9506, 'lon': 9.9075, 'address': 'Guichet Boulevard du Rocher'}
    }
    
    import math
    def haversine(lat1, lon1, lat2, lon2):
        # distance in km
        radius = 6371
        d_lat = math.radians(lat2 - lat1)
        d_lon = math.radians(lon2 - lon1)
        a = (math.sin(d_lat / 2) * math.sin(d_lat / 2) +
             math.cos(math.radians(lat1)) * math.cos(math.radians(lat2)) *
             math.sin(d_lon / 2) * math.sin(d_lon / 2))
        c = 2 * math.atan2(math.sqrt(a), math.sqrt(1 - a))
        return radius * c
        
    # Fetch all agencies from DB and sort
    agencies = Agency.query.filter_by(is_deleted=False).all()
    results = []
    
    for ag in agencies:
        coords = agencies_coords.get(ag.city, {'lat': 3.8480, 'lon': 11.5021, 'address': ag.address or 'Agence 3M SERVICES'})
        dist = haversine(user_lat, user_lon, coords['lat'], coords['lon'])
        results.append({
            'id': ag.id,
            'name': ag.name,
            'city': ag.city,
            'address': coords['address'],
            'phone': ag.phone,
            'distance': round(dist, 1),
            'latitude': coords['lat'],
            'longitude': coords['lon']
        })
        
    results.sort(key=lambda x: x['distance'])
    return jsonify({'success': True, 'agencies': results})


def save_base64_image(base64_str, folder, filename):
    if not base64_str:
        return None
    try:
        import base64
        # Check format: "data:image/jpeg;base64,..."
        if ',' in base64_str:
            base64_str = base64_str.split(',')[1]
        img_data = base64.b64decode(base64_str)
        
        # Ensure target folder exists
        os.makedirs(folder, exist_ok=True)
        
        filepath = os.path.join(folder, filename)
        with open(filepath, 'wb') as f:
            f.write(img_data)
        return filename
    except Exception as e:
        db.session.rollback()
        print(f"Error saving base64 image: {e}")
        return None


@bp.route('/book_parcel/<int:trip_id>', methods=['GET', 'POST'])
@login_required
def book_parcel(trip_id):
    trip = Trip.query.get_or_404(trip_id)
    
    # Defensive check: trip must have a valid route and agency
    if not trip.route or not trip.route.agency_id:
        flash("Ce trajet n'est pas disponible pour l'envoi de colis. Veuillez en choisir un autre.", "warning")
        return redirect(url_for('main.search'))
    
    if request.method == 'POST':
        try:
            import uuid
            
            sender_name = request.form.get('sender_name')
            sender_phone = request.form.get('sender_phone')
            sender_email = request.form.get('sender_email')
            
            receiver_name = request.form.get('receiver_name')
            receiver_phone = request.form.get('formatted_receiver_phone')
            receiver_city = request.form.get('receiver_city')
            receiver_address = request.form.get('receiver_address')
            
            parcel_type = request.form.get('parcel_type')
            description = request.form.get('description')
            weight = float(request.form.get('weight', 1.0))
            num_items = int(request.form.get('num_items', 1))
            is_fragile = request.form.get('is_fragile') == 'true'
            has_insurance = request.form.get('has_insurance') == 'true'
            
            # Handle images
            front_b64 = request.form.get('front_image_base64')
            side_b64 = request.form.get('side_image_base64')
            label_b64 = request.form.get('label_image_base64')
            
            uploads_dir = os.path.join(current_app.root_path, 'static', 'uploads', 'parcels')
            
            front_filename = f"front_{uuid.uuid4().hex}.jpg"
            side_filename = f"side_{uuid.uuid4().hex}.jpg"
            label_filename = f"label_{uuid.uuid4().hex}.jpg" if label_b64 else None
            
            front_image = save_base64_image(front_b64, uploads_dir, front_filename)
            side_image = save_base64_image(side_b64, uploads_dir, side_filename)
            label_image = save_base64_image(label_b64, uploads_dir, label_filename) if label_b64 else None
            
            # Calculate price (base 1000 FCFA/kg, min 1000, insurance 1500)
            base_price = max(1000, round(weight * 1000))
            insurance_fee = 1500 if has_insurance else 0
            price = base_price + insurance_fee
            
            # Generate tracking number: LV-PARCEL-YYYY-RANDOM
            import random
            
            # Prevent backend double-submission (same parcel in last 5 minutes)
            from datetime import timedelta
            recent_duplicate = Parcel.query.filter_by(
                user_id=current_user.id,
                trip_id=trip.id,
                sender_name=sender_name,
                receiver_name=receiver_name,
                parcel_type=parcel_type
            ).filter(Parcel.created_at >= datetime.utcnow() - timedelta(minutes=5)).first()

            if recent_duplicate:
                return redirect(url_for('main.payment_parcel', parcel_id=recent_duplicate.id))

            tracking_number = f"LV-PARCEL-{datetime.now().year}-{random.randint(10000, 99999)}"
            
            parcel = Parcel(
                agency_id=trip.route.agency_id,
                user_id=current_user.id,
                trip_id=trip.id,
                sender_name=sender_name,
                sender_phone=sender_phone,
                sender_email=sender_email,
                receiver_name=receiver_name,
                receiver_phone=receiver_phone,
                receiver_city=receiver_city,
                receiver_address=receiver_address,
                parcel_type=parcel_type,
                description=description,
                weight=weight,
                num_items=num_items,
                is_fragile=is_fragile,
                has_insurance=has_insurance,
                front_image=front_image,
                side_image=side_image,
                label_image=label_image,
                price=price,
                status='pending',
                payment_status='pending',
                tracking_number=tracking_number
            )
            
            db.session.add(parcel)
            db.session.commit()
            
            return redirect(url_for('main.payment_parcel', parcel_id=parcel.id))
        
        except Exception as e:
            db.session.rollback()
            import traceback
            traceback.print_exc()
            flash(f"Une erreur est survenue lors de l'enregistrement du colis. Veuillez réessayer.", "danger")
            return render_template('book_parcel.html', trip=trip)
        
    return render_template('book_parcel.html', trip=trip)


@bp.route('/payment/parcel/<int:parcel_id>', methods=['GET', 'POST'])
@login_required
def payment_parcel(parcel_id):
    from flask import abort
    parcel = Parcel.query.get_or_404(parcel_id)
    if parcel.user_id != current_user.id:
        abort(403)
        
    if request.method == 'POST':
        payment_method = request.form.get('payment_method')
        
        # Update parcel status to ASSIGNED TO TRIP
        parcel.payment_status = 'paid'
        parcel.status = 'assigned'  # assigned represents "assigned to trip"
        parcel.payment_method = payment_method
        
        db.session.commit()
        
        # Add a system notification or welcome alert
        notification = SystemNotification(
            user_id=current_user.id,
            title="Colis Enregistré",
            message=f"Votre colis #{parcel.tracking_number} a été enregistré avec succès et assigné au trajet.",
            category="parcel"
        )
        db.session.add(notification)
        db.session.commit()
        
        # Send Email Notifications asynchronously
        from app.services.email_service import send_parcel_registered, send_payment_receipt
        send_parcel_registered(current_user, parcel)
        
        # We don't have a specific payment record for parcel in the snippet but if we did, we'd send it.
        # Since it's paid, we can create a dummy object to match the payment interface for receipt:
        class DummyPayment:
            def __init__(self, amount, transaction_id, method):
                self.amount = amount
                self.transaction_id = transaction_id
                self.payment_method = method
                self.id = transaction_id
        
        dummy_payment = DummyPayment(parcel.price, "TXN-PARCEL-" + str(parcel.id), payment_method)
        send_payment_receipt(current_user, dummy_payment)
        
        return redirect(url_for('main.parcel_success', parcel_id=parcel.id))
        
    return render_template('payment_parcel.html', parcel=parcel)


@bp.route('/parcel-success/<int:parcel_id>', methods=['GET'])
@login_required
def parcel_success(parcel_id):
    from flask import abort
    parcel = Parcel.query.get_or_404(parcel_id)
    if parcel.user_id != current_user.id:
        abort(403)
    return render_template('parcel_success.html', parcel=parcel)


@bp.route('/parcel/<int:parcel_id>/pdf')
@login_required
def parcel_pdf(parcel_id):
    from flask import abort, flash, make_response
    parcel = Parcel.query.get_or_404(parcel_id)
    
    if current_user.role == 'client' and parcel.user_id != current_user.id:
        flash("Accès refusé. Ce bordereau ne vous appartient pas.", "danger")
        return redirect(url_for('main.my_bookings'))
        
    from app.utils.ticket_generator import generate_pdf_parcel
    
    try:
        pdf_bytes, b64_str = generate_pdf_parcel(parcel)
    except Exception as e:
        import traceback
        traceback.print_exc()
        flash("Erreur lors de la génération du PDF.", "danger")
        return redirect(url_for('main.my_bookings'))
    
    response = make_response(pdf_bytes)
    response.headers['Content-Type'] = 'application/pdf'
    response.headers['Content-Disposition'] = f'inline; filename=colis_{parcel.tracking_number}.pdf'
    return response




@bp.route('/api/notifications/read-all', methods=['POST'])
@login_required
def mark_all_notifications_read():
    from app.models import NotificationRead
    
    dismissed_records = NotificationRead.query.filter_by(user_id=current_user.id).all()
    dismissed_ids = [r.notification_id for r in dismissed_records]
    
    base_query = SystemNotification.query.filter_by(is_deleted=False)
    if dismissed_ids:
        base_query = base_query.filter(SystemNotification.id.notin_(dismissed_ids))
        
    if current_user.role == 'super_admin':
        query = base_query.filter(
            db.or_(
                SystemNotification.role_target == 'super_admin',
                SystemNotification.role_target == None,
                SystemNotification.user_id == current_user.id
            )
        )
    elif current_user.role == 'client':
        query = base_query.filter(SystemNotification.user_id == current_user.id)
    else:
        query = base_query.filter(
            db.or_(
                db.and_(
                    db.or_(SystemNotification.role_target == current_user.role, SystemNotification.role_target == None),
                    db.or_(SystemNotification.agency_id == current_user.agency_id, SystemNotification.agency_id == None)
                ),
                SystemNotification.user_id == current_user.id
            )
        )
        
    for notification in query.all():
        record = NotificationRead(notification_id=notification.id, user_id=current_user.id)
        db.session.add(record)
        
        if current_user.role == 'super_admin' and not notification.user_id:
            notification.is_read = True

    db.session.commit()
    return jsonify({'success': True})

@bp.route('/api/db-upgrade')
def run_db_upgrade():
    import subprocess
    try:
        result = subprocess.run(['flask', 'db', 'upgrade'], capture_output=True, text=True, check=True)
        return f"STDOUT:\n{result.stdout}\n\nSTDERR:\n{result.stderr}", 200, {'Content-Type': 'text/plain'}
    except subprocess.CalledProcessError as e:
        return f"FAILED with {e.returncode}\n\nSTDOUT:\n{e.stdout}\n\nSTDERR:\n{e.stderr}", 500, {'Content-Type': 'text/plain'}
