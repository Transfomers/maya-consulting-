import { useState } from "react";
import { useTranslation } from "../context/LanguageContext";

function Faq() {
  const { t } = useTranslation();
  const [activeQ, setActiveQ] = useState("q1");

  const openQ = (id) => {
    setActiveQ(activeQ === id ? "" : id);
  };

  const getClassAnswer = (id) => {
    return activeQ === id ? "active-answer" : "";
  };

  const getClassQuestion = (id) => {
    return activeQ === id ? "active-question" : "";
  };

  return (
    <>
      <section className="faq-section">
        <div className="container">
          <div className="faq-content">
            <div className="all-questions">
              <div className="faq-box">
                <div
                  id="q1"
                  onClick={() => openQ("q1")}
                  className={`faq-box__question ${getClassQuestion("q1")}`}
                >
                  <p>{t("faq_q1", "1. Comment réserver un véhicule chez 3M SERVICES ?")}</p>
                  <span className="faq-box__toggle-icon" aria-hidden="true">
                    <i className={`fa-solid ${activeQ === "q1" ? "fa-chevron-up" : "fa-chevron-down"}`}></i>
                  </span>
                </div>
                <div
                  id="q1"
                  onClick={() => openQ("q1")}
                  className={`faq-box__answer ${getClassAnswer("q1")}`}
                >
                  {t(
                    "faq_a1",
                    "La réservation est immédiate : choisissez votre véhicule dans notre formulaire en ligne, appelez notre équipe ou contactez-nous directement sur WhatsApp au +237 691 78 64 47. Nous confirmons la disponibilité et préparons votre contrat en quelques minutes."
                  )}
                </div>
              </div>

              <div className="faq-box">
                <div
                  id="q2"
                  onClick={() => openQ("q2")}
                  className={`faq-box__question ${getClassQuestion("q2")}`}
                >
                  <p>
                    {t(
                      "faq_q2",
                      "2. Proposez-vous un service de chauffeur professionnel ?"
                    )}
                  </p>
                  <span className="faq-box__toggle-icon" aria-hidden="true">
                    <i className={`fa-solid ${activeQ === "q2" ? "fa-chevron-up" : "fa-chevron-down"}`}></i>
                  </span>
                </div>
                <div
                  id="q2"
                  onClick={() => openQ("q2")}
                  className={`faq-box__answer ${getClassAnswer("q2")}`}
                >
                  {t(
                    "faq_a2",
                    "Oui, tous nos véhicules (Toyota Prado VIP, berlines, SUV) sont disponibles avec des chauffeurs bilingues, courtois et expérimentés sur les axes de Yaoundé et les trajets interurbains (Douala, Kribi, Bafoussam)."
                  )}
                </div>
              </div>

              <div className="faq-box">
                <div
                  id="q3"
                  onClick={() => openQ("q3")}
                  className={`faq-box__question ${getClassQuestion("q3")}`}
                >
                  <p>
                    {t(
                      "faq_q3",
                      "3. Assurez-vous la navette vers l'Aéroport de Yaoundé-Nsimalen ?"
                    )}
                  </p>
                  <span className="faq-box__toggle-icon" aria-hidden="true">
                    <i className={`fa-solid ${activeQ === "q3" ? "fa-chevron-up" : "fa-chevron-down"}`}></i>
                  </span>
                </div>
                <div
                  id="q3"
                  onClick={() => openQ("q3")}
                  className={`faq-box__answer ${getClassAnswer("q3")}`}
                >
                  {t(
                    "faq_a3",
                    "Oui, notre service navette 24/7 prend en charge votre accueil dès la sortie de l'aéroport avec une pancarte nominative et assure votre transfert en toute sérénité vers votre hôtel, domicile ou résidence meublée."
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}

export default Faq;
