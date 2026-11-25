import json
import os
import random
import uuid
from datetime import datetime, date, timedelta
from flask import Blueprint, render_template, redirect, url_for, flash, request, jsonify, send_from_directory, current_app
from flask_login import login_required, current_user
from werkzeug.utils import secure_filename
from app import db
from app.models import Apartment, ApartmentPhoto, ApartmentBooking, User, Agency

properties_bp = Blueprint('properties', __name__)

ALLOWED_IMAGE_EXTENSIONS = {'jpg', 'jpeg', 'png', 'webp'}
MAX_PHOTO_BYTES = 10 * 1024 * 1024  # 10 MB per photo

PROPERTY_TYPES = ['Studio', 'T2', 'T3', 'T4', 'Villa', 'Penthouse', 'Autre']
PROPERTY_STANDINGS = ['Standard', 'Confort', 'Haut Standing', 'Prestige', 'Luxe']
PROPERTY_STATUSES = ['Disponible', 'Occupé', 'Réservé', 'En maintenance', 'Non publié']
PHOTO_ROOM_CATEGORIES = [
    'Façade / Vue principale',
    'Salon & Séjour',
    'Suite Parentale / Chambre',
    'Chambre secondaire',
    'Cuisine équipée',
    'Salle de bain',
    'Balcon / Terrasse',
    'Parking & Extérieur',
]

PROPERTY_EQUIPMENTS = [
    "Climatisation intégrale",
    "Wi-Fi fibre optique",
    "Smart TV (Netflix / Canal+)",
    "Cuisine équipée",
    "Literie King Size",
    "Salle de bain moderne",
    "Balcon privé",
    "Forage et suppresseur",
    "Machine à laver",
    "Micro-ondes et réfrigérateur",
    "Chauffe-eau",
    "Parking",
]

PROPERTY_VIP_SERVICES = [
    "Groupe électrogène automatique",
    "Gardiennage 24h/24",
    "Vidéosurveillance",
    "Ménage régulier",
    "Conciergerie hôtelière",
    "Parking privé sécurisé",
    "Chauffeur privé sur demande",
    "Navette aéroport Nsimalen",
    "Assistance privée 24h/24",
]

APARTMENT_EXTRA_COLUMNS = [
    ("reference", "VARCHAR(40)"),
    ("property_type", "VARCHAR(50) DEFAULT 'T3'"),
    ("standing", "VARCHAR(50) DEFAULT 'Haut Standing'"),
    ("city", "VARCHAR(100) DEFAULT 'Yaoundé'"),
    ("neighborhood", "VARCHAR(120) DEFAULT 'Tsinga'"),
    ("exact_address", "VARCHAR(255)"),
    ("landmark", "VARCHAR(200)"),
    ("access_instructions", "TEXT"),
    ("gps_coordinates", "VARCHAR(100)"),
    ("bedrooms_count", "INTEGER DEFAULT 2"),
    ("living_rooms_count", "INTEGER DEFAULT 1"),
    ("bathrooms_count", "INTEGER DEFAULT 2"),
    ("kitchens_count", "INTEGER DEFAULT 1"),
    ("balconies_count", "INTEGER DEFAULT 1"),
    ("max_guests", "INTEGER DEFAULT 4"),
    ("bedding_details", "VARCHAR(200)"),
    ("surface_sqm", "FLOAT"),
    ("nightly_rate", "FLOAT DEFAULT 65000.0"),
    ("weekly_rate", "FLOAT"),
    ("monthly_rate", "FLOAT"),
    ("security_deposit", "FLOAT DEFAULT 100000.0"),
    ("cleaning_fee", "FLOAT DEFAULT 0.0"),
    ("min_stay_nights", "INTEGER DEFAULT 1"),
    ("payment_terms", "VARCHAR(200)"),
    ("long_stay_discount", "VARCHAR(120)"),
    ("short_description", "VARCHAR(320)"),
    ("is_published", "BOOLEAN DEFAULT 1"),
    ("is_featured", "BOOLEAN DEFAULT 0"),
    ("manager_name", "VARCHAR(120) DEFAULT 'Conciergerie 3M SERVICES'"),
    ("internal_notes", "TEXT"),
    ("available_from", "DATE"),
]


