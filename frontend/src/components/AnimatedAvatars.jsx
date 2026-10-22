import React from "react";
import Marquee from "react-fast-marquee";
import { ShieldCheck, Car, Key, Home as HomeIcon } from "lucide-react";

const BRANDS = [
  "TOYOTA",
  "MERCEDES-BENZ",
  "KIA MOTORS",
  "HYUNDAI",
  "NISSAN",
  "BMW",
  "AUDI",
  "LEXUS",
  "LAND ROVER",
  "FORD",
  "MITSUBISHI",
  "SUZUKI"
];

const AnimatedAvatars = () => {
  return (
    <section className="overflow-hidden border-t border-forest/15 bg-white py-12" data-testid="brands-marquee">
      <div className="mx-auto max-w-[1440px] px-5 pb-6 text-center md:px-10">
        <p className="text-[11px] font-mono font-bold uppercase tracking-[0.25em] text-maple">
          3M SERVICES YAOUNDÉ • CATALOGUE AUTOMOBILE 2025
        </p>
        <h3 className="font-heading text-xl sm:text-2xl font-bold tracking-tight text-forest mt-1">
          Toutes les Grandes Marques Automobiles & Services Immobiliers
        </h3>
      </div>

      <Marquee speed={35} gradient={true} gradientColor="#FFFFFF" gradientWidth={60} pauseOnHover>
        <div className="flex items-center gap-10 px-4 py-2">
          {BRANDS.map((brand, i) => (
            <div
              key={i}
              className="flex items-center gap-3 px-6 py-3 border border-forest/10 bg-[#FAF9F5] shadow-xs"
            >
              <Car className="h-4 w-4 text-maple flex-shrink-0" />
              <span className="font-heading font-black text-sm tracking-widest text-forest uppercase whitespace-nowrap">
                {brand}
              </span>
            </div>
          ))}
        </div>
      </Marquee>

      {/* Slogan strip */}
      <div className="mt-8 mx-auto max-w-4xl px-4 py-3 bg-forest text-bone text-center flex flex-col sm:flex-row items-center justify-center gap-2 sm:gap-6 text-xs">
        <span className="font-serif italic text-sm text-bone">
          « Le confort de votre foyer, dans nos véhicules »
        </span>
        <span className="hidden sm:inline text-white/30">•</span>
        <span className="font-bold text-maple-light uppercase tracking-wider">
          Yaoundé • Région du Centre, Cameroun
        </span>
      </div>
    </section>
  );
};

export default AnimatedAvatars;
