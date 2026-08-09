import { Link } from "react-router-dom";
import { ArrowUpRight } from "lucide-react";
import { useLang } from "@/lib/i18n";

const Footer = () => {
  const { t } = useLang();
  return (
  <footer className="bg-forest text-bone" data-testid="site-footer">
    <div className="mx-auto max-w-[1600px] px-5 pb-10 pt-20 md:px-10 md:pt-28">
      <div className="grid gap-12 border-b border-bone/15 pb-16 md:grid-cols-12">
        <div className="md:col-span-5">
          <img src="/assets/logo-mark-light.png" alt="CAP Entrepreneurs" className="mb-8 h-12 w-auto" data-testid="footer-logo" />
          <p className="font-serif text-2xl italic leading-snug text-bone/90 md:text-3xl">
            {t.footer.quote}
          </p>
          <Link
            to="/donate"
            data-testid="footer-donate-link"
            className="mt-8 inline-flex items-center gap-2 bg-maple px-7 py-3.5 font-heading text-sm font-bold uppercase tracking-[0.15em] text-bone transition-colors hover:bg-bone hover:text-forest"
          >
            {t.footer.support} <ArrowUpRight className="h-4 w-4" />
          </Link>
        </div>
        <div className="md:col-span-3 md:col-start-7">
          <h4 className="mb-5 text-xs font-bold uppercase tracking-[0.25em] text-bone/60">{t.footer.explore}</h4>
          <ul className="space-y-2.5 text-sm">
            {[
              [t.nav.about, "/about"],
              [t.nav.programs, "/programs"],
              [t.nav.stories, "/impact-stories"],
              [t.nav.news, "/news-events"],
            ].map(([label, to]) => (
              <li key={to}>
                <Link to={to} data-testid={`footer-link-${label.toLowerCase().replace(/[^a-z]+/g, "-")}`} className="text-bone/85 transition-colors hover:text-vivid">
                  {label}
                </Link>
              </li>
            ))}
          </ul>
        </div>
        <div className="md:col-span-3">
          <h4 className="mb-5 text-xs font-bold uppercase tracking-[0.25em] text-bone/60">{t.footer.involved}</h4>
          <ul className="space-y-2.5 text-sm">
            {[
              [t.nav.membership, "/membership"],
              [t.nav.partners, "/partners"],
              [t.nav.donate, "/donate"],
              [t.nav.contact, "/contact"],
            ].map(([label, to]) => (
              <li key={to}>
                <Link to={to} data-testid={`footer-link-${label.toLowerCase().replace(/[^a-z]+/g, "-")}`} className="text-bone/85 transition-colors hover:text-vivid">
                  {label}
                </Link>
              </li>
            ))}
          </ul>
        </div>
      </div>

      <div className="select-none overflow-hidden pt-14" aria-hidden="true">
        <div className="text-outline-bone whitespace-nowrap text-center font-heading text-[13vw] font-black leading-[0.85] tracking-tighter">
          CAP ENTREPRENEURS
        </div>
      </div>

      <div className="mt-10 flex flex-col items-start justify-between gap-4 border-t border-bone/15 pt-6 text-xs text-bone/50 md:flex-row md:items-center">
        <div className="flex flex-col gap-1">
          <span>{t.footer.bottom1}</span>
          <span>&copy; {new Date().getFullYear()} CAP Entrepreneurs. All rights reserved.</span>
        </div>
        <div className="flex flex-col items-start gap-1 md:items-end">
          <span>{t.footer.bottom2}</span>
          <span>App Designed by Crafti Studio</span>
        </div>
      </div>
    </div>
  </footer>
  );
};

export default Footer;
