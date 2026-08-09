from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from sqlalchemy.orm import selectinload
from app.core.database import get_db
from app.core.security import get_current_user, RequireRole
from app.schemas.post import PostCreate, PostResponse, ReferenceCreate
from app.models.post import Post, PostTranslation, Reference
from datetime import datetime, timezone
from typing import List

router = APIRouter()

@router.get("/", response_model=List[PostResponse])
async def list_posts(user = Depends(RequireRole(["SUPER_ADMIN", "EDITOR", "AUTHOR"])), db: AsyncSession = Depends(get_db)):
    query = select(Post).options(selectinload(Post.translations), selectinload(Post.references)).order_by(Post.created_at.desc())
    result = await db.execute(query)
    return result.scalars().all()

@router.get("/{id}", response_model=PostResponse)
async def get_post(id: str, user = Depends(RequireRole(["SUPER_ADMIN", "EDITOR", "AUTHOR"])), db: AsyncSession = Depends(get_db)):
    query = select(Post).where(Post.id == id).options(selectinload(Post.translations), selectinload(Post.references))
    result = await db.execute(query)
    post = result.scalars().first()
    if not post:
        raise HTTPException(status_code=404, detail="Post not found")
    return post

@router.post("/", response_model=PostResponse)
async def create_post(post_data: PostCreate, user = Depends(RequireRole(["SUPER_ADMIN", "EDITOR", "AUTHOR"])), db: AsyncSession = Depends(get_db)):
    # Authors cannot publish directly
    status = post_data.status
    if user.role == "AUTHOR" and status in ["published", "scheduled"]:
        status = "review"

    post = Post(
        slug=post_data.slug,
        status=status,
        author_id=user.id,
        category_id=post_data.category_id,
        featured_image_id=post_data.featured_image_id,
        published_at=datetime.now(timezone.utc) if status == "published" else None
    )
    db.add(post)
    await db.commit()
    
    for t in post_data.translations:
        trans = PostTranslation(
            post_id=post.id,
            language=t.language,
            title=t.title,
            slug=t.slug,
            excerpt=t.excerpt,
            content=t.content,
            seo_title=t.seo_title,
            seo_description=t.seo_description,
            focus_keyword=t.focus_keyword,
            canonical_url=t.canonical_url,
            og_title=t.og_title,
            og_description=t.og_description,
            og_image_id=t.og_image_id,
            allow_index=t.allow_index,
            allow_follow=t.allow_follow
        )
        db.add(trans)

    if post_data.references:
        for r in post_data.references:
            ref = Reference(
                post_id=post.id,
                title=r.title,
                publisher=r.publisher,
                author=r.author,
                url=r.url,
                publication_date=r.publication_date,
                description=r.description
            )
            db.add(ref)
            
    await db.commit()
    
    # Reload with relationships
    result = await db.execute(select(Post).where(Post.id == post.id).options(selectinload(Post.translations), selectinload(Post.references)))
    return result.scalars().first()
