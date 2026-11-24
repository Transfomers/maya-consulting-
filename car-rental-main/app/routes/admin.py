import os
import json
import random
from flask import Blueprint, render_template, redirect, url_for, flash, request, jsonify, current_app, session
from werkzeug.security import generate_password_hash
from flask_login import login_required, current_user
from app.models import User, Agency, Bus, Route, Trip, Booking, Payment, Feedback, AuditLog, SystemNotification, Driver, CaisseSession, Parcel, TripSchedule, Apartment
from app import db
from datetime import datetime, date, timedelta
from sqlalchemy import func, or_

admin = Blueprint('admin', __name__)

# === SECURITY & RBAC DECORATORS ===

def admin_required(f):
    def decorated_function(*args, **kwargs):
        if not current_user.is_authenticated or current_user.role not in ['super_admin', 'admin_agence']:
            flash('Vous n\'avez pas la permission d\'accéder à cette page.', 'danger')
            return redirect(url_for('main.index'))
        return f(*args, **kwargs)
    decorated_function.__name__ = f.__name__
    return decorated_function

def teller_required(f):
    def decorated_function(*args, **kwargs):
        if not current_user.is_authenticated or current_user.role not in ['super_admin', 'admin_agence', 'teller']:
            flash('Vous n\'avez pas la permission d\'accéder à cette page.', 'danger')
            return redirect(url_for('main.index'))
        return f(*args, **kwargs)
    decorated_function.__name__ = f.__name__
    return decorated_function

def super_admin_required(f):
    def decorated_function(*args, **kwargs):
        if not current_user.is_authenticated or current_user.role != 'super_admin':
            flash('Accès réservé au Super Administrateur.', 'danger')
            return redirect(url_for('main.index'))
        return f(*args, **kwargs)
    decorated_function.__name__ = f.__name__
    return decorated_function

def draw_pdf_header(p, title_text):
    import os
    from flask import current_app
    logo_path = os.path.join(current_app.root_path, 'static', 'logorv.png')
    text_x = 50
    if os.path.exists(logo_path):
        try:
            p.drawImage(logo_path, 50, 745, width=40, height=40, mask='auto', preserveAspectRatio=True)
            text_x = 100
        except Exception:
            db.session.rollback()
            pass
    font_size = 14 if len(title_text) > 30 else 16
    p.setFont("Helvetica-Bold", font_size)
    p.setFillColorRGB(0.79, 0.16, 0.16)
    p.drawString(text_x, 755, title_text)
    p.setStrokeColorRGB(0.79, 0.16, 0.16)
    p.line(50, 735, 560, 735)
    p.setStrokeColorRGB(0, 0, 0)

# === NEW: AUDITING AND NOTIFICATION UTILITIES ===

def log_audit(action, target_type=None, target_id=None, details=None):
    user_id = current_user.id if current_user and current_user.is_authenticated else None
    ip_address = request.remote_addr if request else None
    log = AuditLog(
        user_id=user_id,
        action=action,
        target_type=target_type,
        target_id=target_id,
        details=details,
        ip_address=ip_address
    )
    db.session.add(log)
    db.session.commit()
    
    # Notify super_admin for critical actions performed by non-super_admins
    critical_actions = [
        'TRIP_CANCELLED', 'AGENCY_DELETED', 'ADMIN_CREATED', 
        'ADMIN_DELETED', 'BUS_DELETED', 'ROUTE_DELETED', 'TRIP_DELETED'
    ]
    if action in critical_actions:
        if current_user and current_user.is_authenticated and current_user.role != 'super_admin':
            actor_name = current_user.username
            trigger_notification(
                title="Opération Critique (Audit)",
                message=f"L'utilisateur {actor_name} a effectué l'action: {action} sur {target_type} #{target_id}.",
                type='warning',
                category='operations',
                role_target='super_admin'
            )

def trigger_notification(title, message, type='info', agency_id=None,
                         user_id=None, category='system', role_target=None):
    """
    Central notification dispatcher with role-based routing.

    Parameters:
      title       – Notification title
      message     – Notification body
      type        – 'info' | 'success' | 'warning' | 'danger'
      agency_id   – Agency scope (used for admin_agence targeting)
      user_id     – Specific user to notify (overrides role_target for delivery)
      category    – Taxonomy key (financial, booking, parcel, passenger, travel, etc.)
      role_target – 'super_admin' | 'admin_agence' | 'client' | None (all admins)
    """
    # --- Category → preference mapping ---
    PREF_MAP = {
        # Client categories
        'passenger': 'pref_booking',
        'travel':    'pref_booking',
        'parcel_client': 'pref_parcel',
        'refund':    'pref_financial',
        # Agency admin categories
        'booking':   'pref_booking',
        'parcel':    'pref_parcel',
        'payment':   'pref_financial',
        'wallet':    'pref_financial',
        'shift':     'pref_shift',
        'ops_agency':'pref_system',
        # Super admin categories
        'financial':    'pref_financial',
        'agency_mgmt':  'pref_system',
        'shift_admin':  'pref_shift',
        'operations':   'pref_system',
        'security':     'pref_system',
        # Shared
        'system':    'pref_system',
        'marketing': 'pref_marketing',
    }

    def _check_pref(user, cat):
        """Return True if the user has not disabled this category."""
        pref_field = PREF_MAP.get(cat)
        if pref_field:
            return getattr(user, pref_field, True)
        return True

    def _simulate_delivery(user, title, message):
        if user.email_notifications:
            print(f"[Email] → {user.email} | {title}")
        if user.sms_notifications and user.phone:
            print(f"[SMS]   → {user.phone} | {title}")
        if user.push_notifications:
            print(f"[Push]  → {user.username} | {title}")

    # --- Case 1: Specific user targeted ---
    if user_id:
        target_user = User.query.get(user_id)
        if target_user and _check_pref(target_user, category):
            _simulate_delivery(target_user, title, message)
            notif = SystemNotification(
                title=title, message=message, type=type,
                category=category, role_target=role_target,
                agency_id=agency_id, user_id=user_id
            )
            db.session.add(notif)
            db.session.commit()
        return

    # --- Case 2: Super Admin targeted ---
    if role_target == 'super_admin':
        # Find all super admins and check their preferences
        super_admins = User.query.filter_by(role='super_admin', is_deleted=False).all()
        for sa in super_admins:
            if _check_pref(sa, category):
                _simulate_delivery(sa, title, message)
        notif = SystemNotification(
            title=title, message=message, type=type,
            category=category, role_target='super_admin',
            agency_id=agency_id, user_id=None
        )
        db.session.add(notif)
        db.session.commit()
        return

    # --- Case 3: Agency Admin targeted ---
    if role_target == 'admin_agence' and agency_id:
        agency_admins = User.query.filter_by(
            role='admin_agence', agency_id=agency_id, is_deleted=False
        ).all()
        for aa in agency_admins:
            if _check_pref(aa, category):
                _simulate_delivery(aa, title, message)
        notif = SystemNotification(
            title=title, message=message, type=type,
            category=category, role_target='admin_agence',
            agency_id=agency_id, user_id=None
        )
        db.session.add(notif)
        db.session.commit()
        return

    # --- Case 4: Platform-wide (all admins see it) ---
    notif = SystemNotification(
        title=title, message=message, type=type,
        category=category, role_target=None,
        agency_id=agency_id, user_id=None
    )
    db.session.add(notif)
    db.session.commit()




def get_current_caisse(agency_id):
    from app.models import CaisseSession
    if not agency_id:
        return None
    return CaisseSession.query.filter_by(agency_id=agency_id, status='open').first()


@admin.route('/admin/notifications/<int:notif_id>/read', methods=['POST'])
@login_required
@admin_required
def mark_notification_read(notif_id):
    notif = SystemNotification.query.get_or_404(notif_id)
    if not notif.is_read:
        notif.is_read = True
        db.session.commit()
    return jsonify({"success": True})

# === SETTINGS (Paramètres) ===
@admin.route('/admin/settings', methods=['GET', 'POST'])
@login_required
@admin_required
def settings():
    return redirect(url_for('admin.profile'))

@admin.route('/admin/email-logs')
@login_required
@super_admin_required
def email_logs():
    from app.models import EmailLog
    logs = EmailLog.query.order_by(EmailLog.id.desc()).limit(100).all()
    return render_template('admin/email_logs.html', logs=logs)

@admin.route('/admin/privacy-records')
@login_required
@super_admin_required
def privacy_records():
    from app.models import PrivacyAcceptance
    records = PrivacyAcceptance.query.order_by(PrivacyAcceptance.accepted_at.desc()).limit(100).all()
    return render_template('admin/privacy_records.html', records=records)

# === FINANCE & PAYMENTS ===
@admin.route('/admin/finance')
@login_required
@admin_required
def finance():
    filter_val = request.args.get('filter', 'all')
    today = date.today()
    if current_user.role == 'super_admin':
        query = Booking.query.filter_by(is_deleted=False)
    else:
        # Agency specific
        trips_query = Trip.query.join(Route).filter(Route.agency_id == current_user.agency_id, Trip.is_deleted == False)
        trip_ids = [t.id for t in trips_query.all()]
        query = Booking.query.filter(Booking.trip_id.in_(trip_ids), Booking.is_deleted == False) if trip_ids else None

    if query:
        if filter_val in ['day', 'week', 'month']:
            if filter_val == 'day':
                start_dt = datetime.combine(today, datetime.min.time())
                end_dt = datetime.combine(today, datetime.max.time())
            elif filter_val == 'week':
                start_dt = datetime.combine(today - timedelta(days=6), datetime.min.time())
                end_dt = datetime.combine(today, datetime.max.time())
            elif filter_val == 'month':
                start_dt = datetime.combine(today - timedelta(days=29), datetime.min.time())
                end_dt = datetime.combine(today, datetime.max.time())
                
            bookings = query.filter(Booking.booking_date.between(start_dt, end_dt)).all()
        else:
            bookings = query.all()
    else:
        bookings = []

    # Calculate stats over the selected period
    if filter_val == 'day':
        sales_label = "Ventes du Jour"
    elif filter_val == 'week':
        sales_label = "Ventes (Cette Semaine)"
    elif filter_val == 'month':
        sales_label = "Ventes (Ce Mois)"
    else:
        sales_label = "Ventes Totales"

    momo_payments = sum((b.price_paid or 0.0) for b in bookings if b.payment_method and 'momo' in b.payment_method.lower() and b.payment_status == 'paid')
    orange_payments = sum((b.price_paid or 0.0) for b in bookings if b.payment_method and ('orange' in b.payment_method.lower() or 'om' in b.payment_method.lower()) and b.payment_status == 'paid')
    period_sales = momo_payments + orange_payments
    daily_sales = period_sales
    pending_transactions = sum((b.price_paid or 0.0) for b in bookings if b.payment_status == 'pending')
    refund_history = sum(b.refund_amount for b in bookings if b.refund_amount > 0)
    
    # Get recent transactions
    recent_transactions = sorted([b for b in bookings if b.payment_status in ['paid', 'refunded', 'pending']], key=lambda x: x.booking_date or datetime.min, reverse=True)[:50]

    return render_template(
        'admin/finance.html', 
        daily_sales=daily_sales, 
        sales_label=sales_label,
        momo_payments=momo_payments, 
        orange_payments=orange_payments,
        pending_transactions=pending_transactions, 
        refund_history=refund_history,
        recent_transactions=recent_transactions,
        current_filter=filter_val
    )

@admin.route('/admin/finance/export/pdf')
@login_required
@admin_required
def export_finance_pdf():
    filter_val = request.args.get('filter', 'all')
    today = date.today()
    if current_user.role == 'super_admin':
        query = Booking.query.filter_by(is_deleted=False)
    else:
        # Agency specific
        trips_query = Trip.query.join(Route).filter(Route.agency_id == current_user.agency_id, Trip.is_deleted == False)
        trip_ids = [t.id for t in trips_query.all()]
        query = Booking.query.filter(Booking.trip_id.in_(trip_ids), Booking.is_deleted == False) if trip_ids else None

    if query:
        if filter_val in ['day', 'week', 'month']:
            if filter_val == 'day':
                start_dt = datetime.combine(today, datetime.min.time())
                end_dt = datetime.combine(today, datetime.max.time())
            elif filter_val == 'week':
                start_dt = datetime.combine(today - timedelta(days=6), datetime.min.time())
                end_dt = datetime.combine(today, datetime.max.time())
            elif filter_val == 'month':
                start_dt = datetime.combine(today - timedelta(days=29), datetime.min.time())
                end_dt = datetime.combine(today, datetime.max.time())
                
            bookings = query.filter(Booking.booking_date.between(start_dt, end_dt)).all()
        else:
            bookings = query.all()
    else:
        bookings = []

    # Sort transactions
    recent_transactions = sorted([b for b in bookings if b.payment_status in ['paid', 'refunded', 'pending']], key=lambda x: x.booking_date or datetime.min, reverse=True)

    # Stats
    if filter_val == 'day':
        label = "Aujourd'hui"
    elif filter_val == 'week':
        label = "Cette Semaine"
    elif filter_val == 'month':
        label = "Ce Mois"
    else:
        label = "Tout"

    momo_payments = sum((b.price_paid or 0.0) for b in bookings if b.payment_method and 'momo' in b.payment_method.lower() and b.payment_status == 'paid')
    orange_payments = sum((b.price_paid or 0.0) for b in bookings if b.payment_method and ('orange' in b.payment_method.lower() or 'om' in b.payment_method.lower()) and b.payment_status == 'paid')
    period_sales = momo_payments + orange_payments
    pending_transactions = sum((b.price_paid or 0.0) for b in bookings if b.payment_status == 'pending')
    refund_history = sum(b.refund_amount for b in bookings if b.refund_amount > 0)

    try:
        import io
        from flask import send_file
        from reportlab.lib.pagesizes import letter
        from reportlab.pdfgen import canvas
        
        buffer = io.BytesIO()
        p = canvas.Canvas(buffer, pagesize=letter)
        
        draw_pdf_header(p, "3M SERVICES — RAPPORT FINANCIER")
        
        # Metadata
        p.setFont("Helvetica-Bold", 11)
        p.setFillColorRGB(0.1, 0.1, 0.1)
        p.drawString(50, 715, "Vue d'ensemble financière")
        p.setFont("Helvetica", 9)
        p.drawString(50, 700, f"Période de filtrage : {label}")
        agency_name = "Plateforme Globale (Toutes)" if current_user.role == 'super_admin' else current_user.agency.name
        p.drawString(50, 685, f"Agence : {agency_name}")
        p.drawString(50, 670, f"Généré le : {datetime.now().strftime('%d/%m/%Y %H:%M')}")
        
        # Financial metrics boxes
        p.line(50, 655, 560, 655)
        p.setFont("Helvetica-Bold", 9)
        p.drawString(60, 640, "Recette Totale")
        p.drawString(160, 640, "Paiements MoMo")
        p.drawString(260, 640, "Paiements OM")
        p.drawString(360, 640, "En Attente")
        p.drawString(460, 640, "Remboursements")
        
        p.setFont("Helvetica", 9)
        p.drawString(60, 625, f"{period_sales:,.0f} F")
        p.drawString(160, 625, f"{momo_payments:,.0f} F")
        p.drawString(260, 625, f"{orange_payments:,.0f} F")
        p.drawString(360, 625, f"{pending_transactions:,.0f} F")
        p.drawString(460, 625, f"{refund_history:,.0f} F")
        p.line(50, 615, 560, 615)
        
        # Transactions list table
        p.setFont("Helvetica-Bold", 10)
        p.drawString(50, 595, "TRANSACTIONS RECENTES")
        p.setFont("Helvetica-Bold", 8)
        p.drawString(50, 575, "Date")
        p.drawString(130, 575, "Code Réservation")
        p.drawString(220, 575, "Client / Passager")
        p.drawString(350, 575, "Méthode")
        p.drawString(440, 575, "Statut")
        p.drawString(500, 575, "Montant")
        p.line(50, 565, 560, 565)
        
        y = 545
        p.setFont("Helvetica", 8)
        for t in recent_transactions:
            if y < 50:
                p.showPage()
                p.setFont("Helvetica-Bold", 8)
                p.drawString(50, 750, "Date")
                p.drawString(130, 750, "Code Réservation")
                p.drawString(220, 750, "Client / Passager")
                p.drawString(350, 750, "Méthode")
                p.drawString(440, 750, "Statut")
                p.drawString(500, 750, "Montant")
                p.line(50, 740, 560, 740)
                p.setFont("Helvetica", 8)
                y = 720
                
            p.drawString(50, y, t.booking_date.strftime('%d/%m/%Y %H:%M') if t.booking_date else '')
            p.drawString(130, y, t.booking_code or f"#{t.id}")
            
            name = t.passenger_name or (t.user.username if t.user else 'Client Comptoir')
            p.drawString(220, y, name[:24])
            
            # Payment method
            method = 'MTN MoMo' if (t.payment_method and 'momo' in t.payment_method.lower()) else ('Orange Money' if (t.payment_method and ('orange' in t.payment_method.lower() or 'om' in t.payment_method.lower())) else (t.payment_method or 'Non spécifié'))
            p.drawString(350, y, method)
            p.drawString(440, y, t.payment_status)
            
            # Amount
            amt = f"-{t.refund_amount:,.0f} F" if t.payment_status == 'refunded' else f"{t.price_paid:,.0f} F"
            p.drawString(500, y, amt)
            y -= 15
            
        p.showPage()
        p.save()
        
        buffer.seek(0)
        return send_file(buffer, as_attachment=True, download_name=f"rapport_finance_{filter_val}.pdf", mimetype='application/pdf')
    except Exception as e:
        import logging
        logging.error(f"Error exporting finance to PDF: {e}")
        flash("Erreur lors de l'export PDF.", "danger")
        return redirect(url_for('admin.finance'))

# === TELLER APP (Guichet P=caisse) ===
@admin.route('/admin/teller/dashboard')
@login_required
@teller_required
def teller_dashboard():
    today = date.today()
    # Query bookings made by this teller today
    teller_bookings = Booking.query.filter(
        Booking.user_id == current_user.id,
        func.date(Booking.booking_date) == today,
        Booking.status != 'cancelled'
    ).all()
    
    today_tickets = len(teller_bookings)
    today_cash = sum((b.price_paid or 0.0) for b in teller_bookings if b.payment_method == 'Cash')
    today_momo = sum((b.price_paid or 0.0) for b in teller_bookings if b.payment_method and ('momo' in b.payment_method.lower() or 'mtn' in b.payment_method.lower() or 'mobile money' in b.payment_method.lower()))
    today_orange = sum((b.price_paid or 0.0) for b in teller_bookings if b.payment_method and ('orange' in b.payment_method.lower() or 'om' in b.payment_method.lower()))
    
    # Upcoming trips for this agency
    now = datetime.utcnow()
    if current_user.role == 'super_admin':
        upcoming_trips = Trip.query.filter(Trip.departure_time >= now, Trip.is_deleted == False).order_by(Trip.departure_time).limit(5).all()
    else:
        upcoming_trips = Trip.query.join(Route).filter(Route.agency_id == current_user.agency_id, Trip.departure_time >= now, Trip.is_deleted == False).order_by(Trip.departure_time).limit(5).all()
        
    agency_id = request.args.get('agency_id') if current_user.role == 'super_admin' else current_user.agency_id
    caisse = get_current_caisse(agency_id)

    return render_template('admin/teller_dashboard.html', 
                           today_tickets=today_tickets, 
                           today_cash=today_cash, 
                           today_momo=today_momo,
                           today_orange=today_orange,
                           upcoming_trips=upcoming_trips,
                           caisse=caisse)

@admin.route('/admin/teller/book', methods=['GET', 'POST'])
@login_required
@teller_required
def teller_book():
    caisse = get_current_caisse(current_user.agency_id)
    if request.method == 'POST':
        client_name = request.form.get('client_name', '').strip()
        surname = request.form.get('surname', '').strip()
        phone = request.form.get('phone', '').strip()
        email = request.form.get('email', '').strip()
        bus_id = request.form.get('bus_id') or request.form.get('car_id')
        date_from_str = request.form.get('date_from', '').strip()
        date_to_str = request.form.get('date_to', '').strip()
        payment_method = request.form.get('payment_method', 'cash').strip().lower() # 'mobile', 'cash', 'pending'
        note = request.form.get('note', '').strip()
        driver_id = request.form.get('driver_id')
        total_price_form = request.form.get('total_price', type=float)

        if not all([client_name, surname, bus_id, date_from_str, date_to_str]):
            flash("Veuillez renseigner le prénom, le nom, le véhicule VIP et les dates (du / au).", "danger")
            return redirect(url_for('admin.teller_book'))

        bus = Bus.query.get_or_404(int(bus_id))

        # Parse date from & date to
        try:
            dep_dt = datetime.strptime(date_from_str, '%Y-%m-%dT%H:%M')
        except ValueError:
            try:
                dep_dt = datetime.strptime(date_from_str, '%Y-%m-%d')
            except ValueError:
                dep_dt = datetime.now()

        try:
            arr_dt = datetime.strptime(date_to_str, '%Y-%m-%dT%H:%M')
        except ValueError:
            try:
                arr_dt = datetime.strptime(date_to_str, '%Y-%m-%d')
            except ValueError:
                arr_dt = dep_dt + timedelta(days=1)

        if arr_dt <= dep_dt:
            flash("La date de restitution doit être postérieure à la date de départ.", "danger")
            return redirect(url_for('admin.teller_book'))

        # Duration in days
        delta = arr_dt - dep_dt
        days = max(1, delta.days + (1 if delta.seconds > 3600*4 else 0))

        # Determine daily rate
        daily_rate = bus.promo_price if (bus.is_promo and bus.promo_price) else (bus.regular_price or 100000)
        calculated_total = float(days * daily_rate)
        final_price = total_price_form if (total_price_form and total_price_form > 0) else calculated_total

        full_passenger_name = f"{client_name} {surname}".strip()

        # Find or create client User
        passenger_user = None
        if phone:
            passenger_user = User.query.filter_by(phone=phone).first()
        if not passenger_user and email:
            passenger_user = User.query.filter_by(email=email).first()

        if not passenger_user:
            user_phone = phone or f"69{random.randint(1000000, 9999999)}"
            user_email = email or f"client.{random.randint(1000, 9999)}@3mservices.vip"
            clean_first = "".join(c for c in client_name.lower() if c.isalnum())
            clean_last = "".join(c for c in surname.lower() if c.isalnum())
            username = f"{clean_first}.{clean_last}_{random.randint(100, 999)}"
            passenger_user = User(
                username=username,
                email=user_email,
                phone=user_phone,
                first_name=client_name,
                last_name=surname,
                real_name=full_passenger_name,
                role='client'
            )
            passenger_user.set_password(user_phone)
            db.session.add(passenger_user)
            db.session.flush()
        else:
            if not passenger_user.first_name:
                passenger_user.first_name = client_name
            if not passenger_user.last_name:
                passenger_user.last_name = surname
            if not passenger_user.real_name:
                passenger_user.real_name = full_passenger_name
            db.session.flush()

        # Route for VIP counter rental mission
        route = Route.query.filter(Route.origin.like('%Yaoundé%')).first()
        if not route:
            route = Route.query.first()
        route_id = route.id if route else 1

        # Scheduled Trip record representing this vehicle rental sortie
        trip = Trip(
            route_id=route_id,
            bus_id=bus.id,
            driver_id=int(driver_id) if driver_id else None,
            departure_time=dep_dt,
            arrival_time=arr_dt,
            price=final_price,
            capacity=bus.capacity,
            occupied_seats=1,
            status='scheduled'
        )
        db.session.add(trip)
        db.session.flush()

        # Booking code
        booking_code = f"3M-POS-{datetime.now().strftime('%Y%m')}-{random.randint(1000, 9999)}"
        booking_status = 'confirmed' if payment_method in ['cash', 'mobile'] else 'locked'
        payment_status = 'paid' if payment_method in ['cash', 'mobile'] else 'pending'

        booking = Booking(
            user_id=passenger_user.id,
            trip_id=trip.id,
            seat_number='VIP-CAR',
            status=booking_status,
            payment_status=payment_status,
            payment_method=payment_method, # 'mobile', 'cash', 'pending'
            price_paid=final_price if payment_status == 'paid' else 0.0,
            passenger_name=full_passenger_name,
            special_instructions=note,
            return_date=arr_dt,
            booking_code=booking_code
        )
        db.session.add(booking)
        db.session.flush()

        # Record Payment
        payment = Payment(
            booking_id=booking.id,
            amount=final_price,
            status='completed' if payment_status == 'paid' else 'pending',
            payment_method='Cash' if payment_method == 'cash' else ('Mobile Money' if payment_method == 'mobile' else 'Pending')
        )
        db.session.add(payment)

        # Update open caisse session if active
        if caisse and payment_status == 'paid':
            if payment_method == 'cash':
                caisse.total_cash = (caisse.total_cash or 0.0) + final_price
            elif payment_method == 'mobile':
                caisse.total_momo = (caisse.total_momo or 0.0) + final_price

        db.session.commit()

        # Synchronize with Express backend server/data/db.json
        sync_booking_to_express_db({
            "id": booking_code,
            "clientName": full_passenger_name,
            "phone": passenger_user.phone or phone or "",
            "email": passenger_user.email or email or "",
            "carName": f"{bus.brand} {bus.model}",
            "carId": f"car-{bus.id}",
            "pickUp": "Comptoir Agence 3M SERVICES",
            "dropOff": "Comptoir Agence 3M SERVICES",
            "pickTime": dep_dt.strftime('%Y-%m-%d %H:%M'),
            "dropTime": arr_dt.strftime('%Y-%m-%d %H:%M'),
            "days": days,
            "pricePerDay": daily_rate,
            "totalPrice": int(final_price),
            "status": "Confirmée" if payment_status == 'paid' else "En attente",
            "paymentMethod": payment_method,
            "notes": note,
            "withDriver": bool(driver_id),
            "createdAt": datetime.utcnow().isoformat() + "Z"
        })

        # Operations notification
        trigger_notification(
            title="🚗 Contrat VIP Émis au Comptoir",
            message=f"Réservation #{booking_code} pour {full_passenger_name} — {bus.brand} {bus.model} du {dep_dt.strftime('%d/%m/%Y %H:%M')} au {arr_dt.strftime('%d/%m/%Y %H:%M')}. Règlement : {payment_method.upper()} ({final_price:,.0f} FCFA).",
            type="success", category='booking', role_target='super_admin'
        )

        log_audit("TELLER_BOOKING", "Booking", booking.id, f"VIP POS Booking {booking_code} for {full_passenger_name} ({bus.brand} {bus.model})")

        flash(f"Contrat de location VIP #{booking_code} émis avec succès pour {full_passenger_name} !", "success")

        # Redirect with parameters to trigger receipt modal
        redirect_args = {
            'print_receipt': booking.booking_code,
            'client_name': client_name,
            'surname': surname,
            'full_name': full_passenger_name,
            'phone': passenger_user.phone or phone or '',
            'car_name': f"{bus.brand} {bus.model} ({bus.bus_number})",
            'date_from': dep_dt.strftime('%d/%m/%Y %H:%M'),
            'date_to': arr_dt.strftime('%d/%m/%Y %H:%M'),
            'days': days,
            'daily_price': int(daily_rate),
            'price': int(final_price),
            'payment_method': payment_method,
            'note': note
        }
        return redirect(url_for('admin.teller_book', **redirect_args))

    # GET Request: Fetch VIP fleet, drivers, existing clients and recent bookings
    buses = Bus.query.filter_by(is_deleted=False).order_by(Bus.id.asc()).all()
    drivers = Driver.query.filter_by(is_deleted=False).all()
    clients = User.query.filter_by(role='client', is_deleted=False).order_by(User.id.desc()).limit(40).all()
    recent_bookings = Booking.query.order_by(Booking.id.desc()).limit(8).all()
    today_str = datetime.now().strftime('%Y-%m-%dT%H:00')
    tomorrow_str = (datetime.now() + timedelta(days=2)).strftime('%Y-%m-%dT%H:00')

    return render_template(
        'admin/teller_pos.html',
        buses=buses,
        drivers=drivers,
        clients=clients,
        recent_bookings=recent_bookings,
        today_str=today_str,
        tomorrow_str=tomorrow_str,
        caisse=caisse
    )

@admin.route('/admin/teller/trips')
@login_required
@teller_required
def teller_trips():
    caisse = get_current_caisse(current_user.agency_id)
    today = datetime.utcnow()
    if current_user.role == 'super_admin':
        trips_query = Trip.query.filter_by(is_deleted=False)
    else:
        trips_query = Trip.query.join(Route).filter(Route.agency_id == current_user.agency_id, Trip.is_deleted == False)

    upcoming_trips = trips_query.filter(Trip.departure_time >= today).order_by(Trip.departure_time).all()
    past_trips = trips_query.filter(Trip.departure_time < today).order_by(Trip.departure_time.desc()).all()
    cancelled_trips = trips_query.filter(Trip.status == 'cancelled').all()
    
    if current_user.role == 'super_admin':
        unpaid_bookings = Booking.query.join(Trip).filter(Booking.payment_status == 'pending', Trip.departure_time >= today).order_by(Trip.departure_time).all()
    else:
        unpaid_bookings = Booking.query.join(Trip).join(Route).filter(Route.agency_id == current_user.agency_id, Booking.payment_status == 'pending', Trip.departure_time >= today).order_by(Trip.departure_time).all()
    
    return render_template('admin/teller_operations.html', 
                           upcoming_trips=upcoming_trips, 
                           past_trips=past_trips,
                           cancelled_trips=cancelled_trips,
                           unpaid_bookings=unpaid_bookings,
                           caisse=caisse)

@admin.route('/admin/teller/booking/<int:booking_id>/pay', methods=['POST'])
@login_required
@teller_required
def pay_booking(booking_id):
    caisse = get_current_caisse(current_user.agency_id)
    if not caisse:
        flash("La caisse est fermée. Vous ne pouvez pas encaisser de paiement.", "danger")
        return redirect(url_for('admin.teller_trips'))
        
    booking = Booking.query.get_or_404(booking_id)
    if current_user.role != 'super_admin' and booking.trip.route.agency_id != current_user.agency_id:
        flash("Accès refusé.", "danger")
        return redirect(url_for('admin.teller_trips'))
    
    booking.payment_status = 'paid'
    db.session.commit()
    flash("Paiement validé avec succès.", "success")
    return redirect(url_for('admin.teller_trips'))

@admin.route('/api/trips/search')
@login_required
@teller_required
def search_trips():
    origin = request.args.get('origin')
    destination = request.args.get('destination')
    date_str = request.args.get('date')
    
    query = Trip.query.join(Route).filter(Trip.is_deleted == False, Trip.status.notin_(['cancelled', 'completed']))
    
    if current_user.role != 'super_admin':
        query = query.filter(Route.agency_id == current_user.agency_id)
        
    if origin:
        query = query.filter(Route.origin == origin)
    if destination:
        query = query.filter(Route.destination == destination)
    if date_str:
        # Match only the date part of the departure time
        try:
            target_date = datetime.strptime(date_str, '%Y-%m-%d').date()
            query = query.filter(func.date(Trip.departure_time) == target_date)
        except ValueError:
            pass
            
    trips = query.order_by(Trip.departure_time).all()
    
    results = []
    for trip in trips:
        results.append({
            'id': trip.id,
            'origin': trip.route.origin,
            'destination': trip.route.destination,
            'time': trip.departure_time.strftime('%H:%M'),
            'price': trip.price,
            'available_seats': trip.capacity - trip.occupied_seats
        })
        
    from flask import jsonify
    return jsonify({'trips': results})

@admin.route('/api/teller/search_client')
@login_required
@teller_required
def search_client():
    phone = request.args.get('phone')
    if not phone:
        return jsonify({'found': False})
        
    user = User.query.filter_by(phone=phone, role='client').first()
    if user:
        # Count trips for "Frequent traveler" badge
        trip_count = Booking.query.filter_by(user_id=user.id, status='confirmed').count()
        # We might not have the name if it's stored in booking, but let's try to get the latest booking passenger_name
        latest_booking = Booking.query.filter_by(user_id=user.id).order_by(Booking.booking_date.desc().nulls_last()).first()
        name = latest_booking.passenger_name if latest_booking else ""
        
        return jsonify({
            'found': True,
            'name': name,
            'phone': user.phone,
            'trip_count': trip_count
        })
        
    return jsonify({'found': False})

@admin.route('/admin/teller/trip/<int:trip_id>/status/<string:status>')
@login_required
@teller_required
def update_trip_status(trip_id, status):
    trip = Trip.query.get_or_404(trip_id)
    
    if current_user.role != 'super_admin' and trip.route.agency_id != current_user.agency_id:
        flash("Accès refusé.", "danger")
        return redirect(url_for('admin.teller_trips'))
        
    valid_statuses = ['scheduled', 'boarding', 'departed', 'delayed', 'arrived', 'cancelled', 'completed']
    if status in valid_statuses:
        old_status = trip.status
        trip.status = status
        db.session.commit()
        log_audit("TRIP_STATUS_UPDATED", "Trip", trip.id, f"Changed status from {old_status} to {status}")
        flash(f"Statut du trajet mis à jour: {status}", "success")
        
        # Notify passengers and agency admin when trip is delayed or cancelled
        if status == 'delayed':
            # Agency Admin notification
            trigger_notification(
                title="⏱️ Voyage Retardé",
                message=f"Le trajet #{trip.id} ({trip.route.origin} → {trip.route.destination}) du {trip.departure_time.strftime('%d/%m/%Y %H:%M')} est en retard.",
                type='warning', category='ops_agency', role_target='admin_agence',
                agency_id=trip.route.agency_id
            )
            # Notify each confirmed passenger
            confirmed = Booking.query.filter_by(trip_id=trip.id, status='confirmed', is_deleted=False).all()
            for b in confirmed:
                if b.user_id:
                    trigger_notification(
                        title="⏱️ Votre Bus est en Retard",
                        message=f"Votre voyage de {trip.route.origin} vers {trip.route.destination} prévu à {trip.departure_time.strftime('%H:%M')} est retardé. Veuillez rester à l'écoute.",
                        type='warning', category='travel', role_target='client',
                        user_id=b.user_id
                    )
        elif status == 'cancelled':
            trigger_notification(
                title="🔴 Voyage Annulé (Teller)",
                message=f"Le trajet #{trip.id} ({trip.route.origin} → {trip.route.destination}) a été annulé par le guichet.",
                type='danger', category='ops_agency', role_target='admin_agence',
                agency_id=trip.route.agency_id
            )
    else:
        flash("Statut invalide.", "danger")
        
    return redirect(url_for('admin.teller_trips'))

