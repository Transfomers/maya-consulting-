export const IMAGES = {
  hero: "https://images.unsplash.com/photo-1502252430442-aac78f397426?crop=entropy&cs=srgb&fm=jpg&ixid=M3w3NDQ2Mzl8MHwxfHNlYXJjaHwyfHxjYW5hZGlhbiUyMG5hdHVyZSUyMHBpbmUlMjB0cmVlcyUyMGZvZ3xlbnwwfHx8fDE3ODYxNTI0MDF8MA&ixlib=rb-4.1.0&q=85",
  collaboration: "https://images.unsplash.com/photo-1568992688065-536aad8a12f6?crop=entropy&cs=srgb&fm=jpg&ixid=M3w4NjY2NzF8MHwxfHNlYXJjaHwzfHxkaXZlcnNlJTIwZW50cmVwcmVuZXVycyUyMGNvbGxhYm9yYXRpbmd8ZW58MHx8fHwxNzg2MTUyMzkxfDA&ixlib=rb-4.1.0&q=85",
  board: "https://images.unsplash.com/photo-1622675363311-3e1904dc1885?crop=entropy&cs=srgb&fm=jpg&ixid=M3w4NjY2NzF8MHwxfHNlYXJjaHwxfHxkaXZlcnNlJTIwZW50cmVwcmVuZXVycyUyMGNvbGxhYm9yYXRpbmd8ZW58MHx8fHwxNzg2MTUyMzkxfDA&ixlib=rb-4.1.0&q=85",
  workshop: "https://images.unsplash.com/photo-1515168833906-d2a3b82b302a?crop=entropy&cs=srgb&fm=jpg&ixid=M3w4NjA2MDV8MHwxfHNlYXJjaHwyfHxwcm9mZXNzaW9uYWwlMjB3b3Jrc2hvcCUyMGV2ZW50fGVufDB8fHx8MTc4NjE1MjM5MHww&ixlib=rb-4.1.0&q=85",
  building: "https://images.unsplash.com/photo-1487958449943-2429e8be8625?crop=entropy&cs=srgb&fm=jpg&ixid=M3w4NjAzNzl8MHwxfHNlYXJjaHwyfHxtb2Rlcm4lMjBhcmNoaXRlY3R1cmUlMjBidWlsZGluZ3xlbnwwfHx8fDE3ODYxNTIzOTB8MA&ixlib=rb-4.1.0&q=85",
  portraitM: "https://images.unsplash.com/photo-1560250097-0b93528c311a?crop=entropy&cs=srgb&fm=jpg&ixid=M3w4NjAzNDR8MHwxfHNlYXJjaHwxfHxwcm9mZXNzaW9uYWwlMjBwb3J0cmFpdCUyMGNvbmZpZGVudHxlbnwwfHx8fDE3ODYxNTI0MDF8MA&ixlib=rb-4.1.0&q=85",
  portraitF: "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?crop=entropy&cs=srgb&fm=jpg&ixid=M3w4NjAzNDR8MHwxfHNlYXJjaHwyfHxwcm9mZXNzaW9uYWwlMjBwb3J0cmFpdCUyMGNvbmZpZGVudHxlbnwwfHx8fDE3ODYxNTI0MDF8MA&ixlib=rb-4.1.0&q=85",
};

