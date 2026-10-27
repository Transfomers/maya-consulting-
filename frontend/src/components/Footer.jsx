import React from "react";
import { Link } from "react-router-dom";
import { Car, Key, Home as HomeIcon, Phone, MessageSquare, MapPin, ArrowUpRight, ShieldCheck, Mail, ExternalLink } from "lucide-react";
import { CATALOG_SECTIONS } from "@/data/catalogVehicles";

const Footer = () => {
  return (
    <footer className="bg-forest text-bone border-t border-forest/30" data-testid="site-footer">
      <div className="mx-auto max-w-[1440px] px-5 pt-16 pb-12 md:px-10 md:pt-24">
        
        {/* Main Footer Grid */}
        <div className="grid grid-cols-1 md:grid-cols-12 gap-12 pb-14 border-b border-bone/15">
          
          {/* Brand Info (5 cols) */}
          <div className="md:col-span-5 space-y-5">
            <div className="flex items-center gap-3.5">
              <img
                src="/Asset/logo-3m-white.png"
                alt="3M SERVICES"
                className="h-11 sm:h-13 w-auto object-contain"
              />
              <div>
                <span className="font-heading font-black text-xl tracking-tight text-white block">
                  3M SERVICES
                </span>
                <span className="text-[10px] font-mono uppercase tracking-[0.2em] text-[#ED1C24] block font-bold">
                  Yaoundé • Cameroun
                </span>
              </div>
            </div>

            <p className="font-serif italic text-2xl text-bone/90 leading-snug">
              « Le confort de votre foyer, dans nos véhicules »
            </p>

            <p className="text-xs sm:text-sm text-bone/70 leading-relaxed max-w-md">
              3M services est un fournisseur expérimenté de services automobiles basé dans la région du centre, plus précisément dans la ville de Yaoundé. Vente de voitures, location de véhicules haut de gamme et d'appartements meublés.
            </p>

            <div className="pt-2 flex flex-wrap gap-2.5">
              <a
                href="https://wa.me/237691786447?text=Bonjour%203M%20SERVICES"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 px-3.5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold uppercase tracking-wider transition-colors rounded-xs"
              >
                <MessageSquare className="h-3.5 w-3.5" />
                <span>WhatsApp (+237 691 78 64 47)</span>
              </a>

              <a
                href="tel:+237691786447"
                className="inline-flex items-center gap-1.5 px-3 py-2.5 bg-white/10 hover:bg-white/20 text-white text-xs font-bold uppercase tracking-wider transition-colors rounded-xs"
              >
                <Phone className="h-3.5 w-3.5 text-[#E20713]" />
                <span>+237 691 78 64 47</span>
              </a>

              <a
                href="tel:+237653761728"
                className="inline-flex items-center gap-1.5 px-3 py-2.5 bg-white/10 hover:bg-white/20 text-white text-xs font-bold uppercase tracking-wider transition-colors rounded-xs"
              >
                <Phone className="h-3.5 w-3.5 text-[#E20713]" />
                <span>+237 653 76 17 28</span>
              </a>

              <a
                href="mailto:contact@3mservice.shop"
                className="inline-flex items-center gap-1.5 px-3 py-2.5 bg-white/10 hover:bg-white/20 text-white text-xs font-bold uppercase tracking-wider transition-colors rounded-xs"
              >
                <Mail className="h-3.5 w-3.5 text-[#E20713]" />
                <span>contact@3mservice.shop</span>
              </a>
            </div>
          </div>

          {/* Quick Categories Navigation (4 cols) */}
          <div className="md:col-span-4 space-y-4">
            <h4 className="text-xs font-bold uppercase tracking-[0.25em] text-[#EF4444] font-mono">
              BOUTIQUE & CATALOGUE
            </h4>
            <div className="grid grid-cols-2 gap-2 text-xs">
              <Link
                to="/boutique"
                className="text-white hover:text-[#EF4444] font-bold transition-colors py-1 flex items-center gap-1.5"
              >
                <span className="text-[#E20713] font-mono text-[10px]">★</span>
                <span>Toute la Boutique</span>
              </Link>
              <Link
                to="/panier"
                className="text-white hover:text-[#EF4444] font-bold transition-colors py-1 flex items-center gap-1.5"
              >
                <span className="text-[#E20713] font-mono text-[10px]">🛒</span>
                <span>Mon Panier</span>
              </Link>
              {CATALOG_SECTIONS.slice(0, 6).map((sec) => (
                <Link
                  key={sec.number}
                  to={`/boutique`}
                  className="text-bone/70 hover:text-white transition-colors py-1 flex items-center gap-1.5"
                >
                  <span className="text-[#E20713] font-mono text-[10px]">{sec.number}</span>
                  <span className="truncate">{sec.title}</span>
                </Link>
              ))}
            </div>
          </div>

          {/* Services & Contact info (3 cols) */}
          <div className="md:col-span-3 space-y-4">
            <h4 className="text-xs font-bold uppercase tracking-[0.25em] text-maple-light font-mono">
              NOS SERVICES & ADRESSE
            </h4>
            <ul className="space-y-2.5 text-xs text-bone/80">
              <li className="flex items-center gap-2">
                <Car className="h-3.5 w-3.5 text-[#E20713] flex-shrink-0" />
                <Link to="/location-voiture-yaounde" className="hover:text-white hover:underline transition-colors font-medium">
                  Location de voiture Yaoundé (Avec/Sans chauffeur)
                </Link>
              </li>
              <li className="flex items-center gap-2">
                <Car className="h-3.5 w-3.5 text-[#FF7900] flex-shrink-0" />
                <Link to="/location-prado-yaounde" className="hover:text-white hover:underline transition-colors font-medium">
                  Location Toyota Prado Yaoundé (VIP 4x4)
                </Link>
              </li>
              <li className="flex items-center gap-2">
                <HomeIcon className="h-3.5 w-3.5 text-emerald-400 flex-shrink-0" />
                <Link to="/appartement-meuble-tsinga-fecafoot" className="hover:text-white hover:underline transition-colors font-medium">
                  Appartement meublé Tsinga (Face FECAFOOT)
                </Link>
              </li>
              <li className="flex items-center gap-2">
                <HomeIcon className="h-3.5 w-3.5 text-emerald-400 flex-shrink-0" />
                <Link to="/appartement-meuble-yaounde" className="hover:text-white hover:underline transition-colors font-medium">
                  Appartements meublés Yaoundé &amp; Oyomabang (Bientôt)
                </Link>
              </li>
              <li className="flex items-center gap-2">
                <Key className="h-3.5 w-3.5 text-[#E20713] flex-shrink-0" />
                <Link to="/vente-voiture-leasing-cameroun" className="hover:text-white hover:underline transition-colors font-medium">
                  Vente de voitures &amp; Leasing MUPOCAM
                </Link>
              </li>
              <li className="flex items-start gap-2 pt-2 border-t border-white/10">
                <MapPin className="h-3.5 w-3.5 text-[#FF7900] flex-shrink-0 mt-0.5" />
                <div>
                  <span className="text-white font-semibold block">Nouvelle route - OMNISPORTS</span>
                  <span className="text-bone/60 text-[11px]">Yaoundé, Région du Centre, Cameroun</span>
                </div>
              </li>
            </ul>

            {/* MUPOCAM Endorsement Box */}
            <div className="pt-3 border-t border-white/10 flex items-center gap-3 bg-black/30 p-2.5 rounded border border-white/5">
              <img
                src="/Asset/logo-mupocam.png"
                alt="MUPOCAM - Mutuelle du Personnel Orange Cameroun"
                className="h-9 w-auto object-contain flex-shrink-0"
              />
              <div className="min-w-0">
                <span className="text-[10px] font-mono text-[#FF7900] uppercase font-bold tracking-wider block truncate">
                  Distributeur Officiel MUPOCAM
                </span>
                <span className="text-[11px] text-bone/80 block leading-tight">
                  Mutuelle Personnel Orange Cameroun • Vente Leasing
                </span>
              </div>
            </div>
          </div>

        </div>

        {/* Massive Editorial Brand Typography */}
        <div className="py-8 border-b border-bone/15 select-none overflow-hidden text-center md:text-left">
          <p className="font-heading font-black text-[11vw] tracking-tighter leading-none text-white/5 whitespace-nowrap">
            3M SERVICES 2025
          </p>
        </div>

        {/* Bottom Bar */}
        <div className="pt-8 flex flex-col md:flex-row items-center justify-between gap-4 text-xs text-bone/60 border-t border-white/5">
          <div className="flex flex-wrap items-center justify-center md:justify-start gap-2.5 sm:gap-3 text-center sm:text-left">
            <p>© {new Date().getFullYear()} 3M SERVICES. Tous droits réservés.</p>
            <span className="hidden sm:inline text-white/30">•</span>
            <a
              href="https://3mconsultingsarl.com/"
              target="_blank"
              rel="noopener noreferrer"
              className="text-stone-300 hover:text-[#E20713] transition-colors font-medium hover:underline flex items-center gap-1"
            >
              <span>3M Consulting</span>
              <ExternalLink className="h-3 w-3 inline text-white/40" />
            </a>
            <span className="text-white/30">•</span>
            <a
              href="https://craftistudio.tech/"
              target="_blank"
              rel="noopener noreferrer"
              className="text-stone-300 hover:text-[#E20713] transition-colors font-medium hover:underline flex items-center gap-1"
            >
              <span>Crafti Studio</span>
              <ExternalLink className="h-3 w-3 inline text-[#E20713]" />
            </a>
          </div>

          <p className="flex items-center gap-2">
            <ShieldCheck className="h-4 w-4 text-emerald-500" />
            <span>Catalogue Automobile 2025 • Yaoundé, Cameroun</span>
          </p>
        </div>

      </div>
    </footer>
  );
};

export default Footer;
