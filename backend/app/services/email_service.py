import smtplib
import ssl
from email.mime.multipart import MIMEMultipart
from email.mime.text import MIMEText
from email.utils import formataddr, formatdate, make_msgid
import asyncio
import logging
import httpx
from typing import Optional, Dict, Any, Tuple
import os

logger = logging.getLogger("email_service")

# Default Hostinger configuration
DEFAULT_SMTP_HOST = os.environ.get("SMTP_HOST", "smtp.hostinger.com")
DEFAULT_SMTP_PORT = int(os.environ.get("SMTP_PORT", "465"))
DEFAULT_SMTP_USER = os.environ.get("SMTP_USER", "contact@3mservice.shop")
DEFAULT_SMTP_PASS = os.environ.get("SMTP_PASS", "")
DEFAULT_SMTP_SECURE = os.environ.get("SMTP_SECURE", "true").lower() in ("true", "1", "yes")
DEFAULT_FROM_NAME = os.environ.get("NEWSLETTER_FROM_NAME", "3M SERVICES")
DEFAULT_FROM_EMAIL = os.environ.get("NEWSLETTER_FROM_EMAIL", "contact@3mservice.shop")
DEFAULT_REPLY_TO = os.environ.get("NEWSLETTER_REPLY_TO", "contact@3mservice.shop")


def get_smtp_config_from_db(settings_map: Dict[str, str]) -> Dict[str, Any]:
    host = settings_map.get("smtp_host") or DEFAULT_SMTP_HOST
    port_str = settings_map.get("smtp_port")
    port = int(port_str) if port_str and port_str.isdigit() else DEFAULT_SMTP_PORT
    user = settings_map.get("smtp_username") or settings_map.get("smtp_user") or DEFAULT_SMTP_USER
    password = settings_map.get("smtp_password") or settings_map.get("smtp_pass") or DEFAULT_SMTP_PASS
    secure_val = settings_map.get("smtp_secure", "true")
    secure = str(secure_val).lower() in ("true", "1", "yes") if secure_val is not None else DEFAULT_SMTP_SECURE

    from_name = settings_map.get("newsletter_from_name") or DEFAULT_FROM_NAME
    from_email = settings_map.get("newsletter_from_email") or DEFAULT_FROM_EMAIL
    reply_to = settings_map.get("newsletter_reply_to") or DEFAULT_REPLY_TO

    return {
        "host": host,
        "port": port,
        "user": user,
        "password": password,
        "secure": secure,
        "from_name": from_name,
        "from_email": from_email,
        "reply_to": reply_to,
    }


def send_smtp_sync(
    recipient: str,
    subject: str,
    html_content: str,
    text_content: str,
    config: Dict[str, Any],
    unsubscribe_url: Optional[str] = None
) -> Tuple[bool, Optional[str]]:
    """Synchronous SMTP email dispatcher using standard Python smtplib."""
    host = config.get("host") or DEFAULT_SMTP_HOST
    port = config.get("port") or DEFAULT_SMTP_PORT
    user = config.get("user") or DEFAULT_SMTP_USER
    password = config.get("password") or DEFAULT_SMTP_PASS
    secure = config.get("secure", True)
    from_name = config.get("from_name") or DEFAULT_FROM_NAME
    from_email = config.get("from_email") or DEFAULT_FROM_EMAIL
    reply_to = config.get("reply_to") or DEFAULT_REPLY_TO

    msg = MIMEMultipart("alternative")
    msg["Subject"] = subject
    msg["From"] = formataddr((from_name, from_email))
    msg["To"] = recipient
    msg["Reply-To"] = reply_to
    msg["Date"] = formatdate(localtime=True)
    msg["Message-ID"] = make_msgid(domain="3mservice.shop")

    if unsubscribe_url:
        msg["List-Unsubscribe"] = f"<{unsubscribe_url}>"
        msg["List-Unsubscribe-Post"] = "List-Unsubscribe=One-Click"

    # Attach plain text and HTML
    msg.attach(MIMEText(text_content, "plain", "utf-8"))
    msg.attach(MIMEText(html_content, "html", "utf-8"))

    if not password:
        logger.warning(f"SMTP password is not configured. Email to {recipient} simulated.")
        return True, "Simulated: SMTP password not configured"

    try:
        if port == 465 or secure:
            context = ssl.create_default_context()
            with smtplib.SMTP_SSL(host, port, context=context, timeout=20) as server:
                server.login(user, password)
                server.sendmail(from_email, [recipient], msg.as_string())
        else:
            with smtplib.SMTP(host, port, timeout=20) as server:
                server.ehlo()
                try:
                    context = ssl.create_default_context()
                    server.starttls(context=context)
                    server.ehlo()
                except Exception as tls_err:
                    logger.debug(f"STARTTLS optional/not supported: {tls_err}")
                server.login(user, password)
                server.sendmail(from_email, [recipient], msg.as_string())

        return True, None
    except Exception as e:
        err_msg = str(e)
        logger.error(f"SMTP sending failure to {recipient}: {err_msg}")
        return False, err_msg


