import os
import base64
import logging
from datetime import datetime

from flask_mail import Message
from app import db, mail

logger = logging.getLogger(__name__)

# ── Flask-Mail configuration ──────────────────────────────────────────────────
# Configuration parameters are loaded automatically by Flask-Mail from app.config
# such as MAIL_SERVER, MAIL_PORT, MAIL_USE_TLS, MAIL_USERNAME, MAIL_PASSWORD, MAIL_DEFAULT_SENDER

# ── Internal send helper ─────────────────────────────────────────────────────

def _send_mail_flask(to_email: str, subject: str, html_content: str, text_content: str = None,
                     attachment_name: str = None, attachment_b64: str = None,
                     log_id: int = None):
    try:
        logger.info(f"[MAIL] Starting email send to {to_email} with subject '{subject}'")
        
        from flask import current_app
        sender_email = current_app.config.get('MAIL_DEFAULT_SENDER', 'contact@3mservice.shop')
        sender_name = current_app.config.get('MAIL_SENDER_NAME', '3M SERVICES')
        
        msg = Message(
            subject=subject,
            recipients=[to_email],
            body=text_content,
            html=html_content,
            sender=(sender_name, sender_email)
        )
        
        if attachment_name and attachment_b64:
            file_data = base64.b64decode(attachment_b64)
            content_type = "application/pdf"
            if attachment_name.endswith('.png'):
                content_type = "image/png"
            elif attachment_name.endswith('.jpg') or attachment_name.endswith('.jpeg'):
                content_type = "image/jpeg"
            
            msg.attach(attachment_name, content_type, file_data)
            
        logger.info("[MAIL] Executing mail.send(msg)...")
        mail.send(msg)
        logger.info("[MAIL] Email sent successfully!")
        
        if log_id:
            _update_log(log_id, "sent")
        return True
    except Exception as e:
        db.session.rollback()
        logger.error(f"❌ [MAIL ERROR]: {e}", exc_info=True)
        if log_id:
            _update_log(log_id, "failed", str(e))
        return False


def _update_log(log_id, status, error=None):
    """Update EmailLog status."""
    if not log_id:
        return
    try:
        from app import db
        from app.models import EmailLog
        log = EmailLog.query.get(log_id)
        if log:
            log.status = status
            if status == 'sent':
                log.sent_at = datetime.utcnow()
            if error:
                log.error_message = error[:1000]
            db.session.commit()
    except Exception as ex:
        from app import db
        db.session.rollback()
        logger.error("[EMAIL LOG] Could not update log %s: %s", log_id, ex)

def _create_log(user_id, email, subject):
    """Create a pending EmailLog row. Returns the row id or None."""
    try:
        from app import db
        from app.models import EmailLog
        
        log = EmailLog(
            user_id=user_id,
            email=email,
            subject=subject,
            status="pending"
        )
        
        db.session.add(log)
        db.session.commit()
        return log.id
        
    except Exception as ex:
        from app import db
        db.session.rollback()
        logger.error("[EMAIL LOG] Could not create log: %s", ex)
        return None


def send_email(to_email: str, subject: str, html_content: str, text_content: str = None,
               attachment_name: str = None, attachment_b64: str = None,
               user_id: int = None):
    """Sends email using Flask-Mail."""
    if not to_email:
        return False
        
    from flask import current_app
    app = None
    try:
        app = current_app._get_current_object()
    except RuntimeError:
        try:
            from app import create_app
            app = create_app()
        except Exception as ex:
            logger.error(f"[MAIL] Failed to get app context: {ex}")
            return False
            
    log_id = _create_log(user_id, to_email, subject)
    
    logger.info("[MAIL] Running email sending synchronously.")
    try:
        with app.app_context():
            return _send_mail_flask(to_email, subject, html_content, text_content, attachment_name, attachment_b64, log_id)
    except Exception as ex:
        logger.error(f"[MAIL] Failed synchronously: {ex}")
        return False


# ── Email Templates (inline HTML so no Flask context required) ───────────────

