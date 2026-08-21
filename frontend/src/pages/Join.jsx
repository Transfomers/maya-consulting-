import React, { useEffect, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { ArrowUpRight, CheckCircle2 } from "lucide-react";
import { Reveal } from "@/components/motion";
import PageHero from "@/components/PageHero";
import FormShell from "@/components/FormShell";
import { useLang } from "@/lib/i18n";

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
  };

  return (
    <div data-testid="join-page">
      <PageHero
        testId="join-hero"
        eyebrow="Join the Ecosystem"
        lines={[
          <>Find your <span className="font-serif font-medium italic text-maple">pathway</span></>
        ]}
        intro="Complete this short questionnaire to discover the best way for you or your organization to engage with CAP Entrepreneurs."
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
                    key={opt}
                    onClick={() => handleSelect(opt)}
                    className={`flex items-center justify-between border p-6 text-left font-bold transition-all ${
                      answers[QUESTIONS[step].id] === opt
                        ? "border-maple bg-maple/5 text-maple"
                        : "border-forest/15 text-forest hover:border-forest"
                    }`}
                  >
                    {opt}
                    {answers[QUESTIONS[step].id] === opt && <CheckCircle2 className="h-5 w-5 text-maple" />}
                  </button>
                ))}
              </div>
              {step > 0 && (
                <button
                  onClick={() => setStep(step - 1)}
                  className="mt-8 text-sm font-bold uppercase tracking-widest text-sage hover:text-forest"
                >
                  ← Back
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
                  Your Recommended Pathway
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
                    Retake Questionnaire
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