async def send_email(
    recipient: str,
    subject: str,
    html_content: str,
    text_content: str,
    config: Dict[str, Any],
    unsubscribe_url: Optional[str] = None
) -> Tuple[bool, Optional[str]]:
    """Asynchronous non-blocking wrapper around send_smtp_sync."""
    return await asyncio.to_thread(
        send_smtp_sync,
        recipient,
        subject,
        html_content,
        text_content,
        config,
        unsubscribe_url
    )


# --- HTML Email Template Generators (Inline CSS & Table-based for 100% email client support) ---

def render_base_email(body_html: str, unsubscribe_url: Optional[str] = None, preview_text: Optional[str] = None) -> str:
    logo_url = "https://www.3mservice.shop/assets/logo-mark.png"
    unsub_link = unsubscribe_url or "https://www.3mservice.shop/unsubscribe"
    preview = preview_text or "3M SERVICES - Bâtir des économies numériques inclusives et durables."

    return f"""<!DOCTYPE html>
<html lang="fr" xmlns="http://www.w3.org/1999/xhtml">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <meta http-equiv="X-UA-Compatible" content="IE=edge">
  <title>3M SERVICES</title>
  <style type="text/css">
    body, table, td, a {{ -webkit-text-size-adjust: 100%; -ms-text-size-adjust: 100%; }}
    table, td {{ mso-table-lspace: 0pt; mso-table-rspace: 0pt; }}
    img {{ -ms-interpolation-mode: bicubic; border: 0; outline: none; text-decoration: none; }}
    body {{ margin: 0; padding: 0; width: 100% !important; background-color: #F8F7F4; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; }}
    @media screen and (max-width: 600px) {{
      .email-container {{ width: 100% !important; margin: auto !important; }}
      .fluid-img {{ width: 100% !important; max-width: 100% !important; height: auto !important; }}
      .stack-column {{ display: block !important; width: 100% !important; }}
      .mobile-padding {{ padding: 24px 18px !important; }}
    }}
  </style>
</head>
<body style="margin: 0; padding: 0; background-color: #F8F7F4;">

  <!-- Preheader text hidden in inbox preview -->
  <div style="display: none; font-size: 1px; color: #F8F7F4; line-height: 1px; max-height: 0px; max-width: 0px; opacity: 0; overflow: hidden;">
    {preview}
  </div>

  <!-- Main Container Wrapper -->
  <table border="0" cellpadding="0" cellspacing="0" width="100%" style="background-color: #F8F7F4;">
    <tr>
      <td align="center" style="padding: 24px 12px 40px 12px;">
        
        <!-- Email Box -->
        <table border="0" cellpadding="0" cellspacing="0" width="600" class="email-container" style="max-width: 600px; background-color: #FFFFFF; border: 1px solid #E5E3DC; box-shadow: 0 4px 14px rgba(0,0,0,0.03);">
          
          <!-- Top Header Brand Bar -->
          <tr>
            <td align="center" style="padding: 32px 30px 24px 30px; border-bottom: 2px solid #0D0E0D;">
              <table border="0" cellpadding="0" cellspacing="0" width="100%">
                <tr>
                  <td align="left" valign="middle">
                    <a href="https://www.3mservice.shop" target="_blank" style="text-decoration: none;">
                      <img src="{logo_url}" alt="3M SERVICES" width="150" style="display: block; width: 150px; max-width: 150px; height: auto; border: 0;" />
                    </a>
                  </td>
                  <td align="right" valign="middle" style="font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; font-size: 10px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.18em; color: #B84A39;">
                    ÉDITION ÉCOSYSTÈME
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Dynamic Body Content -->
          <tr>
            <td class="mobile-padding" style="padding: 36px 36px 28px 36px;">
              {body_html}
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td align="center" style="padding: 28px 30px; background-color: #FAF9F6; border-top: 1px solid #EAE8E1; font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif;">
              <table border="0" cellpadding="0" cellspacing="0" width="100%">
                <tr>
                  <td align="center" style="font-size: 11px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.2em; color: #0D0E0D; padding-bottom: 8px;">
                    3M SERVICES
                  </td>
                </tr>
                <tr>
                  <td align="center" style="font-size: 11px; line-height: 18px; color: #737373; padding-bottom: 14px;">
                    Bâtir des économies numériques inclusives, accessibles et durables.<br />
                    Montréal • Québec • Canada & Passerelles Internationales • <a href="mailto:contact@3mservice.shop" style="color: #737373; text-decoration: none;">contact@3mservice.shop</a>
                  </td>
                </tr>
                <tr>
                  <td align="center" style="font-size: 11px; line-height: 18px; color: #8C8C8C;">
                    <a href="https://www.3mservice.shop/privacy" target="_blank" style="color: #737373; text-decoration: underline;">Politique de confidentialité</a>
                    &nbsp;•&nbsp;
                    <a href="https://www.3mservice.shop/contact" target="_blank" style="color: #737373; text-decoration: underline;">Nous contacter</a>
                    &nbsp;•&nbsp;
                    <a href="{unsub_link}" target="_blank" style="color: #B84A39; text-decoration: underline; font-weight: 600;">Se désabonner</a>
                  </td>
                </tr>
                <tr>
                  <td align="center" style="font-size: 10px; color: #A3A3A3; padding-top: 12px;">
                    Vous recevez cet envoi car vous êtes abonné aux communications de 3M Services.
                  </td>
                </tr>
              </table>
            </td>
          </tr>

        </table>

      </td>
    </tr>
  </table>

</body>
</html>"""


