import React, { useState } from "react";
import { Link } from "react-router-dom";
import { useTranslation } from "../context/LanguageContext";

function Footer() {
  const [emailInput, setEmailInput] = useState("");
  const { t, lang } = useTranslation();

  const handleNewsletter = async (e) => {
    e.preventDefault();
    try {
      await fetch("http://localhost:5001/api/newsletter", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: emailInput })
      });
    } catch (err) {
      console.warn("Backend newsletter:", err);
    }
    alert(lang === "fr" ? "Merci pour votre inscription à la newsletter 3M SERVICES !" : "Thank you for subscribing to 3M SERVICES newsletter!");
    setEmailInput("");
  };

  return (
    <>
      <footer>
        <div className="container">
          <div className="footer-content">
            {/* Column 1: 3M SERVICES & Contacts */}
            <ul className="footer-content__1">
              <li>
                <span>3M</span> SERVICES
              </li>
              <li>
                {t("footer_desc")}
              </li>
              <li>
                {/* 5 Requested Contact & Social Channels as Prominent Icons */}
                <div className="footer-channels-strip">
                  {/* WhatsApp */}
                  <a
                    href="https://wa.me/237691786447"
                    target="_blank"
                    rel="noreferrer"
                    className="footer-channel-btn footer-channel-btn--whatsapp"
                    style={{ borderRadius: "50%" }}
                    title="WhatsApp 3M SERVICES (+237 691 78 64 47)"
                    aria-label="WhatsApp +237 691 78 64 47"
                  >
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M.057 24l1.687-6.163c-1.041-1.804-1.588-3.849-1.587-5.946.003-6.556 5.338-11.891 11.893-11.891 3.181.001 6.167 1.24 8.413 3.488 2.245 2.248 3.481 5.236 3.48 8.414-.003 6.557-5.338 11.892-11.893 11.892-1.99-.001-3.951-.5-5.688-1.448l-6.305 1.654zm6.597-3.807c1.676.995 3.276 1.591 5.392 1.592 5.448 0 9.886-4.434 9.889-9.885.002-5.462-4.415-9.89-9.881-9.892-5.452 0-9.887 4.434-9.889 9.884-.001 2.225.651 3.891 1.746 5.634l-.999 3.648 3.742-.981zm11.387-5.464c-.074-.124-.272-.198-.57-.347-.297-.149-1.758-.868-2.031-.967-.272-.099-.47-.149-.669.149-.198.297-.768.967-.941 1.165-.173.198-.347.223-.644.074-.297-.149-1.255-.462-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.297-.347.446-.521.151-.172.2-.296.3-.495.099-.198.05-.372-.025-.521-.075-.148-.669-1.611-.916-2.206-.242-.579-.487-.501-.669-.51l-.57-.01c-.198 0-.52.074-.792.372s-1.04 1.016-1.04 2.479 1.065 2.876 1.213 3.074c.149.198 2.095 3.2 5.076 4.487.709.306 1.263.489 1.694.626.712.226 1.36.194 1.872.118.571-.085 1.758-.719 2.006-1.413.248-.695.248-1.29.173-1.414z"/>
                    </svg>
                  </a>

                  {/* Call 1 (+237 691 78 64 47) */}
                  <a
                    href="tel:+237691786447"
                    className="footer-channel-btn footer-channel-btn--call"
                    style={{ borderRadius: "50%" }}
                    title="Appeler +237 691 78 64 47"
                    aria-label="Appeler +237 691 78 64 47"
                  >
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M20.01 15.38c-1.23 0-2.42-.2-3.53-.56a.977.977 0 0 0-1.01.24l-2.2 2.2a15.05 15.05 0 0 1-6.59-6.59l2.2-2.21a.96.96 0 0 0 .25-1.01A11.36 11.36 0 0 1 8.57 3.9c0-.55-.45-1-1-1H4c-.55 0-1 .45-1 1 0 9.39 7.61 17 17 17 .55 0 1-.45 1-1v-3.52c0-.55-.45-1-.99-1z"/>
                    </svg>
                  </a>

                  {/* Call 2 (+237 653 76 17 28) */}
                  <a
                    href="tel:+237653761728"
                    className="footer-channel-btn footer-channel-btn--call2"
                    style={{ borderRadius: "50%" }}
                    title="Appeler +237 653 76 17 28"
                    aria-label="Appeler +237 653 76 17 28"
                  >
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M17 1.01L7 1c-1.1 0-2 .9-2 2v18c0 1.1.9 2 2 2h10c1.1 0 2-.9 2-2V3c0-1.1-.9-1.99-2-1.99zM17 19H7V5h10v14z"/>
                    </svg>
                  </a>

                  {/* Facebook */}
                  <a
                    href="https://www.facebook.com/share/1DtC9My4Be/?mibextid=wwXIfr"
                    target="_blank"
                    rel="noreferrer"
                    className="footer-channel-btn footer-channel-btn--facebook"
                    style={{ borderRadius: "50%" }}
                    title="Page Facebook 3M SERVICES"
                    aria-label="Facebook 3M SERVICES"
                  >
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
                    </svg>
                  </a>

                  {/* TikTok */}
                  <a
                    href="https://vt.tiktok.com/ZSgXqMoHw/"
                    target="_blank"
                    rel="noreferrer"
                    className="footer-channel-btn footer-channel-btn--tiktok"
                    style={{ borderRadius: "50%" }}
                    title="TikTok 3M SERVICES"
                    aria-label="TikTok 3M SERVICES"
                  >
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M12.525.02c1.31-.02 2.61-.01 3.91-.02.08 1.53.63 3.09 1.75 4.17 1.12 1.11 2.7 1.62 4.24 1.79v4.03c-1.44-.05-2.89-.35-4.2-.97-.57-.26-1.1-.59-1.62-.93-.01 2.92.01 5.84-.02 8.75-.08 1.4-.54 2.79-1.35 3.94-1.31 1.92-3.58 3.17-5.91 3.21-1.43.08-2.86-.31-4.08-1.03-2.02-1.19-3.44-3.37-3.65-5.71-.02-.5-.03-1-.01-1.49.18-1.9 1.12-3.72 2.58-4.96 1.66-1.44 3.98-2.13 6.15-1.72.02 1.48-.04 2.96-.04 4.44-.99-.32-2.15-.23-3.02.37-.63.41-1.11 1.04-1.36 1.75-.21.51-.24 1.07-.14 1.61.24 1.64 1.82 3.02 3.5 2.87 1.12-.01 2.19-.66 2.77-1.61.19-.33.4-.67.41-1.06.1-1.79.06-3.57.07-5.36.01-4.03-.01-8.05.02-12.07z"/>
                    </svg>
                  </a>

                  {/* Email */}
                  <a
                    href="mailto:contact@3mservice.shop"
                    className="footer-channel-btn footer-channel-btn--email"
                    style={{ borderRadius: "50%" }}
                    title="Email: contact@3mservice.shop"
                    aria-label="Email contact@3mservice.shop"
                  >
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M20 4H4c-1.1 0-1.99.9-1.99 2L2 18c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zm0 4l-8 5-8-5V6l8 5 8-5v2z"/>
                    </svg>
                  </a>
                </div>
              </li>
            </ul>

            {/* Column 2: Navigation (Hidden on phone version) */}
            <ul className="footer-content__2 footer-nav-col">
              <li>{t("footer_nav")}</li>
              <li>
                <Link to="/" onClick={() => window.scrollTo(0, 0)}>{t("footer_home")}</Link>
              </li>
              <li>
                <Link to="/about" onClick={() => window.scrollTo(0, 0)}>{t("footer_about")}</Link>
              </li>
              <li>
                <Link to="/models" onClick={() => window.scrollTo(0, 0)}>{t("footer_fleet")}</Link>
              </li>
              <li>
                <Link to="/apartments" onClick={() => window.scrollTo(0, 0)}>{t("nav_apartments")}</Link>
              </li>
            </ul>

            {/* Column 3: Newsletter */}
            <ul className="footer-content__2">
              <li>{t("footer_newsletter")}</li>
              <li>
                <p>
                  {t("footer_newsletter_sub")}
                </p>
              </li>
              <li>
                <form onSubmit={handleNewsletter} style={{ display: "flex", flexDirection: "column", gap: "10px", marginTop: "1rem" }}>
                  <input
                    type="email"
                    required
                    value={emailInput}
                    onChange={(e) => setEmailInput(e.target.value)}
                    placeholder={t("footer_email_placeholder")}
                    style={{
                      padding: "12px 14px",
                      borderRadius: "4px",
                      border: "1px solid #ddd",
                      fontSize: "14px",
                      width: "100%",
                      boxSizing: "border-box",
                      backgroundColor: "#f9fafb"
                    }}
                  />
                  <button
                    type="submit"
                    className="submit-email"
                    style={{
                      backgroundColor: "#E20713",
                      color: "#fff",
                      border: "none",
                      padding: "12px 20px",
                      borderRadius: "4px",
                      fontWeight: "bold",
                      fontSize: "15px",
                      cursor: "pointer",
                      transition: "background-color 0.2s ease"
                    }}
                  >
                    {t("footer_subscribe")}
                  </button>
                </form>
              </li>
            </ul>
          </div>
        </div>
      </footer>
    </>
  );
}

export default Footer;
