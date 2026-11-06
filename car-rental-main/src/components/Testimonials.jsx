import { useTranslation } from "../context/LanguageContext";

function Testimonials() {
  const { t } = useTranslation();

  return (
    <>
      <section className="testimonials-section">
        <div className="container">
          <div className="testimonials-content">
            <div className="testimonials-content__title">
              <h4>{t("testi_sub")}</h4>
              <h2>{t("testi_title")}</h2>
              <p>{t("testi_desc")}</p>
            </div>

            <div className="all-testimonials">
              <div className="all-testimonials__box">
                <span className="quotes-icon">
                  <i className="fa-solid fa-quote-right"></i>
                </span>
                <div style={{ color: "#E20713", fontSize: "1.6rem", marginBottom: "1.2rem", display: "flex", gap: "3px" }}>
                  <i className="fa-solid fa-star"></i>
                  <i className="fa-solid fa-star"></i>
                  <i className="fa-solid fa-star"></i>
                  <i className="fa-solid fa-star"></i>
                  <i className="fa-solid fa-star"></i>
                </div>
                <p>{t("testi_1_quote")}</p>
                <div className="all-testimonials__box__name">
                  <div className="all-testimonials__box__name__profile">
                    <span>
                      <h4>{t("testi_1_name")}</h4>
                      <p>{t("testi_1_role")}</p>
                    </span>
                  </div>
                </div>
              </div>

              <div className="all-testimonials__box box-2">
                <span className="quotes-icon">
                  <i className="fa-solid fa-quote-right"></i>
                </span>
                <div style={{ color: "#E20713", fontSize: "1.6rem", marginBottom: "1.2rem", display: "flex", gap: "3px" }}>
                  <i className="fa-solid fa-star"></i>
                  <i className="fa-solid fa-star"></i>
                  <i className="fa-solid fa-star"></i>
                  <i className="fa-solid fa-star"></i>
                  <i className="fa-solid fa-star"></i>
                </div>
                <p>{t("testi_2_quote")}</p>
                <div className="all-testimonials__box__name">
                  <div className="all-testimonials__box__name__profile">
                    <span>
                      <h4>{t("testi_2_name")}</h4>
                      <p>{t("testi_2_role")}</p>
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}

export default Testimonials;
