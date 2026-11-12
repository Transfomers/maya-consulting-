import SelectCar from "../images/plan/icon1.png";
import Contact from "../images/plan/icon2.png";
import Drive from "../images/plan/icon3.png";
import { useTranslation } from "../context/LanguageContext";

function PlanTrip({ hideTitle = false }) {
  const { t } = useTranslation();

  return (
    <>
      <section className="plan-section">
        <div className="container">
          <div className="plan-container">
            {!hideTitle && (
              <div className="plan-container__title">
                <h3>{t("plan_sub")}</h3>
                <h2>{t("plan_title")}</h2>
              </div>
            )}

            <div className="plan-container__boxes">
              <div className="plan-container__boxes__box">
                <img src={SelectCar} alt="icon_img" />
                <h3>{t("step1_title")}</h3>
                <p>{t("step1_desc")}</p>
              </div>

              <div className="plan-container__boxes__box">
                <img src={Contact} alt="icon_img" />
                <h3>{t("step2_title")}</h3>
                <p>{t("step2_desc")}</p>
              </div>

              <div className="plan-container__boxes__box">
                <img src={Drive} alt="icon_img" />
                <h3>{t("step3_title")}</h3>
                <p>{t("step3_desc")}</p>
              </div>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}

export default PlanTrip;
