from sqlalchemy import Column, String, DateTime, Text, ForeignKey, Boolean
from sqlalchemy.orm import relationship
from app.core.database import Base
from datetime import datetime, timezone
import uuid
from sqlalchemy import JSON, Integer

class Event(Base):
    __tablename__ = "events"
    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    slug = Column(String, unique=True, nullable=False)
    status = Column(String, default="draft")
    start_date = Column(DateTime(timezone=True), nullable=True)
    end_date = Column(DateTime(timezone=True), nullable=True)
    location = Column(String, nullable=True)
    author_id = Column(String, ForeignKey("users.id"))
    category_id = Column(String, ForeignKey("categories.id"), nullable=True)
    featured_image_id = Column(String, ForeignKey("media.id"), nullable=True)
    
    # Advanced Event Fields
    all_day = Column(Boolean, default=False)
    timezone = Column(String, default="UTC")
    location_url = Column(String, nullable=True)
    is_online = Column(Boolean, default=False)
    meeting_url = Column(String, nullable=True)
    
    registration_required = Column(Boolean, default=False)
    registration_url = Column(String, nullable=True)
    registration_deadline = Column(DateTime(timezone=True), nullable=True)
    max_participants = Column(Integer, nullable=True)
    
    recurrence = Column(JSON, nullable=True)
    visibility = Column(String, default="public") # public, private, admin
    
    created_at = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc))
    updated_at = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc), onupdate=lambda: datetime.now(timezone.utc))

    author = relationship("User")
    category = relationship("Category")
    featured_image = relationship("Media")
    translations = relationship("EventTranslation", back_populates="event", cascade="all, delete-orphan")
    speakers = relationship("Speaker", secondary="event_speaker")

class EventTranslation(Base):
    __tablename__ = "event_translations"
    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    event_id = Column(String, ForeignKey("events.id"))
    language = Column(String, nullable=False) # EN, FR, AR
    title = Column(String, nullable=False)
    slug = Column(String, nullable=True)
    excerpt = Column(Text, nullable=True)
    content = Column(Text, nullable=True)
    
    seo_title = Column(String, nullable=True)
    seo_description = Column(String, nullable=True)
    focus_keyword = Column(String, nullable=True)
    canonical_url = Column(String, nullable=True)
    og_title = Column(String, nullable=True)
    og_description = Column(String, nullable=True)
    og_image_id = Column(String, ForeignKey("media.id"), nullable=True)
    allow_index = Column(Boolean, default=True)
    allow_follow = Column(Boolean, default=True)

    event = relationship("Event", back_populates="translations")
