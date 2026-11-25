from flask import Flask
from flask_sqlalchemy import SQLAlchemy
from flask_login import LoginManager
from flask_migrate import Migrate
from flask_compress import Compress
import os
import logging
from flask_mail import Mail

# Initialize loggers
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

try:
    from dotenv import load_dotenv
    load_dotenv()
    logger.info("Environment variables loaded.")
except ImportError:
    pass

try:
    import firebase_admin
    from firebase_admin import credentials
    import json
    if not firebase_admin._apps:
        try:
            if "FIREBASE_CREDENTIALS" in os.environ:
                firebase_json = json.loads(os.environ["FIREBASE_CREDENTIALS"])
                cred = credentials.Certificate(firebase_json)
                firebase_admin.initialize_app(cred)
                logger.info("Firebase Admin initialized via FIREBASE_CREDENTIALS.")
            else:
                cred = credentials.ApplicationDefault()
                firebase_admin.initialize_app(cred)
                logger.info("Firebase Admin initialized via Application Default Credentials.")
        except Exception as e:
            logger.warning(f"Credential initialization failed: {e}")
            # Fallback to no-credential initialization with project ID for token verification
            firebase_admin.initialize_app(options={'projectId': '3mservices-prod'})
            logger.info("Firebase Admin initialized without credentials (projectId only).")
except Exception as e:
    logger.warning(f"Could not initialize Firebase Admin: {e}")

from config import Config

from authlib.integrations.flask_client import OAuth

db = SQLAlchemy()
login_manager = LoginManager()
migrate = Migrate()
mail = Mail()
compress = Compress()
oauth = OAuth()

