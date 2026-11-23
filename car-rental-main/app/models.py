from datetime import datetime, timedelta
import json as _json
from werkzeug.security import generate_password_hash, check_password_hash
from flask_login import UserMixin
from app import db, login_manager

@login_manager.user_loader
def load_user(user_id):
    return User.query.get(int(user_id))

class Agency(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(100), unique=True, nullable=False)
    logo = db.Column(db.String(150), nullable=True)
    city = db.Column(db.String(100), nullable=False)
    address = db.Column(db.String(200), nullable=True)
    phone = db.Column(db.String(50), nullable=True)
    email = db.Column(db.String(100), nullable=True)
    
    # New Audit/Status Fields
    is_deleted = db.Column(db.Boolean, default=False)
    deleted_at = db.Column(db.DateTime, nullable=True)
    is_suspended = db.Column(db.Boolean, default=False)
    is_archived = db.Column(db.Boolean, default=False)
    
    # Relationships
    buses = db.relationship('Bus', backref='agency', lazy='dynamic', cascade="all, delete-orphan")
    routes = db.relationship('Route', backref='agency', lazy='dynamic', cascade="all, delete-orphan")
    users = db.relationship('User', backref='agency', lazy='dynamic')

    def __repr__(self):
        return f'<Agency {self.name}>'

class User(UserMixin, db.Model):
    id = db.Column(db.Integer, primary_key=True)
    username = db.Column(db.String(64), unique=True, nullable=False)
    email = db.Column(db.String(120), unique=True, nullable=False)
    password_hash = db.Column(db.Text, nullable=True) # Now nullable for Firebase users
    firebase_uid = db.Column(db.String(128), unique=True, nullable=True)
    auth0_id = db.Column(db.String(128), unique=True, nullable=True)
    role = db.Column(db.String(20), default='client', nullable=False) # 'super_admin', 'admin_agence', 'client', 'teller', 'driver', 'finance_officer'
    phone = db.Column(db.String(50), nullable=True)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    
    # Email Verification
    is_verified = db.Column(db.Boolean, default=False)
    verification_token_hash = db.Column(db.String(128), nullable=True)
    verification_token_expiry = db.Column(db.DateTime, nullable=True)
    # New client‑specific optional fields
    real_name = db.Column(db.String(120), nullable=True)
    first_name = db.Column(db.String(60), nullable=True)
    last_name = db.Column(db.String(60), nullable=True)
    date_of_birth = db.Column(db.Date, nullable=True)
    gender = db.Column(db.String(20), nullable=True)
    address = db.Column(db.String(200), nullable=True)
    city = db.Column(db.String(100), nullable=True)
    country = db.Column(db.String(100), nullable=True)
    profile_picture = db.Column(db.Text, nullable=True)  # base64 string or filename
    language = db.Column(db.String(10), default='en')
    momo_number = db.Column(db.String(50), nullable=True)
    orange_number = db.Column(db.String(50), nullable=True)
    preferred_payment_method = db.Column(db.String(30), nullable=True)
    loyalty_points = db.Column(db.Integer, default=0)
    two_fa_enabled = db.Column(db.Boolean, default=False)
    last_login_ip = db.Column(db.String(45), nullable=True)
    
    # Preferences
    sms_notifications = db.Column(db.Boolean, default=True)
    email_notifications = db.Column(db.Boolean, default=True)
    push_notifications = db.Column(db.Boolean, default=True)
    
    # Notification preferences
    pref_booking = db.Column(db.Boolean, default=True)
    pref_parcel = db.Column(db.Boolean, default=True)
    pref_financial = db.Column(db.Boolean, default=True)
    pref_shift = db.Column(db.Boolean, default=True)
    pref_system = db.Column(db.Boolean, default=True)
    pref_marketing = db.Column(db.Boolean, default=False)
    
    @property
    def avatar_url(self):
        from flask import url_for
        if not self.profile_picture:
            # Default avatars stored directly in static/ (not static/uploads/)
            if self.gender in ['Femme', 'Female', 'F']:
                return url_for('static', filename='default_female.png')
            return url_for('static', filename='default_male.png')
        # Base64 data URI — return as-is
        if self.profile_picture.startswith('data:'):
            return self.profile_picture
        # Legacy filename stored in uploads/
        return url_for('static', filename='uploads/' + self.profile_picture)

    
    # Emergency Contact
    emergency_contact_name = db.Column(db.String(100), nullable=True)
    emergency_contact_phone = db.Column(db.String(50), nullable=True)
    emergency_contact_relationship = db.Column(db.String(50), nullable=True)
    
    # Password Reset Fields
    reset_token_hash = db.Column(db.String(256), nullable=True)
    reset_token_expiry = db.Column(db.DateTime, nullable=True)
    
    def set_reset_token(self):
        import random
        from werkzeug.security import generate_password_hash
        from datetime import datetime, timedelta
        
        otp_code = str(random.randint(100000, 999999))
        self.reset_token_hash = generate_password_hash(otp_code, method='pbkdf2:sha256')
        self.reset_token_expiry = datetime.utcnow() + timedelta(minutes=15)
        # Return just the OTP code so it can be emailed
        return otp_code
        
    @classmethod
    def verify_reset_token(cls, token):
        from werkzeug.security import check_password_hash
        from datetime import datetime
        
        try:
            user_id_str, plain_token = token.split(':', 1)
            user_id = int(user_id_str)
        except ValueError:
            return None
            
        user = cls.query.get(user_id)
        if not user or not user.reset_token_hash or not user.reset_token_expiry:
            return None
            
        if datetime.utcnow() > user.reset_token_expiry:
            return None
            
        if check_password_hash(user.reset_token_hash, plain_token):
            return user
        return None
    
    # Verification Status
    verification_status = db.Column(db.String(30), default='Unverified')
    
    # New Audit/Status Fields
    is_deleted = db.Column(db.Boolean, default=False)
    deleted_at = db.Column(db.DateTime, nullable=True)
    is_suspended = db.Column(db.Boolean, default=False)
    is_archived = db.Column(db.Boolean, default=False)
    
    # Linked to Agency for agency administrators
    agency_id = db.Column(db.Integer, db.ForeignKey('agency.id'), nullable=True)
    
    # Relationships
    bookings = db.relationship('Booking', backref='user', lazy='dynamic')
    feedbacks = db.relationship('Feedback', backref='user', lazy='dynamic')

    # Compatibility properties for existing calls
    @property
    def is_admin(self):
        return self.role == 'super_admin'

    def __repr__(self):
        return f'<User {self.username} ({self.role})>'

    def set_password(self, password):
        self.password_hash = generate_password_hash(password, method='pbkdf2:sha256')

    def check_password(self, password):
        return check_password_hash(self.password_hash, password)

