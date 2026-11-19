"""
app/utils/email_service.py
─────────────────────────
Thin compatibility shim – all actual sending is done by
app/services/email_service.py (Flask-Mail).

Import this module the same way you always have;
it just delegates to the Flask-Mail-powered service.
"""

from app.services.email_service import (   # noqa: F401  (re-export)
    send_email,
    send_ticket_email,
    send_ticket_confirmation,
    send_welcome_email,
    send_reset_password_email,
    send_verification_email,
    send_parcel_registered,
    send_parcel_delivered,
    send_payment_receipt,
)
