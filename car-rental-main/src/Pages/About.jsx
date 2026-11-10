import Footer from "../components/Footer";
import ShowcaseHeroHeader from "../components/ShowcaseHeroHeader";
import PlanTrip from "../components/PlanTrip";
import { useTranslation } from "../context/LanguageContext";
import AboutMain from "../images/about/about-main.jpg";
import partenariatMupocamImg from "../images/about/partenariat-mupocam.jpg";

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
                  marginTop: "2.8rem",
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

          {/* Dedicated Section: Official Bilateral Partnership Signing with MUPOCAM */}
          <div
            id="mupocam-section"
            style={{
              marginTop: "5.5rem",
              padding: "4rem 3.5rem",
              backgroundColor: "#f8fafc",
              borderRadius: "20px",
              border: "1px solid #e2e8f0",
              boxShadow: "0 10px 30px rgba(0, 0, 0, 0.04)",
              scrollMarginTop: "90px",
            }}
          >
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "1.15fr 0.85fr",
                gap: "4rem",
                alignItems: "center",
              }}
              className="about-mupocam-grid"
            >
              <div>
                <span
                  style={{
                    color: "#ea580c",
                    fontWeight: 700,
                    fontSize: "1.3rem",
                    textTransform: "uppercase",
                    letterSpacing: "1.2px",
                    display: "inline-block",
                    marginBottom: "0.8rem",
                  }}
                >
                  {isFr ? "ALLIANCE STRATÉGIQUE & MOBILITÉ D'ENTREPRISE" : "STRATEGIC ALLIANCE & CORPORATE MOBILITY"}
                </span>
                <h3
                  style={{
                    fontSize: "2.8rem",
                    fontWeight: 800,
                    color: "#0f172a",
                    lineHeight: "1.3",
                    margin: "0 0 1.5rem",
                  }}
                >
                  {isFr
                    ? "Convention Cadre Officielle : 3M SERVICES & MUPOCAM (Orange Cameroun)"
                    : "Official Framework Agreement: 3M SERVICES & MUPOCAM (Orange Cameroon)"}
                </h3>
                <p
                  style={{
                    fontSize: "1.5rem",
                    color: "#475569",
                    lineHeight: "1.7",
                    marginBottom: "1.6rem",
                  }}
                >
                  {isFr
                    ? "Fruit d'une vision partagée d'excellence, de solidarité et de confort pour les collaborateurs, la convention officielle conclue entre 3M SERVICES, la Mutuelle du Personnel d'Orange Cameroun (MUPOCAM) et le FOCODEMUC (Fonds Commun de Développement des Mutuelles du Cameroun) consacre un partenariat d'envergure nationale."
                    : "Embodying a shared vision of excellence, solidarity, and executive comfort, the partnership between 3M SERVICES, MUPOCAM, and FOCODEMUC establishes a premier automotive leasing and mobility framework across Cameroon."}
                </p>
                <ul
                  style={{
                    listStyle: "none",
                    padding: 0,
                    margin: "0 0 2.2rem",
                    display: "flex",
                    flexDirection: "column",
                    gap: "1.1rem",
                  }}
                >
                  <li style={{ display: "flex", alignItems: "center", gap: "1.2rem", fontSize: "1.45rem", color: "#1e293b", fontWeight: 600 }}>
                    <i className="fa-solid fa-circle-check" style={{ color: "#ea580c", fontSize: "1.8rem" }}></i>
                    {isFr ? "Formules de leasing automobile avec facilités de paiement échelonnées" : "Corporate leasing programs with structured payment plans"}
                  </li>
                  <li style={{ display: "flex", alignItems: "center", gap: "1.2rem", fontSize: "1.45rem", color: "#1e293b", fontWeight: 600 }}>
                    <i className="fa-solid fa-circle-check" style={{ color: "#ea580c", fontSize: "1.8rem" }}></i>
                    {isFr ? "Flotte exclusive conventionnée : Jeep Grand Cherokee V6 Édition MUPOCAM & Prado VIP" : "Exclusive accredited fleet: Jeep Grand Cherokee V6 MUPOCAM Edition & Prado VIP"}
                  </li>
                  <li style={{ display: "flex", alignItems: "center", gap: "1.2rem", fontSize: "1.45rem", color: "#1e293b", fontWeight: 600 }}>
                    <i className="fa-solid fa-circle-check" style={{ color: "#ea580c", fontSize: "1.8rem" }}></i>
                    {isFr ? "Tarifs préférentiels sur nos résidences meublées haut standing à Tsinga (face FECAFOOT)" : "Preferential rates on luxury furnished apartments in Tsinga (opp. FECAFOOT)"}
                  </li>
                </ul>
                <a
                  href="https://wa.me/237691786447?text=Bonjour%203M%20SERVICES%2C%20je%20souhaite%20des%20informations%20sur%20les%20offres%20partenariat%20MUPOCAM"
                  target="_blank"
                  rel="noreferrer"
                  style={{
                    display: "inline-flex",
                    alignItems: "center",
                    gap: "0.9rem",
                    backgroundColor: "#ea580c",
                    color: "#ffffff",
                    fontWeight: 700,
                    fontSize: "1.4rem",
                    padding: "1.3rem 2.6rem",
                    borderRadius: "10px",
                    textDecoration: "none",
                    boxShadow: "0 6px 18px rgba(234, 88, 12, 0.28)",
                  }}
                >
                  <i className="fa-brands fa-whatsapp" style={{ fontSize: "1.9rem" }}></i>
                  {isFr ? "Contacter le Pôle Partenariats MUPOCAM" : "Contact MUPOCAM Partnerships Desk"}
                </a>
              </div>

              <div
                style={{
                  borderRadius: "16px",
                  overflow: "hidden",
                  boxShadow: "0 16px 36px rgba(0, 0, 0, 0.14)",
                  border: "5px solid #ffffff",
                }}
              >
                <img
                  src={partenariatMupocamImg}
                  alt="Séance de signature du partenariat officiel 3M SERVICES et MUPOCAM"
                  style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }}
                />
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
