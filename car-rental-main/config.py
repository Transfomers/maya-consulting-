import os

basedir = os.path.abspath(os.path.dirname(__file__))

try:
    from dotenv import load_dotenv
    load_dotenv(os.path.join(basedir, '.env'))
except ImportError:
    pass

class Config:
    SECRET_KEY = os.environ.get('SECRET_KEY')
    if not SECRET_KEY:
        # Clé de dev uniquement : en production, SECRET_KEY doit être défini dans .env
        import warnings
        warnings.warn("SECRET_KEY absent de l'environnement : clé de développement utilisée.")
        SECRET_KEY = 'dev-only-insecure-key'
    
    # Database configuration (SQLite default with auto-creation of instance directory)
    db_path = os.path.join(basedir, 'instance', '3mservices.db')
    os.makedirs(os.path.dirname(db_path), exist_ok=True)
    SQLALCHEMY_DATABASE_URI = os.environ.get('DATABASE_URL') or f"sqlite:///{db_path}"
    SQLALCHEMY_TRACK_MODIFICATIONS = False
    TEMPLATES_AUTO_RELOAD = True

    # Public customer website (React SPA). Override locally with
    # PUBLIC_SITE_URL=http://localhost:3001
    PUBLIC_SITE_URL = os.environ.get('PUBLIC_SITE_URL') or 'https://3mservice.shop'
    # URL publique de cette WebApp Flask (liens dans les e-mails)
    APP_BASE_URL = (os.environ.get('APP_BASE_URL') or 'http://127.0.0.1:5002').rstrip('/')
    # API Node (chat, site public) appelée depuis le navigateur de l'admin
    NODE_API_URL = (os.environ.get('NODE_API_URL') or 'http://127.0.0.1:5001/api').rstrip('/')
    # Jeton partagé Node → Flask (notifications des messages clients). Vide = appels locaux uniquement.
    INTERNAL_API_TOKEN = os.environ.get('INTERNAL_API_TOKEN', '')
    # Fichier JSON de l'API Node, synchronisé par Flask (Docker : volume partagé)
    EXPRESS_DB_JSON = os.environ.get('EXPRESS_DB_JSON') or os.path.join(basedir, 'server', 'data', 'db.json')
    
    # Static & Upload Folders
    UPLOAD_FOLDER = os.path.join(basedir, 'app', 'static', 'uploads')
    os.makedirs(UPLOAD_FOLDER, exist_ok=True)
    os.makedirs(os.path.join(UPLOAD_FOLDER, 'parcels'), exist_ok=True)
    MAX_CONTENT_LENGTH = 55 * 1024 * 1024  # 55 Mo (documents de contrat jusqu à 50 Mo)
    
    # Mail configuration for 3M SERVICES
    MAIL_SERVER = os.environ.get('MAIL_SERVER', 'smtp.gmail.com')
    MAIL_PORT = int(os.environ.get('MAIL_PORT', 587))
    MAIL_USE_TLS = os.environ.get('MAIL_USE_TLS', 'true').lower() in ['true', 'on', '1']
    MAIL_USERNAME = os.environ.get('MAIL_USERNAME', 'contact@3mservice.shop')
    MAIL_PASSWORD = os.environ.get('MAIL_PASSWORD', '')
    MAIL_DEFAULT_SENDER = os.environ.get('MAIL_DEFAULT_SENDER', 'contact@3mservice.shop')
    MAIL_SENDER_NAME = '3M SERVICES'
    
    # 3M Services specific configuration
    APP_NAME = '3M SERVICES'
    COMPANY_NAME = '3M SERVICES SARL'
    COMPANY_PHONE = '+237 691 78 64 47'
    COMPANY_EMAIL = 'contact@3mservice.shop'
    COMPANY_ADDRESS = 'Omnisports, Face Pharmacie Le Bon Berger, Yaoundé, Cameroun'
