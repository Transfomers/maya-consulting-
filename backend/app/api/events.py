from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, delete, and_, or_
from sqlalchemy.orm import selectinload
from app.core.database import get_db
from app.core.security import get_current_user, RequirePermission
from app.schemas.event import EventCreate, EventResponse
from app.models.event import Event, EventTranslation
from app.models.speaker import Speaker
from datetime import datetime, timezone
from typing import List, Optional, Any
from pydantic import BaseModel

router = APIRouter()

class MoveEventRequest(BaseModel):
    start_date: datetime
    end_date: datetime

@router.get("/", response_model=List[EventResponse])
async def list_events(
    start: Optional[datetime] = Query(None),
    end: Optional[datetime] = Query(None),
    status: Optional[str] = Query(None),
    category_id: Optional[str] = Query(None),
    user = Depends(RequirePermission("events.view")), 
    db: AsyncSession = Depends(get_db)
):
    query = select(Event).options(
        selectinload(Event.translations),
        selectinload(Event.speakers)
    ).order_by(Event.start_date.desc())
    
    if start:
        query = query.where(or_(Event.start_date >= start, Event.start_date == None))
    if end:
        query = query.where(or_(Event.start_date <= end, Event.start_date == None))
    if status and status != 'All':
        query = query.where(Event.status == status)
    if category_id and category_id != 'All':
        query = query.where(Event.category_id == category_id)
        
    result = await db.execute(query)
    return result.scalars().unique().all()

@router.get("/{id}", response_model=EventResponse)
async def get_event(id: str, user = Depends(RequirePermission("events.view")), db: AsyncSession = Depends(get_db)):
    query = select(Event).where(Event.id == id).options(
        selectinload(Event.translations),
        selectinload(Event.speakers)
    )
    result = await db.execute(query)
    event = result.scalars().first()
    if not event:
        raise HTTPException(status_code=404, detail="Event not found")
    return event

async def _set_event_fields(event: Event, data: EventCreate, db: AsyncSession):
    event.slug = data.slug
    event.status = data.status
    event.category_id = data.category_id
    event.featured_image_id = data.featured_image_id
    event.start_date = data.start_date
    event.end_date = data.end_date
    event.location = data.location
    event.all_day = data.all_day
    event.timezone = data.timezone
    event.location_url = data.location_url
    event.is_online = data.is_online
    event.meeting_url = data.meeting_url
    event.registration_required = data.registration_required
    event.registration_url = data.registration_url
    event.registration_deadline = data.registration_deadline
    event.max_participants = data.max_participants
    event.recurrence = data.recurrence
    event.visibility = data.visibility

    # Handle speakers
    if data.speaker_ids is not None:
        if data.speaker_ids:
            speakers_result = await db.execute(select(Speaker).where(Speaker.id.in_(data.speaker_ids)))
            event.speakers = speakers_result.scalars().all()
        else:
            event.speakers = []

@router.post("/", response_model=EventResponse)
async def create_event(event_data: EventCreate, user = Depends(RequirePermission("events.edit")), db: AsyncSession = Depends(get_db)):
    event = Event(author_id=user.id)
    await _set_event_fields(event, event_data, db)
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
    result = await db.execute(select(Event).where(Event.id == event.id).options(selectinload(Event.translations), selectinload(Event.speakers)))
    return result.scalars().first()

@router.put("/{id}", response_model=EventResponse)
async def update_event(id: str, event_data: EventCreate, user = Depends(RequirePermission("events.edit")), db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(Event).where(Event.id == id).options(selectinload(Event.translations), selectinload(Event.speakers)))
    event = result.scalars().first()
    if not event:
        raise HTTPException(status_code=404, detail="Event not found")
        
    await _set_event_fields(event, event_data, db)
    event.updated_at = datetime.now(timezone.utc)
    
    await db.execute(delete(EventTranslation).where(EventTranslation.event_id == id))
    
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
    result = await db.execute(select(Event).where(Event.id == event.id).options(selectinload(Event.translations), selectinload(Event.speakers)))
    return result.scalars().first()

@router.delete("/{id}")
async def delete_event(id: str, user = Depends(RequirePermission("events.edit")), db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(Event).where(Event.id == id))
    event = result.scalars().first()
    if not event:
        raise HTTPException(status_code=404, detail="Event not found")
    await db.delete(event)
    await db.commit()
    return {"ok": True}

@router.patch("/{id}/move")
async def move_event(id: str, data: MoveEventRequest, user = Depends(RequirePermission("events.edit")), db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(Event).where(Event.id == id))
    event = result.scalars().first()
    if not event:
        raise HTTPException(status_code=404, detail="Event not found")
        
    # Check conflicts here if necessary
    event.start_date = data.start_date
    event.end_date = data.end_date
    event.updated_at = datetime.now(timezone.utc)
    
    await db.commit()
    result = await db.execute(select(Event).where(Event.id == event.id).options(selectinload(Event.translations), selectinload(Event.speakers)))
    return result.scalars().first()

@router.post("/{id}/duplicate")
async def duplicate_event(id: str, user = Depends(RequirePermission("events.edit")), db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(Event).where(Event.id == id).options(selectinload(Event.translations), selectinload(Event.speakers)))
    original = result.scalars().first()
    if not original:
        raise HTTPException(status_code=404, detail="Event not found")
        
    new_event = Event(
        slug=f"{original.slug}-copy-{int(datetime.now().timestamp())}",
        status="draft",
        author_id=user.id,
        category_id=original.category_id,
        featured_image_id=original.featured_image_id,
        start_date=original.start_date,
        end_date=original.end_date,
        location=original.location,
        all_day=original.all_day,
        timezone=original.timezone,
        location_url=original.location_url,
        is_online=original.is_online,
        meeting_url=original.meeting_url,
        registration_required=original.registration_required,
        registration_url=original.registration_url,
        registration_deadline=original.registration_deadline,
        max_participants=original.max_participants,
        recurrence=original.recurrence,
        visibility=original.visibility,
        speakers=original.speakers
    )
    db.add(new_event)
    await db.commit()
    
    for t in original.translations:
        trans = EventTranslation(
            event_id=new_event.id,
            language=t.language,
            title=f"{t.title} (Copy)",
            slug=f"{t.slug}-copy-{int(datetime.now().timestamp())}" if t.slug else None,
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
    result = await db.execute(select(Event).where(Event.id == new_event.id).options(selectinload(Event.translations), selectinload(Event.speakers)))
    return result.scalars().first()
