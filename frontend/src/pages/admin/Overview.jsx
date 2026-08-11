import { useEffect, useState } from "react";
import api from "@/lib/api";

export default function AdminOverview() {
  const [stats, setStats] = useState({ 
    total_articles: 0, 
    published_articles: 0, 
    draft_articles: 0, 
    scheduled_articles: 0,
    total_categories: 0,
    total_media: 0,
    total_events: 0
  });
  
  useEffect(() => {
    const fetchStats = async () => {
      try {
        const res = await api.get("/admin/stats");
        if (res.data) {
          setStats(res.data);
        }
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
          { label: "Total Articles", value: stats.total_articles },
          { label: "Published", value: stats.published_articles },
          { label: "Drafts", value: stats.draft_articles },
          { label: "Scheduled", value: stats.scheduled_articles },
          { label: "Categories", value: stats.total_categories },
          { label: "Media Items", value: stats.total_media },
          { label: "Total Events", value: stats.total_events },
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
