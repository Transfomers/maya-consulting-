from sqlalchemy import Column, String, Text, DateTime
from app.core.database import Base
from datetime import datetime, timezone
import uuid

def generate_uuid():
    return str(uuid.uuid4())

class ActivityLog(Base):
    __tablename__ = "activity_logs"

    id = Column(String, primary_key=True, default=generate_uuid, index=True)
    user_id = Column(String, index=True, nullable=False)
    user_email = Column(String, nullable=False)
    action = Column(String, index=True, nullable=False)
    entity_type = Column(String, index=True, nullable=False) # e.g., 'Article', 'Setting'
    entity_id = Column(String, index=True, nullable=True)
    details = Column(Text, nullable=True) # JSON payload or description
    created_at = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc), index=True)
