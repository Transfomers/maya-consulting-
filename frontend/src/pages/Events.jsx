import { useState, useEffect } from "react";
import { useLang } from "@/lib/i18n";
import api from "@/lib/api";
import { Reveal } from "@/components/motion";
import { Link } from "react-router-dom";
import { Calendar, MapPin } from "lucide-react";

export default function Events() {
  const { lang } = useLang();
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchEvents = async () => {
      try {
        const res = await api.get(`/events?lang=${lang || "fr"}`);
        if (res.data && Array.isArray(res.data)) {
          setEvents(res.data);
        } else {
          setEvents([]);
        }
      } catch (err) {
        console.error("Failed to fetch events", err);
        setEvents([]);
      } finally {
        setLoading(false);
      }
    };
    fetchEvents();
  }, [lang]);

  return (
    <div className="bg-bone min-h-screen pt-32 pb-24" data-testid="events-page">
      <div className="mx-auto max-w-[1200px] px-5">
        <Reveal>
          <h1 className="font-heading text-4xl md:text-5xl lg:text-7xl font-black tracking-tight text-forest mb-6">
            {lang === "fr" ? "Événements & Ateliers" : lang === "ar" ? "الفعاليات وورش العمل" : "Events & Workshops"}
          </h1>
          <p className="max-w-[600px] text-lg text-sage">
            {lang === "fr" 
              ? "Rejoignez nos prochains événements, hackathons et ateliers pour accélérer votre parcours entrepreneurial."
              : lang === "ar"
              ? "انضم إلى فعالياتنا القادمة وورش العمل لتسريع مسارك الريادي."
              : "Join our upcoming events, hackathons, and workshops designed to accelerate your entrepreneurial journey."}
          </p>
        </Reveal>

        <div className="mt-16 grid gap-8 md:grid-cols-2 lg:grid-cols-3">
          {loading ? (
            <div className="col-span-full py-12 text-center text-sage">
              {lang === "fr" ? "Chargement des événements..." : "Loading events..."}
            </div>
          ) : events.length === 0 ? (
            <div className="col-span-full py-12 text-center text-sage">
              {lang === "fr" ? "Aucun événement prévu pour le moment. Revenez bientôt !" : "No upcoming events at this time. Check back later!"}
            </div>
          ) : (
            events.map((evt, i) => {
              const title = evt.title || evt.translations?.find(t => t.language === lang)?.title || evt.translations?.[0]?.title || evt.slug;
              const excerpt = evt.excerpt || evt.translations?.find(t => t.language === lang)?.excerpt || evt.translations?.[0]?.excerpt || "";
              
              return (
                <Reveal key={evt.id} delay={0.1 * i}>
                  <div className="group flex h-full flex-col bg-white border border-forest/15 hover:border-forest transition-colors">
                    <div className="aspect-[4/3] bg-forest/5 flex items-center justify-center border-b border-forest/15 overflow-hidden">
                       {evt.featured_image_id ? (
                          <img src={`/api/v1/admin/media/${evt.featured_image_id}`} alt={title} className="w-full h-full object-cover" />
                       ) : (
                          <img src="/assets/images/cap_ecosystem_collaboration.webp" alt={title} className="w-full h-full object-cover" />
                       )}
                    </div>
                    <div className="flex flex-1 flex-col p-6">
                      <div className="flex flex-col gap-2 mb-4">
                        <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-maple">
                          <Calendar className="h-4 w-4" />
                          <span>{new Date(evt.start_date).toLocaleDateString()}</span>
                        </div>
                        {evt.location && (
                          <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-sage">
                            <MapPin className="h-4 w-4" />
                            <span>{evt.location}</span>
                          </div>
                        )}
                      </div>
                      <h3 className="mb-3 font-heading text-xl font-bold text-forest">
                        <Link to={`/events/${evt.slug}`} className="hover:text-maple transition-colors">
                          {trans.title}
                        </Link>
                      </h3>
                      <p className="mb-6 text-sm text-sage line-clamp-3 flex-1">
                        {trans.excerpt}
                      </p>
                      <Link 
                        to={`/events/${evt.slug}`}
                        className="inline-flex items-center text-xs font-bold uppercase tracking-[0.15em] text-forest hover:text-maple transition-colors"
                      >
                        Learn More →
                      </Link>
                    </div>
                  </div>
                </Reveal>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}
