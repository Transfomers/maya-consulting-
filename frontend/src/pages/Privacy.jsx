import React, { useState } from "react";
import { Link } from "react-router-dom";
import { 
  ShieldCheck, Calendar, Mail, Globe, 
  ArrowLeft, Search, Lock, CheckCircle2, 
  ExternalLink, ChevronRight, FileText, Printer 
} from "lucide-react";
import { useLang } from "@/lib/i18n";
import { Reveal } from "@/components/motion";

export const PRIVACY_POLICY_EN = {
  title: "Privacy Policy",
  organization: "3M SERVICES",
  effectiveDate: "15 October 2026",
  lastUpdated: "15 October 2026",
  website: "https://3mservice.shop",
  contactEmail: "contact@3mservices.cm",
  intro: "3M SERVICES est engagé à respecter votre vie privée et à protéger vos données personnelles. Cette politique de confidentialité détaille nos engagements concernant le traitement de vos informations pour nos services automobiles et locations à Yaoundé.",
  sections: [
    {
      id: "section-1",
      number: "1",
      title: "Introduction",
      paragraphs: [
        "CAP Entrepreneurs (“CAP Entrepreneurs,” “CAP,” “we,” “our,” or “us”) is committed to respecting your privacy and protecting the personal information entrusted to us.",
        "This Privacy Policy explains how we collect, use, store, disclose, and protect personal information when you visit our website, contact our organization, participate in our activities, apply to volunteer, register for events, subscribe to communications, or engage with our programs and partnerships.",
        "We aim to handle personal information responsibly, transparently, and only for legitimate purposes connected with our activities.",
        "By using our website, you acknowledge that you have had the opportunity to read this Privacy Policy. Where consent is legally required, we will request it separately. Simply visiting our website does not constitute consent to optional marketing or non-essential cookies."
      ]
    },
    {
      id: "section-2",
      number: "2",
      title: "Who We Are",
      paragraphs: [
        "CAP Entrepreneurs is the organization responsible for the personal information processed through its website and activities, subject to any arrangements that may apply to specific programs or services.",
        "For questions about this Privacy Policy or the processing of your personal information, contact:"
      ],
      contactBox: {
        email: "contact@capentrepreneurs.org",
        website: "https://capentrepreneurs.org",
        note: "Our full legal name, registered address, country of registration, and any applicable registration details should be published here once confirmed."
      }
    },
    {
      id: "section-3",
      number: "3",
      title: "Personal Information We Collect",
      paragraphs: [
        "The information we collect depends on how you interact with CAP Entrepreneurs."
      ],
      subsections: [
        {
          id: "section-3-1",
          number: "3.1",
          title: "Information you provide directly",
          text: "We may collect the following information when you contact us, complete a form, register for an event, or participate in a program:",
          items: [
            "Identity information: name, surname, and professional title.",
            "Contact information: email address, telephone number, country, city, and organization.",
            "Professional information: professional experience, business activities, skills, areas of interest, and organizational affiliation.",
            "Participation information: event registrations, membership or volunteer applications, program participation, and communications with our team.",
            "Application information: information you provide when applying to volunteer, collaborate, mentor, participate in a program, or explore a partnership.",
            "Communication preferences: newsletter subscriptions, marketing preferences, and consent records.",
            "Donation or transaction information: where applicable, information necessary to administer a donation or payment. Payment card details should be handled by the relevant payment provider rather than stored by CAP Entrepreneurs unless a verified, secure arrangement requires otherwise."
          ],
          closingText: "Please provide only information that is relevant to your request or participation."
        },
        {
          id: "section-3-2",
          number: "3.2",
          title: "Information collected automatically",
          text: "When you visit our website, certain technical information may be collected automatically, depending on the website's configuration and the services enabled. This may include:",
          items: [
            "IP address and approximate location derived from it.",
            "Browser type, operating system, and device information.",
            "Pages visited, navigation activity, referring websites, and timestamps.",
            "Website performance, diagnostic information, and security logs.",
            "Cookie identifiers and analytics information, where applicable."
          ],
          closingText: "We do not assume that every category listed above is collected. Actual collection depends on the technologies installed and activated on our website."
        },
        {
          id: "section-3-3",
          number: "3.3",
          title: "Information received from third parties",
          text: "Where appropriate and lawful, we may receive relevant information from:",
          items: [
            "Organizations that refer participants to our programs.",
            "Event organizers, institutional partners, or collaborating organizations.",
            "Professional networking platforms when you interact with our public profiles.",
            "Service providers that support registrations, communications, or program administration."
          ],
          closingText: "We will use such information only for appropriate purposes and in accordance with applicable requirements."
        }
      ]
    },
    {
      id: "section-4",
      number: "4",
      title: "How We Use Personal Information",
      paragraphs: [
        "CAP Entrepreneurs may process personal information for the following purposes:"
      ],
      items: [
        "Responding to inquiries: answering messages, requests, and questions submitted through our website or other official channels.",
        "Managing participation: administering memberships, volunteer applications, event registrations, mentoring, and program participation, where these activities are offered.",
        "Building professional connections: facilitating relevant introductions, networking, and collaboration between entrepreneurs, mentors, organizations, and partners.",
        "Communicating opportunities: sharing information about events, initiatives, training, resources, and opportunities related to our activities.",
        "Sending newsletters: distributing newsletters and updates to individuals who have subscribed or where another lawful basis applies.",
        "Managing partnerships: coordinating activities with institutions, sponsors, donors, and other collaborating organizations.",
        "Improving our website: understanding website performance, identifying technical problems, and improving accessibility and usability.",
        "Maintaining security: detecting abuse, preventing unauthorized access, protecting our systems, and investigating incidents.",
        "Meeting legal obligations: maintaining necessary records, responding to lawful requests, and exercising or defending legal claims where applicable."
      ],
      closingText: "We will not knowingly use personal information for purposes incompatible with those explained in this policy without providing appropriate notice or obtaining consent where required."
    },
    {
      id: "section-5",
      number: "5",
      title: "Legal Grounds for Processing",
      paragraphs: [
        "Where applicable law requires a legal basis for processing personal information, CAP Entrepreneurs will rely on the basis appropriate to the specific activity. These may include:"
      ],
      items: [
        "Consent: when you voluntarily subscribe to a newsletter, accept optional cookies, or authorize another activity requiring consent.",
        "Legitimate interests: for appropriate organizational administration, security, and relevant professional communications, provided those interests do not override your rights.",
        "Steps requested by you: when processing is necessary to respond to your application, registration, or request.",
        "Legal obligations: when information must be processed or retained to comply with applicable law.",
        "Other lawful grounds: where recognized by the data protection rules applicable to the particular activity."
      ],
      closingText: "Where processing relies on consent, you may withdraw that consent at any time. Withdrawal does not affect the lawfulness of processing carried out before withdrawal."
    },
    {
      id: "section-6",
      number: "6",
      title: "Newsletters and Organizational Communications",
      paragraphs: [
        "If you subscribe to communications from CAP Entrepreneurs, we may use your contact information to send updates about our activities, events, programs, resources, and relevant opportunities.",
        "You can unsubscribe at any time by using the unsubscribe link included in the email, where available, or by contacting contact@capentrepreneurs.org.",
        "Unsubscribing from newsletters will not necessarily stop essential administrative messages relating to an event, application, or service you have requested.",
        "We will not treat a volunteer application, event registration, or general inquiry as automatic permission to send unrelated promotional communications where consent or another lawful basis is required."
      ]
    },
    {
      id: "section-7",
      number: "7",
      title: "How We Share Personal Information",
      paragraphs: [
        "CAP Entrepreneurs does not intend to sell personal information to third parties.",
        "We may disclose relevant information in the following circumstances:"
      ],
      subsections: [
        {
          id: "section-7-1",
          number: "7.1",
          title: "Service providers",
          text: "We may use trusted service providers for website hosting, email delivery, forms, event registration, communications, analytics, security, and other administrative functions. These providers may process information on our behalf, subject to appropriate contractual and security arrangements where required."
        },
        {
          id: "section-7-2",
          number: "7.2",
          title: "Program and institutional partners",
          text: "Where necessary for a specific program, we may share relevant information with a participating organization, mentor, event organizer, or institutional partner. We will limit the information shared to what is necessary and provide appropriate notice or obtain consent where required. We will not assume that participation in one activity authorizes unrestricted sharing with every partner."
        },
        {
          id: "section-7-3",
          number: "7.3",
          title: "Legal and safety requirements",
          text: "We may disclose information when reasonably necessary to comply with applicable law, respond to valid legal process, protect the rights and safety of individuals, or investigate suspected fraud, abuse, or security incidents."
        },
        {
          id: "section-7-4",
          number: "7.4",
          title: "Organizational changes",
          text: "If CAP Entrepreneurs undergoes a lawful restructuring or transfer of relevant activities, information may be transferred only where appropriate safeguards and applicable legal requirements are satisfied.",
          closingText: "We remain responsible for ensuring that any disclosure has an appropriate legal basis."
        }
      ]
    },
    {
      id: "section-8",
      number: "8",
      title: "International Data Transfers",
      paragraphs: [
        "Some service providers or collaborating organizations may operate outside your country of residence.",
        "Where personal information is transferred internationally, CAP Entrepreneurs will take the measures required by applicable law, which may include assessing the destination, using appropriate contractual safeguards, limiting access, and informing affected individuals where required.",
        "The countries in which our website hosting, email, analytics, and other service providers store or process information should be identified once those services have been verified."
      ]
    },
    {
      id: "section-9",
      number: "9",
      title: "Cookies and Similar Technologies",
      paragraphs: [
        "Our website may use cookies or similar technologies to support essential functionality, remember preferences, improve performance, or measure website usage.",
        "Cookies may fall into the following categories:"
      ],
      items: [
        "Essential cookies: necessary for core website functionality, security, or user-requested services.",
        "Preference cookies: remember choices such as language or other settings.",
        "Analytics cookies: help us understand how visitors use the website.",
        "Marketing cookies: may support advertising measurement or personalized marketing if such technologies are enabled."
      ],
      closingText: "Where required, non-essential cookies will be activated only after the visitor has provided the appropriate consent. You may be able to manage cookies through our website's consent settings and your browser settings. Disabling certain cookies may affect some website features.\n\nImplementation requirement: CAP Entrepreneurs should verify which cookies and tracking technologies are actually installed and configure a consent mechanism appropriate to the applicable legal requirements before publishing claims about specific cookies."
    },
    {
      id: "section-10",
      number: "10",
      title: "Data Retention",
      paragraphs: [
        "We retain personal information only for as long as reasonably necessary for the purposes for which it was collected, taking account of applicable legal requirements, operational needs, security, and dispute resolution.",
        "Retention periods will depend on the type of information and the reason it is held. For example:"
      ],
      items: [
        "General inquiries: until the inquiry has been resolved and any reasonable follow-up period has elapsed.",
        "Volunteer and program applications: for the duration of the application or program process and any justified subsequent retention period.",
        "Event registrations: for event administration, follow-up, and any necessary organizational records.",
        "Newsletter subscriptions: until you unsubscribe or the subscription is otherwise discontinued, subject to limited records needed to respect your preferences.",
        "Technical and security logs: for a period appropriate to security monitoring, troubleshooting, and applicable obligations.",
        "Financial and legal records: for the period required by applicable accounting, legal, or regulatory requirements, where relevant."
      ],
      closingText: "When information is no longer needed, we will take reasonable steps to delete it, anonymize it, or securely restrict access to it. CAP Entrepreneurs should establish and document specific retention periods for each category of information it actually collects."
    },
    {
      id: "section-11",
      number: "11",
      title: "Data Security",
      paragraphs: [
        "CAP Entrepreneurs takes reasonable technical and organizational measures to protect personal information against unauthorized access, accidental loss, alteration, disclosure, destruction, and misuse.",
        "Depending on the systems in use, appropriate measures may include:"
      ],
      items: [
        "Restricting access to authorized individuals.",
        "Using strong passwords and multifactor authentication where available.",
        "Keeping software and website components updated.",
        "Protecting administrative accounts and access credentials.",
        "Using secure connections and appropriate backups.",
        "Reviewing third-party services and access permissions.",
        "Providing appropriate guidance to individuals handling personal information.",
        "Responding to suspected security incidents."
      ],
      closingText: "No method of transmitting or storing information can be guaranteed to be completely secure. We will take reasonable steps to address incidents and comply with any applicable notification requirements."
    },
    {
      id: "section-12",
      number: "12",
      title: "Your Privacy Rights",
      paragraphs: [
        "Depending on the laws applicable to your circumstances, you may have the right to:"
      ],
      items: [
        "Request access to personal information we hold about you.",
        "Request correction of inaccurate or incomplete information.",
        "Request deletion of personal information where legally available.",
        "Object to certain processing activities.",
        "Request restriction of certain processing.",
        "Request a copy of information in a portable format where applicable.",
        "Withdraw consent where processing relies on consent.",
        "Unsubscribe from optional communications.",
        "Lodge a complaint with a competent data protection authority, where available."
      ],
      closingText: "These rights may be subject to legal exceptions and verification requirements. To submit a request, email contact@capentrepreneurs.org with the subject line “Privacy Request.” Please explain the nature of your request and provide enough information for us to identify the relevant records. We may request proportionate additional information to verify your identity. We will respond within the period required by applicable law. We will not request unnecessary identification documents or use identity verification as an unreasonable barrier to exercising your rights."
    },
    {
      id: "section-13",
      number: "13",
      title: "Children's Privacy",
      paragraphs: [
        "CAP Entrepreneurs' activities may be relevant to young people. However, we do not knowingly collect personal information from children in circumstances where doing so would be unlawful.",
        "Where an activity involves minors, we will implement appropriate safeguards and obtain parental or guardian authorization when required by applicable law.",
        "If you believe that a child has provided personal information inappropriately, please contact contact@capentrepreneurs.org so that we can review the situation and take appropriate action."
      ]
    },
    {
      id: "section-14",
      number: "14",
      title: "Third-Party Websites and Social Media",
      paragraphs: [
        "Our website may contain links to external websites, registration platforms, partner websites, and social media services.",
        "Those services operate under their own privacy policies and practices. CAP Entrepreneurs does not control their independent processing of personal information.",
        "When you follow an external link, submit information to a partner, or interact with our social media pages, you should review the relevant provider's privacy information.",
        "The presence of a link or partnership does not necessarily mean that CAP Entrepreneurs endorses every privacy or security practice of the external service."
      ]
    },
    {
      id: "section-15",
      number: "15",
      title: "Photographs, Videos, and Public Communications",
      paragraphs: [
        "CAP Entrepreneurs may document events, activities, and initiatives through photographs, videos, interviews, or testimonials.",
        "Where these materials identify individuals, we will handle their collection and publication in accordance with applicable law and any required notices, permissions, or consent.",
        "We will take particular care with images or information involving minors and other situations requiring additional safeguards.",
        "If you have a concern about identifiable material published by CAP Entrepreneurs, contact contact@capentrepreneurs.org and explain the material concerned. We will review the request and take appropriate action where required."
      ]
    },
    {
      id: "section-16",
      number: "16",
      title: "Automated Decision-Making",
      paragraphs: [
        "CAP Entrepreneurs does not intend to make decisions producing legal or similarly significant effects on individuals solely through automated processing unless the activity has been appropriately assessed and the requirements of applicable law are satisfied.",
        "If such processing is introduced, we will provide the information and safeguards required by law."
      ]
    },
    {
      id: "section-17",
      number: "17",
      title: "Changes to This Privacy Policy",
      paragraphs: [
        "We may update this Privacy Policy to reflect changes in our activities, website functionality, service providers, or legal obligations.",
        "The revised version will be published on this page with an updated “Last updated” date. Where required, we will provide additional notice or seek renewed consent before introducing a new processing activity that requires it.",
        "We encourage visitors to review this page periodically."
      ]
    },
    {
      id: "section-18",
      number: "18",
      title: "Contact Us",
      paragraphs: [
        "For questions, concerns, or requests relating to this Privacy Policy or the handling of your personal information, contact:"
      ],
      contactBox: {
        organization: "CAP Entrepreneurs",
        website: "https://capentrepreneurs.org",
        email: "contact@capentrepreneurs.org",
        subject: "Privacy Request",
        closing: "This Privacy Policy should be read alongside any applicable terms of use, event registration notices, consent forms, and other privacy notices provided for specific activities."
      }
    }
  ]
};

