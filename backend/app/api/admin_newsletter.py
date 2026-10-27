from fastapi import APIRouter, Depends, HTTPException, Query, UploadFile, File, BackgroundTasks
from fastapi.responses import StreamingResponse
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func, desc, or_
from datetime import datetime, timezone
import csv
import io
import re
import uuid
import logging
from typing import Optional, List

from app.core.database import get_db, AsyncSessionLocal
from app.core.security import RequirePermission, get_current_user
from app.models.newsletter import (
    NewsletterSubscriber,
    NewsletterCampaign,
    NewsletterDelivery,
    NewsletterTemplate
)
from app.models.post import Post
from app.models.setting import Setting
from app.schemas.newsletter import (
    SubscriberCreate,
    SubscriberUpdate,
    SubscriberResponse,
    SubscriberListResponse,
    CampaignCreate,
    CampaignUpdate,
    CampaignResponse,
    TemplateCreate,
    TemplateUpdate,
    TemplateResponse,
    DeliveryResponse,
    NewsletterSettingsSchema,
    TestEmailRequest,
    NewsletterStatsResponse
)
from app.services.email_service import (
    get_smtp_config_from_db,
    send_smtp_sync,
    render_article_notification_email,
    render_base_email,
    post_to_teams
)
from app.core.config import settings as app_settings

router = APIRouter()
logger = logging.getLogger("admin_newsletter")
EMAIL_REGEX = re.compile(r"^[^@\s]+@[^@\s]+\.[^@\s]+$")


async def get_all_settings_map(db: AsyncSession):
    res = await db.execute(select(Setting))
    settings_rows = res.scalars().all()
    return {s.key: s.value for s in settings_rows}


# --- Background Worker for Campaign Execution ---
async def process_campaign_dispatch(campaign_id: str):
    """
    Background job to dispatch a newsletter campaign safely in batches
    with per-recipient delivery logging and failure tracking.
    """
    async with AsyncSessionLocal() as db:
        res = await db.execute(select(NewsletterCampaign).where(NewsletterCampaign.id == campaign_id))
        campaign = res.scalars().first()
        if not campaign or campaign.status in ("sent", "processing"):
            return

        campaign.status = "processing"
        campaign.started_at = datetime.now(timezone.utc)
        await db.commit()

        # Load SMTP settings
        settings_map = await get_all_settings_map(db)
        smtp_cfg = get_smtp_config_from_db(settings_map)
        teams_webhook = settings_map.get("teams_webhook_url")
        frontend_url = app_settings.FRONTEND_URL or "https://www.3mservice.shop"

        # Determine subscribers to target
        sub_query = select(NewsletterSubscriber)
        if campaign.recipient_segment == "all_active":
            sub_query = sub_query.where(NewsletterSubscriber.status == "active")
        elif campaign.recipient_segment == "pending":
            sub_query = sub_query.where(NewsletterSubscriber.status == "pending")

        sub_res = await db.execute(sub_query)
        subscribers = sub_res.scalars().all()

        campaign.recipient_count = len(subscribers)
        campaign.sent_count = 0
        campaign.failed_count = 0
        await db.commit()

        # Load article details if associated
        post = None
        if campaign.article_id:
            p_res = await db.execute(select(Post).where(Post.id == campaign.article_id))
            post = p_res.scalars().first()

        for sub in subscribers:
            unsub_token = sub.unsubscribe_token or ""
            unsub_url = f"{frontend_url}/unsubscribe?token={unsub_token}&email={sub.email}"

            if post:
                subject, html_content, plain_text = render_article_notification_email(
                    post=post,
                    frontend_url=frontend_url,
                    unsubscribe_url=unsub_url,
                    preview_text=campaign.preview_text or "Découvrez notre nouvel article."
                )
            else:
                subject = campaign.subject
                body_content = f"""
                  <table border="0" cellpadding="0" cellspacing="0" width="100%">
                    <tr>
                      <td style="font-size: 10px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.25em; color: #B84A39; padding-bottom: 8px;">
                        COMMUNIQUÉ • INFOLETTRE
                      </td>
                    </tr>
                    <tr>
                      <td style="font-family: Georgia, 'Times New Roman', serif; font-size: 24px; line-height: 34px; color: #0D0E0D; padding-bottom: 18px;">
                        {campaign.title}
                      </td>
                    </tr>
                    <tr>
                      <td style="font-size: 14px; line-height: 24px; color: #444444; padding-bottom: 24px;">
                        {campaign.preview_text or ''}
                      </td>
                    </tr>
                    <tr>
                      <td align="left" style="padding-bottom: 28px;">
                        <a href="{frontend_url}" target="_blank" style="display: inline-block; padding: 13px 28px; background-color: #232724; font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; font-size: 11px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.2em; color: #FFFFFF; text-decoration: none;">
                          Visiter 3mservice.shop &rarr;
                        </a>
                      </td>
                    </tr>
                  </table>
                """
                html_content = render_base_email(body_content, unsubscribe_url=unsub_url, preview_text=campaign.preview_text)
                plain_text = f"{campaign.title}\n\n{campaign.preview_text or ''}\n\n{frontend_url}\n\nDésabonnement:\n{unsub_url}"

            # Dispatch synchronous SMTP in thread
            import asyncio
            success, err_msg = await asyncio.to_thread(
                send_smtp_sync,
                sub.email,
                subject,
                html_content,
                plain_text,
                smtp_cfg,
                unsub_url
            )

            delivery = NewsletterDelivery(
                campaign_id=campaign.id,
                subscriber_id=sub.id,
                email=sub.email,
                status="sent" if success else "failed",
                error_message=err_msg if not success else None,
                sent_at=datetime.now(timezone.utc) if success else None
            )
            db.add(delivery)

            if success:
                campaign.sent_count += 1
            else:
                campaign.failed_count += 1

            await db.commit()

        # Update final campaign status
        campaign.completed_at = datetime.now(timezone.utc)
        if campaign.failed_count == 0:
            campaign.status = "sent"
        elif campaign.sent_count > 0:
            campaign.status = "partially_failed"
        else:
            campaign.status = "failed"

        await db.commit()

        # Notify Microsoft Teams if configured
        if teams_webhook:
            status_emoji = "✅" if campaign.status == "sent" else "⚠️"
            await post_to_teams(
                webhook_url=teams_webhook,
                title=f"{status_emoji} Campagne Infolettre terminée : {campaign.title}",
                text=f"**Destinataires ciblés** : {campaign.recipient_count}  \n"
                     f"**Succès** : {campaign.sent_count}  \n"
                     f"**Échecs** : {campaign.failed_count}  \n"
                     f"**Statut** : {campaign.status}",
                action_url=f"{frontend_url}/admin/newsletter/campaigns"
            )


