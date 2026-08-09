from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from sqlalchemy.orm import selectinload
from app.core.database import get_db
from app.core.security import get_current_user, RequireRole
from app.schemas.event import EventCreate, EventResponse
from app.models.event import Event, EventTranslation
from datetime import datetime, timezone
from typing import List

router = APIRouter()

@router.get("/", response_model=List[EventResponse])
async def list_events(user = Depends(RequireRole(["SUPER_ADMIN", "EDITOR", "AUTHOR"])), db: AsyncSession = Depends(get_db)):
    query = select(Event).options(selectinload(Event.translations)).order_by(Event.start_date.desc())
    result = await db.execute(query)
    return result.scalars().all()

@router.get("/{id}", response_model=EventResponse)
async def get_event(id: str, user = Depends(RequireRole(["SUPER_ADMIN", "EDITOR", "AUTHOR"])), db: AsyncSession = Depends(get_db)):
    query = select(Event).where(Event.id == id).options(selectinload(Event.translations))
    result = await db.execute(query)
    event = result.scalars().first()
    if not event:
        raise HTTPException(status_code=404, detail="Event not found")
    return event

@router.post("/", response_model=EventResponse)
async def create_event(event_data: EventCreate, user = Depends(RequireRole(["SUPER_ADMIN", "EDITOR"])), db: AsyncSession = Depends(get_db)):
    event = Event(
        slug=event_data.slug,
        status=event_data.status,
        author_id=user.id,
        featured_image_id=event_data.featured_image_id,
        start_date=event_data.start_date,
        end_date=event_data.end_date,
        location=event_data.location
    )
    db.add(event)
    await db.commit()
    
    for t in event_data.translations:
        trans = EventTranslation(
            event_id=event.id,
            language=t.language,
            title=t.title,
            slug=t.slug,
            excerpt=t.excerpt,
            content=t.content,
            seo_title=t.seo_title,
            seo_description=t.seo_description,
            focus_keyword=t.focus_keyword,
            canonical_url=t.canonical_url,
            og_title=t.og_title,
            og_description=t.og_description,
            og_image_id=t.og_image_id,
            allow_index=t.allow_index,
            allow_follow=t.allow_follow
        )
        db.add(trans)
            
    await db.commit()
    
    # Reload with relationships
    result = await db.execute(select(Event).where(Event.id == event.id).options(selectinload(Event.translations)))
    return result.scalars().first()
