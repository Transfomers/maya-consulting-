from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, delete
from typing import List
from app.core.database import get_db
from app.core.security import RequirePermission
from app.schemas.taxonomy import CategoryCreate, CategoryResponse, TagCreate, TagResponse
from app.models.post import Category, Tag, Post

router = APIRouter()

from app.models.resource import Resource
from app.models.event import Event
from sqlalchemy import func

# --- Categories ---

@router.get("/categories", response_model=List[CategoryResponse])
async def list_categories(db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(Category).order_by(Category.display_order.asc(), Category.name.asc()))
    categories = result.scalars().all()
    
    # Calculate counts
    response_items = []
    for cat in categories:
        p_cnt = (await db.execute(select(func.count(Post.id)).where(Post.category_id == cat.id))).scalar() or 0
        r_cnt = (await db.execute(select(func.count(Resource.id)).where(Resource.category_id == cat.id))).scalar() or 0
        e_cnt = (await db.execute(select(func.count(Event.id)).where(Event.category_id == cat.id))).scalar() or 0
        
        response_items.append(CategoryResponse(
            id=cat.id,
            name=cat.name,
            slug=cat.slug,
            description=cat.description,
            display_order=cat.display_order or 0,
            is_archived=bool(cat.is_archived),
            posts_count=p_cnt,
            resources_count=r_cnt,
            events_count=e_cnt
        ))
    return response_items

@router.post("/categories", response_model=CategoryResponse)
async def create_category(category_data: CategoryCreate, user = Depends(RequirePermission("categories.edit")), db: AsyncSession = Depends(get_db)):
    # Check if slug exists
    res = await db.execute(select(Category).where(Category.slug == category_data.slug))
    if res.scalars().first():
        raise HTTPException(status_code=400, detail="L'identifiant slug de catégorie existe déjà.")
    
    category = Category(
        name=category_data.name,
        slug=category_data.slug,
        description=category_data.description,
        display_order=category_data.display_order or 0,
        is_archived=category_data.is_archived or False
    )
    db.add(category)
    await db.commit()
    await db.refresh(category)
    return CategoryResponse(
        id=category.id,
        name=category.name,
        slug=category.slug,
        description=category.description,
        display_order=category.display_order or 0,
        is_archived=bool(category.is_archived),
        posts_count=0,
        resources_count=0,
        events_count=0
    )

@router.put("/categories/{id}", response_model=CategoryResponse)
async def update_category(id: str, category_data: CategoryCreate, user = Depends(RequirePermission("categories.edit")), db: AsyncSession = Depends(get_db)):
    res = await db.execute(select(Category).where(Category.id == id))
    category = res.scalars().first()
    if not category:
        raise HTTPException(status_code=404, detail="Catégorie non trouvée.")
        
    res_slug = await db.execute(select(Category).where(Category.slug == category_data.slug, Category.id != id))
    if res_slug.scalars().first():
        raise HTTPException(status_code=400, detail="Cet identifiant slug de catégorie est déjà utilisé.")

    category.name = category_data.name
    category.slug = category_data.slug
    category.description = category_data.description
    category.display_order = category_data.display_order or 0
    category.is_archived = category_data.is_archived or False
    
    await db.commit()
    await db.refresh(category)
    
    p_cnt = (await db.execute(select(func.count(Post.id)).where(Post.category_id == category.id))).scalar() or 0
    r_cnt = (await db.execute(select(func.count(Resource.id)).where(Resource.category_id == category.id))).scalar() or 0
    e_cnt = (await db.execute(select(func.count(Event.id)).where(Event.category_id == category.id))).scalar() or 0
    
    return CategoryResponse(
        id=category.id,
        name=category.name,
        slug=category.slug,
        description=category.description,
        display_order=category.display_order or 0,
        is_archived=bool(category.is_archived),
        posts_count=p_cnt,
        resources_count=r_cnt,
        events_count=e_cnt
    )

@router.delete("/categories/{id}")
async def delete_category(id: str, user = Depends(RequirePermission("categories.edit")), db: AsyncSession = Depends(get_db)):
    res = await db.execute(select(Category).where(Category.id == id))
    category = res.scalars().first()
    if not category:
        raise HTTPException(status_code=404, detail="Catégorie non trouvée.")
        
    # Prevent deletion if posts, resources, or events depend on it
    p_cnt = (await db.execute(select(func.count(Post.id)).where(Post.category_id == id))).scalar() or 0
    r_cnt = (await db.execute(select(func.count(Resource.id)).where(Resource.category_id == id))).scalar() or 0
    e_cnt = (await db.execute(select(func.count(Event.id)).where(Event.category_id == id))).scalar() or 0
    
    total_usage = p_cnt + r_cnt + e_cnt
    if total_usage > 0:
        raise HTTPException(
            status_code=400,
            detail=f"Impossible de supprimer cette catégorie car elle est utilisée par {p_cnt} article(s), {r_cnt} ressource(s) et {e_cnt} événement(s). Vous pouvez l'archiver à la place."
        )
        
    await db.delete(category)
    await db.commit()
    return {"ok": True}

# --- Tags ---

@router.get("/tags", response_model=List[TagResponse])
async def list_tags(db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(Tag))
    return result.scalars().all()

@router.post("/tags", response_model=TagResponse)
async def create_tag(tag_data: TagCreate, user = Depends(RequirePermission("categories.edit")), db: AsyncSession = Depends(get_db)):
    res = await db.execute(select(Tag).where(Tag.slug == tag_data.slug))
    if res.scalars().first():
        raise HTTPException(status_code=400, detail="Tag slug already exists")
    
    tag = Tag(name=tag_data.name, slug=tag_data.slug)
    db.add(tag)
    await db.commit()
    await db.refresh(tag)
    return tag

@router.delete("/tags/{id}")
async def delete_tag(id: str, user = Depends(RequirePermission("categories.edit")), db: AsyncSession = Depends(get_db)):
    res = await db.execute(select(Tag).where(Tag.id == id))
    tag = res.scalars().first()
    if not tag:
        raise HTTPException(status_code=404, detail="Tag not found")
        
    await db.delete(tag)
    await db.commit()
    return {"ok": True}