# ==========================================
# 1. OVERVIEW & STATS
# ==========================================
@router.get("/stats", response_model=NewsletterStatsResponse)
async def get_newsletter_stats(
    db: AsyncSession = Depends(get_db),
    user=Depends(RequirePermission("newsletter.view"))
):
    # Total counts by status
    total_subs = (await db.execute(select(func.count(NewsletterSubscriber.id)))).scalar() or 0
    active_subs = (await db.execute(select(func.count(NewsletterSubscriber.id)).where(NewsletterSubscriber.status == "active"))).scalar() or 0
    pending_subs = (await db.execute(select(func.count(NewsletterSubscriber.id)).where(NewsletterSubscriber.status == "pending"))).scalar() or 0
    unsub_subs = (await db.execute(select(func.count(NewsletterSubscriber.id)).where(NewsletterSubscriber.status == "unsubscribed"))).scalar() or 0
    bounced_subs = (await db.execute(select(func.count(NewsletterSubscriber.id)).where(NewsletterSubscriber.status == "bounced"))).scalar() or 0

    campaigns_sent = (await db.execute(select(func.count(NewsletterCampaign.id)).where(NewsletterCampaign.status.in_(["sent", "partially_failed"])))).scalar() or 0
    total_deliveries = (await db.execute(select(func.count(NewsletterDelivery.id)))).scalar() or 0
    failed_deliveries = (await db.execute(select(func.count(NewsletterDelivery.id)).where(NewsletterDelivery.status == "failed"))).scalar() or 0

    recent_camp_res = await db.execute(
        select(NewsletterCampaign).order_by(desc(NewsletterCampaign.created_at)).limit(5)
    )
    recent_campaigns = recent_camp_res.scalars().all()

    return NewsletterStatsResponse(
        total_subscribers=total_subs,
        active_subscribers=active_subs,
        pending_subscribers=pending_subs,
        unsubscribed_subscribers=unsub_subs,
        bounced_subscribers=bounced_subs,
        campaigns_sent=campaigns_sent,
        total_deliveries=total_deliveries,
        delivery_failures=failed_deliveries,
        recent_campaigns=recent_campaigns
    )


