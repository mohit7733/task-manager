import { useState } from "react";
import { NavLink, useNavigate } from "react-router-dom";
import { useDispatch } from "react-redux";
import { logout } from "../store/store";
import DashboardIcon from "@mui/icons-material/Dashboard";
import TableChartIcon from "@mui/icons-material/TableChart";
import AssignmentIcon from "@mui/icons-material/Assignment";
import CalendarMonthIcon from "@mui/icons-material/CalendarMonth";
import TimelineIcon from "@mui/icons-material/Timeline";
import SummarizeIcon from "@mui/icons-material/Summarize";
import SettingsIcon from "@mui/icons-material/Settings";
import LogoutIcon from "@mui/icons-material/Logout";
import KeyboardArrowRightIcon from "@mui/icons-material/KeyboardArrowRight";
import ChevronLeftIcon from "@mui/icons-material/ChevronLeft";
import MenuOpenIcon from "@mui/icons-material/MenuOpen";
import MenuIcon from "@mui/icons-material/Menu";

const links = [
  { to: "/", label: "Dashboard", icon: <DashboardIcon /> },
  { to: "/meetings", label: "Meetings", icon: <TableChartIcon /> },
  { to: "/tasks", label: "Dept. Tasks", icon: <AssignmentIcon /> },
  { to: "/calendar", label: "Calendar", icon: <CalendarMonthIcon /> },
  { to: "/followups", label: "Followups", icon: <TimelineIcon /> },
  { to: "/reports", label: "Reports", icon: <SummarizeIcon /> },
  { to: "/settings", label: "Settings", icon: <SettingsIcon /> },
];

