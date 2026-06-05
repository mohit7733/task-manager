import { useState, useEffect } from "react";
import * as XLSX from "xlsx";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import { useDispatch, useSelector } from "react-redux";
import { addQuickNote, updateQuickNote, removeQuickNote, toggleTheme } from "../store/store";
import PageHeader from "../components/PageHeader";
import { APP_NAME, APP_TAGLINE, APP_VERSION, brand } from "../utils/theme";
import api from "../api/client";
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
  Activity
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
      case "Completed": return "text-emerald-600 bg-emerald-50";
      case "In Progress": return "text-blue-600 bg-blue-50";
      case "Pending": return "text-amber-600 bg-amber-50";
      default: return "text-gray-600 bg-gray-50";
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-800">Followup Chain</h2>
          <p className="text-sm text-gray-500 mt-1">Track meeting followups from start to completion</p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => setFilter("all")}
            className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${filter === "all" ? "bg-blue-600 text-white" : "bg-gray-100 text-gray-600 hover:bg-gray-200"
              }`}
          >
            All ({followups.length})
          </button>
          <button
            onClick={() => setFilter("pending")}
            className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${filter === "pending" ? "bg-amber-600 text-white" : "bg-gray-100 text-gray-600 hover:bg-gray-200"
              }`}
          >
            Pending ({followups.filter(f => f.isPending).length})
          </button>
          <button
            onClick={() => setFilter("overdue")}
            className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${filter === "overdue" ? "bg-red-600 text-white" : "bg-gray-100 text-gray-600 hover:bg-gray-200"
              }`}
          >
            Overdue ({followups.filter(f => f.isOverdue).length})
          </button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white rounded-xl p-4 border border-gray-100 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-gray-500">Total Followups</p>
              <p className="text-2xl font-bold text-gray-800">{followups.length}</p>
            </div>
            <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center">
              <Activity className="h-5 w-5 text-blue-600" />
            </div>
          </div>
        </div>
        <div className="bg-white rounded-xl p-4 border border-gray-100 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-gray-500">Avg. Followups/Meeting</p>
              <p className="text-2xl font-bold text-gray-800">
                {(followups.reduce((sum, f) => sum + f.remarkCount, 0) / followups.length || 0).toFixed(1)}
              </p>
            </div>
            <div className="w-10 h-10 rounded-full bg-purple-100 flex items-center justify-center">
              <TrendingUp className="h-5 w-5 text-purple-600" />
            </div>
          </div>
        </div>
        <div className="bg-white rounded-xl p-4 border border-gray-100 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-gray-500">Completion Rate</p>
              <p className="text-2xl font-bold text-emerald-600">
                {((followups.filter(f => f.status === "Completed").length / followups.length) * 100 || 0).toFixed(0)}%
              </p>
            </div>
            <div className="w-10 h-10 rounded-full bg-emerald-100 flex items-center justify-center">
              <CheckCircle className="h-5 w-5 text-emerald-600" />
            </div>
          </div>
        </div>
        <div className="bg-white rounded-xl p-4 border border-gray-100 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-gray-500">Overdue Items</p>
              <p className="text-2xl font-bold text-red-600">{followups.filter(f => f.isOverdue).length}</p>
            </div>
            <div className="w-10 h-10 rounded-full bg-red-100 flex items-center justify-center">
              <AlertCircle className="h-5 w-5 text-red-600" />
            </div>
          </div>
        </div>
      </div>

      <div className="overflow-auto rounded-xl border border-gray-200 bg-white dark:border-gray-700 dark:bg-gray-900">
        {loading ? (
          <p className="p-8 text-center text-gray-500">Loading followups…</p>
        ) : (
          <table className="excel-table w-full min-w-[1100px] border-collapse text-xs">
            <thead className="sticky top-0 bg-slate-100 dark:bg-slate-800">
              <tr>
                {["Title", "Status", "Remarks", "Last Remark", "Next Meeting", "Followup Note", "Responsible", "Priority", "Overdue"].map((h) => (
                  <th key={h} className="border border-gray-300 px-2 py-2 text-left font-semibold dark:border-gray-600">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filteredFollowups.map((f) => (
                <tr key={f._id} className={f.isOverdue ? "bg-red-50/50" : ""}>
                  <td className="border border-gray-200 px-2 py-1.5 font-medium dark:border-gray-700">{f.title}</td>
                  <td className={`border border-gray-200 px-2 py-1.5 dark:border-gray-700 ${getStatusColor(f.status)}`}>{f.status}</td>
                  <td className="border border-gray-200 px-2 py-1.5 text-center font-bold text-indigo-600 dark:border-gray-700">{f.remarkCount}</td>
                  <td className="max-w-[200px] border border-gray-200 px-2 py-1.5 dark:border-gray-700">{f.lastRemark?.remark_description || "—"}</td>
                  <td className="border border-gray-200 px-2 py-1.5 dark:border-gray-700">
                    {f.lastRemark?.next_meeting_date
                      ? new Date(f.lastRemark.next_meeting_date).toLocaleDateString()
                      : f.meeting_date
                        ? new Date(f.meeting_date).toLocaleDateString()
                        : "—"}
                  </td>
                  <td className="border border-gray-200 px-2 py-1.5 dark:border-gray-700">{f.lastRemark?.next_followup_note || "—"}</td>
                  <td className="border border-gray-200 px-2 py-1.5 dark:border-gray-700">{f.responsible_person || "—"}</td>
                  <td className="border border-gray-200 px-2 py-1.5 dark:border-gray-700">{f.priority}</td>
                  <td className="border border-gray-200 px-2 py-1.5 dark:border-gray-700">{f.isOverdue ? "Yes" : "No"}</td>
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
          m.responsible_person || "-"
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
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-800">Analytics & Reports</h2>
          <p className="text-sm text-gray-500 mt-1">Comprehensive insights into your meeting performance</p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={exportExcel}
            disabled={loading}
            className="inline-flex items-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl transition-all text-sm font-medium disabled:opacity-50"
          >
            <FileSpreadsheet className="h-4 w-4" />
            Export Excel
          </button>
          <button
            onClick={exportPDF}
            disabled={loading}
            className="inline-flex items-center gap-2 px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-xl transition-all text-sm font-medium disabled:opacity-50"
          >
            <FileText className="h-4 w-4" />
            Export PDF
          </button>
        </div>
      </div>

      {/* Report Type Tabs */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-1 flex gap-1">
        {[
          { id: "summary", label: "Summary", icon: BarChart3 },
          { id: "status", label: "Status Analysis", icon: PieChart },
          { id: "priority", label: "Priority Analysis", icon: Activity }
        ].map((type) => (
          <button
            key={type.id}
            onClick={() => setReportType(type.id)}
            className={`flex-1 flex items-center justify-center gap-2 px-4 py-2 rounded-lg transition-all text-sm font-medium ${reportType === type.id
              ? "bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-md"
              : "text-gray-600 hover:bg-gray-50"
              }`}
          >
            <type.icon className="h-4 w-4" />
            {type.label}
          </button>
        ))}
      </div>

      {/* Stats Overview */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white rounded-xl p-4 border border-gray-100 shadow-sm">
          <p className="text-xs text-gray-500">Total Meetings</p>
          <p className="text-2xl font-bold text-gray-800">{meetings.length}</p>
          <p className="text-xs text-slate-400 mt-1">All recorded meetings</p>
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

      {/* Charts based on selected report type */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
        {reportType === "summary" && (
          <div>
            <h3 className="text-lg font-semibold text-gray-800 mb-4">Meeting Trends</h3>
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
        )}

        {reportType === "status" && (
          <div>
            <h3 className="text-lg font-semibold text-gray-800 mb-4">Status Distribution</h3>
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
                  <div key={status} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <span className="text-sm font-medium text-gray-700">{status}</span>
                    <div className="flex items-center gap-3">
                      <span className="text-2xl font-bold text-gray-900">{count}</span>
                      <span className="text-sm text-gray-500">{((count / meetings.length) * 100).toFixed(1)}%</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {reportType === "priority" && (
          <div>
            <h3 className="text-lg font-semibold text-gray-800 mb-4">Priority Distribution</h3>
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
                  <div key={priority} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <span className="text-sm font-medium text-gray-700">{priority}</span>
                    <div className="flex items-center gap-3">
                      <span className="text-2xl font-bold text-gray-900">{count}</span>
                      <span className="text-sm text-gray-500">{((count / meetings.length) * 100).toFixed(1)}%</span>
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
      {/* Header */}
      <div>
        <h2 className="text-2xl font-bold text-gray-800">Settings</h2>
        <p className="text-sm text-gray-500 mt-1">Manage your preferences and quick notes</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Quick Notes Section */}
        <div className="lg:col-span-2">
          <div className="bg-white rounded-xl shadow-sm border border-gray-100">
            <div className="p-6 border-b border-gray-100">
              <h3 className="text-lg font-semibold text-gray-800 flex items-center gap-2">
                <Save className="h-5 w-5 text-blue-600" />
                Quick Notes
              </h3>
              <p className="text-sm text-gray-500 mt-1">Store and manage your daily notes and reminders</p>
            </div>

            <div className="p-6">
              {/* Add Note Input */}
              <div className="flex gap-2 mb-6">
                <input
                  type="text"
                  className="flex-1 rounded-xl border border-gray-200 px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Write a quick note..."
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && addNote()}
                />
                <button
                  onClick={addNote}
                  className="px-4 py-2.5 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white rounded-xl transition-all text-sm font-medium inline-flex items-center gap-2"
                >
                  <Plus className="h-4 w-4" />
                  Add Note
                </button>
              </div>

              {/* Notes List */}
              <div className="space-y-2 max-h-[500px] overflow-y-auto">
                {notes.length === 0 ? (
                  <div className="text-center py-12">
                    <div className="w-16 h-16 rounded-full bg-gray-100 flex items-center justify-center mx-auto mb-4">
                      <Save className="h-8 w-8 text-gray-400" />
                    </div>
                    <p className="text-gray-500">No notes yet</p>
                    <p className="text-sm text-gray-400 mt-1">Add your first quick note above</p>
                  </div>
                ) : (
                  notes.map((n, i) => (
                    <div key={`${n}-${i}`} className="group bg-gray-50 rounded-xl p-4 hover:bg-gray-100 transition-all">
                      {editingIndex === i ? (
                        <div className="flex gap-2">
                          <input
                            type="text"
                            value={editingNote}
                            onChange={(e) => setEditingNote(e.target.value)}
                            className="flex-1 rounded-lg border border-gray-200 px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                            autoFocus
                          />
                          <button
                            onClick={saveEdit}
                            className="px-3 py-1.5 bg-emerald-600 text-white rounded-lg text-sm hover:bg-emerald-700 transition-colors"
                          >
                            Save
                          </button>
                          <button
                            onClick={() => setEditingIndex(null)}
                            className="px-3 py-1.5 bg-gray-200 text-gray-700 rounded-lg text-sm hover:bg-gray-300 transition-colors"
                          >
                            Cancel
                          </button>
                        </div>
                      ) : (
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <p className="text-gray-800">{n}</p>
                            <p className="text-xs text-gray-400 mt-1">
                              Added {new Date().toLocaleDateString()}
                            </p>
                          </div>
                          <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                            <button
                              onClick={() => startEdit(i, n)}
                              className="p-1.5 hover:bg-gray-200 rounded-lg transition-colors"
                              title="Edit"
                            >
                              <Edit2 className="h-4 w-4 text-gray-500" />
                            </button>
                            <button
                              onClick={() => deleteNote(i)}
                              className="p-1.5 hover:bg-red-100 rounded-lg transition-colors"
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

        {/* Settings Sidebar */}
        <div className="space-y-6">
          {/* Preferences Card */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
            <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
              <Activity className="h-5 w-5 text-purple-600" />
              Preferences
            </h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Default View</label>
                <select className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
                  <option>Dashboard</option>
                  <option>Calendar</option>
                  <option>Meetings</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2 dark:text-gray-300">Theme</label>
                <button
                  type="button"
                  onClick={() => dispatch(toggleTheme())}
                  className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm dark:border-gray-600"
                >
                  {darkMode ? "Switch to Light Mode" : "Switch to Dark Mode"}
                </button>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2 dark:text-gray-300">
                  <Mail className="inline h-4 w-4 mr-1" />
                  Email Notifications
                </label>
                <div className="flex items-center justify-between rounded-lg border border-gray-100 px-3 py-2 dark:border-gray-700">
                  <span className="text-sm text-gray-600 dark:text-gray-400">Reminders, assignments & MOM updates</span>
                  <button
                    type="button"
                    disabled={savingSettings}
                    onClick={() => {
                      const next = !emailEnabled;
                      setEmailEnabled(next);
                      saveEmailSettings(next, reminderHours);
                    }}
                    className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                      emailEnabled ? "bg-blue-600" : "bg-gray-300"
                    }`}
                  >
                    <span
                      className={`inline-block h-4 w-4 rounded-full bg-white transition-transform ${
                        emailEnabled ? "translate-x-6" : "translate-x-1"
                      }`}
                    />
                  </button>
                </div>
                <p className="mt-1 text-xs text-gray-400">
                  Configure SMTP in backend .env to send real emails
                </p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2 dark:text-gray-300">Reminder lead time</label>
                <select
                  value={reminderHours}
                  disabled={savingSettings}
                  onChange={(e) => {
                    const hours = Number(e.target.value);
                    setReminderHours(hours);
                    saveEmailSettings(emailEnabled, hours);
                  }}
                  className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 dark:border-gray-600 dark:bg-gray-800"
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

          {/* About Card */}
          <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl p-6">
            <h3 className="text-lg font-semibold text-gray-800 mb-2">About</h3>
            <p className="text-sm text-slate-600 mb-3">{APP_NAME} v{APP_VERSION}</p>
            <p className="text-xs text-slate-500">{APP_TAGLINE}</p>
            <div className="mt-4 pt-4 border-t border-indigo-100">
              <p className="text-xs text-slate-500">© {new Date().getFullYear()} {APP_NAME}. All rights reserved.</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}