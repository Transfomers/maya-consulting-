from pydantic import BaseModel, EmailStr
from typing import Optional, List, Dict, Any
from datetime import datetime

# --- Public Subscription Schemas ---
class SubscribeRequest(BaseModel):
    email: str
    first_name: Optional[str] = None
    consent: bool = True
    source: Optional[str] = "website"
    language: Optional[str] = "fr"

class SubscribeResponse(BaseModel):
    success: bool
    message: str
    status: str

# --- Admin Subscriber Schemas ---
class SubscriberCreate(BaseModel):
    email: str
    first_name: Optional[str] = None
    status: Optional[str] = "active"  # active, pending
    source: Optional[str] = "admin_import"
    consent_given: bool = True

class SubscriberUpdate(BaseModel):
    first_name: Optional[str] = None
    status: Optional[str] = None
    source: Optional[str] = None

class SubscriberResponse(BaseModel):
    id: str
    email: str
    first_name: Optional[str] = None
    status: str
    source: str
    consent_given: bool
    consent_timestamp: Optional[datetime] = None
    confirmed_at: Optional[datetime] = None
    unsubscribed_at: Optional[datetime] = None
    created_at: datetime
    updated_at: Optional[datetime] = None

    class Config:
        from_attributes = True

class SubscriberListResponse(BaseModel):
    items: List[SubscriberResponse]
    total: int
    page: int
    limit: int

# --- Template Schemas ---
class TemplateBase(BaseModel):
    name: str
    subject_default: str = "Un nouvel article de 3M SERVICES"
    preview_text_default: str = "Découvrez nos dernières réflexions, initiatives et opportunités."
    heading: str = "Découvrez notre nouvel article"
    brand_color: str = "#0D0E0D"
    accent_color: str = "#B84A39"
    header_content: Optional[str] = None
    footer_content: Optional[str] = None
    is_default: bool = False

class TemplateCreate(TemplateBase):
    pass

class TemplateUpdate(BaseModel):
    name: Optional[str] = None
    subject_default: Optional[str] = None
    preview_text_default: Optional[str] = None
    heading: Optional[str] = None
    brand_color: Optional[str] = None
    accent_color: Optional[str] = None
    header_content: Optional[str] = None
    footer_content: Optional[str] = None
    is_default: Optional[bool] = None

class TemplateResponse(TemplateBase):
    id: str
    created_at: datetime
    updated_at: Optional[datetime] = None

    class Config:
        from_attributes = True

# --- Campaign Schemas ---
class CampaignBase(BaseModel):
    title: str
    subject: str
    preview_text: Optional[str] = None
    article_id: Optional[str] = None
    template_id: Optional[str] = None
    recipient_segment: str = "all_active"

class CampaignCreate(CampaignBase):
    send_now: Optional[bool] = False

class CampaignUpdate(BaseModel):
    title: Optional[str] = None
    subject: Optional[str] = None
    preview_text: Optional[str] = None
    article_id: Optional[str] = None
    template_id: Optional[str] = None
    recipient_segment: Optional[str] = None
    status: Optional[str] = None

class CampaignResponse(CampaignBase):
    id: str
    status: str
    scheduled_at: Optional[datetime] = None
    started_at: Optional[datetime] = None
    completed_at: Optional[datetime] = None
    recipient_count: int = 0
    sent_count: int = 0
    failed_count: int = 0
    created_at: datetime
    updated_at: Optional[datetime] = None

    class Config:
        from_attributes = True

# --- Delivery Schemas ---
class DeliveryResponse(BaseModel):
    id: str
    campaign_id: str
    subscriber_id: Optional[str] = None
    email: str
    status: str
    error_message: Optional[str] = None
    sent_at: Optional[datetime] = None
    created_at: datetime

    class Config:
        from_attributes = True

# --- Settings & Stats ---
class NewsletterSettingsSchema(BaseModel):
    auto_send_on_publish: bool = True
    from_name: str = "3M SERVICES"
    from_email: str = "contact@3mservice.shop"
    reply_to: str = "contact@3mservice.shop"
    smtp_host: Optional[str] = "smtp.hostinger.com"
    smtp_port: Optional[int] = 465
    smtp_user: Optional[str] = "contact@3mservice.shop"
    smtp_pass: Optional[str] = ""
    smtp_secure: Optional[bool] = True
    teams_webhook_url: Optional[str] = None

class TestEmailRequest(BaseModel):
    email: str
    campaign_id: Optional[str] = None
    article_id: Optional[str] = None

class NewsletterStatsResponse(BaseModel):
    total_subscribers: int
    active_subscribers: int
    pending_subscribers: int
    unsubscribed_subscribers: int
    bounced_subscribers: int
    campaigns_sent: int
    total_deliveries: int
    delivery_failures: int
    recent_campaigns: List[CampaignResponse]
