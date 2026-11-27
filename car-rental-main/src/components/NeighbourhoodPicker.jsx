// Recherche de quartier : filtre par nom, autres orthographes et repères ; propose un quartier manquant.
import { useId, useMemo, useState } from "react";

const norm = (s) => String(s || "").toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "").replace(/[^a-z0-9]+/g, " ").trim();

export default function NeighbourhoodPicker({ city, districtId, value, text, onChange, label, error, isFr }) {
  const listId = useId();
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [active, setActive] = useState(0);
  const selected = city?.neighbourhoods.find((n) => n.id === value);
  const shown = open ? query : selected?.name || text || "";

  const matches = useMemo(() => {
    if (!city) return [];
    const q = norm(query);
    return city.neighbourhoods
      .filter((n) => !districtId || n.districtId === Number(districtId))
      .filter((n) => !q || [n.name, ...n.aliases, ...n.landmarks].some((x) => norm(x).includes(q)))
      .slice(0, 40);
  }, [city, districtId, query]);

  const exact = matches.some((n) => norm(n.name) === norm(query));
  const canSuggest = query.trim().length >= 3 && !exact;
  const options = [...matches.map((n) => ({ ...n, kind: "hood" })), ...(canSuggest ? [{ kind: "new", name: query.trim() }] : [])];
  const districtName = (id) => city?.districts.find((d) => d.id === id)?.name || "";

  const pick = (o) => {
    if (!o) return;
    onChange(o.kind === "new" ? { id: null, text: o.name } : { id: o.id, text: "" });
    setOpen(false);
    setQuery("");
  };

  const onKey = (e) => {
    if (e.key === "ArrowDown") { e.preventDefault(); setOpen(true); setActive((i) => Math.min(i + 1, options.length - 1)); }
    else if (e.key === "ArrowUp") { e.preventDefault(); setActive((i) => Math.max(i - 1, 0)); }
    else if (e.key === "Enter" && open) { e.preventDefault(); pick(options[active]); }
    else if (e.key === "Escape") setOpen(false);
  };

  return (
    <div className="rb-field rb-combo">
      <label htmlFor={`${listId}-input`}>{label} *</label>
      <input
        id={`${listId}-input`}
        role="combobox"
        aria-expanded={open}
        aria-controls={listId}
        aria-autocomplete="list"
        aria-invalid={Boolean(error)}
        autoComplete="off"
        disabled={!city}
        placeholder={city ? (isFr ? "Rechercher un quartier…" : "Search a neighbourhood…") : isFr ? "Choisissez d'abord la ville" : "Choose the city first"}
        value={shown}
        onFocus={() => { setOpen(true); setQuery(""); setActive(0); }}
        onBlur={() => setTimeout(() => setOpen(false), 150)}
        onChange={(e) => { setQuery(e.target.value); setOpen(true); setActive(0); }}
        onKeyDown={onKey}
      />
      {open && city && (
        <ul id={listId} role="listbox" className="rb-options">
          {options.length === 0 && <li className="rb-none">{isFr ? "Aucun quartier. Tapez son nom pour le proposer." : "No match. Type its name to suggest it."}</li>}
          {options.map((o, i) => (
            <li
              key={o.kind === "new" ? "new" : o.id}
              role="option"
              aria-selected={i === active}
              className={`${i === active ? "is-active" : ""} ${o.kind === "new" ? "is-new" : ""}`}
              onMouseDown={(e) => { e.preventDefault(); pick(o); }}
              onMouseEnter={() => setActive(i)}
            >
              {o.kind === "new" ? (
                <><i className="fa-solid fa-plus"></i> {isFr ? "Quartier manquant : proposer" : "Missing: suggest"} « {o.name} »</>
              ) : (
                <><span>{o.name}</span><small>{districtName(o.districtId)}</small></>
              )}
            </li>
          ))}
        </ul>
      )}
      {!open && text && !value && <span className="rb-note">{isFr ? "Nouveau quartier, à confirmer par notre équipe." : "New area, to be confirmed by our team."}</span>}
      {error && <span className="rb-error" role="alert">{error}</span>}
    </div>
  );
}