def _base_html(title: str, body: str) -> str:
    return f"""<!DOCTYPE html>
<html lang="fr">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width,initial-scale=1">
  <title>{title}</title>
  <style>
    body{{font-family:'Helvetica Neue',Helvetica,Arial,sans-serif;background:#f4f6f9;margin:0;padding:0;}}
    .wrap{{max-width:600px;margin:32px auto;background:#fff;border-radius:10px;overflow:hidden;box-shadow:0 4px 18px rgba(0,0,0,.08);}}
    .hdr{{background:linear-gradient(135deg,#C92A2A,#a02a4f);color:#fff;padding:28px 32px;text-align:center;}}
    .hdr h1{{margin:0;font-size:22px;letter-spacing:-.3px;}}
    .hdr p{{margin:6px 0 0;font-size:13px;opacity:.85;}}
    .body{{padding:28px 32px;color:#1e293b;line-height:1.65;font-size:15px;}}
    .body p{{margin:0 0 14px;}}
    .ref-box{{background:#f8f0f3;border:1.5px dashed #a02a4f;border-radius:8px;padding:14px;text-align:center;font-family:monospace;font-size:17px;font-weight:700;color:#C92A2A;margin:20px 0;letter-spacing:.05em;}}
    .btn{{display:inline-block;margin-top:6px;padding:11px 26px;background:linear-gradient(135deg,#C92A2A,#a02a4f);color:#fff !important;text-decoration:none;border-radius:6px;font-weight:700;font-size:14px;}}
    table.info{{width:100%;border-collapse:collapse;margin:16px 0;}}
    table.info td{{padding:8px 10px;border-bottom:1px solid #f1f5f9;font-size:14px;}}
    table.info td:first-child{{font-weight:700;width:45%;color:#64748b;}}
    .ftr{{background:#f8f0f3;padding:18px 32px;text-align:center;font-size:12px;color:#94a3b8;}}
  </style>
</head>
<body>
  <div class="wrap">
    <div class="hdr">
      <h1>🚌 3M SERVICES</h1>
      <p>Votre compagnon de voyage fiable</p>
    </div>
    <div class="body">{body}</div>
    <div class="ftr">© {datetime.utcnow().year} 3M SERVICES · <a href="https://3mservice.shop" style="color:#C92A2A;">3mservice.shop</a></div>
  </div>
</body>
</html>"""


# ── Event functions ──────────────────────────────────────────────────────────

def send_welcome_email(user):
    """Sent immediately after registration."""
    subject = "Bienvenue chez 3M SERVICES VIP SARL 🎉"
    body = f"""
    <p>Bonjour <strong>{user.username}</strong>,</p>
    <p>Votre compte VIP a été créé avec succès. Vous pouvez dès maintenant :</p>
    <ul style="padding-left:18px;">
      <li>Louer des véhicules VIP de prestige (SUV 4x4, Berlines)</li>
      <li>Réserver avec chauffeur exécutif ou en autonomie</li>
      <li>Gérer vos contrats de location et conciergerie 24/7</li>
    </ul>
    <p><a class="btn" href="https://3mservice.shop">Découvrir la Flotte VIP</a></p>
    <p style="margin-top:20px;font-size:13px;color:#64748b;">Si vous n'êtes pas à l'origine de cette inscription, ignorez cet email.</p>
    """
    return send_email(user.email, subject, _base_html(subject, body), user_id=user.id)


def send_reset_password_email(user, reset_link):
    """Sent when user requests a password reset."""
    subject = "Réinitialisation de votre mot de passe – 3M SERVICES"
    body = f"""
    <p>Bonjour <strong>{user.username}</strong>,</p>
    <p>Nous avons reçu une demande de réinitialisation de votre mot de passe.</p>
    <p>Cliquez sur le bouton ci-dessous (valable <strong>30 minutes</strong>) :</p>
    <p style="text-align:center;margin:24px 0;"><a class="btn" href="{reset_link}">🔑 Réinitialiser mon mot de passe</a></p>
    <p style="font-size:13px;color:#64748b;">Si vous n'avez pas demandé cette réinitialisation, ignorez cet email – votre mot de passe reste inchangé.</p>
    """
    return send_email(user.email, subject, _base_html(subject, body), user_id=user.id)


def send_verification_email(to_email: str, otp_code: str, user_name: str, user_id: int = None) -> bool:
    """Sent during OTP verification flow."""
    subject = "Votre code de vérification – 3M SERVICES"
    body = f"""
    <p>Bonjour <strong>{user_name}</strong>,</p>
    <p>Votre code de vérification est :</p>
    <div class="ref-box">{otp_code}</div>
    <p>Ce code expire dans <strong>10 minutes</strong>.</p>
    <p style="font-size:13px;color:#64748b;">Si vous n'avez pas demandé ce code, ignorez cet email.</p>
    """
    return send_email(to_email, subject, _base_html(subject, body), user_id=user_id)


