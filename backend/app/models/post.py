from sqlalchemy import Column, String, DateTime, Text, ForeignKey, Table, Boolean, Integer, JSON
from sqlalchemy.orm import relationship
from app.core.database import Base
from datetime import datetime, timezone
import uuid

post_tag_association = Table(
    "post_tag",
    Base.metadata,
    Column("post_id", String, ForeignKey("posts.id")),
    Column("tag_id", String, ForeignKey("tags.id"))
)

class Category(Base):
    __tablename__ = "categories"
    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    name = Column(String, unique=True, nullable=False)
    slug = Column(String, unique=True, nullable=False)
    description = Column(Text, nullable=True)
    display_order = Column(Integer, default=0)
    is_archived = Column(Boolean, default=False)

class Tag(Base):
    __tablename__ = "tags"
    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    name = Column(String, unique=True, nullable=False)
    slug = Column(String, unique=True, nullable=False)

class Post(Base):
    __tablename__ = "posts"
    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    slug = Column(String, unique=True, nullable=False)
    status = Column(String, default="draft") # draft, review, scheduled, published, archived
    author_id = Column(String, ForeignKey("users.id"))
    category_id = Column(String, ForeignKey("categories.id"), nullable=True)
    featured_image_id = Column(String, ForeignKey("media.id"), nullable=True)
    created_at = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc))
    updated_at = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc), onupdate=lambda: datetime.now(timezone.utc))
    published_at = Column(DateTime(timezone=True), nullable=True)
    
    author = relationship("User")
    category = relationship("Category")
    tags = relationship("Tag", secondary=post_tag_association)
    translations = relationship("PostTranslation", back_populates="post", cascade="all, delete-orphan")
    references = relationship("Reference", back_populates="post", cascade="all, delete-orphan")
    featured_image = relationship("Media")

class PostTranslation(Base):
    __tablename__ = "post_translations"
    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    post_id = Column(String, ForeignKey("posts.id"))
    language = Column(String, nullable=False) # EN, FR, AR
    title = Column(String, nullable=False)
    slug = Column(String, nullable=True)
    excerpt = Column(Text, nullable=True)
    content = Column(Text, nullable=True) # HTML or JSON (Tiptap)
    
    # SEO Fields
    seo_title = Column(String, nullable=True)
    seo_description = Column(String, nullable=True)
    focus_keyword = Column(String, nullable=True)
    canonical_url = Column(String, nullable=True)
    og_title = Column(String, nullable=True)
    og_description = Column(String, nullable=True)
    og_image_id = Column(String, ForeignKey("media.id"), nullable=True)
    allow_index = Column(Boolean, default=True)
    allow_follow = Column(Boolean, default=True)

    post = relationship("Post", back_populates="translations")

class Reference(Base):
    __tablename__ = "references"
    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    post_id = Column(String, ForeignKey("posts.id"))
    title = Column(String, nullable=False)
    publisher = Column(String, nullable=True)
    author = Column(String, nullable=True)
    url = Column(String, nullable=True)
    publication_date = Column(String, nullable=True)
    description = Column(Text, nullable=True)

    post = relationship("Post", back_populates="references")