@admin.route('/admin/teller/scan_ticket/<string:booking_code>')
@login_required
@teller_required
def scan_ticket(booking_code):
    booking = Booking.query.filter_by(booking_code=booking_code).first_or_404()
    
    if current_user.role != 'super_admin' and booking.trip.route.agency_id != current_user.agency_id:
        flash("Accès refusé. Contrat d'une autre agence.", "danger")
        return redirect(url_for('admin.teller_trips'))
        
    if booking.status != 'confirmed':
        flash(f"Contrat invalide (Statut: {booking.status}).", "danger")
        return redirect(url_for('admin.teller_trips'))
        
    if booking.boarding_status == 'boarded':
        flash("Ce contrat a déjà été validé pour mise à disposition du véhicule.", "warning")
        return redirect(url_for('admin.teller_trips'))
        
    # Mark as boarded
    booking.boarding_status = 'boarded'
    db.session.commit()
    
    log_audit("TICKET_SCANNED", "Booking", booking.id, f"Contract {booking_code} validated for vehicle dispatch.")
    flash(f"Succès ! Prise en charge validée pour le client VIP {booking.passenger_name} (Réf {booking.seat_number}).", "success")
    return redirect(url_for('admin.teller_trips'))

# === DASHBOARD ===
def get_dashboard_stats(agency_id, start_dt, end_dt):
    now_dt = datetime.now()
    # Setup queries with agency filter if needed
    if agency_id:
        trip_ids_query = db.session.query(Trip.id).join(Route).filter(Route.agency_id == agency_id, Trip.is_deleted == False)
        
        # Booking query scoped to these trips
        bookings_query = Booking.query.filter(Booking.trip_id.in_(trip_ids_query), Booking.is_deleted == False)
        
        # Trips in period
        trips_in_period = Trip.query.join(Route).filter(
            Route.agency_id == agency_id,
            Trip.departure_time.between(start_dt, end_dt),
            Trip.is_deleted == False
        )
        
        # Active trips (currently running)
        active_trips_query = Trip.query.join(Route).filter(
            Route.agency_id == agency_id,
            Trip.departure_time <= now_dt,
            Trip.arrival_time >= now_dt,
            Trip.status != 'cancelled',
            Trip.is_deleted == False
        )
        
        # Upcoming trips (starting between start_dt and end_dt and > now)
        upcoming_trips_query = Trip.query.join(Route).filter(
            Route.agency_id == agency_id,
            Trip.departure_time.between(max(start_dt, now_dt), end_dt),
            Trip.status != 'cancelled',
            Trip.is_deleted == False
        )
        
        # Cancelled trips starting in period
        cancelled_trips_query = Trip.query.join(Route).filter(
            Route.agency_id == agency_id,
            Trip.departure_time.between(start_dt, end_dt),
            Trip.status == 'cancelled',
            Trip.is_deleted == False
        )

        # Cars currently out (active mission)
        cars_out_now = db.session.query(Trip.bus_id).join(Route).filter(
            Route.agency_id == agency_id,
            Trip.departure_time <= now_dt,
            Trip.arrival_time >= now_dt,
            Trip.status != 'cancelled',
            Trip.is_deleted == False
        ).distinct().count()

        # Cars out in period
        cars_out_period = db.session.query(Trip.bus_id).join(Route).filter(
            Route.agency_id == agency_id,
            Trip.departure_time.between(start_dt, end_dt),
            Trip.status != 'cancelled',
            Trip.is_deleted == False
        ).distinct().count()
        
        buses_count = Bus.query.filter_by(agency_id=agency_id, is_deleted=False).count()
        buses_active = Bus.query.filter_by(agency_id=agency_id, status='active', is_deleted=False).count()
        buses_maint = Bus.query.filter_by(agency_id=agency_id, status='maintenance', is_deleted=False).count()
        drivers_active = Driver.query.filter_by(agency_id=agency_id, status='on_trip', is_deleted=False).count()
        promo_count = Bus.query.filter_by(agency_id=agency_id, is_promo=True, is_deleted=False).count()
    else:
        # Super admin (global)
        bookings_query = Booking.query.filter_by(is_deleted=False)
        
        trips_in_period = Trip.query.filter(
            Trip.departure_time.between(start_dt, end_dt),
            Trip.is_deleted == False
        )
        
        active_trips_query = Trip.query.filter(
            Trip.departure_time <= now_dt,
            Trip.arrival_time >= now_dt,
            Trip.status != 'cancelled',
            Trip.is_deleted == False
        )
        
        upcoming_trips_query = Trip.query.filter(
            Trip.departure_time.between(max(start_dt, now_dt), end_dt),
            Trip.status != 'cancelled',
            Trip.is_deleted == False
        )
        
        cancelled_trips_query = Trip.query.filter(
            Trip.departure_time.between(start_dt, end_dt),
            Trip.status == 'cancelled',
            Trip.is_deleted == False
        )

        # Cars currently out (active mission)
        cars_out_now = db.session.query(Trip.bus_id).filter(
            Trip.departure_time <= now_dt,
            Trip.arrival_time >= now_dt,
            Trip.status != 'cancelled',
            Trip.is_deleted == False
        ).distinct().count()

        # Cars out in period
        cars_out_period = db.session.query(Trip.bus_id).filter(
            Trip.departure_time.between(start_dt, end_dt),
            Trip.status != 'cancelled',
            Trip.is_deleted == False
        ).distinct().count()
        
        buses_count = Bus.query.filter_by(is_deleted=False).count()
        buses_active = Bus.query.filter_by(status='active', is_deleted=False).count()
        buses_maint = Bus.query.filter_by(status='maintenance', is_deleted=False).count()
        drivers_active = Driver.query.filter_by(status='on_trip', is_deleted=False).count()
        promo_count = Bus.query.filter_by(is_promo=True, is_deleted=False).count()

    total_clients_all = User.query.filter_by(role='client', is_deleted=False).count()
    apartments_count = Apartment.query.filter_by(is_deleted=False).count()
    available_apartments = Apartment.query.filter_by(status='Disponible', is_deleted=False).count()

    # Calculate metrics
    # 1. Revenue
    revenue = db.session.query(func.sum(Booking.price_paid)).filter(
        Booking.trip_id.in_(db.session.query(Trip.id).filter(Trip.is_deleted == False)) if not agency_id else Booking.trip_id.in_(trip_ids_query),
        Booking.booking_date.between(start_dt, end_dt),
        Booking.status == 'confirmed',
        Booking.payment_method.in_(['momo', 'orange']),
        Booking.is_deleted == False
    ).scalar() or 0.0
    
    # 1b. Parcel Revenue
    if agency_id:
        parcel_revenue = db.session.query(func.sum(Parcel.price)).filter(
            Parcel.agency_id == agency_id,
            Parcel.created_at.between(start_dt, end_dt),
            Parcel.payment_status == 'paid',
            Parcel.status != 'cancelled'
        ).scalar() or 0.0
    else:
        parcel_revenue = db.session.query(func.sum(Parcel.price)).filter(
            Parcel.created_at.between(start_dt, end_dt),
            Parcel.payment_status == 'paid',
            Parcel.status != 'cancelled'
        ).scalar() or 0.0
    
    # 2. Operations / Trips
    trips_count = trips_in_period.count()
    active_trips = active_trips_query.count()
    upcoming_trips = upcoming_trips_query.count()
    cancelled_trips = cancelled_trips_query.count()
    
    # 3. Bookings
    bookings_in_period_query = bookings_query.filter(Booking.booking_date.between(start_dt, end_dt))
    bookings_count = bookings_in_period_query.count()
    pending_bookings = bookings_in_period_query.filter((Booking.status == 'locked') | (Booking.payment_status == 'pending')).count()
    confirmed_bookings = bookings_in_period_query.filter(Booking.status == 'confirmed').count()
    cancelled_bookings = bookings_in_period_query.filter(Booking.status == 'cancelled').count()
    
    # 4. Customers
    if agency_id:
        new_customers = User.query.filter(
            User.role == 'client',
            User.created_at.between(start_dt, end_dt),
            User.is_deleted == False
        ).filter(User.id.in_(
            db.session.query(Booking.user_id).filter(Booking.trip_id.in_(trip_ids_query))
        )).count()
        
        active_customers = db.session.query(Booking.user_id).filter(
            Booking.trip_id.in_(trip_ids_query),
            Booking.booking_date.between(start_dt, end_dt),
            Booking.is_deleted == False
        ).distinct().count()
        
        repeat_customers_subquery = db.session.query(Booking.user_id).filter(
            Booking.trip_id.in_(trip_ids_query),
            Booking.booking_date.between(start_dt, end_dt),
            Booking.is_deleted == False
        ).group_by(Booking.user_id).having(func.count(Booking.id) > 1).subquery()
        repeat_customers = db.session.query(repeat_customers_subquery).count()
    else:
        new_customers = User.query.filter(
            User.role == 'client',
            User.created_at.between(start_dt, end_dt),
            User.is_deleted == False
        ).count()
        
        active_customers = db.session.query(Booking.user_id).filter(
            Booking.booking_date.between(start_dt, end_dt),
            Booking.is_deleted == False
        ).distinct().count()
        
        repeat_customers_subquery = db.session.query(Booking.user_id).filter(
            Booking.booking_date.between(start_dt, end_dt),
            Booking.is_deleted == False
        ).group_by(Booking.user_id).having(func.count(Booking.id) > 1).subquery()
        repeat_customers = db.session.query(repeat_customers_subquery).count()
        
    return {
        'revenue': float(revenue),
        'parcel_revenue': float(parcel_revenue),
        'trips_count': trips_count,
        'active_trips': active_trips,
        'upcoming_trips': upcoming_trips,
        'cancelled_trips': cancelled_trips,
        'cars_out': cars_out_now,
        'cars_out_period': cars_out_period,
        'total_clients': total_clients_all,
        'new_customers': new_customers,
        'active_customers': active_customers,
        'repeat_customers': repeat_customers,
        'bookings_count': bookings_count,
        'pending_bookings': pending_bookings,
        'confirmed_bookings': confirmed_bookings,
        'cancelled_bookings': cancelled_bookings,
        'buses_count': buses_count,
        'buses_active': buses_active,
        'buses_maint': buses_maint,
        'drivers_active': drivers_active,
        'apartments_count': apartments_count,
        'available_apartments': available_apartments,
        'promo_count': promo_count
    }

@admin.route('/admin')
@admin.route('/admin/dashboard')
@login_required
@admin_required
def dashboard():
    check_due_vehicle_restitutions()
    sync_visitors_and_customers_from_db_json()
    recent_visitors = User.query.filter_by(role='client', is_deleted=False).order_by(User.created_at.desc(), User.id.desc()).limit(8).all()
    today = date.today()
    chart_labels = []
    chart_data = []
    
    # Calculate last 7 days chart labels
    for i in range(7):
        day = today - timedelta(days=6-i)
        chart_labels.append(day.strftime('%a'))

    # Range dates for Day, Week, Month
    day_start = datetime.combine(today, datetime.min.time())
    day_end = datetime.combine(today, datetime.max.time())
    week_start = datetime.combine(today - timedelta(days=6), datetime.min.time())
    month_start = datetime.combine(today - timedelta(days=29), datetime.min.time())

    if current_user.role == 'super_admin':
        # Super Admin - Global stats (filter out soft-deleted)
        total_agencies = Agency.query.filter_by(is_deleted=False).count()
        total_users = User.query.filter_by(role='client', is_deleted=False).count()
        total_buses = Bus.query.filter_by(is_deleted=False).count()
        total_routes = Route.query.filter_by(is_deleted=False).count()
        total_bookings = Booking.query.filter_by(is_deleted=False).count()
        total_feedback = Feedback.query.count()
        
        # Recent bookings (global)
        recent_bookings = Booking.query.filter_by(is_deleted=False).order_by(Booking.booking_date.desc().nulls_last()).limit(5).all()
        
        # Total revenue (global) - Only Mobile Money (MoMo/OM)
        total_revenue = db.session.query(func.sum(Booking.price_paid)).filter(
            Booking.status == 'confirmed',
            Booking.payment_method.in_(['momo', 'orange']),
            Booking.is_deleted == False
        ).scalar() or 0
        
        # Total Parcel Revenue
        total_parcel_revenue = db.session.query(func.sum(Parcel.price)).filter(
            Parcel.payment_status == 'paid',
            Parcel.status != 'cancelled'
        ).scalar() or 0
        
        # Today's stats
        todays_bookings = Booking.query.filter(func.date(Booking.booking_date) == today, Booking.is_deleted == False).count()
        todays_revenue = db.session.query(func.sum(Booking.price_paid)).filter(
            func.date(Booking.booking_date) == today,
            Booking.status == 'confirmed',
            Booking.payment_method.in_(['momo', 'orange']),
            Booking.is_deleted == False
        ).scalar() or 0
        todays_users = User.query.filter(func.date(User.created_at) == today, User.role == 'client', User.is_deleted == False).count()
        
        # 7-day bookings chart data (global)
        for i in range(7):
            day = today - timedelta(days=6-i)
            count = Booking.query.filter(func.date(Booking.booking_date) == day, Booking.is_deleted == False).count()
            chart_data.append(count)
            
        caisse = get_current_caisse(None)
        
        # Grouped stats for Super Admin
        stats_day = get_dashboard_stats(None, day_start, day_end)
        stats_week = get_dashboard_stats(None, week_start, day_end)
        stats_month = get_dashboard_stats(None, month_start, day_end)
        stats_all = get_dashboard_stats(None, datetime(2000, 1, 1), datetime(2100, 1, 1))
        
        # 6 Overview Metrics
        total_apartments = Apartment.query.filter_by(is_deleted=False).count()
        available_apartments = Apartment.query.filter_by(status='Disponible', is_deleted=False).count()
        total_promos = Bus.query.filter_by(is_promo=True, is_deleted=False).count()
        total_missions = Trip.query.filter_by(is_deleted=False).count()
        cars_out_count = db.session.query(Trip.bus_id).filter(
            Trip.departure_time <= datetime.now(),
            Trip.arrival_time >= datetime.now(),
            Trip.status != 'cancelled',
            Trip.is_deleted == False
        ).distinct().count()

        # Recent audit logs for Live Operations Feed
        recent_audit_logs = AuditLog.query.order_by(AuditLog.created_at.desc()).limit(20).all()

        from app.routes.missions import build_quick_actions_context
        return render_template('admin/dashboard.html',
                             is_super=True,
                             total_agencies=total_agencies,
                             total_users=total_users,
                             total_clients=total_users,
                             total_buses=total_buses,
                             total_vehicles=total_buses,
                             total_routes=total_routes,
                             total_missions=total_missions,
                             cars_out_count=cars_out_count,
                             total_apartments=total_apartments,
                             available_apartments=available_apartments,
                             total_promos=total_promos,
                             total_bookings=total_bookings,
                             total_feedback=total_feedback,
                             total_revenue=total_revenue,
                             total_parcel_revenue=total_parcel_revenue,
                             recent_bookings=recent_bookings,
                             todays_bookings=todays_bookings,
                             todays_revenue=todays_revenue,
                             todays_users=todays_users,
                             chart_labels=chart_labels,
                             chart_data=chart_data,
                             caisse=caisse,
                             stats_day=stats_day,
                             stats_week=stats_week,
                             stats_month=stats_month,
                             stats_all=stats_all,
                             recent_audit_logs=recent_audit_logs,
                             recent_visitors=recent_visitors,
                             **build_quick_actions_context())
                             
    else:
        # Agency Admin - Scoped stats
        agency = current_user.agency
        if not agency:
            flash('Erreur: Aucune agence associée à votre compte.', 'danger')
            return redirect(url_for('main.index'))
            
        total_buses = Bus.query.filter_by(agency_id=agency.id, is_deleted=False).count()
        total_routes = Route.query.filter_by(agency_id=agency.id, is_deleted=False).count()
        
        # Scoped trips
        trip_ids_query = db.session.query(Trip.id).join(Route).filter(Route.agency_id == agency.id, Trip.is_deleted == False)
        total_trips = trip_ids_query.count()
        
        # Scoped bookings
        bookings_query = Booking.query.filter(Booking.trip_id.in_(trip_ids_query), Booking.is_deleted == False)
        total_bookings = bookings_query.count()
        
        # Scoped feedback (via trips)
        total_feedback = Feedback.query.filter(Feedback.trip_id.in_(trip_ids_query)).count()
        
        # Scoped recent bookings
        recent_bookings = bookings_query.order_by(Booking.booking_date.desc().nulls_last()).limit(5).all()
        
        # Scoped revenue
        total_revenue = db.session.query(func.sum(Booking.price_paid)).join(Trip).join(Route).filter(
            Route.agency_id == agency.id,
            Booking.status == 'confirmed',
            Booking.is_deleted == False
        ).scalar() or 0
        
        # Total Parcel Revenue (agency)
        total_parcel_revenue = db.session.query(func.sum(Parcel.price)).filter(
            Parcel.agency_id == agency.id,
            Parcel.payment_status == 'paid',
            Parcel.status != 'cancelled'
        ).scalar() or 0
        
        # Scoped today's stats
        todays_bookings = Booking.query.filter(
            Booking.trip_id.in_(trip_ids_query),
            func.date(Booking.booking_date) == today,
            Booking.is_deleted == False
        ).count()
        
        todays_revenue = db.session.query(func.sum(Booking.price_paid)).filter(
            Booking.trip_id.in_(trip_ids_query),
            func.date(Booking.booking_date) == today,
            Booking.status == 'confirmed',
            Booking.is_deleted == False
        ).scalar() or 0
        todays_users = 0 # Users are global
        
        # 7-day bookings chart data (scoped)
        for i in range(7):
            day = today - timedelta(days=6-i)
            count = Booking.query.filter(
                Booking.trip_id.in_(trip_ids_query),
                func.date(Booking.booking_date) == day,
                Booking.is_deleted == False
            ).count()
            chart_data.append(count)
            
        caisse = get_current_caisse(agency.id)
        
        # Grouped stats for Agency Admin
        stats_day = get_dashboard_stats(agency.id, day_start, day_end)
        stats_week = get_dashboard_stats(agency.id, week_start, day_end)
        stats_month = get_dashboard_stats(agency.id, month_start, day_end)
        stats_all = get_dashboard_stats(agency.id, datetime(2000, 1, 1), datetime(2100, 1, 1))

        # 6 Overview Metrics
        total_apartments = Apartment.query.filter_by(is_deleted=False).count()
        available_apartments = Apartment.query.filter_by(status='Disponible', is_deleted=False).count()
        total_promos = Bus.query.filter_by(agency_id=agency.id, is_promo=True, is_deleted=False).count()
        total_missions = total_trips
        total_clients = User.query.filter_by(role='client', is_deleted=False).count()
        cars_out_count = db.session.query(Trip.bus_id).join(Route).filter(
            Route.agency_id == agency.id,
            Trip.departure_time <= datetime.now(),
            Trip.arrival_time >= datetime.now(),
            Trip.status != 'cancelled',
            Trip.is_deleted == False
        ).distinct().count()

        from app.routes.missions import build_quick_actions_context
        return render_template('admin/dashboard.html',
                             is_super=False,
                             agency=agency,
                             total_buses=total_buses,
                             total_vehicles=total_buses,
                             total_routes=total_routes,
                             total_trips=total_trips,
                             total_missions=total_missions,
                             total_clients=total_clients,
                             cars_out_count=cars_out_count,
                             total_apartments=total_apartments,
                             available_apartments=available_apartments,
                             total_promos=total_promos,
                             total_bookings=total_bookings,
                             total_feedback=total_feedback,
                             total_revenue=total_revenue,
                             total_parcel_revenue=total_parcel_revenue,
                             recent_bookings=recent_bookings,
                             todays_bookings=todays_bookings,
                             todays_revenue=todays_revenue,
                             todays_users=todays_users,
                             chart_labels=chart_labels,
                             chart_data=chart_data,
                             caisse=caisse,
                             stats_day=stats_day,
                             stats_week=stats_week,
                             stats_month=stats_month,
                             stats_all=stats_all,
                             recent_visitors=recent_visitors,
                             **build_quick_actions_context())


# === EXPORTS FOR DASHBOARD GROUPED STATS ===
@admin.route('/admin/dashboard/export/csv')
@login_required
@admin_required
def export_dashboard_csv():
    time_range = request.args.get('range', 'day')
    today = date.today()
    day_end = datetime.combine(today, datetime.max.time())
    
    if time_range == 'day':
        start_dt = datetime.combine(today, datetime.min.time())
        label = "Aujourd'hui"
    elif time_range == 'week':
        start_dt = datetime.combine(today - timedelta(days=6), datetime.min.time())
        label = "Cette Semaine"
    else:
        start_dt = datetime.combine(today - timedelta(days=29), datetime.min.time())
        label = "Ce Mois"
        
    agency_id = None if current_user.role == 'super_admin' else current_user.agency_id
    stats = get_dashboard_stats(agency_id, start_dt, day_end)
    
    import csv
    from io import StringIO
    from flask import make_response
    
    f = StringIO()
    writer = csv.writer(f)
    writer.writerow(["RAPPORT D'ACTIVITE - 3M SERVICES"])
    writer.writerow([f"Periode: {label} (de {start_dt.strftime('%d/%m/%Y')} a {day_end.strftime('%d/%m/%Y')})"])
    if current_user.role == 'super_admin':
        writer.writerow(["Agence: Plateforme Globale (Toutes)"])
    else:
        writer.writerow([f"Agence: {current_user.agency.name}"])
    writer.writerow([])
    
    writer.writerow(["CATEGORIE", "INDICATEUR", "VALEUR"])
    writer.writerow(["Revenue", "Chiffre d'Affaires", f"{stats['revenue']:.0f} FCFA"])
    
    writer.writerow(["Operations", "Voyages Total", stats['trips_count']])
    writer.writerow(["Operations", "Voyages Actifs", stats['active_trips']])
    writer.writerow(["Operations", "Voyages A Venir", stats['upcoming_trips']])
    writer.writerow(["Operations", "Voyages Annules", stats['cancelled_trips']])
    
    writer.writerow(["Customers", "Nouveaux Clients", stats['new_customers']])
    writer.writerow(["Customers", "Clients Actifs", stats['active_customers']])
    writer.writerow(["Customers", "Clients Fidele (Repeat)", stats['repeat_customers']])
    
    writer.writerow(["Bookings", "Reservations Total", stats['bookings_count']])
    writer.writerow(["Bookings", "Reservations En Attente", stats['pending_bookings']])
    writer.writerow(["Bookings", "Reservations Confirmees", stats['confirmed_bookings']])
    writer.writerow(["Bookings", "Reservations Annulees", stats['cancelled_bookings']])
    
    writer.writerow(["Fleet", "Bus Disponibles", stats['buses_active']])
    writer.writerow(["Fleet", "Bus en Maintenance", stats['buses_maint']])
    writer.writerow(["Fleet", "Chauffeurs Actifs (En Trajet)", stats['drivers_active']])
    
    output = make_response(f.getvalue())
    output.headers["Content-Disposition"] = f"attachment; filename=dashboard_report_{time_range}.csv"
    output.headers["Content-type"] = "text/csv"
    return output


@admin.route('/admin/dashboard/export/pdf')
@login_required
@admin_required
def export_dashboard_pdf():
    time_range = request.args.get('range', 'day')
    today = date.today()
    day_end = datetime.combine(today, datetime.max.time())
    
    if time_range == 'day':
        start_dt = datetime.combine(today, datetime.min.time())
        label = "Aujourd'hui"
    elif time_range == 'week':
        start_dt = datetime.combine(today - timedelta(days=6), datetime.min.time())
        label = "Cette Semaine"
    else:
        start_dt = datetime.combine(today - timedelta(days=29), datetime.min.time())
        label = "Ce Mois"
        
    agency_id = None if current_user.role == 'super_admin' else current_user.agency_id
    stats = get_dashboard_stats(agency_id, start_dt, day_end)
    
    try:
        import io
        from flask import send_file
        from reportlab.lib.pagesizes import letter
        from reportlab.pdfgen import canvas
        
        buffer = io.BytesIO()
        p = canvas.Canvas(buffer, pagesize=letter)
        
        draw_pdf_header(p, "3M SERVICES — RAPPORT D'ACTIVITE")
        
        p.setFont("Helvetica", 10)
        p.setFillColorRGB(0.2, 0.2, 0.2)
        p.drawString(50, 720, f"Periode: {label} (du {start_dt.strftime('%d/%m/%Y')} au {day_end.strftime('%d/%m/%Y')})")
        agency_name = "Plateforme Globale (Toutes)" if current_user.role == 'super_admin' else current_user.agency.name
        p.drawString(50, 705, f"Agence: {agency_name}")
        p.drawString(50, 690, f"Genere le: {datetime.now().strftime('%d/%m/%Y %H:%M')}")
        p.line(50, 680, 560, 680)
        
        # Render sections
        y = 650
        sections = [
            ("Revenue", [
                ("Chiffre d'Affaires", f"{stats['revenue']:.0f} FCFA")
            ]),
            ("Operations", [
                ("Voyages Total", str(stats['trips_count'])),
                ("Voyages Actifs (En Cours)", str(stats['active_trips'])),
                ("Voyages A Venir", str(stats['upcoming_trips'])),
                ("Voyages Annules", str(stats['cancelled_trips']))
            ]),
            ("Customers", [
                ("Nouveaux Clients", str(stats['new_customers'])),
                ("Clients Actifs", str(stats['active_customers'])),
                ("Clients Fideles (Repeat)", str(stats['repeat_customers']))
            ]),
            ("Bookings", [
                ("Reservations Total", str(stats['bookings_count'])),
                ("Reservations En Attente", str(stats['pending_bookings'])),
                ("Reservations Confirmees", str(stats['confirmed_bookings'])),
                ("Reservations Annulees", str(stats['cancelled_bookings']))
            ]),
            ("Fleet & Drivers", [
                ("Bus Disponibles", str(stats['buses_active'])),
                ("Bus en Maintenance", str(stats['buses_maint'])),
                ("Chauffeurs Actifs (En Trajet)", str(stats['drivers_active']))
            ])
        ]
        
        for sec_title, items in sections:
            if y < 100:
                p.showPage()
                y = 750
                p.setFont("Helvetica-Bold", 12)
                p.setFillColorRGB(0.79, 0.16, 0.16)
                p.drawString(50, y, f"Suite du Rapport - {label}")
                p.line(50, y-10, 560, y-10)
                y -= 30
                
            p.setFont("Helvetica-Bold", 12)
            p.setFillColorRGB(0.79, 0.16, 0.16)
            p.drawString(50, y, sec_title.upper())
            p.line(50, y-5, 560, y-5)
            y -= 20
            
            p.setFont("Helvetica", 10)
            p.setFillColorRGB(0, 0, 0)
            for name, value in items:
                p.drawString(70, y, name)
                p.drawRightString(540, y, value)
                y -= 15
            y -= 10
            
        p.showPage()
        p.save()
        buffer.seek(0)
        return send_file(buffer, as_attachment=True, download_name=f"dashboard_report_{time_range}.pdf", mimetype='application/pdf')
    except Exception as e:
        import logging
        logging.error(f"Error exporting dashboard to PDF: {e}")
        flash("Erreur lors de l'export PDF.", "danger")
        return redirect(url_for('admin.dashboard'))

# === SUPER ADMIN: CRUD AGENCIES ===
@admin.route('/admin/agencies')
@login_required
@super_admin_required
def agencies():
    agencies = Agency.query.filter_by(is_deleted=False).all()
    return render_template('admin/agencies.html', agencies=agencies)

@admin.route('/manage_contact_message/<int:msg_id>', methods=['POST'])
@login_required
@admin_required
def manage_contact_message(msg_id):
    from app.models import ContactMessage
    msg = ContactMessage.query.get_or_404(msg_id)
    action = request.form.get('action')
    if action == 'mark_read':
        msg.is_read = True
    elif action == 'delete':
        msg.is_deleted = True
    db.session.commit()
    return jsonify({"success": True})
@admin.route('/admin/add_agency', methods=['GET', 'POST'])
@login_required
@super_admin_required
def add_agency():
    if request.method == 'POST':
        name = request.form.get('name')
        city = request.form.get('city')
        address = request.form.get('address')
        phone = request.form.get('phone')
        email = request.form.get('email')
        
        if not name or not city:
            flash('Le nom et la ville de l\'agence sont obligatoires.', 'danger')
            return redirect(url_for('admin.add_agency'))
            
        agency = Agency(name=name, city=city, address=address, phone=phone, email=email)
        db.session.add(agency)
        db.session.commit()
        
        log_audit("AGENCY_CREATED", "Agency", agency.id, f"Created new agency: {agency.name}")
        trigger_notification(
            "🏢 Nouvelle Agence Enregistrée",
            f"L'agence '{agency.name}' (Ville: {agency.city}) a été enregistrée sur la plateforme.",
            "success", category='agency_mgmt', role_target='super_admin'
        )
        
        flash('Agence ajoutée avec succès !', 'success')
        return redirect(url_for('admin.agencies'))
        
    return render_template('admin/add_agency.html')

@admin.route('/admin/agency/edit/<int:id>', methods=['GET', 'POST'])
@login_required
@super_admin_required
def edit_agency(id):
    agency = Agency.query.filter_by(id=id, is_deleted=False).first_or_404()
    if request.method == 'POST':
        agency.name = request.form.get('name')
        agency.city = request.form.get('city')
        agency.address = request.form.get('address')
        agency.phone = request.form.get('phone')
        agency.email = request.form.get('email')
        
        db.session.commit()
        log_audit("AGENCY_EDITED", "Agency", agency.id, f"Updated details for agency: {agency.name}")
        trigger_notification(
            "✏️ Profil Agence Modifié",
            f"Le profil de l'agence '{agency.name}' a été mis à jour.",
            "info", category='agency_mgmt', role_target='super_admin'
        )
        flash('Agence modifiée avec succès !', 'success')
        return redirect(url_for('admin.agencies'))
        
    return render_template('admin/edit_agency.html', agency=agency)

@admin.route('/admin/agency/toggle_status/<int:id>')
@login_required
@super_admin_required
def toggle_agency_status(id):
    agency = Agency.query.filter_by(id=id, is_deleted=False).first_or_404()
    agency.is_suspended = not agency.is_suspended
    db.session.commit()
    
    status_str = "SUSPENDUE" if agency.is_suspended else "ACTIVÉE"
    alert_type = "danger" if agency.is_suspended else "success"
    log_audit("AGENCY_STATUS_TOGGLED", "Agency", agency.id, f"Toggled suspension status of {agency.name} to {agency.is_suspended}")
    trigger_notification(
        f"{'🔴' if agency.is_suspended else '🟢'} Agence {status_str}",
        f"L'agence '{agency.name}' a été {status_str.lower()} sur la plateforme.",
        alert_type, category='agency_mgmt', role_target='super_admin'
    )
    
    flash(f"L'agence a été {status_str.lower()} avec succès !", 'success')
    return redirect(url_for('admin.agencies'))

@admin.route('/admin/agency/delete/<int:id>')
@login_required
@super_admin_required
def delete_agency(id):
    agency = Agency.query.filter_by(id=id, is_deleted=False).first_or_404()
    
    # Dependency Check: Do not delete if active buses/routes exist
    active_buses = Bus.query.filter_by(agency_id=agency.id, is_deleted=False).count()
    active_routes = Route.query.filter_by(agency_id=agency.id, is_deleted=False).count()
    if active_buses > 0 or active_routes > 0:
        flash(f"Impossible de supprimer l'agence '{agency.name}' car elle contient {active_buses} bus et {active_routes} lignes actifs. Supprimez ou réassignez ces ressources d'abord.", 'danger')
        return redirect(url_for('admin.agencies'))
        
    agency.is_deleted = True
    agency.deleted_at = datetime.utcnow()
    db.session.commit()
    
    log_audit("AGENCY_DELETED", "Agency", agency.id, f"Soft-deleted agency: {agency.name}")
    trigger_notification(
        "🗑️ Agence Supprimée",
        f"L'agence '{agency.name}' a été supprimée (Soft Delete). Données conservées pour audit.",
        "warning", category='agency_mgmt', role_target='super_admin'
    )
    
    flash('Agence supprimée avec succès (Soft Delete) !', 'success')
    return redirect(url_for('admin.agencies'))

# === SUPER ADMIN: CRUD AGENCY ADMINS ===
@admin.route('/admin/admins')
@login_required
@super_admin_required
def admins():
    admins = User.query.filter_by(role='admin_agence', is_deleted=False).all()
    return render_template('admin/admins.html', admins=admins)

@admin.route('/admin/add_admin', methods=['GET', 'POST'])
@login_required
@admin_required
def add_admin():
    if request.method == 'POST':
        username = request.form.get('username')
        email = request.form.get('email')
        phone = request.form.get('phone')
        password = request.form.get('password')
        
        role = request.form.get('role', 'admin_agence')
        
        # Enforce agency logic based on creator's role
        if current_user.role == 'super_admin':
            agency_id = request.form.get('agency_id')
        else:
            agency_id = current_user.agency_id
            
        if not all([username, email, password, agency_id]):
            flash('Veuillez remplir tous les champs obligatoires.', 'danger')
            return redirect(url_for('admin.add_admin'))
            
        user = User.query.filter_by(username=username).first()
        if user:
            flash('Ce nom d\'utilisateur est déjà pris.', 'danger')
            return redirect(url_for('admin.add_admin'))
            
        existing_email = User.query.filter_by(email=email).first()
        if existing_email:
            flash('Cette adresse email est déjà enregistrée. Veuillez en utiliser une autre.', 'danger')
            return redirect(url_for('admin.add_admin'))
            
        from app.utils.validators import is_valid_password, is_valid_phone
        if phone and not is_valid_phone(phone):
            flash('Format de numéro de téléphone invalide.', 'danger')
            return redirect(url_for('admin.add_admin'))
            
        if not is_valid_password(password, username=username, email=email):
            flash('Le mot de passe doit contenir au moins 8 caractères, 1 minuscule, 1 chiffre et 1 caractère spécial.', 'danger')
            return redirect(url_for('admin.add_admin'))
            
        try:
            new_admin = User(
                username=username,
                email=email,
                phone=phone,
                role=role,
                agency_id=int(agency_id)
            )
            new_admin.set_password(password)
            db.session.add(new_admin)
            db.session.commit()
            
            log_audit("STAFF_CREATED", "User", new_admin.id, f"Created {role} user: {new_admin.username}")
            trigger_notification(
                "🔐 Nouveau Compte Admin Créé",
                f"Un compte '{role}' a été créé pour '{new_admin.username}' ({new_admin.email}) par {current_user.username}.",
                "warning", category='security', role_target='super_admin'
            )
            
            flash('Membre du personnel créé avec succès !', 'success')
            return redirect(url_for('admin.admins'))
        except Exception as e:
            db.session.rollback()
            import logging
            logging.error(f"Error creating admin: {e}")
            flash('Une erreur est survenue lors de la création du personnel.', 'danger')
            return redirect(url_for('admin.add_admin'))
        
    agencies = Agency.query.filter_by(is_deleted=False).all() if current_user.role == 'super_admin' else []
    return render_template('admin/add_admin.html', agencies=agencies)

