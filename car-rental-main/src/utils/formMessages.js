// Messages de validation du navigateur en français (sans modifier le DOM géré par React).
export default function installFrenchFormMessages() {
  document.addEventListener("invalid", (e) => {
    const el = e.target;
    if (!el.setCustomValidity || (localStorage.getItem("3m_lang") || "fr") !== "fr") return;
    el.setCustomValidity("");
    const v = el.validity;
    let msg = "";
    if (v.valueMissing) msg = el.type === "checkbox" ? "Veuillez cocher cette case." : el.tagName === "SELECT" ? "Veuillez choisir une option." : "Ce champ est obligatoire.";
    else if (v.typeMismatch || v.badInput) msg = el.type === "email" ? "Veuillez saisir une adresse e-mail valide." : "Veuillez saisir une valeur valide.";
    else if (v.tooShort) msg = `Au moins ${el.minLength} caractères sont nécessaires.`;
    else if (v.rangeUnderflow) msg = el.type === "date" ? "Cette date est trop ancienne." : `La valeur minimale est ${el.min}.`;
    else if (v.rangeOverflow) msg = el.type === "date" ? "Cette date est trop éloignée." : `La valeur maximale est ${el.max}.`;
    else if (v.patternMismatch) msg = el.title || "Le format saisi n’est pas valide.";
    if (msg) el.setCustomValidity(msg);
  }, true);
  ["input", "change"].forEach((type) =>
    document.addEventListener(type, (e) => e.target.setCustomValidity && e.target.setCustomValidity(""), true)
  );
}
