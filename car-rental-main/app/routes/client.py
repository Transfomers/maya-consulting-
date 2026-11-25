from functools import wraps
from flask import Blueprint, render_template, redirect, url_for, flash, request, current_app, session, jsonify
from flask_login import login_required, current_user
from werkzeug.security import generate_password_hash, check_password_hash
from werkzeug.utils import secure_filename
from app import db
from app.models import User, Booking, Trip, Payment, SystemNotification, Bus, Route
from datetime import datetime
import os
import json

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

        # Synchronize updated client profile with server/data/db.json
        try:
            db_path = current_app.config['EXPRESS_DB_JSON']
            if os.path.exists(db_path):
                with open(db_path, 'r', encoding='utf-8') as f:
                    exp_db = json.load(f)
                
                # Update or insert into customers
                customers = exp_db.get('customers', [])
                full_name = f"{current_user.first_name or ''} {current_user.last_name or ''}".strip() or current_user.username
                cust = next((c for c in customers if c.get('id') == f"CLI-{current_user.id}" or c.get('email') == current_user.email or (current_user.phone and c.get('phone') == current_user.phone)), None)
                if cust:
                    cust['fullName'] = full_name
                    cust['firstName'] = current_user.first_name or ''
                    cust['lastName'] = current_user.last_name or ''
                    cust['phone'] = current_user.phone or ''
                    cust['email'] = current_user.email or ''
                    cust['address'] = current_user.address or ''
                    cust['city'] = current_user.city or ''
                else:
                    new_cust = {
                        'id': f"CLI-{current_user.id}",
                        'fullName': full_name,
                        'firstName': current_user.first_name or '',
                        'lastName': current_user.last_name or '',
                        'phone': current_user.phone or '',
                        'email': current_user.email or '',
                        'address': current_user.address or '',
                        'city': current_user.city or 'Yaoundé',
                        'createdAt': datetime.now().isoformat()
                    }
                    customers.append(new_cust)
                    exp_db['customers'] = customers

                # Also update client info in chats if thread exists
                chats = exp_db.get('chats', [])
                client_id_tag = f"CLI-{current_user.id}"
                client_chat = next((c for c in chats if c.get('id') == client_id_tag or c.get('clientId') == client_id_tag or (current_user.phone and current_user.phone in (c.get('clientPhone') or '')) or (current_user.email and current_user.email == c.get('clientEmail')) or c.get('clientId') == current_user.username), None)
                if client_chat:
                    client_chat['clientName'] = full_name
                    if current_user.phone:
                        client_chat['clientPhone'] = current_user.phone
                    if current_user.email:
                        client_chat['clientEmail'] = current_user.email

                with open(db_path, 'w', encoding='utf-8') as f:
                    json.dump(exp_db, f, indent=2, ensure_ascii=False)
        except Exception as e:
            current_app.logger.warning(f"Error syncing client profile to db.json: {e}")

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


# ==========================================
# STANDALONE CLIENT CHAT (MESSAGERIE VIP)
# ==========================================

