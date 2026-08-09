from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Form
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from app.core.database import get_db
from app.core.security import get_current_user, RequireRole
from app.schemas.media import MediaResponse, MediaUpdate
from app.models.media import Media
from app.core.config import settings
import os
import uuid
from typing import List

router = APIRouter()

UPLOAD_DIR = os.path.join(os.path.dirname(os.path.dirname(os.path.dirname(__file__))), "data", "uploads")
os.makedirs(UPLOAD_DIR, exist_ok=True)

@router.get("/", response_model=List[MediaResponse])
async def list_media(user = Depends(RequireRole(["SUPER_ADMIN", "EDITOR", "AUTHOR"])), db: AsyncSession = Depends(get_db)):
    query = select(Media).order_by(Media.created_at.desc())
    result = await db.execute(query)
    return result.scalars().all()

@router.post("/upload", response_model=MediaResponse)
async def upload_media(
    file: UploadFile = File(...),
    alt_text: str = Form(None),
    caption: str = Form(None),
    user = Depends(RequireRole(["SUPER_ADMIN", "EDITOR", "AUTHOR"])), 
    db: AsyncSession = Depends(get_db)
):
    # Basic validation
    if not file.content_type.startswith("image/"):
        raise HTTPException(status_code=400, detail="Only image files are allowed")

    # Save file locally
    ext = os.path.splitext(file.filename)[1]
    unique_filename = f"{uuid.uuid4().hex}{ext}"
    file_path = os.path.join(UPLOAD_DIR, unique_filename)
    
    content = await file.read()
    with open(file_path, "wb") as f:
        f.write(content)
        
    # url logic: since we are mounting /uploads statically in main.py
    url = f"/uploads/{unique_filename}"

    media = Media(
        filename=file.filename,
        url=url,
        mime_type=file.content_type,
        alt_text=alt_text,
        caption=caption,
        uploaded_by_id=user.id
    )
    db.add(media)
    await db.commit()
    await db.refresh(media)
    
    return media

@router.put("/{id}", response_model=MediaResponse)
async def update_media(
    id: str,
    media_update: MediaUpdate,
    user = Depends(RequireRole(["SUPER_ADMIN", "EDITOR"])),
    db: AsyncSession = Depends(get_db)
):
    result = await db.execute(select(Media).where(Media.id == id))
    media = result.scalars().first()
    if not media:
        raise HTTPException(status_code=404, detail="Media not found")
        
    if media_update.alt_text is not None:
        media.alt_text = media_update.alt_text
    if media_update.caption is not None:
        media.caption = media_update.caption
        
    await db.commit()
    await db.refresh(media)
    return media

@router.delete("/{id}")
async def delete_media(id: str, user = Depends(RequireRole(["SUPER_ADMIN", "EDITOR"])), db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(Media).where(Media.id == id))
    media = result.scalars().first()
    if not media:
        raise HTTPException(status_code=404, detail="Media not found")
        
    # Delete local file
    filename = media.url.split("/")[-1]
    file_path = os.path.join(UPLOAD_DIR, filename)
    if os.path.exists(file_path):
        os.remove(file_path)
        
    await db.delete(media)
    await db.commit()
    return {"status": "ok"}
