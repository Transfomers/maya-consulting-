"""
Seed or update published blog articles and categories in Cap Entrepreneurs database.
Run via: docker exec cap_backend python seed_blogs.py
"""
import asyncio
from datetime import datetime, timezone
from sqlalchemy import select, delete
from app.core.database import AsyncSessionLocal
import app.models
from app.models.user import User
from app.models.post import Post, PostTranslation, Category

CATEGORIES_DATA = [
    {"name": "Community", "slug": "community"},
    {"name": "Leadership", "slug": "leadership"},
    {"name": "Tech Inclusive", "slug": "tech-inclusive"},
    {"name": "Impact Social", "slug": "impact-social"},
    {"name": "Mentorat", "slug": "mentorat"},
    {"name": "Circularity", "slug": "circularity"},
    {"name": "International", "slug": "international"},
]

ARTICLES_DATA = [
    {
        "slug": "26-ways-ecosystem-thrive-collaborative-hub",
        "category_slug": "community",
        "title_en": "26 Ways to Make Your Ecosystem Thrive Like a Modern Collaborative Hub",
        "title_fr": "26 clés pour faire prospérer un écosystème solidaire et collaboratif",
        "excerpt_en": "How collaborative laboratories, circular economy, and inclusive entrepreneurship empower creators across Canada and global hubs.",
        "excerpt_fr": "Comment les laboratoires partagés, l'économie circulaire et l'inclusion numérique renforcent l'autonomie des créateurs au Canada et dans nos hubs partenaires.",
        "content_en": """
          <p class="lead">Building a collaborative entrepreneurial ecosystem is not about erecting rigid hierarchies — it is about cultivating fertile ground where skills, solidarity, and social purpose meet naturally.</p>
          <h2>1. The Art of Open Collaborative Spaces</h2>
          <p>Whether designing a community workshop in Quebec or facilitating virtual exchanges across Montreal, Paris, Nairobi, and Port-au-Prince, space shapes trust.</p>
          <blockquote>Ecosystems do not grow by decree; they thrive because people find tangible, active solidarity in them every day.</blockquote>
          <h2>2. Sustainable and Circular Practices</h2>
          <p>From hardware refurbishment to responsible sourcing, our cohorts prioritize rituals that turn budding ideas into resilient community projects.</p>
          <h2>3. International Bridges & Shared Trust</h2>
          <p>Connecting Canadian social innovators with global changemakers multiplies impact perspectives while safeguarding ethical governance.</p>
        """,
        "content_fr": """
          <p class="lead">Bâtir un écosystème entrepreneurial et solidaire ne consiste pas à ériger des hiérarchies rigides — c'est cultiver un terrain fertile où les compétences, la solidarité et l'ambition d'intérêt général se rencontrent naturellement.</p>
          <h2>1. L'art des espaces collaboratifs ouverts</h2>
          <p>Qu'il s'agisse de concevoir un atelier communautaire au Québec ou d'animer des échanges virtuels entre Montréal, Paris, Nairobi et Port-au-Prince, l'espace façonne la confiance. La transparence, le partage des ressources et l'accessibilité encouragent une véritable émancipation collective.</p>
          <blockquote>"Les écosystèmes ne grandissent pas par décret ; ils prospèrent parce que des personnes y trouvent une solidarité tangible et active au quotidien."</blockquote>
          <h2>2. Des pratiques durables et circulaires</h2>
          <p>Du reconditionnement d'équipements informatiques à l'approvisionnement responsable, nos cohortes privilégient des rituels concrets qui transforment les idées naissantes en projets résilients au service de leur communauté.</p>
          <h2>3. Passerelles internationales et confiance partagée</h2>
          <p>Relier les entrepreneurs sociaux du Canada aux réseaux d'innovation mondiaux multiplie les perspectives d'impact tout en garantissant des standards éthiques de gouvernance et de respect mutuel.</p>
        """
    },
    {
        "slug": "the-strategic-blueprint-non-stop",
        "category_slug": "leadership",
        "title_en": "The Strategic Blueprint I'll Be Using Non-Stop This Season",
        "title_fr": "Le cadre stratégique d'action pour démultiplier l'impact social",
        "excerpt_en": "Why agile execution and decentralized mentorship transformed how our incubation cohorts launch and scale impact-driven ventures.",
        "excerpt_fr": "Pourquoi l'action agile sur le terrain et le mentorat décentralisé transforment l'accompagnement des initiatives communautaires durables.",
        "content_en": """
          <p class="lead">Every social initiative faces the pitfall of over-planning: spending months refining theoretical documents while real community needs evolve.</p>
          <h2>Rapid Field Experimentation</h2>
          <p>Rather than waiting for a flawless blueprint, test your models in real conditions early. Direct feedback from beneficiaries provides unmatched clarity.</p>
          <h2>The Power of Peer Mentorship</h2>
          <p>By pairing each founder with dedicated peers and supportive mentors, loneliness gives way to exponential shared learning.</p>
        """,
        "content_fr": """
          <p class="lead">Toute initiative sociale rencontre l'écueil de la planification excessive : passer des mois à peaufiner des documents théoriques pendant que les besoins réels sur le terrain évoluent. Voici une démarche pragmatique éprouvée.</p>
          <h2>L'expérimentation rapide auprès des participants</h2>
          <p>Plutôt que d'attendre un modèle parfait, testez vos solutions en situation réelle dès les premières semaines. Le retour direct des bénéficiaires et des bénévoles apporte une clarté incomparable.</p>
          <blockquote>"L'écoute active de la communauté est la clé de voûte de toute initiative sociale pérenne."</blockquote>
          <h2>La force de l'entraide entre pairs</h2>
          <p>En jumelant chaque porteur de projet avec un mentor bienveillant et des pairs engagés, les solitudes se brisent et les apprentissages se multiplient exponentiellement.</p>
        """
    },
    {
        "slug": "the-cult-beauty-products-in-pairs",
        "category_slug": "tech-inclusive",
        "title_en": "The Essential Digital Tools You Should Be Adopting in Pairs",
        "title_fr": "Les outils numériques essentiels pour une transition responsable",
        "excerpt_en": "From asynchronous collaboration hubs to circular supply chain trackers: the top tech pairings our entrepreneurs swear by.",
        "excerpt_fr": "Des plateformes collaboratives ouvertes aux outils de traçabilité circulaire : le socle technologique recommandé pour les projets à impact.",
        "content_en": """
          <p class="lead">Technology should liberate human creativity and foster inclusion, never act as a barrier to participation.</p>
          <h2>1. Shared Documentation and Knowledge Management</h2>
          <p>Keeping institutional memory open and searchable allows onboarding volunteers and team members in hours with warmth and clarity.</p>
          <h2>2. Community Impact Dashboards</h2>
          <p>When partners and participants observe tangible social progress with full transparency, lasting trust is forged.</p>
        """,
        "content_fr": """
          <p class="lead">La technologie doit libérer l'énergie humaine et favoriser l'inclusion, non constituer une barrière d'accès. Ce duo d'outils renforce l'efficacité collective sans surcharger les équipes.</p>
          <h2>1. Documentation partagée et gestion des connaissances</h2>
          <p>Garder le savoir accessible et bien indexé permet d'accueillir et d'intégrer de nouveaux bénévoles ou membres d'équipe en quelques heures avec clarté et bienveillance.</p>
          <blockquote>"Un outil n'a de valeur que par la bienveillance et la clarté de la culture humaine qui l'anime."</blockquote>
          <h2>2. Indicateurs d'impact et tableaux de bord communautaires</h2>
          <p>Lorsque vos donateurs, partenaires et bénéficiaires constatent l'impact social concret en toute transparence, la confiance se consolide durablement.</p>
        """
    },
    {
        "slug": "struggle-to-hit-your-goals-try-this",
        "category_slug": "impact-social",
        "title_en": "If You Struggle to Hit Your Goals, Try This Instead",
        "title_fr": "Atteindre ses objectifs d'impact : la force des micro-actions collectives",
        "excerpt_en": "This year, instead of setting grand, lofty goals and broad resolutions, learn how micro-sprints and peer accountability check-ins deliver daily momentum.",
        "excerpt_fr": "Plutôt que des résolutions abstraites, découvrez comment les cercles de pairs et les sprints solidaires créent un élan quotidien durable.",
        "content_en": """
          <p class="lead">Setting ambitious goals is admirable, but without steady daily rhythm, burnout looms.</p>
          <h2>The 3 Daily Priorities Rule</h2>
          <p>Every morning, identify the three specific actions that move the mission forward. Focus energy on what yields genuine community value.</p>
          <h2>Celebrating Small Wins</h2>
          <p>In community development, every step forward counts. Celebrating progress with peers maintains high collective morale.</p>
        """,
        "content_fr": """
          <p class="lead">Se fixer des buts ambitieux est louable, mais sans rythme régulier, l'épuisement guette. Voici la méthode des petits pas partagés qui dynamise les cohortes de Cap Entrepreneurs.</p>
          <h2>Le principe des 3 priorités quotidiennes</h2>
          <p>Chaque matin, identifiez les trois actions qui font avancer concrètement la mission. Concentrez votre énergie sur ce qui apporte une réelle valeur humaine.</p>
          <blockquote>"La régularité bienveillante produit plus d'impact que l'intensité sporadique."</blockquote>
          <h2>Célébrer chaque étape franchie</h2>
          <p>Dans l'action communautaire, chaque progrès compte. Partager ses victoires avec ses pairs nourrit la motivation et solidifie les liens.</p>
        """
    },
    {
        "slug": "high-impact-resource-finds",
        "category_slug": "mentorat",
        "title_en": "These High-Impact Resource Finds Will Transform Your Project",
        "title_fr": "Ressources et opportunités d'impact pour propulser vos projets",
        "excerpt_en": "A curated selection of grant registries, open-source diagnostic templates, and collaborative funding networks available right now.",
        "excerpt_fr": "Une sélection de répertoires de subventions, de modèles diagnostics libres et de réseaux d'entraide accessibles à notre communauté.",
        "content_en": """
          <p class="lead">Access to non-dilutive resources and ethical funding is key to long-term civic vitality.</p>
          <h2>Grant Registries & Impact Grants</h2>
          <p>Discover Canadian and international funds dedicated to digital inclusion, ecological transition, and women's economic empowerment.</p>
          <h2>Open Source Diagnostic Tools</h2>
          <p>Download our practical frameworks for impact assessment, financial modeling, and participatory project management.</p>
        """,
        "content_fr": """
          <p class="lead">L'accès aux ressources est le nerf de la pérennité associative. Nous avons réuni les leviers les plus pertinents pour soutenir les initiatives solidaires.</p>
          <h2>Les bourses et financements non dilutifs</h2>
          <p>Découvrez les programmes canadiens et internationaux dédiés à l'inclusion numérique, à la transition écologique et à l'autonomisation économique des femmes.</p>
          <blockquote>"Les financements éthiques soutiennent la mission sociale sans dénaturer la vision d'origine."</blockquote>
          <h2>Les gabarits et outils en libre accès</h2>
          <p>Téléchargez nos fiches pratiques de diagnostic, de gestion budgétaire prévisionnelle et d'évaluation d'impact social pour structurer votre démarche.</p>
        """
    },
    {
        "slug": "bridging-digital-divide-inclusive-technologies",
        "category_slug": "circularity",
        "title_en": "How to Build Sustainable Digital Futures Across Canada and Global Hubs",
        "title_fr": "Bâtir des avenirs numériques durables et universellement inclusifs",
        "excerpt_en": "How collaborative laboratories and inclusive hardware refurbishment empower underserved communities across Canada and emerging markets.",
        "excerpt_fr": "Comment le reconditionnement d'équipements et l'accessibilité universelle réduisent durablement la fracture numérique au Canada et à l'international.",
        "content_en": """
          <p class="lead">In the 21st century, access to computing hardware and digital capabilities is a fundamental pillar of civic participation.</p>
          <h2>1. Refurbishing Hardware, Rebuilding Opportunities</h2>
          <p>Through the Cap Green Lab initiative, corporate computers are collected, tested, and renewed to equip schools and grassroots cooperatives.</p>
          <h2>2. Universal Technological Accessibility</h2>
          <p>Our training programs integrate adaptive workflows to ensure people with disabilities benefit fully from digital opportunities.</p>
        """,
        "content_fr": """
          <p class="lead">Au XXIe siècle, l'accès au matériel informatique et aux compétences numériques est un préalable indispensable à l'exercice de la citoyenneté et à l'autonomie économique.</p>
          <h2>1. Reconditionner le matériel, reconstruire des opportunités</h2>
          <p>À travers l'initiative Cap Green Lab, nous collectons, diagnostiquons et reconditionnons des parcs informatiques d'entreprises pour équiper des écoles, des coopératives et des familles dans le besoin.</p>
          <blockquote>"Chaque ordinateur sauvé du rebut est une passerelle d'apprentissage offerte à un jeune ou un créateur."</blockquote>
          <h2>2. L'accessibilité technologique universelle</h2>
          <p>Nos ateliers intègrent des solutions d'accessibilité pour les personnes en situation de handicap, garantissant que la transition numérique n'exclue personne.</p>
        """
    },
    {
        "slug": "cute-jewelry-ideas-for-any-occasion",
        "category_slug": "international",
        "title_en": "Ethical Sourcing & Creative Design for Global Markets",
        "title_fr": "Sourcing éthique et valorisation créative pour les marchés solidaires",
        "excerpt_en": "Connecting African creative talents and Quebec designers with sustainable buyers worldwide through our premier sourcing programme.",
        "excerpt_fr": "Relier les talents créatifs africains et les designers du Québec aux acheteurs éthiques à travers notre programme de sourcing international.",
        "content_en": """
          <p class="lead">Artisanal creativity and circular design are powerful engines for socio-economic empowerment across continents.</p>
          <h2>Direct and Equitable Partnerships</h2>
          <p>By eliminating predatory intermediaries, we ensure fair value flows directly back to artisans and local women cooperatives.</p>
          <h2>Access to Canadian & Global Networks</h2>
          <p>Through our showcases in Montreal, Paris, and Nairobi, makers connect with ethical buyers committed to sustainable trade.</p>
        """,
        "content_fr": """
          <p class="lead">La créativité artisanale et le design responsable sont de formidables moteurs d'émancipation économique. Notre programme de sourcing international crée des ponts équitables entre continents.</p>
          <h2>Des partenariats directs et équitables</h2>
          <p>En éliminant les intermédiaires abusifs, nous veillons à ce que la juste valeur du travail retourne directement aux artisans et coopératives créatives locales.</p>
          <blockquote>"Le commerce équitable honore les savoir-faire traditionnels tout en ouvrant des perspectives économiques dignes."</blockquote>
          <h2>Accès aux réseaux canadiens et internationaux</h2>
          <p>À travers les rendez-vous de Marrakech, Paris et Nairobi, les créateurs rencontrent des acheteurs professionnels engagés dans une démarche durable et solidaire.</p>
        """
    }
]


