import { useState, useEffect } from "react";
import { toast } from "sonner";
import { 
  CheckCircle2, 
  Loader2, 
  Mail, 
  MapPin, 
  ArrowRight, 
  Calendar, 
  Clock, 
  Sparkles, 
  ChevronDown,
  ChevronUp
} from "lucide-react";
import api from "@/lib/api";
import { useLang } from "@/lib/i18n";
import { useSettings } from "@/lib/SettingsContext";
import { Reveal } from "@/components/motion";
import FormShell from "@/components/FormShell";
import TiltCard from "@/components/TiltCard";

const HERO_HEADER_IMG = "/assets/contact-header.png";
const SIDEBAR_PORTRAIT_IMG = "https://images.unsplash.com/photo-1516589178581-6cd7833ae3b2?q=80&w=800&auto=format&fit=crop";

const PROFILE_CONFIGS_EN = [
  {
    id: "learn",
    number: "01",
    title: "I want to join Cap Entrepreneurs",
    subtitle: "Individual - Learn & Grow",
    type: "application",
    submitLabel: "Sign & Submit Learning Application",
    successMsg: "Application received! Our learning coordinator will review your application and contact you.",
    fields: [
      { name: "name", label: "Full Name", placeholder: "e.g., Alex Tremblay", required: true },
      { name: "email", label: "Email Address", kind: "email", placeholder: "alex@example.com", required: true },
      { name: "location", label: "Location", kind: "select", options: ["Quebec", "Rest of Canada", "International"], placeholder: "Select your location", required: true },
      {
        name: "program",
        label: "Structuring Program of Interest",
        kind: "select",
        options: [
          "Cap Green Lab - Inclusive technology & circular economy",
          "AgriConnect - Rural entrepreneurship & digital agriculture",
          "Safe Vibe - Digital media & education",
          "Creative & Social Entrepreneurship - Women, arts & social innovation"
        ],
        placeholder: "Select a program",
        required: true
      },
      { name: "message", label: "Your Goals & Motivation", kind: "textarea", placeholder: "What digital skills are you aiming to develop?", required: true },
      { name: "signature", label: "Digital Signature (Type your Full Name)", placeholder: "Type your full legal name to sign", required: true },
      { name: "agreeTerms", label: "Commitment Agreement", kind: "checkbox", placeholder: "I confirm my commitment to participate actively in the Cap Entrepreneurs learning pathway.", text: "I confirm my commitment to participate actively in the Cap Entrepreneurs learning pathway.", required: true }
    ]
  },
  {
    id: "volunteer",
    number: "02",
    title: "I want to volunteer",
    subtitle: "Individual - Volunteer Contributor",
    type: "volunteer",
    submitLabel: "Sign & Submit Volunteer Application",
    successMsg: "Thank you for volunteering! Our volunteer coordinator will reach out for your onboarding match.",
    fields: [
      { name: "name", label: "Full Name", placeholder: "e.g., Jordan Roy", required: true },
      { name: "email", label: "Email Address", kind: "email", placeholder: "jordan@example.com", required: true },
      {
        name: "area",
        label: "What would you like to contribute?",
        kind: "select",
        options: [
          "Digital skills", "Communication", "Business development", "Training",
          "Arts & culture", "Technology", "Agriculture", "Partnerships", "Project management"
        ],
        placeholder: "Select your primary area",
        required: true
      },
      {
        name: "level",
        label: "Your Experience Level",
        kind: "select",
        options: ["Student / Fellow", "Associate", "Professional", "Consultant", "Director / Executive"],
        placeholder: "Select your level",
        required: true
      },
      {
        name: "availability",
        label: "Time Availability",
        kind: "select",
        options: ["2 h / week", "4–6 h / week", "7–10 h / week", "Project-based"],
        placeholder: "Select your availability",
        required: true
      },
      { name: "message", label: "Skills & Background", kind: "textarea", placeholder: "Tell us about your relevant background and how you'd like to help..." },
      { name: "signature", label: "Digital Signature (Type your Full Name)", placeholder: "Type your full legal name to sign", required: true },
      { name: "agreeVolunteer", label: "Volunteer Pledge", kind: "checkbox", placeholder: "I agree to the Cap Entrepreneurs Volunteer Charter and international mission standards.", text: "I agree to the Cap Entrepreneurs Volunteer Charter and international mission standards.", required: true }
    ]
  },
  {
    id: "nonprofit",
    number: "03",
    title: "I represent a non-profit organization",
    subtitle: "Non-Profit / NGO Partner",
    type: "partner",
    submitLabel: "Sign & Submit Non-Profit Application",
    successMsg: "Application received! Our NGO partnership team will review your dossier and schedule a consultation.",
    fields: [
      { name: "organization", label: "Non-Profit / NGO Name", placeholder: "e.g., Community First Foundation", required: true },
      { name: "name", label: "Authorized Representative Name & Title", placeholder: "e.g., Marie Dubois, Executive Director", required: true },
      { name: "email", label: "Official Email Address", kind: "email", placeholder: "contact@ngo.org", required: true },
      { name: "location", label: "Operating Region / Country", placeholder: "e.g., Quebec / West Africa", required: true },
      {
        name: "needType",
        label: "Support / Partnership Area",
        kind: "select",
        options: [
          "Digital Transition & Tech Equipment",
          "Training & Capacity Building",
          "Joint Program Co-Design",
          "International Cooperative Mission"
        ],
        placeholder: "Select primary collaboration need",
        required: true
      },
      { name: "message", label: "Organization Mission & Partnership Proposal", kind: "textarea", placeholder: "Describe your community impact and proposed collaboration...", required: true },
      { name: "signature", label: "Authorized Officer Digital Signature", placeholder: "Type your full name and title to sign", required: true },
      { name: "confirmAuth", label: "Authorization", kind: "checkbox", placeholder: "I certify that I am authorized to submit this application on behalf of the named organization.", text: "I certify that I am authorized to submit this application on behalf of the named organization.", required: true }
    ]
  },
  {
    id: "corporate",
    number: "04",
    title: "I represent a company or institution",
    subtitle: "Corporate Partner / Enterprise",
    type: "partner",
    submitLabel: "Sign & Submit Partnership Proposal",
    successMsg: "Thank you! Our Corporate Partnerships Director will contact you with our detailed partnership package.",
    fields: [
      { name: "organization", label: "Company / Enterprise Name", placeholder: "e.g., Innovatech Global", required: true },
      { name: "name", label: "Contact Person Name & Title", placeholder: "e.g., Jean-Luc Caron, VP Sustainability", required: true },
      { name: "email", label: "Corporate Email Address", kind: "email", placeholder: "jlcaron@company.com", required: true },
      {
        name: "track",
        label: "Partnership Track",
        kind: "select",
        options: [
          "Founding Partner Package",
          "Program Co-financing & Sponsorship",
          "In-Kind Equipment & Technical Expertise",
          "Corporate Social Responsibility (CSR) / Employee Volunteering"
        ],
        placeholder: "Select your desired partnership track",
        required: true
      },
      { name: "message", label: "Corporate Objectives & Collaboration Scope", kind: "textarea", placeholder: "Share your CSR goals and desired visibility or programmatic engagement...", required: true },
      { name: "signature", label: "Authorized Corporate Signee", placeholder: "Type your full name and corporate title to sign", required: true },
      { name: "confirmCorporate", label: "Declaration of Intent", kind: "checkbox", placeholder: "I confirm interest in exploring formal partnership and receiving the Cap Entrepreneurs partnership agreement package.", text: "I confirm interest in exploring formal partnership and receiving the Cap Entrepreneurs partnership agreement package.", required: true }
    ]
  },
  {
    id: "sourcing",
    number: "05",
    title: "I am an international buyer or creator",
    subtitle: "African Creative Sourcing & Buyer Programme",
    type: "partner",
    submitLabel: "Sign & Register for Sourcing Programme",
    successMsg: "Registration received! You are now enrolled in the African Creative Sourcing & Buyer registry.",
    fields: [
      { name: "organization", label: "Brand / Studio / Retailer Name", placeholder: "e.g., Atelier Nord & Sud", required: true },
      { name: "name", label: "Buyer / Creator Full Name", placeholder: "e.g., Sophia Moreau", required: true },
      { name: "email", label: "Business Email Address", kind: "email", placeholder: "sophia@atelier.com", required: true },
      { name: "country", label: "Country of Operation", placeholder: "e.g., Canada / France / Morocco", required: true },
      {
        name: "buyerCategory",
        label: "Your Profile Category",
        kind: "select",
        options: [
          "International Buyer / Retail Chain",
          "Concept Store / Boutique",
          "Architect / Interior Designer",
          "Fashion Stylist / Costume Designer",
          "Distributor / Wholesaler",
          "Cultural Institution / Museum",
          "Independent Creative"
        ],
        placeholder: "Select category",
        required: true
      },
      {
        name: "eventsInterest",
        label: "International Delegations Interest",
        kind: "select",
        options: [
          "Marrakech 2027 - African Creative Sourcing",
          "Paris 2027 - Pre-Festival Launch",
          "Nairobi 2027 - Global Festival",
          "Martinique 2028 - Caribbean Expansion",
          "All International Delegations"
        ],
        placeholder: "Select event focus",
        required: true
      },
      { name: "message", label: "Sourcing Focus & Product Categories", kind: "textarea", placeholder: "What specific categories (textiles, design, tech, crafts, sustainable goods) are you looking to source?" },
      { name: "signature", label: "Digital Signature", placeholder: "Type your full name to sign registration", required: true },
      { name: "confirmSourcing", label: "Programme Terms", kind: "checkbox", placeholder: "I agree to the African Creative Sourcing & Buyer Programme terms and code of fair trade.", text: "I agree to the African Creative Sourcing & Buyer Programme terms and code of fair trade.", required: true }
    ]
  },
  {
    id: "sponsor",
    number: "06",
    title: "I want to support the Festival or sourcing programme",
    subtitle: "Global Festival Sponsor & Patron",
    type: "partner",
    submitLabel: "Sign & Submit Sponsorship Interest",
    successMsg: "Thank you for supporting the Global Festival! Our festival steering committee will contact you with tier details.",
    fields: [
      { name: "organization", label: "Sponsoring Entity / Organization", placeholder: "e.g., Global Impact Fund", required: true },
      { name: "name", label: "Representative Full Name", placeholder: "e.g., David Chen", required: true },
      { name: "email", label: "Email Address", kind: "email", placeholder: "david@fund.org", required: true },
      {
        name: "spaceInterest",
        label: "Target Festival Space / Location",
        kind: "select",
        options: [
          "Inclusive Tech Space (Accessibility & Universal Design)",
          "Circular Tech Space (Reuse & Circular Economy)",
          "Digital Skills Space (Employability & Youth)",
          "Social Innovation Space (Community Solutions)",
          "Paris 2027 Pre-Festival Brunch Sponsor",
          "Nairobi 2027 Global Festival Grand Sponsor"
        ],
        placeholder: "Select target space",
        required: true
      },
      { name: "message", label: "Support Proposal & Desired Engagement", kind: "textarea", placeholder: "Describe your sponsorship budget, delegation participation, or programmatic goals...", required: true },
      { name: "signature", label: "Authorized Signee Signature", placeholder: "Type your full name and title to sign", required: true },
      { name: "confirmSponsor", label: "Sponsorship Commitment Intent", kind: "checkbox", placeholder: "I confirm interest in sponsoring Cap Entrepreneurs international initiatives.", text: "I confirm interest in sponsoring Cap Entrepreneurs international initiatives.", required: true }
    ]
  },
  {
    id: "press",
    number: "07",
    title: "I am a journalist or institution",
    subtitle: "Press & Institutional Relations",
    type: "contact",
    submitLabel: "Submit Press / Institutional Inquiry",
    successMsg: "Your inquiry has been received by our Communications & Institutional Relations desk.",
    fields: [
      { name: "organization", label: "Media Outlet / Institution Name", placeholder: "e.g., Radio-Canada / Municipal Agency", required: true },
      { name: "name", label: "Journalist / Official Full Name", placeholder: "e.g., Claire Tremblay", required: true },
      { name: "email", label: "Official Work Email", kind: "email", placeholder: "claire.tremblay@media.com", required: true },
      {
        name: "subject",
        label: "Nature of Request",
        kind: "select",
        options: [
          "Interview Request with Leadership",
          "Media Accreditation (Paris / Nairobi / Marrakech)",
          "Press Release & Asset Pack Request",
          "Institutional Bilateral Cooperation",
          "Government & Policy Consultation"
        ],
        placeholder: "Select nature of request",
        required: true
      },
      { name: "message", label: "Details & Publication Deadline", kind: "textarea", placeholder: "Please specify your questions, publication/filing deadline, and preferred interview format...", required: true }
    ]
  }
];

