from flask import Blueprint, render_template, redirect, url_for, flash, request, session
from flask_login import login_user, logout_user, login_required, current_user
from werkzeug.security import generate_password_hash, check_password_hash
from app.models import User
from app import db
import os
from flask import current_app
from itsdangerous import URLSafeTimedSerializer, SignatureExpired, BadSignature

from urllib.parse import quote_plus, urlencode
from app import oauth

auth = Blueprint('auth', __name__)

@auth.route('/auth0-login')
def auth0_login():
    auth0_client = oauth.create_client('auth0')
    if not auth0_client:
        flash("La connexion Auth0 n'est pas configurée. Utilisez votre email et mot de passe.", "warning")
        return redirect(url_for('auth.login'))
    kwargs = {}
    if request.args.get('screen_hint') == 'signup':
        kwargs['screen_hint'] = 'signup'
    return auth0_client.authorize_redirect(
        redirect_uri=url_for('auth.callback', _external=True),
        **kwargs
    )

@auth.route('/callback', methods=['GET', 'POST'])
def callback():
    auth0_client = oauth.create_client('auth0')
    if not auth0_client:
        flash("La connexion Auth0 n'est pas configurée.", "warning")
        return redirect(url_for('auth.login'))
    try:
        token = auth0_client.authorize_access_token()
        userinfo = token.get('userinfo')
    except Exception as e:
        import logging
        logging.error(f"Auth0 callback failed: {e}")
        flash("La connexion a échoué. Veuillez réessayer.", "danger")
        return redirect(url_for('auth.login'))

    if userinfo:
        auth0_id = userinfo.get('sub')
        email = userinfo.get('email', '').lower()
        
        # 1. Look for existing user by auth0_id
        user = User.query.filter_by(auth0_id=auth0_id).first()
        
        # 2. If not found, look for existing user by email
        if not user and email:
            user = User.query.filter_by(email=email).first()
            if user:
                # Link account
                user.auth0_id = auth0_id
                db.session.commit()
                
        # 3. If still not found, create new user
        if not user:
            # Generate a unique username
            base_username = userinfo.get('nickname') or userinfo.get('name') or email.split('@')[0]
            username = base_username
            counter = 1
            while User.query.filter_by(username=username).first():
                username = f"{base_username}{counter}"
                counter += 1
                
            user = User(
                username=username,
                email=email,
                auth0_id=auth0_id,
                is_verified=userinfo.get('email_verified', False),
                real_name=userinfo.get('name'),
                profile_picture=userinfo.get('picture', 'img/default_avatar.svg')
            )
            db.session.add(user)
            db.session.commit()
            
            # Record Privacy Acceptance if it's a new user
            from app.models import PrivacyAcceptance
            ip_addr = request.remote_addr or '0.0.0.0'
            user_agent = request.headers.get('User-Agent', 'unknown')
            acceptance = PrivacyAcceptance(user_id=user.id, accepted=True, ip_address=ip_addr, user_agent=user_agent)
            db.session.add(acceptance)
            db.session.commit()
            
            # Send welcome email
            from app.services.email_service import send_welcome_email
            try:
                send_welcome_email(user)
            except Exception as e:
                import logging
                logging.error(f"Failed to send welcome email: {e}")

        login_user(user, remember=True)
        session['lang'] = request.cookies.get('lang', 'fr') # Or whatever logic
        return redirect(url_for('main.index'))
        
    flash("Impossible de récupérer les informations de l'utilisateur.", "danger")
    return redirect(url_for('auth.login'))

@auth.route('/auth0-logout')
def auth0_logout():
    logout_user()
    session.clear()
    
    domain = os.environ.get('AUTH0_DOMAIN')
    client_id = os.environ.get('AUTH0_CLIENT_ID')
    
    if domain and client_id:
        return redirect(
            f"https://{domain}/v2/logout?"
            + urlencode(
                {
                    "returnTo": url_for("main.index", _external=True),
                    "client_id": client_id,
                },
                quote_via=quote_plus,
            )
        )
    return redirect(url_for('main.index'))
