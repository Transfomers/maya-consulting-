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

    # Identité client permanente (module Clients / Conversations)
    client_code = db.Column(db.String(20), unique=True, index=True, nullable=True)   # CLI-000001, jamais modifié
    display_name = db.Column(db.String(120), nullable=True)
    client_source = db.Column(db.String(30), nullable=True)        # web_chat, contact_form, booking, apartment_booking…
    external_account = db.Column(db.String(60), index=True, nullable=True)  # n° de compte du site (3M-CLI-…)
    assigned_admin_id = db.Column(db.Integer, index=True, nullable=True)
    client_status = db.Column(db.String(20), nullable=True)        # active, vip, blocked, archived
    phone_key = db.Column(db.String(12), index=True, nullable=True)  # 9 derniers chiffres : détection des doublons
    last_seen_at = db.Column(db.DateTime, nullable=True)

    # Compte (staff et clients) : statut, modules attribués, verrouillage après échecs de connexion
    account_status = db.Column(db.String(20), nullable=True)     # invited, deactivated (suspension : is_suspended)
    status_reason = db.Column(db.String(255), nullable=True)
    admin_modules = db.Column(db.Text, nullable=True)            # JSON : modules opérationnels attribués
    locked_until = db.Column(db.DateTime, nullable=True)
    password_set_at = db.Column(db.DateTime, nullable=True)
    invited_by_id = db.Column(db.Integer, nullable=True)

    @property
    def is_active(self):
        """Flask-Login : un compte suspendu, désactivé ou supprimé ne peut pas se connecter."""
        return not self.is_suspended and not self.is_deleted and self.account_status != 'deactivated'

    @property
    def status_key(self):
        if self.is_deleted or self.account_status == 'deactivated':
            return 'deactivated'
        if self.is_suspended:
            return 'suspended'
        if self.account_status == 'invited' and not self.password_set_at:
            return 'invited'
        return 'active'

    @property
    def is_staff(self):
        from app.services.permissions import is_staff_role
        return is_staff_role(self.role)

    @property
    def is_agency_scoped(self):
        """Membre du staff limité à son agence (tout le monde sauf le Super Admin)."""
        return self.role != 'super_admin' and self.is_staff

    @property
    def modules(self):
        try:
            return _json.loads(self.admin_modules or '[]')
        except ValueError:
            return []
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
    language = db.Column(db.String(10), default='fr')
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
    is_test = db.Column(db.Boolean, default=False, nullable=True)  # donnée de démonstration / test : exclue des indicateurs
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
    
    trips = db.relationship('Trip', foreign_keys='Trip.driver_id', backref='driver', lazy='dynamic')
    current_bus = db.relationship('Bus', foreign_keys=[current_bus_id])

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
    reference = db.Column(db.String(40), nullable=True) # e.g. '3M-APT-001'
    title = db.Column(db.String(255), nullable=False)
    type = db.Column(db.String(100), nullable=False) # combined label e.g. 'T3 • Haut Standing'
    property_type = db.Column(db.String(50), default='T3') # Studio, T2, T3, T4, Villa, Penthouse, Autre
    standing = db.Column(db.String(50), default='Haut Standing') # Standard, Confort, Haut Standing, Prestige, Luxe
    location = db.Column(db.String(255), nullable=False) # e.g. 'Tsinga (Face FECAFOOT), Yaoundé'
    city = db.Column(db.String(100), default='Yaoundé')
    neighborhood = db.Column(db.String(120), default='Tsinga')
    exact_address = db.Column(db.String(255), nullable=True)
    landmark = db.Column(db.String(200), nullable=True)
    access_instructions = db.Column(db.Text, nullable=True)
    gps_coordinates = db.Column(db.String(100), nullable=True)

    # Configuration du logement
    rooms = db.Column(db.String(150), nullable=True) # summary string
    bedrooms_count = db.Column(db.Integer, default=2)
    living_rooms_count = db.Column(db.Integer, default=1)
    bathrooms_count = db.Column(db.Integer, default=2)
    kitchens_count = db.Column(db.Integer, default=1)
    balconies_count = db.Column(db.Integer, default=1)
    max_guests = db.Column(db.Integer, default=4)
    bedding_details = db.Column(db.String(200), default='2 Lits King Size')
    surface_sqm = db.Column(db.Float, nullable=True)

    # Tarification & conditions
    price = db.Column(db.String(100), nullable=False) # display string e.g. '65 000 FCFA / nuitée'
    nightly_rate = db.Column(db.Float, default=65000.0)
    weekly_rate = db.Column(db.Float, nullable=True)
    monthly_rate = db.Column(db.Float, nullable=True)
    security_deposit = db.Column(db.Float, default=100000.0)
    cleaning_fee = db.Column(db.Float, default=0.0)
    min_stay_nights = db.Column(db.Integer, default=1)
    payment_terms = db.Column(db.String(200), default='50% acompte à la réservation, solde à la remise des clés')
    long_stay_discount = db.Column(db.String(120), nullable=True)

    # Médias, statut & publication
    photos_count = db.Column(db.Integer, default=4)
    image = db.Column(db.String(500), nullable=True)
    status = db.Column(db.String(50), default='Disponible') # 'Disponible', 'Occupé', 'Réservé', 'En maintenance', 'Non publié'
    short_description = db.Column(db.String(320), nullable=True)
    description = db.Column(db.Text, nullable=True)
    equipments_json = db.Column(db.Text, nullable=True)
    vip_services_json = db.Column(db.Text, nullable=True)
    is_published = db.Column(db.Boolean, default=True)
    is_featured = db.Column(db.Boolean, default=False)
    manager_name = db.Column(db.String(120), default='Conciergerie 3M SERVICES')
    internal_notes = db.Column(db.Text, nullable=True)
    available_from = db.Column(db.Date, nullable=True)

    agency_id = db.Column(db.Integer, db.ForeignKey('agency.id'), nullable=True)
    is_deleted = db.Column(db.Boolean, default=False)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

    photos = db.relationship('ApartmentPhoto', backref='apartment', lazy='dynamic', cascade="all, delete-orphan")
    stays = db.relationship('ApartmentBooking', backref='apartment', lazy='dynamic', cascade="all, delete-orphan")

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

    def ordered_photos(self):
        try:
            return self.photos.order_by(ApartmentPhoto.is_cover.desc(), ApartmentPhoto.sort_order.asc(), ApartmentPhoto.id.asc()).all()
        except Exception:
            return []

    def active_booked_ranges(self):
        try:
            today = datetime.utcnow().date()
            rows = self.stays.filter(
                ApartmentBooking.status.in_(['confirmed', 'checked_in']),
                ApartmentBooking.check_out >= today
            ).order_by(ApartmentBooking.check_in.asc()).all()
            return [
                {
                    "id": b.id,
                    "ref": b.booking_ref,
                    "checkIn": b.check_in.isoformat(),
                    "checkOut": b.check_out.isoformat(),
                    "status": b.status,
                }
                for b in rows
            ]
        except Exception:
            return []

    def to_dict(self):
        gallery_items = [p.to_dict() for p in self.ordered_photos()]
        cover_url = next((g["url"] for g in gallery_items if g.get("isCover")), None) or (gallery_items[0]["url"] if gallery_items else self.image)
        return {
            "id": self.id,
            "reference": self.reference or f"3M-{self.id.upper()}",
            "title": self.title,
            "type": self.type,
            "propertyType": self.property_type or "T3",
            "standing": self.standing or "Haut Standing",
            "location": self.location,
            "city": self.city or "Yaoundé",
            "neighborhood": self.neighborhood or "",
            "exactAddress": self.exact_address or "",
            "landmark": self.landmark or "",
            "gpsCoordinates": self.gps_coordinates or "",
            "rooms": self.rooms,
            "bedrooms": self.bedrooms_count if self.bedrooms_count is not None else 2,
            "livingRooms": self.living_rooms_count if self.living_rooms_count is not None else 1,
            "bathrooms": self.bathrooms_count if self.bathrooms_count is not None else 2,
            "kitchens": self.kitchens_count if self.kitchens_count is not None else 1,
            "balconies": self.balconies_count if self.balconies_count is not None else 1,
            "maxGuests": self.max_guests or 4,
            "beddingDetails": self.bedding_details or "",
            "surfaceSqm": self.surface_sqm,
            "price": self.price,
            "nightlyRate": self.nightly_rate,
            "weeklyRate": self.weekly_rate,
            "monthlyRate": self.monthly_rate,
            "securityDeposit": self.security_deposit,
            "cleaningFee": self.cleaning_fee,
            "minStayNights": self.min_stay_nights or 1,
            "paymentTerms": self.payment_terms or "",
            "longStayDiscount": self.long_stay_discount or "",
            "photosCount": len(gallery_items) if gallery_items else (self.photos_count or 1),
            "image": cover_url,
            "gallery": gallery_items,
            "status": self.status,
            "shortDescription": self.short_description or "",
            "description": self.description,
            "equipments": self.equipments,
            "vipServices": self.vip_services,
            "isPublished": bool(self.is_published) if self.is_published is not None else True,
            "isFeatured": bool(self.is_featured),
            "managerName": self.manager_name or "Conciergerie 3M SERVICES",
            "availableFrom": self.available_from.isoformat() if self.available_from else None,
            "bookedDates": self.active_booked_ranges(),
        }

    def __repr__(self):
        return f'<Apartment {self.id} - {self.title}>'