@admin.route('/admin/admin/edit/<int:id>', methods=['GET', 'POST'])
@login_required
@super_admin_required
def edit_admin(id):
    admin_user = User.query.filter(User.id == id, User.role != 'client', User.is_deleted == False).first_or_404()
    if request.method == 'POST':
        admin_user.username = request.form.get('username')
        
        new_email = request.form.get('email')
        if new_email and new_email != admin_user.email:
            existing = User.query.filter_by(email=new_email).first()
            if existing:
                flash(f"L'adresse email {new_email} est déjà utilisée.", 'danger')
                return redirect(url_for('admin.edit_admin', id=id))
            admin_user.email = new_email
            
        admin_user.phone = request.form.get('phone')
        admin_user.agency_id = int(request.form.get('agency_id'))
        
        password = request.form.get('password')
        if password:
            from app.utils.validators import is_valid_password
            if not is_valid_password(password, username=admin_user.username, email=admin_user.email):
                flash('Le mot de passe doit contenir au moins 8 caractères, 1 minuscule, 1 chiffre et 1 caractère spécial.', 'danger')
                return redirect(url_for('admin.edit_admin', id=id))
            admin_user.set_password(password)
            
        db.session.commit()
        log_audit("ADMIN_EDITED", "User", admin_user.id, f"Updated admin user: {admin_user.username}")
        flash('Administrateur modifié avec succès !', 'success')
        return redirect(url_for('admin.admins'))
        
    agencies = Agency.query.filter_by(is_deleted=False).all()
    return render_template('admin/edit_admin.html', admin=admin_user, agencies=agencies)

@admin.route('/admin/admin/toggle_status/<int:id>')
@login_required
@super_admin_required
def toggle_admin_status(id):
    admin_user = User.query.filter(User.id == id, User.role != 'client', User.is_deleted == False).first_or_404()
    admin_user.is_suspended = not admin_user.is_suspended
    db.session.commit()
    
    status_str = "SUSPENDU" if admin_user.is_suspended else "ACTIVÉ"
    log_audit("ADMIN_STATUS_TOGGLED", "User", admin_user.id, f"Toggled administrator account status to {admin_user.is_suspended}")
    
    flash(f"Compte administrateur {status_str.lower()} avec succès !", 'success')
    return redirect(url_for('admin.admins'))

@admin.route('/admin/admin/delete/<int:id>')
@login_required
@super_admin_required
def delete_admin(id):
    admin_user = User.query.filter(User.id == id, User.role != 'client', User.is_deleted == False).first_or_404()
    admin_user.is_deleted = True
    admin_user.deleted_at = datetime.utcnow()
    db.session.commit()
    
    log_audit("ADMIN_DELETED", "User", admin_user.id, f"Soft-deleted admin user: {admin_user.username}")
    flash('Compte administrateur supprimé avec succès !', 'success')
    return redirect(url_for('admin.admins'))

def _upsert_visitor_user(name, phone='', location='', city='', email='', ip_addr=None):
    """Upsert a site visitor/customer into the Flask User table (role='client')."""
    clean_name = (name or '').strip()
    clean_phone = (phone or '').strip()
    clean_loc = (location or city or '').strip()
    clean_city = (city or clean_loc or 'Yaoundé').strip()
    clean_email = (email or '').strip()

    if not clean_name and not clean_phone:
        return None

    user = None
    if clean_email:
        user = User.query.filter_by(email=clean_email, is_deleted=False).first()

    if not user and clean_phone:
        phone_digits = "".join(c for c in clean_phone if c.isdigit())
        user = User.query.filter_by(phone=clean_phone, is_deleted=False).first()
        if not user and len(phone_digits) >= 8:
            suffix = phone_digits[-8:]
            for cand in User.query.filter_by(role='client', is_deleted=False).all():
                c_digits = "".join(c for c in (cand.phone or '') if c.isdigit())
                if c_digits and c_digits.endswith(suffix):
                    user = cand
                    break

    if not user and clean_name:
        user = User.query.filter_by(role='client', real_name=clean_name, is_deleted=False).first()

    if user:
        if clean_name and (not user.real_name or clean_name != 'Visiteur Site 3M'):
            user.real_name = clean_name
            parts = clean_name.split(' ', 1)
            user.first_name = parts[0]
            user.last_name = parts[1] if len(parts) > 1 else (user.last_name or '')
        if clean_phone:
            user.phone = clean_phone
        if clean_loc:
            user.address = clean_loc
        if clean_city:
            user.city = clean_city
        if ip_addr:
            user.last_login_ip = ip_addr
    else:
        base_slug = "".join(c for c in (clean_name or 'visiteur').lower() if c.isalnum())[:12] or "visiteur"
        uname = f"{base_slug}_{random.randint(1000, 9999)}"
        while User.query.filter_by(username=uname).first():
            uname = f"{base_slug}_{random.randint(1000, 99999)}"

        uemail = clean_email if (clean_email and not User.query.filter_by(email=clean_email).first()) else f"{uname}@visiteur.3mservices.cm"
        parts = (clean_name or 'Visiteur VIP').split(' ', 1)
        user = User(
            username=uname,
            email=uemail,
            phone=clean_phone or '+237 690 00 00 00',
            real_name=clean_name or 'Visiteur VIP',
            first_name=parts[0],
            last_name=parts[1] if len(parts) > 1 else '',
            city=clean_city,
            address=clean_loc or clean_city,
            role='client',
            last_login_ip=ip_addr
        )
        user.set_password(clean_phone or '3MServices2026!')
        db.session.add(user)

    db.session.flush()
    return user


def _sync_visitor_to_db_json(name, phone, location, city='', email='', page='/', ip_addr=None):
    """Persist visitor entry into Express server/data/db.json (`visitors` and `customers`)."""
    db_path = os.path.join(os.path.dirname(os.path.dirname(os.path.dirname(__file__))), 'server', 'data', 'db.json')
    try:
        exp_db = {}
        if os.path.exists(db_path):
            with open(db_path, 'r', encoding='utf-8') as f:
                exp_db = json.load(f)

        visitors = exp_db.setdefault('visitors', [])
        customers = exp_db.setdefault('customers', [])
        now_iso = datetime.utcnow().isoformat() + 'Z'
        phone_digits = "".join(c for c in (phone or '') if c.isdigit())

        # Upsert visitor entry
        existing_v = next(
            (v for v in visitors if (phone_digits and "".join(c for c in (v.get('phone') or '') if c.isdigit()).endswith(phone_digits[-8:])) or (name and v.get('name', '').lower() == name.lower())),
            None
        )
        if existing_v:
            existing_v['name'] = name or existing_v.get('name')
            existing_v['phone'] = phone or existing_v.get('phone')
            existing_v['location'] = location or existing_v.get('location')
            existing_v['city'] = city or location or existing_v.get('city')
            existing_v['lastPage'] = page or existing_v.get('lastPage', '/')
            existing_v['visitCount'] = int(existing_v.get('visitCount', 1)) + 1
            existing_v['lastVisitedAt'] = now_iso
        else:
            visitors.insert(0, {
                'id': f"VIS-{random.randint(100000, 999999)}",
                'name': name,
                'phone': phone,
                'location': location or city or 'Yaoundé',
                'city': city or location or 'Yaoundé',
                'email': email or '',
                'lastPage': page or '/',
                'ip': ip_addr or '',
                'visitCount': 1,
                'createdAt': now_iso,
                'lastVisitedAt': now_iso
            })

        # Upsert customer summary entry
        existing_c = next(
            (c for c in customers if (phone_digits and "".join(c for c in (c.get('phone') or '') if c.isdigit()).endswith(phone_digits[-8:])) or (email and c.get('email', '').lower() == email.lower())),
            None
        )
        if existing_c:
            existing_c['name'] = name or existing_c.get('name')
            existing_c['phone'] = phone or existing_c.get('phone')
            existing_c['address'] = location or existing_c.get('address')
            existing_c['city'] = city or location or existing_c.get('city', 'Yaoundé')
        else:
            customers.insert(0, {
                'id': f"CUST-{random.randint(100000, 999999)}",
                'accountNumber': f"3M-CLI-{random.randint(1000, 9999)}",
                'name': name,
                'phone': phone,
                'email': email or '',
                'city': city or location or 'Yaoundé',
                'address': location or city or 'Yaoundé',
                'type': 'Visiteur Site VIP',
                'tier': 'Bronze VIP',
                'status': 'Actif VIP',
                'createdAt': now_iso
            })

        os.makedirs(os.path.dirname(db_path), exist_ok=True)
        with open(db_path, 'w', encoding='utf-8') as f:
            json.dump(exp_db, f, indent=2, ensure_ascii=False)
    except Exception as e:
        current_app.logger.warning(f"Error syncing visitor to db.json: {e}")


def sync_visitors_and_customers_from_db_json():
    """Ensure visitors and customers recorded on the React portal appear in Flask User table."""
    db_path = os.path.join(os.path.dirname(os.path.dirname(os.path.dirname(__file__))), 'server', 'data', 'db.json')
    if not os.path.exists(db_path):
        return
    try:
        with open(db_path, 'r', encoding='utf-8') as f:
            exp_db = json.load(f)
        changed = False
        for entry in (exp_db.get('visitors', []) + exp_db.get('customers', [])):
            v_name = (entry.get('name') or entry.get('clientName') or '').strip()
            v_phone = (entry.get('phone') or '').strip()
            v_loc = (entry.get('location') or entry.get('address') or entry.get('city') or '').strip()
            v_city = (entry.get('city') or v_loc or 'Yaoundé').strip()
            v_email = (entry.get('email') or '').strip()
            if v_name or v_phone:
                _upsert_visitor_user(v_name, v_phone, v_loc, v_city, v_email)
                changed = True
        if changed:
            db.session.commit()
    except Exception as e:
        db.session.rollback()
        current_app.logger.warning(f"Error syncing visitors from db.json: {e}")


@admin.route('/api/visitor-checkin', methods=['POST', 'OPTIONS'])
def api_visitor_checkin():
    """Public CORS endpoint capturing client name, number, and location when visiting the site."""
    cors_headers = {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization',
        'Access-Control-Allow-Methods': 'POST, OPTIONS'
    }
    if request.method == 'OPTIONS':
        return ('', 200, cors_headers)

    data = request.get_json(silent=True) or request.form or {}
    name = (data.get('name') or data.get('clientName') or '').strip()
    phone = (data.get('phone') or data.get('number') or '').strip()
    location = (data.get('location') or data.get('address') or data.get('city') or '').strip()
    city = (data.get('city') or location or 'Yaoundé').strip()
    email = (data.get('email') or '').strip()
    page = (data.get('page') or '/').strip()

    if not name or not phone or not location:
        return (jsonify({'error': 'Veuillez renseigner votre nom, numéro et localisation.'}), 400, cors_headers)

    user = _upsert_visitor_user(name, phone, location, city, email, ip_addr=request.remote_addr)
    db.session.commit()
    _sync_visitor_to_db_json(name, phone, location, city, email, page=page, ip_addr=request.remote_addr)

    log_audit("VISITOR_CHECKIN", "User", user.id if user else 0, f"Site visitor check-in: {name} | {phone} | {location}")
    trigger_notification(
        title=f"👋 Visiteur Client sur le Site : {name}",
        message=f"• Nom : {name}\n• Numéro : {phone}\n• Localisation : {location}\n• Page visitée : {page}",
        type="info",
        category="booking",
        role_target="super_admin"
    )

    resp_data = {
        'status': 'ok',
        'client': {
            'id': user.id if user else None,
            'name': user.real_name if user else name,
            'phone': user.phone if user else phone,
            'location': (user.address or user.city) if user else location
        }
    }
    return (jsonify(resp_data), 200, cors_headers)


# === COMMON ADMIN: VIEW USERS ===
@admin.route('/admin/users', methods=['GET', 'POST'])
@login_required
@admin_required
def users():
    if request.method == 'POST':
        v_name = (request.form.get('name') or '').strip()
        v_phone = (request.form.get('phone') or '').strip()
        v_location = (request.form.get('location') or '').strip()
        v_email = (request.form.get('email') or '').strip()
        if not v_name or not v_phone or not v_location:
            flash("Veuillez renseigner le nom, le numéro et la localisation du client.", "danger")
            return redirect(url_for('admin.users'))
        user = _upsert_visitor_user(v_name, v_phone, v_location, v_location, v_email, ip_addr=request.remote_addr)
        db.session.commit()
        _sync_visitor_to_db_json(v_name, v_phone, v_location, v_location, v_email, page='/admin/users', ip_addr=request.remote_addr)
        log_audit("VISITOR_ADDED", "User", user.id if user else 0, f"Admin added client/visitor: {v_name} ({v_phone}, {v_location})")
        flash(f"Client '{v_name}' enregistré avec succès ({v_location}).", "success")
        return redirect(url_for('admin.users'))

    sync_visitors_and_customers_from_db_json()
    if current_user.role == 'super_admin':
        users = User.query.filter_by(role='client', is_deleted=False).order_by(User.created_at.desc(), User.id.desc()).all()
    else:
        # Scoped view of users who booked with current admin's agency or visited recently
        trip_ids_query = db.session.query(Trip.id).join(Route).filter(Route.agency_id == current_user.agency_id, Trip.is_deleted == False)
        users = User.query.join(Booking).filter(
            Booking.trip_id.in_(trip_ids_query),
            Booking.is_deleted == False,
            User.is_deleted == False,
            User.role == 'client'
        ).distinct().all()
    return render_template('admin/users.html', users=users)

@admin.route('/admin/user/edit/<int:id>', methods=['GET', 'POST'])
@login_required
@admin_required
def edit_user(id):
    user = User.query.filter_by(id=id, is_deleted=False).first_or_404()
    
    # Redirect if it's an admin/staff being edited through the user route
    if user.role != 'client':
        if current_user.role == 'super_admin':
            return redirect(url_for('admin.edit_admin', id=id))
        else:
            flash("Accès refusé.", "danger")
            return redirect(url_for('admin.users'))

    if request.method == 'POST':
        user.username = request.form.get('username')
        user.email = request.form.get('email')
        real_name_val = (request.form.get('real_name') or '').strip()
        if real_name_val:
            user.real_name = real_name_val
        city_val = (request.form.get('city') or '').strip()
        address_val = (request.form.get('address') or request.form.get('location') or '').strip()
        if city_val:
            user.city = city_val
        if address_val:
            user.address = address_val

        phone_val = request.form.get('phone')
        from app.utils.validators import is_valid_phone
        if phone_val and not is_valid_phone(phone_val):
            flash('Format de numéro de téléphone invalide.', 'danger')
            return redirect(url_for('admin.edit_user', id=id))
        user.phone = phone_val
        
        password = request.form.get('password')
        if password:
            from app.utils.validators import is_valid_password
            if not is_valid_password(password, username=user.username, email=user.email):
                flash('Le mot de passe doit contenir au moins 8 caractères, 1 minuscule, 1 chiffre et 1 caractère spécial.', 'danger')
                return redirect(url_for('admin.edit_user', id=id))
            user.set_password(password)
            
        db.session.commit()
        log_audit("CLIENT_EDITED", "User", user.id, f"Edited client user details: {user.username}")
        flash('Compte client modifié avec succès !', 'success')
        return redirect(url_for('admin.users'))
        
    chat = None
    try:
        import json as _json
        db_path = os.path.join(os.path.dirname(os.path.dirname(os.path.dirname(__file__))), 'server', 'data', 'db.json')
        if os.path.exists(db_path):
            with open(db_path, 'r', encoding='utf-8') as f:
                exp_db = _json.load(f)
            chats = exp_db.get('chats', [])
            raw_id = user.username
            chat = next((c for c in chats if c.get('id') == raw_id or c.get('clientId') == raw_id or (user.phone and user.phone in (c.get('clientPhone') or '')) or (user.email and user.email == c.get('clientEmail'))), None)
    except Exception as e:
        logger.warning(f"Error loading client chat in edit_user: {e}")

    return render_template('admin/edit_user.html', user=user, chat=chat)

@admin.route('/admin/user/toggle_status/<int:id>')
@login_required
@admin_required
def toggle_user_status(id):
    user = User.query.filter_by(id=id, role='client', is_deleted=False).first_or_404()
    user.is_suspended = not user.is_suspended
    db.session.commit()
    
    status_str = "SUSPENDU" if user.is_suspended else "ACTIVÉ"
    log_audit("CLIENT_STATUS_TOGGLED", "User", user.id, f"Toggled client user suspension status to {user.is_suspended}")
    
    flash(f"Compte client {status_str.lower()} avec succès !", 'success')
    return redirect(url_for('admin.users'))

@admin.route('/admin/user/delete/<int:id>')
@login_required
@admin_required
def delete_user(id):
    user = User.query.filter_by(id=id, role='client', is_deleted=False).first_or_404()
    
    # Capture PII for Super Admin Audit & Notification before wiping
    pii_details = (
        f"Nom: {user.first_name} {user.last_name} | "
        f"Tel: {user.phone} | Momo: {user.momo_number} | "
        f"Ville: {user.city} | Adresse: {user.address} | "
        f"Email: {user.email}"
    )

    # GDPR Anonymization to preserve booking statistics without storing PII
    user.is_deleted = True
    user.deleted_at = datetime.utcnow()
    user.username = f"anonyme_client_{user.id}"
    user.email = f"anonyme_{user.id}@3mservice.shop"
    user.phone = None
    user.real_name = None
    user.first_name = None
    user.last_name = None
    user.address = None
    user.city = None
    user.momo_number = None
    user.orange_number = None
    user.profile_picture = None
    
    if user.firebase_uid:
        import firebase_admin
        from firebase_admin import auth as firebase_auth
        try:
            firebase_auth.delete_user(user.firebase_uid)
        except Exception as e:
            import logging
            logging.error(f"Failed to delete user {user.firebase_uid} from Firebase: {e}")
        user.firebase_uid = None
    
    # Anonymize booking passenger names to strictly remove PII from the agency UI
    from app.models import Booking
    for booking in user.bookings:
        booking.passenger_name = f"Anonyme #{user.id}"
        
    db.session.commit()
    
    # Log audit with PII details
    log_audit("CLIENT_ANONYMIZED_GDPR", "User", user.id, f"Client supprimé. Infos originales: {pii_details}")
    
    # Notify super admin with the PII
    from app.routes.admin import trigger_notification
    trigger_notification(
        title="Client Supprimé (RGPD)",
        message=f"Le compte client #{user.id} a été supprimé. Données effacées: {pii_details}",
        type="warning",
        category="security",
        role_target="super_admin"
    )
    
    flash('Compte client supprimé et anonymisé (RGPD) avec succès !', 'success')
    return redirect(url_for('admin.users'))

# === AGENCY ADMIN: CRUD DRIVERS ===
@admin.route('/admin/drivers')
@login_required
@admin_required
def drivers():
    if current_user.role == 'super_admin':
        drivers = Driver.query.filter_by(is_deleted=False).all()
    else:
        drivers = Driver.query.filter_by(agency_id=current_user.agency_id, is_deleted=False).all()
    return render_template('admin/drivers.html', drivers=drivers)

@admin.route('/admin/add_driver', methods=['GET', 'POST'])
@login_required
@admin_required
def add_driver():
    if request.method == 'POST':
        name = request.form.get('name')
        phone = request.form.get('phone')
        license_number = request.form.get('license_number')
        license_expiration_str = request.form.get('license_expiration')
        agency_id = request.form.get('agency_id') if current_user.role == 'super_admin' else current_user.agency_id
        
        license_expiration = None
        if license_expiration_str:
            try:
                license_expiration = datetime.strptime(license_expiration_str, '%Y-%m-%d').date()
            except ValueError:
                flash('Format de date invalide.', 'danger')
                return redirect(url_for('admin.add_driver'))
                
        from app.utils.validators import is_valid_phone
        if phone and not is_valid_phone(phone):
            flash('Format de numéro de téléphone invalide.', 'danger')
            return redirect(url_for('admin.add_driver'))
                
        driver_id = request.form.get('driver_id')
        driver_id = int(driver_id) if driver_id else None
        
        driver = Driver(
            name=name,
            phone=phone,
            license_number=license_number,
            license_expiration=license_expiration,
            agency_id=agency_id,
            rating=request.form.get('rating', type=float) or 4.9
        )
        db.session.add(driver)
        db.session.commit()
        log_audit("DRIVER_CREATED", "Driver", driver.id, f"Added driver {name}")
        flash('Chauffeur ajouté avec succès!', 'success')
        return redirect(url_for('admin.drivers'))
        
    agencies = Agency.query.filter_by(is_deleted=False).all() if current_user.role == 'super_admin' else []
    return render_template('admin/add_driver.html', agencies=agencies)

@admin.route('/admin/edit_driver/<int:id>', methods=['GET', 'POST'])
@login_required
@admin_required
def edit_driver(id):
    driver = Driver.query.get_or_404(id)
    if current_user.role != 'super_admin' and driver.agency_id != current_user.agency_id:
        flash('Accès refusé.', 'danger')
        return redirect(url_for('admin.drivers'))
        
    if request.method == 'POST':
        driver.name = request.form.get('name')
        driver.phone = request.form.get('phone')
        driver.license_number = request.form.get('license_number')
        driver.status = request.form.get('status', 'available')
        rating_input = request.form.get('rating', type=float)
        if rating_input is not None:
            driver.rating = rating_input
        license_expiration_str = request.form.get('license_expiration')
        
        if current_user.role == 'super_admin':
            driver.agency_id = request.form.get('agency_id', driver.agency_id)
            
        if license_expiration_str:
            try:
                driver.license_expiration = datetime.strptime(license_expiration_str, '%Y-%m-%d').date()
            except ValueError:
                pass
                
        db.session.commit()
        log_audit("DRIVER_UPDATED", "Driver", driver.id, f"Updated driver {driver.name}")
        flash('Chauffeur mis à jour!', 'success')
        return redirect(url_for('admin.drivers'))
        
    agencies = Agency.query.filter_by(is_deleted=False).all() if current_user.role == 'super_admin' else []
    return render_template('admin/edit_driver.html', driver=driver, agencies=agencies)

@admin.route('/admin/delete_driver/<int:id>')
@login_required
@admin_required
def delete_driver(id):
    driver = Driver.query.get_or_404(id)
    if current_user.role != 'super_admin' and driver.agency_id != current_user.agency_id:
        flash('Accès refusé.', 'danger')
        return redirect(url_for('admin.drivers'))
        
    driver.is_deleted = True
    driver.deleted_at = datetime.utcnow()
    db.session.commit()
    log_audit("DRIVER_DELETED", "Driver", driver.id, f"Soft deleted driver {driver.name}")
    flash('Chauffeur supprimé de la base.', 'success')
    return redirect(url_for('admin.drivers'))

# === AGENCY ADMIN: CRUD BUSES ===
@admin.route('/admin/buses')
@login_required
@admin_required
def buses():
    if current_user.role == 'super_admin':
        buses = Bus.query.filter_by(is_deleted=False).all()
    else:
        buses = Bus.query.filter_by(agency_id=current_user.agency_id, is_deleted=False).all()
    return render_template('admin/buses.html', buses=buses)

@admin.route('/admin/add_bus', methods=['GET', 'POST'])
@login_required
@admin_required
def add_bus():
    if request.method == 'POST':
        bus_number = request.form.get('bus_number')
        brand = request.form.get('brand')
        model = request.form.get('model')
        capacity = request.form.get('capacity')
        driver_name = request.form.get('driver_name')
        last_maintenance_date_str = request.form.get('last_maintenance_date')
        maintenance_notes = request.form.get('maintenance_notes')
        agency_id = request.form.get('agency_id') if current_user.role == 'super_admin' else current_user.agency_id
        
        if not all([bus_number, model, capacity, agency_id]):
            flash('Veuillez remplir tous les champs.', 'danger')
            return redirect(url_for('admin.add_bus'))
        
        try:
            capacity = int(capacity)
            last_maintenance_date = datetime.strptime(last_maintenance_date_str, '%Y-%m-%d') if last_maintenance_date_str else None
            division = request.form.get('division', 'LOCATION').strip()
            release_date = request.form.get('release_date', '').strip()
            bus = Bus(
                bus_number=bus_number, 
                brand=brand, 
                model=model, 
                capacity=capacity,
                driver_name=driver_name,
                last_maintenance_date=last_maintenance_date,
                maintenance_notes=maintenance_notes,
                agency_id=int(agency_id),
                division=division,
                release_date=release_date,
                is_promo=('is_promo' in request.form),
                promo_price=request.form.get('promo_price', type=int),
                regular_price=request.form.get('regular_price', type=int),
                promo_badge=request.form.get('promo_badge', '').strip()
            )
            db.session.add(bus)
            db.session.flush() # Populate bus ID to link the driver
            if driver_name:
                driver = Driver.query.filter_by(name=driver_name, agency_id=bus.agency_id, is_deleted=False).first()
                if driver:
                    driver.current_bus_id = bus.id
            db.session.commit()
            
            log_audit("BUS_CREATED", "Bus", bus.id, f"Registered VIP vehicle: {bus.bus_number} under agency {bus.agency_id}")
            
            flash(f"Véhicule VIP {bus.brand or ''} {bus.model} ({bus.bus_number}) ajouté avec succès à la flotte 3M !", 'success')
            return redirect(url_for('admin.buses'))
        except ValueError:
            flash('Valeur de capacité invalide.', 'danger')
            return redirect(url_for('admin.add_bus'))
            
    if current_user.role == 'super_admin':
        drivers = Driver.query.filter_by(is_deleted=False).all()
        agencies = Agency.query.filter_by(is_deleted=False).all()
    else:
        drivers = Driver.query.filter_by(agency_id=current_user.agency_id, is_deleted=False).all()
        agencies = []
    return render_template('admin/add_bus.html', agencies=agencies, drivers=drivers)

@admin.route('/admin/bus/edit/<int:id>', methods=['GET', 'POST'])
@login_required
@admin_required
def edit_bus(id):
    bus = Bus.query.filter_by(id=id, is_deleted=False).first_or_404()
    
    # Scope check
    if current_user.role != 'super_admin' and bus.agency_id != current_user.agency_id:
        flash("Vous n'avez pas la permission de modifier ce bus.", 'danger')
        return redirect(url_for('admin.buses'))
        
    if request.method == 'POST':
        bus.bus_number = request.form.get('bus_number')
        bus.brand = request.form.get('brand')
        bus.model = request.form.get('model')
        bus.capacity = int(request.form.get('capacity'))
        bus.division = request.form.get('division', 'LOCATION').strip()
        bus.release_date = request.form.get('release_date', '').strip()
        old_driver_name = bus.driver_name
        bus.driver_name = request.form.get('driver_name')
        bus.maintenance_notes = request.form.get('maintenance_notes')
        
        last_maintenance_date_str = request.form.get('last_maintenance_date')
        if last_maintenance_date_str:
            bus.last_maintenance_date = datetime.strptime(last_maintenance_date_str, '%Y-%m-%d')
        else:
            bus.last_maintenance_date = None
            
        if current_user.role == 'super_admin':
            bus.agency_id = int(request.form.get('agency_id'))
            
        # Promo fields
        bus.is_promo = ('is_promo' in request.form) or (request.form.get('is_promo') in ['1', 'true', 'on'])
        promo_price_val = request.form.get('promo_price', type=int)
        if promo_price_val:
            bus.promo_price = promo_price_val
        regular_price_val = request.form.get('regular_price', type=int)
        if regular_price_val:
            bus.regular_price = regular_price_val
        promo_badge_val = request.form.get('promo_badge', '').strip()
        if promo_badge_val:
            bus.promo_badge = promo_badge_val

        # Sync Driver's current_bus_id
        if old_driver_name != bus.driver_name:
            if old_driver_name:
                old_driver = Driver.query.filter_by(name=old_driver_name, agency_id=bus.agency_id, is_deleted=False).first()
                if old_driver and old_driver.current_bus_id == bus.id:
                    old_driver.current_bus_id = None
            if bus.driver_name:
                new_driver = Driver.query.filter_by(name=bus.driver_name, agency_id=bus.agency_id, is_deleted=False).first()
                if new_driver:
                    new_driver.current_bus_id = bus.id

        db.session.commit()

        # Synchronize with Express backend server/data/db.json
        try:
            import json as _json
            db_path = os.path.join(os.path.dirname(os.path.dirname(os.path.dirname(__file__))), 'server', 'data', 'db.json')
            if os.path.exists(db_path):
                with open(db_path, 'r', encoding='utf-8') as f:
                    exp_db = _json.load(f)
                cars = exp_db.get('cars', [])
                target_model = (bus.model or '').lower().strip()
                for car in cars:
                    c_name = (car.get('name') or '').lower()
                    c_model = (car.get('model') or '').lower()
                    if (target_model and (target_model in c_name or c_name in target_model or target_model in c_model)) or (car.get('plate') and car.get('plate') == bus.bus_number):
                        car['isPromo'] = bus.is_promo
                        if bus.promo_price:
                            car['promoPrice'] = bus.promo_price
                            car['pricePerDay'] = bus.promo_price
                        if bus.regular_price:
                            car['regularPrice'] = bus.regular_price
                        if bus.promo_badge:
                            car['promoBadge'] = bus.promo_badge
                with open(db_path, 'w', encoding='utf-8') as f:
                    _json.dump(exp_db, f, indent=2, ensure_ascii=False)
        except Exception as _e:
            current_app.logger.warning(f"Error syncing promo car to db.json: {_e}")
        log_audit("BUS_EDITED", "Bus", bus.id, f"Modified VIP vehicle specs: {bus.bus_number}")
        flash(f"Véhicule VIP {bus.brand or ''} {bus.model} ({bus.bus_number}) modifié avec succès !", 'success')
        return redirect(url_for('admin.buses'))
        
    if current_user.role == 'super_admin':
        drivers = Driver.query.filter_by(is_deleted=False).all()
        agencies = Agency.query.filter_by(is_deleted=False).all()
    else:
        drivers = Driver.query.filter_by(agency_id=current_user.agency_id, is_deleted=False).all()
        agencies = []
    return render_template('admin/edit_bus.html', bus=bus, agencies=agencies, drivers=drivers)

@admin.route('/admin/bus/toggle_maintenance/<int:id>')
@login_required
@admin_required
def toggle_bus_maintenance(id):
    bus = Bus.query.filter_by(id=id, is_deleted=False).first_or_404()
    if current_user.role != 'super_admin' and bus.agency_id != current_user.agency_id:
        flash("Accès non autorisé.", 'danger')
        return redirect(url_for('admin.buses'))
        
    bus.status = 'maintenance' if bus.status == 'active' else 'active'
    db.session.commit()
    
    log_audit("BUS_MAINTENANCE_TOGGLED", "Bus", bus.id, f"Toggled maintenance status of bus {bus.bus_number} to {bus.status}")
    flash(f"Le bus {bus.bus_number} est désormais en status '{bus.status}'.", 'success')
    return redirect(url_for('admin.buses'))

@admin.route('/admin/bus/delete/<int:id>')
@login_required
@admin_required
def delete_bus(id):
    bus = Bus.query.filter_by(id=id, is_deleted=False).first_or_404()
    if current_user.role != 'super_admin' and bus.agency_id != current_user.agency_id:
        flash("Accès non autorisé.", 'danger')
        return redirect(url_for('admin.buses'))
        
    # Dependency Check: Cannot delete if assigned to future departures
    active_trips = Trip.query.filter(Trip.bus_id == bus.id, Trip.departure_time >= datetime.utcnow(), Trip.is_deleted == False).count()
    if active_trips > 0:
        flash(f"Impossible de supprimer ce bus car {active_trips} voyages futurs y sont affectés. Veuillez réassigner ces voyages.", 'danger')
        return redirect(url_for('admin.buses'))
        
    bus.is_deleted = True
    bus.deleted_at = datetime.utcnow()
    db.session.commit()
    
    log_audit("BUS_DELETED", "Bus", bus.id, f"Soft-deleted bus: {bus.bus_number}")
    flash('Bus supprimé de la flotte avec succès (Soft Delete) !', 'success')
    return redirect(url_for('admin.buses'))

# === AGENCY ADMIN: CRUD ROUTES (LIGNES) ===
@admin.route('/admin/routes')
@login_required
@admin_required
def routes():
    filter_val = request.args.get('filter', 'all')
    if current_user.role == 'super_admin':
        query = Route.query.filter_by(is_deleted=False)
    else:
        query = Route.query.filter_by(agency_id=current_user.agency_id, is_deleted=False)

    if filter_val in ['day', 'week', 'month']:
        today = date.today()
        if filter_val == 'day':
            start_dt = datetime.combine(today, datetime.min.time())
            end_dt = datetime.combine(today, datetime.max.time())
        elif filter_val == 'week':
            start_dt = datetime.combine(today, datetime.min.time())
            end_dt = datetime.combine(today + timedelta(days=6), datetime.max.time())
        elif filter_val == 'month':
            start_dt = datetime.combine(today, datetime.min.time())
            end_dt = datetime.combine(today + timedelta(days=29), datetime.max.time())
            
        query = query.join(Trip).filter(
            Trip.departure_time.between(start_dt, end_dt),
            Trip.is_deleted == False
        ).distinct()

    routes = query.all()
    return render_template('admin/routes.html', routes=routes, current_filter=filter_val)

@admin.route('/admin/add_route', methods=['GET', 'POST'])
@login_required
@admin_required
def add_route():
    if request.method == 'POST':
        origin = request.form.get('origin')
        destination = request.form.get('destination')
        distance = request.form.get('distance')
        duration = request.form.get('duration')
        base_price_raw = request.form.get('base_price')
        stops = request.form.get('stops')
        agency_id = request.form.get('agency_id') if current_user.role == 'super_admin' else current_user.agency_id
        
        if not all([origin, destination, agency_id]):
            flash('Veuillez remplir les champs obligatoires.', 'danger')
            return redirect(url_for('admin.add_route'))
        
        try:
            parsed_price = float(base_price_raw) if (base_price_raw and base_price_raw.strip() != "" and base_price_raw != "None") else None
            route = Route(
                origin=origin,
                destination=destination,
                distance=float(distance) if distance else None,
                duration=duration,
                base_price=parsed_price,
                stops=stops,
                agency_id=int(agency_id)
            )
            db.session.add(route)
            db.session.commit()
            
            log_audit("ROUTE_CREATED", "Route", route.id, f"Created route: {route.origin} -> {route.destination}")
            
            # NOTIFICATION: Notify Super Admin about new route; also notify agency admin if created by super admin
            price_str = f"{int(route.base_price)} FCFA" if route.base_price is not None else "tarif non défini"
            if current_user.role == 'admin_agence':
                trigger_notification(
                    title="🚦 Nouvelle Ligne Créée",
                    message=f"L'agence {current_user.agency.name} a créé la ligne {route.origin} → {route.destination} ({price_str}).",
                    type="info", category='operations', role_target='super_admin'
                )
            else:
                trigger_notification(
                    title="🚦 Nouvelle Ligne Créée",
                    message=f"Nouvelle ligne planifiée : {route.origin} → {route.destination} ({price_str}).",
                    type="info", category='operations', role_target='super_admin'
                )
            
            flash('Ligne de transport ajoutée avec succès !', 'success')
            return redirect(url_for('admin.routes'))
        except ValueError:
            flash('Tarifs ou distances invalides.', 'danger')
            return redirect(url_for('admin.add_route'))
            
    agencies = Agency.query.filter_by(is_deleted=False).all() if current_user.role == 'super_admin' else []
    return render_template('admin/add_route.html', agencies=agencies)

