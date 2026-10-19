from fastapi import APIRouter, Depends, HTTPException, Body
from typing import List, Optional, Dict, Any
from pydantic import BaseModel
from app.services.translation_service import (
    translate_text,
    translate_html,
    translate_blog_post
)
from app.core.database import get_db
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, delete
from sqlalchemy.orm import selectinload
from app.models.post import Post, PostTranslation
from app.core.security import RequirePermission

router = APIRouter()

class TranslationRequest(BaseModel):
    text: Optional[str] = None
    texts: Optional[List[str]] = None
    html: Optional[str] = None
    target_lang: str
    source_lang: Optional[str] = "auto"

class TranslationResponse(BaseModel):
    translated_text: Optional[str] = None
    translated_texts: Optional[List[str]] = None
    translated_html: Optional[str] = None
    target_lang: str
    source_lang: str

class PostTranslationRequest(BaseModel):
    title: str
    excerpt: Optional[str] = ""
    content: Optional[str] = ""
    target_lang: str
    source_lang: Optional[str] = "auto"

class PostTranslationResponse(BaseModel):
    title: str
    excerpt: str
    content: str
    language: str

@router.post("", response_model=TranslationResponse)
@router.post("/", response_model=TranslationResponse)
async def translate_endpoint(req: TranslationRequest):
    if not req.target_lang:
        raise HTTPException(status_code=400, detail="target_lang is required")
    
    translated_text = None
    translated_texts = None
    translated_html = None

    if req.text is not None:
        translated_text = await translate_text(req.text, req.target_lang, req.source_lang or "auto")

    if req.texts is not None:
        tasks = [translate_text(t, req.target_lang, req.source_lang or "auto") for t in req.texts]
        import asyncio
        translated_texts = await asyncio.gather(*tasks)

    if req.html is not None:
        translated_html = await translate_html(req.html, req.target_lang, req.source_lang or "auto")

    return TranslationResponse(
        translated_text=translated_text,
        translated_texts=translated_texts,
        translated_html=translated_html,
        target_lang=req.target_lang,
        source_lang=req.source_lang or "auto"
    )

@router.post("/post", response_model=PostTranslationResponse)
async def translate_post_endpoint(req: PostTranslationRequest):
    if not req.target_lang:
        raise HTTPException(status_code=400, detail="target_lang is required")
    
    result = await translate_blog_post(
        title=req.title,
        excerpt=req.excerpt,
        content=req.content,
        target_lang=req.target_lang,
        source_lang=req.source_lang or "auto"
    )

    return PostTranslationResponse(
        title=result["title"],
        excerpt=result["excerpt"],
        content=result["content"],
        language=result["language"]
    )

@router.post("/auto-translate-post/{post_id}")
async def auto_translate_saved_post(
    post_id: str,
    user = Depends(RequirePermission("articles.view")),
    db: AsyncSession = Depends(get_db)
):
    """Automatically generates translations for missing languages (en, fr, ar) for a specific post."""
    result = await db.execute(
        select(Post).where(Post.id == post_id).options(selectinload(Post.translations))
    )
    post = result.scalars().first()
    if not post:
        raise HTTPException(status_code=404, detail="Post not found")

    existing_langs = {t.language: t for t in (post.translations or [])}
    if not existing_langs:
        raise HTTPException(status_code=400, detail="Post has no base translation")

    # Pick base translation: prefer fr, then en, then first available
    base_t = existing_langs.get("fr") or existing_langs.get("en") or next(iter(existing_langs.values()))
    base_lang = base_t.language

    all_langs = ["fr", "en", "ar"]
    missing_langs = [l for l in all_langs if l not in existing_langs or not existing_langs[l].title]

    new_translations = []
    for target in missing_langs:
        trans = await translate_blog_post(
            title=base_t.title,
            excerpt=base_t.excerpt,
            content=base_t.content,
            target_lang=target,
            source_lang=base_lang
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
        db.add(new_t)
        new_translations.append(target)

    if new_translations:
        await db.commit()

    return {"status": "success", "added_languages": new_translations}