class ApartmentPhoto(db.Model):
    """Persistent multi-photo gallery record for furnished properties."""
    __tablename__ = 'apartment_photo'
    id = db.Column(db.Integer, primary_key=True)
    apartment_id = db.Column(db.String(50), db.ForeignKey('apartment.id'), nullable=False)
    url = db.Column(db.String(500), nullable=False)
    filename = db.Column(db.String(255), nullable=True)
    room_category = db.Column(db.String(80), default='Vue principale') # Salon, Chambre, Cuisine, Salle de bain, Balcon, Façade
    caption = db.Column(db.String(200), nullable=True)
    sort_order = db.Column(db.Integer, default=0)
    is_cover = db.Column(db.Boolean, default=False)
    file_size = db.Column(db.Integer, nullable=True)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

    def to_dict(self):
        return {
            "id": self.id,
            "url": self.url,
            "filename": self.filename or "",
            "category": self.room_category or "Vue principale",
            "caption": self.caption or "",
            "order": self.sort_order or 0,
            "isCover": bool(self.is_cover),
        }


class ApartmentBooking(db.Model):
    """Dedicated availability & reservation schedule for furnished properties (separate from vehicles)."""
    __tablename__ = 'apartment_booking'
    id = db.Column(db.Integer, primary_key=True)
    booking_ref = db.Column(db.String(40), unique=True, nullable=False)
    apartment_id = db.Column(db.String(50), db.ForeignKey('apartment.id'), nullable=False)
    user_id = db.Column(db.Integer, db.ForeignKey('user.id'), nullable=True)
    guest_name = db.Column(db.String(140), nullable=False)
    guest_phone = db.Column(db.String(60), nullable=False)
    guest_email = db.Column(db.String(120), nullable=True)
    check_in = db.Column(db.Date, nullable=False)
    check_out = db.Column(db.Date, nullable=False)
    guests_count = db.Column(db.Integer, default=2)
    rate_formula = db.Column(db.String(30), default='nightly') # nightly, weekly, monthly
    total_amount = db.Column(db.Float, default=0.0)
    deposit_paid = db.Column(db.Float, default=0.0)
    security_deposit = db.Column(db.Float, default=0.0)
    payment_method = db.Column(db.String(40), default='momo')
    payment_status = db.Column(db.String(30), default='pending') # pending, partial, paid
    status = db.Column(db.String(30), default='confirmed') # confirmed, checked_in, checked_out, cancelled, maintenance_block
    notes = db.Column(db.Text, nullable=True)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    is_test = db.Column(db.Boolean, default=False, nullable=True)  # donnée de démonstration / test : exclue des indicateurs

    def __repr__(self):
        return f'<ApartmentBooking {self.booking_ref}: {self.apartment_id} ({self.check_in} -> {self.check_out})>'

