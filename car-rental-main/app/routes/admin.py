import os
import json
from flask import Blueprint, render_template, redirect, url_for, flash, request, jsonify, current_app, session
from werkzeug.security import generate_password_hash
from flask_login import login_required, current_user
from app.models import User, Agency, Bus, Route, Trip, Booking, Feedback, AuditLog, SystemNotification, Driver, CaisseSession, Parcel, TripSchedule
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
        if not caisse:
            flash("Erreur: La caisse est fermée. Vous ne pouvez pas émettre de contrats de location.", "danger")
            return redirect(url_for('admin.teller_book'))
            
        # Retrieve form data
        trip_id = request.form.get('trip_id')
        seat_number = request.form.get('seat_number')
        return_trip_id = request.form.get('return_trip_id')
        return_seat_number = request.form.get('return_seat_number')
        passenger_name = request.form.get('passenger_name')
        passenger_phone = request.form.get('passenger_phone')
        passenger_gender = request.form.get('passenger_gender')
        passenger_email = request.form.get('passenger_email')
        passenger_cni = request.form.get('passenger_cni')
        passenger_dob_str = request.form.get('passenger_dob')
        passenger_emergency = request.form.get('passenger_emergency')
        passenger_category = request.form.get('passenger_category', 'Adult')
        
        trip_type = request.form.get('trip_type', 'one_way')
        return_date_str = request.form.get('return_date')
        
        bags_count = int(request.form.get('bags_count', 0) or 0)
        luggage_weight = float(request.form.get('luggage_weight', 0.0) or 0.0)
        luggage_charge = float(request.form.get('luggage_charge', 0.0) or 0.0)
        
        boarding_point = request.form.get('boarding_point')
        boarding_time = request.form.get('boarding_time')
        special_instructions = request.form.get('special_instructions')
        
        payment_status = request.form.get('payment_status', 'Paid')
        payment_method = request.form.get('payment_method', 'Cash')
        payment_ref = request.form.get('payment_ref')
        
        discount_applied = float(request.form.get('discount_applied', 0.0) or 0.0)
        additional_charges = float(request.form.get('additional_charges', 0.0) or 0.0)
        price_paid = float(request.form.get('price_paid', 0.0) or 0.0)
        
        booking_action = request.form.get('booking_action', 'confirm')
        
        # Parse Dates
        passenger_dob = None
        if passenger_dob_str:
            try:
                passenger_dob = datetime.strptime(passenger_dob_str, '%Y-%m-%d').date()
            except ValueError:
                pass
                
        return_date = None
        if return_date_str:
            try:
                return_date = datetime.strptime(return_date_str, '%Y-%m-%d')
            except ValueError:
                pass

        trip = Trip.query.get_or_404(trip_id)
        if trip.status == 'cancelled':
            flash("Erreur: Le trajet sélectionné est annulé.", "danger")
            return redirect(url_for('admin.teller_book'))
        
        is_round_trip = (trip_type == 'round_trip' and return_trip_id)
        return_trip = None
        if is_round_trip:
            return_trip = Trip.query.get_or_404(return_trip_id)
            if return_trip.status == 'cancelled':
                flash("Erreur: Le trajet retour sélectionné est annulé.", "danger")
                return redirect(url_for('admin.teller_book'))
        
        passenger_user = None
        if passenger_phone:
            passenger_user = User.query.filter_by(phone=passenger_phone).first()
            if not passenger_user:
                # Create lightweight client user
                passenger_user = User(
                    username=passenger_phone,
                    email=passenger_email or f"{passenger_phone}@lengue.tmp",
                    phone=passenger_phone,
                    real_name=passenger_name,
                    gender=passenger_gender,
                    date_of_birth=passenger_dob,
                    emergency_contact_phone=passenger_emergency,
                    role='client'
                )
                passenger_user.set_password(passenger_phone)
                db.session.add(passenger_user)
                db.session.flush()
            else:
                # Update optional info if not already set
                if not passenger_user.real_name:
                    passenger_user.real_name = passenger_name
                if not passenger_user.email or '@lengue.tmp' in passenger_user.email:
                    if passenger_email:
                        passenger_user.email = passenger_email
                if not passenger_user.gender:
                    passenger_user.gender = passenger_gender
                if not passenger_user.date_of_birth:
                    passenger_user.date_of_birth = passenger_dob
                if not passenger_user.emergency_contact_phone:
                    passenger_user.emergency_contact_phone = passenger_emergency
                db.session.flush()
        
        # Determine status based on booking action
        booking_status = 'confirmed'
        if booking_action == 'save':
            booking_status = 'locked'
            payment_status = 'pending'
            # Lock reservation for 7 days
            locked_until = datetime.utcnow() + timedelta(days=7)
        else:
            locked_until = None

        # Price splits for round-trip
        outbound_price_paid = price_paid / 2 if is_round_trip else price_paid
        outbound_discount = discount_applied / 2 if is_round_trip else discount_applied
        outbound_additional = additional_charges / 2 if is_round_trip else additional_charges
        outbound_luggage_charge = luggage_charge / 2 if is_round_trip else luggage_charge

        booking = Booking(
            user_id=passenger_user.id if passenger_user else current_user.id,
            trip_id=trip.id,
            seat_number=seat_number or 'AUTO',
            status=booking_status,
            payment_status=payment_status.lower(),
            payment_method=payment_method,
            upi_reference=payment_ref,
            price_paid=outbound_price_paid,
            passenger_name=passenger_name,
            passenger_category=passenger_category,
            bags_count=bags_count,
            luggage_weight=luggage_weight,
            luggage_charge=outbound_luggage_charge,
            trip_type=trip_type,
            return_date=return_date,
            discount_applied=outbound_discount,
            additional_charges=outbound_additional,
            boarding_point=boarding_point,
            boarding_time=boarding_time,
            special_instructions=special_instructions,
            locked_until=locked_until,
            booking_code=f"TK-{trip.departure_time.strftime('%Y%m%d')}-{random.randint(10000, 99999)}"
        )
        
        if booking_status == 'confirmed':
            trip.occupied_seats += 1
            
        db.session.add(booking)
        
        return_booking = None
        if is_round_trip:
            return_booking = Booking(
                user_id=passenger_user.id if passenger_user else current_user.id,
                trip_id=return_trip.id,
                seat_number=return_seat_number or 'AUTO',
                status=booking_status,
                payment_status=payment_status.lower(),
                payment_method=payment_method,
                upi_reference=payment_ref,
                price_paid=price_paid / 2,
                passenger_name=passenger_name,
                passenger_category=passenger_category,
                bags_count=0,
                luggage_weight=0.0,
                luggage_charge=luggage_charge / 2,
                trip_type=trip_type,
                return_date=return_date,
                discount_applied=discount_applied / 2,
                additional_charges=additional_charges / 2,
                boarding_point=boarding_point,
                boarding_time=boarding_time,
                special_instructions=special_instructions,
                locked_until=locked_until,
                booking_code=f"TK-{return_trip.departure_time.strftime('%Y%m%d')}-{random.randint(10000, 99999)}"
            )
            if booking_status == 'confirmed':
                return_trip.occupied_seats += 1
            db.session.add(return_booking)
            
        db.session.commit()
        
        log_audit("TELLER_BOOKING", "Booking", booking.id, f"Manual POS booking for {passenger_name} (Aller)")
        if return_booking:
            log_audit("TELLER_BOOKING", "Booking", return_booking.id, f"Manual POS booking for {passenger_name} (Retour)")
        
        # Outbound notification
        trigger_notification(
            title="🎫 Nouveau Billet Émis",
            message=f"Billet #{booking.booking_code} émis pour {passenger_name} — {trip.route.origin} → {trip.route.destination} le {trip.departure_time.strftime('%d/%m/%Y %H:%M')}. Montant: {outbound_price_paid:.0f} FCFA.",
            type="success", category='booking', role_target='admin_agence',
            agency_id=trip.route.agency_id
        )
        if return_booking:
            trigger_notification(
                title="🎫 Nouveau Billet Émis (Retour)",
                message=f"Billet #{return_booking.booking_code} émis pour {passenger_name} — {return_trip.route.origin} → {return_trip.route.destination} le {return_trip.departure_time.strftime('%d/%m/%Y %H:%M')}. Montant: {(price_paid / 2):.0f} FCFA.",
                type="success", category='booking', role_target='admin_agence',
                agency_id=return_trip.route.agency_id
            )
            
        # Client notification & Email tickets
        if passenger_user and booking_status == 'confirmed':
            # Outbound notification
            trigger_notification(
                title="✅ Contrat VIP Confirmé avec Succès",
                message=f"Votre contrat de location #{booking.booking_code} pour {trip.route.origin} → {trip.route.destination} le {trip.departure_time.strftime('%d/%m/%Y à %H:%M')} est confirmé. Réf: {booking.seat_number}.",
                type="success", category='passenger', role_target='client',
                user_id=passenger_user.id
            )
            
            # Send Outbound Email Ticket
            if passenger_user.email and passenger_user.email_notifications and '@lengue.tmp' not in passenger_user.email:
                try:
                    from app.utils.ticket_generator import generate_pdf_ticket
                    from app.utils.email_service import send_ticket_email
                    from app.models import TicketQRCode
                    
                    pdf_bytes, b64_qr = generate_pdf_ticket(booking)
                    qr_record = TicketQRCode(booking_id=booking.id, qr_data=b64_qr)
                    db.session.add(qr_record)
                    send_ticket_email(passenger_user, booking, pdf_bytes)
                    db.session.commit()
                except Exception as e:
                    db.session.rollback()
                    print(f"Error generating ticket/sending email for booking {booking.id}:", e)
            
            # Send Return Email Ticket
            if return_booking and passenger_user.email and passenger_user.email_notifications and '@lengue.tmp' not in passenger_user.email:
                try:
                    from app.utils.ticket_generator import generate_pdf_ticket
                    from app.utils.email_service import send_ticket_email
                    from app.models import TicketQRCode
                    
                    pdf_bytes_ret, b64_qr_ret = generate_pdf_ticket(return_booking)
                    qr_record_ret = TicketQRCode(booking_id=return_booking.id, qr_data=b64_qr_ret)
                    db.session.add(qr_record_ret)
                    send_ticket_email(passenger_user, return_booking, pdf_bytes_ret)
                    db.session.commit()
                except Exception as e:
                    db.session.rollback()
                    print(f"Error generating return ticket/sending email for booking {return_booking.id}:", e)
        
        flash(f'Réservation réussie pour {passenger_name} !', 'success')
        
        # Redirect back with receipt details to trigger print modal
        redirect_args = {
            'print_receipt': booking.booking_code,
            'passenger': passenger_name,
            'seat': booking.seat_number,
            'price': price_paid,
            'phone': passenger_phone or '',
            'category': passenger_category,
            'bags': bags_count,
            'luggage_charge': luggage_charge,
            'boarding_point': boarding_point or '',
            'boarding_time': boarding_time or '',
            'trip_type': trip_type,
            'payment_method': payment_method,
            'payment_status': payment_status,
            'bus_number': trip.bus.bus_number if trip.bus else 'TBA',
            'bus_type': trip.bus.model if trip.bus else 'Standard VIP',
            'departure_city': trip.route.origin,
            'destination_city': trip.route.destination,
            'travel_date': trip.departure_time.strftime('%d/%m/%Y'),
            'departure_time': trip.departure_time.strftime('%H:%M')
        }
        
        if return_booking:
            redirect_args.update({
                'return_print_receipt': return_booking.booking_code,
                'return_seat': return_booking.seat_number,
                'return_bus_number': return_trip.bus.bus_number if return_trip.bus else 'TBA',
                'return_bus_type': return_trip.bus.model if return_trip.bus else 'Standard VIP',
                'return_travel_date': return_trip.departure_time.strftime('%d/%m/%Y'),
                'return_departure_time': return_trip.departure_time.strftime('%H:%M')
            })
            
        return redirect(url_for('admin.teller_book', **redirect_args))

    # For the GET request, we just render the new layout (search happens via AJAX)
    today_str = datetime.now().strftime('%Y-%m-%d')
    return render_template('admin/teller_pos.html', today_str=today_str, caisse=caisse)

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
            Trip.departure_time <= datetime.utcnow(),
            Trip.arrival_time >= datetime.utcnow(),
            Trip.status != 'cancelled',
            Trip.is_deleted == False
        )
        
        # Upcoming trips (starting between start_dt and end_dt and > now)
        upcoming_trips_query = Trip.query.join(Route).filter(
            Route.agency_id == agency_id,
            Trip.departure_time.between(max(start_dt, datetime.utcnow()), end_dt),
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
        
        buses_active = Bus.query.filter_by(agency_id=agency_id, status='active', is_deleted=False).count()
        buses_maint = Bus.query.filter_by(agency_id=agency_id, status='maintenance', is_deleted=False).count()
        drivers_active = Driver.query.filter_by(agency_id=agency_id, status='on_trip', is_deleted=False).count()
    else:
        # Super admin (global)
        bookings_query = Booking.query.filter_by(is_deleted=False)
        
        trips_in_period = Trip.query.filter(
            Trip.departure_time.between(start_dt, end_dt),
            Trip.is_deleted == False
        )
        
        active_trips_query = Trip.query.filter(
            Trip.departure_time <= datetime.utcnow(),
            Trip.arrival_time >= datetime.utcnow(),
            Trip.status != 'cancelled',
            Trip.is_deleted == False
        )
        
        upcoming_trips_query = Trip.query.filter(
            Trip.departure_time.between(max(start_dt, datetime.utcnow()), end_dt),
            Trip.status != 'cancelled',
            Trip.is_deleted == False
        )
        
        cancelled_trips_query = Trip.query.filter(
            Trip.departure_time.between(start_dt, end_dt),
            Trip.status == 'cancelled',
            Trip.is_deleted == False
        )
        
        buses_active = Bus.query.filter_by(status='active', is_deleted=False).count()
        buses_maint = Bus.query.filter_by(status='maintenance', is_deleted=False).count()
        drivers_active = Driver.query.filter_by(status='on_trip', is_deleted=False).count()

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
        'new_customers': new_customers,
        'active_customers': active_customers,
        'repeat_customers': repeat_customers,
        'bookings_count': bookings_count,
        'pending_bookings': pending_bookings,
        'confirmed_bookings': confirmed_bookings,
        'cancelled_bookings': cancelled_bookings,
        'buses_active': buses_active,
        'buses_maint': buses_maint,
        'drivers_active': drivers_active
    }

