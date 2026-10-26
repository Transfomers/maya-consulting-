import { useState, useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import { ArrowLeft, Car, Fuel, Gauge, Users, Calendar, Check, MessageSquare, Phone, ShieldCheck, Sparkles } from "lucide-react";
import { getCarById, getCars } from "@/data/catalogStorage";
import VehicleDetailModal from "@/components/VehicleDetailModal";

export default function BlogPost() {
  const { slug } = useParams();
  const [vehicle, setVehicle] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);

  useEffect(() => {
    const found = getCarById(slug) || getCars().find(c => c.slug === slug || c.id === slug);
    setVehicle(found || null);
    setLoading(false);
  }, [slug]);

  if (loading) {
    return (
      <div className="min-h-screen bg-bone flex items-center justify-center p-8">
        <Car className="h-8 w-8 text-maple animate-bounce" />
      </div>
    );
  }

  if (!vehicle) {
    return (
      <div className="min-h-screen bg-bone text-forest flex flex-col items-center justify-center p-8 text-center">
        <Car className="h-16 w-16 text-forest/20 mb-4" />
        <h2 className="text-2xl font-heading font-black text-forest">Véhicule introuvable</h2>
        <p className="text-xs text-sage mt-1 max-w-sm">
          Le véhicule recherché n'est plus répertorié ou a été mis à jour par l'administration 3M SERVICES.
        </p>
        <Link
          to="/blog"
          className="mt-6 px-6 py-2.5 bg-forest text-white text-xs font-bold uppercase tracking-wider"
        >
          Voir la sélection de voitures
        </Link>
      </div>
    );
  }

  const isNew = vehicle.condition === "Neuve" || vehicle.mileage === "0 km";

  return (
    <div className="min-h-screen bg-bone text-forest pt-12 pb-24 font-sans">
      
      {/* Top Breadcrumb */}
      <div className="mx-auto max-w-[1440px] px-5 md:px-10 py-6 border-b border-forest/10 flex items-center justify-between">
        <Link
          to="/blog"
          className="inline-flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-forest hover:text-maple transition-colors"
        >
          <ArrowLeft className="h-4 w-4" />
          <span>Retour à la sélection de voitures</span>
        </Link>

        <span className="text-xs font-mono text-sage">
          RÉF : {vehicle.id}
        </span>
      </div>

      {/* Main Showcase */}
      <div className="mx-auto max-w-[1440px] px-5 md:px-10 py-10">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-start">
          
          {/* Left Media */}
          <div className="lg:col-span-7 space-y-4">
            <div className="relative h-80 sm:h-[450px] w-full overflow-hidden bg-forest/10 border border-forest/20 shadow-lg">
              <img
                src={vehicle.image}
                alt={vehicle.model}
                className="h-full w-full object-cover"
              />
              <div className="absolute top-4 left-4 flex gap-2">
                <span className="px-3 py-1 bg-forest text-white text-xs font-bold font-mono uppercase">
                  SECTION {vehicle.section} • {vehicle.sectionTitle}
                </span>
                <span className={`px-3 py-1 text-xs font-extrabold uppercase ${
                  isNew ? "bg-emerald-500 text-white" : "bg-amber-400 text-black"
                }`}>
                  {vehicle.condition}
                </span>
              </div>
            </div>

            {/* Quick Specs Strip */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 bg-white p-4 border border-forest/15">
              <div className="flex items-center gap-2">
                <Fuel className="h-4 w-4 text-maple" />
                <div>
                  <p className="text-[10px] uppercase text-sage">Moteur</p>
                  <p className="text-xs font-bold text-forest">{vehicle.engine}</p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <Gauge className="h-4 w-4 text-maple" />
                <div>
                  <p className="text-[10px] uppercase text-sage">Boîte</p>
                  <p className="text-xs font-bold text-forest">{vehicle.transmission}</p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <Users className="h-4 w-4 text-maple" />
                <div>
                  <p className="text-[10px] uppercase text-sage">Places</p>
                  <p className="text-xs font-bold text-forest">{vehicle.seats || "5 places"}</p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <Calendar className="h-4 w-4 text-maple" />
                <div>
                  <p className="text-[10px] uppercase text-sage">Compteur</p>
                  <p className="text-xs font-bold text-forest">{vehicle.mileage || (isNew ? "0 km" : "Certifié")}</p>
                </div>
              </div>
            </div>
          </div>

          {/* Right Details & Direct Actions */}
          <div className="lg:col-span-5 bg-white p-6 sm:p-8 border border-forest/20 shadow-sm space-y-6">
            <div>
              <span className="text-xs font-bold uppercase tracking-widest text-maple font-mono">
                {vehicle.brand} • CATALOGUE 2025
              </span>
              <h1 className="text-3xl font-heading font-black text-forest mt-1">
                {vehicle.model}
              </h1>
              <p className="text-sm font-serif italic text-sage mt-1">
                Disponible pour vente immédiate ou réservation à Yaoundé.
              </p>
            </div>

            <div className="border-t border-forest/10 pt-4">
              <h3 className="text-xs font-bold uppercase tracking-wider text-forest mb-2">
                Présentation :
              </h3>
              <p className="text-xs sm:text-sm text-sage leading-relaxed">
                {vehicle.description || "Ce véhicule sélectionné par 3M SERVICES bénéficie d'un contrôle technique poussé et garantit une fiabilité exemplaire sur les axes urbains et régionaux du Cameroun."}
              </p>
            </div>

            {vehicle.features && vehicle.features.length > 0 && (
              <div className="border-t border-forest/10 pt-4">
                <h3 className="text-xs font-bold uppercase tracking-wider text-forest mb-3">
                  Équipements & Options :
                </h3>
                <div className="space-y-1.5">
                  {vehicle.features.map((feat, i) => (
                    <div key={i} className="flex items-center gap-2 text-xs text-forest">
                      <Check className="h-3.5 w-3.5 text-maple flex-shrink-0" />
                      <span>{feat}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div className="pt-4 border-t border-forest/10 space-y-3">
              <a
                href={`https://wa.me/237691786447?text=${encodeURIComponent(
                  `Bonjour 3M SERVICES, je souhaite commander ou avoir des détails sur : ${vehicle.model} (Réf: ${vehicle.id})`
                )}`}
                target="_blank"
                rel="noopener noreferrer"
                className="w-full py-3.5 px-4 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold uppercase tracking-widest flex items-center justify-center gap-2 transition-colors shadow-sm"
              >
                <MessageSquare className="h-4 w-4" />
                <span>Commander sur WhatsApp</span>
              </a>

              <button
                onClick={() => setIsModalOpen(true)}
                className="w-full py-3.5 px-4 bg-forest hover:bg-maple text-white text-xs font-bold uppercase tracking-widest flex items-center justify-center gap-2 transition-colors"
              >
                <span>Demander un Devis Formel</span>
              </button>
            </div>

            <div className="pt-2 text-center text-[11px] text-sage">
              <ShieldCheck className="inline h-3.5 w-3.5 text-emerald-600 mr-1" />
              Inspection certifiée • Yaoundé, Région du Centre
            </div>
          </div>

        </div>
      </div>

      <VehicleDetailModal
        vehicle={vehicle}
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
      />

    </div>
  );
}
