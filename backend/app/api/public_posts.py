from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, or_, func
from sqlalchemy.orm import selectinload
from app.core.database import get_db
from app.schemas.post import PostResponse
from app.models.post import Post, PostTranslation
from typing import List, Optional
from datetime import datetime, timezone

router = APIRouter()

@router.get("", response_model=List[PostResponse])
@router.get("/", response_model=List[PostResponse])
async def list_public_posts(
    category_id: Optional[str] = None,
    limit: int = 50,
    db: AsyncSession = Depends(get_db)
):
    now = datetime.now(timezone.utc)
    query = (
        select(Post)
        .where(
            (Post.status == "published") & 
            (or_(Post.published_at == None, Post.published_at <= now))
        )
        .options(
            selectinload(Post.translations),
            selectinload(Post.references),
            selectinload(Post.category),
            selectinload(Post.featured_image)
        )
        .order_by(Post.published_at.desc(), Post.created_at.desc())
        .limit(limit)
    )
    
    if category_id:
        query = query.where(Post.category_id == category_id)
        
    result = await db.execute(query)
    return result.scalars().unique().all()

@router.get("/{slug}", response_model=PostResponse)
async def get_public_post(slug: str, db: AsyncSession = Depends(get_db)):
    clean_slug = slug.strip().lower()
    now = datetime.now(timezone.utc)
    query = (
        select(Post)
        .join(Post.translations, isouter=True)
        .where(
            (Post.status == "published") & 
            (or_(Post.published_at == None, Post.published_at <= now)) &
            (
                (func.lower(Post.slug) == clean_slug) |
                (Post.id == slug) |
                (func.lower(PostTranslation.slug) == clean_slug)
            )
        )
        .options(
            selectinload(Post.translations),
            selectinload(Post.references),
            selectinload(Post.category),
            selectinload(Post.featured_image)
        )
    )
    
    result = await db.execute(query)
    post = result.scalars().first()
    if not post:
        raise HTTPException(status_code=404, detail="Post not found")
    return post

