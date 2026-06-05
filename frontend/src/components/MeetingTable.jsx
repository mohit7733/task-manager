import { Fragment, useEffect, useMemo, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  ChevronDown,
  ChevronRight,
  MessageSquarePlus,
  Search,
  RefreshCw,
  X,
  CalendarClock,
  CheckCircle2,
  AlertCircle,
  Clock,
  User,
  Paperclip,
  FileText,
  Eye,
} from "lucide-react";
import api from "../api/client";
import { fmtDate, isOverdue } from "../utils/format";
import { ACCEPT_MOM, buildFormData, uploadUrl } from "../utils/upload";
import { brand } from "../utils/theme";
import { Link } from "react-router-dom";

const EMPTY_FORM = {
  remark_description: "",
  next_meeting_date: "",
  next_meeting_time: "",
  next_agenda: "",
  next_followup_note: "",
  final_outcome: "",
};

const STATUS_STYLES = {
  Completed: "bg-emerald-100 text-emerald-800 ring-emerald-200",
  "In Progress": "bg-blue-100 text-blue-800 ring-blue-200",
  Pending: "bg-amber-100 text-amber-800 ring-amber-200",
  Rescheduled: "bg-violet-100 text-violet-800 ring-violet-200",
};

const COLUMNS = [
  "Task Date",
  "Meeting Date",
  "Time",
  "Int/Ext",
  "Title",
  "Responsible",
  "Status",
  "Discussion",
  "Last Remark",
  "Next Meeting",
  "Reminder",
  "Outcome",
  "Actions",
];