@auth.route('/register', methods=['GET', 'POST'])
def register():
    if current_user.is_authenticated:
        return redirect(url_for('main.index'))
    
    form_data = {}  # carry data back to form on error

    if request.method == 'POST':
        username        = request.form.get('username', '').strip()
        email           = request.form.get('email', '').strip().lower()
        phone_code      = request.form.get('phone_code', '+237').strip()
        phone_number    = request.form.get('phone_number', '').strip()
        password        = request.form.get('password', '')
        confirm_password = request.form.get('confirm_password', '')

        # Combine country code + number into one field
        phone = f"{phone_code}{phone_number}" if phone_number else ''

        # Preserve form values so the user doesn't have to retype everything
        form_data = {
            'username': username,
            'email': email,
            'phone_code': phone_code,
            'phone_number': phone_number,
        }

        errors = []

        # --- Field validation ---
        from app.utils.validators import is_valid_email, is_valid_cameroon_phone, is_valid_phone, is_valid_password
        import re
        if not username or not (3 <= len(username) <= 50) or not re.match(r'^[a-zA-ZÀ-ÿ]+( [a-zA-ZÀ-ÿ]+)*$', username):
            errors.append(('username', "Le nom et prénom doit contenir uniquement des lettres et des espaces simples (3 à 50 caractères)."))

        if not is_valid_email(email):
            errors.append(('email', "Veuillez entrer une adresse email valide."))

        if not phone_number and phone_number != "000000":
            errors.append(('phone', "Veuillez entrer votre numéro de téléphone (sans l'indicatif)."))
        elif phone_code == '+237' or phone_code == '237':
            if phone_number != "000000" and not is_valid_cameroon_phone(phone_number):
                errors.append(('phone', "Format de numéro camerounais invalide (doit contenir 9 chiffres et commencer par 6 ou 2)."))
        elif phone_number != "000000" and not is_valid_phone(phone_number):
            errors.append(('phone', "Le numéro doit contenir entre 6 et 15 chiffres (sans l'indicatif)."))

        if not is_valid_password(password, username=username, email=email):
            errors.append(('password', "Le mot de passe doit contenir au moins 8 caractères, 1 minuscule, 1 chiffre et 1 caractère spécial."))

        # --- Uniqueness checks ---
        if not errors or not any(k == 'username' for k, _ in errors):
            if User.query.filter_by(username=username).first():
                errors.append(('username', f"Le nom d'utilisateur « {username} » est déjà pris. Choisissez-en un autre."))

        if not errors or not any(k == 'email' for k, _ in errors):
            if User.query.filter_by(email=email).first():
                errors.append(('email', f"L'adresse email {email} est déjà enregistrée. Connectez-vous ou utilisez une autre adresse."))

        if errors:
            has_conflict = any(k in ['username', 'email'] for k, _ in errors)
            status_code = 409 if has_conflict else 422
            for field, msg in errors:
                flash(f"<strong>{field.upper()} :</strong> {msg}", 'danger')
            return render_template('auth/register.html', form_data=form_data), status_code

        # --- Verify Firebase Token ---
        id_token = request.form.get('id_token')
        firebase_uid = None
        if id_token:
            import firebase_admin
            from firebase_admin import auth as firebase_auth
            try:
                decoded_token = firebase_auth.verify_id_token(id_token)
                firebase_uid = decoded_token['uid']
            except Exception as e:
                import logging
                logging.error(f"Firebase token verification failed in register: {e}")
                flash(f"Échec de la validation du compte Firebase: {e}", 'danger')
                return render_template('auth/register.html', form_data=form_data), 422
        else:
            flash("Erreur de connexion Firebase. Veuillez réessayer.", 'danger')
            return render_template('auth/register.html', form_data=form_data), 422

        # --- Determine language ---
        lang_pref = request.form.get('language', 'fr')
        if lang_pref not in ('fr', 'en'):
            lang_pref = 'fr'

        # --- Create user ---
        is_firebase = bool(firebase_uid)
        new_user = User(
            username=username,
            email=email,
            phone=phone,
            role='client',
            language=lang_pref,
            password_hash=generate_password_hash(password, method='pbkdf2:sha256') if password else 'firebase_managed',
            firebase_uid=firebase_uid,
            is_verified=is_firebase, # True if verified by Firebase, False for standard register
            profile_picture='img/default_avatar.svg' # Default avatar
        )

        db.session.add(new_user)
        db.session.commit()

        # Record Privacy & Terms Acceptance
        from app.models import PrivacyAcceptance
        ip_addr    = request.remote_addr or '0.0.0.0'
        user_agent = request.headers.get('User-Agent', 'unknown')
        acceptance = PrivacyAcceptance(user_id=new_user.id, accepted=True, ip_address=ip_addr, user_agent=user_agent)
        db.session.add(acceptance)
        db.session.commit()

        if is_firebase:
            # Log the user in directly if Firebase verified
            login_user(new_user, remember=True)
            session['lang'] = lang_pref
            from app.services.email_service import send_welcome_email
            send_welcome_email(new_user)
            flash('Votre compte a été créé avec succès ! Bienvenue.', 'success')
            return redirect(url_for('main.index'))
        else:
            # Generate and send OTP for verification
            from app.services.otp_service import send_otp_email
            try:
                send_otp_email(new_user, 'email_verification')
                flash('Un code de vérification a été envoyé à votre adresse e-mail.', 'info')
            except Exception as e:
                db.session.rollback()
                flash(f'Le compte a été créé, mais l\'envoi de l\'e-mail de vérification a échoué: {e}', 'warning')
            return redirect(url_for('auth.verify_otp', email=new_user.email))

    return render_template('auth/register.html', form_data=form_data)