@admin.route('/admin/route/edit/<int:id>', methods=['GET', 'POST'])
@login_required
@admin_required
def edit_route(id):
    route = Route.query.filter_by(id=id, is_deleted=False).first_or_404()
    if current_user.role != 'super_admin' and route.agency_id != current_user.agency_id:
        flash("Accès non autorisé.", 'danger')
        return redirect(url_for('admin.routes'))
        
    if request.method == 'POST':
        origin = request.form.get('origin')
        destination = request.form.get('destination')
        distance = request.form.get('distance')
        duration = request.form.get('duration')
        base_price_raw = request.form.get('base_price')
        stops = request.form.get('stops')
        
        if not all([origin, destination]):
            flash('Veuillez remplir les champs obligatoires.', 'danger')
            return redirect(url_for('admin.edit_route', id=id))
            
        try:
            route.origin = origin
            route.destination = destination
            route.distance = float(distance) if distance else None
            route.duration = duration
            route.base_price = float(base_price_raw) if (base_price_raw and base_price_raw.strip() != "" and base_price_raw != "None") else None
            route.stops = stops
            if current_user.role == 'super_admin':
                route.agency_id = int(request.form.get('agency_id'))
                
            db.session.commit()
            log_audit("ROUTE_EDITED", "Route", route.id, f"Modified route variables: {route.origin} - {route.destination}")
            flash('Ligne de transport modifiée avec succès !', 'success')
            return redirect(url_for('admin.routes'))
        except ValueError:
            flash('Tarifs ou distances invalides.', 'danger')
            return redirect(url_for('admin.edit_route', id=id))
        
    agencies = Agency.query.filter_by(is_deleted=False).all() if current_user.role == 'super_admin' else []
    return render_template('admin/edit_route.html', route=route, agencies=agencies)

@admin.route('/admin/route/delete/<int:id>')
@login_required
@admin_required
def delete_route(id):
    route = Route.query.filter_by(id=id, is_deleted=False).first_or_404()
    if current_user.role != 'super_admin' and route.agency_id != current_user.agency_id:
        flash("Accès non autorisé.", 'danger')
        return redirect(url_for('admin.routes'))
        
    # Dependency Check: Verify if active scheduled trips exist
    active_trips = Trip.query.filter(Trip.route_id == route.id, Trip.departure_time >= datetime.utcnow(), Trip.is_deleted == False).count()
    if active_trips > 0:
        flash(f"Impossible de supprimer cette ligne car {active_trips} voyages y sont programmés. Supprimez ou réassignez ces voyages d'abord.", 'danger')
        return redirect(url_for('admin.routes'))
        
    route.is_deleted = True
    route.deleted_at = datetime.utcnow()
    db.session.commit()
    
    log_audit("ROUTE_DELETED", "Route", route.id, f"Soft-deleted route: {route.origin} -> {route.destination}")
    flash('Ligne de transport supprimée avec succès !', 'success')
    return redirect(url_for('admin.routes'))

# === AGENCY ADMIN: CRUD TRIPS (TRAJETS) ===
def check_due_vehicle_restitutions():
    """
    Vérifie les sorties de véhicules arrivées à terme ou dont la restitution est imminente.
    Envoie une notification officielle à l'administration contenant :
    - Nom du client VIP
    - Véhicule (Marque, Modèle, Immat)
    - Date de Restitution
    """
    try:
        now = datetime.now()
        # Trips reaching return date (due now or within next 2 hours)
        trips_due = Trip.query.filter(
            Trip.arrival_time <= now + timedelta(hours=2),
            Trip.status.in_(['scheduled', 'departed', 'boarding']),
            Trip.is_deleted == False
        ).all()

        for t in trips_due:
            ref_tag = f"[TRIP_RESTITUTION:{t.id}]"
            existing = SystemNotification.query.filter(
                SystemNotification.message.like(f"%{ref_tag}%")
            ).first()

            if not existing:
                # Find client name & phone
                booking = t.bookings.filter_by(is_deleted=False).first()
                client_name = "Client VIP 3M"
                client_phone = ""
                if booking:
                    client_name = booking.passenger_name or (booking.user.real_name if (booking.user and booking.user.real_name) else (booking.user.username if booking.user else "Client VIP 3M"))
                    if booking.user and booking.user.phone:
                        client_phone = booking.user.phone
                    elif booking.special_instructions:
                        client_phone = booking.special_instructions
                elif t.bus and t.bus.driver_name:
                    client_name = f"Mission Chauffeur {t.bus.driver_name}"

                car_name = f"{t.bus.brand} {t.bus.model}" if t.bus else "Véhicule VIP"
                car_plate = f"({t.bus.bus_number})" if (t.bus and t.bus.bus_number) else ""
                car_desc = f"{car_name} {car_plate}".strip()
                restitution_date = t.arrival_time.strftime("%d/%m/%Y à %H:%M")

                title = f"🔔 Restitution Véhicule VIP : {car_desc} — {client_name}"
                message = (
                    f"Alerte Restitution Véhicule VIP 3M SERVICES :\n"
                    f"• Client VIP : {client_name}" + (f" ({client_phone})" if client_phone else "") + "\n"
                    f"• Véhicule : {car_desc}\n"
                    f"• Date & Heure de Restitution : {restitution_date}\n"
                    f"• Mission / Destination : {t.route.origin if t.route else 'Yaoundé'} → {t.route.destination if t.route else 'Parc VIP'}\n"
                    f"Le véhicule est attendu au parc VIP. Veuillez effectuer l'état des lieux de retour. {ref_tag}"
                )

                trigger_notification(
                    title=title,
                    message=message,
                    type="warning",
                    category="operations",
                    role_target="super_admin"
                )
    except Exception as e:
        current_app.logger.warning(f"Error in check_due_vehicle_restitutions: {e}")

# ==============================================================================
# LOCATIONS D'APPARTEMENTS MEUBLÉS VIP 3M SERVICES (TSINGA & YAOUNDÉ)
# ==============================================================================

DEFAULT_EQUIPMENT_OPTIONS = [
    "Climatisation intégrale",
    "WiFi Fibre Optique illimité",
    "Smart TV 55 pouces HD (Netflix / Canal+)",
    "Cuisine américaine tout équipée",
    "Literie King Size Grand Confort",
    "Salle de bain design à l'italienne",
    "Balcon privé avec vue dégagée",
    "Forage d'eau & suppresseur automatique",
    "Machine à laver & espace buanderie",
    "Micro-ondes & réfrigérateur combiné",
    "Chauffe-eau électrique permanent"
]

DEFAULT_VIP_SERVICES_OPTIONS = [
    "Groupe électrogène automatique 24/7 (Zéro coupure)",
    "Gardiennage & vigiles 24/7 (Caméras de surveillance)",
    "Ménage régulier & conciergerie hôtelière 3M",
    "Parking privé sécurisé et fermé",
    "Chauffeur privé VIP dédié (sur demande)",
    "Navette accueil aéroport Nsimalen",
    "Assistance & conciergerie privée 24/7"
]

DEFAULT_APARTMENT_GALLERY = [
    {"url": "/Asset/appartements/appartement-meuble-suite-parentale.webp", "label": "Suite Parentale Prestige"},
    {"url": "/Asset/appartements/appartement-meuble-chambre-bleue.webp", "label": "Chambre Cosy Contemporaine"},
    {"url": "/Asset/appartements/appartement-meuble-chambre-confort.webp", "label": "Chambre Grand Standing"},
    {"url": "/Asset/appartements/appartement-meuble-salon-standing.webp", "label": "Grand Salon avec Balcon"},
    {"url": "/Asset/appartements/appartement-meuble-cuisine-equipee.webp", "label": "Cuisine Américaine Laquée"}
]

def sync_apartment_to_express_db(apt_dict, action='upsert'):
    """Synchronize apartment records into server/data/db.json for real-time frontend parity."""
    try:
        db_path = os.path.join(os.path.dirname(os.path.dirname(os.path.dirname(__file__))), 'server', 'data', 'db.json')
        if not os.path.exists(db_path):
            return
        with open(db_path, 'r', encoding='utf-8') as f:
            exp_db = json.load(f)
        apts = exp_db.setdefault('apartments', [])
        idx = next((i for i, a in enumerate(apts) if a.get('id') == apt_dict.get('id')), -1)
        if action == 'delete':
            if idx >= 0:
                apts.pop(idx)
        else:
            if idx >= 0:
                apts[idx].update(apt_dict)
            else:
                apts.insert(0, apt_dict)
        with open(db_path, 'w', encoding='utf-8') as f:
            json.dump(exp_db, f, indent=2, ensure_ascii=False)
    except Exception as e:
        logger.warning(f"Error syncing apartment to express db.json: {e}")

def sync_booking_to_express_db(booking_dict):
    """Synchronize counter VIP booking into server/data/db.json."""
    try:
        db_path = os.path.join(os.path.dirname(os.path.dirname(os.path.dirname(__file__))), 'server', 'data', 'db.json')
        if not os.path.exists(db_path):
            return
        with open(db_path, 'r', encoding='utf-8') as f:
            exp_db = json.load(f)
        bookings = exp_db.setdefault('bookings', [])
        idx = next((i for i, b in enumerate(bookings) if b.get('id') == booking_dict.get('id')), -1)
        if idx >= 0:
            bookings[idx].update(booking_dict)
        else:
            bookings.insert(0, booking_dict)
        with open(db_path, 'w', encoding='utf-8') as f:
            json.dump(exp_db, f, indent=2, ensure_ascii=False)
    except Exception as e:
        logger.warning(f"Error syncing booking to express db.json: {e}")

@admin.route('/admin/apartments')
@admin.route('/admin/locations')
@login_required
@admin_required
def apartments():
    """Locations d'Appartements Meublés VIP 3M SERVICES - Overview and Management"""
    q = request.args.get('q', '').strip().lower()
    status_filter = request.args.get('status', '').strip()
    
    query = Apartment.query.filter_by(is_deleted=False)
    all_apts = query.order_by(Apartment.id.asc()).all()
    
    filtered_apts = all_apts
    if q:
        filtered_apts = [a for a in filtered_apts if q in (a.title or '').lower() or q in (a.location or '').lower() or q in (a.type or '').lower()]
    if status_filter:
        filtered_apts = [a for a in filtered_apts if (a.status or '').lower() == status_filter.lower()]
        
    total_count = len(all_apts)
    available_count = sum(1 for a in all_apts if a.status == 'Disponible')
    occupied_count = sum(1 for a in all_apts if a.status in ['Occupé', 'Réservé'])
    maintenance_count = sum(1 for a in all_apts if a.status == 'Maintenance')
    
    return render_template(
        'admin/apartments.html',
        apartments=filtered_apts,
        total_count=total_count,
        available_count=available_count,
        occupied_count=occupied_count,
        maintenance_count=maintenance_count,
        current_status=status_filter,
        current_q=request.args.get('q', '')
    )

@admin.route('/admin/apartments/add', methods=['GET', 'POST'])
@login_required
@admin_required
def add_apartment():
    """Create a new furnished VIP apartment in 3M SERVICES portfolio"""
    if request.method == 'POST':
        title = request.form.get('title', '').strip()
        type_apt = request.form.get('type', '').strip()
        location = request.form.get('location', '').strip()
        rooms = request.form.get('rooms', '').strip()
        price = request.form.get('price', '').strip()
        status = request.form.get('status', 'Disponible').strip()
        image = request.form.get('image', '').strip() or '/Asset/appartements/appartement-meuble-suite-parentale.webp'
        photos_count = request.form.get('photos_count', type=int) or 4
        description = request.form.get('description', '').strip()
        
        # Equipments
        equipments = request.form.getlist('equipments')
        custom_eq = request.form.get('custom_equipment', '').strip()
        if custom_eq and custom_eq not in equipments:
            equipments.append(custom_eq)
            
        # VIP Services
        vip_services = request.form.getlist('vip_services')
        custom_vip = request.form.get('custom_vip_service', '').strip()
        if custom_vip and custom_vip not in vip_services:
            vip_services.append(custom_vip)
            
        if not all([title, type_apt, location, price]):
            flash('Veuillez remplir au moins le titre, le type, la localisation et le tarif.', 'danger')
            return redirect(url_for('admin.add_apartment'))
            
        # Generate new unique ID
        existing_ids = [a.id for a in Apartment.query.all()]
        next_num = 1
        new_id = f"apt-{next_num:02d}"
        while new_id in existing_ids:
            next_num += 1
            new_id = f"apt-{next_num:02d}"
            
        new_apt = Apartment(
            id=new_id,
            title=title,
            type=type_apt,
            location=location,
            rooms=rooms,
            price=price,
            photos_count=photos_count,
            image=image,
            status=status,
            description=description,
            agency_id=current_user.agency_id if current_user.role != 'super_admin' else 1
        )
        new_apt.equipments = equipments
        new_apt.vip_services = vip_services
        
        db.session.add(new_apt)
        db.session.commit()
        
        sync_apartment_to_express_db(new_apt.to_dict(), action='upsert')
        log_audit("APARTMENT_CREATED", "Apartment", 0, f"Created apartment {new_id}: {title}")
        
        flash(f"Appartement VIP '{title}' ({new_id}) ajouté avec succès !", 'success')
        return redirect(url_for('admin.apartments'))
        
    return render_template(
        'admin/add_apartment.html',
        default_equipments=DEFAULT_EQUIPMENT_OPTIONS,
        default_vip_services=DEFAULT_VIP_SERVICES_OPTIONS,
        gallery_images=DEFAULT_APARTMENT_GALLERY
    )

@admin.route('/admin/apartments/edit/<id>', methods=['GET', 'POST'])
@login_required
@admin_required
def edit_apartment(id):
    """Edit an existing furnished VIP apartment"""
    apt = Apartment.query.filter_by(id=id, is_deleted=False).first_or_404()
    
    if request.method == 'POST':
        apt.title = request.form.get('title', apt.title).strip()
        apt.type = request.form.get('type', apt.type).strip()
        apt.location = request.form.get('location', apt.location).strip()
        apt.rooms = request.form.get('rooms', apt.rooms).strip()
        apt.price = request.form.get('price', apt.price).strip()
        apt.status = request.form.get('status', apt.status).strip()
        apt.image = request.form.get('image', apt.image).strip()
        apt.photos_count = request.form.get('photos_count', type=int) or apt.photos_count or 4
        apt.description = request.form.get('description', apt.description).strip()
        
        equipments = request.form.getlist('equipments')
        custom_eq = request.form.get('custom_equipment', '').strip()
        if custom_eq and custom_eq not in equipments:
            equipments.append(custom_eq)
        apt.equipments = equipments
        
        vip_services = request.form.getlist('vip_services')
        custom_vip = request.form.get('custom_vip_service', '').strip()
        if custom_vip and custom_vip not in vip_services:
            vip_services.append(custom_vip)
        apt.vip_services = vip_services
        
        db.session.commit()
        sync_apartment_to_express_db(apt.to_dict(), action='upsert')
        log_audit("APARTMENT_EDITED", "Apartment", 0, f"Updated apartment {apt.id}: {apt.title}")
        
        flash(f"Appartement VIP '{apt.title}' mis à jour avec succès !", 'success')
        return redirect(url_for('admin.apartments'))
        
    return render_template(
        'admin/edit_apartment.html',
        apt=apt,
        default_equipments=DEFAULT_EQUIPMENT_OPTIONS,
        default_vip_services=DEFAULT_VIP_SERVICES_OPTIONS,
        gallery_images=DEFAULT_APARTMENT_GALLERY
    )

@admin.route('/admin/apartments/delete/<id>', methods=['POST'])
@login_required
@admin_required
def delete_apartment(id):
    """Soft delete an apartment and synchronize with json"""
    apt = Apartment.query.filter_by(id=id, is_deleted=False).first_or_404()
    apt.is_deleted = True
    db.session.commit()
    
    sync_apartment_to_express_db({"id": id}, action='delete')
    log_audit("APARTMENT_DELETED", "Apartment", 0, f"Deleted apartment {apt.id}: {apt.title}")
    
    flash(f"Appartement '{apt.title}' supprimé avec succès.", 'warning')
    return redirect(url_for('admin.apartments'))

@admin.route('/admin/apartments/toggle_status/<id>', methods=['POST'])
@login_required
@admin_required
def toggle_apartment_status(id):
    """Quickly toggle apartment status between Disponible, Réservé, Occupé, Maintenance"""
    apt = Apartment.query.filter_by(id=id, is_deleted=False).first_or_404()
    new_status = request.form.get('status', '').strip()
    if new_status in ['Disponible', 'Réservé', 'Occupé', 'Maintenance']:
        apt.status = new_status
        db.session.commit()
        sync_apartment_to_express_db(apt.to_dict(), action='upsert')
        flash(f"Statut de l'appartement '{apt.title}' changé à : {new_status}", 'success')
    return redirect(url_for('admin.apartments'))

@admin.route('/admin/trips')
@login_required
@admin_required
def trips():
    check_due_vehicle_restitutions()
    if current_user.role == 'super_admin':
        trips = Trip.query.filter_by(is_deleted=False).order_by(Trip.departure_time.desc()).all()
        routes = Route.query.filter_by(is_deleted=False).all()
        buses = Bus.query.filter_by(status='active', is_deleted=False).all()
        drivers = Driver.query.filter_by(is_deleted=False).all()
    else:
        trips = Trip.query.join(Route).filter(Route.agency_id == current_user.agency_id, Trip.is_deleted == False).order_by(Trip.departure_time.desc()).all()
        routes = Route.query.filter_by(agency_id=current_user.agency_id, is_deleted=False).all()
        buses = Bus.query.filter_by(agency_id=current_user.agency_id, status='active', is_deleted=False).all()
        drivers = Driver.query.filter_by(agency_id=current_user.agency_id, is_deleted=False).all()
    clients = User.query.filter_by(is_deleted=False).order_by(User.real_name, User.username).all()
    return render_template('admin/trips.html', trips=trips, routes=routes, buses=buses, drivers=drivers, clients=clients, now=datetime.now())

@admin.route('/admin/add_trip', methods=['GET', 'POST'])
@login_required
@admin_required
def add_trip():
    check_due_vehicle_restitutions()
    if request.method == 'POST':
        route_id = request.form.get('route_id')
        bus_id = request.form.get('bus_id')
        departure_time = request.form.get('departure_time')
        arrival_time = request.form.get('arrival_time')
        price = request.form.get('price')
        redirect_to = (request.form.get('redirect_to') or 'trips').strip()

        if not all([route_id, bus_id, departure_time, arrival_time, price]):
            flash('Veuillez remplir tous les champs obligatoires.', 'danger')
            return redirect(url_for('admin.add_trip'))

        try:
            dep_time = datetime.strptime(departure_time, '%Y-%m-%dT%H:%M')
            arr_time = datetime.strptime(arrival_time, '%Y-%m-%dT%H:%M')

            if arr_time <= dep_time:
                flash('La date et heure de restitution (arrivée) doit être postérieure à la date de sortie (départ).', 'danger')
                return redirect(url_for('admin.add_trip'))

            # Form fields
            booking_cutoff = request.form.get('booking_cutoff_minutes', 30, type=int)
            capacity_val = request.form.get('capacity', 0, type=int)
            driver_id_val = request.form.get('driver_id', type=int)

            client_user_id = request.form.get('client_user_id', type=int)
            client_name = (request.form.get('client_name') or '').strip()
            client_phone = (request.form.get('client_phone') or '').strip()
            client_email = (request.form.get('client_email') or '').strip()
            formula = (request.form.get('formula') or 'Chauffeur VIP Inclus').strip()
            payment_method = (request.form.get('payment_method') or 'momo').strip()
            payment_status = (request.form.get('payment_status') or ('pending' if payment_method == 'pending' else 'paid')).strip()
            notify_restitution = request.form.get('notify_restitution', 'on') == 'on'

            trip = Trip(
                route_id=int(route_id),
                bus_id=int(bus_id),
                driver_id=driver_id_val if driver_id_val else None,
                departure_time=dep_time,
                arrival_time=arr_time,
                price=float(price),
                booking_cutoff_minutes=booking_cutoff,
                capacity=capacity_val,
            )
            db.session.add(trip)
            db.session.flush()

            # Resolve or create client User
            client_user = User.query.get(client_user_id) if client_user_id else None
            if not client_user and client_phone:
                client_user = User.query.filter_by(phone=client_phone, is_deleted=False).first()
            if not client_user and client_email:
                client_user = User.query.filter_by(email=client_email, is_deleted=False).first()

            if not client_user and client_name:
                clean_slug = "".join(c for c in client_name.lower() if c.isalnum())[:12] or "client"
                gen_phone = client_phone or f"69{random.randint(1000000, 9999999)}"
                gen_email = client_email or f"{clean_slug}.{random.randint(100, 9999)}@3mservices.vip"
                name_parts = client_name.split(' ', 1)
                client_user = User(
                    username=f"{clean_slug}_{random.randint(100, 999)}",
                    email=gen_email,
                    phone=gen_phone,
                    first_name=name_parts[0],
                    last_name=name_parts[1] if len(name_parts) > 1 else '',
                    real_name=client_name,
                    role='client'
                )
                client_user.set_password(gen_phone)
                db.session.add(client_user)
                db.session.flush()

            if client_user and not client_name:
                client_name = client_user.real_name or client_user.username
            if client_user and not client_phone and client_user.phone:
                client_phone = client_user.phone

            target_user = client_user or User.query.filter_by(role='client', is_deleted=False).first() or current_user
            final_client = client_name or (target_user.real_name or target_user.username if target_user else "Client VIP 3M")

            b_code = f"3M-MIS-{datetime.utcnow().strftime('%y%m%d')}-{random.randint(100, 999)}"
            booking = Booking(
                user_id=target_user.id,
                trip_id=trip.id,
                seat_number="VIP-CAR",
                passenger_category=formula[:50],
                passenger_name=final_client,
                booking_code=b_code,
                price_paid=float(price),
                status="confirmed",
                payment_status=payment_status,
                payment_method=payment_method,
                booking_date=datetime.utcnow(),
                return_date=arr_time,
                num_persons=1,
                special_instructions=client_phone or ""
            )
            db.session.add(booking)
            trip.occupied_seats = 1
            db.session.commit()

            log_audit("TRIP_CREATED", "Trip", trip.id, f"Scheduled VIP sortie on route {trip.route_id} with bus {trip.bus_id} for {final_client}")

            bus_obj = Bus.query.get(trip.bus_id)
            car_label = f"{bus_obj.brand} {bus_obj.model} ({bus_obj.bus_number})" if bus_obj else "Véhicule VIP"

            route = Route.query.get(trip.route_id)
            if current_user.role == 'admin_agence' and route and trip.price != route.base_price:
                trigger_notification(
                    title="⚠️ Tarif Modifié sur Sortie VIP",
                    message=f"L'agence {current_user.agency.name} a planifié une sortie ({route.origin} → {route.destination}) au tarif de {trip.price:.0f} FCFA.",
                    type="warning", category='operations', role_target='super_admin'
                )

            if notify_restitution:
                trigger_notification(
                    title=f"🚗 Sortie VIP Planifiée : {car_label}",
                    message=f"Nouvelle sortie programmée pour {final_client}.\n• Sortie : {dep_time.strftime('%d/%m/%Y %H:%M')}\n• Restitution attendue : {arr_time.strftime('%d/%m/%Y %H:%M')}\nNotification Restitution Automatique Active : l'administrateur sera alerté automatiquement au retour du véhicule.",
                    type="info", category='operations', role_target='super_admin'
                )
                check_due_vehicle_restitutions()

            flash(f'Mission / Sortie du véhicule {car_label} planifiée avec succès pour {final_client} ! Restitution prévue le {arr_time.strftime("%d/%m/%Y à %H:%M")}.', 'success')
            if redirect_to == 'bookings':
                return redirect(url_for('admin.bookings'))
            return redirect(url_for('admin.trips'))
        except ValueError:
            flash('Valeurs de saisie ou formats de date incorrects.', 'danger')
            return redirect(url_for('admin.add_trip'))
            
    if current_user.role == 'super_admin':
        routes = Route.query.filter_by(is_deleted=False).all()
        buses = Bus.query.filter_by(status='active', is_deleted=False).all()
        drivers = Driver.query.filter_by(is_deleted=False).all()
    else:
        routes = Route.query.filter_by(agency_id=current_user.agency_id, is_deleted=False).all()
        buses = Bus.query.filter_by(agency_id=current_user.agency_id, status='active', is_deleted=False).all()
        drivers = Driver.query.filter_by(agency_id=current_user.agency_id, is_deleted=False).all()
        
    clients = User.query.filter_by(is_deleted=False).order_by(User.real_name, User.username).all()
    return render_template('admin/add_trip.html', routes=routes, buses=buses, drivers=drivers, clients=clients)

@admin.route('/admin/trip/edit/<int:id>', methods=['GET', 'POST'])
@login_required
@admin_required
def edit_trip(id):
    check_due_vehicle_restitutions()
    trip = Trip.query.filter_by(id=id, is_deleted=False).first_or_404()
    if current_user.role != 'super_admin' and trip.route.agency_id != current_user.agency_id:
        flash("Accès non autorisé.", 'danger')
        return redirect(url_for('admin.trips'))
        
    if request.method == 'POST':
        trip.route_id = int(request.form.get('route_id'))
        trip.bus_id = int(request.form.get('bus_id'))
        dep_time = datetime.strptime(request.form.get('departure_time'), '%Y-%m-%dT%H:%M')
        arr_time = datetime.strptime(request.form.get('arrival_time'), '%Y-%m-%dT%H:%M')
        if arr_time <= dep_time:
            flash('La date et heure de restitution (arrivée) doit être postérieure à la date de sortie (départ).', 'danger')
            return redirect(url_for('admin.edit_trip', id=id))
        trip.departure_time = dep_time
        trip.arrival_time = arr_time
        trip.price = float(request.form.get('price'))
        prev_status = trip.status
        new_status = request.form.get('status')
        trip.status = new_status
        driver_id_val = request.form.get('driver_id', type=int)
        trip.driver_id = driver_id_val if driver_id_val else None

        # Update or create client VIP booking details
        client_user_id = request.form.get('client_user_id', type=int)
        client_name = (request.form.get('client_name') or '').strip()
        client_phone = (request.form.get('client_phone') or '').strip()
        formula = (request.form.get('formula') or 'Chauffeur VIP Inclus').strip()
        payment_method = (request.form.get('payment_method') or '').strip()
        payment_status = (request.form.get('payment_status') or '').strip()

        booking = trip.bookings.filter_by(is_deleted=False).first()
        if booking:
            if client_user_id:
                booking.user_id = client_user_id
            if client_name:
                booking.passenger_name = client_name
            if client_phone:
                booking.special_instructions = client_phone
            if formula:
                booking.passenger_category = formula[:50]
            if payment_method:
                booking.payment_method = payment_method
            if payment_status:
                booking.payment_status = payment_status
            booking.price_paid = trip.price
            booking.return_date = arr_time
        elif client_name or client_user_id:
            target_user = User.query.get(client_user_id) if client_user_id else (User.query.filter_by(role='client', is_deleted=False).first() or current_user)
            final_client = client_name or (target_user.real_name or target_user.username)
            b_code = f"3M-MIS-{datetime.utcnow().strftime('%y%m%d')}-{random.randint(100, 999)}"
            booking = Booking(
                user_id=target_user.id,
                trip_id=trip.id,
                seat_number="VIP-CAR",
                passenger_category=formula[:50],
                passenger_name=final_client,
                booking_code=b_code,
                price_paid=trip.price,
                status="confirmed" if new_status != "cancelled" else "cancelled",
                payment_status=payment_status or "paid",
                payment_method=payment_method or "momo",
                booking_date=datetime.utcnow(),
                return_date=arr_time,
                num_persons=1,
                special_instructions=client_phone or ""
            )
            db.session.add(booking)
            trip.occupied_seats = 1

        # If status marked as arrived / completed: send restitution confirmation notification
        if new_status in ['arrived', 'completed'] and prev_status not in ['arrived', 'completed']:
            car_label = f"{trip.bus.brand} {trip.bus.model} ({trip.bus.bus_number})" if trip.bus else "Véhicule VIP"
            client_label = (booking.passenger_name if booking else None) or client_name or "Client VIP 3M"
            restitution_time = datetime.now().strftime("%d/%m/%Y à %H:%M")
            trigger_notification(
                title=f"✅ Véhicule Restitué : {trip.bus.brand if trip.bus else 'Flotte'} ({client_label})",
                message=f"Le véhicule {car_label} loué par {client_label} a été restitué au parc 3M SERVICES le {restitution_time}.\nL'inspection de retour a été validée avec succès.",
                type="success", category="operations", role_target="super_admin"
            )
        
        db.session.commit()
        check_due_vehicle_restitutions()
        log_audit("TRIP_EDITED", "Trip", trip.id, f"Modified sortie/trip schedule: #{trip.id}")
        flash('Sortie de véhicule VIP modifiée avec succès !', 'success')
        return redirect(url_for('admin.trips'))
        
    if current_user.role == 'super_admin':
        routes = Route.query.filter_by(is_deleted=False).all()
        buses = Bus.query.filter_by(status='active', is_deleted=False).all()
        drivers = Driver.query.filter_by(is_deleted=False).all()
    else:
        routes = Route.query.filter_by(agency_id=current_user.agency_id, is_deleted=False).all()
        buses = Bus.query.filter_by(agency_id=current_user.agency_id, status='active', is_deleted=False).all()
        drivers = Driver.query.filter_by(agency_id=current_user.agency_id, is_deleted=False).all()
        
    clients = User.query.filter_by(is_deleted=False).order_by(User.real_name, User.username).all()
    existing_booking = trip.bookings.filter_by(is_deleted=False).first()
    return render_template('admin/edit_trip.html', trip=trip, routes=routes, buses=buses, drivers=drivers, clients=clients, existing_booking=existing_booking)

@admin.route('/admin/trip/toggle_status/<int:id>')
@login_required
@admin_required
def toggle_trip_status(id):
    trip = Trip.query.filter_by(id=id, is_deleted=False).first_or_404()
    if current_user.role != 'super_admin' and trip.route.agency_id != current_user.agency_id:
        flash("Accès non autorisé.", 'danger')
        return redirect(url_for('admin.trips'))
        
    if trip.status == 'scheduled':
        trip.status = 'cancelled'
        # Refund active passenger bookings associated with this trip
        affected_bookings = Booking.query.filter_by(trip_id=trip.id, status='confirmed', is_deleted=False).all()
        for booking in affected_bookings:
            booking.status = 'cancelled'
            booking.payment_status = 'refunded'
            booking.refund_amount = booking.price_paid
            # Client notification: their booking was cancelled + refund issued
            if booking.user_id:
                trigger_notification(
                    title="🛠️ Voyage Annulé — Remboursement Initialisé",
                    message=f"Votre réservation #{booking.booking_code} ({trip.route.origin} → {trip.route.destination}) a été annulée. Un remboursement de {booking.price_paid:.0f} FCFA est en cours.",
                    type="warning", category='passenger', role_target='client',
                    user_id=booking.user_id
                )
        db.session.commit()
        log_audit("TRIP_CANCELLED", "Trip", trip.id, f"Cancelled trip #{trip.id} and refunded {len(affected_bookings)} bookings.")
        # Super Admin + Agency Admin notification
        trigger_notification(
            title="🔴 Voyage Annulé",
            message=f"Le trajet #{trip.id} ({trip.route.origin} → {trip.route.destination}) du {trip.departure_time.strftime('%d/%m/%Y %H:%M')} a été annulé. {len(affected_bookings)} passager(s) remboursé(s).",
            type="danger", category='operations', role_target='super_admin'
        )
        trigger_notification(
            title="🔴 Voyage Annulé — Votre Agence",
            message=f"Le trajet #{trip.id} ({trip.route.origin} → {trip.route.destination}) a été annulé. {len(affected_bookings)} réservation(s) remboursée(s).",
            type="danger", category='ops_agency', role_target='admin_agence',
            agency_id=trip.route.agency_id
        )
        flash('Voyage annulé et passagers notifiés/remboursés !', 'warning')
    else:
        trip.status = 'scheduled'
        db.session.commit()
        log_audit("TRIP_RESTORED", "Trip", trip.id, f"Restored trip #{trip.id} status to scheduled.")
        flash('Voyage replanifié avec succès !', 'success')
        
    return redirect(url_for('admin.trips'))

@admin.route('/admin/trip/delete/<int:id>')
@login_required
@admin_required
def delete_trip(id):
    trip = Trip.query.filter_by(id=id, is_deleted=False).first_or_404()
    if current_user.role != 'super_admin' and trip.route.agency_id != current_user.agency_id:
        flash("Accès non autorisé.", 'danger')
        return redirect(url_for('admin.trips'))
        
    # Dependency Check: Check if there are active bookings
    active_bookings = Booking.query.filter_by(trip_id=trip.id, is_deleted=False).count()
    if active_bookings > 0:
        flash(f"Impossible de supprimer définitivement ce voyage car {active_bookings} réservations y sont attachées. Veuillez d'abord annuler le voyage pour initier les remboursements.", 'danger')
        return redirect(url_for('admin.trips'))
        
    trip.is_deleted = True
    trip.deleted_at = datetime.utcnow()
    db.session.commit()
    
    log_audit("TRIP_DELETED", "Trip", trip.id, f"Soft-deleted trip: #{trip.id}")
    flash('Voyage supprimé avec succès (Soft Delete) !', 'success')
    return redirect(url_for('admin.trips'))

@admin.route('/admin/trip/archive/<int:id>')
@login_required
@admin_required
def archive_trip(id):
    trip = Trip.query.filter_by(id=id, is_deleted=False).first_or_404()
    if current_user.role != 'super_admin' and trip.route.agency_id != current_user.agency_id:
        flash("Accès non autorisé.", 'danger')
        return redirect(url_for('admin.trips'))
        
    trip.is_archived = True
    db.session.commit()
    log_audit("TRIP_ARCHIVED", "Trip", trip.id, f"Archived trip #{trip.id}")
    flash('Voyage archivé avec succès !', 'success')
    return redirect(url_for('admin.trips'))

@admin.route('/admin/trip/restore/<int:id>')
@login_required
@admin_required
def restore_trip(id):
    trip = Trip.query.filter_by(id=id, is_deleted=False).first_or_404()
    if current_user.role != 'super_admin' and trip.route.agency_id != current_user.agency_id:
        flash("Accès non autorisé.", 'danger')
        return redirect(url_for('admin.trips'))
        
    trip.is_archived = False
    db.session.commit()
    log_audit("TRIP_RESTORED_ARCHIVE", "Trip", trip.id, f"Restored archived trip #{trip.id}")
    flash('Voyage restauré avec succès !', 'success')
    return redirect(url_for('admin.trips'))

# === COMMON ADMIN: MANAGE BOOKINGS ===
@admin.route('/admin/bookings')
@login_required
@admin_required
def bookings():
    check_due_vehicle_restitutions()
    from app.routes.missions import build_mission_hub_context
    filter_val = request.args.get('filter', 'all')
    active_tab = request.args.get('tab', 'overview')
    ctx = build_mission_hub_context(filter_val=filter_val)
    ctx['active_tab'] = active_tab
    return render_template('admin/bookings.html', **ctx)

