import React from "react";
import PageHero from "@/components/PageHero";
import { useSettings } from "@/lib/SettingsContext";
import { useLang } from "@/lib/i18n";

const Privacy = () => {
  const settings = useSettings();
  const siteName = settings?.general?.site_name || "CAP Entrepreneurs";
  const { t, lang: language } = useLang();

  const title = t.privacy.title;
  const intro = t.privacy.intro.replace("{siteName}", siteName);

  return (
    <div className={`bg-bone text-forest min-h-screen ${language === 'ar' ? 'text-right' : 'text-left'}`} dir={language === 'ar' ? 'rtl' : 'ltr'}>
      <PageHero
        lines={[title]}
        intro={intro}
      />
      <div className="mx-auto max-w-4xl px-5 py-20 md:px-10">
        <div className="prose prose-forest mx-auto max-w-none">
          {t.privacy.sections.map((section, index) => (
            <React.Fragment key={index}>
              <h3>{section.title}</h3>
              <p>{section.content}</p>
            </React.Fragment>
          ))}
        </div>
      </div>
    </div>
  );
};

export default Privacy;
