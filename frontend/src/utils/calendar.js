/** Build local Date for FullCalendar (avoids UTC day-shift bugs). */
export function toCalendarDate(dateInput, timeStr, allDay = false) {
  if (!dateInput) return null;
  const d = new Date(dateInput);
  if (Number.isNaN(d.getTime())) return null;

  const year = d.getFullYear();
  const month = d.getMonth();
  const day = d.getDate();

  if (allDay || !timeStr) {
    return new Date(year, month, day, 12, 0, 0);
  }

  const parts = String(timeStr).split(":");
  const hours = parseInt(parts[0], 10) || 9;
  const minutes = parseInt(parts[1], 10) || 0;
  return new Date(year, month, day, hours, minutes, 0, 0);
}

export const KIND_COLORS = {
  task: { bg: "#6366f1", border: "#4f46e5", text: "#fff" },
  initial: { bg: "#8b5cf6", border: "#7c3aed", text: "#fff" },
  meeting: { bg: "#3b82f6", border: "#2563eb", text: "#fff" },
  followup: { bg: "#0ea5e9", border: "#0284c7", text: "#fff" },
  reminder: { bg: "#f59e0b", border: "#d97706", text: "#fff" },
};

/** Department task calendar (separate from meeting calendar) */
export const DEPT_TASK_KIND_COLORS = {
  created: { bg: "#6366f1", border: "#4f46e5", text: "#fff" },
  review: { bg: "#3b82f6", border: "#2563eb", text: "#fff" },
  remark: { bg: "#8b5cf6", border: "#7c3aed", text: "#fff" },
  followup_review: { bg: "#0ea5e9", border: "#0284c7", text: "#fff" },
};

export function kindColor(kind, status, priority) {
  if (kind === "followup") return KIND_COLORS.followup;
  if (kind === "task") return KIND_COLORS.task;
  if (kind === "initial") return KIND_COLORS.initial;
  if (kind === "reminder") return KIND_COLORS.reminder;
  if (status === "Completed") return { bg: "#22c55e", border: "#16a34a", text: "#fff" };
  if (priority === "Critical") return { bg: "#dc2626", border: "#b91c1c", text: "#fff" };
  if (priority === "High") return { bg: "#ef4444", border: "#dc2626", text: "#fff" };
  return KIND_COLORS.meeting;
}

export function deptTaskKindColor(kind, status) {
  if (status === "Done") return { bg: "#22c55e", border: "#16a34a", text: "#fff" };
  return DEPT_TASK_KIND_COLORS[kind] || DEPT_TASK_KIND_COLORS.review;
}

export function apiEventToFullCalendar(evt) {
  const colors = kindColor(evt.kind, evt.status, evt.priority);
  const start = toCalendarDate(evt.date, evt.time, evt.allDay);
  const timeLabel = evt.time ? ` ${evt.time}` : "";
  const prefix =
    evt.kind === "followup"
      ? "↻ "
      : evt.kind === "task"
        ? "📋 "
        : evt.kind === "initial"
          ? "① "
          : evt.kind === "reminder"
            ? "🔔 "
            : "";

  return {
    id: evt.id,
    title: `${prefix}${evt.title}${!evt.allDay && evt.time ? ` · ${evt.time}` : ""}`,
    start,
    allDay: Boolean(evt.allDay),
    backgroundColor: colors.bg,
    borderColor: colors.border,
    textColor: colors.text,
    extendedProps: { ...evt },
  };
}

export function deptTaskEventToFullCalendar(evt) {
  const colors = deptTaskKindColor(evt.kind, evt.status);
  const start = toCalendarDate(evt.date, null, true);
  const prefix =
    evt.kind === "created"
      ? "📋 "
      : evt.kind === "review"
        ? "📅 "
        : evt.kind === "remark"
          ? "💬 "
          : "↻ ";

  return {
    id: evt.id,
    title: `${prefix}${evt.title}${evt.department ? ` · ${evt.department}` : ""}`,
    start,
    allDay: true,
    backgroundColor: colors.bg,
    borderColor: colors.border,
    textColor: colors.text,
    extendedProps: { ...evt, calendarType: "dept_task" },
  };
}
