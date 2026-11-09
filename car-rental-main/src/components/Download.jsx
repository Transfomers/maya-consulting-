import { useTranslation } from "../context/LanguageContext";

function Download() {
  const { t } = useTranslation();

  const triggerInstall = () => {
    window.dispatchEvent(new Event("open-pwa-install"));
  };

  return (
    <>
      <section className="download-section">
        <div className="container">
          <div className="download-grid download-grid--centered">
            <div className="download-text download-text--centered">
              <span className="download-text__badge download-text__badge--nobg">
                {t("download_badge") || "APPLICATION MOBILE & PWA OFFICIELLE"}
              </span>
              <h2>{t("download_title")}</h2>
              <p>{t("download_desc")}</p>

              <div className="download-text__action">
                <button
                  type="button"
                  className="download-text__action__install-btn"
                  onClick={triggerInstall}
                  title="Ajouter l'application 3M SERVICES sur votre smartphone"
                >
                  <span className="btn-icon">📲</span>
                  <div className="btn-label">
                    <strong>{t("download_pwa_btn") || "Ajouter à l'écran d'accueil"}</strong>
                    <span>{t("download_pwa_sub") || "Installer l'application PWA gratuite"}</span>
                  </div>
                </button>
              </div>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}

export default Download;