export default function Sidebar() {
  const [isCollapsed, setIsCollapsed] = useState(true);
  const dispatch = useDispatch();
  const navigate = useNavigate();

  const handleLogout = () => {
    dispatch(logout());
    navigate("/login");
  };

  const toggleSidebar = () => {
    setIsCollapsed(!isCollapsed);
  };

  return (
    <aside
      className={`sticky left-0 top-0 z-30 flex h-screen flex-col bg-white shadow-xl transition-all duration-300 ease-in-out dark:bg-gray-900 dark:border-r dark:border-gray-800 ${isCollapsed ? "w-20" : "w-72"}`}
    >
      {/* Logo/Brand Section */}
      <div className={`p-4 border-b border-gray-100 relative ${isCollapsed ? "px-2" : ""}`}>
        <div className={`flex items-center ${isCollapsed ? "justify-center" : "gap-3"}`}>
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-600 to-indigo-600 flex items-center justify-center shadow-lg shadow-blue-200 flex-shrink-0">
            <span className="text-white font-bold text-xl">PA</span>
          </div>
          {!isCollapsed && (
            <div className="transition-opacity duration-200">
              <h1 className="text-lg font-bold text-gray-800 dark:text-white">Manager</h1>
              <p className="text-xs text-gray-500">Executive Dashboard</p>
            </div>
          )}
        </div>

        {/* Toggle Button */}
        <button
          onClick={toggleSidebar}
          className={`absolute -right-3 top-6 w-6 h-6 bg-white border border-gray-200 rounded-full flex items-center justify-center hover:bg-gray-50 shadow-sm transition-all duration-200 ${isCollapsed ? "rotate-180" : ""
            }`}
        >
          {isCollapsed ? (
            <MenuOpenIcon className="h-3.5 w-3.5 text-gray-600" />
          ) : (
            <ChevronLeftIcon className="h-3.5 w-3.5 text-gray-600" />
          )}
        </button>
      </div>

      {/* Navigation Links */}
      <nav className="flex-1 px-3 py-6 overflow-y-auto">
        <div className="space-y-1.5">
          {links.map((link) => (
            <NavLink
              key={link.to}
              to={link.to}
              end={link.to === "/"}
              className={({ isActive }) =>
                `group flex items-center justify-between rounded-xl px-3 py-2.5 text-sm font-medium transition-all duration-200 ${isActive
                  ? "bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-md shadow-blue-200"
                  : "text-gray-700 hover:bg-gray-50 hover:text-gray-900"
                } ${isCollapsed ? "justify-center" : ""}`
              }
              title={isCollapsed ? link.label : ""}
            >
              {({ isActive }) => (
                <>
                  <div className={`flex items-center gap-3 ${isCollapsed ? "justify-center" : ""}`}>
                    <span
                      className={`${isActive ? "text-white" : "text-gray-500 group-hover:text-gray-700"
                        } transition-colors flex-shrink-0`}
                    >
                      {link.icon}
                    </span>
                    {!isCollapsed && (
                      <span className="transition-opacity duration-200">{link.label}</span>
                    )}
                  </div>
                  {!isCollapsed && isActive && (
                    <KeyboardArrowRightIcon className="h-4 w-4" />
                  )}
                </>
              )}
            </NavLink>
          ))}
        </div>

        {/* Divider */}
        <div className="my-6 border-t border-gray-100" />

        {/* Quick Actions Section */}
        {/* {!isCollapsed && (
          <div className="space-y-1.5">
            <div className="px-3 py-2">
              <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider">
                Quick Actions
              </p>
            </div>

            <button className="w-full flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm text-gray-700 hover:bg-gray-50 transition-colors">
              <div className="w-6 h-6 rounded-lg bg-emerald-100 flex items-center justify-center flex-shrink-0">
                <span className="text-emerald-600 text-xs font-bold">+</span>
              </div>
              <span>New Meeting</span>
            </button>

            <button className="w-full flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm text-gray-700 hover:bg-gray-50 transition-colors">
              <div className="w-6 h-6 rounded-lg bg-purple-100 flex items-center justify-center flex-shrink-0">
                <span className="text-purple-600 text-xs">📋</span>
              </div>
              <span>Quick Report</span>
            </button>
          </div>
        )} */}

        {/* Collapsed Quick Actions - Icons Only */}
        {isCollapsed && (
          <div className="space-y-2">
            <button
              className="w-full flex justify-center rounded-xl p-2 text-gray-700 hover:bg-gray-50 transition-colors"
              title="New Meeting"
            >
              <div className="w-8 h-8 rounded-lg bg-emerald-100 flex items-center justify-center">
                <span className="text-emerald-600 text-sm font-bold">+</span>
              </div>
            </button>
            <button
              className="w-full flex justify-center rounded-xl p-2 text-gray-700 hover:bg-gray-50 transition-colors"
              title="Quick Report"
            >
              <div className="w-8 h-8 rounded-lg bg-purple-100 flex items-center justify-center">
                <span className="text-purple-600 text-sm">📋</span>
              </div>
            </button>
          </div>
        )}
      </nav>

      {/* Footer - User Section */}
      <div className={`p-4 border-t border-gray-100 ${isCollapsed ? "px-2" : ""}`}>
        {/* User Info - Hidden when collapsed */}
        {/* {!isCollapsed && (
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-gray-200 to-gray-300 flex items-center justify-center flex-shrink-0">
              <span className="text-gray-600 font-semibold text-sm">JD</span>
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-gray-800 truncate">John Doe</p>
              <p className="text-xs text-gray-500 truncate">john.doe@company.com</p>
            </div>
            <button className="p-1.5 hover:bg-gray-100 rounded-lg transition-colors flex-shrink-0">
              <SettingsIcon className="h-4 w-4 text-gray-500" />
            </button>
          </div>
        )} */}

        {/* User Avatar Only - When collapsed */}
        {isCollapsed && (
          <div className="flex justify-center mb-3">
            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-gray-200 to-gray-300 flex items-center justify-center">
              <span className="text-gray-600 font-semibold text-sm">JD</span>
            </div>
          </div>
        )}

        {/* Sign Out Button */}
        <button
          onClick={handleLogout}
          className={`w-full flex items-center justify-center gap-2 rounded-xl px-4 py-2 text-sm font-medium text-red-600 hover:bg-red-50 transition-all duration-200 ${isCollapsed ? "px-2" : ""
            }`}
          title={isCollapsed ? "Sign Out" : ""}
        >
          <LogoutIcon className="h-4 w-4" />
          {!isCollapsed && <span>Sign Out</span>}
        </button>
      </div>
    </aside>
  );
}