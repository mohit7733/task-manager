import { useEffect, useState } from "react";
import { Plus, RefreshCw, Building2, User, ListChecks, CalendarClock } from "lucide-react";
import api from "../api/client";
import TaskTable from "../components/TaskTable";
import PageHeader from "../components/PageHeader";
import FormModal, { FieldLabel, fieldClass, FormSection } from "../components/FormModal";
import { brand } from "../utils/theme";

const DEPARTMENTS = [
  "HR",
  "Finance",
  "Operations",
  "IT",
  "Sales",
  "Marketing",
  "Legal",
  "Procurement",
  "Administration",
  "Other",
];

const WEEKDAYS = ["", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];

const EMPTY_FORM = {
  title: "",
  description: "",
  department: "Operations",
  assigned_to: "",
  assigned_email: "",
  status: "Pending",
  priority: "Medium",
  next_review_date: "",
  weekly_meeting_day: "",
};

export default function TasksPage() {
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [departmentFilter, setDepartmentFilter] = useState("");
  const [apiFilters, setApiFilters] = useState({ status: "", search: "", overdue: "", thisWeek: "" });
  const [stats, setStats] = useState({ total: 0, pending: 0, inProgress: 0, done: 0, byDepartment: [] });
  const [showModal, setShowModal] = useState(false);
  const [saving, setSaving] = useState(false);
  const [formData, setFormData] = useState(EMPTY_FORM);

  const load = async () => {
    setLoading(true);
    try {
      const [listRes, statsRes] = await Promise.all([
        api.get("/tasks", { params: { ...apiFilters, limit: 100 } }),
        api.get("/tasks/stats"),
      ]);
      setTasks(listRes.data.items);
      setStats(statsRes.data);
    } catch (error) {
      console.error("Failed to load tasks:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, [apiFilters.status, apiFilters.search, apiFilters.overdue, apiFilters.thisWeek]);

  const closeModal = () => {
    setShowModal(false);
    setFormData(EMPTY_FORM);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.title.trim()) {
      alert("Please enter a task name");
      return;
    }
    if (!formData.assigned_to.trim()) {
      alert("Please enter who is working on this task");
      return;
    }
    setSaving(true);
    try {
      await api.post("/tasks", formData);
      closeModal();
      load();
    } catch (err) {
      alert(err.response?.data?.message || "Failed to create task");
    } finally {
      setSaving(false);
    }
  };

  const statCards = [
    { label: "Total tasks", value: stats.total, color: "text-indigo-600", bg: "bg-indigo-50 dark:bg-indigo-950/40" },
    { label: "Pending", value: stats.pending, color: "text-amber-600", bg: "bg-amber-50 dark:bg-amber-950/40" },
    { label: "In progress", value: stats.inProgress, color: "text-blue-600", bg: "bg-blue-50 dark:bg-blue-950/40" },
    { label: "Done", value: stats.done, color: "text-emerald-600", bg: "bg-emerald-50 dark:bg-emerald-950/40" },
  ];

  const quickFilters = [
    {
      key: "thisWeek",
      label: "Review this week",
      active: apiFilters.thisWeek === "true",
      onClick: () => setApiFilters((f) => ({ ...f, thisWeek: f.thisWeek ? "" : "true", overdue: "" })),
      activeClass: brand.chipActive,
    },
    {
      key: "overdue",
      label: "Overdue review",
      active: apiFilters.overdue === "true",
      onClick: () => setApiFilters((f) => ({ ...f, overdue: f.overdue ? "" : "true", thisWeek: "" })),
      activeClass: "bg-red-600 text-white ring-2 ring-red-300",
    },
  ];

  return (
    <div className="space-y-6">
      <PageHeader
        title="Department Tasks"
        subtitle="Track tasks across departments for weekly meetings — assign owners, add remarks, mark done or pending."
        icon={ListChecks}
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
          className={`inline-flex items-center gap-2 text-white rounded-xl px-5 py-2.5 text-sm font-semibold ${brand.gradient} ${brand.gradientHover} ${brand.btnRing}`}
        >
          <Plus className="h-4 w-4" />
          Add Task
        </button>
      </PageHeader>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {statCards.map((s) => (
          <div key={s.label} className={brand.statCard}>
            <div className="flex items-center justify-between p-4">
              <div>
                <p className="text-xs font-medium text-slate-500">{s.label}</p>
                <p className="mt-1 text-2xl font-bold text-slate-900 dark:text-white">{s.value}</p>
              </div>
              <div className={`rounded-lg px-2 py-1 text-xs font-semibold ${s.bg} ${s.color}`}>●</div>
            </div>
          </div>
        ))}
      </div>

      {stats.byDepartment?.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {stats.byDepartment.map((d) => (
            <button
              key={d._id}
              type="button"
              onClick={() => setDepartmentFilter(departmentFilter === d._id ? "" : d._id)}
              className={`rounded-full px-3 py-1.5 text-xs font-semibold transition ${
                departmentFilter === d._id ? brand.chipActive : brand.chipInactive
              }`}
            >
              {d._id}: {d.open} open / {d.total} total
            </button>
          ))}
        </div>
      )}

      <div className={`flex flex-wrap items-center gap-2 rounded-xl border border-slate-200 p-3 dark:border-slate-700 ${brand.card}`}>
        {quickFilters.map((f) => (
          <button
            key={f.key}
            type="button"
            onClick={f.onClick}
            className={`rounded-full px-3 py-1.5 text-xs font-semibold transition ${
              f.active ? f.activeClass : brand.chipInactive
            }`}
          >
            {f.label}
          </button>
        ))}
        <select
          value={apiFilters.status}
          onChange={(e) => setApiFilters((prev) => ({ ...prev, status: e.target.value }))}
          className={`rounded-xl px-3 py-1.5 text-xs ${brand.input}`}
        >
          <option value="">All statuses</option>
          <option>Pending</option>
          <option>In Progress</option>
          <option>Done</option>
        </select>
      </div>

      {loading && tasks.length === 0 ? (
        <div className={`flex h-48 flex-col items-center justify-center ${brand.card}`}>
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-slate-200 border-t-indigo-600" />
          <p className="mt-3 text-sm text-slate-500">Loading tasks…</p>
        </div>
      ) : (
        <TaskTable
          tasks={tasks}
          reload={load}
          departmentFilter={departmentFilter}
          onDepartmentFilter={setDepartmentFilter}
        />
      )}

      <FormModal
        open={showModal}
        onClose={closeModal}
        eyebrow="New Task"
        title="Add department task"
        subtitle="Assign an owner and schedule the next weekly review."
        badges={[
          formData.department && {
            key: "dept",
            label: formData.department,
            icon: <Building2 className="h-3 w-3" />,
          },
        ].filter(Boolean)}
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
              form="create-task-form"
              disabled={saving}
              className={`flex-1 rounded-xl py-2.5 text-sm font-semibold disabled:opacity-50 ${brand.gradient} ${brand.gradientHover}`}
            >
              {saving ? "Saving…" : "Create Task"}
            </button>
          </>
        }
      >
        <form id="create-task-form" onSubmit={handleSubmit} className="space-y-5">
          <p className="text-sm font-medium text-slate-700 dark:text-slate-300">
            Set up a task to track in weekly department meetings:
          </p>

          <FormSection title="Task details" icon={ListChecks}>
            <div>
              <FieldLabel required>Task name</FieldLabel>
              <input
                name="title"
                value={formData.title}
                onChange={(e) => setFormData((f) => ({ ...f, title: e.target.value }))}
                className={fieldClass}
                placeholder="e.g. Complete vendor onboarding"
                required
              />
            </div>
            <div>
              <FieldLabel>Description</FieldLabel>
              <textarea
                name="description"
                rows={3}
                value={formData.description}
                onChange={(e) => setFormData((f) => ({ ...f, description: e.target.value }))}
                className={`${fieldClass} resize-none`}
                placeholder="Brief context for this task"
              />
            </div>
          </FormSection>

          <FormSection title="Assignment" icon={User}>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <FieldLabel required>Department</FieldLabel>
                <select
                  name="department"
                  value={formData.department}
                  onChange={(e) => setFormData((f) => ({ ...f, department: e.target.value }))}
                  className={fieldClass}
                >
                  {DEPARTMENTS.map((d) => (
                    <option key={d} value={d}>
                      {d}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <FieldLabel required>Assigned to</FieldLabel>
                <input
                  name="assigned_to"
                  value={formData.assigned_to}
                  onChange={(e) => setFormData((f) => ({ ...f, assigned_to: e.target.value }))}
                  className={fieldClass}
                  placeholder="Person working on task"
                  required
                />
              </div>
            </div>
            <div>
              <FieldLabel>Assignee email</FieldLabel>
              <input
                type="email"
                name="assigned_email"
                value={formData.assigned_email}
                onChange={(e) => setFormData((f) => ({ ...f, assigned_email: e.target.value }))}
                className={fieldClass}
                placeholder="email@company.com (for alerts)"
              />
            </div>
          </FormSection>

          <FormSection title="Review schedule" icon={CalendarClock}>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <FieldLabel>Priority</FieldLabel>
                <select
                  value={formData.priority}
                  onChange={(e) => setFormData((f) => ({ ...f, priority: e.target.value }))}
                  className={fieldClass}
                >
                  <option>Low</option>
                  <option>Medium</option>
                  <option>High</option>
                  <option>Critical</option>
                </select>
              </div>
              <div>
                <FieldLabel>Next review date</FieldLabel>
                <input
                  type="date"
                  value={formData.next_review_date}
                  onChange={(e) => setFormData((f) => ({ ...f, next_review_date: e.target.value }))}
                  className={fieldClass}
                />
              </div>
            </div>
            <div>
              <FieldLabel>Weekly meeting day</FieldLabel>
              <select
                value={formData.weekly_meeting_day}
                onChange={(e) => setFormData((f) => ({ ...f, weekly_meeting_day: e.target.value }))}
                className={fieldClass}
              >
                {WEEKDAYS.map((d) => (
                  <option key={d || "none"} value={d}>
                    {d || "Not set"}
                  </option>
                ))}
              </select>
            </div>
          </FormSection>
        </form>
      </FormModal>
    </div>
  );
}