def _project_root():
    return os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))


def _public_uploads_dir():
    d = os.path.join(_project_root(), 'public', 'uploads')
    os.makedirs(d, exist_ok=True)
    return d


def _public_asset_dir():
    return os.path.join(_project_root(), 'public', 'Asset')


def _admin_only():
    return current_user.is_authenticated and current_user.role in ['super_admin', 'admin_agence']


def ensure_property_schema():
    """Create ApartmentPhoto & ApartmentBooking tables, migrate missing Apartment columns, and sync db.json."""
    try:
        db.create_all()
        existing = {
            row[1] for row in db.session.execute(db.text("PRAGMA table_info(apartment)")).fetchall()
        }
        changed = False
        for col_name, col_ddl in APARTMENT_EXTRA_COLUMNS:
            if col_name not in existing:
                db.session.execute(db.text(f"ALTER TABLE apartment ADD COLUMN {col_name} {col_ddl}"))
                changed = True
        if changed:
            db.session.commit()

        # Backfill references and initial cover photo rows for existing apartments
        apts = Apartment.query.filter_by(is_deleted=False).all()
        seeded = False
        for idx, apt in enumerate(apts, start=1):
            if not apt.reference:
                apt.reference = f"3M-BIEN-{idx:03d}"
                seeded = True
            if apt.is_published is None:
                apt.is_published = (apt.status != 'Non publié')
                seeded = True
            if apt.photos.count() == 0 and apt.image:
                db.session.add(ApartmentPhoto(
                    apartment_id=apt.id,
                    url=apt.image,
                    filename=os.path.basename(apt.image),
                    room_category='Façade / Vue principale',
                    caption=apt.title,
                    sort_order=0,
                    is_cover=True,
                ))
                seeded = True
        if seeded:
            db.session.commit()

        sync_published_properties_to_express()
    except Exception as e:
        db.session.rollback()
        try:
            current_app.logger.warning(f"[ensure_property_schema] {e}")
        except Exception:
            pass


def sync_published_properties_to_express():
    """Sync all published, non-deleted properties (with galleries & booked dates) to server/data/db.json."""
    try:
        db_path = current_app.config['EXPRESS_DB_JSON']
        if not os.path.exists(db_path):
            return
        with open(db_path, 'r', encoding='utf-8') as f:
            exp_db = json.load(f)

        published_apts = Apartment.query.filter(
            Apartment.is_deleted == False,
            Apartment.is_published == True,
            Apartment.status != 'Non publié'
        ).order_by(Apartment.is_featured.desc(), Apartment.id.asc()).all()

        exp_db['apartments'] = [a.to_dict() for a in published_apts]
        with open(db_path, 'w', encoding='utf-8') as f:
            json.dump(exp_db, f, indent=2, ensure_ascii=False)
    except Exception as e:
        try:
            current_app.logger.warning(f"[sync_published_properties_to_express] {e}")
        except Exception:
            pass


def _is_valid_image_bytes(header_bytes, ext):
    """Verify real image magic bytes to prevent disguised script uploads."""
    if ext in ('jpg', 'jpeg'):
        return header_bytes.startswith(b'\xff\xd8\xff')
    if ext == 'png':
        return header_bytes.startswith(b'\x89PNG\r\n\x1a\n')
    if ext == 'webp':
        return len(header_bytes) >= 12 and header_bytes[:4] == b'RIFF' and header_bytes[8:12] == b'WEBP'
    return False


