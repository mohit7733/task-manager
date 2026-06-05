import { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import {
  Plus,
  RefreshCw,
  Calendar,
  FileText,
  User,
  Tag,
  Paperclip,
  Clock,
  CheckCircle2,
  AlertCircle,
} from "lucide-react";
import api from "../api/client";
import MeetingTable from "../components/MeetingTable";
import PageHeader from "../components/PageHeader";
import FormModal, { FieldLabel, fieldClass, FormSection } from "../components/FormModal";
import { buildFormData } from "../utils/upload";
import { brand } from "../utils/theme";

const EMPTY_FORM = {
  title: "",
  description: "",
  meeting_type: "internal",
  meeting_date: "",
  meeting_time: "",
  responsible_person: "",
  responsible_email: "",
  status: "Pending",
  priority: "Medium",
  discussion_topic: "",
  final_outcome: "",
  reminder_date: "",
  recurrence: "None",
};

export default function MeetingsPage() {
  const [searchParams] = useSearchParams();
  const highlightMeetingId = searchParams.get("meeting");

  const [meetings, setMeetings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({
    status: "",
    search: "",
    priority: "",
    meeting_type: "",
    overdue: "",
    thisWeek: "",
  });
  const [stats, setStats] = useState({ total: 0, pending: 0, completed: 0, inProgress: 0 });
  const [showModal, setShowModal] = useState(false);
  const [saving, setSaving] = useState(false);
  const [attachmentFile, setAttachmentFile] = useState(null);
  const [formData, setFormData] = useState(EMPTY_FORM);

  const load = async () => {
    setLoading(true);
    try {
      const res = await api.get("/meetings", { params: { ...filters, limit: 25 } });
      const items = res.data.items;
      setMeetings(items);
      setStats({
        total: items.length,
        pending: items.filter((m) => m.status === "Pending").length,
        completed: items.filter((m) => m.status === "Completed").length,
        inProgress: items.filter((m) => m.status === "In Progress").length,
      });
    } catch (error) {
      console.error("Failed to load meetings:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, [filters.status, filters.search, filters.priority, filters.meeting_type, filters.overdue, filters.thisWeek]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const closeModal = () => {
    setShowModal(false);
    setFormData(EMPTY_FORM);
    setAttachmentFile(null);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.title.trim()) {
      alert("Please enter a meeting title");
      return;
    }
    if (!formData.meeting_date) {
      alert("Please select a meeting date");
      return;
    }

    setSaving(true);
    try {
      const payload = {
        ...formData,
        task_create_date: new Date().toISOString(),
        meeting_date: formData.meeting_date,
        reminder_date: formData.reminder_date || "",
      };
      const fd = buildFormData(payload, attachmentFile);
      await api.post("/meetings", fd);
      closeModal();
      await load();
    } catch (error) {
      console.error("Failed to add meeting:", error);
      alert("Failed to create meeting. Please try again.");
    } finally {
      setSaving(false);
    }
  };

  const statCards = [
    { label: "Total", value: stats.total, color: "text-indigo-600", bg: "bg-indigo-50 dark:bg-indigo-950/40", icon: FileText },
    { label: "Pending", value: stats.pending, color: "text-amber-600", bg: "bg-amber-50 dark:bg-amber-950/40", icon: Clock },
    { label: "In progress", value: stats.inProgress, color: "text-blue-600", bg: "bg-blue-50 dark:bg-blue-950/40", icon: AlertCircle },
    { label: "Completed", value: stats.completed, color: "text-emerald-600", bg: "bg-emerald-50 dark:bg-emerald-950/40", icon: CheckCircle2 },
  ];

  const filterChips = [
    { key: "overdue", value: "true", label: "Overdue" },
    { key: "thisWeek", value: "true", label: "This Week" },
    { key: "meeting_type", value: "internal", label: "Internal" },
    { key: "meeting_type", value: "external", label: "External" },
    { key: "status", value: "Pending", label: "Pending" },
    { key: "status", value: "Completed", label: "Completed" },
  ];

  const hasActiveFilters =
    filters.status || filters.search || filters.priority || filters.meeting_type || filters.overdue || filters.thisWeek;

  return (
    <div className="space-y-6">
      <PageHeader
        title="Meetings"
        subtitle="Manage meetings, track follow-ups, and record remarks after each session."
        icon={FileText}
      >
        <button
          type="button"
          onClick={load}
          className={`inline-flex items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-medium ${brand.btnSecondary}`}
        >
          <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
          Refresh
        </button>
        <button
          type="button"
          onClick={() => setShowModal(true)}
          className={`inline-flex items-center text-white gap-2 rounded-xl px-4 py-2.5 text-sm font-semibold ${brand.gradient} ${brand.gradientHover} ${brand.btnRing}`}
        >
          <Plus className="h-4 w-4" />
          New Meeting
        </button>
      </PageHeader>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {statCards.map((s) => {
          const Icon = s.icon;
          return (
            <div key={s.label} className={brand.statCard}>
              <div className="flex items-center justify-between p-4">
                <div>
                  <p className="text-xs font-medium text-slate-500">{s.label}</p>
                  <p className="mt-1 text-2xl font-bold text-slate-900 dark:text-white">{s.value}</p>
                </div>
                <div className={`rounded-xl p-2.5 ${s.bg} ${s.color}`}>
                  <Icon className="h-5 w-5" />
                </div>
              </div>
            </div>
          );
        })}
      </div>

      <div className={`flex flex-wrap gap-2 rounded-xl border border-slate-200 p-3 dark:border-slate-700 ${brand.card}`}>
        {filterChips.map((chip) => {
          const active = filters[chip.key] === chip.value;
          return (
            <button
              key={`${chip.key}-${chip.value}`}
              type="button"
              onClick={() =>
                setFilters((f) => ({
                  ...f,
                  [chip.key]: active ? "" : chip.value,
                }))
              }
              className={`rounded-full px-3 py-1.5 text-xs font-semibold transition ${
                active ? brand.chipActive : brand.chipInactive
              }`}
            >
              {chip.label}
            </button>
          );
        })}
      </div>

      {loading && meetings.length === 0 ? (
        <div className={`flex h-48 flex-col items-center justify-center ${brand.card}`}>
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-slate-200 border-t-indigo-600" />
          <p className="mt-3 text-sm text-slate-500">Loading meetings…</p>
        </div>
      ) : meetings.length === 0 ? (
        <div className={`p-12 text-center ${brand.card}`}>
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-slate-100 dark:bg-slate-800">
            <Calendar className="h-8 w-8 text-slate-400" />
          </div>
          <h3 className="text-lg font-semibold text-slate-800 dark:text-white">No meetings found</h3>
          <p className="mt-1 text-sm text-slate-500">
            {hasActiveFilters ? "Try adjusting your filters" : "Get started by creating your first meeting"}
          </p>
          {!hasActiveFilters && (
            <button
              type="button"
              onClick={() => setShowModal(true)}
              className={`mt-4 inline-flex items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-semibold ${brand.gradient} ${brand.gradientHover}`}
            >
              <Plus className="h-4 w-4" />
              Create Meeting
            </button>
          )}
        </div>
      ) : (
        <MeetingTable meetings={meetings} reload={load} highlightMeetingId={highlightMeetingId} />
      )}

      <FormModal
        open={showModal}
        onClose={closeModal}
        eyebrow="New Meeting"
        title="Schedule a meeting"
        subtitle="Fill in the details below. Assignee will receive an email if provided."
        maxWidth="max-w-3xl"
        footer={
          <>
            <button
              type="button"
              onClick={closeModal}
              className={`flex-1 rounded-xl py-2.5 text-sm font-medium ${brand.btnSecondary}`}
            >
              Cancel
            </button>
            <button
              type="submit"
              form="create-meeting-form"
              disabled={saving}
              className={`flex-1 rounded-xl py-2.5 text-sm font-semibold disabled:opacity-50 ${brand.gradient} ${brand.gradientHover}`}
            >
              {saving ? "Creating…" : "Create Meeting"}
            </button>
          </>
        }
      >
        <form id="create-meeting-form" onSubmit={handleSubmit} className="space-y-5">
          <FormSection title="Basic Information" icon={FileText}>
            <div>
              <FieldLabel required>Title</FieldLabel>
              <input
                type="text"
                name="title"
                value={formData.title}
                onChange={handleInputChange}
                className={fieldClass}
                placeholder="Enter meeting title"
                required
              />
            </div>
            <div>
              <FieldLabel>Description</FieldLabel>
              <textarea
                name="description"
                value={formData.description}
                onChange={handleInputChange}
                rows={3}
                className={`${fieldClass} resize-none`}
                placeholder="What is this meeting about?"
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <FieldLabel>Meeting type</FieldLabel>
                <select name="meeting_type" value={formData.meeting_type} onChange={handleInputChange} className={fieldClass}>
                  <option value="internal">Internal</option>
                  <option value="external">External</option>
                </select>
              </div>
              <div>
                <FieldLabel>Priority</FieldLabel>
                <select name="priority" value={formData.priority} onChange={handleInputChange} className={fieldClass}>
                  <option value="Low">Low</option>
                  <option value="Medium">Medium</option>
                  <option value="High">High</option>
                  <option value="Critical">Critical</option>
                </select>
              </div>
            </div>
          </FormSection>

          <FormSection title="Schedule" icon={Calendar}>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <FieldLabel required>Meeting date</FieldLabel>
                <input
                  type="date"
                  name="meeting_date"
                  value={formData.meeting_date}
                  onChange={handleInputChange}
                  className={fieldClass}
                  required
                />
              </div>
              <div>
                <FieldLabel>Meeting time</FieldLabel>
                <input
                  type="time"
                  name="meeting_time"
                  value={formData.meeting_time}
                  onChange={handleInputChange}
                  className={fieldClass}
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <FieldLabel>Reminder date</FieldLabel>
                <input
                  type="date"
                  name="reminder_date"
                  value={formData.reminder_date}
                  onChange={handleInputChange}
                  className={fieldClass}
                />
              </div>
              <div>
                <FieldLabel>Recurrence</FieldLabel>
                <select name="recurrence" value={formData.recurrence} onChange={handleInputChange} className={fieldClass}>
                  <option value="None">None</option>
                  <option value="Daily">Daily</option>
                  <option value="Weekly">Weekly</option>
                  <option value="Monthly">Monthly</option>
                </select>
              </div>
            </div>
          </FormSection>

          <FormSection title="Assignment & Status" icon={User}>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <FieldLabel>Responsible person</FieldLabel>
                <input
                  type="text"
                  name="responsible_person"
                  value={formData.responsible_person}
                  onChange={handleInputChange}
                  className={fieldClass}
                  placeholder="Name"
                />
              </div>
              <div>
                <FieldLabel>Responsible email</FieldLabel>
                <input
                  type="email"
                  name="responsible_email"
                  value={formData.responsible_email}
                  onChange={handleInputChange}
                  className={fieldClass}
                  placeholder="email@company.com"
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <FieldLabel>Status</FieldLabel>
                <select name="status" value={formData.status} onChange={handleInputChange} className={fieldClass}>
                  <option value="Pending">Pending</option>
                  <option value="In Progress">In Progress</option>
                  <option value="Completed">Completed</option>
                  <option value="Rescheduled">Rescheduled</option>
                </select>
              </div>
              <div>
                <FieldLabel>Discussion topic</FieldLabel>
                <input
                  type="text"
                  name="discussion_topic"
                  value={formData.discussion_topic}
                  onChange={handleInputChange}
                  className={fieldClass}
                  placeholder="Main agenda"
                />
              </div>
            </div>
          </FormSection>

          <FormSection title="Additional Details" icon={Tag}>
            <div>
              <FieldLabel>Expected outcome</FieldLabel>
              <input
                type="text"
                name="final_outcome"
                value={formData.final_outcome}
                onChange={handleInputChange}
                className={fieldClass}
                placeholder="Optional expected result"
              />
            </div>
            <div className="rounded-xl border border-dashed border-indigo-300 bg-white/60 p-3 dark:border-indigo-700 dark:bg-slate-900/40">
              <FieldLabel>
                <Paperclip className="mr-1 inline h-4 w-4" />
                Attachment (optional)
              </FieldLabel>
              <input
                type="file"
                accept=".pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.png,.jpg,.jpeg"
                onChange={(e) => setAttachmentFile(e.target.files?.[0] || null)}
                className="mt-1 block w-full text-sm text-slate-600 file:mr-3 file:rounded-lg file:border-0 file:bg-indigo-600 file:px-3 file:py-1.5 file:text-xs file:font-semibold file:text-white hover:file:bg-indigo-500"
              />
              {attachmentFile && (
                <p className="mt-2 text-xs text-indigo-700 dark:text-indigo-300">
                  Selected: {attachmentFile.name} ({(attachmentFile.size / 1024).toFixed(0)} KB)
                </p>
              )}
            </div>
          </FormSection>
        </form>
      </FormModal>
    </div>
  );
}