class Route(db.Model): # Representing Lignes (lines)
    id = db.Column(db.Integer, primary_key=True)
    origin = db.Column(db.String(100), nullable=False) # Ville départ
    destination = db.Column(db.String(100), nullable=False) # Ville arrivée
    distance = db.Column(db.Float, nullable=True) # Distance in km
    duration = db.Column(db.String(50), nullable=True) # Durée estimée
    base_price = db.Column(db.Float, nullable=True) # Tarif de base (optionnel)
    stops = db.Column(db.Text, nullable=True) # Arrêts intermédiaires
    route_instructions = db.Column(db.Text, nullable=True) # Consignes d'itinéraire VIP
    
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

    # ── Fleet Mission Management System (VIP Operations) ──
    mission_ref = db.Column(db.String(40), nullable=True)
    mission_title = db.Column(db.String(160), nullable=True)
    mission_type = db.Column(db.String(30), default='vip_rental')  # one_way, round_trip, hourly, daily, multi_day, vip_rental
    mission_category = db.Column(db.String(50), default='custom')  # airport_transfer, intercity, city_transport, chauffeur_disposal, vip_delegation, corporate, event, long_distance, multi_day, custom
    service_category = db.Column(db.String(30), default='VIP')  # VIP, Premium, Standard, Delegation
    source_booking_id = db.Column(db.Integer, nullable=True)  # Link to existing customer reservation when converted
    pickup_location = db.Column(db.String(200), nullable=True)
    destination_location = db.Column(db.String(200), nullable=True)
    intermediate_stops = db.Column(db.Text, nullable=True)
    route_instructions = db.Column(db.Text, nullable=True)
    passenger_count = db.Column(db.Integer, default=1)
    luggage_info = db.Column(db.String(160), nullable=True)
    special_instructions = db.Column(db.Text, nullable=True)
    internal_notes = db.Column(db.Text, nullable=True)
    vip_protocol = db.Column(db.String(200), nullable=True)
    contact_person = db.Column(db.String(160), nullable=True)

    # Multi-vehicle & Multi-Driver Convoys
    extra_vehicle_ids_json = db.Column(db.Text, nullable=True)
    secondary_driver_id = db.Column(db.Integer, db.ForeignKey('driver.id'), nullable=True)
    extra_driver_ids_json = db.Column(db.Text, nullable=True)
    driver_assignment_status = db.Column(db.String(30), default='assigned')  # pending, assigned, accepted, declined, completed
    driver_instructions = db.Column(db.Text, nullable=True)
    driver_allowance = db.Column(db.Float, default=0.0)
    driver_feedback = db.Column(db.Text, nullable=True)

    # Package & Frozen Pricing Engine (Customer Pricing separate from Internal Cost)
    package_id = db.Column(db.Integer, db.ForeignKey('mission_package.id'), nullable=True)
    base_price = db.Column(db.Float, default=0.0)
    distance_charge = db.Column(db.Float, default=0.0)
    duration_charge = db.Column(db.Float, default=0.0)
    waiting_charge = db.Column(db.Float, default=0.0)
    fuel_surcharge = db.Column(db.Float, default=0.0)
    toll_parking_charge = db.Column(db.Float, default=0.0)
    stops_charge = db.Column(db.Float, default=0.0)
    extras_price = db.Column(db.Float, default=0.0)
    additional_charges = db.Column(db.Float, default=0.0)
    discount_amount = db.Column(db.Float, default=0.0)
    tax_amount = db.Column(db.Float, default=0.0)
    customer_deposit = db.Column(db.Float, default=0.0)
    price_snapshot_json = db.Column(db.Text, nullable=True)

    # Execution, Pre-Departure Checklist, Telemetry, Mileage & Condition
    pre_departure_checklist_json = db.Column(db.Text, nullable=True)
    handover_photos_json = db.Column(db.Text, nullable=True)
    mileage_start = db.Column(db.Integer, nullable=True)
    mileage_end = db.Column(db.Integer, nullable=True)
    fuel_start = db.Column(db.String(30), nullable=True)
    fuel_end = db.Column(db.String(30), nullable=True)
    vehicle_condition = db.Column(db.Text, nullable=True)
    actual_departure = db.Column(db.DateTime, nullable=True)
    actual_arrival = db.Column(db.DateTime, nullable=True)
    delay_reason = db.Column(db.String(255), nullable=True)
    cancellation_reason = db.Column(db.String(255), nullable=True)
    completion_notes = db.Column(db.Text, nullable=True)

    # New Audit/Status Fields
    is_deleted = db.Column(db.Boolean, default=False)
    is_test = db.Column(db.Boolean, default=False, nullable=True)  # donnée de démonstration / test : exclue des indicateurs
    deleted_at = db.Column(db.DateTime, nullable=True)
    is_archived = db.Column(db.Boolean, default=False)
    
    # Relationships
    bookings = db.relationship('Booking', backref='trip', lazy='dynamic', cascade="all, delete-orphan")
    feedbacks = db.relationship('Feedback', backref='trip', lazy='dynamic')
    secondary_driver = db.relationship('Driver', foreign_keys=[secondary_driver_id])
    package = db.relationship('MissionPackage', foreign_keys=[package_id])
    expenses = db.relationship('MissionExpense', backref='trip', lazy='dynamic', cascade="all, delete-orphan")
    mission_incidents = db.relationship('MissionIncident', backref='trip', lazy='dynamic', cascade="all, delete-orphan")

    @property
    def extra_vehicle_ids(self):
        if not self.extra_vehicle_ids_json:
            return []
        try:
            return [int(x) for x in _json.loads(self.extra_vehicle_ids_json) if str(x).isdigit()]
        except Exception:
            return []

    @extra_vehicle_ids.setter
    def extra_vehicle_ids(self, val):
        if isinstance(val, list):
            self.extra_vehicle_ids_json = _json.dumps([int(x) for x in val if str(x).isdigit()])
        else:
            self.extra_vehicle_ids_json = None

    @property
    def extra_driver_ids(self):
        if not self.extra_driver_ids_json:
            return []
        try:
            return [int(x) for x in _json.loads(self.extra_driver_ids_json) if str(x).isdigit()]
        except Exception:
            return []

    @extra_driver_ids.setter
    def extra_driver_ids(self, val):
        if isinstance(val, list):
            self.extra_driver_ids_json = _json.dumps([int(x) for x in val if str(x).isdigit()])
        else:
            self.extra_driver_ids_json = None

    @property
    def pre_departure_checklist(self):
        defaults = {
            'vehicle_inspected': False,
            'fuel_checked': False,
            'mileage_logged': False,
            'photos_taken': False,
            'driver_confirmed': False,
            'passenger_confirmed': False,
            'documents_ready': False,
            'departure_authorized': False,
        }
        if not self.pre_departure_checklist_json:
            return defaults
        try:
            parsed = _json.loads(self.pre_departure_checklist_json)
            if isinstance(parsed, dict):
                defaults.update(parsed)
        except Exception:
            pass
        return defaults

    @pre_departure_checklist.setter
    def pre_departure_checklist(self, val):
        if isinstance(val, dict):
            self.pre_departure_checklist_json = _json.dumps(val, ensure_ascii=False)
        else:
            self.pre_departure_checklist_json = None

    @property
    def handover_photos(self):
        if not self.handover_photos_json:
            return []
        try:
            parsed = _json.loads(self.handover_photos_json)
            return parsed if isinstance(parsed, list) else []
        except Exception:
            return []

    @handover_photos.setter
    def handover_photos(self, val):
        if isinstance(val, list):
            self.handover_photos_json = _json.dumps(val, ensure_ascii=False)
        else:
            self.handover_photos_json = None

    @property
    def mileage_distance(self):
        if self.mileage_start is not None and self.mileage_end is not None and self.mileage_end >= self.mileage_start:
            return int(self.mileage_end - self.mileage_start)
        return None

    @property
    def total_expenses_amount(self):
        return sum((e.amount or 0.0) for e in self.expenses.all())

    @property
    def mission_margin(self):
        return float(self.price or 0.0) - float(self.total_expenses_amount or 0.0)

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
    is_test = db.Column(db.Boolean, default=False, nullable=True)  # donnée de démonstration / test : exclue des indicateurs
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

