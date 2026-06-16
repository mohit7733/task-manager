import { format, isBefore, startOfDay } from "date-fns";

export function fmtDate(d, pattern = "dd MMM yyyy") {
  if (!d) return "—";
  try {
    const date = new Date(d);
    return isNaN(date.getTime()) ? "—" : format(date, pattern);
  } catch {
    return "—";
  }
}

export function toInputDate(d) {
  if (!d) return "";
  try {
    const date = new Date(d);
    return isNaN(date.getTime()) ? "" : format(date, "yyyy-MM-dd");
  } catch {
    return "";
  }
}

export function formatResponsiblePerson(value) {
  if (!value) return "";
  try {
    const parsed = value;
    if (Array.isArray(parsed)) return parsed.map((u) => u.name).filter(Boolean).join(", ");
    return String(parsed);
  } catch {
    return "";
  }
}

export function responsiblePersonSearchText(value) {
  if (!value) return "";
  const parsed = value;
  if (Array.isArray(parsed)) {
    return value.map((u) => `${u.name || ""} ${u.emp_code || ""} ${u.email || ""}`).join(" ").toLowerCase();
  }
  return String(value).toLowerCase();
}

export function isOverdue(meeting) {
  return (
    meeting?.status !== "Completed" &&
    meeting?.meeting_date &&
    isBefore(new Date(meeting.meeting_date), startOfDay(new Date()))
  );
}