const PROFILE_CONFIGS_FR = [
  {
    id: "learn",
    number: "01",
    title: "Je souhaite rejoindre Cap Entrepreneurs",
    subtitle: "Particulier — Développer mes compétences",
    type: "application",
    submitLabel: "Signer & Transmettre ma candidature",
    successMsg: "Candidature reçue ! Notre équipe de coordination examinera votre profil et prendra contact avec vous.",
    fields: [
      { name: "name", label: "Nom complet", placeholder: "Ex: Alex Tremblay", required: true },
      { name: "email", label: "Adresse courriel", kind: "email", placeholder: "alex@exemple.com", required: true },
      { name: "location", label: "Localisation", kind: "select", options: ["Québec", "Reste du Canada", "International"], placeholder: "Sélectionnez votre région", required: true },
      {
        name: "program",
        label: "Programme structurant d'intérêt",
        kind: "select",
        options: [
          "Cap Green Lab — Technologie inclusive & économie circulaire",
          "AgriConnect — Entrepreneuriat rural & agriculture numérique",
          "Safe Vibe — Médias numériques & citoyenneté",
          "Entrepreneuriat Créatif & Social — Femmes, arts & innovation sociale"
        ],
        placeholder: "Sélectionnez un programme",
        required: true
      },
      { name: "message", label: "Vos objectifs & motivations", kind: "textarea", placeholder: "Quelles compétences numériques et entrepreneuriales souhaitez-vous développer ?", required: true },
      { name: "signature", label: "Signature numérique (Votre nom complet)", placeholder: "Inscrivez votre nom complet pour signer", required: true },
      { name: "agreeTerms", label: "Accord d'engagement", kind: "checkbox", placeholder: "Je confirme mon engagement à participer activement au parcours d'apprentissage solidaire de Cap Entrepreneurs.", text: "Je confirme mon engagement à participer activement au parcours d'apprentissage solidaire de Cap Entrepreneurs.", required: true }
    ]
  },
  {
    id: "volunteer",
    number: "02",
    title: "Je souhaite faire du bénévolat",
    subtitle: "Particulier — Contribution citoyenne & bénévole",
    type: "volunteer",
    submitLabel: "Signer & Transmettre ma demande bénévole",
    successMsg: "Merci de tout cœur pour votre dévouement bénévole ! Notre coordonnateur communiquera avec vous rapidement.",
    fields: [
      { name: "name", label: "Nom complet", placeholder: "Ex: Jordan Roy", required: true },
      { name: "email", label: "Adresse courriel", kind: "email", placeholder: "jordan@exemple.com", required: true },
      {
        name: "area",
        label: "Dans quel domaine souhaitez-vous contribuer ?",
        kind: "select",
        options: [
          "Compétences numériques & Reconditionnement", "Communication & Rédaction", "Développement de projets", "Formation & Ateliers",
          "Arts & Culture", "Technologies de l'information", "Agriculture & Ruralité", "Partenariats & Alliances", "Gestion et logistique"
        ],
        placeholder: "Sélectionnez votre domaine d'expertise",
        required: true
      },
      {
        name: "level",
        label: "Votre niveau d'expérience",
        kind: "select",
        options: ["Étudiant / Apprenant", "Professionnel en début de carrière", "Professionnel confirmé", "Consultant / Expert", "Dirigeant d'organisme"],
        placeholder: "Sélectionnez votre niveau",
        required: true
      },
      {
        name: "availability",
        label: "Disponibilité horaire",
        kind: "select",
        options: ["2 h / semaine", "4–6 h / semaine", "7–10 h / semaine", "Par projet ponctuel"],
        placeholder: "Sélectionnez votre disponibilité",
        required: true
      },
      { name: "message", label: "Compétences & parcours", kind: "textarea", placeholder: "Décrivez brièvement votre expérience et la manière dont vous aimeriez aider..." },
      { name: "signature", label: "Signature numérique (Votre nom complet)", placeholder: "Inscrivez votre nom complet pour signer", required: true },
      { name: "agreeVolunteer", label: "Charte du bénévole", kind: "checkbox", placeholder: "J'accepte la Charte du bénévole de Cap Entrepreneurs et les principes éthiques de l'organisme.", text: "J'accepte la Charte du bénévole de Cap Entrepreneurs et les principes éthiques de l'organisme.", required: true }
    ]
  },
  {
    id: "nonprofit",
    number: "03",
    title: "Je représente un organisme à but non lucratif",
    subtitle: "Partenaire OBNL / ONG / Économie sociale",
    type: "partner",
    submitLabel: "Signer & Soumettre la demande de collaboration",
    successMsg: "Demande bien reçue ! Notre équipe des alliances associatives analysera votre proposition et prendra contact avec vous.",
    fields: [
      { name: "organization", label: "Nom de l'OBNL ou de l'ONG", placeholder: "Ex: Fondation Éco-Solidaire", required: true },
      { name: "name", label: "Nom et titre du représentant autorisé", placeholder: "Ex: Marie Dubois, Directrice générale", required: true },
      { name: "email", label: "Courriel officiel", kind: "email", placeholder: "direction@obnl.org", required: true },
      { name: "location", label: "Région ou pays d'action", placeholder: "Ex: Québec / Afrique de l'Ouest", required: true },
      {
        name: "needType",
        label: "Axe de collaboration souhaité",
        kind: "select",
        options: [
          "Transition numérique & Don d'équipements reconditionnés",
          "Formations conjointes & Renforcement des capacités",
          "Co-développement de programmes communautaires",
          "Mission de coopération internationale"
        ],
        placeholder: "Sélectionnez l'axe principal",
        required: true
      },
      { name: "message", label: "Mission sociale de votre organisme & Proposition", kind: "textarea", placeholder: "Décrivez l'impact de votre communauté et vos attentes en matière de partenariat...", required: true },
      { name: "signature", label: "Signature numérique du représentant", placeholder: "Inscrivez votre nom et fonction pour signer", required: true },
      { name: "confirmAuth", label: "Attestation", kind: "checkbox", placeholder: "J'atteste être dûment autorisé(e) à soumettre cette démarche au nom de l'organisme mentionné.", text: "J'atteste être dûment autorisé(e) à soumettre cette démarche au nom de l'organisme mentionné.", required: true }
    ]
  },
  {
    id: "corporate",
    number: "04",
    title: "Je représente une entreprise ou institution",
    subtitle: "Partenaire institutionnel & Entreprise engagée",
    type: "partner",
    submitLabel: "Signer & Soumettre la proposition de partenariat",
    successMsg: "Merci ! Notre direction des partenariats communiquera avec vous pour vous transmettre notre dossier de collaboration détaillé.",
    fields: [
      { name: "organization", label: "Nom de l'entreprise ou institution", placeholder: "Ex: Innovatech Durable", required: true },
      { name: "name", label: "Nom et titre du contact", placeholder: "Ex: Jean-Luc Caron, Vice-président RSE", required: true },
      { name: "email", label: "Courriel professionnel", kind: "email", placeholder: "jlcaron@entreprise.com", required: true },
      {
        name: "track",
        label: "Volet de partenariat souhaité",
        kind: "select",
        options: [
          "Partenaire Fondateur de Cap Entrepreneurs",
          "Co-financement de programme & Mécénat d'impact",
          "Apport d'équipements numériques & Mécénat de compétences",
          "Responsabilité Sociale (RSE) & Bénévolat d'équipe"
        ],
        placeholder: "Sélectionnez votre volet d'engagement",
        required: true
      },
      { name: "message", label: "Objectifs d'impact & Périmètre de collaboration", kind: "textarea", placeholder: "Partagez vos priorités d'impact social et vos souhaits de rayonnement...", required: true },
      { name: "signature", label: "Signature numérique autorisée", placeholder: "Inscrivez votre nom et titre d'entreprise", required: true },
      { name: "confirmCorporate", label: "Déclaration d'intention", kind: "checkbox", placeholder: "Je confirme l'intérêt d'explorer un partenariat officiel avec Cap Entrepreneurs.", text: "Je confirme l'intérêt d'explorer un partenariat officiel avec Cap Entrepreneurs.", required: true }
    ]
  },
  {
    id: "sourcing",
    number: "05",
    title: "Je suis acheteur ou créateur international",
    subtitle: "Programme de Sourcing Créatif Africain",
    type: "partner",
    submitLabel: "Signer & S'inscrire au registre de sourcing",
    successMsg: "Inscription confirmée ! Vous êtes désormais inscrit au registre du Programme de Sourcing Créatif.",
    fields: [
      { name: "organization", label: "Nom de la marque, studio ou enseigne", placeholder: "Ex: Atelier Nord & Sud", required: true },
      { name: "name", label: "Nom complet de l'acheteur ou créateur", placeholder: "Ex: Sophia Moreau", required: true },
      { name: "email", label: "Courriel professionnel", kind: "email", placeholder: "sophia@atelier.com", required: true },
      { name: "country", label: "Pays d'exercice", placeholder: "Ex: Canada / France / Maroc", required: true },
      {
        name: "buyerCategory",
        label: "Catégorie de profil",
        kind: "select",
        options: [
          "Acheteur international / Réseau de distribution",
          "Boutique spécialisée / Concept store",
          "Architecte / Designer d'intérieur",
          "Styliste / Designer de mode",
          "Distributeur / Grossiste",
          "Institution culturelle / Musée",
          "Créateur indépendant"
        ],
        placeholder: "Sélectionnez votre profil",
        required: true
      },
      {
        name: "eventsInterest",
        label: "Délégation internationale visée",
        kind: "select",
        options: [
          "Marrakech 2027 — African Creative Sourcing",
          "Paris 2027 — Brunch Pré-Festival",
          "Nairobi 2027 — Global Festival pour la tech inclusive",
          "Martinique 2028 — Expansion Caraïbes",
          "Toutes les délégations internationales"
        ],
        placeholder: "Sélectionnez votre événement prioritaire",
        required: true
      },
      { name: "message", label: "Filières et typologies de produits recherchés", kind: "textarea", placeholder: "Précisez vos besoins : textiles, design, artisanat équitable, technologies durables..." },
      { name: "signature", label: "Signature numérique", placeholder: "Inscrivez votre nom complet pour signer", required: true },
      { name: "confirmSourcing", label: "Conditions du programme", kind: "checkbox", placeholder: "J'accepte les conditions du Programme de Sourcing Créatif et la charte de commerce équitable.", text: "J'accepte les conditions du Programme de Sourcing Créatif et la charte de commerce équitable.", required: true }
    ]
  },
  {
    id: "sponsor",
    number: "06",
    title: "Je souhaite soutenir le Festival ou nos programmes",
    subtitle: "Mécène & Commanditaire du Global Festival",
    type: "partner",
    submitLabel: "Signer & Soumettre ma proposition de mécénat",
    successMsg: "Merci infiniment de soutenir le Global Festival ! Notre comité de pilotage vous contactera sous peu.",
    fields: [
      { name: "organization", label: "Organisation ou entité mécène", placeholder: "Ex: Fonds d'Impact Collectif", required: true },
      { name: "name", label: "Nom complet du représentant", placeholder: "Ex: David Chen", required: true },
      { name: "email", label: "Courriel", kind: "email", placeholder: "david@fonds.org", required: true },
      {
        name: "spaceInterest",
        label: "Espace ou étape du Festival ciblée",
        kind: "select",
        options: [
          "Espace Tech Inclusive (Accessibilité & Design universel)",
          "Espace Tech Circulaire (Réemploi & Reconditionnement)",
          "Espace Compétences Numériques (Employabilité & Jeunesse)",
          "Espace Innovation Sociale (Solutions communautaires)",
          "Commanditaire du Brunch Pré-Festival Paris 2027",
          "Grand Partenaire du Global Festival Nairobi 2027"
        ],
        placeholder: "Sélectionnez l'espace ciblé",
        required: true
      },
      { name: "message", label: "Proposition de soutien & Modalités souhaitées", kind: "textarea", placeholder: "Décrivez votre engagement financier, participation de délégation ou objectifs...", required: true },
      { name: "signature", label: "Signature autorisée", placeholder: "Inscrivez votre nom et fonction pour signer", required: true },
      { name: "confirmSponsor", label: "Intention d'engagement", kind: "checkbox", placeholder: "Je confirme notre intérêt de soutenir les initiatives internationales de Cap Entrepreneurs.", text: "Je confirme notre intérêt de soutenir les initiatives internationales de Cap Entrepreneurs.", required: true }
    ]
  },
  {
    id: "press",
    number: "07",
    title: "Je suis journaliste ou représentant public",
    subtitle: "Presse & Relations institutionnelles",
    type: "contact",
    submitLabel: "Transmettre la demande média / institutionnelle",
    successMsg: "Votre demande a été transmise à notre bureau des communications et relations publiques.",
    fields: [
      { name: "organization", label: "Média ou institution représentée", placeholder: "Ex: Radio-Canada / Agence publique", required: true },
      { name: "name", label: "Nom complet du journaliste ou représentant", placeholder: "Ex: Claire Tremblay", required: true },
      { name: "email", label: "Courriel professionnel officiel", kind: "email", placeholder: "claire.tremblay@media.com", required: true },
      {
        name: "subject",
        label: "Nature de la demande",
        kind: "select",
        options: [
          "Demande d'entrevue avec la direction",
          "Accréditation média (Paris / Nairobi / Marrakech)",
          "Dossier de presse & Communiqués",
          "Coopération institutionnelle bilatérale",
          "Consultation sur les politiques d'inclusion numérique"
        ],
        placeholder: "Sélectionnez la nature de la requête",
        required: true
      },
      { name: "message", label: "Détails de la demande & Date limite de tombée", kind: "textarea", placeholder: "Précisez vos questions, la date limite de tombée et le format souhaité...", required: true }
    ]
  }
];

