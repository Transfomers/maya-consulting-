import json
import logging

import httpx
from fastapi import APIRouter, HTTPException
from fastapi.responses import JSONResponse, StreamingResponse

from app.core.config import settings
from app.schemas.chat import ChatRequest

router = APIRouter()
logger = logging.getLogger(__name__)

CHAT_TIMEOUT = httpx.Timeout(120.0, connect=15.0)


def _crafti_headers(accept: str) -> dict[str, str]:
    return {
        "Content-Type": "application/json",
        "Accept": accept,
        "X-API-Key": settings.CRAFTI_API_KEY,
    }


def _chat_payload(body: ChatRequest) -> dict:
    payload = {
        "message": body.message,
        "session_id": body.session_id,
    }
    if body.language:
        payload["language"] = body.language
    if body.category:
        payload["category"] = body.category
    return payload


def _ensure_configured() -> None:
    if not settings.CRAFTI_API_KEY:
        raise HTTPException(status_code=503, detail="Chatbot is not configured.")


def _error_from_upstream(status_code: int, raw: bytes) -> HTTPException:
    detail = "Service indisponible."
    try:
        parsed = json.loads(raw.decode("utf-8") or "{}")
        if isinstance(parsed, dict) and parsed.get("detail"):
            detail = parsed["detail"]
    except (UnicodeDecodeError, json.JSONDecodeError, AttributeError):
        pass
    return HTTPException(status_code=status_code, detail=detail)


@router.post("/")
async def chat_complete(body: ChatRequest):
    _ensure_configured()
    url = f"{settings.CRAFTI_API_BASE}/api/v1/chat/"
    try:
        async with httpx.AsyncClient(timeout=CHAT_TIMEOUT) as client:
            response = await client.post(
                url,
                headers=_crafti_headers("application/json"),
                json=_chat_payload(body),
            )
    except httpx.RequestError:
        logger.warning("Crafti chat JSON request failed")
        raise HTTPException(status_code=502, detail="Le chatbot est temporairement indisponible.") from None

    if response.status_code >= 400:
        raise _error_from_upstream(response.status_code, response.content)
    return JSONResponse(content=response.json(), status_code=response.status_code)


@router.post("/stream/")
async def chat_stream(body: ChatRequest):
    _ensure_configured()
    url = f"{settings.CRAFTI_API_BASE}/api/v1/chat/stream/"
    client = httpx.AsyncClient(timeout=CHAT_TIMEOUT)
    try:
        request = client.build_request(
            "POST",
            url,
            headers=_crafti_headers("application/x-ndjson"),
            json=_chat_payload(body),
        )
        response = await client.send(request, stream=True)
    except httpx.RequestError:
        await client.aclose()
        logger.warning("Crafti chat stream request failed")
        raise HTTPException(status_code=502, detail="Le chatbot est temporairement indisponible.") from None

    if response.status_code >= 400:
        raw = await response.aread()
        await response.aclose()
        await client.aclose()
        raise _error_from_upstream(response.status_code, raw)

    async def generate():
        try:
            async for chunk in response.aiter_bytes():
                if chunk:
                    yield chunk
        finally:
            await response.aclose()
            await client.aclose()

    return StreamingResponse(
        generate(),
        media_type="application/x-ndjson",
        headers={
            "Cache-Control": "no-cache",
            "X-Accel-Buffering": "no",
        },
    )
