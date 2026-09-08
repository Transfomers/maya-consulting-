import logging
from fastapi import FastAPI
from starlette.middleware.cors import CORSMiddleware
from app.core.config import settings
from fastapi.staticfiles import StaticFiles
from app.api import auth, submissions, posts, events, media, seo, stats, taxonomy, public_posts, settings as api_settings, public_taxonomy, public_settings, admin_users, chat
import os

app = FastAPI(title=settings.PROJECT_NAME)

app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=[settings.FRONTEND_URL],
    allow_methods=["*"],
    allow_headers=["*"],
)

UPLOAD_DIR = os.path.join(os.path.dirname(os.path.dirname(__file__)), "data", "uploads")
os.makedirs(UPLOAD_DIR, exist_ok=True)
app.mount("/uploads", StaticFiles(directory=UPLOAD_DIR), name="uploads")

app.include_router(seo.router, tags=["seo"])
app.include_router(auth.router, prefix="/api/v1/auth", tags=["auth"])
app.include_router(public_taxonomy.router, prefix="/api/v1", tags=["public_taxonomy"])
app.include_router(stats.router, prefix="/api/v1/admin/stats", tags=["stats"])
app.include_router(taxonomy.router, prefix="/api/v1/admin", tags=["taxonomy"])
app.include_router(submissions.router, prefix="/api/v1/submissions", tags=["submissions"])
app.include_router(chat.router, prefix="/api/v1/chat", tags=["chat"])
app.include_router(posts.router, prefix="/api/v1/admin/posts", tags=["posts"])
app.include_router(public_posts.router, prefix="/api/v1/posts", tags=["public_posts"])
app.include_router(public_taxonomy.router, prefix="/api/v1/taxonomy", tags=["public_taxonomy"])
app.include_router(public_settings.router, prefix="/api/v1/public/settings", tags=["public_settings"])
app.include_router(events.router, prefix="/api/v1/admin/events", tags=["events"])
app.include_router(media.router, prefix="/api/v1/admin/media", tags=["media"])
app.include_router(api_settings.router, prefix="/api/v1/admin/settings", tags=["settings"])
app.include_router(admin_users.router, prefix="/api/v1/admin/users", tags=["Admin Users"])


logging.basicConfig(level=logging.INFO, format="%(asctime)s - %(name)s - %(levelname)s - %(message)s")
logger = logging.getLogger(__name__)

@app.get("/api/")
async def root():
    return {"message": settings.PROJECT_NAME}