def render_confirmation_email(
    subscriber_email: str,
    first_name: Optional[str],
    confirmation_token: str,
    frontend_url: str = "https://www.3mservice.shop",
    lang: str = "fr"
) -> Tuple[str, str, str]:
    """Generates the Double Opt-In confirmation email."""
    confirm_url = f"{frontend_url.rstrip('/')}/confirm-subscription?token={confirmation_token}"
    greeting = f"Bonjour {first_name}," if first_name else "Bonjour,"

    subject = "Confirmez votre inscription à l'infolettre 3M SERVICES"
    preview = "Veuillez confirmer votre adresse courriel pour recevoir nos publications."

    body = f"""
      <table border="0" cellpadding="0" cellspacing="0" width="100%">
        <tr>
          <td style="font-size: 10px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.25em; color: #B84A39; padding-bottom: 10px;">
            CONFIRMATION REQUISE
          </td>
        </tr>
        <tr>
          <td style="font-family: Georgia, 'Times New Roman', serif; font-size: 26px; line-height: 34px; font-weight: normal; color: #0D0E0D; padding-bottom: 18px;">
            Bienvenue dans l'écosystème de 3M SERVICES
          </td>
        </tr>
        <tr>
          <td style="font-size: 14px; line-height: 24px; color: #4A4A4A; padding-bottom: 22px;">
            <p style="margin: 0 0 14px 0;">{greeting}</p>
            <p style="margin: 0 0 14px 0;">
              Nous avons bien reçu votre demande d'inscription à l'infolettre de <strong>3M SERVICES</strong>. Pour finaliser votre adhésion et recevoir nos prochains articles, guides méthodologiques et opportunités de programmes, merci de confirmer votre adresse en cliquant sur le bouton ci-dessous :
            </p>
          </td>
        </tr>
        <tr>
          <td align="center" style="padding: 10px 0 28px 0;">
            <table border="0" cellpadding="0" cellspacing="0">
              <tr>
                <td align="center" style="background-color: #232724; border: 1px solid #0D0E0D;">
                  <a href="{confirm_url}" target="_blank" style="display: inline-block; padding: 14px 32px; font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; font-size: 11px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.22em; color: #FFFFFF; text-decoration: none;">
                    CONFIRMER MON INSCRIPTION &rarr;
                  </a>
                </td>
              </tr>
            </table>
          </td>
        </tr>
        <tr>
          <td style="font-size: 12px; line-height: 20px; color: #8A8A8A; border-top: 1px solid #EEEEEE; padding-top: 18px;">
            Si vous n'êtes pas à l'origine de cette démarche, vous pouvez simplement ignorer ce courriel. Votre adresse ne sera pas activée sans confirmation.
          </td>
        </tr>
      </table>
    """

    plain_text = f"""{greeting}

Bienvenue dans l'écosystème de 3M SERVICES.

Veuillez confirmer votre inscription à notre infolettre en cliquant sur le lien suivant :
{confirm_url}

Si vous n'êtes pas à l'origine de cette demande, vous pouvez ignorer ce message.

3M SERVICES - Bâtir des économies numériques inclusives, accessibles et durables.
https://www.3mservice.shop
"""

    return subject, render_base_email(body, preview_text=preview), plain_text


