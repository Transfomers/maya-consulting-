import React from "react";
import { Link } from "react-router-dom";
import { Car, Key, Home as HomeIcon, Phone, MessageSquare, MapPin, ArrowUpRight, ShieldCheck, Mail } from "lucide-react";
import { CATALOG_SECTIONS } from "@/data/catalogVehicles";

const Footer = () => {
  return (
    <footer className="bg-forest text-bone border-t border-forest/30" data-testid="site-footer">
      <div className="mx-auto max-w-[1440px] px-5 pt-16 pb-12 md:px-10 md:pt-24">
        
        {/* Main Footer Grid */}
        <div className="grid grid-cols-1 md:grid-cols-12 gap-12 pb-14 border-b border-bone/15">
          
          {/* Brand Info (5 cols) */}
          <div className="md:col-span-5 space-y-5">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 bg-maple text-white flex items-center justify-center font-heading font-black text-xl">
                3M
              </div>
              <div>
                <span className="font-heading font-black text-xl tracking-tight text-white block">
                  3M SERVICES
                </span>
                <span className="text-[10px] font-mono uppercase tracking-[0.2em] text-maple-light block">
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

            <div className="pt-2 flex flex-wrap gap-3">
              <a
                href="https://wa.me/237677000000?text=Bonjour%203M%20SERVICES"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold uppercase tracking-wider transition-colors"
              >
                <MessageSquare className="h-3.5 w-3.5" />
                <span>WhatsApp Client</span>
              </a>

              <a
                href="tel:+237677000000"
                className="inline-flex items-center gap-2 px-4 py-2.5 bg-white/10 hover:bg-white/20 text-white text-xs font-bold uppercase tracking-wider transition-colors"
              >
                <Phone className="h-3.5 w-3.5" />
                <span>+237 6 77 00 00 00</span>
              </a>
            </div>
          </div>

          {/* Quick Categories Navigation (4 cols) */}
          <div className="md:col-span-4 space-y-4">
            <h4 className="text-xs font-bold uppercase tracking-[0.25em] text-maple-light font-mono">
              SECTIONS DU CATALOGUE 2025
            </h4>
            <div className="grid grid-cols-2 gap-2 text-xs">
              {CATALOG_SECTIONS.slice(0, 8).map((sec) => (
                <a
                  key={sec.number}
                  href={`/#catalogue`}
                  className="text-bone/70 hover:text-white transition-colors py-1 flex items-center gap-1.5"
                >
                  <span className="text-maple font-mono text-[10px]">{sec.number}</span>
                  <span className="truncate">{sec.title}</span>
                </a>
              ))}
              <a
                href="/#catalogue"
                className="text-bone/70 hover:text-white transition-colors py-1 flex items-center gap-1.5"
              >
                <span className="text-maple font-mono text-[10px]">09-11</span>
                <span>Toyota & Hyundai</span>
              </a>
              <a
                href="/#catalogue"
                className="text-maple-light hover:text-white transition-colors py-1 flex items-center gap-1.5 font-bold"
              >
                <span className="text-maple font-mono text-[10px]">12</span>
                <span>Sur Commande</span>
              </a>
            </div>
          </div>

          {/* Services & Contact info (3 cols) */}
          <div className="md:col-span-3 space-y-4">
            <h4 className="text-xs font-bold uppercase tracking-[0.25em] text-maple-light font-mono">
              NOS SERVICES & ADRESSE
            </h4>
            <ul className="space-y-2.5 text-xs text-bone/80">
              <li className="flex items-center gap-2">
                <Car className="h-3.5 w-3.5 text-maple flex-shrink-0" />
                <span>Vente de voitures (Neuves 0 km & Occasions)</span>
              </li>
              <li className="flex items-center gap-2">
                <Key className="h-3.5 w-3.5 text-maple flex-shrink-0" />
                <span>Location de véhicules avec/sans chauffeur</span>
              </li>
              <li className="flex items-center gap-2">
                <HomeIcon className="h-3.5 w-3.5 text-maple flex-shrink-0" />
                <span>Location d'appartements meublés (Yaoundé)</span>
              </li>
              <li className="flex items-start gap-2 pt-2 border-t border-white/10">
                <MapPin className="h-3.5 w-3.5 text-maple flex-shrink-0 mt-0.5" />
                <span>Yaoundé, Région du Centre, Cameroun</span>
              </li>
            </ul>
          </div>

        </div>

        {/* Massive Editorial Brand Typography */}
        <div className="py-8 border-b border-bone/15 select-none overflow-hidden text-center md:text-left">
          <p className="font-heading font-black text-[11vw] tracking-tighter leading-none text-white/5 whitespace-nowrap">
            3M SERVICES 2025
          </p>
        </div>

        {/* Bottom Bar */}
        <div className="pt-8 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-bone/60">
          <p>© {new Date().getFullYear()} 3M SERVICES SARL. Tous droits réservés.</p>
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
