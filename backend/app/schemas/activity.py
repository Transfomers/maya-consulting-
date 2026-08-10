from pydantic import BaseModel
from typing import Optional
from datetime import datetime

class ActivityLogBase(BaseModel):
    user_id: str
    user_email: str
    action: str
    entity_type: str
    entity_id: Optional[str] = None
    details: Optional[str] = None

class ActivityLogCreate(ActivityLogBase):
    pass

class ActivityLogResponse(ActivityLogBase):
    id: str
    created_at: datetime

    class Config:
        from_attributes = True
