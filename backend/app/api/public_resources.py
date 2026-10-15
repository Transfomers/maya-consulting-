from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, or_
from sqlalchemy.orm import selectinload
from typing import List, Optional
from app.core.database import get_db
from app.models.resource import Resource
from app.schemas.resource import ResourceResponse

router = APIRouter()

@router.get("/", response_model=List[ResourceResponse])
async def list_public_resources(
    category_id: Optional[str] = None,
    resource_type: Optional[str] = None,
    search: Optional[str] = None,
    db: AsyncSession = Depends(get_db)
):
    query = select(Resource).options(selectinload(Resource.category)).where(
        Resource.is_published == True
    ).order_by(Resource.created_at.desc())
    
    if category_id:
        query = query.where(Resource.category_id == category_id)
    if resource_type:
        query = query.where(Resource.resource_type == resource_type)
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

@router.get("/{id_or_slug}", response_model=ResourceResponse)
async def get_public_resource(id_or_slug: str, db: AsyncSession = Depends(get_db)):
    query = select(Resource).options(selectinload(Resource.category)).where(
        or_(Resource.id == id_or_slug, Resource.slug == id_or_slug),
        Resource.is_published == True
    )
    result = await db.execute(query)
    res = result.scalars().first()
    if not res:
        raise HTTPException(status_code=404, detail="Resource not found")
    return res
