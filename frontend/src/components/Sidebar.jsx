import { useState } from "react";
import { NavLink, useNavigate } from "react-router-dom";
import { useDispatch } from "react-redux";
import {
  LayoutDashboard,
  ClipboardList,
  ListChecks,
  Calendar,
  GitBranch,
  BarChart3,
  Settings,
  LogOut,
  ChevronLeft,
  PanelLeftOpen,
} from "lucide-react";
import { logout } from "../store/store";
import BrandLogo from "./BrandLogo";
import { brand } from "../utils/theme";

const links = [
  { to: "/", label: "Dashboard", icon: LayoutDashboard },
  { to: "/meetings", label: "Meetings", icon: ClipboardList },
  { to: "/tasks", label: "Dept. Tasks", icon: ListChecks },
  { to: "/calendar", label: "Calendar", icon: Calendar },
  // { to: "/followups", label: "Followups", icon: GitBranch },
  // { to: "/reports", label: "Reports", icon: BarChart3 },
  // { to: "/settings", label: "Settings", icon: Settings },
];

export default function Sidebar() {
  const [isCollapsed, setIsCollapsed] = useState(true);
  const dispatch = useDispatch();
  const navigate = useNavigate();

  const handleLogout = () => {
    dispatch(logout());
    navigate("/login");
  };

  return (
    <aside
      className={`sticky left-0 top-0 z-30 flex h-screen flex-col border-r border-slate-200 bg-white shadow-xl transition-all duration-300 dark:border-slate-800 dark:bg-slate-900 ${
        isCollapsed ? "w-[4.5rem]" : "w-72"
      }`}
    >
      <div className={`relative border-b border-slate-100 p-4 dark:border-slate-800 ${isCollapsed ? "px-2" : ""}`}>
        <BrandLogo collapsed={isCollapsed} />
        <button
          type="button"
          onClick={() => setIsCollapsed(!isCollapsed)}
          className="absolute -right-3 top-7 flex h-6 w-6 items-center justify-center rounded-full border border-slate-200 bg-white shadow-sm hover:bg-slate-50 dark:border-slate-600 dark:bg-slate-800"
          aria-label={isCollapsed ? "Expand sidebar" : "Collapse sidebar"}
        >
          {isCollapsed ? (
            <PanelLeftOpen className="h-3.5 w-3.5 text-slate-600" />
          ) : (
            <ChevronLeft className="h-3.5 w-3.5 text-slate-600" />
          )}
        </button>
      </div>

      <nav className="flex-1 overflow-y-auto px-3 py-5">
        <div className="space-y-1">
          {links.map((link) => {
            const Icon = link.icon;
            return (
              <NavLink
                key={link.to}
                to={link.to}
                end={link.to === "/"}
                title={isCollapsed ? link.label : undefined}
                className={({ isActive }) =>
                  `group flex items-center rounded-xl px-3 py-2.5 text-sm font-medium transition-all ${
                    isActive
                      ? `${brand.gradient} text-white shadow-md shadow-indigo-200/50 dark:shadow-indigo-900/40`
                      : "text-slate-600 hover:bg-slate-50 hover:text-slate-900 dark:text-slate-300 dark:hover:bg-slate-800"
                  } ${isCollapsed ? "justify-center" : "gap-3"}`
                }
              >
                <Icon className="h-[1.15rem] w-[1.15rem] shrink-0" />
                {!isCollapsed && <span>{link.label}</span>}
              </NavLink>
            );
          })}
        </div>
      </nav>

      <div className={`border-t border-slate-100 p-4 dark:border-slate-800 ${isCollapsed ? "px-2" : ""}`}>
        <button
          type="button"
          onClick={handleLogout}
          title={isCollapsed ? "Sign out" : undefined}
          className={`flex w-full items-center justify-center gap-2 rounded-xl px-4 py-2 text-sm font-medium text-red-600 transition hover:bg-red-50 dark:hover:bg-red-950/30 ${
            isCollapsed ? "px-2" : ""
          }`}
        >
          <LogOut className="h-4 w-4" />
          {!isCollapsed && <span>Sign Out</span>}
        </button>
      </div>
    </aside>
  );
}
