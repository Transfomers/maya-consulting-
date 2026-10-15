from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Form, Query
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, or_
from sqlalchemy.orm import selectinload
from typing import List, Optional
import os
import uuid
import re

from app.core.database import get_db
from app.core.security import RequirePermission
from app.models.resource import Resource
from app.models.post import Category
from app.schemas.resource import ResourceCreate, ResourceUpdate, ResourceResponse

router = APIRouter()

UPLOAD_DIR = os.path.join(os.path.dirname(os.path.dirname(os.path.dirname(__file__))), "data", "uploads")
os.makedirs(UPLOAD_DIR, exist_ok=True)

def slugify(text: str) -> str:
    text = text.lower().strip()
    text = re.sub(r'[^a-z0-9\s-]', '', text)
    text = re.sub(r'[\s-]+', '-', text)
    return text or "resource"

@router.get("/", response_model=List[ResourceResponse])
async def list_resources(
    category_id: Optional[str] = None,
    resource_type: Optional[str] = None,
    search: Optional[str] = None,
    is_published: Optional[bool] = None,
    db: AsyncSession = Depends(get_db),
    user = Depends(RequirePermission("media.view"))
):
    query = select(Resource).options(selectinload(Resource.category)).order_by(Resource.created_at.desc())
    
    if category_id:
        query = query.where(Resource.category_id == category_id)
    if resource_type:
        query = query.where(Resource.resource_type == resource_type)
    if is_published is not None:
        query = query.where(Resource.is_published == is_published)
    if search:
        s = f"%{search.strip().lower()}%"
        query = query.where(or_(
            Resource.title.ilike(s),
            Resource.description.ilike(s),
            Resource.author.ilike(s),
            Resource.tags.ilike(s)
        ))
        
    result = await db.execute(query)
    return result.scalars().all()

@router.post("/", response_model=ResourceResponse)
async def create_resource(
    data: ResourceCreate,
    db: AsyncSession = Depends(get_db),
    user = Depends(RequirePermission("media.upload"))
):
    slug = data.slug or slugify(data.title)
    # Check if slug exists
    res = await db.execute(select(Resource).where(Resource.slug == slug))
    if res.scalars().first():
        slug = f"{slug}-{uuid.uuid4().hex[:6]}"

    resource = Resource(
        title=data.title,
        slug=slug,
        description=data.description,
        category_id=data.category_id,
        resource_type=data.resource_type,
        file_url=data.file_url,
        external_url=data.external_url,
        file_size=data.file_size,
        mime_type=data.mime_type,
        author=data.author,
        tags=data.tags,
        is_published=data.is_published,
        is_featured=data.is_featured
    )
    db.add(resource)
    await db.commit()
    await db.refresh(resource)
    
    # Reload with category
    res = await db.execute(select(Resource).options(selectinload(Resource.category)).where(Resource.id == resource.id))
    return res.scalars().first()

@router.post("/upload")
async def upload_resource_file(
    file: UploadFile = File(...),
    db: AsyncSession = Depends(get_db),
    user = Depends(RequirePermission("media.upload"))
):
    # Support all document and media types
    ext = os.path.splitext(file.filename)[1].lower()
    unique_filename = f"{uuid.uuid4().hex}{ext}"
    file_path = os.path.join(UPLOAD_DIR, unique_filename)
    
    content = await file.read()
    file_size_bytes = len(content)
    
    # Format file size human readable
    if file_size_bytes < 1024 * 1024:
        file_size_str = f"{file_size_bytes / 1024:.1f} KB"
    else:
        file_size_str = f"{file_size_bytes / (1024 * 1024):.1f} MB"
        
    try:
        with open(file_path, "wb") as f:
            f.write(content)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to save file: {str(e)}")
        
    url = f"/uploads/{unique_filename}"
    return {
        "url": url,
        "filename": file.filename,
        "file_size": file_size_str,
        "mime_type": file.content_type
    }

@router.get("/{id}", response_model=ResourceResponse)
async def get_resource(
    id: str,
    db: AsyncSession = Depends(get_db),
    user = Depends(RequirePermission("media.view"))
):
    res = await db.execute(select(Resource).options(selectinload(Resource.category)).where(Resource.id == id))
    resource = res.scalars().first()
    if not resource:
        raise HTTPException(status_code=404, detail="Resource not found")
    return resource

@router.put("/{id}", response_model=ResourceResponse)
async def update_resource(
    id: str,
    data: ResourceUpdate,
    db: AsyncSession = Depends(get_db),
    user = Depends(RequirePermission("media.upload"))
):
    res = await db.execute(select(Resource).where(Resource.id == id))
    resource = res.scalars().first()
    if not resource:
        raise HTTPException(status_code=404, detail="Resource not found")
        
    update_data = data.dict(exclude_unset=True)
    for key, val in update_data.items():
        setattr(resource, key, val)
        
    await db.commit()
    await db.refresh(resource)
    
    res = await db.execute(select(Resource).options(selectinload(Resource.category)).where(Resource.id == resource.id))
    return res.scalars().first()

@router.delete("/{id}")
async def delete_resource(
    id: str,
    db: AsyncSession = Depends(get_db),
    user = Depends(RequirePermission("media.upload"))
):
    res = await db.execute(select(Resource).where(Resource.id == id))
    resource = res.scalars().first()
    if not resource:
        raise HTTPException(status_code=404, detail="Resource not found")
        
    # Remove file if local
    if resource.file_url and resource.file_url.startswith("/uploads/"):
        filename = resource.file_url.split("/")[-1]
        file_path = os.path.join(UPLOAD_DIR, filename)
        if os.path.exists(file_path):
            try:
                os.remove(file_path)
            except Exception:
                pass
                
    await db.delete(resource)
    await db.commit()
    return {"ok": True, "message": "Resource deleted"}
