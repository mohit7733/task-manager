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

export function isOverdue(meeting) {
  return (
    meeting?.status !== "Completed" &&
    meeting?.meeting_date &&
    isBefore(new Date(meeting.meeting_date), startOfDay(new Date()))
  );
}
