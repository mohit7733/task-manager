import { Fragment, useMemo, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  ChevronDown,
  ChevronRight,
  MessageSquarePlus,
  Search,
  RefreshCw,
  X,
  CheckCircle2,
  AlertCircle,
  Building2,
  User,
  CalendarClock,
  Paperclip,
  FileText,
} from "lucide-react";
import api from "../api/client";
import { fmtDate, isOverdue } from "../utils/format";
import { ACCEPT_MOM, buildFormData, uploadUrl } from "../utils/upload";

const EMPTY_FORM = {
  remark_description: "",
  meeting_date: "",
  pending_reason: "",
  completion_note: "",
  next_review_date: "",
  status: "Pending",
};

const STATUS_STYLES = {
  Done: "bg-emerald-100 text-emerald-800 ring-emerald-200",
  "In Progress": "bg-blue-100 text-blue-800 ring-blue-200",
  Pending: "bg-amber-100 text-amber-800 ring-amber-200",
};

const DEPT_COLORS = {
  HR: "bg-pink-100 text-pink-800",
  Finance: "bg-green-100 text-green-800",
  Operations: "bg-orange-100 text-orange-800",
  IT: "bg-blue-100 text-blue-800",
  Sales: "bg-violet-100 text-violet-800",
  Marketing: "bg-purple-100 text-purple-800",
  Legal: "bg-slate-200 text-slate-800",
  Procurement: "bg-yellow-100 text-yellow-800",
  Administration: "bg-indigo-100 text-indigo-800",
  Other: "bg-gray-100 text-gray-700",
};

const COLUMNS = [
  "Created",
  "Department",
  "Task",
  "Assigned To",
  "Status",
  "Priority",
  "Next Review",
  "Pending Reason",
  "Last Remark",
  "Outcome",
  "Actions",
];

