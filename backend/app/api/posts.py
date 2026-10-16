from fastapi import APIRouter, Depends, HTTPException, Query, BackgroundTasks
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, and_, or_, delete
from sqlalchemy.orm import selectinload
from app.core.database import get_db
from app.core.security import get_current_user, RequirePermission
from app.schemas.post import PostCreate, PostResponse, ReferenceCreate
from app.models.post import Post, PostTranslation, Reference
from app.models.newsletter import NewsletterCampaign
from app.models.setting import Setting
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

@router.get("", response_model=List[PostResponse])
@router.get("/", response_model=List[PostResponse])
async def list_posts(
    status: Optional[str] = None,
    category_id: Optional[str] = None,
    search: Optional[str] = None,
    user = Depends(RequirePermission("articles.view")), 
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
@router.get("/{id}/", response_model=PostResponse)
async def get_post(id: str, user = Depends(RequirePermission("articles.view")), db: AsyncSession = Depends(get_db)):
    query = select(Post).where(Post.id == id).options(selectinload(Post.translations), selectinload(Post.references))
    result = await db.execute(query)
    post = result.scalars().first()
    if not post:
        raise HTTPException(status_code=404, detail="Post not found")
    return post

async def trigger_post_publication_newsletter(post_id: str, author_id: str, background_tasks: BackgroundTasks, db: AsyncSession):
    from app.api.admin_newsletter import process_campaign_dispatch
    try:
        s_res = await db.execute(select(Setting).where(Setting.key == "newsletter_auto_send"))
        s_row = s_res.scalars().first()
        if s_row and s_row.value.lower() in ("false", "0", "no"):
            return

        c_res = await db.execute(select(NewsletterCampaign).where(NewsletterCampaign.article_id == post_id))
        existing_campaign = c_res.scalars().first()
        if existing_campaign:
            return

        p_res = await db.execute(
            select(Post).where(Post.id == post_id).options(selectinload(Post.translations))
        )
        post = p_res.scalars().first()
        if not post or post.status != "published":
            return

        title = "Nouvel article sur CAP Entrepreneurs"
        excerpt = "Découvrez notre dernière publication sur capentrepreneurs.org"
        for t in (post.translations or []):
            if t.language == "fr" and t.title:
                title = t.title
                excerpt = t.excerpt or excerpt
                break
            elif t.title:
                title = t.title
                excerpt = t.excerpt or excerpt

        campaign = NewsletterCampaign(
            title=f"Publication : {title}",
            subject=f"CAP Entrepreneurs - {title}",
            preview_text=excerpt,
            article_id=post.id,
            recipient_segment="all_active",
            status="draft",
            created_by_id=author_id
        )
        db.add(campaign)
        await db.commit()
        await db.refresh(campaign)

        background_tasks.add_task(process_campaign_dispatch, campaign.id)
    except Exception as e:
        import logging
        logging.getLogger("posts").warning(f"Could not trigger publication newsletter: {e}")

@router.post("", response_model=PostResponse)
@router.post("/", response_model=PostResponse)
async def create_post(
    post_data: PostCreate,
    background_tasks: BackgroundTasks,
    user = Depends(RequirePermission("articles.view")),
    db: AsyncSession = Depends(get_db)
):
    status = post_data.status
    if user.role and user.role.name == "AUTHOR" and status in ["published", "scheduled"]:
        status = "review"

    slug = await generate_unique_slug(post_data.slug, db)

    published_at = post_data.published_at if post_data.published_at else (datetime.now(timezone.utc) if status == "published" else None)

    post = Post(
        slug=slug,
        status=status,
        author_id=user.id,
        category_id=post_data.category_id,
        featured_image_id=post_data.featured_image_id,
        published_at=published_at
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

    if status == "published":
        await trigger_post_publication_newsletter(post.id, user.id, background_tasks, db)
    
    result = await db.execute(select(Post).where(Post.id == post.id).options(selectinload(Post.translations), selectinload(Post.references)))
    return result.scalars().first()

@router.put("/{id}", response_model=PostResponse)
@router.put("/{id}/", response_model=PostResponse)
async def update_post(
    id: str,
    post_data: PostCreate,
    background_tasks: BackgroundTasks,
    user = Depends(RequirePermission("articles.view")),
    db: AsyncSession = Depends(get_db)
):
    result = await db.execute(select(Post).where(Post.id == id).options(selectinload(Post.translations), selectinload(Post.references)))
    post = result.scalars().first()
    if not post:
        raise HTTPException(status_code=404, detail="Post not found")
        
    if user.role and user.role.name == "AUTHOR" and post.author_id != user.id:
        raise HTTPException(status_code=403, detail="Not authorized to edit this post")

    was_published = post.status == "published"
    status = post_data.status
    if user.role and user.role.name == "AUTHOR" and status in ["published", "scheduled"]:
        status = "review"

    slug = await generate_unique_slug(post_data.slug, db, exclude_id=id)

    post.slug = slug
    post.status = status
    post.category_id = post_data.category_id
    post.featured_image_id = post_data.featured_image_id
    post.updated_at = datetime.now(timezone.utc)
    if post_data.published_at:
        post.published_at = post_data.published_at
    elif status == "published" and post.published_at is None:
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

    if status == "published" and not was_published:
        await trigger_post_publication_newsletter(post.id, user.id, background_tasks, db)
    
    result = await db.execute(select(Post).where(Post.id == post.id).options(selectinload(Post.translations), selectinload(Post.references)))
    return result.scalars().first()

@router.post("/{id}/duplicate", response_model=PostResponse)
async def duplicate_post(
    id: str,
    user = Depends(RequirePermission("articles.view")),
    db: AsyncSession = Depends(get_db)
):
    result = await db.execute(
        select(Post)
        .where(Post.id == id)
        .options(selectinload(Post.translations), selectinload(Post.references))
    )
    original = result.scalars().first()
    if not original:
        raise HTTPException(status_code=404, detail="Original post not found")

    new_slug = await generate_unique_slug(f"{original.slug}-copie", db)
    new_post = Post(
        slug=new_slug,
        status="draft",
        author_id=user.id,
        category_id=original.category_id,
        featured_image_id=original.featured_image_id,
        published_at=None
    )
    db.add(new_post)
    await db.commit()

    for tr in original.translations:
        new_tr = PostTranslation(
            post_id=new_post.id,
            language=tr.language,
            title=f"{tr.title} (Copie)",
            slug=f"{tr.slug}-copie" if tr.slug else None,
            excerpt=tr.excerpt,
            content=tr.content,
            seo_title=tr.seo_title,
            seo_description=tr.seo_description,
            focus_keyword=tr.focus_keyword,
            canonical_url=tr.canonical_url,
            og_title=tr.og_title,
            og_description=tr.og_description,
            og_image_id=tr.og_image_id,
            allow_index=tr.allow_index,
            allow_follow=tr.allow_follow
        )
        db.add(new_tr)

    for rf in original.references:
        new_rf = Reference(
            post_id=new_post.id,
            title=rf.title,
            publisher=rf.publisher,
            author=rf.author,
            url=rf.url,
            publication_date=rf.publication_date,
            description=rf.description
        )
        db.add(new_rf)

    await db.commit()
    res = await db.execute(
        select(Post)
        .where(Post.id == new_post.id)
        .options(selectinload(Post.translations), selectinload(Post.references))
    )
    return res.scalars().first()

@router.delete("/{id}")
async def delete_post(id: str, user = Depends(RequirePermission("articles.edit")), db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(Post).where(Post.id == id))
    post = result.scalars().first()
    if not post:
        raise HTTPException(status_code=404, detail="Post not found")
        
    await db.delete(post)
    await db.commit()
    return {"ok": True}
