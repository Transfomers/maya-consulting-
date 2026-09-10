export const IMAGES = {
  hero: "https://images.unsplash.com/photo-1556761175-4b46a572b786?q=80&w=1600&auto=format&fit=crop",
  collaboration: "https://images.unsplash.com/photo-1531496730074-83b638c0a7ac?q=80&w=1600&auto=format&fit=crop",
  board: "https://images.unsplash.com/photo-1542744173-8e7e53415bb0?q=80&w=1600&auto=format&fit=crop",
  workshop: "https://images.unsplash.com/photo-1573164713988-8665fc963095?q=80&w=1600&auto=format&fit=crop",
  building: "https://images.unsplash.com/photo-1559027615-cd4628902d4a?q=80&w=1600&auto=format&fit=crop",
  portraitM: "https://images.unsplash.com/photo-1556157382-97eda2d62296?q=80&w=800&auto=format&fit=crop",
  portraitF: "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?q=80&w=800&auto=format&fit=crop",
};

export const PROGRAMS = [
  {
    id: "cap-green-lab",
    number: "01",
    name: "CAP Green Lab",
    theme: "Digital solutions for climate and environment.",
    purpose: "Leveraging technology and digital innovation to address pressing climate and environmental challenges.",
    outcomes: ["Sustainable digital infrastructure", "Climate-focused innovation", "Environmental impact"],
    image: IMAGES.workshop,
  },
  {
    id: "agriconnect",
    number: "02",
    name: "Agriconnect",
    theme: "Tech for sustainable agriculture.",
    purpose: "Modernizing agricultural practices by introducing smart technologies and digital tools to farmers.",
    outcomes: ["Smart farming techniques", "Increased yield and sustainability", "Tech-empowered agriculture"],
    image: IMAGES.building,
  },
  {
    id: "safe-vibe-africa",
    number: "03",
    name: "Safe Vibe Africa",
    theme: "Cyber security for NGOs and civil society.",
    purpose: "Equipping non-governmental organizations and civil society groups with the necessary digital security tools and knowledge.",
    outcomes: ["Enhanced cyber resilience", "Data protection best practices", "Secure digital environments"],
    image: IMAGES.board,
  },
  {
    id: "creative-social",
    number: "04",
    name: "Creative & Social Entrepreneurship",
    theme: "Tech for cultural impact.",
    purpose: "Supporting creative minds in using digital platforms to amplify cultural expression and social entrepreneurship.",
    outcomes: ["Digital cultural platforms", "Creative business models", "Socially impactful tech"],
    image: IMAGES.collaboration,
  },
];

export const STORIES = [
  {
    id: "northern-makers",
    title: "The Northern Makers Collective",
    place: "Rural Ontario",
    image: IMAGES.portraitF,
    challenge:
      "A group of rural artisans had strong products but no access to digital commerce skills, larger markets or the confidence to price and present their work beyond local craft sales.",
    program: "Marketplace Lab",
    actions:
      "Participants completed hands-on sessions in digital commerce, branding and export readiness, then showcased their products at a regional trade fair through the CAP partner network.",
    impact:
      "Every participating business launched an online storefront, and three secured recurring wholesale orders within six months of the program.",
    future:
      "Two members are now candidates for the international exposure scholarship and a cross-border festival delegation.",
  },
  {
    id: "harbour-nonprofit",
    title: "Harbour Community Services",
    place: "Atlantic Canada",
    image: IMAGES.portraitM,
    challenge:
      "A growing community nonprofit struggled with board engagement and strategic planning, putting its funding partnerships and long-term sustainability at risk.",
    program: "CAP Executive",
    actions:
      "Through governance intensives and peer collaboration, the organization rebuilt its strategic plan, re-engaged its board and formalized a partnership development framework.",
    impact:
      "Board participation rose across every committee, and the organization renewed two major funding partnerships with multi-year agreements.",
    future:
      "The organization is exploring a co-delivery partnership with CAP Entrepreneurs to mentor newer nonprofits in its region.",
  },
  {
    id: "global-exchange",
    title: "Entrepreneurs Without Borders",
    place: "Canada — International",
    image: IMAGES.collaboration,
    challenge:
      "Early-stage entrepreneurs in small communities rarely get the chance to see how businesses operate in other markets, limiting their ambition and their networks.",
    program: "CAP Global Mobility",
    actions:
      "CAP Entrepreneurs brokered an exchange partnership connecting a cohort of Canadian entrepreneurs with peer organizations abroad for a collaborative learning mission.",
    impact:
      "Participants returned with new distribution contacts, intercultural business skills and two active cross-border collaborations.",
    future:
      "The exchange becomes an annual mission, with volunteering placements opening to members next year.",
  },
  {
    id: "cheutou-kameni",
    title: "Cheutou Kameni Firm",
    place: "2025 – 2026 (Ongoing)",
    image: IMAGES.collaborating,
    challenge:
      "Cheutou Kameni, a premier legal and professional advisory practice, required an authoritative digital presence to match their high-stakes consulting work. The firm needed to transition from traditional advisory methods to a modern, digitally driven framework that builds immediate trust, clearly communicates complex legal and consulting services, and streamlines client intake.",
    program: "Brand Strategy, Digital Platform & Executive UI",
    actions:
      "Engineered an executive-tier digital platform and comprehensive brand strategy tailored specifically for legal and consulting. 1. Discover: Analyzed advisory services and positioning. 2. Structure: Developed brand identity and content hierarchy. 3. Build: Built high-performance responsive platform. 4. Optimize: Interface polish and mobile audits. 5. Scale: Implemented scalable structures.",
    impact:
      "Delivered a sophisticated digital platform elevating market positioning with high-value corporate clients, streamlined client consultation intake funnel, and established a scalable brand foundation.",
    future:
      "Built with modern web frameworks, executive brand strategy frameworks, and secure hosting protocols.",
  },
];

