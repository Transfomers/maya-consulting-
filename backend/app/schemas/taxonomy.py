from pydantic import BaseModel
from typing import Optional

class CategoryBase(BaseModel):
    name: str
    slug: str
    description: Optional[str] = None
    display_order: Optional[int] = 0
    is_archived: Optional[bool] = False

class CategoryCreate(CategoryBase):
    pass

class CategoryResponse(CategoryBase):
    id: str
    posts_count: int = 0
    resources_count: int = 0
    events_count: int = 0

    class Config:
        from_attributes = True

class TagBase(BaseModel):
    name: str
    slug: str

class TagCreate(TagBase):
    pass

class TagResponse(TagBase):
    id: str

    class Config:
        from_attributes = True