# ==========================================
# 2. SUBSCRIBER MANAGEMENT (CRUD)
# ==========================================
@router.get("/subscribers", response_model=SubscriberListResponse)
async def list_subscribers(
    page: int = Query(1, ge=1),
    limit: int = Query(20, ge=1, le=100),
    search: Optional[str] = None,
    status: Optional[str] = None,
    source: Optional[str] = None,
    db: AsyncSession = Depends(get_db),
    user=Depends(RequirePermission("newsletter.view"))
):
    query = select(NewsletterSubscriber)

    if search:
        search_fmt = f"%{search.strip().lower()}%"
        query = query.where(
            or_(
                func.lower(NewsletterSubscriber.email).like(search_fmt),
                func.lower(NewsletterSubscriber.first_name).like(search_fmt)
            )
        )

    if status and status != "all":
        query = query.where(NewsletterSubscriber.status == status)

    if source and source != "all":
        query = query.where(NewsletterSubscriber.source == source)

    # Count total matching
    count_query = select(func.count()).select_from(query.subquery())
    total = (await db.execute(count_query)).scalar() or 0

    # Paginate
    query = query.order_by(desc(NewsletterSubscriber.created_at)).offset((page - 1) * limit).limit(limit)
    res = await db.execute(query)
    items = res.scalars().all()

    return SubscriberListResponse(
        items=items,
        total=total,
        page=page,
        limit=limit
    )


@router.post("/subscribers", response_model=SubscriberResponse)
async def create_subscriber(
    data: SubscriberCreate,
    db: AsyncSession = Depends(get_db),
    user=Depends(RequirePermission("newsletter.manage"))
):
    clean_email = data.email.strip().lower()
    if not clean_email or not EMAIL_REGEX.match(clean_email):
        raise HTTPException(status_code=422, detail="Adresse courriel invalide.")

    res = await db.execute(select(NewsletterSubscriber).where(NewsletterSubscriber.email == clean_email))
    existing = res.scalars().first()
    if existing:
        raise HTTPException(status_code=400, detail="Cet abonné existe déjà dans la base de données.")

    now = datetime.now(timezone.utc)
    sub = NewsletterSubscriber(
        email=clean_email,
        first_name=data.first_name,
        status=data.status or "active",
        source=data.source or "admin_import",
        consent_given=data.consent_given,
        consent_timestamp=now,
        confirmed_at=now if data.status == "active" else None,
        unsubscribe_token=uuid.uuid4().hex
    )
    db.add(sub)
    await db.commit()
    await db.refresh(sub)
    return sub


@router.put("/subscribers/{subscriber_id}", response_model=SubscriberResponse)
async def update_subscriber(
    subscriber_id: str,
    data: SubscriberUpdate,
    db: AsyncSession = Depends(get_db),
    user=Depends(RequirePermission("newsletter.manage"))
):
    res = await db.execute(select(NewsletterSubscriber).where(NewsletterSubscriber.id == subscriber_id))
    sub = res.scalars().first()
    if not sub:
        raise HTTPException(status_code=404, detail="Abonné non trouvé.")

    if data.first_name is not None:
        sub.first_name = data.first_name
    if data.source is not None:
        sub.source = data.source
    if data.status is not None:
        if data.status == "active" and sub.status != "active":
            sub.confirmed_at = datetime.now(timezone.utc)
        elif data.status == "unsubscribed" and sub.status != "unsubscribed":
            sub.unsubscribed_at = datetime.now(timezone.utc)
        sub.status = data.status

    await db.commit()
    await db.refresh(sub)
    return sub


@router.delete("/subscribers/{subscriber_id}")
async def delete_subscriber(
    subscriber_id: str,
    db: AsyncSession = Depends(get_db),
    user=Depends(RequirePermission("newsletter.manage"))
):
    res = await db.execute(select(NewsletterSubscriber).where(NewsletterSubscriber.id == subscriber_id))
    sub = res.scalars().first()
    if not sub:
        raise HTTPException(status_code=404, detail="Abonné non trouvé.")

    await db.delete(sub)
    await db.commit()
    return {"success": True, "message": "Abonné supprimé avec succès."}


