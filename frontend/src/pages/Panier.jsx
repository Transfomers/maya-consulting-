import React, { useState } from "react";
import { Link } from "react-router-dom";
import {
  ShoppingCart,
  Trash2,
  ArrowRight,
  MessageSquare,
  CheckCircle2,
  ShieldCheck,
  Building2,
  HelpCircle,
  Copy,
  Check,
  Phone,
  Fuel,
  Gauge,
  Calendar,
  Sparkles
} from "lucide-react";
import { toast } from "sonner";
import { useCart, formatFCFA } from "@/context/CartContext";

export default function Panier() {
  const {
    cartItems,
    cartCount,
    removeFromCart,
    clearCart,
    customerComment,
    setCustomerComment,
    totalNumeric,
    cartTotalFormatted,
    generateWhatsAppOrderUrl,
    officialWhatsAppNumber
  } = useCart();

  const [copied, setCopied] = useState(false);

  const handleCopyOrder = () => {
    // Generate text only
    const url = generateWhatsAppOrderUrl();
    const textParam = new URL(url).searchParams.get("text");
    if (textParam) {
      navigator.clipboard.writeText(textParam);
      setCopied(true);
      toast.success("Message de commande copié dans le presse-papier !");
      setTimeout(() => setCopied(false), 3000);
    }
  };

  const handleWhatsAppCheckout = () => {
    if (cartItems.length === 0) {
      toast.error("Votre panier est vide. Veuillez sélectionner au moins un véhicule.");
      return;
    }
    const orderUrl = generateWhatsAppOrderUrl();
    window.open(orderUrl, "_blank", "noopener,noreferrer");
  };

  return (
    <div className="min-h-screen bg-[#FDFCFD] text-[#111827]">
      {/* ── Page Header ─────── */}
      <section className="bg-[#111827] text-white pt-12 pb-14 px-5 sm:px-8 border-b border-white/10 relative overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(#E20713_1px,transparent_1px)] [background-size:24px_24px] opacity-15 pointer-events-none" />
        <div className="max-w-[1200px] mx-auto relative z-10">
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
            <div>
              <div className="flex items-center gap-2 mb-2">
                <span className="px-2.5 py-0.5 bg-[#E20713] text-white text-[10px] font-bold uppercase tracking-widest rounded-xs">
                  BOUTIQUE 3M SERVICES
                </span>
                <span className="text-xs font-mono text-stone-400 uppercase tracking-wider">
                  COMMANDE DIRECTE WHATSAPP
                </span>
              </div>
              <h1 className="font-heading font-black text-3xl sm:text-4xl text-white tracking-tight">
                Votre Panier de Commande
              </h1>
              <p className="text-xs sm:text-sm text-stone-300 mt-1 max-w-xl">
                Vérifiez votre sélection, ajoutez vos instructions ou questions pour l'achat ou l'événement MUPOCAM, puis validez votre commande en un clic sur WhatsApp.
              </p>
            </div>

            <Link
              to="/boutique"
              className="text-xs text-stone-300 hover:text-white flex items-center gap-1.5 underline uppercase tracking-wider font-bold transition-colors"
            >
              ← Poursuivre la sélection de voitures
            </Link>
          </div>
        </div>
      </section>

      {/* ── Main Cart Content ─────── */}
      <section className="py-12 px-5 sm:px-8">
        <div className="max-w-[1200px] mx-auto">
          
          {cartItems.length === 0 ? (
            /* Empty Cart View */
            <div className="bg-white border border-gray-200 p-12 text-center rounded-sm shadow-xs max-w-2xl mx-auto my-8">
              <div className="h-16 w-16 bg-red-50 text-[#E20713] rounded-full flex items-center justify-center mx-auto mb-4">
                <ShoppingCart className="h-8 w-8" />
              </div>
              <h2 className="font-heading font-black text-2xl text-gray-900">
                Votre panier est actuellement vide
              </h2>
              <p className="text-sm text-gray-500 mt-2 max-w-md mx-auto">
                Parcourez notre catalogue pour découvrir nos SUV, Mercedes, Kia, Toyota, Hyundai et nos offres de vente de voitures.
              </p>
              <div className="mt-8 flex justify-center">
                <Link
                  to="/boutique"
                  className="px-6 py-3.5 bg-[#E20713] hover:bg-[#C4050F] text-white font-heading font-bold text-xs uppercase tracking-wider flex items-center gap-2 rounded-xs shadow-sm transition-all"
                >
                  <ArrowRight className="h-4 w-4" />
                  <span>Consulter les Voitures en Vente</span>
                </Link>
              </div>
            </div>
          ) : (
            /* Cart Items Grid & Summary */
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
              
              {/* Left Column: Cart Items List (7 cols) */}
              <div className="lg:col-span-7 space-y-4">
                
                <div className="flex items-center justify-between pb-3 border-b border-gray-200">
                  <h2 className="font-heading font-bold text-base text-gray-900 flex items-center gap-2">
                    <span>Véhicules sélectionnés</span>
                    <span className="px-2 py-0.5 bg-gray-100 text-gray-700 text-xs font-mono rounded">
                      {cartCount}
                    </span>
                  </h2>
                  <button
                    onClick={clearCart}
                    className="text-xs text-gray-500 hover:text-red-600 transition-colors flex items-center gap-1"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                    <span>Vider le panier</span>
                  </button>
                </div>

                {/* Items */}
                <div className="space-y-4">
                  {cartItems.map((item) => (
                    <div
                      key={item.id}
                      className="bg-white border border-gray-200 rounded-sm p-4 sm:p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 shadow-2xs hover:border-gray-300 transition-all"
                    >
                      {/* Left: Thumbnail & Details */}
                      <div className="flex items-center gap-4 w-full sm:w-auto">
                        <div className="h-20 w-24 sm:h-24 sm:w-32 bg-gray-100 rounded-xs overflow-hidden flex-shrink-0 relative">
                          <img
                            src={item.image}
                            alt={item.model}
                            className="h-full w-full object-cover"
                          />
                          <span className="absolute bottom-1 left-1 px-1.5 py-0.2 bg-black/80 text-white text-[9px] font-mono uppercase">
                            1 unité
                          </span>
                        </div>

                        <div className="space-y-1">
                          <div className="flex items-center gap-2">
                            <span className="text-[10px] font-mono text-[#E20713] font-bold uppercase tracking-wider">
                              {item.brand} • {item.condition}
                            </span>
                          </div>
                          <h3 className="font-heading font-black text-base text-gray-900 leading-tight">
                            {item.model}
                          </h3>
                          <div className="flex flex-wrap items-center gap-3 text-xs text-gray-500 pt-1">
                            {item.engine && (
                              <span className="flex items-center gap-1">
                                <Fuel className="h-3 w-3 text-gray-400" />
                                {item.engine}
                              </span>
                            )}
                            {item.transmission && (
                              <span className="flex items-center gap-1">
                                <Gauge className="h-3 w-3 text-gray-400" />
                                {item.transmission}
                              </span>
                            )}
                            {item.year && (
                              <span className="flex items-center gap-1">
                                <Calendar className="h-3 w-3 text-gray-400" />
                                {item.year}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>

                      {/* Right: Price & Remove */}
                      <div className="flex sm:flex-col items-center sm:items-end justify-between w-full sm:w-auto pt-2 sm:pt-0 border-t sm:border-t-0 border-gray-100">
                        <div className="text-left sm:text-right">
                          <span className="text-[10px] uppercase font-bold tracking-wider text-gray-400 block">
                            Prix affiché
                          </span>
                          <span className="text-sm font-extrabold text-[#E20713]">
                            {item.price || "Sur devis"}
                          </span>
                        </div>

                        <button
                          onClick={() => removeFromCart(item.id)}
                          className="text-xs text-gray-400 hover:text-[#E20713] transition-colors p-1.5 flex items-center gap-1 mt-1"
                          title="Retirer du panier"
                        >
                          <Trash2 className="h-4 w-4" />
                          <span className="sm:hidden text-xs">Supprimer</span>
                        </button>
                      </div>

                    </div>
                  ))}
                </div>

                {/* Customer Comment & Special Requests Card */}
                <div className="bg-white border border-gray-200 rounded-sm p-5 shadow-2xs space-y-2 mt-6">
                  <label htmlFor="customer-comment" className="block font-heading font-bold text-sm text-gray-900">
                    Instructions, questions ou conditions de leasing
                  </label>
                  <p className="text-xs text-gray-500">
                    Ce commentaire sera automatiquement inclus dans le message WhatsApp transmis à 3M SERVICES.
                  </p>
                  <textarea
                    id="customer-comment"
                    rows={3}
                    value={customerComment}
                    onChange={(e) => setCustomerComment(e.target.value)}
                    placeholder="Ex: Je souhaite connaître les conditions de leasing MUPOCAM (Orange Cameroun), la disponibilité pour un essai à Yaoundé ou les modalités de paiement échelonné..."
                    className="w-full p-3 bg-[#F9FAFB] border border-gray-300 text-xs text-gray-900 placeholder:text-gray-400 focus:outline-none focus:border-[#E20713] focus:bg-white transition-colors rounded-xs"
                  />
                </div>

              </div>

              {/* Right Column: Order Summary & WhatsApp Action (5 cols) */}
              <div className="lg:col-span-5 sticky top-[90px] space-y-5">
                
                <div className="bg-white border border-gray-200 rounded-sm p-6 shadow-sm space-y-5">
                  <h3 className="font-heading font-black text-lg text-gray-900 border-b border-gray-200 pb-3">
                    Récapitulatif de Commande
                  </h3>

                  {/* Summary Rows */}
                  <div className="space-y-3 text-xs">
                    <div className="flex items-center justify-between text-gray-600">
                      <span>Total véhicules :</span>
                      <span className="font-bold text-gray-900 font-mono">
                        {cartCount} unité{cartCount > 1 ? "s" : ""}
                      </span>
                    </div>

                    <div className="flex items-center justify-between text-gray-600">
                      <span>Agence de référence :</span>
                      <span className="font-bold text-gray-900">
                        Nouvelle route - Omnisports, Yaoundé
                      </span>
                    </div>

                    <div className="flex items-center justify-between text-gray-600">
                      <span>Événement / Partenaire :</span>
                      <span className="font-bold text-[#FF7900]">
                        Événement MUPOCAM (Orange Cameroun)
                      </span>
                    </div>

                    <div className="pt-3 border-t border-gray-200 flex items-baseline justify-between">
                      <span className="font-heading font-bold text-sm text-gray-900">
                        Total affiché / estimé :
                      </span>
                      <div className="text-right">
                        <span className="font-heading font-black text-xl text-[#E20713] block">
                          {cartTotalFormatted}
                        </span>
                        <span className="text-[10px] text-gray-400">
                          Hors frais d'immatriculation éventuels
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* WhatsApp Action Button */}
                  <div className="space-y-2.5 pt-2">
                    <button
                      onClick={handleWhatsAppCheckout}
                      className="w-full py-4 bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 text-white font-heading font-black text-xs uppercase tracking-wider flex items-center justify-center gap-2 rounded-xs shadow-md transition-all hover:shadow-lg"
                    >
                      <MessageSquare className="h-5 w-5" />
                      <span>Commander sur WhatsApp</span>
                    </button>

                    <button
                      onClick={handleCopyOrder}
                      className="w-full py-2.5 bg-gray-100 hover:bg-gray-200 text-gray-700 font-heading font-bold text-xs uppercase tracking-wider flex items-center justify-center gap-2 rounded-xs transition-colors"
                    >
                      {copied ? (
                        <>
                          <Check className="h-4 w-4 text-emerald-600" />
                          <span className="text-emerald-700">Message copié !</span>
                        </>
                      ) : (
                        <>
                          <Copy className="h-4 w-4 text-gray-500" />
                          <span>Copier l'exemple de commande</span>
                        </>
                      )}
                    </button>
                  </div>

                  {/* Clarification Notice */}
                  <div className="p-3.5 bg-gray-50 border border-gray-200 rounded text-[11px] text-gray-600 space-y-2 leading-relaxed">
                    <div className="flex items-start gap-2">
                      <ShieldCheck className="h-4 w-4 text-emerald-600 flex-shrink-0 mt-0.5" />
                      <div>
                        <strong className="text-gray-900 font-semibold">Comment fonctionne la commande ?</strong>
                        <p className="mt-0.5">
                          1. En cliquant sur le bouton ci-dessus, WhatsApp s'ouvre avec votre message pré-rempli.<br />
                          2. Vous pouvez relire le message et l'envoyer directement à 3M SERVICES.<br />
                          3. Aucun paiement n'est exigé en ligne. Un conseiller étudie votre demande pour confirmer la disponibilité et le contrat de vente ou de leasing.
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Direct Phone Fallback */}
                  <div className="pt-2 flex items-center justify-between text-xs text-gray-500">
                    <span>Assistance téléphonique :</span>
                    <a
                      href={`tel:${officialWhatsAppNumber.replace(/\s+/g, '')}`}
                      className="text-gray-900 font-bold hover:text-[#E20713] flex items-center gap-1"
                    >
                      <Phone className="h-3 w-3" />
                      <span>{officialWhatsAppNumber}</span>
                    </a>
                  </div>

                </div>

              </div>

            </div>
          )}

        </div>
      </section>
    </div>
  );
}