@admin.route('/admin')
@admin.route('/admin/dashboard')
@login_required
@admin_required
def dashboard():
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
        
        # Recent audit logs for Live Operations Feed
        recent_audit_logs = AuditLog.query.order_by(AuditLog.created_at.desc()).limit(20).all()

        return render_template('admin/dashboard.html',
                             is_super=True,
                             total_agencies=total_agencies,
                             total_users=total_users,
                             total_buses=total_buses,
                             total_routes=total_routes,
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
                             recent_audit_logs=recent_audit_logs)
                             
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

        return render_template('admin/dashboard.html',
                             is_super=False,
                             agency=agency,
                             total_buses=total_buses,
                             total_routes=total_routes,
                             total_trips=total_trips,
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
                             stats_all=stats_all)


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

# === COMMON ADMIN: VIEW USERS ===
@admin.route('/admin/users')
@login_required
@admin_required
def users():
    if current_user.role == 'super_admin':
        users = User.query.filter_by(role='client', is_deleted=False).all()
    else:
        # Scoped view of users who booked with current admin's agency
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
                
        driver = Driver(
            name=name,
            phone=phone,
            license_number=license_number,
            license_expiration=license_expiration,
            agency_id=agency_id
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
            bus = Bus(
                bus_number=bus_number, 
                brand=brand, 
                model=model, 
                capacity=capacity,
                driver_name=driver_name,
                last_maintenance_date=last_maintenance_date,
                maintenance_notes=maintenance_notes,
                agency_id=int(agency_id)
            )
            db.session.add(bus)
            db.session.flush() # Populate bus ID to link the driver
            if driver_name:
                driver = Driver.query.filter_by(name=driver_name, agency_id=bus.agency_id, is_deleted=False).first()
                if driver:
                    driver.current_bus_id = bus.id
            db.session.commit()
            
            log_audit("BUS_CREATED", "Bus", bus.id, f"Registered bus: {bus.bus_number} under agency {bus.agency_id}")
            
            flash('Bus ajouté avec succès !', 'success')
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
        log_audit("BUS_EDITED", "Bus", bus.id, f"Modified bus specs: {bus.bus_number}")
        flash('Bus modifié avec succès !', 'success')
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
@admin.route('/admin/trips')
@login_required
@admin_required
def trips():
    if current_user.role == 'super_admin':
        trips = Trip.query.filter_by(is_deleted=False).all()
    else:
        trips = Trip.query.join(Route).filter(Route.agency_id == current_user.agency_id, Trip.is_deleted == False).all()
    return render_template('admin/trips.html', trips=trips)

@admin.route('/admin/add_trip', methods=['GET', 'POST'])
@login_required
@admin_required
def add_trip():
    if request.method == 'POST':
        route_id = request.form.get('route_id')
        bus_id = request.form.get('bus_id')
        departure_time = request.form.get('departure_time')
        arrival_time = request.form.get('arrival_time')
        price = request.form.get('price')
        
        if not all([route_id, bus_id, departure_time, arrival_time, price]):
            flash('Veuillez remplir tous les champs.', 'danger')
            return redirect(url_for('admin.add_trip'))
            
        try:
            dep_time = datetime.strptime(departure_time, '%Y-%m-%dT%H:%M')
            arr_time = datetime.strptime(arrival_time, '%Y-%m-%dT%H:%M')
            
            if dep_time < datetime.now():
                flash('La date de départ ne peut pas être dans le passé.', 'danger')
                return redirect(url_for('admin.add_trip'))
                
            if arr_time <= dep_time:
                flash('L\'heure d\'arrivée doit être postérieure à l\'heure de départ.', 'danger')
                return redirect(url_for('admin.add_trip'))
            
            # Get new fields
            booking_cutoff = request.form.get('booking_cutoff_minutes', 30, type=int)
            capacity_val = request.form.get('capacity', 0, type=int)
            driver_id_val = request.form.get('driver_id', type=int)
                
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
            db.session.commit()
            
            log_audit("TRIP_CREATED", "Trip", trip.id, f"Scheduled trip on route {trip.route_id} with bus {trip.bus_id}")
            
            # NOTIFICATION: Notify Super Admin if Agency Admin sets a custom price different from the Route's base price
            route = Route.query.get(trip.route_id)
            if current_user.role == 'admin_agence' and route and trip.price != route.base_price:
                trigger_notification(
                    title="⚠️ Tarif Modifié sur Voyage",
                    message=f"L'agence {current_user.agency.name} a planifié un voyage ({route.origin} → {route.destination}) au tarif de {trip.price:.0f} FCFA au lieu du tarif de base {route.base_price:.0f} FCFA.",
                    type="warning", category='operations', role_target='super_admin'
                )
            
            flash('Voyage (Trajet) planifié avec succès !', 'success')
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
        
    return render_template('admin/add_trip.html', routes=routes, buses=buses, drivers=drivers)

@admin.route('/admin/trip/edit/<int:id>', methods=['GET', 'POST'])
@login_required
@admin_required
def edit_trip(id):
    trip = Trip.query.filter_by(id=id, is_deleted=False).first_or_404()
    if current_user.role != 'super_admin' and trip.route.agency_id != current_user.agency_id:
        flash("Accès non autorisé.", 'danger')
        return redirect(url_for('admin.trips'))
        
    if request.method == 'POST':
        trip.route_id = int(request.form.get('route_id'))
        trip.bus_id = int(request.form.get('bus_id'))
        trip.departure_time = datetime.strptime(request.form.get('departure_time'), '%Y-%m-%dT%H:%M')
        trip.arrival_time = datetime.strptime(request.form.get('arrival_time'), '%Y-%m-%dT%H:%M')
        trip.price = float(request.form.get('price'))
        trip.status = request.form.get('status')
        
        db.session.commit()
        log_audit("TRIP_EDITED", "Trip", trip.id, f"Modified trip schedule: #{trip.id}")
        flash('Voyage modifié avec succès !', 'success')
        return redirect(url_for('admin.trips'))
        
    if current_user.role == 'super_admin':
        routes = Route.query.filter_by(is_deleted=False).all()
        buses = Bus.query.filter_by(status='active', is_deleted=False).all()
        drivers = Driver.query.filter_by(is_deleted=False).all()
    else:
        routes = Route.query.filter_by(agency_id=current_user.agency_id, is_deleted=False).all()
        buses = Bus.query.filter_by(agency_id=current_user.agency_id, status='active', is_deleted=False).all()
        drivers = Driver.query.filter_by(agency_id=current_user.agency_id, is_deleted=False).all()
        
    return render_template('admin/edit_trip.html', trip=trip, routes=routes, buses=buses, drivers=drivers)

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
    filter_val = request.args.get('filter', 'all')
    if current_user.role == 'super_admin':
        query = Booking.query.filter_by(is_deleted=False)
    else:
        trip_ids_query = db.session.query(Trip.id).join(Route).filter(Route.agency_id == current_user.agency_id, Trip.is_deleted == False)
        query = Booking.query.filter(Booking.trip_id.in_(trip_ids_query), Booking.is_deleted == False)

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

    bookings = query.order_by(Booking.booking_date.desc().nulls_last()).all()
    return render_template('admin/bookings.html', bookings=bookings, current_filter=filter_val)

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
    if current_user.role == 'super_admin':
        routes = Route.query.filter_by(is_deleted=False).order_by(Route.origin).all()
        buses = Bus.query.filter_by(is_deleted=False).order_by(Bus.bus_number).all()
        agencies = Agency.query.filter_by(is_deleted=False).all()
    else:
        routes = Route.query.filter_by(agency_id=current_user.agency_id, is_deleted=False).order_by(Route.origin).all()
        buses = Bus.query.filter_by(agency_id=current_user.agency_id, is_deleted=False).order_by(Bus.bus_number).all()
        agencies = []
    return render_template('admin/calendar.html', routes=routes, buses=buses, agencies=agencies)


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

    capacity = trip.capacity if trip.capacity > 0 else (trip.bus.capacity if trip.bus else 1)
    booked_seats = {b.seat_number: b.status for b in bookings if b.status in ['confirmed', 'locked']}

    booking_list = []
    for b in (confirmed + locked):
        booking_list.append({
            'id': b.id,
            'code': b.booking_code or f'LV-{b.id}',
            'passenger': b.passenger_name or (b.user.username if b.user else 'N/A'),
            'seat': b.seat_number,
            'status': b.status,
            'payment_status': b.payment_status,
            'price': b.price_paid,
            'date': b.booking_date.strftime('%d/%m/%Y %H:%M'),
            'phone': b.user.phone if b.user else '',
        })

    recurrence_info = None
    if trip.recurrence_rule and trip.recurrence_rule not in ('null', 'None'):
        try:
            recurrence_info = json.loads(trip.recurrence_rule)
        except Exception:
            db.session.rollback()
            pass

    total_booked = len(confirmed) + len(locked)
    fill_pct = min(100, int((total_booked / capacity) * 100)) if capacity > 0 else 0

    return jsonify({
        'id': trip.id,
        'origin': trip.route.origin,
        'destination': trip.route.destination,
        'agency': trip.route.agency.name if trip.route.agency else 'N/A',
        'bus': f"{trip.bus.brand or ''} {trip.bus.model} ({trip.bus.bus_number})" if trip.bus else 'N/A',
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
        'available': max(0, capacity - total_booked),
        'fill_pct': fill_pct,
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
    data = request.get_json()

    route_id = data.get('route_id')
    bus_id = data.get('bus_id')
    departure_str = data.get('departure_time')
    arrival_str = data.get('arrival_time')
    price = data.get('price')
    capacity = data.get('capacity', 0)
    recurrence = data.get('recurrence')

    if not all([route_id, bus_id, departure_str, arrival_str, price]):
        return jsonify({'error': 'Champs obligatoires manquants'}), 400

    try:
        departure_dt = datetime.strptime(departure_str, '%Y-%m-%dT%H:%M')
        arrival_dt = datetime.strptime(arrival_str, '%Y-%m-%dT%H:%M')
    except Exception:
        db.session.rollback()
        return jsonify({'error': 'Format de date invalide'}), 400

    if departure_dt >= arrival_dt:
        return jsonify({'error': "L'heure de départ doit être avant l'heure d'arrivée"}), 400

    route = Route.query.filter_by(id=route_id, is_deleted=False).first()
    if not route:
        return jsonify({'error': 'Ligne introuvable'}), 404
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
            'error': 'Conflit de bus détecté',
            'message': f"Bus déjà assigné: {conflict.route.origin} → {conflict.route.destination} ({conflict.departure_time.strftime('%d/%m %H:%M')}–{conflict.arrival_time.strftime('%H:%M')})"
        }), 409

    recurrence_json = None
    if recurrence and recurrence.get('type', 'none') != 'none':
        recurrence_json = json.dumps(recurrence)

    bus = Bus.query.get(bus_id)
    effective_capacity = int(capacity) if int(capacity) > 0 else (bus.capacity if bus else 40)

    trip = Trip(
        route_id=int(route_id),
        bus_id=int(bus_id),
        departure_time=departure_dt,
        arrival_time=arrival_dt,
        price=float(price),
        capacity=effective_capacity,
        recurrence_rule=recurrence_json,
        status='scheduled'
    )
    db.session.add(trip)
    db.session.flush()

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
    log_audit("TRIP_CREATED_CALENDAR", "Trip", trip.id,
              f"Créé via calendrier: #{trip.id}, {created_count} instances")

    return jsonify({'success': True, 'trip_id': trip.id, 'instances_created': created_count})


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
        departure_time=new_departure,
        arrival_time=new_arrival,
        price=trip.price,
        capacity=trip.capacity,
        status='scheduled'
    )
    db.session.add(new_trip)
    db.session.commit()

    log_audit("TRIP_DUPLICATED", "Trip", new_trip.id,
              f"Dupliqué depuis #{trip.id} vers {new_date_str}")
    return jsonify({'success': True, 'new_trip_id': new_trip.id})


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