@router.get("/subscribers/export/csv")
async def export_subscribers_csv(
    db: AsyncSession = Depends(get_db),
    user=Depends(RequirePermission("newsletter.manage"))
):
    res = await db.execute(select(NewsletterSubscriber).order_by(desc(NewsletterSubscriber.created_at)))
    subscribers = res.scalars().all()

    output = io.StringIO()
    writer = csv.writer(output)
    writer.writerow(["Email", "Prénom", "Statut", "Source", "Date Inscription", "Date Confirmation"])

    for s in subscribers:
        writer.writerow([
            s.email,
            s.first_name or "",
            s.status,
            s.source,
            s.created_at.strftime("%Y-%m-%d %H:%M:%S") if s.created_at else "",
            s.confirmed_at.strftime("%Y-%m-%d %H:%M:%S") if s.confirmed_at else ""
        ])

    output.seek(0)
    response = StreamingResponse(iter([output.getvalue()]), media_type="text/csv")
    response.headers["Content-Disposition"] = "attachment; filename=subscribers_3m_services.csv"
    return response


@router.post("/subscribers/import/csv")
async def import_subscribers_csv(
    file: UploadFile = File(...),
    db: AsyncSession = Depends(get_db),
    user=Depends(RequirePermission("newsletter.manage"))
):
    if not file.filename.endswith(".csv"):
        raise HTTPException(status_code=400, detail="Veuillez téléverser un fichier CSV valide.")

    content = await file.read()
    text = content.decode("utf-8-sig", errors="ignore")
    reader = csv.reader(io.StringIO(text))

    header = next(reader, None)
    imported = 0
    duplicates = 0
    invalid = 0

    now = datetime.now(timezone.utc)

    for row in reader:
        if not row:
            continue
        email = row[0].strip().lower() if len(row) > 0 else ""
        first_name = row[1].strip() if len(row) > 1 else None

        if not email or not EMAIL_REGEX.match(email):
            invalid += 1
            continue

        res = await db.execute(select(NewsletterSubscriber).where(NewsletterSubscriber.email == email))
        if res.scalars().first():
            duplicates += 1
            continue

        sub = NewsletterSubscriber(
            email=email,
            first_name=first_name,
            status="active",
            source="csv_import",
            consent_given=True,
            consent_timestamp=now,
            confirmed_at=now,
            unsubscribe_token=uuid.uuid4().hex
        )
        db.add(sub)
        imported += 1

    await db.commit()
    return {
        "success": True,
        "imported": imported,
        "duplicates": duplicates,
        "invalid": invalid
    }


# ==========================================
# 3. CAMPAIGN MANAGEMENT
# ==========================================
@router.get("/campaigns", response_model=List[CampaignResponse])
async def list_campaigns(
    db: AsyncSession = Depends(get_db),
    user=Depends(RequirePermission("newsletter.view"))
):
    res = await db.execute(select(NewsletterCampaign).order_by(desc(NewsletterCampaign.created_at)))
    return res.scalars().all()


@router.post("/campaigns", response_model=CampaignResponse)
async def create_campaign(
    data: CampaignCreate,
    background_tasks: BackgroundTasks,
    db: AsyncSession = Depends(get_db),
    current_user=Depends(get_current_user)
):
    campaign = NewsletterCampaign(
        title=data.title,
        subject=data.subject,
        preview_text=data.preview_text,
        article_id=data.article_id,
        template_id=data.template_id,
        recipient_segment=data.recipient_segment,
        status="draft",
        created_by_id=current_user.id
    )
    db.add(campaign)
    await db.commit()
    await db.refresh(campaign)

    if data.send_now:
        background_tasks.add_task(process_campaign_dispatch, campaign.id)

    return campaign


@router.get("/campaigns/{campaign_id}", response_model=CampaignResponse)
async def get_campaign(
    campaign_id: str,
    db: AsyncSession = Depends(get_db),
    user=Depends(RequirePermission("newsletter.view"))
):
    res = await db.execute(select(NewsletterCampaign).where(NewsletterCampaign.id == campaign_id))
    camp = res.scalars().first()
    if not camp:
        raise HTTPException(status_code=404, detail="Campagne non trouvée.")
    return camp