def validate_and_save_property_photos(apt, files, categories=None, captions=None, cover_new_index=None):
    """Validate file type, magic bytes & size, store persistently in public/uploads/apartments/<id>/, and save DB rows."""
    saved_photos = []
    errors = []
    dest_dir = os.path.join(_public_uploads_dir(), 'apartments', apt.id)
    os.makedirs(dest_dir, exist_ok=True)

    current_max_order = db.session.query(db.func.max(ApartmentPhoto.sort_order)).filter_by(apartment_id=apt.id).scalar()
    next_order = (current_max_order + 1) if current_max_order is not None else 0

    for i, storage in enumerate(files):
        if not storage or not storage.filename:
            continue
        orig_name = secure_filename(storage.filename)
        if '.' not in orig_name:
            errors.append(f"Fichier rejeté ({storage.filename}) : extension manquante.")
            continue
        ext = orig_name.rsplit('.', 1)[1].lower()
        if ext not in ALLOWED_IMAGE_EXTENSIONS:
            errors.append(f"Format non autorisé ({orig_name}). Formats acceptés : JPG, PNG, WEBP.")
            continue

        data = storage.read()
        if len(data) == 0 or len(data) > MAX_PHOTO_BYTES:
            errors.append(f"Taille invalide ({orig_name}) : maximum 10 Mo par photo.")
            continue
        if not _is_valid_image_bytes(data[:16], ext):
            errors.append(f"Contenu image invalide ({orig_name}).")
            continue

        unique_name = f"{apt.id}-{datetime.now().strftime('%y%m%d%H%M%S')}-{uuid.uuid4().hex[:6]}.{ext}"
        full_path = os.path.join(dest_dir, unique_name)
        with open(full_path, 'wb') as out_f:
            out_f.write(data)

        url = f"/uploads/apartments/{apt.id}/{unique_name}"
        cat = (categories[i] if categories and i < len(categories) and categories[i] else 'Salon & Séjour').strip()
        cap = (captions[i] if captions and i < len(captions) else '').strip()
        is_cov = (cover_new_index is not None and str(cover_new_index) == str(i))

        photo = ApartmentPhoto(
            apartment_id=apt.id,
            url=url,
            filename=unique_name,
            room_category=cat,
            caption=cap or apt.title,
            sort_order=next_order,
            is_cover=is_cov,
            file_size=len(data),
        )
        next_order += 1
        db.session.add(photo)
        saved_photos.append(photo)

    db.session.flush()
    return saved_photos, errors


def _reconcile_cover_and_counts(apt, explicit_cover_photo_id=None):
    """Ensure exactly one cover photo is marked and sync Apartment.image + photos_count."""
    all_photos = apt.ordered_photos()
    if not all_photos:
        apt.photos_count = 1 if apt.image else 0
        return

    if explicit_cover_photo_id:
        for p in all_photos:
            p.is_cover = (str(p.id) == str(explicit_cover_photo_id))

    if not any(p.is_cover for p in all_photos):
        all_photos[0].is_cover = True

    cover = next((p for p in all_photos if p.is_cover), all_photos[0])
    apt.image = cover.url
    apt.photos_count = len(all_photos)


def check_apartment_availability(apartment_id, check_in, check_out, exclude_booking_id=None):
    """Independent apartment calendar check: blocks maintenance, unpublished, and overlapping stays."""
    apt = Apartment.query.filter_by(id=apartment_id, is_deleted=False).first()
    if not apt:
        return False, "Bien meublé introuvable."
    if apt.status in ('En maintenance', 'Maintenance'):
        return False, f"Le bien « {apt.title} » est actuellement en maintenance."
    if check_out <= check_in:
        return False, "La date de départ doit être postérieure à la date d'arrivée."
    if apt.min_stay_nights and (check_out - check_in).days < apt.min_stay_nights:
        return False, f"Séjour minimum requis pour ce bien : {apt.min_stay_nights} nuit(s)."

    conflicts = ApartmentBooking.query.filter(
        ApartmentBooking.apartment_id == apt.id,
        ApartmentBooking.status.in_(['confirmed', 'checked_in', 'maintenance_block']),
        ApartmentBooking.check_in < check_out,
        ApartmentBooking.check_out > check_in,
    ).all()

    for c in conflicts:
        if exclude_booking_id and c.id == int(exclude_booking_id):
            continue
        return False, (
            f"Dates indisponibles : « {apt.title} » est déjà réservé ({c.booking_ref}) "
            f"du {c.check_in.strftime('%d/%m/%Y')} au {c.check_out.strftime('%d/%m/%Y')}."
        )
    return True, None