@admin.route('/admin/shifts')
@login_required
@admin_required
def shifts():
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
        
    today = datetime.utcnow().date()
    
    # Active shift for current agency
    active_shift = None
    active_metrics = None
    if agency_id:
        active_shift = Shift.query.filter_by(agency_id=agency_id, date=today, status='open').first()
        if active_shift:
            active_metrics = aggregate_shift_metrics(agency_id, today)
    else:
        # Super admin global view - aggregate entire system info for today
        active_metrics = aggregate_shift_metrics(None, today)
            
    # Build filter query for historical list
    query = Shift.query
    if current_user.role == 'super_admin':
        if agency_id:
            query = query.filter(Shift.agency_id == agency_id)
    else:
        query = query.filter(Shift.agency_id == agency_id)
        
    status_param = request.args.get('status')
    if status_param:
        query = query.filter(Shift.status == status_param)
        
    date_param = request.args.get('date')
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
    
    years = [today.year - i for i in range(5)]
    
    return render_template(
        'admin/shifts.html',
        active_shift=active_shift,
        active_metrics=active_metrics,
        past_shifts=past_shifts,
        agencies=agencies,
        selected_agency=selected_agency,
        years=years,
        selected_status=status_param,
        selected_date=date_param,
        selected_month=month_param,
        selected_year=year_param
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
                    if bus.is_promo:
                        if bus.promo_price: car['promoPrice'] = bus.promo_price
                        if bus.regular_price: car['regularPrice'] = bus.regular_price
                        if bus.promo_badge: car['promoBadge'] = bus.promo_badge
                    break
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

    return render_template('admin/chats.html', chat_threads=chat_threads, active_chat=active_chat)

@admin.route('/admin/chats/<client_id>/send', methods=['POST'])
@login_required
@admin_required
def send_admin_chat_reply(client_id):
    import json as _json
    text = (request.form.get('text') or '').strip()
    if not text:
        if request.is_json or request.headers.get('X-Requested-With') == 'XMLHttpRequest':
            return jsonify({'error': 'Message vide'}), 400
        flash('Le message ne peut pas être vide.', 'danger')
        return redirect(url_for('admin.chats', client_id=client_id))

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
                'timestamp': now
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
                    'clientName': request.form.get('client_name') or 'Client VIP 3M',
                    'clientPhone': request.form.get('client_phone') or '',
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

    return redirect(url_for('admin.chats', client_id=client_id)) 
