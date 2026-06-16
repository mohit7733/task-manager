import { useEffect, useMemo, useRef, useState } from "react";
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
import LoadingSpinner from "../components/LoadingSpinner";
import EmptyState from "../components/EmptyState";
import { buildFormData } from "../utils/upload";
import { toInputDate } from "../utils/format";
import { brand } from "../utils/theme";

function meetingToForm(m) {
  return {
    title: m.title || "",
    description: m.description || "",
    meeting_type: m.meeting_type || "internal",
    meeting_date: toInputDate(m.meeting_date),
    meeting_time: m.meeting_time || "",
    responsible_person: Array.isArray(m.responsible_person) ? m.responsible_person : [],
    status: m.status || "Pending",
    priority: m.priority || "Medium",
    discussion_topic: m.discussion_topic || "",
    final_outcome: m.final_outcome || "",
    reminder_date: toInputDate(m.reminder_date),
    recurrence: m.recurrence || "None",
    meeting_link: m.meeting_link || "",
  };
}

const EMPTY_FORM = {
  title: "",
  description: "",
  meeting_type: "internal",
  meeting_date: "",
  meeting_time: "",
  responsible_person: [],
  status: "Pending",
  priority: "Medium",
  discussion_topic: "",
  final_outcome: "",
  reminder_date: "",
  recurrence: "None",
  meeting_link: "",
};

function getUserEmail(user) {
  return (user?.user_detail || user?.email || user?.work_email || user?.official_email || "").trim();
}

function getUserKey(user) {
  return String(user?.emp_code || user?.id || user?._id || user?.name || "");
}

