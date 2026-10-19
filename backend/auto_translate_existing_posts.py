import asyncio
import logging
from sqlalchemy import select
from sqlalchemy.orm import selectinload
from app.core.database import AsyncSessionLocal
from app.models.post import Post, PostTranslation
from app.services.translation_service import translate_blog_post

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("auto_translate_script")

async def main():
    async with AsyncSessionLocal() as session:
        result = await session.execute(
            select(Post).options(selectinload(Post.translations))
        )
        posts = result.scalars().all()
        logger.info(f"Found {len(posts)} posts in database.")

        target_langs = ["en", "fr", "ar"]

        for post in posts:
            existing_by_lang = {t.language.lower(): t for t in (post.translations or []) if t.title}
            if not existing_by_lang:
                continue

            # Pick base translation
            base = existing_by_lang.get("fr") or existing_by_lang.get("en") or next(iter(existing_by_lang.values()))
            source_lang = base.language.lower()

            for target in target_langs:
                if target not in existing_by_lang:
                    logger.info(f"Translating post '{post.slug}' from {source_lang} to {target}...")
                    trans = await translate_blog_post(
                        title=base.title,
                        excerpt=base.excerpt,
                        content=base.content,
                        target_lang=target,
                        source_lang=source_lang
                    )

                    new_t = PostTranslation(
                        post_id=post.id,
                        language=target,
                        title=trans["title"],
                        slug=post.slug,
                        excerpt=trans["excerpt"],
                        content=trans["content"],
                        seo_title=trans["title"][:70],
                        seo_description=trans["excerpt"][:160] if trans["excerpt"] else "",
                        allow_index=True,
                        allow_follow=True
                    )
                    session.add(new_t)
                    existing_by_lang[target] = new_t

        await session.commit()
        logger.info("Successfully updated all posts with full translations (EN, FR, AR)!")

if __name__ == "__main__":
    asyncio.run(main())
