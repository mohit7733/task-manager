import { useEffect, useMemo, useState } from "react";
import { useParams } from "react-router-dom";
import FullCalendar from "@fullcalendar/react";
import dayGridPlugin from "@fullcalendar/daygrid";
import { motion, AnimatePresence } from "framer-motion";
import { CalendarDays, X, Tag, AlertCircle, Shield, Eye } from "lucide-react";
import publicClient from "../api/publicClient";
import LoadingSpinner from "../components/LoadingSpinner";
import { fmtDate } from "../utils/format";
import { APP_NAME, brand } from "../utils/theme";

const KIND_LABELS = {
  task: "Meeting task created",
  initial: "First meeting",
  meeting: "Scheduled meeting",
  followup: "Next followup",
};

const KIND_COLORS = {
  task: "#6366f1",
  initial: "#8b5cf6",
  meeting: "#3b82f6",
  followup: "#0ea5e9",
};

const LEGEND = [
  { color: "#8b5cf6", label: "First meeting" },
  { color: "#3b82f6", label: "Scheduled meeting" },
  { color: "#0ea5e9", label: "Followup from remarks" },
  { color: "#6366f1", label: "Meeting task date" },
];

export default function PublicCalendarPage() {
  const { token } = useParams();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [events, setEvents] = useState([]);
  const [selected, setSelected] = useState(null);

  useEffect(() => {
    let active = true;
    publicClient
  .get(`/public/share/${token}`)   // was `/share/${token}`
  .then(({ data }) => {
        if (!active) return;
        if (data.type !== "calendar") {
          setError("This link does not point to a calendar view.");
          return;
        }
        setEvents(data.events || []);
      })
      .catch((err) => {
        if (!active) return;
        setError(err.response?.data?.message || "This share link is invalid or has expired.");
      })
      .finally(() => active && setLoading(false));
    return () => {
      active = false;
    };
  }, [token]);

  useEffect(() => {
    document.title = `Meeting Calendar · ${APP_NAME}`;
  }, []);

  const fcEvents = useMemo(
    () =>
      events.map((e) => ({
        id: e.id,
        title: e.title,
        start: e.date,
        allDay: true, // no time shown, ever
        backgroundColor: KIND_COLORS[e.kind] || "#64748b",
        borderColor: KIND_COLORS[e.kind] || "#64748b",
        extendedProps: e,
      })),
    [events]
  );

  const onEventClick = (info) => {
    setSelected(info.event.extendedProps);
  };

  return (
    <div className="min-h-screen bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-indigo-100/80 via-slate-50 to-white dark:from-indigo-950/40 dark:via-slate-950 dark:to-slate-950">
      <header className="sticky top-0 z-30 border-b border-slate-200/80 bg-white/85 px-4 py-3 backdrop-blur-xl dark:border-slate-800 dark:bg-slate-900/85 sm:px-6">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className={`flex h-10 w-10 items-center justify-center rounded-xl text-sm font-bold text-white shadow-md ${brand.gradient}`}>
              EF
            </div>
            <div>
              <p className="text-sm font-bold text-slate-900 dark:text-white">{APP_NAME}</p>
              <p className="text-xs text-slate-500">Meeting calendar · read-only</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <span className="hidden items-center gap-1.5 rounded-full bg-slate-100 px-3 py-1.5 text-xs font-medium text-slate-600 dark:bg-slate-800 dark:text-slate-300 sm:inline-flex">
              <Shield className="h-3.5 w-3.5" />
              Read-only access
            </span>
            <span className={`rounded-full px-3 py-1.5 text-xs font-semibold ${brand.chipInactive}`}>
              <Eye className="mr-1 inline h-3.5 w-3.5" />
              Guest
            </span>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-4 py-6 sm:px-6 sm:py-8">
        {loading ? (
          <div className={`flex min-h-[60vh] items-center justify-center ${brand.card}`}>
            <LoadingSpinner label="Loading calendar…" />
          </div>
        ) : error ? (
          <div className="overflow-hidden rounded-2xl border border-red-200 bg-white shadow-lg dark:border-red-900 dark:bg-slate-900">
            <div className="bg-gradient-to-r from-red-500 to-rose-600 px-6 py-8 text-center text-white">
              <AlertCircle className="mx-auto mb-3 h-10 w-10" />
              <h1 className="text-xl font-bold">Link unavailable</h1>
            </div>
            <div className="px-6 py-8 text-center">
              <p className="text-sm leading-relaxed text-slate-600 dark:text-slate-300">{error}</p>
            </div>
          </div>
        ) : (
          <div className="space-y-5">
            <div className={brand.legendBar}>
              {LEGEND.map((l) => (
                <span key={l.label} className="inline-flex items-center gap-2 text-xs text-slate-600 dark:text-slate-400">
                  <span className="h-3 w-3 rounded-sm" style={{ backgroundColor: l.color }} />
                  {l.label}
                </span>
              ))}
            </div>

            <div className={`${brand.card} p-4 [&_.fc]:text-sm`}>
              <FullCalendar
                plugins={[dayGridPlugin]}
                initialView="dayGridMonth"
                editable={false}
                droppable={false}
                selectable={false}
                events={fcEvents}
                eventClick={onEventClick}
                height="auto"
                headerToolbar={{ left: "prev,next today", center: "title", right: "" }}
                dayMaxEventRows={3}
                moreLinkClick="popover"
                eventDisplay="block"
              />
            </div>

            <p className="text-center text-xs text-slate-400">Showing {fcEvents.length} event(s)</p>
          </div>
        )}
      </main>

      <footer className="border-t border-slate-200/80 py-6 text-center dark:border-slate-800">
        <p className="text-xs text-slate-500">
          Powered by <span className="font-semibold text-slate-700 dark:text-slate-300">{APP_NAME}</span> · View-only guest portal
        </p>
      </footer>

      <AnimatePresence>
        {selected && (
          <div className="fixed inset-0 z-[200] flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-slate-900/50 backdrop-blur-sm"
              onClick={() => setSelected(null)}
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.96 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.96 }}
              className="relative z-10 w-full max-w-md overflow-hidden rounded-2xl bg-white shadow-2xl dark:bg-slate-900"
              onClick={(e) => e.stopPropagation()}
            >
              <div className={brand.modalHeader}>
                <div className="flex justify-between gap-3">
                  <div>
                    <p className="text-xs font-medium uppercase tracking-wide text-indigo-200">
                      {KIND_LABELS[selected.kind] || selected.label}
                    </p>
                    <h3 className="text-lg font-bold">{selected.title}</h3>
                  </div>
                  <button type="button" onClick={() => setSelected(null)} className="rounded-lg p-1 hover:bg-white/20">
                    <X className="h-5 w-5" />
                  </button>
                </div>
              </div>
              <div className="space-y-3 px-5 py-4 text-sm">
                <p className="flex items-center gap-2 text-slate-600 dark:text-slate-400">
                  <CalendarDays className="h-4 w-4" />
                  {fmtDate(selected.date, "EEEE, d MMM yyyy")}
                </p>
                <div className="flex flex-wrap gap-2">
                  <span className="rounded-md bg-slate-100 px-2 py-0.5 text-xs font-medium dark:bg-slate-800">
                    {selected.status}
                  </span>
                  {selected.meeting_type && (
                    <span className="rounded-md bg-slate-100 px-2 py-0.5 text-xs capitalize dark:bg-slate-800">
                      {selected.meeting_type}
                    </span>
                  )}
                </div>
              </div>
              <div className={brand.modalFooter}>
                <button type="button" onClick={() => setSelected(null)} className={`flex-1 py-2.5 ${brand.btnSecondary}`}>
                  Close
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}