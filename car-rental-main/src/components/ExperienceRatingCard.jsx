// Espace client : note globale de l'expérience 3M SERVICES (1 à 5 étoiles + commentaire).
// Enregistrée côté serveur ; l'équipe y répond et la réponse s'affiche ici.
import React, { useEffect, useState } from "react";
import { API_BASE } from "../config/api";
import "../styles/ExperienceRating.css";

const LABELS_FR = ["", "Très décevant", "Décevant", "Correct", "Très bien", "Excellent"];
const LABELS_EN = ["", "Very poor", "Poor", "Okay", "Very good", "Excellent"];

export default function ExperienceRatingCard({ client, isFr = true }) {
  const [saved, setSaved] = useState(null);
  const [rating, setRating] = useState(0);
  const [hover, setHover] = useState(0);
  const [comment, setComment] = useState("");
  const [editing, setEditing] = useState(true);
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState(null);

  const account = client?.accountNumber || client?.id || "";

  useEffect(() => {
    if (!account) return;
    const qs = new URLSearchParams({ account, phone: client?.phone || "", email: client?.email || "" });
    fetch(`${API_BASE}/experience-rating?${qs}`)
      .then((r) => r.json())
      .then((d) => {
        if (d && d.rating) {
          setSaved(d.rating);
          setRating(d.rating.rating);
          setComment(d.rating.comment || "");
          setEditing(false);
        }
      })
      .catch(() => {});
  }, [account, client?.phone, client?.email]);

  const labels = isFr ? LABELS_FR : LABELS_EN;
  const shown = hover || rating;
  const needsComment = rating > 0 && rating <= 3;

  const submit = async (e) => {
    e.preventDefault();
    if (!rating) {
      setMsg({ type: "error", text: isFr ? "Choisissez une note." : "Please pick a rating." });
      return;
    }
    if (needsComment && comment.trim().length < 5) {
      setMsg({
        type: "error",
        text: isFr
          ? "Dites-nous ce qui n'a pas été à la hauteur : nous voulons le corriger."
          : "Tell us what went wrong so we can fix it."
      });
      return;
    }
    setBusy(true);
    setMsg(null);
    try {
      const res = await fetch(`${API_BASE}/experience-rating`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          accountNumber: account,
          name: client?.name || client?.fullName || "",
          phone: client?.phone || "",
          email: client?.email || "",
          rating,
          comment: comment.trim()
        })
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || (isFr ? "Envoi impossible, réessayez." : "Could not send, try again."));
      setSaved(data.rating);
      setEditing(false);
      setMsg({
        type: "success",
        text: isFr
          ? rating <= 3
            ? "Merci. Votre avis a été transmis à l'équipe, qui revient vers vous rapidement."
            : "Merci pour votre note !"
          : "Thank you for your feedback!"
      });
    } catch (err) {
      setMsg({ type: "error", text: err.message });
    } finally {
      setBusy(false);
    }
  };

  if (!account) return null;

  return (
    <section className="account-panel-card xr-card">
      <div className="account-panel-header">
        <h3 className="account-panel-title">{isFr ? "Votre expérience 3M SERVICES" : "Your 3M SERVICES experience"}</h3>
        {saved && !editing && (
          <button type="button" className="account-link-btn" onClick={() => { setEditing(true); setMsg(null); }}>
            {isFr ? "Modifier" : "Edit"}
          </button>
        )}
      </div>

      {editing ? (
        <form onSubmit={submit} className="xr-form">
          <p className="xr-help">
            {isFr ? "Comment évaluez-vous votre expérience globale avec nous ?" : "How would you rate your overall experience?"}
          </p>
          <div className="xr-stars" onMouseLeave={() => setHover(0)} role="radiogroup" aria-label={isFr ? "Note" : "Rating"}>
            {[1, 2, 3, 4, 5].map((n) => (
              <button
                key={n}
                type="button"
                role="radio"
                aria-checked={rating === n}
                aria-label={`${n} / 5`}
                className={`xr-star ${n <= shown ? "is-on" : ""}`}
                onMouseEnter={() => setHover(n)}
                onClick={() => setRating(n)}
              >
                ★
              </button>
            ))}
            <span className="xr-star-label">{shown ? labels[shown] : ""}</span>
          </div>
          <textarea
            className="xr-textarea"
            rows={3}
            maxLength={1500}
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            placeholder={
              needsComment
                ? isFr ? "Qu'est-ce qui n'a pas été à la hauteur ? (obligatoire)" : "What went wrong? (required)"
                : isFr ? "Un commentaire ? (facultatif)" : "Any comment? (optional)"
            }
          />
          <div className="xr-actions">
            <button type="submit" className="account-fav-btn is-primary" disabled={busy}>
              {busy ? (isFr ? "Envoi…" : "Sending…") : isFr ? "Envoyer ma note" : "Submit rating"}
            </button>
            {saved && (
              <button type="button" className="account-link-btn" onClick={() => { setEditing(false); setRating(saved.rating); setComment(saved.comment || ""); setMsg(null); }}>
                {isFr ? "Annuler" : "Cancel"}
              </button>
            )}
          </div>
        </form>
      ) : (
        <div className="xr-summary">
          <div className="xr-stars is-static" aria-label={`${saved.rating} / 5`}>
            {[1, 2, 3, 4, 5].map((n) => (
              <span key={n} className={`xr-star ${n <= saved.rating ? "is-on" : ""}`}>★</span>
            ))}
            <span className="xr-star-label">{labels[saved.rating]}</span>
          </div>
          {saved.comment && <p className="xr-comment">« {saved.comment} »</p>}
          <span className={`xr-status is-${saved.status}`}>
            {saved.status === "resolved"
              ? isFr ? "Traité par l'équipe" : "Handled by our team"
              : saved.status === "in_progress"
              ? isFr ? "En cours de traitement" : "Being handled"
              : isFr ? "Reçu par l'équipe" : "Received by our team"}
          </span>
        </div>
      )}

      {saved?.adminReply && (
        <div className="xr-reply">
          <div className="xr-reply-head">
            <i className="fa-solid fa-headset"></i> {isFr ? "Réponse de 3M SERVICES" : "3M SERVICES reply"}
            {saved.repliedAt && <span>{new Date(saved.repliedAt).toLocaleDateString("fr-FR", { timeZone: "Africa/Douala" })}</span>}
          </div>
          <p>{saved.adminReply}</p>
        </div>
      )}

      {msg && <div className={`xr-msg is-${msg.type}`} role="status">{msg.text}</div>}
    </section>
  );
}
