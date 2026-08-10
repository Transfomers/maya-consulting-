content = """from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, and_, or_, delete
from sqlalchemy.orm import selectinload
from app.core.database import get_db
from app.core.security import get_current_user, RequireRole
from app.schemas.post import PostCreate, PostResponse, ReferenceCreate
from app.models.post import Post, PostTranslation, Reference
from datetime import datetime, timezone
from typing import List, Optional
import re

router = APIRouter()

async def generate_unique_slug(base_slug: str, db: AsyncSession, exclude_id: str = None) -> str:
    slug = re.sub(r'[^a-z0-9]+', '-', base_slug.lower()).strip('-')
    if not slug:
        slug = "post"
    
    query = select(Post).where(Post.slug == slug)
    if exclude_id:
        query = query.where(Post.id != exclude_id)
    result = await db.execute(query)
    
    if not result.scalars().first():
        return slug
        
    counter = 2
    while True:
        new_slug = f"{slug}-{counter}"
        q = select(Post).where(Post.slug == new_slug)
        if exclude_id:
            q = q.where(Post.id != exclude_id)
        if not (await db.execute(q)).scalars().first():
            return new_slug
        counter += 1

@router.get("/", response_model=List[PostResponse])
async def list_posts(
    status: Optional[str] = None,
    category_id: Optional[str] = None,
    search: Optional[str] = None,
    user = Depends(RequireRole(["SUPER_ADMIN", "EDITOR", "AUTHOR"])), 
    db: AsyncSession = Depends(get_db)
):
    query = select(Post).options(selectinload(Post.translations), selectinload(Post.references)).order_by(Post.created_at.desc())
    
    if status:
        query = query.where(Post.status == status)
    if category_id:
        query = query.where(Post.category_id == category_id)
    if search:
        search_filter = f"%{search.lower()}%"
        query = query.join(Post.translations).where(PostTranslation.title.ilike(search_filter))
        
    result = await db.execute(query)
    return result.scalars().unique().all()

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
    status = post_data.status
    if user.role == "AUTHOR" and status in ["published", "scheduled"]:
        status = "review"

    slug = await generate_unique_slug(post_data.slug, db)

    post = Post(
        slug=slug,
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
    
    result = await db.execute(select(Post).where(Post.id == post.id).options(selectinload(Post.translations), selectinload(Post.references)))
    return result.scalars().first()

@router.put("/{id}", response_model=PostResponse)
async def update_post(id: str, post_data: PostCreate, user = Depends(RequireRole(["SUPER_ADMIN", "EDITOR", "AUTHOR"])), db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(Post).where(Post.id == id).options(selectinload(Post.translations), selectinload(Post.references)))
    post = result.scalars().first()
    if not post:
        raise HTTPException(status_code=404, detail="Post not found")
        
    if user.role == "AUTHOR" and post.author_id != user.id:
        raise HTTPException(status_code=403, detail="Not authorized to edit this post")

    status = post_data.status
    if user.role == "AUTHOR" and status in ["published", "scheduled"]:
        status = "review"

    slug = await generate_unique_slug(post_data.slug, db, exclude_id=id)

    post.slug = slug
    post.status = status
    post.category_id = post_data.category_id
    post.featured_image_id = post_data.featured_image_id
    post.updated_at = datetime.now(timezone.utc)
    if status == "published" and post.published_at is None:
        post.published_at = datetime.now(timezone.utc)

    # Delete existing translations and references to replace
    await db.execute(delete(PostTranslation).where(PostTranslation.post_id == id))
    await db.execute(delete(Reference).where(Reference.post_id == id))
    
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
    
    result = await db.execute(select(Post).where(Post.id == post.id).options(selectinload(Post.translations), selectinload(Post.references)))
    return result.scalars().first()

@router.delete("/{id}")
async def delete_post(id: str, user = Depends(RequireRole(["SUPER_ADMIN", "EDITOR"])), db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(Post).where(Post.id == id))
    post = result.scalars().first()
    if not post:
        raise HTTPException(status_code=404, detail="Post not found")
        
    await db.delete(post)
    await db.commit()
    return {"ok": True}
"""
with open('app/api/posts.py', 'w') as f:
    f.write(content)