async def seed_blogs():
    async with AsyncSessionLocal() as session:
        # 1. Ensure author exists
        user_res = await session.execute(select(User).order_by(User.created_at.asc()))
        author = user_res.scalars().first()
        author_id = author.id if author else None

        # 2. Ensure categories exist
        category_map = {}
        for cat_data in CATEGORIES_DATA:
            res = await session.execute(select(Category).where(Category.slug == cat_data["slug"]))
            cat = res.scalars().first()
            if not cat:
                cat = Category(name=cat_data["name"], slug=cat_data["slug"])
                session.add(cat)
                await session.flush()
            category_map[cat_data["slug"]] = cat.id

        now = datetime.now(timezone.utc)

        # 3. Publish any existing draft posts in db
        existing_res = await session.execute(select(Post))
        for existing_post in existing_res.scalars().all():
            existing_post.status = "published"
            if not existing_post.published_at:
                existing_post.published_at = now

        # 4. Upsert curated articles
        for art in ARTICLES_DATA:
            cat_id = category_map.get(art["category_slug"])
            post_res = await session.execute(select(Post).where(Post.slug == art["slug"]))
            post = post_res.scalars().first()

            if not post:
                post = Post(
                    slug=art["slug"],
                    status="published",
                    category_id=cat_id,
                    author_id=author_id,
                    published_at=now,
                )
                session.add(post)
                await session.flush()
            else:
                post.status = "published"
                post.category_id = cat_id
                if not post.published_at:
                    post.published_at = now

            # Remove old translations and replace with fresh translations
            await session.execute(delete(PostTranslation).where(PostTranslation.post_id == post.id))

            t_en = PostTranslation(
                post_id=post.id,
                language="en",
                title=art["title_en"],
                slug=art["slug"],
                excerpt=art["excerpt_en"],
                content=art["content_en"].strip(),
                seo_title=f"{art['title_en']} | CAP Entrepreneurs",
                seo_description=art["excerpt_en"],
                allow_index=True,
                allow_follow=True,
            )
            t_fr = PostTranslation(
                post_id=post.id,
                language="fr",
                title=art["title_fr"],
                slug=art["slug"],
                excerpt=art["excerpt_fr"],
                content=art["content_fr"].strip(),
                seo_title=f"{art['title_fr']} | CAP Entrepreneurs",
                seo_description=art["excerpt_fr"],
                allow_index=True,
                allow_follow=True,
            )
            session.add_all([t_en, t_fr])

        await session.commit()
        print("Successfully seeded categories, published posts, and translations!")


if __name__ == "__main__":
    asyncio.run(seed_blogs())