@auth.route('/verify-otp', methods=['GET', 'POST'])
def verify_otp():
    # Handle JSON API request
    if request.is_json or request.headers.get('Content-Type') == 'application/json':
        from flask import jsonify
        data = request.get_json() or {}
        email = data.get('email', '').strip().lower()
        code = data.get('otp', '').strip()
        purpose = data.get('purpose', 'email_verification').strip()
        
        if not email or not code:
            return jsonify({"success": False, "message": "Email and OTP are required."}), 400
            
        user = User.query.filter_by(email=email).first()
        if not user:
            return jsonify({"success": False, "message": "User not found."}), 404
            
        from app.services.otp_service import verify_otp
        success, message = verify_otp(user, code, purpose)
        if success:
            if purpose == 'email_verification':
                user.is_verified = True
                db.session.commit()
            return jsonify({"success": True, "message": message}), 200
        else:
            return jsonify({"success": False, "message": message}), 400

    # Handle standard HTML flow
    email = request.args.get('email')
    if not email:
        flash("Email manquant pour la vérification.", "danger")
        return redirect(url_for('auth.login'))

    # Mask email for privacy (e.g. n••••••@gmail.com)
    masked_email = email
    if '@' in email:
        local, domain = email.split('@', 1)
        if len(local) > 1:
            masked_email = local[0] + "•" * (len(local) - 1) + "@" + domain
        else:
            masked_email = local + "•@" + domain
        
    if request.method == 'POST':
        code = request.form.get('otp_code', '').strip()
        if not code or len(code) != 6:
            flash("Veuillez saisir un code à 6 chiffres valide.", "danger")
            return redirect(url_for('auth.verify_otp', email=email))
            
        user = User.query.filter_by(email=email).first()
        if not user:
            flash("Utilisateur introuvable.", "danger")
            return redirect(url_for('auth.login'))
            
        from app.services.otp_service import verify_otp
        success, message = verify_otp(user, code, 'email_verification')
        if success:
            user.is_verified = True
            db.session.commit()
            
            login_user(user, remember=True)
            session['lang'] = user.language if user.language else 'fr'
            flash('Votre compte a été vérifié avec succès ! Bienvenue.', 'success')
            
            if user.role == 'teller':
                return redirect(url_for('admin.teller_dashboard'))
            if user.role == 'finance_officer':
                return redirect(url_for('admin.finance'))
            if user.role in ['super_admin', 'admin_agence']:
                return redirect(url_for('admin.dashboard'))
            return redirect(url_for('main.index'))
        else:
            flash(message, "danger")
            return redirect(url_for('auth.verify_otp', email=email))
            
    return render_template('auth/verify_otp.html', email=email, masked_email=masked_email)


def _safe_next(target):
    """N'accepte qu'un chemin relatif interne (évite les redirections ouvertes)."""
    if not target or not target.startswith('/') or target.startswith('//') or '\\' in target:
        return None
    return target


