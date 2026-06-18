import { useEffect, useMemo, useRef, useState } from "react";
import { Plus, RefreshCw, Building2, User, ListChecks, CalendarClock, Clock, CheckCircle2, AlertCircle } from "lucide-react";
import api from "../api/client";
import TaskTable from "../components/TaskTable";
import PageHeader from "../components/PageHeader";
import FormModal, { FieldLabel, fieldClass, FormSection } from "../components/FormModal";
import LoadingSpinner from "../components/LoadingSpinner";
import { brand } from "../utils/theme";
import { toInputDate } from "../utils/format";
import { mergeUserLists, userSearchText, matchAssigneeKeys } from "../utils/users";

function taskToForm(t) {
  return {
    title: t.title || "",
    description: t.description || "",
    department: t.department || "Operations",
    assigned_to: t.assigned_to || [],
    status: t.status || "Pending",
    priority: t.priority || "Medium",
    next_review_date: toInputDate(t.next_review_date),
    weekly_meeting_day: t.weekly_meeting_day || "",
  };
}

const WEEKDAYS = ["", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];

const EMPTY_FORM = {
  title: "",
  description: "",
  department: "Operations",
  assigned_to: [],
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
  const [editingId, setEditingId] = useState(null);
  const [saving, setSaving] = useState(false);
  const [formData, setFormData] = useState(EMPTY_FORM);
  const [users, setUsers] = useState([]);
  const [assigneeSearch, setAssigneeSearch] = useState("");
  const [selectedAssigneeKeys, setSelectedAssigneeKeys] = useState([]);
  const [isAssigneeListOpen, setIsAssigneeListOpen] = useState(false);
  const assigneePickerRef = useRef(null);
  const [departments, setDepartments] = useState([]);
  const assigneeMap = useMemo(() => {
    const map = new Map();
    users.forEach((u) => map.set(u.key, u));
    return map;
  }, [users]);

  const selectedAssignees = useMemo(
    () => selectedAssigneeKeys.map((key) => assigneeMap.get(key)).filter(Boolean),
    [selectedAssigneeKeys, assigneeMap]
  );

  const filteredUsers = useMemo(() => {
    const term = assigneeSearch.trim().toLowerCase();
    if (!term) return users;
    return users.filter((u) => userSearchText(u).includes(term));
  }, [users, assigneeSearch]);
  const availableUsers = useMemo(
    () => filteredUsers.filter((u) => !selectedAssigneeKeys.includes(u.key)),
    [filteredUsers, selectedAssigneeKeys]
  );

  const syncAssigneeFields = (keys) => {
    const selected = keys.map((key) => assigneeMap.get(key)).filter(Boolean);
    setFormData((f) => ({
      ...f,
      assigned_to: selected,
      assigned_email: selected.map((u) => u.email).filter(Boolean).join(", "),
    }));
  };

  const load = async () => {
    setLoading(true);
    try {
      const [listRes, statsRes, hrmsUsers, departments, externalRes] = await Promise.all([
        api.get("/tasks", { params: { ...apiFilters, limit: 100 } }),
        api.get("/tasks/stats"),
        fetch("https://hrms.aimantra.info/wfm/ourcompanyuserlessdetail/v3/null/null/").then(res => res.json()),
        fetch("https://hrms.aimantra.info/wfm/department/").then(res => res.json()),
        api.get("/external-users", { params: { limit: 500 } }),
      ]);
      setTasks(listRes.data.items);
      setStats(statsRes.data);
      setUsers(mergeUserLists(hrmsUsers, externalRes.data.items));
      setDepartments(departments);
    } catch (error) {
      console.error("Failed to load tasks:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, [apiFilters.status, apiFilters.search, apiFilters.overdue, apiFilters.thisWeek]);

  useEffect(() => {
    const handleDocumentClick = (event) => {
      if (!assigneePickerRef.current?.contains(event.target)) {
        setIsAssigneeListOpen(false);
      }
    };
    document.addEventListener("mousedown", handleDocumentClick);
    return () => document.removeEventListener("mousedown", handleDocumentClick);
  }, []);

  const closeModal = () => {
    setShowModal(false);
    setEditingId(null);
    setFormData(EMPTY_FORM);
    setAssigneeSearch("");
    setSelectedAssigneeKeys([]);
    setIsAssigneeListOpen(false);
  };

  const openCreateModal = () => {
    setEditingId(null);
    setFormData(EMPTY_FORM);
    setAssigneeSearch("");
    setSelectedAssigneeKeys([]);
    setIsAssigneeListOpen(false);
    setShowModal(true);
  };

  const openEditModal = (task) => {
    const nextForm = taskToForm(task);
    const matchedKeys = matchAssigneeKeys(users, nextForm.assigned_to);
    setEditingId(task._id);
    setFormData(nextForm);
    setAssigneeSearch("");
    setSelectedAssigneeKeys(matchedKeys);
    setIsAssigneeListOpen(false);
    setShowModal(true);
  };

  const handleAssigneeToggle = (key) => {
    setSelectedAssigneeKeys((prev) => {
      const exists = prev.includes(key);
      const nextKeys = exists ? prev.filter((k) => k !== key) : [...prev, key];
      syncAssigneeFields(nextKeys);
      return nextKeys;
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.title.trim()) {
      alert("Please enter a task name");
      return;
    }
    if (!formData.assigned_to?.length) {
      alert("Please enter who is working on this task");
      return;
    }
    setSaving(true);
    try {
      if (editingId) {
        await api.put(`/tasks/${editingId}`, formData);
      } else {
        await api.post("/tasks", formData);
      }
      closeModal();
      load();
    } catch (err) {
      alert(err.response?.data?.message || "Failed to create task");
    } finally {
      setSaving(false);
    }
  };

  const statCards = [
    { label: "Total tasks", value: stats.total, color: "text-indigo-600", bg: "bg-indigo-50 dark:bg-indigo-950/40", icon: ListChecks },
    { label: "Pending", value: stats.pending, color: "text-amber-600", bg: "bg-amber-50 dark:bg-amber-950/40", icon: Clock },
    { label: "In progress", value: stats.inProgress, color: "text-blue-600", bg: "bg-blue-50 dark:bg-blue-950/40", icon: AlertCircle },
    { label: "Done", value: stats.done, color: "text-emerald-600", bg: "bg-emerald-50 dark:bg-emerald-950/40", icon: CheckCircle2 },
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
      activeClass: brand.chipDanger,
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
          onClick={openCreateModal}
          className={`inline-flex items-center gap-2 text-white rounded-xl px-5 py-2.5 text-sm font-semibold ${brand.gradient} ${brand.gradientHover} ${brand.btnRing}`}
        >
          <Plus className="h-4 w-4" />
          Add Task
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

      {stats.byDepartment?.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {stats.byDepartment.map((d) => (
            <button
              key={d._id}
              type="button"
              onClick={() => setDepartmentFilter(departmentFilter === d._id ? "" : d._id)}
              className={`rounded-full px-3 py-1.5 text-xs font-semibold transition ${departmentFilter === d._id ? brand.chipActive : brand.chipInactive
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
            className={`rounded-full px-3 py-1.5 text-xs font-semibold transition ${f.active ? f.activeClass : brand.chipInactive
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
        <div className={`flex h-48 ${brand.card}`}>
          <LoadingSpinner label="Loading tasks…" className="flex-1" />
        </div>
      ) : (
        <TaskTable
          tasks={tasks}
          reload={load}
          departmentFilter={departmentFilter}
          onDepartmentFilter={setDepartmentFilter}
          onEditTask={openEditModal}
        />
      )}

      <FormModal
        open={showModal}
        onClose={closeModal}
        eyebrow={editingId ? "Edit Task" : "New Task"}
        title={editingId ? "Update department task" : "Add department task"}
        subtitle={editingId ? "Modify task details and review schedule." : "Assign an owner and schedule the next weekly review."}
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
              className={`flex-1 rounded-xl py-2.5 text-sm font-semibold text-white disabled:opacity-50 ${brand.gradient} ${brand.gradientHover}`}
            >
              {saving ? "Saving…" : editingId ? "Save Changes" : "Create Task"}
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
            <div className="grid grid-cols-1 gap-3">
              <div>
                <FieldLabel required>Department</FieldLabel>
                <select
                  name="department"
                  value={formData.department}
                  onChange={(e) => setFormData((f) => ({ ...f, department: e.target.value }))}
                  className={fieldClass}
                >
                  {departments.map((d) => (
                    <option key={d.title} value={d.title}>
                      {d.title}
                    </option>
                  ))}
                </select>
              </div>
              <div ref={assigneePickerRef}>
                {selectedAssignees.length > 0 && (
                  <div className="mt-2 mb-3 rounded-xl border border-indigo-200 bg-indigo-50/60 p-2.5 dark:border-indigo-700 dark:bg-indigo-900/20">
                    <div className="mb-2 flex items-center justify-between">
                      <p className="text-xs font-semibold text-indigo-700 dark:text-indigo-200">
                        Selected ({selectedAssignees.length})
                      </p>
                      <button
                        type="button"
                        onClick={() => {
                          setSelectedAssigneeKeys([]);
                          setFormData((f) => ({ ...f, assigned_to: [] }));
                        }}
                        className="text-xs font-semibold text-indigo-700 hover:underline dark:text-indigo-200"
                      >
                        Clear all
                      </button>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {selectedAssignees.map((u) => (
                        <button
                          key={u.key}
                          type="button"
                          onClick={() => handleAssigneeToggle(u.key)}
                          className="rounded-full bg-white px-2.5 py-1 text-xs font-medium text-slate-700 ring-1 ring-slate-200 transition hover:bg-rose-50 hover:text-rose-700 hover:ring-rose-200 dark:bg-slate-800 dark:text-slate-200 dark:ring-slate-700 dark:hover:bg-rose-950/40 dark:hover:text-rose-200 dark:hover:ring-rose-800"
                          title="Remove assignee"
                        >
                          {u.name} {u.emp_code ? `(${u.emp_code})` : ""} x
                        </button>
                      ))}
                    </div>
                  </div>
                )}
                <FieldLabel required>Assigned to (multiple)</FieldLabel>
                <input
                  type="text"
                  value={assigneeSearch}
                  onFocus={() => setIsAssigneeListOpen(true)}
                  onChange={(e) => {
                    setAssigneeSearch(e.target.value);
                    setIsAssigneeListOpen(true);
                  }}
                  className={fieldClass}
                  placeholder="Search by name, emp code, department, or company"
                />
                {isAssigneeListOpen && (
                  <div className="mt-2 max-h-52 overflow-y-auto rounded-xl border border-slate-200 bg-white shadow-sm dark:border-slate-700 dark:bg-slate-900">
                    {availableUsers.length === 0 ? (
                      <p className="px-3 py-3 text-xs text-slate-500 dark:text-slate-400">
                        {selectedAssignees.length > 0 ? "All matching users already selected" : "No users found"}
                      </p>
                    ) : (
                      availableUsers.map((u) => {
                        return (
                          <label
                            key={u.key}
                            className="flex cursor-pointer items-start gap-3 border-b border-slate-100 px-3 py-2.5 text-sm transition hover:bg-indigo-50/60 last:border-b-0 dark:border-slate-800 dark:hover:bg-slate-800/80"
                          >
                            <input
                              type="checkbox"
                              checked={false}
                              onChange={() => handleAssigneeToggle(u.key)}
                              className="mt-0.5 opacity-0 h-4 w-0 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
                            />
                            <div className="min-w-0 leading-5 text-slate-700 dark:text-slate-200">
                              <p className="truncate font-medium">{u.name}</p>
                              <p className="truncate text-xs text-slate-500 dark:text-slate-400">
                                {u.is_external ? "External" : u.emp_code || "No code"}
                                {u.department_name ? ` | ${u.department_name}` : ""}
                                {u.company ? ` | ${u.company}` : ""}
                                {u.email ? ` | ${u.email}` : ""}
                              </p>
                            </div>
                          </label>
                        );
                      })
                    )}
                  </div>
                )}
                <input type="hidden" name="assigned_to" value={JSON.stringify(formData.assigned_to)} />
              </div>
            </div>
            <div>
              <FieldLabel>Assignee email</FieldLabel>
              <input
                type="text"
                name="assigned_email"
                disabled={true}
                value={formData.assigned_to.map((u) => u.email).filter(Boolean).join(", ")}
                className={fieldClass}
                placeholder="Auto-filled from selected assignees"
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
