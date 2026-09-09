import re

with open("frontend/src/lib/i18n.jsx", "r") as f:
    content = f.read()

en_join = """    join: {
      eyebrow: "Join the Ecosystem",
      h1a: "Find your ",
      h1accent: "pathway",
      intro: "Complete this short questionnaire to discover the best way for you or your organization to engage with CAP Entrepreneurs.",
      q1Title: "Are you an individual or an organization?",
      optIndividual: "Individual",
      optOrganization: "Organization",
      q2IndivTitle: "Are you looking to develop skills or volunteer?",
      optDevelopSkills: "Develop skills",
      optVolunteer: "Volunteer",
      q2OrgTitle: "Are you a nonprofit, startup, or corporate?",
      optNonprofit: "Nonprofit",
      optStartup: "Startup",
      optCorporate: "Corporate",
      q3Title: "Where are you located?",
      optQuebec: "Quebec",
      optCanada: "Rest of Canada",
      optIntl: "International",
      back: "\u2190 Back",
      recommendedTitle: "Your Recommended Pathway",
      retake: "Retake Questionnaire",
      recGeneral: "We recommend you explore our general programs.",
      recGeneralAction: "Explore Programs",
      recVolunteer: "We recommend you check out the Volunteer page.",
      recVolunteerAction: "Become a Volunteer",
      recSkills: "We recommend you explore CAP Green Lab and our other skills programs.",
      recSkillsAction: "View Programs",
      recPartner: "We recommend you connect with our Partnerships team.",
      recPartnerAction: "Contact Partnerships",
      recCorporate: "We recommend you explore Corporate or Startup partnerships.",
      recCorporateAction: "View Partners"
    },
"""

fr_join = """    join: {
      eyebrow: "Rejoindre l'écosystème",
      h1a: "Trouvez votre ",
      h1accent: "parcours",
      intro: "Répondez à ce court questionnaire pour découvrir la meilleure façon pour vous ou votre organisation de vous impliquer avec CAP Entrepreneurs.",
      q1Title: "Êtes-vous un individu ou une organisation ?",
      optIndividual: "Individu",
      optOrganization: "Organisation",
      q2IndivTitle: "Cherchez-vous à développer des compétences ou à faire du bénévolat ?",
      optDevelopSkills: "Développer des compétences",
      optVolunteer: "Bénévolat",
      q2OrgTitle: "Êtes-vous une association, une startup ou une grande entreprise ?",
      optNonprofit: "Association",
      optStartup: "Startup",
      optCorporate: "Grande entreprise",
      q3Title: "Où êtes-vous situé(e) ?",
      optQuebec: "Québec",
      optCanada: "Reste du Canada",
      optIntl: "International",
      back: "\u2190 Retour",
      recommendedTitle: "Votre parcours recommandé",
      retake: "Refaire le questionnaire",
      recGeneral: "Nous vous recommandons d'explorer nos programmes généraux.",
      recGeneralAction: "Explorer les programmes",
      recVolunteer: "Nous vous recommandons de consulter la page Bénévolat.",
      recVolunteerAction: "Devenir Bénévole",
      recSkills: "Nous vous recommandons d'explorer CAP Green Lab et nos autres programmes de compétences.",
      recSkillsAction: "Voir les programmes",
      recPartner: "Nous vous recommandons de contacter notre équipe des partenariats.",
      recPartnerAction: "Contacter les partenariats",
      recCorporate: "Nous vous recommandons d'explorer les partenariats Corporate ou Startup.",
      recCorporateAction: "Voir les partenaires"
    },
"""

ar_join = """    join: {
      eyebrow: "انضم إلى النظام البيئي",
      h1a: "اكتشف ",
      h1accent: "مسارك",
      intro: "أكمل هذا الاستبيان القصير لاكتشاف أفضل طريقة لك أو لمؤسستك للمشاركة مع رواد أعمال كاب.",
      q1Title: "هل أنت فرد أم مؤسسة؟",
      optIndividual: "فرد",
      optOrganization: "مؤسسة",
      q2IndivTitle: "هل تتطلع إلى تطوير المهارات أم التطوع؟",
      optDevelopSkills: "تطوير المهارات",
      optVolunteer: "تطوع",
      q2OrgTitle: "هل أنت منظمة غير ربحية، شركة ناشئة، أم شركة كبرى؟",
      optNonprofit: "غير ربحية",
      optStartup: "شركة ناشئة",
      optCorporate: "شركة كبرى",
      q3Title: "أين تقع؟",
      optQuebec: "كيبيك",
      optCanada: "بقية كندا",
      optIntl: "دولي",
      back: "\u2190 رجوع",
      recommendedTitle: "المسار الموصى به لك",
      retake: "إعادة الاستبيان",
      recGeneral: "نوصيك باستكشاف برامجنا العامة.",
      recGeneralAction: "استكشاف البرامج",
      recVolunteer: "نوصيك بالاطلاع على صفحة التطوع.",
      recVolunteerAction: "كن متطوعًا",
      recSkills: "نوصيك باستكشاف CAP Green Lab وبرامج المهارات الأخرى.",
      recSkillsAction: "عرض البرامج",
      recPartner: "نوصيك بالتواصل مع فريق الشراكات لدينا.",
      recPartnerAction: "تواصل مع الشراكات",
      recCorporate: "نوصيك باستكشاف شراكات الشركات أو الشركات الناشئة.",
      recCorporateAction: "عرض الشركاء"
    },
"""

parts = content.split("    donate: {")
if len(parts) == 4:
    new_content = parts[0] + en_join + "    donate: {" + parts[1] + fr_join + "    donate: {" + parts[2] + ar_join + "    donate: {" + parts[3]
    with open("frontend/src/lib/i18n.jsx", "w") as f:
        f.write(new_content)
    print("Updated i18n.jsx")
else:
    print("Could not find 3 donate keys")