def _login_page(error=None, status=200):
    return render_template(
        'auth/login.html',
        error=error,
        username=request.form.get('username', '').strip(),
        remember=bool(request.form.get('remember')),
        next_url=_safe_next(request.form.get('next') or request.args.get('next')) or '',
    ), status


@auth.route('/login', methods=['GET', 'POST'])
def login():
    if current_user.is_authenticated:
        # Redirect based on role
        if current_user.role == 'teller':
            return redirect(url_for('admin.teller_dashboard'))
        if current_user.role == 'finance_officer':
            return redirect(url_for('admin.finance'))
        if current_user.role in ['super_admin', 'admin_agence']:
            return redirect(url_for('admin.dashboard'))
        return redirect(url_for('main.index'))
    
    if request.method == 'POST':
        try:
            id_token = (request.form.get('id_token') or '').strip()
            username = request.form.get('username', '').strip()
            password = request.form.get('password', '')
            user = None

            if id_token:
                try:
                    import firebase_admin
                    from firebase_admin import auth as firebase_auth
                    decoded_token = firebase_auth.verify_id_token(id_token)
                    uid = decoded_token['uid']
                    email = decoded_token.get('email')

                    user = User.query.filter_by(firebase_uid=uid).first()
                    if not user and email:
                        user = User.query.filter(db.func.lower(User.email) == email.lower()).first()
                        if user:
                            user.firebase_uid = uid
                            db.session.commit()
                        else:
                            user = User(
                                email=email,
                                username=email.split('@')[0],
                                firebase_uid=uid,
                                role='client',
                                is_verified=True,
                                password_hash='firebase_managed'
                            )
                            db.session.add(user)
                            db.session.commit()
                except Exception as e:
                    current_app.logger.warning(f"Firebase token verification failed in login: {e}")
                    if not (username and password):
                        return _login_page("La connexion via Google/Firebase a échoué. Réessayez ou utilisez votre mot de passe.", 401)
                    user = None

            if not user:
                # Standard local login (Admins/Tellers/Clients via password)
                if not username or not password:
                    return _login_page("Saisissez votre email (ou nom d'utilisateur) et votre mot de passe.", 400)
                user = User.query.filter(
                    (db.func.lower(User.username) == username.lower()) |
                    (db.func.lower(User.email) == username.lower())
                ).first()
                from werkzeug.security import check_password_hash
                if not user or not user.password_hash or not check_password_hash(user.password_hash, password):
                    return _login_page("Email/nom d'utilisateur ou mot de passe incorrect.", 401)
                    
                # Email verification check disabled for testing
                # if not getattr(user, 'is_verified', False):
                #     from app.services.otp_service import send_otp_email
                #     try:
                #         send_otp_email(user, 'email_verification')
                #         flash("Veuillez d'abord vérifier votre adresse e-mail. Un nouveau code OTP vous a été envoyé.", "info")
                #     except Exception as e:
                #         flash("Veuillez d'abord vérifier votre adresse e-mail. Échec de l'envoi du code OTP.", "warning")
                #     return redirect(url_for('auth.verify_otp', email=user.email))
                    
            if getattr(user, 'is_deleted', False):
                return _login_page('Ce compte a été supprimé.', 403)

            if getattr(user, 'is_suspended', False):
                return _login_page('Ce compte a été suspendu. Veuillez contacter le support.', 403)

            login_user(user, remember=bool(request.form.get('remember')))
            session['lang'] = user.language if user.language else 'fr'
        
            # Record device log (user agent + IP)
            from app.models import DeviceLog
            user_agent = request.headers.get('User-Agent', 'unknown')[:120]
            ip_addr = request.remote_addr or '0.0.0.0'
            device = DeviceLog(user_id=user.id, device_name=user_agent, ip_address=ip_addr)
            db.session.add(device)
            db.session.commit()

            # Assign generic avatar based on gender if none
            if not user.profile_picture:
                if user.gender in ['Femme', 'Female', 'F']:
                    user.profile_picture = 'default_female.png'
                else:
                    user.profile_picture = 'default_male.png'
                db.session.commit()

            flash(f'Bon retour, {user.username} ! Vous êtes connecté. 👋', 'success')

            # Role-based redirection
            next_page = _safe_next(request.form.get('next') or request.args.get('next'))
            if next_page:
                return redirect(next_page)
            
            if user.role == 'teller':
                return redirect(url_for('auth.login_success', next=url_for('admin.teller_dashboard')))
            if user.role == 'finance_officer':
                return redirect(url_for('auth.login_success', next=url_for('admin.finance')))
            if user.role in ['super_admin', 'admin_agence']:
                return redirect(url_for('auth.login_success', next=url_for('admin.dashboard')))
            return redirect(url_for('auth.login_success', next=next_page if next_page else url_for('main.index')))
            
        except Exception:
            db.session.rollback()
            current_app.logger.exception("Erreur lors de la connexion")
            return _login_page("Une erreur est survenue pendant la connexion. Réessayez dans un instant.", 500)

    return _login_page()

