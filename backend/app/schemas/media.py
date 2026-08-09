from pydantic import BaseModel
from typing import Optional
from datetime import datetime

class MediaBase(BaseModel):
    filename: str
    url: str
    mime_type: Optional[str] = None
    alt_text: Optional[str] = None
    caption: Optional[str] = None

class MediaCreate(MediaBase):
    pass

class MediaUpdate(BaseModel):
    alt_text: Optional[str] = None
    caption: Optional[str] = None

class MediaResponse(MediaBase):
    id: str
    uploaded_by_id: str
    created_at: datetime

    class Config:
        from_attributes = True