const PROFILE_CONFIGS_AR = [
  {
    id: "learn",
    number: "01",
    title: "أرغب في الانضمام إلى كاب رواد الأعمال",
    subtitle: "أفراد — التعلم وتطوير المهارات",
    type: "application",
    submitLabel: "توقيع وإرسال طلب التعلم",
    successMsg: "تم استلام طلبك! سيقوم منسق التعلم بمراجعة طلبك والتواصل معك.",
    fields: [
      { name: "name", label: "الاسم الكامل", placeholder: "مثال: أليكس تريمبلاي", required: true },
      { name: "email", label: "البريد الإلكتروني", kind: "email", placeholder: "alex@example.com", required: true },
      { name: "location", label: "الموقع", kind: "select", options: ["كيبيك", "بقية كندا", "دولي"], placeholder: "اختر موقعك", required: true },
      {
        name: "program",
        label: "البرنامج الهيكلي المطلوب",
        kind: "select",
        options: [
          "مختبر كاب الأخضر — تكنولوجيا شاملة واقتصاد دائري",
          "أجري كونكت — ريادة الأعمال الريفية والزراعة الرقمية",
          "سيف فايب — الإعلام الرقمي والمواطنة",
          "ريادة الأعمال الإبداعية والاجتماعية — المرأة والفنون"
        ],
        placeholder: "اختر برنامجاً",
        required: true
      },
      { name: "message", label: "أهدافك ودوافعك", kind: "textarea", placeholder: "ما هي المهارات الرقمية التي تسعى لاكتسابها؟", required: true },
      { name: "signature", label: "التوقيع الرقمي (اكتب اسمك الكامل)", placeholder: "اكتب اسمك الكامل للتوقيع", required: true },
      { name: "agreeTerms", label: "اتفاقية الالتزام", kind: "checkbox", placeholder: "أؤكد التزامي بالمشاركة النشطة في مسار التعلم التابع لكاب رواد الأعمال.", text: "أؤكد التزامي بالمشاركة النشطة في مسار التعلم التابع لكاب رواد الأعمال.", required: true }
    ]
  },
  {
    id: "volunteer",
    number: "02",
    title: "أرغب في التطوع",
    subtitle: "أفراد — مساهمة تطوعية مجتمعية",
    type: "volunteer",
    submitLabel: "توقيع وإرسال طلب التطوع",
    successMsg: "شكراً لتطوعك! سيتواصل معك منسق المتطوعين لتنسيق انضمامك.",
    fields: [
      { name: "name", label: "الاسم الكامل", placeholder: "مثال: جوردان روي", required: true },
      { name: "email", label: "البريد الإلكتروني", kind: "email", placeholder: "jordan@example.com", required: true },
      {
        name: "area",
        label: "في أي مجال ترغب بالمساهمة؟",
        kind: "select",
        options: [
          "المهارات الرقمية", "الاتصال والإعلام", "تطوير المشاريع", "التدريب",
          "الفنون والثقافة", "التكنولوجيا", "الزراعة", "الشراكات", "إدارة المشاريع"
        ],
        placeholder: "اختر مجالك الأساسي",
        required: true
      },
      {
        name: "level",
        label: "مستوى الخبرة",
        kind: "select",
        options: ["طالب / متدرب", "مهني مبتدئ", "مهني متخصص", "استشاري / خبير", "مدير / قيادي"],
        placeholder: "اختر مستواك",
        required: true
      },
      {
        name: "availability",
        label: "الوقت المتاح",
        kind: "select",
        options: ["ساعتان / أسبوعياً", "4-6 ساعات / أسبوعياً", "7-10 ساعات / أسبوعياً", "حسب المشروع"],
        placeholder: "اختر التفرغ",
        required: true
      },
      { name: "message", label: "المهارات والخلفية المهنية", kind: "textarea", placeholder: "أخبرنا عن خلفيتك وكيف ترغب في المساعدة..." },
      { name: "signature", label: "التوقيع الرقمي", placeholder: "اكتب اسمك الكامل للتوقيع", required: true },
      { name: "agreeVolunteer", label: "ميثاق التطوع", kind: "checkbox", placeholder: "أوافق على ميثاق التطوع والمعايير الأخلاقية للمنظمة.", text: "أوافق على ميثاق التطوع والمعايير الأخلاقية للمنظمة.", required: true }
    ]
  },
  {
    id: "nonprofit",
    number: "03",
    title: "أمثل منظمة غير ربحية أو جمعية",
    subtitle: "شريك غير ربحي / منظمة أهلية",
    type: "partner",
    submitLabel: "توقيع وإرسال طلب الشراكة",
    successMsg: "تم استلام الطلب! سيقوم فريق الشراكات بمراجعة الملف وتحديد موعد تشاور.",
    fields: [
      { name: "organization", label: "اسم المنظمة أو الجمعية", placeholder: "مثال: مؤسسة التضامن", required: true },
      { name: "name", label: "اسم وصفة الممثل المخول", placeholder: "مثال: ماري ديبوا، المديرة التنفيذية", required: true },
      { name: "email", label: "البريد الإلكتروني الرسمي", kind: "email", placeholder: "contact@ngo.org", required: true },
      { name: "location", label: "منطقة العمل أو الدولة", placeholder: "مثال: كيبيك / غرب إفريقيا", required: true },
      {
        name: "needType",
        label: "مجال الشراكة المطلوب",
        kind: "select",
        options: [
          "التحول الرقمي وتجهيز المعدات",
          "التدريب وبناء القدرات",
          "التصميم المشترك للبرامج",
          "مهمة تعاون دولي"
        ],
        placeholder: "اختر نوع التعاون الأساسي",
        required: true
      },
      { name: "message", label: "رسالة المنظمة ومقترح الشراكة", kind: "textarea", placeholder: "صف أثر مجتمعك والتعاون المقترح...", required: true },
      { name: "signature", label: "توقيع المسؤول المفوض", placeholder: "اكتب اسمك وصفتك للتوقيع", required: true },
      { name: "confirmAuth", label: "التفويض", kind: "checkbox", placeholder: "أقر بأنني مخول بتقديم هذا الطلب نيابة عن المنظمة المذكورة.", text: "أقر بأنني مخول بتقديم هذا الطلب نيابة عن المنظمة المذكورة.", required: true }
    ]
  },
  {
    id: "corporate",
    number: "04",
    title: "أمثل شركة أو مؤسسة",
    subtitle: "شريك مؤسسي / قطاع خاص مسؤول",
    type: "partner",
    submitLabel: "توقيع وإرسال مقترح الشراكة",
    successMsg: "شكراً لك! سيتواصل معك مدير الشراكات المؤسسية لتزويدك بملف الشراكة.",
    fields: [
      { name: "organization", label: "اسم الشركة أو المؤسسة", placeholder: "مثال: جلوبال تك", required: true },
      { name: "name", label: "اسم وصفة مسؤول التواصل", placeholder: "مثال: جان لوك، نائب رئيس الاستدامة", required: true },
      { name: "email", label: "البريد الإلكتروني المهني", kind: "email", placeholder: "jlcaron@company.com", required: true },
      {
        name: "track",
        label: "مسار الشراكة المطلوب",
        kind: "select",
        options: [
          "حزمة الشريك المؤسس",
          "التمويل المشترك للبرامج والرعاية",
          "المساهمات العينية والخبرة الفنية",
          "المسؤولية الاجتماعية وتطوع الموظفين"
        ],
        placeholder: "اختر مسار الشراكة",
        required: true
      },
      { name: "message", label: "أهداف الشركة ونطاق التعاون", kind: "textarea", placeholder: "شارك أهدافك الاجتماعية ونطاق الشراكة المطلوب...", required: true },
      { name: "signature", label: "التوقيع المعتمد", placeholder: "اكتب اسمك وصفتك المهنية", required: true },
      { name: "confirmCorporate", label: "إعلان النوايا", kind: "checkbox", placeholder: "أؤكد اهتمامنا باستكشاف شراكة رسمية مع كاب رواد الأعمال.", text: "أؤكد اهتمامنا باستكشاف شراكة رسمية مع كاب رواد الأعمال.", required: true }
    ]
  },
  {
    id: "sourcing",
    number: "05",
    title: "أنا مشترٍ دولي أو مبدع",
    subtitle: "برنامج التوريد الإبداعي الأفريقي والمشترين",
    type: "partner",
    submitLabel: "توقيع والتسجيل في برنامج التوريد",
    successMsg: "تم استلام تسجيلك بنجاح في سجل المشترين والمبدعين الدوليين.",
    fields: [
      { name: "organization", label: "اسم العلامة أو الاستوديو أو المتجر", placeholder: "مثال: أتيليه الشمال والجنوب", required: true },
      { name: "name", label: "الاسم الكامل للمشتري أو المبدع", placeholder: "مثال: صوفيا مورو", required: true },
      { name: "email", label: "البريد الإلكتروني المهني", kind: "email", placeholder: "sophia@atelier.com", required: true },
      { name: "country", label: "بلد النشاط", placeholder: "مثال: كندا / فرنسا / المغرب", required: true },
      {
        name: "buyerCategory",
        label: "فئة الملف الشخصي",
        kind: "select",
        options: [
          "مشترٍ دولي / سلسلة متاجر",
          "متجر متخصص / بوتيك",
          "مهندس معماري / مصمم داخلي",
          "مصمم أزياء",
          "موزع / تاجر جملة",
          "مؤسسة ثقافية / متحف",
          "مبدع مستقل"
        ],
        placeholder: "اختر الفئة",
        required: true
      },
      {
        name: "eventsInterest",
        label: "الوفد الدولي المستهدف",
        kind: "select",
        options: [
          "مراكش 2027 — التوريد الإبداعي الأفريقي",
          "باريس 2027 — حفل ما قبل المهرجان",
          "نيروبي 2027 — المهرجان العالمي للتكنولوجيا الشاملة",
          "مارتينيك 2028 — التوسع الكاريبي",
          "جميع الوفود الدولية"
        ],
        placeholder: "اختر الفعالية الأساسية",
        required: true
      },
      { name: "message", label: "مجالات التوريد والمنتجات المطلوبة", kind: "textarea", placeholder: "ما هي المنتجات المحددة التي تبحث عنها (منسوجات، تصميم، حرف يدوية، منتجات مستدامة)؟" },
      { name: "signature", label: "التوقيع الرقمي", placeholder: "اكتب اسمك الكامل للتوقيع", required: true },
      { name: "confirmSourcing", label: "شروط البرنامج", kind: "checkbox", placeholder: "أوافق على شروط برنامج التوريد الإبداعي الأفريقي وميثاق التجارة العادلة.", text: "أوافق على شروط برنامج التوريد الإبداعي الأفريقي وميثاق التجارة العادلة.", required: true }
    ]
  },
  {
    id: "sponsor",
    number: "06",
    title: "أرغب في دعم المهرجان أو البرامج",
    subtitle: "راعٍ للمهرجان العالمي وداعم",
    type: "partner",
    submitLabel: "توقيع وإرسال مقترح الرعاية",
    successMsg: "شكراً جزيلاً لدعمك للمهرجان العالمي! سيتواصل معك فريق التنظيم قريباً.",
    fields: [
      { name: "organization", label: "الجهة الراعية أو الداعمة", placeholder: "مثال: صندوق الأثر الاجتماعي", required: true },
      { name: "name", label: "اسم الممثل الكامل", placeholder: "مثال: ديفيد تشن", required: true },
      { name: "email", label: "البريد الإلكتروني", kind: "email", placeholder: "david@fund.org", required: true },
      {
        name: "spaceInterest",
        label: "مساحة أو فعالية المهرجان المستهدفة",
        kind: "select",
        options: [
          "مساحة التكنولوجيا الشاملة (الإتاحة والتصميم الشامل)",
          "مساحة التكنولوجيا الدائرية (إعادة الاستخدام والاقتصاد الدائري)",
          "مساحة المهارات الرقمية (التشغيل والشباب)",
          "مساحة الابتكار الاجتماعي (الحلول المجتمعية)",
          "راعي حفل ما قبل المهرجان في باريس 2027",
          "الراعي الرئيسي للمهرجان العالمي في نيروبي 2027"
        ],
        placeholder: "اختر المساحة",
        required: true
      },
      { name: "message", label: "مقترح الدعم والأهداف", kind: "textarea", placeholder: "صف ميزانية الرعاية أو مشاركة الوفد أو الأهداف المرجوة...", required: true },
      { name: "signature", label: "توقيع المسؤول المفوض", placeholder: "اكتب اسمك وصفتك للتوقيع", required: true },
      { name: "confirmSponsor", label: "إعلان نية الرعاية", kind: "checkbox", placeholder: "أؤكد رغبتنا في رعاية مبادرات كاب رواد الأعمال الدولية.", text: "أؤكد رغبتنا في رعاية مبادرات كاب رواد الأعمال الدولية.", required: true }
    ]
  },
  {
    id: "press",
    number: "07",
    title: "أنا صحفي أو ممثل جهة عامة",
    subtitle: "صحافة وعلاقات مؤسسية",
    type: "contact",
    submitLabel: "إرسال الاستفسار الصحفي أو المؤسسي",
    successMsg: "تم استلام استفسارك لدى مكتب الاتصال والعلاقات المؤسسية.",
    fields: [
      { name: "organization", label: "المؤسسة الإعلامية أو الجهة", placeholder: "مثال: راديو كندا / وكالة حكومية", required: true },
      { name: "name", label: "اسم الصحفي أو المسؤول", placeholder: "مثال: كلير تريمبلاي", required: true },
      { name: "email", label: "البريد الإلكتروني المهني الرسمي", kind: "email", placeholder: "claire.tremblay@media.com", required: true },
      {
        name: "subject",
        label: "طبيعة الطلب",
        kind: "select",
        options: [
          "طلب مقابلة مع الإدارة",
          "اعتماد إعلامي (باريس / نيروبي / مراكش)",
          "طلب بيانات صحفية ومواد إعلامية",
          "تعاون مؤسسي ثنائي",
          "استشارات السياسات العامة للشمول الرقمي"
        ],
        placeholder: "اختر طبيعة الطلب",
        required: true
      },
      { name: "message", label: "التفاصيل والموعد النهائي للنشر", kind: "textarea", placeholder: "يرجى توضيح الأسئلة والموعد النهائي المطلوب وشكل المقابلة...", required: true }
    ]
  }
];

