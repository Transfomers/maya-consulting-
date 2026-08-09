from sqlalchemy import Column, String, DateTime
from app.core.database import Base
from datetime import datetime, timezone
import uuid

class User(Base):
    __tablename__ = "users"

    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    email = Column(String, unique=True, index=True, nullable=False)
    password_hash = Column(String, nullable=False)
    name = Column(String, default="Admin")
    role = Column(String, default="admin")
    created_at = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc))
