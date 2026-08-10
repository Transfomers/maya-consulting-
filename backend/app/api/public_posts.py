from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from sqlalchemy.orm import selectinload
from app.core.database import get_db
from app.schemas.post import PostResponse
from app.models.post import Post, PostTranslation
from typing import List, Optional

router = APIRouter()

@router.get("/", response_model=List[PostResponse])
async def list_public_posts(
    category_id: Optional[str] = None,
    limit: int = 20,
    db: AsyncSession = Depends(get_db)
):
    query = select(Post).where(Post.status == "published").options(selectinload(Post.translations), selectinload(Post.references)).order_by(Post.published_at.desc()).limit(limit)
    
    if category_id:
        query = query.where(Post.category_id == category_id)
        
    result = await db.execute(query)
    return result.scalars().unique().all()

@router.get("/{slug}", response_model=PostResponse)
async def get_public_post(slug: str, db: AsyncSession = Depends(get_db)):
    # Match post slug or translation slug
    query = select(Post).join(Post.translations, isouter=True).where(
        (Post.status == "published") & 
        ((Post.slug == slug) | (PostTranslation.slug == slug))
    ).options(selectinload(Post.translations), selectinload(Post.references))
    
    result = await db.execute(query)
    post = result.scalars().first()
    if not post:
        raise HTTPException(status_code=404, detail="Post not found")
    return post