def _get_client_chat_thread(user):
    """Helper to retrieve or initialize chat thread in server/data/db.json"""
    db_path = current_app.config['EXPRESS_DB_JSON']
    if not os.path.exists(db_path):
        return None, None
    with open(db_path, 'r', encoding='utf-8') as f:
        exp_db = json.load(f)
    
    chats = exp_db.get('chats', [])
    client_tag = f"CLI-{user.id}"
    full_name = f"{user.first_name or ''} {user.last_name or ''}".strip() or user.username
    user_phone = user.phone or ''
    user_email = user.email or ''
    
    chat_thread = next((c for c in chats if c.get('id') == client_tag or c.get('clientId') == client_tag or (user_phone and user_phone in (c.get('clientPhone') or '')) or (user_email and user_email == c.get('clientEmail')) or c.get('clientId') == user.username), None)
    
    if not chat_thread:
        now_iso = datetime.now().isoformat()
        chat_thread = {
            'id': client_tag,
            'clientId': client_tag,
            'clientName': full_name,
            'clientPhone': user_phone,
            'clientEmail': user_email,
            'unreadAdmin': 0,
            'unreadClient': 0,
            'createdAt': now_iso,
            'lastMessage': "Bienvenue sur le service de conciergerie VIP 3M SERVICES.",
            'lastMessageAt': now_iso,
            'messages': [
                {
                    'id': f"msg_welcome_{int(datetime.now().timestamp()*1000)}",
                    'text': f"Bonjour {full_name} ! Bienvenue sur votre Espace Chat Privé 3M SERVICES. Notre conciergerie VIP est à votre écoute pour organiser vos déplacements haut de gamme, réservations de résidences à Tsinga ou assignations de chauffeurs d'élite. En quoi pouvons-nous vous assister aujourd'hui ?",
                    'sender': 'admin',
                    'time': datetime.now().strftime('%H:%M'),
                    'timestamp': now_iso,
                    'read': True
                }
            ]
        }
        chats.insert(0, chat_thread)
        exp_db['chats'] = chats
        with open(db_path, 'w', encoding='utf-8') as f:
            json.dump(exp_db, f, indent=2, ensure_ascii=False)
            
    return exp_db, chat_thread


@client.route('/chat')
@catch_errors
@client_role_required
def chat():
    exp_db, chat_thread = _get_client_chat_thread(current_user)
    if chat_thread and exp_db:
        # Mark as read for client
        chat_thread['unreadClient'] = 0
        db_path = current_app.config['EXPRESS_DB_JSON']
        try:
            with open(db_path, 'w', encoding='utf-8') as f:
                json.dump(exp_db, f, indent=2, ensure_ascii=False)
        except Exception as e:
            current_app.logger.warning(f"Error marking chat read: {e}")

    client_tag = f"CLI-{current_user.id}"
    full_name = f"{current_user.first_name or ''} {current_user.last_name or ''}".strip() or current_user.username
    
    # Also load active fleet vehicles for optional quick inquiry attachment
    available_buses = Bus.query.filter_by(is_deleted=False).all()

    return render_template(
        'client/chat.html',
        chat_thread=chat_thread,
        client_tag=client_tag,
        client_name=full_name,
        client_phone=current_user.phone or '',
        client_email=current_user.email or '',
        available_buses=available_buses
    )


@client.route('/api/chat/messages', methods=['GET'])
@client_role_required
def api_chat_messages():
    exp_db, chat_thread = _get_client_chat_thread(current_user)
    if not chat_thread:
        return jsonify({'success': False, 'error': 'Discussion introuvable'}), 404
        
    chat_thread['unreadClient'] = 0
    db_path = current_app.config['EXPRESS_DB_JSON']
    try:
        with open(db_path, 'w', encoding='utf-8') as f:
            json.dump(exp_db, f, indent=2, ensure_ascii=False)
    except Exception:
        pass
        
    return jsonify({
        'success': True,
        'chat': chat_thread
    })


@client.route('/api/chat/send', methods=['POST'])
@client_role_required
def api_chat_send():
    data = request.get_json(silent=True) or request.form
    text = (data.get('text') or '').strip()
    if not text:
        return jsonify({'success': False, 'error': 'Message vide'}), 400

    exp_db, chat_thread = _get_client_chat_thread(current_user)
    if not chat_thread:
        return jsonify({'success': False, 'error': 'Chat introuvable'}), 404

    now = datetime.now()
    now_iso = now.isoformat()
    msg_id = f"msg_{int(now.timestamp()*1000)}"
    new_msg = {
        'id': msg_id,
        'text': text,
        'sender': 'client',
        'time': now.strftime('%H:%M'),
        'timestamp': now_iso,
        'read': False
    }

    attached_car = data.get('attachedCar')
    if attached_car:
        new_msg['attachedCar'] = attached_car

    chat_thread['messages'] = chat_thread.get('messages', [])
    chat_thread['messages'].append(new_msg)
    chat_thread['lastMessage'] = text
    chat_thread['lastMessageAt'] = now_iso
    chat_thread['unreadAdmin'] = chat_thread.get('unreadAdmin', 0) + 1
    chat_thread['unreadClient'] = 0

    db_path = current_app.config['EXPRESS_DB_JSON']
    with open(db_path, 'w', encoding='utf-8') as f:
        json.dump(exp_db, f, indent=2, ensure_ascii=False)

    return jsonify({'success': True, 'message': new_msg})


