from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, delete
from typing import List
from app.core.database import get_db
from app.core.security import RequirePermission
from app.schemas.taxonomy import CategoryCreate, CategoryResponse, TagCreate, TagResponse
from app.models.post import Category, Tag, Post

router = APIRouter()

# --- Categories ---

@router.get("/categories", response_model=List[CategoryResponse])
async def list_categories(db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(Category))
    return result.scalars().all()

@router.post("/categories", response_model=CategoryResponse)
async def create_category(category_data: CategoryCreate, user = Depends(RequirePermission("categories.edit")), db: AsyncSession = Depends(get_db)):
    # Check if slug exists
    res = await db.execute(select(Category).where(Category.slug == category_data.slug))
    if res.scalars().first():
        raise HTTPException(status_code=400, detail="Category slug already exists")
    
    category = Category(name=category_data.name, slug=category_data.slug)
    db.add(category)
    await db.commit()
    await db.refresh(category)
    return category

@router.put("/categories/{id}", response_model=CategoryResponse)
async def update_category(id: str, category_data: CategoryCreate, user = Depends(RequirePermission("categories.edit")), db: AsyncSession = Depends(get_db)):
    res = await db.execute(select(Category).where(Category.id == id))
    category = res.scalars().first()
    if not category:
        raise HTTPException(status_code=404, detail="Category not found")
        
    res_slug = await db.execute(select(Category).where(Category.slug == category_data.slug, Category.id != id))
    if res_slug.scalars().first():
        raise HTTPException(status_code=400, detail="Category slug already exists")

    category.name = category_data.name
    category.slug = category_data.slug
    await db.commit()
    await db.refresh(category)
    return category

@router.delete("/categories/{id}")
async def delete_category(id: str, user = Depends(RequirePermission("categories.edit")), db: AsyncSession = Depends(get_db)):
    res = await db.execute(select(Category).where(Category.id == id))
    category = res.scalars().first()
    if not category:
        raise HTTPException(status_code=404, detail="Category not found")
        
    # Prevent deletion if posts depend on it
    res_posts = await db.execute(select(Post).where(Post.category_id == id))
    if res_posts.scalars().first():
        raise HTTPException(status_code=400, detail="Cannot delete category used by posts")
        
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