@admin.route('/admin/booking/edit/<int:id>', methods=['GET', 'POST'])
@login_required
@admin_required
def edit_booking(id):
    booking = Booking.query.filter_by(id=id, is_deleted=False).first_or_404()
    if current_user.role != 'super_admin' and booking.trip.route.agency_id != current_user.agency_id:
        flash("Accès non autorisé.", 'danger')
        return redirect(url_for('admin.bookings'))
        
    if request.method == 'POST':
        booking.seat_number = request.form.get('seat_number')
        booking.passenger_name = request.form.get('passenger_name')
        booking.payment_status = request.form.get('payment_status')
        booking.status = request.form.get('status')
        booking.payment_method = request.form.get('payment_method')
        booking.upi_reference = request.form.get('upi_reference')
        
        price_paid = request.form.get('price_paid')
        if price_paid:
            try:
                booking.price_paid = float(price_paid)
            except ValueError:
                pass
                
        refund_amount = request.form.get('refund_amount')
        if refund_amount:
            try:
                booking.refund_amount = float(refund_amount)
            except ValueError:
                pass
        
        db.session.commit()
        log_audit("BOOKING_EDITED", "Booking", booking.id, f"Edited booking and financial details for LV-{booking.id} ({booking.passenger_name})")
        flash('Réservation et données financières modifiées avec succès !', 'success')
        return redirect(url_for('admin.bookings'))
        
    return render_template('admin/edit_booking.html', booking=booking)

@admin.route('/admin/booking/cancel/<int:id>')
@login_required
@admin_required
def cancel_booking(id):
    booking = Booking.query.filter_by(id=id, is_deleted=False).first_or_404()
    if current_user.role != 'super_admin' and booking.trip.route.agency_id != current_user.agency_id:
        flash("Accès non autorisé.", 'danger')
        return redirect(url_for('admin.bookings'))
        
    booking.status = 'cancelled'
    booking.payment_status = 'refunded'
    booking.refund_amount = booking.price_paid
    db.session.commit()
    
    log_audit("BOOKING_CANCELLED", "Booking", booking.id, f"Cancelled and refunded booking LV-{booking.id}")
    flash('Réservation annulée et remboursée avec succès !', 'success')
    return redirect(url_for('admin.bookings'))

# === NEW: BULK OPERATIONS ON BUSES ===
@admin.route('/admin/buses/bulk', methods=['POST'])
@login_required
@admin_required
def bulk_buses():
    bus_ids = request.form.getlist('bus_ids')
    action = request.form.get('action')
    if not bus_ids or not action:
        flash('Aucun bus sélectionné ou action invalide.', 'warning')
        return redirect(url_for('admin.buses'))
        
    count = 0
    for bus_id in bus_ids:
        bus = Bus.query.filter_by(id=int(bus_id), is_deleted=False).first()
        if not bus:
            continue
        if current_user.role != 'super_admin' and bus.agency_id != current_user.agency_id:
            continue
            
        if action == 'maintenance':
            bus.status = 'maintenance'
            count += 1
        elif action == 'active':
            bus.status = 'active'
            count += 1
        elif action == 'delete':
            # Check dependencies
            active_trips = Trip.query.filter(Trip.bus_id == bus.id, Trip.departure_time >= datetime.utcnow(), Trip.is_deleted == False).count()
            if active_trips == 0:
                bus.is_deleted = True
                bus.deleted_at = datetime.utcnow()
                count += 1
                
    db.session.commit()
    log_audit(f"BUS_BULK_{action.upper()}", "Bus", None, f"Executed bulk {action} on {count} buses.")
    flash(f"Action '{action}' exécutée avec succès sur {count} bus !", 'success')
    return redirect(url_for('admin.buses'))

# === NEW: AUDIT LOGS & NOTIFICATIONS VIEWS ===

@admin.route('/admin/logs')
@login_required
@super_admin_required
def logs():
    audit_logs = AuditLog.query.order_by(AuditLog.created_at.desc()).limit(150).all()
    return render_template('admin/logs.html', logs=audit_logs)


@admin.route('/admin/logs/export/csv')
@login_required
@admin_required
def export_logs_csv():
    if current_user.role == 'super_admin':
        logs = AuditLog.query.order_by(AuditLog.created_at.desc()).all()
    elif current_user.role == 'admin_agence' and current_user.agency_id:
        logs = AuditLog.query.join(User).filter(User.agency_id == current_user.agency_id).order_by(AuditLog.created_at.desc()).all()
    else:
        flash("Accès refusé.", "danger")
        return redirect(url_for('main.index'))
        
    import csv
    from io import StringIO
    from flask import make_response
    
    f = StringIO()
    writer = csv.writer(f)
    writer.writerow(["DATE ET HEURE", "ACTEUR", "ACTION", "CIBLE", "DETAILS", "ADRESSE IP"])
    
    for l in logs:
        writer.writerow([
            l.created_at.strftime('%d/%m/%Y %H:%M:%S'),
            l.user.username if l.user else 'Système',
            l.action,
            f"{l.target_type or ''} #{l.target_id or ''}".strip(),
            l.details or '',
            l.ip_address or ''
        ])
        
    output = make_response(f.getvalue())
    output.headers["Content-Disposition"] = "attachment; filename=system_audit_logs.csv"
    output.headers["Content-type"] = "text/csv"
    return output


@admin.route('/admin/logs/export/pdf')
@login_required
@admin_required
def export_logs_pdf():
    if current_user.role == 'super_admin':
        logs = AuditLog.query.order_by(AuditLog.created_at.desc()).limit(150).all()
    elif current_user.role == 'admin_agence' and current_user.agency_id:
        logs = AuditLog.query.join(User).filter(User.agency_id == current_user.agency_id).order_by(AuditLog.created_at.desc()).limit(150).all()
    else:
        flash("Accès refusé.", "danger")
        return redirect(url_for('main.index'))
        
    import io
    from flask import send_file
    from reportlab.lib.pagesizes import letter
    from reportlab.pdfgen import canvas
    
    buffer = io.BytesIO()
    p = canvas.Canvas(buffer, pagesize=letter)
    
    # Title
    draw_pdf_header(p, "3M SERVICES — JOURNAL D'AUDIT SYSTEME")
    
    # Table headers
    p.setFont("Helvetica-Bold", 10)
    p.setFillColorRGB(0, 0, 0)
    p.drawString(50, 715, "Date")
    p.drawString(150, 715, "Acteur")
    p.drawString(230, 715, "Action")
    p.drawString(330, 715, "Cible")
    p.drawString(410, 715, "Détails")
    p.line(50, 705, 560, 705)
    
    y = 685
    p.setFont("Helvetica", 8)
    for l in logs:
        if y < 50:
            p.showPage()
            p.setFont("Helvetica-Bold", 10)
            p.drawString(50, 750, "Date")
            p.drawString(150, 750, "Acteur")
            p.drawString(230, 750, "Action")
            p.drawString(330, 750, "Cible")
            p.drawString(410, 750, "Détails")
            p.line(50, 740, 560, 740)
            p.setFont("Helvetica", 8)
            y = 720
            
        p.drawString(50, y, l.created_at.strftime('%d/%m/%Y %H:%M:%S'))
        p.drawString(150, y, (l.user.username if l.user else 'Système')[:15])
        p.drawString(230, y, l.action[:20])
        p.drawString(330, y, f"{l.target_type or ''} #{l.target_id or ''}"[:15])
        
        details_str = l.details or ''
        p.drawString(410, y, details_str[:35])
        y -= 20
        
    p.showPage()
    p.save()
    buffer.seek(0)
    return send_file(buffer, as_attachment=True, download_name="system_audit_logs.pdf", mimetype='application/pdf')

@admin.route('/admin/notifications')
@login_required
@admin_required
def notifications():
    query = SystemNotification.query.filter_by(is_deleted=False)

    # Role-based scoping using role_target
    if current_user.role == 'super_admin':
        # Super admin sees: global (role_target=None) + explicitly targeted at super_admin or their user_id
        query = query.filter(
            db.or_(
                SystemNotification.role_target == 'super_admin',
                SystemNotification.role_target == None,
                SystemNotification.user_id == current_user.id
            )
        )
    else:
        # Agency staff (admin_agence, teller, finance_officer, manager, etc.)
        query = query.filter(
            db.or_(
                db.and_(
                    db.or_(SystemNotification.role_target == current_user.role, SystemNotification.role_target == None),
                    db.or_(SystemNotification.agency_id == current_user.agency_id, SystemNotification.agency_id == None)
                ),
                SystemNotification.user_id == current_user.id
            )
        )

    # Status filter
    status_param = request.args.get('status', 'unread')
    if status_param == 'unread':
        query = query.filter_by(is_read=False, is_archived=False)
    elif status_param == 'read':
        query = query.filter_by(is_read=True, is_archived=False)
    elif status_param == 'archived':
        query = query.filter_by(is_archived=True)
    elif status_param == 'all':
        query = query.filter_by(is_archived=False)

    # Category filter
    category_param = request.args.get('category')
    if category_param:
        query = query.filter_by(category=category_param)

    # Type filter
    type_param = request.args.get('type')
    if type_param:
        query = query.filter_by(type=type_param)

    # Date filter
    date_param = request.args.get('date')
    if date_param:
        try:
            parsed_date = datetime.strptime(date_param, '%Y-%m-%d').date()
            query = query.filter(func.date(SystemNotification.created_at) == parsed_date)
        except ValueError:
            pass

    # Agency filter (super admin only)
    agency_param = request.args.get('agency_id', type=int)
    if agency_param and current_user.role == 'super_admin':
        query = query.filter_by(agency_id=agency_param)

    notifs = query.order_by(SystemNotification.created_at.desc()).all()
    agencies = Agency.query.filter_by(is_deleted=False).all() if current_user.role == 'super_admin' else []

    # Role-specific category groups for tabbed UI
    if current_user.role == 'super_admin':
        category_groups = [
            ('financial',   '💰 Financier',        'text-success'),
            ('agency_mgmt', '🏢 Agences',           'text-primary'),
            ('shift_admin', '📋 Shifts',            'text-warning'),
            ('operations',  '🚌 Opérations',        'text-info'),
            ('security',    '🔐 Sécurité',          'text-danger'),
            ('system',      '⚙️ Système',            'text-muted'),
        ]
    else:
        category_groups = [
            ('booking',    '🎫 Réservations',       'text-success'),
            ('parcel',     '📦 Colis',              'text-primary'),
            ('payment',    '💳 Paiements',          'text-warning'),
            ('wallet',     '👛 Portefeuille',       'text-info'),
            ('shift',      '📋 Shifts',             'text-secondary'),
            ('ops_agency', '🚌 Opérations',         'text-danger'),
        ]

    return render_template(
        'admin/notifications.html',
        notifications=notifs,
        agencies=agencies,
        category_groups=category_groups,
        selected_status=status_param,
        selected_category=category_param,
        selected_type=type_param,
        selected_date=date_param,
        selected_agency=agency_param
    )

@admin.route('/admin/notifications/<int:id>/read', methods=['GET', 'POST'])
@login_required
@admin_required
def read_notification(id):
    from app.models import NotificationRead
    notif = SystemNotification.query.get_or_404(id)
    if current_user.role != 'super_admin' and notif.agency_id and notif.agency_id != current_user.agency_id:
        flash("Accès refusé.", "danger")
        return redirect(url_for('admin.profile') + '#tab-notifications')
        
    existing = NotificationRead.query.filter_by(notification_id=id, user_id=current_user.id).first()
    if not existing:
        record = NotificationRead(notification_id=id, user_id=current_user.id)
        db.session.add(record)
        if current_user.role == 'super_admin' and not notif.user_id:
            notif.is_read = True
        db.session.commit()
        
    flash("Notification marquée comme lue.", "success")
    return redirect(url_for('admin.profile') + '#tab-notifications')

@admin.route('/admin/notifications/read-all', methods=['POST'])
@login_required
@admin_required
def read_all_notifications():
    from app.models import NotificationRead
    
    dismissed_records = NotificationRead.query.filter_by(user_id=current_user.id).all()
    dismissed_ids = [r.notification_id for r in dismissed_records]
    
    query = SystemNotification.query.filter_by(is_deleted=False)
    if dismissed_ids:
        query = query.filter(SystemNotification.id.notin_(dismissed_ids))
        
    if current_user.role == 'super_admin':
        query = query.filter(db.or_(SystemNotification.role_target == 'super_admin', SystemNotification.role_target == None, SystemNotification.user_id == current_user.id))
    elif current_user.role == 'admin_agence':
        query = query.filter(db.or_(db.and_(db.or_(SystemNotification.role_target == current_user.role, SystemNotification.role_target == None), db.or_(SystemNotification.agency_id == current_user.agency_id, SystemNotification.agency_id == None)), SystemNotification.user_id == current_user.id))
    else:
        query = query.filter(SystemNotification.user_id == current_user.id)
        
    for notif in query.all():
        record = NotificationRead(notification_id=notif.id, user_id=current_user.id)
        db.session.add(record)
        if current_user.role == 'super_admin' and not notif.user_id:
            notif.is_read = True
            
    db.session.commit()
    flash("Toutes les notifications ont été marquées comme lues.", "success")
    return redirect(url_for('admin.profile') + '#tab-notifications')

@admin.route('/admin/notifications/<int:id>/archive', methods=['POST'])
@login_required
@admin_required
def archive_notification(id):
    notif = SystemNotification.query.get_or_404(id)
    if current_user.role != 'super_admin' and notif.agency_id and notif.agency_id != current_user.agency_id:
        flash("Accès refusé.", "danger")
        return redirect(url_for('admin.profile') + '#tab-notifications')
    notif.is_archived = True
    db.session.commit()
    flash("Notification archivée.", "success")
    return redirect(url_for('admin.profile') + '#tab-notifications')

@admin.route('/admin/notifications/<int:id>/delete', methods=['POST'])
@login_required
@admin_required
def delete_notification(id):
    notif = SystemNotification.query.get_or_404(id)
    if current_user.role != 'super_admin' and notif.agency_id and notif.agency_id != current_user.agency_id:
        flash("Accès refusé.", "danger")
        return redirect(url_for('admin.profile') + '#tab-notifications')
    notif.is_deleted = True
    db.session.commit()
    flash("Notification supprimée.", "success")
    return redirect(url_for('admin.profile') + '#tab-notifications')


# ============================================================
# === GOOGLE CALENDAR-STYLE TRIP SCHEDULING SYSTEM ===
# ============================================================

def generate_recurring_instances(trip, horizon_days=90):
    """Expand a recurrence rule into a list of {departure_time, arrival_time} dicts."""
    if not trip.recurrence_rule:
        return []
    try:
        rule = json.loads(trip.recurrence_rule)
    except Exception:
        db.session.rollback()
        return []

    rec_type = rule.get('type', 'none')
    if rec_type == 'none':
        return []

    end_date_str = rule.get('end_date')
    if end_date_str:
        try:
            end_date = datetime.strptime(end_date_str, '%Y-%m-%d')
        except Exception:
            end_date = datetime.utcnow() + timedelta(days=horizon_days)
    else:
        end_date = datetime.utcnow() + timedelta(days=horizon_days)

    duration = trip.arrival_time - trip.departure_time
    days_map = {'MON': 0, 'TUE': 1, 'WED': 2, 'THU': 3, 'FRI': 4, 'SAT': 5, 'SUN': 6}
    instances = []
    current = trip.departure_time + timedelta(days=1)

    while current <= end_date:
        add = False
        if rec_type == 'daily':
            add = True
        elif rec_type == 'weekly':
            selected_days = rule.get('days', [])
            day_nums = [days_map.get(d, -1) for d in selected_days]
            if current.weekday() in day_nums:
                add = True
        elif rec_type == 'monthly':
            if current.day == trip.departure_time.day:
                add = True
        elif rec_type == 'yearly':
            if current.month == trip.departure_time.month and current.day == trip.departure_time.day:
                add = True

        if add:
            instances.append({
                'departure_time': current,
                'arrival_time': current + duration
            })
        current += timedelta(days=1)

    return instances


@admin.route('/admin/calendar')
@login_required
@admin_required
def calendar_view():
    check_due_vehicle_restitutions()
    if current_user.role == 'super_admin':
        routes = Route.query.filter_by(is_deleted=False).order_by(Route.origin).all()
        buses = Bus.query.filter_by(is_deleted=False).order_by(Bus.bus_number).all()
        drivers = Driver.query.filter_by(is_deleted=False).order_by(Driver.name).all()
        agencies = Agency.query.filter_by(is_deleted=False).all()
    else:
        routes = Route.query.filter_by(agency_id=current_user.agency_id, is_deleted=False).order_by(Route.origin).all()
        buses = Bus.query.filter_by(agency_id=current_user.agency_id, is_deleted=False).order_by(Bus.bus_number).all()
        drivers = Driver.query.filter_by(agency_id=current_user.agency_id, is_deleted=False).order_by(Driver.name).all()
        agencies = []
    clients = User.query.filter_by(role='client', is_deleted=False).order_by(User.real_name, User.username).all()
    return render_template('admin/calendar.html', routes=routes, buses=buses, drivers=drivers, clients=clients, agencies=agencies)


@admin.route('/api/admin/calendar/events')
@login_required
@admin_required
def calendar_events():
    start_str = request.args.get('start', '')
    end_str = request.args.get('end', '')
    bus_filter = request.args.get('bus_id', '')
    route_filter = request.args.get('route_id', '')
    status_filter = request.args.get('status', '')

    try:
        start_dt = datetime.fromisoformat(start_str[:19]) if start_str else datetime.utcnow() - timedelta(days=30)
        end_dt = datetime.fromisoformat(end_str[:19]) if end_str else datetime.utcnow() + timedelta(days=60)
    except Exception:
        start_dt = datetime.utcnow() - timedelta(days=30)
        end_dt = datetime.utcnow() + timedelta(days=60)

    query = Trip.query.filter(
        Trip.is_deleted == False,
        Trip.departure_time >= start_dt,
        Trip.departure_time <= end_dt
    )

    if current_user.role != 'super_admin':
        query = query.join(Route).filter(Route.agency_id == current_user.agency_id)

    if bus_filter:
        query = query.filter(Trip.bus_id == int(bus_filter))
    if route_filter:
        query = query.filter(Trip.route_id == int(route_filter))
    if status_filter:
        query = query.filter(Trip.status == status_filter)

    trips = query.all()
    events = []
    now = datetime.utcnow()

    for trip in trips:
        confirmed_count = Booking.query.filter_by(trip_id=trip.id, status='confirmed', is_deleted=False).count()
        locked_count = Booking.query.filter(
            Booking.trip_id == trip.id,
            Booking.status == 'locked',
            Booking.locked_until > now,
            Booking.is_deleted == False
        ).count()

        total_booked = confirmed_count + locked_count
        capacity = trip.capacity if trip.capacity > 0 else (trip.bus.capacity if trip.bus else 1)
        fill_pct = min(100, int((total_booked / capacity) * 100)) if capacity > 0 else 0

        if trip.status == 'cancelled':
            color = '#dc3545'
        elif fill_pct >= 100:
            color = '#fd7e14'
        elif confirmed_count > 0:
            color = '#0d6efd'
        else:
            color = '#198754'

        is_recurring = trip.parent_trip_id is not None or bool(trip.recurrence_rule and trip.recurrence_rule not in ('null', 'None'))

        events.append({
            'id': trip.id,
            'title': f"{trip.route.origin} → {trip.route.destination}",
            'start': trip.departure_time.isoformat(),
            'end': trip.arrival_time.isoformat(),
            'backgroundColor': color,
            'borderColor': color,
            'textColor': '#ffffff',
            'extendedProps': {
                'bus': f"{trip.bus.brand or ''} {trip.bus.model} ({trip.bus.bus_number})" if trip.bus else 'N/A',
                'bus_id': trip.bus_id,
                'route_id': trip.route_id,
                'origin': trip.route.origin,
                'destination': trip.route.destination,
                'price': trip.price,
                'capacity': capacity,
                'booked': total_booked,
                'confirmed': confirmed_count,
                'available': max(0, capacity - total_booked),
                'fill_pct': fill_pct,
                'status': trip.status,
                'agency': trip.route.agency.name if trip.route.agency else 'N/A',
                'is_recurring': is_recurring,
            }
        })

    return jsonify(events)


@admin.route('/api/admin/trip/<int:trip_id>')
@login_required
@admin_required
def get_trip_detail(trip_id):
    trip = Trip.query.filter_by(id=trip_id, is_deleted=False).first_or_404()

    if current_user.role != 'super_admin' and trip.route.agency_id != current_user.agency_id:
        return jsonify({'error': 'Accès non autorisé'}), 403

    bookings = Booking.query.filter_by(trip_id=trip.id, is_deleted=False).order_by(Booking.booking_date.desc().nulls_last()).all()
    confirmed = [b for b in bookings if b.status == 'confirmed']
    now = datetime.utcnow()
    locked = [b for b in bookings if b.status == 'locked' and b.locked_until and b.locked_until > now]

    # Load active chat threads from server/data/db.json to match existing in-app client chats
    chat_threads = []
    db_path = os.path.join(os.path.dirname(os.path.dirname(os.path.dirname(__file__))), 'server', 'data', 'db.json')
    if os.path.exists(db_path):
        try:
            with open(db_path, 'r', encoding='utf-8') as f:
                exp_db = json.load(f)
            chat_threads = exp_db.get('chats', [])
        except Exception as e:
            current_app.logger.warning(f"Error loading chats for trip detail: {e}")

    def _find_chat_url(client_name, client_phone, client_email, username):
        p_digits = "".join(c for c in (client_phone or '') if c.isdigit())
        c_name_low = (client_name or '').strip().lower()
        c_email_low = (client_email or '').strip().lower()
        u_low = (username or '').strip().lower()

        for th in chat_threads:
            th_id = str(th.get('id') or th.get('clientId') or '')
            th_phone_digits = "".join(c for c in str(th.get('clientPhone') or '') if c.isdigit())
            th_email_low = str(th.get('clientEmail') or '').strip().lower()
            th_name_low = str(th.get('clientName') or '').strip().lower()

            matched = False
            if u_low and th_id.lower() == u_low:
                matched = True
            elif len(p_digits) >= 8 and len(th_phone_digits) >= 8 and th_phone_digits.endswith(p_digits[-8:]):
                matched = True
            elif c_email_low and th_email_low and c_email_low == th_email_low:
                matched = True
            elif c_name_low and th_name_low and (c_name_low == th_name_low or c_name_low in th_name_low or th_name_low in c_name_low):
                matched = True

            if matched and th_id:
                return url_for('admin.chats', client_id=th_id)
        return None

    capacity = trip.capacity if trip.capacity > 0 else (trip.bus.capacity if trip.bus else 1)
    booked_seats = {b.seat_number: b.status for b in bookings if b.status in ['confirmed', 'locked']}

    booking_list = []
    for b in bookings:
        c_name = b.passenger_name or (b.user.real_name if (b.user and b.user.real_name) else (b.user.username if b.user else 'Client VIP 3M'))
        c_phone = (b.user.phone if (b.user and b.user.phone) else (b.special_instructions or ''))
        c_email = b.user.email if b.user else ''
        c_username = b.user.username if b.user else ''
        chat_url = _find_chat_url(c_name, c_phone, c_email, c_username)
        formula_val = b.passenger_category if (b.passenger_category and b.passenger_category != 'Adult') else (b.seat_number if b.seat_number not in ['VIP', 'VIP-CAR'] else 'Chauffeur VIP Inclus')
        booking_list.append({
            'id': b.id,
            'code': b.booking_code or f'3M-MIS-{b.id:04d}',
            'passenger': c_name,
            'phone': c_phone or 'Contact direct',
            'formula': formula_val,
            'seat': b.seat_number,
            'status': b.status,
            'payment_status': b.payment_status,
            'price': b.price_paid if (b.price_paid and b.price_paid > 0) else trip.price,
            'date': b.booking_date.strftime('%d/%m/%Y %H:%M') if b.booking_date else '',
            'has_chat': bool(chat_url),
            'chat_url': chat_url,
            'edit_url': url_for('admin.edit_booking', id=b.id)
        })

    recurrence_info = None
    if trip.recurrence_rule and trip.recurrence_rule not in ('null', 'None'):
        try:
            recurrence_info = json.loads(trip.recurrence_rule)
        except Exception:
            db.session.rollback()
            pass

    driver_label = trip.driver.name if trip.driver else (trip.bus.driver_name if (trip.bus and trip.bus.driver_name) else 'Chauffeur VIP Dédié')

    return jsonify({
        'id': trip.id,
        'origin': trip.route.origin if trip.route else 'Yaoundé',
        'destination': trip.route.destination if trip.route else 'Mission VIP',
        'agency': trip.route.agency.name if (trip.route and trip.route.agency) else '3M SERVICES VIP',
        'driver': driver_label,
        'bus': f"{trip.bus.brand or ''} {trip.bus.model} ({trip.bus.bus_number})".strip() if trip.bus else 'Véhicule VIP',
        'bus_id': trip.bus_id,
        'route_id': trip.route_id,
        'departure': trip.departure_time.strftime('%d/%m/%Y %H:%M'),
        'arrival': trip.arrival_time.strftime('%d/%m/%Y %H:%M'),
        'departure_iso': trip.departure_time.isoformat(),
        'arrival_iso': trip.arrival_time.isoformat(),
        'price': trip.price,
        'status': trip.status,
        'capacity': capacity,
        'confirmed_count': len(confirmed),
        'locked_count': len(locked),
        'bookings': booking_list,
        'booked_seats': booked_seats,
        'is_recurring': trip.parent_trip_id is not None or bool(trip.recurrence_rule and trip.recurrence_rule not in ('null', 'None')),
        'recurrence': recurrence_info,
        'parent_trip_id': trip.parent_trip_id,
    })


@admin.route('/api/admin/trip/<int:trip_id>/move', methods=['POST'])
@login_required
@admin_required
def move_trip(trip_id):
    trip = Trip.query.filter_by(id=trip_id, is_deleted=False).first_or_404()

    if current_user.role != 'super_admin' and trip.route.agency_id != current_user.agency_id:
        return jsonify({'error': 'Accès non autorisé'}), 403

    data = request.get_json()
    new_start = data.get('start', '')
    new_end = data.get('end', '')

    try:
        new_departure = datetime.fromisoformat(new_start[:19])
        if new_end:
            new_arrival = datetime.fromisoformat(new_end[:19])
        else:
            new_arrival = new_departure + (trip.arrival_time - trip.departure_time)
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': f'Format de date invalide: {e}'}), 400

    conflict = Trip.query.filter(
        Trip.bus_id == trip.bus_id,
        Trip.id != trip.id,
        Trip.is_deleted == False,
        Trip.status != 'cancelled',
        Trip.departure_time < new_arrival,
        Trip.arrival_time > new_departure
    ).first()

    if conflict:
        return jsonify({
            'error': 'Conflit détecté',
            'message': f'Bus déjà assigné: {conflict.route.origin} → {conflict.route.destination} ({conflict.departure_time.strftime("%d/%m %H:%M")}–{conflict.arrival_time.strftime("%H:%M")})'
        }), 409

    old_dt = trip.departure_time
    trip.departure_time = new_departure
    trip.arrival_time = new_arrival
    db.session.commit()
    log_audit("TRIP_RESCHEDULED", "Trip", trip.id,
              f"Trip #{trip.id} glissé de {old_dt} vers {new_departure}")

    return jsonify({'success': True, 'trip_id': trip.id})


@admin.route('/api/admin/trip/create', methods=['POST'])
@login_required
@admin_required
def create_trip_api():
    data = request.get_json() or {}

    route_id = data.get('route_id')
    bus_id = data.get('bus_id')
    driver_id = data.get('driver_id')
    departure_str = data.get('departure_time')
    arrival_str = data.get('arrival_time')
    price = data.get('price')
    capacity = data.get('capacity', 0)
    recurrence = data.get('recurrence')
    client_user_id = data.get('client_user_id')
    client_name = (data.get('client_name') or '').strip()
    client_phone = (data.get('client_phone') or '').strip()
    formula = (data.get('formula') or 'Chauffeur VIP Inclus').strip()
    payment_method = (data.get('payment_method') or 'momo').strip()
    payment_status = (data.get('payment_status') or ('pending' if payment_method == 'pending' else 'paid')).strip()
    notify_restitution = data.get('notify_restitution', True)

    if not all([route_id, bus_id, departure_str, arrival_str, price]):
        return jsonify({'error': 'Champs obligatoires manquants'}), 400

    try:
        departure_dt = datetime.strptime(departure_str[:16], '%Y-%m-%dT%H:%M')
        arrival_dt = datetime.strptime(arrival_str[:16], '%Y-%m-%dT%H:%M')
    except Exception:
        db.session.rollback()
        return jsonify({'error': 'Format de date invalide'}), 400

    if departure_dt >= arrival_dt:
        return jsonify({'error': "La date de sortie doit être avant la date de restitution"}), 400

    route = Route.query.filter_by(id=route_id, is_deleted=False).first()
    if not route:
        return jsonify({'error': 'Mission / Trajet introuvable'}), 404
    if current_user.role != 'super_admin' and route.agency_id != current_user.agency_id:
        return jsonify({'error': 'Accès non autorisé'}), 403

    conflict = Trip.query.filter(
        Trip.bus_id == bus_id,
        Trip.is_deleted == False,
        Trip.status != 'cancelled',
        Trip.departure_time < arrival_dt,
        Trip.arrival_time > departure_dt
    ).first()

    if conflict:
        return jsonify({
            'error': 'Conflit de véhicule VIP détecté',
            'message': f"Véhicule VIP déjà en mission : {conflict.route.origin} → {conflict.route.destination} ({conflict.departure_time.strftime('%d/%m %H:%M')}–{conflict.arrival_time.strftime('%d/%m %H:%M')})"
        }), 409

    recurrence_json = None
    if recurrence and recurrence.get('type', 'none') != 'none':
        recurrence_json = json.dumps(recurrence)

    bus = Bus.query.get(bus_id)
    effective_capacity = int(capacity) if (capacity and int(capacity) > 0) else (bus.capacity if bus else 5)
    driver_id_int = int(driver_id) if driver_id else None

    trip = Trip(
        route_id=int(route_id),
        bus_id=int(bus_id),
        driver_id=driver_id_int,
        departure_time=departure_dt,
        arrival_time=arrival_dt,
        price=float(price),
        capacity=effective_capacity,
        recurrence_rule=recurrence_json,
        status='scheduled'
    )
    db.session.add(trip)
    db.session.flush()

    # Resolve/upsert client VIP and create linked Booking for the 11-column missions table
    client_user = User.query.get(int(client_user_id)) if client_user_id else None
    if not client_user and (client_name or client_phone):
        client_user = _upsert_visitor_user(client_name, client_phone, '', 'Yaoundé')

    if client_user and not client_name:
        client_name = client_user.real_name or client_user.username
    if client_user and not client_phone and client_user.phone:
        client_phone = client_user.phone

    target_user = client_user or User.query.filter_by(role='client', is_deleted=False).first() or current_user
    final_client = client_name or (target_user.real_name or target_user.username if target_user else "Client VIP 3M")

    b_code = f"3M-MIS-{datetime.utcnow().strftime('%y%m%d')}-{random.randint(100, 999)}"
    booking = Booking(
        user_id=target_user.id,
        trip_id=trip.id,
        seat_number="VIP-CAR",
        passenger_category=formula[:50],
        passenger_name=final_client,
        booking_code=b_code,
        price_paid=float(price),
        status="confirmed",
        payment_status=payment_status,
        payment_method=payment_method,
        booking_date=datetime.utcnow(),
        return_date=arrival_dt,
        num_persons=1,
        special_instructions=client_phone or ""
    )
    db.session.add(booking)
    trip.occupied_seats = 1

    created_count = 1

    if recurrence_json:
        instances = generate_recurring_instances(trip, horizon_days=90)
        for inst in instances:
            inst_conflict = Trip.query.filter(
                Trip.bus_id == bus_id,
                Trip.is_deleted == False,
                Trip.status != 'cancelled',
                Trip.departure_time < inst['arrival_time'],
                Trip.arrival_time > inst['departure_time']
            ).first()
            if not inst_conflict:
                child = Trip(
                    route_id=int(route_id),
                    bus_id=int(bus_id),
                    driver_id=driver_id_int,
                    departure_time=inst['departure_time'],
                    arrival_time=inst['arrival_time'],
                    price=float(price),
                    capacity=effective_capacity,
                    parent_trip_id=trip.id,
                    status='scheduled'
                )
                db.session.add(child)
                created_count += 1

    db.session.commit()

    car_label = f"{bus.brand} {bus.model} ({bus.bus_number})" if bus else "Véhicule VIP"
    if notify_restitution:
        trigger_notification(
            title=f"🚗 Mission VIP Planifiée : {car_label}",
            message=f"Mission calendrier créée pour {final_client}.\n• Sortie : {departure_dt.strftime('%d/%m/%Y %H:%M')}\n• Restitution prévue : {arrival_dt.strftime('%d/%m/%Y %H:%M')}\nNotification Restitution Automatique Active.",
            type="info", category='operations', role_target='super_admin'
        )
        check_due_vehicle_restitutions()

    log_audit("TRIP_CREATED_CALENDAR", "Trip", trip.id,
              f"Mission VIP créée via calendrier: #{trip.id} ({car_label} — {final_client}), {created_count} instance(s)")

    return jsonify({'success': True, 'trip_id': trip.id, 'booking_code': b_code, 'instances_created': created_count})


@admin.route('/api/admin/trip/<int:trip_id>/duplicate', methods=['POST'])
@login_required
@admin_required
def duplicate_trip(trip_id):
    trip = Trip.query.filter_by(id=trip_id, is_deleted=False).first_or_404()

    if current_user.role != 'super_admin' and trip.route.agency_id != current_user.agency_id:
        return jsonify({'error': 'Accès non autorisé'}), 403

    data = request.get_json()
    new_date_str = data.get('date', '')

    try:
        new_date = datetime.strptime(new_date_str, '%Y-%m-%d')
    except Exception:
        db.session.rollback()
        return jsonify({'error': 'Format de date invalide (YYYY-MM-DD attendu)'}), 400

    duration = trip.arrival_time - trip.departure_time
    new_departure = new_date.replace(
        hour=trip.departure_time.hour,
        minute=trip.departure_time.minute,
        second=0
    )
    new_arrival = new_departure + duration

    new_trip = Trip(
        route_id=trip.route_id,
        bus_id=trip.bus_id,
        driver_id=trip.driver_id,
        departure_time=new_departure,
        arrival_time=new_arrival,
        price=trip.price,
        capacity=trip.capacity,
        status='scheduled'
    )
    db.session.add(new_trip)
    db.session.flush()

    # Duplicate primary client VIP contract if one exists on the original mission
    orig_booking = trip.bookings.filter_by(is_deleted=False).first()
    if orig_booking:
        dup_code = f"3M-MIS-{datetime.utcnow().strftime('%y%m%d')}-{random.randint(100, 999)}"
        dup_booking = Booking(
            user_id=orig_booking.user_id,
            trip_id=new_trip.id,
            seat_number=orig_booking.seat_number or 'VIP-CAR',
            passenger_category=orig_booking.passenger_category,
            passenger_name=orig_booking.passenger_name,
            booking_code=dup_code,
            price_paid=orig_booking.price_paid,
            status='confirmed',
            payment_status=orig_booking.payment_status or 'pending',
            payment_method=orig_booking.payment_method or 'momo',
            booking_date=datetime.utcnow(),
            return_date=new_arrival,
            num_persons=orig_booking.num_persons or 1,
            special_instructions=orig_booking.special_instructions or ''
        )
        db.session.add(dup_booking)
        new_trip.occupied_seats = 1

    db.session.commit()

    log_audit("TRIP_DUPLICATED", "Trip", new_trip.id,
              f"Mission VIP dupliquée depuis #{trip.id} vers {new_date_str}")
    return jsonify({'success': True, 'new_trip_id': new_trip.id})


