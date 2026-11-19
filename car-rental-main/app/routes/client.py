from functools import wraps
from flask import Blueprint, render_template, redirect, url_for, flash, request, current_app, session
from flask_login import login_required, current_user
from werkzeug.security import generate_password_hash, check_password_hash
from werkzeug.utils import secure_filename
from app import db
from app.models import User, Booking, Trip, Payment, SystemNotification
from datetime import datetime
import os

client = Blueprint('client', __name__, url_prefix='/client')

def client_role_required(f):
    @wraps(f)
    @login_required
    def decorated_function(*args, **kwargs):
        if current_user.role != 'client':
            flash('Accès refusé.', 'danger')
            return redirect(url_for('main.index'))
        return f(*args, **kwargs)
    return decorated_function

def catch_errors(f):
    from functools import wraps
    @wraps(f)
    def decorated(*args, **kwargs):
        try:
            return f(*args, **kwargs)
        except Exception as e:
            import traceback
            return f"<pre>3M SERVICES_VOYAGE_CRASH_REPORT:\n{traceback.format_exc()}</pre>", 500
    return decorated

@client.route('/profile', methods=['GET', 'POST'])
@client.route('/my-profile', methods=['GET', 'POST'])
@catch_errors
@client_role_required
def profile():
    def render_profile():
        from app.models import Parcel, Booking, SystemNotification
        bookings = Booking.query.filter_by(user_id=current_user.id).order_by(Booking.booking_date.desc().nulls_last()).all()
        confirmed_bookings = [b for b in bookings if b.status == 'confirmed']
        total_bookings = len(confirmed_bookings)
        parcels = Parcel.query.filter_by(user_id=current_user.id, payment_status='paid').all()
        total_spent = sum((b.price_paid or 0) for b in confirmed_bookings) + sum((p.price or 0) for p in parcels)
        recent_activities = SystemNotification.query.filter_by(user_id=current_user.id).order_by(SystemNotification.created_at.desc()).limit(5).all()
        
        return render_template(
            'client/profile.html',
            bookings=bookings,
            total_bookings=total_bookings,
            total_spent=total_spent,
            recent_activities=recent_activities,
            parcels=parcels
        )

    if request.method == 'POST':
        # 1. Update Personal & Contact Info if the main form was submitted (contains email)
        if 'email' in request.form:
            # 1a. Assign fields first so they are retained on error
            new_username = request.form.get('username')
            current_user.first_name = request.form.get('first_name')
            current_user.last_name = request.form.get('last_name')
            current_user.real_name = f"{current_user.first_name or ''} {current_user.last_name or ''}".strip()
            current_user.email = request.form.get('email')
            phone_val = request.form.get('phone')
            current_user.phone = phone_val
            current_user.gender = request.form.get('gender')
            current_user.address = request.form.get('address')
            current_user.city = request.form.get('city')
            current_user.country = request.form.get('country')
            current_user.language = request.form.get('language', 'en')
            session['lang'] = current_user.language
            
            # 1b. Validate username
            if new_username and new_username != current_user.username:
                existing_user = User.query.filter_by(username=new_username).first()
                if existing_user:
                    flash("Ce nom d'utilisateur est déjà utilisé par un autre compte.", 'danger')
                    return render_profile()
                current_user.username = new_username

            # 1c. Validate phone
            if phone_val:
                from app.utils.validators import is_valid_phone
                if not is_valid_phone(phone_val):
                    flash("Format de numéro de téléphone invalide (ne doit contenir que des chiffres et symboles +).", 'danger')
                    return render_profile()
            
            # 2. Date of Birth Parsing
            dob_str = request.form.get('date_of_birth')
            if dob_str:
                try:
                    current_user.date_of_birth = datetime.strptime(dob_str, '%Y-%m-%d').date()
                except ValueError:
                    try:
                        current_user.date_of_birth = datetime.strptime(dob_str, '%d/%m/%Y').date()
                    except ValueError:
                        pass
            else:
                current_user.date_of_birth = None
                
            # 3. Preferences (SMS/Email/Push)
            current_user.sms_notifications = True if request.form.get('sms_notifications') else False
            current_user.email_notifications = True if request.form.get('email_notifications') else False
            current_user.push_notifications = True if request.form.get('push_notifications') else False
            
            # Notification Category Preferences
            current_user.pref_booking = True if request.form.get('pref_booking') else False
            current_user.pref_parcel = True if request.form.get('pref_parcel') else False
            current_user.pref_financial = True if request.form.get('pref_financial') else False
            current_user.pref_shift = True if request.form.get('pref_shift') else False
            current_user.pref_system = True if request.form.get('pref_system') else False
            current_user.pref_marketing = True if request.form.get('pref_marketing') else False
            
            # 4. Emergency Contact Details
            current_user.emergency_contact_name = request.form.get('emergency_contact_name')
            current_user.emergency_contact_phone = request.form.get('emergency_contact_phone')
            current_user.emergency_contact_relationship = request.form.get('emergency_contact_relationship')
            
            # 5. Mobile Payment info (existing compatibility fields)
            momo_val = request.form.get('momo_number')
            orange_val = request.form.get('orange_number')
            
            from app.utils.validators import is_valid_cameroon_phone
            if momo_val and not is_valid_cameroon_phone(momo_val):
                flash("Le numéro MTN Mobile Money est invalide (doit contenir 9 chiffres et commencer par 6).", 'danger')
                return render_profile()
            if orange_val and not is_valid_cameroon_phone(orange_val):
                flash("Le numéro Orange Money est invalide (doit contenir 9 chiffres et commencer par 6).", 'danger')
                return render_profile()
                
            current_user.momo_number = momo_val
            current_user.orange_number = orange_val
            current_user.preferred_payment_method = request.form.get('preferred_payment_method')

        # 6. Profile Picture (Upload / Remove)
        if request.form.get('remove_profile_picture') == 'true':
            current_user.profile_picture = None
        elif 'profile_picture' in request.files:
            file = request.files['profile_picture']
            if file and file.filename:
                import base64
                img_bytes = file.read()
                if len(img_bytes) > 3 * 1024 * 1024:
                    flash('La photo est trop volumineuse (max 3 Mo). Veuillez choisir une image plus petite.', 'danger')
                    return render_profile()
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

        # 7. Security Settings: Password Change
        current_password = request.form.get('current_password')
        new_password = request.form.get('new_password')
        confirm_password = request.form.get('confirm_password')
        if current_password and new_password:
            if not current_user.password_hash or not check_password_hash(current_user.password_hash, current_password):
                flash('Le mot de passe actuel est incorrect.', 'danger')
                return render_profile()
            
            from app.utils.validators import is_valid_password
            if not is_valid_password(new_password):
                flash('Le nouveau mot de passe doit contenir au moins 8 caractères, 1 minuscule, 1 chiffre et 1 caractère spécial.', 'danger')
                return render_profile()
                
            if new_password != confirm_password:
                flash('Les nouveaux mots de passe ne correspondent pas.', 'danger')
                return render_profile()
            current_user.password_hash = generate_password_hash(new_password, method='pbkdf2:sha256')

        db.session.commit()
        flash('Profil mis à jour avec succès.', 'success')
        return redirect(url_for('client.profile'))

    return render_profile()