def create_app():
    app = Flask(__name__)

    # Load configuration from Config class
    app.config.from_object(Config)

    # Persist errors (full tracebacks) to logs/error.log so production 500s can be diagnosed.
    # Users still only see the friendly error page.
    try:
        from logging.handlers import RotatingFileHandler
        log_dir = os.environ.get('LOG_DIR') or os.path.join(os.path.dirname(app.root_path), 'logs')
        os.makedirs(log_dir, exist_ok=True)
        file_handler = RotatingFileHandler(os.path.join(log_dir, 'error.log'), maxBytes=2_000_000, backupCount=5, encoding='utf-8')
        file_handler.setLevel(logging.WARNING)
        file_handler.setFormatter(logging.Formatter('%(asctime)s %(levelname)s [%(name)s] %(message)s'))
        app.logger.addHandler(file_handler)
    except OSError as e:
        logger.warning(f"File logging disabled: {e}")

    # Initialize extensions
    db.init_app(app)
    login_manager.init_app(app)
    migrate.init_app(app, db)
    mail.init_app(app)
    compress.init_app(app)
    oauth.init_app(app)

    # Register Auth0
    if os.environ.get('AUTH0_DOMAIN'):
        oauth.register(
            'auth0',
            client_id=os.environ.get('AUTH0_CLIENT_ID'),
            client_secret=os.environ.get('AUTH0_CLIENT_SECRET'),
            client_kwargs={
                'scope': 'openid profile email',
            },
            server_metadata_url=f"https://{os.environ.get('AUTH0_DOMAIN')}/.well-known/openid-configuration"
        )

    # Set login view
    login_manager.login_view = 'auth.login'
    login_manager.login_message = 'Please log in to access this page.'
    login_manager.login_message_category = 'info'

    # Setup simple i18n
    import json
    from flask import session, request
    
    def load_translations():
        translations_path = os.path.join(app.root_path, 'translations', 'en.json')
        if os.path.exists(translations_path):
            try:
                with open(translations_path, 'r', encoding='utf-8') as f:
                    return json.load(f)
            except Exception as e:
                logger.error(f"Failed to load translations: {e}")
        return {}
        
    en_translations = load_translations()
    
    def translate(text):
        lang = session.get('lang', 'fr')
        if lang == 'fr':
            return text
        return en_translations.get(text, text)
        
    app.jinja_env.globals.update(_t=translate)
    from app.utils.security import get_csrf_token
    app.jinja_env.globals.update(csrf_token=get_csrf_token)
    from app.services.admin_shell import get_shell_stats
    app.jinja_env.globals.update(admin_shell_stats=get_shell_stats)

    # Add date utilities for templates (trip cards need these)
    from datetime import timedelta as _timedelta
    
    @app.context_processor
    def inject_date_utils():
        from datetime import datetime as _dt, timedelta as _td
        now_wat = (_dt.utcnow() + _td(hours=1)).date()  # Cameroon WAT = UTC+1
        return {
            'now_wat': now_wat,
            'timedelta': _td,
            'alerts': {'dashboard': 0},
            'public_site_url': app.config.get('PUBLIC_SITE_URL', '').rstrip('/'),
            'node_api_url': app.config.get('NODE_API_URL'),
            'app_base_url': app.config.get('APP_BASE_URL'),
            'contact_messages': []
        }

    # Register blueprints
    from app.routes.main import bp as main_bp
    from app.routes.auth import auth as auth_bp
    from app.routes.client import client as client_bp
    from app.routes.admin import admin as admin_bp
    from app.routes.trips import trips_bp
    from app.routes.missions import missions_bp, ensure_mission_schema
    from app.routes.properties import properties_bp, ensure_property_schema
    
    app.register_blueprint(main_bp)
    app.register_blueprint(auth_bp)
    app.register_blueprint(client_bp)
    app.register_blueprint(admin_bp)
    app.register_blueprint(trips_bp)
    app.register_blueprint(missions_bp)
    app.register_blueprint(properties_bp)

    # ── Error handlers ────────────────────────────────────────
    from flask import render_template

    ERROR_META = {
        400: {
            'icon': '⚠️',
            'title': 'Requête incorrecte',
            'description': "Votre navigateur a envoyé une requête que le serveur ne comprend pas. Vérifiez les données saisies et réessayez.",
        },
        401: {
            'icon': '🔐',
            'title': 'Accès non autorisé',
            'description': "Vous devez être connecté pour accéder à cette page. Veuillez vous identifier avec votre compte 3M SERVICES.",
        },
        403: {
            'icon': '🚫',
            'title': 'Accès interdit',
            'description': "Vous n'avez pas la permission d'accéder à cette ressource. Si vous pensez que c'est une erreur, contactez le support.",
        },
        404: {
            'icon': '🗺️',
            'title': 'Page introuvable',
            'description': "Cette page a pris un autre chemin… ou n'existe plus. Vérifiez l'adresse ou retournez à l'accueil pour continuer votre voyage.",
        },
        429: {
            'icon': '⏳',
            'title': 'Trop de requêtes',
            'description': "Vous avez effectué trop de requêtes en peu de temps. Veuillez patienter quelques instants avant de réessayer.",
        },
        500: {
            'icon': '🔧',
            'title': 'Erreur interne du serveur',
            'description': "Notre équipe technique a été alertée automatiquement. Nous travaillons à résoudre le problème dans les plus brefs délais.",
        },
        503: {
            'icon': '🛠️',
            'title': 'Service temporairement indisponible',
            'description': "3M SERVICES est en maintenance planifiée pour vous offrir une meilleure expérience. La page se rechargera automatiquement.",
        },
    }

    def _render_error(code):
        meta = ERROR_META.get(code, {
            'icon': '❌',
            'title': 'Erreur inattendue',
            'description': f"Une erreur est survenue (code {code}). Retournez à l'accueil et réessayez.",
        })
        return render_template(
            'errors/error.html',
            code=code,
            icon=meta['icon'],
            title=meta['title'],
            description=meta['description'],
        ), code

    @app.errorhandler(400)
    def bad_request(e):       return _render_error(400)

    @app.errorhandler(401)
    def unauthorized(e):      return _render_error(401)

    @app.errorhandler(403)
    def forbidden(e):         return _render_error(403)

    @app.errorhandler(404)
    def not_found(e):         return _render_error(404)

    @app.errorhandler(429)
    def too_many_requests(e): return _render_error(429)

    @app.errorhandler(500)
    def internal_error(e):
        # Roll back any failed DB transaction so the DB isn't left in a broken state
        try:
            db.session.rollback()
        except Exception:
            pass
            
        import traceback
        tb = traceback.format_exc()
        app.logger.error(f"Internal Server Error: {str(e)}\n{tb}")
        
        return _render_error(500)

    @app.errorhandler(503)
    def service_unavailable(e): return _render_error(503)
    # ─────────────────────────────────────────────────────────


    # Startup connection verification & mission schema bootstrap
    with app.app_context():
        try:
            # Check database connectivity
            db.session.execute(db.text('SELECT 1'))
            logger.info("Database connection verified successfully.")
            ensure_mission_schema()
            ensure_property_schema()
        except Exception as e:
            logger.error(f"Database connection check failed: {e}")

    logger.info("Application factory initialized successfully.")
    return app

from app import models