from sqlalchemy import Column, String, DateTime, Text, JSON
from app.core.database import Base
from datetime import datetime, timezone
import uuid

class ChatConversation(Base):
    __tablename__ = "chat_conversations"
    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    session_id = Column(String, index=True, nullable=False)
    visitor_name = Column(String, nullable=True)
    visitor_email = Column(String, nullable=True)
    language = Column(String, default="fr", nullable=False)
    category = Column(String, nullable=True)
    message = Column(Text, nullable=False)
    sender = Column(String, nullable=False) # "visitor" | "bot" | "admin"
    created_at = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc))
    metadata_json = Column(JSON, nullable=True)
