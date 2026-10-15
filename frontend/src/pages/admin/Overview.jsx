import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import api from "@/lib/api";
import { 
  FileText, CheckCircle2, FileEdit, Clock, 
  FolderTree, Image as ImageIcon, CalendarDays, 
  Download, Users, ArrowUpRight 
} from "lucide-react";

export default function AdminOverview() {
  const [stats, setStats] = useState({ 
    total_articles: 0, 
    published_articles: 0, 
    draft_articles: 0, 
    scheduled_articles: 0,
    total_categories: 0,
    total_media: 0,
    total_events: 0,
    total_resources: 0,
    total_subscribers: 0
  });
  const [loading, setLoading] = useState(true);
  
  useEffect(() => {
    const fetchStats = async () => {
      try {
        const res = await api.get("/admin/stats");
        if (res.data) {
          setStats(res.data);
        }
      } catch (err) {
        console.error("Failed to load stats", err);
      } finally {
        setLoading(false);
      }
    };
    fetchStats();
  }, []);

  const statCards = [
    { label: "Total Articles", value: stats.total_articles, icon: FileText, to: "/admin/posts", color: "text-forest" },
    { label: "Published", value: stats.published_articles, icon: CheckCircle2, to: "/admin/posts", color: "text-emerald-700" },
    { label: "Drafts", value: stats.draft_articles, icon: FileEdit, to: "/admin/posts", color: "text-amber-700" },
    { label: "Scheduled", value: stats.scheduled_articles, icon: Clock, to: "/admin/posts", color: "text-blue-700" },
    { label: "Categories", value: stats.total_categories, icon: FolderTree, to: "/admin/categories", color: "text-forest" },
    { label: "Media Items", value: stats.total_media, icon: ImageIcon, to: "/admin/media", color: "text-forest" },
    { label: "Total Events", value: stats.total_events, icon: CalendarDays, to: "/admin/events", color: "text-forest" },
    { label: "Resources", value: stats.total_resources, icon: Download, to: "/admin/resources", color: "text-maple" },
    { label: "Subscribers", value: stats.total_subscribers, icon: Users, to: "/admin/newsletter", color: "text-forest" },
  ];

  return (
    <div className="space-y-8">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="font-heading text-3xl font-black tracking-tight text-forest">Dashboard Overview</h1>
          <p className="text-sm text-sage mt-1">Real-time CMS statistics, content metrics & database state.</p>
        </div>
        <div className="flex gap-2">
          <Link
            to="/admin/posts/new"
            className="px-4 py-2 bg-forest text-bone text-xs font-bold uppercase tracking-wider hover:bg-forest/90 transition-colors inline-flex items-center gap-1.5"
          >
            <span>+ New Article</span>
          </Link>
          <Link
            to="/admin/resources"
            className="px-4 py-2 bg-maple text-white text-xs font-bold uppercase tracking-wider hover:bg-maple/90 transition-colors inline-flex items-center gap-1.5"
          >
            <span>+ Add Resource</span>
          </Link>
        </div>
      </div>
      
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
        {statCards.map(stat => {
          const Icon = stat.icon;
          return (
            <Link
              key={stat.label}
              to={stat.to}
              className="group bg-white border border-forest/15 p-5 hover:border-forest transition-all flex flex-col justify-between"
            >
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs font-bold uppercase tracking-wider text-sage group-hover:text-forest transition-colors">
                  {stat.label}
                </span>
                <Icon className="h-4 w-4 text-forest/40 group-hover:text-forest transition-colors" />
              </div>
              <div className="flex items-baseline justify-between">
                <p className={`font-heading text-3xl sm:text-4xl font-black ${stat.color}`}>
                  {loading ? "..." : stat.value}
                </p>
                <ArrowUpRight className="h-4 w-4 text-forest/30 group-hover:text-forest group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
              </div>
            </Link>
          );
        })}
      </div>
    </div>
  );
}

