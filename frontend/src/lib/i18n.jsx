import { createContext, useContext, useEffect, useState } from "react";

const STR = {
  "en": {
    "nav": {
      "home": "Home",
      "about": "About",
      "programs": "Our Programs",
      "join": "Join",
      "volunteer": "Volunteer",
      "partners": "Partners",
      "festival": "Our Festival",
      "blog": "Blog",
      "contact": "Contact",
      "donate": "Donate"
    },
    "footer": {
      "quote": "“3M Services - Building inclusive, accessible and sustainable digital economies.”",
      "support": "Support the Mission",
      "explore": "Explore",
      "involved": "Get Involved",
      "bottom1": "3M Services - A Canadian non-profit organization",
      "bottom2": "Rooted in Quebec. Connected to Canada. Open to the world.",
      "privacy": "Privacy Policy",
      "terms": "Terms of Service",
      "copyright": "All rights reserved.",
      "designedBy": "3M Services Ecosystem"
    },
    "privacy": {
      "title": "Privacy Policy",
      "intro": "How 3M Services protects your data as a Canadian non-profit organization.",
      "sections": [
        {
          "title": "1. Information We Collect",
          "content": "We collect information you provide directly to us, such as when you apply to a program, volunteer, register for an initiative, or contact our team."
        },
        {
          "title": "2. How We Use Your Information",
          "content": "We use your information exclusively to facilitate program onboarding, coordinate volunteering, manage partnerships, and communicate updates."
        },
        {
          "title": "3. Sharing of Information",
          "content": "We never sell personal data. Information is only shared with collaborative partners as necessary to deliver programs and community initiatives."
        },
        {
          "title": "4. Security",
          "content": "We implement reasonable administrative, technical, and physical safeguards to protect information against unauthorized access or loss."
        },
        {
          "title": "5. Contact Us",
          "content": "If you have questions about this privacy statement, contact us at contact@3mservice.shop."
        }
      ]
    },
    "terms": {
      "title": "Terms of Service",
      "intro": "Terms and guidelines for participating in the 3M Services community and platform.",
      "sections": [
        {
          "title": "1. Acceptance of Terms",
          "content": "By accessing and using this website, you accept and agree to be bound by these terms and conditions."
        },
        {
          "title": "2. Mission & Service",
          "content": "3M Services provides access to educational programs, volunteering opportunities, partnership networks, and community resources."
        },
        {
          "title": "3. Community Conduct",
          "content": "You agree to engage constructively, respectfully, and in accordance with applicable Canadian and international laws."
        },
        {
          "title": "4. Governing Law",
          "content": "These Terms are governed by and construed in accordance with the laws of Canada and the Province of Quebec."
        }
      ]
    },
    "form": {
      "name": "Full name",
      "namePh": "Your full name",
      "email": "Email address",
      "emailPh": "you@example.com",
      "org": "Organization / Project",
      "orgPh": "If applicable",
      "sending": "Sending…",
      "error": "Something went wrong. Please try again.",
      "required": "Please fill in all required fields (*)"
    },
    "chat": {
      "launch": "Ask us",
      "openLabel": "Open the conversation",
      "closeLabel": "Close conversation",
      "title": "Assistant 3M SERVICES",
      "status": "Live answers",
      "greeting": "Hello. I can point you to the right program, volunteer pathways, or partnership team. Choose a question below or write yours.",
      "suggestionsLabel": "Suggested questions",
      "placeholder": "Write your question…",
      "sendLabel": "Send",
      "cancelLabel": "Stop reply",
      "typing": "Writing…",
      "restart": "Start over",
      "cancelled": "Reply stopped.",
      "note": "Answers are generated from our official documentation.",
      "fallback": "For anything else, our team replies to every message sent through our contact form.",
      "fallbackCta": "Write to the team",
      "errors": {
        "400": "Your question is invalid.",
        "401": "The chatbot needs reconfiguration.",
        "403": "This site is not authorized.",
        "429": "Too many requests. Please wait a moment.",
        "502": "The chatbot is temporarily unavailable.",
        "default": "An unexpected error occurred."
      },
      "topics": [
        {
          "id": "programs",
          "q": "What programs do you offer?",
          "keywords": [
            "program",
            "green",
            "agriconnect",
            "safe vibe",
            "creative",
            "skills",
            "learn"
          ],
          "a": "3M Services deploys four structuring programs: 3M Services Mobilité (Inclusive technology & circular economy), AgriConnect (Rural entrepreneurship & digital agriculture), Safe Vibe (Digital media & education), and Creative & Social Entrepreneurship (Women, arts & social innovation).",
          "ctaLabel": "Discover our programs",
          "ctaTo": "/programs"
        },
        {
          "id": "volunteer",
          "q": "How does the volunteer journey work?",
          "keywords": [
            "volunteer",
            "volunteering",
            "help",
            "give time",
            "mentor"
          ],
          "a": "Volunteering at 3M Services is an opportunity for learning, collaboration and community impact in Canada and internationally: Apply, Learn, Connect, Contribute, and Grow.",
          "ctaLabel": "Explore volunteering",
          "ctaTo": "/volunteer"
        },
        {
          "id": "partners",
          "q": "How can our organization partner with you?",
          "keywords": [
            "partner",
            "corporate",
            "institutional",
            "ngo",
            "sponsor",
            "funder"
          ],
          "a": "We collaborate with Corporate Partners, Institutional Partners, Non-Profits & Social Enterprises, Knowledge Partners, and Creative Sourcing Partners across Canada and globally.",
          "ctaLabel": "Explore partnerships",
          "ctaTo": "/partners"
        },
        {
          "id": "festival",
          "q": "What is the Global Festival Nairobi 2027?",
          "keywords": [
            "festival",
            "nairobi",
            "paris",
            "marrakech",
            "martinique",
            "2027",
            "2028"
          ],
          "a": "The Global Festival Nairobi 2027 is a worldwide gathering for inclusive, accessible and sustainable tech across four spaces: Inclusive Tech, Circular Tech, Digital Skills, and Social Innovation.",
          "ctaLabel": "View Global Festival",
          "ctaTo": "/global-festival"
        },
        {
          "id": "contact",
          "q": "How do I reach the team?",
          "keywords": [
            "contact",
            "email",
            "reach",
            "talk",
            "message"
          ],
          "a": "You can write to us at contact@3mservice.shop or submit your message directly via our contact form.",
          "ctaLabel": "Contact us",
          "ctaTo": "/contact"
        }
      ]
    },
    "home": {
      "eyebrow": "OPENING NEW HORIZONS",
      "tagline": "Rooted in Quebec. Connected to Canada. Open to the world.",
      "h1": "Building inclusive, accessible and sustainable digital economies.",
      "h1a": "Building ",
      "h1accent": "inclusive",
      "h1post": ", accessible and sustainable digital economies.",
      "h2": "Building inclusive, accessible and sustainable digital economies.",
      "intro": "We help individuals, entrepreneurs, and social impact organizations develop the digital skills, tools, and partnerships needed to create sustainable opportunities.\n\nTogether, let's transform potential into possibilities and ideas into impact.",
      "missionHeading": "Our Mission",
      "missionStatement": "Connect people, skills, technology and opportunities to build more inclusive, accessible and sustainable digital economies.",
      "discoveryTitle": "Discover Your Pathway",
      "discoverySub": "Every entrepreneur has something to contribute. Every organization has a role to play. Find your place in our ecosystem.",
      "ctas": {
        "learn": {
          "badge": "🎓 Learn",
          "title": "LEARN - Build your capabilities",
          "text": "Develop digital skills, gain practical experience and discover new ways to grow through training, mentorship and hands-on projects.",
          "action": "Explore Learning Opportunities",
          "link": "/join"
        },
        "build": {
          "badge": "🤝 Build",
          "title": "BUILD - Turn ideas into action",
          "text": "Bring your expertise, creativity and energy to initiatives that address real challenges in communities and territories.",
          "action": "Get Involved",
          "link": "/volunteer"
        },
        "impact": {
          "badge": "🏢 Create Impact",
          "title": "CREATE IMPACT - Make change possible",
          "text": "Partner with us to develop inclusive technologies, sustainable programs and opportunities that create lasting social, environmental and economic value.",
          "action": "Partner With Us",
          "link": "/partners"
        }
      },
      "fourProgramsTitle": "Four Programs. One Shared Mission.",
      "fourProgramsIntro": "Our programs transform ideas into practical solutions:",
      "h4Programs": [
        {
          "name": "3M Services Mobilité",
          "theme": "Inclusive technology, accessibility and the circular economy",
          "id": "3m-services-mobilite"
        },
        {
          "name": "AgriConnect",
          "theme": "Rural entrepreneurship, digital agriculture and access to markets",
          "id": "agriconnect"
        },
        {
          "name": "Safe Vibe",
          "theme": "Digital media, education and responsible digital citizenship",
          "id": "safe-vibe"
        },
        {
          "name": "Creative & Social Entrepreneurship",
          "theme": "Women's entrepreneurship, arts and social innovation",
          "id": "creative-social"
        }
      ],
      "h4International": "Each program contributes to a broader mission: making the digital transition more inclusive, useful and sustainable.",
      "discoverPrograms": "Discover Our Programs",
      "communitySectionTitle": "Meet the Team Behind 3M SERVICES",
      "communitySectionSub": "We are building an ecosystem of people who identify opportunities, open doors and create connections.",
      "signalSeekersTitle": "The Signal Seekers",
      "signalSeekersDesc": "We observe, explore and identify emerging trends, needs, technologies and opportunities. We help our community understand what is changing - and what could come next.",
      "doorOpenersTitle": "The Door Openers",
      "doorOpenersDesc": "We connect people, organizations and ecosystems. We help transform discoveries into relationships, collaborations and practical opportunities.",
      "communityQuote": "“These are complementary roles within one international community. Whether you are a student, entrepreneur, volunteer, professional, organization or institutional partner, there is a place for you.”",
      "h5Title": "A community built for everyone who creates opportunity",
      "h5Intro": "3M Services brings together:",
      "audiences": [
        "Entrepreneurs & Solopreneurs",
        "Non-Profit Organizations & Charities",
        "Funders, Foundations & Donors",
        "Volunteers & Mentors",
        "Institutional & Government Partners",
        "Creative & Social Innovators"
      ],
      "h5Summary": "Together, we form an ecosystem where skills become projects, projects become impact, and impact becomes lasting change.",
      "journeyTitle": "Our International Journey",
      "journeyIntro": "Our work begins with communities and extends through international collaboration.",
      "destinations": [
        {
          "city": "Paris",
          "year": "2027",
          "tag": "Pre-Festival Brunch",
          "desc": "European partnerships, transatlantic dialogue and institutional launch."
        },
        {
          "city": "Nairobi",
          "year": "2027",
          "tag": "The Global Festival",
          "desc": "Global gathering for inclusive, accessible and sustainable technology."
        },
        {
          "city": "Marrakech",
          "year": "2027",
          "tag": "Creative Sourcing",
          "desc": "African Creative Sourcing and international buyer connections."
        },
        {
          "city": "Martinique",
          "year": "2028",
          "tag": "Caribbean Expansion",
          "desc": "Caribbean expansion, blue economy and transatlantic cooperation."
        }
      ],
      "h6Title": "Ready to Open New Horizons?",
      "h6Sub": "Whether you want to develop your skills, volunteer your expertise, build a partnership or support inclusive innovation, your next step starts here.",
      "ctaJoin": "Join the Community",
      "ctaPartner": "Explore Partnerships",
      "marquee": [
        "Inclusion",
        "Accessibility",
        "Sustainability",
        "Circularity",
        "Social Innovation",
        "Global Impact"
      ],
      "involvementTitle": "How would you like to get involved?",
      "involvementKicker": "GET INVOLVED",
      "involvementCta": "Get Started",
      "involvementCards": [
        {
          "id": "skills",
          "number": "01",
          "tag": "Training & Skills",
          "title": "I want to develop my skills",
          "link": "/join",
          "submissionType": "application",
          "intro": "Join a structured journey to acquire digital, entrepreneurial, and technical skills tailored to market realities.",
          "fields": [
            {
              "name": "program",
              "label": "Desired Program",
              "kind": "select",
              "options": [
                "3M Services Mobilité - Inclusive technology & circular economy",
                "AgriConnect - Rural entrepreneurship & digital agriculture",
                "Safe Vibe - Digital media & education",
                "Creative & Social Entrepreneurship - Women, arts & innovation",
                "Other / General Orientation"
              ],
              "required": true
            },
            {
              "name": "message",
              "label": "Your goals and skills to develop",
              "kind": "textarea",
              "placeholder": "Tell us about your project, goals, and current skills...",
              "required": true
            }
          ]
        },
        {
          "id": "volunteer",
          "number": "02",
          "tag": "Civic Engagement",
          "title": "I want to volunteer",
          "link": "/volunteer",
          "submissionType": "volunteer",
          "intro": "Share your skills and energy in service of entrepreneurial and social initiatives supported by 3M SERVICES.",
          "fields": [
            {
              "name": "area",
              "label": "Area of Contribution",
              "kind": "select",
              "options": [
                "Digital Skills & Development",
                "Communication & Content Creation",
                "Business Development & Strategy",
                "Training, Workshops & Mentoring",
                "Arts, Culture & Events",
                "Project Management & Operations"
              ],
              "required": true
            },
            {
              "name": "availability",
              "label": "Availability",
              "kind": "select",
              "options": [
                "2 hrs / week",
                "4–6 hrs / week",
                "7–10 hrs / week",
                "Occasional / By project"
              ],
              "required": true
            },
            {
              "name": "message",
              "label": "Your skills & motivations",
              "kind": "textarea",
              "placeholder": "Describe your professional skills and how you would like to contribute...",
              "required": true
            }
          ]
        },
        {
          "id": "ngo",
          "number": "03",
          "tag": "Organizations",
          "title": "I represent an NGO / social enterprise",
          "link": "/partners",
          "submissionType": "partner",
          "intro": "Let's build bridges of action and co-develop concrete solutions for your communities and beneficiaries.",
          "fields": [
            {
              "name": "organization",
              "label": "Name of the NGO / Social Enterprise",
              "required": true,
              "placeholder": "Official name of your organization"
            },
            {
              "name": "country",
              "label": "Country / Region of Operation",
              "required": true,
              "placeholder": "e.g., Canada, Ivory Coast, Morocco, Senegal..."
            },
            {
              "name": "message",
              "label": "Nature of Desired Collaboration",
              "kind": "textarea",
              "placeholder": "Describe the challenges of your beneficiaries and the collaboration envisioned...",
              "required": true
            }
          ]
        },
        {
          "id": "partner",
          "number": "04",
          "tag": "Partnerships",
          "title": "I want to become a partner",
          "link": "/partners",
          "submissionType": "partner",
          "intro": "Co-build impactful programs, support sustainable economic development, and amplify your territorial impact.",
          "fields": [
            {
              "name": "organization",
              "label": "Name of Organization / Company",
              "required": true,
              "placeholder": "Name of your company or institution"
            },
            {
              "name": "partnerType",
              "label": "Type of Partnership Desired",
              "kind": "select",
              "options": [
                "Corporate Partner / Skills Sponsorship",
                "Funder / Foundation",
                "Public Institution / Government",
                "Innovation Hub / Partner Incubator",
                "University / Research Center"
              ],
              "required": true
            },
            {
              "name": "message",
              "label": "Partnership Project or Message",
              "kind": "textarea",
              "placeholder": "Share your vision or request for contact...",
              "required": true
            }
          ]
        }
      ],
      "voicesKicker": "TESTIMONIALS • VOICES OF THE COMMUNITY",
      "voicesTitle": "Supported by over 500+ participants, partners and communities.",
      "testimonials": [
        {
          "quote": "3M Services Mobilité helped our community bridge the digital divide while restoring critical hardware for local schools.",
          "author": "Sarah J.",
          "role": "Social Innovator",
          "organization": "3M Services Mobilité"
        },
        {
          "quote": "AgriConnect connected our women farmers' cooperative to modern digital tools and sustainable markets.",
          "author": "Aminata D.",
          "role": "Agricultural Cooperative Lead",
          "organization": "AgriConnect"
        },
        {
          "quote": "Collaborating across Canada, Africa and the Caribbean with 3M Services creates measurable, long-term impact.",
          "author": "Elena R.",
          "role": "Institutional Partner",
          "organization": "Alliances & Impact"
        }
      ]
    },
    "about": {
      "eyebrow": "About 3M Services",
      "h1a": "We Believe Opportunity Should Have ",
      "h1accent": "No Borders",
      "whoTitle": "WHO WE ARE",
      "whoHeading": "Building inclusive, accessible & sustainable digital economies",
      "whoText": "3M Services is a premier mobility and hospitality group headquartered in Yaoundé, Cameroon. We provide high-end automotive sales, VIP car rentals with chauffeur, and luxury furnished apartments in Yaoundé (Tsinga Face FECAFOOT, Omnisports, and Oyomabang Coming Soon). Official partner of MUPOCAM Orange Cameroon.",
      "pullQuote": "“Connecting people, skills, technology and opportunities. Making the digital transition a model of inclusive excellence worldwide.”",
      "missionTitle": "OUR MISSION",
      "missionHeading": "Connect people, skills, technology and opportunities.",
      "missionText": "We make the digital transition more accessible, particularly for people and communities facing barriers to participation. Through our programs and partnerships, we help turn knowledge into action and local initiatives into opportunities for wider collaboration.",
      "visionTitle": "OUR VISION",
      "visionHeading": "To build an inclusive, accessible and sustainable international digital ecosystem where people and organizations can learn, contribute and create impact together.",
      "visionText": "We want a future in which geography, disability, economic circumstances or limited access to technology do not determine who gets to participate in the digital economy.",
      "principlesTitle": "OUR GUIDING PRINCIPLES",
      "principles": [
        {
          "title": "Inclusion",
          "text": "We work to reduce barriers and expand meaningful participation."
        },
        {
          "title": "Accessibility",
          "text": "We believe digital tools, learning and opportunities should be designed with diverse needs in mind."
        },
        {
          "title": "Sustainability",
          "text": "We encourage responsible use of resources and solutions that create lasting value."
        },
        {
          "title": "Collaboration",
          "text": "We believe progress accelerates when people and organizations share knowledge and work together."
        },
        {
          "title": "Impact",
          "text": "We value practical outcomes, measurable progress and learning that leads to improvement."
        }
      ],
      "howTitle": "HOW WE WORK",
      "howHeading": "Collaborative & Transparent Governance",
      "howIntro": "Our ecosystem brings together five interconnected elements:",
      "howFlow": "Committees → Programs → Volunteers → Partners → Impact",
      "howSteps": [
        {
          "title": "Committees",
          "text": "Establish priorities, provide expertise and guide strategic direction."
        },
        {
          "title": "Programs",
          "text": "Turn priorities into structured initiatives addressing real community needs."
        },
        {
          "title": "Volunteers",
          "text": "Contribute skills, experience and time to meaningful projects."
        },
        {
          "title": "Partners",
          "text": "Provide financial, technical, institutional or strategic support."
        },
        {
          "title": "Impact",
          "text": "The practical difference our collective work makes in people's lives and communities."
        }
      ],
      "ecoTitle": "OUR DIGITAL ECOSYSTEM",
      "ecoIntro": "Our digital environment for collaboration, onboarding, learning, mission tracking and skills management. It supports a personalized journey for every participant:",
      "ecoFlow": "Join → Learn → Practice → Validate → Lead → Access Opportunities",
      "ecoSteps": [
        {
          "title": "Join",
          "text": "Onboard into the Écosystème 3M SERVICES",
          "icon": "👋"
        },
        {
          "title": "Learn",
          "text": "Access customized digital learning",
          "icon": "📚"
        },
        {
          "title": "Practice",
          "text": "Apply skills on real concrete projects",
          "icon": "🛠️"
        },
        {
          "title": "Validate",
          "text": "Earn certifications and badges",
          "icon": "✅"
        },
        {
          "title": "Lead",
          "text": "Take ownership and mentor others",
          "icon": "🎯"
        },
        {
          "title": "Access Opportunities",
          "text": "Connect to global partners & markets",
          "icon": "🌍"
        }
      ],
      "outlookTitle": "OUR INTERNATIONAL OUTLOOK",
      "outlookHeading": "Paris → Nairobi → Marrakech → Martinique",
      "outlookText": "We are developing connections between Canada and international communities through programs, partnerships and events. These destinations represent opportunities for exchange, collaboration and the development of a wider network of social innovators. Our point of departure is Canadian. Our perspective is international.",
      "visionFlow": "Paris 2027 → Nairobi 2027 → Marrakech 2027 → Martinique 2028 → A global network of social innovators.",
      "visionSteps": [
        {
          "year": "2027",
          "title": "Paris 2027",
          "text": "Pre-Festival Brunch & European partnership launch"
        },
        {
          "year": "2027",
          "title": "Nairobi 2027",
          "text": "Global Festival for inclusive, accessible and sustainable tech"
        },
        {
          "year": "2027",
          "title": "Marrakech 2027",
          "text": "African Creative Sourcing & international buyer programme"
        },
        {
          "year": "2028",
          "title": "Martinique 2028",
          "text": "Caribbean expansion and international cooperation"
        }
      ]
    },
    "programs": {
      "eyebrow": "Our Programs",
      "h1a": "From learning to ",
      "h1accent": "measurable impact",
      "h1post": "",
      "editionTag": "EDITION 2026-2027 • 3M SERVICES",
      "intro": "3M Services deploys four structuring programs that address the concrete needs of individuals, organizations and territories. Each program combines learning, support, hands-on experimentation and deployment - connected to our international initiatives.",
      "tocTitle": "IN THIS ARTICLE",
      "shareTitle": "SHARE",
      "exploreCta": "Explore Programs",
      "whatWeDoTitle": "What we do:",
      "forWhomTitle": "Who it's for:",
      "programsList": [
        {
          "id": "3m-services-mobilite",
          "num": "01",
          "name": "3M Services Mobilité",
          "theme": "Inclusive Technology, Accessibility and Circular Economy",
          "subtitle": "Digital Inclusion & Environmental Responsibility",
          "purpose": "Technology should be accessible to everyone - and respectful of our planet. 3M Services Mobilité is our laboratory dedicated to the intersection of digital inclusion, technical training, assistive technology and the circular economy.",
          "whatWeDo": [
            "Refurbish and extend the life of digital equipment for community distribution.",
            "Promote accessible technologies and universal design for people with disabilities.",
            "Provide hands-on training in equipment diagnostics, maintenance and repair.",
            "Offer IT support and infrastructure assistance to nonprofits and community groups.",
            "Help reduce the digital divide through accessible hardware and learning resources."
          ],
          "forWhom": "Individuals in career transition, volunteers, nonprofits, schools, community organizations and technicians.",
          "goal": "Equip people with practical skills while extending the lifecycle of technology.",
          "cta": "Explore 3M Services Mobilité"
        },
        {
          "id": "agriconnect",
          "num": "02",
          "name": "AgriConnect",
          "theme": "Rural Entrepreneurship, Digital Agriculture and Market Access",
          "subtitle": "Empowering Rural Economies",
          "purpose": "Rural communities and agricultural producers are vital to sustainable economies. AgriConnect helps agricultural cooperatives, rural entrepreneurs, women farmers and young producers adopt practical digital tools that strengthen their operations and improve access to markets.",
          "whatWeDo": [
            "Provide training on digital tools for agriculture and small business management.",
            "Support women-led agricultural cooperatives and rural initiatives.",
            "Connect local producers to regional, national and international markets.",
            "Facilitate knowledge sharing between agricultural communities."
          ],
          "forWhom": "Agricultural cooperatives, rural entrepreneurs, women farmers, young producers and agricultural support organizations.",
          "goal": "Make digital tools practical, accessible and economically useful for rural communities.",
          "cta": "Explore AgriConnect"
        },
        {
          "id": "safe-vibe",
          "num": "03",
          "name": "Safe Vibe",
          "theme": "Digital Media, Education and Responsible Digital Citizenship",
          "subtitle": "Media Literacy & Creative Expression",
          "purpose": "The digital world is a powerful space for expression, learning and connection - but it also presents real challenges around safety, disinformation and wellbeing. Safe Vibe equips youth, educators, content creators and community organizations with the skills to navigate the digital world safely, critically and creatively.",
          "whatWeDo": [
            "Deliver media literacy and critical-thinking workshops.",
            "Provide training in creative content production (video, audio, podcasting, storytelling).",
            "Promote digital safety, privacy awareness and online wellbeing.",
            "Develop basic and intermediate digital skills for everyday use."
          ],
          "forWhom": "Youth, students, educators, community organizations and aspiring content creators.",
          "goal": "Help young people and communities become informed participants and responsible creators in the digital space.",
          "cta": "Explore Safe Vibe"
        },
        {
          "id": "creatif-social",
          "num": "04",
          "name": "Creative & Social Entrepreneurship",
          "theme": "Women, Arts & Social Innovation",
          "subtitle": "Creative Ideas Deserve Sustainable Ventures",
          "purpose": "Creative ideas deserve the opportunity to become sustainable ventures. This program supports women entrepreneurs, artists, creatives and social innovators as they develop their projects, strengthen their business models and access relevant networks.",
          "whatWeDo": [
            "Support women's entrepreneurship and leadership.",
            "Encourage the development of the creative economy.",
            "Provide training in management, budgeting and project development.",
            "Facilitate networking, mentoring and access to markets."
          ],
          "forWhom": "Women entrepreneurs, artists, creatives and social-project leaders.",
          "goal": "Help creative and social initiatives grow into sustainable economic and community contributions.",
          "cta": "Explore Creative & Social Entrepreneurship"
        }
      ],
      "festivalTitle": "The Global Festival - Nairobi 2027",
      "festivalSub": "A Global Gathering for Inclusive, Accessible and Sustainable Tech",
      "festivalIntro": "The Global Festival Nairobi 2027 is planned as an international gathering bringing together innovators, entrepreneurs, institutions and communities around shared challenges and opportunities across four focus areas:",
      "festivalSpaces": [
        {
          "title": "Inclusive Tech",
          "text": "Accessibility, disability inclusion and inclusive design."
        },
        {
          "title": "Circular Tech",
          "text": "Reuse, repair and circular-economy approaches."
        },
        {
          "title": "Digital Skills",
          "text": "Training, employability and practical capabilities."
        },
        {
          "title": "Social Innovation",
          "text": "Digital solutions that respond to community needs."
        }
      ],
      "timelineTitle": "Our Roadmap",
      "timeline": [
        {
          "year": "2026",
          "step": "BUILD",
          "desc": "Structure programs, committees and partnerships."
        },
        {
          "year": "2027",
          "step": "CONNECT",
          "desc": "Mobilize communities and develop international collaborations."
        },
        {
          "year": "2027",
          "step": "PARIS",
          "desc": "Pre-Festival Brunch."
        },
        {
          "year": "2027",
          "step": "NAIROBI",
          "desc": "Global Festival."
        },
        {
          "year": "2027",
          "step": "MARRAKECH",
          "desc": "African Creative Sourcing."
        },
        {
          "year": "2028",
          "step": "MARTINIQUE",
          "desc": "International development and Caribbean partnerships."
        }
      ],
      "applyCta": "Apply to a Program",
      "formEyebrow": "Program Application",
      "formTitle": "Begin Your Journey",
      "formCopy": "Tell us about yourself, your organization or project, and which program interests you.",
      "programLabel": "Select Program",
      "programPh": "Choose a program",
      "goalsLabel": "Your Goals",
      "goalsPh": "What do you hope to accomplish through this program?",
      "submit": "Submit Application",
      "success": "Application received - our team will be in touch shortly."
    },
    "join": {
      "eyebrow": "Join the Community",
      "h1a": "Find Your Path. ",
      "h1accent": "Create Your Impact.",
      "intro": "There is more than one way to contribute to a more inclusive digital world. Whether you want to develop your skills, volunteer your expertise, represent an organization or explore international opportunities, 3M SERVICES can help you identify your next step.",
      "pathwaysTitle": "Where Do You Want to Start?",
      "pathwayOptions": [
        {
          "id": "learn",
          "icon": "🎓",
          "title": "I want to learn and grow",
          "desc": "Develop your digital capabilities, gain experience and discover opportunities to apply your skills.",
          "cta": "Start My Learning Journey",
          "link": "/programs"
        },
        {
          "id": "volunteer",
          "icon": "🤝",
          "title": "I want to contribute my skills",
          "desc": "Volunteer your time and expertise on projects connected to digital inclusion, technology, entrepreneurship or social innovation.",
          "cta": "Explore Volunteering",
          "link": "/volunteer"
        },
        {
          "id": "partner",
          "icon": "🏢",
          "title": "I represent an organization",
          "desc": "Collaborate with us on programs, knowledge sharing, community initiatives or international partnerships.",
          "cta": "Explore Partnerships",
          "link": "/partners"
        },
        {
          "id": "sourcing",
          "icon": "🛍️",
          "title": "I am an international buyer or creative professional",
          "desc": "Discover the African Creative Sourcing & Buyer Programme and explore connections with creative talent and suppliers.",
          "cta": "Explore Creative Sourcing",
          "link": "#contact-form"
        }
      ],
      "formTitle": "Join the Écosystème 3M SERVICES",
      "formCopy": "Tell us a little about yourself so we can direct you to the most relevant pathway. Your Futur 3M SERVICES could begin with a conversation.",
      "submit": "Send Message",
      "success": "Thank you for reaching out - our team will direct you to the right pathway."
    },
    "volunteer": {
      "eyebrow": "Volunteer With Us",
      "h1a": "Your Skills Can Open ",
      "h1accent": "New Horizons",
      "intro": "At 3M SERVICES, volunteering is more than giving your time. It is an opportunity to learn, collaborate, gain experience and contribute to meaningful projects in Canada and internationally. Whether you are a student, professional, consultant, specialist or executive, your knowledge can help create opportunities for others.",
      "areasTitle": "What Can You Contribute?",
      "areas": [
        "Digital skills and technology",
        "Communications and content creation",
        "Business development & strategy",
        "Training and mentoring",
        "Arts and culture",
        "Agriculture & sustainability",
        "Partnerships and relationship building",
        "Project management & operations",
        "Other professional expertise"
      ],
      "quizTitle": "Find Your Volunteer Pathway",
      "quizButton": "Start the Questionnaire",
      "q1Title": "1. What would you like to contribute?",
      "q1Options": [
        "Digital skills & tech",
        "Communications & media",
        "Business development",
        "Training & mentoring",
        "Arts & culture",
        "Agriculture & sustainability",
        "Partnerships",
        "Project management"
      ],
      "q2Title": "2. What is your experience level?",
      "q2Options": [
        "Student / Fellow",
        "Associate",
        "Professional",
        "Consultant",
        "Director / Executive"
      ],
      "q3Title": "3. How much time can you contribute?",
      "q3Options": [
        "2 hours / week",
        "4–6 hours / week",
        "7–10 hours / week",
        "Project-based"
      ],
      "resultTitle": "Your Recommended Pathway",
      "journeyTitle": "Find Your Volunteer Pathway",
      "journeyIntro": "We match your skills, interests and availability with projects where you can contribute meaningfully:",
      "steps": [
        {
          "title": "Step 1 - Apply",
          "text": "Tell us about your experience, interests and the time you can contribute."
        },
        {
          "title": "Step 2 - Learn",
          "text": "Access training or guidance suited to your role and development goals."
        },
        {
          "title": "Step 3 - Connect",
          "text": "Find a program or project aligned with your skills and interests."
        },
        {
          "title": "Step 4 - Contribute",
          "text": "Work with other members of the ecosystem to support practical initiatives."
        },
        {
          "title": "Step 5 - Grow",
          "text": "Build experience, develop new capabilities and document your contribution through certificates or badges."
        }
      ],
      "whatYouGainTitle": "What You Can Gain:",
      "whatYouGain": [
        "Practical, in-demand digital and leadership skills",
        "Valuable project and community experience",
        "International professional connections",
        "Experience contributing to measurable community impact",
        "Exposure to Canadian approaches to inclusion and sustainability",
        "Opportunities to participate in international delegations"
      ],
      "internationalTitle": "International Opportunities",
      "internationalNote": "Depending on program needs and availability, volunteers may contribute to the African Creative Sourcing & Buyer Programme or initiatives associated with the Global Festival Nairobi 2027 in logistics, communications, buyer relations, project coordination and community engagement.",
      "ctaButton": "Volunteer With Us",
      "formTitle": "Tell us how you would like to help",
      "formCopy": "Complete this short form and our volunteer coordination team will contact you.",
      "submit": "Submit Volunteer Profile",
      "success": "Thank you for getting involved - our volunteer team will be in touch shortly."
    },
    "partners": {
      "eyebrow": "Partnerships",
      "h1a": "Shared Vision. Collective Action. ",
      "h1accent": "Measurable Impact.",
      "intro": "Meaningful change happens when people and organizations combine their strengths. 3M SERVICES works with businesses, institutions, nonprofits, social enterprises, universities and creative ecosystems to develop practical initiatives that expand access to digital opportunities. We welcome partners who share our commitment to inclusion, accessibility, sustainability and international collaboration.",
      "whoTitle": "Who We Work With",
      "partnerTypes": [
        {
          "name": "Corporate Partners",
          "desc": "Support initiatives with social impact while contributing expertise, resources, technology or financial support."
        },
        {
          "name": "Institutional Partners",
          "desc": "Collaborate on priorities related to digital inclusion, sustainable development, accessibility and responsible innovation."
        },
        {
          "name": "Nonprofit & Social Enterprise Partners",
          "desc": "Develop joint programs, share resources and strengthen the reach of community initiatives."
        },
        {
          "name": "Knowledge & Ecosystem Partners",
          "desc": "Universities, research centres, incubators and networks can contribute research, expertise, mentoring and opportunities for collaboration."
        },
        {
          "name": "Creative Sourcing Partners",
          "desc": "International buyers, concept stores, architects, stylists, distributors and cultural institutions can explore connections through the African Creative Sourcing & Buyer Programme."
        }
      ],
      "foundingTitle": "Become a Founding Partner",
      "foundingSub": "Help build an inclusive and sustainable ecosystem from the ground up.",
      "foundingWhy": "Founding partners contribute to the development of programs, committees, international initiatives and community infrastructure. Across cities, cultures, and communities, we are building a connected international movement that turns shared ambition into collective impact.",
      "offersTitle": "Ways to Collaborate:",
      "offers": [
        "Paris 2027: International presence and engagement at the Pre-Festival Brunch.",
        "Nairobi 2027: Showcase and partnership visibility at the Global Festival.",
        "Marrakech 2027: Active role in the African Creative Sourcing & Buyer Programme.",
        "Committees: Governance and strategic council participation.",
        "Programs: Direct co-creation and association with one or more structuring programs.",
        "Sponsorship: Tailored packages aligned with your corporate social responsibility (CSR) objectives.",
        "In-Kind Support: Hardware, software licenses, logistics, training facilities, and professional expertise.",
        "Delegations: International delegation and cross-border exchange representation."
      ],
      "foundingClosing": "Let's build something that matters. We are interested in partnerships that go beyond visibility: partnerships that create opportunities, strengthen capabilities and produce meaningful outcomes.",
      "ctaFounding": "Become a Founding Partner",
      "ctaPackage": "Request the Partnership Package",
      "formEyebrow": "Partner Collaboration",
      "formTitle": "Let's Build Together",
      "formCopy": "Tell us about your organization and how you envision collaborating with 3M SERVICES.",
      "formSubmit": "Submit Partnership Proposal",
      "formSuccess": "Thank you for reaching out - our partnerships team will review your proposal promptly.",
      "typeLabel": "Partnership Type",
      "typePh": "Select partnership category",
      "orgLabel": "Organization Name",
      "orgPh": "Name of your company, non-profit or institution",
      "ideaLabel": "Collaboration Vision",
      "ideaPh": "Describe your goals, resources or project ideas..."
    },
    "festival": {
      "eyebrow": "The Global Festival",
      "h1a": "One Movement. Multiple Windows. ",
      "h1accent": "A World of Possibilities.",
      "intro": "The 3M SERVICES Global Festival is more than an event. It is a meeting point for ideas, people, cultures, and opportunities - bringing together entrepreneurs, innovators, organizations, and communities committed to building more inclusive, accessible, and sustainable digital economies. Rooted in Canadian know-how and open to the world, the Global Festival creates space for collaboration across borders, disciplines, and generations.",
      "subIntro": "A Global Journey, Built Together. Our international journey unfolds through a series of strategic encounters, each opening a new window onto the world.",
      "destinationsTitle": "One Vision. Many Connections.",
      "destinations": [
        {
          "city": "Paris · 2027",
          "title": "Opening New Perspectives",
          "desc": "A meeting point for ideas, partnerships, and international connections, creating new opportunities for Canadian know-how to engage with global audiences."
        },
        {
          "city": "Nairobi · 2027",
          "title": "The Global Festival",
          "desc": "The central gathering of our international movement, bringing together entrepreneurs, innovators, and partners around inclusive technology, circular innovation, digital skills, and social entrepreneurship."
        },
        {
          "city": "Marrakech · 2027",
          "title": "Connecting Creative Ecosystems",
          "desc": "A space to strengthen cross-cultural collaboration, connect creative talent, and explore new opportunities across markets and communities."
        },
        {
          "city": "Martinique · 2028",
          "title": "Expanding Our Horizons",
          "desc": "A new step in our international development, strengthening connections across the Caribbean, Canada, and wider international networks."
        }
      ],
      "spacesTitle": "What Brings Us Together - Four Interconnected Areas:",
      "spaces": [
        {
          "title": "Inclusive Technology",
          "text": "Making digital innovation more accessible, universal and inclusive."
        },
        {
          "title": "Circular Technology",
          "text": "Encouraging reuse, repair, responsible hardware, and sustainable practices."
        },
        {
          "title": "Digital Skills",
          "text": "Helping people and communities develop the skills to participate in the digital economy."
        },
        {
          "title": "Social Innovation",
          "text": "Supporting entrepreneurial solutions that respond to real community needs."
        }
      ],
      "whyAttendTitle": "Why participate?",
      "whyAttend": [
        "Meet entrepreneurs, innovators and ecosystem partners.",
        "Discover approaches to inclusive and sustainable technology.",
        "Explore collaborations across Canada, Africa, Europe and the Caribbean.",
        "Exchange knowledge and practical experience.",
        "Contribute to conversations about the future of the digital economy.",
        "Explore opportunities for international creative trade and collaboration."
      ],
      "closingText": "The world is not one destination. It is a network of possibilities waiting to be connected. 3M SERVICES - Opening New Horizons.",
      "ctaWaitlist": "Join the Waitlist",
      "ctaPartners": "Explore Partnership Opportunities"
    },
    "blog": {
      "eyebrow": "Editorial Space",
      "h1a": "Les Actualités 3M SERVICES - ",
      "h1accent": "Discover What's Possible Beyond Your Horizon",
      "intro": "Les Actualités 3M SERVICES is our editorial space for sharing ideas, people, places and opportunities that can help our community see further. Here, the Signal Seekers identify what is emerging. The Door Openers share the connections and pathways that can help turn discovery into action.",
      "subIntro": "From digital innovation to international ecosystems, from community stories to upcoming events, each window offers a new perspective.",
      "seriesTitle": "Explore Our Editorial Series",
      "series": [
        {
          "title": "The Signal Seekers",
          "tag": "Emerging Trends",
          "desc": "What are we noticing? Discover emerging trends, technologies, needs and opportunities worth watching."
        },
        {
          "title": "The Door Openers",
          "tag": "Pathways & Networks",
          "desc": "Who can we connect with? Discover people, organizations and initiatives creating pathways for collaboration."
        },
        {
          "title": "3M SERVICES Sur…",
          "tag": "Territorial Focus",
          "desc": "Explore a city, market or ecosystem. Learn about local initiatives, emerging opportunities and the people shaping change."
        },
        {
          "title": "Le Futur avec 3M SERVICES",
          "tag": "Portraits & Journeys",
          "desc": "Meet people who are learning, building, adapting and pursuing new directions."
        },
        {
          "title": "Windows of Opportunity",
          "tag": "Calls & Initiatives",
          "desc": "Discover events, calls for participation, projects, partnerships and other opportunities to get involved."
        }
      ],
      "oneCommunityTitle": "One Community. Different Perspectives.",
      "oneCommunityText": "We share knowledge across languages, sectors and territories, with content designed to be relevant to our French-speaking and English-speaking communities and our international partners.",
      "ctaShare": "Share a Story",
      "ctaContact": "Contactez l'Équipe 3M SERVICES",
      "ctaNewsletter": "Subscribe to Our Newsletter"
    },
    "contact": {
      "eyebrow": "Contact Us",
      "h1a": "Let's Find Your ",
      "h1accent": "Futur 3M SERVICES",
      "intro": "Whether you are an individual looking to get involved, an organization seeking a partner, an international buyer or an institution interested in supporting our mission, we'd like to hear from you. Tell us what you are working on, what you hope to achieve and how you would like to connect.",
      "helpTitle": "How Can We Help? Choose your profile:",
      "profiles": [
        {
          "icon": "🎓",
          "text": "I want to join the community - Discover how you can learn, contribute and connect.",
          "cta": "Join 3M SERVICES",
          "link": "/join"
        },
        {
          "icon": "🤝",
          "text": "I want to volunteer - Put your skills and experience to work on meaningful initiatives.",
          "cta": "Explore Volunteering",
          "link": "/volunteer"
        },
        {
          "icon": "🏢",
          "text": "I represent a nonprofit organization - Explore program collaboration and shared initiatives.",
          "cta": "Discuss a Partnership",
          "link": "#contact-form"
        },
        {
          "icon": "💼",
          "text": "I represent a company or institution - Discover sponsorship, strategic partnership and collaboration opportunities.",
          "cta": "Become a Partner",
          "link": "/partners"
        },
        {
          "icon": "🛍️",
          "text": "I am an international buyer or creative professional - Learn more about the African Creative Sourcing & Buyer Programme.",
          "cta": "Explore Creative Sourcing",
          "link": "#contact-form"
        },
        {
          "icon": "🌍",
          "text": "I want to support the Global Festival or an international initiative - Discuss potential sponsorship or collaboration.",
          "cta": "Explore Opportunities",
          "link": "/partners"
        },
        {
          "icon": "📰",
          "text": "I am a journalist or institutional representative - Contact us about media, communications or institutional matters.",
          "cta": "Contactez l'Équipe 3M SERVICES",
          "link": "mailto:contact@3mservice.shop"
        }
      ],
      "formTitle": "Start a Conversation",
      "formSub": "Every meaningful connection starts somewhere. Let's open the conversation.",
      "profileLabel": "Profile",
      "profilePh": "Select your profile",
      "profileOptions": [
        "Individual (Learning & Growth)",
        "Volunteer Candidate",
        "Non-Profit Organization / Charity",
        "Corporate / Company Partner",
        "International Buyer / Creative Professional",
        "Festival Sponsor / Funder",
        "Journalist / Institutional Representative",
        "Other"
      ],
      "topicLabel": "Subject",
      "topicPh": "Select a subject",
      "topicOptions": [
        "Programs & Learning",
        "Volunteering Pathway",
        "Partnership & Sponsorship",
        "African Creative Sourcing",
        "Global Festival Nairobi 2027",
        "Press & Institutional Inquiries",
        "General Inquiry"
      ],
      "messageLabel": "Message",
      "messagePh": "How can we collaborate? Tell us about your project or questions...",
      "submit": "Send Message",
      "success": "Message sent - our team will reply shortly.",
      "info": [
        {
          "label": "Email",
          "value": "contact@3mservice.shop"
        },
        {
          "label": "Location",
          "value": "1265, rue Rachel E, porte 403, Montréal (Québec) H2J 2J9 • Canada"
        },
        {
          "label": "Reach",
          "value": "Rooted in Quebec. Connected to Canada. Open to the world."
        }
      ],
      "pressTitle": "Press & Institutional Contact",
      "pressCopy": "For press relations, interview requests or institutional communications, please reach out directly to our communications office.",
      "pressEmail": "contact@3mservice.shop"
    },
    "donate": {
      "eyebrow": "Donate to 3M Services",
      "h1a": "Open New Horizons. ",
      "h1accent": "Make Opportunity Possible.",
      "intro": "Your support helps connect people, skills, technology and opportunities to build more inclusive, accessible and sustainable digital economies. At 3M SERVICES, we believe that everyone should have the opportunity to learn, innovate, participate in the digital economy and contribute to their community.",
      "subIntro": "3M Services combines premium automobile services with luxury furnished residences in Yaoundé, Cameroon. We offer certified new and pre-owned vehicles, VIP vehicle rentals, and high-standing furnished apartments.",
      "tagline": "One contribution. Shared commitment. New possibilities.",
      "ctaDonate": "Donate Now",
      "submit": "Complete My Pledge",
      "success": "Thank you for your generous pledge - our team will follow up promptly with your confirmation and receipt details."
    },
    "stories": {
      "eyebrow": "Impact Stories",
      "h1a": "Stories of ",
      "h1accent": "collaboration",
      "intro": "We share real stories of community collaboration and digital empowerment across Canada and internationally.",
      "parts": [
        [
          "Challenge",
          "challenge"
        ],
        [
          "Our Program",
          "program"
        ],
        [
          "Actions Taken",
          "actions"
        ],
        [
          "Measured Impact",
          "impact"
        ],
        [
          "Future Opportunities",
          "future"
        ]
      ],
      "ctaTitle": "Your story could be next",
      "ctaApply": "Apply to a Program",
      "ctaMember": "Join the Ecosystem"
    },
    "membership": {
      "volSuccess": "Thank you for getting involved - our team will be in touch.",
      "areaLabel": "Area of interest",
      "areaOptions": [
        "Digital skills",
        "Refurbishment & hardware",
        "Digital agriculture",
        "Media & education",
        "Women & creative entrepreneurship"
      ],
      "availLabel": "Availability",
      "skillsLabel": "Skills & experience",
      "skillsPh": "Tell us about your background and interests...",
      "joinPh": "Select one",
      "availPh": "e.g., 2h/week, 4-6h/week, project-based"
    }
  },
  "fr": {
    "nav": {
      "home": "Accueil",
      "about": "À propos",
      "programs": "Nos programmes",
      "join": "Rejoindre",
      "volunteer": "Bénévolat",
      "partners": "Partenaires",
      "festival": "Notre festival",
      "blog": "Articles",
      "contact": "Contact",
      "donate": "Faire un don"
    },
    "footer": {
      "quote": "« 3M Services - Bâtir des économies numériques inclusives, accessibles et durables. »",
      "support": "Soutenir notre mission sociale",
      "explore": "Explorer",
      "involved": "S'impliquer",
      "bottom1": "3M Services • Organisme canadien à but non lucratif",
      "bottom2": "Enraciné au Québec. Connecté au Canada. Ouvert sur le monde.",
      "privacy": "Politique de confidentialité",
      "terms": "Conditions d'utilisation",
      "copyright": "Tous droits réservés.",
      "designedBy": "Écosystème 3M Services"
    },
    "privacy": {
      "title": "Politique de confidentialité",
      "intro": "Comment 3M Services, organisme à but non lucratif canadien, protège vos renseignements personnels.",
      "sections": [
        {
          "title": "1. Renseignements recueillis",
          "content": "Nous recueillons uniquement les renseignements que vous nous transmettez directement lors de vos candidatures à nos programmes, de vos engagements bénévoles ou de vos demandes de contact."
        },
        {
          "title": "2. Utilisation des renseignements",
          "content": "Vos informations sont utilisées exclusivement pour l'accompagnement dans nos programmes, la coordination du bénévolat et la gestion des partenariats à mission sociale."
        },
        {
          "title": "3. Non-commercialisation des données",
          "content": "Nous ne vendons ni ne louons jamais vos données personnelles. Elles ne sont partagées qu'avec des partenaires de projet nécessaires à la réalisation de nos initiatives communautaires."
        },
        {
          "title": "4. Sécurité",
          "content": "Nous appliquons des mesures de sécurité administratives, techniques et physiques rigoureuses pour préserver la confidentialité de vos données."
        },
        {
          "title": "5. Pour nous joindre",
          "content": "Pour toute question relative à la protection de vos renseignements, écrivez-nous à contact@3mservice.shop."
        }
      ]
    },
    "terms": {
      "title": "Conditions d'utilisation",
      "intro": "Modalités d'engagement et règles de participation à la plateforme et aux initiatives de 3M Services.",
      "sections": [
        {
          "title": "1. Acceptation",
          "content": "L'accès et la navigation sur ce site impliquent votre acceptation sans réserve de nos conditions d'utilisation."
        },
        {
          "title": "2. Mission et services",
          "content": "3M Services offre l'accès à des programmes de formation, des opportunités de bénévolat, des réseaux d'entraide et des ressources communautaires."
        },
        {
          "title": "3. Conduite communautaire",
          "content": "Chaque participant s'engage à collaborer de manière respectueuse, constructive et solidaire, dans le respect des lois canadiennes et québécoises applicables."
        },
        {
          "title": "4. Droit applicable",
          "content": "Les présentes conditions sont régies et interprétées conformément aux lois de la province de Québec et aux lois du Canada."
        }
      ]
    },
    "form": {
      "name": "Nom complet",
      "namePh": "Votre nom complet",
      "email": "Adresse courriel",
      "emailPh": "vous@exemple.com",
      "org": "Organisation / Projet",
      "orgPh": "Le cas échéant",
      "sending": "Envoi en cours…",
      "error": "Une erreur est survenue lors de l'envoi. Veuillez réessayer.",
      "required": "Veuillez remplir tous les champs obligatoires (*)"
    },
    "chat": {
      "launch": "Nous joindre",
      "openLabel": "Ouvrir la conversation",
      "closeLabel": "Fermer la conversation",
      "title": "Assistant 3M SERVICES",
      "status": "Réponses en direct",
      "greeting": "Bonjour. Je peux vous orienter vers nos programmes de formation, nos opportunités de bénévolat ou notre équipe de partenariats. Choisissez une question ci-dessous ou écrivez votre message.",
      "suggestionsLabel": "Questions fréquentes",
      "placeholder": "Écrivez votre question…",
      "sendLabel": "Envoyer",
      "cancelLabel": "Arrêter",
      "typing": "Rédaction en cours…",
      "restart": "Recommencer",
      "cancelled": "Réponse interrompue.",
      "note": "Réponses générées à partir de la documentation officielle de notre organisme.",
      "fallback": "Notre équipe répond avec attention à chaque message transmis par le formulaire de contact.",
      "fallbackCta": "Écrire à l'équipe",
      "errors": {
        "400": "Votre demande est invalide.",
        "401": "Le module requiert une reconfiguration.",
        "403": "Accès non autorisé.",
        "429": "Trop de requêtes. Veuillez patienter un instant.",
        "502": "Le service est temporairement indisponible.",
        "default": "Une erreur inattendue est survenue."
      },
      "topics": [
        {
          "id": "programs",
          "q": "Quels sont les quatre programmes structurants ?",
          "keywords": [
            "programme",
            "green",
            "agriconnect",
            "safe vibe",
            "creative",
            "formation"
          ],
          "a": "3M Services déploie quatre programmes structurants : 3M Services Mobilité (Technologie inclusive & économie circulaire), AgriConnect (Entrepreneuriat rural & agriculture numérique), Safe Vibe (Médias numériques & éducation citoyenne), et Entrepreneuriat Créatif & Social (Femmes, arts & innovation sociale).",
          "ctaLabel": "Découvrir nos programmes",
          "ctaTo": "/programs"
        },
        {
          "id": "volunteer",
          "q": "Comment fonctionne le parcours de bénévolat ?",
          "keywords": [
            "bénévole",
            "bénévolat",
            "aider",
            "donner du temps",
            "mentorat"
          ],
          "a": "Chez 3M Services, le bénévolat est une démarche d'apprentissage mutuel et d'impact communautaire au Canada et à l'international : Postuler, Se former, Se connecter, Contribuer et Grandir.",
          "ctaLabel": "Découvrir le bénévolat",
          "ctaTo": "/volunteer"
        },
        {
          "id": "partners",
          "q": "Comment notre organisme peut-il devenir partenaire ?",
          "keywords": [
            "partenaire",
            "entreprise",
            "institution",
            "ong",
            "bailleur",
            "donateur",
            "obnl"
          ],
          "a": "Nous collaborons avec des entreprises partenaires, des institutions publiques, des OBNL et entreprises sociales, des centres de recherche et des acheteurs éthiques au Canada et dans le monde.",
          "ctaLabel": "Explorer les partenariats",
          "ctaTo": "/partners"
        },
        {
          "id": "festival",
          "q": "Qu'est-ce que le Global Festival Nairobi 2027 ?",
          "keywords": [
            "festival",
            "nairobi",
            "paris",
            "marrakech",
            "martinique",
            "2027",
            "2028"
          ],
          "a": "Le Global Festival Nairobi 2027 est un rassemblement mondial pour une tech inclusive, accessible et durable articulé autour de 4 espaces : Tech Inclusive, Tech Circulaire, Compétences Numériques et Innovation Sociale.",
          "ctaLabel": "Voir le Global Festival",
          "ctaTo": "/global-festival"
        },
        {
          "id": "contact",
          "q": "Comment joindre l'équipe ?",
          "keywords": [
            "contact",
            "courriel",
            "joindre",
            "téléphone",
            "message"
          ],
          "a": "Vous pouvez nous écrire directement à contact@3mservice.shop ou utiliser notre formulaire de contact en ligne.",
          "ctaLabel": "Nous contacter",
          "ctaTo": "/contact"
        }
      ]
    },
    "home": {
      "eyebrow": "OUVRIR DE NOUVEAUX HORIZONS",
      "tagline": "Enraciné au Québec. Connecté au Canada. Ouvert sur le monde.",
      "h1": "Bâtir des économies numériques inclusives, accessibles et durables.",
      "h1a": "Bâtir des économies numériques ",
      "h1accent": "inclusives",
      "h1post": ", accessibles et durables.",
      "h2": "Bâtir des économies numériques inclusives, accessibles et durables.",
      "intro": "Nous aidons les personnes, les entrepreneurs et les organisations à impact social à développer les compétences numériques, les outils et les partenariats nécessaires pour créer des opportunités durables.\n\nEnsemble, transformons le potentiel en possibilités et les idées en impact.",
      "missionHeading": "Notre Mission",
      "missionStatement": "Connecter les personnes, les compétences, la technologie et les opportunités pour bâtir des économies numériques plus inclusives, accessibles et durables.",
      "discoveryTitle": "Découvrez votre parcours",
      "discoverySub": "Chaque entrepreneur a quelque chose à apporter. Chaque organisation a un rôle à jouer. Trouvez votre place au sein de notre écosystème.",
      "ctas": {
        "learn": {
          "badge": "🎓 Apprendre",
          "title": "APPRENDRE - Développez vos compétences",
          "text": "Acquérez des compétences numériques concrètes et recherchées grâce à des formations appliquées, du mentorat et des projets d'utilité collective.",
          "action": "Découvrir les formations",
          "link": "/join"
        },
        "build": {
          "badge": "🤝 Bâtir",
          "title": "BÂTIR - Passez de l'idée à l'action",
          "text": "Mettez votre expertise, votre créativité et votre énergie au service d'initiatives qui répondent aux défis réels des territoires.",
          "action": "S'impliquer activement",
          "link": "/volunteer"
        },
        "impact": {
          "badge": "🏢 Créer l'impact",
          "title": "CRÉER DE L'IMPACT - Accompagnez le changement",
          "text": "Devenez partenaire pour co-concevoir des technologies inclusives, des programmes durables et des retombées sociales mesurables.",
          "action": "Devenir partenaire",
          "link": "/partners"
        }
      },
      "fourProgramsTitle": "Quatre programmes. Une même mission sociale.",
      "fourProgramsIntro": "Nos programmes transforment les idées en solutions concrètes et mesurables :",
      "h4Programs": [
        {
          "name": "3M Services Mobilité",
          "theme": "Technologie inclusive, accessibilité et économie circulaire",
          "id": "3m-services-mobilite"
        },
        {
          "name": "AgriConnect",
          "theme": "Entrepreneuriat rural, agriculture numérique et accès aux marchés",
          "id": "agriconnect"
        },
        {
          "name": "Safe Vibe",
          "theme": "Médias numériques, éducation et citoyenneté numérique responsable",
          "id": "safe-vibe"
        },
        {
          "name": "Entrepreneuriat Créatif & Social",
          "theme": "Entrepreneuriat féminin, arts et innovation sociale",
          "id": "creative-social"
        }
      ],
      "h4International": "Chaque programme contribue à un objectif collectif : rendre la transition numérique plus inclusive, utile et solidaire.",
      "discoverPrograms": "Découvrir nos programmes",
      "communitySectionTitle": "Rencontrez l'équipe 3M SERVICES",
      "communitySectionSub": "Nous bâtissons une communauté de personnes qui identifient les opportunités, ouvrent des portes et tissent des liens durables.",
      "signalSeekersTitle": "Les Éclaireurs (The Signal Seekers)",
      "signalSeekersDesc": "Nous observons, explorons et identifions les tendances émergentes, les besoins non comblés, les technologies et les opportunités pour aider notre communauté à anticiper les transformations.",
      "doorOpenersTitle": "Les Bâtisseurs de Passerelles (The Door Openers)",
      "doorOpenersDesc": "Nous connectons les personnes, les organisations et les écosystèmes pour transformer les découvertes en partenariats solides, en collaborations et en retombées concrètes.",
      "communityQuote": "« Ce sont des rôles complémentaires au sein d'une même communauté internationale. Que vous soyez étudiant, entrepreneur, bénévole, professionnel, organisme communautaire ou partenaire institutionnel, vous avez votre place parmi nous. »",
      "h5Title": "Une communauté bâtie pour tous ceux qui créent des opportunités",
      "h5Intro": "3M Services rassemble :",
      "audiences": [
        "Entrepreneurs & Travailleurs autonomes",
        "Organismes à but non lucratif & Coopératives",
        "Bailleurs de fonds, Fondations & Donateurs",
        "Bénévoles & Mentors engagés",
        "Partenaires institutionnels & Gouvernementaux",
        "Innovateurs créatifs & sociaux"
      ],
      "h5Summary": "Ensemble, nous formons un écosystème où les compétences deviennent des projets, les projets deviennent de l'impact, et l'impact devient un changement durable.",
      "journeyTitle": "Notre parcours international",
      "journeyIntro": "Notre action s'enracine dans les communautés locales et s'amplifie par la coopération internationale.",
      "destinations": [
        {
          "city": "Paris",
          "year": "2027",
          "tag": "Brunch Pré-Festival",
          "desc": "Partenariats européens, dialogue transatlantique et rayonnement institutionnel."
        },
        {
          "city": "Nairobi",
          "year": "2027",
          "tag": "Le Global Festival",
          "desc": "Grand rassemblement mondial pour la technologie inclusive, accessible et durable."
        },
        {
          "city": "Marrakech",
          "year": "2027",
          "tag": "Sourcing Créatif",
          "desc": "Programme African Creative Sourcing et rencontres d'acheteurs éthiques internationaux."
        },
        {
          "city": "Martinique",
          "year": "2028",
          "tag": "Expansion Caribéenne",
          "desc": "Déploiement caribéen, économie bleue et coopération transatlantique."
        }
      ],
      "h6Title": "Prêt à ouvrir de nouveaux horizons ?",
      "h6Sub": "Que vous souhaitiez développer vos compétences, offrir votre bénévolat, bâtir un partenariat solidaire ou soutenir l'innovation inclusive, votre futur avec 3M SERVICES commence ici.",
      "ctaJoin": "Rejoindre la communauté",
      "ctaPartner": "Devenir partenaire",
      "marquee": [
        "Inclusion",
        "Accessibilité",
        "Durabilité",
        "Circularité",
        "Innovation Sociale",
        "Impact Durable"
      ],
      "involvementTitle": "Comment souhaitez-vous vous impliquer ?",
      "involvementKicker": "S'ENGAGER",
      "involvementCta": "Commencer",
      "involvementCards": [
        {
          "id": "skills",
          "number": "01",
          "tag": "Formation & Compétences",
          "title": "Je veux développer mes compétences",
          "link": "/join",
          "submissionType": "application",
          "intro": "Rejoignez un parcours structurant pour acquérir des compétences numériques, entrepreneuriales et techniques adaptées aux réalités du marché.",
          "fields": [
            {
              "name": "program",
              "label": "Programme souhaité",
              "kind": "select",
              "options": [
                "3M Services Mobilité - Technologie inclusive & économie circulaire",
                "AgriConnect - Entrepreneuriat rural & agriculture numérique",
                "Safe Vibe - Médias numériques & éducation",
                "Entrepreneuriat Créatif & Social - Femmes, arts & innovation",
                "Autre / Orientation générale"
              ],
              "required": true
            },
            {
              "name": "message",
              "label": "Vos objectifs et compétences à développer",
              "kind": "textarea",
              "placeholder": "Parlez-nous de votre projet, vos objectifs et vos compétences actuelles...",
              "required": true
            }
          ]
        },
        {
          "id": "volunteer",
          "number": "02",
          "tag": "Engagement citoyen",
          "title": "Je veux faire du bénévolat",
          "link": "/volunteer",
          "submissionType": "volunteer",
          "intro": "Partagez vos compétences et votre énergie au service des initiatives entrepreneuriales et sociales accompagnées par 3M SERVICES.",
          "fields": [
            {
              "name": "area",
              "label": "Domaine de contribution",
              "kind": "select",
              "options": [
                "Compétences numériques & Développement",
                "Communication & Création de contenu",
                "Développement d'affaires & Stratégie",
                "Formation, Ateliers & Mentorat",
                "Arts, Culture & Événementiel",
                "Gestion de projet & Opérations"
              ],
              "required": true
            },
            {
              "name": "availability",
              "label": "Disponibilité",
              "kind": "select",
              "options": [
                "2 h / semaine",
                "4–6 h / semaine",
                "7–10 h / semaine",
                "Ponctuel / Par projet"
              ],
              "required": true
            },
            {
              "name": "message",
              "label": "Vos compétences & motivations",
              "kind": "textarea",
              "placeholder": "Décrivez vos compétences professionnelles et la manière dont vous aimeriez contribuer...",
              "required": true
            }
          ]
        },
        {
          "id": "ngo",
          "number": "03",
          "tag": "Organisations",
          "title": "Je représente une ONG / entreprise sociale",
          "link": "/partners",
          "submissionType": "partner",
          "intro": "Bâtissons des passerelles d'action et co-développons des solutions concrètes pour vos communautés et bénéficiaires.",
          "fields": [
            {
              "name": "organization",
              "label": "Nom de l'ONG / Entreprise sociale",
              "required": true,
              "placeholder": "Nom officiel de votre organisation"
            },
            {
              "name": "country",
              "label": "Pays / Région d'opération",
              "required": true,
              "placeholder": "Ex: Canada, Côte d'Ivoire, Maroc, Sénégal..."
            },
            {
              "name": "message",
              "label": "Nature de la collaboration souhaitée",
              "kind": "textarea",
              "placeholder": "Décrivez les défis de vos bénéficiaires et la collaboration envisagée...",
              "required": true
            }
          ]
        },
        {
          "id": "partner",
          "number": "04",
          "tag": "Partenariats",
          "title": "Je veux devenir partenaire",
          "link": "/partners",
          "submissionType": "partner",
          "intro": "Co-construisez des programmes d'envergure, soutenez le développement économique durable et amplifiez votre impact territorial.",
          "fields": [
            {
              "name": "organization",
              "label": "Nom de l'organisation / Entreprise",
              "required": true,
              "placeholder": "Nom de votre société ou institution"
            },
            {
              "name": "partnerType",
              "label": "Type de partenariat souhaité",
              "kind": "select",
              "options": [
                "Partenaire Entreprise / Mécénat de compétences",
                "Bailleur de fonds / Fondation",
                "Institution publique / Gouvernement",
                "Hub d'innovation / Incubateur partenaire",
                "Université / Centre de recherche"
              ],
              "required": true
            },
            {
              "name": "message",
              "label": "Projet de partenariat ou message",
              "kind": "textarea",
              "placeholder": "Partagez votre vision ou votre demande de prise de contact...",
              "required": true
            }
          ]
        }
      ],
      "voicesKicker": "TÉMOIGNAGES • LA VOIX DE LA COMMUNAUTÉ",
      "voicesTitle": "Porté par plus de 500+ participants, partenaires et communautés engagées.",
      "testimonials": [
        {
          "quote": "3M Services Mobilité a permis à notre communauté de réduire la fracture numérique tout en reconditionnant des équipements informatiques pour les écoles.",
          "author": "Sarah J.",
          "role": "Innovatrice Sociale",
          "organization": "3M Services Mobilité"
        },
        {
          "quote": "AgriConnect a relié notre coopérative agricole féminine aux outils numériques modernes et aux marchés équitables.",
          "author": "Aminata D.",
          "role": "Responsable Coopérative",
          "organization": "AgriConnect"
        },
        {
          "quote": "Collaborer avec 3M Services au Canada et à l'international crée des passerelles d'apprentissage solides et un impact humain durable.",
          "author": "Elena R.",
          "role": "Partenaire Institutionnel",
          "organization": "Alliances & Impact"
        }
      ]
    },
    "about": {
      "eyebrow": "À propos de 3M Services",
      "h1a": "L'opportunité ne devrait connaître ",
      "h1accent": "aucune frontière",
      "whoTitle": "QUI SOMMES-NOUS",
      "whoHeading": "Bâtir des économies numériques inclusives, accessibles et durables",
      "whoText": "3M Services est un groupe de référence dans les services automobiles et l'immobilier de prestige basé à Yaoundé, Cameroun. Nous assurons la vente de véhicules neufs (0 km) et occasions certifiées, la location de véhicules de prestige avec chauffeur VIP (Toyota Prado TXL), ainsi que des résidences et appartements meublés grand standing à Tsinga (en face de la FECAFOOT), Omnisports et très prochainement à Oyomabang (Coming Soon). Partenaire officiel de la MUPOCAM Orange Cameroun.",
      "pullQuote": "« Connecter les personnes, les compétences, la technologie et les opportunités. Faire de la transition numérique un modèle d'excellence inclusive et durable à travers le monde. »",
      "missionTitle": "NOTRE MISSION",
      "missionHeading": "Connecter les personnes, les compétences, la technologie et les opportunités.",
      "missionText": "Nous rendons la transition numérique accessible à tous, en particulier aux personnes et aux territoires confrontés à des barrières d'accès. Grâce à nos programmes et à nos partenariats, nous transformons le savoir en action et les initiatives locales en retombées collectives pérennes.",
      "visionTitle": "NOTRE VISION",
      "visionHeading": "Bâtir un écosystème numérique international, inclusif et durable où chacun peut apprendre, contribuer et créer de l'impact.",
      "visionText": "Nous œuvrons pour un avenir où ni la géographie, ni le handicap, ni les conditions socio-économiques ne déterminent la capacité d'une personne à participer pleinement à l'économie numérique.",
      "principlesTitle": "NOS PRINCIPES DIRECTEURS",
      "principles": [
        {
          "title": "Inclusion",
          "text": "Nous réduisons les barrières pour élargir la participation citoyenne et économique."
        },
        {
          "title": "Accessibilité",
          "text": "Les outils numériques et les formations doivent être conçus pour répondre à la diversité des besoins humains."
        },
        {
          "title": "Durabilité",
          "text": "Nous encourageons l'utilisation responsable des ressources et des solutions génératrices de valeur à long terme."
        },
        {
          "title": "Collaboration",
          "text": "Le progrès s'accélère lorsque les personnes et les organisations partagent leurs savoirs."
        },
        {
          "title": "Impact",
          "text": "Nous privilégions les résultats concrets, la mesure rigoureuse et l'amélioration continue."
        }
      ],
      "howTitle": "NOTRE FONCTIONNEMENT",
      "howHeading": "Une gouvernance collaborative et transparente",
      "howIntro": "Notre écosystème s'articule autour de cinq piliers interconnectés :",
      "howFlow": "Comités → Programmes → Bénévoles → Partenaires → Impact",
      "howSteps": [
        {
          "title": "Comités",
          "text": "Définissent les priorités stratégiques, apportent une expertise sectorielle et guident les orientations."
        },
        {
          "title": "Programmes",
          "text": "Transforment les orientations en initiatives structurées répondant à des besoins réels sur le terrain."
        },
        {
          "title": "Bénévoles",
          "text": "Apportent leurs compétences, leur énergie et leur temps précieux aux projets communautaires."
        },
        {
          "title": "Partenaires",
          "text": "Soutiennent la mission par des apports financiers, techniques, institutionnels ou stratégiques."
        },
        {
          "title": "Impact",
          "text": "Mesure la différence concrète que nos efforts collectifs apportent dans la vie des personnes et des territoires."
        }
      ],
      "ecoTitle": "NOTRE ENVIRONNEMENT NUMÉRIQUE",
      "ecoIntro": "Notre plateforme numérique dédiée à la collaboration, à l'accueil, à la formation, au suivi des missions et au développement des compétences, offrant un parcours personnalisé :",
      "ecoFlow": "Rejoindre → Apprendre → Pratiquer → Valider → Diriger → Accéder aux opportunités",
      "ecoSteps": [
        {
          "title": "Rejoindre",
          "text": "Intégrer la communauté et découvrir sa place",
          "icon": "👋"
        },
        {
          "title": "Apprendre",
          "text": "Développer des compétences numériques adaptées",
          "icon": "📚"
        },
        {
          "title": "Pratiquer",
          "text": "Mettre en pratique ses acquis sur des projets d'utilité collective",
          "icon": "🛠️"
        },
        {
          "title": "Valider",
          "text": "Faire reconnaître son engagement par des certifications et badges",
          "icon": "✅"
        },
        {
          "title": "Diriger",
          "text": "Prendre des responsabilités de projet et mentorer d'autres membres",
          "icon": "🎯"
        },
        {
          "title": "Accéder aux opportunités",
          "text": "Se connecter aux réseaux d'organisations partenaires",
          "icon": "🌍"
        }
      ],
      "outlookTitle": "NOTRE PERSPECTIVE INTERNATIONALE",
      "outlookHeading": "Paris → Nairobi → Marrakech → Martinique",
      "outlookText": "Nous tissons des liens solides entre le Canada et les communautés internationales par le biais de nos programmes, partenariats et rencontres. Ces destinations sont autant d'occasions d'échanges solidaires et de partage de compétences. Notre point de départ est canadien ; notre portée est résolument internationale.",
      "visionFlow": "Paris 2027 → Nairobi 2027 → Marrakech 2027 → Martinique 2028 → Un réseau mondial d'innovateurs sociaux.",
      "visionSteps": [
        {
          "year": "2027",
          "title": "Paris 2027",
          "text": "Brunch pré-festival & lancement des partenariats européens"
        },
        {
          "year": "2027",
          "title": "Nairobi 2027",
          "text": "Global Festival pour la tech inclusive, accessible et durable"
        },
        {
          "year": "2027",
          "title": "Marrakech 2027",
          "text": "Programme de sourcing créatif africain & acheteurs éthiques"
        },
        {
          "year": "2028",
          "title": "Martinique 2028",
          "text": "Déploiement caribéen et coopération internationale"
        }
      ]
    },
    "programs": {
      "eyebrow": "Nos Programmes",
      "h1a": "De l'apprentissage à ",
      "h1accent": "l'impact mesurable",
      "h1post": "",
      "editionTag": "ÉDITION 2026-2027 • 3M SERVICES",
      "intro": "3M Services déploie quatre programmes structurants qui répondent aux besoins concrets des individus, des organisations et des territoires. Chaque programme combine apprentissage pratique, accompagnement, expérimentation sur le terrain et déploiement solidaire - en lien avec nos initiatives internationales.",
      "tocTitle": "DANS CET ARTICLE",
      "shareTitle": "PARTAGER",
      "exploreCta": "Explorer les programmes",
      "whatWeDoTitle": "Ce que nous faisons :",
      "forWhomTitle": "Pour qui ?",
      "programsList": [
        {
          "id": "3m-services-mobilite",
          "num": "01",
          "name": "3M Services Mobilité",
          "theme": "Technologie inclusive, accessibilité et économie circulaire",
          "subtitle": "Inclusion numérique & responsabilité environnementale",
          "purpose": "La technologie doit être accessible à tous - et respectueuse de notre planète. 3M Services Mobilité est notre laboratoire dédié à la convergence de l'inclusion numérique, de la formation technique, de l'accessibilité technologique et de l'économie circulaire.",
          "whatWeDo": [
            "Reconditionner et prolonger la durée de vie des équipements informatiques pour les redistribuer aux communautés dans le besoin.",
            "Promouvoir les technologies d'accessibilité et le design universel pour les personnes en situation de handicap.",
            "Former au diagnostic, à la maintenance et à la réparation de matériel informatique.",
            "Accompagner les OBNL et écoles dans la gestion et l'optimisation de leur parc technologique.",
            "Réduire la fracture numérique grâce à des ressources matérielles et éducatives accessibles."
          ],
          "forWhom": "Personnes en transition professionnelle, bénévoles, OBNL, écoles, collectivités locales et techniciens.",
          "goal": "Développer des compétences techniques valorisantes tout en réduisant l'empreinte environnementale du numérique.",
          "cta": "Découvrir 3M Services Mobilité"
        },
        {
          "id": "agriconnect",
          "num": "02",
          "name": "AgriConnect",
          "theme": "Entrepreneuriat rural, agriculture numérique et accès aux marchés",
          "subtitle": "Renforcer les économies rurales",
          "purpose": "Les communautés rurales et les producteurs agricoles sont au cœur du développement durable. AgriConnect accompagne les coopératives agricoles, les femmes rurales et les jeunes producteurs dans l'adoption d'outils numériques concrets qui renforcent leurs activités et ouvrent l'accès aux marchés.",
          "whatWeDo": [
            "Offrir des formations adaptées aux outils numériques de gestion agricole et coopérative.",
            "Soutenir les coopératives agricoles dirigées par des femmes et les initiatives de jeunes ruraux.",
            "Relier les producteurs locaux aux marchés régionaux, nationaux et équitables.",
            "Favoriser le partage d'expériences entre coopératives et territoires agricoles."
          ],
          "forWhom": "Coopératives agricoles, producteurs ruraux, femmes entrepreneures agricoles et organismes d'appui au développement rural.",
          "goal": "Rendre les outils numériques utiles, accessibles et économiquement émancipateurs pour les milieux ruraux.",
          "cta": "Découvrir AgriConnect"
        },
        {
          "id": "safe-vibe",
          "num": "03",
          "name": "Safe Vibe",
          "theme": "Médias numériques, éducation et citoyenneté numérique responsable",
          "subtitle": "Éducation aux médias & expression citoyenne",
          "purpose": "Le monde numérique est un espace formidable d'apprentissage et de partage, mais il soulève également des enjeux majeurs de sécurité, de désinformation et de bien-être. Safe Vibe outille les jeunes, éducateurs et créateurs pour naviguer dans l'espace numérique avec discernement, bienveillance et responsabilité.",
          "whatWeDo": [
            "Animer des ateliers d'éducation aux médias et au développement de l'esprit critique.",
            "Former à la création de contenus éthiques (vidéo, baladodiffusion, rédaction, médias sociaux).",
            "Sensibiliser à la sécurité en ligne, à la protection des données personnelles et au bien-être numérique.",
            "Développer les compétences numériques de base et intermédiaires pour le quotidien."
          ],
          "forWhom": "Jeunes, étudiants, éducateurs, organismes jeunesse et créateurs de contenu émergents.",
          "goal": "Aider les jeunes et les communautés à devenir des citoyens numériques éclairés, critiques et responsables.",
          "cta": "Découvrir Safe Vibe"
        },
        {
          "id": "creatif-social",
          "num": "04",
          "name": "Entrepreneuriat Créatif & Social",
          "theme": "Femmes, arts & innovation sociale",
          "subtitle": "Donner vie aux initiatives porteuses de sens",
          "purpose": "Les démarches créatives méritent de trouver des modèles pérennes. Ce programme accompagne les femmes entrepreneures, artistes, artisanes et actrices du changement social dans la structuration de leurs projets et le développement d'activités durables.",
          "whatWeDo": [
            "Soutenir le leadership et l'entrepreneuriat féminin à vocation sociale.",
            "Valoriser l'économie créative, l'artisanat et les métiers d'art.",
            "Dispenser des formations en gestion, en planification et en développement de projets.",
            "Faciliter le maillage professionnel, le mentorat et l'accès à des réseaux de diffusion éthiques."
          ],
          "forWhom": "Femmes entrepreneures, artistes, créatrices et porteuses de projets d'innovation sociale.",
          "goal": "Transformer des initiatives créatives en activités pérennes et porteuses de retombées communautaires.",
          "cta": "Découvrir Entrepreneuriat Créatif & Social"
        }
      ],
      "festivalTitle": "Le Global Festival - Nairobi 2027",
      "festivalSub": "Rassemblement mondial pour une tech inclusive, accessible et durable",
      "festivalIntro": "Le Global Festival Nairobi 2027 réunira innovateurs, entrepreneurs sociaux, institutions et communautés autour de quatre espaces thématiques :",
      "festivalSpaces": [
        {
          "title": "Tech Inclusive",
          "text": "Accessibilité universelle, handicap et design inclusif."
        },
        {
          "title": "Tech Circulaire",
          "text": "Réemploi, reconditionnement, réparabilité et économie circulaire."
        },
        {
          "title": "Compétences Numériques",
          "text": "Formation pratique, employabilité et inclusion économique."
        },
        {
          "title": "Innovation Sociale",
          "text": "Solutions technologiques au service des besoins collectifs."
        }
      ],
      "timelineTitle": "Notre calendrier d'action",
      "timeline": [
        {
          "year": "2026",
          "step": "BÂTIR",
          "desc": "Structuration des comités, programmes et alliances stratégiques."
        },
        {
          "year": "2027",
          "step": "CONNECTER",
          "desc": "Déploiement des cohortes et mobilisation des partenaires."
        },
        {
          "year": "2027",
          "step": "PARIS",
          "desc": "Brunch Pré-Festival et rencontres européennes."
        },
        {
          "year": "2027",
          "step": "NAIROBI",
          "desc": "Global Festival pour la technologie solidaire et durable."
        },
        {
          "year": "2027",
          "step": "MARRAKECH",
          "desc": "Programme African Creative Sourcing et acheteurs éthiques."
        },
        {
          "year": "2028",
          "step": "MARTINIQUE",
          "desc": "Développement international et rayonnement caribéen."
        }
      ],
      "applyCta": "Postuler à ce programme",
      "formEyebrow": "Candidature au programme",
      "formTitle": "Débuter votre parcours",
      "formCopy": "Parlez-nous de vous, de votre initiative et du programme qui correspond le mieux à vos objectifs. Notre équipe étudiera votre demande avec attention.",
      "programLabel": "Programme souhaité",
      "programPh": "Sélectionnez un programme",
      "goalsLabel": "Vos objectifs et motivations",
      "goalsPh": "Que souhaitez-vous accomplir grâce à ce programme ?",
      "submit": "Soumettre ma candidature",
      "success": "Candidature reçue avec succès - notre équipe prendra contact avec vous très rapidement."
    },
    "join": {
      "eyebrow": "Rejoindre l'écosystème",
      "h1a": "Trouvez votre parcours. ",
      "h1accent": "Créez votre impact.",
      "intro": "Il existe de multiples façons de contribuer à un monde numérique plus juste et solidaire. Que vous souhaitiez développer vos compétences, offrir votre bénévolat, représenter un organisme communautaire ou explorer des partenariats, 3M Services est là pour vous accompagner.",
      "pathwaysTitle": "Par où souhaitez-vous commencer ?",
      "pathwayOptions": [
        {
          "id": "learn",
          "icon": "🎓",
          "title": "Je veux apprendre et me perfectionner",
          "desc": "Développez des compétences numériques concrètes et recherchées grâce à des formations appliquées et des projets collectifs.",
          "cta": "Découvrir nos formations",
          "link": "/programs"
        },
        {
          "id": "volunteer",
          "icon": "🤝",
          "title": "Je veux faire du bénévolat",
          "desc": "Mettez votre temps et votre savoir-faire au service d'initiatives utiles en technologie, agriculture, médias ou innovation sociale.",
          "cta": "Découvrir le bénévolat",
          "link": "/volunteer"
        },
        {
          "id": "partner",
          "icon": "🏢",
          "title": "Je représente un organisme ou une institution",
          "desc": "Collaborez avec nous sur des programmes partagés, du mécénat de compétences ou des initiatives de développement durable.",
          "cta": "Devenir partenaire",
          "link": "/partners"
        },
        {
          "id": "sourcing",
          "icon": "🛍️",
          "title": "Je suis acheteur international ou créateur",
          "desc": "Découvrez le programme African Creative Sourcing & Buyer et connectez-vous avec des talents et coopératives éthiques.",
          "cta": "Rejoindre le sourcing éthique",
          "link": "#contact-form"
        }
      ],
      "formTitle": "Rejoindre l'univers 3M SERVICES",
      "formCopy": "Dites-nous qui vous êtes afin que nous puissions vous orienter vers la démarche la plus adaptée. Votre futur avec 3M SERVICES commence par un premier échange.",
      "submit": "Transmettre ma demande",
      "success": "Merci pour votre message - notre équipe vous répondra dans les plus brefs délais."
    },
    "volunteer": {
      "eyebrow": "S'impliquer en bénévolat",
      "h1a": "Vos compétences peuvent ouvrir de ",
      "h1accent": "nouveaux horizons",
      "intro": "Chez 3M Services, le bénévolat est bien plus qu'un don de temps : c'est une occasion d'apprendre, de collaborer et d'avoir un impact tangible sur les communautés au Canada et à l'international. Que vous soyez étudiant, professionnel, consultant, artisan ou gestionnaire, votre savoir-faire peut changer des vies.",
      "areasTitle": "Comment pouvez-vous contribuer ?",
      "areas": [
        "Compétences numériques et développement web",
        "Communication, rédaction et médias sociaux",
        "Stratégie de projet et développement",
        "Formation, mentorat et animation d'ateliers",
        "Arts, culture et artisanat",
        "Agriculture et transition écologique",
        "Développement de partenariats et relations publiques",
        "Gestion de projet et logistique",
        "Autres expertises professionnelles"
      ],
      "quizTitle": "Trouver votre parcours bénévole",
      "quizButton": "Commencer le questionnaire",
      "q1Title": "1. Que souhaitez-vous apporter ?",
      "q1Options": [
        "Compétences numériques & tech",
        "Communication & médias",
        "Développement de projet",
        "Formation & mentorat",
        "Arts & culture",
        "Agriculture & écologie",
        "Partenariats",
        "Gestion de projet"
      ],
      "q2Title": "2. Quel est votre niveau d'expérience ?",
      "q2Options": [
        "Étudiant / Relève",
        "Associé",
        "Professionnel",
        "Consultant",
        "Directeur / Dirigeant"
      ],
      "q3Title": "3. Combien de temps pouvez-vous consacrer ?",
      "q3Options": [
        "2 heures / semaine",
        "4–6 heures / semaine",
        "7–10 heures / semaine",
        "Par projet ponctuel"
      ],
      "resultTitle": "Votre parcours recommandé",
      "journeyTitle": "Le parcours de nos bénévoles",
      "journeyIntro": "Nous harmonisons vos compétences, vos champs d'intérêt et votre disponibilité avec des projets où votre action aura un sens réel :",
      "steps": [
        {
          "title": "Étape 1 - Candidature",
          "text": "Partagez votre parcours, vos motivations et le temps que vous souhaitez offrir."
        },
        {
          "title": "Étape 2 - Accueil & Formation",
          "text": "Bénéficiez d'une séance d'orientation et de formations adaptées à votre mission."
        },
        {
          "title": "Étape 3 - Jumelage",
          "text": "Rejoignez un projet ou un programme aligné avec vos aspirations."
        },
        {
          "title": "Étape 4 - Contribution",
          "text": "Collaborez activement avec l'équipe et les participants de l'écosystème."
        },
        {
          "title": "Étape 5 - Reconnaissance",
          "text": "Développez votre réseau et faites reconnaître vos contributions via des attestations officielles."
        }
      ],
      "whatYouGainTitle": "Ce que vous apporte l'engagement :",
      "whatYouGain": [
        "Des compétences numériques et de gestion de projet valorisantes",
        "Une expérience concrète au sein d'un organisme à impact social",
        "Un réseau professionnel étendu au Canada et à l'international",
        "La fierté de contribuer à réduire la fracture numérique et sociale",
        "Une immersion dans les pratiques canadiennes de gouvernance éthique",
        "L'opportunité de participer à des missions internationales"
      ],
      "internationalTitle": "Missions internationales",
      "internationalNote": "Selon les besoins et vos disponibilités, les bénévoles peuvent également participer au programme African Creative Sourcing ou aux activités préparatoires du Global Festival Nairobi 2027 (coordination, relations participantes, logistique et communication).",
      "ctaButton": "Devenir bénévole",
      "formTitle": "Dites-nous comment vous souhaitez vous impliquer",
      "formCopy": "Remplissez ce court formulaire et notre responsable du bénévolat prendra contact avec vous.",
      "submit": "Soumettre ma candidature bénévole",
      "success": "Merci pour votre engagement généreux - notre équipe vous contactera sous peu."
    },
    "partners": {
      "eyebrow": "Partenariats à mission sociale",
      "h1a": "Vision partagée. Action collective. ",
      "h1accent": "Impact mesurable.",
      "intro": "Les changements profonds naissent de la mise en commun des forces. 3M Services collabore avec des entreprises citoyennes, des institutions publiques, des OBNL, des coopératives et des universités pour bâtir des initiatives numériques équitables et pérennes. Nous accueillons avec enthousiasme les partenaires qui partagent nos valeurs d'inclusion, d'accessibilité et de solidarité.",
      "whoTitle": "Avec qui collaborons-nous ?",
      "partnerTypes": [
        {
          "name": "Partenaires Entreprises",
          "desc": "Soutenez des projets d'utilité collective par du mécénat financier, du don d'équipements technologiques ou du mécénat de compétences."
        },
        {
          "name": "Partenaires Institutionnels & Publics",
          "desc": "Unissez vos priorités publiques (inclusion numérique, employabilité, développement durable) à nos actions concrètes sur le terrain."
        },
        {
          "name": "OBNL & Entreprises Sociales",
          "desc": "Co-développons des programmes communs, partageons des ressources et amplifions l'impact pour les communautés desservies."
        },
        {
          "name": "Partenaires Académiques & Écosystèmes",
          "desc": "Universités, cégeps, centres de recherche et incubateurs : contribuez par la recherche appliquée, le mentorat et l'innovation sociale."
        },
        {
          "name": "Acheteurs et diffuseurs éthiques",
          "desc": "Boutiques équitables, architectes, stylistes, institutions culturelles : participez au programme African Creative Sourcing pour soutenir l'artisanat durable."
        }
      ],
      "foundingTitle": "Devenir Partenaire Fondateur",
      "foundingSub": "Contribuez dès aujourd'hui à l'essor d'un écosystème inclusif et pérenne.",
      "foundingWhy": "En devenant partenaire fondateur, vous contribuez directement au déploiement de programmes structurants, à l'équipement des communautés et aux passerelles transatlantiques. Chaque alliance renforce notre capacité d'action collective.",
      "offersTitle": "Opportunités de collaboration :",
      "offers": [
        "Paris 2027 : Présence et visibilité internationale au Brunch Pré-Festival.",
        "Nairobi 2027 : Espace d'exposition et engagement au Global Festival.",
        "Marrakech 2027 : Participation active au programme African Creative Sourcing.",
        "Comités consultatifs : Participation aux instances de gouvernance et d'orientation.",
        "Parrainage de programmes : Association directe à l'un de nos programmes structurants.",
        "Commandite philanthropique : Forfaits adaptés aux objectifs de responsabilité sociale (RSE).",
        "Dons en nature : Matériel informatique, licences logicielles, locaux ou compétences clés.",
        "Délégations internationales : Représentation conjointe lors de rencontres transfrontalières."
      ],
      "foundingClosing": "Bâtissons ensemble un partenariat porteur de sens. Nous privilégions les collaborations qui dépassent la simple visibilité pour créer des opportunités durables sur le terrain.",
      "ctaFounding": "Devenir partenaire fondateur",
      "ctaPackage": "Demander notre dossier de partenariat",
      "formEyebrow": "Proposition de partenariat",
      "formTitle": "Bâtissons ensemble",
      "formCopy": "Présentez-nous votre organisation et votre vision d'une collaboration avec 3M Services.",
      "formSubmit": "Transmettre notre proposition",
      "formSuccess": "Merci pour votre démarche - notre équipe des partenariats communiquera avec vous rapidement.",
      "typeLabel": "Catégorie de partenariat",
      "typePh": "Sélectionnez une catégorie",
      "orgLabel": "Nom de l'organisation",
      "orgPh": "Entreprise, OBNL, fondation ou institution",
      "ideaLabel": "Projet de collaboration envisagé",
      "ideaPh": "Partagez vos objectifs, vos ressources ou vos idées de projets communs..."
    },
    "festival": {
      "eyebrow": "Le Global Festival",
      "h1a": "Un mouvement solidaire. De multiples fenêtres. ",
      "h1accent": "Un monde d'opportunités.",
      "intro": "Le Global Festival de 3M Services est bien plus qu'un simple événement : c'est un carrefour mondial d'idées, de personnes, de cultures et d'opportunités. Il réunit des innovateurs, des organismes communautaires, des institutions et des citoyens résolus à bâtir une économie numérique plus inclusive, accessible et durable. Enraciné dans le savoir-faire canadien et ouvert sur le monde, il favorise la coopération au-delà des frontières et des générations.",
      "subIntro": "Un voyage international, bâti collectivement. Notre démarche se déploie à travers une série de rencontres stratégiques, ouvrant chacune une nouvelle fenêtre sur le monde.",
      "destinationsTitle": "Une vision partagée. Des liens durables.",
      "destinations": [
        {
          "city": "Paris · 2027",
          "title": "Ouvrir de nouvelles perspectives",
          "desc": "Un espace de maillage d'idées, de partenariats et de liens transatlantiques, valorisant l'expertise canadienne auprès d'audiences européennes et internationales."
        },
        {
          "city": "Nairobi · 2027",
          "title": "Le Global Festival",
          "desc": "Le rassemblement central de notre mouvement, réunissant innovateurs sociaux et partenaires autour de la tech inclusive, de l'économie circulaire et des compétences numériques."
        },
        {
          "city": "Marrakech · 2027",
          "title": "Relier les écosystèmes créatifs",
          "desc": "Un espace privilégié pour renforcer la coopération interculturelle, soutenir les créateurs et ouvrir de nouveaux marchés éthiques."
        },
        {
          "city": "Martinique · 2028",
          "title": "Élargir nos horizons caribéens",
          "desc": "Une étape nouvelle de notre développement international, renforçant les passerelles entre les Caraïbes, le Canada et les réseaux solidaires mondiaux."
        }
      ],
      "spacesTitle": "Nos quatre espaces thématiques :",
      "spaces": [
        {
          "title": "Technologie Inclusive",
          "text": "Rendre l'innovation technologique accessible à tous, notamment aux personnes en situation de handicap."
        },
        {
          "title": "Technologie Circulaire",
          "text": "Encourager le réemploi, la réparabilité, la sobriété numérique et les pratiques durables."
        },
        {
          "title": "Compétences Numériques",
          "text": "Former les citoyens et les jeunes pour favoriser une réelle émancipation économique."
        },
        {
          "title": "Innovation Sociale",
          "text": "Accompagner les solutions technologiques qui répondent aux besoins essentiels des communautés."
        }
      ],
      "whyAttendTitle": "Pourquoi participer ?",
      "whyAttend": [
        "Rencontrer des entrepreneurs sociaux, des innovateurs et des partenaires engagés.",
        "Découvrir des approches concrètes en technologie inclusive et durable.",
        "Bâtir des collaborations transfrontalières entre le Canada, l'Afrique, l'Europe et les Caraïbes.",
        "Partager des compétences et des retours d'expérience du terrain.",
        "Contribuer aux réflexions sur l'avenir éthique de l'économie numérique.",
        "Explorer de nouveaux débouchés pour le commerce équitable et créatif."
      ],
      "closingText": "Le monde n'est pas une destination unique. C'est un réseau de possibilités prêtes à être reliées. 3M Services - Ouvrir de nouveaux horizons.",
      "ctaWaitlist": "Rejoindre la liste d'attente",
      "ctaPartners": "Explorer les partenariats du Festival"
    },
    "blog": {
      "eyebrow": "Espace Éditorial",
      "h1a": "Les Actualités 3M SERVICES - ",
      "h1accent": "Découvrez ce qui est possible au-delà de votre horizon",
      "intro": "Les Actualités 3M SERVICES est notre publication éditoriale pour partager les idées, les personnes, les initiatives et les opportunités qui permettent à notre communauté de voir plus loin. Les Éclaireurs y décryptent les tendances émergentes, tandis que les Bâtisseurs de Passerelles partagent les maillages propices à l'action.",
      "subIntro": "De l'innovation solidaire aux écosystèmes internationaux, des récits de nos bénéficiaires aux événements à venir, chaque fenêtre offre une perspective stimulante.",
      "seriesTitle": "Découvrez nos rubriques éditoriales",
      "series": [
        {
          "title": "Les Éclaireurs (The Signal Seekers)",
          "tag": "Tendances émergentes",
          "desc": "Que constatons-nous sur le terrain ? Découvrez les tendances, technologies et opportunités à suivre de près."
        },
        {
          "title": "Les Bâtisseurs (The Door Openers)",
          "tag": "Passerelles & Réseaux",
          "desc": "Avec qui collaborer ? Découvrez des personnes et organisations qui ouvrent des portes vers des projets collectifs."
        },
        {
          "title": "3M SERVICES Sur…",
          "tag": "Focus Territoire",
          "desc": "Explorez une ville, un territoire ou un écosystème. Découvrez des initiatives locales et des porteurs de changement."
        },
        {
          "title": "Le Futur avec 3M SERVICES",
          "tag": "Portraits & Trajectoires",
          "desc": "Partez à la rencontre de participants qui apprennent, bâtissent et tracent de nouvelles voies professionnelles."
        },
        {
          "title": "Fenêtres d'opportunités",
          "tag": "Appels & Événements",
          "desc": "Consultez les appels à participation, formations, bourses et événements pour vous impliquer activement."
        }
      ],
      "oneCommunityTitle": "Une communauté solidaire. Des regards pluriels.",
      "oneCommunityText": "Nous partageons nos connaissances à travers les langues, les secteurs et les territoires, en portant une attention égale à nos communautés francophones, anglophones et internationales.",
      "ctaShare": "Proposer un sujet",
      "ctaContact": "Écrire à la rédaction",
      "ctaNewsletter": "S'inscrire à notre infolettre"
    },
    "contact": {
      "eyebrow": "Nous joindre",
      "h1a": "Trouvons votre ",
      "h1accent": "futur avec 3M SERVICES",
      "intro": "Que vous soyez un citoyen désireux de vous impliquer, un organisme en quête de partenariats, un bailleur de fonds souhaitant soutenir notre mission ou un professionnel des médias, nous serons ravis d'échanger avec vous. Parlez-nous de vos projets et de vos aspirations.",
      "helpTitle": "Comment pouvons-nous vous aider ? Choisissez votre profil :",
      "profiles": [
        {
          "icon": "🎓",
          "text": "Je veux rejoindre la communauté - Découvrir nos formations et opportunités d'apprentissage.",
          "cta": "Rejoindre 3M Services",
          "link": "/join"
        },
        {
          "icon": "🤝",
          "text": "Je veux faire du bénévolat - Mettre mes compétences au service d'initiatives utiles.",
          "cta": "Découvrir le bénévolat",
          "link": "/volunteer"
        },
        {
          "icon": "🏢",
          "text": "Je représente un organisme à but non lucratif - Échanger sur des projets communs ou du maillage.",
          "cta": "Discuter d'un partenariat",
          "link": "#contact-form"
        },
        {
          "icon": "💼",
          "text": "Je représente une entreprise ou institution - Explorer les opportunités de commandite ou de mécénat.",
          "cta": "Devenir partenaire",
          "link": "/partners"
        },
        {
          "icon": "🛍️",
          "text": "Je suis acheteur international ou créateur - En savoir plus sur le programme de sourcing éthique.",
          "cta": "Rejoindre le sourcing",
          "link": "#contact-form"
        },
        {
          "icon": "🌍",
          "text": "Je veux soutenir le Global Festival - Discuter d'un soutien ou d'une participation.",
          "cta": "Soutenir le festival",
          "link": "/partners"
        },
        {
          "icon": "📰",
          "text": "Je suis journaliste ou représentant institutionnel - Contacter notre bureau de presse.",
          "cta": "Contact relations médias",
          "link": "mailto:contact@3mservice.shop"
        }
      ],
      "formTitle": "Engageons la conversation",
      "formSub": "Chaque collaboration féconde commence par un premier dialogue. Écrivez-nous en toute simplicité.",
      "profileLabel": "Votre profil",
      "profilePh": "Sélectionnez votre profil",
      "profileOptions": [
        "Individu (Apprentissage & Perfectionnement)",
        "Candidat au bénévolat",
        "Organisme à but non lucratif / Coopérative",
        "Entreprise citoyenne / Partenaire corporatif",
        "Acheteur éthique / Créateur international",
        "Bailleur de fonds / Donateur / Fondation",
        "Journaliste / Représentant institutionnel",
        "Autre démarche"
      ],
      "topicLabel": "Objet de votre message",
      "topicPh": "Sélectionnez un sujet",
      "topicOptions": [
        "Programmes & Formations",
        "Engagement bénévole",
        "Partenariats & Soutien financier",
        "African Creative Sourcing",
        "Global Festival Nairobi 2027",
        "Relations médias & Institutionnelles",
        "Demande générale d'information"
      ],
      "messageLabel": "Votre message",
      "messagePh": "Parlez-nous de vos besoins, de vos questions ou de votre projet de collaboration...",
      "submit": "Envoyer mon message",
      "success": "Message envoyé avec succès - notre équipe vous répondra dans les plus brefs délais.",
      "info": [
        {
          "label": "Courriel officiel",
          "value": "contact@3mservice.shop"
        },
        {
          "label": "Siège social",
          "value": "1265, rue Rachel E, porte 403, Montréal (Québec) H2J 2J9 • Canada"
        },
        {
          "label": "Rayonnement",
          "value": "Enraciné au Québec. Connecté au Canada. Ouvert sur le monde."
        }
      ],
      "pressTitle": "Relations médias et institutionnelles",
      "pressCopy": "Pour toute demande d'entrevue, communiqué de presse ou correspondance institutionnelle, notre équipe de communication se tient à votre disposition.",
      "pressEmail": "contact@3mservice.shop"
    },
    "donate": {
      "eyebrow": "Soutenir 3M Services",
      "h1a": "Ouvrir de nouveaux horizons. ",
      "h1accent": "Rendre l'opportunité possible.",
      "intro": "Votre soutien permet de relier les personnes, les compétences, la technologie et les opportunités afin de bâtir des économies numériques plus inclusives, accessibles et durables. Chez 3M Services, nous croyons fermement que chaque personne mérite d'apprendre, d'innover et de contribuer à sa communauté.",
      "subIntro": "3M Services allie l'excellence automobile au confort de résidences meublées d'exception à Yaoundé, Cameroun. Nous mettons à disposition de nos clients des solutions de mobilité complètes et des hébergements tout confort avec groupe électrogène permanent, fibre optique et sécurité 24/7.",
      "tagline": "Un don. Un engagement partagé. De nouvelles possibilités.",
      "ctaDonate": "Faire un don maintenant",
      "submit": "Confirmer ma promesse de don",
      "success": "Merci chaleureusement pour votre générosité - notre équipe vous fera parvenir la confirmation officielle et les détails de votre reçu."
    },
    "stories": {
      "eyebrow": "Récits d'impact",
      "h1a": "Histoires de ",
      "h1accent": "collaboration solidaire",
      "intro": "Découvrez des histoires vécues de collaboration communautaire et d'émancipation numérique au Canada et à travers le monde.",
      "parts": [
        [
          "Défi",
          "challenge"
        ],
        [
          "Notre Programme",
          "program"
        ],
        [
          "Actions Menées",
          "actions"
        ],
        [
          "Impact Mesuré",
          "impact"
        ],
        [
          "Perspectives",
          "future"
        ]
      ],
      "ctaTitle": "Votre parcours pourrait être le prochain",
      "ctaApply": "Postuler à un programme",
      "ctaMember": "Rejoindre l'écosystème"
    },
    "membership": {
      "volSuccess": "Merci pour votre engagement généreux - notre équipe prendra contact avec vous.",
      "areaLabel": "Domaine d'intérêt",
      "areaOptions": [
        "Compétences numériques",
        "Reconditionnement & matériel",
        "Agriculture numérique",
        "Médias & éducation citoyenne",
        "Entrepreneuriat féminin & créatif"
      ],
      "availLabel": "Disponibilité",
      "skillsLabel": "Compétences & expérience",
      "skillsPh": "Parlez-nous de votre parcours et de vos motivations...",
      "joinPh": "Sélectionnez",
      "availPh": "ex. 2h/semaine, 4-6h/semaine, par projet"
    }
  },
  "ar": {
    "nav": {
      "home": "الرئيسية",
      "about": "من نحن",
      "programs": "برامجنا",
      "join": "انضم إلينا",
      "volunteer": "التطوع",
      "partners": "الشركاء",
      "festival": "مهرجاننا",
      "blog": "مقالات",
      "contact": "اتصل بنا",
      "donate": "تبرع"
    },
    "footer": {
      "quote": "« رواد أعمال كاب - بناء اقتصادات رقمية شاملة ومتاحة ومستدامة. »",
      "support": "ادعم مهمتنا المجتمعية",
      "explore": "استكشف",
      "involved": "شارك معنا",
      "bottom1": "رواد أعمال كاب - منظمة كندية غير ربحية",
      "bottom2": "متجذرة في كيبيك. متصلة بكندا. منفتحة على العالم.",
      "privacy": "سياسة الخصوصية",
      "terms": "شروط الخدمة",
      "copyright": "جميع الحقوق محفوظة.",
      "designedBy": "منظومة رواد أعمال كاب"
    },
    "privacy": {
      "title": "سياسة الخصوصية",
      "intro": "كيف تحمي منظمة رواد أعمال كاب الكندية غير الربحية بياناتك الشخصية.",
      "sections": [
        {
          "title": "1. المعلومات التي نجمعها",
          "content": "نجمع فقط المعلومات التي تقدمها لنا مباشرة عند التقديم لبرامجنا أو التطوع أو طلب التواصل."
        },
        {
          "title": "2. استخدام المعلومات",
          "content": "تُستخدم معلوماتك حصرياً لتنسيق المشاركة في البرامج وإدارة التطوع والشراكات المجتمعية."
        },
        {
          "title": "3. عدم بيع البيانات",
          "content": "نحن لا نبيع ولا نؤجر بياناتك الشخصية أبداً. ولا تتم مشاركتها إلا مع الشركاء المعنيين بتنفيذ المبادرات."
        },
        {
          "title": "4. الأمان",
          "content": "نطبق تدابير أمنية وإدارية وتقنية متقدمة لحماية سرية معلوماتك."
        },
        {
          "title": "5. للتواصل معنا",
          "content": "لأي استفسار بخصوص الخصوصية، يرجى مراسلتنا على contact@3mservice.shop."
        }
      ]
    },
    "terms": {
      "title": "شروط الخدمة",
      "intro": "إرشادات وقواعد المشاركة في منصة ومبادرات رواد أعمال كاب.",
      "sections": [
        {
          "title": "1. قبول الشروط",
          "content": "استخدامك لهذا الموقع يعني موافقتك الكاملة على هذه الشروط."
        },
        {
          "title": "2. المهمة والخدمات",
          "content": "توفر المنظمة الوصول لبرامج تدريبية وفرص تطوعية وشبكات تعاون وموارد مجتمعية."
        },
        {
          "title": "3. السلوك المجتمعي",
          "content": "يلتزم كل مشارك بالتعامل البناء والمحترم وفق القوانين الكندية المعمول بها."
        },
        {
          "title": "4. القانون المطبق",
          "content": "تخضع هذه الشروط وتفسر وفق قوانين مقاطعة كيبيك والقوانين الفيدرالية الكندية."
        }
      ]
    },
    "form": {
      "name": "الاسم الكامل",
      "namePh": "اسمك الكامل",
      "email": "البريد الإلكتروني",
      "emailPh": "you@example.com",
      "org": "المؤسسة / المشروع",
      "orgPh": "إن وجد",
      "sending": "جاري الإرسال…",
      "error": "حدث خطأ ما. يرجى المحاولة مرة أخرى.",
      "required": "يرجى ملء جميع الحقول المطلوبة (*)"
    },
    "chat": {
      "launch": "تحدث معنا",
      "openLabel": "افتح المحادثة",
      "closeLabel": "إغلاق المحادثة",
      "title": "مساعد 3M SERVICES",
      "status": "إجابات مباشرة",
      "greeting": "مرحباً بك. يمكنني إرشادك إلى برامجنا التدريبية أو فرص التطوع أو فريق الشراكات. اختر سؤالاً أدناه أو اكتب سؤالك.",
      "suggestionsLabel": "أسئلة شائعة",
      "placeholder": "اكتب سؤالك هنا…",
      "sendLabel": "إرسال",
      "cancelLabel": "إيقاف",
      "typing": "جاري الكتابة…",
      "restart": "إعادة البدء",
      "cancelled": "تم إيقاف الرد.",
      "note": "الإجابات مستخرجة من الوثائق الرسمية للمنظمة.",
      "fallback": "فريقنا يجيب باهتمام على جميع الرسائل المرسلة عبر نموذج الاتصال.",
      "fallbackCta": "راسل الفريق",
      "errors": {
        "400": "السؤال غير صالح.",
        "401": "يتطلب إعادة تهيئة.",
        "403": "غير مصرح بالوصول.",
        "429": "طلبات كثيرة. يرجى الانتظار قليلاً.",
        "502": "الخدمة غير متوفرة مؤقتاً.",
        "default": "حدث خطأ غير متوقع."
      },
      "topics": [
        {
          "id": "programs",
          "q": "ما هي البرامج الهيكلية الأربعة؟",
          "keywords": [
            "برامج",
            "تدريب",
            "كاب جرين لاب",
            "أجري كونكت",
            "سيف فايب"
          ],
          "a": "نقدم أربعة برامج رئيسية: 3M Services Mobilité (التكنولوجيا الشاملة والاقتصاد الدائري)، AgriConnect (ريادة الأعمال الريفية والزراعة الرقمية)، Safe Vibe (الإعلام والتعليم الرقمي)، وريادة الأعمال الإبداعية والاجتماعية (المرأة، الفنون والابتكار).",
          "ctaLabel": "اكتشف برامجنا",
          "ctaTo": "/programs"
        },
        {
          "id": "volunteer",
          "q": "كيف يعمل مسار التطوع؟",
          "keywords": [
            "تطوع",
            "متطوع",
            "مساعدة",
            "وقت",
            "خبرة"
          ],
          "a": "التطوع في رواد أعمال كاب هو فرصة للتعلم والتعاون وإحداث أثر مجتمعي: التقديم، التدريب، المواءمة، المساهمة، والنمو.",
          "ctaLabel": "اكتشف التطوع",
          "ctaTo": "/volunteer"
        },
        {
          "id": "partners",
          "q": "كيف يمكن لمؤسستنا الدخول في شراكة معكم؟",
          "keywords": [
            "شراكة",
            "شركاء",
            "مؤسسة",
            "تمويل",
            "مانح"
          ],
          "a": "نتعاون مع الشركات المسؤولة، المؤسسات العامة، المنظمات غير الربحية، والجامعات في كندا ودولياً لبناء مبادرات ذات أثر قابل للقياس.",
          "ctaLabel": "استكشف الشراكات",
          "ctaTo": "/partners"
        },
        {
          "id": "festival",
          "q": "ما هو المهرجان الدولي نيروبي 2027؟",
          "keywords": [
            "مهرجان",
            "نيروبي",
            "باريس",
            "مراكش",
            "مارتينيك",
            "2027"
          ],
          "a": "المهرجان الدولي نيروبي 2027 هو تجمع عالمي للتكنولوجيا الشاملة والمستدامة حول أربع مساحات: التكنولوجيا الشاملة، التكنولوجيا الدائرية، المهارات الرقمية، والابتكار الاجتماعي.",
          "ctaLabel": "تفاصيل المهرجان",
          "ctaTo": "/global-festival"
        },
        {
          "id": "contact",
          "q": "كيف أتواصل مع الفريق؟",
          "keywords": [
            "اتصال",
            "تواصل",
            "بريد",
            "هاتف",
            "رسالة"
          ],
          "a": "يمكنك مراسلتنا مباشرة على contact@3mservice.shop أو ملء استمارة التواصل في الموقع.",
          "ctaLabel": "اتصل بنا",
          "ctaTo": "/contact"
        }
      ]
    },
    "home": {
      "eyebrow": "منظمة كندية غير ربحية",
      "tagline": "متجذرة في كيبيك. متصلة بكندا. منفتحة على العالم.",
      "h1": "فتح آفاق جديدة",
      "h1a": "فتح ",
      "h1accent": "آفاق جديدة",
      "h1post": "",
      "h2": "العالم مليء بالإمكانات. مهمتنا هي مساعدة المزيد من رواد الأعمال على الوصول إليها.",
      "intro": "رواد أعمال كاب هي منظمة كندية غير ربحية تعمل عند تقاطع الشمول الرقمي والتكنولوجيا وريادة الأعمال والابتكار الاجتماعي. نؤمن بأن التكنولوجيا يجب أن تخلق فرصاً للجميع - وليس فقط لمن يملكون الأدوات أو الشبكات أو الموارد. متجذرون في كيبيك، ومتصلون عبر كندا، ومنفتحون على العالم، نطور برامج عملية وجسوراً دولية تحول الأفكار إلى مهارات، والمهارات إلى مشاريع، والمشاريع إلى أثر مستدام.",
      "missionHeading": "مهمتنا",
      "missionStatement": "ربط الناس والمهارات والتكنولوجيا والفرص لبناء اقتصادات رقمية أكثر شمولاً وملاءمة واستدامة.",
      "discoveryTitle": "اكتشف مسارك",
      "discoverySub": "لكل رائد عمل ما يساهم به. ولكل مؤسسة دور تؤديه. اكتشف مكانك في منظومتنا.",
      "ctas": {
        "learn": {
          "badge": "🎓 تعلّم",
          "title": "تعلّم - طوّر قدراتك",
          "text": "اكتسب مهارات رقمية مطلوبة وتجارب عملية من خلال التدريب والتوجيه والمشاريع الواقعية.",
          "action": "استكشف فرص التعلم",
          "link": "/join"
        },
        "build": {
          "badge": "🤝 ابنِ",
          "title": "ابنِ - حوّل الأفكار إلى واقع",
          "text": "ساهم بخبرتك وإبداعك وطاقتك في مبادرات تعالج التحديات الحقيقية للمجتمعات.",
          "action": "شارك معنا",
          "link": "/volunteer"
        },
        "impact": {
          "badge": "🏢 اصنع الأثر",
          "title": "اصنع الأثر - ادعم التغيير الإيجابي",
          "text": "شاركنا لتطوير تقنيات شاملة وبرامج مستدامة تصنع قيمة اجتماعية وبيئية واقتصادية دائمة.",
          "action": "كن شريكاً معنا",
          "link": "/partners"
        }
      },
      "fourProgramsTitle": "أربعة برامج. ومهمة مجتمعية واحدة.",
      "fourProgramsIntro": "برامجنا تحول الأفكار إلى حلول ملموسة وعملية:",
      "h4Programs": [
        {
          "name": "3M Services Mobilité",
          "theme": "التكنولوجيا الشاملة، إمكانية الوصول والاقتصاد الدائري",
          "id": "3m-services-mobilite"
        },
        {
          "name": "AgriConnect",
          "theme": "ريادة الأعمال الريفية، الزراعة الرقمية والوصول للأسواق",
          "id": "agriconnect"
        },
        {
          "name": "Safe Vibe",
          "theme": "الإعلام الرقمي، التعليم والمواطنة الرقمية الواعية",
          "id": "safe-vibe"
        },
        {
          "name": "ريادة الأعمال الإبداعية والاجتماعية",
          "theme": "ريادة الأعمال النسائية، الفنون والابتكار الاجتماعي",
          "id": "creative-social"
        }
      ],
      "h4International": "يساهم كل برنامج في هدف مشترك: جعل التحول الرقمي أكثر شمولاً وفائدة واستدامة للجميع.",
      "discoverPrograms": "اكتشف برامجنا",
      "communitySectionTitle": "تعرف على فريق 3M SERVICES",
      "communitySectionSub": "نبني مجتمعاً من الأفراد والمؤسسات الذين يستكشفون الفرص ويفتحون الأبواب ويبنون جسور التعاون.",
      "signalSeekersTitle": "المستكشفون (The Signal Seekers)",
      "signalSeekersDesc": "نرصد ونستكشف الاتجاهات والاحتياجات والتقنيات الصاعدة لمساعدة مجتمعنا على استشراف التغيرات والمستقبل.",
      "doorOpenersTitle": "صناع الجسور (The Door Openers)",
      "doorOpenersDesc": "نربط الأفراد والمؤسسات والمنظومات لتحويل الاستكشافات إلى علاقات وشراكات ومشاريع واقعية.",
      "communityQuote": "« هذه أدوار متكاملة ضمن مجتمع دولي واحد. سواء كنت طالباً، رائد أعمال، متطوعاً، مهنياً، أو جهة مؤسسية، هناك مكان مخصص لك بيننا. »",
      "h5Title": "مجتمع مبني لكل من يصنع الفرص",
      "h5Intro": "تجمع منظمة رواد أعمال كاب بين:",
      "audiences": [
        "رواد الأعمال والمهنيون المستقلون",
        "المنظمات غير الربحية والجمعيات",
        "المانحون والمؤسسات التمويلية",
        "المتطوعون والموجهون",
        "الشركاء المؤسسيون والحكوميون",
        "المبتكرون المبدعون والاجتماعيون"
      ],
      "h5Summary": "معاً، نكوّن منظومة تتحول فيها المهارات إلى مشاريع، والمشاريع إلى تأثير، والتأثير إلى تغيير مستدام.",
      "journeyTitle": "رحلتنا الدولية",
      "journeyIntro": "يبدأ عملنا داخل المجتمعات المحلية ويتوسع عبر الشراكات والتعاون الدولي.",
      "destinations": [
        {
          "city": "باريس",
          "year": "2027",
          "tag": "لقاء ما قبل المهرجان",
          "desc": "الشراكات الأوروبية والحوار الدولي ونقل الخبرات الكندية."
        },
        {
          "city": "نيروبي",
          "year": "2027",
          "tag": "المهرجان الدولي",
          "desc": "التجمع العالمي للتكنولوجيا الشاملة والمتاحة والمستدامة."
        },
        {
          "city": "مراكش",
          "year": "2027",
          "tag": "التوريد الإبداعي",
          "desc": "برنامج التوريد الإبداعي الإفريقي وربط المشترين الدوليين بالصناع."
        },
        {
          "city": "المارتينيك",
          "year": "2028",
          "tag": "التوسع الكاريبي",
          "desc": "التوسع الكاريبي والاقتصاد الأزرق والتعاون العابر للأطلسي."
        }
      ],
      "h6Title": "هل أنت مستعد لفتح آفاق جديدة؟",
      "h6Sub": "سواء كنت ترغب في تطوير مهاراتك، التطوع بخبرتك، بناء شراكة أو دعم الابتكار الشامل، خطوتك القادمة تبدأ هنا.",
      "ctaJoin": "انضم إلى المجتمع",
      "ctaPartner": "استكشف الشراكات",
      "marquee": [
        "الشمول",
        "إمكانية الوصول",
        "الاستدامة",
        "الدائرية",
        "الابتكار الاجتماعي",
        "الأثر المستدام"
      ],
      "involvementTitle": "كيف تود المشاركة معنا؟",
      "involvementKicker": "المشاركة",
      "involvementCta": "ابدأ الآن",
      "involvementCards": [
        {
          "id": "skills",
          "number": "01",
          "tag": "التدريب والمهارات",
          "title": "أريد تطوير مهاراتي",
          "link": "/join",
          "submissionType": "application",
          "intro": "انضم إلى مسار منظم لاكتساب مهارات رقمية وريادية وتقنية تتناسب مع متطلبات السوق.",
          "fields": [
            {
              "name": "program",
              "label": "البرنامج المطلوب",
              "kind": "select",
              "options": [
                "كاب غرين لاب - التكنولوجيا الشاملة والاقتصاد الدائري",
                "أغري كونيكت - ريادة الأعمال الريفية والزراعة الرقمية",
                "سيف فايب - الإعلام الرقمي والتعليم",
                "ريادة الأعمال الإبداعية والاجتماعية - النساء والفنون والابتكار",
                "أخرى / توجيه عام"
              ],
              "required": true
            },
            {
              "name": "message",
              "label": "أهدافك والمهارات التي ترغب في تطويرها",
              "kind": "textarea",
              "placeholder": "أخبرنا عن مشروعك وأهدافك ومهاراتك الحالية...",
              "required": true
            }
          ]
        },
        {
          "id": "volunteer",
          "number": "02",
          "tag": "المشاركة المدنية",
          "title": "أريد التطوع",
          "link": "/volunteer",
          "submissionType": "volunteer",
          "intro": "شارك مهاراتك وطاقتك في خدمة المبادرات الريادية والاجتماعية التي ترافقها كاب رياديون.",
          "fields": [
            {
              "name": "area",
              "label": "مجال المساهمة",
              "kind": "select",
              "options": [
                "المهارات الرقمية والتطوير",
                "التواصل وصناعة المحتوى",
                "تطوير الأعمال والاستراتيجية",
                "التدريب وورش العمل والإرشاد",
                "الفنون والثقافة والفعاليات",
                "إدارة المشاريع والعمليات"
              ],
              "required": true
            },
            {
              "name": "availability",
              "label": "الوقت المتاح",
              "kind": "select",
              "options": [
                "ساعتان / أسبوعياً",
                "4–6 ساعات / أسبوعياً",
                "7–10 ساعات / أسبوعياً",
                "مؤقت / حسب المشروع"
              ],
              "required": true
            },
            {
              "name": "message",
              "label": "مهاراتك ودوافعك",
              "kind": "textarea",
              "placeholder": "صف مهاراتك المهنية وكيف تود المساهمة...",
              "required": true
            }
          ]
        },
        {
          "id": "ngo",
          "number": "03",
          "tag": "المنظمات",
          "title": "أنا أمثل منظمة غير حكومية / مؤسسة اجتماعية",
          "link": "/partners",
          "submissionType": "partner",
          "intro": "لنبني جسوراً من العمل ونشارك في تطوير حلول ملموسة لمجتمعاتكم والمستفيدين.",
          "fields": [
            {
              "name": "organization",
              "label": "اسم المنظمة غير الحكومية / المؤسسة الاجتماعية",
              "required": true,
              "placeholder": "الاسم الرسمي لمنظمتك"
            },
            {
              "name": "country",
              "label": "البلد / منطقة العمل",
              "required": true,
              "placeholder": "مثال: كندا، ساحل العاج، المغرب، السنغال..."
            },
            {
              "name": "message",
              "label": "طبيعة التعاون المنشود",
              "kind": "textarea",
              "placeholder": "صف التحديات التي يواجهها المستفيدون ونوع التعاون المقترح...",
              "required": true
            }
          ]
        },
        {
          "id": "partner",
          "number": "04",
          "tag": "الشراكات",
          "title": "أريد أن أصبح شريكاً",
          "link": "/partners",
          "submissionType": "partner",
          "intro": "شارك في بناء برامج واسعة النطاق، وادعم التنمية الاقتصادية المستدامة وعزز أثرك الإقليمي.",
          "fields": [
            {
              "name": "organization",
              "label": "اسم المؤسسة / الشركة",
              "required": true,
              "placeholder": "اسم شركتك أو مؤسستك"
            },
            {
              "name": "partnerType",
              "label": "نوع الشراكة المطلوب",
              "kind": "select",
              "options": [
                "شريك مؤسسي / رعاية مهارات",
                "جهة مانحة / مؤسسة خيرية",
                "مؤسسة عامة / حكومية",
                "مركز ابتكار / حاضنة أعمال شريكة",
                "جامعة / مركز أبحاث"
              ],
              "required": true
            },
            {
              "name": "message",
              "label": "مشروع الشراكة أو الرسالة",
              "kind": "textarea",
              "placeholder": "شاركنا رؤيتك أو طلب التواصل الخاص بك...",
              "required": true
            }
          ]
        }
      ],
      "voicesKicker": "شهادات • صوت المجتمع",
      "voicesTitle": "بدعم وثقة أكثر من 500+ مشارك وشريك ومجتمع محلي.",
      "testimonials": [
        {
          "quote": "ساعد 3M Services Mobilité مجتمعنا في تقليص الفجوة الرقمية وإعادة تأهيل الأجهزة للمدارس.",
          "author": "Sarah J.",
          "role": "مبتكرة اجتماعية",
          "organization": "3M Services Mobilité"
        },
        {
          "quote": "ربط برنامج AgriConnect تعاونيتنا النسائية الزراعية بالأدوات الرقمية الحديثة والأسواق المستدامة.",
          "author": "Aminata D.",
          "role": "مسؤولة تعاونية",
          "organization": "AgriConnect"
        },
        {
          "quote": "التعاون الدولي مع رواد أعمال كاب يخلق أثراً ملموساً وجسوراً إنسانية دائمة.",
          "author": "Elena R.",
          "role": "شريكة مؤسسية",
          "organization": "Alliances & Impact"
        }
      ]
    },
    "about": {
      "eyebrow": "عن رواد أعمال كاب",
      "h1a": "نؤمن بأن الفرص لا ينبغي أن تقيدها ",
      "h1accent": "أي حدود",
      "whoTitle": "من نحن",
      "whoHeading": "بناء اقتصادات رقمية شاملة ومتاحة ومستدامة",
      "whoText": "رواد أعمال كاب هي منظمة كندية غير ربحية مكرسة للتحول الرقمي الشامل والمستدام. نعمل مع الأفراد والمجتمعات والمنظمات غير الربحية ورواد الأعمال لتعزيز الوصول إلى المهارات والأدوات الرقمية. يجمع عملنا بين التعلم العملي والمشاريع التعاونية والمشاركة المجتمعية والتعاون الدولي، مع نشر الممارسات الكندية الرائدة في الشمول والحوكمة الشفافة عالمياً.",
      "pullQuote": "« ربط الناس والمهارات والتكنولوجيا والفرص. جعل التحول الرقمي نموذجاً للتميز الشامل والمستدام عالمياً. »",
      "missionTitle": "مهمتنا",
      "missionHeading": "ربط الناس والمهارات والتكنولوجيا والفرص.",
      "missionText": "نجعل التحول الرقمي متاحاً للجميع، وخاصة لأولئك الذين يواجهون عوائق في المشاركة، ونحول المعرفة إلى مبادرات عملية ذات أثر ملموس.",
      "visionTitle": "رؤيتنا",
      "visionHeading": "بناء منظومة رقمية دولية وشاملة ومستدامة يتعلم فيها الأفراد والمؤسسات ويحدثون أثراً مشتركاً.",
      "visionText": "نتطلع إلى مستقبل لا تحدد فيه الجغرافيا أو الإعاقة أو الظروف الاقتصادية قدرة الفرد على المشاركة في الاقتصاد الرقمي.",
      "principlesTitle": "مبادئنا التوجيهية",
      "principles": [
        {
          "title": "الشمول",
          "text": "العمل على خفض الحواجز وتوسيع المشاركة الفعالة للجميع."
        },
        {
          "title": "إمكانية الوصول",
          "text": "تصميم الأدوات والتعليم الرقمي بما يلبي الاحتياجات الإنسانية المتنوعة."
        },
        {
          "title": "الاستدامة",
          "text": "تشجيع الاستخدام المسؤول للموارد والحلول طويلة الأمد."
        },
        {
          "title": "التعاون",
          "text": "تسريع التقدم الإنساني من خلال تبادل المعرفة والعمل المشترك."
        },
        {
          "title": "الأثر",
          "text": "التركيز على النتائج الملموسة والقياس المستمر والتحسين الدائم."
        }
      ],
      "howTitle": "كيف نعمل",
      "howHeading": "حوكمة تعاونية وشفافة",
      "howIntro": "تعتمد منظومتنا على خمسة أركان مترابطة:",
      "howFlow": "اللجان ← البرامج ← المتطوعون ← الشركاء ← الأثر",
      "howSteps": [
        {
          "title": "اللجان",
          "text": "تحدد الأولويات وتقدم الخبرة التخصصية وتوجه المسار الاستراتيجي."
        },
        {
          "title": "البرامج",
          "text": "تحول الأولويات إلى مبادرات منظمة تلبي الاحتياجات الميدانية الحقيقية."
        },
        {
          "title": "المتطوعون",
          "text": "يساهمون بمهاراتهم وخبراتهم ووقتهم في مشاريع هادفة."
        },
        {
          "title": "الشركاء",
          "text": "يدعمون المهمة بالتمويل والخبرة التقنية والشراكة المؤسسية."
        },
        {
          "title": "الأثر",
          "text": "الفارق الإيجابي الفعلي الذي يحققه عملنا في حياة الناس والمجتمعات."
        }
      ],
      "ecoTitle": "بيئتنا الرقمية",
      "ecoIntro": "بيئتنا الرقمية المخصصة للتعاون والتأهيل والتدريب وتطوير المهارات عبر مسار مخصص:",
      "ecoFlow": "الانضمام ← التعلم ← الممارسة ← الاعتماد ← القيادة ← الوصول إلى الفرص",
      "ecoSteps": [
        {
          "title": "الانضمام",
          "text": "الاندماج في منظومة كاب",
          "icon": "👋"
        },
        {
          "title": "التعلم",
          "text": "تطوير مهارات رقمية متقدمة",
          "icon": "📚"
        },
        {
          "title": "الممارسة",
          "text": "تطبيق المعرفة في مشاريع مجتمعية واقعية",
          "icon": "🛠️"
        },
        {
          "title": "الاعتماد",
          "text": "توثيق الخبرة بشارات وشهادات رسمية",
          "icon": "✅"
        },
        {
          "title": "القيادة",
          "text": "تولي قيادة المبادرات وتوجيه الأعضاء الجدد",
          "icon": "🎯"
        },
        {
          "title": "الفرص",
          "text": "التواصل مع شبكات الشركاء والأسواق الدولية",
          "icon": "🌍"
        }
      ],
      "outlookTitle": "آفاقنا الدولية",
      "outlookHeading": "باريس ← نيروبي ← مراكش ← المارتينيك",
      "outlookText": "نطور روابط متينة بين كندا والمجتمعات الدولية عبر البرامج والشراكات والفعاليات المشتركة.",
      "visionFlow": "باريس 2027 ← نيروبي 2027 ← مراكش 2027 ← المارتينيك 2028 ← شبكة عالمية من المبتكرين الاجتماعيين.",
      "visionSteps": [
        {
          "year": "2027",
          "title": "باريس 2027",
          "text": "لقاء ما قبل المهرجان وبناء الشراكات الأوروبية"
        },
        {
          "year": "2027",
          "title": "نيروبي 2027",
          "text": "المهرجان الدولي للتكنولوجيا الشاملة والمستدامة"
        },
        {
          "year": "2027",
          "title": "مراكش 2027",
          "text": "برنامج التوريد الإبداعي الإفريقي والمشترون الدوليون"
        },
        {
          "year": "2028",
          "title": "المارتينيك 2028",
          "text": "التوسع الكاريبي والتعاون الدولي"
        }
      ]
    },
    "programs": {
      "eyebrow": "برامجنا",
      "h1a": "من التعلم إلى ",
      "h1accent": "الأثر الملموس",
      "h1post": "",
      "editionTag": "إصدار 2026-2027 • رواد أعمال كاب",
      "intro": "تنشر رواد أعمال كاب أربعة برامج هيكلية تلبي الاحتياجات الملموسة للأفراد والمنظمات والمناطق. يجمع كل برنامج بين التدريب العملي والمرافقة والتجريب الميداني والانتشار الدولي.",
      "tocTitle": "محتويات الصفحة",
      "shareTitle": "مشاركة",
      "exploreCta": "استكشف البرامج",
      "whatWeDoTitle": "ما نقوم به:",
      "forWhomTitle": "لمن هذا البرنامج؟",
      "programsList": [
        {
          "id": "3m-services-mobilite",
          "num": "01",
          "name": "3M Services Mobilité",
          "theme": "التكنولوجيا الشاملة، إمكانية الوصول والاقتصاد الدائري",
          "subtitle": "الشمول الرقمي والمسؤولية البيئية",
          "purpose": "يجب أن تكون التكنولوجيا متاحة للجميع وصديقة للبيئة. مختبرنا مكرس لتقارب التحول الرقمي والتدريب التقني وإمكانية الوصول التكنولوجي والاقتصاد الدائري.",
          "whatWeDo": [
            "تجديد وإعادة استخدام المعدات الرقمية وتوزيعها على المجتمعات.",
            "تعزيز تقنيات إمكانية الوصول والتصميم الشامل للأشخاص ذوي الإعاقة.",
            "التدريب العملي على التشخيص والصيانة وإصلاح الأجهزة.",
            "مساعدة المنظمات والمدارس في إدارة بنيتها التحتية الرقمية.",
            "تقليص الفجوة الرقمية من خلال توفير العتاد والتعليم المتاح."
          ],
          "forWhom": "الأشخاص في مرحلة الانتقال المهني، المتطوعون، المنظمات غير الربحية، والمدارس.",
          "goal": "تأهيل الكفاءات بمهارات عملية مع تقليل النفايات الإلكترونية.",
          "cta": "استكشف 3M Services Mobilité"
        },
        {
          "id": "agriconnect",
          "num": "02",
          "name": "AgriConnect",
          "theme": "ريادة الأعمال الريفية، الزراعة الرقمية والوصول للأسواق",
          "subtitle": "تمكين الاقتصادات الريفية",
          "purpose": "المجتمعات الريفية والمنتجون الزراعيون ركيزة أساسية للتنمية. يدعم AgriConnect التعاونيات الزراعية ورائدات الأعمال في تبني أدوات رقمية عملية تزيد الإنتاجية وتفتح أسواقاً جديدة.",
          "whatWeDo": [
            "تقديم تدريبات على الأدوات الرقمية للإدارة الزراعية والمشاريع.",
            "دعم التعاونيات الزراعية النسائية والمبادرات الريفية.",
            "ربط المنتجين المحليين بالأسواق الإقليمية والوطنية والدولية العادلة.",
            "تسهيل تبادل المعرفة والخبرات بين المزارعين والتعاونيات."
          ],
          "forWhom": "التعاونيات الزراعية، رواد الأعمال في الريف، المزارعات والشباب المنتجون.",
          "goal": "جعل التكنولوجيا الزراعية عملية ومتاحة ومجدية اقتصادياً للمناطق الريفية.",
          "cta": "استكشف AgriConnect"
        },
        {
          "id": "safe-vibe",
          "num": "03",
          "name": "Safe Vibe",
          "theme": "الإعلام الرقمي، التعليم والمواطنة الرقمية المسؤولة",
          "subtitle": "التربية الإعلامية والتعبير الإبداعي",
          "purpose": "الفضاء الرقمي بيئة ثرية للتعلم والتعبير، لكنه يحمل تحديات حول الأمان والتضليل. يؤهل Safe Vibe الشباب وصناع المحتوى للمشاركة في العالم الرقمي بأمان ووعي ومسؤولية.",
          "whatWeDo": [
            "تنظيم ورش عمل في التربية الإعلامية والتفكير النقدي.",
            "التدريب على صناعة المحتوى الهادف (فيديو، بودكاست، كتابة).",
            "التوعية بالأمان الرقمي وحماية البيانات الشخصية.",
            "تطوير المهارات الرقمية الأساسية والمتوسطة للاستخدام اليومي."
          ],
          "forWhom": "الشباب، الطلاب، المعلمون، الجمعيات الأهلية وصناع المحتوى الصاعدون.",
          "goal": "مساعدة الشباب على أن يكونوا مواطنين رقميين واعين ومبدعين مسؤولين.",
          "cta": "استكشف Safe Vibe"
        },
        {
          "id": "creatif-social",
          "num": "04",
          "name": "ريادة الأعمال الإبداعية والاجتماعية",
          "theme": "المرأة، الفنون والابتكار الاجتماعي",
          "subtitle": "الأفكار الإبداعية تستحق نماذج مستدامة",
          "purpose": "يدعم هذا البرنامج رائدات الأعمال والفنانين والمبتكرين الاجتماعيين لتطوير مشاريعهم وبناء نماذج عمل مستدامة وتوسيع شبكات علاقاتهم.",
          "whatWeDo": [
            "دعم القيادة وريادة الأعمال النسائية ذات البعد الاجتماعي.",
            "تشجيع الاقتصاد الإبداعي والحرف الفنية.",
            "تقديم تدريب متخصص في إدارة المشاريع والتسويق والتخطيط المالي.",
            "تسهيل التشبيك والتوجيه والوصول إلى المعارض والأسواق الدولية."
          ],
          "forWhom": "رائدات الأعمال، الفنانات، المبدعون وأصحاب المشاريع الاجتماعية.",
          "goal": "مساعدة المبادرات الإبداعية على التحول إلى مشاريع اقتصادية مستدامة ومؤثرة.",
          "cta": "استكشف ريادة الأعمال الإبداعية"
        }
      ],
      "festivalTitle": "المهرجان الدولي - نيروبي 2027",
      "festivalSub": "تجمع عالمي للتكنولوجيا الشاملة والمتاحة والمستدامة",
      "festivalIntro": "المهرجان الدولي نيروبي 2027 هو ملتقى دولي يجمع المبتكرين ورواد الأعمال والمؤسسات حول أربعة مجالات حيوية:",
      "festivalSpaces": [
        {
          "title": "التكنولوجيا الشاملة",
          "text": "إمكانية الوصول، الإعاقة والتصميم الشامل للجميع."
        },
        {
          "title": "التكنولوجيا الدائرية",
          "text": "إعادة الاستخدام، الإصلاح والاقتصاد الدائري المسؤول."
        },
        {
          "title": "المهارات الرقمية",
          "text": "التدريب العملي، التوظيف والتمكين الاقتصادي."
        },
        {
          "title": "الابتكار الاجتماعي",
          "text": "حلول تقنية مبتكرة تلبي الاحتياجات المجتمعية الحقيقية."
        }
      ],
      "timelineTitle": "خارطة طريق المهرجان",
      "timeline": [
        {
          "year": "2026",
          "step": "البناء",
          "desc": "هيكلة البرامج واللجان وبناء الشراكات الأساسية."
        },
        {
          "year": "2027",
          "step": "التواصل",
          "desc": "تعبئة المجتمعات وتطوير التعاون الدولي."
        },
        {
          "year": "2027",
          "step": "باريس",
          "desc": "لقاء ما قبل المهرجان في باريس."
        },
        {
          "year": "2027",
          "step": "نيروبي",
          "desc": "انطلاق المهرجان الدولي في نيروبي."
        },
        {
          "year": "2027",
          "step": "مراكش",
          "desc": "التوريد الإبداعي الإفريقي في مراكش."
        },
        {
          "year": "2028",
          "step": "المارتينيك",
          "desc": "التوسع الدولي والشراكات الكاريبية."
        }
      ],
      "applyCta": "التقديم للبرنامج",
      "formEyebrow": "استمارة التقديم للبرامج",
      "formTitle": "ابدأ مسارك التدريبي",
      "formCopy": "أخبرنا عنك وعن مشروعك والبرنامج الذي يثير اهتمامك وسيقوم فريقنا بدراسة طلبك.",
      "programLabel": "اختر البرنامج",
      "programPh": "حدد البرنامج المطلوب",
      "goalsLabel": "أهدافك وتطلعاتك",
      "goalsPh": "ماذا تود أن تحقق من خلال المشاركة في هذا البرنامج؟",
      "submit": "إرسال طلب الانضمام",
      "success": "تم استلام طلبك بنجاح - سيتواصل فريقنا معك في أقرب وقت."
    },
    "join": {
      "eyebrow": "انضم إلى المنظومة",
      "h1a": "اكتشف مسارك. ",
      "h1accent": "واصنع أثرك.",
      "intro": "هناك أكثر من طريقة للمساهمة في بناء عالم رقمي أكثر شمولاً وتضامناً. سواء كنت ترغب في تطوير مهاراتك، التطوع بخبرتك، تمثيل مؤسستك أو استكشاف الشراكات الدولية، رواد أعمال كاب ترشدك إلى خطوتك التالية.",
      "pathwaysTitle": "من أين تود أن تبدأ؟",
      "pathwayOptions": [
        {
          "id": "learn",
          "icon": "🎓",
          "title": "أريد التعلم وتطوير مهاراتي",
          "desc": "طور قدراتك الرقمية واكتسب خبرة عملية عبر ورش العمل والمشاريع التطبيقية.",
          "cta": "ابدأ مسار التعلم",
          "link": "/programs"
        },
        {
          "id": "volunteer",
          "icon": "🤝",
          "title": "أريد التطوع بخبراتي",
          "desc": "ساهم بوقتك ومهاراتك في مشاريع متصلة بالتكنولوجيا، الشمول الرقمي والابتكار الاجتماعي.",
          "cta": "اكتشف مسار التطوع",
          "link": "/volunteer"
        },
        {
          "id": "partner",
          "icon": "🏢",
          "title": "أمثل مؤسسة أو جهة شريكة",
          "desc": "تعاون معنا في برامج تدريبية، مبادرات مجتمعية أو شراكات دولية مستدامة.",
          "cta": "استكشف الشراكات",
          "link": "/partners"
        },
        {
          "id": "sourcing",
          "icon": "🛍️",
          "title": "أنا مشترٍ دولي أو مبدع",
          "desc": "انضم إلى برنامج التوريد الإبداعي الإفريقي وتواصل مع صناع وحرفيين ومصممين متميزين.",
          "cta": "انضم لبرنامج التوريد",
          "link": "#contact-form"
        }
      ],
      "formTitle": "الانضمام لمنظومة كاب",
      "formCopy": "أخبرنا بالقليل عن نفسك لنرشدك إلى المسار الأنسب. مسارك القادم يبدأ بحوار.",
      "submit": "إرسال الطلب",
      "success": "شكراً لتواصلك - سيقوم فريقنا بإرشادك إلى المسار الأنسب."
    },
    "volunteer": {
      "eyebrow": "تطوع معنا",
      "h1a": "مهاراتك يمكن أن تفتح ",
      "h1accent": "آفاقاً جديدة",
      "intro": "في رواد أعمال كاب، التطوع أكثر من مجرد إعطاء الوقت؛ إنه فرصة للتعلم والتعاون واكتساب الخبرة والمساهمة في مشاريع مجتمعية ملموسة في كندا وخارجها. سواء كنت طالباً أو مهنياً أو مستشاراً، فإن معرفتك يمكن أن تصنع فارقاً حقيقياً.",
      "areasTitle": "بماذا يمكنك المساهمة؟",
      "areas": [
        "المهارات الرقمية وتطوير الويب",
        "التواصل وصناعة المحتوى الإعلامي",
        "تطوير المشاريع والاستراتيجية",
        "التدريب والتوجيه",
        "الفنون والثقافة والإبداع",
        "الزراعة والاستدامة البيئية",
        "بناء الشراكات والعلاقات العامة",
        "إدارة المشاريع والعمليات الميدانية",
        "خبرات مهنية وتخصصية أخرى"
      ],
      "quizTitle": "اكتشف مسارك التطوعي",
      "quizButton": "ابدأ استبيان التطوع",
      "q1Title": "1. بماذا تود المساهمة؟",
      "q1Options": [
        "المهارات الرقمية والتقنية",
        "التواصل والإعلام",
        "تطوير المشاريع",
        "التدريب والتوجيه",
        "الفنون والثقافة",
        "الزراعة والاستدامة",
        "الشراكات",
        "إدارة المشاريع"
      ],
      "q2Title": "2. ما هو مستوى خبرتك؟",
      "q2Options": [
        "طالب / خريج جديد",
        "مساعد",
        "محترف",
        "مستشار",
        "مدير / قيادي"
      ],
      "q3Title": "3. كم من الوقت يمكنك تخصيصه؟",
      "q3Options": [
        "ساعتان / أسبوعياً",
        "4–6 ساعات / أسبوعياً",
        "7–10 ساعات / أسبوعياً",
        "حسب المشروع"
      ],
      "resultTitle": "مسارك الموصى به",
      "journeyTitle": "رحلة المتطوع لدينا",
      "journeyIntro": "نعمل على مواءمة مهاراتك واهتماماتك مع مشاريع ومبادرات تترك أثراً حقيقياً:",
      "steps": [
        {
          "title": "المرحلة 1 - التقديم",
          "text": "أخبرنا عن خبراتك واهتماماتك والوقت الذي يمكنك المساهمة به."
        },
        {
          "title": "المرحلة 2 - التأهيل والتدريب",
          "text": "احصل على تدريب وتوجيه ملائم لمسؤولياتك التطوعية."
        },
        {
          "title": "المرحلة 3 - التواصل والمواءمة",
          "text": "انضم إلى برنامج أو مشروع يتوافق مع مهاراتك وشغفك."
        },
        {
          "title": "المرحلة 4 - المساهمة العملية",
          "text": "اعمل مع أعضاء المنظومة لدعم المبادرات الميدانية."
        },
        {
          "title": "المرحلة 5 - التقدير والنمو",
          "text": "طور قدراتك المهنية ووثق مساهماتك بشهادات وشارات رسمية."
        }
      ],
      "whatYouGainTitle": "ماذا ستكتسب من التجربة:",
      "whatYouGain": [
        "مهارات رقمية وقيادية مطلوبة في سوق العمل",
        "خبرة واقعية قيّمة في قطاع الابتكار الاجتماعي",
        "شبكة علاقات مهنية في كندا ومختلف دول العالم",
        "الأثر المجتمعي الملموس والمساهمة في تقليص الفجوة الرقمية",
        "الاطلاع على الممارسات الكندية في الحوكمة الشفافة والشمول",
        "فرص المشاركة في وفود ومهمات دولية"
      ],
      "internationalTitle": "الفرص والمهمات الدولية",
      "internationalNote": "وفقاً لاحتياجات البرامج، يمكن للمتطوعين المشاركة في برنامج التوريد الإبداعي الإفريقي أو فعاليات المهرجان الدولي نيروبي 2027 (اللوجستيات، العلاقات، التواصل والتنظيم).",
      "ctaButton": "كن متطوعاً معنا",
      "formTitle": "أخبرنا كيف يمكنك المساعدة",
      "formCopy": "املأ هذا النموذج البسيط وسيتواصل معك منسق شؤون المتطوعين.",
      "submit": "إرسال ملف التطوع",
      "success": "شكراً لتطوعك واستعدادك للمساهمة - سيتواصل فريقنا معك قريباً."
    },
    "partners": {
      "eyebrow": "الشراكات المجتمعية",
      "h1a": "رؤية مشتركة. عمل جماعي. ",
      "h1accent": "وأثر ملموس.",
      "intro": "التغيير الحقيقي يتحقق عندما توحد المؤسسات طاقاتها. تتعاون رواد أعمال كاب مع الشركات والمؤسسات العامة والمنظمات غير الربحية والجامعات لتطوير مبادرات رقمية شاملة ومستدامة. نرحب بكل شريك يشاركنا التزامنا بالشمول وإمكانية الوصول والتعاون الدولي.",
      "whoTitle": "من هم شركاؤنا؟",
      "partnerTypes": [
        {
          "name": "شركاء الشركات والقطاع الخاص",
          "desc": "ادعم مبادرات ذات أثر مجتمعي من خلال الرعاية، التبرع بالمعدات التقنية أو رعاية الكفاءات."
        },
        {
          "name": "الشركاء المؤسسيون والهيئات العامة",
          "desc": "التعاون في الأولويات الوطنية المتعلقة بالشمول الرقمي والتنمية المستدامة والتصميم الشامل."
        },
        {
          "name": "المنظمات غير الربحية والمؤسسات الاجتماعية",
          "desc": "تطوير برامج مشتركة، تبادل الموارد وتوسيع نطاق المبادرات المجتمعية."
        },
        {
          "name": "الشركاء الأكاديميون وحاضنات الأعمال",
          "desc": "الجامعات والمراكز البحثية: المساهمة بالبحث العلمي، التوجيه والابتكار الاجتماعي."
        },
        {
          "name": "شركاء التوريد الإبداعي والمشترون الدوليون",
          "desc": "المتاجر، المهندسون، المصممون، والمؤسسات الثقافية: استكشفوا المواهب الإفريقية عبر برنامج التوريد الإبداعي."
        }
      ],
      "foundingTitle": "كن شريكاً مؤسساً",
      "foundingSub": "ساهم في بناء منظومة شاملة ومستدامة من الأساس.",
      "foundingWhy": "يساهم الشركاء المؤسسون مباشرة في بناء البرامج واللجان والمبادرات الدولية. نبني معاً حركة دولية تحول الطموحات المشتركة إلى أثر مجتمعي ملموس.",
      "offersTitle": "أوجه التعاون المتاحة:",
      "offers": [
        "باريس 2027: حضور ورؤية دولية في لقاء ما قبل المهرجان.",
        "نيروبي 2027: جناح ورعاية في المهرجان العالمي للتكنولوجيا الشاملة.",
        "مراكش 2027: دور فاعل في برنامج التوريد الإبداعي الإفريقي.",
        "اللجان الاستشارية: المشاركة في هيئات الحوكمة والتوجيه الاستراتيجي.",
        "رعاية البرامج: الارتباط المباشر ببرنامج أو أكثر من برامجنا الهيكلية.",
        "الرعاية المجتمعية: باقات مخصصة لأهداف المسؤولية الاجتماعية للمؤسسات.",
        "المساهمات العينية: أجهزة كمبيوتر، تراخيص برمجية، مقرات أو كفاءات متخصصة.",
        "الوفود الدولية: التمثيل المشترك في المؤتمرات والفعاليات الدولية."
      ],
      "foundingClosing": "دعونا نبني شراكة ذات معنى تتجاوز مجرد الظهور الإعلامي لتخلق فرصاً حقيقية وأثراً دائماً على الأرض.",
      "ctaFounding": "كن شريكاً مؤسساً",
      "ctaPackage": "طلب ملف الشراكة الكامل",
      "formEyebrow": "طلب الشراكة",
      "formTitle": "دعنا نبني معاً",
      "formCopy": "أخبرنا عن مؤسستك ورؤيتك للتعاون المثمر مع رواد أعمال كاب.",
      "formSubmit": "إرسال مقترح الشراكة",
      "formSuccess": "شكراً لمبادرتك - سيتواصل فريق الشراكات معك في أقرب وقت.",
      "typeLabel": "فئة الشراكة",
      "typePh": "اختر فئة الشراكة",
      "orgLabel": "اسم المؤسسة",
      "orgPh": "اسم شركتك أو جمعيتك أو مؤسستك",
      "ideaLabel": "رؤية التعاون المقترحة",
      "ideaPh": "شاركنا أهدافك أو مقترحات المشاريع المشتركة..."
    },
    "festival": {
      "eyebrow": "المهرجان الدولي",
      "h1a": "حركة واحدة. نوافذ متعددة. ",
      "h1accent": "وعالم من الإمكانات.",
      "intro": "مهرجان كاب الدولي هو أكثر من مجرد مؤتمر : إنه ملتقى للأفكار والأشخاص والثقافات والفرص، يجمع رواد الأعمال والمبتكرين والمنظمات لبناء اقتصادات رقمية أكثر شمولاً واستدامة. متجذر في المعرفة الكندية ومنفتح على العالم لتعزيز التعاون العابر للحدود.",
      "subIntro": "رحلة دولية نبنيها معاً من خلال محطات استراتيجية تفتح كل منها نافذة جديدة على العالم.",
      "destinationsTitle": "رؤية واحدة. وروابط ممتدة.",
      "destinations": [
        {
          "city": "باريس · 2027",
          "title": "فتح آفاق جديدة",
          "desc": "ملتقى للأفكار والشراكات والروابط الدولية، يبرز المعرفة الكندية أمام جمهور أوروبي ودولي."
        },
        {
          "city": "نيروبي · 2027",
          "title": "المهرجان الدولي",
          "desc": "الحدث المركزي لحركتنا الدولية يجمع المبتكرين حول التكنولوجيا الشاملة والاقتصاد الدائري والمهارات والابتكار الاجتماعي."
        },
        {
          "city": "مراكش · 2027",
          "title": "ربط المنظومات الإبداعية",
          "desc": "مساحة لتعزيز التعاون الثقافي وربط المبدعين بأسواق ومجتمعات جديدة."
        },
        {
          "city": "المارتينيك · 2028",
          "title": "توسيع الآفاق الكاريبية",
          "desc": "محطة جديدة في تطورنا الدولي لتعزيز الروابط بين منطقة الكاريبي وكندا والشبكات الدولية."
        }
      ],
      "spacesTitle": "محاورنا المشتركة - أربع مساحات مترابطة:",
      "spaces": [
        {
          "title": "التكنولوجيا الشاملة",
          "text": "جعل الابتكار الرقمي متاحاً وعالمياً وشاملاً للجميع."
        },
        {
          "title": "التكنولوجيا الدائرية",
          "text": "تشجيع إعادة الاستخدام والإصلاح والممارسات التقنية المستدامة."
        },
        {
          "title": "المهارات الرقمية",
          "text": "مساعدة الأفراد والمجتمعات على اكتساب مهارات المشاركة في الاقتصاد الرقمي."
        },
        {
          "title": "الابتكار الاجتماعي",
          "text": "دعم الحلول الريادية التي تلبي الاحتياجات الأساسية للمجتمعات."
        }
      ],
      "whyAttendTitle": "لماذا تشارك؟",
      "whyAttend": [
        "لقاء رواد الأعمال والمبتكرين وشركاء المنظومة الدولية.",
        "استكشاف نماذج عملية في التكنولوجيا الشاملة والمستدامة.",
        "بناء شراكات عبر كندا، إفريقيا، أوروبا والكاريبي.",
        "تبادل المعرفة والخبرات الميدانية المفيدة.",
        "المساهمة في رسم ملامح مستقبل الاقتصاد الرقمي.",
        "استكشاف فرص التبادل التجاري الإبداعي والإنساني."
      ],
      "closingText": "العالم ليس وجهة واحدة، بل شبكة من الإمكانات التي تنتظر من يربط بينها. رواد أعمال كاب - فتح آفاق جديدة.",
      "ctaWaitlist": "انضم لقائمة الانتظار",
      "ctaPartners": "استكشف شراكات المهرجان"
    },
    "blog": {
      "eyebrow": "المساحة الفكرية والإعلامية",
      "h1a": "نوافذ كاب - ",
      "h1accent": "اكتشف ما هو ممكن وراء أفقك الحالي",
      "intro": "نوافذ كاب هي مساحتنا التحريرية لمشاركة الأفكار والشخصيات والمبادرات والفرص التي تساعد مجتمعنا على الرؤية أبعد. هنا يرصد المستكشفون الاتجاهات الصاعدة، بينما يشارك صناع الجسور المسارات والشراكات التي تحول الاستكشاف إلى عمل واقعي.",
      "subIntro": "من الابتكار الرقمي إلى المنظومات الدولية، ومن قصص الأثر إلى الفعاليات القادمة، كل نافذة تقدم رؤية جديدة.",
      "seriesTitle": "استكشف سلاسلنا التحريرية",
      "series": [
        {
          "title": "المستكشفون (The Signal Seekers)",
          "tag": "الاتجاهات الصاعدة",
          "desc": "ما الذي نرصده؟ اتجاهات وتقنيات واحتياجات ناشئة تستحق المتابعة."
        },
        {
          "title": "صناع الجسور (The Door Openers)",
          "tag": "المسارات والشبكات",
          "desc": "مع من نتواصل؟ أفراد ومؤسسات يصنعون مسارات للتعاون المشترك."
        },
        {
          "title": "كاب نحو…",
          "tag": "محطات إقليمية",
          "desc": "استكشف مدينة أو منطقة وتعرف على المبادرات المحلية وصناع التغيير."
        },
        {
          "title": "المحطة التالية",
          "tag": "مسارات وقصص",
          "desc": "تعرف على أفراد يتعلمون ويبنون مسارات مهنية جديدة."
        },
        {
          "title": "نوافذ الفرص",
          "tag": "دعوات ومبادرات",
          "desc": "اكتشف الفعاليات والدعوات والمشاريع وفرص المشاركة المجتمعية."
        }
      ],
      "oneCommunityTitle": "مجتمع واحد. ورؤى متعددة.",
      "oneCommunityText": "نشارك المعرفة عبر اللغات والقطاعات والمناطق، بمحتوى موجه لمجتمعاتنا الفرنكوفونية والأنغلوفونية وشركائنا حول العالم.",
      "ctaShare": "شارك قصة",
      "ctaContact": "تواصل مع التحرير",
      "ctaNewsletter": "اشترك في النشرة البريدية"
    },
    "contact": {
      "eyebrow": "اتصل بنا",
      "h1a": "دعنا نجد وجهتك ",
      "h1accent": "القادمة معاً",
      "intro": "سواء كنت فرداً يرغب في المشاركة، جمعية تبحث عن شريك، مشترياً دولياً، أو مؤسسة داعمة لمهمتنا، يسعدنا الاستماع إليك والتعرف على تطلعاتك.",
      "helpTitle": "كيف نساعدك؟ اختر ملفك التعريفي:",
      "profiles": [
        {
          "icon": "🎓",
          "text": "أريد الانضمام للمجتمع - التعرف على فرص التعلم والتواصل.",
          "cta": "انضم لرواد أعمال كاب",
          "link": "/join"
        },
        {
          "icon": "🤝",
          "text": "أريد التطوع - وضع مهاراتي وخبراتي في خدمة مبادرات هادفة.",
          "cta": "اكتشف التطوع",
          "link": "/volunteer"
        },
        {
          "icon": "🏢",
          "text": "أمثل منظمة غير ربحية - بحث فرص التعاون والمشاريع المشتركة.",
          "cta": "ناقش شراكة معنا",
          "link": "#contact-form"
        },
        {
          "icon": "💼",
          "text": "أمثل شركة أو مؤسسة - استكشاف الرعاية والشراكات الاستراتيجية.",
          "cta": "كن شريكاً",
          "link": "/partners"
        },
        {
          "icon": "🛍️",
          "text": "أنا مشترٍ دولي أو مبدع - معرفة المزيد عن برنامج التوريد الإبداعي.",
          "cta": "انضم لبرنامج التوريد",
          "link": "#contact-form"
        },
        {
          "icon": "🌍",
          "text": "أريد دعم المهرجان الدولي - مناقشة الرعاية والمشاركة في الفعاليات.",
          "cta": "ادعم المهرجان",
          "link": "/partners"
        },
        {
          "icon": "📰",
          "text": "أنا صحفي أو ممثل مؤسسي - التواصل مع المكتب الإعلامي للمنظمة.",
          "cta": "اتصال إعلامي",
          "link": "mailto:contact@3mservice.shop"
        }
      ],
      "formTitle": "ابدأ الحوار معنا",
      "formSub": "كل شراكة مثمرة تبدأ بحوار بسيط. يسعدنا استقبال رسالتك.",
      "profileLabel": "ملفك التعريفي",
      "profilePh": "اختر نوع الملف",
      "profileOptions": [
        "فرد (تعلم وتطوير ذاتي)",
        "مرشح للتطوع",
        "منظمة غير ربحية / جمعية",
        "شريك من قطاع الأعمال",
        "مشترٍ دولي / مهني إبداعي",
        "مانح / ممول / مؤسسة خيرية",
        "صحفي / ممثل مؤسسي",
        "طلب آخر"
      ],
      "topicLabel": "موضوع الرسالة",
      "topicPh": "اختر الموضوع",
      "topicOptions": [
        "البرامج والتدريب",
        "المسار التطوعي",
        "الشراكات والدعم التمويلي",
        "برنامج التوريد الإبداعي الإفريقي",
        "المهرجان الدولي نيروبي 2027",
        "الصحافة والعلاقات المؤسسية",
        "استفسار عام"
      ],
      "messageLabel": "رسالتك",
      "messagePh": "أخبرنا عن مشروعك أو استفسارك وكيف يمكننا التعاون معاً...",
      "submit": "إرسال الرسالة",
      "success": "تم إرسال الرسالة بنجاح - سيتواصل فريقنا معك في أقرب وقت.",
      "info": [
        {
          "label": "البريد الإلكتروني",
          "value": "contact@3mservice.shop"
        },
        {
          "label": "المقر الرئيسي",
          "value": "1265, rue Rachel E, porte 403, Montréal (Québec) H2J 2J9 • Canada"
        },
        {
          "label": "النطاق",
          "value": "متجذرة في كيبيك. متصلة بكندا. منفتحة على العالم."
        }
      ],
      "pressTitle": "التواصل الصحفي والمؤسسي",
      "pressCopy": "للطلبات الصحفية والإعلامية والمراسلات الرسمية، تواصل مباشرة مع فريق التواصل والإعلام لدينا.",
      "pressEmail": "contact@3mservice.shop"
    },
    "donate": {
      "eyebrow": "تبرع لرواد أعمال كاب",
      "h1a": "فتح آفاق جديدة. ",
      "h1accent": "وجعل الفرص ممكنة للجميع.",
      "intro": "يساعد دعمك في ربط الناس والمهارات والتكنولوجيا والفرص لبناء اقتصادات رقمية أكثر شمولاً وملاءمة واستدامة. نؤمن بأن كل إنسان يستحق فرصة للتعلم والابتكار والمشاركة.",
      "subIntro": "بصفتنا منظمة كندية غير ربحية برؤية دولية، نعمل على خفض حواجز المشاركة الرقمية، تعزيز القدرات الريادية وربط الكفاءات بالفرص الواعدة. مساهمتك تدعم البرامج الميدانية والمبادرات المجتمعية التي تحول الأفكار إلى واقع.",
      "tagline": "مساهمة واحدة. التزام مشترك. وإمكانات جديدة.",
      "ctaDonate": "تبرع الآن",
      "submit": "تأكيد التعهد بالتبرع",
      "success": "شكراً جزيلاً لكرمك ولدعمك لمهمتنا - سيتواصل فريقنا معك لتأكيد التبرع وإرسال تفاصيل الإيصال الرسمي."
    },
    "stories": {
      "eyebrow": "قصص التأثير",
      "h1a": "قصص ",
      "h1accent": "التعاون المجتمعي",
      "intro": "نشارك قصصاً واقعية وملموسة عن التمكين الرقمي والتضامن في كندا ودولياً.",
      "parts": [
        [
          "التحدي",
          "challenge"
        ],
        [
          "برنامجنا",
          "program"
        ],
        [
          "الإجراءات المتخذة",
          "actions"
        ],
        [
          "الأثر المحقق",
          "impact"
        ],
        [
          "الفرص القادمة",
          "future"
        ]
      ],
      "ctaTitle": "قصتك قد تكون هي التالية",
      "ctaApply": "التقديم للبرنامج",
      "ctaMember": "انضم إلى المنظومة"
    },
    "membership": {
      "volSuccess": "شكراً لاهتمامك ومشاركتك - سيتواصل فريقنا معك قريباً.",
      "areaLabel": "مجال الاهتمام",
      "areaOptions": [
        "المهارات الرقمية",
        "صيانة وتجديد الأجهزة",
        "الزراعة الرقمية",
        "الإعلام والتعليم",
        "المرأة وريادة الأعمال الإبداعية"
      ],
      "availLabel": "التفرغ",
      "skillsLabel": "المهارات والخبرة",
      "skillsPh": "أخبرنا عن خلفيتك واهتماماتك...",
      "joinPh": "اختر واحداً",
      "availPh": "مثال: ساعتان/أسبوعياً، 4-6 ساعات، حسب المشروع"
    }
  }
};

const LangContext = createContext(null);

export const LanguageProvider = ({ children }) => {
  const [lang, setLang] = useState(() => {
    try {
      return localStorage.getItem("3m-lang") || "fr";
    } catch {
      return "fr";
    }
  });

  useEffect(() => {
    try {
      localStorage.setItem("3m-lang", lang);
    } catch { }
    document.documentElement.lang = lang;
    document.documentElement.dir = lang === "ar" ? "rtl" : "ltr";
  }, [lang]);

  const toggle = () => {
    setLang((current) => {
      if (current === "fr") return "en";
      if (current === "en") return "ar";
      return "fr";
    });
  };

  return (
    <LangContext.Provider value={{ lang, setLang, toggle, t: STR[lang] || STR.fr }}>
      {children}
    </LangContext.Provider>
  );
};

export const useLang = () => {
  const context = useContext(LangContext);
  if (!context) {
    return {
      lang: "fr",
      setLang: () => { },
      toggle: () => { },
      t: STR.fr
    };
  }
  return context;
};

export const useLanguage = useLang;
export default STR;
