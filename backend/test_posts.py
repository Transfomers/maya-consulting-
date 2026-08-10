import asyncio
import httpx
from sqlalchemy.ext.asyncio import AsyncSession, create_async_engine
from sqlalchemy.orm import sessionmaker
from sqlalchemy import select, delete
from app.models.post import Post, PostTranslation, Category, Tag
from app.core.config import settings

engine = create_async_engine(settings.DATABASE_URL)
TestingSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine, class_=AsyncSession)

async def test_slug_logic():
    async with TestingSessionLocal() as db:
        # Check slugs
        query = select(Post)
        res = await db.execute(query)
        posts = res.scalars().all()
        print(f"Total posts: {len(posts)}")
        for p in posts:
            print(f"Post ID: {p.id}, Slug: {p.slug}, Status: {p.status}")
            
if __name__ == "__main__":
    asyncio.run(test_slug_logic())
