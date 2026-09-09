import React, { useEffect, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { ArrowUpRight, CheckCircle2 } from "lucide-react";
import { Reveal } from "@/components/motion";
import { useLang } from "@/lib/i18n";
import PageHero from "@/components/PageHero";
import FormShell from "@/components/FormShell";

const submissionTypeFor = (finalAnswers) => {
  if (finalAnswers.intent === "Volunteer") return "volunteer";
  if (finalAnswers.intent === "Develop skills") return "membership";
  if (finalAnswers.type === "Organization") return "partner";
  return "contact";
};

const Join = () => {
  const { t } = useLang();
  const [searchParams] = useSearchParams();
  const [step, setStep] = useState(0);
  const [answers, setAnswers] = useState({
    type: "",
    intent: "",
    location: ""
  });
  const [recommendation, setRecommendation] = useState(null);

  useEffect(() => {
    if (searchParams.get("intent") !== "volunteer") return;
    setAnswers({ type: "Individual", intent: "Volunteer", location: "" });
    setStep(2);
  }, [searchParams]);

  const QUESTIONS = [
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
  ];

  const handleSelect = (option) => {
    const currentQ = QUESTIONS[step].id;
    const newAnswers = { ...answers, [currentQ]: option };
    
    // If they change answer 1, reset answer 2 and 3
    if (step === 0 && option !== answers.type) {
      newAnswers.intent = "";
      newAnswers.location = "";
    }
    
    setAnswers(newAnswers);

    if (step < QUESTIONS.length - 1) {
      setTimeout(() => setStep(step + 1), 300);
    } else {
      setTimeout(() => computeRecommendation(newAnswers), 300);
    }
  };

  const computeRecommendation = (finalAnswers) => {
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
  };

  return (
    <div data-testid="join-page">
      <PageHero
        testId="join-hero"
        eyebrow={t.join.eyebrow}
        lines={[
          <>{t.join.h1a}<span className="font-serif font-medium italic text-maple">{t.join.h1accent}</span></>
        ]}
        intro={t.join.intro}
      />

      <section className="bg-white py-24 md:py-32">
        <div className="mx-auto max-w-4xl px-5 md:px-10">
          {!recommendation ? (
            <Reveal>
              <div className="mb-12 flex justify-between gap-2">
                {QUESTIONS.map((_, i) => (
                  <div key={i} className={`h-2 flex-1 rounded-full ${i <= step ? "bg-maple" : "bg-forest/10"}`} />
                ))}
              </div>
              <h2 className="mb-8 font-heading text-3xl font-bold text-forest md:text-4xl">
                {QUESTIONS[step].title}
              </h2>
              <div className="grid gap-4 sm:grid-cols-2">
                {QUESTIONS[step].options.map((opt) => (
                  <button
                    key={opt.value}
                    onClick={() => handleSelect(opt.value)}
                    className={`flex items-center justify-between border p-6 text-left font-bold transition-all ${
                      answers[QUESTIONS[step].id] === opt.value
                        ? "border-maple bg-maple/5 text-maple"
                        : "border-forest/15 text-forest hover:border-forest"
                    }`}
                  >
                    {opt.label}
                    {answers[QUESTIONS[step].id] === opt.value && <CheckCircle2 className="h-5 w-5 text-maple" />}
                  </button>
                ))}
              </div>
              {step > 0 && (
                <button
                  onClick={() => setStep(step - 1)}
                  className="mt-8 text-sm font-bold uppercase tracking-widest text-sage hover:text-forest"
                >
                  {t.join.back}
                </button>
              )}
            </Reveal>
          ) : (
            <Reveal>
              <div className="border border-forest/15 bg-forest/5 p-8 md:p-12 text-center">
                <div className="mb-8 flex items-center justify-center">
                  <div className="flex h-16 w-16 items-center justify-center rounded-full bg-maple text-bone">
                    <CheckCircle2 className="h-8 w-8" />
                  </div>
                </div>
                <h2 className="mb-6 font-heading text-3xl font-black text-forest md:text-5xl">
                  {t.join.recommendedTitle}
                </h2>
                
                <p className="mb-12 font-serif text-2xl italic text-sage md:text-3xl">
                  {recommendation.message}
                </p>

                <div>
                  <Link
                    to={recommendation.path}
                    className="group inline-flex items-center gap-2 bg-forest px-8 py-4 font-heading text-sm font-bold uppercase tracking-[0.15em] text-bone transition-colors hover:bg-maple"
                  >
                    {recommendation.action}
                    <ArrowUpRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
                  </Link>
                </div>
                <div className="mt-12 text-left border-t border-forest/10 pt-10">
                  <h3 className="mb-2 font-heading text-xl font-bold text-forest">Leave your details</h3>
                  <p className="mb-8 text-sm text-sage">The quiz alone is not stored. This form creates a submission the team can see.</p>
                  <FormShell
                    key={`${answers.type}-${answers.intent}-${answers.location}`}
                    type={submissionTypeFor(answers)}
                    testId="join-followup-form"
                    submitLabel={t.contact?.submit || "Send"}
                    successMessage={t.contact?.success || t.membership.volSuccess}
                    initialValues={{
                      intent: answers.intent,
                      audience: answers.type,
                      location: answers.location,
                    }}
                    fields={[
                      { name: "name", label: t.form.name, placeholder: t.form.namePh, required: true },
                      { name: "email", label: t.form.email, kind: "email", placeholder: t.form.emailPh, required: true },
                      { name: "message", label: t.contact?.messageLabel || "Message", kind: "textarea", placeholder: t.contact?.messagePh || t.form.orgPh },
                    ]}
                  />
                </div>
                <div className="mt-8">
                  <button onClick={() => { setStep(0); setRecommendation(null); setAnswers({type:"", intent:"", location:""}); }} className="text-xs font-bold uppercase tracking-widest text-sage hover:text-forest">
                    {t.join.retake}
                  </button>
                </div>
              </div>
            </Reveal>
          )}
        </div>
      </section>
    </div>
  );
};

export default Join;
