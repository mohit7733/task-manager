import { Fragment, useEffect, useMemo, useState } from "react";
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
  Pencil,
  Trash2,
} from "lucide-react";
import api from "../api/client";
import { fmtDate, isOverdue, toInputDate } from "../utils/format";
import { ACCEPT_MOM, buildFormData, uploadUrl } from "../utils/upload";
import { brand } from "../utils/theme";

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

export const DEPT_COLORS = {
  // Civilmantra Departments
  "Legal/Account Department": "bg-pink-100 text-pink-800",
  "Business Development": "bg-purple-100 text-purple-800",
  "Pre Engineering": "bg-blue-100 text-blue-800",
  "Information Technology": "bg-indigo-100 text-indigo-800",
  "Planning & Monitoring": "bg-teal-100 text-teal-800",
  "Mantra Group": "bg-gray-100 text-gray-800",
  "Highway": "bg-green-100 text-green-800",
  "Accounts": "bg-emerald-100 text-emerald-800",
  "Underground Engineering": "bg-amber-100 text-amber-800",
  "Electrical & Mechanical": "bg-yellow-100 text-yellow-800",
  "Tunnel": "bg-slate-100 text-slate-800",
  "Management Review System": "bg-rose-100 text-rose-800",
  "PMC": "bg-orange-100 text-orange-800",
  "Water Resource": "bg-cyan-100 text-cyan-800",
  "Architecture": "bg-fuchsia-100 text-fuchsia-800",
  "Admin": "bg-red-100 text-red-800",
  "Structure": "bg-violet-100 text-violet-800",
  "Support Staff": "bg-stone-100 text-stone-800",
  "Quality Control": "bg-lime-100 text-lime-800",
  "Railway": "bg-amber-100 text-amber-800",
  "Prebid cum DPR": "bg-indigo-100 text-indigo-800",
  "NSV": "bg-purple-100 text-purple-800",
  "FWD": "bg-blue-100 text-blue-800",
  "Site : AP PKG-6": "bg-green-100 text-green-800",
  "Site : Pattan Bypass": "bg-teal-100 text-teal-800",
  "Project Co-ordination": "bg-cyan-100 text-cyan-800",
  "Site : Baramulla": "bg-rose-100 text-rose-800",
  "Finance Marketing Executive": "bg-pink-100 text-pink-800",
  "Geotech": "bg-amber-100 text-amber-800",
  "Human Resources": "bg-fuchsia-100 text-fuchsia-800",
  "Marketing": "bg-purple-100 text-purple-800",
  "Structure-Plumbing Engineer": "bg-blue-100 text-blue-800",
  "Structure-Buildings": "bg-indigo-100 text-indigo-800",
  "Operations": "bg-orange-100 text-orange-800",
  "LAB": "bg-green-100 text-green-800",
  "Goa-Site": "bg-teal-100 text-teal-800",
  "Project Coordinator": "bg-cyan-100 text-cyan-800",
  "Lab & Machinery": "bg-yellow-100 text-yellow-800",
  "Electrical": "bg-amber-100 text-amber-800",
  "Site: Vadgaon Katraj": "bg-rose-100 text-rose-800",
  "Site : Jhajra": "bg-emerald-100 text-emerald-800",
  "Site : Budhni": "bg-blue-100 text-blue-800",
  "Site: Bamni": "bg-purple-100 text-purple-800",
  "Site: North South Corridor": "bg-indigo-100 text-indigo-800",
  "Site: Ghaziabad Aligadh": "bg-violet-100 text-violet-800",
  "Pre-Engineering cum DPR": "bg-slate-100 text-slate-800",
  "Site: Hardoi": "bg-rose-100 text-rose-800",

  // Aimantra Departments
  "Administration": "bg-indigo-100 text-indigo-800",
  "Information Technology": "bg-blue-100 text-blue-800",
  "IT": "bg-blue-100 text-blue-800",

  // Saptagon Departments
  "Auxiliary": "bg-stone-100 text-stone-800",
  "Contracts": "bg-orange-100 text-orange-800",
  "Equipments": "bg-amber-100 text-amber-800",
  "Intermittent": "bg-teal-100 text-teal-800",
  "Lab": "bg-green-100 text-green-800",
  "Management": "bg-purple-100 text-purple-800",
  "Quantity Survey": "bg-cyan-100 text-cyan-800",
  "Safety and Contracts": "bg-rose-100 text-rose-800",
  "Project Monitoring": "bg-blue-100 text-blue-800",
  "Road Safety": "bg-red-100 text-red-800",

  // Sub-company specific
  "Civilmantra_HR": "bg-pink-100 text-pink-800",
  "Civilmantra_Finance": "bg-green-100 text-green-800",
  "Civilmantra_Operations": "bg-orange-100 text-orange-800",
  "Civilmantra_IT": "bg-blue-100 text-blue-800",
  "Civilmantra_Sales": "bg-violet-100 text-violet-800",
  "Civilmantra_Marketing": "bg-purple-100 text-purple-800",
  "Civilmantra_Legal": "bg-slate-200 text-slate-800",
  "Civilmantra_Procurement": "bg-yellow-100 text-yellow-800",
  "Civilmantra_Administration": "bg-indigo-100 text-indigo-800",
  "Civilmantra_Other": "bg-gray-100 text-gray-700",

  "Aimantra_HR": "bg-pink-100 text-pink-800",
  "Aimantra_Finance": "bg-green-100 text-green-800",
  "Aimantra_Operations": "bg-orange-100 text-orange-800",
  "Aimantra_IT": "bg-blue-100 text-blue-800",
  "Aimantra_Sales": "bg-violet-100 text-violet-800",
  "Aimantra_Marketing": "bg-purple-100 text-purple-800",
  "Aimantra_Legal": "bg-slate-200 text-slate-800",
  "Aimantra_Procurement": "bg-yellow-100 text-yellow-800",
  "Aimantra_Administration": "bg-indigo-100 text-indigo-800",
  "Aimantra_Other": "bg-gray-100 text-gray-700",

  "Saptagon_HR": "bg-pink-100 text-pink-800",
  "Saptagon_Finance": "bg-green-100 text-green-800",
  "Saptagon_Operations": "bg-orange-100 text-orange-800",
  "Saptagon_IT": "bg-blue-100 text-blue-800",
  "Saptagon_Sales": "bg-violet-100 text-violet-800",
  "Saptagon_Marketing": "bg-purple-100 text-purple-800",
  "Saptagon_Legal": "bg-slate-200 text-slate-800",
  "Saptagon_Procurement": "bg-yellow-100 text-yellow-800",
  "Saptagon_Administration": "bg-indigo-100 text-indigo-800",
  "Saptagon_Other": "bg-gray-100 text-gray-700",

  // Default/Other
  "Other": "bg-gray-100 text-gray-700",
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

function TaskRemarkModal({ task, remark, onClose, onSaved, saving, setSaving }) {
  const isEdit = Boolean(remark);
  const [mode, setMode] = useState("pending");
  const [form, setForm] = useState({
    ...EMPTY_FORM,
    meeting_date: new Date().toISOString().slice(0, 10),
    status: task.status === "Done" ? "In Progress" : task.status,
  });
  const [momFile, setMomFile] = useState(null);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!remark) {
      setForm({
        ...EMPTY_FORM,
        meeting_date: new Date().toISOString().slice(0, 10),
        status: task.status === "Done" ? "In Progress" : task.status,
      });
      setMode("pending");
      setMomFile(null);
      setError("");
      return;
    }
    const isDone = remark.status_after === "Done";
    setMode(isDone ? "done" : "pending");
    setForm({
      remark_description: remark.remark_description || "",
      meeting_date: toInputDate(remark.meeting_date || remark.remark_date),
      pending_reason: remark.pending_reason || "",
      completion_note: remark.completion_note || "",
      next_review_date: toInputDate(remark.next_review_date),
      status: remark.status_after || "Pending",
    });
    setMomFile(null);
    setError("");
  }, [remark, task]);

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
    // if (!form.remark_description.trim()) {
    //   setError("Please enter what was discussed in the weekly meeting.");
    //   return;
    // }
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
        remark_description: form.remark_description.trim(),
        meeting_date: form.meeting_date || new Date().toISOString().slice(0, 10),
        mark_completed: mode === "done",
      };
      if (!isEdit) payload.task_id = task._id;
      if (mode === "done") {
        payload.completion_note = form.completion_note.trim();
      } else {
        payload.pending_reason = form.pending_reason.trim();
        payload.status = form.status;
        if (form.next_review_date) payload.next_review_date = form.next_review_date;
      }
      const fd = buildFormData(payload, momFile);
      if (isEdit) {
        await api.put(`/tasks/remarks/${remark._id}`, fd);
      } else {
        await api.post("/tasks/remarks", fd);
      }
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
        <div className={brand.modalHeader}>
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="text-xs font-medium uppercase tracking-wider text-indigo-200">
                {isEdit ? `Edit Remark #${remark.remark_number}` : "Add Remark"}
              </p>
              <h3 className="mt-1 text-lg font-bold leading-tight">{task.title}</h3>
              <div className="mt-2 flex flex-wrap gap-2 text-xs text-indigo-100">
                <span className="inline-flex items-center gap-1 rounded-md bg-white/15 px-2 py-0.5">
                  <Building2 className="h-3 w-3" />
                  {task.department}
                </span>
                <span className="inline-flex items-center gap-1 rounded-md bg-white/15 px-2 py-0.5">
                  <User className="h-3 w-3" />
                  {task.assigned_to.map((u) => u.name).filter(Boolean).join(", ")}
                </span>
                {task.next_review_date && (
                  <span className="inline-flex items-center gap-1 rounded-md bg-white/15 px-2 py-0.5">
                    <CalendarClock className="h-3 w-3" />
                    Review {fmtDate(task.next_review_date)}
                  </span>
                )}
              </div>
            </div>
            <button type="button" onClick={onClose} className="rounded-lg p-1.5 text-white/80 hover:bg-white/20">
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto px-6 py-5">
          {!isEdit && (
            <>
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
            </>
          )}

          {/* <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">
            Discussion / Remark <span className="text-red-500">*</span>
          </label>
          <textarea
            rows={3}
            value={form.remark_description}
            onChange={(e) => setForm((f) => ({ ...f, remark_description: e.target.value }))}
            placeholder="What was discussed about this task in the weekly meeting?"
            className="mb-4 w-full resize-none rounded-xl border border-gray-200 px-4 py-3 text-sm focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 dark:border-gray-600 dark:bg-gray-800 dark:text-white"
          /> */}

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
                <p className="text-sm font-semibold text-amber-800 dark:text-amber-300">
                  Still pending (required — schedule next review)
                </p>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="mb-1 block text-xs font-medium text-gray-600">Meeting date</label>
                    <input
                      type="date"
                      value={form.meeting_date}
                      onChange={(e) => setForm((f) => ({ ...f, meeting_date: e.target.value }))}
                      className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm dark:border-gray-600 dark:bg-gray-800"
                    />
                  </div>
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
                </div>
                <div>
                  <label className="mb-1 block text-xs font-medium text-gray-600">
                    Why still pending? <span className="text-red-500">*</span>
                  </label>
                  <textarea
                    rows={2}
                    value={form.pending_reason}
                    onChange={(e) => setForm((f) => ({ ...f, pending_reason: e.target.value }))}
                    placeholder="e.g. Waiting for budget approval from Finance"
                    className="w-full resize-none rounded-lg border border-gray-200 px-3 py-2 text-sm dark:border-gray-600 dark:bg-gray-800"
                  />
                </div>
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
                <p className="text-sm font-semibold text-emerald-800 dark:text-emerald-300">
                  Completion note (required — marks task done)
                </p>
                <textarea
                  rows={3}
                  value={form.completion_note}
                  onChange={(e) => setForm((f) => ({ ...f, completion_note: e.target.value }))}
                  placeholder="Summarize final result — task will be marked Done"
                  className="w-full resize-none rounded-lg border border-gray-200 px-3 py-2 text-sm dark:border-gray-600 dark:bg-gray-800"
                />
                <p className="flex items-start gap-2 text-xs text-emerald-700 dark:text-emerald-400">
                  <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0" />
                  No further weekly reviews will be scheduled. Use this only when the task is fully complete.
                </p>
              </motion.div>
            )}
          </AnimatePresence>

          {error && (
            <div className={`mt-4 ${brand.errorAlert}`}>
              <AlertCircle className="h-4 w-4 shrink-0" />
              {error}
            </div>
          )}
        </div>

        <div className={brand.modalFooter}>
          <button type="button" onClick={onClose} className={`flex-1 py-2.5 ${brand.btnSecondary}`}>
            Cancel
          </button>
          <button
            type="button"
            disabled={saving}
            onClick={submit}
            className={`flex-1 rounded-xl py-2.5 text-sm font-semibold shadow-md disabled:opacity-50 ${mode === "done" ? brand.btnSuccess : brand.btn
              }`}
          >
            {saving
              ? "Saving…"
              : isEdit
                ? "Save Remark"
                : mode === "done"
                  ? "Save & Mark Done"
                  : "Save Pending Remark"}
          </button>
        </div>
      </motion.div>
    </div>
  );
}

