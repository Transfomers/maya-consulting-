import asyncio
from datetime import datetime, timezone, timedelta
from sqlalchemy import select
from app.core.database import AsyncSessionLocal
from app.models.user import User
from app.models.post import Category
from app.models.media import Media
from app.models.event import Event, EventTranslation

INITIAL_MEDIA = [
    {
        "filename": "cap_ecosystem_collaboration.webp",
        "url": "/assets/images/cap_ecosystem_collaboration.webp",
        "mime_type": "image/webp",
        "alt_text": "Écosystème collaboratif et espace de travail partagé 3M SERVICES",
        "caption": "Membres de l'écosystème en session de co-création à Montréal."
    },
    {
        "filename": "youth_tech_bootcamp.webp",
        "url": "/assets/images/youth_tech_bootcamp.webp",
        "mime_type": "image/webp",
        "alt_text": "Atelier de compétences numériques et codage pour les jeunes",
        "caption": "Bootcamp intensif en technologies inclusives et développement numérique."
    },
    {
        "filename": "agriconnect_farming.webp",
        "url": "/assets/images/agriconnect_farming.webp",
        "mime_type": "image/webp",
        "alt_text": "Innovation agricole durable et serres connectées AgriConnect",
        "caption": "Entrepreneuriat rural et technologies agricoles de proximité."
    },
    {
        "filename": "safe_vibe_media.webp",
        "url": "/assets/images/safe_vibe_media.webp",
        "mime_type": "image/webp",
        "alt_text": "Studio de création média et podcasting Safe Vibe",
        "caption": "Éducation aux médias, citoyenneté numérique et production de contenu."
    },
    {
        "filename": "cap_green_lab.webp",
        "url": "/assets/images/cap_green_lab.webp",
        "mime_type": "image/webp",
        "alt_text": "Atelier de réemploi et reconditionnement Cap Green Lab",
        "caption": "Économie circulaire technologique et formation matérielle."
    },
    {
        "filename": "women_social_innovators.webp",
        "url": "/assets/images/women_social_innovators.webp",
        "mime_type": "image/webp",
        "alt_text": "Atelier d'innovation sociale et création éthique pour femmes entrepreneures",
        "caption": "Accompagnement de projets artisanaux et modèles d'affaires durables."
    },
    {
        "filename": "diaspora_global_summit.webp",
        "url": "/assets/images/diaspora_global_summit.webp",
        "mime_type": "image/webp",
        "alt_text": "Sommet international de partenariats commerciaux et d'innovation Canada-Afrique",
        "caption": "Délégation officielle et panel de haut niveau Global Festival."
    }
]

