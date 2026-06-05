import { useEffect, useMemo, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Bell,
  X,
  BellRing,
  CalendarClock,
  AlertTriangle,
  Info,
  CheckCheck,
  RefreshCw,
  Sparkles,
} from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import api from "../api/client";
import { fmtDate } from "../utils/format";

const TYPE_CONFIG = {
  upcoming: {
    icon: CalendarClock,
    label: "Upcoming",
    dot: "bg-sky-500",
    chip: "bg-sky-100 text-sky-800 dark:bg-sky-950 dark:text-sky-300",
    border: "border-l-sky-500",
    glow: "shadow-sky-100/80 dark:shadow-sky-900/30",
  },
  overdue: {
    icon: AlertTriangle,
    label: "Overdue",
    dot: "bg-red-500",
    chip: "bg-red-100 text-red-800 dark:bg-red-950 dark:text-red-300",
    border: "border-l-red-500",
    glow: "shadow-red-100/80 dark:shadow-red-900/30",
  },
  system: {
    icon: Info,
    label: "System",
    dot: "bg-slate-400",
    chip: "bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300",
    border: "border-l-slate-400",
    glow: "shadow-slate-100/80",
  },
};

function relativeTime(date) {
  try {
    return formatDistanceToNow(new Date(date), { addSuffix: true });
  } catch {
    return fmtDate(date, "dd MMM, HH:mm");
  }
}

