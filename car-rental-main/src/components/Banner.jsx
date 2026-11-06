import { useTranslation } from "../context/LanguageContext";

function Banner() {
  const { t } = useTranslation();

  return (
    <>
      <section className="banner-section">
        <div className="container">
          <div className="banner-content">
            <div className="banner-content__text">
              <h2>{t("banner_title")}</h2>
              <p>
                {t("banner_desc")}
              </p>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}

export default Banner;