function normalizeUsers(rawUsers) {
  return (Array.isArray(rawUsers) ? rawUsers : [])
    .map((u) => ({
      key: getUserKey(u),
      name: (u?.name || "").trim(),
      emp_code: (u?.emp_code || "").trim(),
      department_name: (u?.department_name || "").trim(),
      email: getUserEmail(u),
    }))
    .filter((u) => u.key && u.name);
}

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
  const [editingId, setEditingId] = useState(null);
  const [saving, setSaving] = useState(false);
  const [attachmentFile, setAttachmentFile] = useState(null);
  const [formData, setFormData] = useState(EMPTY_FORM);
  const [users, setUsers] = useState([]);
  const [responsibleSearch, setResponsibleSearch] = useState("");
  const [selectedResponsibleKeys, setSelectedResponsibleKeys] = useState([]);
  const [isResponsibleListOpen, setIsResponsibleListOpen] = useState(false);
  const responsiblePickerRef = useRef(null);

  const responsibleMap = useMemo(() => {
    const map = new Map();
    users.forEach((u) => map.set(u.key, u));
    return map;
  }, [users]);

  const selectedResponsible = useMemo(
    () => selectedResponsibleKeys.map((key) => responsibleMap.get(key)).filter(Boolean),
    [selectedResponsibleKeys, responsibleMap]
  );

  const filteredUsers = useMemo(() => {
    const term = responsibleSearch.trim().toLowerCase();
    if (!term) return users;
    return users.filter((u) =>
      `${u.name} ${u.emp_code} ${u.email} ${u.department_name}`.toLowerCase().includes(term)
    );
  }, [users, responsibleSearch]);

  const availableUsers = useMemo(
    () => filteredUsers.filter((u) => !selectedResponsibleKeys.includes(u.key)),
    [filteredUsers, selectedResponsibleKeys]
  );

  const syncResponsibleFields = (keys) => {
    const selected = keys.map((key) => responsibleMap.get(key)).filter(Boolean);
    setFormData((f) => ({
      ...f,
      responsible_person: selected,
    }));
  };

  const load = async () => {
    setLoading(true);
    try {
      const [meetingsRes, usersRes] = await Promise.all([
        api.get("/meetings", { params: { ...filters, limit: 25 } }),
        fetch("https://hrms.aimantra.info/wfm/ourcompanyuserlessdetail/v3/null/null/").then((res) => res.json()),
      ]);
      const items = meetingsRes.data.items;
      setMeetings(items);
      setUsers(normalizeUsers(usersRes));
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

  useEffect(() => {
    const handleDocumentClick = (event) => {
      if (!responsiblePickerRef.current?.contains(event.target)) {
        setIsResponsibleListOpen(false);
      }
    };
    document.addEventListener("mousedown", handleDocumentClick);
    return () => document.removeEventListener("mousedown", handleDocumentClick);
  }, []);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const closeModal = () => {
    setShowModal(false);
    setEditingId(null);
    setFormData(EMPTY_FORM);
    setAttachmentFile(null);
    setResponsibleSearch("");
    setSelectedResponsibleKeys([]);
    setIsResponsibleListOpen(false);
  };

  const openCreateModal = () => {
    setEditingId(null);
    setFormData(EMPTY_FORM);
    setAttachmentFile(null);
    setResponsibleSearch("");
    setSelectedResponsibleKeys([]);
    setIsResponsibleListOpen(false);
    setShowModal(true);
  };

  const openEditModal = (meeting) => {
    const nextForm = meetingToForm(meeting);
    const existingCodes = nextForm.responsible_person.map((u) => u.emp_code?.toLowerCase());
    const matchedKeys = users
      .filter((u) => existingCodes.includes((u.emp_code || "").trim().toLowerCase()))
      .map((u) => u.key);
    setEditingId(meeting._id);
    setFormData(nextForm);
    setAttachmentFile(null);
    setResponsibleSearch("");
    setSelectedResponsibleKeys(matchedKeys);
    setIsResponsibleListOpen(false);
    setShowModal(true);
  };

  const handleResponsibleToggle = (key) => {
    setSelectedResponsibleKeys((prev) => {
      const exists = prev.includes(key);
      const nextKeys = exists ? prev.filter((k) => k !== key) : [...prev, key];
      syncResponsibleFields(nextKeys);
      return nextKeys;
    });
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
    if (!formData.responsible_person?.length) {
      alert("Please select at least one responsible person");
      return;
    }

    setSaving(true);
    try {
      const payload = {
        ...formData,
        meeting_date: formData.meeting_date,
        reminder_date: formData.reminder_date || "",
        responsible_person: JSON.stringify(formData.responsible_person),
      };
      if (!editingId) {
        payload.task_create_date = new Date().toISOString();
      }
      const fd = buildFormData(payload, attachmentFile);
      if (editingId) {
        await api.put(`/meetings/${editingId}`, fd);
      } else {
        await api.post("/meetings", fd);
      }
      closeModal();
      await load();
    } catch (error) {
      console.error("Failed to add meeting:", error);
      alert(editingId ? "Failed to update meeting. Please try again." : "Failed to create meeting. Please try again.");
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
          onClick={openCreateModal}
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
              className={`rounded-full px-3 py-1.5 text-xs font-semibold transition ${active ? brand.chipActive : brand.chipInactive
                }`}
            >
              {chip.label}
            </button>
          );
        })}
      </div>

      {loading && meetings.length === 0 ? (
        <div className={`flex h-48 ${brand.card}`}>
          <LoadingSpinner label="Loading meetings…" className="flex-1" />
        </div>
      ) : meetings.length === 0 ? (
        <EmptyState
          icon={Calendar}
          title="No meetings found"
          description={hasActiveFilters ? "Try adjusting your filters" : "Get started by creating your first meeting"}
          action={
            !hasActiveFilters && (
              <button
                type="button"
                onClick={openCreateModal}
                className={`${brand.btnPrimary} ${brand.gradient} ${brand.gradientHover}`}
              >
                <Plus className="h-4 w-4" />
                Create Meeting
              </button>
            )
          }
        />
      ) : (
        <MeetingTable meetings={meetings} reload={load} highlightMeetingId={highlightMeetingId} onEditMeeting={openEditModal} />
      )}

      <FormModal
        open={showModal}
        onClose={closeModal}
        eyebrow={editingId ? "Edit Meeting" : "New Meeting"}
        title={editingId ? "Update meeting details" : "Schedule a meeting"}
        subtitle={editingId ? "Modify the meeting information below." : "Fill in the details below. Responsible users will receive an email."}
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
              {saving ? "Saving…" : editingId ? "Save Changes" : "Create Meeting"}
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
                  max={toInputDate(new Date(formData.meeting_date))}
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
            <div ref={responsiblePickerRef}>
              {selectedResponsible.length > 0 && (
                <div className="mb-3 rounded-xl border border-indigo-200 bg-indigo-50/60 p-2.5 dark:border-indigo-700 dark:bg-indigo-900/20">
                  <div className="mb-2 flex items-center justify-between">
                    <p className="text-xs font-semibold text-indigo-700 dark:text-indigo-200">
                      Selected ({selectedResponsible.length})
                    </p>
                    <button
                      type="button"
                      onClick={() => {
                        setSelectedResponsibleKeys([]);
                        setFormData((f) => ({ ...f, responsible_person: [] }));
                      }}
                      className="text-xs font-semibold text-indigo-700 hover:underline dark:text-indigo-200"
                    >
                      Clear all
                    </button>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {selectedResponsible.map((u) => (
                      <button
                        key={u.key}
                        type="button"
                        onClick={() => handleResponsibleToggle(u.key)}
                        className="rounded-full bg-white px-2.5 py-1 text-xs font-medium text-slate-700 ring-1 ring-slate-200 transition hover:bg-rose-50 hover:text-rose-700 hover:ring-rose-200 dark:bg-slate-800 dark:text-slate-200 dark:ring-slate-700 dark:hover:bg-rose-950/40 dark:hover:text-rose-200 dark:hover:ring-rose-800"
                        title="Remove responsible person"
                      >
                        {u.name} {u.emp_code ? `(${u.emp_code})` : ""} x
                      </button>
                    ))}
                  </div>
                </div>
              )}
              <FieldLabel required>Responsible person (multiple)</FieldLabel>
              <input
                type="text"
                value={responsibleSearch}
                onFocus={() => setIsResponsibleListOpen(true)}
                onChange={(e) => {
                  setResponsibleSearch(e.target.value);
                  setIsResponsibleListOpen(true);
                }}
                className={fieldClass}
                placeholder="Search by name, emp code, department"
              />
              {isResponsibleListOpen && (
                <div className="mt-2 max-h-52 overflow-y-auto rounded-xl border border-slate-200 bg-white shadow-sm dark:border-slate-700 dark:bg-slate-900">
                  {availableUsers.length === 0 ? (
                    <p className="px-3 py-3 text-xs text-slate-500 dark:text-slate-400">
                      {selectedResponsible.length > 0 ? "All matching users already selected" : "No users found"}
                    </p>
                  ) : (
                    availableUsers.map((u) => (
                      <label
                        key={u.key}
                        className="flex cursor-pointer items-start gap-3 border-b border-slate-100 px-3 py-2.5 text-sm transition hover:bg-indigo-50/60 last:border-b-0 dark:border-slate-800 dark:hover:bg-slate-800/80"
                      >
                        <input
                          type="checkbox"
                          checked={false}
                          onChange={() => handleResponsibleToggle(u.key)}
                          className="mt-0.5 h-4 w-0 rounded border-slate-300 text-indigo-600 opacity-0 focus:ring-indigo-500"
                        />
                        <div className="min-w-0 leading-5 text-slate-700 dark:text-slate-200">
                          <p className="truncate font-medium">{u.name}</p>
                          <p className="truncate text-xs text-slate-500 dark:text-slate-400">
                            {u.emp_code || "No code"} {u.department_name ? `| ${u.department_name}` : ""}
                            {u.email ? ` | ${u.email}` : ""}
                          </p>
                        </div>
                      </label>
                    ))
                  )}
                </div>
              )}
            </div>
            <div>
              <FieldLabel>Responsible email</FieldLabel>
              <input
                type="text"
                value={formData.responsible_person.map((u) => u.email).filter(Boolean).join(", ")}
                readOnly
                className={fieldClass}
                placeholder="Auto-filled from selected responsible users"
              />
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
              <FieldLabel>Meeting Link</FieldLabel>
              <input
                type="text"
                name="meeting_link"
                value={formData.meeting_link}
                onChange={handleInputChange}
                className={fieldClass}
                placeholder="https://meet.google.com/..."
              />
            </div>
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