@admin.route('/api/admin/trip/<int:trip_id>/cancel', methods=['POST'])
@login_required
@admin_required
def cancel_trip_api(trip_id):
    trip = Trip.query.filter_by(id=trip_id, is_deleted=False).first_or_404()
    if current_user.role != 'super_admin' and trip.route.agency_id != current_user.agency_id:
        return jsonify({'error': 'Accès non autorisé'}), 403

    trip.status = 'cancelled'
    affected = Booking.query.filter_by(trip_id=trip.id, is_deleted=False).all()
    for b in affected:
        if b.status != 'cancelled':
            b.status = 'cancelled'
            if b.payment_status == 'paid':
                b.payment_status = 'refunded'
                b.refund_amount = b.price_paid

    db.session.commit()
    log_audit("TRIP_CANCELLED_CALENDAR", "Trip", trip.id, f"Mission VIP #{trip.id} annulée depuis le calendrier")
    return jsonify({'success': True, 'trip_id': trip.id, 'status': 'cancelled'})


@admin.route('/api/admin/trip/<int:trip_id>/delete', methods=['POST'])
@login_required
@admin_required
def delete_trip_api(trip_id):
    trip = Trip.query.filter_by(id=trip_id, is_deleted=False).first_or_404()
    if current_user.role != 'super_admin' and trip.route.agency_id != current_user.agency_id:
        return jsonify({'error': 'Accès non autorisé'}), 403

    now_utc = datetime.utcnow()
    trip.is_deleted = True
    trip.deleted_at = now_utc
    affected = Booking.query.filter_by(trip_id=trip.id, is_deleted=False).all()
    for b in affected:
        b.is_deleted = True
        b.deleted_at = now_utc

    db.session.commit()
    log_audit("TRIP_DELETED_CALENDAR", "Trip", trip.id, f"Mission VIP #{trip.id} supprimée depuis le calendrier")
    return jsonify({'success': True, 'trip_id': trip.id})


@admin.route('/api/admin/conflict-check', methods=['POST'])
@login_required
@admin_required
def conflict_check():
    data = request.get_json()
    bus_id = data.get('bus_id')
    departure_str = data.get('departure_time', '')
    arrival_str = data.get('arrival_time', '')
    exclude_trip_id = data.get('exclude_trip_id')

    if not bus_id or not departure_str or not arrival_str:
        return jsonify({'conflict': False})

    try:
        departure_dt = datetime.strptime(departure_str, '%Y-%m-%dT%H:%M')
        arrival_dt = datetime.strptime(arrival_str, '%Y-%m-%dT%H:%M')
    except Exception:
        db.session.rollback()
        return jsonify({'conflict': False})

    query = Trip.query.filter(
        Trip.bus_id == bus_id,
        Trip.is_deleted == False,
        Trip.status != 'cancelled',
        Trip.departure_time < arrival_dt,
        Trip.arrival_time > departure_dt
    )
    if exclude_trip_id:
        query = query.filter(Trip.id != int(exclude_trip_id))

    conflict = query.first()
    if conflict:
        return jsonify({
            'conflict': True,
            'message': f"Bus déjà assigné: {conflict.route.origin} → {conflict.route.destination} ({conflict.departure_time.strftime('%d/%m %H:%M')}–{conflict.arrival_time.strftime('%H:%M')})"
        })

    return jsonify({'conflict': False})
@admin.route('/api/booking/<int:booking_id>/change_seat', methods=['POST'])
@login_required
@teller_required
def change_seat(booking_id):
    booking = Booking.query.get_or_404(booking_id)
    if current_user.role != 'super_admin' and booking.trip.route.agency_id != current_user.agency_id:
        from flask import jsonify
        return jsonify({'success': False, 'message': 'Accès refusé'}), 403
        
    data = request.get_json()
    new_seat = data.get('new_seat')
    if not new_seat:
        from flask import jsonify
        return jsonify({'success': False, 'message': 'Siège manquant'}), 400
        
    # Verify seat is not occupied
    trip = booking.trip
    existing_booking = Booking.query.filter_by(trip_id=trip.id, seat_number=new_seat, status='confirmed').first()
    if existing_booking and existing_booking.id != booking.id:
        from flask import jsonify
        return jsonify({'success': False, 'message': 'Siège déjà occupé'}), 400
        
    old_seat = booking.seat_number
    booking.seat_number = new_seat
    db.session.commit()
    
    log_audit("TELLER_SEAT_CHANGE", "Booking", booking.id, f"Seat changed from {old_seat} to {new_seat}")
    
    # Notify if caisse is closed
    caisse = get_current_caisse(current_user.agency_id)
    if not caisse:
        from app.models import SystemNotification
        notif = SystemNotification(
            title="Modification Hors Caisse",
            message=f"Le guichetier {current_user.username} a modifié le siège du passager {booking.passenger_name} (Réservation: {booking.booking_code}) alors que la caisse était fermée.",
            type="warning",
            agency_id=current_user.agency_id
        )
        db.session.add(notif)
        db.session.commit()
        
    from flask import jsonify
    return jsonify({'success': True})

@admin.route('/admin/caisse/toggle', methods=['GET', 'POST'])
@login_required
@teller_required
def toggle_caisse():
    # Determine agency – for super_admin allow passing via query string or form
    if request.method == 'POST':
        agency_id = current_user.agency_id if current_user.role != 'super_admin' else request.form.get('agency_id', type=int)
    else:
        agency_id = current_user.agency_id if current_user.role != 'super_admin' else request.args.get('agency_id', type=int)
    caisse = get_current_caisse(agency_id)
    
    if caisse:
        # Close the caisse
        caisse.status = 'closed'
        caisse.closed_by_id = current_user.id
        caisse.closed_at = datetime.utcnow()
        
        # Calculate totals from bookings made while caisse was open
        bookings = Booking.query.filter(
            Booking.booking_date >= caisse.opened_at,
            Booking.booking_date <= caisse.closed_at,
            Booking.status == 'confirmed',
            Booking.is_deleted == False
        )
        
        if agency_id:
            bookings = bookings.join(Trip).join(Route).filter(Route.agency_id == agency_id)
            
        bookings = bookings.all()
        
        # Aggregate amounts
        total_cash = sum(b.price_paid for b in bookings if b.payment_method == 'Cash')
        total_momo = sum(b.price_paid for b in bookings if b.payment_method == 'Mobile Money (Guichet)' or b.payment_method == 'Carte Bancaire')
        
        # Optional manual entry from form
        caisse.actual_cash = request.form.get('actual_cash', type=float) or total_cash
        caisse.actual_momo = request.form.get('actual_momo', type=float) or total_momo
        
        caisse.expected_cash = total_cash
        caisse.expected_momo = total_momo
        
        db.session.commit()
        log_audit("CAISSE_CLOSED", "CaisseSession", caisse.id, f"Closed caisse for agency {agency_id}. Expected Cash: {total_cash}, Actual Cash: {caisse.actual_cash}. Expected MOMO: {total_momo}, Actual MOMO: {caisse.actual_momo}")
        trigger_notification("Caisse Fermée", f"La caisse de l'agence a été fermée par {current_user.username}.", "info", agency_id=agency_id)
        flash(f"Caisse fermée. Recette Cash: {total_cash} FCFA | Recette OM/MOMO: {total_momo} FCFA", "success")
        
    else:
        # No existing open caisse – open a new one
        # Open a new caisse
        new_caisse = CaisseSession(
            agency_id=agency_id,
            opened_by_id=current_user.id,
            status='open'
        )
        db.session.add(new_caisse)
        db.session.commit()
        log_audit("CAISSE_OPENED", "CaisseSession", new_caisse.id, f"Opened caisse for agency {agency_id}")
        trigger_notification("Caisse Ouverte", f"La caisse de l'agence a été ouverte par {current_user.username}.", "success", agency_id=agency_id)
        flash("La caisse a été ouverte avec succès. Les guichetiers peuvent maintenant vendre.", "success")

    # Redirect to teller dashboard after toggle
    if agency_id:
        return redirect(url_for('admin.teller_dashboard', agency_id=agency_id))
    return redirect(url_for('admin.teller_dashboard'))

# === SHIFT MANAGEMENT (Daily Shift Reconciliation - EPIC 10) ===

from app.models import Shift, Parcel, Withdrawal, Booking, Trip, Route, User, Agency, AuditLog, SystemNotification

def aggregate_shift_metrics(agency_id, shift_date):
    start_dt = datetime.combine(shift_date, datetime.min.time())
    end_dt = datetime.combine(shift_date, datetime.max.time())
    
    # Bookings
    bookings_q = Booking.query.filter(
        Booking.booking_date >= start_dt,
        Booking.booking_date <= end_dt,
        Booking.is_deleted == False
    )
    if agency_id:
        bookings_q = bookings_q.join(Trip).join(Route).filter(Route.agency_id == agency_id)
    bookings = bookings_q.all()
    
    tickets_count = len([b for b in bookings if b.status == 'confirmed'])
    tickets_revenue = sum(b.price_paid for b in bookings if b.status == 'confirmed')
    passenger_count = sum(b.num_persons for b in bookings if b.status == 'confirmed')
    cancelled_tickets = len([b for b in bookings if b.status == 'cancelled'])
    
    # Refunds
    refund_amount = sum(b.refund_amount for b in bookings)
    
    # Parcels
    parcels_q = Parcel.query.filter(
        Parcel.created_at >= start_dt,
        Parcel.created_at <= end_dt,
        Parcel.status != 'cancelled'
    )
    if agency_id:
        parcels_q = parcels_q.filter(Parcel.agency_id == agency_id)
    parcels = parcels_q.all()
    
    parcels_count = len(parcels)
    parcels_revenue = sum(p.price for p in parcels)
    
    # Withdrawals
    withdrawals_q = Withdrawal.query.filter(
        Withdrawal.created_at >= start_dt,
        Withdrawal.created_at <= end_dt,
        Withdrawal.status == 'approved'
    )
    if agency_id:
        withdrawals_q = withdrawals_q.filter(Withdrawal.agency_id == agency_id)
    withdrawals = withdrawals_q.all()
    
    withdrawal_amount = sum(w.amount for w in withdrawals)
    
    # Commission and Earnings
    total_revenue = tickets_revenue + parcels_revenue
    commission_amount = 0.0
    agency_earnings = total_revenue - refund_amount
    
    # MoMo and Orange breakdown
    momo_rev = sum(b.price_paid for b in bookings if b.status == 'confirmed' and (b.payment_method == 'momo' or 'momo' in (b.payment_method or '').lower() or 'mobile money' in (b.payment_method or '').lower()))
    orange_rev = sum(b.price_paid for b in bookings if b.status == 'confirmed' and (b.payment_method == 'orange' or 'orange' in (b.payment_method or '').lower()))
    
    momo_rev += sum(p.price for p in parcels if p.payment_method == 'momo')
    orange_rev += sum(p.price for p in parcels if p.payment_method == 'orange')
    
    return {
        'tickets_count': tickets_count,
        'tickets_revenue': tickets_revenue,
        'passenger_count': passenger_count,
        'cancelled_tickets': cancelled_tickets,
        'refund_amount': refund_amount,
        'parcels_count': parcels_count,
        'parcels_revenue': parcels_revenue,
        'withdrawal_amount': withdrawal_amount,
        'total_revenue': total_revenue,
        'commission_amount': commission_amount,
        'agency_earnings': agency_earnings,
        'momo_revenue': momo_rev,
        'orange_revenue': orange_rev
    }

@admin.before_request
def check_and_manage_shifts():
    """Auto-manage shifts on each admin request.
    
    IMPORTANT: This runs before EVERY admin request including login.
    Never raise unhandled exceptions here — wrap everything in try/except
    so that login continues working even if the DB is partially migrated.
    """
    from flask import has_request_context, current_app as _app
    if not has_request_context():
        return
    if not request.endpoint or not request.endpoint.startswith('admin.'):
        return
    # Skip for static files
    if 'static' in request.endpoint:
        return

    try:
        today = datetime.utcnow().date()
        agencies = Agency.query.filter_by(is_deleted=False).all()

        for agency in agencies:
            # 1. Auto-close overdue open shifts
            overdue_shifts = Shift.query.filter(
                Shift.agency_id == agency.id,
                Shift.status == 'open',
                Shift.date < today
            ).all()

            for shift in overdue_shifts:
                try:
                    metrics = aggregate_shift_metrics(shift.agency_id, shift.date)
                    shift.tickets_sold = metrics['tickets_count']
                    shift.tickets_count = metrics['tickets_count']
                    shift.tickets_revenue = metrics['tickets_revenue']
                    shift.total_revenue = metrics['total_revenue']
                    shift.momo_revenue = metrics['momo_revenue']
                    shift.orange_revenue = metrics['orange_revenue']
                    shift.passenger_count = metrics['passenger_count']
                    shift.cancelled_tickets = metrics['cancelled_tickets']
                    shift.parcels_count = metrics['parcels_count']
                    shift.parcels_revenue = metrics['parcels_revenue']
                    shift.refund_amount = metrics['refund_amount']
                    shift.commission_amount = metrics['commission_amount']
                    shift.agency_earnings = metrics['agency_earnings']
                    shift.withdrawal_amount = metrics['withdrawal_amount']
                    shift.status = 'auto_closed'
                    shift.closed_at = datetime.combine(shift.date, datetime.max.time())
                    shift.summary_notes = "Shift closed automatically by System. Admin forgot to close manually."
                    db.session.flush()  # Flush the shift update before notification
                except Exception as shift_err:
                    db.session.rollback()
                    _app.logger.error(f"[ShiftAutoClose] Failed to close shift {shift.id}: {shift_err}")
                    continue

                # Create notification — wrapped separately so a missing column
                # (e.g. 'category' not yet migrated) cannot crash the request.
                try:
                    notif = SystemNotification(
                        title=f"Shift {shift.date.strftime('%d/%m/%Y')} Auto-Clôturé",
                        message=(
                            f"Le shift du {shift.date.strftime('%d/%m/%Y')} pour "
                            f"{agency.name} a été automatiquement clôturé par le système."
                        ),
                        type='warning',
                        category='shift_admin',
                        agency_id=agency.id,
                    )
                    db.session.add(notif)
                    db.session.flush()
                except Exception as notif_err:
                    db.session.rollback()
                    _app.logger.warning(
                        f"[ShiftAutoClose] Notification skipped for shift {shift.id}: {notif_err}"
                    )

            # 2. Auto-open today's shift if not exists
            try:
                today_shift = Shift.query.filter_by(
                    agency_id=agency.id,
                    date=today
                ).first()

                if not today_shift:
                    new_shift = Shift(
                        agency_id=agency.id,
                        date=today,
                        status='open',
                        opened_at=datetime.combine(today, datetime.min.time()),
                        tickets_sold=0,
                        tickets_count=0,
                        tickets_revenue=0.0,
                        total_revenue=0.0,
                        momo_revenue=0.0,
                        orange_revenue=0.0,
                        passenger_count=0,
                        cancelled_tickets=0,
                        parcels_count=0,
                        parcels_revenue=0.0,
                        refund_amount=0.0,
                        commission_amount=0.0,
                        agency_earnings=0.0,
                        withdrawal_amount=0.0
                    )
                    db.session.add(new_shift)
                    db.session.flush()
            except Exception as open_err:
                db.session.rollback()
                _app.logger.error(f"[ShiftAutoOpen] Failed for agency {agency.id}: {open_err}")
                continue

        db.session.commit()

    except Exception as e:
        db.session.rollback()
        try:
            from flask import current_app as _ca
            _ca.logger.error(f"[check_and_manage_shifts] Unhandled error: {e}")
        except Exception:
            import logging
            logging.getLogger(__name__).error(f"[check_and_manage_shifts] Unhandled error: {e}")

@admin.route('/admin/shifts', methods=['GET', 'POST'])
@admin.route('/admin/reports', methods=['GET', 'POST'])
@login_required
@admin_required
def shifts():
    check_due_vehicle_restitutions()

    if request.method == 'POST':
        op_date_str = (request.form.get('operation_date') or date.today().strftime('%Y-%m-%d')).strip()
        mission_summary = (request.form.get('mission_summary') or '').strip()
        messages_summary = (request.form.get('messages_summary') or '').strip()
        apartment_summary = (request.form.get('apartment_summary') or '').strip()
        driver_summary = (request.form.get('driver_summary') or '').strip()
        rating_val = request.form.get('rating', 4.9, type=float)
        rep_agency_id = request.form.get('agency_id', type=int) or current_user.agency_id
        notes = (request.form.get('notes') or '').strip()

        summary_text = (
            f"Opérations du {op_date_str} | "
            f"Sorties & Missions VIP: {mission_summary or 'RAS'} | "
            f"Messages: {messages_summary or 'RAS'} | "
            f"Appartements VIP (Tsinga / Face FECAFOOT): {apartment_summary or 'RAS'} | "
            f"Drivers: {driver_summary or 'RAS'} | "
            f"Note VIP: {rating_val:.1f}/5.0"
            + (f" | Notes: {notes}" if notes else "")
        )

        log_audit("DAILY_OPERATION_REPORT", "DailyReport", rep_agency_id or 0, summary_text)
        trigger_notification(
            title=f"📋 Rapport des Opérations du Jour — {op_date_str}",
            message=summary_text,
            type="success",
            agency_id=rep_agency_id,
            category="operations",
            role_target="super_admin"
        )
        flash("Rapport des opérations du jour enregistré avec succès !", "success")
        return redirect(url_for('admin.shifts'))

    agencies = []
    selected_agency = None

    if current_user.role == 'super_admin':
        agencies = Agency.query.filter_by(is_deleted=False).all()
        agency_id_param = request.args.get('agency_id', type=int)
        if agency_id_param:
            selected_agency = Agency.query.get(agency_id_param)
            agency_id = agency_id_param
        else:
            agency_id = None
    else:
        agency_id = current_user.agency_id
        selected_agency = current_user.agency

    today = date.today()
    now_dt = datetime.now()

    # Date & Period for Daily Operations Report
    period = request.args.get('period', 'day').strip()
    date_param = request.args.get('date')
    report_date = today
    if date_param:
        try:
            report_date = datetime.strptime(date_param, '%Y-%m-%d').date()
        except ValueError:
            report_date = today

    # Active shift for current agency
    active_shift = None
    active_metrics = None
    if agency_id:
        active_shift = Shift.query.filter_by(agency_id=agency_id, date=today, status='open').first()
        if active_shift:
            active_metrics = aggregate_shift_metrics(agency_id, today)
    else:
        active_metrics = aggregate_shift_metrics(None, today)

    # ── PILLAR 1: Sorties & Missions de Flotte VIP ──
    b_query = Booking.query.filter_by(is_deleted=False)
    if current_user.role != 'super_admin':
        trip_ids_q = db.session.query(Trip.id).join(Route).filter(Route.agency_id == current_user.agency_id, Trip.is_deleted == False)
        b_query = b_query.filter(Booking.trip_id.in_(trip_ids_q))
    elif agency_id:
        trip_ids_q = db.session.query(Trip.id).join(Route).filter(Route.agency_id == agency_id, Trip.is_deleted == False)
        b_query = b_query.filter(Booking.trip_id.in_(trip_ids_q))

    all_bookings = b_query.order_by(Booking.booking_date.desc().nulls_last()).all()

    def _is_booking_on_date(b, target_d):
        if b.booking_date and b.booking_date.date() == target_d:
            return True
        if b.trip and b.trip.departure_time and b.trip.arrival_time:
            if b.trip.departure_time.date() <= target_d <= b.trip.arrival_time.date():
                return True
        elif b.trip and b.trip.departure_time and b.trip.departure_time.date() == target_d:
            return True
        return False

    today_bookings = [b for b in all_bookings if _is_booking_on_date(b, report_date)]

    if period == 'day':
        report_bookings = today_bookings if today_bookings else all_bookings
        is_today_fallback = (len(today_bookings) == 0 and len(all_bookings) > 0)
    elif period == 'week':
        cutoff_w = report_date - timedelta(days=6)
        report_bookings = [
            b for b in all_bookings
            if (b.booking_date and cutoff_w <= b.booking_date.date() <= report_date)
            or (b.trip and b.trip.departure_time and cutoff_w <= b.trip.departure_time.date() <= report_date + timedelta(days=7))
        ]
        is_today_fallback = False
    elif period == 'month':
        cutoff_m = report_date - timedelta(days=29)
        report_bookings = [
            b for b in all_bookings
            if (b.booking_date and cutoff_m <= b.booking_date.date() <= report_date)
            or (b.trip and b.trip.departure_time and cutoff_m <= b.trip.departure_time.date() <= report_date + timedelta(days=30))
        ]
        is_today_fallback = False
    else:
        report_bookings = all_bookings
        is_today_fallback = False

    cars_out_count = sum(
        1 for b in report_bookings
        if b.status != 'cancelled' and b.trip and b.trip.status in ['scheduled', 'departed', 'boarding']
    )
    missions_confirmed_count = sum(1 for b in report_bookings if b.status == 'confirmed')
    restitutions_due_count = sum(
        1 for b in report_bookings
        if b.status != 'cancelled' and b.trip and b.trip.arrival_time and b.trip.arrival_time <= now_dt and b.trip.status in ['scheduled', 'departed', 'boarding']
    )
    missions_revenue = sum(
        float(b.price_paid if (b.price_paid and b.price_paid > 0) else (b.trip.price if b.trip else 0))
        for b in report_bookings if b.status != 'cancelled'
    )

    # ── PILLAR 2: Messages & Chat Privé 3M ──
    import json as _json
    db_path = os.path.join(os.path.dirname(os.path.dirname(os.path.dirname(__file__))), 'server', 'data', 'db.json')
    chat_threads = []
    if os.path.exists(db_path):
        try:
            with open(db_path, 'r', encoding='utf-8') as f:
                exp_db = _json.load(f)
            chat_threads = exp_db.get('chats', [])
        except Exception as e:
            current_app.logger.warning(f"Error reading chats in reports: {e}")

    total_chats = len(chat_threads)
    unread_chats_count = sum(int(c.get('unreadAdmin', 0) or 0) for c in chat_threads)
    total_messages_count = sum(len(c.get('messages', [])) for c in chat_threads)

    # ── PILLAR 3: Appartements VIP (/admin/locations) ──
    apartments_list = Apartment.query.filter_by(is_deleted=False).order_by(Apartment.id.asc()).all()
    apartments_total = len(apartments_list)
    apartments_available = sum(1 for a in apartments_list if a.status == 'Disponible')
    apartments_occupied = sum(1 for a in apartments_list if a.status in ['Occupé', 'Réservé'])

    # ── PILLAR 4: Chauffeurs VIP (Drivers) ──
    if current_user.role == 'super_admin' and not agency_id:
        drivers_list = Driver.query.filter_by(is_deleted=False).order_by(Driver.id.asc()).all()
    else:
        target_aid = agency_id or current_user.agency_id
        drivers_list = Driver.query.filter_by(agency_id=target_aid, is_deleted=False).order_by(Driver.id.asc()).all()

    driver_missions = {}
    for drv in drivers_list:
        latest_trip = Trip.query.filter_by(driver_id=drv.id, is_deleted=False).order_by(Trip.departure_time.desc()).first()
        driver_missions[drv.id] = latest_trip

    drivers_total = len(drivers_list)
    drivers_active_count = sum(1 for d in drivers_list if (d.status or 'available').lower() in ['available', 'active', 'on_trip'])
    drivers_avg_rating = round(sum((d.rating or 5.0) for d in drivers_list) / len(drivers_list), 1) if drivers_list else 5.0

    # Build filter query for historical shift list
    query = Shift.query
    if current_user.role == 'super_admin':
        if agency_id:
            query = query.filter(Shift.agency_id == agency_id)
    else:
        query = query.filter(Shift.agency_id == agency_id)

    status_param = request.args.get('status')
    if status_param:
        query = query.filter(Shift.status == status_param)

    if date_param:
        try:
            parsed_date = datetime.strptime(date_param, '%Y-%m-%d').date()
            query = query.filter(Shift.date == parsed_date)
        except ValueError:
            pass

    month_param = request.args.get('month', type=int)
    if month_param:
        query = query.filter(db.extract('month', Shift.date) == month_param)

    year_param = request.args.get('year', type=int)
    if year_param:
        query = query.filter(db.extract('year', Shift.date) == year_param)

    past_shifts = query.order_by(Shift.date.desc(), Shift.opened_at.desc()).all()
    daily_reports = AuditLog.query.filter_by(action='DAILY_OPERATION_REPORT').order_by(AuditLog.id.desc()).limit(10).all()
    years = [today.year - i for i in range(5)]

    return render_template(
        'admin/shifts.html',
        active_shift=active_shift,
        active_metrics=active_metrics,
        past_shifts=past_shifts,
        daily_reports=daily_reports,
        agencies=agencies,
        selected_agency=selected_agency,
        years=years,
        selected_status=status_param,
        selected_date=date_param,
        selected_month=month_param,
        selected_year=year_param,
        now=now_dt,
        report_date=report_date,
        period=period,
        is_today_fallback=is_today_fallback,
        report_bookings=report_bookings,
        today_bookings_count=len(today_bookings),
        cars_out_count=cars_out_count,
        missions_confirmed_count=missions_confirmed_count,
        restitutions_due_count=restitutions_due_count,
        missions_revenue=missions_revenue,
        chat_threads=chat_threads,
        total_chats=total_chats,
        unread_chats_count=unread_chats_count,
        total_messages_count=total_messages_count,
        apartments_list=apartments_list,
        apartments_total=apartments_total,
        apartments_available=apartments_available,
        apartments_occupied=apartments_occupied,
        drivers_list=drivers_list,
        driver_missions=driver_missions,
        drivers_total=drivers_total,
        drivers_active_count=drivers_active_count,
        drivers_avg_rating=drivers_avg_rating
    )

@admin.route('/admin/shifts/open', methods=['POST'])
@login_required
@admin_required
def open_shift():
    agency_id = request.form.get('agency_id', type=int) if current_user.role == 'super_admin' else current_user.agency_id
    if current_user.role == 'super_admin' and not agency_id:
        flash("Veuillez sélectionner une agence.", "danger")
        return redirect(url_for('admin.shifts'))
        
    today = datetime.utcnow().date()
    existing = Shift.query.filter_by(agency_id=agency_id, date=today).first()
    if existing:
        if existing.status == 'open':
            flash("Un quart de travail (shift) est déjà ouvert pour cette agence.", "warning")
        else:
            flash(f"Le shift d'aujourd'hui est déjà dans l'état: {existing.status}.", "info")
        return redirect(url_for('admin.shifts', agency_id=agency_id))
        
    shift = Shift(
        agency_id=agency_id,
        date=today,
        opened_by_id=current_user.id,
        status='open',
        opened_at=datetime.utcnow(),
        tickets_sold=0,
        tickets_count=0,
        tickets_revenue=0.0,
        total_revenue=0.0,
        momo_revenue=0.0,
        orange_revenue=0.0,
        passenger_count=0,
        cancelled_tickets=0,
        parcels_count=0,
        parcels_revenue=0.0,
        refund_amount=0.0,
        commission_amount=0.0,
        agency_earnings=0.0,
        withdrawal_amount=0.0
    )
    db.session.add(shift)
    db.session.commit()
    
    log_audit("SHIFT_OPENED", "Shift", shift.id, f"Shift manually opened by {current_user.username} for agency {agency_id}")
    agency = Agency.query.get(agency_id)
    # Notify agency admin that shift is open
    trigger_notification(
        title="🟢 Shift Ouvert",
        message=f"Le shift du {today.strftime('%d/%m/%Y')} a été ouvert pour votre agence. Vous pouvez commencer à enregistrer des transactions.",
        type="success", category='shift', role_target='admin_agence',
        agency_id=agency_id
    )
    flash("Le quart de travail (shift) a été ouvert avec succès.", "success")
    return redirect(url_for('admin.shifts', agency_id=agency_id))

@admin.route('/admin/shifts/close', methods=['POST'])
@login_required
@admin_required
def close_shift():
    agency_id = request.form.get('agency_id', type=int) if current_user.role == 'super_admin' else current_user.agency_id
    if current_user.role == 'super_admin' and not agency_id:
        flash("Veuillez spécifier une agence.", "danger")
        return redirect(url_for('admin.shifts'))
        
    today = datetime.utcnow().date()
    shift = Shift.query.filter_by(agency_id=agency_id, date=today, status='open').first()
    if not shift:
        flash("Aucun quart de travail (shift) ouvert trouvé pour aujourd'hui.", "danger")
        return redirect(url_for('admin.shifts', agency_id=agency_id))
        
    metrics = aggregate_shift_metrics(agency_id, today)
    
    # Save metrics
    shift.tickets_sold = metrics['tickets_count']
    shift.tickets_count = metrics['tickets_count']
    shift.tickets_revenue = metrics['tickets_revenue']
    shift.total_revenue = metrics['total_revenue']
    shift.momo_revenue = metrics['momo_revenue']
    shift.orange_revenue = metrics['orange_revenue']
    shift.passenger_count = metrics['passenger_count']
    shift.cancelled_tickets = metrics['cancelled_tickets']
    shift.parcels_count = metrics['parcels_count']
    shift.parcels_revenue = metrics['parcels_revenue']
    shift.refund_amount = metrics['refund_amount']
    shift.commission_amount = metrics['commission_amount']
    shift.agency_earnings = metrics['agency_earnings']
    shift.withdrawal_amount = metrics['withdrawal_amount']
    shift.summary_notes = request.form.get('summary_notes')
    
    # Close shift
    shift.status = 'closed'
    shift.closed_at = datetime.utcnow()
    shift.closed_by_id = current_user.id
    
    db.session.commit()
    
    log_audit("SHIFT_CLOSED", "Shift", shift.id, f"Shift manually closed. Total Rev: {shift.total_revenue}, Tickets: {shift.tickets_count}")
    # Calculate Cash
    cash_revenue = shift.total_revenue - (shift.momo_revenue + shift.orange_revenue)
    
    # Notify Super Admin: shift submitted
    agency_name = shift.agency.name if shift.agency else f"Agence #{agency_id}"
    trigger_notification(
        title="📄 Rapport de Caisse Soumis",
        message=f"L'agence '{agency_name}' a clôturé sa caisse du {today.strftime('%d/%m/%Y')}.\nRecette Nette : {shift.agency_earnings:,.0f} FCFA\nBillets : {shift.tickets_count} | Colis : {shift.parcels_count}\nEspèces : {cash_revenue:,.0f} FCFA | MoMo : {shift.momo_revenue:,.0f} FCFA | OM : {shift.orange_revenue:,.0f} FCFA.",
        type="success", category='shift_admin', role_target='super_admin',
        agency_id=agency_id
    )
    # Notify agency admin: confirmation
    trigger_notification(
        title="✅ Caisse Clôturée",
        message=f"Votre caisse du {today.strftime('%d/%m/%Y')} a été clôturée. Recette nette : {shift.agency_earnings:,.0f} FCFA (Espèces: {cash_revenue:,.0f} FCFA).",
        type="success", category='shift', role_target='admin_agence',
        agency_id=agency_id
    )
    flash(f"Shift clôturé avec succès. Recette totale : {shift.total_revenue} FCFA.", "success")
    return redirect(url_for('admin.shifts', agency_id=agency_id))

@admin.route('/admin/shifts/<int:shift_id>')
@login_required
@admin_required
def shift_detail(shift_id):
    shift = Shift.query.get_or_404(shift_id)
    if current_user.role != 'super_admin' and shift.agency_id != current_user.agency_id:
        flash("Accès refusé.", "danger")
        return redirect(url_for('admin.shifts'))
        
    # Get the metrics for this shift's day
    start_dt = datetime.combine(shift.date, datetime.min.time())
    end_dt = datetime.combine(shift.date, datetime.max.time())
    
    # Fetch lists of activity elements
    bookings_q = Booking.query.filter(
        Booking.booking_date >= start_dt,
        Booking.booking_date <= end_dt,
        Booking.is_deleted == False
    )
    if shift.agency_id:
        bookings_q = bookings_q.join(Trip).join(Route).filter(Route.agency_id == shift.agency_id)
    bookings = bookings_q.order_by(Booking.booking_date.asc().nulls_last()).all()
    
    parcels_q = Parcel.query.filter(
        Parcel.created_at >= start_dt,
        Parcel.created_at <= end_dt
    )
    if shift.agency_id:
        parcels_q = parcels_q.filter(Parcel.agency_id == shift.agency_id)
    parcels = parcels_q.order_by(Parcel.created_at.asc()).all()
    
    withdrawals_q = Withdrawal.query.filter(
        Withdrawal.created_at >= start_dt,
        Withdrawal.created_at <= end_dt
    )
    if shift.agency_id:
        withdrawals_q = withdrawals_q.filter(Withdrawal.agency_id == shift.agency_id)
    withdrawals = withdrawals_q.order_by(Withdrawal.created_at.asc()).all()
    
    logs_q = AuditLog.query.filter(
        AuditLog.created_at >= start_dt,
        AuditLog.created_at <= end_dt
    )
    if shift.agency_id:
        logs_q = logs_q.join(User).filter(User.agency_id == shift.agency_id)
    logs = logs_q.order_by(AuditLog.created_at.asc()).all()
    
    if shift.status == 'open':
        metrics = aggregate_shift_metrics(shift.agency_id, shift.date)
    else:
        metrics = {
            'tickets_count': shift.tickets_count,
            'tickets_revenue': shift.tickets_revenue,
            'passenger_count': shift.passenger_count,
            'cancelled_tickets': shift.cancelled_tickets,
            'refund_amount': shift.refund_amount,
            'parcels_count': shift.parcels_count,
            'parcels_revenue': shift.parcels_revenue,
            'withdrawal_amount': shift.withdrawal_amount,
            'total_revenue': shift.total_revenue,
            'commission_amount': shift.commission_amount,
            'agency_earnings': shift.agency_earnings,
            'momo_revenue': shift.momo_revenue,
            'orange_revenue': shift.orange_revenue
        }
        
    return render_template(
        'admin/shift_detail.html',
        shift=shift,
        bookings=bookings,
        parcels=parcels,
        withdrawals=withdrawals,
        logs=logs,
        metrics=metrics
    )

