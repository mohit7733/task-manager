import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import {
  Calendar,
  Clock,
  AlertCircle,
  CheckCircle2,
  MessageSquare,
  TrendingUp,
  Users,
  FileText,
  ListChecks,
} from "lucide-react";
import api from "../api/client";

export default function DashboardPage() {
  const [data, setData] = useState({});
  const [loading, setLoading] = useState(true);

  const load = () => {
    api
      .get("/dashboard")
      .then((res) => setData(res.data))
      .catch(() => {})
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    load();
    const timer = setInterval(load, 60000);
    return () => clearInterval(timer);
  }, []);

  const stats = [
    {
      label: "Pending Meetings",
      value: data.pending || 0,
      icon: Clock,
      color: "text-amber-600",
      bgColor: "bg-amber-50",
      trend: "+12%",
    },
    {
      label: "Upcoming Followups",
      value: data.upcoming || 0,
      icon: Calendar,
      color: "text-blue-600",
      bgColor: "bg-blue-50",
      trend: "+8%",
    },
    {
      label: "Today's Meetings",
      value: data.today || 0,
      icon: Users,
      color: "text-emerald-600",
      bgColor: "bg-emerald-50",
      trend: "Today",
    },
    {
      label: "Overdue Items",
      value: data.overdue || 0,
      icon: AlertCircle,
      color: "text-red-600",
      bgColor: "bg-red-50",
      trend: data.overdue > 0 ? "Urgent" : "All good",
    },
  ];

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-4 border-gray-300 border-t-blue-600"></div>
          <p className="mt-4 text-gray-500">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
          <p className="text-gray-500 mt-1">
            Welcome back! Here's what's happening with your meetings today.
          </p>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {stats.map((stat) => {
            const Icon = stat.icon;
            return (
              <div
                key={stat.label}
                className="bg-white rounded-2xl shadow-sm hover:shadow-md transition-shadow duration-200 border border-gray-100"
              >
                <div className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-500">
                        {stat.label}
                      </p>
                      <p className="text-3xl font-bold text-gray-900 mt-2">
                        {stat.value}
                      </p>
                      <p
                        className={`text-xs mt-2 ${stat.trend === "Today" || stat.trend === "All good"
                            ? "text-green-600"
                            : stat.trend === "Urgent"
                              ? "text-red-600"
                              : "text-blue-600"
                          }`}
                      >
                        {stat.trend}
                      </p>
                    </div>
                    <div
                      className={`rounded-xl p-3 ${stat.bgColor} ${stat.color}`}
                    >
                      <Icon className="h-6 w-6" />
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {(data.tasksOpen > 0 || data.tasksDone > 0) && (
          <div className="mb-8 grid grid-cols-1 gap-4 sm:grid-cols-3">
            <div className="rounded-2xl border border-indigo-100 bg-white p-5 shadow-sm dark:border-indigo-900 dark:bg-gray-900">
              <p className="text-sm text-gray-500">Open dept. tasks</p>
              <p className="mt-1 text-2xl font-bold text-indigo-700">{data.tasksOpen || 0}</p>
            </div>
            <div className="rounded-2xl border border-emerald-100 bg-white p-5 shadow-sm dark:border-emerald-900 dark:bg-gray-900">
              <p className="text-sm text-gray-500">Tasks completed</p>
              <p className="mt-1 text-2xl font-bold text-emerald-700">{data.tasksDone || 0}</p>
            </div>
            <div className="rounded-2xl border border-red-100 bg-white p-5 shadow-sm dark:border-red-900 dark:bg-gray-900">
              <p className="text-sm text-gray-500">Overdue task reviews</p>
              <p className="mt-1 text-2xl font-bold text-red-600">{data.tasksOverdue || 0}</p>
            </div>
            <Link
              to="/tasks"
              className="sm:col-span-3 inline-flex items-center justify-center gap-2 rounded-xl bg-indigo-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-indigo-500"
            >
              <ListChecks className="h-4 w-4" />
              Open Department Tasks
            </Link>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Recent Remarks Section */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100">
              <div className="px-6 py-4 border-b border-gray-100">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <MessageSquare className="h-5 w-5 text-blue-600" />
                    <h3 className="font-semibold text-gray-900">
                      Recent Remarks
                    </h3>
                  </div>
                  <span className="text-xs text-gray-400">
                    Last 7 days
                  </span>
                </div>
              </div>

              <div className="divide-y divide-gray-100">
                {(data.recentRemarks || []).length > 0 ? (
                  (data.recentRemarks || []).map((remark, idx) => (
                    <div
                      key={remark._id || idx}
                      className="p-4 hover:bg-gray-50 transition-colors duration-150"
                    >
                      <div className="flex items-start gap-3">
                        <div className="flex-shrink-0">
                          <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center">
                            <FileText className="h-4 w-4 text-blue-600" />
                          </div>
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm text-gray-700">
                            {remark.remark_description}
                          </p>
                          {remark.createdAt && (
                            <p className="text-xs text-gray-400 mt-1">
                              {new Date(remark.createdAt).toLocaleDateString(
                                "en-US",
                                {
                                  month: "short",
                                  day: "numeric",
                                  hour: "2-digit",
                                  minute: "2-digit",
                                }
                              )}
                            </p>
                          )}
                        </div>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="p-8 text-center">
                    <MessageSquare className="h-10 w-10 text-gray-300 mx-auto mb-3" />
                    <p className="text-gray-400">No remarks yet</p>
                    <p className="text-sm text-gray-400 mt-1">
                      Recent meeting remarks will appear here
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Quick Actions / Upcoming Schedule */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100">
              <div className="px-6 py-4 border-b border-gray-100">
                <div className="flex items-center gap-3">
                  <TrendingUp className="h-5 w-5 text-emerald-600" />
                  <h3 className="font-semibold text-gray-900">
                    Quick Overview
                  </h3>
                </div>
              </div>

              <div className="p-6 space-y-4">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">Completion Rate</span>
                  <span className="text-sm font-semibold text-gray-900">
                    {data.completionRate || 78}%
                  </span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div
                    className="bg-emerald-500 h-2 rounded-full transition-all duration-500"
                    style={{ width: `${data.completionRate || 78}%` }}
                  ></div>
                </div>

                <div className="pt-2">
                  <div className="flex justify-between text-sm mb-2">
                    <span className="text-gray-600">Total Meetings</span>
                    <span className="font-semibold text-gray-900">
                      {data.totalMeetings || 0}
                    </span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Active Clients</span>
                    <span className="font-semibold text-gray-900">
                      {data.activeClients || 0}
                    </span>
                  </div>
                </div>

                <button className="w-full mt-4 bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded-xl transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2">
                  + Schedule New Meeting
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}