@auth.route('/logout')
@login_required
def logout():
    logout_user()
    flash('Vous avez été déconnecté avec succès. À bientôt ! 👋', 'success')
    return redirect(url_for('auth.login'))

@auth.route('/forgot-password', methods=['GET', 'POST'])
def forgot_password():
    from flask import jsonify
    
    if current_user.is_authenticated:
        if request.method == 'POST':
            return jsonify({"error": "Already authenticated"}), 400
        return redirect(url_for('main.index'))
    
    if request.method == 'POST':
        if request.is_json:
            email = request.json.get('email', '').strip().lower()
        else:
            email = request.form.get('email', '').strip().lower()
            
        if not email:
            return jsonify({"error": "L'adresse email est requise."}), 400
            
        user = User.query.filter_by(email=email).first()
        
        if user:
            from app.services.otp_service import send_otp_email, OTPRateLimitError
            try:
                send_otp_email(user, 'password_reset')
            except OTPRateLimitError as e:
                return jsonify({"error": str(e)}), 429
            except Exception as e:
                db.session.rollback()
                return jsonify({"error": f"Échec de l'envoi du code OTP: {str(e)}"}), 500
            
        return jsonify({
            "message": "Si un compte est associé à cet email, un code de réinitialisation a été envoyé.",
            "redirect": url_for('auth.reset_password_otp', email=email)
        }), 200
    
    return render_template('auth/forgot_password.html')

@auth.route('/reset-password-otp', methods=['GET', 'POST'])
def reset_password_otp():
    email = request.args.get('email')
    if not email:
        flash("Email manquant pour la réinitialisation.", "danger")
        return redirect(url_for('auth.login'))
        
    if request.method == 'POST':
        code = request.form.get('otp_code', '').strip()
        password = request.form.get('password')
        confirm_password = request.form.get('confirm_password')
        
        if not code or len(code) != 6:
            flash("Veuillez saisir le code à 6 chiffres.", "danger")
            return redirect(url_for('auth.reset_password_otp', email=email))
            
        user = User.query.filter_by(email=email).first()
        if not user:
            flash("Utilisateur introuvable.", "danger")
            return redirect(url_for('auth.login'))
            
        from app.utils.validators import is_valid_password
        if not is_valid_password(password, username=user.username, email=user.email):
            flash("Le mot de passe doit contenir au moins 8 caractères, 1 minuscule, 1 chiffre, 1 caractère spécial, et ne pas inclure le nom d'utilisateur ou l'email.", "danger")
            return redirect(url_for('auth.reset_password_otp', email=email))
            
        if password != confirm_password:
            flash("Les mots de passe ne correspondent pas.", "danger")
            return redirect(url_for('auth.reset_password_otp', email=email))
            

            
        from app.services.otp_service import verify_otp
        success, message = verify_otp(user, code, 'password_reset')
        if not success:
            flash(message, "danger")
            return redirect(url_for('auth.reset_password_otp', email=email))
            
        user.set_password(password)
        db.session.commit()
        
        flash("Votre mot de passe a été réinitialisé avec succès.", "success")
        return redirect(url_for('auth.login'))
        
    return render_template('auth/reset_password_otp.html', email=email)

from app.models import Booking, Trip, AuditLog, User, SystemNotification, db
from sqlalchemy import func

