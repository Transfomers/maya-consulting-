import React, { useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { AnimatePresence, motion } from "framer-motion";
import {
  Menu,
  X,
  Phone,
  MessageSquare,
  ShoppingCart,
  ChevronDown
} from "lucide-react";
import { useCart } from "@/context/CartContext";

const Navbar = () => {
  const [open, setOpen] = useState(false);
  const location = useLocation();
  const { cartCount } = useCart();

  const NAV_ITEMS = [
    { to: "/", label: "Accueil" },
    { to: "/boutique", label: "Boutique" },
    { to: "/location-voiture-yaounde", label: "Location Voitures" },
    { to: "/appartement-meuble-yaounde", label: "Appartements Meublés" },
    { to: "/#leasing", label: "Leasing MUPOCAM" },
    { to: "/#contact", label: "Contact & Devis" },
    { to: "/panier", label: "Panier", isCart: true },
  ];

  const handleLinkClick = (target) => {
    setOpen(false);
    if (target.includes("#")) {
      const id = target.split("#")[1];
      if (location.pathname !== "/") {
        window.location.href = `/${target.substring(target.indexOf("#"))}`;
        return;
      }
      const el = document.getElementById(id);
      if (el) {
        el.scrollIntoView({ behavior: "smooth" });
      }
    }
  };

  return (
    <>
      {/* ── Sticky Professional Navbar ─────── */}
      <header
        className="sticky top-0 z-50 border-b border-gray-200 bg-white/98 backdrop-blur-xl transition-shadow shadow-xs"
        data-testid="main-nav"
      >
        <div className="flex w-full items-center justify-between px-5 py-3 md:px-8 max-w-[1440px] mx-auto relative">
          
          {/* Logo on the left: larger, natural proportions, transparent background */}
          <Link
            to="/"
            className="flex items-center relative z-10 select-none group"
            data-testid="nav-logo"
            aria-label="3M SERVICES Accueil"
          >
            <img
              src="/Asset/logo-3m-services.png"
              alt="3M SERVICES"
              className="h-11 sm:h-13 w-auto object-contain transition-transform group-hover:scale-105"
              style={{ background: "transparent" }}
            />
          </Link>

          {/* Desktop Navigation Links */}
          <nav className="hidden lg:flex items-center gap-5 xl:gap-7" data-testid="nav-links-desktop">
            {NAV_ITEMS.map((item) => {
              if (item.isCart) {
                return (
                  <Link
                    key={item.label}
                    to={item.to}
                    className="relative whitespace-nowrap font-heading text-[12.5px] font-bold uppercase tracking-[0.06em] text-[#111827] hover:text-[#E20713] py-2 flex items-center gap-1.5 transition-colors"
                    aria-label="Voir le Panier"
                  >
                    <div className="relative">
                      <ShoppingCart className="h-4 w-4" />
                      {cartCount > 0 && (
                        <span className="absolute -top-2 -right-2 h-4 w-4 rounded-full bg-[#E20713] text-white text-[10px] font-mono font-bold flex items-center justify-center animate-in zoom-in">
                          {cartCount}
                        </span>
                      )}
                    </div>
                    <span>{item.label}</span>
                  </Link>
                );
              }

              if (item.to.startsWith("/#")) {
                return (
                  <a
                    key={item.label}
                    href={item.to}
                    onClick={() => handleLinkClick(item.to)}
                    className="whitespace-nowrap font-heading text-[12.5px] font-bold uppercase tracking-[0.06em] text-[#111827] hover:text-[#E20713] py-2 transition-colors"
                  >
                    {item.label}
                  </a>
                );
              }

              return (
                <Link
                  key={item.label}
                  to={item.to}
                  className="whitespace-nowrap font-heading text-[12.5px] font-bold uppercase tracking-[0.06em] text-[#111827] hover:text-[#E20713] py-2 transition-colors"
                >
                  {item.label}
                </Link>
              );
            })}
          </nav>

          {/* Right Action: WhatsApp Contact Button */}
          <div className="hidden lg:flex items-center gap-3 relative z-10">
            <a
              href="https://wa.me/237691786447?text=Bonjour%203M%20SERVICES,%20je%20souhaite%20des%20informations%20sur%20vos%20v%C3%A9hicules"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 text-white px-4 py-2.5 font-heading text-xs font-bold uppercase tracking-[0.08em] transition-all rounded-xs shadow-xs"
              aria-label="Contacter sur WhatsApp"
            >
              <MessageSquare className="h-4 w-4" />
              <span>WhatsApp</span>
            </a>
          </div>

          {/* Mobile Right Controls: Cart shortcut + Hamburger */}
          <div className="flex items-center gap-2.5 lg:hidden relative z-10">
            {/* Mobile Cart Shortcut */}
            <Link
              to="/panier"
              className="p-2 text-gray-800 hover:text-[#E20713] relative rounded-xs bg-gray-100 flex items-center justify-center"
              aria-label="Panier mobile"
            >
              <ShoppingCart className="h-5 w-5" />
              {cartCount > 0 && (
                <span className="absolute -top-1 -right-1 h-4 w-4 rounded-full bg-[#E20713] text-white text-[9px] font-mono font-bold flex items-center justify-center">
                  {cartCount}
                </span>
              )}
            </Link>

            {/* Mobile WhatsApp Button */}
            <a
              href="https://wa.me/237691786447?text=Bonjour%203M%20SERVICES"
              target="_blank"
              rel="noopener noreferrer"
              className="p-2 bg-emerald-600 text-white rounded-xs"
              aria-label="WhatsApp"
            >
              <MessageSquare className="h-4 w-4" />
            </a>

            {/* Hamburger Button */}
            <button
              className="text-[#111827] p-1.5 focus:outline-none focus:ring-2 focus:ring-[#E20713]"
              onClick={() => setOpen(true)}
              aria-label="Ouvrir le menu"
            >
              <Menu className="h-6 w-6" />
            </button>
          </div>

        </div>
      </header>

      {/* ── Accessible Mobile Drawer ─────── */}
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, x: "100%" }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: "100%" }}
            transition={{ duration: 0.25, ease: "easeOut" }}
            className="fixed inset-0 z-[100] flex flex-col bg-[#111827] text-white"
          >
            {/* Drawer Top */}
            <div className="flex items-center justify-between px-5 py-4 border-b border-white/10">
              <Link to="/" onClick={() => setOpen(false)} className="flex items-center">
                <img
                  src="/Asset/logo-3m-white.png"
                  alt="3M SERVICES"
                  className="h-10 w-auto object-contain"
                  style={{ background: "transparent" }}
                />
              </Link>

              <button
                onClick={() => setOpen(false)}
                className="text-white p-1 hover:text-[#EF4444] transition-colors"
                aria-label="Fermer le menu"
              >
                <X className="h-7 w-7" />
              </button>
            </div>

            {/* Drawer Links */}
            <div className="flex-1 overflow-y-auto px-5 py-6 space-y-4">
              <p className="font-serif italic text-base text-stone-300 border-l-2 border-[#E20713] pl-3 mb-6">
                « Le confort de votre foyer, dans nos véhicules »
              </p>

              <div className="space-y-1.5">
                <Link
                  to="/"
                  onClick={() => setOpen(false)}
                  className="block text-base font-heading font-bold uppercase tracking-wider text-white hover:text-[#EF4444] py-2 border-b border-white/10"
                >
                  Accueil
                </Link>

                <Link
                  to="/boutique"
                  onClick={() => setOpen(false)}
                  className="block text-base font-heading font-bold uppercase tracking-wider text-white hover:text-[#EF4444] py-2 border-b border-white/10"
                >
                  Boutique
                </Link>

                <a
                  href="/#leasing"
                  onClick={() => handleLinkClick("/#leasing")}
                  className="block text-base font-heading font-bold uppercase tracking-wider text-white hover:text-[#EF4444] py-2 border-b border-white/10"
                >
                  Leasing MUPOCAM
                </a>

                <Link
                  to="/boutique?tab=appartements"
                  onClick={() => setOpen(false)}
                  className="block text-base font-heading font-bold uppercase tracking-wider text-white hover:text-[#EF4444] py-2 border-b border-white/10"
                >
                  Location Appartements
                </Link>

                <a
                  href="/#a-propos"
                  onClick={() => handleLinkClick("/#a-propos")}
                  className="block text-base font-heading font-bold uppercase tracking-wider text-white hover:text-[#EF4444] py-2 border-b border-white/10"
                >
                  À propos
                </a>

                <a
                  href="/#contact"
                  onClick={() => handleLinkClick("/#contact")}
                  className="block text-base font-heading font-bold uppercase tracking-wider text-white hover:text-[#EF4444] py-2 border-b border-white/10"
                >
                  Contact & Devis
                </a>

                <Link
                  to="/panier"
                  onClick={() => setOpen(false)}
                  className="flex items-center justify-between text-base font-heading font-bold uppercase tracking-wider text-white hover:text-[#EF4444] py-2 border-b border-white/10"
                >
                  <span className="flex items-center gap-2">
                    <ShoppingCart className="h-4 w-4" />
                    <span>Panier</span>
                  </span>
                  {cartCount > 0 && (
                    <span className="text-xs px-2 py-0.5 bg-[#E20713] text-white rounded font-mono font-bold">
                      {cartCount}
                    </span>
                  )}
                </Link>
              </div>

              {/* Action Buttons in Drawer */}
              <div className="pt-6 space-y-3">
                <a
                  href="https://wa.me/237691786447?text=Bonjour%203M%20SERVICES"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-full py-3 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs uppercase tracking-wider flex items-center justify-center gap-2 rounded-xs"
                >
                  <MessageSquare className="h-4 w-4" />
                  <span>WhatsApp (+237 691 78 64 47)</span>
                </a>
              </div>
            </div>

            <div className="p-4 border-t border-white/10 text-center text-[10px] text-stone-400 font-mono">
              3M SERVICES • Nouvelle route - OMNISPORTS, Yaoundé
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};

export default Navbar;