def recompute_apartment_live_status(apt):
    """Automatically update apartment status based on active stays and sync to public website."""
    if apt.status not in ('En maintenance', 'Maintenance', 'Non publié'):
        today = date.today()
        active_now = apt.stays.filter(
            ApartmentBooking.status.in_(['confirmed', 'checked_in']),
            ApartmentBooking.check_in <= today,
            ApartmentBooking.check_out > today,
        ).first()
        upcoming = apt.stays.filter(
            ApartmentBooking.status.in_(['confirmed', 'checked_in']),
            ApartmentBooking.check_in > today,
        ).first()
        if active_now:
            apt.status = 'Occupé'
        elif upcoming:
            apt.status = 'Réservé'
        else:
            apt.status = 'Disponible'
    db.session.commit()
    sync_published_properties_to_express()


def save_property_from_request(apt=None):
    """Process the 6-step Property Listing & Management Form (both Create & Edit)."""
    from app.routes.admin import log_audit

    is_new = apt is None
    title = (request.form.get('title') or '').strip()
    property_type = (request.form.get('property_type') or 'T3').strip()
    standing = (request.form.get('standing') or 'Haut Standing').strip()
    city = (request.form.get('city') or 'Yaoundé').strip()
    neighborhood = (request.form.get('neighborhood') or 'Tsinga').strip()
    exact_address = (request.form.get('exact_address') or '').strip()
    nightly_rate = request.form.get('nightly_rate', type=float)

    # Backward compatibility if legacy 'price' string or 'location' was posted
    if nightly_rate is None:
        raw_p = "".join(c for c in (request.form.get('price') or '') if c.isdigit())
        nightly_rate = float(raw_p) if raw_p else 65000.0

    if not title:
        return None, ["Le titre du bien meublé est obligatoire."]

    if is_new:
        existing_ids = {a.id for a in Apartment.query.all()}
        n = 1
        while f"apt-{n:02d}" in existing_ids:
            n += 1
        new_id = f"apt-{n:02d}"
        ref = f"3M-BIEN-{n:03d}"
        apt = Apartment(id=new_id, reference=ref)
        db.session.add(apt)

    apt.title = title
    apt.property_type = property_type
    apt.standing = standing
    apt.type = (request.form.get('type') or f"{property_type} Meublé {standing}").strip()
    apt.status = (request.form.get('status') or 'Disponible').strip()
    apt.short_description = (request.form.get('short_description') or '').strip()
    apt.description = (request.form.get('description') or apt.short_description or '').strip()

    # 02. Localisation
    apt.city = city
    apt.neighborhood = neighborhood
    apt.exact_address = exact_address
    apt.landmark = (request.form.get('landmark') or '').strip()
    apt.access_instructions = (request.form.get('access_instructions') or '').strip()
    apt.gps_coordinates = (request.form.get('gps_coordinates') or '').strip()
    loc_parts = [p for p in [neighborhood, f"({apt.landmark})" if apt.landmark else None, city] if p]
    apt.location = (request.form.get('location') or '').strip() or (", ".join([f"{neighborhood}" + (f" ({apt.landmark})" if apt.landmark else ""), city]))

    # 03. Configuration du logement
    apt.bedrooms_count = request.form.get('bedrooms_count', 2, type=int)
    apt.living_rooms_count = request.form.get('living_rooms_count', 1, type=int)
    apt.bathrooms_count = request.form.get('bathrooms_count', 2, type=int)
    apt.kitchens_count = request.form.get('kitchens_count', 1, type=int)
    apt.balconies_count = request.form.get('balconies_count', 1, type=int)
    apt.max_guests = request.form.get('max_guests', 4, type=int) or 2
    apt.bedding_details = (request.form.get('bedding_details') or '').strip()
    apt.surface_sqm = request.form.get('surface_sqm', type=float)

    rooms_auto = []
    if apt.bedrooms_count:
        rooms_auto.append(f"{apt.bedrooms_count} Chambre{'s' if apt.bedrooms_count > 1 else ''}")
    if apt.living_rooms_count:
        rooms_auto.append(f"{apt.living_rooms_count} Salon{'s' if apt.living_rooms_count > 1 else ''}")
    if apt.bathrooms_count:
        rooms_auto.append(f"{apt.bathrooms_count} Salle{'s' if apt.bathrooms_count > 1 else ''} de bain")
    apt.rooms = (request.form.get('rooms') or '').strip() or " • ".join(rooms_auto)

    # 04. Tarification & conditions
    apt.nightly_rate = nightly_rate
    apt.weekly_rate = request.form.get('weekly_rate', type=float)
    apt.monthly_rate = request.form.get('monthly_rate', type=float)
    apt.security_deposit = request.form.get('security_deposit', 100000.0, type=float) or 0.0
    apt.cleaning_fee = request.form.get('cleaning_fee', 0.0, type=float) or 0.0
    apt.min_stay_nights = request.form.get('min_stay_nights', 1, type=int) or 1
    apt.payment_terms = (request.form.get('payment_terms') or '').strip()
    apt.long_stay_discount = (request.form.get('long_stay_discount') or '').strip()

    price_label = f"{int(nightly_rate):,} FCFA / nuitée".replace(',', ' ')
    if apt.monthly_rate:
        price_label += " (Dégressif semaine/mois)"
    apt.price = (request.form.get('price_override') or '').strip() or price_label

    # 06 & 07. Équipements & Services VIP
    equipments = request.form.getlist('equipments')
    custom_eq = (request.form.get('custom_equipment') or '').strip()
    if custom_eq and custom_eq not in equipments:
        equipments.extend([x.strip() for x in custom_eq.split(',') if x.strip()])
    apt.equipments = equipments

    vip_services = request.form.getlist('vip_services')
    custom_vip = (request.form.get('custom_vip_service') or '').strip()
    if custom_vip and custom_vip not in vip_services:
        vip_services.extend([x.strip() for x in custom_vip.split(',') if x.strip()])
    apt.vip_services = vip_services

    # 08. Publication & gestion
    pub_val = request.form.get('is_published', '1')
    apt.is_published = (pub_val in ('1', 'true', 'on', 'yes')) and (apt.status != 'Non publié')
    if not apt.is_published and apt.status == 'Disponible':
        pass
    apt.is_featured = request.form.get('is_featured') in ('1', 'true', 'on', 'yes')
    apt.manager_name = (request.form.get('manager_name') or 'Conciergerie 3M SERVICES').strip()
    apt.internal_notes = (request.form.get('internal_notes') or '').strip()
    avail_str = (request.form.get('available_from') or '').strip()
    if avail_str:
        try:
            apt.available_from = datetime.strptime(avail_str[:10], '%Y-%m-%d').date()
        except ValueError:
            pass
    apt.agency_id = current_user.agency_id or 1

    db.session.flush()

    # Update existing photos metadata (order, category, caption, delete)
    delete_ids = {int(x) for x in request.form.getlist('delete_photo_ids') if str(x).isdigit()}
    for existing_p in apt.photos.all():
        if existing_p.id in delete_ids:
            db.session.delete(existing_p)
            continue
        p_cat = request.form.get(f'existing_category_{existing_p.id}')
        p_cap = request.form.get(f'existing_caption_{existing_p.id}')
        p_ord = request.form.get(f'existing_order_{existing_p.id}', type=int)
        if p_cat is not None:
            existing_p.room_category = p_cat.strip()
        if p_cap is not None:
            existing_p.caption = p_cap.strip()
        if p_ord is not None:
            existing_p.sort_order = p_ord

    db.session.flush()

    # Process newly uploaded photo files from computer/mobile
    uploaded_files = request.files.getlist('property_photos')
    new_cats = request.form.getlist('new_photo_categories')
    new_caps = request.form.getlist('new_photo_captions')
    cover_choice = (request.form.get('cover_selection') or '').strip()  # e.g. 'existing:12' or 'new:0'
    cover_new_idx = cover_choice.split(':', 1)[1] if cover_choice.startswith('new:') else None

    saved_new, upload_errors = validate_and_save_property_photos(
        apt, uploaded_files, categories=new_cats, captions=new_caps, cover_new_index=cover_new_idx
    )

    # Optional fallback preset/URL if no uploaded photos exist yet
    fallback_url = (request.form.get('fallback_image_url') or request.form.get('image') or '').strip()
    if apt.photos.count() == 0:
        default_img = fallback_url or '/Asset/appartements/appartement-meuble-suite-parentale.webp'
        apt.image = default_img
        db.session.add(ApartmentPhoto(
            apartment_id=apt.id,
            url=default_img,
            filename=os.path.basename(default_img),
            room_category='Façade / Vue principale',
            caption=apt.title,
            sort_order=0,
            is_cover=True,
        ))
        db.session.flush()

    explicit_cover_id = None
    if cover_choice.startswith('existing:'):
        explicit_cover_id = cover_choice.split(':', 1)[1]
    elif cover_new_idx is not None and saved_new:
        cov_p = next((p for p in saved_new if p.is_cover), None)
        if cov_p:
            explicit_cover_id = cov_p.id

    _reconcile_cover_and_counts(apt, explicit_cover_photo_id=explicit_cover_id)
    db.session.commit()

    sync_published_properties_to_express()
    action_code = "PROPERTY_CREATED" if is_new else "PROPERTY_UPDATED"
    log_audit(action_code, "Apartment", 0, f"{apt.reference} ({apt.title}) — {apt.price} — {apt.photos_count} photo(s) — Publié={apt.is_published}")
    return apt, upload_errors


