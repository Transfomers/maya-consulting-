from pydantic import BaseModel
from typing import List, Optional, Any
from datetime import datetime

class EventTranslationBase(BaseModel):
    language: str
    title: str
    slug: Optional[str] = None
    excerpt: Optional[str] = None
    content: Optional[str] = None
    
    # SEO
    seo_title: Optional[str] = None
    seo_description: Optional[str] = None
    focus_keyword: Optional[str] = None
    canonical_url: Optional[str] = None
    og_title: Optional[str] = None
    og_description: Optional[str] = None
    og_image_id: Optional[str] = None
    allow_index: bool = True
    allow_follow: bool = True

class EventBase(BaseModel):
    slug: str
    status: str = "draft"
    start_date: Optional[datetime] = None
    end_date: Optional[datetime] = None
    location: Optional[str] = None
    category_id: Optional[str] = None
    featured_image_id: Optional[str] = None
    
    # Advanced Event Fields
    all_day: bool = False
    timezone: str = "UTC"
    location_url: Optional[str] = None
    is_online: bool = False
    meeting_url: Optional[str] = None
    
    registration_required: bool = False
    registration_url: Optional[str] = None
    registration_deadline: Optional[datetime] = None
    max_participants: Optional[int] = None
    
    recurrence: Optional[Any] = None
    visibility: str = "public"

class EventCreate(EventBase):
    translations: List[EventTranslationBase]
    speaker_ids: Optional[List[str]] = []

class EventTranslationResponse(EventTranslationBase):
    id: str

    class Config:
        from_attributes = True

class EventResponse(EventBase):
    id: str
    author_id: str
    created_at: datetime
    updated_at: datetime
    translations: List[EventTranslationResponse] = []
    
    # We will just return speaker IDs or basic info for now, let's just do a list of dicts or Any
    speakers: List[Any] = []

    class Config:
        from_attributes = True
