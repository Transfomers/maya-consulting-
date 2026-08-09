import { useEffect, useState } from "react";
import api from "@/lib/api";

export default function AdminOverview() {
  const [stats, setStats] = useState({ articles: 0, published: 0, drafts: 0, views: 0 });
  
  useEffect(() => {
    // In a real app we'd fetch this from a /stats endpoint
    // For now we'll fetch posts and calculate
    const fetchStats = async () => {
      try {
        const res = await api.get("/v1/admin/posts");
        const posts = res.data || [];
        setStats({
          articles: posts.length,
          published: posts.filter(p => p.status === 'published').length,
          drafts: posts.filter(p => p.status === 'draft').length,
          views: 12480, // Mocked as requested
        });
      } catch (err) {
        console.error("Failed to load stats", err);
      }
    };
    fetchStats();
  }, []);

  return (
    <div className="space-y-8">
      <h1 className="font-heading text-3xl font-black tracking-tight text-forest">Dashboard</h1>
      
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: "Total Articles", value: stats.articles },
          { label: "Published", value: stats.published },
          { label: "Drafts", value: stats.drafts },
          { label: "Views", value: stats.views.toLocaleString() },
        ].map(stat => (
          <div key={stat.label} className="bg-white border border-forest/15 p-6">
            <h3 className="text-sm font-bold uppercase tracking-widest text-sage mb-2">{stat.label}</h3>
            <p className="font-heading text-4xl font-black text-forest">{stat.value}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