@router.put("/campaigns/{campaign_id}", response_model=CampaignResponse)
async def update_campaign(
    campaign_id: str,
    data: CampaignUpdate,
    db: AsyncSession = Depends(get_db),
    user=Depends(RequirePermission("newsletter.manage"))
):
    res = await db.execute(select(NewsletterCampaign).where(NewsletterCampaign.id == campaign_id))
    camp = res.scalars().first()
    if not camp:
        raise HTTPException(status_code=404, detail="Campagne non trouvée.")

    if camp.status in ("processing", "sent"):
        raise HTTPException(status_code=400, detail="Impossible de modifier une campagne déjà envoyée ou en cours d'envoi.")

    if data.title is not None:
        camp.title = data.title
    if data.subject is not None:
        camp.subject = data.subject
    if data.preview_text is not None:
        camp.preview_text = data.preview_text
    if data.article_id is not None:
        camp.article_id = data.article_id
    if data.template_id is not None:
        camp.template_id = data.template_id
    if data.recipient_segment is not None:
        camp.recipient_segment = data.recipient_segment
    if data.status is not None:
        camp.status = data.status

    await db.commit()
    await db.refresh(camp)
    return camp


@router.delete("/campaigns/{campaign_id}")
async def delete_campaign(
    campaign_id: str,
    db: AsyncSession = Depends(get_db),
    user=Depends(RequirePermission("newsletter.manage"))
):
    res = await db.execute(select(NewsletterCampaign).where(NewsletterCampaign.id == campaign_id))
    camp = res.scalars().first()
    if not camp:
        raise HTTPException(status_code=404, detail="Campagne non trouvée.")

    await db.delete(camp)
    await db.commit()
    return {"success": True, "message": "Campagne supprimée avec succès."}


@router.post("/campaigns/{campaign_id}/send")
async def send_campaign(
    campaign_id: str,
    background_tasks: BackgroundTasks,
    db: AsyncSession = Depends(get_db),
    user=Depends(RequirePermission("newsletter.send"))
):
    res = await db.execute(select(NewsletterCampaign).where(NewsletterCampaign.id == campaign_id))
    camp = res.scalars().first()
    if not camp:
        raise HTTPException(status_code=404, detail="Campagne non trouvée.")

    if camp.status in ("processing", "sent"):
        raise HTTPException(status_code=400, detail="Cette campagne a déjà été envoyée ou est en cours d'acheminement.")

    background_tasks.add_task(process_campaign_dispatch, camp.id)
    return {"success": True, "message": "L'envoi de la campagne a été lancé en arrière-plan."}


@router.post("/campaigns/{campaign_id}/test")
async def send_test_campaign(
    campaign_id: str,
    req: TestEmailRequest,
    db: AsyncSession = Depends(get_db),
    user=Depends(RequirePermission("newsletter.manage"))
):
    res = await db.execute(select(NewsletterCampaign).where(NewsletterCampaign.id == campaign_id))
    camp = res.scalars().first()
    if not camp:
        raise HTTPException(status_code=404, detail="Campagne non trouvée.")

    clean_email = req.email.strip().lower()
    if not clean_email or not EMAIL_REGEX.match(clean_email):
        raise HTTPException(status_code=422, detail="Adresse courriel invalide pour le test.")

    settings_map = await get_all_settings_map(db)
    smtp_cfg = get_smtp_config_from_db(settings_map)
    frontend_url = app_settings.FRONTEND_URL or "https://www.3mservice.shop"

    post = None
    if camp.article_id:
        p_res = await db.execute(select(Post).where(Post.id == camp.article_id))
        post = p_res.scalars().first()

    if post:
        subject, html_content, plain_text = render_article_notification_email(
            post=post,
            frontend_url=frontend_url,
            unsubscribe_url=f"{frontend_url}/unsubscribe?demo=test",
            preview_text=f"[TEST] {camp.preview_text or ''}"
        )
        subject = f"[TEST] {subject}"
    else:
        subject = f"[TEST] {camp.subject}"
        body_content = f"""
          <div style="padding: 10px; background: #fff2f0; border-left: 4px solid #B84A39; margin-bottom: 20px; font-size: 13px;">
            <strong>Ceci est un courriel de test administrateur.</strong>
          </div>
          <h2>{camp.title}</h2>
          <p>{camp.preview_text or ''}</p>
        """
        html_content = render_base_email(body_content, unsubscribe_url=f"{frontend_url}/unsubscribe?demo=test")
        plain_text = f"[TEST] {camp.title}\n\n{camp.preview_text or ''}"

    import asyncio
    success, err = await asyncio.to_thread(
        send_smtp_sync,
        clean_email,
        subject,
        html_content,
        plain_text,
        smtp_cfg,
        f"{frontend_url}/unsubscribe"
    )

    if not success:
        raise HTTPException(status_code=500, detail=f"Échec de l'envoi de test : {err}")

    return {"success": True, "message": f"Courriel de test envoyé à {clean_email} avec succès."}


