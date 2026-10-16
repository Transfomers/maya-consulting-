import asyncio
import httpx
from sqlalchemy.ext.asyncio import AsyncSession, create_async_engine
from sqlalchemy.orm import sessionmaker
from sqlalchemy import select, delete
from app.models.post import Post, PostTranslation, Category, Tag
from app.core.config import settings

engine = create_async_engine(settings.DATABASE_URL)
TestingSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine, class_=AsyncSession)

async def _test_slug_logic_async():
    async with TestingSessionLocal() as db:
        query = select(Post)
        res = await db.execute(query)
        posts = res.scalars().all()
        assert isinstance(posts, list)

def test_slug_logic():
    asyncio.run(_test_slug_logic_async())

if __name__ == "__main__":
    test_slug_logic()
