import React, { useEffect, useState } from "react";
import api from "@/lib/api";
import { toast } from "sonner";
import { Search, Filter, Eye, X } from "lucide-react";

export default function AdminSubmissions() {
  const [submissions, setSubmissions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState("");
  const [selectedSubmission, setSelectedSubmission] = useState(null);

  useEffect(() => {
    fetchSubmissions();
  }, [typeFilter]);

  const fetchSubmissions = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (typeFilter) params.append("type", typeFilter);
      
      const res = await api.get(`/submissions?${params.toString()}`);
      setSubmissions(res.data?.submissions || []);
    } catch (err) {
      console.error(err);
      toast.error("Failed to fetch submissions");
    } finally {
      setLoading(false);
    }
  };

  const filteredSubmissions = submissions.filter((sub) => {
    if (!search) return true;
    const s = search.toLowerCase();
    const name = sub.payload?.name?.toLowerCase() || "";
    const email = sub.payload?.email?.toLowerCase() || "";
    return name.includes(s) || email.includes(s) || sub.type.toLowerCase().includes(s);
  });

  const getName = (sub) => sub.payload?.name || "Unknown";
  const getEmail = (sub) => sub.payload?.email || "Unknown";

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="font-heading text-3xl font-black tracking-tight text-forest">Submissions</h1>
      </div>

      <div className="flex flex-col sm:flex-row gap-4 mb-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-sage" />
          <input 
            type="text" 
            placeholder="Search by name or email..." 
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-forest/15 bg-white text-sm focus:outline-none focus:border-forest"
          />
        </div>
        <div className="relative w-full sm:w-64">
          <Filter className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-sage" />
          <select 
            value={typeFilter}
            onChange={e => setTypeFilter(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-forest/15 bg-white text-sm focus:outline-none focus:border-forest appearance-none cursor-pointer"
          >
            <option value="">All Types</option>
            <option value="application">Program Application</option>
            <option value="membership">Membership</option>
            <option value="partner">Partnership</option>
            <option value="volunteer">Volunteer</option>
            <option value="donate">Donation Pledge</option>
            <option value="contact">Contact Message</option>
          </select>
        </div>
      </div>

      <div className="bg-white border border-forest/15 overflow-hidden">
        <table className="w-full text-left text-sm text-forest">
          <thead className="border-b border-forest/15 bg-bone/50 text-xs uppercase tracking-wider text-sage">
            <tr>
              <th className="px-6 py-4 font-bold">Name</th>
              <th className="px-6 py-4 font-bold">Email</th>
              <th className="px-6 py-4 font-bold">Type</th>
              <th className="px-6 py-4 font-bold">Date</th>
              <th className="px-6 py-4 font-bold text-right">Details</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-forest/15">
            {loading ? (
              <tr><td colSpan="5" className="px-6 py-8 text-center text-sage">Loading...</td></tr>
            ) : filteredSubmissions.length === 0 ? (
              <tr><td colSpan="5" className="px-6 py-8 text-center text-sage">No submissions found.</td></tr>
            ) : filteredSubmissions.map((sub) => (
              <tr key={sub.id} className="hover:bg-bone/30">
                <td className="px-6 py-4 font-medium">{getName(sub)}</td>
                <td className="px-6 py-4">{getEmail(sub)}</td>
                <td className="px-6 py-4">
                  <span className="inline-block px-2 py-1 text-xs font-bold uppercase tracking-wider bg-forest/10 text-forest">
                    {sub.type}
                  </span>
                </td>
                <td className="px-6 py-4 text-sage">{new Date(sub.created_at).toLocaleString()}</td>
                <td className="px-6 py-4 text-right">
                  <button 
                    onClick={() => setSelectedSubmission(sub)} 
                    className="inline-block text-forest hover:text-maple transition-colors"
                  >
                    <Eye className="h-4 w-4" />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {selectedSubmission && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-2xl bg-white p-6 shadow-xl relative max-h-[90vh] overflow-y-auto border border-forest/20">
            <button 
              onClick={() => setSelectedSubmission(null)}
              className="absolute top-4 right-4 text-sage hover:text-forest transition-colors"
            >
              <X className="h-6 w-6" />
            </button>
            <h2 className="font-heading text-2xl font-black text-forest mb-6 uppercase tracking-tight">
              {selectedSubmission.type} Submission
            </h2>
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="bg-bone/30 p-4 border border-forest/10">
                  <p className="text-xs uppercase tracking-wider text-sage font-bold mb-1">Date Submitted</p>
                  <p className="text-forest font-medium">{new Date(selectedSubmission.created_at).toLocaleString()}</p>
                </div>
                <div className="bg-bone/30 p-4 border border-forest/10">
                  <p className="text-xs uppercase tracking-wider text-sage font-bold mb-1">Submission ID</p>
                  <p className="text-forest font-medium text-xs break-all">{selectedSubmission.id}</p>
                </div>
              </div>
              
              <div className="mt-6 border-t border-forest/10 pt-6">
                <h3 className="text-sm uppercase tracking-wider text-sage font-bold mb-4">Submission Details</h3>
                <div className="space-y-3">
                  {Object.entries(selectedSubmission.payload).map(([key, value]) => (
                    <div key={key} className="flex flex-col sm:flex-row sm:gap-4 border-b border-forest/5 pb-3">
                      <span className="w-1/3 text-xs uppercase tracking-wider font-bold text-forest/70">
                        {key.replace(/([A-Z])/g, ' $1').trim()}
                      </span>
                      <span className="w-2/3 text-sm text-forest font-medium break-words">
                        {value === null || value === undefined ? "-" : value.toString()}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
