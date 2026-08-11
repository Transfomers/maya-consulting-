from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from typing import List
from app.core.database import get_db
from app.schemas.taxonomy import CategoryResponse, TagResponse
from app.models.post import Category, Tag

router = APIRouter()

@router.get("/categories", response_model=List[CategoryResponse])
async def list_public_categories(db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(Category))
    return result.scalars().all()

@router.get("/tags", response_model=List[TagResponse])
async def list_public_tags(db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(Tag))
    return result.scalars().all()