INITIAL_EVENTS = [
    {
        "slug": "evenement-partenariat-mupocam-orange-cameroun",
        "status": "published",
        "start_date": datetime(2026, 1, 15, 9, 0, tzinfo=timezone.utc),
        "end_date": datetime(2027, 12, 31, 18, 0, tzinfo=timezone.utc),
        "location": "Agence 3M SERVICES • Nouvelle route - Omnisports, Yaoundé",
        "is_online": False,
        "registration_required": True,
        "registration_url": "/vente-voiture-leasing-cameroun",
        "max_participants": 1000,
        "fr": {
            "title": "Événement Partenariat MUPOCAM (Orange Cameroun) : Vente de Voitures & Leasing",
            "excerpt": "Convention officielle entre 3M SERVICES et la Mutuelle du Personnel d'Orange Cameroun pour faciliter l'acquisition de véhicules.",
            "content": "<p>Découvrez notre partenariat exclusif avec la MUPOCAM offrant aux adhérents d'Orange Cameroun des conditions préférentielles pour l'achat au comptant ou en leasing de véhicules neufs (0 km) et occasions certifiées.</p>"
        },
        "en": {
            "title": "MUPOCAM Partnership Event (Orange Cameroon): Vehicle Sales & Leasing",
            "excerpt": "Official agreement between 3M SERVICES and Orange Cameroon Staff Mutual for privileged vehicle acquisition.",
            "content": "<p>Discover our exclusive partnership with MUPOCAM offering members preferential conditions for the purchase or leasing of new (0 km) and certified pre-owned vehicles.</p>"
        }
    },
    {
        "slug": "global-festival-nairobi-2027",
        "status": "published",
        "start_date": datetime(2027, 10, 14, 9, 0, tzinfo=timezone.utc),
        "end_date": datetime(2027, 10, 17, 18, 0, tzinfo=timezone.utc),
        "location": "Nairobi Innovation Hub & KICC, Kenya",
        "is_online": True,
        "registration_required": True,
        "registration_url": "/global-festival",
        "max_participants": 500,
        "fr": {
            "title": "Global Festival Nairobi 2027 : Tech Inclusive & Passerelles Diaspora",
            "excerpt": "Le grand sommet international réunissant innovateurs, entrepreneurs et délégations du Canada et d'Afrique.",
            "content": "<p>Quatre journées de conférences de haut niveau, hackathons d'impact, salon professionnel et rencontres B2B pour accélérer les passerelles technologiques entre le Canada et l'Afrique.</p>"
        },
        "en": {
            "title": "Global Festival Nairobi 2027: Inclusive Tech & Diaspora Bridges",
            "excerpt": "The premier international summit bringing together innovators, entrepreneurs, and delegations from Canada and Africa.",
            "content": "<p>Four days of high-level panels, impact hackathons, trade exhibitions, and B2B matchmaking accelerating tech partnerships between Canada and Africa.</p>"
        }
    },
    {
        "slug": "brunch-pre-festival-paris-2026",
        "status": "published",
        "start_date": datetime(2026, 11, 20, 10, 30, tzinfo=timezone.utc),
        "end_date": datetime(2026, 11, 20, 15, 0, tzinfo=timezone.utc),
        "location": "Paris & Format Hybride International",
        "is_online": True,
        "registration_required": True,
        "registration_url": "mailto:contact@3mservice.shop",
        "max_participants": 120,
        "fr": {
            "title": "Brunch Pré-Festival & Table Ronde Partenaires - Paris 2026",
            "excerpt": "Rencontre stratégique pour co-construire les délégations officielles et les axes de mécénat pour Nairobi 2027.",
            "content": "<p>Session de travail exclusive avec les partenaires fondateurs, investisseurs d'impact et institutions pour définir les engagements conjoints du Global Festival.</p>"
        },
        "en": {
            "title": "Pre-Festival Brunch & Strategic Round Table - Paris 2026",
            "excerpt": "Strategic gathering to co-design official delegations and patronage tracks for Nairobi 2027.",
            "content": "<p>Exclusive working session with founding partners, impact investors, and institutional leaders to align joint initiatives for the Global Festival.</p>"
        }
    },
    {
        "slug": "bootcamp-eco-conception-montreal-2026",
        "status": "published",
        "start_date": datetime(2026, 12, 5, 9, 0, tzinfo=timezone.utc),
        "end_date": datetime(2026, 12, 7, 17, 30, tzinfo=timezone.utc),
        "location": "Lab Cap Green, Montréal (QC), Canada",
        "is_online": False,
        "registration_required": True,
        "registration_url": "/programs#cap-green-lab",
        "max_participants": 35,
        "fr": {
            "title": "Bootcamp Tech Circulaire & Reconditionnement Matériel",
            "excerpt": "3 jours d'ateliers pratiques intensifs de diagnostic, réparation et valorisation de parcs informatiques.",
            "content": "<p>Formation pratique ouverte aux techniciens, personnes en reconversion et bénévoles associatifs pour maîtriser le cycle de vie matériel et réduire la fracture numérique.</p>"
        },
        "en": {
            "title": "Circular Tech Bootcamp & Hardware Refurbishment",
            "excerpt": "3 days of hands-on workshops on computer diagnostics, repair, and circular hardware management.",
            "content": "<p>Hands-on practical training for technicians, career changers, and community volunteers to master hardware lifecycle and bridge the digital divide.</p>"
        }
    },
    {
        "slug": "symposium-agriconnect-ruralite-2027",
        "status": "scheduled",
        "start_date": datetime(2027, 2, 10, 13, 0, tzinfo=timezone.utc),
        "end_date": datetime(2027, 2, 10, 18, 0, tzinfo=timezone.utc),
        "location": "Saint-Hyacinthe (Québec) & Webinaire",
        "is_online": True,
        "registration_required": True,
        "registration_url": "/programs#agriconnect",
        "max_participants": 200,
        "fr": {
            "title": "Symposium AgriConnect : Numérique & Circuits Courts Ruraux",
            "excerpt": "Partage d'expériences sur les solutions logistiques de proximité et l'autonomie des coopératives agricoles.",
            "content": "<p>Démonstrations de plateformes mobiles locales, modèles d'affaires résilients et valorisation des produits du terroir par les outils digitaux.</p>"
        },
        "en": {
            "title": "AgriConnect Symposium: Digital Solutions & Rural Short Supply Chains",
            "excerpt": "Knowledge exchange on local logistics, mobile platforms, and farmer cooperative empowerment.",
            "content": "<p>Field demonstrations of rural mobile tools, resilient business models, and digital enablement for agricultural communities.</p>"
        }
    }
]

