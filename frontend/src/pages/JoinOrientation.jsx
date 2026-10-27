import React, { useState, useEffect } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { ArrowRight, CheckCircle2, ArrowUpRight } from "lucide-react";
import { Reveal, Magnetic } from "@/components/motion";
import PageHero from "@/components/PageHero";
import { getRecommendation } from "@/lib/recommendationEngine";
import CharleePromo from "@/components/CharleePromo";

const QUESTIONS = [
  {
    id: "contribute",
    title: "What would you like to contribute?",
    options: [
      "Digital skills", "Communication", "Business development", 
      "Training", "Arts & culture", "Technology", 
      "Agriculture", "Partnerships", "Project management"
    ]
  },
  {
    id: "experience",
    title: "What is your experience level?",
    options: [
      "Student / Fellow", "Associate", "Professional", 
      "Consultant", "Director / Executive"
    ]
  },
  {
    id: "time",
    title: "How much time can you contribute?",
    options: [
      "2 h/week", "4–6 h/week", "7–10 h/week", "Project-based"
    ]
  }
];

const Join = () => {
  const [searchParams] = useSearchParams();
  const intent = searchParams.get("intent");
  
  const [step, setStep] = useState(0);
  const [answers, setAnswers] = useState({
    contribute: intent === "skills" ? "Digital skills" : "",
    experience: "",
    time: ""
  });
  const [recommendation, setRecommendation] = useState(null);

  const handleSelect = (option) => {
    const currentQ = QUESTIONS[step].id;
    const newAnswers = { ...answers, [currentQ]: option };
    setAnswers(newAnswers);

    if (step < QUESTIONS.length - 1) {
      setTimeout(() => setStep(step + 1), 300);
    } else {
      setRecommendation(getRecommendation(newAnswers));
    }
  };

  return (
    <div data-testid="join-page">
      <PageHero
        title="Find your place"
        accent="in the ecosystem"
        subtitle="Complete this short questionnaire to discover your recommended 3M SERVICES pathway."
        image="/assets/hero-default.jpg"
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
              <div className="border border-forest/15 bg-forest/5 p-8 md:p-12">
                <div className="mb-8 flex items-center justify-center">
                  <div className="flex h-16 w-16 items-center justify-center rounded-full bg-maple text-bone">
                    <CheckCircle2 className="h-8 w-8" />
                  </div>
                </div>
                <h2 className="mb-12 text-center font-heading text-3xl font-black text-forest md:text-5xl">
                  Your recommended 3M SERVICES pathway
                </h2>
                
                <div className="grid gap-8 md:grid-cols-2">
                  <div className="bg-white p-6 shadow-sm">
                    <p className="text-xs font-bold uppercase tracking-widest text-maple mb-2">Recommended Committee</p>
                    <p className="font-heading text-2xl font-bold text-forest">{recommendation.committee}</p>
                  </div>
                  <div className="bg-white p-6 shadow-sm">
                    <p className="text-xs font-bold uppercase tracking-widest text-maple mb-2">Recommended Role</p>
                    <p className="font-heading text-2xl font-bold text-forest">{recommendation.role}</p>
                  </div>
                  <div className="bg-white p-6 shadow-sm md:col-span-2">
                    <p className="text-xs font-bold uppercase tracking-widest text-maple mb-2">Recommended Training</p>
                    <p className="font-heading text-xl font-bold text-forest">{recommendation.training}</p>
                  </div>
                </div>

                <div className="mt-12 text-center">
                  <Link
                    to={recommendation.path}
                    className="group inline-flex items-center gap-2 bg-forest px-8 py-4 font-heading text-sm font-bold uppercase tracking-[0.15em] text-bone transition-colors hover:bg-maple"
                  >
                    {recommendation.action}
                    <ArrowUpRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
                  </Link>
                </div>
                <div className="mt-8 text-center">
                  <button onClick={() => { setStep(0); setRecommendation(null); setAnswers({contribute:"", experience:"", time:""}); }} className="text-xs font-bold uppercase tracking-widest text-sage hover:text-forest">
                    Retake Questionnaire
                  </button>
                </div>
              </div>
            </Reveal>
          )}
        </div>
      </section>

      <CharleePromo />
    </div>
  );
};

export default Join;
