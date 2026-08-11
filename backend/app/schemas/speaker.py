from pydantic import BaseModel
from typing import Optional

class SpeakerBase(BaseModel):
    name: str
    position: Optional[str] = None
    company: Optional[str] = None
    bio: Optional[str] = None
    linkedin_url: Optional[str] = None
    photo_id: Optional[str] = None

class SpeakerCreate(SpeakerBase):
    pass

class SpeakerResponse(SpeakerBase):
    id: str

    class Config:
        from_attributes = True