@admin.route('/admin/shifts/<int:shift_id>/review', methods=['POST'])
@login_required
@admin_required
def review_shift(shift_id):
    if current_user.role != 'super_admin':
        flash("Accès réservé au Super Administrateur.", "danger")
        return redirect(url_for('admin.shifts'))
        
    shift = Shift.query.get_or_404(shift_id)
    notes = request.form.get('notes')
    
    shift.status = 'reviewed'
    shift.reviewed_by_id = current_user.id
    
    if notes:
        existing_notes = shift.summary_notes or ""
        shift.summary_notes = f"{existing_notes}\n\n[Rapport validé par le Super Admin ({current_user.username}) le {datetime.utcnow().strftime('%d/%m/%Y')}]: {notes}"
        
    db.session.commit()
    
    log_audit("SHIFT_REVIEWED", "Shift", shift.id, f"Shift reviewed and validated by {current_user.username}")
    # Notify agency admin that their shift was reviewed
    trigger_notification(
        title="✅ Shift Validé par le Super Admin",
        message=f"Votre rapport de shift du {shift.date.strftime('%d/%m/%Y')} a été validé par {current_user.username}.",
        type="success", category='shift', role_target='admin_agence',
        agency_id=shift.agency_id
    )
    flash("Le rapport de shift a été validé et marqué comme révisé.", "success")
    return redirect(url_for('admin.shift_detail', shift_id=shift.id))

@admin.route('/admin/shifts/<int:shift_id>/reopen', methods=['POST'])
@login_required
@admin_required
def reopen_shift(shift_id):
    if current_user.role != 'super_admin':
        flash("Accès réservé au Super Administrateur.", "danger")
        return redirect(url_for('admin.shifts'))
        
    shift = Shift.query.get_or_404(shift_id)
    
    shift.status = 'open'
    shift.closed_at = None
    shift.closed_by_id = None
    shift.reviewed_by_id = None
    
    db.session.commit()
    
    log_audit("SHIFT_REOPENED", "Shift", shift.id, f"Shift reopened by {current_user.username}")
    # Notify agency admin: shift was reopened
    trigger_notification(
        title="🔄 Shift Réouvert",
        message=f"Votre shift du {shift.date.strftime('%d/%m/%Y')} a été réouvert par {current_user.username}. Vous pouvez apporter des corrections.",
        type="info", category='shift', role_target='admin_agence',
        agency_id=shift.agency_id
    )
    flash("Le shift a été réouvert avec succès.", "success")
    return redirect(url_for('admin.shift_detail', shift_id=shift.id))

@admin.route('/admin/shifts/<int:shift_id>/export/csv')
@login_required
@admin_required
def export_shift_csv(shift_id):
    shift = Shift.query.get_or_404(shift_id)
    if current_user.role != 'super_admin' and shift.agency_id != current_user.agency_id:
        flash("Accès refusé.", "danger")
        return redirect(url_for('admin.shifts'))
        
    import csv
    from io import StringIO
    from flask import make_response
    
    f = StringIO()
    writer = csv.writer(f)
    
    writer.writerow(["RAPPORT DE SHIFT 3M SERVICES"])
    writer.writerow([])
    writer.writerow(["ID du Shift", shift.id])
    writer.writerow(["Date du Shift", shift.date.strftime('%d/%m/%Y')])
    writer.writerow(["Agence", shift.agency.name if shift.agency else "Globale"])
    writer.writerow(["Statut", shift.status.upper()])
    writer.writerow(["Ouvert par", shift.opened_by.username if shift.opened_by else "Système"])
    writer.writerow(["Ouvert le", shift.opened_at.strftime('%d/%m/%Y %H:%M:%S')])
    writer.writerow(["Fermé par", shift.closed_by.username if shift.closed_by else ("Système" if shift.status == 'auto_closed' else "-")])
    writer.writerow(["Fermé le", shift.closed_at.strftime('%d/%m/%Y %H:%M:%S') if shift.closed_at else "-"])
    writer.writerow(["Validé par", shift.reviewed_by.username if shift.reviewed_by else "-"])
    writer.writerow([])
    writer.writerow(["METRIQUES DE VENTES & TRANSACTIONS"])
    writer.writerow(["Tickets vendus", shift.tickets_count])
    writer.writerow(["Chiffre d'Affaires Tickets (FCFA)", shift.tickets_revenue])
    writer.writerow(["Parcelles / Colis envoyés", shift.parcels_count])
    writer.writerow(["Chiffre d'Affaires Colis (FCFA)", shift.parcels_revenue])
    writer.writerow(["Remboursements effectués (FCFA)", shift.refund_amount])
    writer.writerow(["Retraits effectués (FCFA)", shift.withdrawal_amount])
    writer.writerow(["Chiffre d'Affaires Total (FCFA)", shift.total_revenue])
    writer.writerow(["Gains Net Agence (FCFA)", shift.agency_earnings])
    writer.writerow(["Revenus MTN Mobile Money (FCFA)", shift.momo_revenue])
    writer.writerow(["Revenus Orange Money (FCFA)", shift.orange_revenue])
    writer.writerow(["Passagers embarqués", shift.passenger_count])
    writer.writerow(["Tickets annulés", shift.cancelled_tickets])
    writer.writerow([])
    writer.writerow(["Notes / Réconciliation", shift.summary_notes or "Aucune note."])
    
    output = make_response(f.getvalue())
    output.headers["Content-Disposition"] = f"attachment; filename=shift_{shift.id}_{shift.date.strftime('%Y%m%d')}_report.csv"
    output.headers["Content-type"] = "text/csv"
    return output

@admin.route('/admin/shifts/<int:shift_id>/export/pdf')
@login_required
@admin_required
def export_shift_pdf(shift_id):
    shift = Shift.query.get_or_404(shift_id)
    if current_user.role != 'super_admin' and shift.agency_id != current_user.agency_id:
        flash("Accès refusé.", "danger")
        return redirect(url_for('admin.shifts'))
        
    import io
    from flask import send_file
    from reportlab.lib.pagesizes import letter
    from reportlab.pdfgen import canvas
    
    buffer = io.BytesIO()
    p = canvas.Canvas(buffer, pagesize=letter)
    
    draw_pdf_header(p, "3M SERVICES — RAPPORT DE SHIFT DETAILLE")
    
    p.setFillColorRGB(0, 0, 0)
    p.setFont("Helvetica-Bold", 12)
    p.drawString(50, 700, "INFORMATIONS GENERALES")
    p.setFont("Helvetica", 10)
    p.drawString(60, 680, f"ID du Shift : #{shift.id}")
    p.drawString(60, 665, f"Date : {shift.date.strftime('%d/%m/%Y')}")
    p.drawString(60, 650, f"Agence : {shift.agency.name if shift.agency else 'Globale'}")
    p.drawString(60, 635, f"Statut : {shift.status.upper()}")
    p.drawString(60, 620, f"Ouvert le : {shift.opened_at.strftime('%d/%m/%Y à %H:%M:%S')} ({shift.opened_by.username if shift.opened_by else 'Système'})")
    p.drawString(60, 605, f"Fermé le : {shift.closed_at.strftime('%d/%m/%Y à %H:%M:%S') if shift.closed_at else 'Active'} ({shift.closed_by.username if shift.closed_by else ('Système' if shift.status == 'auto_closed' else '-')})")
    
    p.setFont("Helvetica-Bold", 12)
    p.drawString(50, 560, "STATISTIQUES DE L'ACTIVITE")
    p.setFont("Helvetica", 10)
    p.drawString(60, 540, f"Tickets vendus : {shift.tickets_count}")
    p.drawString(60, 525, f"Passagers embarqués : {shift.passenger_count}")
    p.drawString(60, 510, f"Colis / Colis envoyés : {shift.parcels_count}")
    p.drawString(60, 495, f"Tickets annulés : {shift.cancelled_tickets}")
    
    p.setFont("Helvetica-Bold", 12)
    p.drawString(50, 450, "BREAKDOWN FINANCIER RECONCILIE")
    p.setFont("Helvetica", 10)
    p.drawString(60, 430, f"Recettes Tickets : {shift.tickets_revenue:,.0f} FCFA")
    p.drawString(60, 415, f"Recettes Colis / Parcels : {shift.parcels_revenue:,.0f} FCFA")
    p.drawString(60, 400, f"Remboursements : {shift.refund_amount:,.0f} FCFA")
    p.drawString(60, 385, f"Retraits Agence : {shift.withdrawal_amount:,.0f} FCFA")
    p.setStrokeColorRGB(0.7, 0.7, 0.7)
    p.line(55, 375, 300, 375)
    p.drawString(60, 360, f"Chiffre d'Affaires Total : {shift.total_revenue:,.0f} FCFA")
    p.setFont("Helvetica-Bold", 10)
    p.drawString(60, 345, f"Gains Net Agence : {shift.agency_earnings:,.0f} FCFA")
    p.setFont("Helvetica", 10)
    p.drawString(60, 330, f"Payé par MTN MoMo : {shift.momo_revenue:,.0f} FCFA")
    p.drawString(60, 315, f"Payé par Orange Money : {shift.orange_revenue:,.0f} FCFA")
    
    p.setFont("Helvetica-Bold", 12)
    p.drawString(50, 250, "NOTES DE CLÔTURE ET DE VALIDATION")
    p.setFont("Helvetica-Oblique", 10)
    
    notes = shift.summary_notes or "Aucune note."
    y_pos = 230
    for line in notes.split('\n'):
        if len(line) > 80:
            p.drawString(60, y_pos, line[:80])
            y_pos -= 15
            p.drawString(60, y_pos, line[80:160])
        else:
            p.drawString(60, y_pos, line)
        y_pos -= 15
        if y_pos < 50:
            break
            
    p.showPage()
    p.save()
    
    buffer.seek(0)
    return send_file(buffer, as_attachment=True, download_name=f"shift_{shift.id}_report.pdf", mimetype='application/pdf')


# === EXPORTS FOR CLIENTS, FLEET, DRIVERS, ROUTES, AND BOOKINGS ===

from app.models import Bus, Driver, Route, Booking

# 1. CLIENTS EXPORTS
@admin.route('/admin/clients/export/csv')
@login_required
@admin_required
def export_clients_csv():
    if current_user.role == 'super_admin':
        clients = User.query.filter_by(role='client').all()
    else:
        # Clients who have booked at least one trip with this agency
        clients = User.query.filter_by(role='client').join(Booking).join(Trip).join(Route).filter(Route.agency_id == current_user.agency_id).all()
        
    import csv
    from io import StringIO
    from flask import make_response
    
    f = StringIO()
    writer = csv.writer(f)
    writer.writerow(["ID", "NOM D'UTILISATEUR", "NOM REEL", "EMAIL", "TELEPHONE", "MOMO NUMBER", "ORANGE NUMBER", "LANGUE", "PAIEMENT PREFERE", "DATE D'INSCRIPTION"])
    
    for c in clients:
        writer.writerow([
            c.id,
            c.username,
            c.real_name or '',
            c.email,
            c.phone or '',
            c.momo_number or '',
            c.orange_number or '',
            c.language or 'fr',
            c.preferred_payment_method or '',
            c.created_at.strftime('%d/%m/%Y') if c.created_at else ''
        ])
        
    output = make_response(f.getvalue())
    output.headers["Content-Disposition"] = "attachment; filename=clients_list.csv"
    output.headers["Content-type"] = "text/csv"
    return output


@admin.route('/admin/clients/export/pdf')
@login_required
@admin_required
def export_clients_pdf():
    if current_user.role == 'super_admin':
        clients = User.query.filter_by(role='client').all()
    else:
        clients = User.query.filter_by(role='client').join(Booking).join(Trip).join(Route).filter(Route.agency_id == current_user.agency_id).all()
        
    import io
    from flask import send_file
    from reportlab.lib.pagesizes import letter
    from reportlab.pdfgen import canvas
    
    buffer = io.BytesIO()
    p = canvas.Canvas(buffer, pagesize=letter)
    
    # Title
    draw_pdf_header(p, "3M SERVICES — LISTE DES CLIENTS")
    
    # Headers
    p.setFont("Helvetica-Bold", 10)
    p.setFillColorRGB(0, 0, 0)
    p.drawString(50, 715, "ID")
    p.drawString(90, 715, "Nom d'utilisateur")
    p.drawString(200, 715, "Nom Réel")
    p.drawString(320, 715, "Email")
    p.drawString(450, 715, "Téléphone")
    p.line(50, 705, 560, 705)
    
    y = 685
    p.setFont("Helvetica", 9)
    for c in clients:
        if y < 50:
            p.showPage()
            p.setFont("Helvetica-Bold", 10)
            p.drawString(50, 750, "ID")
            p.drawString(90, 750, "Nom d'utilisateur")
            p.drawString(200, 750, "Nom Réel")
            p.drawString(320, 750, "Email")
            p.drawString(450, 750, "Téléphone")
            p.line(50, 740, 560, 740)
            p.setFont("Helvetica", 9)
            y = 720
            
        p.drawString(50, y, str(c.id))
        p.drawString(90, y, c.username[:20])
        p.drawString(200, y, (c.real_name or '')[:20])
        p.drawString(320, y, c.email[:25])
        p.drawString(450, y, (c.phone or '')[:15])
        y -= 20
        
    p.showPage()
    p.save()
    buffer.seek(0)
    return send_file(buffer, as_attachment=True, download_name="clients_list.pdf", mimetype='application/pdf')


# 2. FLOTTE (BUS) EXPORTS
@admin.route('/admin/buses/export/csv')
@login_required
@admin_required
def export_buses_csv():
    if current_user.role == 'super_admin':
        buses = Bus.query.filter_by(is_deleted=False).all()
    else:
        buses = Bus.query.filter_by(agency_id=current_user.agency_id, is_deleted=False).all()
        
    import csv
    from io import StringIO
    from flask import make_response
    
    f = StringIO()
    writer = csv.writer(f)
    writer.writerow(["ID", "IMMATRICULATION", "MARQUE", "MODELE", "CAPACITE", "STATUT", "CHAUFFEUR ASSIGNE", "AGENCE"])
    
    for b in buses:
        writer.writerow([
            b.id,
            b.bus_number,
            b.brand or '',
            b.model,
            b.capacity,
            b.status,
            b.driver_name or '',
            b.agency.name if b.agency else ''
        ])
        
    output = make_response(f.getvalue())
    output.headers["Content-Disposition"] = "attachment; filename=fleet_list.csv"
    output.headers["Content-type"] = "text/csv"
    return output


@admin.route('/admin/buses/export/pdf')
@login_required
@admin_required
def export_buses_pdf():
    if current_user.role == 'super_admin':
        buses = Bus.query.filter_by(is_deleted=False).all()
    else:
        buses = Bus.query.filter_by(agency_id=current_user.agency_id, is_deleted=False).all()
        
    import io
    from flask import send_file
    from reportlab.lib.pagesizes import letter
    from reportlab.pdfgen import canvas
    
    buffer = io.BytesIO()
    p = canvas.Canvas(buffer, pagesize=letter)
    
    draw_pdf_header(p, "3M SERVICES — FLOTTE DE BUS")
    
    p.setFont("Helvetica-Bold", 10)
    p.setFillColorRGB(0, 0, 0)
    p.drawString(50, 715, "ID")
    p.drawString(80, 715, "Immatriculation")
    p.drawString(180, 715, "Marque / Modèle")
    p.drawString(300, 715, "Capacité")
    p.drawString(360, 715, "Chauffeur")
    p.drawString(460, 715, "Statut")
    p.line(50, 705, 560, 705)
    
    y = 685
    p.setFont("Helvetica", 9)
    for b in buses:
        if y < 50:
            p.showPage()
            p.setFont("Helvetica-Bold", 10)
            p.drawString(50, 750, "ID")
            p.drawString(80, 750, "Immatriculation")
            p.drawString(180, 750, "Marque / Modèle")
            p.drawString(300, 750, "Capacité")
            p.drawString(360, 750, "Chauffeur")
            p.drawString(460, 750, "Statut")
            p.line(50, 740, 560, 740)
            p.setFont("Helvetica", 9)
            y = 720
            
        p.drawString(50, y, str(b.id))
        p.drawString(80, y, b.bus_number)
        p.drawString(180, y, f"{b.brand or ''} {b.model}"[:20])
        p.drawString(300, y, f"{b.capacity} places")
        p.drawString(360, y, (b.driver_name or '')[:20])
        p.drawString(460, y, b.status)
        y -= 20
        
    p.showPage()
    p.save()
    buffer.seek(0)
    return send_file(buffer, as_attachment=True, download_name="fleet_list.pdf", mimetype='application/pdf')


# 3. CHAUFFEURS (DRIVERS) EXPORTS
@admin.route('/admin/drivers/export/csv')
@login_required
@admin_required
def export_drivers_csv():
    if current_user.role == 'super_admin':
        drivers = Driver.query.filter_by(is_deleted=False).all()
    else:
        drivers = Driver.query.filter_by(agency_id=current_user.agency_id, is_deleted=False).all()
        
    try:
        import csv
        from io import StringIO
        from flask import make_response
        
        f = StringIO()
        writer = csv.writer(f)
        writer.writerow(["ID", "NOM COMPLET", "TELEPHONE", "PERMIS DE CONDUIRE", "EXPIRATION PERMIS", "STATUT", "BUS ASSIGNE", "AGENCE"])
        
        for d in drivers:
            writer.writerow([
                d.id,
                d.name,
                d.phone or '',
                d.license_number,
                d.license_expiration.strftime('%d/%m/%Y') if d.license_expiration else '',
                d.status,
                d.current_bus.bus_number if d.current_bus else '',
                d.agency.name if d.agency else ''
            ])
            
        output = make_response(f.getvalue())
        output.headers["Content-Disposition"] = "attachment; filename=drivers_list.csv"
        output.headers["Content-type"] = "text/csv"
        return output
    except Exception as e:
        import logging
        logging.error(f"Error exporting drivers to CSV: {e}")
        flash("Erreur lors de l'export CSV.", "danger")
        return redirect(url_for('admin.drivers'))


@admin.route('/admin/drivers/export/pdf')
@login_required
@admin_required
def export_drivers_pdf():
    if current_user.role == 'super_admin':
        drivers = Driver.query.filter_by(is_deleted=False).all()
    else:
        drivers = Driver.query.filter_by(agency_id=current_user.agency_id, is_deleted=False).all()
        
    import io
    from flask import send_file
    from reportlab.lib.pagesizes import letter
    from reportlab.pdfgen import canvas
    
    buffer = io.BytesIO()
    p = canvas.Canvas(buffer, pagesize=letter)
    
    draw_pdf_header(p, "3M SERVICES — CONVOYEURS / CHAUFFEURS")
    
    p.setFont("Helvetica-Bold", 10)
    p.setFillColorRGB(0, 0, 0)
    p.drawString(50, 715, "ID")
    p.drawString(80, 715, "Nom complet")
    p.drawString(200, 715, "Téléphone")
    p.drawString(300, 715, "N° Permis")
    p.drawString(400, 715, "Bus assigné")
    p.drawString(480, 715, "Statut")
    p.line(50, 705, 560, 705)
    
    y = 685
    p.setFont("Helvetica", 9)
    for d in drivers:
        if y < 50:
            p.showPage()
            p.setFont("Helvetica-Bold", 10)
            p.drawString(50, 750, "ID")
            p.drawString(80, 750, "Nom complet")
            p.drawString(200, 750, "Téléphone")
            p.drawString(300, 750, "N° Permis")
            p.drawString(400, 750, "Bus assigné")
            p.drawString(480, 750, "Statut")
            p.line(50, 740, 560, 740)
            p.setFont("Helvetica", 9)
            y = 720
            
        p.drawString(50, y, str(d.id))
        p.drawString(80, y, d.name[:25])
        p.drawString(200, y, d.phone or '-')
        p.drawString(300, y, d.license_number)
        p.drawString(400, y, d.current_bus.bus_number if d.current_bus else 'Non assigné')
        p.drawString(480, y, d.status or 'Active')
        y -= 20
        
    p.showPage()
    p.save()
    buffer.seek(0)
    return send_file(buffer, as_attachment=True, download_name="drivers_list.pdf", mimetype='application/pdf')


# 4. LIGNES (ROUTES) EXPORTS
@admin.route('/admin/routes/export/csv')
@login_required
@admin_required
def export_routes_csv():
    filter_val = request.args.get('filter', 'all')
    if current_user.role == 'super_admin':
        query = Route.query.filter_by(is_deleted=False)
    else:
        query = Route.query.filter_by(agency_id=current_user.agency_id, is_deleted=False)

    if filter_val in ['day', 'week', 'month']:
        today = date.today()
        if filter_val == 'day':
            start_dt = datetime.combine(today, datetime.min.time())
            end_dt = datetime.combine(today, datetime.max.time())
        elif filter_val == 'week':
            start_dt = datetime.combine(today, datetime.min.time())
            end_dt = datetime.combine(today + timedelta(days=6), datetime.max.time())
        elif filter_val == 'month':
            start_dt = datetime.combine(today, datetime.min.time())
            end_dt = datetime.combine(today + timedelta(days=29), datetime.max.time())
            
        query = query.join(Trip).filter(
            Trip.departure_time.between(start_dt, end_dt),
            Trip.is_deleted == False
        ).distinct()

    routes = query.all()
        
    import csv
    from io import StringIO
    from flask import make_response
    
    f = StringIO()
    writer = csv.writer(f)
    writer.writerow(["ID", "VILLE DE DEPART", "VILLE D'ARRIVEE", "DISTANCE (KM)", "DUREE ESTIMEE", "TARIF DE BASE (FCFA)", "AGENCE"])
    
    for r in routes:
        writer.writerow([
            r.id,
            r.origin,
            r.destination,
            r.distance or '',
            r.duration or '',
            r.base_price,
            r.agency.name if r.agency else ''
        ])
        
    output = make_response(f.getvalue())
    output.headers["Content-Disposition"] = "attachment; filename=routes_list.csv"
    output.headers["Content-type"] = "text/csv"
    return output


@admin.route('/admin/routes/export/pdf')
@login_required
@admin_required
def export_routes_pdf():
    filter_val = request.args.get('filter', 'all')
    if current_user.role == 'super_admin':
        query = Route.query.filter_by(is_deleted=False)
    else:
        query = Route.query.filter_by(agency_id=current_user.agency_id, is_deleted=False)

    if filter_val in ['day', 'week', 'month']:
        today = date.today()
        if filter_val == 'day':
            start_dt = datetime.combine(today, datetime.min.time())
            end_dt = datetime.combine(today, datetime.max.time())
        elif filter_val == 'week':
            start_dt = datetime.combine(today, datetime.min.time())
            end_dt = datetime.combine(today + timedelta(days=6), datetime.max.time())
        elif filter_val == 'month':
            start_dt = datetime.combine(today, datetime.min.time())
            end_dt = datetime.combine(today + timedelta(days=29), datetime.max.time())
            
        query = query.join(Trip).filter(
            Trip.departure_time.between(start_dt, end_dt),
            Trip.is_deleted == False
        ).distinct()

    routes = query.all()
        
    import io
    from flask import send_file
    from reportlab.lib.pagesizes import letter
    from reportlab.pdfgen import canvas
    
    buffer = io.BytesIO()
    p = canvas.Canvas(buffer, pagesize=letter)
    
    draw_pdf_header(p, "3M SERVICES — LIGNES DE TRANSPORT")
    
    p.setFont("Helvetica-Bold", 10)
    p.setFillColorRGB(0, 0, 0)
    p.drawString(50, 715, "ID")
    p.drawString(80, 715, "Origine")
    p.drawString(200, 715, "Destination")
    p.drawString(320, 715, "Distance")
    p.drawString(390, 715, "Durée")
    p.drawString(460, 715, "Tarif de base")
    p.line(50, 705, 560, 705)
    
    y = 685
    p.setFont("Helvetica", 9)
    for r in routes:
        if y < 50:
            p.showPage()
            p.setFont("Helvetica-Bold", 10)
            p.drawString(50, 750, "ID")
            p.drawString(80, 750, "Origine")
            p.drawString(200, 750, "Destination")
            p.drawString(320, 750, "Distance")
            p.drawString(390, 750, "Durée")
            p.drawString(460, 750, "Tarif de base")
            p.line(50, 740, 560, 740)
            p.setFont("Helvetica", 9)
            y = 720
            
        p.drawString(50, y, str(r.id))
        p.drawString(80, y, r.origin)
        p.drawString(200, y, r.destination)
        p.drawString(320, y, f"{r.distance or '-'} km")
        p.drawString(390, y, r.duration or '-')
        price_display = f"{int(r.base_price)} FCFA" if r.base_price is not None else "Aucun"
        p.drawString(460, y, price_display)
        y -= 20
        
    p.showPage()
    p.save()
    buffer.seek(0)
    return send_file(buffer, as_attachment=True, download_name="routes_list.pdf", mimetype='application/pdf')


# 5. RESERVATIONS (BOOKINGS) EXPORTS
@admin.route('/admin/bookings/export/csv')
@login_required
@admin_required
def export_bookings_csv():
    filter_val = request.args.get('filter', 'all')
    if current_user.role == 'super_admin':
        query = Booking.query.filter_by(is_deleted=False)
    else:
        query = Booking.query.join(Trip).join(Route).filter(Route.agency_id == current_user.agency_id, Booking.is_deleted == False)

    if filter_val in ['day', 'week', 'month']:
        today = date.today()
        if filter_val == 'day':
            start_dt = datetime.combine(today, datetime.min.time())
            end_dt = datetime.combine(today, datetime.max.time())
        elif filter_val == 'week':
            start_dt = datetime.combine(today - timedelta(days=6), datetime.min.time())
            end_dt = datetime.combine(today, datetime.max.time())
        elif filter_val == 'month':
            start_dt = datetime.combine(today - timedelta(days=29), datetime.min.time())
            end_dt = datetime.combine(today, datetime.max.time())
            
        query = query.filter(Booking.booking_date.between(start_dt, end_dt))

    bookings = query.all()
        
    import csv
    from io import StringIO
    from flask import make_response
    
    f = StringIO()
    writer = csv.writer(f)
    writer.writerow(["ID", "REF MISSION VIP", "CLIENT VIP", "MISSION / TRAJET", "VEHICULE VIP", "CHAUFFEUR VIP", "FORMULE / FORFAIT", "MONTANT TOTAL (FCFA)", "MODE PAIEMENT", "STATUT REGLEMENT", "STATUT MISSION", "DATE RESERVATION"])
    
    for b in bookings:
        veh = f"{b.trip.bus.brand} {b.trip.bus.model} ({b.trip.bus.bus_number})" if b.trip and b.trip.bus else ''
        chauffeur = (b.trip.driver.name if (b.trip and b.trip.driver) else (b.trip.bus.driver_name if (b.trip and b.trip.bus) else 'Chauffeur VIP Dédié')) if b.trip else ''
        writer.writerow([
            b.id,
            b.booking_code or f"3M-MIS-{b.id:04d}",
            b.passenger_name or (b.user.username if b.user else ''),
            f"{b.trip.route.origin} -> {b.trip.route.destination} ({b.trip.departure_time.strftime('%d/%m %H:%M')})" if b.trip and b.trip.route else '',
            veh,
            chauffeur,
            b.seat_number or 'Avec Chauffeur VIP',
            b.price_paid,
            b.payment_method or '',
            b.payment_status or '',
            b.status,
            b.booking_date.strftime('%d/%m/%Y %H:%M') if b.booking_date else ''
        ])
        
    output = make_response(f.getvalue())
    output.headers["Content-Disposition"] = f"attachment; filename=missions_vip_{filter_val}.csv"
    output.headers["Content-type"] = "text/csv; charset=utf-8"
    return output


@admin.route('/admin/bookings/export/pdf')
@login_required
@admin_required
def export_bookings_pdf():
    filter_val = request.args.get('filter', 'all')
    if current_user.role == 'super_admin':
        query = Booking.query.filter_by(is_deleted=False)
    else:
        query = Booking.query.join(Trip).join(Route).filter(Route.agency_id == current_user.agency_id, Booking.is_deleted == False)

    if filter_val in ['day', 'week', 'month']:
        today = date.today()
        if filter_val == 'day':
            start_dt = datetime.combine(today, datetime.min.time())
            end_dt = datetime.combine(today, datetime.max.time())
        elif filter_val == 'week':
            start_dt = datetime.combine(today - timedelta(days=6), datetime.min.time())
            end_dt = datetime.combine(today, datetime.max.time())
        elif filter_val == 'month':
            start_dt = datetime.combine(today - timedelta(days=29), datetime.min.time())
            end_dt = datetime.combine(today, datetime.max.time())
            
        query = query.filter(Booking.booking_date.between(start_dt, end_dt))

    bookings = query.all()
        
    import io
    from flask import send_file
    from reportlab.lib.pagesizes import letter
    from reportlab.pdfgen import canvas
    
    buffer = io.BytesIO()
    p = canvas.Canvas(buffer, pagesize=letter)
    
    draw_pdf_header(p, "3M SERVICES — SORTIES & MISSIONS DE FLOTTE VIP")
    
    p.setFont("Helvetica-Bold", 10)
    p.setFillColorRGB(0, 0, 0)
    p.drawString(50, 715, "Réf Mission")
    p.drawString(130, 715, "Client VIP")
    p.drawString(240, 715, "Mission / Trajet")
    p.drawString(380, 715, "Forfait")
    p.drawString(420, 715, "Tarif")
    p.drawString(485, 715, "Statut")
    p.line(50, 705, 560, 705)
    
    y = 685
    p.setFont("Helvetica", 9)
    for b in bookings:
        if y < 50:
            p.showPage()
            p.setFont("Helvetica-Bold", 10)
            p.drawString(50, 750, "Réf Mission")
            p.drawString(130, 750, "Client VIP")
            p.drawString(240, 750, "Mission / Trajet")
            p.drawString(380, 750, "Forfait")
            p.drawString(420, 750, "Tarif")
            p.drawString(485, 750, "Statut")
            p.line(50, 740, 560, 740)
            p.setFont("Helvetica", 9)
            y = 720
            
        p.drawString(50, y, b.booking_code or f"#{b.id}")
        p.drawString(130, y, (b.passenger_name or (b.user.username if b.user else 'Client Comptoir'))[:18])
        
        trip_str = f"{b.trip.route.origin[:10]}->{b.trip.route.destination[:10]}" if b.trip and b.trip.route else ''
        p.drawString(240, y, trip_str)
        p.drawString(380, y, (b.seat_number or 'VIP')[:8])
        p.drawString(420, y, f"{b.price_paid:.0f} F")
        p.drawString(485, y, b.status)
        y -= 20
        
    p.showPage()
    p.save()
    buffer.seek(0)
    return send_file(buffer, as_attachment=True, download_name=f"missions_vip_{filter_val}.pdf", mimetype='application/pdf')


# 6. TRIPS (TRAJETS) EXPORTS
@admin.route('/admin/trips/export/csv')
@login_required
@admin_required
def export_trips_csv():
    if current_user.role == 'super_admin':
        query = Trip.query.filter_by(is_deleted=False)
    else:
        query = Trip.query.join(Route).filter(Route.agency_id == current_user.agency_id, Trip.is_deleted == False)
        
    timeframe = request.args.get('range', 'all')
    from datetime import datetime, time, date, timedelta
    today = date.today()
    
    if timeframe == 'day':
        start_dt = datetime.combine(today, time.min)
        end_dt = datetime.combine(today, time.max)
        query = query.filter(Trip.departure_time >= start_dt, Trip.departure_time <= end_dt)
    elif timeframe == 'week':
        start_dt = datetime.combine(today, time.min)
        end_dt = datetime.combine(today + timedelta(days=7), time.max)
        query = query.filter(Trip.departure_time >= start_dt, Trip.departure_time <= end_dt)
    elif timeframe == 'month':
        start_dt = datetime.combine(today, time.min)
        end_dt = datetime.combine(today + timedelta(days=30), time.max)
        query = query.filter(Trip.departure_time >= start_dt, Trip.departure_time <= end_dt)
        
    trips = query.order_by(Trip.departure_time.desc()).all()
    
    import csv
    from io import StringIO
    from flask import make_response
    
    f = StringIO()
    writer = csv.writer(f)
    writer.writerow([
        "ID", "DEPART", "ARRIVEE", "LIGNE", "AGENCE", 
        "AUTOCAR", "MATRICULE", "PRIX (FCFA)", 
        "PLACES OCCUPEES", "CAPACITE", "TAUX OCCUPATION", "STATUT"
    ])
    
    for t in trips:
        occupy_count = t.bookings.filter_by(status='confirmed', is_deleted=False).count() if t.bus else 0
        capacity = t.bus.capacity if t.bus else 0
        occupy_rate = f"{(occupy_count / capacity * 100):.0f}%" if capacity > 0 else "0%"
        
        writer.writerow([
            t.id,
            t.departure_time.strftime('%Y-%m-%d %H:%M'),
            t.arrival_time.strftime('%Y-%m-%d %H:%M'),
            f"{t.route.origin} -> {t.route.destination}" if t.route else 'N/A',
            t.route.agency.name if t.route and t.route.agency else 'N/A',
            f"{t.bus.brand} {t.bus.model}" if t.bus else 'N/A',
            t.bus.bus_number if t.bus else 'N/A',
            t.price,
            occupy_count,
            capacity,
            occupy_rate,
            t.status
        ])
        
    output = make_response(f.getvalue())
    output.headers["Content-Disposition"] = f"attachment; filename=trips_{timeframe}.csv"
    output.headers["Content-type"] = "text/csv"
    return output


