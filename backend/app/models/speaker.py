from sqlalchemy import Column, String, Text, ForeignKey, Table
from sqlalchemy.orm import relationship
from app.core.database import Base
import uuid

event_speaker_association = Table(
    "event_speaker",
    Base.metadata,
    Column("event_id", String, ForeignKey("events.id")),
    Column("speaker_id", String, ForeignKey("speakers.id"))
)

class Speaker(Base):
    __tablename__ = "speakers"
    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    name = Column(String, nullable=False)
    position = Column(String, nullable=True)
    company = Column(String, nullable=True)
    bio = Column(Text, nullable=True)
    linkedin_url = Column(String, nullable=True)
    photo_id = Column(String, ForeignKey("media.id"), nullable=True)

    photo = relationship("Media")
