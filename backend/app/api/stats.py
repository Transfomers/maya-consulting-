import os
from datetime import datetime, timezone
from typing import List, Optional, Any, Dict
from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func, or_, desc
from sqlalchemy.orm import selectinload
from pydantic import BaseModel

from app.core.database import get_db
from app.core.security import RequirePermission
from app.models.post import Post, Category, PostTranslation
from app.models.media import Media
from app.models.event import Event, EventTranslation
from app.models.resource import Resource
from app.models.newsletter import NewsletterSubscriber
from app.models.submission import Submission

router = APIRouter()

UPLOAD_DIR = os.path.join(os.path.dirname(os.path.dirname(os.path.dirname(__file__))), "data", "uploads")


def get_storage_usage() -> int:
    total_bytes = 0
    if os.path.exists(UPLOAD_DIR):
        for root, _, files in os.walk(UPLOAD_DIR):
            for f in files:
                fp = os.path.join(root, f)
                try:
                    total_bytes += os.path.getsize(fp)
                except Exception:
                    pass
    return total_bytes


class StatsResponse(BaseModel):
    total_articles: int
    published_articles: int
    draft_articles: int
    scheduled_articles: int
    review_articles: int = 0
    archived_articles: int = 0
    total_categories: int
    total_media: int
    unreferenced_media: int = 0
    storage_usage_bytes: int = 0
    total_events: int
    upcoming_events: int = 0
    completed_events: int = 0
    total_resources: int = 0
    published_resources: int = 0
    draft_resources: int = 0
    total_subscribers: int = 0
    total_submissions: int = 0
    pending_submissions: int = 0
    total_partners: int = 0


@router.get("", response_model=StatsResponse)
@router.get("/", response_model=StatsResponse)
async def get_stats(user = Depends(RequirePermission("articles.view")), db: AsyncSession = Depends(get_db)):
    now = datetime.now(timezone.utc)

    # Articles
    total_articles = (await db.execute(select(func.count(Post.id)))).scalar() or 0
    published_articles = (await db.execute(select(func.count(Post.id)).where(Post.status == "published"))).scalar() or 0
    draft_articles = (await db.execute(select(func.count(Post.id)).where(Post.status == "draft"))).scalar() or 0
    scheduled_articles = (await db.execute(select(func.count(Post.id)).where(Post.status == "scheduled"))).scalar() or 0
    review_articles = (await db.execute(select(func.count(Post.id)).where(Post.status.in_(["review", "in_review"])))).scalar() or 0
    archived_articles = (await db.execute(select(func.count(Post.id)).where(Post.status == "archived"))).scalar() or 0

    # Categories
    total_categories = (await db.execute(select(func.count(Category.id)))).scalar() or 0

    # Media & Storage
    total_media = (await db.execute(select(func.count(Media.id)))).scalar() or 0
    storage_usage_bytes = get_storage_usage()

    # Unreferenced media
    used_post_media = select(Post.featured_image_id).where(Post.featured_image_id != None)
    used_event_media = select(Event.featured_image_id).where(Event.featured_image_id != None)
    unreferenced_res = await db.execute(
        select(func.count(Media.id)).where(
            ~Media.id.in_(used_post_media),
            ~Media.id.in_(used_event_media)
        )
    )
    unreferenced_media = unreferenced_res.scalar() or 0

    # Events
    total_events = (await db.execute(select(func.count(Event.id)))).scalar() or 0
    upcoming_events = (await db.execute(
        select(func.count(Event.id)).where(or_(Event.start_date >= now, Event.start_date == None), Event.status != "cancelled")
    )).scalar() or 0
    completed_events = (await db.execute(
        select(func.count(Event.id)).where(Event.start_date < now, Event.status != "cancelled")
    )).scalar() or 0

    # Resources
    total_resources = (await db.execute(select(func.count(Resource.id)))).scalar() or 0
    published_resources = (await db.execute(select(func.count(Resource.id)).where(Resource.is_published == True))).scalar() or 0
    draft_resources = (await db.execute(select(func.count(Resource.id)).where(Resource.is_published == False))).scalar() or 0

    # Newsletter Subscribers
    total_subscribers = (await db.execute(select(func.count(NewsletterSubscriber.id)).where(NewsletterSubscriber.status == "confirmed"))).scalar() or 0

    # Submissions
    total_submissions = (await db.execute(select(func.count(Submission.id)))).scalar() or 0
    all_subs_res = await db.execute(select(Submission))
    all_subs = all_subs_res.scalars().all()
    pending_submissions = 0
    for s in all_subs:
        st = (s.payload.get("status") if isinstance(s.payload, dict) else "new") or "new"
        if st in ("new", "in_review", "under_review", "nouveau"):
            pending_submissions += 1

    total_partners = (await db.execute(select(func.count(Submission.id)).where(Submission.type == "partner"))).scalar() or 0

    return StatsResponse(
        total_articles=total_articles,
        published_articles=published_articles,
        draft_articles=draft_articles,
        scheduled_articles=scheduled_articles,
        review_articles=review_articles,
        archived_articles=archived_articles,
        total_categories=total_categories,
        total_media=total_media,
        unreferenced_media=unreferenced_media,
        storage_usage_bytes=storage_usage_bytes,
        total_events=total_events,
        upcoming_events=upcoming_events,
        completed_events=completed_events,
        total_resources=total_resources,
        published_resources=published_resources,
        draft_resources=draft_resources,
        total_subscribers=total_subscribers,
        total_submissions=total_submissions,
        pending_submissions=pending_submissions,
        total_partners=total_partners
    )