@admin.route('/admin/trips/export/pdf')
@login_required
@admin_required
def export_trips_pdf():
    if current_user.role == 'super_admin':
        query = Trip.query.filter_by(is_deleted=False)
    else:
        query = Trip.query.join(Route).filter(Route.agency_id == current_user.agency_id, Trip.is_deleted == False)
        
    timeframe = request.args.get('range', 'all')
    from datetime import datetime, time, date, timedelta
    today = date.today()
    
    if timeframe == 'day':
        start_dt = datetime.combine(today, time.min)
        end_dt = datetime.combine(today, time.max)
        query = query.filter(Trip.departure_time >= start_dt, Trip.departure_time <= end_dt)
    elif timeframe == 'week':
        start_dt = datetime.combine(today, time.min)
        end_dt = datetime.combine(today + timedelta(days=7), time.max)
        query = query.filter(Trip.departure_time >= start_dt, Trip.departure_time <= end_dt)
    elif timeframe == 'month':
        start_dt = datetime.combine(today, time.min)
        end_dt = datetime.combine(today + timedelta(days=30), time.max)
        query = query.filter(Trip.departure_time >= start_dt, Trip.departure_time <= end_dt)
        
    trips = query.order_by(Trip.departure_time.desc()).all()
    
    import io
    from flask import send_file
    from reportlab.lib.pagesizes import letter
    from reportlab.pdfgen import canvas
    
    buffer = io.BytesIO()
    p = canvas.Canvas(buffer, pagesize=letter)
    
    draw_pdf_header(p, f"3M SERVICES — DEPARTS ({timeframe.upper()})")
    
    p.setFont("Helvetica-Bold", 10)
    p.setFillColorRGB(0, 0, 0)
    p.drawString(50, 715, "ID")
    p.drawString(80, 715, "Trajet")
    p.drawString(200, 715, "Bus / Immat")
    p.drawString(320, 715, "Départ")
    p.drawString(410, 715, "Tarif")
    p.drawString(470, 715, "Occ. (%)")
    p.drawString(520, 715, "Statut")
    p.line(50, 705, 560, 705)
    
    y = 685
    p.setFont("Helvetica", 9)
    for t in trips:
        if y < 50:
            p.showPage()
            p.setFont("Helvetica-Bold", 10)
            p.drawString(50, 750, "ID")
            p.drawString(80, 750, "Trajet")
            p.drawString(200, 750, "Bus / Immat")
            p.drawString(320, 750, "Départ")
            p.drawString(410, 750, "Tarif")
            p.drawString(470, 750, "Occ. (%)")
            p.drawString(520, 750, "Statut")
            p.line(50, 740, 560, 740)
            p.setFont("Helvetica", 9)
            y = 720
            
        p.drawString(50, y, str(t.id))
        
        route_str = f"{t.route.origin[:10]}->{t.route.destination[:10]}" if t.route else 'N/A'
        p.drawString(80, y, route_str)
        
        bus_str = f"{t.bus.brand[:8]} ({t.bus.bus_number})" if t.bus else 'N/A'
        p.drawString(200, y, bus_str)
        
        dep_str = t.departure_time.strftime('%d/%m/%Y %H:%M')
        p.drawString(320, y, dep_str)
        
        p.drawString(410, y, f"{t.price:.0f} F")
        
        # calculate occupancy
        occupy_count = t.bookings.filter_by(status='confirmed', is_deleted=False).count() if t.bus else 0
        capacity = t.bus.capacity if t.bus else 0
        occupy_rate = f"{(occupy_count / capacity * 100):.0f}%" if capacity > 0 else "0%"
        p.drawString(470, y, occupy_rate)
        
        p.drawString(520, y, t.status)
        y -= 20
        
    p.showPage()
    p.save()
    buffer.seek(0)
    return send_file(buffer, as_attachment=True, download_name=f"trips_{timeframe}.pdf", mimetype='application/pdf')


@admin.route('/admin/scanner')
@login_required
@teller_required
def scanner():
    caisse = get_current_caisse(current_user.agency_id)
    return render_template('admin/scanner.html', caisse=caisse)

# Import logistics/parcel system routes
from app.routes.parcels_admin import *



# ============================================================
# === TRIP SCHEDULE MANAGEMENT (Recurring Trips) ===
# ============================================================

@admin.route('/admin/trip_schedules')
@login_required
@admin_required
def trip_schedules():
    if current_user.role == 'super_admin':
        schedules = TripSchedule.query.order_by(TripSchedule.created_at.desc()).all()
    else:
        schedules = TripSchedule.query.filter_by(agency_id=current_user.agency_id).order_by(TripSchedule.created_at.desc()).all()
    return render_template('admin/trip_schedules.html', schedules=schedules)

@admin.route('/admin/add_trip_schedule', methods=['GET', 'POST'])
@login_required
@admin_required
def add_trip_schedule():
    if request.method == 'POST':
        route_id = request.form.get('route_id', type=int)
        bus_id = request.form.get('bus_id', type=int)
        driver_id = request.form.get('driver_id', type=int)
        departure_time_of_day = request.form.get('departure_time_of_day', '')
        duration_minutes = request.form.get('duration_minutes', type=int)
        price = request.form.get('price', type=float)
        capacity = request.form.get('capacity', 50, type=int)
        booking_cutoff = request.form.get('booking_cutoff_minutes', 30, type=int)
        recurrence_type = request.form.get('recurrence_type', 'daily')
        recurrence_days = request.form.getlist('recurrence_days')
        effective_from = request.form.get('effective_from', '')
        effective_until = request.form.get('effective_until', '')
        
        if not all([route_id, bus_id, departure_time_of_day, duration_minutes, price]):
            flash('Veuillez remplir tous les champs obligatoires.', 'danger')
            return redirect(url_for('admin.add_trip_schedule'))
        
        # Determine agency_id
        route = Route.query.get(route_id)
        if not route:
            flash('Ligne introuvable.', 'danger')
            return redirect(url_for('admin.add_trip_schedule'))
        agency_id = route.agency_id
        
        try:
            eff_from = datetime.strptime(effective_from, '%Y-%m-%d').date() if effective_from else date.today()
            eff_until = datetime.strptime(effective_until, '%Y-%m-%d').date() if effective_until else None
        except ValueError:
            flash('Format de date invalide.', 'danger')
            return redirect(url_for('admin.add_trip_schedule'))
        
        import json as _json
        schedule = TripSchedule(
            route_id=route_id,
            bus_id=bus_id,
            driver_id=driver_id if driver_id else None,
            agency_id=agency_id,
            departure_time_of_day=departure_time_of_day,
            duration_minutes=duration_minutes,
            price=price,
            capacity=capacity,
            booking_cutoff_minutes=booking_cutoff,
            recurrence_type=recurrence_type,
            recurrence_days=_json.dumps(recurrence_days) if recurrence_days else None,
            effective_from=eff_from,
            effective_until=eff_until,
            is_active=True
        )
        db.session.add(schedule)
        db.session.commit()
        
        log_audit("SCHEDULE_CREATED", "TripSchedule", schedule.id, f"Created schedule: {schedule.departure_time_of_day} ({schedule.recurrence_type})")
        
        # Auto-generate trips immediately
        from app.services.trip_service import generate_scheduled_trips
        generated = generate_scheduled_trips(horizon_days=14)
        
        flash(f'Programme cr\u00e9\u00e9 avec succ\u00e8s ! {generated} voyage(s) g\u00e9n\u00e9r\u00e9(s) automatiquement.', 'success')
        return redirect(url_for('admin.trip_schedules'))
    
    # GET: load form data
    if current_user.role == 'super_admin':
        routes = Route.query.filter_by(is_deleted=False).all()
        buses = Bus.query.filter_by(status='active', is_deleted=False).all()
        drivers = Driver.query.filter_by(is_deleted=False).all()
    else:
        routes = Route.query.filter_by(agency_id=current_user.agency_id, is_deleted=False).all()
        buses = Bus.query.filter_by(agency_id=current_user.agency_id, status='active', is_deleted=False).all()
        drivers = Driver.query.filter_by(agency_id=current_user.agency_id, is_deleted=False).all()
    
    return render_template('admin/add_trip_schedule.html', routes=routes, buses=buses, drivers=drivers)

@admin.route('/admin/trip_schedule/toggle/<int:id>')
@login_required
@admin_required
def toggle_schedule(id):
    schedule = TripSchedule.query.get_or_404(id)
    if current_user.role != 'super_admin' and schedule.agency_id != current_user.agency_id:
        flash("Acc\u00e8s non autoris\u00e9.", 'danger')
        return redirect(url_for('admin.trip_schedules'))
    
    schedule.is_active = not schedule.is_active
    db.session.commit()
    
    status_msg = 'activ\u00e9' if schedule.is_active else 'mis en pause'
    log_audit("SCHEDULE_TOGGLED", "TripSchedule", schedule.id, f"Schedule {status_msg}")
    flash(f'Programme {status_msg} avec succ\u00e8s !', 'success')
    return redirect(url_for('admin.trip_schedules'))

@admin.route('/admin/trip_schedule/delete/<int:id>')
@login_required
@admin_required
def delete_schedule(id):
    schedule = TripSchedule.query.get_or_404(id)
    if current_user.role != 'super_admin' and schedule.agency_id != current_user.agency_id:
        flash("Acc\u00e8s non autoris\u00e9.", 'danger')
        return redirect(url_for('admin.trip_schedules'))
    
    # Check if generated trips have bookings
    linked_trips_with_bookings = Trip.query.filter(
        Trip.schedule_id == schedule.id,
        Trip.is_deleted == False
    ).join(Booking, Booking.trip_id == Trip.id, isouter=True).filter(
        Booking.id != None,
        Booking.status != 'cancelled'
    ).count()
    
    if linked_trips_with_bookings > 0:
        flash(f'Impossible de supprimer : {linked_trips_with_bookings} voyage(s) li\u00e9(s) ont des r\u00e9servations actives.', 'danger')
        return redirect(url_for('admin.trip_schedules'))
    
    schedule_id = schedule.id
    db.session.delete(schedule)
    db.session.commit()
    
    log_audit("SCHEDULE_DELETED", "TripSchedule", schedule_id, "Deleted trip schedule")
    flash('Programme supprim\u00e9 avec succ\u00e8s !', 'success')
    return redirect(url_for('admin.trip_schedules'))

@admin.route('/admin/trip_schedule/generate/<int:id>')
@login_required
@admin_required
def generate_from_schedule(id):
    """Manually trigger trip generation for a specific schedule."""
    schedule = TripSchedule.query.get_or_404(id)
    if current_user.role != 'super_admin' and schedule.agency_id != current_user.agency_id:
        flash("Acc\u00e8s non autoris\u00e9.", 'danger')
        return redirect(url_for('admin.trip_schedules'))
    
    from app.services.trip_service import generate_scheduled_trips
    generated = generate_scheduled_trips(horizon_days=14)
    
    flash(f'{generated} voyage(s) g\u00e9n\u00e9r\u00e9(s) avec succ\u00e8s !', 'success')
    return redirect(url_for('admin.trip_schedules'))


@admin.route('/admin/profile', methods=['GET', 'POST'])
@login_required
@admin_required
def profile():
    if current_user.role == 'client':
        return redirect(url_for('client.profile'))
    
    import json
    
    if request.method == 'POST':
        action = request.form.get('action')
        
        # 1. Update Agency Profile (Agency Admin)
        if action == 'update_agency' and current_user.role == 'admin_agence' and current_user.agency:
            agency = current_user.agency
            agency.name = request.form.get('agency_name')
            agency.city = request.form.get('agency_city')
            agency.email = request.form.get('agency_email')
            agency.phone = request.form.get('agency_phone')
            agency.address = request.form.get('agency_address')
            
            # Handle logo upload
            if 'agency_logo' in request.files:
                file = request.files['agency_logo']
                if file and file.filename:
                    from werkzeug.utils import secure_filename
                    filename = secure_filename(f"agency_{agency.id}_{file.filename}")
                    uploads_dir = os.path.join(current_app.root_path, 'static', 'uploads')
                    os.makedirs(uploads_dir, exist_ok=True)
                    upload_path = os.path.join(uploads_dir, filename)
                    file.save(upload_path)
                    agency.logo = filename
                    
            db.session.commit()
            flash('Profil de l\'agence mis à jour avec succès.', 'success')
            return redirect(url_for('admin.profile'))
            
        # 2. Update Global Platform (Super Admin)
        elif action == 'update_global' and current_user.role == 'super_admin':
            settings_path = os.path.join(current_app.instance_path, 'global_settings.json')
            os.makedirs(os.path.dirname(settings_path), exist_ok=True)
            global_settings = {
                'platform_name': request.form.get('platform_name', '3M SERVICES'),
                'support_email': request.form.get('support_email', 'contact@3mservice.shop'),
                'maintenance_mode': request.form.get('maintenance_mode') == 'true'
            }
            with open(settings_path, 'w') as f:
                json.dump(global_settings, f)
            flash('Paramètres globaux mis à jour avec succès.', 'success')
            return redirect(url_for('admin.profile'))
            
        # 3. Update Payment Gateways (Super Admin)
        elif action == 'update_payments' and current_user.role == 'super_admin':
            settings_path = os.path.join(current_app.instance_path, 'payment_settings.json')
            os.makedirs(os.path.dirname(settings_path), exist_ok=True)
            payment_settings = {
                'momo_merchant': request.form.get('momo_merchant', ''),
                'momo_secret': request.form.get('momo_secret', ''),
                'stripe_public': request.form.get('stripe_public', ''),
                'stripe_secret': request.form.get('stripe_secret', '')
            }
            with open(settings_path, 'w') as f:
                json.dump(payment_settings, f)
            flash('Paramètres de paiement mis à jour avec succès.', 'success')
            return redirect(url_for('admin.profile'))

        # 4. Password Change Request
        current_password = request.form.get('current_password')
        new_password = request.form.get('new_password')
        confirm_password = request.form.get('confirm_password')
        
        if current_password and new_password:
            if not current_user.check_password(current_password):
                flash('Le mot de passe actuel est incorrect.', 'danger')
                return redirect(url_for('admin.profile'))
            import re
            if len(new_password) < 8 or not re.search(r'[a-z]', new_password) or not re.search(r'\d', new_password) or not re.search(r'[^a-zA-Z0-9]', new_password):
                flash('Le mot de passe doit contenir au moins 8 caractères, 1 minuscule, 1 chiffre et 1 caractère spécial.', 'danger')
                return redirect(url_for('admin.profile'))
            if new_password != confirm_password:
                flash('Les nouveaux mots de passe ne correspondent pas.', 'danger')
                return redirect(url_for('admin.profile'))
            current_user.set_password(new_password)
            db.session.commit()
            flash('Votre mot de passe a été modifié avec succès.', 'success')
            return redirect(url_for('admin.profile'))

        # 5. Personal Information Update
        new_email = request.form.get('email')
        if new_email and new_email != current_user.email:
            existing = User.query.filter_by(email=new_email).first()
            if existing:
                flash(f"L'adresse email {new_email} est déjà utilisée par un autre compte.", 'danger')
                return redirect(url_for('admin.profile'))
            current_user.email = new_email
            
        current_user.phone = request.form.get('phone')
        
        real_name = request.form.get('real_name')
        if real_name:
            import re
            if not re.match(r"^[a-zA-ZÀ-ÿ\s\-\']+$", real_name):
                flash('Le nom ne doit contenir que des lettres, espaces, traits d\'union et apostrophes.', 'danger')
                return redirect(url_for('admin.profile'))
            current_user.real_name = real_name
        current_user.language = request.form.get('language')
        if current_user.language:
            session['lang'] = current_user.language
        
        # Profile picture removal or upload
        if request.form.get('remove_profile_picture') == 'true':
            # Wipe the base64 string from DB — no filesystem to touch
            current_user.profile_picture = None
        elif 'profile_picture' in request.files:
            file = request.files['profile_picture']
            if file and file.filename:
                import base64
                img_bytes = file.read()
                # Guard: max 3 MB before encoding
                if len(img_bytes) > 3 * 1024 * 1024:
                    flash('La photo est trop volumineuse (max 3 Mo). Veuillez choisir une image plus petite.', 'danger')
                    return redirect(url_for('admin.profile'))
                if img_bytes:
                    try:
                        from PIL import Image
                        import io
                        img = Image.open(io.BytesIO(img_bytes))
                        if img.mode not in ('RGB', 'L'):
                            img = img.convert('RGB')
                        img.thumbnail((400, 400), Image.LANCZOS)
                        buf = io.BytesIO()
                        img.save(buf, format='JPEG', quality=82, optimize=True)
                        img_bytes = buf.getvalue()
                        mime_type = 'image/jpeg'
                    except Exception:
                        mime_type = file.mimetype or 'image/jpeg'
                    b64_str = base64.b64encode(img_bytes).decode('utf-8')
                    current_user.profile_picture = f"data:{mime_type};base64,{b64_str}"

        
        # Client‑specific fields
        if current_user.role == 'client':
            current_user.momo_number = request.form.get('momo_number')
            current_user.orange_number = request.form.get('orange_number')
            current_user.preferred_payment_method = request.form.get('preferred_payment_method')
        
        db.session.commit()
        flash('Profil mis à jour avec succès.', 'success')
        return redirect(url_for('admin.profile'))
    
    # --- Fetch Dashboard Data ---
    
    # 1. Metrics
    if current_user.is_admin:
        # Super admin sees global stats
        total_bookings = Booking.query.count()
        total_revenue = db.session.query(func.sum(Booking.price_paid)).scalar() or 0
        total_trips = Trip.query.count()
        cancellations = Booking.query.filter_by(status='cancelled').count()
    else:
        # Agency admin sees only their agency's stats
        if current_user.agency_id:
            total_trips = Trip.query.join(Trip.bus).filter_by(agency_id=current_user.agency_id).count()
            bookings_query = Booking.query.join(Booking.trip).join(Trip.bus).filter_by(agency_id=current_user.agency_id)
            total_bookings = bookings_query.count()
            total_revenue = db.session.query(func.sum(Booking.price_paid)).join(Booking.trip).join(Trip.bus).filter_by(agency_id=current_user.agency_id).scalar() or 0
            cancellations = bookings_query.filter(Booking.status == 'cancelled').count()
        else:
            total_bookings, total_revenue, total_trips, cancellations = 0, 0, 0, 0
    
    # 2. Audit Logs
    if current_user.is_admin:
        audit_logs = AuditLog.query.order_by(AuditLog.created_at.desc()).limit(100).all()
    elif current_user.role == 'admin_agence' and current_user.agency_id:
        # Agency Admin sees logs related to their agency's users
        audit_logs = AuditLog.query.join(User).filter(User.agency_id == current_user.agency_id).order_by(AuditLog.created_at.desc()).limit(100).all()
    else:
        audit_logs = []
        
    # 3. Staff / Users 
    if current_user.is_admin:
        staff_members = User.query.filter(User.role.in_(['super_admin', 'admin_agence', 'teller', 'finance_officer'])).all()
    elif current_user.role == 'admin_agence' and current_user.agency_id:
        # Agency Admin sees staff in their own agency
        staff_members = User.query.filter(User.role.in_(['admin_agence', 'teller', 'finance_officer']), User.agency_id == current_user.agency_id).all()
    else:
        staff_members = []
        
            # 4. Notifications & Alerts — unified logic from main.py
    from app.models import NotificationRead, Agency
    dismissed_records = NotificationRead.query.filter_by(user_id=current_user.id).all()
    dismissed_ids = [r.notification_id for r in dismissed_records]
    
    base_query_all = SystemNotification.query.filter_by(is_deleted=False)
        
    if current_user.role == 'super_admin':
        query_all = base_query_all.filter(
            db.or_(
                SystemNotification.role_target == 'super_admin',
                SystemNotification.role_target == None,
                SystemNotification.user_id == current_user.id
            )
        )
    elif current_user.role == 'client':
        query_all = base_query_all.filter(SystemNotification.user_id == current_user.id)
    else:
        query_all = base_query_all.filter(
            db.or_(
                db.and_(
                    db.or_(SystemNotification.role_target == current_user.role, SystemNotification.role_target == None),
                    db.or_(SystemNotification.agency_id == current_user.agency_id, SystemNotification.agency_id == None)
                ),
                SystemNotification.user_id == current_user.id
            )
        )
        
    notifications = query_all.order_by(SystemNotification.created_at.desc()).limit(50).all()
    
    # Tag read status and agency name
    # Cache agencies
    agencies_cache = {a.id: a.name for a in Agency.query.all()}
    for n in notifications:
        n.is_read_by_user = (n.id in dismissed_ids)
        n.agency_name = agencies_cache.get(n.agency_id, 'Globale') if n.agency_id else 'Globale'
        
    if dismissed_ids:
        unread_count = query_all.filter(SystemNotification.id.notin_(dismissed_ids)).count()
    else:
        unread_count = query_all.count()
    
    # Calculate alert badges for Quick Actions
    alerts = {
        'dashboard': unread_count,
        'calendar': Trip.query.filter(Trip.departure_time >= func.current_date()).count() if current_user.is_admin else 0,
        'bookings': Booking.query.filter_by(status='locked').count() if current_user.is_admin else 0,
        'agency': 0
    }

    # 5. Global & Payment Configurations
    global_settings_path = os.path.join(current_app.instance_path, 'global_settings.json')
    if os.path.exists(global_settings_path):
        try:
            with open(global_settings_path, 'r') as f:
                global_settings = json.load(f)
        except Exception:
            global_settings = {}
    else:
        global_settings = {}
        
    global_settings.setdefault('platform_name', '3M SERVICES')
    global_settings.setdefault('support_email', 'contact@3mservice.shop')
    global_settings.setdefault('maintenance_mode', False)
        
    pay_settings_path = os.path.join(current_app.instance_path, 'payment_settings.json')
    if os.path.exists(pay_settings_path):
        try:
            with open(pay_settings_path, 'r') as f:
                payment_settings = json.load(f)
        except Exception:
            payment_settings = {}
    else:
        payment_settings = {}
        
    payment_settings.setdefault('momo_merchant', 'MOMO_123456')
    payment_settings.setdefault('momo_secret', 'xxxxxxxxxxxxxxxxxxxx')
    payment_settings.setdefault('stripe_public', 'pk_live_xxxxxxxxxxx')
    payment_settings.setdefault('stripe_secret', 'sk_live_xxxxxxxxxxx')
    # 6. Contact Messages
    from app.models import ContactMessage
    if current_user.role in ['super_admin', 'admin_agence']:
        contact_messages = ContactMessage.query.filter_by(is_deleted=False).order_by(ContactMessage.created_at.desc()).all()
        for msg in contact_messages:
            msg.associated_user = User.query.filter_by(email=msg.email).first()
    else:
        contact_messages = []

    return render_template(
        'admin/profile.html', 
        total_bookings=total_bookings,
        total_revenue=total_revenue,
        total_trips=total_trips,
        cancellations=cancellations,
        audit_logs=audit_logs,
        staff_members=staff_members,
        notifications=notifications,
        alerts=alerts,
        global_settings=global_settings,
        payment_settings=payment_settings,
        contact_messages=contact_messages
    )

# =========================================================================
# 3M SERVICES PROMO VEHICLES MANAGEMENT & 3M PERSONAL PRIVATE CHAT
# =========================================================================

@admin.route('/admin/buses/<int:id>/toggle_promo', methods=['POST', 'GET'])
@login_required
@admin_required
def toggle_bus_promo(id):
    bus = Bus.query.filter_by(id=id, is_deleted=False).first_or_404()
    
    action = request.form.get('action') or request.args.get('action')
    promo_price = request.form.get('promo_price', type=int)
    regular_price = request.form.get('regular_price', type=int)
    promo_badge = request.form.get('promo_badge', '').strip()
    promo_description = request.form.get('promo_description', '').strip()
    
    if action == 'remove' or request.args.get('remove') == 'true':
        bus.is_promo = False
    else:
        bus.is_promo = True
        if promo_price:
            bus.promo_price = promo_price
        if regular_price:
            bus.regular_price = regular_price
        if promo_badge:
            bus.promo_badge = promo_badge
        if promo_description:
            bus.promo_description = promo_description

    db.session.commit()
    
    # Synchronize with Express backend server/data/db.json
    try:
        import json as _json
        db_path = os.path.join(os.path.dirname(os.path.dirname(os.path.dirname(__file__))), 'server', 'data', 'db.json')
        if os.path.exists(db_path):
            with open(db_path, 'r', encoding='utf-8') as f:
                exp_db = _json.load(f)
            cars = exp_db.get('cars', [])
            
            target_model = (bus.model or '').lower().strip()
            found = False
            for car in cars:
                c_name = (car.get('name') or '').lower()
                c_model = (car.get('model') or '').lower()
                if (target_model and (target_model in c_name or c_name in target_model or target_model in c_model)) or (car.get('plate') and car.get('plate') == bus.bus_number):
                    car['isPromo'] = bus.is_promo
                    if bus.is_promo:
                        if bus.promo_price:
                            car['promoPrice'] = bus.promo_price
                            car['pricePerDay'] = bus.promo_price
                        if bus.regular_price:
                            car['regularPrice'] = bus.regular_price
                        if bus.promo_badge:
                            car['promoBadge'] = bus.promo_badge
                        if bus.promo_description:
                            car['promoDescription'] = bus.promo_description
                    found = True
                    break
            
            # If not already in db.json cars array, add it so it appears on client site!
            if not found and bus.is_promo:
                new_car = {
                    "id": f"bus-{bus.id}",
                    "name": f"{bus.brand or 'Toyota'} {bus.model}",
                    "model": bus.model,
                    "mark": bus.brand or "Toyota",
                    "brand": bus.brand or "Toyota",
                    "category": "4x4 & SUV VIP",
                    "year": "2023",
                    "condition": "Prestige VIP",
                    "mileage": "Certifié Faible Km",
                    "price": f"{bus.promo_price or 100000:,} FCFA / jour".replace(',', ' '),
                    "pricePerDay": bus.promo_price or 100000,
                    "doors": "5",
                    "seats": f"{bus.capacity} places cuir VIP",
                    "transmission": "Automatique 4x4",
                    "fuel": "Diesel",
                    "air": "Oui (Intégrale bi-zone)",
                    "status": "Disponible",
                    "plate": bus.bus_number,
                    "img": "/images/cars/toyota-landcruiser-v8-black.webp",
                    "image": "/images/cars/toyota-landcruiser-v8-black.webp",
                    "description": bus.promo_description or f"{bus.brand} {bus.model} avec chauffeur dédié inclus.",
                    "isPromo": True,
                    "regularPrice": bus.regular_price or int((bus.promo_price or 100000) * 1.18),
                    "promoPrice": bus.promo_price or 100000,
                    "promoBadge": bus.promo_badge or "OFFRE SPÉCIALE VIP",
                    "promoDescription": bus.promo_description or f"{bus.model} • {bus.capacity} places cuir VIP • Chauffeur dédié inclus"
                }
                cars.append(new_car)

            with open(db_path, 'w', encoding='utf-8') as f:
                _json.dump(exp_db, f, indent=2, ensure_ascii=False)
    except Exception as e:
        logger.warning(f"Error syncing promo to db.json: {e}")

    log_audit("BUS_PROMO_TOGGLED", "Bus", bus.id, f"Bus {bus.bus_number} promo status set to {bus.is_promo}")
    
    if request.is_json or request.headers.get('X-Requested-With') == 'XMLHttpRequest':
        return jsonify({'success': True, 'is_promo': bus.is_promo, 'promo_price': bus.promo_price})

    flash(f"Offre promotionnelle {'activée' if bus.is_promo else 'retirée'} pour le véhicule {bus.brand} {bus.model} !", 'success')
    return redirect(url_for('admin.buses'))

@admin.route('/admin/chats')
@login_required
@admin_required
def chats():
    import json as _json
    db_path = os.path.join(os.path.dirname(os.path.dirname(os.path.dirname(__file__))), 'server', 'data', 'db.json')
    chat_threads = []
    if os.path.exists(db_path):
        try:
            with open(db_path, 'r', encoding='utf-8') as f:
                exp_db = _json.load(f)
            chat_threads = exp_db.get('chats', [])
        except Exception as e:
            logger.warning(f"Error reading chats from db.json: {e}")

    selected_client_id = request.args.get('client_id')
    active_chat = None
    if selected_client_id and chat_threads:
        active_chat = next((c for c in chat_threads if c.get('id') == selected_client_id or c.get('clientId') == selected_client_id), None)
    if not active_chat and chat_threads:
        active_chat = chat_threads[0]

    # Also mark as read for admin when viewing active chat
    if active_chat:
        active_chat['unreadAdmin'] = 0
        try:
            with open(db_path, 'w', encoding='utf-8') as f:
                _json.dump(exp_db, f, indent=2, ensure_ascii=False)
        except Exception:
            pass

    available_buses = Bus.query.filter(Bus.status != 'maintenance').all()

    return render_template('admin/chats.html', chat_threads=chat_threads, active_chat=active_chat, available_buses=available_buses)

@admin.route('/admin/chats/<client_id>/send', methods=['POST'])
@login_required
@admin_required
def send_admin_chat_reply(client_id):
    import json as _json
    data = request.get_json(silent=True) or {}
    text = (data.get('text') or request.form.get('text') or '').strip()
    if not text:
        if request.is_json or request.headers.get('X-Requested-With') == 'XMLHttpRequest':
            return jsonify({'error': 'Message vide'}), 400
        flash('Le message ne peut pas être vide.', 'danger')
        return redirect(url_for('admin.chats', client_id=client_id))

    car_info = data.get('carInfo')
    if not car_info and request.form.get('car_name'):
        car_info = {
            'id': request.form.get('car_id'),
            'name': request.form.get('car_name'),
            'price': request.form.get('car_price'),
            'badge': request.form.get('car_badge') or 'VIP FLOTTE'
        }

    db_path = os.path.join(os.path.dirname(os.path.dirname(os.path.dirname(__file__))), 'server', 'data', 'db.json')
    if os.path.exists(db_path):
        try:
            with open(db_path, 'r', encoding='utf-8') as f:
                exp_db = _json.load(f)
            chats = exp_db.get('chats', [])
            chat = next((c for c in chats if c.get('id') == client_id or c.get('clientId') == client_id), None)
            now = datetime.utcnow().isoformat() + "Z"
            new_msg = {
                'id': f"msg-admin-{int(datetime.utcnow().timestamp()*1000)}",
                'sender': 'admin',
                'senderName': f"Conciergerie VIP 3M ({current_user.username})",
                'text': text,
                'timestamp': now,
                'carInfo': car_info
            }
            if chat:
                chat['messages'] = chat.get('messages', [])
                chat['messages'].append(new_msg)
                chat['lastMessage'] = text
                chat['lastMessageAt'] = now
                chat['unreadClient'] = chat.get('unreadClient', 0) + 1
                chat['unreadAdmin'] = 0
            else:
                chat = {
                    'id': client_id,
                    'clientId': client_id,
                    'clientName': data.get('client_name') or request.form.get('client_name') or 'Client VIP 3M',
                    'clientPhone': data.get('client_phone') or request.form.get('client_phone') or '',
                    'unreadAdmin': 0,
                    'unreadClient': 1,
                    'lastMessage': text,
                    'lastMessageAt': now,
                    'messages': [new_msg]
                }
                chats.insert(0, chat)
                exp_db['chats'] = chats

            with open(db_path, 'w', encoding='utf-8') as f:
                _json.dump(exp_db, f, indent=2, ensure_ascii=False)

            if request.is_json or request.headers.get('X-Requested-With') == 'XMLHttpRequest':
                return jsonify({'success': True, 'message': new_msg})

            flash('Réponse transmise avec succès au client !', 'success')
            return redirect(url_for('admin.chats', client_id=client_id))
        except Exception as e:
            logger.error(f"Error saving chat reply: {e}")
            if request.is_json or request.headers.get('X-Requested-With') == 'XMLHttpRequest':
                return jsonify({'error': str(e)}), 500

    return redirect(url_for('admin.chats', client_id=client_id))

@admin.route('/admin/chats/<client_id>/api/messages', methods=['GET'])
@login_required
@admin_required
def get_admin_chat_messages(client_id):
    import json as _json
    db_path = os.path.join(os.path.dirname(os.path.dirname(os.path.dirname(__file__))), 'server', 'data', 'db.json')
    if os.path.exists(db_path):
        try:
            with open(db_path, 'r', encoding='utf-8') as f:
                exp_db = _json.load(f)
            chats = exp_db.get('chats', [])
            chat = next((c for c in chats if c.get('id') == client_id or c.get('clientId') == client_id), None)
            if chat:
                # Mark as read
                chat['unreadAdmin'] = 0
                with open(db_path, 'w', encoding='utf-8') as f:
                    _json.dump(exp_db, f, indent=2, ensure_ascii=False)
                return jsonify({'success': True, 'chat': chat})
            return jsonify({'success': False, 'error': 'Conversation introuvable'}), 404
        except Exception as e:
            return jsonify({'success': False, 'error': str(e)}), 500
    return jsonify({'success': False, 'error': 'Base db.json introuvable'}), 404

@admin.route('/admin/chats/<client_id>/api/edit/<msg_id>', methods=['POST'])
@login_required
@admin_required
def edit_admin_chat_message(client_id, msg_id):
    import json as _json
    data = request.get_json(silent=True) or {}
    text = (data.get('text') or request.form.get('text') or '').strip()
    if not text:
        return jsonify({'error': 'Texte requis'}), 400

    db_path = os.path.join(os.path.dirname(os.path.dirname(os.path.dirname(__file__))), 'server', 'data', 'db.json')
    if os.path.exists(db_path):
        try:
            with open(db_path, 'r', encoding='utf-8') as f:
                exp_db = _json.load(f)
            chats = exp_db.get('chats', [])
            chat = next((c for c in chats if c.get('id') == client_id or c.get('clientId') == client_id), None)
            if not chat:
                return jsonify({'error': 'Conversation introuvable'}), 404
            msg = next((m for m in chat.get('messages', []) if m.get('id') == msg_id), None)
            if not msg:
                return jsonify({'error': 'Message introuvable'}), 404

            msg['text'] = text
            msg['isEdited'] = True
            msg['editedAt'] = datetime.utcnow().isoformat() + "Z"
            chat['lastMessage'] = text

            with open(db_path, 'w', encoding='utf-8') as f:
                _json.dump(exp_db, f, indent=2, ensure_ascii=False)
            return jsonify({'success': True, 'message': msg})
        except Exception as e:
            return jsonify({'error': str(e)}), 500
    return jsonify({'error': 'Base introuvable'}), 500

@admin.route('/admin/chats/<client_id>/api/delete/<msg_id>', methods=['POST'])
@login_required
@admin_required
def delete_admin_chat_message(client_id, msg_id):
    import json as _json
    db_path = os.path.join(os.path.dirname(os.path.dirname(os.path.dirname(__file__))), 'server', 'data', 'db.json')
    if os.path.exists(db_path):
        try:
            with open(db_path, 'r', encoding='utf-8') as f:
                exp_db = _json.load(f)
            chats = exp_db.get('chats', [])
            chat = next((c for c in chats if c.get('id') == client_id or c.get('clientId') == client_id), None)
            if not chat:
                return jsonify({'error': 'Conversation introuvable'}), 404
            msg = next((m for m in chat.get('messages', []) if m.get('id') == msg_id), None)
            if not msg:
                return jsonify({'error': 'Message introuvable'}), 404

            msg['isDeleted'] = True
            msg['text'] = "Ce message a été supprimé par l'administration."
            msg['deletedAt'] = datetime.utcnow().isoformat() + "Z"

            with open(db_path, 'w', encoding='utf-8') as f:
                _json.dump(exp_db, f, indent=2, ensure_ascii=False)
            return jsonify({'success': True, 'message': msg})
        except Exception as e:
            return jsonify({'error': str(e)}), 500
    return jsonify({'error': 'Base introuvable'}), 500

@admin.route('/admin/chats/<client_id>/api/clear', methods=['POST'])
@login_required
@admin_required
def clear_admin_chat_thread(client_id):
    import json as _json
    db_path = os.path.join(os.path.dirname(os.path.dirname(os.path.dirname(__file__))), 'server', 'data', 'db.json')
    if os.path.exists(db_path):
        try:
            with open(db_path, 'r', encoding='utf-8') as f:
                exp_db = _json.load(f)
            chats = exp_db.get('chats', [])
            chat = next((c for c in chats if c.get('id') == client_id or c.get('clientId') == client_id), None)
            if chat:
                chat['messages'] = []
                chat['lastMessage'] = "Discussion réinitialisée"
                with open(db_path, 'w', encoding='utf-8') as f:
                    _json.dump(exp_db, f, indent=2, ensure_ascii=False)
                return jsonify({'success': True})
            return jsonify({'error': 'Conversation introuvable'}), 404
        except Exception as e:
            return jsonify({'error': str(e)}), 500
    return jsonify({'error': 'Base introuvable'}), 500 
