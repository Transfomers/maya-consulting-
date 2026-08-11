import React, { useState, useEffect, useCallback } from "react";
import { Calendar, dateFnsLocalizer, Views } from "react-big-calendar";
import withDragAndDrop from "react-big-calendar/lib/addons/dragAndDrop";
import { format, parse, startOfWeek, getDay } from "date-fns";
import { enUS } from "date-fns/locale";
import "react-big-calendar/lib/css/react-big-calendar.css";
import "react-big-calendar/lib/addons/dragAndDrop/styles.css";
import api from "@/lib/api";
import { Plus, Search, Filter } from "lucide-react";
import EventModal from "./EventModal";
import { toast } from "sonner";

const locales = {
  "en-US": enUS,
};

const localizer = dateFnsLocalizer({
  format,
  parse,
  startOfWeek,
  getDay,
  locales,
});

const DnDCalendar = withDragAndDrop(Calendar);

export default function AdminEventsList() {
  const [events, setEvents] = useState([]);
  const [view, setView] = useState(Views.MONTH);
  const [date, setDate] = useState(new Date());
  
  // Modal state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState(null);
  
  // Stats
  const [stats, setStats] = useState({ total: 0, upcoming: 0, published: 0, drafts: 0, thisMonth: 0 });

  const fetchEvents = useCallback(async () => {
    try {
      const res = await api.get("/admin/events");
      const formatted = res.data.map((evt) => ({
        ...evt,
        title: evt.translations?.find(t => t.language === 'en')?.title || evt.slug,
        start: new Date(evt.start_date || new Date()),
        end: new Date(evt.end_date || new Date()),
      }));
      setEvents(formatted);
      
      // Calculate basic stats manually for now or fetch from a stats endpoint
      const now = new Date();
      setStats({
        total: formatted.length,
        upcoming: formatted.filter(e => e.start > now).length,
        published: formatted.filter(e => e.status === "published").length,
        drafts: formatted.filter(e => e.status === "draft").length,
        thisMonth: formatted.filter(e => e.start.getMonth() === now.getMonth() && e.start.getFullYear() === now.getFullYear()).length,
      });
    } catch (err) {
      toast.error("Failed to load events");
    }
  }, []);

  useEffect(() => {
    fetchEvents();
  }, [fetchEvents]);

  const handleSelectSlot = ({ start, end }) => {
    setSelectedEvent({ start_date: start, end_date: end, all_day: false, status: "draft" });
    setIsModalOpen(true);
  };

  const handleSelectEvent = (event) => {
    setSelectedEvent(event);
    setIsModalOpen(true);
  };

  const onEventDrop = async ({ event, start, end }) => {
    try {
      await api.patch(`/admin/events/${event.id}/move`, {
        start_date: start.toISOString(),
        end_date: end.toISOString()
      });
      toast.success("Event moved");
      fetchEvents();
    } catch (err) {
      toast.error("Failed to move event");
    }
  };

  const onEventResize = async ({ event, start, end }) => {
    try {
      await api.patch(`/admin/events/${event.id}/move`, {
        start_date: start.toISOString(),
        end_date: end.toISOString()
      });
      toast.success("Event resized");
      fetchEvents();
    } catch (err) {
      toast.error("Failed to resize event");
    }
  };

  const eventStyleGetter = (event) => {
    let backgroundColor = "#1C4532"; // forest
    if (event.status === "draft") backgroundColor = "#A3B18A"; // sage
    if (event.status === "cancelled") backgroundColor = "#E63946"; // red
    
    return {
      style: {
        backgroundColor,
        borderRadius: "4px",
        opacity: 0.9,
        color: "white",
        border: "0",
        display: "block"
      }
    };
  };

  return (
    <div className="space-y-6 h-full flex flex-col min-h-screen">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-heading text-3xl font-black tracking-tight text-forest">Events</h1>
          <p className="text-sm text-sage">Manage and schedule CAP Entrepreneurs events</p>
        </div>
        <div className="flex items-center gap-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-sage" />
            <input 
              type="text" 
              placeholder="Search events..." 
              className="pl-9 pr-4 py-2 border border-forest/15 rounded-none text-sm focus:outline-none focus:border-forest"
            />
          </div>
          <button className="p-2 border border-forest/15 text-forest hover:bg-forest/5">
            <Filter className="h-4 w-4" />
          </button>
          <button
            onClick={() => {
              setSelectedEvent(null);
              setIsModalOpen(true);
            }}
            className="px-4 py-2 text-xs font-bold uppercase tracking-[0.15em] text-bone bg-forest hover:bg-forest/90 transition-colors flex items-center gap-2"
          >
            <Plus className="h-4 w-4" /> Create Event
          </button>
        </div>
      </div>

      {/* Statistics */}
      <div className="grid grid-cols-5 gap-4">
        {[
          { label: "Total Events", value: stats.total },
          { label: "Upcoming", value: stats.upcoming },
          { label: "Published", value: stats.published },
          { label: "Drafts", value: stats.drafts },
          { label: "This Month", value: stats.thisMonth }
        ].map((stat, i) => (
          <div key={i} className="bg-white border border-forest/15 p-4 flex flex-col justify-center">
            <span className="text-xs uppercase tracking-wider font-bold text-sage">{stat.label}</span>
            <span className="font-heading text-2xl font-black text-forest">{stat.value}</span>
          </div>
        ))}
      </div>

      <div className="bg-white border border-forest/15 flex-grow p-4 min-h-[600px] mb-8">
        <DnDCalendar
          localizer={localizer}
          events={events}
          date={date}
          view={view}
          onNavigate={setDate}
          onView={setView}
          selectable
          onSelectSlot={handleSelectSlot}
          onSelectEvent={handleSelectEvent}
          onEventDrop={onEventDrop}
          onEventResize={onEventResize}
          resizable
          style={{ height: "calc(100vh - 350px)" }}
          eventPropGetter={eventStyleGetter}
          popup
        />
      </div>

      {isModalOpen && (
        <EventModal 
          event={selectedEvent} 
          onClose={() => setIsModalOpen(false)} 
          onSaved={fetchEvents}
        />
      )}
    </div>
  );
}