@client.route('/my_bookings')
@client_role_required
def my_bookings():
    return redirect(url_for('main.my_bookings') + '#pills-upcoming')

@client.route('/my_tickets')
@client_role_required
def my_tickets():
    return redirect(url_for('main.my_bookings') + '#pills-upcoming')

@client.route('/payments')
@client_role_required
def payments():
    return redirect(url_for('main.my_bookings') + '#pills-refunds')

@client.route('/settings')
@client_role_required
def settings():
    return redirect(url_for('client.profile') + '#tab-personal')

@client.route('/notifications')
@client_role_required
def notifications():
    query = SystemNotification.query.filter_by(user_id=current_user.id, is_deleted=False)
    
    # Filters
    status_param = request.args.get('status', 'unread') # default 'unread'
    if status_param == 'unread':
        query = query.filter_by(is_read=False, is_archived=False)
    elif status_param == 'read':
        query = query.filter_by(is_read=True, is_archived=False)
    elif status_param == 'archived':
        query = query.filter_by(is_archived=True)
    elif status_param == 'all':
        query = query.filter_by(is_archived=False)
        
    category_param = request.args.get('category')
    if category_param:
        query = query.filter_by(category=category_param)
        
    type_param = request.args.get('type') # info, success, warning, danger
    if type_param:
        query = query.filter_by(type=type_param)
        
    date_param = request.args.get('date')
    if date_param:
        try:
            parsed_date = datetime.strptime(date_param, '%Y-%m-%d').date()
            from sqlalchemy import func
            query = query.filter(func.date(SystemNotification.created_at) == parsed_date)
        except ValueError:
            pass
            
    notifs = query.order_by(SystemNotification.created_at.desc()).all()
    
    return render_template(
        'client/notifications.html',
        notifications=notifs,
        selected_status=status_param,
        selected_category=category_param,
        selected_type=type_param,
        selected_date=date_param
    )

@client.route('/notifications/<int:id>/read', methods=['GET', 'POST'])
@client_role_required
def read_notification(id):
    notif = SystemNotification.query.filter_by(id=id, user_id=current_user.id).first_or_404()
    notif.is_read = True
    db.session.commit()
    flash("Notification marquée comme lue.", "success")
    return redirect(url_for('client.notifications'))

@client.route('/notifications/read-all', methods=['POST'])
@client_role_required
def read_all_notifications():
    notifs = SystemNotification.query.filter_by(user_id=current_user.id, is_read=False, is_archived=False, is_deleted=False).all()
    for notif in notifs:
        notif.is_read = True
    db.session.commit()
    flash("Toutes vos notifications ont été marquées comme lues.", "success")
    return redirect(url_for('client.notifications'))

@client.route('/notifications/<int:id>/archive', methods=['POST'])
@client_role_required
def archive_notification(id):
    notif = SystemNotification.query.filter_by(id=id, user_id=current_user.id).first_or_404()
    notif.is_archived = True
    db.session.commit()
    flash("Notification archivée.", "success")
    return redirect(url_for('client.notifications'))

@client.route('/notifications/<int:id>/delete', methods=['POST'])
@client_role_required
def delete_notification(id):
    notif = SystemNotification.query.filter_by(id=id, user_id=current_user.id).first_or_404()
    notif.is_deleted = True
    db.session.commit()
    flash("Notification supprimée.", "success")
    return redirect(url_for('client.notifications'))

@client.route('/support')
@client_role_required
def support():
    return redirect(url_for('client.profile') + '#tab-emergency')

@client.route('/delete-account', methods=['POST'])
@client_role_required
def delete_account():
    user = current_user
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

    db.session.commit()
    from flask_login import logout_user
    logout_user()
    flash("Votre compte a été supprimé. Vous pouvez créer un nouveau compte si vous le souhaitez.", "success")
    return jsonify({"success": True})
