import Footer from "../components/Footer";
import HeroPages from "../components/HeroPages";
import { useTranslation } from "../context/LanguageContext";
import HumanAvatar3D from "../components/HumanAvatar3D";
import "../styles/Team.css";

function Team() {
  const { lang } = useTranslation();

  const isFr = lang === "fr";

  // photo : vraie photo (ex. "/images/team/abena.jpg" dans public/) — sinon avatar 3D réglé par « look »
  // look  : skin, hair (short | fade | curly | bun | long | bald), hairColor, outfit, shirt, tie, glasses, beard
  const teamPpl = [
    {
      photo: null,
      name: "M. Monroi Maya Michael",
      look: { skin: "#7a4a2a", hair: "fade", hairColor: "#1b1210", outfit: "#111827", shirt: "#ffffff", tie: "#E20713", beard: true },
      role: isFr ? "PDG & Fondateur" : "CEO & Founder",
      dept: isFr ? "Direction Générale" : "Executive Leadership",
      badgeColor: "#E20713",
      contact: isFr
        ? "Direction Showroom Omnisports, Yaoundé"
        : "Omnisports Showroom Headquarters, Yaoundé",
    },
    {
      photo: null,
      name: "Martin Roger ABENA",
      look: { skin: "#8d5524", hair: "short", hairColor: "#1b1210", outfit: "#1e3a8a", shirt: "#e0e7ff" },
      role: isFr ? "Responsable Logistique" : "Logistics Manager",
      dept: isFr ? "Logistique" : "Logistics",
      badgeColor: "#1e3a8a",
    },
    {
      photo: null,
      name: "Augustine GUIDAMA",
      look: { skin: "#9a6237", hair: "bun", hairColor: "#2a1a14", outfit: "#0f766e", shirt: "#f0fdfa", female: true },
      role: isFr ? "Concierge des Meublés" : "Furnished Apartments Concierge",
      dept: isFr ? "Gestion des Meublés" : "Apartments Management",
      badgeColor: "#0f766e",
    },
    {
      photo: null,
      name: "Mme NKOUNOU ONANA Augustine Alice",
      look: { skin: "#7f4b2b", hair: "long", hairColor: "#1b1210", outfit: "#7c2d12", shirt: "#fff7ed", glasses: true, female: true },
      role: isFr ? "Secrétaire Particulière du PDG" : "Executive Assistant to the CEO",
      dept: isFr ? "Direction Générale" : "Executive Office",
      badgeColor: "#7c2d12",
    },
    {
      photo: null,
      name: "M. François N. PEMPEME",
      look: { skin: "#86502c", hair: "curly", hairColor: "#1b1210", outfit: "#c2410c", shirt: "#ffffff" },
      role: isFr ? "Responsable Marketing et Commercial" : "Marketing & Sales Manager",
      dept: isFr ? "Marketing & Ventes" : "Marketing & Sales",
      badgeColor: "#c2410c",
    },
    {
      photo: null,
      name: "M. MISSÉ Guy Roger",
      look: { skin: "#6e4024", hair: "short", hairColor: "#141010", outfit: "#27272a", shirt: "#f4f4f5", glasses: true, beard: true },
      role: isFr ? "Responsable BTP" : "Construction (BTP) Manager",
      dept: isFr ? "Pôle BTP" : "Construction",
      badgeColor: "#18181b",
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
            {teamPpl.map((ppl) => (
              <div
                key={ppl.name}
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
                  {ppl.photo ? (
                    <img
                      src={ppl.photo}
                      alt={ppl.name}
                      style={{ width: "100%", height: "28rem", objectFit: "cover", objectPosition: "center top" }}
                    />
                  ) : (
                    <div className="team-avatar" style={{ "--tone": ppl.badgeColor }}>
                      <HumanAvatar3D {...ppl.look} title={ppl.name} />
                    </div>
                  )}
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
                  {ppl.contact && (
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
                  )}
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
