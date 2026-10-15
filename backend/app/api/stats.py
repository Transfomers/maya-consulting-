from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func
from app.core.database import get_db
from app.core.security import RequirePermission
from app.models.post import Post, Category, Tag
from app.models.media import Media
from app.models.event import Event
from app.models.resource import Resource
from app.models.newsletter import NewsletterSubscriber
from pydantic import BaseModel

router = APIRouter()

class StatsResponse(BaseModel):
    total_articles: int
    published_articles: int
    draft_articles: int
    scheduled_articles: int
    total_categories: int
    total_media: int
    total_events: int
    total_resources: int = 0
    total_subscribers: int = 0

@router.get("/", response_model=StatsResponse)
async def get_stats(user = Depends(RequirePermission("articles.view")), db: AsyncSession = Depends(get_db)):
    total_articles = await db.execute(select(func.count(Post.id)))
    published_articles = await db.execute(select(func.count(Post.id)).where(Post.status == "published"))
    draft_articles = await db.execute(select(func.count(Post.id)).where(Post.status == "draft"))
    scheduled_articles = await db.execute(select(func.count(Post.id)).where(Post.status == "scheduled"))
    
    total_categories = await db.execute(select(func.count(Category.id)))
    total_media = await db.execute(select(func.count(Media.id)))
    total_events = await db.execute(select(func.count(Event.id)))
    total_resources = await db.execute(select(func.count(Resource.id)))
    total_subscribers = await db.execute(select(func.count(NewsletterSubscriber.id)).where(NewsletterSubscriber.status == "confirmed"))
    
    return StatsResponse(
        total_articles=total_articles.scalar() or 0,
        published_articles=published_articles.scalar() or 0,
        draft_articles=draft_articles.scalar() or 0,
        scheduled_articles=scheduled_articles.scalar() or 0,
        total_categories=total_categories.scalar() or 0,
        total_media=total_media.scalar() or 0,
        total_events=total_events.scalar() or 0,
        total_resources=total_resources.scalar() or 0,
        total_subscribers=total_subscribers.scalar() or 0
    )