export const PRIVACY_POLICY_FR = {
  title: "Politique de Confidentialité",
  organization: "CAP Entrepreneurs",
  effectiveDate: "15 octobre 2026",
  lastUpdated: "15 octobre 2026",
  website: "https://capentrepreneurs.org",
  contactEmail: "contact@capentrepreneurs.org",
  intro: "CAP Entrepreneurs s'engage à respecter votre vie privée et à protéger les renseignements personnels qui lui sont confiés. La présente politique explique nos pratiques en matière de collecte, d'utilisation, de conservation et de protection de vos données.",
  sections: [
    {
      id: "section-1",
      number: "1",
      title: "Introduction",
      paragraphs: [
        "CAP Entrepreneurs (« CAP Entrepreneurs », « CAP », « nous », « notre » ou « nos ») s'engage à respecter votre vie privée et à protéger les renseignements personnels qui lui sont confiés.",
        "La présente Politique de confidentialité explique comment nous recueillons, utilisons, conservons, communiquons et protégeons les renseignements personnels lorsque vous visitez notre site Web, communiquez avec notre organisme, participez à nos activités, soumettez une candidature bénévole, vous inscrivez à des événements, vous abonnez à nos communications ou participez à nos programmes et partenariats.",
        "Nous nous efforçons de traiter les renseignements personnels de manière responsable, transparente et uniquement à des fins légitimes liées à nos activités.",
        "En utilisant notre site Web, vous reconnaissez avoir eu la possibilité de prendre connaissance de la présente Politique de confidentialité. Lorsqu'un consentement est légalement requis, nous vous le demanderons séparément. La simple consultation de notre site Web ne constitue pas un consentement à des communications marketing optionnelles ni à des témoins (cookies) non essentiels."
      ]
    },
    {
      id: "section-2",
      number: "2",
      title: "Qui sommes-nous ?",
      paragraphs: [
        "CAP Entrepreneurs est l'organisme responsable des renseignements personnels traités par l'intermédiaire de son site Web et de ses activités, sous réserve d'ententes particulières pouvant s'appliquer à des programmes ou services spécifiques.",
        "Pour toute question relative à la présente Politique de confidentialité ou au traitement de vos renseignements personnels, veuillez communiquer avec :"
      ],
      contactBox: {
        email: "contact@capentrepreneurs.org",
        website: "https://capentrepreneurs.org",
        note: "Notre dénomination sociale complète, notre siège social enregistré et nos informations d'immatriculation applicables sont consultables sur nos canaux officiels."
      }
    },
    {
      id: "section-3",
      number: "3",
      title: "Renseignements personnels que nous recueillons",
      paragraphs: [
        "Les renseignements que nous recueillons dépendent de la nature de vos interactions avec CAP Entrepreneurs."
      ],
      subsections: [
        {
          id: "section-3-1",
          number: "3.1",
          title: "Renseignements fournis directement",
          text: "Nous pouvons recueillir les renseignements suivants lorsque vous communiquez avec nous, remplissez un formulaire, vous inscrivez à un événement ou participez à un programme :",
          items: [
            "Renseignements d'identité : prénom, nom et titre professionnel.",
            "Coordonnées : adresse courriel, numéro de téléphone, pays, ville et organisation.",
            "Renseignements professionnels : expérience professionnelle, secteur d'activité, compétences, champs d'intérêt et affiliation organisationnelle.",
            "Renseignements de participation : inscriptions aux événements, candidatures d'adhésion ou de bénévolat, participation aux programmes et échanges avec notre équipe.",
            "Renseignements de candidature : éléments soumis dans le cadre d'un engagement bénévole, d'un mentorat, d'une collaboration ou d'une demande de partenariat.",
            "Préférences de communication : abonnements à l'infolettre, préférences marketing et registres de consentement.",
            "Renseignements transactionnels ou dons : le cas échéant, les données nécessaires à l'administration d'un don ou d'un paiement. Les détails de carte de paiement sont traités directement par le prestataire certifié."
          ],
          closingText: "Veuillez ne fournir que les renseignements strictement pertinents à votre demande ou participation."
        },
        {
          id: "section-3-2",
          number: "3.2",
          title: "Renseignements recueillis automatiquement",
          text: "Lorsque vous visitez notre site Web, certains renseignements techniques peuvent être collectés automatiquement selon la configuration du site :",
          items: [
            "Adresse IP et localisation approximative dérivée.",
            "Type de navigateur, système d'exploitation et informations sur l'appareil.",
            "Pages consultées, parcours de navigation, sites référents et horodatage.",
            "Performances du site Web, diagnostics techniques et journaux de sécurité.",
            "Identifiants de témoins (cookies) et données de mesure d'audience, le cas échéant."
          ],
          closingText: "La collecte réelle dépend des technologies activées sur notre site Web."
        },
        {
          id: "section-3-3",
          number: "3.3",
          title: "Renseignements provenant de tiers",
          text: "Le cas échéant et en toute légalité, nous pouvons recevoir des renseignements pertinents de :",
          items: [
            "Organismes partenaires qui réfèrent des participants à nos programmes.",
            "Organisateurs d'événements, partenaires institutionnels ou entités collaboratrices.",
            "Plateformes professionnelles lorsque vous interagissez avec nos profils publics.",
            "Prestataires de services facilitant les inscriptions et l'administration des programmes."
          ],
          closingText: "Nous utilisons ces informations uniquement à des fins appropriées et conformes aux exigences applicables."
        }
      ]
    },
    {
      id: "section-4",
      number: "4",
      title: "Comment nous utilisons les renseignements personnels",
      paragraphs: [
        "CAP Entrepreneurs peut traiter les renseignements personnels aux fins suivantes :"
      ],
      items: [
        "Répondre aux demandes : traitement des messages, questions et sollicitations reçus par nos canaux officiels.",
        "Gérer la participation : administration des adhésions, dossiers bénévoles, inscriptions aux événements, mentorats et programmes.",
        "Créer des liens professionnels : faciliter le maillage, le réseautage et la coopération entre entrepreneurs, mentors et institutions.",
        "Communiquer les opportunités : diffusion d'informations sur les événements, formations, ressources et initiatives de l'écosystème.",
        "Diffuser les infolettres : envoi de bulletins d'information aux personnes ayant souscrit ou lorsqu'une base légale s'applique.",
        "Piloter les partenariats : coordination avec les partenaires fondateurs, bailleurs de fonds et mécènes.",
        "Améliorer le site Web : analyse des performances, résolution des anomalies et optimisation de l'accessibilité.",
        "Assurer la sécurité : détection des abus, prévention des accès non autorisés et protection de nos infrastructures.",
        "Respecter les obligations légales : tenue des registres réglementaires et conformité légale."
      ],
      closingText: "Nous n'utiliserons jamais sciemment vos données à des fins incompatibles sans préavis approprié ou consentement préalable."
    },
    {
      id: "section-5",
      number: "5",
      title: "Fondements juridiques du traitement",
      paragraphs: [
        "Lorsque la législation applicable l'exige, CAP Entrepreneurs fonde ses traitements sur la base appropriée à chaque activité :"
      ],
      items: [
        "Consentement : abonnement volontaire à l'infolettre ou acceptation de témoins optionnels.",
        "Intérêts légitimes : administration organisationnelle saine, sécurité et communications professionnelles pertinentes.",
        "Démarches à votre demande : traitement nécessaire pour répondre à une candidature, inscription ou sollicitation.",
        "Obligations légales : conservation requise par les lois fiscales, associatives ou corporatives applicables.",
        "Autres fondements légaux : reconnus par les règles de protection des données applicables."
      ],
      closingText: "Vous pouvez retirer votre consentement à tout moment, sans rétroactivité sur les traitements préalablement effectués."
    },
    {
      id: "section-6",
      number: "6",
      title: "Infolettres et communications institutionnelles",
      paragraphs: [
        "Si vous vous abonnez à nos communications, nous pouvons utiliser vos coordonnées pour vous transmettre des nouvelles de nos activités, événements, programmes et ressources.",
        "Vous pouvez vous désabonner à tout moment au moyen du lien de désabonnement inclus dans chaque courriel ou en écrivant à contact@capentrepreneurs.org.",
        "Le désabonnement des infolettres n'interrompt pas les communications administratives essentielles relatives à un dossier, une inscription ou un service en cours.",
        "Une candidature ou une inscription ponctuelle ne constitue jamais une autorisation automatique d'envoi de sollicitations promotionnelles non sollicitées."
      ]
    },
    {
      id: "section-7",
      number: "7",
      title: "Partage des renseignements personnels",
      paragraphs: [
        "CAP Entrepreneurs ne vend aucun renseignement personnel à des tiers.",
        "Nous pouvons communiquer des renseignements pertinents uniquement dans les cas suivants :"
      ],
      subsections: [
        {
          id: "section-7-1",
          number: "7.1",
          title: "Fournisseurs de services",
          text: "Nous faisons appel à des prestataires de confiance pour l'hébergement du site, l'envoi de courriels, la gestion de formulaires, les inscriptions et la sécurité, régis par des engagements contractuels stricts."
        },
        {
          id: "section-7-2",
          number: "7.2",
          title: "Partenaires de programmes et institutionnels",
          text: "Lorsque requis pour un programme précis, nous pouvons partager les informations strictement nécessaires avec un organisme partenaire ou mentor désigné, avec information ou consentement préalable."
        },
        {
          id: "section-7-3",
          number: "7.3",
          title: "Exigences légales et protection",
          text: "Nous pouvons divulguer des renseignements si la loi l'impose ou pour protéger les droits, la sécurité de personnes ou enquêter sur une tentative de fraude ou d'atteinte à la sécurité."
        },
        {
          id: "section-7-4",
          number: "7.4",
          title: "Évolution organisationnelle",
          text: "En cas de restructuration ou de transfert d'activités, les données ne seraient transférées que sous réserve de garanties légales appropriées.",
          closingText: "Nous demeurons responsables de veiller à ce que toute divulgation repose sur une base juridique valide."
        }
      ]
    },
    {
      id: "section-8",
      number: "8",
      title: "Transferts internationaux de données",
      paragraphs: [
        "Certains prestataires ou partenaires peuvent être situés à l'extérieur de votre province ou pays de résidence.",
        "Lorsque des renseignements personnels font l'objet d'un transfert transfrontalier, CAP Entrepreneurs met en œuvre les mesures requises (évaluations des facteurs relatifs à la vie privée, clauses contractuelles types et contrôle d'accès)."
      ]
    },
    {
      id: "section-9",
      number: "9",
      title: "Témoins (cookies) et technologies similaires",
      paragraphs: [
        "Notre site Web peut utiliser des témoins techniques nécessaires, des témoins de préférences linguistiques et des outils d'analyse de performance.",
        "Les témoins non essentiels sont assujettis à votre consentement préalable lorsque requis par la loi. Vous pouvez configurer vos préférences à tout moment dans votre navigateur."
      ]
    },
    {
      id: "section-10",
      number: "10",
      title: "Conservation des données",
      paragraphs: [
        "Nous ne conservons les renseignements personnels que pendant la durée raisonnablement nécessaire aux fins pour lesquelles ils ont été recueillis, conformément aux exigences légales et opérationnelles.",
        "À l'échéance de cette période, les données sont supprimées ou anonymisées de manière sécurisée."
      ]
    },
    {
      id: "section-11",
      number: "11",
      title: "Sécurité des données",
      paragraphs: [
        "CAP Entrepreneurs met en œuvre des mesures techniques et organisationnelles rigoureuses pour protéger les renseignements personnels contre la perte, le vol, l'accès ou la modification non autorisés.",
        "Ces mesures comprennent le chiffrement TLS, la gestion stricte des privilèges d'accès, l'authentification renforcée et la tenue à jour de nos systèmes."
      ]
    },
    {
      id: "section-12",
      number: "12",
      title: "Vos droits relatifs à la vie privée",
      paragraphs: [
        "Selon les lois applicables (notamment au Québec et au Canada), vous disposez des droits suivants :",
        "• Droit d'accès à vos renseignements personnels.",
        "• Droit de rectification des données inexactes ou incomplètes.",
        "• Droit à l'effacement ou au retrait de votre consentement.",
        "• Droit de déposer une plainte auprès de l'autorité compétente de protection des renseignements personnels (ex. Commission d'accès à l'information du Québec, Commissariat à la protection de la vie privée du Canada).",
        "Pour exercer vos droits, écrivez à contact@capentrepreneurs.org avec l'objet « Demande relative à la vie privée ». Nous répondrons dans les délais prévus par la loi."
      ]
    },
    {
      id: "section-13",
      number: "13",
      title: "Protection de la vie privée des mineurs",
      paragraphs: [
        "Nos activités peuvent intéresser des jeunes. Lorsque des activités s'adressent à des personnes mineures, nous recueillons les consentements parentaux ou des tuteurs légaux requis par la législation applicable."
      ]
    },
    {
      id: "section-14",
      number: "14",
      title: "Sites tiers et réseaux sociaux",
      paragraphs: [
        "Notre site Web peut inclure des hyperliens vers des sites externes ou des plateformes tierces qui appliquent leurs propres politiques de confidentialité indépendantes de CAP Entrepreneurs."
      ]
    },
    {
      id: "section-15",
      number: "15",
      title: "Photographies, vidéos et communications publiques",
      paragraphs: [
        "CAP Entrepreneurs peut documenter ses ateliers et événements. Toute diffusion d'images identifiables respecte les règles applicables et les autorisations obtenues auprès des personnes concernées."
      ]
    },
    {
      id: "section-16",
      number: "16",
      title: "Décisions automatisées",
      paragraphs: [
        "CAP Entrepreneurs n'effectue aucune prise de décision produisant des effets juridiques sur les personnes sur la seule base d'un traitement automatisé."
      ]
    },
    {
      id: "section-17",
      number: "17",
      title: "Mises à jour de la présente politique",
      paragraphs: [
        "Nous pouvons actualiser la présente Politique de confidentialité. La date de dernière mise à jour sera indiquée en haut de page. Nous vous encourageons à la consulter périodiquement."
      ]
    },
    {
      id: "section-18",
      number: "18",
      title: "Nous joindre",
      paragraphs: [
        "Pour toute question ou demande concernant la protection de vos renseignements personnels :"
      ],
      contactBox: {
        organization: "CAP Entrepreneurs",
        website: "https://capentrepreneurs.org",
        email: "contact@capentrepreneurs.org",
        subject: "Demande relative à la vie privée",
        closing: "La présente politique doit être lue conjointement avec nos conditions d'utilisation et les avis de consentement spécifiques à chaque programme."
      }
    }
  ]
};

