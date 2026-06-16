import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import FullCalendar from "@fullcalendar/react";
import dayGridPlugin from "@fullcalendar/daygrid";
import timeGridPlugin from "@fullcalendar/timegrid";
import interactionPlugin from "@fullcalendar/interaction";
import { motion, AnimatePresence } from "framer-motion";
import {
  CalendarDays,
  ListTodo,
  X,
  ExternalLink,
  Clock,
  User,
  Tag,
  RefreshCw,
  Building2,
} from "lucide-react";
import api from "../api/client";
import { fmtDate, formatResponsiblePerson } from "../utils/format";
import { apiEventToFullCalendar, deptTaskEventToFullCalendar } from "../utils/calendar";
import PageHeader from "../components/PageHeader";
import LoadingSpinner from "../components/LoadingSpinner";
import { brand } from "../utils/theme";

const MEETING_KIND_LABELS = {
  task: "Meeting task created",
  initial: "First meeting",
  meeting: "Scheduled meeting",
  followup: "Next followup",
  reminder: "Reminder",
};

const DEPT_KIND_LABELS = {
  created: "Task created",
  review: "Next weekly review",
  remark: "Weekly meeting remark",
  followup_review: "Next review (from remark)",
};

const MEETING_LEGEND = [
  { color: "#8b5cf6", label: "First meeting" },
  { color: "#3b82f6", label: "Scheduled meeting" },
  { color: "#0ea5e9", label: "Followup from remarks" },
  { color: "#f59e0b", label: "Reminder" },
  { color: "#6366f1", label: "Meeting task date" },
];

const DEPT_LEGEND = [
  { color: "#6366f1", label: "Task created" },
  { color: "#3b82f6", label: "Next weekly review" },
  { color: "#8b5cf6", label: "Meeting remark date" },
  { color: "#0ea5e9", label: "Followup review date" },
];

function CalendarPanel({ loading, view, events, onEventClick, onEventDrop, emptyMessage }) {
  if (loading) {
    return <LoadingSpinner label="Loading calendar…" className="py-20" />;
  }
  if (events.length === 0) {
    return <p className="py-20 text-center text-slate-500">{emptyMessage}</p>;
  }
  return (
    <FullCalendar
      plugins={[dayGridPlugin, timeGridPlugin, interactionPlugin]}
      initialView={view}
      key={`${view}-${events.length}`}
      editable
      droppable
      events={events}
      eventClick={onEventClick}
      eventDrop={onEventDrop}
      height="auto"
      slotMinTime="07:00:00"
      slotMaxTime="21:00:00"
      nowIndicator
      eventTimeFormat={{ hour: "2-digit", minute: "2-digit", hour12: true }}
      headerToolbar={{ left: "prev,next today", center: "title", right: "" }}
      dayMaxEventRows={3}
      moreLinkClick="popover"
      eventDisplay="block"
    />
  );
}