class ExperienceRating(db.Model):
    """Note globale de l'expérience 3M SERVICES laissée par un client depuis son espace (une par compte)."""
    __tablename__ = 'experience_rating'
    id = db.Column(db.Integer, primary_key=True)
    account_number = db.Column(db.String(60), nullable=False, unique=True, index=True)
    user_id = db.Column(db.Integer, db.ForeignKey('user.id'), nullable=True)
    client_name = db.Column(db.String(120), nullable=False)
    client_phone = db.Column(db.String(40), nullable=True)
    client_email = db.Column(db.String(120), nullable=True)
    rating = db.Column(db.Integer, nullable=False)                 # 1 à 5
    comment = db.Column(db.Text, nullable=True)
    status = db.Column(db.String(20), nullable=False, default='new')   # new, in_progress, resolved
    admin_reply = db.Column(db.Text, nullable=True)
    replied_at = db.Column(db.DateTime, nullable=True)
    replied_by_id = db.Column(db.Integer, db.ForeignKey('user.id'), nullable=True)
    resolved_at = db.Column(db.DateTime, nullable=True)
    is_hidden = db.Column(db.Boolean, default=False)
    is_test = db.Column(db.Boolean, default=False, nullable=True)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow)

    replied_by = db.relationship('User', foreign_keys=[replied_by_id])

    STATUS_LABELS = {'new': 'Nouveau', 'in_progress': 'En cours', 'resolved': 'Traité'}

    @property
    def status_label(self):
        return self.STATUS_LABELS.get(self.status, self.status)

    def to_public_dict(self):
        return {
            'rating': self.rating,
            'comment': self.comment or '',
            'status': self.status,
            'statusLabel': self.status_label,
            'adminReply': self.admin_reply or '',
            'repliedAt': self.replied_at.isoformat() + 'Z' if self.replied_at else None,
            'updatedAt': (self.updated_at or self.created_at).isoformat() + 'Z',
        }


# === NEW: AUDIT TRACKING AND SYSTEM NOTIFICATIONS ===

