// Un seul champ « lieu » : recherche parmi les quartiers de toutes les villes (nom, autres orthographes,
// repères). Un quartier manquant peut être proposé pour la ville choisie.
import { useId, useMemo, useState } from "react";

const norm = (s) => String(s || "").toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "").replace(/[^a-z0-9]+/g, " ").trim();

export default function NeighbourhoodPicker({ cities, place, onChange, id, placeholder, error, isFr }) {
  const listId = useId();
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [active, setActive] = useState(0);

  const city = cities.find((c) => c.id === Number(place.cityId));
  const hood = city?.neighbourhoods.find((n) => n.id === place.neighbourhoodId)?.name || place.neighbourhoodText;
  const label = hood ? `${hood}, ${city?.name}` : "";

  const options = useMemo(() => {
    const q = norm(query);
    const found = [];
    cities.forEach((c) => {
      c.neighbourhoods.forEach((n) => {
        if (!q || [n.name, `${n.name} ${c.name}`, c.name, ...n.aliases, ...n.landmarks].some((x) => norm(x).includes(q))) {
          found.push({ key: n.id, kind: "hood", name: n.name, cityId: c.id, cityName: c.name, id: n.id,
            hint: c.districts.find((d) => d.id === n.districtId)?.name || c.name });
        }
      });
    });
    const list = found.slice(0, 60);
    if (q.length >= 3 && !found.some((o) => norm(o.name) === q)) {
      cities.forEach((c) => list.push({ key: `new-${c.id}`, kind: "new", name: query.trim(), cityId: c.id, cityName: c.name }));
    }
    return list;
  }, [cities, query]);

  const pick = (o) => {
    if (!o) return;
    onChange({ cityId: String(o.cityId), neighbourhoodId: o.kind === "new" ? null : o.id, neighbourhoodText: o.kind === "new" ? o.name : "" });
    setOpen(false);
    setQuery("");
  };

  const onKey = (e) => {
    if (e.key === "ArrowDown") { e.preventDefault(); setOpen(true); setActive((i) => Math.min(i + 1, options.length - 1)); }
    else if (e.key === "ArrowUp") { e.preventDefault(); setActive((i) => Math.max(i - 1, 0)); }
    else if (e.key === "Enter" && open) { e.preventDefault(); pick(options[active]); }
    else if (e.key === "Escape") { setOpen(false); e.target.blur(); }
  };

  return (
    <div className="bk-combo">
      <input
        id={id}
        className="bk-control"
        role="combobox"
        aria-expanded={open}
        aria-controls={listId}
        aria-autocomplete="list"
        aria-invalid={Boolean(error)}
        autoComplete="off"
        placeholder={placeholder}
        value={open ? query : label}
        onFocus={() => { setOpen(true); setQuery(""); setActive(0); }}
        onBlur={() => setTimeout(() => setOpen(false), 150)}
        onChange={(e) => { setQuery(e.target.value); setOpen(true); setActive(0); }}
        onKeyDown={onKey}
      />
      <i className="fa-solid fa-chevron-down bk-chevron" aria-hidden="true"></i>
      {open && (
        <ul id={listId} role="listbox" className="bk-options">
          {options.length === 0 && <li className="is-none">{isFr ? "Tapez le nom du quartier" : "Type the neighbourhood name"}</li>}
          {options.map((o, i) => (
            <li
              key={o.key}
              role="option"
              aria-selected={i === active}
              className={`${i === active ? "is-active" : ""} ${o.kind === "new" ? "is-new" : ""}`}
              onMouseDown={(e) => { e.preventDefault(); pick(o); }}
              onMouseEnter={() => setActive(i)}
            >
              {o.kind === "new" ? (
                <span>+ {isFr ? "Proposer" : "Suggest"} « {o.name} » — {o.cityName}</span>
              ) : (
                <>
                  <span>{o.name}, {o.cityName}</span>
                  <small>{o.hint}</small>
                </>
              )}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