export const NEWS = [
  {
    date: "August 2026",
    tag: "Program Launch",
    title: "Marketplace Lab opens applications for its fall cohort",
    excerpt:
      "Entrepreneurs ready to move from idea to market can now apply for the fall intake, including eligibility for the international exposure scholarship.",
  },
  {
    date: "September 2026",
    tag: "Community Initiative",
    title: "CAP Executive governance intensive comes to Atlantic Canada",
    excerpt:
      "A regional edition of our nonprofit leadership program, co-hosted with local economic development partners.",
  },
  {
    date: "October 2026",
    tag: "International Mission",
    title: "First CAP Global Mobility exchange delegation announced",
    excerpt:
      "Selected entrepreneurs and volunteers will join a collaborative mission with international partner organizations this fall.",
  },
  {
    date: "November 2026",
    tag: "Partner Announcement",
    title: "New technology partnership to power digital learning",
    excerpt:
      "A technology partner joins the ecosystem to make entrepreneurial education more accessible, measurable and scalable.",
  },
  {
    date: "December 2026",
    tag: "Funding Opportunity",
    title: "Year-end giving campaign fuels participant scholarships",
    excerpt:
      "Every contribution supports access to education, mentoring and professional exposure for program participants.",
  },
  {
    date: "January 2027",
    tag: "Annual Report",
    title: "CAP Entrepreneurs publishes its first annual impact report",
    excerpt:
      "A transparent look at our programs, partnerships and the measurable community impact of our first year.",
  },
];

export const EVENTS = [
  {
    date: "Sep 12, 2026",
    title: "Ecosystem Open House",
    detail: "Meet the team, members and partners behind CAP Entrepreneurs. Virtual + in-person.",
  },
  {
    date: "Oct 03, 2026",
    title: "Marketplace Lab Demo Day",
    detail: "Fall cohort participants present market-ready ventures to partners and funders.",
  },
  {
    date: "Nov 21, 2026",
    title: "Partners Roundtable: Rural Innovation",
    detail: "Municipalities, agencies and nonprofits shaping rural entrepreneurial ecosystems.",
  },
];

export const MEMBER_BENEFITS = [
  "Professional development",
  "Networking",
  "Learning opportunities",
  "Business exposure",
  "International collaborations",
  "Community events",
  "Access to partner opportunities",
];

export const PARTNER_TYPES = [
  { name: "Corporate Partners", detail: "Invest in measurable opportunity creation and drive shared value." },
  { name: "Institutional Partners", detail: "Align programs with regional growth priorities and public impact goals." },
  { name: "NGO & Social Enterprise Partners", detail: "Collaborate on shared missions and maximize community impact." },
  { name: "Knowledge & Ecosystem Partners", detail: "Co-design learning experiences, credential pathways, and research." },
];

