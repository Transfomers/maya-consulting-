from app.models.role import Role
from app.models.user import User
from app.models.media import Media
from app.models.post import Post, PostTranslation, Category, Tag, Reference, post_tag_association
from app.models.speaker import Speaker, event_speaker_association
from app.models.event import Event, EventTranslation
from app.models.resource import Resource
from app.models.setting import Setting
from app.models.submission import Submission
from app.models.conversation import ChatConversation
from sqlalchemy.orm import configure_mappers

# Ensure all SQLAlchemy mappers are configured across all models
try:
    configure_mappers()
except Exception:
    pass

__all__ = [
    "Role",
    "User",
    "Media",
    "Post",
    "PostTranslation",
    "Category",
    "Tag",
    "Reference",
    "post_tag_association",
    "Speaker",
    "event_speaker_association",
    "Event",
    "EventTranslation",
    "Resource",
    "Setting",
    "Submission",
    "ChatConversation",
]
