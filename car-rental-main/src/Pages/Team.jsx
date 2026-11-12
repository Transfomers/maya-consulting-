import Footer from "../components/Footer";
import HeroPages from "../components/HeroPages";
import { useTranslation } from "../context/LanguageContext";
import MichelAvatar from "../images/team/avatar-michel-talla.svg";
import MarcAvatar from "../images/team/avatar-marc-ndongo.svg";
import BrigitteAvatar from "../images/team/avatar-brigitte-manga.svg";
import LaurentineAvatar from "../images/team/avatar-laurentine-bella.svg";
import MartinAvatar from "../images/team/avatar-martin-essomba.svg";
import CarineAvatar from "../images/team/avatar-carine-onana.svg";

function Team() {
  const { lang } = useTranslation();

  const isFr = lang === "fr";

  const teamPpl = [
    {
      img: MichelAvatar,
      name: "M. Monroi Maya Michael",
      role: isFr ? "PDG & Fondateur" : "CEO & Founder",
      dept: isFr ? "Direction Générale" : "Executive Leadership",
      badgeColor: "#E20713",
      contact: isFr
        ? "Direction Showroom Omnisports, Yaoundé"
        : "Omnisports Showroom Headquarters, Yaoundé",
    },
    {
      img: MarcAvatar,
      name: "Marc Ndongo",
      role: isFr
        ? "Responsable Flotte Automobile"
        : "Fleet Operations Manager",
      dept: isFr ? "Gestion de Parc & Ateliers" : "Fleet Management",
      badgeColor: "#1e3a8a",
      contact: isFr
        ? "Supervision 42 Véhicules & Ateliers"
        : "Supervision of 42 Vehicles & Garages",
    },
    {
      img: BrigitteAvatar,
      name: "Brigitte Manga",
      role: isFr
        ? "Responsable Conciergerie 24/7"
        : "Head of 24/7 Concierge",
      dept: isFr ? "Support Client & Réservations" : "Client Support & Bookings",
      badgeColor: "#991b1b",
      contact: "+237 691 78 64 47 (WhatsApp Direct)",
    },
    {
      img: LaurentineAvatar,
      name: "Laurentine Bella",
      role: isFr
        ? "Gestionnaire Résidences Meublées"
        : "Luxury Apartments Manager",
      dept: isFr ? "Immobilier & Standing Tsinga" : "Luxury Real Estate",
      badgeColor: "#0f766e",
      contact: isFr
        ? "Résidences Prestige Face FECAFOOT"
        : "Prestige Residences Opposite FECAFOOT",
    },
    {
      img: MartinAvatar,
      name: "Martin Essomba",
      role: isFr
        ? "Chef Chauffeur VIP & Sécurité"
        : "Chief VIP Chauffeur & Security",
      dept: isFr ? "Escorte & Sécurité" : "VIP Escort & Security",
      badgeColor: "#18181b",
      contact: isFr
        ? "Cortèges Diplomatiques & Déplacements"
        : "Diplomatic Convoys & Travel",
    },
    {
      img: CarineAvatar,
      name: "Carine Onana",
      role: isFr
        ? "Relations Partenariats & Leasing"
        : "Corporate Partnerships & Leasing",
      dept: isFr ? "Pôle Leasing & Partenariats" : "Corporate Leasing & Partnerships",
      badgeColor: "#c2410c",
      contact: isFr
        ? "Formules Leasing & Accords Entreprises"
        : "Corporate Leasing & Enterprise Agreements",
    },
  ];

  return (
    <>
      <section className="team-page">
        <HeroPages name={isFr ? "Notre Équipe" : "Our Team"} />

        <div className="container" style={{ padding: "4rem 2rem" }}>
          {/* Section Introduction */}
          <div style={{ textAlign: "center", maxWidth: "800px", margin: "0 auto 3rem" }}>
            <span
              style={{
                color: "#E20713",
                fontWeight: 700,
                fontSize: "1.4rem",
                textTransform: "uppercase",
                letterSpacing: "1px",
              }}
            >
              {isFr
                ? "3M SERVICES YAOUNDÉ • DIRECTION & EXPLOITATION"
                : "3M SERVICES YAOUNDÉ • LEADERSHIP TEAM"}
            </span>
            <h2 style={{ fontSize: "3.2rem", fontWeight: 800, color: "#111", margin: "1rem 0" }}>
              {isFr ? "Notre Équipe de Direction" : "Our Executive Leadership"}
            </h2>
            <p style={{ fontSize: "1.6rem", color: "#666", lineHeight: 1.6, margin: 0 }}>
              {isFr
                ? "Une équipe expérimentée et passionnée, dédiée à l'excellence de votre mobilité, au confort de vos résidences meublées et à la gestion personnalisée de votre flotte au Cameroun."
                : "An experienced and passionate team dedicated to executive mobility, luxury furnished residences, and personalized fleet management across Cameroon."}
            </p>
          </div>

          <div className="team-container">
            {teamPpl.map((ppl, id) => (
              <div
                key={id}
                className="team-container__box"
                style={{
                  borderRadius: "8px",
                  overflow: "hidden",
                  border: "1px solid #e2e8f0",
                  transition: "transform 0.2s ease, box-shadow 0.2s ease",
                }}
              >
                <div
                  className="team-container__box__img-div"
                  style={{
                    position: "relative",
                    backgroundColor: "#0f172a",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  <img
                    src={ppl.img}
                    alt={ppl.name}
                    style={{ width: "100%", height: "28rem", objectFit: "cover" }}
                  />
                  {/* Department Badge */}
                  <span
                    style={{
                      position: "absolute",
                      bottom: "1.2rem",
                      left: "1.2rem",
                      backgroundColor: ppl.badgeColor,
                      color: "#fff",
                      padding: "0.4rem 1rem",
                      borderRadius: "20px",
                      fontSize: "1.2rem",
                      fontWeight: 700,
                      textTransform: "uppercase",
                      letterSpacing: "0.5px",
                      boxShadow: "0 2px 6px rgba(0,0,0,0.3)",
                    }}
                  >
                    {ppl.dept}
                  </span>
                </div>
                <div className="team-container__box__descr" style={{ padding: "2.4rem 2rem" }}>
                  <h3
                    style={{
                      fontSize: "2.2rem",
                      fontWeight: 700,
                      color: "#0f172a",
                      marginBottom: "0.6rem",
                    }}
                  >
                    {ppl.name}
                  </h3>
                  <p
                    style={{
                      fontSize: "1.4rem",
                      fontWeight: 600,
                      color: "#E20713",
                      marginBottom: "1.2rem",
                      minHeight: "3.8rem",
                      lineHeight: 1.3,
                    }}
                  >
                    {ppl.role}
                  </p>
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "0.8rem",
                      fontSize: "1.3rem",
                      color: "#64748b",
                      borderTop: "1px solid #f1f5f9",
                      paddingTop: "1.2rem",
                    }}
                  >
                    <i className="fa-solid fa-location-dot" style={{ color: "#E20713" }}></i>
                    <span>{ppl.contact}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Contact Banner */}
        <div className="book-banner">
          <div className="book-banner__overlay"></div>
          <div className="container">
            <div className="text-content">
              <h2>
                {isFr
                  ? "Contactez notre conciergerie 24/7 pour toute demande"
                  : "Contact our 24/7 concierge for any inquiry"}
              </h2>
            </div>
          </div>
        </div>
        <Footer />
      </section>
    </>
  );
}

export default Team;