export const PROGRAMS = [
  {
    id: "cap-executive",
    number: "01",
    name: "CAP Executive",
    theme: "Strengthening nonprofit leadership",
    purpose:
      "A learning experience that supports nonprofit organizations in improving governance, strategic planning, board engagement and partnership development.",
    outcomes: [
      "Stronger governance and board engagement",
      "Improved organizational sustainability",
      "Increased collaboration across the sector",
    ],
    image: IMAGES.board,
  },
  {
    id: "marketplace-lab",
    number: "02",
    name: "Marketplace Lab",
    theme: "Helping entrepreneurs transform ideas into market-ready businesses",
    purpose:
      "Marketplace Lab combines entrepreneurial education, digital commerce, rural innovation and international business exposure. Participants develop practical skills while preparing to access trade fairs, festivals and commercial opportunities through the CAP Entrepreneurs partner network.",
    outcomes: [
      "Practical, market-ready business skills",
      "Access to trade fairs, festivals and commercial opportunities",
      "International business experience supported through an exposure scholarship of up to CAD $8,000, subject to program eligibility and available funding",
    ],
    image: IMAGES.workshop,
  },
  {
    id: "cap-global-mobility",
    number: "03",
    name: "CAP Global Mobility",
    theme: "Creating international opportunities",
    purpose:
      "This program develops partnerships allowing entrepreneurs, volunteers and nonprofit organizations to participate in international exchanges, volunteering initiatives and collaborative projects.",
    outcomes: [
      "International exchanges and volunteering initiatives",
      "Intercultural learning and collaboration",
      "Entrepreneurship beyond borders",
    ],
    image: IMAGES.building,
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
  { name: "Educational institutions", detail: "Co-design learning experiences and credential pathways." },
  { name: "Municipalities", detail: "Build entrepreneurial capacity that strengthens local economies." },
  { name: "Economic development agencies", detail: "Align programs with regional growth priorities." },
  { name: "Nonprofit organizations", detail: "Collaborate on shared missions and community impact." },
  { name: "Corporate sponsors", detail: "Invest in measurable opportunity creation." },
  { name: "International organizations", detail: "Open exchanges, missions and markets beyond borders." },
  { name: "Technology partners", detail: "Make entrepreneurial support accessible and scalable." },
];

export const PROGRAMS_FR = [
  {
    id: "cap-executive",
    number: "01",
    name: "CAP Executive",
    theme: "Renforcer le leadership des organismes \u00e0 but non lucratif",
    purpose:
      "Une exp\u00e9rience d'apprentissage qui aide les organismes \u00e0 but non lucratif \u00e0 am\u00e9liorer leur gouvernance, leur planification strat\u00e9gique, l'engagement de leur conseil d'administration et le d\u00e9veloppement de partenariats.",
    outcomes: [
      "Gouvernance et engagement du conseil renforc\u00e9s",
      "Viabilit\u00e9 organisationnelle am\u00e9lior\u00e9e",
      "Collaboration accrue dans tout le secteur",
    ],
    image: IMAGES.board,
  },
  {
    id: "marketplace-lab",
    number: "02",
    name: "Marketplace Lab",
    theme: "Aider les entrepreneurs \u00e0 transformer leurs id\u00e9es en entreprises pr\u00eates pour le march\u00e9",
    purpose:
      "Marketplace Lab combine \u00e9ducation entrepreneuriale, commerce num\u00e9rique, innovation rurale et exposition aux affaires internationales. Les participants d\u00e9veloppent des comp\u00e9tences pratiques tout en se pr\u00e9parant \u00e0 acc\u00e9der \u00e0 des foires commerciales, des festivals et des occasions d'affaires gr\u00e2ce au r\u00e9seau de partenaires de CAP Entrepreneurs.",
    outcomes: [
      "Comp\u00e9tences pratiques pr\u00eates pour le march\u00e9",
      "Acc\u00e8s \u00e0 des foires commerciales, festivals et occasions d'affaires",
      "Exp\u00e9rience d'affaires internationale appuy\u00e9e par une bourse de rayonnement pouvant atteindre 8 000 $ CA, sous r\u00e9serve de l'admissibilit\u00e9 au programme et du financement disponible",
    ],
    image: IMAGES.workshop,
  },
  {
    id: "cap-global-mobility",
    number: "03",
    name: "CAP Global Mobility",
    theme: "Cr\u00e9er des d\u00e9bouch\u00e9s internationaux",
    purpose:
      "Ce programme d\u00e9veloppe des partenariats permettant aux entrepreneurs, b\u00e9n\u00e9voles et organismes \u00e0 but non lucratif de participer \u00e0 des \u00e9changes internationaux, des initiatives de b\u00e9n\u00e9volat et des projets collaboratifs.",
    outcomes: [
      "\u00c9changes internationaux et initiatives de b\u00e9n\u00e9volat",
      "Apprentissage interculturel et collaboration",
      "L'entrepreneuriat au-del\u00e0 des fronti\u00e8res",
    ],
    image: IMAGES.building,
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
      "Les participants sont revenus avec de nouveaux contacts de distribution, des comp\u00e9tences interculturelles et deux collaborations transfrontali\u00e8res actives.",
    future:
      "L'\u00e9change devient une mission annuelle, avec des placements de b\u00e9n\u00e9volat ouverts aux membres l'an prochain.",
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
  { name: "\u00c9tablissements d'enseignement", detail: "Co-concevoir des exp\u00e9riences d'apprentissage et des parcours de certification." },
  { name: "Municipalit\u00e9s", detail: "D\u00e9velopper la capacit\u00e9 entrepreneuriale qui renforce les \u00e9conomies locales." },
  { name: "Agences de d\u00e9veloppement \u00e9conomique", detail: "Aligner les programmes sur les priorit\u00e9s de croissance r\u00e9gionales." },
  { name: "Organismes \u00e0 but non lucratif", detail: "Collaborer \u00e0 des missions communes et \u00e0 l'impact communautaire." },
  { name: "Commanditaires d'entreprise", detail: "Investir dans la cr\u00e9ation d'occasions mesurables." },
  { name: "Organisations internationales", detail: "Ouvrir des \u00e9changes, des missions et des march\u00e9s au-del\u00e0 des fronti\u00e8res." },
  { name: "Partenaires technologiques", detail: "Rendre le soutien entrepreneurial accessible et \u00e9volutif." },
];

export const STORIES_AR = STORIES_FR;
export const NEWS_AR = NEWS_FR;
export const EVENTS_AR = EVENTS_FR;
export const MEMBER_BENEFITS_AR = MEMBER_BENEFITS_FR;
export const PARTNER_TYPES_AR = PARTNER_TYPES_FR;
