from sqlalchemy import Column, String, Text, DateTime
from app.core.database import Base
from datetime import datetime, timezone
import uuid

def generate_uuid():
    return str(uuid.uuid4())

class Setting(Base):
    __tablename__ = "settings"

    id = Column(String, primary_key=True, default=generate_uuid, index=True)
    key = Column(String, unique=True, index=True, nullable=False)
    value = Column(Text, nullable=True)
    category = Column(String, index=True, nullable=False, default="general") # general, branding, homepage, seo, social, email, contact
    updated_at = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc), onupdate=lambda: datetime.now(timezone.utc))
