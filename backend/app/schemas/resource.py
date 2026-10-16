from pydantic import BaseModel
from typing import Optional
from datetime import datetime

class ResourceBase(BaseModel):
    title: str
    slug: Optional[str] = None
    description: Optional[str] = None
    category_id: Optional[str] = None
    resource_type: str = "document" # course, guide, toolkit, report, template, video, external
    file_url: Optional[str] = None
    external_url: Optional[str] = None
    file_size: Optional[str] = None
    mime_type: Optional[str] = None
    author: Optional[str] = None
    tags: Optional[str] = None
    is_published: bool = True
    is_featured: bool = False
    downloads_count: int = 0
    language: str = "fr"
    skill_level: Optional[str] = None # Débutant, Intermédiaire, Avancé
    duration: Optional[str] = None
    target_audience: Optional[str] = None
    learning_objectives: Optional[str] = None
    prerequisites: Optional[str] = None

class ResourceCreate(ResourceBase):
    pass

class ResourceUpdate(BaseModel):
    title: Optional[str] = None
    slug: Optional[str] = None
    description: Optional[str] = None
    category_id: Optional[str] = None
    resource_type: Optional[str] = None
    file_url: Optional[str] = None
    external_url: Optional[str] = None
    file_size: Optional[str] = None
    mime_type: Optional[str] = None
    author: Optional[str] = None
    tags: Optional[str] = None
    is_published: Optional[bool] = None
    is_featured: Optional[bool] = None
    downloads_count: Optional[int] = None
    language: Optional[str] = None
    skill_level: Optional[str] = None
    duration: Optional[str] = None
    target_audience: Optional[str] = None
    learning_objectives: Optional[str] = None
    prerequisites: Optional[str] = None

class CategoryBrief(BaseModel):
    id: str
    name: str
    slug: str

    class Config:
        from_attributes = True

class ResourceResponse(ResourceBase):
    id: str
    created_at: datetime
    updated_at: datetime
    category: Optional[CategoryBrief] = None

    class Config:
        from_attributes = True
