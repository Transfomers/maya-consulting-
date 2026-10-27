from sqlalchemy import Column, String, DateTime, Text, ForeignKey, Boolean, Integer
from sqlalchemy.orm import relationship
from app.core.database import Base
from datetime import datetime, timezone
import uuid

class NewsletterSubscriber(Base):
    __tablename__ = "newsletter_subscribers"

    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    email = Column(String, unique=True, index=True, nullable=False)
    first_name = Column(String, nullable=True)
    status = Column(String, default="pending", index=True, nullable=False)  # pending, active, unsubscribed, bounced, suppressed
    source = Column(String, default="website", nullable=False)  # homepage, blog_landing, blog_post, footer, admin_import, etc.
    confirmation_token = Column(String, unique=True, nullable=True, index=True)
    confirmation_token_expires_at = Column(DateTime(timezone=True), nullable=True)
    unsubscribe_token = Column(String, unique=True, nullable=True, index=True)
    consent_given = Column(Boolean, default=True, nullable=False)
    consent_timestamp = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc), nullable=False)
    confirmed_at = Column(DateTime(timezone=True), nullable=True)
    unsubscribed_at = Column(DateTime(timezone=True), nullable=True)
    created_at = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc))
    updated_at = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc), onupdate=lambda: datetime.now(timezone.utc))

    deliveries = relationship("NewsletterDelivery", back_populates="subscriber", cascade="all, delete-orphan")


class NewsletterTemplate(Base):
    __tablename__ = "newsletter_templates"

    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    name = Column(String, nullable=False)
    subject_default = Column(String, default="Un nouvel article de 3M SERVICES", nullable=False)
    preview_text_default = Column(String, default="Découvrez nos dernières réflexions, initiatives et opportunités.", nullable=False)
    heading = Column(String, default="Découvrez notre nouvel article", nullable=False)
    brand_color = Column(String, default="#0D0E0D", nullable=False)
    accent_color = Column(String, default="#B84A39", nullable=False)
    header_content = Column(Text, nullable=True)
    footer_content = Column(Text, nullable=True)
    is_default = Column(Boolean, default=True, nullable=False)
    created_at = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc))
    updated_at = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc), onupdate=lambda: datetime.now(timezone.utc))

    campaigns = relationship("NewsletterCampaign", back_populates="template")


class NewsletterCampaign(Base):
    __tablename__ = "newsletter_campaigns"

    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    title = Column(String, nullable=False)
    subject = Column(String, nullable=False)
    preview_text = Column(String, nullable=True)
    article_id = Column(String, ForeignKey("posts.id", ondelete="SET NULL"), nullable=True)
    template_id = Column(String, ForeignKey("newsletter_templates.id", ondelete="SET NULL"), nullable=True)
    recipient_segment = Column(String, default="all_active", nullable=False)  # all_active, pending, all
    status = Column(String, default="draft", nullable=False)  # draft, scheduled, processing, sent, partially_failed, failed, cancelled
    scheduled_at = Column(DateTime(timezone=True), nullable=True)
    started_at = Column(DateTime(timezone=True), nullable=True)
    completed_at = Column(DateTime(timezone=True), nullable=True)
    recipient_count = Column(Integer, default=0, nullable=False)
    sent_count = Column(Integer, default=0, nullable=False)
    failed_count = Column(Integer, default=0, nullable=False)
    created_by_id = Column(String, ForeignKey("users.id", ondelete="SET NULL"), nullable=True)
    created_at = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc))
    updated_at = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc), onupdate=lambda: datetime.now(timezone.utc))

    article = relationship("Post")
    template = relationship("NewsletterTemplate", back_populates="campaigns")
    deliveries = relationship("NewsletterDelivery", back_populates="campaign", cascade="all, delete-orphan")


class NewsletterDelivery(Base):
    __tablename__ = "newsletter_deliveries"

    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    campaign_id = Column(String, ForeignKey("newsletter_campaigns.id", ondelete="CASCADE"), nullable=False, index=True)
    subscriber_id = Column(String, ForeignKey("newsletter_subscribers.id", ondelete="SET NULL"), nullable=True, index=True)
    email = Column(String, nullable=False)
    status = Column(String, default="queued", nullable=False)  # queued, sent, failed, bounced
    error_message = Column(Text, nullable=True)
    sent_at = Column(DateTime(timezone=True), nullable=True)
    created_at = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc))

    campaign = relationship("NewsletterCampaign", back_populates="deliveries")
    subscriber = relationship("NewsletterSubscriber", back_populates="deliveries")
