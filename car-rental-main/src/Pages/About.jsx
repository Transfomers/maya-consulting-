import Footer from "../components/Footer";
import ShowcaseHeroHeader from "../components/ShowcaseHeroHeader";
import PlanTrip from "../components/PlanTrip";
import { useTranslation } from "../context/LanguageContext";
import AboutMain from "../images/about/about-main.jpg";

// Partner Logos (High Quality)
import mupocamLogo from "../images/partners/mupocam-logo.png";
import isdbiLogo from "../images/partners/isdbi.png";
import ktsLogo from "../images/partners/kts.png";
import circbLogo from "../images/partners/circb.png";
import consultingLogo from "../images/partners/3m-consulting.png";

function About() {
  const { lang } = useTranslation();
  const isFr = lang === "fr";

  const partnerLogos = [
    {
      name: "MUPOCAM",
      logo: mupocamLogo,
      url: "https://wa.me/237691786447?text=Partenariat%203M%20SERVICES%20et%20MUPOCAM%20Orange%20Cameroun",
      title: "MUPOCAM - Mutuelle du Personnel Orange Cameroun (Partenaire Officiel)",
    },
    {
      name: "ISDBI",
      logo: isdbiLogo,
      url: "https://isdbinstitute.org/",
      title: "ISDBI - Islamic Development Bank Institute",
    },
    {
      name: "KTS",
      logo: ktsLogo,
      url: "https://wa.me/237691786447?text=Partenariat%203M%20SERVICES%20et%20KTS",
      title: "KTS - Kemo Trips & Services Sarl",
    },
    {
      name: "CIRCB",
      logo: circbLogo,
      url: "http://www.circb.cm/",
      title: "CIRCB - Centre International de Référence Chantal Biya",
    },
    {
      name: "3M Consulting",
      logo: consultingLogo,
      url: "https://www.3mservice.shop/",
      title: "3M Consulting - We Take The Next Step Together",
    },
  ];

  return (
    <>
      <section className="about-page">
        {/* Showcase Hero Header matching reference design */}
        <ShowcaseHeroHeader type="about" />
        <div className="container" id="about-content-section">
          {/* Main About Presentation */}
          <div className="about-main">
            <img
              className="about-main__img"
              src={AboutMain}
              alt="3M Services Yaoundé"
            />
            <div className="about-main__text">
              <h3>{isFr ? "Notre Entreprise" : "Our Company"}</h3>
              <h2>
                {isFr
                  ? "L'Excellence Automobile et Immobilière à partir de Yaoundé"
                  : "Automotive and Real Estate Excellence from Yaoundé"}
              </h2>
              <p>
                {isFr
                  ? "3M SERVICES est l'adresse de référence à partir de Yaoundé pour la vente de véhicules neufs (0 km) et d'occasions certifiées, la location de Toyota Prado VIP avec chauffeur professionnel, les formules de leasing automobile (partenaire officiel MUPOCAM Orange Cameroun) et la gestion d'appartements meublés de grand standing à Tsinga (en face de la FECAFOOT). Notre conciergerie 24/7 s'engage à vous offrir un service haut de gamme, rapide et en toute transparence."
                  : "3M SERVICES is the premier destination from Yaoundé for brand new (0 km) and certified pre-owned vehicles, luxury Toyota Prado VIP rentals with professional chauffeurs, corporate leasing (official MUPOCAM Orange Cameroon partner), and luxury furnished apartments in Tsinga (opposite FECAFOOT). Our 24/7 concierge delivers high-end, prompt, and completely transparent service."}
              </p>

              {/* 3 Key Stats: Red Icons, Red Numbers, Perfectly Aligned */}
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "repeat(3, 1fr)",
                  gap: "2.5rem",
                  marginTop: "3rem",
                  marginBottom: "1rem",
                }}
              >
                {/* 45+ Vehicles */}
                <div
                  style={{
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "flex-start",
                  }}
                >
                  <div
                    style={{
                      width: "52px",
                      height: "52px",
                      borderRadius: "12px",
                      backgroundColor: "#fee2e2",
                      color: "#E20713",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      fontSize: "2.4rem",
                      marginBottom: "1.2rem",
                    }}
                  >
                    <i className="fa-solid fa-car-side"></i>
                  </div>
                  <span
                    style={{
                      fontSize: "4.2rem",
                      fontWeight: 800,
                      color: "#E20713",
                      lineHeight: 1,
                      marginBottom: "0.6rem",
                    }}
                  >
                    45+
                  </span>
                  <p
                    style={{
                      fontSize: "1.45rem",
                      color: "#334155",
                      margin: 0,
                      fontWeight: 600,
                      lineHeight: 1.35,
                    }}
                  >
                    {isFr ? "Véhicules Disponibles" : "Available Vehicles"}
                  </p>
                </div>

                {/* 3 Locations */}
                <div
                  style={{
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "flex-start",
                  }}
                >
                  <div
                    style={{
                      width: "52px",
                      height: "52px",
                      borderRadius: "12px",
                      backgroundColor: "#fee2e2",
                      color: "#E20713",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      fontSize: "2.4rem",
                      marginBottom: "1.2rem",
                    }}
                  >
                    <i className="fa-solid fa-location-dot"></i>
                  </div>
                  <span
                    style={{
                      fontSize: "4.2rem",
                      fontWeight: 800,
                      color: "#E20713",
                      lineHeight: 1,
                      marginBottom: "0.6rem",
                    }}
                  >
                    3
                  </span>
                  <p
                    style={{
                      fontSize: "1.45rem",
                      color: "#334155",
                      margin: 0,
                      fontWeight: 600,
                      lineHeight: 1.35,
                    }}
                  >
                    {isFr ? "Agences à partir de Yaoundé" : "Locations from Yaoundé"}
                  </p>
                </div>

                {/* 24/7 Support */}
                <div
                  style={{
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "flex-start",
                  }}
                >
                  <div
                    style={{
                      width: "52px",
                      height: "52px",
                      borderRadius: "12px",
                      backgroundColor: "#fee2e2",
                      color: "#E20713",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      fontSize: "2.4rem",
                      marginBottom: "1.2rem",
                    }}
                  >
                    <i className="fa-solid fa-headset"></i>
                  </div>
                  <span
                    style={{
                      fontSize: "4.2rem",
                      fontWeight: 800,
                      color: "#E20713",
                      lineHeight: 1,
                      marginBottom: "0.6rem",
                    }}
                  >
                    24/7
                  </span>
                  <p
                    style={{
                      fontSize: "1.45rem",
                      color: "#334155",
                      margin: 0,
                      fontWeight: 600,
                      lineHeight: 1.35,
                    }}
                  >
                    {isFr ? "Assistance Continue" : "Continuous Support"}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Partners Section: Just the logo pictures with white background (Before Plan your trip now) */}
          <div
            className="partners-section"
            style={{
              marginTop: "7rem",
              marginBottom: "5rem",
              padding: "4rem 2.5rem 4.5rem",
              backgroundColor: "#ffffff",
              borderRadius: "16px",
              border: "1px solid #eef2f6",
              boxShadow: "0 8px 30px rgba(0, 0, 0, 0.04)",
            }}
          >
            {/* Header */}
            <div style={{ textAlign: "center", maxWidth: "800px", margin: "0 auto 3.5rem" }}>
              <span
                style={{
                  color: "#E20713",
                  fontWeight: 700,
                  fontSize: "1.35rem",
                  textTransform: "uppercase",
                  letterSpacing: "1.5px",
                  display: "inline-block",
                  marginBottom: "0.8rem",
                }}
              >
                {isFr ? "NOS PARTENAIRES" : "OUR PARTNERS"}
              </span>
              <h2
                style={{
                  fontSize: "3rem",
                  fontWeight: 800,
                  color: "#0f172a",
                  margin: 0,
                  letterSpacing: "-0.5px",
                }}
              >
                {isFr ? "Partenaires Institutionnels & Corporate" : "Corporate & Institutional Partners"}
              </h2>
            </div>

            {/* Just the Picture and White Background (Clickable Logos Lineup) */}
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))",
                gap: "2.5rem",
                alignItems: "center",
                justifyContent: "center",
                backgroundColor: "#ffffff",
                padding: "2rem 1.5rem",
                borderRadius: "12px",
              }}
            >
              {partnerLogos.map((partner, index) => (
                <a
                  key={index}
                  href={partner.url}
                  target="_blank"
                  rel="noreferrer"
                  title={partner.title}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    backgroundColor: "#ffffff",
                    border: "1px solid #f1f5f9",
                    borderRadius: "12px",
                    padding: "2rem 1.5rem",
                    height: "110px",
                    textDecoration: "none",
                    boxShadow: "0 2px 8px rgba(0, 0, 0, 0.03)",
                    transition: "transform 0.25s ease, box-shadow 0.25s ease, border-color 0.25s ease",
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.transform = "translateY(-4px) scale(1.03)";
                    e.currentTarget.style.boxShadow = "0 10px 22px rgba(0, 0, 0, 0.08)";
                    e.currentTarget.style.borderColor = "#E20713";
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.transform = "translateY(0) scale(1)";
                    e.currentTarget.style.boxShadow = "0 2px 8px rgba(0, 0, 0, 0.03)";
                    e.currentTarget.style.borderColor = "#f1f5f9";
                  }}
                >
                  <img
                    src={partner.logo}
                    alt={partner.name}
                    style={{
                      maxHeight: "75px",
                      maxWidth: "160px",
                      width: "auto",
                      height: "auto",
                      objectFit: "contain",
                    }}
                  />
                </a>
              ))}
            </div>
          </div>

          {/* Plan Your Trip Now */}
          <PlanTrip />
        </div>
      </section>

      {/* Book Banner */}
      <div className="book-banner">
        <div className="book-banner__overlay"></div>
        <div className="container">
          <div className="text-content">
            <h2>
              {isFr
                ? "Réservez votre véhicule en contactant notre conciergerie 24/7"
                : "Book your vehicle by contacting our 24/7 concierge"}
            </h2>
            <span>
              <i className="fa-solid fa-phone"></i>
              <h3>+237 691 78 64 47</h3>
            </span>
          </div>
        </div>
      </div>
      <Footer />
    </>
  );
}

export default About;
