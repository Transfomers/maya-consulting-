import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import api from "@/lib/api";
import { Plus, Edit } from "lucide-react";

export default function AdminEventsList() {
  const [events, setEvents] = useState([]);

  useEffect(() => {
    const fetchEvents = async () => {
      try {
        const res = await api.get("/admin/events");
        setEvents(res.data);
      } catch (err) {
        console.error("Failed to load events", err);
      }
    };
    fetchEvents();
  }, []);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="font-heading text-3xl font-black tracking-tight text-forest">Events</h1>
        <button
          className="px-4 py-2 text-xs font-bold uppercase tracking-[0.15em] text-bone bg-forest hover:bg-forest/90 transition-colors flex items-center gap-2"
        >
          <Plus className="h-4 w-4" /> New Event
        </button>
      </div>

      <div className="bg-white border border-forest/15">
        <table className="w-full text-left text-sm">
          <thead className="bg-bone border-b border-forest/15 text-xs font-bold uppercase tracking-wider text-sage">
            <tr>
              <th className="px-6 py-4">Title</th>
              <th className="px-6 py-4">Status</th>
              <th className="px-6 py-4">Date</th>
              <th className="px-6 py-4 text-right">Actions</th>
            </tr>
          </thead>
          <tbody>
            {events.length === 0 ? (
              <tr>
                <td colSpan="4" className="px-6 py-8 text-center text-sage">
                  No events found.
                </td>
              </tr>
            ) : (
              events.map((evt) => (
                <tr key={evt.id} className="border-b border-forest/5 hover:bg-bone/50 transition-colors">
                  <td className="px-6 py-4 font-bold text-forest">
                    {evt.translations.find(t => t.language === 'en')?.title || evt.slug}
                  </td>
                  <td className="px-6 py-4">
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-forest/10 text-forest capitalize">
                      {evt.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-sage">
                    {new Date(evt.start_date).toLocaleDateString()}
                  </td>
                  <td className="px-6 py-4 text-right">
                    <button className="text-sage hover:text-forest transition-colors">
                      <Edit className="h-4 w-4" />
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
