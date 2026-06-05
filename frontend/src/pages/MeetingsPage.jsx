import { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import {
  Plus,
  Search,
  Filter,
  RefreshCw,
  ChevronDown,
  X,
  AlertCircle,
  Calendar,
  Clock,
  Users,
  Flag,
  Save,
  FileText,
  User,
  Tag,
  Repeat,
  Paperclip,
  Star
} from "lucide-react";
import api from "../api/client";
import MeetingTable from "../components/MeetingTable";

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
  const [showFilters, setShowFilters] = useState(false);
  const [stats, setStats] = useState({ total: 0, pending: 0, completed: 0, inProgress: 0 });

  // Modal states
  const [showModal, setShowModal] = useState(false);
  const [saving, setSaving] = useState(false);
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    meeting_type: "internal",
    meeting_date: "",
    meeting_time: "",
    responsible_person: "",
    status: "Pending",
    priority: "Medium",
    discussion_topic: "",
    final_outcome: "",
    reminder_date: "",
    recurrence: "None",
    attachment: ""
  });

  const load = async () => {
    setLoading(true);
    try {
      const res = await api.get("/meetings", { params: { ...filters, limit: 25 } });
      setMeetings(res.data.items);

      const items = res.data.items;
      setStats({
        total: items.length,
        pending: items.filter(m => m.status === "Pending").length,
        completed: items.filter(m => m.status === "Completed").length,
        inProgress: items.filter(m => m.status === "In Progress").length,
      });
    } catch (error) {
      console.error("Failed to load meetings:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
    // const timer = setInterval(load, 30000);
    // return () => clearInterval(timer);
  }, [filters.status, filters.search, filters.priority, filters.meeting_type, filters.overdue, filters.thisWeek]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const resetForm = () => {
    setFormData({
      title: "",
      description: "",
      meeting_type: "internal",
      meeting_date: "",
      meeting_time: "",
      responsible_person: "",
      status: "Pending",
      priority: "Medium",
      discussion_topic: "",
      final_outcome: "",
      reminder_date: "",
      recurrence: "None",
      attachment: ""
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    // Validation
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
      await api.post("/meetings", {
        ...formData,
        task_create_date: new Date(),
        meeting_date: new Date(formData.meeting_date),
        reminder_date: formData.reminder_date ? new Date(formData.reminder_date) : undefined,
      });

      setShowModal(false);
      resetForm();
      await load();
    } catch (error) {
      console.error("Failed to add meeting:", error);
      alert("Failed to create meeting. Please try again.");
    } finally {
      setSaving(false);
    }
  };

  const clearFilters = () => {
    setFilters({ status: "", search: "", priority: "" });
    setShowFilters(false);
  };

  const hasActiveFilters = filters.status || filters.search || filters.priority;

  return (
    <div className="space-y-6">
      {/* Header Section */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-800">Meetings & Tasks</h2>
          <p className="text-sm text-gray-500 mt-1">Manage and track all your meetings and associated tasks</p>
        </div>
        <button
          onClick={() => setShowModal(true)}
          className="inline-flex items-center gap-2 px-4 py-2.5 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white rounded-xl shadow-md hover:shadow-lg transition-all duration-200 font-medium text-sm"
        >
          <Plus className="h-4 w-4" />
          New Meeting
        </button>
      </div>

      <div className="flex flex-wrap gap-2 rounded-xl border border-gray-200 bg-white p-3 dark:border-gray-700 dark:bg-gray-900">
        {[
          { key: "overdue", value: "true", label: "Overdue" },
          { key: "thisWeek", value: "true", label: "This Week" },
          { key: "meeting_type", value: "internal", label: "Internal" },
          { key: "meeting_type", value: "external", label: "External" },
          { key: "status", value: "Pending", label: "Pending" },
          { key: "status", value: "Completed", label: "Completed" },
        ].map((chip) => {
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
              className={`rounded-full px-3 py-1 text-xs font-medium ${active ? "bg-indigo-600 text-white" : "bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300"}`}
            >
              {chip.label}
            </button>
          );
        })}
      </div>

      {/* Meetings Table */}
      {loading ? (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100">
          <div className="p-8 text-center">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-4 border-gray-200 border-t-blue-600"></div>
            <p className="mt-3 text-gray-500 text-sm">Loading meetings...</p>
          </div>
        </div>
      ) : meetings.length === 0 ? (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100">
          <div className="p-12 text-center">
            <div className="w-16 h-16 rounded-full bg-gray-100 flex items-center justify-center mx-auto mb-4">
              <Calendar className="h-8 w-8 text-gray-400" />
            </div>
            <h3 className="text-lg font-semibold text-gray-800 mb-1">No meetings found</h3>
            <p className="text-gray-500 text-sm mb-4">
              {hasActiveFilters ? "Try adjusting your filters" : "Get started by creating your first meeting"}
            </p>
            {!hasActiveFilters && (
              <button
                onClick={() => setShowModal(true)}
                className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium"
              >
                <Plus className="h-4 w-4" />
                Create Meeting
              </button>
            )}
          </div>
        </div>
      ) : (
        <MeetingTable meetings={meetings} reload={load} highlightMeetingId={highlightMeetingId} />
      )}

      {/* Add Meeting Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div className="flex items-center justify-center min-h-screen px-4 pt-4 pb-20 text-center sm:block sm:p-0">
            {/* Background overlay */}
            <div className="fixed inset-0 transition-opacity bg-black/60" onClick={() => setShowModal(false)}></div>

            {/* Modal panel */}
            <div className="inline-block align-bottom bg-white rounded-2xl text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-4xl sm:w-full" style={{
              position: "relative",
              zIndex: 1000
            }}>
              <form onSubmit={handleSubmit}>
                {/* Modal Header */}
                <div className="bg-gradient-to-r from-blue-600 to-indigo-600 px-6 py-4">
                  <h3 className="text-lg font-semibold text-white">Create New Meeting</h3>
                  <p className="text-blue-100 text-sm mt-1">Fill in the details to schedule a new meeting</p>
                </div>

                {/* Modal Body */}
                <div className="bg-white px-6 py-6">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    {/* Basic Information */}
                    <div className="space-y-4">
                      <h4 className="text-sm font-semibold text-gray-900 flex items-center gap-2 pb-2 border-b border-gray-200">
                        <FileText className="h-4 w-4 text-blue-600" />
                        Basic Information
                      </h4>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1.5">
                          Title *
                        </label>
                        <input
                          type="text"
                          name="title"
                          value={formData.title}
                          onChange={handleInputChange}
                          className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          placeholder="Enter meeting title"
                          required
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1.5">
                          Description
                        </label>
                        <textarea
                          name="description"
                          value={formData.description}
                          onChange={handleInputChange}
                          rows={3}
                          className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          placeholder="Enter meeting description"
                        />
                      </div>

                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1.5">
                            Meeting Type
                          </label>
                          <select
                            name="meeting_type"
                            value={formData.meeting_type}
                            onChange={handleInputChange}
                            className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                          >
                            <option value="internal">Internal</option>
                            <option value="external">External</option>
                          </select>
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1.5">
                            Priority
                          </label>
                          <select
                            name="priority"
                            value={formData.priority}
                            onChange={handleInputChange}
                            className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                          >
                            <option value="Low">Low</option>
                            <option value="Medium">Medium</option>
                            <option value="High">High</option>
                            <option value="Critical">Critical</option>
                          </select>
                        </div>
                      </div>
                    </div>

                    {/* Schedule Information */}
                    <div className="space-y-4">
                      <h4 className="text-sm font-semibold text-gray-900 flex items-center gap-2 pb-2 border-b border-gray-200">
                        <Calendar className="h-4 w-4 text-blue-600" />
                        Schedule
                      </h4>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1.5">
                          Meeting Date *
                        </label>
                        <input
                          type="date"
                          name="meeting_date"
                          value={formData.meeting_date}
                          onChange={handleInputChange}
                          className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                          required
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1.5">
                          Meeting Time
                        </label>
                        <input
                          type="time"
                          name="meeting_time"
                          value={formData.meeting_time}
                          onChange={handleInputChange}
                          className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1.5">
                          Reminder Date
                        </label>
                        <input
                          type="date"
                          name="reminder_date"
                          value={formData.reminder_date}
                          onChange={handleInputChange}
                          className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                      </div>

                      {/* <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1.5">
                          Recurrence
                        </label>
                        <select
                          name="recurrence"
                          value={formData.recurrence}
                          onChange={handleInputChange}
                          className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                        >
                          <option value="None">None</option>
                          <option value="Daily">Daily</option>
                          <option value="Weekly">Weekly</option>
                          <option value="Monthly">Monthly</option>
                        </select>
                      </div> */}
                    </div>

                    {/* Assignment & Status */}
                    <div className="space-y-4">
                      <h4 className="text-sm font-semibold text-gray-900 flex items-center gap-2 pb-2 border-b border-gray-200">
                        <Users className="h-4 w-4 text-blue-600" />
                        Assignment & Status
                      </h4>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1.5">
                          Responsible Person
                        </label>
                        <input
                          type="text"
                          name="responsible_person"
                          value={formData.responsible_person}
                          onChange={handleInputChange}
                          className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                          placeholder="Enter name"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1.5">
                          Status
                        </label>
                        <select
                          name="status"
                          value={formData.status}
                          onChange={handleInputChange}
                          className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                        >
                          <option value="Pending">Pending</option>
                          <option value="In Progress">In Progress</option>
                          <option value="Completed">Completed</option>
                          <option value="Rescheduled">Rescheduled</option>
                        </select>
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1.5">
                          Discussion Topic
                        </label>
                        <input
                          type="text"
                          name="discussion_topic"
                          value={formData.discussion_topic}
                          onChange={handleInputChange}
                          className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                          placeholder="Enter discussion topic"
                        />
                      </div>
                    </div>

                    {/* Additional Details */}
                    {/* <div className="space-y-4">
                      <h4 className="text-sm font-semibold text-gray-900 flex items-center gap-2 pb-2 border-b border-gray-200">
                        <Tag className="h-4 w-4 text-blue-600" />
                        Additional Details
                      </h4>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1.5">
                          Final Outcome
                        </label>
                        <input
                          type="text"
                          name="final_outcome"
                          value={formData.final_outcome}
                          onChange={handleInputChange}
                          className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                          placeholder="Expected outcome"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1.5">
                          Attachment URL
                        </label>
                        <input
                          type="text"
                          name="attachment"
                          value={formData.attachment}
                          onChange={handleInputChange}
                          className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                          placeholder="Link to document"
                        />
                      </div>
                    </div> */}
                  </div>
                </div>

                {/* Modal Footer */}
                <div className="bg-gray-50 px-6 py-4 flex flex-col sm:flex-row gap-3 justify-end">
                  <button
                    type="button"
                    onClick={() => setShowModal(false)}
                    className="inline-flex justify-center items-center gap-2 px-4 py-2 rounded-lg border border-gray-300 bg-white text-gray-700 hover:bg-gray-50 transition-colors text-sm font-medium"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={saving}
                    className="inline-flex justify-center items-center gap-2 px-4 py-2 rounded-lg bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white transition-all duration-200 text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {saving ? (
                      <>
                        <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></div>
                        Creating...
                      </>
                    ) : (
                      <>
                        <Save className="h-4 w-4" />
                        Create Meeting
                      </>
                    )}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}