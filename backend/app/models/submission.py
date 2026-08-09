from sqlalchemy import Column, String, DateTime, JSON
from app.core.database import Base
from datetime import datetime, timezone
import uuid

class Submission(Base):
    __tablename__ = "submissions"
    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    type = Column(String, index=True, nullable=False)
    payload = Column(JSON, nullable=False)
    created_at = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc))
