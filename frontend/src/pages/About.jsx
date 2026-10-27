import React from "react";
import { Link } from "react-router-dom";
import { Car, Key, Home as HomeIcon, ShieldCheck, CheckCircle2, Phone, MessageSquare, MapPin, Award, Users, Star } from "lucide-react";
import { CATALOG_INFO } from "@/data/catalogVehicles";

export default function About() {
  return (
    <div className="min-h-screen bg-bone text-forest pt-12 pb-24" data-testid="about-page">
      
      {/* Header Banner */}
      <section className="py-16 md:py-24 border-b border-forest/15 bg-gradient-to-b from-[#FAF9F5] to-bone">
        <div className="mx-auto max-w-[1440px] px-5 md:px-10">
          <div className="max-w-3xl space-y-4">
            <span className="text-xs font-bold uppercase tracking-[0.25em] text-maple font-mono">
              QUI SOMMES NOUS ?
            </span>
            <h1 className="font-heading font-black text-4xl sm:text-6xl text-forest tracking-tight">
              3M SERVICES
            </h1>
            <p className="font-serif italic text-2xl sm:text-3xl text-forest/90">
              « Le confort de votre foyer, dans nos véhicules »
            </p>
            <p className="text-base sm:text-lg text-sage leading-relaxed pt-2">
              3M services est un fournisseur expérimenté de services automobiles basé dans la région du centre, plus précisément dans la ville de Yaoundé. Vente de voitures, location de véhicules et d’appartements meublés de standing.
            </p>
          </div>
        </div>
      </section>

      {/* Narrative & Pillars */}
      <section className="py-16 md:py-20">
        <div className="mx-auto max-w-[1440px] px-5 md:px-10">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
            
            <div className="lg:col-span-6 space-y-6">
              <h2 className="font-heading font-black text-2xl sm:text-4xl text-forest tracking-tight">
                Une Expertise Automobile & Immobilière Reconnue à Yaoundé
              </h2>

              <p className="text-sm sm:text-base text-sage leading-relaxed">
                Depuis notre implantation dans la capitale camerounaise, 3M SERVICES s'est imposé comme le partenaire de confiance des particuliers exigeants, des professionnels et des délégations officielles.
              </p>

              <div className="space-y-4 pt-2">
                <div className="p-4 bg-white border border-forest/15 flex items-start gap-3">
                  <Car className="h-5 w-5 text-maple flex-shrink-0 mt-0.5" />
                  <div>
                    <h4 className="text-sm font-bold text-forest uppercase tracking-wider">Vente de Voitures</h4>
                    <p className="text-xs text-sage mt-1">
                      Véhicules neufs 0 km (Kia, Toyota...) sous garantie et occasions certifiées minutieusement contrôlées pour une totale sérénité sur la route.
                    </p>
                  </div>
                </div>

                <div className="p-4 bg-white border border-forest/15 flex items-start gap-3">
                  <Key className="h-5 w-5 text-maple flex-shrink-0 mt-0.5" />
                  <div>
                    <h4 className="text-sm font-bold text-forest uppercase tracking-wider">Location de Véhicules</h4>
                    <p className="text-xs text-sage mt-1">
                      Courte, moyenne ou longue durée. SUV 4x4 robustes, berlines d'affaires et véhicules de prestige avec chauffeurs bilingues et professionnels.
                    </p>
                  </div>
                </div>

                <div className="p-4 bg-white border border-forest/15 flex items-start gap-3">
                  <HomeIcon className="h-5 w-5 text-maple flex-shrink-0 mt-0.5" />
                  <div>
                    <h4 className="text-sm font-bold text-forest uppercase tracking-wider">Location d'Appartements</h4>
                    <p className="text-xs text-sage mt-1">
                      Appartements meublés de haut standing à Yaoundé (Tsinga - Face FECAFOOT, Omnisport, et bientôt Oyomabang), climatisés, gardiennage 24/7, wifi haut débit et parking sécurisé.
                    </p>
                  </div>
                </div>
              </div>

              <div className="pt-4 flex flex-wrap gap-4">
                <Link
                  to="/#catalogue"
                  className="px-6 py-3.5 bg-forest hover:bg-maple text-white text-xs font-bold uppercase tracking-wider transition-colors"
                >
                  Consulter le Catalogue 2025
                </Link>
                <a
                  href="https://wa.me/237691786447?text=Bonjour%203M%20SERVICES"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-6 py-3.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold uppercase tracking-wider transition-colors inline-flex items-center gap-2"
                >
                  <MessageSquare className="h-4 w-4" />
                  <span>WhatsApp Direct</span>
                </a>
              </div>
            </div>

            <div className="lg:col-span-6">
              <div className="relative border border-forest/20 p-4 bg-white shadow-xl">
                <img
                  src="https://images.unsplash.com/photo-1617814076367-b759c7d7e738?auto=compress&cs=tinysrgb&w=1200"
                  alt="3M Services Yaoundé"
                  className="w-full h-80 sm:h-96 object-cover"
                />
                <div className="p-6 bg-forest text-bone mt-4">
                  <p className="font-serif italic text-xl">
                    « La satisfaction et la sécurité de nos clients constituent notre engagement quotidien. »
                  </p>
                  <p className="text-xs font-mono uppercase text-maple mt-2">
                    L'équipe de Direction • 3M SERVICES Yaoundé
                  </p>
                </div>
              </div>
            </div>

          </div>
        </div>
      </section>

    </div>
  );
}