def render_property_form(apt=None):
    next_idx = Apartment.query.count() + 1
    preview_ref = apt.reference if apt and apt.reference else f"3M-BIEN-{next_idx:03d}"
    return render_template(
        'admin/property_form.html',
        apt=apt,
        preview_ref=preview_ref,
        property_types=PROPERTY_TYPES,
        property_standings=PROPERTY_STANDINGS,
        property_statuses=PROPERTY_STATUSES,
        photo_categories=PHOTO_ROOM_CATEGORIES,
        default_equipments=PROPERTY_EQUIPMENTS,
        default_vip_services=PROPERTY_VIP_SERVICES,
    )


# ── STATIC SERVING FOR UPLOADS & ASSETS ON FLASK PORT 5002 ──
@properties_bp.route('/uploads/<path:filename>')
def serve_uploaded_file(filename):
    return send_from_directory(_public_uploads_dir(), filename)


@properties_bp.route('/Asset/<path:filename>')
def serve_public_asset(filename):
    return send_from_directory(_public_asset_dir(), filename)


# ── 6-STEP PROPERTY LISTING & MANAGEMENT ROUTES ──
@properties_bp.route('/admin/properties/add', methods=['GET', 'POST'])
@login_required
def add_property():
    if not _admin_only():
        return redirect(url_for('main.index'))
    if request.method == 'POST':
        apt, errs = save_property_from_request(apt=None)
        for err in errs:
            flash(err, 'warning')
        if apt:
            flash(f"Bien meublé « {apt.title} » ({apt.reference}) enregistré avec succès ({apt.photos_count} photo(s)) !", 'success')
            return redirect(url_for('admin.apartments'))
    return render_property_form(apt=None)