def send_ticket_email(user, booking, pdf_bytes):
    """Sent after a booking is confirmed. Attaches the PDF rental contract."""
    if not user.email:
        return False

    subject = f"🚗 Confirmation de Contrat de Location VIP – 3M SERVICES"

    trip   = booking.trip
    route  = trip.route if trip else None
    origin = route.origin if route else "N/A"
    dest   = route.destination if route else "N/A"
    depart = trip.departure_time.strftime('%d/%m/%Y à %H:%M') if trip and trip.departure_time else "N/A"
    arrive = trip.arrival_time.strftime('%d/%m/%Y à %H:%M') if trip and trip.arrival_time else "N/A"
    seat   = booking.seat_number or "1"
    ref    = booking.booking_code or booking.id
    price  = f"{int(booking.price_paid or 0):,} FCFA"
    pax    = booking.passenger_name or user.username
    bus_name = getattr(trip.bus, 'name', None) or getattr(trip.bus, 'license_plate', None) if trip and trip.bus else 'Flotte VIP 3M'

    body = f"""
    <p>Bonjour <strong>{user.username}</strong>,</p>
    <p>Votre réservation de véhicule de prestige est <strong style="color:#059669;">confirmée</strong>. Retrouvez votre contrat de location & facture proforma en pièce jointe.</p>
    <div class="ref-box">RÉFÉRENCE CONTRAT : {ref}</div>
    <table class="info">
      <tr><td>Client VIP</td><td>{pax}</td></tr>
      <tr><td>Véhicule</td><td><strong>{bus_name}</strong></td></tr>
      <tr><td>Mission / Itinéraire</td><td><strong>{origin} → {dest}</strong></td></tr>
      <tr><td>Mise à disposition</td><td>{depart}</td></tr>
      <tr><td>Fin prévisionnelle</td><td>{arrive}</td></tr>
      <tr><td>Poste / Réf</td><td>{seat}</td></tr>
      <tr><td>Montant total</td><td><strong>{price}</strong></td></tr>
    </table>
    <p>Présentez ce contrat ou le QR Code PDF lors de la remise des clés ou au chauffeur dédié.</p>
    <p><a class="btn" href="https://3mservice.shop/my-bookings">Consulter mes contrats VIP</a></p>
    """

    attachment_b64 = base64.b64encode(pdf_bytes).decode('utf-8') if pdf_bytes else None
    attachment_name = f"contrat_location_{ref}.pdf" if pdf_bytes else None

    return send_email(
        user.email, subject, _base_html(subject, body),
        attachment_name=attachment_name, attachment_b64=attachment_b64,
        user_id=user.id
    )


def send_ticket_confirmation(user, booking, pdf_bytes=None):
    """Alias for send_ticket_email – used in main.py payment flow."""
    return send_ticket_email(user, booking, pdf_bytes)


def send_parcel_registered(user, parcel):
    """Sent to sender when their parcel is registered."""
    subject = f"📦 Votre colis a été enregistré – {parcel.tracking_number}"
    target  = user.email if user else parcel.sender_email
    if not target:
        return False

    agency_city = parcel.agency.city if parcel.agency else "3M SERVICES"
    body = f"""
    <p>Bonjour <strong>{parcel.sender_name}</strong>,</p>
    <p>Votre colis a bien été enregistré dans notre système.</p>
    <table class="info">
      <tr><td>N° de suivi</td><td><strong>{parcel.tracking_number}</strong></td></tr>
      <tr><td>Départ</td><td>{agency_city}</td></tr>
      <tr><td>Destination</td><td>{parcel.receiver_city}</td></tr>
      <tr><td>Destinataire</td><td>{parcel.receiver_name}</td></tr>
      <tr><td>Type</td><td>{parcel.parcel_type}</td></tr>
      <tr><td>Poids</td><td>{parcel.weight} kg</td></tr>
      <tr><td>Montant</td><td><strong>{int(parcel.price):,} FCFA</strong></td></tr>
    </table>
    <p>Vous recevrez un email dès que votre colis sera en transit et à la livraison.</p>
    <p><a class="btn" href="https://3mservice.shop/my-bookings">Suivre mon colis</a></p>
    """
    user_id = user.id if user else None
    return send_email(target, subject, _base_html(subject, body), user_id=user_id)


def send_parcel_delivered(user, parcel):
    """Sent when parcel status changes to delivered."""
    subject = f"✅ Votre colis a été livré – {parcel.tracking_number}"
    target  = user.email if user else parcel.sender_email
    if not target:
        return False

    body = f"""
    <p>Bonjour <strong>{parcel.sender_name}</strong>,</p>
    <p>Excellente nouvelle ! Votre colis <strong>{parcel.tracking_number}</strong> a été livré avec succès à <strong>{parcel.receiver_name}</strong> à {parcel.receiver_city}.</p>
    <p>Merci de faire confiance à 3M SERVICES pour vos expéditions.</p>
    <p><a class="btn" href="https://3mservice.shop/my-bookings">Mon historique</a></p>
    """
    user_id = user.id if user else None
    return send_email(target, subject, _base_html(subject, body), user_id=user_id)


def send_payment_receipt(user, payment):
    """Sent after a successful payment."""
    subject = "✅ Reçu de paiement – 3M SERVICES"
    body = f"""
    <p>Bonjour <strong>{user.username}</strong>,</p>
    <p>Votre paiement a bien été reçu.</p>
    <table class="info">
      <tr><td>Montant</td><td><strong>{payment.amount:,} FCFA</strong></td></tr>
      <tr><td>Référence</td><td>{getattr(payment, 'transaction_id', None) or payment.id}</td></tr>
      <tr><td>Moyen de paiement</td><td>{getattr(payment, 'payment_method', 'N/A')}</td></tr>
    </table>
    <p>Merci pour votre confiance.</p>
    """
    return send_email(user.email, subject, _base_html(subject, body), user_id=user.id)
