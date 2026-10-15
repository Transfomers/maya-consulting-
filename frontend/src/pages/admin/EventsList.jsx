import React, { useState, useEffect, useCallback } from "react";
import { Calendar, dateFnsLocalizer, Views } from "react-big-calendar";
import withDragAndDrop from "react-big-calendar/lib/addons/dragAndDrop";
import { format, parse, startOfWeek, getDay } from "date-fns";
import { enUS } from "date-fns/locale";
import "react-big-calendar/lib/css/react-big-calendar.css";
import "react-big-calendar/lib/addons/dragAndDrop/styles.css";
import api from "@/lib/api";
import { Plus, Search, Filter, CalendarDays, Clock, CheckCircle, FileEdit, TrendingUp } from "lucide-react";
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
  const [searchQuery, setSearchQuery] = useState("");
  const [showSearch, setShowSearch] = useState(false);

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
        title: evt.translations?.find(t => t.language === 'fr')?.title || evt.translations?.find(t => t.language === 'en')?.title || evt.translations?.[0]?.title || evt.slug,
        start: new Date(evt.start_date || new Date()),
        end: new Date(evt.end_date || new Date()),
      }));
      setEvents(formatted);

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
    let backgroundColor = "#1C4532";
    if (event.status === "draft") backgroundColor = "#A3B18A";
    if (event.status === "cancelled") backgroundColor = "#E63946";

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

  const statCards = [
    { label: "Total", value: stats.total, icon: CalendarDays, color: "text-forest" },
    { label: "Upcoming", value: stats.upcoming, icon: TrendingUp, color: "text-maple" },
    { label: "Published", value: stats.published, icon: CheckCircle, color: "text-green-600" },
    { label: "Drafts", value: stats.drafts, icon: FileEdit, color: "text-amber-600" },
    { label: "This Month", value: stats.thisMonth, icon: Clock, color: "text-sage" },
  ];

  const filteredEvents = searchQuery
    ? events.filter(e => e.title?.toLowerCase().includes(searchQuery.toLowerCase()))
    : events;

  return (
    <div className="space-y-4 sm:space-y-6 h-full flex flex-col">
      {/* Page Header */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="font-heading text-2xl sm:text-3xl font-black tracking-tight text-forest">Events</h1>
          <p className="text-sm text-sage">Manage and schedule CAP Entrepreneurs events</p>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-2 flex-wrap">
          {/* Search — expandable on mobile */}
          <div className={`relative transition-all duration-300 ${showSearch ? "w-full sm:w-auto" : "w-auto"}`}>
            {showSearch ? (
              <div className="flex items-center gap-2 w-full sm:w-64">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-sage pointer-events-none" />
                  <input
                    type="text"
                    autoFocus
                    value={searchQuery}
                    onChange={e => setSearchQuery(e.target.value)}
                    placeholder="Search events..."
                    className="w-full pl-9 pr-3 py-2 border border-forest/15 text-sm focus:outline-none focus:border-forest bg-white"
                  />
                </div>
                <button
                  onClick={() => { setShowSearch(false); setSearchQuery(""); }}
                  className="text-sage hover:text-forest text-xs font-bold uppercase tracking-wider whitespace-nowrap"
                >
                  Clear
                </button>
              </div>
            ) : (
              <button
                onClick={() => setShowSearch(true)}
                className="p-2 border border-forest/15 text-forest hover:bg-forest/5 transition-colors"
                aria-label="Search"
              >
                <Search className="h-4 w-4" />
              </button>
            )}
          </div>

          <button className="p-2 border border-forest/15 text-forest hover:bg-forest/5 transition-colors" aria-label="Filter">
            <Filter className="h-4 w-4" />
          </button>

          <button
            onClick={() => {
              setSelectedEvent(null);
              setIsModalOpen(true);
            }}
            className="px-3 py-2 sm:px-4 text-xs font-bold uppercase tracking-[0.15em] text-bone bg-forest hover:bg-forest/90 transition-colors flex items-center gap-2 whitespace-nowrap"
          >
            <Plus className="h-4 w-4" />
            <span className="hidden xs:inline">Create Event</span>
            <span className="xs:hidden">New</span>
          </button>
        </div>
      </div>

      {/* Statistics — 2 cols on mobile, 5 on desktop */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
        {statCards.map((stat, i) => (
          <div key={i} className="bg-white border border-forest/15 p-3 sm:p-4 flex items-center gap-3">
            <stat.icon className={`h-5 w-5 flex-shrink-0 ${stat.color}`} />
            <div className="min-w-0">
              <span className="text-[10px] sm:text-xs uppercase tracking-wider font-bold text-sage block truncate">{stat.label}</span>
              <span className="font-heading text-xl sm:text-2xl font-black text-forest">{stat.value}</span>
            </div>
          </div>
        ))}
      </div>

      {/* Calendar */}
      <div className="bg-white border border-forest/15 flex-grow p-2 sm:p-4 min-h-[400px] mb-6 overflow-hidden">
        {/* View switcher for mobile */}
        <div className="flex gap-1 mb-3 sm:hidden">
          {[Views.MONTH, Views.WEEK, Views.DAY, Views.AGENDA].map(v => (
            <button
              key={v}
              onClick={() => setView(v)}
              className={`flex-1 py-1 text-[10px] font-bold uppercase tracking-wide transition-colors ${view === v ? "bg-forest text-bone" : "border border-forest/15 text-forest"}`}
            >
              {v.charAt(0).toUpperCase() + v.slice(1)}
            </button>
          ))}
        </div>

        <DnDCalendar
          localizer={localizer}
          events={filteredEvents}
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
          style={{ height: "clamp(400px, calc(100vh - 380px), 800px)" }}
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
