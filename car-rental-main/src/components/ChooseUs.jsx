import MainImg from "../images/chooseUs/main.png";
import Box1 from "../images/chooseUs/icon1.png";
import Box2 from "../images/chooseUs/icon2.png";
import Box3 from "../images/chooseUs/icon3.png";
import { useTranslation } from "../context/LanguageContext";

function ChooseUs() {
  const { t } = useTranslation();

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
                <a
                  href={`${process.env.PUBLIC_URL || ""}/Asset/catalogue.pdf`}
                  download="Catalogue_3M_SERVICES_2025.pdf"
                  target="_blank"
                  rel="noopener noreferrer"
                  title="Télécharger le catalogue officiel 3M SERVICES (PDF)"
                >
                  {t("choose_more")} &nbsp;
                  <i className="fa-solid fa-file-arrow-down"></i>
                </a>
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
    </>
  );
}

export default ChooseUs;