export default function TaskTable({ tasks, reload, departmentFilter, onDepartmentFilter, onEditTask }) {
  const [expanded, setExpanded] = useState(null);
  const [timeline, setTimeline] = useState(null);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [page, setPage] = useState(1);
  const [modalTask, setModalTask] = useState(null);
  const [editingRemark, setEditingRemark] = useState(null);
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
          t.assigned_to?.map((u) => u.name).filter(Boolean).join(", ").toLowerCase().includes(q) ||
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

  const openRemarkModal = (task, e, remark = null) => {
    e?.stopPropagation?.();
    setEditingRemark(remark);
    setModalTask(task);
  };

  const closeModal = () => {
    setModalTask(null);
    setEditingRemark(null);
  };

  const deleteTask = async (task, e) => {
    e.stopPropagation();
    if (!window.confirm(`Delete task "${task.title}"? All remarks will also be removed.`)) return;
    try {
      await api.delete(`/tasks/${task._id}`);
      if (expanded === task._id) {
        setExpanded(null);
        setTimeline(null);
      }
      await reload();
    } catch {
      alert("Failed to delete task.");
    }
  };

  const deleteRemark = async (remark, taskId, e) => {
    e.stopPropagation();
    if (!window.confirm(`Delete remark #${remark.remark_number}?`)) return;
    try {
      await api.delete(`/tasks/remarks/${remark._id}`);
      await reload();
      if (expanded === taskId) {
        const { data } = await api.get(`/tasks/${taskId}/timeline`);
        setTimeline(data);
      }
    } catch {
      alert("Failed to delete remark.");
    }
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
      <div className={brand.toolbar}>
        <div className="relative min-w-[220px] flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <input
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(1);
            }}
            placeholder="Search task, person, department…"
            className={brand.searchInput}
          />
        </div>
        <select
          value={departmentFilter}
          onChange={(e) => {
            onDepartmentFilter(e.target.value);
            setPage(1);
          }}
          className={brand.toolbarSelect}
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
          className={brand.toolbarSelect}
        >
          <option value="">All status</option>
          <option>Pending</option>
          <option>In Progress</option>
          <option>Done</option>
        </select>
        <button
          type="button"
          onClick={reload}
          className={brand.toolbarBtn}
        >
          <RefreshCw className="h-4 w-4" />
          Refresh
        </button>
        <span className="text-xs text-slate-500">{filtered.length} tasks</span>
      </div>

      <div className={brand.tableWrap}>
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
                            {t.assigned_to.length > 0 ? t.assigned_to.map((u) => u.name).filter(Boolean).join(", ") : "—"}
                          </span>
                        </td>
                        <td className="border-b border-r border-gray-100 px-2 py-2 dark:border-gray-800" onClick={(e) => e.stopPropagation()}>
                          <select
                            value={t.status}
                            onChange={(e) => updateStatus(t._id, e.target.value, e)}
                            // disabled={t.status === "Done"}
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
                          <div className="flex flex-wrap gap-1">
                            {onEditTask && (
                              <button
                                type="button"
                                title="Edit task"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  onEditTask(t);
                                }}
                                className="inline-flex items-center gap-1 rounded-lg border border-slate-200 px-2 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-50 dark:border-slate-600 dark:text-slate-300"
                              >
                                <Pencil className="h-3.5 w-3.5" />
                                Edit
                              </button>
                            )}
                            <button
                              type="button"
                              title="Delete task"
                              onClick={(e) => deleteTask(t, e)}
                              className="inline-flex items-center gap-1 rounded-lg border border-red-200 px-2 py-1.5 text-xs font-medium text-red-600 hover:bg-red-50 dark:border-red-900 dark:text-red-400"
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                            </button>
                            {t.status !== "Done" && (
                              <button
                                type="button"
                                title="Add weekly meeting remark"
                                onClick={(e) => openRemarkModal(t, e)}
                                className="inline-flex items-center gap-1.5 rounded-lg bg-indigo-600 px-2 py-1.5 text-xs font-semibold text-white shadow-sm transition hover:bg-indigo-500"
                              >
                                <MessageSquarePlus className="h-3.5 w-3.5" />
                                Remark
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>

                      <AnimatePresence>
                        {rowOpen && timeline?.task?._id === t._id && (
                          <tr>
                            <td
                              colSpan={COLUMNS.length + 1}
                              className="border-b border-gray-100 bg-gradient-to-tr from-indigo-50 via-white to-sky-100 p-0 dark:from-slate-800 dark:via-slate-900 dark:to-slate-900"
                            >
                              <motion.div
                                initial={{ opacity: 0, y: 16 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: 16 }}
                              >
                                <div className="flex flex-col gap-6">
                                  <div className="w-full rounded-xl bg-white p-6 shadow-md ring-1 ring-indigo-100 dark:bg-slate-800 dark:ring-slate-700">
                                    <div className="mb-4 flex items-center gap-3">
                                      <span className="flex h-10 w-10 items-center justify-center rounded-full bg-indigo-100 text-lg font-extrabold text-indigo-700 ring-4 ring-indigo-200 dark:bg-indigo-900 dark:text-indigo-200 dark:ring-indigo-700">
                                        <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m4-1V7a4 4 0 10-8 0v4a4 4 0 008 0z" /></svg>
                                      </span>
                                      <div>
                                        <p className="text-lg font-bold text-indigo-700 dark:text-indigo-200">
                                          Follow-up Timeline
                                        </p>
                                        <p className="text-xs text-slate-500 dark:text-slate-300">{timeline.task?.title}</p>
                                      </div>
                                    </div>
                                    <div className="grid gap-4">
                                      <div className="mb-2 flex flex-col rounded-md border-l-4 border-indigo-400 bg-gradient-to-r from-indigo-50 to-indigo-100 px-4 py-2 shadow-sm dark:border-indigo-700 dark:from-indigo-900 dark:to-slate-900 sm:flex-row sm:items-center sm:justify-between">
                                        <div>
                                          <p className="text-xs font-bold uppercase text-indigo-600 dark:text-indigo-300">
                                            Created
                                          </p>
                                          <p className="text-sm font-medium text-slate-800 dark:text-slate-200">
                                            {fmtDate(timeline.task.task_create_date)}
                                          </p>
                                          <p className="text-xs text-slate-500 dark:text-slate-400">
                                            {timeline.task.department} · {timeline.task.assigned_to.map((u) => u.name).filter(Boolean).join(", ") || "—"}
                                          </p>
                                        </div>
                                        <span className="mt-2 inline-block rounded-full bg-indigo-600 px-3 py-1 text-xs font-semibold text-white dark:bg-indigo-400 sm:mt-0">
                                          {timeline.task.status}
                                        </span>
                                      </div>
                                      {(timeline.remarks || []).map((r) => (
                                        r.status_after !== "Done" ? (
                                          <div
                                            key={r._id}
                                            className="relative flex flex-row items-center gap-4 rounded-md border-l-4 border-amber-500 bg-white px-4 py-3 shadow dark:bg-slate-900"
                                          >
                                            <span className="absolute left-0 flex h-9 w-9 -translate-x-1/2 items-center justify-center rounded-full bg-amber-100 text-amber-700 shadow ring-2 ring-amber-200 dark:bg-amber-900 dark:text-amber-200 dark:ring-amber-700">
                                              #{r.remark_number}
                                            </span>
                                            <div className="flex-1 pl-8">
                                              <div className="mb-1 flex items-center gap-2">
                                                <p className="text-xs font-bold text-amber-700 dark:text-amber-300">
                                                  Remark #{r.remark_number}
                                                </p>
                                                <span className="rounded bg-amber-50 px-2 py-0.5 text-xs text-amber-700 dark:bg-amber-800/40 dark:text-amber-300">
                                                  Meeting on {fmtDate(r.meeting_date || r.remark_date)}
                                                </span>
                                                <span className="rounded bg-amber-50 px-2 py-0.5 text-xs text-amber-700 dark:bg-amber-800/40 dark:text-amber-300">
                                                  Remarked on {fmtDate(r.updatedAt || r.remark_date)}
                                                </span>
                                                {r.status_after && (
                                                  <span className={`rounded bg-slate-100 px-2 py-0.5 text-xs font-medium dark:bg-slate-800 ${STATUS_STYLES[r.status_after] || "bg-gray-100"}`}>
                                                    {r.status_after}
                                                  </span>
                                                )}
                                              </div>
                                              <p className="mb-1 text-sm text-gray-800 dark:text-gray-200">
                                                {r.remark_description}
                                              </p>
                                              <div className="flex flex-wrap items-center gap-2 text-xs">
                                                {r.pending_reason && (
                                                  <span className="rounded bg-amber-50 px-2 py-0.5 font-medium text-amber-700 dark:bg-amber-900/30 dark:text-amber-300">
                                                    Pending: {r.pending_reason}
                                                  </span>
                                                )}
                                                {r.completion_note && (
                                                  <span className="rounded bg-emerald-50 px-2 py-0.5 font-medium text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300">
                                                    Done: {r.completion_note}
                                                  </span>
                                                )}
                                                {r.next_review_date && (
                                                  <span className="rounded bg-gray-50 px-2 py-0.5 text-gray-500 dark:bg-slate-700/30 dark:text-gray-400">
                                                    Next review: {fmtDate(r.next_review_date)}
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
                                            <div className="flex shrink-0 gap-1" onClick={(e) => e.stopPropagation()}>
                                              <button
                                                type="button"
                                                title="Edit remark"
                                                onClick={(e) => openRemarkModal(t, e, r)}
                                                className="rounded-lg p-1.5 text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800"
                                              >
                                                <Pencil className="h-4 w-4" />
                                              </button>
                                              <button
                                                type="button"
                                                title="Delete remark"
                                                onClick={(e) => deleteRemark(r, t._id, e)}
                                                className="rounded-lg p-1.5 text-red-500 hover:bg-red-50 dark:hover:bg-red-950/40"
                                              >
                                                <Trash2 className="h-4 w-4" />
                                              </button>
                                            </div>
                                          </div>
                                        )
                                          : <div className="flex flex-row items-center gap-4 rounded-md border-l-4 border-emerald-500 bg-emerald-50 px-4 py-3 shadow dark:bg-emerald-900/25">
                                            <span className="flex h-9 w-9 items-center justify-center rounded-full bg-emerald-500 text-base font-black text-white shadow ring-2 ring-emerald-200 dark:bg-emerald-700 dark:ring-emerald-700">
                                              ✓
                                            </span>
                                            <div>
                                              <p className="mb-1 text-xs font-bold text-emerald-700 dark:text-emerald-300">
                                                {r.status_after}
                                              </p>
                                              <p className="text-sm text-emerald-900 dark:text-emerald-100">
                                                {r.completion_note}
                                              </p>
                                            </div>
                                          </div>
                                      ))}
                                      {timeline.task.status === "Done" && timeline.task.final_outcome && (
                                        <div className="flex flex-row items-center gap-4 rounded-md border-l-4 border-emerald-500 bg-emerald-50 px-4 py-3 shadow dark:bg-emerald-900/25">
                                          <span className="flex h-9 w-9 items-center justify-center rounded-full bg-emerald-500 text-base font-black text-white shadow ring-2 ring-emerald-200 dark:bg-emerald-700 dark:ring-emerald-700">
                                            ✓
                                          </span>
                                          <div>
                                            <p className="mb-1 text-xs font-bold text-emerald-700 dark:text-emerald-300">
                                              Completed
                                            </p>
                                            <p className="text-sm text-emerald-900 dark:text-emerald-100">
                                              {timeline.task.final_outcome}
                                            </p>
                                          </div>
                                        </div>
                                      )}
                                    </div>
                                    {t.status !== "Done" && (
                                      <div className="flex justify-end pt-3">
                                        <button
                                          type="button"
                                          onClick={(e) => openRemarkModal(t, e)}
                                          className="inline-flex items-center gap-2 rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white shadow transition hover:bg-indigo-500 dark:bg-indigo-700 dark:hover:bg-indigo-600"
                                        >
                                          <MessageSquarePlus className="h-4 w-4" />
                                          Add another remark
                                        </button>
                                      </div>
                                    )}
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
        {modalTask && (
          <TaskRemarkModal
            task={modalTask}
            remark={editingRemark}
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
