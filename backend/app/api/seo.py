from fastapi import APIRouter, Depends, Response
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from sqlalchemy.orm import selectinload
from app.core.database import get_db
from app.models.post import Post
from app.models.event import Event
import os
import json

router = APIRouter()

@router.get("/robots.txt", response_class=Response)
async def get_robots_txt():
    content = """User-agent: *
Allow: /
Disallow: /admin/
Disallow: /api/admin/

Sitemap: https://www.3mservice.shop/sitemap.xml
"""
    return Response(content=content, media_type="text/plain")

@router.get("/sitemap.xml", response_class=Response)
async def get_sitemap(db: AsyncSession = Depends(get_db)):
    base_url = "https://www.3mservice.shop"
    data_dir = os.path.join(os.path.dirname(os.path.dirname(os.path.dirname(__file__))), "data")
    
    vehicles = []
    apartments = []
    try:
        with open(os.path.join(data_dir, "vehicles.json"), "r", encoding="utf-8") as f:
            vehicles = json.load(f)
    except Exception:
        pass

    try:
        with open(os.path.join(data_dir, "apartments.json"), "r", encoding="utf-8") as f:
            apartments = json.load(f)
    except Exception:
        pass

    # Static pages with metadata
    pages = [
        {"url": f"{base_url}/", "priority": "1.0", "changefreq": "daily"},
        {"url": f"{base_url}/boutique", "priority": "0.95", "changefreq": "daily"},
        {"url": f"{base_url}/boutique?tab=vehicules", "priority": "0.90", "changefreq": "daily"},
        {"url": f"{base_url}/boutique?tab=appartements", "priority": "0.90", "changefreq": "daily"},
        {"url": f"{base_url}/about", "priority": "0.80", "changefreq": "weekly"},
        {"url": f"{base_url}/contact", "priority": "0.85", "changefreq": "weekly"},
        {"url": f"{base_url}/blog", "priority": "0.75", "changefreq": "weekly"},
        {"url": f"{base_url}/services", "priority": "0.80", "changefreq": "weekly"},
    ]
    
    # Dynamic Posts (Only published)
    query = select(Post).where(Post.status == "published").options(selectinload(Post.translations))
    result = await db.execute(query)
    posts = result.scalars().all()
    
    xml = '<?xml version="1.0" encoding="UTF-8"?>\n'
    xml += '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"\n'
    xml += '        xmlns:image="http://www.google.com/schemas/sitemap-image/1.1"\n'
    xml += '        xmlns:xhtml="http://www.w3.org/1999/xhtml">\n'
    
    for page in pages:
        xml += f"  <url>\n    <loc>{page['url']}</loc>\n    <changefreq>{page['changefreq']}</changefreq>\n    <priority>{page['priority']}</priority>\n"
        if page['url'] == f"{base_url}/":
            xml += f'    <image:image>\n      <image:loc>{base_url}/Asset/logo-3m-services.png</image:loc>\n      <image:title>3M SERVICES Yaoundé</image:title>\n    </image:image>\n'
        elif page['url'] == f"{base_url}/boutique":
            for v in vehicles:
                img = v.get("image")
                if img:
                    title = f"{v.get('brand', '')} {v.get('model', '')} - 3M SERVICES".replace("&", "&amp;")
                    xml += f'    <image:image>\n      <image:loc>{img}</image:loc>\n      <image:title>{title}</image:title>\n    </image:image>\n'
            for a in apartments:
                img = a.get("image")
                if img:
                    title = f"{a.get('title', '')} - 3M SERVICES".replace("&", "&amp;")
                    xml += f'    <image:image>\n      <image:loc>{img}</image:loc>\n      <image:title>{title}</image:title>\n    </image:image>\n'
        xml += "  </url>\n"
        
    for post in posts:
        variants = {t.language.lower(): t.slug for t in post.translations if t.allow_index}
        for lang, slug in variants.items():
            loc = f"{base_url}/{lang}/news/{slug}"
            xml += "  <url>\n"
            xml += f"    <loc>{loc}</loc>\n"
            xml += "    <changefreq>weekly</changefreq>\n"
            xml += "    <priority>0.7</priority>\n"
            if post.featured_image:
                xml += f'    <image:image>\n      <image:loc>{post.featured_image}</image:loc>\n    </image:image>\n'
            for alt_lang, alt_slug in variants.items():
                alt_loc = f"{base_url}/{alt_lang}/news/{alt_slug}"
                xml += f'    <xhtml:link rel="alternate" hreflang="{alt_lang}" href="{alt_loc}" />\n'
            xml += "  </url>\n"
            
    xml += "</urlset>"
    
    return Response(content=xml, media_type="application/xml")

