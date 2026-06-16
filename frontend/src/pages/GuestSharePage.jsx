import { useEffect, useMemo, useState } from "react";
import { useParams } from "react-router-dom";
import { motion } from "framer-motion";
import {
  AlertCircle,
  Building2,
  Calendar,
  CalendarClock,
  CheckCircle2,
  Clock,
  Eye,
  FileText,
  ListChecks,
  MessageSquare,
  Paperclip,
  Shield,
  Users,
} from "lucide-react";
import publicClient from "../api/publicClient";
import LoadingSpinner from "../components/LoadingSpinner";
import { fmtDate } from "../utils/format";
import { uploadUrl } from "../utils/upload";
import { APP_NAME, brand } from "../utils/theme";

const STATUS_STYLES = {
  Pending: "bg-amber-100 text-amber-800 ring-amber-200 dark:bg-amber-950/50 dark:text-amber-200 dark:ring-amber-800",
  "In Progress": "bg-blue-100 text-blue-800 ring-blue-200 dark:bg-blue-950/50 dark:text-blue-200 dark:ring-blue-800",
  Done: "bg-emerald-100 text-emerald-800 ring-emerald-200 dark:bg-emerald-950/50 dark:text-emerald-200 dark:ring-emerald-800",
  Completed: "bg-emerald-100 text-emerald-800 ring-emerald-200 dark:bg-emerald-950/50 dark:text-emerald-200 dark:ring-emerald-800",
  Rescheduled: "bg-violet-100 text-violet-800 ring-violet-200 dark:bg-violet-950/50 dark:text-violet-200 dark:ring-violet-800",
};

const PRIORITY_STYLES = {
  Low: "bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300",
  Medium: "bg-indigo-100 text-indigo-700 dark:bg-indigo-950/50 dark:text-indigo-200",
  High: "bg-orange-100 text-orange-700 dark:bg-orange-950/50 dark:text-orange-200",
  Critical: "bg-red-100 text-red-700 dark:bg-red-950/50 dark:text-red-200",
};

