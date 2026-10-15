from fastapi import APIRouter, Depends, HTTPException, Query, BackgroundTasks
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from datetime import datetime, timezone, timedelta
import uuid
import re

from app.core.database import get_db
from app.models.newsletter import NewsletterSubscriber
from app.models.setting import Setting
from app.schemas.newsletter import SubscribeRequest, SubscribeResponse
from app.services.email_service import (
    get_smtp_config_from_db,
    render_confirmation_email,
    send_email
)
from app.core.config import settings as app_settings

router = APIRouter()

EMAIL_REGEX = re.compile(r"^[^@\s]+@[^@\s]+\.[^@\s]+$")

async def get_all_settings_map(db: AsyncSession):
    res = await db.execute(select(Setting))
    settings_rows = res.scalars().all()
    return {s.key: s.value for s in settings_rows}

@router.post("/subscribe", response_model=SubscribeResponse)
async def subscribe_newsletter(
    req: SubscribeRequest,
    background_tasks: BackgroundTasks,
    db: AsyncSession = Depends(get_db)
):
    clean_email = req.email.strip().lower()
    if not clean_email or not EMAIL_REGEX.match(clean_email):
        raise HTTPException(status_code=422, detail="Adresse courriel invalide.")

    if not req.consent:
        raise HTTPException(status_code=422, detail="Le consentement est requis pour vous abonner.")

    now = datetime.now(timezone.utc)
    expires_at = now + timedelta(hours=72)

    # Check if subscriber already exists
    res = await db.execute(select(NewsletterSubscriber).where(NewsletterSubscriber.email == clean_email))
    sub = res.scalars().first()

    token = uuid.uuid4().hex
    unsub_token = uuid.uuid4().hex

    if sub:
        if sub.status == "active":
            return SubscribeResponse(
                success=True,
                message="Vous êtes déjà abonné à notre infolettre. Merci de votre fidélité !",
                status="active"
            )
        # Re-activate pending or previously unsubscribed
        sub.first_name = req.first_name or sub.first_name
        sub.status = "pending"
        sub.source = req.source or sub.source
        sub.confirmation_token = token
        sub.confirmation_token_expires_at = expires_at
        if not sub.unsubscribe_token:
            sub.unsubscribe_token = unsub_token
        sub.consent_given = True
        sub.consent_timestamp = now
    else:
        sub = NewsletterSubscriber(
            email=clean_email,
            first_name=req.first_name,
            status="pending",
            source=req.source or "website",
            confirmation_token=token,
            confirmation_token_expires_at=expires_at,
            unsubscribe_token=unsub_token,
            consent_given=True,
            consent_timestamp=now
        )
        db.add(sub)

    await db.commit()
    await db.refresh(sub)

    # Dispatch double opt-in email in background
    settings_map = await get_all_settings_map(db)
    smtp_cfg = get_smtp_config_from_db(settings_map)

    frontend_url = app_settings.FRONTEND_URL or "https://capentrepreneurs.org"
    subject, html_body, plain_text = render_confirmation_email(
        subscriber_email=clean_email,
        first_name=req.first_name,
        confirmation_token=token,
        frontend_url=frontend_url,
        lang=req.language or "fr"
    )

    background_tasks.add_task(
        send_email,
        clean_email,
        subject,
        html_body,
        plain_text,
        smtp_cfg,
        None
    )

    return SubscribeResponse(
        success=True,
        message="Un courriel de confirmation vous a été envoyé. Veuillez cliquer sur le lien pour activer votre abonnement.",
        status="pending"
    )

@router.get("/confirm")
async def confirm_subscription(
    token: str = Query(...),
    db: AsyncSession = Depends(get_db)
):
    if not token or len(token) < 10:
        raise HTTPException(status_code=400, detail="Jeton de confirmation manquant ou invalide.")

    now = datetime.now(timezone.utc)
    res = await db.execute(select(NewsletterSubscriber).where(NewsletterSubscriber.confirmation_token == token))
    sub = res.scalars().first()

    if not sub:
        # Check if already active
        raise HTTPException(status_code=404, detail="Ce lien de confirmation est invalide ou a déjà été utilisé.")

    expires_at = sub.confirmation_token_expires_at
    if expires_at:
        if expires_at.tzinfo is None:
            expires_at = expires_at.replace(tzinfo=timezone.utc)
        if expires_at < now:
            raise HTTPException(status_code=400, detail="Ce lien de confirmation a expiré. Veuillez vous réinscrire.")

    sub.status = "active"
    sub.confirmed_at = now
    sub.confirmation_token = None
    sub.confirmation_token_expires_at = None
    await db.commit()

    return {
        "success": True,
        "message": "Félicitations ! Votre abonnement à l'infolettre CAP Entrepreneurs est maintenant confirmé.",
        "email": sub.email,
        "first_name": sub.first_name
    }

@router.get("/unsubscribe")
@router.post("/unsubscribe")
async def unsubscribe_newsletter(
    token: str = Query(None),
    email: str = Query(None),
    db: AsyncSession = Depends(get_db)
):
    if not token and not email:
        raise HTTPException(status_code=400, detail="Paramètre de désabonnement manquant.")

    now = datetime.now(timezone.utc)
    query = select(NewsletterSubscriber)
    if token:
        query = query.where(NewsletterSubscriber.unsubscribe_token == token)
    elif email:
        query = query.where(NewsletterSubscriber.email == email.strip().lower())

    res = await db.execute(query)
    sub = res.scalars().first()

    if not sub:
        # Idempotent response for privacy and compliance
        return {
            "success": True,
            "message": "Vous avez été désabonné de nos envois."
        }

    sub.status = "unsubscribed"
    sub.unsubscribed_at = now
    await db.commit()

    return {
        "success": True,
        "message": f"L'adresse {sub.email} a bien été retirée de nos listes d'envoi. Vous pouvez vous réabonner à tout moment."
    }