function NotificationCard({ item, onRead, index }) {
  const cfg = TYPE_CONFIG[item.type] || TYPE_CONFIG.system;
  const Icon = cfg.icon;

  return (
    <motion.button
      type="button"
      layout
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.03 }}
      onClick={() => onRead(item._id)}
      className={`group w-full rounded-xl border border-gray-100 border-l-4 p-4 text-left transition-all hover:shadow-md dark:border-gray-800  ${cfg.border} ${
        !item.isRead
          ? `bg-white shadow-sm ring-1 ring-indigo-100/80 ${cfg.glow} dark:bg-gray-900 dark:ring-indigo-900/50`
          : "bg-gray-50/80 opacity-75 hover:opacity-100 dark:bg-gray-900/40"
      }`}
    >
      <div className="flex gap-3">
        <div
          className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${cfg.chip}`}
        >
          <Icon className="h-5 w-5" />
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex items-start justify-between gap-2">
            <p className="font-semibold leading-snug text-gray-900 dark:text-white">
              {item.title}
            </p>
            {!item.isRead && (
              <span className="mt-1 h-2 w-2 shrink-0 rounded-full bg-indigo-500 ring-4 ring-indigo-100 dark:ring-indigo-900" />
            )}
          </div>
          <p className="mt-1 line-clamp-2 text-sm text-gray-600 dark:text-gray-400">
            {item.message}
          </p>
          <div className="mt-2 flex flex-wrap items-center gap-2">
            <span className={`rounded-md px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide ${cfg.chip}`}>
              {cfg.label}
            </span>
            <span className="text-xs text-gray-400">{relativeTime(item.createdAt)}</span>
          </div>
        </div>
      </div>
      {!item.isRead && (
        <p className="mt-2 text-[11px] font-medium text-indigo-600 opacity-0 transition-opacity group-hover:opacity-100 dark:text-indigo-400">
          Tap to mark as read
        </p>
      )}
    </motion.button>
  );
}

export default function NotificationDrawer() {
  const [open, setOpen] = useState(false);
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(false);
  const [permission, setPermission] = useState(
    typeof Notification !== "undefined" ? Notification.permission : "default"
  );
  const prevUnreadRef = useRef(-1);

  const unread = useMemo(() => items.filter((n) => !n.isRead).length, [items]);

  const grouped = useMemo(() => {
    const unreadList = items.filter((n) => !n.isRead);
    const readList = items.filter((n) => n.isRead);
    return { unread: unreadList, read: readList };
  }, [items]);

  const load = async () => {
    setLoading(true);
    try {
      const { data } = await api.get("/notifications");
      const list = data.items || data || [];
      setItems(Array.isArray(list) ? list : []);
    } catch {
      /* auth */
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
    const id = setInterval(load, 60000);
    return () => clearInterval(id);
  }, []);

  useEffect(() => {
    if (open) load();
  }, [open]);

  useEffect(() => {
    if (permission !== "granted" || typeof Notification === "undefined") return;
    const unreadItems = items.filter((n) => !n.isRead);
    if (prevUnreadRef.current >= 0 && unreadItems.length > prevUnreadRef.current) {
      const newest = unreadItems[0];
      if (newest) {
        new Notification(newest.title, {
          body: newest.message,
          icon: "/favicon.svg",
          tag: newest._id,
        });
      }
    }
    prevUnreadRef.current = unreadItems.length;
  }, [items, permission]);

  const requestPermission = async () => {
    if (!("Notification" in window)) return;
    const result = await Notification.requestPermission();
    setPermission(result);
  };

  const markRead = async (id) => {
    await api.patch(`/notifications/${id}/read`);
    setItems((prev) => prev.map((n) => (n._id === id ? { ...n, isRead: true } : n)));
  };

  const markAllRead = async () => {
    const unreadIds = items.filter((n) => !n.isRead).map((n) => n._id);
    await Promise.all(unreadIds.map((id) => api.patch(`/notifications/${id}/read`)));
    setItems((prev) => prev.map((n) => ({ ...n, isRead: true })));
  };

  return (
    <>
      {/* Trigger */}
      <button
        type="button"
        onClick={() => setOpen(true)}
        aria-label="Open notifications"
        className={`relative rounded-xl border p-2.5 transition-all ${
          unread > 0
            ? "border-indigo-200 bg-indigo-50 text-indigo-700 shadow-sm shadow-indigo-100 hover:bg-indigo-100 dark:border-indigo-800 dark:bg-indigo-950 dark:text-indigo-300"
            : "border-gray-200 bg-white text-gray-600 hover:bg-gray-50 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-300"
        }`}
      >
        {unread > 0 ? (
          <BellRing className="h-5 w-5 animate-pulse" />
        ) : (
          <Bell className="h-5 w-5" />
        )}
        <AnimatePresence>
          {unread > 0 && (
            <motion.span
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0 }}
              className="absolute -right-1.5 -top-1.5 flex h-5 min-w-[20px] items-center justify-center rounded-full bg-gradient-to-r from-red-500 to-rose-600 px-1 text-[10px] font-bold text-white shadow-md"
            >
              {unread > 9 ? "9+" : unread}
            </motion.span>
          )}
        </AnimatePresence>
      </button>

      <AnimatePresence>
        {open && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="fixed inset-0 z-[200] bg-slate-900/50 backdrop-blur-[2px]"
              onClick={() => setOpen(false)}
            />

            <motion.aside
              initial={{ x: "100%" }}
              animate={{ x: 0 }}
              exit={{ x: "100%" }}
              transition={{ type: "spring", damping: 28, stiffness: 320 }}
              className="fixed right-0 top-0 z-[201] flex h-[600px] w-full max-w-[420px] flex-col overflow-hidden border-l border-white/10 bg-white shadow-2xl dark:bg-gray-950"
            >
              {/* Header */}
              <div className="relative overflow-hidden border-b border-gray-100 dark:border-gray-800">
                <div className="absolute inset-0 bg-gradient-to-br from-indigo-600 via-violet-600 to-indigo-800" />
                <div className="absolute -right-8 -top-8 h-32 w-32 rounded-full bg-white/10" />
                <div className="absolute -bottom-12 -left-8 h-24 w-24 rounded-full bg-white/5" />

                <div className="relative px-5 pb-5 pt-6">
                  <div className="flex items-start justify-between">
                    <div>
                      <div className="mb-2 inline-flex items-center gap-2 rounded-full bg-white/15 px-3 py-1 text-xs font-medium text-indigo-100">
                        <Sparkles className="h-3.5 w-3.5" />
                        PA Reminders
                      </div>
                      <h2 className="text-xl font-bold text-white">Notifications</h2>
                      <p className="mt-1 text-sm text-indigo-100/90">
                        Meetings & followups that need your attention
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => setOpen(false)}
                      className="rounded-xl bg-white/15 p-2 text-white transition hover:bg-white/25"
                    >
                      <X className="h-5 w-5" />
                    </button>
                  </div>

                  <div className="mt-5 flex gap-3">
                    <div className="flex-1 rounded-xl bg-white/15 px-4 py-3 backdrop-blur-sm">
                      <p className="text-2xl font-bold text-white">{unread}</p>
                      <p className="text-xs text-indigo-100">Unread</p>
                    </div>
                    <div className="flex-1 rounded-xl bg-white/15 px-4 py-3 backdrop-blur-sm">
                      <p className="text-2xl font-bold text-white">{items.length}</p>
                      <p className="text-xs text-indigo-100">Total</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Browser alerts banner */}
              {permission !== "granted" && (
                <div className="mx-4 mt-4 flex items-center justify-between gap-3 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 dark:border-amber-900 dark:bg-amber-950/40">
                  <div className="flex items-center gap-2 text-sm text-amber-900 dark:text-amber-200">
                    <BellRing className="h-4 w-4 shrink-0" />
                    <span>Enable browser alerts for meeting reminders</span>
                  </div>
                  <button
                    type="button"
                    onClick={requestPermission}
                    className="shrink-0 rounded-lg bg-amber-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-amber-500"
                  >
                    Enable
                  </button>
                </div>
              )}

              {/* Actions bar */}
              <div className="flex items-center justify-between gap-2 border-b border-gray-100 px-4 py-3 dark:border-gray-800">
                <button
                  type="button"
                  onClick={load}
                  disabled={loading}
                  className="inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium text-gray-600 hover:bg-gray-100 disabled:opacity-50 dark:text-gray-400 dark:hover:bg-gray-800"
                >
                  <RefreshCw className={`h-3.5 w-3.5 ${loading ? "animate-spin" : ""}`} />
                  Refresh
                </button>
                {unread > 0 && (
                  <button
                    type="button"
                    onClick={markAllRead}
                    className="inline-flex items-center gap-1.5 rounded-lg bg-indigo-50 px-3 py-1.5 text-xs font-semibold text-indigo-700 hover:bg-indigo-100 dark:bg-indigo-950 dark:text-indigo-300"
                  >
                    <CheckCheck className="h-3.5 w-3.5" />
                    Mark all read
                  </button>
                )}
              </div>

              {/* List */}
              <div className="flex-1 overflow-y-auto px-4 py-4">
                {loading && items.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-20">
                    <RefreshCw className="h-8 w-8 animate-spin text-indigo-400" />
                    <p className="mt-3 text-sm text-gray-500">Loading alerts…</p>
                  </div>
                ) : items.length === 0 ? (
                  <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-gray-200 bg-gray-50 py-16 text-center dark:border-gray-700 dark:bg-gray-900/50">
                    <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-indigo-100 dark:bg-indigo-950">
                      <Bell className="h-8 w-8 text-indigo-500" />
                    </div>
                    <p className="font-semibold text-gray-800 dark:text-white">All clear</p>
                    <p className="mt-1 max-w-[240px] text-sm text-gray-500">
                      No reminders right now. Upcoming and overdue meetings will appear here.
                    </p>
                  </div>
                ) : (
                  <div className="space-y-6">
                    {grouped.unread.length > 0 && (
                      <section>
                        <h3 className="mb-3 flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-gray-500">
                          <span className="h-1.5 w-1.5 rounded-full bg-indigo-500" />
                          Needs attention ({grouped.unread.length})
                        </h3>
                        <div className="space-y-3">
                          {grouped.unread.map((n, i) => (
                            <NotificationCard key={n._id} item={n} onRead={markRead} index={i} />
                          ))}
                        </div>
                      </section>
                    )}

                    {grouped.read.length > 0 && (
                      <section>
                        <h3 className="mb-3 text-xs font-bold uppercase tracking-wider text-gray-400">
                          Earlier ({grouped.read.length})
                        </h3>
                        <div className="space-y-3">
                          {grouped.read.map((n, i) => (
                            <NotificationCard key={n._id} item={n} onRead={markRead} index={i} />
                          ))}
                        </div>
                      </section>
                    )}
                  </div>
                )}
              </div>

              {/* Footer */}
              <div className="border-t border-gray-100 bg-gray-50 px-4 py-3 text-center text-[11px] text-gray-400 dark:border-gray-800 dark:bg-gray-900">
                Auto-refreshes every minute · Cron checks meetings every 10 min
              </div>
            </motion.aside>
          </>
        )}
      </AnimatePresence>
    </>
  );
}