class AuditLog(db.Model):
    """Journal d'audit IMMUABLE (triggers SQLite : ni modification ni suppression)."""
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('user.id'), nullable=True, index=True) # Actor
    actor_name = db.Column(db.String(120), nullable=True)   # nom de l'acteur au moment de l'action
    actor_role = db.Column(db.String(30), nullable=True)
    action = db.Column(db.String(100), nullable=False, index=True) # e.g. "BUS_DELETED"
    category = db.Column(db.String(30), nullable=True, index=True)   # auth, client, conversation, reservation…
    target_type = db.Column(db.String(50), nullable=True) # e.g. "Bus"
    target_id = db.Column(db.Integer, nullable=True) # ID of the target resource
    target_label = db.Column(db.String(160), nullable=True)
    details = db.Column(db.Text, nullable=True) # JSON details or string explanation
    ip_address = db.Column(db.String(50), nullable=True)
    created_at = db.Column(db.DateTime, default=datetime.utcnow, index=True)

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
    link = db.Column(db.String(255), nullable=True)     # page à ouvrir au clic (fiche client, conversation…)
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

class Conversation(db.Model):
    """Métadonnées d'une conversation client. Les messages restent dans le fil partagé (db.json),
    relié par `thread_id`, et sont lus par l'admin et le widget du site."""
    __tablename__ = 'conversation'
    id = db.Column(db.Integer, primary_key=True)
    thread_id = db.Column(db.String(80), unique=True, nullable=False, index=True)
    client_id = db.Column(db.Integer, db.ForeignKey('user.id'), nullable=True, index=True)
    assigned_admin_id = db.Column(db.Integer, db.ForeignKey('user.id'), nullable=True, index=True)
    status = db.Column(db.String(20), nullable=False, default='new', index=True)  # new, open, pending, resolved, closed
    department = db.Column(db.String(30), nullable=False, default='general')     # general, vehicles, apartments, missions
    source = db.Column(db.String(30), nullable=True)
    unread_admin = db.Column(db.Integer, default=0)
    message_count = db.Column(db.Integer, default=0)
    last_message_preview = db.Column(db.String(200), nullable=True)
    last_sender = db.Column(db.String(10), nullable=True)            # client / admin
    last_message_at = db.Column(db.DateTime, nullable=True, index=True)
    last_client_message_at = db.Column(db.DateTime, nullable=True)
    last_admin_reply_at = db.Column(db.DateTime, nullable=True)
    first_client_message_at = db.Column(db.DateTime, nullable=True)
    first_response_at = db.Column(db.DateTime, nullable=True)
    first_response_by_id = db.Column(db.Integer, nullable=True)
    resolved_at = db.Column(db.DateTime, nullable=True)
    closed_at = db.Column(db.DateTime, nullable=True)
    unanswered_notified_at = db.Column(db.DateTime, nullable=True)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow)

    client = db.relationship('User', foreign_keys=[client_id])
    assigned_admin = db.relationship('User', foreign_keys=[assigned_admin_id])
    notes = db.relationship('ConversationNote', backref='conversation', lazy='dynamic',
                            order_by='ConversationNote.created_at.desc()')

    STATUS_LABELS = {'new': 'Nouveau', 'open': 'Ouvert', 'pending': 'En attente', 'resolved': 'Résolu', 'closed': 'Fermé'}
    DEPARTMENTS = {'general': 'Général', 'vehicles': 'Véhicules', 'apartments': 'Appartements', 'missions': 'Missions'}

    @property
    def status_label(self):
        return self.STATUS_LABELS.get(self.status, self.status)

    @property
    def department_label(self):
        return self.DEPARTMENTS.get(self.department, self.department)

    @property
    def first_response_seconds(self):
        if self.first_response_at and self.first_client_message_at:
            return max(0, int((self.first_response_at - self.first_client_message_at).total_seconds()))
        return None

    @property
    def resolution_seconds(self):
        if self.resolved_at and self.first_client_message_at:
            return max(0, int((self.resolved_at - self.first_client_message_at).total_seconds()))
        return None

    @property
    def awaiting_reply(self):
        """Dernier message du client sans réponse de l'équipe."""
        return self.status not in ('resolved', 'closed') and self.last_sender == 'client'


class ConversationNote(db.Model):
    """Note interne du staff : JAMAIS envoyée ni visible côté client."""
    __tablename__ = 'conversation_note'
    id = db.Column(db.Integer, primary_key=True)
    conversation_id = db.Column(db.Integer, db.ForeignKey('conversation.id'), nullable=False, index=True)
    author_id = db.Column(db.Integer, db.ForeignKey('user.id'), nullable=True)
    body = db.Column(db.Text, nullable=False)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

    author = db.relationship('User', foreign_keys=[author_id])


class RolePermission(db.Model):
    """Permission accordée à un rôle (le Super Admin a toujours toutes les permissions)."""
    __tablename__ = 'role_permission'
    id = db.Column(db.Integer, primary_key=True)
    role = db.Column(db.String(30), nullable=False, index=True)
    permission = db.Column(db.String(60), nullable=False)
    __table_args__ = (db.UniqueConstraint('role', 'permission', name='_role_perm_uc'),)


class NotificationPreference(db.Model):
    """Catégories de notifications désactivées par un membre du staff."""
    __tablename__ = 'notification_preference'
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('user.id'), nullable=False, index=True)
    category = db.Column(db.String(50), nullable=False)
    enabled = db.Column(db.Boolean, default=True)
    __table_args__ = (db.UniqueConstraint('user_id', 'category', name='_notif_pref_uc'),)


class Role(db.Model):
    """Rôle (système ou créé par le Super Admin). Les permissions sont dans `role_permission`."""
    __tablename__ = 'role'
    id = db.Column(db.Integer, primary_key=True)
    key = db.Column(db.String(30), unique=True, nullable=False, index=True)
    name = db.Column(db.String(80), nullable=False)
    description = db.Column(db.String(255), nullable=True)
    is_system = db.Column(db.Boolean, default=False)      # rôles d'origine : non supprimables
    is_staff = db.Column(db.Boolean, default=True)        # accès à l'administration
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    created_by_id = db.Column(db.Integer, nullable=True)