@auth.route('/profile', methods=['GET', 'POST'])
@login_required
def profile():
    if current_user.role == 'client':
        return redirect(url_for('client.profile'))
    
    import json
    
    if request.method == 'POST':
        action = request.form.get('action')
        
        # 4. Password Change Request
        current_password = request.form.get('current_password')
        new_password = request.form.get('new_password')
        confirm_password = request.form.get('confirm_password')
        
        if current_password and new_password:
            if not current_user.check_password(current_password):
                flash('Le mot de passe actuel est incorrect.', 'danger')
                return redirect(url_for('auth.profile'))
            from app.utils.validators import is_valid_password
            if not is_valid_password(new_password, username=current_user.username, email=current_user.email):
                flash('Le mot de passe doit contenir au moins 8 caractères, 1 minuscule, 1 chiffre, 1 caractère spécial, et ne pas inclure le nom d\'utilisateur ou l\'email.', 'danger')
                return redirect(url_for('auth.profile'))
            if new_password != confirm_password:
                flash('Les nouveaux mots de passe ne correspondent pas.', 'danger')
                return redirect(url_for('auth.profile'))
            current_user.set_password(new_password)
            db.session.commit()
            flash('Votre mot de passe a été modifié avec succès.', 'success')
            return redirect(url_for('auth.profile'))

        # 5. Personal Information Update
        new_email = request.form.get('email')
        if new_email and new_email != current_user.email:
            existing = User.query.filter_by(email=new_email).first()
            if existing:
                flash(f"L'adresse email {new_email} est déjà utilisée par un autre compte.", 'danger')
                return redirect(url_for('auth.profile'))
            current_user.email = new_email
            
        current_user.phone = request.form.get('phone')
        
        real_name = request.form.get('real_name')
        if real_name:
            import re
            if not re.match(r"^[a-zA-ZÀ-ÿ\s\-\']+$", real_name):
                flash('Le nom ne doit contenir que des lettres, espaces, traits d\'union et apostrophes.', 'danger')
                return redirect(url_for('auth.profile'))
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
                    return redirect(url_for('auth.profile'))
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
        return redirect(url_for('auth.profile'))
    
    return render_template('auth/profile.html')

@auth.route('/login-success')
def login_success():
    next_url = request.args.get('next') or url_for('main.index')
    return render_template('auth/login_success.html', next_url=next_url)

@auth.route('/register-success')
def register_success():
    next_url = url_for('main.index')
    return render_template('auth/register_success.html', next_url=next_url)


@auth.route('/send-otp', methods=['POST'])
def api_send_otp():
    from flask import jsonify
    data = request.get_json() or {}
    email = data.get('email', '').strip().lower()
    purpose = data.get('purpose', '').strip()
    
    if not email or not purpose:
        return jsonify({"success": False, "message": "Email and purpose are required."}), 400
        
    user = User.query.filter_by(email=email).first()
    if not user:
        return jsonify({"success": False, "message": "User not found."}), 404
        
    from app.services.otp_service import send_otp_email, OTPRateLimitError
    try:
        success = send_otp_email(user, purpose)
        if success:
            return jsonify({"success": True, "message": "OTP sent successfully."}), 200
        else:
            return jsonify({"success": False, "message": "Failed to send OTP email."}), 500
    except OTPRateLimitError as e:
        return jsonify({"success": False, "message": str(e)}), 429


@auth.route('/resend-otp', methods=['POST'])
def api_resend_otp():
    from flask import jsonify
    data = request.get_json() or {}
    email = data.get('email', '').strip().lower()
    purpose = data.get('purpose', '').strip()
    
    if not email or not purpose:
        return jsonify({"success": False, "message": "Email and purpose are required."}), 400
        
    user = User.query.filter_by(email=email).first()
    if not user:
        return jsonify({"success": False, "message": "User not found."}), 404
        
    from app.services.otp_service import send_otp_email, OTPRateLimitError
    try:
        success = send_otp_email(user, purpose)
        if success:
            return jsonify({"success": True, "message": "OTP sent successfully."}), 200
        else:
            return jsonify({"success": False, "message": "Failed to send OTP email."}), 500
    except OTPRateLimitError as e:
        return jsonify({"success": False, "message": str(e)}), 429