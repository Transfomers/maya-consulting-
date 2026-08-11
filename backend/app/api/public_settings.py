from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from typing import List
from app.core.database import get_db
from app.models.setting import Setting
from app.schemas.setting import SettingResponse

router = APIRouter()

SENSITIVE_KEYS = [
    "smtp_password",
    "smtp_username",
    "smtp_host",
    "smtp_port",
    "stripe_secret_key",
    "mailchimp_api_key",
    "google_maps_api_key"
]

@router.get("/", response_model=List[SettingResponse])
async def get_public_settings(db: AsyncSession = Depends(get_db)):
    """
    Returns public settings. 
    Strips out sensitive keys and integrations that shouldn't be exposed to the public frontend.
    """
    query = select(Setting)
    result = await db.execute(query)
    settings_list = result.scalars().all()
    
    # Filter out sensitive keys completely for public
    public_settings = [s for s in settings_list if s.key not in SENSITIVE_KEYS]
    
    return public_settings