# ==========================================
# 4. TEMPLATE MANAGEMENT
# ==========================================
@router.get("/templates", response_model=List[TemplateResponse])
async def list_templates(
    db: AsyncSession = Depends(get_db),
    user=Depends(RequirePermission("newsletter.view"))
):
    res = await db.execute(select(NewsletterTemplate).order_by(desc(NewsletterTemplate.is_default)))
    templates = res.scalars().all()

    # Seed default template if none exist
    if not templates:
        default_tpl = NewsletterTemplate(
            name="Modèle Officiel 3M SERVICES",
            subject_default="Un nouvel article de 3M SERVICES",
            preview_text_default="Découvrez nos dernières réflexions, initiatives et opportunités.",
            heading="Découvrez notre nouvel article",
            brand_color="#0D0E0D",
            accent_color="#B84A39",
            is_default=True
        )
        db.add(default_tpl)
        await db.commit()
        await db.refresh(default_tpl)
        templates = [default_tpl]

    return templates


@router.post("/templates", response_model=TemplateResponse)
async def create_template(
    data: TemplateCreate,
    db: AsyncSession = Depends(get_db),
    user=Depends(RequirePermission("newsletter.manage"))
):
    tpl = NewsletterTemplate(**data.dict())
    db.add(tpl)
    await db.commit()
    await db.refresh(tpl)
    return tpl


@router.put("/templates/{template_id}", response_model=TemplateResponse)
async def update_template(
    template_id: str,
    data: TemplateUpdate,
    db: AsyncSession = Depends(get_db),
    user=Depends(RequirePermission("newsletter.manage"))
):
    res = await db.execute(select(NewsletterTemplate).where(NewsletterTemplate.id == template_id))
    tpl = res.scalars().first()
    if not tpl:
        raise HTTPException(status_code=404, detail="Modèle non trouvé.")

    for k, v in data.dict(exclude_unset=True).items():
        setattr(tpl, k, v)

    await db.commit()
    await db.refresh(tpl)
    return tpl


@router.delete("/templates/{template_id}")
async def delete_template(
    template_id: str,
    db: AsyncSession = Depends(get_db),
    user=Depends(RequirePermission("newsletter.manage"))
):
    res = await db.execute(select(NewsletterTemplate).where(NewsletterTemplate.id == template_id))
    tpl = res.scalars().first()
    if not tpl:
        raise HTTPException(status_code=404, detail="Modèle non trouvé.")
    if tpl.is_default:
        raise HTTPException(status_code=400, detail="Impossible de supprimer le modèle par défaut.")

    await db.delete(tpl)
    await db.commit()
    return {"success": True, "message": "Modèle supprimé avec succès."}


# ==========================================
# 5. DELIVERY LOGS
# ==========================================
@router.get("/deliveries", response_model=List[DeliveryResponse])
async def list_deliveries(
    limit: int = Query(50, ge=1, le=200),
    campaign_id: Optional[str] = None,
    db: AsyncSession = Depends(get_db),
    user=Depends(RequirePermission("newsletter.view"))
):
    query = select(NewsletterDelivery)
    if campaign_id:
        query = query.where(NewsletterDelivery.campaign_id == campaign_id)

    query = query.order_by(desc(NewsletterDelivery.created_at)).limit(limit)
    res = await db.execute(query)
    return res.scalars().all()