@client.route('/api/chat/edit/<msg_id>', methods=['POST'])
@client_role_required
def api_chat_edit(msg_id):
    data = request.get_json(silent=True) or request.form
    text = (data.get('text') or '').strip()
    if not text:
        return jsonify({'success': False, 'error': 'Texte vide'}), 400

    exp_db, chat_thread = _get_client_chat_thread(current_user)
    if not chat_thread:
        return jsonify({'success': False, 'error': 'Discussion introuvable'}), 404

    msg = next((m for m in chat_thread.get('messages', []) if m.get('id') == msg_id and m.get('sender') == 'client'), None)
    if not msg:
        return jsonify({'success': False, 'error': 'Message introuvable ou non autorisé'}), 404

    msg['text'] = text
    msg['edited'] = True
    msg['editedAt'] = datetime.now().isoformat()
    chat_thread['lastMessage'] = text

    db_path = current_app.config['EXPRESS_DB_JSON']
    with open(db_path, 'w', encoding='utf-8') as f:
        json.dump(exp_db, f, indent=2, ensure_ascii=False)

    return jsonify({'success': True, 'message': msg})


@client.route('/api/chat/delete/<msg_id>', methods=['POST'])
@client_role_required
def api_chat_delete(msg_id):
    exp_db, chat_thread = _get_client_chat_thread(current_user)
    if not chat_thread:
        return jsonify({'success': False, 'error': 'Discussion introuvable'}), 404

    msg = next((m for m in chat_thread.get('messages', []) if m.get('id') == msg_id and m.get('sender') == 'client'), None)
    if not msg:
        return jsonify({'success': False, 'error': 'Message introuvable ou non autorisé'}), 404

    chat_thread['messages'] = [m for m in chat_thread.get('messages', []) if m.get('id') != msg_id]
    if chat_thread['messages']:
        chat_thread['lastMessage'] = chat_thread['messages'][-1].get('text', '')
        chat_thread['lastMessageAt'] = chat_thread['messages'][-1].get('timestamp', datetime.now().isoformat())
    else:
        chat_thread['lastMessage'] = "Aucun message"

    db_path = current_app.config['EXPRESS_DB_JSON']
    with open(db_path, 'w', encoding='utf-8') as f:
        json.dump(exp_db, f, indent=2, ensure_ascii=False)

    return jsonify({'success': True})


@client.route('/api/chat/clear', methods=['POST'])
@client_role_required
def api_chat_clear():
    exp_db, chat_thread = _get_client_chat_thread(current_user)
    if not chat_thread:
        return jsonify({'success': False, 'error': 'Discussion introuvable'}), 404

    chat_thread['messages'] = []
    chat_thread['lastMessage'] = "Discussion réinitialisée par le client"
    chat_thread['lastMessageAt'] = datetime.now().isoformat()
    chat_thread['unreadAdmin'] = 0
    chat_thread['unreadClient'] = 0

    db_path = current_app.config['EXPRESS_DB_JSON']
    with open(db_path, 'w', encoding='utf-8') as f:
        json.dump(exp_db, f, indent=2, ensure_ascii=False)

    return jsonify({'success': True})


@client.route('/api/chat/typing', methods=['POST'])
@client_role_required
def api_chat_typing():
    return jsonify({'success': True})
