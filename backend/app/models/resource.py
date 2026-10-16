from sqlalchemy import Column, String, DateTime, Text, ForeignKey, Boolean, Integer
from sqlalchemy.orm import relationship
from app.core.database import Base
from datetime import datetime, timezone
import uuid

class Resource(Base):
    __tablename__ = "resources"
    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    title = Column(String, nullable=False)
    slug = Column(String, nullable=False, index=True)
    description = Column(Text, nullable=True)
    category_id = Column(String, ForeignKey("categories.id"), nullable=True)
    resource_type = Column(String, default="document", nullable=False) # course, guide, toolkit, report, template, video, external
    file_url = Column(String, nullable=True)
    external_url = Column(String, nullable=True)
    file_size = Column(String, nullable=True)
    mime_type = Column(String, nullable=True)
    author = Column(String, nullable=True)
    tags = Column(String, nullable=True) # Comma-separated tags
    is_published = Column(Boolean, default=True)
    is_featured = Column(Boolean, default=False)
    downloads_count = Column(Integer, default=0)
    language = Column(String, default="fr")
    skill_level = Column(String, nullable=True) # Débutant, Intermédiaire, Avancé
    duration = Column(String, nullable=True)
    target_audience = Column(String, nullable=True)
    learning_objectives = Column(Text, nullable=True)
    prerequisites = Column(String, nullable=True)
    created_at = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc))
    updated_at = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc), onupdate=lambda: datetime.now(timezone.utc))

    category = relationship("Category")
