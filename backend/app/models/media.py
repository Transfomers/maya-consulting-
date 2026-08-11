from sqlalchemy import Column, String, DateTime, ForeignKey
from sqlalchemy.orm import relationship
from app.core.database import Base
from datetime import datetime, timezone
import uuid

class Media(Base):
    __tablename__ = "media"
    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    url = Column(String, nullable=False)
    filename = Column(String, nullable=False)
    mime_type = Column(String, nullable=True)
    alt_text = Column(String, nullable=True)
    caption = Column(String, nullable=True)
    uploaded_by_id = Column(String, ForeignKey("users.id"))
    created_at = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc))

    uploaded_by = relationship("User")