export const PROGRAMS_FR = [
  {
    id: "cap-green-lab",
    number: "01",
    name: "CAP Green Lab",
    theme: "Solutions numériques pour le climat et l'environnement.",
    purpose: "Tirer parti de la technologie et de l'innovation numérique pour relever les défis climatiques et environnementaux urgents.",
    outcomes: ["Infrastructure numérique durable", "Innovation axée sur le climat", "Impact environnemental"],
    image: IMAGES.workshop,
  },
  {
    id: "agriconnect",
    number: "02",
    name: "Agriconnect",
    theme: "La technologie pour l'agriculture durable.",
    purpose: "Moderniser les pratiques agricoles en introduisant des technologies intelligentes et des outils numériques aux agriculteurs.",
    outcomes: ["Techniques agricoles intelligentes", "Augmentation des rendements et de la durabilité", "Agriculture renforcée par la technologie"],
    image: IMAGES.building,
  },
  {
    id: "safe-vibe-africa",
    number: "03",
    name: "Safe Vibe Africa",
    theme: "Cybersécurité pour les ONG et la société civile.",
    purpose: "Outiller les organisations non gouvernementales et les groupes de la société civile avec les connaissances et les outils de sécurité numérique nécessaires.",
    outcomes: ["Cyber-résilience renforcée", "Bonnes pratiques de protection des données", "Environnements numériques sécurisés"],
    image: IMAGES.board,
  },
  {
    id: "creative-social",
    number: "04",
    name: "Entrepreneuriat Créatif & Social",
    theme: "La technologie pour l'impact culturel.",
    purpose: "Soutenir les esprits créatifs dans l'utilisation des plateformes numériques pour amplifier l'expression culturelle et l'entrepreneuriat social.",
    outcomes: ["Plateformes culturelles numériques", "Modèles économiques créatifs", "Technologie à impact social"],
    image: IMAGES.collaboration,
  },
];

export const PROGRAMS_AR = [
  {
    id: "cap-executive",
    number: "01",
    name: "CAP Executive",
    theme: "تعزيز القيادة غير الربحية",
    purpose:
      "تجربة تعليمية تدعم المنظمات غير الربحية في تحسين الحوكمة والتخطيط الاستراتيجي وإشراك مجلس الإدارة وتطوير الشراكات.",
    outcomes: [
      "حوكمة أقوى وإشراك لمجلس الإدارة",
      "استدامة تنظيمية محسنة",
      "زيادة التعاون عبر القطاع",
    ],
    image: IMAGES.board,
  },
  {
    id: "marketplace-lab",
    number: "02",
    name: "Marketplace Lab",
    theme: "مساعدة رواد الأعمال على تحويل الأفكار إلى أعمال جاهزة للسوق",
    purpose:
      "يجمع Marketplace Lab بين التعليم الريادي والتجارة الرقمية والابتكار الريفي والتعرض للأعمال الدولية. يطور المشاركون مهارات عملية أثناء الاستعداد للوصول إلى المعارض التجارية والمهرجانات والفرص التجارية من خلال شبكة شركاء CAP Entrepreneurs.",
    outcomes: [
      "مهارات أعمال عملية وجاهزة للسوق",
      "الوصول إلى المعارض التجارية والمهرجانات والفرص التجارية",
      "خبرة أعمال دولية مدعومة بمنحة تعرض تصل إلى 8,000 دولار كندي، تخضع لأهلية البرنامج والتمويل المتاح",
    ],
    image: IMAGES.workshop,
  },
  {
    id: "cap-global-mobility",
    number: "03",
    name: "CAP Global Mobility",
    theme: "خلق فرص دولية",
    purpose:
      "يطور هذا البرنامج شراكات تسمح لرواد الأعمال والمتطوعين والمنظمات غير الربحية بالمشاركة في التبادلات الدولية ومبادرات التطوع والمشاريع التعاونية.",
    outcomes: [
      "التبادلات الدولية ومبادرات التطوع",
      "التعلم والتعاون بين الثقافات",
      "ريادة الأعمال عبر الحدود",
    ],
    image: IMAGES.building,
  },
];

