from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Form
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func
from app.core.database import get_db
from app.core.security import get_current_user, RequirePermission
from app.schemas.media import MediaResponse, MediaUpdate
from app.models.media import Media
from app.models.post import Post
from app.models.event import Event
from app.core.config import settings
import os
import uuid
import re
from typing import List

router = APIRouter()

UPLOAD_DIR = os.path.join(os.path.dirname(os.path.dirname(os.path.dirname(__file__))), "data", "uploads")
os.makedirs(UPLOAD_DIR, exist_ok=True)

ALLOWED_EXTENSIONS = {".jpg", ".jpeg", ".png", ".webp", ".svg", ".gif", ".pdf", ".mp4", ".webm"}
MAX_FILE_SIZE = 15 * 1024 * 1024  # 15 MB

@router.get("/", response_model=List[MediaResponse])
@router.get("", response_model=List[MediaResponse])
async def list_media(user = Depends(RequirePermission("media.view")), db: AsyncSession = Depends(get_db)):
    query = select(Media).order_by(Media.created_at.desc())
    result = await db.execute(query)
    media_items = result.scalars().all()
    
    # Check references across posts and events
    used_post_media = set((await db.execute(select(Post.featured_image_id).where(Post.featured_image_id != None))).scalars().all())
    used_event_media = set((await db.execute(select(Event.featured_image_id).where(Event.featured_image_id != None))).scalars().all())
    
    response = []
    for m in media_items:
        refs_count = (1 if m.id in used_post_media else 0) + (1 if m.id in used_event_media else 0)
        
        # Calculate file size if available on disk
        size_bytes = 0
        fn = m.url.split("/")[-1] if m.url else ""
        fp = os.path.join(UPLOAD_DIR, fn)
        if os.path.exists(fp):
            try:
                size_bytes = os.path.getsize(fp)
            except Exception:
                size_bytes = 0

        response.append(MediaResponse(
            id=m.id,
            filename=m.filename,
            url=m.url,
            mime_type=m.mime_type,
            alt_text=m.alt_text,
            caption=m.caption,
            uploaded_by_id=m.uploaded_by_id,
            created_at=m.created_at,
            is_referenced=refs_count > 0,
            references_count=refs_count,
            size_bytes=size_bytes
        ))
    return response

@router.post("/upload", response_model=MediaResponse)
async def upload_media(
    file: UploadFile = File(...),
    alt_text: str = Form(None),
    caption: str = Form(None),
    user = Depends(RequirePermission("media.view")), 
    db: AsyncSession = Depends(get_db)
):
    safe_basename = os.path.basename(file.filename or "file")
    ext = os.path.splitext(safe_basename)[1].lower()
    
    if ext not in ALLOWED_EXTENSIONS:
        raise HTTPException(
            status_code=400,
            detail=f"Format de fichier non autorisé ({ext}). Formats acceptés : {', '.join(sorted(ALLOWED_EXTENSIONS))}"
        )

    content = await file.read()
    if len(content) > MAX_FILE_SIZE:
        raise HTTPException(status_code=400, detail="Fichier trop volumineux (maximum 15 Mo).")

    unique_filename = f"{uuid.uuid4().hex}{ext}"
    file_path = os.path.join(UPLOAD_DIR, unique_filename)
    
    try:
        os.makedirs(UPLOAD_DIR, exist_ok=True)
        with open(file_path, "wb") as f:
            f.write(content)
    except PermissionError:
        raise HTTPException(status_code=500, detail="Erreur de permissions d'écriture sur le serveur.")
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Erreur lors de l'enregistrement du fichier: {str(e)}")
        
    url = f"/uploads/{unique_filename}"

    media = Media(
        filename=re.sub(r'[^a-zA-Z0-9_.-]', '_', safe_basename),
        url=url,
        mime_type=file.content_type,
        alt_text=alt_text or safe_basename,
        caption=caption,
        uploaded_by_id=user.id
    )
    db.add(media)
    await db.commit()
    await db.refresh(media)
    
    return MediaResponse(
        id=media.id,
        filename=media.filename,
        url=media.url,
        mime_type=media.mime_type,
        alt_text=media.alt_text,
        caption=media.caption,
        uploaded_by_id=media.uploaded_by_id,
        created_at=media.created_at,
        is_referenced=False,
        references_count=0,
        size_bytes=len(content)
    )

@router.put("/{id}", response_model=MediaResponse)
async def update_media(
    id: str,
    media_update: MediaUpdate,
    user = Depends(RequirePermission("media.upload")),
    db: AsyncSession = Depends(get_db)
):
    result = await db.execute(select(Media).where(Media.id == id))
    media = result.scalars().first()
    if not media:
        raise HTTPException(status_code=404, detail="Média non trouvé")
        
    if media_update.alt_text is not None:
        media.alt_text = media_update.alt_text
    if media_update.caption is not None:
        media.caption = media_update.caption
        
    await db.commit()
    await db.refresh(media)
    
    # Check references
    p_cnt = (await db.execute(select(func.count(Post.id)).where(Post.featured_image_id == id))).scalar() or 0
    e_cnt = (await db.execute(select(func.count(Event.id)).where(Event.featured_image_id == id))).scalar() or 0

    return MediaResponse(
        id=media.id,
        filename=media.filename,
        url=media.url,
        mime_type=media.mime_type,
        alt_text=media.alt_text,
        caption=media.caption,
        uploaded_by_id=media.uploaded_by_id,
        created_at=media.created_at,
        is_referenced=(p_cnt + e_cnt) > 0,
        references_count=p_cnt + e_cnt,
        size_bytes=0
    )

@router.delete("/{id}")
async def delete_media(id: str, user = Depends(RequirePermission("media.upload")), db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(Media).where(Media.id == id))
    media = result.scalars().first()
    if not media:
        raise HTTPException(status_code=404, detail="Média non trouvé")
        
    # Prevent deletion if media is referenced by posts or events
    p_cnt = (await db.execute(select(func.count(Post.id)).where(Post.featured_image_id == id))).scalar() or 0
    e_cnt = (await db.execute(select(func.count(Event.id)).where(Event.featured_image_id == id))).scalar() or 0
    
    if (p_cnt + e_cnt) > 0:
        raise HTTPException(
            status_code=400,
            detail=f"Impossible de supprimer ce média car il est utilisé comme image de couverture par {p_cnt} article(s) et {e_cnt} événement(s)."
        )

    # Delete local file if it exists in uploads
    if media.url and "/uploads/" in media.url:
        filename = media.url.split("/")[-1]
        file_path = os.path.join(UPLOAD_DIR, filename)
        if os.path.exists(file_path):
            try:
                os.remove(file_path)
            except Exception:
                pass
        
    await db.delete(media)
    await db.commit()
    return {"status": "ok"}
