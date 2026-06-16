import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import {
  LayoutDashboard,
  Calendar,
  Clock,
  AlertCircle,
  CheckCircle2,
  MessageSquare,
  FileText,
  ListChecks,
} from "lucide-react";
import api from "../api/client";
import PageHeader from "../components/PageHeader";
import LoadingSpinner from "../components/LoadingSpinner";
import EmptyState from "../components/EmptyState";
import { brand } from "../utils/theme";

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
    { label: "Pending Meetings", value: data.pending || 0, icon: Clock, color: "text-amber-600", bg: "bg-amber-50 dark:bg-amber-950/40" },
    { label: "Upcoming Followups", value: data.upcoming || 0, icon: Calendar, color: "text-indigo-600", bg: "bg-indigo-50 dark:bg-indigo-950/40" },
    { label: "Today's Meetings", value: data.today || 0, icon: CheckCircle2, color: "text-emerald-600", bg: "bg-emerald-50 dark:bg-emerald-950/40" },
    { label: "Overdue Items", value: data.overdue || 0, icon: AlertCircle, color: "text-red-600", bg: "bg-red-50 dark:bg-red-950/40" },
  ];

  if (loading) {
    return <LoadingSpinner className="min-h-[60vh]" />;
  }

  const completionRate = data.completionRate ?? 0;

  return (
    <div className="space-y-6">
      <PageHeader
        title="Dashboard"
        subtitle="Overview of meetings, tasks, and recent activity."
        icon={LayoutDashboard}
      />

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat) => {
          const Icon = stat.icon;
          return (
            <div key={stat.label} className={brand.statCard}>
              <div className="flex items-center justify-between p-5">
                <div>
                  <p className="text-sm font-medium text-slate-500 dark:text-slate-400">{stat.label}</p>
                  <p className="mt-1 text-3xl font-bold text-slate-900 dark:text-white">{stat.value}</p>
                </div>
                <div className={`rounded-xl p-3 ${stat.bg} ${stat.color}`}>
                  <Icon className="h-6 w-6" />
                </div>
              </div>
            </div>
          );
        })}
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <div className={brand.statCard}>
          <div className="p-5">
            <p className="text-sm text-slate-500">Open dept. tasks</p>
            <p className="mt-1 text-2xl font-bold text-indigo-600">{data.tasksOpen || 0}</p>
          </div>
        </div>
        <div className={brand.statCard}>
          <div className="p-5">
            <p className="text-sm text-slate-500">Tasks completed</p>
            <p className="mt-1 text-2xl font-bold text-emerald-600">{data.tasksDone || 0}</p>
          </div>
        </div>
        <div className={brand.statCard}>
          <div className="p-5">
            <p className="text-sm text-slate-500">Overdue task reviews</p>
            <p className="mt-1 text-2xl font-bold text-red-600">{data.tasksOverdue || 0}</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className={`lg:col-span-2 ${brand.card}`}>
          <div className={brand.cardHeader}>
            <div className="flex items-center gap-2">
              <MessageSquare className={`h-5 w-5 ${brand.text}`} />
              <h3 className="font-semibold text-slate-900 dark:text-white">Recent Remarks</h3>
            </div>
          </div>
          <div className="divide-y divide-slate-100 dark:divide-slate-800">
            {(data.recentRemarks || []).length > 0 ? (
              (data.recentRemarks || []).map((remark) => (
                <div key={remark._id} className="flex gap-3 p-4 hover:bg-slate-50 dark:hover:bg-slate-800/50">
                  <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-indigo-100 dark:bg-indigo-950">
                    <FileText className={`h-4 w-4 ${brand.text}`} />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm text-slate-700 dark:text-slate-200">{remark.remark_description}</p>
                    {remark.createdAt && (
                      <p className="mt-1 text-xs text-slate-400">
                        {new Date(remark.createdAt).toLocaleString("en-IN", {
                          month: "short",
                          day: "numeric",
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </p>
                    )}
                  </div>
                </div>
              ))
            ) : (
              <EmptyState bare compact icon={FileText} title="No remarks yet" />
            )}
          </div>
        </div>

        <div className={brand.card}>
          <div className={brand.cardHeader}>
            <h3 className="font-semibold text-slate-900 dark:text-white">Quick Overview</h3>
          </div>
          <div className="space-y-4 p-6">
            <div className="flex justify-between text-sm">
              <span className="text-slate-500">Completion rate</span>
              <span className="font-semibold text-slate-900 dark:text-white">{completionRate}%</span>
            </div>
            <div className="h-2 w-full rounded-full bg-slate-200 dark:bg-slate-700">
              <div
                className="h-2 rounded-full bg-emerald-500 transition-all"
                style={{ width: `${Math.min(100, completionRate)}%` }}
              />
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-slate-500">Total meetings</span>
              <span className="font-semibold">{data.totalMeetings || 0}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-slate-500">Open tasks</span>
              <span className="font-semibold">{data.tasksOpen || 0}</span>
            </div>
            <Link
              to="/meetings"
              className={`block w-full text-white rounded-xl py-2.5 text-center text-sm font-semibold ${brand.gradient} ${brand.gradientHover}`}
            >
              + Schedule New Meeting
            </Link>
            <Link
              to="/tasks"
              className={`block w-full rounded-xl border py-2.5 text-center text-sm font-semibold ${brand.btnSecondary}`}
            >
              <span className="inline-flex items-center gap-2">
                <ListChecks className="h-4 w-4" />
                Department Tasks
              </span>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
