import secrets
import logging
from datetime import datetime, timedelta
from flask import render_template
from werkzeug.security import generate_password_hash, check_password_hash
from app import db
from app.models import EmailOTP, User
from app.services.email_service import send_email

logger = logging.getLogger(__name__)

PURPOSE_LABELS = {
    'email_verification': 'vérification de votre e-mail',
    'password_reset': 'réinitialisation de votre mot de passe',
    'login': 'connexion à votre compte'
}

PURPOSE_SUBJECTS = {
    'email_verification': 'Vérifiez votre adresse e-mail - 3M SERVICES',
    'password_reset': 'Réinitialisez votre mot de passe - 3M SERVICES',
    'login': 'Code de sécurité pour connexion - 3M SERVICES'
}

class OTPRateLimitError(Exception):
    pass

class OTPMaxAttemptsError(Exception):
    pass

def generate_otp() -> str:
    """Generate a secure 6-digit numeric OTP."""
    return "".join(secrets.choice("0123456789") for _ in range(6))

def send_otp_email(user: User, purpose: str) -> bool:
    """
    Generate a secure 6-digit OTP, store it securely hashed, 
    and send the email to the user. Enforces rate limits of 3 requests per 15 minutes.
    """
    # 1. Rate limiting check (max 3 resends/requests per 15 minutes)
    fifteen_minutes_ago = datetime.utcnow() - timedelta(minutes=15)
    recent_otps_count = EmailOTP.query.filter(
        EmailOTP.user_id == user.id,
        EmailOTP.purpose == purpose,
        EmailOTP.created_at >= fifteen_minutes_ago
    ).count()

    if recent_otps_count >= 3:
        logger.warning(f"[OTP] Rate limit exceeded for user {user.id} ({purpose})")
        raise OTPRateLimitError("Limite de demandes OTP atteinte. Veuillez réessayer dans 15 minutes.")

    # 2. Invalidate any existing active OTP for this user and purpose
    invalidate_otp(user, purpose)

    # 3. Generate OTP and hash it
    otp_code = generate_otp()
    otp_hash = generate_password_hash(otp_code, method='pbkdf2:sha256')
    
    # 4. Save to database
    expires_at = datetime.utcnow() + timedelta(minutes=10)
    otp_record = EmailOTP(
        user_id=user.id,
        purpose=purpose,
        otp_hash=otp_hash,
        expires_at=expires_at,
        is_active=True
    )
    db.session.add(otp_record)
    db.session.commit()
    
    logger.info(f"[OTP] Generated OTP for user_id={user.id}, purpose={purpose}, expires_at={expires_at}")

    # 5. Render templates
    purpose_label = PURPOSE_LABELS.get(purpose, purpose)
    subject = PURPOSE_SUBJECTS.get(purpose, 'Code de vérification - 3M SERVICES')
    
    try:
        html_content = render_template(
            'emails/otp_email.html',
            username=user.username,
            otp_code=otp_code,
            purpose_label=purpose_label
        )
        text_content = render_template(
            'emails/otp_email.txt',
            username=user.username,
            otp_code=otp_code,
            purpose_label=purpose_label
        )
        
        # 6. Send the email
        success = send_email(
            to_email=user.email,
            subject=subject,
            html_content=html_content,
            text_content=text_content,
            user_id=user.id
        )
        
        if success:
            logger.info(f"[OTP] Email successfully sent to {user.email}")
            return True
        else:
            logger.error(f"[OTP] Failed to send email to {user.email}")
            return False
            
    except Exception as e:
        db.session.rollback()
        logger.error(f"[OTP] Error rendering or sending email: {e}", exc_info=True)
        return False

def verify_otp(user: User, otp: str, purpose: str) -> tuple[bool, str]:
    """
    Verify the provided OTP securely. 
    Enforces a maximum of 5 verification attempts and 10-minute expiration.
    Automatically deactivates OTP on success or when max attempts are exceeded.
    """
    otp_record = EmailOTP.query.filter_by(
        user_id=user.id,
        purpose=purpose,
        is_active=True
    ).first()

    if not otp_record:
        logger.warning(f"[OTP] Verification failed: No active OTP record found for user {user.id}")
        return False, "Aucun code de vérification actif trouvé."

    # Increment verification attempts
    otp_record.attempt_count += 1
    db.session.commit()

    # Enforce maximum attempt limit
    if otp_record.attempt_count > 5:
        otp_record.is_active = False
        db.session.commit()
        logger.warning(f"[OTP] Verification failed: Max attempts exceeded for user {user.id}")
        return False, "Nombre maximal de tentatives de validation dépassé. Veuillez demander un nouveau code."

    # Enforce expiration limit
    if datetime.utcnow() > otp_record.expires_at:
        otp_record.is_active = False
        db.session.commit()
        logger.info(f"[OTP] Verification failed: OTP expired for user {user.id}")
        return False, "Ce code de vérification a expiré."

    # Secure verification comparison
    if check_password_hash(otp_record.otp_hash, otp):
        # Mark as verified and deactivate
        otp_record.verified_at = datetime.utcnow()
        otp_record.is_active = False
        db.session.commit()
        logger.info(f"[OTP] Verification successful for user {user.id}")
        return True, "Code validé avec succès."
    
    # Check if this failed attempt hit the max limit of 5
    if otp_record.attempt_count == 5:
        otp_record.is_active = False
        db.session.commit()
        logger.warning(f"[OTP] Verification failed: Hit max attempts on this try for user {user.id}")
        return False, "Nombre maximal de tentatives de validation dépassé. Veuillez demander un nouveau code."

    logger.info(f"[OTP] Verification failed: Incorrect code for user {user.id} (Attempt {otp_record.attempt_count}/5)")
    return False, "Code de vérification incorrect."

def invalidate_otp(user: User, purpose: str) -> None:
    """Invalidate all active OTPs for a user and purpose."""
    EmailOTP.query.filter_by(
        user_id=user.id,
        purpose=purpose,
        is_active=True
    ).update({EmailOTP.is_active: False})
    db.session.commit()
    logger.info(f"[OTP] Invalidated active OTPs for user {user.id} ({purpose})")
