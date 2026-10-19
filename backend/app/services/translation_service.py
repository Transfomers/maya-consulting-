import asyncio
import hashlib
import json
import logging
import os
import re
import urllib.parse
from typing import Dict, List, Optional
import httpx

logger = logging.getLogger("translation_service")

CACHE_FILE = os.path.join(os.path.dirname(os.path.dirname(os.path.dirname(__file__))), "data", "translation_cache.json")
_memory_cache: Dict[str, str] = {}

def _init_cache():
    global _memory_cache
    try:
        os.makedirs(os.path.dirname(CACHE_FILE), exist_ok=True)
        if os.path.exists(CACHE_FILE):
            with open(CACHE_FILE, "r", encoding="utf-8") as f:
                _memory_cache = json.load(f)
    except Exception as e:
        logger.warning(f"Could not load translation cache file: {e}")
        _memory_cache = {}

def _save_cache():
    try:
        os.makedirs(os.path.dirname(CACHE_FILE), exist_ok=True)
        with open(CACHE_FILE, "w", encoding="utf-8") as f:
            json.dump(_memory_cache, f, ensure_ascii=False, indent=2)
    except Exception as e:
        logger.warning(f"Could not save translation cache: {e}")

_init_cache()

def _cache_key(text: str, target: str, source: str) -> str:
    h = hashlib.sha256(text.strip().encode("utf-8")).hexdigest()[:16]
    return f"{source}:{target}:{h}"

async def _translate_with_google(text: str, target: str, source: str = "auto") -> Optional[str]:
    """Translates text using Google Translate GTX endpoint with browser User-Agent."""
    try:
        headers = {
            "User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36"
        }
        url = "https://translate.googleapis.com/translate_a/single"
        params = {
            "client": "gtx",
            "sl": source if source != "auto" else "auto",
            "tl": target,
            "dt": "t",
            "q": text
        }
        async with httpx.AsyncClient(timeout=10.0, headers=headers) as client:
            resp = await client.get(url, params=params)
            if resp.status_code == 200:
                data = resp.json()
                if isinstance(data, list) and len(data) > 0 and isinstance(data[0], list):
                    translated = "".join([segment[0] for segment in data[0] if segment and segment[0]])
                    if translated:
                        return translated
    except Exception as e:
        logger.debug(f"Google translate request failed: {e}")
    return None

async def _translate_with_mymemory(text: str, target: str, source: str = "en") -> Optional[str]:
    """Fallback translator using MyMemory API."""
    try:
        sl = "en" if source in ("auto", "") else source
        tl = target
        url = "https://api.mymemory.translated.net/get"
        params = {
            "q": text[:500],
            "langpair": f"{sl}|{tl}"
        }
        async with httpx.AsyncClient(timeout=10.0) as client:
            resp = await client.get(url, params=params)
            if resp.status_code == 200:
                data = resp.json()
                text_res = data.get("responseData", {}).get("translatedText")
                if text_res and not text_res.startswith("MYMEMORY WARNING"):
                    return text_res
    except Exception as e:
        logger.debug(f"MyMemory translate request failed: {e}")
    return None

async def translate_text(text: str, target_lang: str, source_lang: str = "auto") -> str:
    """Translate a plain text string to target language with multi-tier caching and fallback."""
    if not text or not text.strip():
        return text

    target = target_lang.strip().lower()
    source = source_lang.strip().lower() if source_lang else "auto"

    if target == source and source != "auto":
        return text

    key = _cache_key(text, target, source)
    if key in _memory_cache:
        return _memory_cache[key]

    # Chunking for long texts (> 2000 chars)
    if len(text) > 2000:
        paragraphs = text.split("\n\n")
        translated_paragraphs = []
        for p in paragraphs:
            if p.strip():
                t_p = await translate_text(p, target, source)
                translated_paragraphs.append(t_p)
            else:
                translated_paragraphs.append("")
        result = "\n\n".join(translated_paragraphs)
        _memory_cache[key] = result
        _save_cache()
        return result

    # 1. Try Google Translate
    translated = await _translate_with_google(text, target, source)
    
    # 2. Try MyMemory Fallback if Google failed
    if not translated:
        translated = await _translate_with_mymemory(text, target, source)

    # 3. Final fallback: return original text if both fail
    final_result = translated if translated else text

    _memory_cache[key] = final_result
    _save_cache()
    return final_result

async def translate_html(html_str: str, target_lang: str, source_lang: str = "auto") -> str:
    """Translates HTML content while preserving tags, attributes, images, and links."""
    if not html_str or not html_str.strip():
        return html_str

    target = target_lang.strip().lower()
    source = source_lang.strip().lower() if source_lang else "auto"

    key = _cache_key(html_str, target, source)
    if key in _memory_cache:
        return _memory_cache[key]

    # Split HTML by tags (<...>)
    tokens = re.split(r'(<[^>]+>)', html_str)
    translated_tokens = []

    # Collect texts that need translation
    texts_to_translate = []
    text_indices = []

    for idx, token in enumerate(tokens):
        if not token:
            translated_tokens.append("")
            continue
        # If it's a tag
        if token.startswith("<") and token.endswith(">"):
            translated_tokens.append(token)
        else:
            # Check if whitespace only
            if not token.strip():
                translated_tokens.append(token)
            else:
                texts_to_translate.append(token)
                text_indices.append(idx)
                translated_tokens.append("")  # placeholder

    # Translate texts concurrently in batches of 10
    if texts_to_translate:
        chunk_size = 10
        for i in range(0, len(texts_to_translate), chunk_size):
            batch_texts = texts_to_translate[i:i + chunk_size]
            batch_indices = text_indices[i:i + chunk_size]
            tasks = [translate_text(t, target, source) for t in batch_texts]
            results = await asyncio.gather(*tasks, return_exceptions=True)
            for j, res in enumerate(results):
                idx = batch_indices[j]
                if isinstance(res, Exception) or not res:
                    translated_tokens[idx] = batch_texts[j]
                else:
                    translated_tokens[idx] = res

    final_html = "".join(translated_tokens)
    _memory_cache[key] = final_html
    _save_cache()
    return final_html

async def translate_blog_post(
    title: str,
    excerpt: Optional[str],
    content: Optional[str],
    target_lang: str,
    source_lang: str = "auto"
) -> Dict[str, str]:
    """Translates all main fields of a blog post to the desired language."""
    trans_title = await translate_text(title or "", target_lang, source_lang)
    trans_excerpt = await translate_text(excerpt or "", target_lang, source_lang) if excerpt else ""
    trans_content = await translate_html(content or "", target_lang, source_lang) if content else ""

    return {
        "title": trans_title,
        "excerpt": trans_excerpt,
        "content": trans_content,
        "language": target_lang
    }