export default function CalendarPage() {
  const navigate = useNavigate();
  const [tab, setTab] = useState("meeting");
  const [meetingEvents, setMeetingEvents] = useState([]);
  const [deptTaskEvents, setDeptTaskEvents] = useState([]);
  const [loadingMeeting, setLoadingMeeting] = useState(true);
  const [loadingDept, setLoadingDept] = useState(true);
  const [view, setView] = useState("dayGridMonth");
  const [selected, setSelected] = useState(null);

  const loadMeetings = async () => {
    setLoadingMeeting(true);
    try {
      const { data } = await api.get("/meetings/calendar-events");
      setMeetingEvents(data.events || []);
    } catch (e) {
      console.error(e);
      setMeetingEvents([]);
    } finally {
      setLoadingMeeting(false);
    }
  };

  const loadDeptTasks = async () => {
    setLoadingDept(true);
    try {
      const { data } = await api.get("/tasks/calendar-events");
      setDeptTaskEvents(data.events || []);
    } catch (e) {
      console.error(e);
      setDeptTaskEvents([]);
    } finally {
      setLoadingDept(false);
    }
  };

  const loadAll = () => {
    loadMeetings();
    loadDeptTasks();
  };

  useEffect(() => {
    loadAll();
  }, []);

  const meetingFcEvents = useMemo(
    () => meetingEvents.map(apiEventToFullCalendar).filter((e) => e.start),
    [meetingEvents]
  );

  const deptFcEvents = useMemo(
    () => deptTaskEvents.map(deptTaskEventToFullCalendar).filter((e) => e.start),
    [deptTaskEvents]
  );

  const activeEvents = tab === "meeting" ? meetingFcEvents : deptFcEvents;
  const legend = tab === "meeting" ? MEETING_LEGEND : DEPT_LEGEND;
  const loading = tab === "meeting" ? loadingMeeting : loadingDept;

  const onEventClick = (info) => {
    const props = info.event.extendedProps || {};
    const start = info.event.start;
    setSelected({
      ...props,
      title: props.title || info.event.title,
      date: props.date || (start ? start.toISOString() : null),
      allDay: props.allDay ?? info.event.allDay,
      time:
        props.time ||
        (!info.event.allDay && start
          ? `${String(start.getHours()).padStart(2, "0")}:${String(start.getMinutes()).padStart(2, "0")}`
          : ""),
    });
  };

  const onMeetingDrop = async (info) => {
    const props = info.event.extendedProps;
    const meetingId = props.meetingId;
    if (!meetingId) {
      info.revert();
      return;
    }

    const payload = {};
    const start = info.event.start;

    if (props.kind === "task") {
      payload.task_create_date = start;
    } else if (props.kind === "initial") {
      payload.initial_meeting_date = start;
      if (!props.allDay && props.time) payload.meeting_time = props.time;
    } else if (props.kind === "meeting" || props.kind === "followup") {
      payload.meeting_date = start;
      if (!props.allDay) {
        const h = start.getHours().toString().padStart(2, "0");
        const m = start.getMinutes().toString().padStart(2, "0");
        payload.meeting_time = `${h}:${m}`;
      }
    } else if (props.kind === "reminder") {
      payload.reminder_date = start;
    } else {
      info.revert();
      return;
    }

    try {
      await api.put(`/meetings/${meetingId}`, payload);
      await loadMeetings();
    } catch {
      info.revert();
    }
  };

  const onDeptDrop = async (info) => {
    const props = info.event.extendedProps;
    const taskId = props.taskId;
    if (!taskId) {
      info.revert();
      return;
    }

    const payload = {};
    const start = info.event.start;

    if (props.kind === "created") {
      payload.task_create_date = start;
    } else if (props.kind === "review" || props.kind === "followup_review") {
      payload.next_review_date = start;
    } else {
      info.revert();
      return;
    }

    try {
      await api.put(`/tasks/${taskId}`, payload);
      await loadDeptTasks();
    } catch {
      info.revert();
    }
  };

  const isDept = selected?.calendarType === "dept_task";
  const kindLabel = isDept
    ? DEPT_KIND_LABELS[selected?.kind] || selected?.label
    : MEETING_KIND_LABELS[selected?.kind] || selected?.label;
  const assignees = Array.isArray(selected?.assigned_to)
    ? selected.assigned_to.map((u) => u?.name).filter(Boolean).join(", ")
    : selected?.assigned_to || formatResponsiblePerson(selected?.responsible_person);

  return (
    <div className="space-y-5">
      <PageHeader
        title="Calendar"
        subtitle={
          tab === "meeting"
            ? "Meetings, followups, and reminders — separate from department tasks"
            : "Department weekly tasks — reviews and meeting remarks only"
        }
        icon={CalendarDays}
      >
        <button
          type="button"
          onClick={loadAll}
          disabled={loadingMeeting || loadingDept}
          className={brand.btnSecondary}
        >
          <RefreshCw className={`h-4 w-4 ${loadingMeeting || loadingDept ? "animate-spin" : ""}`} />
          Refresh
        </button>
        <div className={brand.tabGroup}>
          <button
            type="button"
            onClick={() => {
              setTab("meeting");
              setSelected(null);
            }}
            className={`inline-flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium ${
              tab === "meeting" ? brand.tabActive : brand.tabInactive
            }`}
          >
            <CalendarDays className="h-4 w-4" /> Meeting Calendar
          </button>
          <button
            type="button"
            onClick={() => {
              setTab("dept");
              setSelected(null);
            }}
            className={`inline-flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium ${
              tab === "dept" ? brand.tabActive : brand.tabInactive
            }`}
          >
            <ListTodo className="h-4 w-4" /> Task Calendar
          </button>
        </div>
      </PageHeader>

      <div className="flex flex-wrap gap-2">
        {["dayGridMonth", "timeGridWeek", "timeGridDay"].map((v) => (
          <button
            key={v}
            type="button"
            onClick={() => setView(v)}
            className={`rounded-lg border px-3 py-1.5 text-sm transition ${
              view === v ? brand.viewActive : brand.viewInactive
            }`}
          >
            {v === "dayGridMonth" ? "Month" : v === "timeGridWeek" ? "Week" : "Day"}
          </button>
        ))}
      </div>

      <div className={brand.legendBar}>
        {legend.map((l) => (
          <span key={l.label} className="inline-flex items-center gap-2 text-xs text-slate-600 dark:text-slate-400">
            <span className="h-3 w-3 rounded-sm" style={{ backgroundColor: l.color }} />
            {l.label}
          </span>
        ))}
      </div>

      <div className={`${brand.card} p-4 [&_.fc]:text-sm`}>
        {tab === "meeting" ? (
          <CalendarPanel
            loading={loadingMeeting}
            view={view}
            events={meetingFcEvents}
            onEventClick={onEventClick}
            onEventDrop={onMeetingDrop}
            emptyMessage="No meeting events yet. Add meetings from the Meetings page."
          />
        ) : (
          <CalendarPanel
            loading={loadingDept}
            view={view}
            events={deptFcEvents}
            onEventClick={onEventClick}
            onEventDrop={onDeptDrop}
            emptyMessage="No department tasks yet. Add tasks from Dept. Tasks page."
          />
        )}
      </div>

      <p className="text-center text-xs text-slate-400">
        Showing {activeEvents.length} {tab === "meeting" ? "meeting" : "department task"} event(s)
      </p>

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
              className="relative z-10 w-full max-w-2xl overflow-hidden rounded-2xl bg-white shadow-2xl dark:bg-slate-900"
              onClick={(e) => e.stopPropagation()}
            >
              <div className={brand.modalHeader}>
                <div className="flex justify-between gap-3">
                  <div>
                    <p className="text-xs font-medium uppercase tracking-wide text-indigo-200">{kindLabel}</p>
                    <h3 className="text-lg font-bold">{selected.title}</h3>
                  </div>
                  <button type="button" onClick={() => setSelected(null)} className="rounded-lg p-1 hover:bg-white/20">
                    <X className="h-5 w-5" />
                  </button>
                </div>
              </div>

              <div className="max-h-[70vh] space-y-4 overflow-y-auto px-5 py-4 text-sm">
                <div className="grid gap-3 rounded-xl border border-slate-200 bg-slate-50 p-3 text-slate-700 dark:border-slate-800 dark:bg-slate-800/50 dark:text-slate-200 sm:grid-cols-2">
                  <div className="flex items-center gap-2">
                    <Clock className="h-4 w-4 text-slate-400" />
                    <span className="font-medium">
                      {fmtDate(selected.date, "EEEE, d MMM yyyy")}
                      {selected.time ? ` at ${selected.time}` : " (all day)"}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Tag className="h-4 w-4 text-slate-400" />
                    <span>{kindLabel || "Event"}</span>
                  </div>
                </div>

                <div className="flex flex-wrap gap-2">
                  <span className="rounded-md bg-slate-100 px-2 py-0.5 text-xs font-medium dark:bg-slate-800">
                    {selected.status}
                  </span>
                  {selected.priority && (
                    <span className="rounded-md bg-slate-100 px-2 py-0.5 text-xs font-medium dark:bg-slate-800">
                      {selected.priority}
                    </span>
                  )}
                  {isDept && selected.department && (
                    <span className="inline-flex items-center gap-1 rounded-md bg-indigo-100 px-2 py-0.5 text-xs font-medium text-indigo-800 dark:bg-indigo-950 dark:text-indigo-200">
                      <Building2 className="h-3 w-3" />
                      {selected.department}
                    </span>
                  )}
                  {!isDept && selected.meeting_type && (
                    <span className="rounded-md bg-slate-100 px-2 py-0.5 text-xs capitalize dark:bg-slate-800">
                      {selected.meeting_type}
                    </span>
                  )}
                </div>
                {assignees && (
                  <p className="flex items-center gap-2 text-slate-600 dark:text-slate-400">
                    <User className="h-4 w-4" />
                    {assignees}
                  </p>
                )}
                {selected.description && (
                  <div className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-slate-700 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-300">
                    <p className="mb-1 text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
                      Description
                    </p>
                    <p>{selected.description}</p>
                  </div>
                )}
                {selected.discussion_topic && (
                  <p className="flex items-start gap-2 text-gray-600 dark:text-gray-400">
                    <Tag className="mt-0.5 h-4 w-4 shrink-0" />
                    {selected.discussion_topic}
                  </p>
                )}
                {selected.remark_description && (
                  <p className="rounded-lg bg-indigo-50 px-3 py-2 text-indigo-800 dark:bg-indigo-950 dark:text-indigo-200">
                    <strong>Discussion:</strong> {selected.remark_description}
                  </p>
                )}
                {selected.pending_reason && (
                  <p className="rounded-lg bg-amber-50 px-3 py-2 text-amber-800 dark:bg-amber-950 dark:text-amber-200">
                    <strong>Pending:</strong> {selected.pending_reason}
                  </p>
                )}
                {selected.latest_pending_reason && (
                  <p className="rounded-lg bg-amber-50 px-3 py-2 text-amber-800 dark:bg-amber-950 dark:text-amber-200">
                    <strong>Pending:</strong> {selected.latest_pending_reason}
                  </p>
                )}
                {selected.next_agenda && (
                  <p className="rounded-lg bg-indigo-50 px-3 py-2 text-indigo-800 dark:bg-indigo-950 dark:text-indigo-200">
                    <strong>Next agenda:</strong> {selected.next_agenda}
                  </p>
                )}
                {selected.next_followup_note && (
                  <p className="rounded-lg bg-amber-50 px-3 py-2 text-amber-800 dark:bg-amber-950 dark:text-amber-200">
                    <strong>PA note:</strong> {selected.next_followup_note}
                  </p>
                )}
                {selected.final_outcome && (
                  <p className="rounded-lg bg-emerald-50 px-3 py-2 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-200">
                    <strong>Outcome:</strong> {selected.final_outcome}
                  </p>
                )}
                {!selected.description &&
                  !selected.discussion_topic &&
                  !selected.remark_description &&
                  !selected.pending_reason &&
                  !selected.latest_pending_reason &&
                  !selected.next_agenda &&
                  !selected.next_followup_note &&
                  !selected.final_outcome && (
                    <p className="rounded-lg bg-slate-50 px-3 py-2 text-slate-500 dark:bg-slate-800 dark:text-slate-400">
                      No additional notes available for this event.
                    </p>
                  )}
              </div>

              <div className={brand.modalFooter}>
                <button type="button" onClick={() => setSelected(null)} className={`flex-1 py-2.5 ${brand.btnSecondary}`}>
                  Close
                </button>
                <button
                  type="button"
                  onClick={() =>
                    isDept ? navigate("/tasks") : navigate(`/meetings?meeting=${selected.meetingId}`)
                  }
                  className={`flex flex-1 items-center justify-center gap-2 rounded-xl py-2.5 text-sm font-semibold ${brand.btn}`}
                >
                  <ExternalLink className="h-4 w-4" />
                  {isDept ? "Open Dept. Tasks" : "Open in Meetings"}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