class ImprovementTask(db.Model):
    """Centre d'audit : problème identifié → correction suivie (jamais exécutée automatiquement)."""
    __tablename__ = 'improvement_task'
    id = db.Column(db.Integer, primary_key=True)
    title = db.Column(db.String(160), nullable=False)
    module = db.Column(db.String(40), nullable=True, index=True)
    severity = db.Column(db.String(10), nullable=False, default='medium', index=True)   # critical, high, medium, low
    business_impact = db.Column(db.Text, nullable=True)
    technical_impact = db.Column(db.Text, nullable=True)
    recommendation = db.Column(db.Text, nullable=True)
    complexity = db.Column(db.String(10), nullable=True)        # small, medium, large
    priority = db.Column(db.Integer, nullable=True)             # 1 (urgent) → 4
    status = db.Column(db.String(15), nullable=False, default='open', index=True)  # open, in_progress, done, wont_fix
    source = db.Column(db.String(20), nullable=True)            # manual, health_check
    assignee_id = db.Column(db.Integer, db.ForeignKey('user.id'), nullable=True)
    created_by_id = db.Column(db.Integer, db.ForeignKey('user.id'), nullable=True)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow)
    resolved_at = db.Column(db.DateTime, nullable=True)

    assignee = db.relationship('User', foreign_keys=[assignee_id])
    created_by = db.relationship('User', foreign_keys=[created_by_id])


class Announcement(db.Model):
    """Annonce envoyée par le Super Admin (staff, clients ou tous), avec suivi d'envoi réel."""
    __tablename__ = 'announcement'
    id = db.Column(db.Integer, primary_key=True)
    title = db.Column(db.String(150), nullable=False)
    body = db.Column(db.Text, nullable=False)
    audience = db.Column(db.String(20), nullable=False)          # staff, clients, all, role:<key>
    channels = db.Column(db.String(60), nullable=False, default='in_app')   # in_app, email
    module = db.Column(db.String(40), nullable=True)
    recipients = db.Column(db.Integer, default=0)
    emails_sent = db.Column(db.Integer, default=0)
    emails_failed = db.Column(db.Integer, default=0)
    created_by_id = db.Column(db.Integer, db.ForeignKey('user.id'), nullable=True)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

    created_by = db.relationship('User', foreign_keys=[created_by_id])


class SystemSetting(db.Model):
    __tablename__ = 'system_setting'
    key = db.Column(db.String(60), primary_key=True)
    value = db.Column(db.String(255), nullable=True)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_by_id = db.Column(db.Integer, nullable=True)


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


class MissionPackage(db.Model):
    """Reusable VIP service packages (Forfaits VIP) with pricing & policy metadata."""
    __tablename__ = 'mission_package'
    id = db.Column(db.Integer, primary_key=True)
    package_ref = db.Column(db.String(40), nullable=True)
    name = db.Column(db.String(140), nullable=False)
    description = db.Column(db.Text, nullable=True)
    service_category = db.Column(db.String(40), default='VIP')  # VIP, Premium, Standard, Delegation
    pricing_mode = db.Column(db.String(30), default='fixed')  # fixed, hourly, daily, one_way, round_trip, distance, custom
    base_price = db.Column(db.Float, nullable=False, default=75000.0)
    included_km = db.Column(db.Integer, default=100)
    included_hours = db.Column(db.Integer, default=8)
    extra_km_price = db.Column(db.Float, default=500.0)
    extra_hour_price = db.Column(db.Float, default=15000.0)
    waiting_allowance_minutes = db.Column(db.Integer, default=30)
    waiting_hour_price = db.Column(db.Float, default=10000.0)
    overtime_price = db.Column(db.Float, default=15000.0)
    fuel_toll_policy = db.Column(db.String(160), default='Carburant & péages inclus en zone urbaine')
    applicable_routes = db.Column(db.String(200), default='Toutes destinations Cameroun')
    terms_conditions = db.Column(db.Text, nullable=True)
    passenger_limit = db.Column(db.Integer, default=4)
    luggage_limit = db.Column(db.String(80), default='4 valises')
    vehicle_categories = db.Column(db.String(160), default='Berline VIP, SUV 4x4, Pick-up, Minibus')
    promo_code = db.Column(db.String(40), nullable=True)
    discount_percent = db.Column(db.Float, default=0.0)
    corporate_price = db.Column(db.Float, nullable=True)
    valid_from = db.Column(db.Date, nullable=True)
    valid_until = db.Column(db.Date, nullable=True)
    status = db.Column(db.String(20), default='active')  # active, inactive, archived
    agency_id = db.Column(db.Integer, db.ForeignKey('agency.id'), nullable=True)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

    def __repr__(self):
        return f'<MissionPackage {self.id}: {self.name}>'


class MissionExpense(db.Model):
    """Operational expenses tied directly to a fleet mission."""
    __tablename__ = 'mission_expense'
    id = db.Column(db.Integer, primary_key=True)
    trip_id = db.Column(db.Integer, db.ForeignKey('trip.id'), nullable=False)
    category = db.Column(db.String(40), nullable=False, default='fuel')  # fuel, toll, parking, driver_allowance, accommodation, maintenance, other
    description = db.Column(db.String(255), nullable=True)
    amount = db.Column(db.Float, nullable=False, default=0.0)
    expense_date = db.Column(db.DateTime, default=datetime.utcnow)
    recorded_by_id = db.Column(db.Integer, db.ForeignKey('user.id'), nullable=True)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

    def __repr__(self):
        return f'<MissionExpense {self.id}: {self.category} {self.amount}>'