async def seed():
    async with AsyncSessionLocal() as session:
        # Get admin user
        user_res = await session.execute(select(User).order_by(User.created_at.asc()))
        admin_user = user_res.scalars().first()
        admin_id = admin_user.id if admin_user else None
        
        # 1. Seed Media
        print("Checking Media...")
        created_media_map = {}
        for m in INITIAL_MEDIA:
            res = await session.execute(select(Media).where(Media.filename == m["filename"]))
            existing = res.scalars().first()
            if not existing:
                media_item = Media(
                    filename=m["filename"],
                    url=m["url"],
                    mime_type=m["mime_type"],
                    alt_text=m["alt_text"],
                    caption=m["caption"],
                    uploaded_by_id=admin_id
                )
                session.add(media_item)
                await session.flush()
                created_media_map[m["filename"]] = media_item.id
                print(f"  + Added Media: {m['filename']}")
            else:
                created_media_map[m["filename"]] = existing.id
                print(f"  = Exists Media: {m['filename']}")

        # 2. Seed Events
        print("Checking Events...")
        for evt in INITIAL_EVENTS:
            res = await session.execute(select(Event).where(Event.slug == evt["slug"]))
            existing = res.scalars().first()
            if not existing:
                new_event = Event(
                    slug=evt["slug"],
                    status=evt["status"],
                    start_date=evt["start_date"],
                    end_date=evt["end_date"],
                    location=evt["location"],
                    author_id=admin_id,
                    is_online=evt.get("is_online", False),
                    registration_required=evt.get("registration_required", False),
                    registration_url=evt.get("registration_url"),
                    max_participants=evt.get("max_participants"),
                    visibility="public"
                )
                session.add(new_event)
                await session.flush()

                # French translation
                trans_fr = EventTranslation(
                    event_id=new_event.id,
                    language="fr",
                    title=evt["fr"]["title"],
                    slug=evt["slug"],
                    excerpt=evt["fr"]["excerpt"],
                    content=evt["fr"]["content"]
                )
                session.add(trans_fr)

                # English translation
                trans_en = EventTranslation(
                    event_id=new_event.id,
                    language="en",
                    title=evt["en"]["title"],
                    slug=evt["slug"],
                    excerpt=evt["en"]["excerpt"],
                    content=evt["en"]["content"]
                )
                session.add(trans_en)

                print(f"  + Added Event: {evt['slug']}")
            else:
                print(f"  = Exists Event: {evt['slug']}")

        await session.commit()
        print("Successfully seeded events and media!")

if __name__ == "__main__":
    asyncio.run(seed())
