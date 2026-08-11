import { useState } from "react";
import { Link, NavLink, useNavigate } from "react-router-dom";
import { AnimatePresence, motion } from "framer-motion";
import { Menu, X, ArrowUpRight, Languages } from "lucide-react";
import { useLang } from "@/lib/i18n";
import { useSettings } from "@/lib/SettingsContext";

const Navbar = () => {
  const [open, setOpen] = useState(false);
  const navigate = useNavigate();
  const { lang, setLang, t } = useLang();
  const settings = useSettings();
  
  let dynamicLinks = [];
  try {
    if (settings?.navigation?.menu_json) {
      dynamicLinks = JSON.parse(settings.navigation.menu_json);
    }
  } catch(e) {}
  
  const LINKS = dynamicLinks.length > 0 ? dynamicLinks.map(l => ({ to: l.url, label: l.label, new_tab: l.new_tab })) : [
    { to: "/", label: t.nav.home },
    { to: "/about", label: t.nav.about },
    { to: "/programs", label: t.nav.programs },
    { to: "/impact-stories", label: t.nav.stories },
    { to: "/membership", label: t.nav.membership },
    { to: "/partners", label: t.nav.partners },
    { to: "/news-events", label: t.nav.news },
    { to: "/blog", label: t.nav.blog },
    { to: "/contact", label: t.nav.contact },
  ];

  const logoSrc = settings?.branding?.logo_main || "/assets/logo-mark.png";
  const logoLightSrc = settings?.branding?.logo_light || "/assets/logo-mark-light.png";

  return (
    <>
      <header
        className="sticky top-0 z-50 border-b border-forest/15 bg-bone/70 backdrop-blur-xl"
        data-testid="main-nav"
      >
        <div className="flex w-full items-center justify-between px-5 py-4 md:px-10 relative">
          <Link to="/" className="flex items-center gap-3 relative z-10" data-testid="nav-logo">
            <img src={logoSrc} alt={settings?.general?.site_name || "CAP Entrepreneurs"} className="h-9 w-auto mix-blend-multiply" />
          </Link>

          <nav className="hidden flex-1 items-center justify-center gap-3 lg:gap-4 xl:flex" data-testid="nav-links-desktop">
            {LINKS.map((l) => (
              <NavLink
                key={l.to}
                to={l.to}
                target={l.new_tab ? "_blank" : undefined}
                rel={l.new_tab ? "noopener noreferrer" : undefined}
                data-testid={`nav-link-${l.label.toLowerCase().replace(/[^a-z]+/g, "-")}`}
                className={({ isActive }) =>
                  `whitespace-nowrap text-[11px] font-bold uppercase tracking-[0.1em] transition-colors xl:text-[12px] ${
                    isActive ? "text-maple" : "text-forest hover:text-maple"
                  }`
                }
              >
                {l.label}
              </NavLink>
            ))}
          </nav>

          <div className="hidden xl:flex items-center gap-4 relative z-10">
            <div className="relative">
              <Languages className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-forest pointer-events-none" />
              <select
                value={lang}
                onChange={(e) => setLang(e.target.value)}
                data-testid="lang-select-desktop"
                className="appearance-none border border-forest/30 pl-8 pr-8 py-2 text-[12px] font-bold uppercase tracking-[0.14em] text-forest transition-colors hover:border-forest hover:bg-forest/5 focus:outline-none focus:ring-1 focus:ring-forest bg-transparent cursor-pointer"
                aria-label="Select language"
              >
                <option value="en">English</option>
                <option value="fr">Français</option>
                <option value="ar">العربية</option>
              </select>
              <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-forest text-[10px]">▼</div>
            </div>
            <button
              onClick={() => navigate("/donate")}
              data-testid="nav-donate-button"
              className="group flex items-center gap-1 bg-forest px-5 py-2.5 text-[13px] font-bold uppercase tracking-[0.14em] text-bone transition-colors hover:bg-maple"
            >
              {t.nav.donate}
              <ArrowUpRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
            </button>
          </div>

          <div className="flex items-center gap-4 xl:hidden relative z-10">
            <div className="relative">
              <Languages className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-forest pointer-events-none" />
              <select
                value={lang}
                onChange={(e) => setLang(e.target.value)}
                data-testid="lang-select-mobile-header"
                className="appearance-none border border-forest/30 pl-7 pr-6 py-1.5 text-[11px] font-bold uppercase tracking-[0.14em] text-forest transition-colors hover:bg-forest/5 focus:outline-none bg-transparent cursor-pointer"
                aria-label="Select language"
              >
                <option value="en">EN</option>
                <option value="fr">FR</option>
                <option value="ar">AR</option>
              </select>
              <div className="absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none text-forest text-[9px]">▼</div>
            </div>
            <button
              className="text-forest"
              onClick={() => setOpen(true)}
              data-testid="nav-menu-open-button"
              aria-label="Open menu"
            >
              <Menu className="h-7 w-7" />
            </button>
          </div>
        </div>
      </header>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
            className="fixed inset-0 z-[100] flex flex-col bg-forest"
            data-testid="nav-mobile-menu"
          >
            <div className="flex items-center justify-between px-5 py-4 md:px-10">
              <img src={logoLightSrc} alt={settings?.general?.site_name || "CAP Entrepreneurs"} className="h-9 w-auto" />
              <button
                onClick={() => setOpen(false)}
                className="text-bone"
                data-testid="nav-menu-close-button"
                aria-label="Close menu"
              >
                <X className="h-7 w-7" />
              </button>
            </div>
            <nav className="flex flex-1 flex-col justify-center gap-1 px-6 md:px-12">
              {LINKS.map((l, i) => (
                <div key={l.to} className="overflow-hidden">
                  <motion.div
                    initial={{ y: "100%" }}
                    animate={{ y: 0 }}
                    transition={{ delay: 0.08 + i * 0.05, duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
                  >
                    <NavLink
                      to={l.to}
                      onClick={() => setOpen(false)}
                      data-testid={`nav-mobile-link-${l.label.toLowerCase().replace(/[^a-z]+/g, "-")}`}
                      className="block py-2 font-heading text-4xl font-bold tracking-tight text-bone transition-colors hover:text-maple md:text-5xl"
                    >
                      {l.label}
                    </NavLink>
                  </motion.div>
                </div>
              ))}
              <div className="overflow-hidden pt-4">
                <motion.div
                  initial={{ y: "100%" }}
                  animate={{ y: 0 }}
                  transition={{ delay: 0.55, duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
                >
                  <NavLink
                    to="/donate"
                    onClick={() => setOpen(false)}
                    data-testid="nav-mobile-link-donate"
                    className="block w-full text-center bg-maple px-8 py-4 font-heading text-xl font-bold uppercase tracking-widest text-bone"
                  >
                    {t.nav.donate}
                  </NavLink>
                </motion.div>
              </div>
            </nav>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};

export default Navbar;