@properties_bp.route('/admin/properties/edit/<id>', methods=['GET', 'POST'])
@login_required
def edit_property(id):
    if not _admin_only():
        return redirect(url_for('main.index'))
    apt = Apartment.query.filter_by(id=id, is_deleted=False).first_or_404()
    if request.method == 'POST':
        apt, errs = save_property_from_request(apt=apt)
        for err in errs:
            flash(err, 'warning')
        flash(f"Bien meublé « {apt.title} » mis à jour et synchronisé avec le site client !", 'success')
        return redirect(url_for('admin.apartments'))
    return render_property_form(apt=apt)


# ── DEDICATED APARTMENT AVAILABILITY CALENDAR & RESERVATIONS ──
@properties_bp.route('/admin/properties/calendar')
@login_required
def property_calendar():
    if not _admin_only():
        return redirect(url_for('main.index'))
    apts = Apartment.query.filter_by(is_deleted=False).order_by(Apartment.title).all()
    stays = ApartmentBooking.query.order_by(ApartmentBooking.check_in.desc()).limit(50).all()
    clients = User.query.filter_by(role='client', is_deleted=False).order_by(User.real_name, User.username).limit(80).all()
    return render_template(
        'admin/property_calendar.html',
        apartments=apts,
        stays=stays,
        clients=clients,
        today=date.today(),
    )


