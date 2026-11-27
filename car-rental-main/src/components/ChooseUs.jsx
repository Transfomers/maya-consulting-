import { useState } from "react";
import MainImg from "../images/chooseUs/main.png";
import Box1 from "../images/chooseUs/icon1.png";
import Box2 from "../images/chooseUs/icon2.png";
import Box3 from "../images/chooseUs/icon3.png";
import { useTranslation } from "../context/LanguageContext";

function ChooseUs() {
  const { t, lang } = useTranslation();
  const isFr = lang === "fr";
  const [showCatalogueModal, setShowCatalogueModal] = useState(false);

  const cataloguePdfUrl = `${process.env.PUBLIC_URL || ""}/Asset/catalogue.pdf`;
  const catalogueImgUrl = `${process.env.PUBLIC_URL || ""}/Asset/catalogue-3m.jpg`;

  return (
    <>
      <section className="choose-section">
        <div className="container">
          <div className="choose-container">
            <img
              className="choose-container__img"
              src={MainImg}
              alt="car_img"
            />
            <div className="text-container">
              <div className="text-container__left">
                <h4>{t("choose_sub")}</h4>
                <h2>{t("choose_title")}</h2>
                <p>{t("choose_desc")}</p>
                <div style={{ display: "flex", flexWrap: "wrap", alignItems: "center", gap: "1.2rem" }}>
                  <a
                    href={cataloguePdfUrl}
                    download="Catalogue_3M_SERVICES.pdf"
                    title={isFr ? "Télécharger le catalogue officiel 3M SERVICES (PDF)" : "Download official 3M SERVICES catalogue (PDF)"}
                  >
                    {t("choose_more")} &nbsp;
                    <i className="fa-solid fa-file-arrow-down"></i>
                  </a>
                  <button
                    type="button"
                    onClick={() => setShowCatalogueModal(true)}
                    style={{
                      display: "inline-flex",
                      alignItems: "center",
                      gap: "0.7rem",
                      padding: "1.35rem 2rem",
                      borderRadius: "0.3rem",
                      border: "2px solid #E20713",
                      background: "transparent",
                      color: "#E20713",
                      fontSize: "1.5rem",
                      fontWeight: 700,
                      cursor: "pointer",
                    }}
                  >
                    <i className="fa-solid fa-eye"></i>
                    {isFr ? "Voir le Catalogue" : "View Catalogue"}
                  </button>
                </div>

                <div
                  onClick={() => setShowCatalogueModal(true)}
                  role="button"
                  tabIndex={0}
                  onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") setShowCatalogueModal(true); }}
                  title={isFr ? "Cliquer pour agrandir le catalogue 3M SERVICES" : "Click to enlarge 3M SERVICES catalogue"}
                  style={{
                    marginTop: "2rem",
                    display: "inline-block",
                    cursor: "pointer",
                    borderRadius: "12px",
                    overflow: "hidden",
                    border: "1px solid rgba(15, 23, 42, 0.12)",
                    boxShadow: "0 10px 26px rgba(15, 23, 42, 0.12)",
                    maxWidth: "240px",
                    background: "#fff",
                  }}
                >
                  <img
                    src={catalogueImgUrl}
                    alt={isFr ? "Catalogue Officiel 3M SERVICES — Location Automobile" : "3M SERVICES Official Car Rental Catalogue"}
                    style={{ width: "100%", height: "auto", display: "block" }}
                  />
                </div>
              </div>
              <div className="text-container__right">
                <div className="text-container__right__box">
                  <img src={Box1} alt="car-img" />
                  <div className="text-container__right__box__text">
                    <h4>{t("box1_title")}</h4>
                    <p>{t("box1_desc")}</p>
                  </div>
                </div>
                <div className="text-container__right__box">
                  <img src={Box2} alt="coin-img" />
                  <div className="text-container__right__box__text">
                    <h4>{t("box2_title")}</h4>
                    <p>{t("box2_desc")}</p>
                  </div>
                </div>
                <div className="text-container__right__box">
                  <img src={Box3} alt="coin-img" />
                  <div className="text-container__right__box__text">
                    <h4>{t("box3_title")}</h4>
                    <p>{t("box3_desc")}</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {showCatalogueModal && (
        <div
          onClick={() => setShowCatalogueModal(false)}
          style={{
            position: "fixed",
            inset: 0,
            zIndex: 99999,
            backgroundColor: "rgba(15, 23, 42, 0.85)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: "2rem",
          }}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            style={{
              position: "relative",
              background: "#fff",
              borderRadius: "14px",
              maxWidth: "620px",
              width: "100%",
              maxHeight: "92vh",
              overflowY: "auto",
              padding: "1.6rem",
              boxShadow: "0 24px 60px rgba(0, 0, 0, 0.45)",
            }}
          >
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1.2rem", gap: "1rem" }}>
              <h3 style={{ margin: 0, fontSize: "1.8rem", color: "#0f172a" }}>
                {isFr ? "Catalogue Officiel 3M SERVICES" : "Official 3M SERVICES Catalogue"}
              </h3>
              <button
                type="button"
                onClick={() => setShowCatalogueModal(false)}
                aria-label={isFr ? "Fermer" : "Close"}
                style={{
                  border: "none",
                  background: "#f1f5f9",
                  color: "#0f172a",
                  width: "36px",
                  height: "36px",
                  borderRadius: "50%",
                  fontSize: "2rem",
                  lineHeight: 1,
                  cursor: "pointer",
                }}
              >
                &times;
              </button>
            </div>
            <img
              src={catalogueImgUrl}
              alt={isFr ? "Catalogue Officiel 3M SERVICES — Location Automobile" : "3M SERVICES Official Car Rental Catalogue"}
              style={{ width: "100%", height: "auto", borderRadius: "10px", display: "block" }}
            />
            <div style={{ display: "flex", flexWrap: "wrap", gap: "1rem", justifyContent: "center", marginTop: "1.4rem" }}>
              <a
                href={cataloguePdfUrl}
                download="Catalogue_3M_SERVICES.pdf"
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: "0.7rem",
                  background: "#E20713",
                  color: "#fff",
                  padding: "1.1rem 2rem",
                  borderRadius: "8px",
                  fontSize: "1.45rem",
                  fontWeight: 700,
                  textDecoration: "none",
                }}
              >
                <i className="fa-solid fa-file-pdf"></i>
                {isFr ? "Télécharger en PDF" : "Download PDF"}
              </a>
              <a
                href={catalogueImgUrl}
                download="Catalogue_3M_SERVICES.jpg"
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: "0.7rem",
                  background: "#0f172a",
                  color: "#fff",
                  padding: "1.1rem 2rem",
                  borderRadius: "8px",
                  fontSize: "1.45rem",
                  fontWeight: 700,
                  textDecoration: "none",
                }}
              >
                <i className="fa-solid fa-image"></i>
                {isFr ? "Télécharger l'Image" : "Download Image"}
              </a>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

export default ChooseUs;
