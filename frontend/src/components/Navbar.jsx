import { useState } from "react";
import { Link, NavLink, useNavigate, useLocation } from "react-router-dom";
import { AnimatePresence, motion } from "framer-motion";
import { Menu, X, ArrowUpRight, Languages, ChevronDown } from "lucide-react";
import { useLang } from "@/lib/i18n";
import { useSettings } from "@/lib/SettingsContext";

const Navbar = () => {
  const [open, setOpen] = useState(false);
  const [mobileExpanded, setMobileExpanded] = useState({ join: true, programs: true });
  const navigate = useNavigate();
  const location = useLocation();
  const { lang, setLang, t } = useLang();
  const settings = useSettings();

  const NAV_ITEMS = [
    { to: "/", label: t.nav.home },
    { to: "/about", label: t.nav.about },
    {
      to: "/join",
      label: t.nav.join,
      key: "join",
      subpages: [
        { to: "/join", label: t.nav.joinEcosystem || t.nav.join },
        { to: "/volunteer", label: t.nav.volunteer },
        { to: "/partners", label: t.nav.partners },
      ],
    },
    {
      to: "/programs",
      label: t.nav.programs,
      key: "programs",
      subpages: [
        {
          to: "/programs",
          label: lang === "fr" ? "Nos programmes" : lang === "ar" ? "برامجنا" : "Our Programs",
        },
        {
          to: "/resources",
          label: lang === "fr" ? "Nos ressources" : lang === "ar" ? "مواردنا" : "Our Resources",
        },
        {
          to: "/global-festival",
          label: lang === "fr" ? "Notre festival" : lang === "ar" ? "مهرجاننا" : "Our Festival",
        },
      ],
    },
    { to: "/blog", label: t.nav.blog },
    { to: "/contact", label: t.nav.contact },
  ];

  const logoSrc = settings?.branding?.logo_main || "/assets/logo-mark.png";
  const logoLightSrc = settings?.branding?.logo_light || "/assets/logo-mark-light.png";

  const isItemActive = (item) => {
    if (location.pathname === item.to) return true;
    if (item.subpages && item.subpages.some((s) => location.pathname === s.to.split("#")[0])) {
      return true;
    }
    return false;
  };

  return (
    <>
      <header
        className="sticky top-0 z-50 border-b border-forest/15 bg-bone/70 backdrop-blur-xl"
        data-testid="main-nav"
      >
        <div className="flex w-full items-center justify-between px-5 py-4 md:px-10 relative">
          <Link to="/" className="flex items-center gap-3 relative z-10" data-testid="nav-logo">
            <img
              src={logoSrc}
              alt={settings?.general?.site_name || "CAP Entrepreneurs"}
              className="h-9 md:h-10 w-auto object-contain"
            />
          </Link>

          <nav className="hidden flex-1 items-center justify-center gap-6 lg:gap-8 lg:flex" data-testid="nav-links-desktop">
            {NAV_ITEMS.map((item) => {
              const active = isItemActive(item);
              const hasSubpages = Boolean(item.subpages?.length);

              if (hasSubpages) {
                return (
                  <div key={item.label} className="relative group">
                    <NavLink
                      to={item.to}
                      data-testid={`nav-link-${item.label.toLowerCase().replace(/[^a-z]+/g, "-")}`}
                      className={`inline-flex items-center gap-1.5 py-2 font-montserrat text-[12px] xl:text-[12.5px] font-semibold uppercase tracking-[0.08em] transition-colors ${
                        active ? "text-maple" : "text-forest hover:text-maple"
                      }`}
                    >
                      {item.label}
                      <ChevronDown className="h-3 w-3 stroke-[2.2] text-forest/60 transition-transform duration-200 group-hover:rotate-180 group-hover:text-maple" />
                    </NavLink>

                    {/* Dropdown: white box, horizontal hairline dividers, uppercase Montserrat text */}
                    <div className="absolute left-0 top-full pt-2 opacity-0 -translate-y-1 invisible pointer-events-none group-hover:opacity-100 group-hover:translate-y-0 group-hover:visible group-hover:pointer-events-auto transition-all duration-200 ease-out z-50">
                      <div className="min-w-[230px] bg-white border border-[#E5E5E5] shadow-[0_12px_30px_rgba(0,0,0,0.12)]">
                        {item.subpages.map((sub) => {
                          const isSubActive =
                            location.pathname + location.hash === sub.to ||
                            (location.pathname === sub.to && !location.hash && !sub.to.includes("#"));
                          return (
                            <NavLink
                              key={sub.to}
                              to={sub.to}
                              onClick={() => {
                                if (sub.to.includes("#")) {
                                  const id = sub.to.split("#")[1];
                                  const el = document.getElementById(id);
                                  if (el) el.scrollIntoView({ behavior: "smooth" });
                                }
                              }}
                              data-testid={`nav-sublink-${sub.label.toLowerCase().replace(/[^a-z]+/g, "-")}`}
                              className={`block px-6 py-3.5 font-montserrat text-[11.5px] font-semibold uppercase tracking-[0.08em] border-b border-[#EEEEEE] last:border-b-0 whitespace-nowrap transition-colors duration-150 ${
                                isSubActive
                                  ? "text-maple bg-forest/[0.03]"
                                  : "text-forest hover:text-maple hover:bg-forest/[0.02]"
                              }`}
                            >
                              {sub.label}
                            </NavLink>
                          );
                        })}
                      </div>
                    </div>
                  </div>
                );
              }

              return (
                <NavLink
                  key={item.to}
                  to={item.to}
                  data-testid={`nav-link-${item.label.toLowerCase().replace(/[^a-z]+/g, "-")}`}
                  className={`whitespace-nowrap font-montserrat text-[12px] xl:text-[12.5px] font-semibold uppercase tracking-[0.08em] transition-colors py-2 ${
                    active ? "text-maple" : "text-forest hover:text-maple"
                  }`}
                >
                  {item.label}
                </NavLink>
              );
            })}
          </nav>

          <div className="hidden lg:flex items-center gap-4 relative z-10">
            <div className="relative">
              <Languages className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-forest pointer-events-none" />
              <select
                value={lang}
                onChange={(e) => setLang(e.target.value)}
                data-testid="lang-select-desktop"
                className="appearance-none border border-forest/30 pl-8 pr-8 py-2 font-montserrat text-[11px] font-semibold uppercase tracking-[0.08em] text-forest transition-colors hover:border-forest hover:bg-forest/5 focus:outline-none focus:ring-1 focus:ring-forest bg-transparent cursor-pointer"
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
              className="group flex items-center gap-1 bg-forest px-5 py-2.5 font-montserrat text-[12px] font-semibold uppercase tracking-[0.08em] text-bone transition-colors hover:bg-maple"
            >
              {t.nav.donate}
              <ArrowUpRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
            </button>
          </div>

          <div className="flex items-center gap-4 lg:hidden relative z-10">
            <div className="relative">
              <Languages className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-forest pointer-events-none" />
              <select
                value={lang}
                onChange={(e) => setLang(e.target.value)}
                data-testid="lang-select-mobile-header"
                className="appearance-none border border-forest/30 pl-7 pr-6 py-1.5 font-montserrat text-[10.5px] font-semibold uppercase tracking-[0.08em] text-forest transition-colors hover:bg-forest/5 focus:outline-none bg-transparent cursor-pointer"
                aria-label="Select language"
              >
                <option value="en">EN</option>
                <option value="fr">FR</option>
                <option value="ar">AR</option>
              </select>
              <div className="absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none text-forest text-[9px]">▼</div>
            </div>
            <button
              className="text-forest p-1"
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
            <div className="flex items-center justify-between px-5 py-4 md:px-10 border-b border-bone/10">
              <img
                src={logoLightSrc}
                alt={settings?.general?.site_name || "CAP Entrepreneurs"}
                className="h-9 w-auto object-contain"
              />
              <button
                onClick={() => setOpen(false)}
                className="text-bone p-1"
                data-testid="nav-menu-close-button"
                aria-label="Close menu"
              >
                <X className="h-7 w-7" />
              </button>
            </div>

            <nav className="flex flex-1 flex-col justify-center gap-1 overflow-y-auto px-6 py-8 md:px-12">
              {NAV_ITEMS.map((l, i) => {
                const hasSub = Boolean(l.subpages?.length);
                const isExpanded = mobileExpanded[l.key];
                const active = isItemActive(l);

                return (
                  <div key={l.to} className="overflow-hidden py-1 border-b border-bone/10 last:border-b-0">
                    <motion.div
                      initial={{ y: "100%" }}
                      animate={{ y: 0 }}
                      transition={{ delay: 0.05 + i * 0.04, duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
                    >
                      {hasSub ? (
                        <div>
                          <div className="flex items-center justify-between">
                            <NavLink
                              to={l.to}
                              onClick={() => setOpen(false)}
                              data-testid={`nav-mobile-link-${l.label.toLowerCase().replace(/[^a-z]+/g, "-")}`}
                              className={`py-2 font-montserrat text-2xl md:text-3xl font-semibold tracking-tight transition-colors ${
                                active ? "text-maple" : "text-bone hover:text-maple"
                              }`}
                            >
                              {l.label}
                            </NavLink>
                            <button
                              type="button"
                              onClick={() =>
                                setMobileExpanded((prev) => ({
                                  ...prev,
                                  [l.key]: !prev[l.key],
                                }))
                              }
                              className="p-2 text-bone/70 hover:text-bone"
                              aria-label={`Toggle ${l.label}`}
                            >
                              <ChevronDown
                                className={`h-5 w-5 transition-transform duration-200 ${
                                  isExpanded ? "rotate-180 text-maple" : ""
                                }`}
                              />
                            </button>
                          </div>
                          {isExpanded && (
                            <div className="ml-3 my-2 flex flex-col gap-1.5 pl-3 border-l border-bone/20">
                              {l.subpages.map((sub) => {
                                const isSubActive =
                                  location.pathname + location.hash === sub.to ||
                                  (location.pathname === sub.to && !location.hash && !sub.to.includes("#"));
                                return (
                                  <NavLink
                                    key={sub.to}
                                    to={sub.to}
                                    onClick={() => {
                                      setOpen(false);
                                      if (sub.to.includes("#")) {
                                        const id = sub.to.split("#")[1];
                                        const el = document.getElementById(id);
                                        if (el) el.scrollIntoView({ behavior: "smooth" });
                                      }
                                    }}
                                    data-testid={`nav-mobile-sublink-${sub.label.toLowerCase().replace(/[^a-z]+/g, "-")}`}
                                    className={`py-1 font-montserrat text-sm md:text-base font-semibold uppercase tracking-wider transition-colors ${
                                      isSubActive
                                        ? "text-maple"
                                        : "text-bone/75 hover:text-maple"
                                    }`}
                                  >
                                    {sub.label}
                                  </NavLink>
                                );
                              })}
                            </div>
                          )}
                        </div>
                      ) : (
                        <NavLink
                          to={l.to}
                          onClick={() => setOpen(false)}
                          data-testid={`nav-mobile-link-${l.label.toLowerCase().replace(/[^a-z]+/g, "-")}`}
                          className={`block py-2 font-montserrat text-2xl md:text-3xl font-semibold tracking-tight transition-colors ${
                            active ? "text-maple" : "text-bone hover:text-maple"
                          }`}
                        >
                          {l.label}
                        </NavLink>
                      )}
                    </motion.div>
                  </div>
                );
              })}

              <div className="overflow-hidden pt-6">
                <motion.div
                  initial={{ y: "100%" }}
                  animate={{ y: 0 }}
                  transition={{ delay: 0.4, duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
                >
                  <NavLink
                    to="/donate"
                    onClick={() => setOpen(false)}
                    data-testid="nav-mobile-link-donate"
                    className="block w-full text-center bg-maple px-8 py-3.5 font-montserrat text-base font-semibold uppercase tracking-wider text-bone transition-colors hover:bg-bone hover:text-forest"
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
