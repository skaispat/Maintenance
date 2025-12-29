import React from "react";
import { NavLink, useNavigate } from "react-router-dom";
import {
  LayoutDashboard,
  Wrench,
  ClipboardList,
  LogOut,
  X,
  CheckCircle,
  Settings as SettingsIcon,
  FileText,
  CalendarDays,
} from "lucide-react";
import useAuthStore from "../store/authStore";

interface SidebarProps {
  onClose?: () => void;
}

const Sidebar: React.FC<SidebarProps> = ({ onClose }) => {
  const { user, logout } = useAuthStore();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  return (
    <div className="flex flex-col h-full bg-white border-r border-gray-200">
      {/* Header with Logo */}
      <div className="flex justify-between items-center px-6 py-5 border-b border-gray-200">
        <div className="flex items-center gap-3 flex-1">
          <div className="bg-primary/5 p-1.5 rounded-lg">
            <img src="/Logo.png" alt="MaintenancePro" className="w-6 h-6 object-contain" />
          </div>
          <p className="text-gray-900 font-semibold text-lg tracking-tight">
            Maintenance<span className="text-primary">Pro</span>
          </p>
        </div>
        {onClose && (
          <button
            onClick={() => onClose?.()}
            className="p-2 text-gray-500 rounded-md lg:hidden hover:text-gray-900 hover:bg-gray-100 focus:outline-none transition-colors"
          >
            <span className="sr-only">Close sidebar</span>
            <X className="w-5 h-5" />
          </button>
        )}
      </div>

      {/* Navigation Links */}
      <nav className="overflow-y-auto flex-1 px-3 py-6 space-y-1">
        {/* Dashboard */}
        {(user?.pageAccess === "Admin" || user?.allowedPages?.includes("Dashboard")) && (
          <NavLink
            to="/dashboard"
            className={({ isActive }) =>
              `flex items-center gap-3 py-2.5 px-3 rounded-lg transition-all duration-200 group ${isActive
                ? "bg-primary text-white shadow-sm"
                : "text-gray-700 hover:bg-primary/5 hover:text-primary-dark"
              }`
            }
            onClick={onClose}
          >
            <LayoutDashboard size={20} className="flex-shrink-0" />
            <span className="text-sm font-medium">Dashboard</span>
          </NavLink>
        )}

        {/* Machines */}
        {(user?.pageAccess === "Admin" || user?.allowedPages?.includes("Machines")) && (
          <NavLink
            to="/machines"
            className={({ isActive }) =>
              `flex items-center gap-3 py-2.5 px-3 rounded-lg transition-all duration-200 group ${isActive
                ? "bg-primary text-white shadow-sm"
                : "text-gray-700 hover:bg-primary/5 hover:text-primary-dark"
              }`
            }
            onClick={() => onClose?.()}
          >
            <Wrench size={20} className="flex-shrink-0" />
            <span className="text-sm font-medium">Machines</span>
          </NavLink>
        )}

        {/* Assign Task */}
        {(user?.pageAccess === "Admin" || user?.allowedPages?.includes("Assign Task")) && (
          <NavLink
            to="/assign-task"
            className={({ isActive }) =>
              `flex items-center gap-3 py-2.5 px-3 rounded-lg transition-all duration-200 group ${isActive
                ? "bg-primary text-white shadow-sm"
                : "text-gray-700 hover:bg-primary/5 hover:text-primary-dark"
              }`
            }
            onClick={() => onClose?.()}
          >
            <ClipboardList size={20} className="flex-shrink-0" />
            <span className="text-sm font-medium">Assign Task</span>
          </NavLink>
        )}

        {/* Tasks */}
        {(user?.pageAccess === "Admin" || user?.allowedPages?.includes("Tasks")) && (
          <NavLink
            to="/tasks"
            className={({ isActive }) =>
              `flex items-center gap-3 py-2.5 px-3 rounded-lg transition-all duration-200 group ${isActive
                ? "bg-primary text-white shadow-sm"
                : "text-gray-700 hover:bg-primary/5 hover:text-primary-dark"
              }`
            }
            onClick={onClose}
          >
            <ClipboardList size={20} className="flex-shrink-0" />
            <span className="text-sm font-medium">Tasks</span>
          </NavLink>
        )}

        {/* Admin Approval */}
        {(user?.pageAccess === "Admin" || user?.allowedPages?.includes("Admin Approval")) && (
          <NavLink
            to="/admin-approval"
            className={({ isActive }) =>
              `flex items-center gap-3 py-2.5 px-3 rounded-lg transition-all duration-200 group ${isActive
                ? "bg-primary text-white shadow-sm"
                : "text-gray-700 hover:bg-primary/5 hover:text-primary-dark"
              }`
            }
            onClick={() => onClose?.()}
          >
            <CheckCircle size={20} className="flex-shrink-0" />
            <span className="text-sm font-medium">Admin Approval</span>
          </NavLink>
        )}

        {/* Daily Report */}
        {(user?.pageAccess === "Admin" || user?.allowedPages?.includes("Daily Report")) && (
          <NavLink
            to="/daily-report"
            className={({ isActive }) =>
              `flex items-center gap-3 py-2.5 px-3 rounded-lg transition-all duration-200 group ${isActive
                ? "bg-primary text-white shadow-sm"
                : "text-gray-700 hover:bg-primary/5 hover:text-primary-dark"
              }`
            }
            onClick={onClose}
          >
            <FileText size={20} className="flex-shrink-0" />
            <span className="text-sm font-medium">Daily Report</span>
          </NavLink>
        )}

        {/* Calendar */}
        {(user?.pageAccess === "Admin" || user?.allowedPages?.includes("Calendar")) && (
          <NavLink
            to="/calendar"
            className={({ isActive }) =>
              `flex items-center gap-3 py-2.5 px-3 rounded-lg transition-all duration-200 group ${isActive
                ? "bg-primary text-white shadow-sm"
                : "text-gray-700 hover:bg-primary/5 hover:text-primary-dark"
              }`
            }
            onClick={onClose}
          >
            <CalendarDays size={20} className="flex-shrink-0" />
            <span className="text-sm font-medium">Calendar</span>
          </NavLink>
        )}
        {/* Settings */}
        <NavLink
          to="/settings"
          className={({ isActive }) =>
            `flex items-center gap-3 py-2.5 px-3 rounded-lg transition-all duration-200 group ${isActive
              ? "bg-primary text-white shadow-sm"
              : "text-gray-700 hover:bg-primary/5 hover:text-primary-dark"
            }`
          }
          onClick={() => onClose?.()}
        >
          <SettingsIcon size={20} className="flex-shrink-0" />
          <span className="text-sm font-medium">Settings</span>
        </NavLink>
      </nav>

      {/* Logout Button */}
      <div className="p-4 border-t border-gray-200">
        <button
          onClick={() => {
            handleLogout();
            onClose?.();
          }}
          className="flex items-center gap-3 py-2.5 px-3 rounded-lg text-gray-700 hover:bg-primary/5 hover:text-primary-dark transition-all duration-200 w-full group"
        >
          <LogOut size={20} className="flex-shrink-0" />
          <span className="text-sm font-medium">Logout</span>
        </button>
      </div>
    </div>
  );
};

export default Sidebar;