/**
 * Pièce jointe d'un message de chat envoyé par la conciergerie : photo, position ou contact.
 */
export default function ChatAttachment({ attachment }) {
  if (!attachment || !attachment.type) return null;
  const card = {
    display: "flex", alignItems: "center", gap: "10px", marginTop: "6px",
    padding: "8px 12px 8px 8px", borderRadius: "12px", background: "#f9fafb",
    border: "1px solid #eaecf0", color: "#101828", textDecoration: "none", minWidth: "210px",
  };
  const ico = (bg) => ({
    width: 36, height: 36, flex: "0 0 36px", borderRadius: "50%", background: bg, color: "#fff",
    display: "inline-flex", alignItems: "center", justifyContent: "center", fontSize: "15px",
  });

  if (attachment.type === "image" && /^https?:\/\//.test(attachment.url || "")) {
    return (
      <a href={attachment.url} target="_blank" rel="noreferrer" style={{ display: "block", marginTop: 6, borderRadius: 12, overflow: "hidden", maxWidth: 240 }}>
        <img src={attachment.url} alt="Pièce jointe 3M SERVICES" loading="lazy" style={{ width: "100%", maxHeight: 240, objectFit: "cover", display: "block" }} />
      </a>
    );
  }
  if (attachment.type === "location") {
    const q = `${Number(attachment.lat)},${Number(attachment.lng)}`;
    return (
      <a href={`https://www.google.com/maps?q=${q}`} target="_blank" rel="noreferrer" style={card}>
        <span style={ico("#12b76a")}><i className="fa-solid fa-location-dot" style={{ color: "#fff" }}></i></span>
        <span>
          <strong style={{ display: "block", fontSize: 13 }}>{attachment.label || "Position partagée"}</strong>
          <small style={{ color: "#667085", fontSize: 11.5 }}>Ouvrir dans Maps</small>
        </span>
      </a>
    );
  }
  if (attachment.type === "contact") {
    return (
      <a href={`tel:${String(attachment.phone || "").replace(/\s/g, "")}`} style={card}>
        <span style={ico("#2e90fa")}><i className="fa-solid fa-user" style={{ color: "#fff" }}></i></span>
        <span>
          <strong style={{ display: "block", fontSize: 13 }}>{attachment.name}</strong>
          <small style={{ color: "#667085", fontSize: 11.5 }}>{attachment.phone}</small>
        </span>
      </a>
    );
  }
  return null;
}