class DeviceLog(db.Model):
    __tablename__ = 'device_log'
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('user.id'), nullable=False)
    device_name = db.Column(db.String(120), nullable=False)
    ip_address = db.Column(db.String(45), nullable=True)
    last_seen = db.Column(db.DateTime, default=datetime.utcnow, nullable=False)

    user = db.relationship('User', backref=db.backref('device_logs', lazy='dynamic'))

    def __repr__(self):
        return f"<DeviceLog {self.device_name} for user {self.user_id}>"

class Driver(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(100), nullable=False)
    phone = db.Column(db.String(50), nullable=True)
    license_number = db.Column(db.String(100), unique=True, nullable=False)
    license_expiration = db.Column(db.Date, nullable=True)
    status = db.Column(db.String(20), default='available') # available, on_trip, off_duty
    rating = db.Column(db.Float, default=4.9)
    
    agency_id = db.Column(db.Integer, db.ForeignKey('agency.id'), nullable=False)
    current_bus_id = db.Column(db.Integer, db.ForeignKey('bus.id'), nullable=True)
    
    is_deleted = db.Column(db.Boolean, default=False)
    deleted_at = db.Column(db.DateTime, nullable=True)
    
    trips = db.relationship('Trip', backref='driver', lazy='dynamic')
    
    def __repr__(self):
        return f'<Driver {self.name}>'

