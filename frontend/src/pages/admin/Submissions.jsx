import { useEffect, useMemo, useState } from "react";
import api from "@/lib/api";
import { toast } from "sonner";

const TYPES = ["contact", "membership", "volunteer", "pledge", "application", "partner"];

export default function AdminSubmissions() {
  const [submissions, setSubmissions] = useState([]);
  const [type, setType] = useState("All");
  const [selected, setSelected] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      try {
        setLoading(true);
        const res = await api.get("/submissions/");
        setSubmissions(res.data?.submissions || []);
      } catch (err) {
        toast.error(err.response?.data?.detail || "Failed to load submissions");
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  const filtered = useMemo(
    () => (type === "All" ? submissions : submissions.filter((s) => s.type === type)),
    [submissions, type]
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="font-heading text-3xl font-black tracking-tight text-forest">Submissions</h1>
          <p className="text-sm text-sage mt-1">Inbound forms from the public site. Nothing here is emailed.</p>
        </div>
        <select
          value={type}
          onChange={(e) => setType(e.target.value)}
          className="border border-forest/20 px-4 py-2 text-sm bg-white"
        >
          <option value="All">All types</option>
          {TYPES.map((t) => (
            <option key={t} value={t}>{t}</option>
          ))}
        </select>
      </div>

      {loading ? (
        <p className="text-sage text-sm">Loading…</p>
      ) : (
        <div className="grid gap-6 lg:grid-cols-5">
          <div className="lg:col-span-3 overflow-x-auto border border-forest/15 bg-white">
            <table className="w-full text-left text-sm">
              <thead className="bg-forest/5 text-xs uppercase tracking-wider font-bold text-forest border-b border-forest/10">
                <tr>
                  <th className="px-4 py-3">Type</th>
                  <th className="px-4 py-3">Name</th>
                  <th className="px-4 py-3">Email</th>
                  <th className="px-4 py-3">Received</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-forest/5">
                {filtered.map((s) => (
                  <tr
                    key={s.id}
                    onClick={() => setSelected(s)}
                    className={`cursor-pointer hover:bg-forest/5 ${selected?.id === s.id ? "bg-forest/5" : ""}`}
                  >
                    <td className="px-4 py-3 font-bold uppercase text-[10px] tracking-wider text-forest">{s.type}</td>
                    <td className="px-4 py-3 text-forest">{s.payload?.name || "—"}</td>
                    <td className="px-4 py-3 text-sage">{s.payload?.email || "—"}</td>
                    <td className="px-4 py-3 text-sage">{s.created_at ? new Date(s.created_at).toLocaleString() : "—"}</td>
                  </tr>
                ))}
                {filtered.length === 0 && (
                  <tr>
                    <td colSpan={4} className="px-4 py-8 text-center text-sage">No submissions.</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
          <div className="lg:col-span-2 border border-forest/15 bg-white p-6">
            {selected ? (
              <div className="space-y-4">
                <h2 className="font-heading text-xl font-bold text-forest">{selected.payload?.name || "Submission"}</h2>
                <p className="text-xs font-bold uppercase tracking-widest text-sage">{selected.type}</p>
                <dl className="space-y-3 text-sm">
                  {Object.entries(selected.payload || {}).map(([key, value]) => (
                    <div key={key}>
                      <dt className="text-[10px] font-bold uppercase tracking-wider text-sage">{key}</dt>
                      <dd className="text-forest whitespace-pre-wrap">{String(value ?? "")}</dd>
                    </div>
                  ))}
                </dl>
              </div>
            ) : (
              <p className="text-sm text-sage">Select a row to read the full message.</p>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
