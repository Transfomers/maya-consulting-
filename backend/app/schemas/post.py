from pydantic import BaseModel
from typing import List, Optional
from datetime import datetime

class ReferenceBase(BaseModel):
    title: str
    publisher: Optional[str] = None
    author: Optional[str] = None
    url: Optional[str] = None
    publication_date: Optional[str] = None
    description: Optional[str] = None

class ReferenceCreate(ReferenceBase):
    pass

class ReferenceResponse(ReferenceBase):
    id: str

    class Config:
        from_attributes = True

class PostTranslationBase(BaseModel):
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

class PostBase(BaseModel):
    slug: str
    status: str = "draft"
    category_id: Optional[str] = None
    featured_image_id: Optional[str] = None

class PostCreate(PostBase):
    translations: List[PostTranslationBase]
    references: Optional[List[ReferenceCreate]] = None

class PostTranslationResponse(PostTranslationBase):
    id: str

    class Config:
        from_attributes = True

class PostResponse(PostBase):
    id: str
    author_id: str
    created_at: datetime
    updated_at: datetime
    published_at: Optional[datetime] = None
    translations: List[PostTranslationResponse] = []
    references: List[ReferenceResponse] = []

    class Config:
        from_attributes = True
