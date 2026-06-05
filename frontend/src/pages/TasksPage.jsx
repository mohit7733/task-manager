import { useEffect, useState } from "react";
import { Plus, RefreshCw, X, Building2, User, Flag, Calendar, ListChecks } from "lucide-react";
import api from "../api/client";
import TaskTable from "../components/TaskTable";

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
      setShowModal(false);
      setFormData(EMPTY_FORM);
      load();
    } catch (err) {
      alert(err.response?.data?.message || "Failed to create task");
    } finally {
      setSaving(false);
    }
  };

  const statCards = [
    { label: "Total tasks", value: stats.total, color: "from-blue-600 to-indigo-600" },
    { label: "Pending", value: stats.pending, color: "from-blue-500 to-indigo-500" },
    { label: "In progress", value: stats.inProgress, color: "from-indigo-500 to-violet-600" },
    { label: "Done", value: stats.done, color: "from-indigo-600 to-blue-700" },
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h2 className="flex items-center gap-2 text-2xl font-bold text-gray-900 dark:text-white">
            <ListChecks className="h-7 w-7 text-indigo-600" />
            Department Task Management
          </h2>
          <p className="mt-1 max-w-2xl text-sm text-gray-500 dark:text-gray-400">
            Track tasks across departments for weekly meetings. PA adds tasks, assigns owners, and records remarks
            after each meeting — mark done or note why still pending.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={load}
            className="inline-flex items-center gap-2 rounded-xl border border-gray-200 bg-white px-4 py-2.5 text-sm font-medium shadow-sm hover:bg-gray-50 dark:border-gray-700 dark:bg-gray-900"
          >
            <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
            Refresh
          </button>
          <button
            type="button"
            onClick={() => setShowModal(true)}
            className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 px-5 py-2.5 text-sm font-semibold text-white shadow-lg shadow-indigo-200 hover:from-blue-700 hover:to-indigo-700"
          >
            <Plus className="h-4 w-4" />
            Add Task
          </button>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {statCards.map((s) => (
          <div
            key={s.label}
            className={`rounded-2xl bg-gradient-to-br ${s.color} p-4 text-white shadow-md`}
          >
            <p className="text-xs font-medium text-white/80">{s.label}</p>
            <p className="mt-1 text-3xl font-bold">{s.value}</p>
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
                departmentFilter === d._id
                  ? "bg-indigo-600 text-white ring-2 ring-indigo-300"
                  : "bg-white text-gray-700 ring-1 ring-gray-200 hover:bg-indigo-50 dark:bg-gray-800 dark:text-gray-200 dark:ring-gray-600"
              }`}
            >
              {d._id}: {d.open} open / {d.total} total
            </button>
          ))}
        </div>
      )}

      <div className="flex flex-wrap gap-2">
        <button
          type="button"
          onClick={() => setApiFilters((f) => ({ ...f, thisWeek: f.thisWeek ? "" : "true", overdue: "" }))}
          className={`rounded-lg px-3 py-1.5 text-xs font-medium ${
            apiFilters.thisWeek ? "bg-indigo-600 text-white" : "bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300"
          }`}
        >
          Review this week
        </button>
        <button
          type="button"
          onClick={() => setApiFilters((f) => ({ ...f, overdue: f.overdue ? "" : "true", thisWeek: "" }))}
          className={`rounded-lg px-3 py-1.5 text-xs font-medium ${
            apiFilters.overdue ? "bg-red-600 text-white" : "bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300"
          }`}
        >
          Overdue review
        </button>
        <select
          value={apiFilters.status}
          onChange={(e) => setApiFilters((f) => ({ ...f, status: e.target.value }))}
          className="rounded-lg border-0 bg-gray-100 px-3 py-1.5 text-xs dark:bg-gray-800"
        >
          <option value="">All statuses (server)</option>
          <option>Pending</option>
          <option>In Progress</option>
          <option>Done</option>
        </select>
      </div>

      {loading && tasks.length === 0 ? (
        <div className="flex h-48 items-center justify-center text-gray-500">Loading tasks…</div>
      ) : (
        <TaskTable
          tasks={tasks}
          reload={load}
          departmentFilter={departmentFilter}
          onDepartmentFilter={setDepartmentFilter}
        />
      )}

      {showModal && (
        <div className="fixed inset-0 z-[90] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-slate-900/50 backdrop-blur-sm" onClick={() => setShowModal(false)} />
          <div className="relative z-10 w-full max-w-lg rounded-2xl bg-white p-6 shadow-2xl dark:bg-gray-900">
            <div className="mb-5 flex items-center justify-between">
              <h3 className="text-lg font-bold text-gray-900 dark:text-white">Add new task</h3>
              <button type="button" onClick={() => setShowModal(false)} className="rounded-lg p-1 hover:bg-gray-100 dark:hover:bg-gray-800">
                <X className="h-5 w-5" />
              </button>
            </div>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="mb-1 flex items-center gap-1 text-xs font-medium text-gray-600">
                  <ListChecks className="h-3 w-3" /> Task name *
                </label>
                <input
                  name="title"
                  value={formData.title}
                  onChange={(e) => setFormData((f) => ({ ...f, title: e.target.value }))}
                  className="w-full rounded-xl border border-gray-200 px-3 py-2 text-sm dark:border-gray-600 dark:bg-gray-800 dark:text-white"
                  placeholder="e.g. Complete vendor onboarding"
                  required
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="mb-1 flex items-center gap-1 text-xs font-medium text-gray-600">
                    <Building2 className="h-3 w-3" /> Department *
                  </label>
                  <select
                    name="department"
                    value={formData.department}
                    onChange={(e) => setFormData((f) => ({ ...f, department: e.target.value }))}
                    className="w-full rounded-xl border border-gray-200 px-3 py-2 text-sm dark:border-gray-600 dark:bg-gray-800"
                  >
                    {DEPARTMENTS.map((d) => (
                      <option key={d} value={d}>
                        {d}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="mb-1 flex items-center gap-1 text-xs font-medium text-gray-600">
                    <User className="h-3 w-3" /> Assigned to *
                  </label>
                  <input
                    name="assigned_to"
                    value={formData.assigned_to}
                    onChange={(e) => setFormData((f) => ({ ...f, assigned_to: e.target.value }))}
                    className="w-full rounded-xl border border-gray-200 px-3 py-2 text-sm dark:border-gray-600 dark:bg-gray-800 dark:text-white"
                    placeholder="Person working on task"
                    required
                  />
                </div>
              </div>
              <div>
                <label className="mb-1 block text-xs font-medium text-gray-600">Description</label>
                <textarea
                  name="description"
                  rows={2}
                  value={formData.description}
                  onChange={(e) => setFormData((f) => ({ ...f, description: e.target.value }))}
                  className="w-full resize-none rounded-xl border border-gray-200 px-3 py-2 text-sm dark:border-gray-600 dark:bg-gray-800 dark:text-white"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="mb-1 flex items-center gap-1 text-xs font-medium text-gray-600">
                    <Flag className="h-3 w-3" /> Priority
                  </label>
                  <select
                    value={formData.priority}
                    onChange={(e) => setFormData((f) => ({ ...f, priority: e.target.value }))}
                    className="w-full rounded-xl border border-gray-200 px-3 py-2 text-sm dark:border-gray-600 dark:bg-gray-800"
                  >
                    <option>Low</option>
                    <option>Medium</option>
                    <option>High</option>
                    <option>Critical</option>
                  </select>
                </div>
                <div>
                  <label className="mb-1 flex items-center gap-1 text-xs font-medium text-gray-600">
                    <Calendar className="h-3 w-3" /> Next review
                  </label>
                  <input
                    type="date"
                    value={formData.next_review_date}
                    onChange={(e) => setFormData((f) => ({ ...f, next_review_date: e.target.value }))}
                    className="w-full rounded-xl border border-gray-200 px-3 py-2 text-sm dark:border-gray-600 dark:bg-gray-800"
                  />
                </div>
              </div>
              <div>
                <label className="mb-1 block text-xs font-medium text-gray-600">Weekly meeting day (optional)</label>
                <select
                  value={formData.weekly_meeting_day}
                  onChange={(e) => setFormData((f) => ({ ...f, weekly_meeting_day: e.target.value }))}
                  className="w-full rounded-xl border border-gray-200 px-3 py-2 text-sm dark:border-gray-600 dark:bg-gray-800"
                >
                  {WEEKDAYS.map((d) => (
                    <option key={d || "none"} value={d}>
                      {d || "Not set"}
                    </option>
                  ))}
                </select>
              </div>
              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="flex-1 rounded-xl border py-2.5 text-sm font-medium"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="flex-1 rounded-xl bg-indigo-600 py-2.5 text-sm font-semibold text-white disabled:opacity-50"
                >
                  {saving ? "Saving…" : "Create Task"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
