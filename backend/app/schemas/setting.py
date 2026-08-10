from pydantic import BaseModel
from typing import Optional, List
from datetime import datetime

class SettingBase(BaseModel):
    key: str
    value: Optional[str] = None
    category: str

class SettingCreate(SettingBase):
    pass

class SettingUpdate(BaseModel):
    value: Optional[str] = None

class SettingResponse(SettingBase):
    id: str
    updated_at: datetime

    class Config:
        from_attributes = True

class SettingBulkUpdate(BaseModel):
    settings: List[SettingBase]
