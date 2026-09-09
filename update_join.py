import re

with open("frontend/src/pages/Join.jsx", "r") as f:
    content = f.read()

# Replace hardcoded texts
replacements = {
    'eyebrow="Join the Ecosystem"': 'eyebrow={t.join.eyebrow}',
    '<>Find your <span className="font-serif font-medium italic text-maple">pathway</span></>': '<>{t.join.h1a}<span className="font-serif font-medium italic text-maple">{t.join.h1accent}</span></>',
    'intro="Complete this short questionnaire to discover the best way for you or your organization to engage with CAP Entrepreneurs."': 'intro={t.join.intro}',
    '← Back': '{t.join.back}',
    'Your Recommended Pathway': '{t.join.recommendedTitle}',
    'Retake Questionnaire': '{t.join.retake}',
}

for old, new in replacements.items():
    content = content.replace(old, new)

# Now refactor QUESTIONS array to use t.join and value/label
old_questions = """  const QUESTIONS = [
    {
      id: "type",
      title: "Are you an individual or an organization?",
      options: ["Individual", "Organization"]
    },
    {
      id: "intent",
      title: answers.type === "Individual" 
        ? "Are you looking to develop skills or volunteer?" 
        : "Are you a nonprofit, startup, or corporate?",
      options: answers.type === "Individual" 
        ? ["Develop skills", "Volunteer"] 
        : ["Nonprofit", "Startup", "Corporate"]
    },
    {
      id: "location",
      title: "Where are you located?",
      options: ["Quebec", "Rest of Canada", "International"]
    }
  ];"""

new_questions = """  const QUESTIONS = [
    {
      id: "type",
      title: t.join.q1Title,
      options: [
        { label: t.join.optIndividual, value: "individual" },
        { label: t.join.optOrganization, value: "organization" }
      ]
    },
    {
      id: "intent",
      title: answers.type === "individual" ? t.join.q2IndivTitle : t.join.q2OrgTitle,
      options: answers.type === "individual" 
        ? [
            { label: t.join.optDevelopSkills, value: "skills" },
            { label: t.join.optVolunteer, value: "volunteer" }
          ]
        : [
            { label: t.join.optNonprofit, value: "nonprofit" },
            { label: t.join.optStartup, value: "startup" },
            { label: t.join.optCorporate, value: "corporate" }
          ]
    },
    {
      id: "location",
      title: t.join.q3Title,
      options: [
        { label: t.join.optQuebec, value: "quebec" },
        { label: t.join.optCanada, value: "canada" },
        { label: t.join.optIntl, value: "international" }
      ]
    }
  ];"""

content = content.replace(old_questions, new_questions)

# Update options rendering and handleSelect
content = content.replace('QUESTIONS[step].options.map((opt) => (', 'QUESTIONS[step].options.map((opt) => (') # unchanged structurally initially
# We need to change opt to opt.value and rendering opt.label
content = content.replace('onClick={() => handleSelect(opt)}', 'onClick={() => handleSelect(opt.value)}')
content = content.replace('answers[QUESTIONS[step].id] === opt', 'answers[QUESTIONS[step].id] === opt.value')
content = content.replace('key={opt}', 'key={opt.value}')
content = content.replace('{opt}\n', '{opt.label}\n') # this might be tricky, let's use regex
content = re.sub(r'>\s*\{opt\}\s*\{answers\[QUESTIONS', '> {opt.label} {answers[QUESTIONS', content)

# Update computeRecommendation logic
old_rec_logic = """  const computeRecommendation = (finalAnswers) => {
    let rec = {
      message: "We recommend you explore our general programs.",
      path: "/programs",
      action: "Explore Programs"
    };

    if (finalAnswers.type === "Individual") {
      if (finalAnswers.intent === "Volunteer") {
        rec = {
          message: "We recommend you check out the Volunteer page.",
          path: "/volunteer",
          action: "Become a Volunteer"
        };
      } else {
        rec = {
          message: "We recommend you explore CAP Green Lab and our other skills programs.",
          path: "/programs",
          action: "View Programs"
        };
      }
    } else {
      if (finalAnswers.intent === "Nonprofit") {
        rec = {
          message: "We recommend you connect with our Partnerships team.",
          path: "/contact",
          action: "Contact Partnerships"
        };
      } else {
        rec = {
          message: "We recommend you explore Corporate or Startup partnerships.",
          path: "/partners",
          action: "View Partners"
        };
      }
    }
    setRecommendation(rec);
  };"""

new_rec_logic = """  const computeRecommendation = (finalAnswers) => {
    let rec = {
      message: t.join.recGeneral,
      path: "/programs",
      action: t.join.recGeneralAction
    };

    if (finalAnswers.type === "individual") {
      if (finalAnswers.intent === "volunteer") {
        rec = {
          message: t.join.recVolunteer,
          path: "/volunteer",
          action: t.join.recVolunteerAction
        };
      } else {
        rec = {
          message: t.join.recSkills,
          path: "/programs",
          action: t.join.recSkillsAction
        };
      }
    } else {
      if (finalAnswers.intent === "nonprofit") {
        rec = {
          message: t.join.recPartner,
          path: "/contact",
          action: t.join.recPartnerAction
        };
      } else {
        rec = {
          message: t.join.recCorporate,
          path: "/partners",
          action: t.join.recCorporateAction
        };
      }
    }
    setRecommendation(rec);
  };"""

content = content.replace(old_rec_logic, new_rec_logic)

# Make sure we import useLang
if "useLang" not in content:
    content = content.replace('import PageHero', 'import { useLang } from "@/lib/i18n";\nimport PageHero')
    
# Add `const { t } = useLang();` at the top of the component
if "const { t } = useLang();" not in content:
    content = content.replace('const Join = () => {', 'const Join = () => {\n  const { t } = useLang();')

with open("frontend/src/pages/Join.jsx", "w") as f:
    f.write(content)

print("Updated Join.jsx")