class Bus(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    bus_number = db.Column(db.String(20), unique=True, nullable=False) # Plaque
    brand = db.Column(db.String(50), nullable=True) # Marque
    model = db.Column(db.String(50), nullable=False) # Modèle
    capacity = db.Column(db.Integer, nullable=False) # Capacité
    status = db.Column(db.String(20), default='active') # active, maintenance
    driver_name = db.Column(db.String(100), nullable=True) # Nom du chauffeur assigné
    last_maintenance_date = db.Column(db.DateTime, nullable=True)
    maintenance_notes = db.Column(db.Text, nullable=True)
    
    # New Audit/Status Fields
    is_deleted = db.Column(db.Boolean, default=False)
    deleted_at = db.Column(db.DateTime, nullable=True)
    is_archived = db.Column(db.Boolean, default=False)

    # Promo & Featured Offers Fields
    is_promo = db.Column(db.Boolean, default=False)
    promo_price = db.Column(db.Integer, nullable=True)
    promo_badge = db.Column(db.String(50), nullable=True)
    regular_price = db.Column(db.Integer, nullable=True)
    promo_description = db.Column(db.String(255), nullable=True)
    
    # Division & Release Information
    division = db.Column(db.String(50), default='LOCATION') # 'LOCATION' or '3MCONSULTING'
    release_date = db.Column(db.String(30), nullable=True) # Année / Date de mise en circulation
    
    # Belongs to an agency
    agency_id = db.Column(db.Integer, db.ForeignKey('agency.id'), nullable=False)
    
    # Relationships
    trips = db.relationship('Trip', backref='bus', lazy='dynamic', cascade="all, delete-orphan")

    def __repr__(self):
        return f'<Bus {self.bus_number} - {self.model}>'

class Apartment(db.Model):
    __tablename__ = 'apartment'
    id = db.Column(db.String(50), primary_key=True) # e.g. 'apt-01'
    title = db.Column(db.String(255), nullable=False)
    type = db.Column(db.String(100), nullable=False) # e.g. 'T3 Meublé Haut Standing'
    location = db.Column(db.String(255), nullable=False) # e.g. 'Tsinga (Face FECAFOOT), Yaoundé'
    rooms = db.Column(db.String(150), nullable=True) # e.g. '2 Chambres • 2 Salons • 2 Salles de bain'
    price = db.Column(db.String(100), nullable=False) # e.g. '65 000 FCFA / nuitée'
    photos_count = db.Column(db.Integer, default=4)
    image = db.Column(db.String(500), nullable=True)
    status = db.Column(db.String(50), default='Disponible') # 'Disponible', 'Occupé', 'Réservé', 'Maintenance'
    description = db.Column(db.Text, nullable=True)
    equipments_json = db.Column(db.Text, nullable=True)
    vip_services_json = db.Column(db.Text, nullable=True)
    agency_id = db.Column(db.Integer, db.ForeignKey('agency.id'), nullable=True)
    is_deleted = db.Column(db.Boolean, default=False)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

    @property
    def equipments(self):
        if not self.equipments_json:
            return []
        try:
            return _json.loads(self.equipments_json)
        except Exception:
            return [e.strip() for e in self.equipments_json.split(',') if e.strip()]

    @equipments.setter
    def equipments(self, val):
        if isinstance(val, list):
            self.equipments_json = _json.dumps(val, ensure_ascii=False)
        elif isinstance(val, str):
            self.equipments_json = val

    @property
    def vip_services(self):
        if not self.vip_services_json:
            return []
        try:
            return _json.loads(self.vip_services_json)
        except Exception:
            return [s.strip() for s in self.vip_services_json.split(',') if s.strip()]

    @vip_services.setter
    def vip_services(self, val):
        if isinstance(val, list):
            self.vip_services_json = _json.dumps(val, ensure_ascii=False)
        elif isinstance(val, str):
            self.vip_services_json = val

    def to_dict(self):
        return {
            "id": self.id,
            "title": self.title,
            "type": self.type,
            "location": self.location,
            "rooms": self.rooms,
            "price": self.price,
            "photosCount": self.photos_count,
            "image": self.image,
            "status": self.status,
            "description": self.description,
            "equipments": self.equipments,
            "vipServices": self.vip_services
        }

    def __repr__(self):
        return f'<Apartment {self.id} - {self.title}>'

class Route(db.Model): # Representing Lignes (lines)
    id = db.Column(db.Integer, primary_key=True)
    origin = db.Column(db.String(100), nullable=False) # Ville départ
    destination = db.Column(db.String(100), nullable=False) # Ville arrivée
    distance = db.Column(db.Float, nullable=True) # Distance in km
    duration = db.Column(db.String(50), nullable=True) # Durée estimée
    base_price = db.Column(db.Float, nullable=True) # Tarif de base (optionnel)
    stops = db.Column(db.Text, nullable=True) # Arrêts intermédiaires
    
    # New Audit/Status Fields
    is_deleted = db.Column(db.Boolean, default=False)
    deleted_at = db.Column(db.DateTime, nullable=True)
    is_archived = db.Column(db.Boolean, default=False)
    
    # Belongs to an agency
    agency_id = db.Column(db.Integer, db.ForeignKey('agency.id'), nullable=False)
    
    # Relationships
    trips = db.relationship('Trip', backref='route', lazy='dynamic', cascade="all, delete-orphan")

    def __repr__(self):
        return f'<Route {self.origin} to {self.destination}>'

class TripSchedule(db.Model):
    """Recurring trip template. The system materializes individual Trip rows from these."""
    __tablename__ = 'trip_schedule'
    id = db.Column(db.Integer, primary_key=True)
    route_id = db.Column(db.Integer, db.ForeignKey('route.id'), nullable=False)
    bus_id = db.Column(db.Integer, db.ForeignKey('bus.id'), nullable=False)
    driver_id = db.Column(db.Integer, db.ForeignKey('driver.id'), nullable=True)
    agency_id = db.Column(db.Integer, db.ForeignKey('agency.id'), nullable=False)
    
    departure_time_of_day = db.Column(db.String(5), nullable=False)  # "HH:MM" e.g. "14:00"
    duration_minutes = db.Column(db.Integer, nullable=False)  # e.g. 270 for 4h30
    price = db.Column(db.Float, nullable=False)
    capacity = db.Column(db.Integer, nullable=False, default=50)
    booking_cutoff_minutes = db.Column(db.Integer, nullable=False, default=30)
    
    recurrence_type = db.Column(db.String(20), nullable=False, default='daily')  # daily, weekly, specific_days
    recurrence_days = db.Column(db.Text, nullable=True)  # JSON array e.g. '["MON","WED","FRI"]'
    
    effective_from = db.Column(db.Date, nullable=False)
    effective_until = db.Column(db.Date, nullable=True)  # null = indefinite
    is_active = db.Column(db.Boolean, default=True)
    
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    
    # Relationships
    route = db.relationship('Route', backref=db.backref('schedules', lazy='dynamic'))
    bus = db.relationship('Bus', backref=db.backref('schedules', lazy='dynamic'))
    driver = db.relationship('Driver', backref=db.backref('schedules', lazy='dynamic'))
    agency = db.relationship('Agency', backref=db.backref('trip_schedules', lazy='dynamic'))
    trips = db.relationship('Trip', backref='schedule', lazy='dynamic')
    
    def get_recurrence_days_list(self):
        """Parse recurrence_days JSON into a Python list."""
        if not self.recurrence_days:
            return []
        try:
            return _json.loads(self.recurrence_days)
        except Exception:
            return []
    
    def set_recurrence_days_list(self, days_list):
        """Store a Python list as JSON."""
        self.recurrence_days = _json.dumps(days_list)
    
    @property
    def recurrence_display(self):
        """Human-readable recurrence description."""
        if self.recurrence_type == 'daily':
            return 'Tous les jours'
        elif self.recurrence_type == 'weekly':
            days = self.get_recurrence_days_list()
            day_names = {'MON': 'Lun', 'TUE': 'Mar', 'WED': 'Mer', 'THU': 'Jeu', 'FRI': 'Ven', 'SAT': 'Sam', 'SUN': 'Dim'}
            return 'Chaque ' + ', '.join(day_names.get(d, d) for d in days)
        elif self.recurrence_type == 'specific_days':
            days = self.get_recurrence_days_list()
            day_names = {'MON': 'Lun', 'TUE': 'Mar', 'WED': 'Mer', 'THU': 'Jeu', 'FRI': 'Ven', 'SAT': 'Sam', 'SUN': 'Dim'}
            return ', '.join(day_names.get(d, d) for d in days)
        return self.recurrence_type
    
    def __repr__(self):
        return f'<TripSchedule {self.id}: {self.departure_time_of_day} ({self.recurrence_type})>'


class Trip(db.Model): # Representing Trajets (scheduled trips)
    id = db.Column(db.Integer, primary_key=True)
    route_id = db.Column(db.Integer, db.ForeignKey('route.id'), nullable=False)
    bus_id = db.Column(db.Integer, db.ForeignKey('bus.id'), nullable=False)
    driver_id = db.Column(db.Integer, db.ForeignKey('driver.id'), nullable=True)
    departure_time = db.Column(db.DateTime, nullable=False)
    arrival_time = db.Column(db.DateTime, nullable=False)
    price = db.Column(db.Float, nullable=False)
    status = db.Column(db.String(20), default='scheduled') # scheduled, boarding, departed, delayed, arrived, cancelled, completed, archived
    # New fields for calendar management
    recurrence_rule = db.Column(db.String(255), nullable=True)  # iCal RRULE or custom JSON
    is_round_trip = db.Column(db.Boolean, default=False)
    parent_trip_id = db.Column(db.Integer, db.ForeignKey('trip.id'), nullable=True)
    capacity = db.Column(db.Integer, nullable=False, default=0)  # total seats for this trip (override bus capacity if needed)
    occupied_seats = db.Column(db.Integer, nullable=False, default=0)
    maintenance_window = db.Column(db.JSON, nullable=True)  # e.g., {"start": "2026-06-01", "end": "2026-06-02"}
    
    # Booking & scheduling fields
    booking_cutoff_minutes = db.Column(db.Integer, nullable=False, default=30)
    schedule_id = db.Column(db.Integer, db.ForeignKey('trip_schedule.id'), nullable=True)  # links generated trips to their schedule

    
    # New Audit/Status Fields
    is_deleted = db.Column(db.Boolean, default=False)
    deleted_at = db.Column(db.DateTime, nullable=True)
    is_archived = db.Column(db.Boolean, default=False)
    
    # Relationships
    bookings = db.relationship('Booking', backref='trip', lazy='dynamic', cascade="all, delete-orphan")
    feedbacks = db.relationship('Feedback', backref='trip', lazy='dynamic')

    @property
    def available_seats(self):
        """Calculate available seats from capacity and occupied count."""
        effective_capacity = self.capacity or (self.bus.capacity if self.bus else 0)
        return max(0, effective_capacity - self.occupied_seats)

    @property
    def booking_status(self):
        """Auto-calculated real-time booking status.
        Returns: BOOKING_OPEN, FULL, BOOKING_CLOSED, DEPARTED, CANCELLED
        """
        now = datetime.utcnow() + timedelta(hours=1)  # WAT (UTC+1) for Cameroon
        if self.status == 'cancelled':
            return 'CANCELLED'
        if now >= self.departure_time:
            return 'DEPARTED'
        cutoff_mins = self.booking_cutoff_minutes if self.booking_cutoff_minutes else 30
        cutoff = self.departure_time - timedelta(minutes=cutoff_mins)
        if now >= cutoff:
            return 'BOOKING_CLOSED'
        if self.available_seats <= 0:
            return 'FULL'
        return 'BOOKING_OPEN'

    @property
    def is_bookable(self):
        """Convenience: is this trip currently bookable?"""
        return self.booking_status == 'BOOKING_OPEN'

    @property
    def duration_display(self):
        """Human-readable trip duration e.g. '4h 30min'."""
        delta = self.arrival_time - self.departure_time
        total_seconds = delta.total_seconds()
        hours = int(total_seconds // 3600)
        minutes = int((total_seconds % 3600) // 60)
        if hours and minutes:
            return f"{hours}h {minutes:02d}min"
        elif hours:
            return f"{hours}h"
        else:
            return f"{minutes}min"

    def __repr__(self):
        return f'<Trip {self.id}: {self.departure_time.strftime("%d/%m %H:%M")}>'

class Booking(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('user.id'), nullable=False)
    trip_id = db.Column(db.Integer, db.ForeignKey('trip.id'), nullable=False)
    seat_number = db.Column(db.String(10), nullable=False) # Alphanumeric, e.g., "1A"
    boarding_status = db.Column(db.String(20), default='pending') # pending, checked-in, boarded, absent
    num_persons = db.Column(db.Integer, nullable=False, default=1)
    booking_date = db.Column(db.DateTime, default=datetime.utcnow)
    status = db.Column(db.String(20), default='locked') # confirmed, cancelled, locked
    locked_until = db.Column(db.DateTime, nullable=True) # For temporary 15 mins lock
    
    payment_status = db.Column(db.String(20), default='pending') # pending, paid, refunded
    payment_method = db.Column(db.String(50), nullable=True) # Visa, Mastercard, Mobile Money
    upi_reference = db.Column(db.String(64), nullable=True) # Transaction ID or Reference
    price_paid = db.Column(db.Float, default=0.0)
    refund_amount = db.Column(db.Float, default=0.0)
    
    # Custom ticket / passenger details filled by Teller
    passenger_category = db.Column(db.String(50), nullable=True, default='Adult')
    bags_count = db.Column(db.Integer, nullable=True, default=0)
    luggage_weight = db.Column(db.Float, nullable=True, default=0.0)
    luggage_charge = db.Column(db.Float, nullable=True, default=0.0)
    trip_type = db.Column(db.String(30), nullable=True, default='one_way')
    return_date = db.Column(db.DateTime, nullable=True)
    discount_applied = db.Column(db.Float, nullable=True, default=0.0)
    additional_charges = db.Column(db.Float, nullable=True, default=0.0)
    boarding_point = db.Column(db.String(100), nullable=True)
    boarding_time = db.Column(db.String(30), nullable=True)
    special_instructions = db.Column(db.String(255), nullable=True)
    
    passenger_name = db.Column(db.String(100), nullable=True)
    booking_code = db.Column(db.String(50), unique=True, nullable=True) # e.g. LV-2026-12345
    user_deleted = db.Column(db.Boolean, default=False)
    
    # New Audit/Status Fields
    is_deleted = db.Column(db.Boolean, default=False)
    deleted_at = db.Column(db.DateTime, nullable=True)
    is_archived = db.Column(db.Boolean, default=False)
    
    # Relationships
    payments = db.relationship('Payment', backref='booking', lazy='dynamic', cascade="all, delete-orphan")

    def __repr__(self):
        return f'<Booking {self.booking_code or self.id}>'

class Payment(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    booking_id = db.Column(db.Integer, db.ForeignKey('booking.id'), nullable=False)
    amount = db.Column(db.Float, nullable=False)
    status = db.Column(db.String(20), default='pending') # pending, completed, failed, refunded
    payment_method = db.Column(db.String(50), nullable=False)
    transaction_id = db.Column(db.String(100), nullable=True)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

    def __repr__(self):
        return f'<Payment {self.id}: {self.amount}>'

class Feedback(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('user.id'), nullable=True)
    trip_id = db.Column(db.Integer, db.ForeignKey('trip.id'), nullable=True)
    rating = db.Column(db.Integer, default=5) # Overall rating (1-5 stars)
    comfort_rating = db.Column(db.Integer, default=5)
    punctuality_rating = db.Column(db.Integer, default=5)
    message = db.Column(db.Text, nullable=False)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

    def __repr__(self):
        return f'<Feedback {self.id}>'

# === NEW: AUDIT TRACKING AND SYSTEM NOTIFICATIONS ===

class AuditLog(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('user.id'), nullable=True) # Actor
    action = db.Column(db.String(100), nullable=False) # e.g. "BUS_DELETED"
    target_type = db.Column(db.String(50), nullable=True) # e.g. "Bus"
    target_id = db.Column(db.Integer, nullable=True) # ID of the target resource
    details = db.Column(db.Text, nullable=True) # JSON details or string explanation
    ip_address = db.Column(db.String(50), nullable=True)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

    user = db.relationship('User', backref='audit_logs')

    def __repr__(self):
        return f'<AuditLog {self.action} by User {self.user_id} at {self.created_at}>'

class SystemNotification(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    title = db.Column(db.String(150), nullable=False)
    message = db.Column(db.Text, nullable=False)
    type = db.Column(db.String(20), default='info')  # info, success, warning, danger
    # Role-Based Category Taxonomy:
    # Super Admin:   financial | agency_mgmt | shift_admin | operations | security
    # Agency Admin:  booking | parcel | payment | wallet | shift | ops_agency
    # Client:        passenger | travel | parcel_client | refund
    # Shared:        system
    category = db.Column(db.String(50), default='system')
    # role_target: 'super_admin', 'admin_agence', 'client', or None (all admins)
    role_target = db.Column(db.String(30), nullable=True)
    is_read = db.Column(db.Boolean, default=False)
    is_archived = db.Column(db.Boolean, default=False)
    is_deleted = db.Column(db.Boolean, default=False)
    agency_id = db.Column(db.Integer, db.ForeignKey('agency.id'), nullable=True)
    user_id = db.Column(db.Integer, db.ForeignKey('user.id'), nullable=True)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

    def __repr__(self):
        return f'<SystemNotification {self.title} ({self.type})>'

class NotificationRead(db.Model):
    """Tracks which users have dismissed/read a shared notification (for non-user_id-scoped notifications)."""
    __tablename__ = 'notification_read'
    id = db.Column(db.Integer, primary_key=True)
    notification_id = db.Column(db.Integer, db.ForeignKey('system_notification.id'), nullable=False)
    user_id = db.Column(db.Integer, db.ForeignKey('user.id'), nullable=False)
    read_at = db.Column(db.DateTime, default=datetime.utcnow)
    __table_args__ = (db.UniqueConstraint('notification_id', 'user_id', name='_notif_user_uc'),)

    def __repr__(self):
        return f'<NotificationRead notif={self.notification_id} user={self.user_id}>'

class CaisseSession(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    agency_id = db.Column(db.Integer, db.ForeignKey('agency.id'), nullable=True) # Null for global/super admin caisse
    opened_by_id = db.Column(db.Integer, db.ForeignKey('user.id'), nullable=False)
    closed_by_id = db.Column(db.Integer, db.ForeignKey('user.id'), nullable=True)
    
    status = db.Column(db.String(20), default='open') # open, closed
    opened_at = db.Column(db.DateTime, default=datetime.utcnow)
    closed_at = db.Column(db.DateTime, nullable=True)
    
    # Financial tracking upon closing
    expected_cash = db.Column(db.Float, default=0.0)
    expected_momo = db.Column(db.Float, default=0.0)
    actual_cash = db.Column(db.Float, default=0.0)
    actual_momo = db.Column(db.Float, default=0.0)

    # Relationships
    agency = db.relationship('Agency', backref='caisse_sessions')
    opened_by = db.relationship('User', foreign_keys=[opened_by_id])
    closed_by = db.relationship('User', foreign_keys=[closed_by_id])

    def __repr__(self):
        return f'<CaisseSession {self.id} (Agency {self.agency_id}) - {self.status}>'

# === COMMUNICATION & PRIVACY MODULES ===

class EmailLog(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('user.id'), nullable=True)
    email = db.Column(db.String(120), nullable=False)
    subject = db.Column(db.String(200), nullable=False)
    status = db.Column(db.String(20), default='pending') # pending, sent, failed
    error_message = db.Column(db.Text, nullable=True)
    sent_at = db.Column(db.DateTime, nullable=True)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

    def __repr__(self):
        return f'<EmailLog {self.id} to {self.email} ({self.status})>'

class TicketQRCode(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    booking_id = db.Column(db.Integer, db.ForeignKey('booking.id'), nullable=False)
    qr_data = db.Column(db.Text, nullable=False) # Base64 or filepath
    generated_at = db.Column(db.DateTime, default=datetime.utcnow)
    
    booking = db.relationship('Booking', backref=db.backref('qr_codes', lazy='dynamic', cascade="all, delete-orphan"))

    def __repr__(self):
        return f'<TicketQRCode for Booking {self.booking_id}>'

class PrivacyAcceptance(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('user.id'), nullable=False)
    accepted = db.Column(db.Boolean, default=True)
    accepted_at = db.Column(db.DateTime, default=datetime.utcnow)
    ip_address = db.Column(db.String(50), nullable=True)
    user_agent = db.Column(db.String(255), nullable=True)

    user = db.relationship('User', backref=db.backref('privacy_records', lazy='dynamic', cascade="all, delete-orphan"))

    def __repr__(self):
        return f'<PrivacyAcceptance User {self.user_id}>'

class Shift(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    agency_id = db.Column(db.Integer, db.ForeignKey('agency.id'), nullable=True) # Null for global/super admin shift
    opened_by_id = db.Column(db.Integer, db.ForeignKey('user.id'), nullable=True) # Nullable for auto-opening
    closed_by_id = db.Column(db.Integer, db.ForeignKey('user.id'), nullable=True)
    reviewed_by_id = db.Column(db.Integer, db.ForeignKey('user.id'), nullable=True)
    
    date = db.Column(db.Date, nullable=False)
    status = db.Column(db.String(20), default='open') # open, closed, auto_closed, reviewed, reopened
    opened_at = db.Column(db.DateTime, default=datetime.utcnow)
    closed_at = db.Column(db.DateTime, nullable=True)
    
    # Live shift metrics & financial summary
    tickets_sold = db.Column(db.Integer, default=0)
    total_revenue = db.Column(db.Float, default=0.0)
    momo_revenue = db.Column(db.Float, default=0.0)
    orange_revenue = db.Column(db.Float, default=0.0)
    passenger_count = db.Column(db.Integer, default=0)
    cancelled_tickets = db.Column(db.Integer, default=0)
    
    tickets_count = db.Column(db.Integer, default=0)
    tickets_revenue = db.Column(db.Float, default=0.0)
    parcels_count = db.Column(db.Integer, default=0)
    parcels_revenue = db.Column(db.Float, default=0.0)
    refund_amount = db.Column(db.Float, default=0.0)
    commission_amount = db.Column(db.Float, default=0.0)
    agency_earnings = db.Column(db.Float, default=0.0)
    withdrawal_amount = db.Column(db.Float, default=0.0)
    
    summary_notes = db.Column(db.Text, nullable=True)

    # Relationships
    agency = db.relationship('Agency', backref='shifts')
    opened_by = db.relationship('User', foreign_keys=[opened_by_id])
    closed_by = db.relationship('User', foreign_keys=[closed_by_id])
    reviewed_by = db.relationship('User', foreign_keys=[reviewed_by_id])

    def __repr__(self):
        return f'<Shift {self.id} (Agency {self.agency_id}) - {self.status}>'

class Parcel(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    agency_id = db.Column(db.Integer, db.ForeignKey('agency.id'), nullable=False)
    user_id = db.Column(db.Integer, db.ForeignKey('user.id'), nullable=True) # Client who booked
    trip_id = db.Column(db.Integer, db.ForeignKey('trip.id'), nullable=True) # Assigned trip
    
    sender_name = db.Column(db.String(100), nullable=False)
    sender_phone = db.Column(db.String(50), nullable=True)
    sender_email = db.Column(db.String(100), nullable=True)
    
    receiver_name = db.Column(db.String(100), nullable=False)
    receiver_phone = db.Column(db.String(50), nullable=False)
    receiver_address = db.Column(db.String(255), nullable=True)
    receiver_city = db.Column(db.String(100), nullable=False)
    
    parcel_type = db.Column(db.String(50), nullable=False, default='Other') # Document, Electronics, Clothes, Food, Fragile, Other
    description = db.Column(db.Text, nullable=False)
    weight = db.Column(db.Float, default=1.0)
    num_items = db.Column(db.Integer, default=1)
    is_fragile = db.Column(db.Boolean, default=False)
    has_insurance = db.Column(db.Boolean, default=False)
    
    front_image = db.Column(db.String(255), nullable=True)
    side_image = db.Column(db.String(255), nullable=True)
    label_image = db.Column(db.String(255), nullable=True)
    
    price = db.Column(db.Float, default=0.0)
    payment_method = db.Column(db.String(50), default='momo') # momo, orange
    payment_status = db.Column(db.String(20), default='pending') # pending, paid
    status = db.Column(db.String(20), default='pending') # pending, assigned, sent, delivered, cancelled
    tracking_number = db.Column(db.String(64), unique=True, nullable=True)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

    # Cargo / Logistics additions
    otp_code = db.Column(db.String(10), nullable=True)
    rejection_reason = db.Column(db.Text, nullable=True)
    receiver_id_type = db.Column(db.String(50), nullable=True)
    receiver_id_number = db.Column(db.String(100), nullable=True)
    dispute_notes = db.Column(db.Text, nullable=True)

    # Relationships
    agency = db.relationship('Agency', backref='parcels')
    user = db.relationship('User', backref='parcels')
    trip = db.relationship('Trip', backref='parcels')

    def __repr__(self):
        return f'<Parcel {self.id} (Tracking {self.tracking_number}) - {self.price} FCFA>'

class Incident(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    case_number = db.Column(db.String(50), unique=True, nullable=False)
    parcel_id = db.Column(db.Integer, db.ForeignKey('parcel.id'), nullable=False)
    trip_id = db.Column(db.Integer, db.ForeignKey('trip.id'), nullable=False)
    agency_id = db.Column(db.Integer, db.ForeignKey('agency.id'), nullable=False)
    
    type = db.Column(db.String(50), nullable=False) # Lost Parcel, Damaged Parcel, Delayed Parcel, Wrong Receiver, Customer Complaint
    description = db.Column(db.Text, nullable=False)
    photo = db.Column(db.Text, nullable=True) # base64 package photo data URL
    receipt_photo = db.Column(db.Text, nullable=True) # base64 receipt/ticket/proof photo data URL
    
    status = db.Column(db.String(20), default='Open', nullable=False) # Open, In Progress, Resolved
    assigned_to = db.Column(db.String(100), nullable=True)
    
    resolution = db.Column(db.String(100), nullable=True)
    notes = db.Column(db.Text, nullable=True) # concatenated investigation notes
    
    created_at = db.Column(db.DateTime, default=datetime.utcnow, nullable=False)
    resolved_at = db.Column(db.DateTime, nullable=True)

    # Relationships
    parcel = db.relationship('Parcel', backref='incidents')
    trip = db.relationship('Trip', backref='incidents')
    agency = db.relationship('Agency', backref='incidents')

    def __repr__(self):
        return f'<Incident {self.case_number} - {self.type} ({self.status})>'

class Withdrawal(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    agency_id = db.Column(db.Integer, db.ForeignKey('agency.id'), nullable=False)
    amount = db.Column(db.Float, nullable=False)
    status = db.Column(db.String(20), default='pending') # pending, approved, rejected
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

    # Relationships
    agency = db.relationship('Agency', backref='withdrawals')

    def __repr__(self):
        return f'<Withdrawal {self.id} (Agency {self.agency_id}) - {self.amount} FCFA>'


class EmailOTP(db.Model):
    __tablename__ = 'email_otp'
    
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('user.id', ondelete='CASCADE'), nullable=False)
    purpose = db.Column(db.String(50), nullable=False)  # 'email_verification', 'password_reset', 'login'
    otp_hash = db.Column(db.String(256), nullable=False)
    created_at = db.Column(db.DateTime, default=datetime.utcnow, nullable=False)
    expires_at = db.Column(db.DateTime, nullable=False)
    verified_at = db.Column(db.DateTime, nullable=True)
    attempt_count = db.Column(db.Integer, default=0, nullable=False)
    is_active = db.Column(db.Boolean, default=True, nullable=False)

    # Relationship to user
    user = db.relationship('User', backref=db.backref('otps', lazy='dynamic', cascade='all, delete-orphan'))

    __table_args__ = (
        db.Index('idx_otp_user_active', 'user_id', 'is_active'),
        db.Index('idx_otp_created_at', 'created_at'),
    )

    def __repr__(self):
        return f'<EmailOTP {self.id} (User {self.user_id}) - {self.purpose} - Active: {self.is_active}>'
class ContactMessage(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(100), nullable=False)
    email = db.Column(db.String(120), nullable=False)
    message = db.Column(db.Text, nullable=False)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    is_read = db.Column(db.Boolean, default=False)
    is_deleted = db.Column(db.Boolean, default=False)

    def __repr__(self):
        return f'<ContactMessage {self.name} - {self.email}>'
