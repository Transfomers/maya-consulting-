import { Link } from "react-router-dom";
import { useTranslation } from "../context/LanguageContext";

function HeroPages({ name }) {
  const { lang } = useTranslation();

  return (
    <>
      <section className="hero-pages">
        <div className="hero-pages__overlay"></div>
        <div className="container">
          <div className="hero-pages__text">
            <h3>{name}</h3>
            <p>
              <Link to="/">{lang === "fr" ? "Accueil" : "Home"}</Link> &nbsp;&gt;&nbsp; {name}
            </p>
          </div>
        </div>
      </section>
    </>
  );
}

export default HeroPages;