function RemarkModal({ meeting, onClose, onSaved, saving, setSaving }) {
  const [mode, setMode] = useState("followup"); // followup | completed
  const [form, setForm] = useState(EMPTY_FORM);
  const [momFile, setMomFile] = useState(null);
  const [error, setError] = useState("");

  const switchMode = (next) => {
    setMode(next);
    setError("");
    if (next === "followup") {
      setForm((f) => ({ ...f, final_outcome: "" }));
    } else {
      setForm((f) => ({
        ...f,
        next_meeting_date: "",
        next_meeting_time: "",
        next_agenda: "",
        next_followup_note: "",
      }));
    }
  };

  const submit = async () => {
    setError("");
    if (!form.remark_description.trim()) {
      setError("Please enter what was discussed in this meeting.");
      return;
    }

    if (mode === "completed") {
      if (!form.final_outcome.trim()) {
        setError("Please enter the final outcome to close this meeting.");
        return;
      }
    } else {
      if (!form.next_meeting_date) {
        setError("Please select the next meeting date (issue not resolved yet).");
        return;
      }
    }

    setSaving(true);
    try {
      const payload = {
        meeting_id: meeting._id,
        remark_description: form.remark_description.trim(),
        status: mode === "completed" ? "Completed" : "Pending",
      };

      if (mode === "completed") {
        payload.final_outcome = form.final_outcome.trim();
      } else {
        payload.next_meeting_date = form.next_meeting_date;
        if (form.next_meeting_time) payload.next_meeting_time = form.next_meeting_time;
        if (form.next_agenda.trim()) payload.next_agenda = form.next_agenda.trim();
        if (form.next_followup_note.trim()) payload.next_followup_note = form.next_followup_note.trim();
      }

      const fd = buildFormData(payload, momFile);
      await api.post("/remarks", fd);
      onSaved();
      onClose();
    } catch (err) {
      setError(err.response?.data?.message || "Could not save remark. Please try again.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm"
        onClick={onClose}
      />
      <motion.div
        initial={{ opacity: 0, scale: 0.96, y: 12 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.96, y: 12 }}
        className="relative z-10 flex max-h-[90vh] w-full max-w-2xl flex-col overflow-hidden rounded-2xl border border-white/20 bg-white shadow-2xl dark:bg-gray-900"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className={`${brand.modalHeader}`}>
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="text-xs font-medium uppercase tracking-wider text-indigo-200">Add Remark</p>
              <h3 className="mt-1 text-lg font-bold leading-tight">{meeting.title}</h3>
              <div className="mt-2 flex flex-wrap gap-2 text-xs text-indigo-100">
                <span className="inline-flex items-center gap-1 rounded-md bg-white/15 px-2 py-0.5">
                  <CalendarClock className="h-3 w-3" />
                  {fmtDate(meeting.meeting_date)}
                  {meeting.meeting_time ? ` · ${meeting.meeting_time}` : ""}
                </span>
                {meeting.responsible_person && (
                  <span className="inline-flex items-center gap-1 rounded-md bg-white/15 px-2 py-0.5">
                    <User className="h-3 w-3" />
                    {meeting.responsible_person}
                  </span>
                )}
              </div>
            </div>
            <button
              type="button"
              onClick={onClose}
              className="rounded-lg p-1.5 text-white/80 hover:bg-white/20"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto px-6 py-5">
          {/* Mode selector */}
          <p className="mb-3 text-sm font-medium text-gray-700 dark:text-gray-300">
            After this meeting, what happened?
          </p>
          <div className="mb-6 grid grid-cols-2 gap-3">
            <button
              type="button"
              onClick={() => switchMode("followup")}
              className={`rounded-xl border-2 p-4 text-left transition-all ${mode === "followup"
                ? "border-amber-400 bg-amber-50 ring-2 ring-amber-200 dark:bg-amber-950/40"
                : "border-gray-200 hover:border-gray-300 dark:border-gray-700"
                }`}
            >
              <CalendarClock
                className={`mb-2 h-6 w-6 ${mode === "followup" ? "text-amber-600" : "text-gray-400"}`}
              />
              <p className="font-semibold text-gray-900 dark:text-white">Not resolved</p>
              <p className="mt-1 text-xs text-gray-500">
                Schedule next meeting & followup — cannot add final outcome
              </p>
            </button>
            <button
              type="button"
              onClick={() => switchMode("completed")}
              className={`rounded-xl border-2 p-4 text-left transition-all ${mode === "completed"
                ? "border-emerald-400 bg-emerald-50 ring-2 ring-emerald-200 dark:bg-emerald-950/40"
                : "border-gray-200 hover:border-gray-300 dark:border-gray-700"
                }`}
            >
              <CheckCircle2
                className={`mb-2 h-6 w-6 ${mode === "completed" ? "text-emerald-600" : "text-gray-400"}`}
              />
              <p className="font-semibold text-gray-900 dark:text-white">Resolved / Done</p>
              <p className="mt-1 text-xs text-gray-500">
                Add final outcome — meeting will be marked completed
              </p>
            </button>
          </div>

          {/* Remark (always required) */}
          <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">
            Discussion / Remark <span className="text-red-500">*</span>
          </label>
          <textarea
            rows={3}
            value={form.remark_description}
            onChange={(e) => setForm((f) => ({ ...f, remark_description: e.target.value }))}
            placeholder="What was discussed? Key points from this meeting..."
            className="mb-4 w-full resize-none rounded-xl border border-gray-200 px-4 py-3 text-sm focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 dark:border-gray-600 dark:bg-gray-800 dark:text-white"
          />

          <div className="mb-5 rounded-xl border border-dashed border-indigo-200 bg-indigo-50/40 p-4 dark:border-indigo-800 dark:bg-indigo-950/20">
            <label className="mb-2 flex items-center gap-2 text-sm font-medium text-gray-700 dark:text-gray-300">
              <Paperclip className="h-4 w-4 text-indigo-600" />
              MOM document (optional)
            </label>
            <input
              type="file"
              accept={ACCEPT_MOM}
              onChange={(e) => setMomFile(e.target.files?.[0] || null)}
              className="block w-full text-sm text-gray-600 file:mr-3 file:rounded-lg file:border-0 file:bg-indigo-600 file:px-3 file:py-1.5 file:text-xs file:font-semibold file:text-white hover:file:bg-indigo-500"
            />
            {momFile && (
              <p className="mt-2 text-xs text-indigo-700 dark:text-indigo-300">
                Selected: {momFile.name} ({(momFile.size / 1024).toFixed(0)} KB)
              </p>
            )}
          </div>

          <AnimatePresence mode="wait">
            {mode === "followup" ? (
              <motion.div
                key="followup"
                initial={{ opacity: 0, x: -8 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 8 }}
                className="space-y-4 rounded-xl border border-amber-200 bg-amber-50/50 p-4 dark:border-amber-900 dark:bg-amber-950/20"
              >
                <p className="text-sm font-semibold text-amber-800 dark:text-amber-300">
                  Next meeting (required — issue still open)
                </p>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="mb-1 block text-xs font-medium text-gray-600">Next meeting date *</label>
                    <input
                      type="date"
                      value={form.next_meeting_date}
                      onChange={(e) => setForm((f) => ({ ...f, next_meeting_date: e.target.value }))}
                      className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm dark:border-gray-600 dark:bg-gray-800"
                    />
                  </div>
                  <div>
                    <label className="mb-1 block text-xs font-medium text-gray-600">Next meeting time</label>
                    <input
                      type="time"
                      value={form.next_meeting_time}
                      onChange={(e) => setForm((f) => ({ ...f, next_meeting_time: e.target.value }))}
                      className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm dark:border-gray-600 dark:bg-gray-800"
                    />
                  </div>
                </div>
                <div>
                  <label className="mb-1 block text-xs font-medium text-gray-600">Next agenda / discussion topic</label>
                  <input
                    type="text"
                    value={form.next_agenda}
                    onChange={(e) => setForm((f) => ({ ...f, next_agenda: e.target.value }))}
                    placeholder="What to discuss next time"
                    className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm dark:border-gray-600 dark:bg-gray-800"
                  />
                </div>
                <div>
                  <label className="mb-1 block text-xs font-medium text-gray-600">Followup note for PA</label>
                  <input
                    type="text"
                    value={form.next_followup_note}
                    onChange={(e) => setForm((f) => ({ ...f, next_followup_note: e.target.value }))}
                    placeholder="e.g. Chase CFO for approval"
                    className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm dark:border-gray-600 dark:bg-gray-800"
                  />
                </div>
              </motion.div>
            ) : (
              <motion.div
                key="completed"
                initial={{ opacity: 0, x: 8 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -8 }}
                className="space-y-3 rounded-xl border border-emerald-200 bg-emerald-50/50 p-4 dark:border-emerald-900 dark:bg-emerald-950/20"
              >
                <p className="text-sm font-semibold text-emerald-800 dark:text-emerald-300">
                  Final outcome (required — closes this meeting)
                </p>
                <textarea
                  rows={3}
                  value={form.final_outcome}
                  onChange={(e) => setForm((f) => ({ ...f, final_outcome: e.target.value }))}
                  placeholder="Summarize the final decision or result. Status will become Completed."
                  className="w-full resize-none rounded-lg border border-gray-200 px-3 py-2 text-sm dark:border-gray-600 dark:bg-gray-800"
                />
                <p className="flex items-start gap-2 text-xs text-emerald-700 dark:text-emerald-400">
                  <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0" />
                  No next meeting will be scheduled. Use this only when the issue is fully closed.
                </p>
              </motion.div>
            )}
          </AnimatePresence>

          {error && (
            <p className="mt-4 flex items-center gap-2 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700 dark:bg-red-950/50 dark:text-red-300">
              <AlertCircle className="h-4 w-4 shrink-0" />
              {error}
            </p>
          )}
        </div>

        <div className="flex gap-3 border-t border-gray-100 bg-gray-50 px-6 py-4 dark:border-gray-800 dark:bg-gray-900/80">
          <button
            type="button"
            onClick={onClose}
            className="flex-1 rounded-xl border border-gray-200 py-2.5 text-sm font-medium text-gray-700 hover:bg-white dark:border-gray-600 dark:text-gray-300"
          >
            Cancel
          </button>
          <button
            type="button"
            disabled={saving}
            onClick={submit}
            className={`flex-1 rounded-xl py-2.5 text-sm font-semibold text-white shadow-md disabled:opacity-50 ${mode === "completed"
              ? "bg-emerald-600 hover:bg-emerald-500"
              : "bg-indigo-600 hover:bg-indigo-500"
              }`}
          >
            {saving ? "Saving…" : mode === "completed" ? "Save & Complete Meeting" : "Save & Schedule Followup"}
          </button>
        </div>
      </motion.div>
    </div>
  );
}

export default function MeetingTable({ meetings, reload, highlightMeetingId }) {
  const [expanded, setExpanded] = useState(null);
  const [timeline, setTimeline] = useState(null);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [page, setPage] = useState(1);
  const [modalMeeting, setModalMeeting] = useState(null);
  const [saving, setSaving] = useState(false);
  const perPage = 15;

  const filtered = useMemo(() => {
    let list = [...meetings];
    if (statusFilter) list = list.filter((m) => m.status === statusFilter);
    if (search) {
      const q = search.toLowerCase();
      list = list.filter(
        (m) =>
          m.title?.toLowerCase().includes(q) ||
          m.responsible_person?.toLowerCase().includes(q) ||
          m.discussion_topic?.toLowerCase().includes(q)
      );
    }
    return list;
  }, [meetings, search, statusFilter]);

  const pages = Math.max(1, Math.ceil(filtered.length / perPage));
  const rows = filtered.slice((page - 1) * perPage, page * perPage);

  useEffect(() => {
    if (!highlightMeetingId || !meetings.length) return;
    const idx = filtered.findIndex((m) => m._id === highlightMeetingId);
    if (idx < 0) return;
    const targetPage = Math.floor(idx / perPage) + 1;
    setPage(targetPage);
    const expand = async () => {
      setExpanded(highlightMeetingId);
      const { data } = await api.get(`/meetings/${highlightMeetingId}/timeline`);
      setTimeline(data);
      setTimeout(() => {
        document.getElementById(`meeting-row-${highlightMeetingId}`)?.scrollIntoView({
          behavior: "smooth",
          block: "center",
        });
      }, 300);
    };
    expand();
  }, [highlightMeetingId, meetings.length]);

  const openRemarkModal = (meeting, e) => {
    e.stopPropagation();
    setModalMeeting(meeting);
  };

  const closeModal = () => setModalMeeting(null);

  const onRemarkSaved = async () => {
    await reload();
    if (expanded && modalMeeting) {
      const { data } = await api.get(`/meetings/${modalMeeting._id}/timeline`);
      setTimeline(data);
    }
  };

  const toggleExpand = async (id) => {
    if (expanded === id) {
      setExpanded(null);
      setTimeline(null);
      return;
    }
    setExpanded(id);
    const { data } = await api.get(`/meetings/${id}/timeline`);
    setTimeline(data);
  };

  const updateStatus = async (id, status, e) => {
    e.stopPropagation();
    await api.put(`/meetings/${id}`, { status });
    reload();
  };

  return (
    <div className="space-y-4">
      {/* Toolbar */}
      <div className="flex flex-wrap items-center gap-3 rounded-2xl border border-gray-200/80 bg-white p-4 shadow-sm dark:border-gray-700 dark:bg-gray-900">
        <div className="relative min-w-[220px] flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
          <input
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(1);
            }}
            placeholder="Search title, person, topic…"
            className="w-full rounded-xl border-0 bg-gray-50 py-2.5 pl-10 pr-3 text-sm ring-1 ring-gray-200 focus:ring-2 focus:ring-indigo-500 dark:bg-gray-800 dark:ring-gray-600 dark:text-white"
          />
        </div>
        <select
          value={statusFilter}
          onChange={(e) => {
            setStatusFilter(e.target.value);
            setPage(1);
          }}
          className="rounded-xl border-0 bg-gray-50 px-4 py-2.5 text-sm ring-1 ring-gray-200 dark:bg-gray-800 dark:ring-gray-600 dark:text-white"
        >
          <option value="">All status</option>
          <option>Pending</option>
          <option>In Progress</option>
          <option>Completed</option>
          <option>Rescheduled</option>
        </select>
        <button
          type="button"
          onClick={reload}
          className="inline-flex items-center gap-2 rounded-xl bg-gray-50 px-4 py-2.5 text-sm font-medium ring-1 ring-gray-200 hover:bg-gray-100 dark:bg-gray-800 dark:ring-gray-600"
        >
          <RefreshCw className="h-4 w-4" />
          Refresh
        </button>
        <span className="text-xs text-gray-500">{filtered.length} meetings</span>
      </div>

      {/* Table */}
      <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-md dark:border-gray-700 dark:bg-gray-900">
        <div className="max-h-[68vh] overflow-auto">
          <table className="excel-table w-full min-w-[1400px] border-collapse text-[13px]">
            <thead>
              <tr className="bg-gradient-to-r from-slate-100 to-slate-50 dark:from-slate-800 dark:to-slate-900">
                <th className="sticky top-0 z-20 w-9 border-b border-r border-gray-200 bg-slate-100 px-1 py-3 dark:border-gray-600 dark:bg-slate-800" />
                {COLUMNS.map((c) => (
                  <th
                    key={c}
                    className="sticky top-0 z-20 whitespace-nowrap border-b border-r border-gray-200 bg-slate-100 px-3 py-3 text-left text-[11px] font-bold uppercase tracking-wider text-slate-600 dark:border-gray-600 dark:bg-slate-800 dark:text-slate-300"
                  >
                    {c}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {rows.length === 0 ? (
                <tr>
                  <td colSpan={COLUMNS.length + 1} className="py-16 text-center text-gray-500">
                    No meetings match your search
                  </td>
                </tr>
              ) : (
                rows.map((m) => {
                  const overdue = isOverdue(m);
                  const rowOpen = expanded === m._id;
                  const last = m.lastRemark;

                  return (
                    <Fragment key={m._id}>
                      <tr
                        id={`meeting-row-${m._id}`}
                        onClick={() => toggleExpand(m._id)}
                        className={`group transition-colors ${highlightMeetingId === m._id ? "ring-2 ring-inset ring-indigo-500" : ""
                          } ${overdue
                            ? "bg-red-50/70 hover:bg-red-50 dark:bg-red-950/25"
                            : "hover:bg-indigo-50/50 dark:hover:bg-indigo-950/20"
                          } ${rowOpen ? "bg-indigo-50/80 dark:bg-indigo-950/30" : ""}`}
                      >
                        <td className="border-b border-r border-gray-100 px-2 py-2.5 text-center dark:border-gray-800">
                          <span className="inline-flex rounded-md bg-gray-100 p-0.5 group-hover:bg-indigo-100 dark:bg-gray-800">
                            {rowOpen ? (
                              <ChevronDown className="h-4 w-4 text-indigo-600" />
                            ) : (
                              <ChevronRight className="h-4 w-4 text-gray-500" />
                            )}
                          </span>
                        </td>
                        <td className="border-b border-r border-gray-100 px-3 py-2.5 text-gray-600 dark:border-gray-800">
                          {fmtDate(m.task_create_date)}
                        </td>
                        <td className="border-b border-r border-gray-100 px-3 py-2.5 font-medium dark:border-gray-800">
                          <span className="flex items-center gap-1">
                            {fmtDate(m.meeting_date)}
                            {overdue && <AlertCircle className="h-3.5 w-3.5 text-red-500" title="Overdue" />}
                          </span>
                        </td>
                        <td className="border-b border-r border-gray-100 px-3 py-2.5 dark:border-gray-800">
                          {m.meeting_time ? (
                            <span className="inline-flex items-center gap-1 text-gray-600">
                              <Clock className="h-3 w-3" />
                              {m.meeting_time}
                            </span>
                          ) : (
                            "—"
                          )}
                        </td>
                        <td className="border-b border-r border-gray-100 px-3 py-2.5 capitalize dark:border-gray-800">
                          <span
                            className={`rounded-md px-2 py-0.5 text-xs font-medium ${m.meeting_type === "external"
                              ? "bg-purple-100 text-purple-700"
                              : "bg-indigo-100 text-indigo-700"
                              }`}
                          >
                            {m.meeting_type || "—"}
                          </span>
                        </td>
                        <td className="max-w-[200px] border-b border-r border-gray-100 px-3 py-2.5 font-semibold text-gray-900 dark:border-gray-800 dark:text-white">
                          {m.title}
                        </td>
                        <td className="border-b border-r border-gray-100 px-3 py-2.5 dark:border-gray-800">
                          {m.responsible_person || "—"}
                        </td>
                        <td
                          className="border-b border-r border-gray-100 px-2 py-2 dark:border-gray-800"
                          onClick={(e) => e.stopPropagation()}
                        >
                          <select
                            value={m.status}
                            onChange={(e) => updateStatus(m._id, e.target.value, e)}
                            className={`w-full cursor-pointer rounded-lg border-0 px-2 py-1 text-xs font-semibold ring-1 ring-inset ${STATUS_STYLES[m.status] || "bg-gray-100"}`}
                          >
                            <option>Pending</option>
                            <option>In Progress</option>
                            <option>Completed</option>
                            <option>Rescheduled</option>
                          </select>
                        </td>
                        <td className="max-w-[160px] border-b border-r border-gray-100 px-3 py-2.5 text-gray-600 dark:border-gray-800">
                          <span className="line-clamp-2" title={m.discussion_topic || m.description}>
                            {m.discussion_topic || m.description || "—"}
                          </span>
                        </td>
                        <td className="max-w-[180px] border-b border-r border-gray-100 px-3 py-2.5 dark:border-gray-800">
                          {last ? (
                            <span
                              className="rounded-md bg-slate-100 px-2 py-1 text-xs dark:bg-slate-800"
                              title={last.remark_description}
                            >
                              <span className="font-bold text-indigo-600">#{last.remark_number}</span>{" "}
                              {(last.remark_description || "").slice(0, 50)}
                              {(last.remark_description || "").length > 50 ? "…" : ""}
                            </span>
                          ) : (
                            <span className="text-gray-400">—</span>
                          )}
                        </td>
                        <td className="border-b border-r border-gray-100 px-3 py-2.5 dark:border-gray-800">
                          {last?.next_meeting_date ? (
                            <span className="text-amber-700 dark:text-amber-400">{fmtDate(last.next_meeting_date)}</span>
                          ) : (
                            "—"
                          )}
                        </td>
                        <td className="border-b border-r border-gray-100 px-3 py-2.5 text-gray-500 dark:border-gray-800">
                          {fmtDate(m.reminder_date)}
                        </td>
                        <td className="max-w-[140px] border-b border-r border-gray-100 px-3 py-2.5 dark:border-gray-800">
                          {m.final_outcome ? (
                            <span className="line-clamp-2 text-emerald-700 dark:text-emerald-400" title={m.final_outcome}>
                              {m.final_outcome}
                            </span>
                          ) : (
                            "—"
                          )}
                        </td>
                        <td
                          className="border-b border-gray-100 px-2 py-2 dark:border-gray-800"
                          onClick={(e) => e.stopPropagation()}
                        >
                          <button
                            type="button"
                            title="Add remark"
                            onClick={(e) => openRemarkModal(m, e)}
                            className="inline-flex items-center gap-1.5 rounded-lg bg-indigo-600 px-3 py-1.5 text-xs font-semibold text-white shadow-sm transition hover:bg-indigo-500 hover:shadow"
                          >
                            <MessageSquarePlus className="h-3.5 w-3.5" />
                            Remark
                          </button>
                        </td>
                      </tr>

                      <AnimatePresence>
                        {rowOpen && timeline?.meeting?._id === m._id && (
                          <tr>
                            <td colSpan={COLUMNS.length + 1} className="border-b border-gray-100 bg-gradient-to-tr from-indigo-50 via-white to-sky-100 p-0 dark:from-slate-800 dark:via-slate-900 dark:to-slate-900">
                              <motion.div
                                initial={{ opacity: 0, y: 16 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: 16 }}
                              >
                                <div className="flex flex-col gap-6">
                                  <div className="w-full rounded-xl bg-white shadow-md ring-1 ring-indigo-100 dark:bg-slate-800 dark:ring-slate-700 p-6">
                                    <div className="flex items-center gap-3 mb-4">
                                      <span className="flex h-10 w-10 items-center justify-center rounded-full bg-indigo-100 text-indigo-700 text-lg font-extrabold ring-4 ring-indigo-200 dark:bg-indigo-900 dark:text-indigo-200 dark:ring-indigo-700">
                                        <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m4-1V7a4 4 0 10-8 0v4a4 4 0 008 0z" /></svg>
                                      </span>
                                      <div>
                                        <p className="text-lg font-bold text-indigo-700 dark:text-indigo-200">Follow-up Timeline</p>
                                        <p className="text-xs text-slate-500 dark:text-slate-300">{timeline.meeting?.title}</p>
                                      </div>
                                    </div>
                                    <div className="grid gap-4">
                                      <div className="bg-gradient-to-r from-indigo-50 to-indigo-100 border-l-4 border-indigo-400 rounded-md px-4 py-2 dark:from-indigo-900 dark:to-slate-900 dark:border-indigo-700 mb-2 shadow-sm flex flex-col sm:flex-row sm:items-center sm:justify-between">
                                        <div>
                                          <p className="text-xs uppercase font-bold text-indigo-600 dark:text-indigo-300">Created</p>
                                          <p className="text-sm font-medium text-slate-800 dark:text-slate-200">{fmtDate(timeline.meeting.task_create_date)}</p>
                                          <Link to={`${uploadUrl(timeline.meeting?.attachment)}`} target="_blank" className="inline-block rounded-full bg-indigo-600 text-white px-3 py-1 text-xs font-semibold dark:bg-indigo-400 mt-2 sm:mt-0">
                                            <Eye className="h-3 w-3" />
                                          </Link>
                                        </div>
                                        <span className="inline-block rounded-full bg-indigo-600 text-white px-3 py-1 text-xs font-semibold dark:bg-indigo-400 mt-2 sm:mt-0">
                                          {timeline.meeting.status}
                                        </span>
                                      </div>
                                      {(timeline.remarks || []).map((r, idx) => (
                                        <div key={r._id} className="bg-white dark:bg-slate-900 border-l-4 border-amber-500 rounded-md px-4 py-3 shadow flex flex-row items-center gap-4 relative">
                                          <span className="h-9 w-9 flex items-center justify-center rounded-full bg-amber-100 text-amber-700 shadow ring-2 ring-amber-200 absolute left-0 -translate-x-1/2 dark:bg-amber-900 dark:text-amber-200 dark:ring-amber-700">
                                            #{r.remark_number}
                                          </span>
                                          <div className="pl-8 flex-1">
                                            <div className="flex items-center gap-2 mb-1">
                                              <p className="text-xs font-bold text-amber-700 dark:text-amber-300">Remark #{r.remark_number}</p>
                                              <span className="rounded bg-amber-50 px-2 py-0.5 text-xs text-amber-700 dark:bg-amber-800/40 dark:text-amber-300">{fmtDate(r.remark_date)}</span>
                                            </div>
                                            <p className="text-sm text-gray-800 dark:text-gray-200 mb-1">{r.remark_description}</p>
                                            <div className="flex flex-wrap gap-2 text-xs items-center">
                                              {r.next_meeting_date && (
                                                <span className="font-medium text-amber-700 dark:text-amber-300 bg-amber-50 dark:bg-amber-900/30 px-2 py-0.5 rounded">
                                                  Next: {fmtDate(r.next_meeting_date)}{r.next_meeting_time ? ` ${r.next_meeting_time}` : ""}{r.next_agenda ? ` · ${r.next_agenda}` : ""}
                                                </span>
                                              )}
                                              {r.next_followup_note && (
                                                <span className="text-gray-500 dark:text-gray-400 bg-gray-50 dark:bg-slate-700/30 px-2 py-0.5 rounded">
                                                  PA note: {r.next_followup_note}
                                                </span>
                                              )}
                                              {r.attachment && (
                                                <a
                                                  href={uploadUrl(r.attachment)}
                                                  target="_blank"
                                                  rel="noopener noreferrer"
                                                  onClick={(e) => e.stopPropagation()}
                                                  className="inline-flex items-center gap-1 rounded bg-indigo-50 px-2 py-0.5 font-medium text-indigo-700 hover:bg-indigo-100 dark:bg-indigo-900/40 dark:text-indigo-300"
                                                >
                                                  <FileText className="h-3 w-3" />
                                                  MOM document
                                                </a>
                                              )}
                                            </div>
                                          </div>
                                        </div>
                                      ))}
                                      {timeline.meeting.status === "Completed" && timeline.meeting.final_outcome && (
                                        <div className="border-l-4 border-emerald-500 bg-emerald-50 dark:bg-emerald-900/25 rounded-md px-4 py-3 shadow flex flex-row items-center gap-4">
                                          <span className="h-9 w-9 flex items-center justify-center rounded-full bg-emerald-500 text-white shadow ring-2 ring-emerald-200 font-black text-base dark:bg-emerald-700 dark:ring-emerald-700">
                                            ✓
                                          </span>
                                          <div>
                                            <p className="text-xs font-bold text-emerald-700 dark:text-emerald-300 mb-1">Completed</p>
                                            <p className="text-sm text-emerald-900 dark:text-emerald-100">{timeline.meeting.final_outcome}</p>
                                          </div>
                                        </div>
                                      )}
                                    </div>
                                    <div className="flex justify-end pt-3">
                                      <button
                                        type="button"
                                        onClick={(e) => openRemarkModal(m, e)}
                                        className="inline-flex items-center gap-2 rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white shadow hover:bg-indigo-500 transition dark:bg-indigo-700 dark:hover:bg-indigo-600"
                                      >
                                        <MessageSquarePlus className="h-4 w-4" />
                                        Add another remark
                                      </button>
                                    </div>
                                  </div>
                                </div>
                              </motion.div>
                            </td>

                          </tr>
                        )}
                      </AnimatePresence>
                    </Fragment>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {pages > 1 && (
          <div className="flex items-center justify-between border-t border-gray-100 px-4 py-3 text-sm dark:border-gray-800">
            <span className="text-gray-500">
              Page {page} of {pages} · {filtered.length} rows
            </span>
            <div className="flex gap-2">
              <button
                type="button"
                disabled={page <= 1}
                className="rounded-lg border px-3 py-1 disabled:opacity-40"
                onClick={() => setPage((p) => p - 1)}
              >
                Previous
              </button>
              <button
                type="button"
                disabled={page >= pages}
                className="rounded-lg border px-3 py-1 disabled:opacity-40"
                onClick={() => setPage((p) => p + 1)}
              >
                Next
              </button>
            </div>
          </div>
        )}
      </div>

      <AnimatePresence>
        {modalMeeting && (
          <RemarkModal
            meeting={modalMeeting}
            onClose={closeModal}
            onSaved={onRemarkSaved}
            saving={saving}
            setSaving={setSaving}
          />
        )}
      </AnimatePresence>
    </div>
  );
}
