// 3M SERVICES - Common Data & String Formatters

/**
 * Format numeric value to FCFA currency string
 * @param {number|string} amount
 * @returns {string} e.g. "120 000 FCFA"
 */
export const formatFCFA = (amount) => {
  if (amount === undefined || amount === null || amount === "") return "0 FCFA";
  const num = typeof amount === "number" ? amount : Number(String(amount).replace(/[^0-9.-]+/g, ""));
  if (isNaN(num)) return String(amount);
  return `${num.toLocaleString("fr-FR")} FCFA`;
};

/**
 * Format phone string for direct WhatsApp wa.me links
 * @param {string} phone
 * @returns {string} e.g. "237691786447"
 */
export const cleanPhoneForWhatsApp = (phone) => {
  if (!phone) return "237691786447";
  const digits = String(phone).replace(/[^0-9]/g, "");
  if (digits.startsWith("237")) return digits;
  if (digits.length === 9) return `237${digits}`;
  return digits;
};

/**
 * Format ISO date string or timestamp to readable French date
 * @param {string|Date} dateInput
 * @returns {string} e.g. "18 Nov 2026"
 */
export const formatDateFR = (dateInput) => {
  if (!dateInput) return "N/A";
  try {
    const d = new Date(dateInput);
    if (isNaN(d.getTime())) return String(dateInput);
    return d.toLocaleDateString("fr-FR", {
      day: "2-digit",
      month: "short",
      year: "numeric"
    });
  } catch {
    return String(dateInput);
  }
};

/**
 * Generate official WhatsApp booking link with prefilled message
 * @param {Object} item - Car or Apartment object
 * @param {Object} details - Booking dates & client details
 * @returns {string}
 */
export const buildWhatsAppBookingUrl = (item = {}, details = {}) => {
  const phone = cleanPhoneForWhatsApp("+237 691 78 64 47");
  const itemName = item.name || item.title || item.model || "Véhicule VIP";
  const price = item.price || item.pricePerDay || "Tarif sur demande";

  const message =
    `Bonjour 3M SERVICES,\n\n` +
    `Je souhaite réserver : *${itemName}*\n` +
    `• Tarif : ${price}\n` +
    (details.clientName ? `• Nom : ${details.clientName}\n` : "") +
    (details.pickupDate ? `• Date départ : ${details.pickupDate}\n` : "") +
    (details.returnDate ? `• Date retour : ${details.returnDate}\n` : "") +
    `\nMerci de me confirmer la disponibilité et les modalités de paiement.`;

  return `https://wa.me/${phone}?text=${encodeURIComponent(message)}`;
};
