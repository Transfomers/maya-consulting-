import asyncio
from datetime import datetime, timezone, timedelta
from sqlalchemy.ext.asyncio import AsyncSession
from app.core.database import AsyncSessionLocal

# Import ALL models so SQLAlchemy can resolve string references in relationships
from app.models.user import User
from app.models.media import Media
from app.models.post import Post, PostTranslation
from app.models.event import Event, EventTranslation
from app.models.submission import Submission

async def seed_blogs():
    async with AsyncSessionLocal() as session:
        # Create a sample blog post
        post1 = Post(
            slug="sample-blog-post",
            status="published",
            category_id=None,
            featured_image_id=None,
            published_at=datetime.now(timezone.utc)
        )
        session.add(post1)
        await session.flush()

        # Translations for post 1
        t1_en = PostTranslation(
            post_id=post1.id,
            language="en",
            title="The Future of Entrepreneurship in Africa",
            excerpt="Africa is quickly becoming the hub for innovative startups. Here's what you need to know about the evolving landscape.",
            content="<p>Entrepreneurship in Africa is on the rise. With a booming young population and increased access to technology, we are seeing a wave of new startups that are solving local problems with global potential.</p><h2>The Tech Boom</h2><p>Tech hubs are emerging in cities like Lagos, Nairobi, and Cape Town. These ecosystems provide the necessary support for founders to thrive.</p>",
            seo_title="Future of African Entrepreneurship | CAP",
            seo_description="Discover why Africa is becoming a global hub for innovative startups and entrepreneurship.",
            focus_keyword="African Entrepreneurship",
            canonical_url="",
            allow_index=True,
            allow_follow=True
        )
        
        t1_fr = PostTranslation(
            post_id=post1.id,
            language="fr",
            title="L'Avenir de l'Entrepreneuriat en Afrique",
            excerpt="L'Afrique devient rapidement le centre de startups innovantes.",
            content="<p>L'entrepreneuriat en Afrique est en plein essor.</p>",
            seo_title="Avenir Entrepreneuriat Afrique",
            seo_description="Découvrez pourquoi l'Afrique devient un centre mondial pour les startups innovantes.",
            focus_keyword="Entrepreneuriat Africain",
            canonical_url="",
            allow_index=True,
            allow_follow=True
        )
        
        session.add_all([t1_en, t1_fr])
        
        event1 = Event(
            slug="annual-pitch-competition",
            status="published",
            start_date=datetime.now(timezone.utc) + timedelta(days=30),
            end_date=datetime.now(timezone.utc) + timedelta(days=32),
            location="Kigali Innovation City, Rwanda",
            featured_image_id=None
        )
        session.add(event1)
        await session.flush()
        
        e1_en = EventTranslation(
            event_id=event1.id,
            language="en",
            title="Annual Pitch Competition 2026",
            excerpt="Join us for the biggest startup pitch competition of the year.",
            content="<p>Showcase your startup to top investors from around the world.</p>",
            seo_title="Pitch Competition 2026 | CAP",
            seo_description="Join our annual startup pitch competition."
        )
        session.add(e1_en)

        await session.commit()
        print("Successfully seeded blogs and events locally!")

if __name__ == "__main__":
    asyncio.run(seed_blogs())
