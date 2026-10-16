import asyncio
import pytest
from sqlalchemy.ext.asyncio import AsyncSession, create_async_engine
from sqlalchemy.orm import sessionmaker
from sqlalchemy import select, func
from datetime import datetime, timezone, timedelta

from app.core.config import settings
from app.models.post import Post, Category
from app.models.media import Media
from app.models.resource import Resource
from app.models.event import Event
from app.models.submission import Submission
from app.models.newsletter import NewsletterSubscriber

engine = create_async_engine(settings.DATABASE_URL)
TestingSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine, class_=AsyncSession)

async def _test_dashboard_stats_accuracy():
    async with TestingSessionLocal() as db:
        # Verify real database counts are returned as integers >= 0
        total_posts = (await db.execute(select(func.count(Post.id)))).scalar() or 0
        published_posts = (await db.execute(select(func.count(Post.id)).where(Post.status == "published"))).scalar() or 0
        categories_count = (await db.execute(select(func.count(Category.id)).where(Category.is_archived == False))).scalar() or 0
        media_count = (await db.execute(select(func.count(Media.id)))).scalar() or 0
        resources_count = (await db.execute(select(func.count(Resource.id)))).scalar() or 0
        events_count = (await db.execute(select(func.count(Event.id)))).scalar() or 0
        submissions_count = (await db.execute(select(func.count(Submission.id)))).scalar() or 0

        assert total_posts >= 0
        assert published_posts <= total_posts
        assert categories_count >= 13  # Baseline verified
        assert media_count >= 1
        assert resources_count >= 2
        assert submissions_count >= 10

def test_dashboard_stats_accuracy():
    asyncio.run(_test_dashboard_stats_accuracy())

async def _test_resource_download_and_education():
    async with TestingSessionLocal() as db:
        # Find any resource
        res = (await db.execute(select(Resource))).scalars().first()
        assert res is not None
        
        # Test download counter field
        initial_downloads = res.downloads_count or 0
        res.downloads_count = initial_downloads + 1
        await db.commit()
        await db.refresh(res)
        assert res.downloads_count == initial_downloads + 1

        # Test educational fields exist and are settable
        res.skill_level = "Tous niveaux"
        res.duration = "2 heures"
        res.language = "fr"
        await db.commit()
        await db.refresh(res)
        assert res.skill_level == "Tous niveaux"
        assert res.duration == "2 heures"

def test_resource_download_and_education():
    asyncio.run(_test_resource_download_and_education())

async def _test_category_safeguards():
    async with TestingSessionLocal() as db:
        # Check active categories
        res = await db.execute(select(Category).where(Category.is_archived == False))
        categories = res.scalars().all()
        assert len(categories) >= 13
        for c in categories:
            assert c.slug is not None
            assert len(c.name) > 0

def test_category_safeguards():
    asyncio.run(_test_category_safeguards())

async def _test_submissions_workflow_and_assignment():
    async with TestingSessionLocal() as db:
        # Test creating a test submission with valid payload
        test_sub = Submission(
            type="partner",
            payload={
                "name": "Test Organisation",
                "email": "test@partner.org",
                "status": "new",
                "assigned_to": "Équipe CAP",
                "notes": [{"text": "Dossier préliminaire reçu", "author": "Automated Test"}]
            }
        )
        db.add(test_sub)
        await db.commit()
        await db.refresh(test_sub)

        # Verify reviewer assignment and transition to under_review
        test_sub.payload = dict(test_sub.payload, status="in_review", assigned_to="Murielle")
        await db.commit()
        await db.refresh(test_sub)

        assert test_sub.payload["status"] == "in_review"
        assert test_sub.payload["assigned_to"] == "Murielle"

        # Cleanup test submission
        await db.delete(test_sub)
        await db.commit()

def test_submissions_workflow_and_assignment():
    asyncio.run(_test_submissions_workflow_and_assignment())
