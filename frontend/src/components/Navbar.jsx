import { useState } from "react";
import { Link, NavLink, useNavigate, useLocation } from "react-router-dom";
import { AnimatePresence, motion } from "framer-motion";
import { Menu, X, ArrowUpRight, Phone, MessageSquare, ChevronDown, Car, Sparkles, Home as HomeIcon } from "lucide-react";

const Navbar = () => {
  const [open, setOpen] = useState(false);
  const [mobileExpanded, setMobileExpanded] = useState({ catalog: true });
  const location = useLocation();

  const NAV_ITEMS = [
    { to: "/", label: "Accueil" },
    {
      to: "/#catalogue",
      label: "Catalogue 2025",
      key: "catalog",
      subpages: [
        { to: "/#catalogue", label: "Tous les Véhicules (55+)" },
        { to: "/#catalogue", label: "01 • Les SUV (Toyota, Santa Fe, Fortuner)" },
        { to: "/#catalogue", label: "02 • Les Mercedes (Maybach, Classe E/S, GLK)" },
        { to: "/#catalogue", label: "03-06 • Les Kia (Neuves 0km & Occasions)" },
        { to: "/#catalogue", label: "07-09 • Les Toyota (Hilux, Prado, Land Cruiser)" },
        { to: "/#catalogue", label: "10-11 • Les Hyundai (Santa Fe, Kona, Sonata)" },
        { to: "/#catalogue", label: "12 • Sur Commande (Toutes marques)" },
      ],
    },
    { to: "/#a-propos", label: "Qui Sommes-Nous ?" },
    { to: "/#appartements", label: "Location Appartements" },
    { to: "/#contact", label: "Contact & Devis" },
  ];

  const handleLinkClick = (target) => {
    setOpen(false);
    if (target.includes("#")) {
      const id = target.split("#")[1];
      const el = document.getElementById(id);
      if (el) {
        el.scrollIntoView({ behavior: "smooth" });
      }
    }
  };

  return (
    <>
      <header
        className="sticky top-0 z-50 border-b border-forest/15 bg-bone/90 backdrop-blur-xl"
        data-testid="main-nav"
      >
        <div className="flex w-full items-center justify-between px-5 py-3 md:px-10 relative">
          
          {/* Logo Brand */}
          <Link to="/" className="flex items-center gap-3 relative z-10" data-testid="nav-logo">
            <div className="h-10 w-10 bg-forest text-bone flex items-center justify-center font-heading font-black text-xl tracking-tighter shadow-sm">
              3M
            </div>
            <div className="flex flex-col">
              <span className="font-heading font-black text-base sm:text-lg tracking-tight text-forest leading-none">
                3M SERVICES
              </span>
              <span className="text-[10px] font-mono uppercase tracking-[0.2em] text-maple font-bold mt-0.5">
                Yaoundé • Catalogue 2025
              </span>
            </div>
          </Link>

          {/* Desktop Navigation Links */}
          <nav className="hidden flex-1 items-center justify-center gap-6 lg:gap-8 lg:flex" data-testid="nav-links-desktop">
            {NAV_ITEMS.map((item) => {
              const hasSubpages = Boolean(item.subpages?.length);

              if (hasSubpages) {
                return (
                  <div key={item.label} className="relative group">
                    <a
                      href={item.to}
                      onClick={() => handleLinkClick(item.to)}
                      className="inline-flex items-center gap-1.5 py-2 font-montserrat text-[12px] xl:text-[12.5px] font-bold uppercase tracking-[0.08em] text-forest hover:text-maple transition-colors"
                    >
                      {item.label}
                      <ChevronDown className="h-3 w-3 stroke-[2.2] text-forest/60 transition-transform duration-200 group-hover:rotate-180 group-hover:text-maple" />
                    </a>

                    <div className="absolute left-0 top-full pt-2 opacity-0 -translate-y-1 invisible pointer-events-none group-hover:opacity-100 group-hover:translate-y-0 group-hover:visible group-hover:pointer-events-auto transition-all duration-200 ease-out z-50">
                      <div className="min-w-[280px] bg-white border border-[#E5E5E5] shadow-[0_12px_30px_rgba(0,0,0,0.12)]">
                        {item.subpages.map((sub, idx) => (
                          <a
                            key={idx}
                            href={sub.to}
                            onClick={() => handleLinkClick(sub.to)}
                            className="block px-5 py-3 font-montserrat text-[11px] font-semibold uppercase tracking-[0.05em] border-b border-[#EEEEEE] last:border-b-0 text-forest hover:text-maple hover:bg-forest/[0.02] transition-colors"
                          >
                            {sub.label}
                          </a>
                        ))}
                      </div>
                    </div>
                  </div>
                );
              }

              return (
                <a
                  key={item.label}
                  href={item.to}
                  onClick={() => handleLinkClick(item.to)}
                  className="whitespace-nowrap font-montserrat text-[12px] xl:text-[12.5px] font-bold uppercase tracking-[0.08em] text-forest hover:text-maple transition-colors py-2"
                >
                  {item.label}
                </a>
              );
            })}
          </nav>

          {/* Action CTAs */}
          <div className="hidden lg:flex items-center gap-3 relative z-10">
            <a
              href="tel:+237677000000"
              className="px-3.5 py-2 text-xs font-bold text-forest hover:text-maple flex items-center gap-1.5 transition-colors"
            >
              <Phone className="h-3.5 w-3.5 text-maple" />
              <span>+237 6 77 00 00 00</span>
            </a>

            <a
              href="https://wa.me/237677000000?text=Bonjour%203M%20SERVICES,%20je%20souhaite%20des%20informations%20sur%20vos%20v%C3%A9hicules"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1.5 bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2 font-montserrat text-[11px] font-bold uppercase tracking-[0.08em] transition-colors shadow-sm"
            >
              <MessageSquare className="h-3.5 w-3.5" />
              <span>WhatsApp</span>
            </a>
          </div>

          {/* Mobile Menu Button */}
          <div className="flex items-center gap-3 lg:hidden relative z-10">
            <a
              href="https://wa.me/237677000000?text=Bonjour%203M%20SERVICES"
              target="_blank"
              rel="noopener noreferrer"
              className="p-2 bg-emerald-600 text-white rounded"
              aria-label="WhatsApp"
            >
              <MessageSquare className="h-4 w-4" />
            </a>

            <button
              className="text-forest p-1"
              onClick={() => setOpen(true)}
              aria-label="Open menu"
            >
              <Menu className="h-7 w-7" />
            </button>
          </div>
        </div>
      </header>

      {/* Mobile Drawer */}
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 z-[100] flex flex-col bg-forest text-bone"
          >
            <div className="flex items-center justify-between px-5 py-4 border-b border-bone/10">
              <div className="flex items-center gap-2">
                <div className="h-8 w-8 bg-maple text-white flex items-center justify-center font-heading font-black text-lg">
                  3M
                </div>
                <div>
                  <p className="font-heading font-bold text-sm text-white">3M SERVICES</p>
                  <p className="text-[9px] font-mono uppercase text-maple-light">Catalogue Automobile 2025</p>
                </div>
              </div>

              <button
                onClick={() => setOpen(false)}
                className="text-bone p-1"
                aria-label="Fermer"
              >
                <X className="h-7 w-7" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto px-5 py-6 space-y-4">
              <p className="font-serif italic text-lg text-bone/80 border-l-2 border-maple pl-3 mb-6">
                « Le confort de votre foyer, dans nos véhicules »
              </p>

              <div className="space-y-2">
                {NAV_ITEMS.map((item, idx) => (
                  <div key={idx} className="border-b border-bone/10 pb-2">
                    <a
                      href={item.to}
                      onClick={() => handleLinkClick(item.to)}
                      className="block text-base font-bold uppercase tracking-wider text-bone hover:text-maple transition-colors py-1"
                    >
                      {item.label}
                    </a>
                    {item.subpages && (
                      <div className="pl-3 pt-1 space-y-1.5">
                        {item.subpages.map((sub, sIdx) => (
                          <a
                            key={sIdx}
                            href={sub.to}
                            onClick={() => handleLinkClick(sub.to)}
                            className="block text-xs text-bone/70 hover:text-maple py-0.5"
                          >
                            {sub.label}
                          </a>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
              </div>

              <div className="pt-6 space-y-3">
                <a
                  href="https://wa.me/237677000000?text=Bonjour%203M%20SERVICES"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-full py-3 bg-emerald-600 text-white font-bold text-xs uppercase tracking-wider flex items-center justify-center gap-2"
                >
                  <MessageSquare className="h-4 w-4" />
                  <span>Contacter sur WhatsApp</span>
                </a>

                <a
                  href="tel:+237677000000"
                  className="w-full py-3 bg-white/10 text-white font-bold text-xs uppercase tracking-wider flex items-center justify-center gap-2"
                >
                  <Phone className="h-4 w-4" />
                  <span>Appeler le +237 6 77 00 00 00</span>
                </a>
              </div>
            </div>

            <div className="p-4 border-t border-bone/10 text-center text-[10px] text-bone/50">
              3M SERVICES • Yaoundé, Région du Centre, Cameroun
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};

export default Navbar;