@router.get("/overview-data")
async def get_overview_dashboard_data(
    user = Depends(RequirePermission("articles.view")),
    db: AsyncSession = Depends(get_db)
):
    """
    Returns full operational data for Dashboard widgets:
    - Recent activity
    - Content awaiting review
    - Upcoming events
    - Recent submissions
    - Content quality audit
    """
    now = datetime.now(timezone.utc)

    # 1. Recent Activity (Latest 5 items modified across posts, resources, events)
    recent_posts_q = await db.execute(
        select(Post)
        .options(selectinload(Post.translations))
        .order_by(Post.updated_at.desc(), Post.created_at.desc())
        .limit(5)
    )
    recent_posts = recent_posts_q.scalars().unique().all()

    activity: List[Dict[str, Any]] = []
    for p in recent_posts:
        title = p.slug
        if p.translations:
            title = p.translations[0].title or p.slug
        activity.append({
            "type": "article",
            "id": p.id,
            "title": title,
            "status": p.status,
            "timestamp": (p.updated_at or p.created_at).isoformat() if (p.updated_at or p.created_at) else None,
            "url": f"/admin/posts/{p.id}/edit"
        })

    recent_subs_q = await db.execute(select(Submission).order_by(Submission.created_at.desc()).limit(5))
    recent_subs = recent_subs_q.scalars().all()
    for s in recent_subs:
        pld = s.payload if isinstance(s.payload, dict) else {}
        name = pld.get("name") or pld.get("organization") or pld.get("email") or "Visiteur"
        activity.append({
            "type": "submission",
            "id": s.id,
            "title": f"Dossier {s.type}: {name}",
            "status": pld.get("status", "new"),
            "timestamp": s.created_at.isoformat() if s.created_at else None,
            "url": f"/admin/submissions"
        })

    activity.sort(key=lambda x: x["timestamp"] or "", reverse=True)

    # 2. Content Awaiting Review
    review_posts_q = await db.execute(
        select(Post)
        .where(Post.status.in_(["review", "in_review"]))
        .options(selectinload(Post.translations))
        .order_by(Post.created_at.desc())
        .limit(5)
    )
    awaiting_review = [
        {
            "id": p.id,
            "title": p.translations[0].title if p.translations else p.slug,
            "type": "article",
            "created_at": p.created_at.isoformat() if p.created_at else None,
            "url": f"/admin/posts/{p.id}/edit"
        }
        for p in review_posts_q.scalars().unique().all()
    ]

    # 3. Upcoming Events (Chronological order)
    events_q = await db.execute(
        select(Event)
        .options(selectinload(Event.translations))
        .where(or_(Event.start_date >= now, Event.start_date == None), Event.status != "cancelled")
        .order_by(Event.start_date.asc().nulls_last())
        .limit(5)
    )
    upcoming_events = [
        {
            "id": ev.id,
            "slug": ev.slug,
            "title": ev.translations[0].title if ev.translations else ev.slug,
            "start_date": ev.start_date.isoformat() if ev.start_date else None,
            "status": ev.status,
            "location": ev.location or ("En ligne" if ev.is_online else "À confirmer"),
            "url": f"/admin/events"
        }
        for ev in events_q.scalars().unique().all()
    ]

    # 4. Recent Submissions (sanitized)
    submissions_list = [
        {
            "id": s.id,
            "type": s.type,
            "name": (s.payload.get("name") or s.payload.get("organization") or "Visiteur") if isinstance(s.payload, dict) else "Visiteur",
            "email_preview": (s.payload.get("email", "").split("@")[0] + "@...") if isinstance(s.payload, dict) and s.payload.get("email") else "N/A",
            "status": (s.payload.get("status", "new") if isinstance(s.payload, dict) else "new") or "new",
            "created_at": s.created_at.isoformat() if s.created_at else None
        }
        for s in recent_subs[:5]
    ]

    # 5. Content Quality Audit
    all_published_posts_q = await db.execute(
        select(Post)
        .where(Post.status == "published")
        .options(selectinload(Post.translations))
    )
    quality_issues: List[Dict[str, Any]] = []
    for p in all_published_posts_q.scalars().unique().all():
        title = p.translations[0].title if p.translations else p.slug
        missing: List[str] = []
        if not p.featured_image_id:
            missing.append("Image à la une manquante")
        
        has_en = any(t.language == "en" for t in (p.translations or []))
        has_fr = any(t.language == "fr" for t in (p.translations or []))
        if not (has_en and has_fr):
            missing.append("Traduction bilingue incomplète")

        for tr in p.translations or []:
            if not tr.excerpt:
                missing.append(f"Extrait manquant ({tr.language})")
            if not tr.seo_description:
                missing.append(f"Meta-SEO manquante ({tr.language})")

        if missing:
            quality_issues.append({
                "id": p.id,
                "title": title,
                "url": f"/admin/posts/{p.id}/edit",
                "issues": list(set(missing))[:3]
            })

    return {
        "recent_activity": activity[:6],
        "awaiting_review": awaiting_review,
        "upcoming_events": upcoming_events,
        "recent_submissions": submissions_list,
        "quality_audit": quality_issues[:6]
    }

