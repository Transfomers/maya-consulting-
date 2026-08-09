from pydantic import BaseModel
from typing import List, Optional
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
    featured_image_id: Optional[str] = None

class EventCreate(EventBase):
    translations: List[EventTranslationBase]

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

    class Config:
        from_attributes = True