class MissionIncident(db.Model):
    """Operational incident log for a fleet mission."""
    __tablename__ = 'mission_incident'
    id = db.Column(db.Integer, primary_key=True)
    incident_ref = db.Column(db.String(40), nullable=False)
    trip_id = db.Column(db.Integer, db.ForeignKey('trip.id'), nullable=False)
    category = db.Column(db.String(40), nullable=False, default='delay')  # breakdown, accident, complaint, driver_absence, delay, damage, lost_property, other
    severity = db.Column(db.String(20), nullable=False, default='medium')  # low, medium, high, critical
    description = db.Column(db.Text, nullable=False)
    responsible_person = db.Column(db.String(120), nullable=True)
    resolution = db.Column(db.Text, nullable=True)
    status = db.Column(db.String(20), default='open')  # open, in_progress, resolved
    occurred_at = db.Column(db.DateTime, default=datetime.utcnow)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

    def __repr__(self):
        return f'<MissionIncident {self.incident_ref}: {self.category}>'


class Contract(db.Model):
    """Contrat (location véhicule / appartement, service, entreprise, partenariat)."""
    __tablename__ = 'contract'

    STATUSES = ('draft', 'pending_approval', 'active', 'completed', 'terminated', 'expired')
    TYPES = ('vehicle_rental', 'apartment_rental', 'service_agreement', 'corporate_agreement', 'partnership')

    id = db.Column(db.Integer, primary_key=True)
    reference = db.Column(db.String(20), unique=True, nullable=False, index=True)  # CTR-2026-0001
    subject = db.Column(db.String(150), nullable=False)
    contract_type = db.Column(db.String(30), nullable=False, default='vehicle_rental')
    status = db.Column(db.String(20), nullable=False, default='draft', index=True)

    client_id = db.Column(db.Integer, db.ForeignKey('user.id'), nullable=False)
    vehicle_id = db.Column(db.Integer, db.ForeignKey('bus.id'), nullable=True)
    apartment_id = db.Column(db.String(50), db.ForeignKey('apartment.id'), nullable=True)
    trip_id = db.Column(db.Integer, db.ForeignKey('trip.id'), nullable=True)
    booking_id = db.Column(db.Integer, db.ForeignKey('booking.id'), nullable=True)
    agency_id = db.Column(db.Integer, db.ForeignKey('agency.id'), nullable=True)
    previous_contract_id = db.Column(db.Integer, db.ForeignKey('contract.id'), nullable=True)  # renouvellement

    start_date = db.Column(db.DateTime, nullable=False)
    end_date = db.Column(db.DateTime, nullable=False)
    pickup_location = db.Column(db.String(200), nullable=True)
    return_location = db.Column(db.String(200), nullable=True)

    daily_rate = db.Column(db.Float, nullable=False, default=0.0)
    extra_charges = db.Column(db.Float, nullable=False, default=0.0)
    deposit = db.Column(db.Float, nullable=False, default=0.0)
    total_value = db.Column(db.Float, nullable=False, default=0.0)
    payment_terms = db.Column(db.Text, nullable=True)
    terms = db.Column(db.Text, nullable=True)
    notes = db.Column(db.Text, nullable=True)
    attachment_path = db.Column(db.String(255), nullable=True)  # ancien champ (repris en documents)

    created_by_id = db.Column(db.Integer, db.ForeignKey('user.id'), nullable=True)
    approved_by_id = db.Column(db.Integer, db.ForeignKey('user.id'), nullable=True)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    approved_at = db.Column(db.DateTime, nullable=True)
    signed_at = db.Column(db.DateTime, nullable=True)
    cancelled_at = db.Column(db.DateTime, nullable=True)
    terminated_at = db.Column(db.DateTime, nullable=True)
    termination_reason = db.Column(db.Text, nullable=True)
    expiry_notified_at = db.Column(db.DateTime, nullable=True)
    is_archived = db.Column(db.Boolean, default=False)
    archived_at = db.Column(db.DateTime, nullable=True)
    is_deleted = db.Column(db.Boolean, default=False)
    is_test = db.Column(db.Boolean, default=False, nullable=True)  # donnée de démonstration / test : exclue des indicateurs

    client = db.relationship('User', foreign_keys=[client_id])
    created_by = db.relationship('User', foreign_keys=[created_by_id])
    approved_by = db.relationship('User', foreign_keys=[approved_by_id])
    vehicle = db.relationship('Bus', foreign_keys=[vehicle_id])
    apartment = db.relationship('Apartment', foreign_keys=[apartment_id])
    trip = db.relationship('Trip', foreign_keys=[trip_id])
    booking = db.relationship('Booking', foreign_keys=[booking_id])
    previous_contract = db.relationship('Contract', remote_side=[id], foreign_keys=[previous_contract_id], backref='renewals')
    payments = db.relationship('ContractPayment', backref='contract', lazy='dynamic', order_by='ContractPayment.paid_at.desc()')
    documents = db.relationship('ContractDocument', backref='contract', lazy='dynamic', order_by='ContractDocument.uploaded_at.desc()')

    @property
    def days(self):
        if not self.start_date or not self.end_date:
            return 0
        secs = (self.end_date - self.start_date).total_seconds()
        return max(1, int(-(-secs // 86400)))  # jours entamés

    @property
    def amount_paid(self):
        """Encaissé sur la valeur du contrat (hors caution, hors paiements annulés)."""
        return sum(p.amount or 0 for p in self.payments.filter_by(is_void=False, is_deposit=False).all())

    @property
    def deposit_received(self):
        return sum(p.amount or 0 for p in self.payments.filter_by(is_void=False, is_deposit=True).all())

    @property
    def balance(self):
        return max(0.0, (self.total_value or 0) - self.amount_paid)

    def __repr__(self):
        return f'<Contract {self.reference}>'


class ContractPayment(db.Model):
    """Encaissement enregistré sur un contrat (historique, jamais supprimé : annulation = is_void)."""
    __tablename__ = 'contract_payment'
    METHODS = ('cash', 'mtn_momo', 'orange_money', 'card', 'bank_transfer')

    id = db.Column(db.Integer, primary_key=True)
    contract_id = db.Column(db.Integer, db.ForeignKey('contract.id'), nullable=False, index=True)
    amount = db.Column(db.Float, nullable=False)
    method = db.Column(db.String(30), nullable=False, default='cash')
    reference = db.Column(db.String(80), nullable=True)
    note = db.Column(db.String(255), nullable=True)
    is_deposit = db.Column(db.Boolean, default=False)
    paid_at = db.Column(db.DateTime, default=datetime.utcnow)
    recorded_by_id = db.Column(db.Integer, db.ForeignKey('user.id'), nullable=True)
    is_void = db.Column(db.Boolean, default=False)
    voided_at = db.Column(db.DateTime, nullable=True)
    void_reason = db.Column(db.String(255), nullable=True)

    recorded_by = db.relationship('User', foreign_keys=[recorded_by_id])


class ContractDocument(db.Model):
    """Document joint à un contrat (stocké hors du dossier public)."""
    __tablename__ = 'contract_document'

    id = db.Column(db.Integer, primary_key=True)
    contract_id = db.Column(db.Integer, db.ForeignKey('contract.id'), nullable=False, index=True)
    stored_name = db.Column(db.String(64), nullable=False)       # nom aléatoire sur disque
    original_name = db.Column(db.String(200), nullable=False)
    mime_type = db.Column(db.String(100), nullable=False)
    size_bytes = db.Column(db.Integer, nullable=False, default=0)
    doc_type = db.Column(db.String(40), nullable=False, default='signed_contract')
    uploaded_by_id = db.Column(db.Integer, db.ForeignKey('user.id'), nullable=True)
    uploaded_at = db.Column(db.DateTime, default=datetime.utcnow)
    is_deleted = db.Column(db.Boolean, default=False)

    uploaded_by = db.relationship('User', foreign_keys=[uploaded_by_id])


class Invoice(db.Model):
    """Facture client 3M SERVICES (locations véhicules, missions VIP, résidences meublées, contrats)."""
    __tablename__ = 'invoice'

    id = db.Column(db.Integer, primary_key=True)
    reference = db.Column(db.String(40), unique=True, nullable=False, index=True)
    client_id = db.Column(db.Integer, db.ForeignKey('user.id'), nullable=True)
    bill_to = db.Column(db.String(255), nullable=False)
    ship_to = db.Column(db.String(255), nullable=False)
    contract_id = db.Column(db.Integer, db.ForeignKey('contract.id'), nullable=True)
    trip_id = db.Column(db.Integer, db.ForeignKey('trip.id'), nullable=True)
    apartment_id = db.Column(db.String(50), db.ForeignKey('apartment.id'), nullable=True)
    project_label = db.Column(db.String(200), nullable=True)
    agency_id = db.Column(db.Integer, db.ForeignKey('agency.id'), nullable=True)

    currency = db.Column(db.String(10), nullable=False, default='XAF')
    issue_date = db.Column(db.Date, nullable=False, default=datetime.utcnow)
    due_date = db.Column(db.Date, nullable=False)
    payment_method = db.Column(db.String(30), nullable=False, default='mtn_momo')
    status = db.Column(db.String(30), nullable=False, default='draft')
    description = db.Column(db.Text, nullable=True)

    subtotal = db.Column(db.Float, nullable=False, default=0.0)
    discount_percent = db.Column(db.Float, nullable=False, default=0.0)
    discount_amount = db.Column(db.Float, nullable=False, default=0.0)
    extra_discount_percent = db.Column(db.Float, nullable=False, default=0.0)
    extra_discount_amount = db.Column(db.Float, nullable=False, default=0.0)
    tax_percent = db.Column(db.Float, nullable=False, default=0.0)
    tax_amount = db.Column(db.Float, nullable=False, default=0.0)
    total_amount = db.Column(db.Float, nullable=False, default=0.0)
    amount_paid = db.Column(db.Float, nullable=False, default=0.0)

    notes = db.Column(db.Text, nullable=True)
    terms = db.Column(db.Text, nullable=True)

    created_by_id = db.Column(db.Integer, db.ForeignKey('user.id'), nullable=True)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    is_deleted = db.Column(db.Boolean, default=False)

    client = db.relationship('User', foreign_keys=[client_id])
    created_by = db.relationship('User', foreign_keys=[created_by_id])
    contract = db.relationship('Contract', foreign_keys=[contract_id])
    trip = db.relationship('Trip', foreign_keys=[trip_id])
    apartment = db.relationship('Apartment', foreign_keys=[apartment_id])
    items = db.relationship(
        'InvoiceItem',
        backref='invoice',
        cascade='all, delete-orphan',
        order_by='InvoiceItem.sort_order',
    )

    @property
    def balance(self):
        return max(0.0, (self.total_amount or 0.0) - (self.amount_paid or 0.0))

    def __repr__(self):
        return f'<Invoice {self.reference}>'


class InvoiceItem(db.Model):
    """Ligne de facturation d'une facture 3M SERVICES."""
    __tablename__ = 'invoice_item'

    id = db.Column(db.Integer, primary_key=True)
    invoice_id = db.Column(db.Integer, db.ForeignKey('invoice.id'), nullable=False, index=True)
    item_name = db.Column(db.String(200), nullable=False)
    quantity = db.Column(db.Float, nullable=False, default=1.0)
    unit_price = db.Column(db.Float, nullable=False, default=0.0)
    discount_percent = db.Column(db.Float, nullable=False, default=0.0)
    amount = db.Column(db.Float, nullable=False, default=0.0)
    sort_order = db.Column(db.Integer, nullable=False, default=0)