export default function Privacy() {
  const { lang } = useLang();
  const isFrench = lang === "fr";
  const policy = isFrench ? PRIVACY_POLICY_FR : PRIVACY_POLICY_EN;

  const [searchQuery, setSearchQuery] = useState("");
  const [activeSectionId, setActiveSectionId] = useState(policy.sections[0]?.id || "section-1");

  const filteredSections = searchQuery.trim()
    ? policy.sections.filter((sec) => {
        const query = searchQuery.toLowerCase();
        const inTitle = sec.title.toLowerCase().includes(query);
        const inParagraphs = sec.paragraphs?.some((p) => p.toLowerCase().includes(query));
        const inItems = sec.items?.some((i) => i.toLowerCase().includes(query));
        const inSubsections = sec.subsections?.some(
          (sub) =>
            sub.title.toLowerCase().includes(query) ||
            sub.text?.toLowerCase().includes(query) ||
            sub.items?.some((i) => i.toLowerCase().includes(query))
        );
        return inTitle || inParagraphs || inItems || inSubsections;
      })
    : policy.sections;

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="bg-[#FAF9F6] text-[#0D0E0D] min-h-screen selection:bg-maple selection:text-white font-sans">
      
      {/* 1. TOP EDITORIAL HERO BANNER */}
      <section className="border-b border-forest/15 bg-white pt-24 pb-14 px-5 md:px-10 lg:px-16">
        <div className="max-w-6xl mx-auto">
          <Reveal>
            <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
              <Link
                to="/"
                className="inline-flex items-center gap-2 text-xs font-bold uppercase tracking-[0.2em] text-sage hover:text-forest transition-colors"
              >
                <ArrowLeft className="h-3.5 w-3.5" />
                <span>{isFrench ? "Retour à l'accueil" : "Back to Home"}</span>
              </Link>
              <div className="flex items-center gap-2">
                <button
                  onClick={handlePrint}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 border border-forest/20 text-[11px] font-bold uppercase tracking-wider text-forest hover:bg-forest hover:text-bone transition-colors"
                  title="Print this page"
                >
                  <Printer className="h-3.5 w-3.5" />
                  <span>{isFrench ? "Imprimer" : "Print"}</span>
                </button>
              </div>
            </div>

            <div className="inline-flex items-center gap-2 mb-3">
              <ShieldCheck className="h-5 w-5 text-maple" />
              <span className="font-montserrat text-xs font-bold uppercase tracking-[0.28em] text-maple">
                {isFrench ? "CADRE LÉGAL & PROTECTION DES DONNÉES" : "LEGAL FRAMEWORK & DATA PROTECTION"}
              </span>
            </div>

            <h1 className="font-serif text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-normal tracking-tight text-forest mb-4">
              {policy.title}
            </h1>
            <p className="max-w-3xl text-sm sm:text-base text-sage leading-relaxed font-serif">
              {policy.intro}
            </p>

            {/* METADATA BAR */}
            <div className="mt-8 pt-6 border-t border-forest/10 grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs">
              <div>
                <span className="text-[10px] uppercase tracking-widest text-sage block font-bold">
                  {isFrench ? "Organisation" : "Organization"}
                </span>
                <span className="font-semibold text-forest mt-0.5 block">{policy.organization}</span>
              </div>
              <div>
                <span className="text-[10px] uppercase tracking-widest text-sage block font-bold">
                  {isFrench ? "Date d'effet" : "Effective Date"}
                </span>
                <span className="font-semibold text-forest mt-0.5 block">{policy.effectiveDate}</span>
              </div>
              <div>
                <span className="text-[10px] uppercase tracking-widest text-sage block font-bold">
                  {isFrench ? "Dernière mise à jour" : "Last Updated"}
                </span>
                <span className="font-semibold text-forest mt-0.5 block">{policy.lastUpdated}</span>
              </div>
              <div>
                <span className="text-[10px] uppercase tracking-widest text-sage block font-bold">
                  {isFrench ? "Contact officiel" : "Official Contact"}
                </span>
                <a
                  href={`mailto:${policy.contactEmail}`}
                  className="font-semibold text-maple hover:underline mt-0.5 block truncate"
                >
                  {policy.contactEmail}
                </a>
              </div>
            </div>
          </Reveal>
        </div>
      </section>

      {/* 2. MAIN CONTENT WITH STICKY TABLE OF CONTENTS */}
      <section className="max-w-6xl mx-auto px-5 md:px-10 lg:px-16 py-12 sm:py-16">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-start">
          
          {/* LEFT: STICKY TABLE OF CONTENTS (4 cols) */}
          <aside className="lg:col-span-4 sticky top-24 self-start bg-white border border-forest/15 p-6 shadow-xs hidden lg:block max-h-[80vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-forest/10 mb-4">
              <span className="text-xs font-bold uppercase tracking-widest text-forest">
                {isFrench ? "Table des matières" : "Table of Contents"}
              </span>
              <FileText className="h-4 w-4 text-maple" />
            </div>

            {/* Quick search inside policy */}
            <div className="relative mb-4">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-sage pointer-events-none" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder={isFrench ? "Rechercher dans la politique..." : "Search in policy..."}
                className="w-full pl-8 pr-3 py-1.5 border border-forest/15 text-xs bg-[#FAF9F6] focus:border-forest outline-none"
              />
            </div>

            <nav className="space-y-1 text-xs">
              {policy.sections.map((sec) => (
                <a
                  key={sec.id}
                  href={`#${sec.id}`}
                  onClick={() => setActiveSectionId(sec.id)}
                  className={`flex items-start gap-2 py-1.5 px-2 transition-colors ${
                    activeSectionId === sec.id
                      ? "bg-forest/5 text-maple font-bold"
                      : "text-sage hover:text-forest"
                  }`}
                >
                  <span className="font-mono text-[10px] text-sage shrink-0">{sec.number}.</span>
                  <span className="line-clamp-1 leading-snug">{sec.title}</span>
                </a>
              ))}
            </nav>

            <div className="mt-6 pt-4 border-t border-forest/10 text-[11px] text-sage">
              <p className="leading-relaxed">
                {isFrench
                  ? "Une question sur vos droits ? Écrivez à "
                  : "Questions regarding your rights? Contact "}
                <a href={`mailto:${policy.contactEmail}`} className="text-forest font-bold hover:underline">
                  {policy.contactEmail}
                </a>
              </p>
            </div>
          </aside>

          {/* RIGHT: POLICY BODY (8 cols) */}
          <main className="lg:col-span-8 space-y-12">
            
            {/* Mobile Search Filter Alert */}
            {searchQuery.trim() && (
              <div className="bg-maple/10 border border-maple/20 p-3 text-xs text-forest flex items-center justify-between">
                <span>
                  {isFrench ? "Résultats pour : " : "Results for: "}
                  <strong>« {searchQuery} »</strong> ({filteredSections.length} {isFrench ? "section(s)" : "section(s)"})
                </span>
                <button
                  onClick={() => setSearchQuery("")}
                  className="font-bold underline text-xs"
                >
                  {isFrench ? "Effacer" : "Clear"}
                </button>
              </div>
            )}

            {filteredSections.map((sec) => (
              <article
                key={sec.id}
                id={sec.id}
                className="scroll-mt-28 bg-white border border-forest/15 p-6 sm:p-8 lg:p-10 shadow-xs"
              >
                {/* Section Header */}
                <div className="flex items-baseline gap-3 pb-3 border-b border-forest/10 mb-6">
                  <span className="font-serif text-2xl sm:text-3xl italic text-maple font-normal">
                    {sec.number}.
                  </span>
                  <h2 className="font-serif text-xl sm:text-2xl text-forest font-normal tracking-tight">
                    {sec.title}
                  </h2>
                </div>

                {/* Section Paragraphs */}
                {sec.paragraphs && sec.paragraphs.length > 0 && (
                  <div className="space-y-3.5 text-sm sm:text-[15px] leading-relaxed text-[#2C3E2D]">
                    {sec.paragraphs.map((p, idx) => (
                      <p key={idx}>{p}</p>
                    ))}
                  </div>
                )}

                {/* Bullet List Items */}
                {sec.items && sec.items.length > 0 && (
                  <ul className="my-5 space-y-2.5 text-sm sm:text-[15px] leading-relaxed text-[#2C3E2D] pl-2">
                    {sec.items.map((item, idx) => (
                      <li key={idx} className="flex items-start gap-2.5">
                        <span className="h-1.5 w-1.5 rounded-full bg-maple shrink-0 mt-2" />
                        <span>{item}</span>
                      </li>
                    ))}
                  </ul>
                )}

                {/* Subsections (e.g. 3.1, 3.2, 7.1, 7.2) */}
                {sec.subsections && sec.subsections.length > 0 && (
                  <div className="mt-8 space-y-6 pt-6 border-t border-forest/10">
                    {sec.subsections.map((sub) => (
                      <div key={sub.id} id={sub.id} className="scroll-mt-28 pl-3 border-l-2 border-forest/20">
                        <h3 className="font-heading text-sm sm:text-base font-bold text-forest mb-2">
                          {sub.number} {sub.title}
                        </h3>
                        {sub.text && (
                          <p className="text-sm text-[#2C3E2D] leading-relaxed mb-3">
                            {sub.text}
                          </p>
                        )}
                        {sub.items && sub.items.length > 0 && (
                          <ul className="space-y-2 text-sm text-[#2C3E2D] pl-2 mb-3">
                            {sub.items.map((item, idx) => (
                              <li key={idx} className="flex items-start gap-2">
                                <span className="h-1 w-1 rounded-full bg-forest shrink-0 mt-2" />
                                <span>{item}</span>
                              </li>
                            ))}
                          </ul>
                        )}
                        {sub.closingText && (
                          <p className="text-xs italic text-sage mt-2">
                            {sub.closingText}
                          </p>
                        )}
                      </div>
                    ))}
                  </div>
                )}

                {/* Contact Box Details */}
                {sec.contactBox && (
                  <div className="mt-6 p-4 sm:p-6 bg-[#FAF9F6] border border-forest/15 space-y-2 text-xs sm:text-sm">
                    {sec.contactBox.organization && (
                      <p className="font-bold text-forest text-sm">{sec.contactBox.organization}</p>
                    )}
                    <p>
                      <strong className="text-forest">Courriel / Email : </strong>
                      <a href={`mailto:${sec.contactBox.email}`} className="text-maple hover:underline font-semibold">
                        {sec.contactBox.email}
                      </a>
                    </p>
                    <p>
                      <strong className="text-forest">Site Web : </strong>
                      <a href={sec.contactBox.website} target="_blank" rel="noopener noreferrer" className="text-forest hover:underline">
                        {sec.contactBox.website}
                      </a>
                    </p>
                    {sec.contactBox.subject && (
                      <p>
                        <strong className="text-forest">{isFrench ? "Objet recommandé : " : "Recommended Subject: "}</strong>
                        <span className="font-mono text-xs bg-white px-2 py-0.5 border border-forest/15">
                          {sec.contactBox.subject}
                        </span>
                      </p>
                    )}
                    {sec.contactBox.note && (
                      <p className="text-xs text-sage italic pt-1">{sec.contactBox.note}</p>
                    )}
                    {sec.contactBox.closing && (
                      <p className="text-xs text-sage italic pt-1">{sec.contactBox.closing}</p>
                    )}
                  </div>
                )}

                {/* Closing Text */}
                {sec.closingText && (
                  <div className="mt-5 pt-4 border-t border-forest/10 text-xs sm:text-sm text-sage leading-relaxed italic whitespace-pre-line">
                    {sec.closingText}
                  </div>
                )}
              </article>
            ))}

            {/* Bottom Callout */}
            <div className="bg-forest text-bone p-8 sm:p-10 flex flex-col sm:flex-row items-center justify-between gap-6">
              <div>
                <span className="text-[10px] uppercase font-bold tracking-[0.25em] text-maple block mb-1">
                  {isFrench ? "TRANSPARENCE & ÉCOSYSTÈME" : "TRANSPARENCY & ECOSYSTEM"}
                </span>
                <h3 className="font-serif text-2xl font-normal text-white">
                  {isFrench ? "Des questions sur vos renseignements personnels ?" : "Questions about your personal information?"}
                </h3>
                <p className="text-xs text-bone/70 mt-1 max-w-md">
                  {isFrench 
                    ? "Notre équipe veille à l'application rigoureuse des meilleures pratiques de gouvernance et de confidentialité."
                    : "Our team ensures strict adherence to modern governance and data privacy standards."}
                </p>
              </div>
              <a
                href={`mailto:${policy.contactEmail}?subject=Privacy%20Request`}
                className="px-6 py-3 bg-maple text-white text-xs font-bold uppercase tracking-[0.2em] hover:bg-maple/90 transition-colors whitespace-nowrap shadow-sm"
              >
                {isFrench ? "Envoyer une demande" : "Submit Request"}
              </a>
            </div>

          </main>
        </div>
      </section>

    </div>
  );
}
