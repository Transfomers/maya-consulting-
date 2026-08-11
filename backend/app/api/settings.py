from fastapi import APIRouter, Depends, HTTPException, UploadFile, File
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from typing import List
from app.core.database import get_db
from app.core.security import RequireRole
from app.models.setting import Setting
from app.schemas.setting import SettingBase, SettingResponse, SettingBulkUpdate
import os
import uuid

router = APIRouter()

UPLOAD_DIR = os.path.join(os.path.dirname(os.path.dirname(os.path.dirname(__file__))), "data", "uploads")

@router.get("/", response_model=List[SettingResponse])
async def get_settings(category: str = None, user = Depends(RequireRole(["SUPER_ADMIN", "ADMIN"])), db: AsyncSession = Depends(get_db)):
    query = select(Setting)
    if category:
        query = query.where(Setting.category == category)
    result = await db.execute(query)
    settings_list = result.scalars().all()
    
    # Mask SMTP password
    for s in settings_list:
        if s.key == "smtp_password" and s.value:
            s.value = "••••••••••••"
            
    return settings_list

@router.put("/", response_model=List[SettingResponse])
async def update_settings(update_data: SettingBulkUpdate, user = Depends(RequireRole(["SUPER_ADMIN", "ADMIN"])), db: AsyncSession = Depends(get_db)):
    updated_settings = []
    for item in update_data.settings:
        if item.key == "smtp_password" and item.value == "••••••••••••":
            continue # Don't save the masked password
            
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

async def handle_file_upload(file: UploadFile, key: str, category: str, db: AsyncSession):
    if not file.content_type.startswith("image/"):
        raise HTTPException(status_code=400, detail="Only image files are allowed")

    ext = os.path.splitext(file.filename)[1]
    unique_filename = f"{uuid.uuid4().hex}{ext}"
    file_path = os.path.join(UPLOAD_DIR, unique_filename)
    
    content = await file.read()
    try:
        os.makedirs(UPLOAD_DIR, exist_ok=True)
        with open(file_path, "wb") as f:
            f.write(content)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to save file: {str(e)}")
        
    url = f"/uploads/{unique_filename}"
    
    res = await db.execute(select(Setting).where(Setting.key == key))
    setting = res.scalars().first()
    if setting:
        setting.value = url
    else:
        setting = Setting(key=key, value=url, category=category)
        db.add(setting)
        
    await db.commit()
    await db.refresh(setting)
    return setting

async def handle_file_delete(key: str, db: AsyncSession):
    res = await db.execute(select(Setting).where(Setting.key == key))
    setting = res.scalars().first()
    if setting and setting.value:
        filename = setting.value.split("/")[-1]
        file_path = os.path.join(UPLOAD_DIR, filename)
        if os.path.exists(file_path):
            try:
                os.remove(file_path)
            except Exception:
                pass
        setting.value = None
        await db.commit()
    return {"status": "ok"}

@router.post("/logo", response_model=SettingResponse)
async def upload_logo(file: UploadFile = File(...), user = Depends(RequireRole(["SUPER_ADMIN", "ADMIN"])), db: AsyncSession = Depends(get_db)):
    return await handle_file_upload(file, "logo_url", "branding", db)

@router.delete("/logo")
async def delete_logo(user = Depends(RequireRole(["SUPER_ADMIN", "ADMIN"])), db: AsyncSession = Depends(get_db)):
    return await handle_file_delete("logo_url", db)

@router.post("/favicon", response_model=SettingResponse)
async def upload_favicon(file: UploadFile = File(...), user = Depends(RequireRole(["SUPER_ADMIN", "ADMIN"])), db: AsyncSession = Depends(get_db)):
    return await handle_file_upload(file, "favicon_url", "branding", db)

@router.delete("/favicon")
async def delete_favicon(user = Depends(RequireRole(["SUPER_ADMIN", "ADMIN"])), db: AsyncSession = Depends(get_db)):
    return await handle_file_delete("favicon_url", db)

