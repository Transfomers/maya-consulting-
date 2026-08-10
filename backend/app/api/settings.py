from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from typing import List
from app.core.database import get_db
from app.core.security import RequireRole
from app.models.setting import Setting
from app.schemas.setting import SettingBase, SettingResponse, SettingBulkUpdate

router = APIRouter()

@router.get("/", response_model=List[SettingResponse])
async def get_settings(category: str = None, user = Depends(RequireRole(["SUPER_ADMIN", "ADMIN"])), db: AsyncSession = Depends(get_db)):
    query = select(Setting)
    if category:
        query = query.where(Setting.category == category)
    result = await db.execute(query)
    return result.scalars().all()

@router.put("/", response_model=List[SettingResponse])
async def update_settings(update_data: SettingBulkUpdate, user = Depends(RequireRole(["SUPER_ADMIN", "ADMIN"])), db: AsyncSession = Depends(get_db)):
    updated_settings = []
    for item in update_data.settings:
        res = await db.execute(select(Setting).where(Setting.key == item.key))
        setting = res.scalars().first()
        if setting:
            setting.value = item.value
            setting.category = item.category
        else:
            setting = Setting(key=item.key, value=item.value, category=item.category)
            db.add(setting)
        updated_settings.append(setting)
    
    await db.commit()
    for s in updated_settings:
        await db.refresh(s)
        
    return updated_settings