export const STORIES_FR = [
  {
    id: "northern-makers",
    title: "La coop\u00e9rative des artisans du Nord",
    place: "Ontario rural",
    image: IMAGES.portraitF,
    challenge:
      "Un groupe d'artisans ruraux avait de beaux produits, mais aucun acc\u00e8s aux comp\u00e9tences en commerce num\u00e9rique, aux grands march\u00e9s ni \u00e0 la confiance pour pr\u00e9senter et tarifer leur travail au-del\u00e0 des ventes artisanales locales.",
    program: "Marketplace Lab",
    actions:
      "Les participants ont suivi des ateliers pratiques en commerce num\u00e9rique, en image de marque et en pr\u00e9paration \u00e0 l'exportation, puis ont pr\u00e9sent\u00e9 leurs produits \u00e0 une foire commerciale r\u00e9gionale gr\u00e2ce au r\u00e9seau de partenaires de CAP.",
    impact:
      "Chaque entreprise participante a lanc\u00e9 une boutique en ligne, et trois ont obtenu des commandes de gros r\u00e9currentes dans les six mois suivant le programme.",
    future:
      "Deux membres sont maintenant candidats \u00e0 la bourse de rayonnement internationale et \u00e0 une d\u00e9l\u00e9gation \u00e0 un festival transfrontalier.",
  },
  {
    id: "harbour-nonprofit",
    title: "Services communautaires Harbour",
    place: "Canada atlantique",
    image: IMAGES.portraitM,
    challenge:
      "Un organisme communautaire en croissance peinait avec l'engagement de son conseil et sa planification strat\u00e9gique, mettant en p\u00e9ril ses partenariats de financement et sa viabilit\u00e9 \u00e0 long terme.",
    program: "CAP Executive",
    actions:
      "Gr\u00e2ce \u00e0 des formations intensives en gouvernance et \u00e0 la collaboration entre pairs, l'organisme a reb\u00e2ti son plan strat\u00e9gique, r\u00e9engag\u00e9 son conseil et officialis\u00e9 un cadre de d\u00e9veloppement de partenariats.",
    impact:
      "La participation du conseil a augment\u00e9 dans chaque comit\u00e9, et l'organisme a renouvel\u00e9 deux partenariats de financement majeurs avec des ententes pluriannuelles.",
    future:
      "L'organisme explore un partenariat de co-prestation avec CAP Entrepreneurs pour mentorer de jeunes organismes de sa r\u00e9gion.",
  },
  {
    id: "global-exchange",
    title: "Entrepreneurs sans fronti\u00e8res",
    place: "Canada \u2014 International",
    image: IMAGES.collaboration,
    challenge:
      "Les entrepreneurs en d\u00e9marrage des petites communaut\u00e9s ont rarement l'occasion de voir comment les entreprises fonctionnent sur d'autres march\u00e9s, ce qui limite leurs ambitions et leurs r\u00e9seaux.",
    program: "CAP Global Mobility",
    actions:
      "CAP Entrepreneurs a conclu un partenariat d'\u00e9change reliant une cohorte d'entrepreneurs canadiens \u00e0 des organismes pairs \u00e0 l'\u00e9tranger pour une mission d'apprentissage collaborative.",
    impact:
      "Les participants sont revenus avec de nouveaux contacts de distribution, des compétences interculturelles et deux collaborations transfrontalières actives.",
    future:
      "L'échange devient une mission annuelle, avec des placements de bénévolat ouverts aux membres l'an prochain.",
  },
  {
    id: "cheutou-kameni",
    title: "Cabinet Cheutou Kameni",
    place: "2025 – 2026 (En cours)",
    image: IMAGES.collaborating,
    challenge:
      "Cheutou Kameni, un cabinet de conseil juridique et professionnel de premier plan, nécessitait une présence numérique autoritaire à la hauteur de ses missions. Le cabinet devait passer d'un modèle traditionnel à une plateforme numérique moderne renforçant la confiance et simplifiant la prise de contact.",
    program: "Stratégie de marque, Plateforme numérique & UI Exécutif",
    actions:
      "Conception d'une plateforme numérique de niveau exécutif et d'une stratégie de marque complète. 1. Découverte: Analyse des services et du positionnement. 2. Structure: Définition de l'identité et de la hiérarchie de contenu. 3. Construction: Développement de la plateforme réactive. 4. Optimisation: Finition de l'interface et audits. 5. Échelle: Mise en place d'infrastructures évolutives.",
    impact:
      "Livraison d'une plateforme sophistiquée renforçant la confiance des clients corporatifs à haute valeur, optimisation du tunnel de consultation et établissement d'une marque évolutive.",
    future:
      "Propulsé par des frameworks web modernes, une stratégie de marque exécutive et des protocoles d'hébergement sécurisés.",
  },
];