@properties_bp.route('/admin/properties/api/events')
@login_required
def property_calendar_events():
    if not _admin_only():
        return jsonify([]), 403
    apt_id = (request.args.get('apartment_id') or '').strip()
    q = ApartmentBooking.query.filter(ApartmentBooking.status != 'cancelled')
    if apt_id:
        q = q.filter_by(apartment_id=apt_id)
    events = []
    colors = {
        'confirmed': '#D62828',
        'checked_in': '#15803d',
        'checked_out': '#64748b',
        'maintenance_block': '#d97706',
    }
    for b in q.all():
        apt_title = b.apartment.title if b.apartment else b.apartment_id
        events.append({
            'id': b.id,
            'title': f"{b.booking_ref} · {apt_title} ({b.guest_name})",
            'start': b.check_in.isoformat(),
            'end': b.check_out.isoformat(),
            'allDay': True,
            'backgroundColor': colors.get(b.status, '#D62828'),
            'borderColor': colors.get(b.status, '#D62828'),
        })
    return jsonify(events)


@properties_bp.route('/admin/properties/bookings/create', methods=['POST'])
@login_required
def create_property_booking():
    if not _admin_only():
        return redirect(url_for('main.index'))

    from app.routes.admin import _upsert_visitor_user, log_audit

    apt_id = (request.form.get('apartment_id') or '').strip()
    ci_str = (request.form.get('check_in') or '').strip()
    co_str = (request.form.get('check_out') or '').strip()
    client_id = request.form.get('client_user_id', type=int)
    guest_name = (request.form.get('guest_name') or '').strip()
    guest_phone = (request.form.get('guest_phone') or '').strip()
    guest_email = (request.form.get('guest_email') or '').strip()

    try:
        check_in = datetime.strptime(ci_str[:10], '%Y-%m-%d').date()
        check_out = datetime.strptime(co_str[:10], '%Y-%m-%d').date()
    except ValueError:
        flash("Dates d'arrivée et de départ invalides.", "danger")
        return redirect(url_for('properties.property_calendar'))

    ok, err = check_apartment_availability(apt_id, check_in, check_out)
    if not ok:
        flash(err, "danger")
        return redirect(url_for('properties.property_calendar'))

    apt = Apartment.query.get_or_404(apt_id)
    client_u = User.query.get(client_id) if client_id else None
    if client_u and not guest_name:
        guest_name = client_u.real_name or client_u.username
    if client_u and not guest_phone:
        guest_phone = client_u.phone or '+237'
    if not client_u and (guest_name and guest_phone):
        client_u = _upsert_visitor_user(guest_name, guest_phone, apt.location, apt.city or 'Yaoundé', guest_email)

    nights = max(1, (check_out - check_in).days)
    formula = (request.form.get('rate_formula') or 'nightly').strip()
    if formula == 'monthly' and apt.monthly_rate:
        computed = round((apt.monthly_rate / 30.0) * nights)
    elif formula == 'weekly' and apt.weekly_rate:
        computed = round((apt.weekly_rate / 7.0) * nights)
    else:
        computed = round((apt.nightly_rate or 65000.0) * nights)
    computed += float(apt.cleaning_fee or 0.0)

    total_amount = request.form.get('total_amount', type=float) or computed
    deposit_paid = request.form.get('deposit_paid', 0.0, type=float) or 0.0
    ref = f"3M-STAY-{datetime.now().strftime('%y%m%d')}-{random.randint(100, 999)}"

    stay = ApartmentBooking(
        booking_ref=ref,
        apartment_id=apt.id,
        user_id=client_u.id if client_u else None,
        guest_name=guest_name or "Client Résidence VIP",
        guest_phone=guest_phone or "+237",
        guest_email=guest_email,
        check_in=check_in,
        check_out=check_out,
        guests_count=request.form.get('guests_count', 2, type=int) or 1,
        rate_formula=formula,
        total_amount=total_amount,
        deposit_paid=deposit_paid,
        security_deposit=float(apt.security_deposit or 0.0),
        payment_method=(request.form.get('payment_method') or 'momo').strip(),
        payment_status='paid' if deposit_paid >= total_amount else ('partial' if deposit_paid > 0 else 'pending'),
        status='checked_in' if check_in <= date.today() < check_out else 'confirmed',
        notes=(request.form.get('notes') or '').strip(),
    )
    db.session.add(stay)
    db.session.commit()

    recompute_apartment_live_status(apt)
    log_audit("APARTMENT_STAY_BOOKED", "ApartmentBooking", stay.id, f"Séjour {ref} réservé sur {apt.title} ({check_in} → {check_out}) — {total_amount:.0f} FCFA")
    flash(f"Séjour {ref} confirmé pour « {apt.title} » ({nights} nuit(s) — {total_amount:,.0f} FCFA). Dates bloquées sur le calendrier & site client !", "success")
    return redirect(url_for('properties.property_calendar'))


