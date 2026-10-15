from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, and_, or_
from sqlalchemy.orm import selectinload
from typing import List, Optional, Dict, Any
from datetime import datetime, timezone
from app.core.database import get_db
from app.models.event import Event, EventTranslation
from app.models.submission import Submission

router = APIRouter()

@router.get("/")
async def list_public_events(
    category_id: Optional[str] = None,
    lang: Optional[str] = "fr",
    db: AsyncSession = Depends(get_db)
):
    query = select(Event).options(
        selectinload(Event.translations),
        selectinload(Event.speakers),
        selectinload(Event.category)
    ).where(
        Event.status == "published"
    ).order_by(Event.start_date.asc())
    
    if category_id:
        query = query.where(Event.category_id == category_id)
        
    result = await db.execute(query)
    events = result.scalars().unique().all()
    
    formatted = []
    for e in events:
        # Get translation matching requested language or first available
        trans = next((t for t in e.translations if t.language.lower() == (lang or "fr").lower()), None)
        if not trans and e.translations:
            trans = e.translations[0]
            
        formatted.append({
            "id": e.id,
            "slug": e.slug,
            "status": e.status,
            "start_date": e.start_date,
            "end_date": e.end_date,
            "location": e.location,
            "is_online": e.is_online,
            "meeting_url": e.meeting_url,
            "registration_required": e.registration_required,
            "registration_url": e.registration_url,
            "max_participants": e.max_participants,
            "category": {"id": e.category.id, "name": e.category.name} if e.category else None,
            "title": trans.title if trans else e.slug,
            "excerpt": trans.excerpt if trans else None,
            "content": trans.content if trans else None,
            "speakers": [{"id": s.id, "name": s.name, "role": s.role} for s in e.speakers] if e.speakers else []
        })
        
    return formatted

@router.get("/{id_or_slug}")
async def get_public_event(id_or_slug: str, lang: Optional[str] = "fr", db: AsyncSession = Depends(get_db)):
    query = select(Event).options(
        selectinload(Event.translations),
        selectinload(Event.speakers),
        selectinload(Event.category)
    ).where(
        and_(
            or_(Event.id == id_or_slug, Event.slug == id_or_slug),
            Event.status == "published"
        )
    )
    result = await db.execute(query)
    e = result.scalars().first()
    if not e:
        raise HTTPException(status_code=404, detail="Event not found")
        
    trans = next((t for t in e.translations if t.language.lower() == (lang or "fr").lower()), None)
    if not trans and e.translations:
        trans = e.translations[0]
        
    return {
        "id": e.id,
        "slug": e.slug,
        "status": e.status,
        "start_date": e.start_date,
        "end_date": e.end_date,
        "location": e.location,
        "is_online": e.is_online,
        "meeting_url": e.meeting_url,
        "registration_required": e.registration_required,
        "registration_url": e.registration_url,
        "max_participants": e.max_participants,
        "category": {"id": e.category.id, "name": e.category.name} if e.category else None,
        "title": trans.title if trans else e.slug,
        "excerpt": trans.excerpt if trans else None,
        "content": trans.content if trans else None,
        "speakers": [{"id": s.id, "name": s.name, "role": s.role} for s in e.speakers] if e.speakers else []
    }

@router.post("/{event_id}/register")
async def register_public_event(event_id: str, payload: Dict[str, Any], db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(Event).where(Event.id == event_id))
    event = result.scalars().first()
    if not event:
        raise HTTPException(status_code=404, detail="Event not found")
        
    name = payload.get("name", "").strip()
    email = payload.get("email", "").strip()
    if not name or not email:
        raise HTTPException(status_code=422, detail="Name and email are required")
        
    submission_payload = {
        **payload,
        "event_id": event.id,
        "event_slug": event.slug,
        "status": "new",
        "notes": []
    }
    submission = Submission(type="festival", payload=submission_payload)
    db.add(submission)
    await db.commit()
    await db.refresh(submission)
    return {"ok": True, "id": submission.id}