export const NEWS_FR = [
  {
    date: "Ao\u00fbt 2026",
    tag: "Lancement de programme",
    title: "Marketplace Lab ouvre les candidatures pour sa cohorte d'automne",
    excerpt:
      "Les entrepreneurs pr\u00eats \u00e0 passer de l'id\u00e9e au march\u00e9 peuvent maintenant postuler pour la cohorte d'automne, y compris pour l'admissibilit\u00e9 \u00e0 la bourse de rayonnement internationale.",
  },
  {
    date: "Septembre 2026",
    tag: "Initiative communautaire",
    title: "La formation intensive en gouvernance CAP Executive arrive au Canada atlantique",
    excerpt:
      "Une \u00e9dition r\u00e9gionale de notre programme de leadership \u00e0 but non lucratif, coanim\u00e9e avec des partenaires locaux de d\u00e9veloppement \u00e9conomique.",
  },
  {
    date: "Octobre 2026",
    tag: "Mission internationale",
    title: "Annonce de la premi\u00e8re d\u00e9l\u00e9gation d'\u00e9change CAP Global Mobility",
    excerpt:
      "Des entrepreneurs et b\u00e9n\u00e9voles s\u00e9lectionn\u00e9s se joindront \u00e0 une mission collaborative avec des organismes partenaires internationaux cet automne.",
  },
  {
    date: "Novembre 2026",
    tag: "Annonce de partenariat",
    title: "Un nouveau partenariat technologique pour propulser l'apprentissage num\u00e9rique",
    excerpt:
      "Un partenaire technologique se joint \u00e0 l'\u00e9cosyst\u00e8me pour rendre l'\u00e9ducation entrepreneuriale plus accessible, mesurable et \u00e9volutive.",
  },
  {
    date: "D\u00e9cembre 2026",
    tag: "Occasion de financement",
    title: "La campagne de fin d'ann\u00e9e alimente les bourses des participants",
    excerpt:
      "Chaque contribution soutient l'acc\u00e8s \u00e0 l'\u00e9ducation, au mentorat et \u00e0 la visibilit\u00e9 professionnelle pour les participants aux programmes.",
  },
  {
    date: "Janvier 2027",
    tag: "Rapport annuel",
    title: "CAP Entrepreneurs publie son premier rapport d'impact annuel",
    excerpt:
      "Un regard transparent sur nos programmes, nos partenariats et l'impact communautaire mesurable de notre premi\u00e8re ann\u00e9e.",
  },
];

export const EVENTS_FR = [
  {
    date: "12 sept. 2026",
    title: "Portes ouvertes de l'\u00e9cosyst\u00e8me",
    detail: "Rencontrez l'\u00e9quipe, les membres et les partenaires de CAP Entrepreneurs. En virtuel et en personne.",
  },
  {
    date: "3 oct. 2026",
    title: "Journ\u00e9e de d\u00e9monstration Marketplace Lab",
    detail: "Les participants de la cohorte d'automne pr\u00e9sentent leurs entreprises pr\u00eates pour le march\u00e9 aux partenaires et financeurs.",
  },
  {
    date: "21 nov. 2026",
    title: "Table ronde des partenaires : innovation rurale",
    detail: "Municipalit\u00e9s, agences et organismes fa\u00e7onnant les \u00e9cosyst\u00e8mes entrepreneuriaux ruraux.",
  },
];

export const MEMBER_BENEFITS_FR = [
  "Perfectionnement professionnel",
  "R\u00e9seautage",
  "Occasions d'apprentissage",
  "Visibilit\u00e9 d'affaires",
  "Collaborations internationales",
  "\u00c9v\u00e9nements communautaires",
  "Acc\u00e8s aux occasions des partenaires",
];

export const PARTNER_TYPES_FR = [
  { name: "Partenaires Corporatifs", detail: "Investissez dans la création d'opportunités mesurables et générez une valeur partagée." },
  { name: "Partenaires Institutionnels", detail: "Alignez les programmes avec les priorités de croissance régionale et les objectifs d'impact public." },
  { name: "ONG & Entreprises Sociales", detail: "Collaborez sur des missions communes et maximisez l'impact communautaire." },
  { name: "Partenaires de Connaissances", detail: "Co-concevez des expériences d'apprentissage, des parcours de certification et de la recherche." },
];

export const STORIES_AR = STORIES_FR;
export const NEWS_AR = NEWS_FR;
export const EVENTS_AR = EVENTS_FR;
export const MEMBER_BENEFITS_AR = MEMBER_BENEFITS_FR;
export const PARTNER_TYPES_AR = [
  { name: "شركاء الشركات", detail: "استثمر في خلق فرص قابلة للقياس وتوليد قيمة مشتركة." },
  { name: "الشركاء المؤسسيون", detail: "مواءمة البرامج مع أولويات النمو الإقليمي وأهداف التأثير العام." },
  { name: "المنظمات غير الحكومية والمؤسسات الاجتماعية", detail: "التعاون في المهام المشتركة وتعظيم التأثير المجتمعي." },
  { name: "شركاء المعرفة", detail: "شارك في تصميم تجارب التعلم ومسارات الشهادات والبحث." },
];