# ==========================================
# 6. SETTINGS & SMTP DIAGNOSTICS
# ==========================================
@router.get("/settings", response_model=NewsletterSettingsSchema)
async def get_newsletter_settings(
    db: AsyncSession = Depends(get_db),
    user=Depends(RequirePermission("newsletter.manage"))
):
    settings_map = await get_all_settings_map(db)
    auto_send = settings_map.get("newsletter_auto_send", "true").lower() in ("true", "1", "yes")

    return NewsletterSettingsSchema(
        auto_send_on_publish=auto_send,
        from_name=settings_map.get("newsletter_from_name", "3M SERVICES"),
        from_email=settings_map.get("newsletter_from_email", "contact@3mservice.shop"),
        reply_to=settings_map.get("newsletter_reply_to", "contact@3mservice.shop"),
        smtp_host=settings_map.get("smtp_host", "smtp.hostinger.com"),
        smtp_port=int(settings_map.get("smtp_port", 465)),
        smtp_user=settings_map.get("smtp_username", "contact@3mservice.shop"),
        smtp_pass="••••••••••••" if settings_map.get("smtp_password") else "",
        smtp_secure=settings_map.get("smtp_secure", "true").lower() in ("true", "1", "yes"),
        teams_webhook_url=settings_map.get("teams_webhook_url", "")
    )


@router.put("/settings")
async def update_newsletter_settings(
    data: NewsletterSettingsSchema,
    db: AsyncSession = Depends(get_db),
    user=Depends(RequirePermission("newsletter.manage"))
):
    mapping = {
        "newsletter_auto_send": str(data.auto_send_on_publish).lower(),
        "newsletter_from_name": data.from_name,
        "newsletter_from_email": data.from_email,
        "newsletter_reply_to": data.reply_to,
        "smtp_host": data.smtp_host or "smtp.hostinger.com",
        "smtp_port": str(data.smtp_port or 465),
        "smtp_username": data.smtp_user or "contact@3mservice.shop",
        "smtp_secure": str(data.smtp_secure).lower(),
        "teams_webhook_url": data.teams_webhook_url or ""
    }

    # Only update password if provided and not masked
    if data.smtp_pass and data.smtp_pass != "••••••••••••":
        mapping["smtp_password"] = data.smtp_pass

    for k, v in mapping.items():
        res = await db.execute(select(Setting).where(Setting.key == k))
        s = res.scalars().first()
        if s:
            s.value = v
        else:
            s = Setting(key=k, value=v, category="newsletter")
            db.add(s)

    await db.commit()
    return {"success": True, "message": "Paramètres d'infolettre et SMTP mis à jour avec succès."}


@router.post("/settings/test-smtp")
async def test_smtp_configuration(
    req: TestEmailRequest,
    db: AsyncSession = Depends(get_db),
    user=Depends(RequirePermission("newsletter.manage"))
):
    clean_email = req.email.strip().lower()
    if not clean_email or not EMAIL_REGEX.match(clean_email):
        raise HTTPException(status_code=422, detail="Adresse courriel invalide.")

    settings_map = await get_all_settings_map(db)
    smtp_cfg = get_smtp_config_from_db(settings_map)

    subject = "3M SERVICES - Test de configuration SMTP Hostinger"
    body = """
      <div style="font-family: Arial, sans-serif; padding: 20px;">
        <h2 style="color: #0D0E0D;">Test de configuration SMTP réussi !</h2>
        <p style="color: #555555; line-height: 1.6;">
          Ce message confirme que votre serveur SMTP Hostinger est correctement configuré et opérationnel
          pour l'envoi automatisé des avis de parution et de l'infolettre de <strong>3M SERVICES</strong>.
        </p>
        <p style="color: #777777; font-size: 12px; margin-top: 30px;">
          Expédié via contact@3mservice.shop • Date: {now}
        </p>
      </div>
    """.replace("{now}", datetime.now(timezone.utc).strftime("%Y-%m-%d %H:%M:%S UTC"))
    plain_text = "Test de configuration SMTP réussi pour 3M SERVICES."

    import asyncio
    success, err = await asyncio.to_thread(
        send_smtp_sync,
        clean_email,
        subject,
        render_base_email(body),
        plain_text,
        smtp_cfg,
        None
    )

    if not success:
        raise HTTPException(
            status_code=500,
            detail=f"Erreur de connexion SMTP : {err}. Vérifiez vos identifiants Hostinger (hôte, port 465, mot de passe)."
        )

    return {"success": True, "message": f"Test SMTP réussi ! Un courriel a été transmis à {clean_email}."}