def render_article_notification_email(
    post: Any,
    subscriber_email: Optional[str] = None,
    first_name: Optional[str] = None,
    template: Optional[Any] = None,
    frontend_url: str = "https://www.3mservice.shop",
    unsubscribe_token: Optional[str] = None,
    unsubscribe_url: Optional[str] = None,
    preview_text: Optional[str] = None
) -> Tuple[str, str, str]:
    """Generates the new blog article broadcast email."""
    post_url = f"{frontend_url.rstrip('/')}/blog/{post.slug}"
    unsub_url = unsubscribe_url or (f"{frontend_url.rstrip('/')}/unsubscribe?token={unsubscribe_token}" if unsubscribe_token else f"{frontend_url.rstrip('/')}/unsubscribe")

    # Resolve translations safely in async environments
    trans = []
    try:
        from sqlalchemy import inspect as sqla_inspect
        insp = sqla_inspect(post)
        if "translations" in insp.dict:
            trans = post.translations
        elif "translations" not in insp.unloaded:
            trans = getattr(post, "translations", [])
    except Exception:
        trans = []

    trans_fr = next((t for t in trans if getattr(t, "language", "") == "fr"), None)
    trans_en = next((t for t in trans if getattr(t, "language", "") == "en"), None)
    main_trans = trans_fr or (trans[0] if trans else None)

    title = getattr(main_trans, "title", None) or getattr(post, "slug", "Article")
    excerpt = getattr(main_trans, "excerpt", "") or "Découvrez notre dernière publication sur les économies numériques inclusives et durables."
    
    category_name = "Communauté"
    try:
        if getattr(post, "category", None) and hasattr(post.category, "name"):
            category_name = post.category.name
    except Exception:
        pass
    
    # Image
    image_url = None
    try:
        if getattr(post, "featured_image", None) and hasattr(post.featured_image, "url"):
            image_url = post.featured_image.url
    except Exception:
        pass
    if not image_url:
        image_url = "https://images.unsplash.com/photo-1618221195710-dd6b41faaea6?auto=format&fit=crop&w=1200&q=80"

    subject = f"Nouvel article : {title} | 3M SERVICES"
    preview = f"{title} - {excerpt[:120]}..."

    heading_text = template.heading if template and template.heading else "Découvrez notre nouvel article"

    image_block = ""
    if image_url:
        image_block = f"""
          <tr>
            <td style="padding-bottom: 22px;">
              <a href="{post_url}" target="_blank">
                <img src="{image_url}" alt="{title}" class="fluid-img" width="528" style="display: block; width: 100%; max-width: 528px; height: auto; border: 1px solid #EAE8E1;" />
              </a>
            </td>
          </tr>
        """

    body = f"""
      <table border="0" cellpadding="0" cellspacing="0" width="100%">
        <tr>
          <td style="font-size: 10px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.25em; color: #B84A39; padding-bottom: 8px;">
            {category_name.upper()} • NOUVEL ARTICLE
          </td>
        </tr>
        <tr>
          <td style="font-family: Georgia, 'Times New Roman', serif; font-size: 26px; sm:font-size: 30px; line-height: 36px; font-weight: normal; color: #0D0E0D; padding-bottom: 18px;">
            <a href="{post_url}" target="_blank" style="color: #0D0E0D; text-decoration: none;">
              {title}
            </a>
          </td>
        </tr>
        {image_block}
        <tr>
          <td style="font-size: 14px; line-height: 24px; color: #444444; padding-bottom: 24px;">
            <p style="margin: 0; font-family: Georgia, serif; font-style: italic; color: #555555; font-size: 15px; line-height: 24px;">
              « {excerpt} »
            </p>
          </td>
        </tr>
        <tr>
          <td align="left" style="padding-bottom: 28px;">
            <table border="0" cellpadding="0" cellspacing="0">
              <tr>
                <td align="center" style="background-color: #232724;">
                  <a href="{post_url}" target="_blank" style="display: inline-block; padding: 13px 28px; font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; font-size: 11px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.2em; color: #FFFFFF; text-decoration: none;">
                    LIRE L'ARTICLE COMPLET &rarr;
                  </a>
                </td>
              </tr>
            </table>
          </td>
        </tr>
        <tr>
          <td style="font-size: 12px; line-height: 20px; color: #777777; border-top: 1px solid #EAE8E1; padding-top: 18px;">
            Partagez cet article avec vos collègues, partenaires et membres de votre communauté engagés dans l'entrepreneuriat à impact social.
          </td>
        </tr>
      </table>
    """

    plain_text = f"""NOUVEL ARTICLE SUR 3M SERVICES

{title}
Catégorie: {category_name}

{excerpt}

Lire l'article complet:
{post_url}

Pour vous désabonner:
{unsub_url}

3M SERVICES
https://www.3mservice.shop
"""

    return subject, render_base_email(body, unsubscribe_url=unsub_url, preview_text=preview), plain_text


async def post_to_teams(webhook_url: str, title: str, text: str, action_url: Optional[str] = None):
    """Optional Microsoft Teams notification via webhook."""
    if not webhook_url:
        return

    payload = {
        "@type": "MessageCard",
        "@context": "http://schema.org/extensions",
        "themeColor": "B84A39",
        "summary": title,
        "sections": [{
            "activityTitle": f"📢 {title}",
            "activitySubtitle": "3M SERVICES • Publication & Diffusion",
            "text": text,
            "markdown": True
        }]
    }

    if action_url:
        payload["potentialAction"] = [{
            "@type": "OpenUri",
            "name": "Consulter en ligne",
            "targets": [{"os": "default", "uri": action_url}]
        }]

    try:
        async with httpx.AsyncClient(timeout=10) as client:
            await client.post(webhook_url, json=payload)
    except Exception as e:
        logger.warning(f"Teams webhook failed: {e}")