function TaskRemarkModal({ task, onClose, onSaved, saving, setSaving }) {
  const [mode, setMode] = useState("pending");
  const [form, setForm] = useState({
    ...EMPTY_FORM,
    meeting_date: new Date().toISOString().slice(0, 10),
    status: task.status === "Done" ? "In Progress" : task.status,
  });
  const [momFile, setMomFile] = useState(null);
  const [error, setError] = useState("");

  const switchMode = (next) => {
    setMode(next);
    setError("");
    if (next === "done") {
      setForm((f) => ({ ...f, pending_reason: "", next_review_date: "" }));
    } else {
      setForm((f) => ({ ...f, completion_note: "" }));
    }
  };

  const submit = async () => {
    setError("");
    if (!form.remark_description.trim()) {
      setError("Please enter what was discussed in the weekly meeting.");
      return;
    }
    if (mode === "done") {
      if (!form.completion_note.trim()) {
        setError("Please enter the completion note to mark this task done.");
        return;
      }
    } else if (!form.pending_reason.trim()) {
      setError("Please explain why this task is still pending.");
      return;
    }

    setSaving(true);
    try {
      const payload = {
        task_id: task._id,
        remark_description: form.remark_description.trim(),
        meeting_date: form.meeting_date || new Date().toISOString().slice(0, 10),
        mark_completed: mode === "done",
      };
      if (mode === "done") {
        payload.completion_note = form.completion_note.trim();
      } else {
        payload.pending_reason = form.pending_reason.trim();
        payload.status = form.status;
        if (form.next_review_date) payload.next_review_date = form.next_review_date;
      }
      const fd = buildFormData(payload, momFile);
      await api.post("/tasks/remarks", fd);
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
        <div className="border-b border-gray-100 bg-gradient-to-r from-blue-600 to-indigo-600 px-6 py-5 text-white dark:border-gray-800">
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="text-xs font-medium uppercase tracking-wider text-indigo-200">Weekly meeting remark</p>
              <h3 className="mt-1 text-lg font-bold leading-tight">{task.title}</h3>
              <div className="mt-2 flex flex-wrap gap-2 text-xs text-indigo-100">
                <span className="inline-flex items-center gap-1 rounded-md bg-white/15 px-2 py-0.5">
                  <Building2 className="h-3 w-3" />
                  {task.department}
                </span>
                <span className="inline-flex items-center gap-1 rounded-md bg-white/15 px-2 py-0.5">
                  <User className="h-3 w-3" />
                  {task.assigned_to}
                </span>
              </div>
            </div>
            <button type="button" onClick={onClose} className="rounded-lg p-1.5 text-white/80 hover:bg-white/20">
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto px-6 py-5">
          <p className="mb-3 text-sm font-medium text-gray-700 dark:text-gray-300">
            After this week&apos;s department meeting:
          </p>
          <div className="mb-6 grid grid-cols-2 gap-3">
            <button
              type="button"
              onClick={() => switchMode("pending")}
              className={`rounded-xl border-2 p-4 text-left transition-all ${mode === "pending"
                  ? "border-amber-400 bg-amber-50 ring-2 ring-amber-200 dark:bg-amber-950/40"
                  : "border-gray-200 hover:border-gray-300 dark:border-gray-700"
                }`}
            >
              <CalendarClock className={`mb-2 h-6 w-6 ${mode === "pending" ? "text-amber-600" : "text-gray-400"}`} />
              <p className="font-semibold text-gray-900 dark:text-white">Still pending</p>
              <p className="mt-1 text-xs text-gray-500">Add why pending & schedule next review</p>
            </button>
            <button
              type="button"
              onClick={() => switchMode("done")}
              className={`rounded-xl border-2 p-4 text-left transition-all ${mode === "done"
                  ? "border-emerald-400 bg-emerald-50 ring-2 ring-emerald-200 dark:bg-emerald-950/40"
                  : "border-gray-200 hover:border-gray-300 dark:border-gray-700"
                }`}
            >
              <CheckCircle2 className={`mb-2 h-6 w-6 ${mode === "done" ? "text-emerald-600" : "text-gray-400"}`} />
              <p className="font-semibold text-gray-900 dark:text-white">Task completed</p>
              <p className="mt-1 text-xs text-gray-500">Mark done with final outcome</p>
            </button>
          </div>

          <div className="mb-4 grid grid-cols-2 gap-3">
            <div>
              <label className="mb-1 block text-xs font-medium text-gray-600">Meeting date</label>
              <input
                type="date"
                value={form.meeting_date}
                onChange={(e) => setForm((f) => ({ ...f, meeting_date: e.target.value }))}
                className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm dark:border-gray-600 dark:bg-gray-800"
              />
            </div>
            {mode === "pending" && (
              <div>
                <label className="mb-1 block text-xs font-medium text-gray-600">Status after meeting</label>
                <select
                  value={form.status}
                  onChange={(e) => setForm((f) => ({ ...f, status: e.target.value }))}
                  className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm dark:border-gray-600 dark:bg-gray-800"
                >
                  <option>Pending</option>
                  <option>In Progress</option>
                </select>
              </div>
            )}
          </div>

          <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">
            Discussion in meeting <span className="text-red-500">*</span>
          </label>
          <textarea
            rows={3}
            value={form.remark_description}
            onChange={(e) => setForm((f) => ({ ...f, remark_description: e.target.value }))}
            placeholder="What was discussed about this task in the weekly meeting?"
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
            {mode === "pending" ? (
              <motion.div
                key="pending"
                initial={{ opacity: 0, x: -8 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 8 }}
                className="space-y-4 rounded-xl border border-amber-200 bg-amber-50/50 p-4 dark:border-amber-900 dark:bg-amber-950/20"
              >
                <label className="block text-sm font-semibold text-amber-800 dark:text-amber-300">
                  Why still pending? <span className="text-red-500">*</span>
                </label>
                <textarea
                  rows={2}
                  value={form.pending_reason}
                  onChange={(e) => setForm((f) => ({ ...f, pending_reason: e.target.value }))}
                  placeholder="e.g. Waiting for budget approval from Finance"
                  className="w-full resize-none rounded-lg border border-gray-200 px-3 py-2 text-sm dark:border-gray-600 dark:bg-gray-800"
                />
                <div>
                  <label className="mb-1 block text-xs font-medium text-gray-600">Next weekly review date</label>
                  <input
                    type="date"
                    value={form.next_review_date}
                    onChange={(e) => setForm((f) => ({ ...f, next_review_date: e.target.value }))}
                    className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm dark:border-gray-600 dark:bg-gray-800"
                  />
                </div>
              </motion.div>
            ) : (
              <motion.div
                key="done"
                initial={{ opacity: 0, x: 8 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -8 }}
                className="space-y-3 rounded-xl border border-emerald-200 bg-emerald-50/50 p-4 dark:border-emerald-900 dark:bg-emerald-950/20"
              >
                <label className="block text-sm font-semibold text-emerald-800 dark:text-emerald-300">
                  Completion note <span className="text-red-500">*</span>
                </label>
                <textarea
                  rows={3}
                  value={form.completion_note}
                  onChange={(e) => setForm((f) => ({ ...f, completion_note: e.target.value }))}
                  placeholder="Summarize final result — task will be marked Done"
                  className="w-full resize-none rounded-lg border border-gray-200 px-3 py-2 text-sm dark:border-gray-600 dark:bg-gray-800"
                />
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
            className={`flex-1 rounded-xl py-2.5 text-sm font-semibold text-white shadow-md disabled:opacity-50 ${mode === "done" ? "bg-emerald-600 hover:bg-emerald-500" : "bg-indigo-600 hover:bg-indigo-500"
              }`}
          >
            {saving ? "Saving…" : mode === "done" ? "Save & Mark Done" : "Save Pending Remark"}
          </button>
        </div>
      </motion.div>
    </div>
  );
}

export default function TaskTable({ tasks, reload, departmentFilter, onDepartmentFilter }) {
  const [expanded, setExpanded] = useState(null);
  const [timeline, setTimeline] = useState(null);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [page, setPage] = useState(1);
  const [modalTask, setModalTask] = useState(null);
  const [saving, setSaving] = useState(false);
  const perPage = 15;

  const departments = useMemo(() => {
    const set = new Set(tasks.map((t) => t.department).filter(Boolean));
    return [...set].sort();
  }, [tasks]);

  const filtered = useMemo(() => {
    let list = [...tasks];
    if (departmentFilter) list = list.filter((t) => t.department === departmentFilter);
    if (statusFilter) list = list.filter((t) => t.status === statusFilter);
    if (search) {
      const q = search.toLowerCase();
      list = list.filter(
        (t) =>
          t.title?.toLowerCase().includes(q) ||
          t.assigned_to?.toLowerCase().includes(q) ||
          t.department?.toLowerCase().includes(q) ||
          t.latest_pending_reason?.toLowerCase().includes(q)
      );
    }
    return list;
  }, [tasks, search, statusFilter, departmentFilter]);

  const pages = Math.max(1, Math.ceil(filtered.length / perPage));
  const rows = filtered.slice((page - 1) * perPage, page * perPage);

  const toggleExpand = async (id) => {
    if (expanded === id) {
      setExpanded(null);
      setTimeline(null);
      return;
    }
    setExpanded(id);
    setTimeline(null);
    const { data } = await api.get(`/tasks/${id}/timeline`);
    setTimeline(data);
  };

  const updateStatus = async (id, status, e) => {
    e.stopPropagation();
    await api.put(`/tasks/${id}`, { status });
    reload();
  };

  const onRemarkSaved = async () => {
    await reload();
    if (expanded && modalTask) {
      const { data } = await api.get(`/tasks/${modalTask._id}/timeline`);
      setTimeline(data);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-3 rounded-2xl border border-gray-200/80 bg-white p-4 shadow-sm dark:border-gray-700 dark:bg-gray-900">
        <div className="relative min-w-[220px] flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
          <input
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(1);
            }}
            placeholder="Search task, person, department…"
            className="w-full rounded-xl border-0 bg-gray-50 py-2.5 pl-10 pr-3 text-sm ring-1 ring-gray-200 focus:ring-2 focus:ring-indigo-500 dark:bg-gray-800 dark:ring-gray-600 dark:text-white"
          />
        </div>
        <select
          value={departmentFilter}
          onChange={(e) => {
            onDepartmentFilter(e.target.value);
            setPage(1);
          }}
          className="rounded-xl border-0 bg-gray-50 px-4 py-2.5 text-sm ring-1 ring-gray-200 dark:bg-gray-800 dark:ring-gray-600 dark:text-white"
        >
          <option value="">All departments</option>
          {departments.map((d) => (
            <option key={d} value={d}>
              {d}
            </option>
          ))}
        </select>
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
          <option>Done</option>
        </select>
        <button
          type="button"
          onClick={reload}
          className="inline-flex items-center gap-2 rounded-xl bg-gray-50 px-4 py-2.5 text-sm font-medium ring-1 ring-gray-200 hover:bg-gray-100 dark:bg-gray-800 dark:ring-gray-600"
        >
          <RefreshCw className="h-4 w-4" />
          Refresh
        </button>
        <span className="text-xs text-gray-500">{filtered.length} tasks</span>
      </div>

      <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-md dark:border-gray-700 dark:bg-gray-900">
        <div className="max-h-[68vh] overflow-auto">
          <table className="excel-table w-full min-w-[1200px] border-collapse text-[13px]">
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
                    No tasks match your filters
                  </td>
                </tr>
              ) : (
                rows.map((t) => {
                  const reviewOverdue =
                    t.status !== "Done" && t.next_review_date && isOverdue({ meeting_date: t.next_review_date });
                  const rowOpen = expanded === t._id;
                  const last = t.lastRemark;

                  return (
                    <Fragment key={t._id}>
                      <tr
                        onClick={() => toggleExpand(t._id)}
                        className={`group transition-colors ${reviewOverdue
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
                          {fmtDate(t.task_create_date)}
                        </td>
                        <td className="border-b border-r border-gray-100 px-3 py-2.5 dark:border-gray-800">
                          <span
                            className={`rounded-md px-2 py-0.5 text-xs font-semibold ${DEPT_COLORS[t.department] || DEPT_COLORS.Other}`}
                          >
                            {t.department}
                          </span>
                        </td>
                        <td className="max-w-[220px] border-b border-r border-gray-100 px-3 py-2.5 font-semibold text-gray-900 dark:border-gray-800 dark:text-white">
                          {t.title}
                        </td>
                        <td className="border-b border-r border-gray-100 px-3 py-2.5 dark:border-gray-800">
                          <span className="inline-flex items-center gap-1">
                            <User className="h-3.5 w-3.5 text-gray-400" />
                            {t.assigned_to}
                          </span>
                        </td>
                        <td className="border-b border-r border-gray-100 px-2 py-2 dark:border-gray-800" onClick={(e) => e.stopPropagation()}>
                          <select
                            value={t.status}
                            onChange={(e) => updateStatus(t._id, e.target.value, e)}
                            disabled={t.status === "Done"}
                            className={`w-full cursor-pointer rounded-lg border-0 px-2 py-1 text-xs font-semibold ring-1 ring-inset disabled:opacity-70 ${STATUS_STYLES[t.status] || "bg-gray-100"}`}
                          >
                            <option>Pending</option>
                            <option>In Progress</option>
                            <option>Done</option>
                          </select>
                        </td>
                        <td className="border-b border-r border-gray-100 px-3 py-2.5 dark:border-gray-800">
                          <span
                            className={`rounded px-1.5 py-0.5 text-xs font-medium ${t.priority === "Critical"
                                ? "bg-red-100 text-red-700"
                                : t.priority === "High"
                                  ? "bg-orange-100 text-orange-700"
                                  : "bg-gray-100 text-gray-600"
                              }`}
                          >
                            {t.priority}
                          </span>
                        </td>
                        <td className="border-b border-r border-gray-100 px-3 py-2.5 dark:border-gray-800">
                          <span className="flex items-center gap-1">
                            {fmtDate(t.next_review_date)}
                            {reviewOverdue && <AlertCircle className="h-3.5 w-3.5 text-red-500" title="Review overdue" />}
                          </span>
                        </td>
                        <td className="max-w-[160px] border-b border-r border-gray-100 px-3 py-2.5 text-amber-800 dark:border-gray-800 dark:text-amber-300">
                          <span className="line-clamp-2" title={t.latest_pending_reason}>
                            {t.latest_pending_reason || "—"}
                          </span>
                        </td>
                        <td className="max-w-[160px] border-b border-r border-gray-100 px-3 py-2.5 dark:border-gray-800">
                          {last ? (
                            <span className="rounded-md bg-slate-100 px-2 py-1 text-xs dark:bg-slate-800" title={last.remark_description}>
                              <span className="font-bold text-indigo-600">#{last.remark_number}</span>{" "}
                              {(last.remark_description || "").slice(0, 45)}
                              {(last.remark_description || "").length > 45 ? "…" : ""}
                            </span>
                          ) : (
                            <span className="text-gray-400">—</span>
                          )}
                        </td>
                        <td className="max-w-[140px] border-b border-r border-gray-100 px-3 py-2.5 dark:border-gray-800">
                          {t.final_outcome ? (
                            <span className="line-clamp-2 text-emerald-700 dark:text-emerald-400" title={t.final_outcome}>
                              {t.final_outcome}
                            </span>
                          ) : (
                            "—"
                          )}
                        </td>
                        <td className="border-b border-gray-100 px-2 py-2 dark:border-gray-800" onClick={(e) => e.stopPropagation()}>
                          {t.status !== "Done" && (
                            <button
                              type="button"
                              title="Add weekly meeting remark"
                              onClick={(e) => {
                                e.stopPropagation();
                                setModalTask(t);
                              }}
                              className="inline-flex items-center gap-1.5 rounded-lg bg-indigo-600 px-3 py-1.5 text-xs font-semibold text-white shadow-sm transition hover:bg-indigo-500"
                            >
                              <MessageSquarePlus className="h-3.5 w-3.5" />
                              Remark
                            </button>
                          )}
                        </td>
                      </tr>

                      <AnimatePresence>
                        {rowOpen && timeline?.task?._id === t._id && (
                          <tr>
                            <td
                              colSpan={COLUMNS.length + 1}
                              className="border-b border-gray-100 bg-slate-50/90 p-5 dark:border-gray-800 dark:bg-slate-900/60"
                            >
                              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                                <p className="mb-4 text-sm font-bold text-slate-700 dark:text-slate-200">
                                  Weekly meeting history · {timeline.remarks?.length || 0} remark(s)
                                </p>
                                <div className="ml-2 space-y-0 border-l-2 border-indigo-300 pl-6 dark:border-indigo-600">
                                  <div className="relative pb-5">
                                    <span className="absolute -left-[29px] top-0.5 flex h-4 w-4 items-center justify-center rounded-full bg-indigo-500 ring-4 ring-indigo-100 dark:ring-indigo-900" />
                                    <p className="text-xs font-bold uppercase text-indigo-600 dark:text-indigo-300">Task created</p>
                                    <p className="text-sm font-medium text-gray-900 dark:text-white">{timeline.task.title}</p>
                                    <p className="text-xs text-gray-500 dark:text-gray-400">
                                      {timeline.task.department} · {timeline.task.assigned_to} ·{" "}
                                      {fmtDate(timeline.task.task_create_date)}
                                    </p>
                                  </div>
                                  {(timeline.remarks || []).map((r) => (
                                    <div key={r._id} className="relative pb-5">
                                      <span
                                        className={`absolute -left-[29px] top-0.5 flex h-4 w-4 items-center justify-center rounded-full ring-4 ${
                                          r.status_after === "Done"
                                            ? "bg-emerald-500 ring-emerald-100 dark:ring-emerald-900"
                                            : "bg-amber-500 ring-amber-100 dark:ring-amber-900"
                                        }`}
                                      />
                                      <p className="text-xs font-bold text-amber-700 dark:text-amber-300">
                                        Remark #{r.remark_number} · Meeting {fmtDate(r.meeting_date || r.remark_date)}
                                        {r.status_after && (
                                          <span
                                            className={`ml-2 rounded px-1.5 py-0.5 font-semibold ${
                                              r.status_after === "Done"
                                                ? "bg-emerald-100 text-emerald-800 dark:bg-emerald-900/50 dark:text-emerald-300"
                                                : r.status_after === "In Progress"
                                                  ? "bg-blue-100 text-blue-800 dark:bg-blue-900/50 dark:text-blue-300"
                                                  : "bg-amber-100 text-amber-800 dark:bg-amber-900/50 dark:text-amber-300"
                                            }`}
                                          >
                                            {r.status_after}
                                          </span>
                                        )}
                                      </p>
                                      <p className="text-sm text-gray-800 dark:text-gray-200">{r.remark_description}</p>
                                      {r.pending_reason && (
                                        <p className="mt-1 text-xs text-amber-600 dark:text-amber-400">
                                          Pending: {r.pending_reason}
                                        </p>
                                      )}
                                      {r.completion_note && (
                                        <p className="mt-1 text-xs text-emerald-600 dark:text-emerald-400">
                                          Done: {r.completion_note}
                                        </p>
                                      )}
                                      {r.next_review_date && (
                                        <p className="text-xs text-gray-500 dark:text-gray-400">
                                          Next review: {fmtDate(r.next_review_date)}
                                        </p>
                                      )}
                                      {r.attachment && (
                                        <a
                                          href={uploadUrl(r.attachment)}
                                          target="_blank"
                                          rel="noopener noreferrer"
                                          onClick={(e) => e.stopPropagation()}
                                          className="mt-1 inline-flex items-center gap-1 text-xs font-medium text-indigo-600 hover:text-indigo-500 dark:text-indigo-400"
                                        >
                                          <FileText className="h-3 w-3" />
                                          View MOM document
                                        </a>
                                      )}
                                    </div>
                                  ))}
                                  {timeline.task.status === "Done" && timeline.task.final_outcome && (
                                    <div className="relative">
                                      <span className="absolute -left-[29px] top-0.5 flex h-4 w-4 items-center justify-center rounded-full bg-emerald-500 ring-4 ring-emerald-100 dark:ring-emerald-900" />
                                      <p className="text-xs font-bold text-emerald-700 dark:text-emerald-300">Completed</p>
                                      <p className="text-sm text-gray-800 dark:text-gray-200">{timeline.task.final_outcome}</p>
                                    </div>
                                  )}
                                </div>
                                {t.status !== "Done" && (
                                  <button
                                    type="button"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      setModalTask(t);
                                    }}
                                    className="mt-4 text-sm font-medium text-indigo-600 hover:text-indigo-500 dark:text-indigo-400"
                                  >
                                    + Add another remark
                                  </button>
                                )}
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
        {modalTask && (
          <TaskRemarkModal
            task={modalTask}
            onClose={() => setModalTask(null)}
            onSaved={onRemarkSaved}
            saving={saving}
            setSaving={setSaving}
          />
        )}
      </AnimatePresence>
    </div>
  );
}
