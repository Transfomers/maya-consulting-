from fastapi import APIRouter, Depends, Response
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from sqlalchemy.orm import selectinload
from app.core.database import get_db
from app.models.post import Post
from app.models.event import Event

router = APIRouter()

@router.get("/robots.txt", response_class=Response)
async def get_robots_txt():
    content = """User-agent: *
Allow: /
Disallow: /admin/
Disallow: /api/admin/

Sitemap: https://capentrepreneurs.org/sitemap.xml
"""
    return Response(content=content, media_type="text/plain")

@router.get("/sitemap.xml", response_class=Response)
async def get_sitemap(db: AsyncSession = Depends(get_db)):
    base_url = "https://capentrepreneurs.org"
    
    # Static pages
    urls = [
        f"{base_url}/",
        f"{base_url}/about",
        f"{base_url}/programs",
        f"{base_url}/news",
        f"{base_url}/events",
        f"{base_url}/contact",
        f"{base_url}/donate",
    ]
    
    # Dynamic Posts (Only published)
    query = select(Post).where(Post.status == "published").options(selectinload(Post.translations))
    result = await db.execute(query)
    posts = result.scalars().all()
    
    # We construct the XML manually for simplicity
    xml = '<?xml version="1.0" encoding="UTF-8"?>\\n'
    xml += '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:xhtml="http://www.w3.org/1999/xhtml">\\n'
    
    for url in urls:
        xml += f"  <url>\\n    <loc>{url}</loc>\\n  </url>\\n"
        
    for post in posts:
        # Get language variants
        variants = {t.language.lower(): t.slug for t in post.translations if t.allow_index}
        
        for lang, slug in variants.items():
            loc = f"{base_url}/{lang}/news/{slug}"
            xml += "  <url>\\n"
            xml += f"    <loc>{loc}</loc>\\n"
            
            # Hreflang for translations
            for alt_lang, alt_slug in variants.items():
                alt_loc = f"{base_url}/{alt_lang}/news/{alt_slug}"
                xml += f'    <xhtml:link rel="alternate" hreflang="{alt_lang}" href="{alt_loc}" />\\n'
                
            xml += "  </url>\\n"
            
    xml += "</urlset>"
    
    return Response(content=xml, media_type="application/xml")
