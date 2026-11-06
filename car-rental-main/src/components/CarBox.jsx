import { useState } from "react";
import { useTranslation } from "../context/LanguageContext";

function CarBox({ data, carID }) {
  const [carLoad, setCarLoad] = useState(false);
  const { t } = useTranslation();

  return (
    <>
      {data[carID].map((car, id) => (
        <div key={id} className="box-cars">
          {/* car */}
          <div className="pick-car">
            {carLoad && <span className="loader"></span>}
            <img
              style={{ display: carLoad ? "none" : "block" }}
              src={car.img}
              alt={car.name}
              onLoad={() => setCarLoad(false)}
            />
          </div>
          {/* description */}
          <div className="pick-description">
            <div className="pick-description__price">
              <span>{car.price} FCFA</span> {t("price_unit")}
            </div>
            <div className="pick-description__table">
              <div className="pick-description__table__col">
                <span>{t("spec_model")}</span>
                <span>{car.model}</span>
              </div>

              <div className="pick-description__table__col">
                <span>{t("spec_brand")}</span>
                <span>{car.mark}</span>
              </div>

              <div className="pick-description__table__col">
                <span>{t("spec_year")}</span>
                <span>{car.year}</span>
              </div>

              <div className="pick-description__table__col">
                <span>{t("spec_doors")}</span>
                <span>{car.doors}</span>
              </div>

              <div className="pick-description__table__col">
                <span>{t("spec_ac")}</span>
                <span>{car.air}</span>
              </div>

              <div className="pick-description__table__col">
                <span>{t("spec_trans")}</span>
                <span>{car.transmission}</span>
              </div>

              <div className="pick-description__table__col">
                <span>{t("spec_fuel")}</span>
                <span>{car.fuel}</span>
              </div>
            </div>
            {/* CTA Reserve button */}
            <a
              className="cta-btn"
              href="#booking-section"
              onClick={() => {
                window.dispatchEvent(
                  new CustomEvent("select-booking-car", {
                    detail: { carName: car.name },
                  })
                );
              }}
            >
              {t("reserve_now") || "RESERVE NOW"}
            </a>
          </div>
        </div>
      ))}
    </>
  );
}

export default CarBox;
