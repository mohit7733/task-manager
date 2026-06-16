import { useState, useEffect } from "react";
import * as XLSX from "xlsx";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import { useDispatch, useSelector } from "react-redux";
import { addQuickNote, updateQuickNote, removeQuickNote, toggleTheme } from "../store/store";
import PageHeader from "../components/PageHeader";
import LoadingSpinner from "../components/LoadingSpinner";
import EmptyState from "../components/EmptyState";
import { FieldLabel, fieldClass } from "../components/FormModal";
import { APP_NAME, APP_TAGLINE, APP_VERSION, brand } from "../utils/theme";
import api from "../api/client";
import { formatResponsiblePerson } from "../utils/format";
import {
  FileSpreadsheet,
  FileText,
  Download,
  Calendar,
  TrendingUp,
  Users,
  CheckCircle,
  Clock,
  AlertCircle,
  X,
  Plus,
  Trash2,
  Edit2,
  Save,
  Printer,
  Mail,
  BarChart3,
  PieChart,
  Activity,
  GitBranch,
} from "lucide-react";
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  PieChart as RePieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer
} from "recharts";

export function FollowupsPage() {
  const [followups, setFollowups] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("all");

  useEffect(() => {
    loadFollowups();
  }, []);

  const loadFollowups = async () => {
    try {
      const res = await api.get("/meetings", { params: { limit: 100 } });
      const meetings = res.data.items;
      const followupData = meetings.map(meeting => ({
        ...meeting,
        remarkCount: meeting.lastRemark?.remark_number || 0,
        lastRemarkDate: meeting.lastRemark?.createdAt,
        isOverdue: meeting.status !== "Completed" && new Date(meeting.meeting_date) < new Date(),
        isPending: meeting.status === "Pending"
      }));
      setFollowups(followupData);
    } catch (error) {
      console.error("Failed to load followups:", error);
    } finally {
      setLoading(false);
    }
  };

  const filteredFollowups = followups.filter(f => {
    if (filter === "overdue") return f.isOverdue;
    if (filter === "pending") return f.isPending;
    if (filter === "completed") return f.status === "Completed";
    return true;
  });

  const getStatusColor = (status) => {
    switch (status) {
      case "Completed":
        return "text-emerald-700 bg-emerald-50 dark:bg-emerald-950/40 dark:text-emerald-300";
      case "In Progress":
        return "text-blue-700 bg-blue-50 dark:bg-blue-950/40 dark:text-blue-300";
      case "Pending":
        return "text-amber-700 bg-amber-50 dark:bg-amber-950/40 dark:text-amber-300";
      default:
        return "text-slate-700 bg-slate-50 dark:bg-slate-800 dark:text-slate-300";
    }
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Followup Chain"
        subtitle="Track meeting followups from start to completion"
        icon={GitBranch}
      >
        <button
          type="button"
          onClick={() => setFilter("all")}
          className={`rounded-full px-3 py-1.5 text-xs font-semibold transition ${
            filter === "all" ? brand.chipActive : brand.chipInactive
          }`}
        >
          All ({followups.length})
        </button>
        <button
          type="button"
          onClick={() => setFilter("pending")}
          className={`rounded-full px-3 py-1.5 text-xs font-semibold transition ${
            filter === "pending" ? brand.chipWarning : brand.chipInactive
          }`}
        >
          Pending ({followups.filter((f) => f.isPending).length})
        </button>
        <button
          type="button"
          onClick={() => setFilter("overdue")}
          className={`rounded-full px-3 py-1.5 text-xs font-semibold transition ${
            filter === "overdue" ? brand.chipDanger : brand.chipInactive
          }`}
        >
          Overdue ({followups.filter((f) => f.isOverdue).length})
        </button>
      </PageHeader>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {[
          { label: "Total Followups", value: followups.length, icon: Activity, color: "text-indigo-600", bg: "bg-indigo-50 dark:bg-indigo-950/40" },
          {
            label: "Avg. Followups/Meeting",
            value: (followups.reduce((sum, f) => sum + f.remarkCount, 0) / followups.length || 0).toFixed(1),
            icon: TrendingUp,
            color: "text-violet-600",
            bg: "bg-violet-50 dark:bg-violet-950/40",
          },
          {
            label: "Completion Rate",
            value: `${((followups.filter((f) => f.status === "Completed").length / followups.length) * 100 || 0).toFixed(0)}%`,
            icon: CheckCircle,
            color: "text-emerald-600",
            bg: "bg-emerald-50 dark:bg-emerald-950/40",
          },
          {
            label: "Overdue Items",
            value: followups.filter((f) => f.isOverdue).length,
            icon: AlertCircle,
            color: "text-red-600",
            bg: "bg-red-50 dark:bg-red-950/40",
          },
        ].map((stat) => {
          const Icon = stat.icon;
          return (
            <div key={stat.label} className={brand.statCard}>
              <div className="flex items-center justify-between p-4">
                <div>
                  <p className="text-xs font-medium text-slate-500">{stat.label}</p>
                  <p className={`mt-1 text-2xl font-bold ${stat.color}`}>{stat.value}</p>
                </div>
                <div className={`rounded-xl p-2.5 ${stat.bg} ${stat.color}`}>
                  <Icon className="h-5 w-5" />
                </div>
              </div>
            </div>
          );
        })}
      </div>

      <div className={`overflow-auto ${brand.tableWrap}`}>
        {loading ? (
          <LoadingSpinner label="Loading followups…" className="p-8" />
        ) : filteredFollowups.length === 0 ? (
          <EmptyState bare compact icon={GitBranch} title="No followups match this filter" />
        ) : (
          <table className="excel-table w-full min-w-[1100px] border-collapse text-xs">
            <thead className={brand.tableHead}>
              <tr>
                {["Title", "Status", "Remarks", "Last Remark", "Next Meeting", "Followup Note", "Responsible", "Priority", "Overdue"].map((h) => (
                  <th key={h} className={brand.tableHeadCell}>
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filteredFollowups.map((f) => (
                <tr key={f._id} className={f.isOverdue ? "bg-red-50/50 dark:bg-red-950/20" : brand.rowHover}>
                  <td className={`${brand.tableCell} font-medium`}>{f.title}</td>
                  <td className={`${brand.tableCell} ${getStatusColor(f.status)}`}>{f.status}</td>
                  <td className={`${brand.tableCell} text-center font-bold text-indigo-600`}>{f.remarkCount}</td>
                  <td className={`max-w-[200px] ${brand.tableCell}`}>{f.lastRemark?.remark_description || "—"}</td>
                  <td className={brand.tableCell}>
                    {f.lastRemark?.next_meeting_date
                      ? new Date(f.lastRemark.next_meeting_date).toLocaleDateString()
                      : f.meeting_date
                        ? new Date(f.meeting_date).toLocaleDateString()
                        : "—"}
                  </td>
                  <td className={brand.tableCell}>{f.lastRemark?.next_followup_note || "—"}</td>
                  <td className={brand.tableCell}>{formatResponsiblePerson(f.responsible_person) || "—"}</td>
                  <td className={brand.tableCell}>{f.priority}</td>
                  <td className={brand.tableCell}>{f.isOverdue ? "Yes" : "No"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}

export function ReportsPage() {
  const [loading, setLoading] = useState(false);
  const [reportType, setReportType] = useState("summary");
  const [dateRange, setDateRange] = useState({ start: "", end: "" });
  const [meetings, setMeetings] = useState([]);
  const [chartData, setChartData] = useState({});

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const res = await api.get("/meetings", { params: { limit: 200 } });
      const data = res.data.items;
      setMeetings(data);

      // Prepare chart data
      const statusCount = {
        Completed: data.filter(m => m.status === "Completed").length,
        "In Progress": data.filter(m => m.status === "In Progress").length,
        Pending: data.filter(m => m.status === "Pending").length,
        Rescheduled: data.filter(m => m.status === "Rescheduled").length
      };

      const priorityCount = {
        Low: data.filter(m => m.priority === "Low").length,
        Medium: data.filter(m => m.priority === "Medium").length,
        High: data.filter(m => m.priority === "High").length,
        Critical: data.filter(m => m.priority === "Critical").length
      };

      const monthlyData = {};
      data.forEach(m => {
        if (m.meeting_date) {
          const month = new Date(m.meeting_date).toLocaleString('default', { month: 'short' });
          monthlyData[month] = (monthlyData[month] || 0) + 1;
        }
      });

      setChartData({ statusCount, priorityCount, monthlyData });
    } catch (error) {
      console.error("Failed to load data:", error);
    } finally {
      setLoading(false);
    }
  };

  const exportExcel = async () => {
    setLoading(true);
    try {
      const res = await api.get("/meetings", { params: { limit: 200 } });
      const ws = XLSX.utils.json_to_sheet(res.data.items);
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, "Meetings");
      XLSX.writeFile(wb, `coo-pa-meetings-${new Date().toISOString().split('T')[0]}.xlsx`);
    } catch (error) {
      console.error("Failed to export Excel:", error);
    } finally {
      setLoading(false);
    }
  };

  const exportPDF = async () => {
    setLoading(true);
    try {
      const res = await api.get("/meetings", { params: { limit: 200 } });
      const doc = new jsPDF();

      doc.setFontSize(20);
      doc.setTextColor(99, 102, 241);
      doc.text(`${APP_NAME} — Meeting Report`, 14, 20);

      doc.setFontSize(12);
      doc.setTextColor(100, 116, 139);
      doc.text(`Generated: ${new Date().toLocaleString()}`, 14, 30);
      doc.text(`Total Meetings: ${res.data.items.length}`, 14, 38);

      autoTable(doc, {
        head: [["Title", "Date", "Status", "Priority", "Responsible"]],
        body: res.data.items.map((m) => [
          m.title,
          m.meeting_date?.slice(0, 10) || "-",
          m.status,
          m.priority || "Medium",
          formatResponsiblePerson(m.responsible_person) || "-"
        ]),
        startY: 45,
        theme: 'striped',
        headStyles: { fillColor: [99, 102, 241], textColor: 255 },
        alternateRowStyles: { fillColor: [249, 250, 251] }
      });

      doc.save(`coo-pa-meetings-${new Date().toISOString().split('T')[0]}.pdf`);
    } catch (error) {
      console.error("Failed to export PDF:", error);
    } finally {
      setLoading(false);
    }
  };

  const COLORS = ['#6366f1', '#f59e0b', '#10b981', '#ef4444', '#8b5cf6'];

  return (
    <div className="space-y-6">
      <PageHeader
        title="Analytics & Reports"
        subtitle="Comprehensive insights into your meeting performance"
        icon={BarChart3}
      >
        <button
          type="button"
          onClick={exportExcel}
          disabled={loading}
          className={`${brand.btnPrimary} ${brand.btnSuccess}`}
        >
          <FileSpreadsheet className="h-4 w-4" />
          Export Excel
        </button>
        <button
          type="button"
          onClick={exportPDF}
          disabled={loading}
          className={`${brand.btnPrimary} ${brand.btnDanger}`}
        >
          <FileText className="h-4 w-4" />
          Export PDF
        </button>
      </PageHeader>

      <div className={`${brand.tabGroup} gap-1`}>
        {[
          { id: "summary", label: "Summary", icon: BarChart3 },
          { id: "status", label: "Status Analysis", icon: PieChart },
          { id: "priority", label: "Priority Analysis", icon: Activity },
        ].map((type) => (
          <button
            key={type.id}
            type="button"
            onClick={() => setReportType(type.id)}
            className={`flex flex-1 items-center justify-center gap-2 rounded-lg px-4 py-2 text-sm font-medium transition ${
              reportType === type.id ? brand.tabActive : brand.tabInactive
            }`}
          >
            <type.icon className="h-4 w-4" />
            {type.label}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <div className={`${brand.statCard} p-4`}>
          <p className="text-xs text-slate-500">Total Meetings</p>
          <p className="text-2xl font-bold text-slate-900 dark:text-white">{meetings.length}</p>
          <p className="mt-1 text-xs text-slate-400">All recorded meetings</p>
        </div>
        <div className={`${brand.statCard} p-4`}>
          <p className="text-xs text-slate-500">Completion Rate</p>
          <p className="text-2xl font-bold text-emerald-600">
            {((meetings.filter(m => m.status === "Completed").length / meetings.length) * 100 || 0).toFixed(0)}%
          </p>
          <div className="mt-2 h-1.5 w-full rounded-full bg-slate-200">
            <div className="h-1.5 rounded-full bg-emerald-600" style={{ width: `${((meetings.filter(m => m.status === "Completed").length / meetings.length) * 100 || 0)}%` }} />
          </div>
        </div>
        <div className={`${brand.statCard} p-4`}>
          <p className="text-xs text-slate-500">High Priority</p>
          <p className="text-2xl font-bold text-red-600">{meetings.filter(m => m.priority === "High" || m.priority === "Critical").length}</p>
          <p className="mt-1 text-xs text-red-600">Requires attention</p>
        </div>
        <div className={`${brand.statCard} p-4`}>
          <p className="text-xs text-slate-500">Pending</p>
          <p className="text-2xl font-bold text-amber-600">{meetings.filter(m => m.status === "Pending").length}</p>
          <p className="mt-1 text-xs text-slate-400">Awaiting follow-up</p>
        </div>
      </div>

      <div className={`${brand.card} p-6`}>
        {loading ? (
          <LoadingSpinner label="Loading report data…" className="py-16" />
        ) : reportType === "summary" ? (
          <div>
            <h3 className="mb-4 text-lg font-semibold text-slate-900 dark:text-white">Meeting Trends</h3>
            <ResponsiveContainer width="100%" height={400}>
              <BarChart data={Object.entries(chartData.monthlyData || {}).map(([month, count]) => ({ month, count }))}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="month" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Bar dataKey="count" fill="#6366f1" radius={[8, 8, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        ) : reportType === "status" ? (
          <div>
            <h3 className="mb-4 text-lg font-semibold text-slate-900 dark:text-white">Status Distribution</h3>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              <ResponsiveContainer width="100%" height={300}>
                <RePieChart>
                  <Pie
                    data={Object.entries(chartData.statusCount || {}).map(([name, value]) => ({ name, value }))}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={(entry) => `${entry.name}: ${entry.value}`}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {Object.entries(chartData.statusCount || {}).map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                </RePieChart>
              </ResponsiveContainer>
              <div className="space-y-3">
                {Object.entries(chartData.statusCount || {}).map(([status, count]) => (
                  <div key={status} className="flex items-center justify-between rounded-xl bg-slate-50 p-3 dark:bg-slate-800/50">
                    <span className="text-sm font-medium text-slate-700 dark:text-slate-300">{status}</span>
                    <div className="flex items-center gap-3">
                      <span className="text-2xl font-bold text-slate-900 dark:text-white">{count}</span>
                      <span className="text-sm text-slate-500">{((count / meetings.length) * 100).toFixed(1)}%</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        ) : (
          <div>
            <h3 className="mb-4 text-lg font-semibold text-slate-900 dark:text-white">Priority Distribution</h3>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              <ResponsiveContainer width="100%" height={300}>
                <RePieChart>
                  <Pie
                    data={Object.entries(chartData.priorityCount || {}).map(([name, value]) => ({ name, value }))}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={(entry) => `${entry.name}: ${entry.value}`}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {Object.entries(chartData.priorityCount || {}).map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                </RePieChart>
              </ResponsiveContainer>
              <div className="space-y-3">
                {Object.entries(chartData.priorityCount || {}).map(([priority, count]) => (
                  <div key={priority} className="flex items-center justify-between rounded-xl bg-slate-50 p-3 dark:bg-slate-800/50">
                    <span className="text-sm font-medium text-slate-700 dark:text-slate-300">{priority}</span>
                    <div className="flex items-center gap-3">
                      <span className="text-2xl font-bold text-slate-900 dark:text-white">{count}</span>
                      <span className="text-sm text-slate-500">{((count / meetings.length) * 100).toFixed(1)}%</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

const REMINDER_OPTIONS = [
  { label: "15 minutes before", value: 0.25 },
  { label: "30 minutes before", value: 0.5 },
  { label: "1 hour before", value: 1 },
  { label: "1 day before", value: 24 },
];

export function SettingsPage() {
  const [note, setNote] = useState("");
  const [editingIndex, setEditingIndex] = useState(null);
  const [editingNote, setEditingNote] = useState("");
  const [emailEnabled, setEmailEnabled] = useState(true);
  const [reminderHours, setReminderHours] = useState(24);
  const [savingSettings, setSavingSettings] = useState(false);
  const notes = useSelector((s) => s.ui.quickNotes);
  const darkMode = useSelector((s) => s.ui.darkMode);
  const dispatch = useDispatch();

  useEffect(() => {
    api
      .get("/auth/me")
      .then((res) => {
        setEmailEnabled(res.data.email_notifications_enabled !== false);
        setReminderHours(res.data.reminder_lead_hours ?? 24);
      })
      .catch(() => {});
  }, []);

  const saveEmailSettings = async (nextEnabled, nextHours) => {
    setSavingSettings(true);
    try {
      await api.put("/auth/settings", {
        email_notifications_enabled: nextEnabled,
        reminder_lead_hours: nextHours,
      });
    } catch {
      /* ignore */
    } finally {
      setSavingSettings(false);
    }
  };

  const addNote = () => {
    if (note.trim()) {
      dispatch(addQuickNote(note.trim()));
      setNote("");
    }
  };

  const deleteNote = (index) => {
    dispatch(removeQuickNote(index));
  };

  const startEdit = (index, currentNote) => {
    setEditingIndex(index);
    setEditingNote(currentNote);
  };

  const saveEdit = () => {
    if (editingNote.trim() && editingIndex !== null) {
      dispatch(updateQuickNote({ index: editingIndex, text: editingNote.trim() }));
      setEditingIndex(null);
      setEditingNote("");
    }
  };

  return (
    <div className="space-y-6">
      <PageHeader title="Settings" subtitle="Manage your preferences and quick notes" icon={Save} />

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <div className={brand.card}>
            <div className={brand.cardHeader}>
              <h3 className={`flex items-center gap-2 font-semibold text-slate-900 dark:text-white`}>
                <Save className={`h-5 w-5 ${brand.text}`} />
                Quick Notes
              </h3>
              <p className={`mt-1 ${brand.pageSubtitle}`}>Store and manage your daily notes and reminders</p>
            </div>

            <div className="p-6">
              <div className="mb-6 flex gap-2">
                <input
                  type="text"
                  className={`flex-1 ${fieldClass}`}
                  placeholder="Write a quick note..."
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && addNote()}
                />
                <button
                  type="button"
                  onClick={addNote}
                  className={`${brand.btnPrimary} ${brand.gradient} ${brand.gradientHover}`}
                >
                  <Plus className="h-4 w-4" />
                  Add Note
                </button>
              </div>

              <div className="max-h-[500px] space-y-2 overflow-y-auto">
                {notes.length === 0 ? (
                  <EmptyState bare compact icon={Save} title="No notes yet" description="Add your first quick note above" />
                ) : (
                  notes.map((n, i) => (
                    <div
                      key={`${n}-${i}`}
                      className="group rounded-xl bg-slate-50 p-4 transition hover:bg-slate-100 dark:bg-slate-800/50 dark:hover:bg-slate-800"
                    >
                      {editingIndex === i ? (
                        <div className="flex gap-2">
                          <input
                            type="text"
                            value={editingNote}
                            onChange={(e) => setEditingNote(e.target.value)}
                            className={`flex-1 ${fieldClass}`}
                            autoFocus
                          />
                          <button
                            type="button"
                            onClick={saveEdit}
                            className={`rounded-xl px-3 py-1.5 text-sm ${brand.btnSuccess}`}
                          >
                            Save
                          </button>
                          <button type="button" onClick={() => setEditingIndex(null)} className={brand.btnSecondary}>
                            Cancel
                          </button>
                        </div>
                      ) : (
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <p className="text-slate-800 dark:text-slate-200">{n}</p>
                            <p className="mt-1 text-xs text-slate-400">Added {new Date().toLocaleDateString()}</p>
                          </div>
                          <div className="flex gap-1 opacity-0 transition-opacity group-hover:opacity-100">
                            <button
                              type="button"
                              onClick={() => startEdit(i, n)}
                              className="rounded-lg p-1.5 transition hover:bg-slate-200 dark:hover:bg-slate-700"
                              title="Edit"
                            >
                              <Edit2 className="h-4 w-4 text-slate-500" />
                            </button>
                            <button
                              type="button"
                              onClick={() => deleteNote(i)}
                              className="rounded-lg p-1.5 transition hover:bg-red-100 dark:hover:bg-red-950/40"
                              title="Delete"
                            >
                              <Trash2 className="h-4 w-4 text-red-500" />
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        </div>

        <div className="space-y-6">
          <div className={`${brand.card} p-6`}>
            <h3 className="mb-4 flex items-center gap-2 text-lg font-semibold text-slate-900 dark:text-white">
              <Activity className={`h-5 w-5 ${brand.text}`} />
              Preferences
            </h3>
            <div className="space-y-4">
              <div>
                <FieldLabel>Default View</FieldLabel>
                <select className={fieldClass}>
                  <option>Dashboard</option>
                  <option>Calendar</option>
                  <option>Meetings</option>
                </select>
              </div>
              <div>
                <FieldLabel>Theme</FieldLabel>
                <button type="button" onClick={() => dispatch(toggleTheme())} className={`w-full ${brand.btnSecondary}`}>
                  {darkMode ? "Switch to Light Mode" : "Switch to Dark Mode"}
                </button>
              </div>
              <div>
                <FieldLabel>
                  <Mail className="mr-1 inline h-4 w-4" />
                  Email Notifications
                </FieldLabel>
                <div className="flex items-center justify-between rounded-xl border border-slate-100 px-3 py-2 dark:border-slate-700">
                  <span className="text-sm text-slate-600 dark:text-slate-400">Reminders, assignments & MOM updates</span>
                  <button
                    type="button"
                    disabled={savingSettings}
                    onClick={() => {
                      const next = !emailEnabled;
                      setEmailEnabled(next);
                      saveEmailSettings(next, reminderHours);
                    }}
                    className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                      emailEnabled ? "bg-indigo-600" : "bg-slate-300 dark:bg-slate-600"
                    }`}
                  >
                    <span
                      className={`inline-block h-4 w-4 rounded-full bg-white transition-transform ${
                        emailEnabled ? "translate-x-6" : "translate-x-1"
                      }`}
                    />
                  </button>
                </div>
                <p className="mt-1 text-xs text-slate-400">Configure SMTP in backend .env to send real emails</p>
              </div>
              <div>
                <FieldLabel>Reminder lead time</FieldLabel>
                <select
                  value={reminderHours}
                  disabled={savingSettings}
                  onChange={(e) => {
                    const hours = Number(e.target.value);
                    setReminderHours(hours);
                    saveEmailSettings(emailEnabled, hours);
                  }}
                  className={fieldClass}
                >
                  {REMINDER_OPTIONS.map((o) => (
                    <option key={o.value} value={o.value}>
                      {o.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          <div className="rounded-2xl border border-indigo-100 bg-gradient-to-r from-blue-50 to-indigo-50 p-6 dark:border-indigo-900 dark:from-indigo-950/40 dark:to-slate-900">
            <h3 className="mb-2 text-lg font-semibold text-slate-900 dark:text-white">About</h3>
            <p className="mb-3 text-sm text-slate-600 dark:text-slate-400">
              {APP_NAME} v{APP_VERSION}
            </p>
            <p className="text-xs text-slate-500">{APP_TAGLINE}</p>
            <div className="mt-4 border-t border-indigo-100 pt-4 dark:border-indigo-900">
              <p className="text-xs text-slate-500">
                © {new Date().getFullYear()} {APP_NAME}. All rights reserved.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}