@properties_bp.route('/admin/properties/bookings/<int:bid>/status', methods=['POST'])
@login_required
def update_property_booking_status(bid):
    if not _admin_only():
        return redirect(url_for('main.index'))
    stay = ApartmentBooking.query.get_or_404(bid)
    new_st = (request.form.get('status') or '').strip()
    if new_st in ('confirmed', 'checked_in', 'checked_out', 'cancelled'):
        stay.status = new_st
        db.session.commit()
        if stay.apartment:
            recompute_apartment_live_status(stay.apartment)
        flash(f"Séjour {stay.booking_ref} passé à : {new_st}", "success")
    return redirect(url_for('properties.property_calendar'))


# ── PUBLIC API FOR WEBSITE APARTMENT RESERVATIONS (CORS) ──
@properties_bp.route('/api/public/apartment-bookings', methods=['POST', 'OPTIONS'])
def api_public_apartment_booking():
    if request.method == 'OPTIONS':
        resp = jsonify({'ok': True})
        resp.headers['Access-Control-Allow-Origin'] = '*'
        resp.headers['Access-Control-Allow-Headers'] = 'Content-Type'
        resp.headers['Access-Control-Allow-Methods'] = 'POST, OPTIONS'
        return resp, 200

    data = request.get_json(silent=True) or {}
    apt_id = (data.get('apartmentId') or '').strip()
    ci_str = (data.get('checkIn') or '')[:10]
    co_str = (data.get('checkOut') or '')[:10]
    guest_name = (data.get('guestName') or 'Client Site Web').strip()
    guest_phone = (data.get('guestPhone') or '').strip()

    try:
        check_in = datetime.strptime(ci_str, '%Y-%m-%d').date()
        check_out = datetime.strptime(co_str, '%Y-%m-%d').date()
    except ValueError:
        resp = jsonify({'ok': False, 'error': 'Veuillez choisir vos dates d\'arrivée et de départ.'})
        resp.headers['Access-Control-Allow-Origin'] = '*'
        return resp, 400

    ok, err = check_apartment_availability(apt_id, check_in, check_out)
    if not ok:
        resp = jsonify({'ok': False, 'error': err})
        resp.headers['Access-Control-Allow-Origin'] = '*'
        return resp, 409

    apt = Apartment.query.get(apt_id)
    nights = max(1, (check_out - check_in).days)
    total = round((apt.nightly_rate or 65000.0) * nights) + float(apt.cleaning_fee or 0.0)
    ref = f"3M-WEB-{datetime.now().strftime('%y%m%d')}-{random.randint(100, 999)}"

    stay = ApartmentBooking(
        booking_ref=ref,
        apartment_id=apt.id,
        guest_name=guest_name,
        guest_phone=guest_phone or '+237',
        guest_email=(data.get('guestEmail') or '').strip(),
        check_in=check_in,
        check_out=check_out,
        guests_count=int(data.get('guestsCount') or 2),
        total_amount=total,
        status='confirmed',
        notes=(data.get('notes') or 'Réservation en ligne site 3M Services').strip(),
    )
    db.session.add(stay)
    db.session.commit()
    recompute_apartment_live_status(apt)

    resp = jsonify({'ok': True, 'bookingRef': ref, 'nights': nights, 'totalAmount': total})
    resp.headers['Access-Control-Allow-Origin'] = '*'
    return resp, 201
