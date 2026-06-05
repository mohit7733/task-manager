import { useEffect } from "react";
import { Route, Routes, Navigate } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import Sidebar from "./components/Sidebar";
import NotificationDrawer from "./components/NotificationDrawer";
import ProtectedRoute from "./components/ProtectedRoute";
import LoginPage from "./pages/LoginPage";
import DashboardPage from "./pages/DashboardPage";
import MeetingsPage from "./pages/MeetingsPage";
import TasksPage from "./pages/TasksPage";
import CalendarPage from "./pages/CalendarPage";
import { FollowupsPage, ReportsPage, SettingsPage } from "./pages/SimplePages";
import api from "./api/client";
import { setSession, logout, toggleTheme } from "./store/store";

function AppShell() {
  const dark = useSelector((s) => s.ui.darkMode);
  const user = useSelector((s) => s.auth.user);
  const dispatch = useDispatch();

  useEffect(() => {
    document.documentElement.classList.toggle("dark", dark);
  }, [dark]);

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (token && !user) {
      api
        .get("/auth/me")
        .then(({ data }) => dispatch(setSession({ token, user: data })))
        .catch(() => dispatch(logout()));
    }
  }, [user, dispatch]);

  return (
    <div className="flex min-h-screen bg-gradient-to-br from-slate-50 to-indigo-50/30 dark:from-slate-950 dark:to-indigo-950/20">
      <Sidebar />
      <div className="flex min-w-0 flex-1 flex-col">
        <header className="sticky top-0 z-20 flex items-center justify-between border-b border-slate-200/80 bg-white/80 px-6 py-3 backdrop-blur-md dark:border-slate-800 dark:bg-slate-900/80">
          <p className="text-sm text-slate-500 dark:text-slate-400">
            Welcome{user?.name ? `, ${user.name}` : ""}
          </p>
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => dispatch(toggleTheme())}
              className="rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-medium text-slate-600 dark:border-slate-600 dark:text-slate-300"
            >
              {dark ? "Light" : "Dark"}
            </button>
            <NotificationDrawer />
            {user && (
              <span className="hidden rounded-lg bg-slate-100 px-3 py-1.5 text-xs font-medium text-slate-600 dark:bg-slate-800 dark:text-slate-300 sm:inline">
                {user.role}
              </span>
            )}
          </div>
        </header>
        <main className="flex-1 overflow-x-auto p-6">
          <Routes>
            <Route path="/" element={<DashboardPage />} />
            <Route path="/meetings" element={<MeetingsPage />} />
            <Route path="/tasks" element={<TasksPage />} />
            <Route path="/calendar" element={<CalendarPage />} />
            <Route path="/followups" element={<FollowupsPage />} />
            <Route path="/reports" element={<ReportsPage />} />
            <Route path="/settings" element={<SettingsPage />} />
          </Routes>
        </main>
      </div>
    </div>
  );
}

export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route
        path="/*"
        element={
          <ProtectedRoute>
            <AppShell />
          </ProtectedRoute>
        }
      />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