function initials(name) {
  return (name || "?")
    .split(" ")
    .map((p) => p[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
}

function Badge({ children, className = "" }) {
  return (
    <span className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold ring-1 ring-inset ${className}`}>
      {children}
    </span>
  );
}

function StatCard({ label, value, icon: Icon, accent = "indigo" }) {
  const accents = {
    indigo: "from-indigo-500/10 to-blue-500/5 text-indigo-600 dark:text-indigo-300",
    amber: "from-amber-500/10 to-orange-500/5 text-amber-600 dark:text-amber-300",
    emerald: "from-emerald-500/10 to-teal-500/5 text-emerald-600 dark:text-emerald-300",
    slate: "from-slate-500/10 to-slate-500/5 text-slate-600 dark:text-slate-300",
  };
  return (
    <div className={`rounded-2xl border border-slate-200/80 bg-gradient-to-br p-4 shadow-sm dark:border-slate-700 ${accents[accent]}`}>
      <div className="mb-3 flex items-center justify-between">
        <p className="text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">{label}</p>
        {Icon && <Icon className="h-4 w-4 opacity-70" />}
      </div>
      <p className="text-sm font-semibold leading-snug text-slate-900 dark:text-white">{value || "—"}</p>
    </div>
  );
}

function PersonChip({ person }) {
  return (
    <div className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2 shadow-sm dark:border-slate-700 dark:bg-slate-900">
      <span className="flex h-8 w-8 items-center justify-center rounded-full bg-gradient-to-br from-indigo-500 to-blue-600 text-xs font-bold text-white">
        {initials(person.name)}
      </span>
      <div className="min-w-0">
        <p className="truncate text-sm font-semibold text-slate-900 dark:text-white">{person.name}</p>
        <p className="truncate text-xs text-slate-500 dark:text-slate-400">
          {person.emp_code || "—"}
          {person.department_name ? ` · ${person.department_name}` : ""}
        </p>
      </div>
    </div>
  );
}

function InfoPanel({ title, icon: Icon, children }) {
  return (
    <section className={`overflow-hidden ${brand.card}`}>
      <div className="flex items-center gap-2 border-b border-slate-100 px-5 py-4 dark:border-slate-800">
        {Icon && <Icon className="h-4 w-4 text-indigo-600 dark:text-indigo-400" />}
        <h2 className="text-sm font-bold uppercase tracking-wide text-slate-700 dark:text-slate-200">{title}</h2>
      </div>
      <div className="p-5">{children}</div>
    </section>
  );
}

function TimelineRemark({ remark, type, isLast }) {
  const isMeeting = type === "meeting";
  const isDone = remark.status_after === "Done" || remark.status_after === "Completed" || remark.completion_note;

  return (
    <div className="relative flex gap-4 pb-8 last:pb-0">
      {!isLast && <div className="absolute left-[17px] top-10 h-[calc(100%-1.5rem)] w-px bg-gradient-to-b from-indigo-200 to-transparent dark:from-indigo-800" />}
      <div
        className={`relative z-10 flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-xs font-bold shadow-md ring-4 ring-white dark:ring-slate-900 ${
          isDone
            ? "bg-emerald-500 text-white"
            : "bg-gradient-to-br from-amber-400 to-orange-500 text-white"
        }`}
      >
        {remark.remark_number}
      </div>
      <div className="min-w-0 flex-1 rounded-2xl border border-slate-200/80 bg-white p-4 shadow-sm transition hover:shadow-md dark:border-slate-700 dark:bg-slate-900">
        <div className="mb-3 flex flex-wrap items-center gap-2">
          <p className="text-sm font-bold text-slate-900 dark:text-white">Remark #{remark.remark_number}</p>
          <Badge className={STATUS_STYLES[remark.status_after] || STATUS_STYLES.Pending}>
            {remark.status_after || remark.status || "Updated"}
          </Badge>
          {remark.attachment && (
            <Badge className="bg-indigo-50 text-indigo-700 ring-indigo-200 dark:bg-indigo-950/40 dark:text-indigo-200">
              <Paperclip className="mr-1 h-3 w-3" />
              Attachment
            </Badge>
          )}
        </div>

        <div className="mb-3 flex flex-wrap gap-2 text-xs text-slate-500 dark:text-slate-400">
          <span className="inline-flex items-center gap-1 rounded-lg bg-slate-100 px-2.5 py-1 dark:bg-slate-800">
            <Calendar className="h-3 w-3" />
            {isMeeting ? "Meeting" : "Review"}: {fmtDate(remark.meeting_date || remark.remark_date)}
          </span>
          <span className="inline-flex items-center gap-1 rounded-lg bg-slate-100 px-2.5 py-1 dark:bg-slate-800">
            <Clock className="h-3 w-3" />
            Logged: {fmtDate(remark.updatedAt || remark.remark_date)}
          </span>
        </div>

        {remark.remark_description && (
          <p className="mb-3 rounded-xl bg-slate-50 px-3 py-2 text-sm leading-relaxed text-slate-700 dark:bg-slate-800/60 dark:text-slate-200">
            {remark.remark_description}
          </p>
        )}

        <div className="flex flex-wrap gap-2">
          {remark.pending_reason && (
            <span className="inline-flex items-start gap-1.5 rounded-xl bg-amber-50 px-3 py-2 text-xs font-medium text-amber-800 dark:bg-amber-950/40 dark:text-amber-200">
              <AlertCircle className="mt-0.5 h-3.5 w-3.5 shrink-0" />
              <span><strong>Pending:</strong> {remark.pending_reason}</span>
            </span>
          )}
          {remark.completion_note && (
            <span className="inline-flex items-start gap-1.5 rounded-xl bg-emerald-50 px-3 py-2 text-xs font-medium text-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-200">
              <CheckCircle2 className="mt-0.5 h-3.5 w-3.5 shrink-0" />
              <span><strong>Completed:</strong> {remark.completion_note}</span>
            </span>
          )}
          {isMeeting && remark.next_meeting_date && (
            <span className="rounded-xl bg-blue-50 px-3 py-2 text-xs text-blue-800 dark:bg-blue-950/40 dark:text-blue-200">
              Next meeting: {fmtDate(remark.next_meeting_date)}
              {remark.next_meeting_time ? ` at ${remark.next_meeting_time}` : ""}
            </span>
          )}
          {isMeeting && remark.next_agenda && (
            <span className="rounded-xl bg-violet-50 px-3 py-2 text-xs text-violet-800 dark:bg-violet-950/40 dark:text-violet-200">
              Agenda: {remark.next_agenda}
            </span>
          )}
          {isMeeting && remark.next_followup_note && (
            <span className="rounded-xl bg-slate-100 px-3 py-2 text-xs text-slate-700 dark:bg-slate-800 dark:text-slate-300">
              Follow-up: {remark.next_followup_note}
            </span>
          )}
          {!isMeeting && remark.next_review_date && (
            <span className="rounded-xl bg-blue-50 px-3 py-2 text-xs text-blue-800 dark:bg-blue-950/40 dark:text-blue-200">
              Next review: {fmtDate(remark.next_review_date)}
            </span>
          )}
        </div>

        {remark.attachment && (
          <a
            href={uploadUrl(remark.attachment)}
            target="_blank"
            rel="noreferrer"
            className="mt-4 inline-flex items-center gap-2 rounded-xl bg-indigo-600 px-4 py-2 text-xs font-semibold text-white shadow-sm transition hover:bg-indigo-500"
          >
            <FileText className="h-3.5 w-3.5" />
            Open attachment
          </a>
        )}
      </div>
    </div>
  );
}

function GuestHero({ type, title, description, status, priority, overdue, meta }) {
  return (
    <div className={`overflow-hidden ${brand.card}`}>
      <div className={`${brand.gradientBr} px-6 py-8 sm:px-8`}>
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="min-w-0 flex-1">
            <div className="mb-3 flex flex-wrap items-center gap-2">
              <span className="inline-flex items-center gap-1.5 rounded-full bg-white/15 px-3 py-1 text-[11px] font-bold uppercase tracking-wider text-white/90 backdrop-blur-sm">
                <Eye className="h-3.5 w-3.5" />
                Guest view
              </span>
              <span className="rounded-full bg-white/15 px-3 py-1 text-[11px] font-bold uppercase tracking-wider text-white/90 backdrop-blur-sm">
                {type === "meeting" ? "Meeting" : "Department Task"}
              </span>
            </div>
            <h1 className="text-2xl font-bold leading-tight text-white sm:text-3xl">{title}</h1>
            {description ? (
              <p className="mt-3 max-w-3xl text-sm leading-relaxed text-indigo-100">{description}</p>
            ) : (
              <p className="mt-3 text-sm italic text-indigo-200/80">No description provided.</p>
            )}
          </div>
          <div className="flex flex-wrap gap-2">
            <Badge className="bg-white/95 text-slate-800 ring-0">{status}</Badge>
            {priority && <Badge className={`ring-0 ${PRIORITY_STYLES[priority] || PRIORITY_STYLES.Medium}`}>{priority} priority</Badge>}
            {overdue && (
              <Badge className="bg-red-500 text-white ring-0">
                <AlertCircle className="mr-1 h-3.5 w-3.5" />
                Overdue
              </Badge>
            )}
          </div>
        </div>
        {meta && <div className="mt-6 flex flex-wrap gap-4 text-xs text-indigo-100">{meta}</div>}
      </div>
    </div>
  );
}

function MeetingGuestView({ data }) {
  const { meeting, remarks, overdue } = data;
  const people = Array.isArray(meeting.responsible_person) ? meeting.responsible_person : [];

  return (
    <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
      <GuestHero
        type="meeting"
        title={meeting.title}
        description={meeting.description}
        status={meeting.status}
        priority={meeting.priority}
        overdue={overdue}
        meta={
          <>
            <span className="inline-flex items-center gap-1"><Calendar className="h-3.5 w-3.5" />{fmtDate(meeting.meeting_date)}{meeting.meeting_time ? ` · ${meeting.meeting_time}` : ""}</span>
            <span className="inline-flex items-center gap-1"><FileText className="h-3.5 w-3.5" />{meeting.meeting_type || "internal"}</span>
            <span className="inline-flex items-center gap-1"><MessageSquare className="h-3.5 w-3.5" />{remarks.length} remark{remarks.length !== 1 ? "s" : ""}</span>
          </>
        }
      />

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="Meeting date" value={fmtDate(meeting.meeting_date)} icon={Calendar} />
        <StatCard label="Meeting time" value={meeting.meeting_time || "Not set"} icon={Clock} accent="amber" />
        <StatCard label="Reminder date" value={meeting.reminder_date ? fmtDate(meeting.reminder_date) : "Not set"} icon={CalendarClock} accent="slate" />
        <StatCard label="Discussion topic" value={meeting.discussion_topic || "—"} icon={ListChecks} accent="emerald" />
      </div>

      {meeting.latest_pending_reason && (
        <div className="rounded-2xl border border-amber-200 bg-gradient-to-r from-amber-50 to-orange-50 p-4 dark:border-amber-900 dark:from-amber-950/30 dark:to-orange-950/20">
          <div className="flex items-start gap-3">
            <AlertCircle className="mt-0.5 h-5 w-5 shrink-0 text-amber-600" />
            <div>
              <p className="text-sm font-bold text-amber-900 dark:text-amber-200">Latest pending reason</p>
              <p className="mt-1 text-sm leading-relaxed text-amber-800 dark:text-amber-100">{meeting.latest_pending_reason}</p>
            </div>
          </div>
        </div>
      )}

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="space-y-6 lg:col-span-1">
          <InfoPanel title="Responsible team" icon={Users}>
            {people.length ? (
              <div className="flex flex-col gap-2">
                {people.map((p) => (
                  <PersonChip key={`${p.emp_code}-${p.name}`} person={p} />
                ))}
              </div>
            ) : (
              <p className="text-sm text-slate-500">No responsible persons listed.</p>
            )}
          </InfoPanel>

          {(meeting.final_outcome || meeting.meeting_link) && (
            <InfoPanel title="Additional details" icon={FileText}>
              <div className="space-y-4 text-sm">
                {meeting.final_outcome && (
                  <div>
                    <p className="mb-1 text-xs font-bold uppercase tracking-wide text-slate-500">Final outcome</p>
                    <p className="leading-relaxed text-emerald-700 dark:text-emerald-300">{meeting.final_outcome}</p>
                  </div>
                )}
                {meeting.meeting_link && (
                  <div>
                    <p className="mb-1 text-xs font-bold uppercase tracking-wide text-slate-500">Meeting link</p>
                    <a href={meeting.meeting_link} target="_blank" rel="noreferrer" className="break-all font-medium text-indigo-600 hover:underline dark:text-indigo-400">
                      {meeting.meeting_link}
                    </a>
                  </div>
                )}
              </div>
            </InfoPanel>
          )}
        </div>

        <div className="lg:col-span-2">
          <InfoPanel title="Remarks timeline" icon={MessageSquare}>
            {remarks.length === 0 ? (
              <div className="rounded-2xl border border-dashed border-slate-300 py-12 text-center dark:border-slate-700">
                <MessageSquare className="mx-auto mb-3 h-8 w-8 text-slate-300" />
                <p className="text-sm font-medium text-slate-600 dark:text-slate-300">No remarks yet</p>
                <p className="mt-1 text-xs text-slate-500">Updates will appear here when added.</p>
              </div>
            ) : (
              <div className="pl-1">
                {remarks.map((remark, idx) => (
                  <TimelineRemark key={remark._id || remark.remark_number} remark={remark} type="meeting" isLast={idx === remarks.length - 1} />
                ))}
              </div>
            )}
          </InfoPanel>
        </div>
      </div>
    </motion.div>
  );
}

function TaskGuestView({ data }) {
  const { task, remarks, overdue } = data;
  const assignees = Array.isArray(task.assigned_to) ? task.assigned_to : [];
  const lastRemark = remarks.length ? remarks[remarks.length - 1] : null;

  return (
    <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
      <GuestHero
        type="task"
        title={task.title}
        description={task.description}
        status={task.status}
        priority={task.priority}
        overdue={overdue}
        meta={
          <>
            <span className="inline-flex items-center gap-1"><Building2 className="h-3.5 w-3.5" />{task.department}</span>
            <span className="inline-flex items-center gap-1"><Calendar className="h-3.5 w-3.5" />Created {fmtDate(task.task_create_date)}</span>
            <span className="inline-flex items-center gap-1"><MessageSquare className="h-3.5 w-3.5" />{remarks.length} remark{remarks.length !== 1 ? "s" : ""}</span>
          </>
        }
      />

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="Department" value={task.department} icon={Building2} />
        <StatCard label="Next review" value={task.next_review_date ? fmtDate(task.next_review_date) : "Not scheduled"} icon={CalendarClock} accent="amber" />
        <StatCard label="Weekly meeting" value={task.weekly_meeting_day || "Not set"} icon={Calendar} accent="slate" />
        <StatCard label="Latest update" value={lastRemark ? `Remark #${lastRemark.remark_number}` : "No remarks"} icon={MessageSquare} accent="emerald" />
      </div>

      {task.latest_pending_reason && (
        <div className="rounded-2xl border border-amber-200 bg-gradient-to-r from-amber-50 to-orange-50 p-5 dark:border-amber-900 dark:from-amber-950/30 dark:to-orange-950/20">
          <div className="flex items-start gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-amber-100 text-amber-700 dark:bg-amber-900/50 dark:text-amber-200">
              <AlertCircle className="h-5 w-5" />
            </div>
            <div>
              <p className="text-sm font-bold text-amber-900 dark:text-amber-200">Current pending reason</p>
              <p className="mt-1 text-sm leading-relaxed text-amber-800 dark:text-amber-100">{task.latest_pending_reason}</p>
            </div>
          </div>
        </div>
      )}

      {task.final_outcome && (
        <div className="rounded-2xl border border-emerald-200 bg-gradient-to-r from-emerald-50 to-teal-50 p-5 dark:border-emerald-900 dark:from-emerald-950/30 dark:to-teal-950/20">
          <div className="flex items-start gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-emerald-100 text-emerald-700 dark:bg-emerald-900/50 dark:text-emerald-200">
              <CheckCircle2 className="h-5 w-5" />
            </div>
            <div>
              <p className="text-sm font-bold text-emerald-900 dark:text-emerald-200">Final outcome</p>
              <p className="mt-1 text-sm leading-relaxed text-emerald-800 dark:text-emerald-100">{task.final_outcome}</p>
            </div>
          </div>
        </div>
      )}

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="space-y-6 lg:col-span-1">
          <InfoPanel title="Assigned team" icon={Users}>
            {assignees.length ? (
              <div className="flex flex-col gap-2">
                {assignees.map((p) => (
                  <PersonChip key={`${p.emp_code}-${p.name}`} person={p} />
                ))}
              </div>
            ) : (
              <p className="text-sm text-slate-500">No assignees listed.</p>
            )}
          </InfoPanel>

          <InfoPanel title="Task summary" icon={ListChecks}>
            <dl className="space-y-3 text-sm">
              <div className="flex justify-between gap-4 border-b border-slate-100 pb-3 dark:border-slate-800">
                <dt className="text-slate-500">Status</dt>
                <dd><Badge className={STATUS_STYLES[task.status] || STATUS_STYLES.Pending}>{task.status}</Badge></dd>
              </div>
              <div className="flex justify-between gap-4 border-b border-slate-100 pb-3 dark:border-slate-800">
                <dt className="text-slate-500">Priority</dt>
                <dd><Badge className={PRIORITY_STYLES[task.priority] || PRIORITY_STYLES.Medium}>{task.priority}</Badge></dd>
              </div>
              <div className="flex justify-between gap-4">
                <dt className="text-slate-500">Created</dt>
                <dd className="font-medium text-slate-800 dark:text-slate-200">{fmtDate(task.task_create_date)}</dd>
              </div>
            </dl>
          </InfoPanel>
        </div>

        <div className="lg:col-span-2">
          <InfoPanel title="Follow-up timeline" icon={MessageSquare}>
            {remarks.length === 0 ? (
              <div className="rounded-2xl border border-dashed border-slate-300 py-12 text-center dark:border-slate-700">
                <MessageSquare className="mx-auto mb-3 h-8 w-8 text-slate-300" />
                <p className="text-sm font-medium text-slate-600 dark:text-slate-300">No remarks yet</p>
                <p className="mt-1 text-xs text-slate-500">Weekly meeting updates will appear here.</p>
              </div>
            ) : (
              <>
                <div className="mb-6 rounded-2xl border-l-4 border-indigo-500 bg-gradient-to-r from-indigo-50 to-blue-50 p-4 dark:from-indigo-950/40 dark:to-slate-900">
                  <p className="text-xs font-bold uppercase tracking-wide text-indigo-600 dark:text-indigo-300">Task created</p>
                  <p className="mt-1 text-sm font-semibold text-slate-900 dark:text-white">{fmtDate(task.task_create_date)}</p>
                  <p className="mt-1 text-xs text-slate-500">{task.department} · {assignees.map((u) => u.name).join(", ") || "—"}</p>
                </div>
                <div className="pl-1">
                  {remarks.map((remark, idx) => (
                    <TimelineRemark key={remark._id || remark.remark_number} remark={remark} type="task" isLast={idx === remarks.length - 1} />
                  ))}
                </div>
              </>
            )}
          </InfoPanel>
        </div>
      </div>
    </motion.div>
  );
}

export default function GuestSharePage() {
  const { token } = useParams();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [data, setData] = useState(null);

  useEffect(() => {
    let active = true;
    setLoading(true);
    setError("");
    publicClient
      .get(`/public/share/${token}`)
      .then(({ data: payload }) => {
        if (!active) return;
        setData(payload);
      })
      .catch((err) => {
        if (!active) return;
        setError(err.response?.data?.message || "This share link is invalid or has expired.");
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, [token]);

  const pageTitle = useMemo(() => {
    if (!data) return "Shared view";
    if (data.type === "meeting") return data.meeting?.title || "Meeting";
    if (data.type === "task") return data.task?.title || "Task";
    return "Shared view";
  }, [data]);

  useEffect(() => {
    document.title = `${pageTitle} · ${APP_NAME}`;
  }, [pageTitle]);

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
              <p className="text-xs text-slate-500">Secure shared view</p>
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
            <LoadingSpinner label="Loading shared details…" />
          </div>
        ) : error ? (
          <div className="overflow-hidden rounded-2xl border border-red-200 bg-white shadow-lg dark:border-red-900 dark:bg-slate-900">
            <div className="bg-gradient-to-r from-red-500 to-rose-600 px-6 py-8 text-center text-white">
              <AlertCircle className="mx-auto mb-3 h-10 w-10" />
              <h1 className="text-xl font-bold">Link unavailable</h1>
            </div>
            <div className="px-6 py-8 text-center">
              <p className="text-sm leading-relaxed text-slate-600 dark:text-slate-300">{error}</p>
              <p className="mt-4 text-xs text-slate-500">The link may have expired or been revoked. Please contact your administrator.</p>
            </div>
          </div>
        ) : data?.type === "meeting" ? (
          <MeetingGuestView data={data} />
        ) : data?.type === "task" ? (
          <TaskGuestView data={data} />
        ) : (
          <div className={`p-12 text-center ${brand.card}`}>
            <p className="text-sm text-slate-500">Nothing to display for this link.</p>
          </div>
        )}
      </main>

      <footer className="border-t border-slate-200/80 py-6 text-center dark:border-slate-800">
        <p className="text-xs text-slate-500">
          Powered by <span className="font-semibold text-slate-700 dark:text-slate-300">{APP_NAME}</span> · View-only guest portal
        </p>
      </footer>
    </div>
  );
}
