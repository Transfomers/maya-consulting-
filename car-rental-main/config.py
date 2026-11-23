import os

basedir = os.path.abspath(os.path.dirname(__file__))

try:
    from dotenv import load_dotenv
    load_dotenv(os.path.join(basedir, '.env'))
except ImportError:
    pass

class Config:
    SECRET_KEY = os.environ.get('SECRET_KEY') or '3M_SERVICES_SECRET_KEY_VIP_2026_YAOUNDE'
    
    # Database configuration (SQLite default with auto-creation of instance directory)
    db_path = os.path.join(basedir, 'instance', '3mservices.db')
    os.makedirs(os.path.dirname(db_path), exist_ok=True)
    SQLALCHEMY_DATABASE_URI = os.environ.get('DATABASE_URL') or f"sqlite:///{db_path}"
    SQLALCHEMY_TRACK_MODIFICATIONS = False
    TEMPLATES_AUTO_RELOAD = True
    
    # Static & Upload Folders
    UPLOAD_FOLDER = os.path.join(basedir, 'app', 'static', 'uploads')
    os.makedirs(UPLOAD_FOLDER, exist_ok=True)
    os.makedirs(os.path.join(UPLOAD_FOLDER, 'parcels'), exist_ok=True)
    MAX_CONTENT_LENGTH = 32 * 1024 * 1024  # 32 MB max
    
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