export default function Contact() {
  const { lang } = useLang();
  const settings = useSettings();

  // General Quick Contact Form State
  const [formData, setFormData] = useState({ name: "", email: "", message: "" });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);

  // Dedicated Engagement Profile State
  const [selectedProfileId, setSelectedProfileId] = useState("learn");
  const [showEngagementSection, setShowEngagementSection] = useState(true);

  // Public Events State
  const [events, setEvents] = useState([]);
  const [loadingEvents, setLoadingEvents] = useState(true);
  const [selectedEventForRsvp, setSelectedEventForRsvp] = useState(null);
  const [rsvpData, setRsvpData] = useState({ name: "", email: "", guests: "1", note: "" });
  const [rsvpSubmitting, setRsvpSubmitting] = useState(false);

  const isFrench = lang === "fr";
  const isArabic = lang === "ar";

  useEffect(() => {
    const fetchPublicEvents = async () => {
      try {
        const res = await api.get(`/events?lang=${lang || "fr"}`);
        setEvents(res.data || []);
      } catch (err) {
        console.error("Failed to fetch public events:", err);
      } finally {
        setLoadingEvents(false);
      }
    };
    fetchPublicEvents();
  }, [lang]);

  const handleQuickSubmit = async (e) => {
    e.preventDefault();
    if (!formData.name.trim() || !formData.email.trim() || !formData.message.trim()) {
      toast.error(isFrench ? "Veuillez remplir tous les champs obligatoires." : "Please fill in all required fields.");
      return;
    }

    setIsSubmitting(true);
    try {
      await api.post("/submissions", {
        type: "contact",
        payload: {
          name: formData.name.trim(),
          email: formData.email.trim(),
          message: formData.message.trim(),
        },
      });

      setIsSubmitted(true);
      toast.success(isFrench ? "Votre message a été envoyé avec succès !" : "Your message has been sent successfully!");
    } catch (err) {
      console.error(err);
      toast.error(isFrench ? "Une erreur est survenue lors de l'envoi." : "An error occurred while sending your message.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleRsvpSubmit = async (e) => {
    e.preventDefault();
    if (!rsvpData.name || !rsvpData.email || !selectedEventForRsvp) {
      toast.error(isFrench ? "Nom et courriel requis." : "Name and email required.");
      return;
    }

    setRsvpSubmitting(true);
    try {
      await api.post(`/events/${selectedEventForRsvp.id}/register`, {
        name: rsvpData.name,
        email: rsvpData.email,
        guests: rsvpData.guests,
        note: rsvpData.note,
        event_title: selectedEventForRsvp.title
      });
      toast.success(isFrench ? "Inscription confirmée !" : "Registration confirmed!");
      setSelectedEventForRsvp(null);
      setRsvpData({ name: "", email: "", guests: "1", note: "" });
    } catch (err) {
      console.error(err);
      toast.error(isFrench ? "Échec de l'inscription." : "Registration failed.");
    } finally {
      setRsvpSubmitting(false);
    }
  };

  const profileConfigs = isFrench ? PROFILE_CONFIGS_FR : isArabic ? PROFILE_CONFIGS_AR : PROFILE_CONFIGS_EN;
  const activeConfig = profileConfigs.find((p) => p.id === selectedProfileId) || profileConfigs[0];
  const contactEmail = settings?.contact?.main_email || "contact@capentrepreneurs.org";
  const contactAddress = settings?.contact?.address || "1265, rue Rachel E, porte 403 Montréal (Québec) H2J 2J9 • Canada";

  return (
    <div data-testid="contact-page" className="bg-[#FAF9F6] min-h-screen text-[#1c1c1c]">
      {/* 1. EDITORIAL FULL-WIDTH HERO HEADER PICTURE */}
      <div className="relative w-full h-[320px] sm:h-[420px] md:h-[480px] lg:h-[520px] overflow-hidden bg-[#e5e3dc]">
        <img
          src={HERO_HEADER_IMG}
          alt="Cap Entrepreneurs Journey Header"
          className="w-full h-full object-cover object-center filter brightness-[0.98]"
          loading="eager"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/25 via-transparent to-transparent pointer-events-none" />
      </div>

      {/* 2. CENTERED SECTION TITLE */}
      <section className="pt-14 sm:pt-20 pb-8 sm:pb-12 text-center px-4">
        <Reveal>
          <h1 className="font-serif text-3xl sm:text-4xl md:text-5xl lg:text-[54px] font-normal tracking-tight text-[#1c1c1c]">
            {isFrench ? "Contactez-nous" : isArabic ? "اتصل بنا" : "Contact Us"}
          </h1>
          <div className="w-12 h-[2px] bg-[#C89255] mx-auto my-3.5" />
          <p className="font-sans text-[11px] sm:text-[12px] font-semibold tracking-[0.28em] text-[#767676] uppercase">
            {isFrench ? "ENTRONS EN CONTACT" : isArabic ? "دعنا نبقى على تواصل" : "LETS GET INTOUCH"}
          </p>
        </Reveal>
      </section>

      {/* 3. MAIN EDITORIAL 2-COLUMN SECTION: DIRECT MESSAGE & ABOUT SIDEBAR */}
      <main className="max-w-6xl mx-auto px-5 sm:px-8 lg:px-12 pb-16 sm:pb-20">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-16 items-start">
          {/* LEFT COLUMN: QUICK FORM */}
          <div className="lg:col-span-8">
            <Reveal delay={0.05}>
              <p className="font-serif text-[15px] sm:text-[17px] text-[#555555] leading-relaxed mb-8">
                {isFrench
                  ? "Que vous soyez un individu souhaitant s'impliquer, une organisation cherchant un partenaire, un acheteur international ou une institution voulant soutenir notre mission, nous sommes à votre écoute. Remplissez simplement le formulaire ci-dessous et notre équipe vous répondra rapidement."
                  : isArabic
                  ? "سواء كنت ترغب في المشاركة، أو تبحث عن شراكة، يسعدنا دائماً التواصل معك. يرجى ملء النموذج أدناه وسيقوم فريقنا بالرد عليك قريباً."
                  : "Whether you are looking to get involved, explore partnership opportunities, inquire about our programs, or simply say hello, we would love to hear from you. Please fill out the form below and we will be in touch shortly."}
              </p>
            </Reveal>

            {isSubmitted ? (
              <Reveal>
                <div
                  data-testid="contact-success-state"
                  className="bg-white border border-[#E3E0D8] p-8 sm:p-12 text-center shadow-sm"
                >
                  <div className="w-12 h-12 mx-auto rounded-full bg-maple/10 flex items-center justify-center text-maple mb-4">
                    <CheckCircle2 className="w-6 h-6" />
                  </div>
                  <h3 className="font-serif text-2xl font-normal text-[#1c1c1c] mb-2">
                    {isFrench ? "Message Envoyé" : isArabic ? "تم استلام رسالتك بنجاح" : "Message Received"}
                  </h3>
                  <p className="font-serif text-[#666] max-w-md mx-auto mb-6 text-sm sm:text-base leading-relaxed">
                    {isFrench
                      ? "Merci pour votre message. Notre équipe vous répondra dans les plus brefs délais."
                      : "Thank you for reaching out! Our team has received your message and will get back to you shortly."}
                  </p>
                  <button
                    type="button"
                    onClick={() => {
                      setFormData({ name: "", email: "", message: "" });
                      setIsSubmitted(false);
                    }}
                    className="bg-[#737373] hover:bg-[#1a1a1a] text-white font-sans text-[11px] font-bold tracking-[0.25em] uppercase px-8 py-3.5 transition-all duration-200 cursor-pointer rounded-none"
                  >
                    {isFrench ? "Envoyer un autre message" : "Send Another Message"}
                  </button>
                </div>
              </Reveal>
            ) : (
              <Reveal delay={0.1}>
                <form
                  data-testid="contact-form"
                  onSubmit={handleQuickSubmit}
                  className="space-y-6"
                >
                  {/* NAME FIELD */}
                  <div>
                    <label
                      htmlFor="form-name-input"
                      className="text-[11px] font-bold uppercase tracking-[0.18em] text-[#222222] mb-2 block"
                    >
                      {isFrench ? "NOM *" : isArabic ? "الاسم *" : "NAME *"}
                    </label>
                    <input
                      id="form-name-input"
                      data-testid="form-name-input"
                      type="text"
                      name="name"
                      required
                      value={formData.name}
                      onChange={(e) => setFormData((p) => ({ ...p, name: e.target.value }))}
                      placeholder={isFrench ? "Votre nom complet" : "Your full name"}
                      className="w-full border border-[#d6d6d6] bg-white px-4 py-3 text-sm text-[#111111] placeholder:text-[#999999] focus:border-[#111111] transition-colors rounded-none outline-none"
                    />
                  </div>

                  {/* EMAIL FIELD */}
                  <div>
                    <label
                      htmlFor="form-email-input"
                      className="text-[11px] font-bold uppercase tracking-[0.18em] text-[#222222] mb-2 block"
                    >
                      {isFrench ? "COURRIEL *" : isArabic ? "البريد الإلكتروني *" : "EMAIL *"}
                    </label>
                    <input
                      id="form-email-input"
                      data-testid="form-email-input"
                      type="email"
                      name="email"
                      required
                      value={formData.email}
                      onChange={(e) => setFormData((p) => ({ ...p, email: e.target.value }))}
                      placeholder={isFrench ? "votre.courriel@example.com" : "your.email@example.com"}
                      className="w-full border border-[#d6d6d6] bg-white px-4 py-3 text-sm text-[#111111] placeholder:text-[#999999] focus:border-[#111111] transition-colors rounded-none outline-none"
                    />
                  </div>

                  {/* MESSAGE FIELD */}
                  <div>
                    <label
                      htmlFor="form-message-input"
                      className="text-[11px] font-bold uppercase tracking-[0.18em] text-[#222222] mb-2 block"
                    >
                      {isFrench ? "MESSAGE *" : isArabic ? "الرسالة *" : "MESSAGE *"}
                    </label>
                    <textarea
                      id="form-message-input"
                      data-testid="form-message-input"
                      name="message"
                      rows={6}
                      required
                      value={formData.message}
                      onChange={(e) => setFormData((p) => ({ ...p, message: e.target.value }))}
                      placeholder={isFrench ? "Comment pouvons-nous collaborer ?" : "How can we collaborate or assist you?"}
                      className="w-full border border-[#d6d6d6] bg-white px-4 py-3.5 text-sm text-[#111111] placeholder:text-[#999999] focus:border-[#111111] transition-colors rounded-none outline-none min-h-[180px] resize-y"
                    />
                  </div>

                  {/* SUBMIT BUTTON */}
                  <div className="pt-2">
                    <button
                      id="submit-form-button"
                      data-testid="submit-form-button"
                      type="submit"
                      disabled={isSubmitting}
                      className="bg-[#737373] hover:bg-[#1a1a1a] text-white font-sans text-[11px] font-bold tracking-[0.25em] uppercase px-8 py-3.5 transition-all duration-200 cursor-pointer shadow-sm rounded-none disabled:opacity-50 flex items-center gap-2"
                    >
                      {isSubmitting ? (
                        <>
                          <Loader2 className="w-3.5 h-3.5 animate-spin" />
                          <span>{isFrench ? "ENVOI EN COURS..." : "SUBMITTING..."}</span>
                        </>
                      ) : (
                        <span>{isFrench ? "ENVOYER LE FORMULAIRE" : isArabic ? "إرسال النموذج" : "SUBMIT FORM"}</span>
                      )}
                    </button>
                  </div>
                </form>
              </Reveal>
            )}
          </div>

          {/* RIGHT COLUMN: SIDEBAR CARD WITHOUT SIGNATURE */}
          <aside className="lg:col-span-4">
            <Reveal delay={0.15}>
              <div className="bg-[#F8F7F5] border border-[#E8E6E1] p-6 sm:p-8 flex flex-col items-center text-center shadow-sm">
                {/* FRAMED TITLE */}
                <div className="w-full border-t border-[#222222]" />
                <h2 className="font-sans text-[11px] font-bold tracking-[0.25em] text-[#222222] uppercase py-2.5">
                  {isFrench ? "À PROPOS" : isArabic ? "عنا" : "ABOUT ME"}
                </h2>
                <div className="w-full border-b border-[#222222]" />

                {/* SIDEBAR PHOTO */}
                <div className="w-full aspect-[4/5] overflow-hidden my-6 shadow-sm border border-[#e2dfd7]">
                  <img
                    src={SIDEBAR_PORTRAIT_IMG}
                    alt="Cap Entrepreneurs Portrait"
                    className="w-full h-full object-cover object-center"
                    loading="lazy"
                  />
                </div>

                {/* BIO TEXT */}
                <p className="font-serif text-[13.5px] sm:text-[14px] text-[#555555] leading-relaxed mb-6">
                  {isFrench
                    ? "Cap Entrepreneurs rassemble créateurs, mentors et partenaires pour bâtir des écosystèmes entrepreneuriaux inclusifs et durables. Enracinés au Québec et rayonnant à l'international, nous accompagnons les projets à fort impact social."
                    : isArabic
                    ? "تجمع رواد أعمال كاب بين المبدعين والموجهين والشركاء لبناء نظم بيئية ريادية شاملة ومستدامة، تهدف لتمكين الجيل القادم من قادة التغيير."
                    : "Cap Entrepreneurs brings together visionaries, changemakers, and creators committed to building inclusive and sustainable entrepreneurial ecosystems. Rooted in Quebec and active globally, we support high-impact projects that empower communities to thrive."}
                </p>

                {/* QUICK CONTACT METADATA */}
                <div className="w-full border-t border-[#e2dfd7] pt-5 mt-2 flex flex-col gap-2.5 text-left text-xs text-[#666]">
                  <div className="flex items-center gap-2">
                    <Mail className="w-3.5 h-3.5 text-[#C89255] shrink-0" />
                    <a href={`mailto:${contactEmail}`} className="hover:text-[#111] transition-colors truncate">
                      {contactEmail}
                    </a>
                  </div>
                  <div className="flex items-start gap-2">
                    <MapPin className="w-3.5 h-3.5 text-[#C89255] shrink-0 mt-0.5" />
                    <span className="leading-snug">{contactAddress}</span>
                  </div>
                </div>
              </div>
            </Reveal>
          </aside>
        </div>
      </main>

      {/* 4. UPCOMING EVENTS & PROGRAM SESSIONS REGISTRATION */}
      {events.length > 0 && (
        <section className="bg-white border-t border-[#E8E6E1] py-16 sm:py-20">
          <div className="max-w-6xl mx-auto px-5 sm:px-8 lg:px-12">
            <Reveal>
              <div className="flex items-center justify-between mb-10 pb-4 border-b border-forest/10">
                <div>
                  <span className="text-xs font-bold uppercase tracking-[0.25em] text-[#C89255]">
                    {isFrench ? "CALENDRIER & SESSIONS" : "CALENDAR & SESSIONS"}
                  </span>
                  <h2 className="font-serif text-2xl sm:text-3xl md:text-4xl text-[#1c1c1c] mt-1">
                    {isFrench ? "Événements & Programmes Publics" : "Upcoming Events & Programs"}
                  </h2>
                </div>
                <Calendar className="w-8 h-8 text-[#C89255] hidden sm:block opacity-70" />
              </div>
            </Reveal>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {events.map((evt, i) => (
                <Reveal key={evt.id} delay={i * 0.05}>
                  <div className="bg-[#FAF9F6] border border-[#E8E6E1] p-6 flex flex-col justify-between h-full hover:border-[#C89255] transition-all">
                    <div>
                      <div className="flex items-center gap-2 text-[11px] font-bold uppercase tracking-wider text-[#C89255] mb-2">
                        <Calendar className="w-3.5 h-3.5" />
                        <span>{evt.start_date ? new Date(evt.start_date).toLocaleDateString() : "Session 2026-2027"}</span>
                      </div>
                      <h3 className="font-serif text-xl font-medium text-[#1c1c1c] mb-2">{evt.title}</h3>
                      {evt.location && (
                        <p className="text-xs text-[#666] flex items-center gap-1.5 mb-3">
                          <MapPin className="w-3 h-3 text-[#C89255]" />
                          <span>{evt.location}</span>
                        </p>
                      )}
                      <p className="text-sm text-[#555] line-clamp-3 mb-6 font-serif">
                        {evt.excerpt || "Session d'accompagnement et de co-création ouverte aux entrepreneurs et partenaires."}
                      </p>
                    </div>

                    <button
                      onClick={() => setSelectedEventForRsvp(evt)}
                      className="w-full bg-[#1c1c1c] hover:bg-[#C89255] text-white text-[11px] font-bold uppercase tracking-[0.2em] py-3 transition-colors rounded-none flex items-center justify-center gap-2"
                    >
                      <span>{isFrench ? "S'inscrire à la session" : "Register / RSVP"}</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </Reveal>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* EVENT RSVP MODAL */}
      {selectedEventForRsvp && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm">
          <div className="w-full max-w-lg bg-white p-7 sm:p-9 shadow-2xl relative border border-[#1c1c1c]/15">
            <button
              onClick={() => setSelectedEventForRsvp(null)}
              className="absolute top-4 right-4 text-gray-500 hover:text-black transition-colors"
            >
              ✕
            </button>
            <span className="text-[10px] font-bold uppercase tracking-[0.25em] text-[#C89255] block mb-1">
              {isFrench ? "INSCRIPTION À L'ÉVÉNEMENT" : "EVENT REGISTRATION"}
            </span>
            <h3 className="font-serif text-2xl text-[#1c1c1c] mb-4">{selectedEventForRsvp.title}</h3>

            <form onSubmit={handleRsvpSubmit} className="space-y-4">
              <div>
                <label className="text-[11px] font-bold uppercase tracking-wider text-[#222] mb-1.5 block">
                  {isFrench ? "Nom complet *" : "Full Name *"}
                </label>
                <input
                  type="text"
                  required
                  value={rsvpData.name}
                  onChange={(e) => setRsvpData((p) => ({ ...p, name: e.target.value }))}
                  className="w-full border border-[#d6d6d6] px-3.5 py-2.5 text-sm focus:border-black outline-none"
                  placeholder="Jean Dupont"
                />
              </div>

              <div>
                <label className="text-[11px] font-bold uppercase tracking-wider text-[#222] mb-1.5 block">
                  {isFrench ? "Courriel officiel *" : "Official Email *"}
                </label>
                <input
                  type="email"
                  required
                  value={rsvpData.email}
                  onChange={(e) => setRsvpData((p) => ({ ...p, email: e.target.value }))}
                  className="w-full border border-[#d6d6d6] px-3.5 py-2.5 text-sm focus:border-black outline-none"
                  placeholder="jean.dupont@example.com"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-[11px] font-bold uppercase tracking-wider text-[#222] mb-1.5 block">
                    {isFrench ? "Nombre de places" : "Participants"}
                  </label>
                  <select
                    value={rsvpData.guests}
                    onChange={(e) => setRsvpData((p) => ({ ...p, guests: e.target.value }))}
                    className="w-full border border-[#d6d6d6] px-3 py-2.5 text-sm focus:border-black outline-none bg-white"
                  >
                    <option value="1">1 Personne</option>
                    <option value="2">2 Personnes</option>
                    <option value="3">3+ Personnes</option>
                  </select>
                </div>
                <div>
                  <label className="text-[11px] font-bold uppercase tracking-wider text-[#222] mb-1.5 block">
                    {isFrench ? "Modalité" : "Format"}
                  </label>
                  <div className="border border-[#d6d6d6] px-3 py-2.5 text-sm bg-stone-50 text-stone-600">
                    {selectedEventForRsvp.is_online ? "En ligne" : "Hybride / Présentiel"}
                  </div>
                </div>
              </div>

              <div>
                <label className="text-[11px] font-bold uppercase tracking-wider text-[#222] mb-1.5 block">
                  {isFrench ? "Note ou question pour l'équipe" : "Notes / Questions"}
                </label>
                <textarea
                  rows={3}
                  value={rsvpData.note}
                  onChange={(e) => setRsvpData((p) => ({ ...p, note: e.target.value }))}
                  className="w-full border border-[#d6d6d6] px-3.5 py-2 text-sm focus:border-black outline-none resize-none"
                  placeholder={isFrench ? "Précisez vos attentes..." : "Any questions..."}
                />
              </div>

              <button
                type="submit"
                disabled={rsvpSubmitting}
                className="w-full bg-[#1c1c1c] hover:bg-[#C89255] text-white text-[11px] font-bold uppercase tracking-[0.25em] py-3.5 transition-colors disabled:opacity-50 mt-2"
              >
                {rsvpSubmitting
                  ? (isFrench ? "Confirmation en cours..." : "Confirming...")
                  : (isFrench ? "Confirmer mon inscription" : "Confirm My Registration")}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* 5. ALL TAILORED ENGAGEMENT PATHS & PROFILE FORMS */}
      <section className="border-t border-[#E8E6E1] bg-[#F4F2EC] py-20 sm:py-28" data-testid="contact-profiles">
        <div className="max-w-[1600px] mx-auto px-5 sm:px-8 lg:px-12">
          <Reveal>
            <div className="max-w-3xl mb-12">
              <span className="text-xs font-bold uppercase tracking-[0.25em] text-[#C89255]">
                {isFrench ? "FORMULAIRES D'ENGAGEMENT SPÉCIALISÉS" : "TAILORED ENGAGEMENT PATHS"}
              </span>
              <h2 className="font-heading text-3xl sm:text-4xl md:text-5xl font-black text-forest mt-2">
                {isFrench ? "Choisissez votre profil d'engagement" : "Choose Your Profile & Submit Your Dossier"}
              </h2>
              <p className="mt-4 text-base text-sage leading-relaxed font-serif">
                {isFrench
                  ? "Sélectionnez votre profil ci-dessous pour charger, remplir et signer numériquement votre formulaire officiel (Apprentissage, Bénévolat, OBNL, Entreprise, Sourcing, Mécénat, Presse)."
                  : "Select your profile below to load, complete, and digitally sign your tailored application or partnership agreement form."}
              </p>
            </div>
          </Reveal>

          {/* Profile Selector Cards */}
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 mb-16">
            {PROFILE_CONFIGS.map((p, i) => {
              const isSelected = selectedProfileId === p.id;
              return (
                <Reveal key={p.id} delay={i * 0.04}>
                  <TiltCard className="h-full">
                    <div
                      onClick={() => {
                        setSelectedProfileId(p.id);
                        document.getElementById("profile-form-container")?.scrollIntoView({ behavior: "smooth" });
                      }}
                      className={`flex h-full flex-col justify-between border p-6 rounded-none cursor-pointer transition-all ${
                        isSelected
                          ? "border-[#C89255] bg-forest text-bone shadow-xl scale-[1.02]"
                          : "border-forest/15 bg-white text-forest hover:border-forest"
                      }`}
                    >
                      <div>
                        <div className="flex items-center justify-between mb-4">
                          <span className="font-serif text-2xl italic text-[#C89255]">{p.number}</span>
                          {isSelected && <CheckCircle2 className="h-5 w-5 text-[#C89255]" />}
                        </div>
                        <p className={`text-[10.5px] font-bold uppercase tracking-wider mb-2 ${isSelected ? "text-[#C89255]" : "text-sage"}`}>
                          {p.subtitle}
                        </p>
                        <h3 className={`font-heading text-base font-bold ${isSelected ? "text-bone" : "text-forest"}`}>
                          {p.title}
                        </h3>
                      </div>

                      <div className="pt-4 border-t border-current/10 mt-6 flex items-center justify-between">
                        <span className={`text-[11px] font-bold uppercase tracking-wider ${isSelected ? "text-[#C89255]" : "text-forest"}`}>
                          {isSelected ? "Formulaire Actif" : "Ouvrir Formulaire"}
                        </span>
                        <ArrowRight className={`h-4 w-4 ${isSelected ? "text-[#C89255]" : "text-forest"}`} />
                      </div>
                    </div>
                  </TiltCard>
                </Reveal>
              );
            })}
          </div>

          {/* Active Profile Dynamic Form Shell */}
          <div id="profile-form-container" className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
            <div className="lg:col-span-4 bg-white border border-forest/15 p-8 shadow-sm">
              <span className="font-serif text-4xl italic text-[#C89255] mb-2 block">{activeConfig.number}</span>
              <p className="text-xs font-bold uppercase tracking-widest text-[#C89255]">{activeConfig.subtitle}</p>
              <h3 className="font-heading text-2xl font-black text-forest mt-2 mb-4">{activeConfig.title}</h3>
              <p className="text-sm text-sage leading-relaxed font-serif">
                {isFrench
                  ? "Ce dossier officiel est spécialement configuré pour votre profil. Remplissez tous les champs obligatoires et apposez votre signature numérique ci-dessous."
                  : "This official dossier is tailored specifically for your profile. Please complete the fields and sign below."}
              </p>
              <div className="mt-6 pt-6 border-t border-forest/10 text-xs font-bold text-forest flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-[#C89255]" />
                <span>{isFrench ? "Signature et horodatage certifiés" : "Includes digital signature & verification"}</span>
              </div>
            </div>

            <div className="lg:col-span-8 bg-white border border-forest/15 p-8 sm:p-12 shadow-sm">
              <div className="flex items-center justify-between border-b border-forest/10 pb-6 mb-8">
                <div>
                  <span className="text-xs font-bold uppercase tracking-widest text-[#C89255]">
                    {isFrench ? "DOSSIER D'ENGAGEMENT" : "DEDICATED REGISTRATION"}
                  </span>
                  <h2 className="font-heading text-2xl md:text-3xl font-black text-forest mt-1">
                    {activeConfig.subtitle} Form
                  </h2>
                </div>
                <span className="font-serif text-3xl italic text-[#C89255]">{activeConfig.number}</span>
              </div>

              <FormShell
                key={activeConfig.id}
                type={activeConfig.type}
                testId={`form-${activeConfig.id}`}
                submitLabel={activeConfig.submitLabel}
                successMessage={activeConfig.successMsg}
                fields={activeConfig.fields}
              />
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
