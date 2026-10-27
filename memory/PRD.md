# PRD 3M SERVICES Website

## Original Problem Statement
3M SERVICES is a Canadian nonprofit dedicated to building entrepreneurial ecosystems through education, collaboration, innovation and international partnerships. The website must position the organization to inspire entrepreneurs, nonprofits, funders, volunteers and institutional partners; encourage membership, program applications, donations, partnerships, volunteering and event participation; and use community driven (not corporate consulting) language. Full navigation: Home, About, Programs, Impact Stories, Membership, Partners, News & Events, Donate, Contact.

## User Personas
  Entrepreneurs (esp. rural/underserved) seeking programs, markets, scholarships
  Nonprofit leaders seeking governance/leadership development (CAP Executive)
  Funders & donors wanting measurable community impact
  Volunteers seeking contribution and international exchange opportunities
  Institutional partners (educational, municipal, economic development, corporate, international, tech)
  CAP admin staff reviewing incoming submissions

## Architecture
  Frontend: React 19 + Tailwind + framer motion (kinetic masked reveals, scroll reveals, parallax) + Lenis smooth scrolling + react fast marquee; multi page via react router
  Backend: FastAPI, MongoDB (motor). Public form intake endpoint; JWT cookie based admin auth (bcrypt hashing, brute force lockout); admin only submissions listing
  Design system: Organic & Earthy / High Contrast Swiss editorial. Bone #F7F5F0, forest #1A3626, brand purple #701FF7 (from official logo), brand green #07AB31 accents on dark sections. Cabinet Grotesk headings, Cormorant Garamond italic accents, Manrope body. Sharp corners, hairline borders, noise texture overlay. Official logo marks integrated: navbar (purple mark), footer + mobile menu (white mark), favicon.

## Implemented (2026 08 08)
  9 marketing pages: Home (kinetic hero, marquee, manifesto chapters, programs bento, $8,000 scholarship spotlight, audiences, stories preview), About (mission/vision/promise chapters, digital future), Programs (3 programs + application form), Impact Stories (3 structured stories), Membership (benefits bento + membership & volunteer forms), Partners (7 partner types + inquiry form), News & Events (static editorial content), Donate (impact breakdown + pledge form with CAD amounts), Contact (info + form)
  Admin: /admin/login + /admin dashboard with per type tabs and submission details
  Backend endpoints: POST /api/auth/login|logout, GET /api/auth/me, POST /api/submissions, GET /api/admin/submissions
  Admin seeding from env, bcrypt, JWT httpOnly cookies, login lockout (5 attempts/15 min)

## Verified
  Login (good/bad), /me, submission create (valid + invalid type), admin list + filter, unauth 401
  E2E: home hero render + scroll, donate pledge form submit with success toast, admin login → dashboard rows

## Content Status
  Impact stories, news items, events, contact email are SAMPLE content (MOCKED placeholders awaiting real copy)

## Backlog
  P0: Replace sample stories/news with real content; connect real donation payments (Stripe) if desired
  P1: Email notifications on new submissions (Resend); submission status management in admin (mark reviewed, notes, CSV export)
  P2: CMS editable news/events; bilingual EN/FR support; program cohort management; member portal
