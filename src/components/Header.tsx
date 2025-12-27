import React, { useState, useRef, useEffect } from "react";
import { Bell, User, LogOut, Settings, ClipboardList, CheckCircle, UserPlus, Monitor, Wrench, X, Pin, ArrowRight, ChevronDown, ChevronUp } from "lucide-react";
import useAuthStore from "../store/authStore";
import { useNavigate } from "react-router-dom";
import { fetchNotifications, Notification, fetchUserAssignedTask, AssignedTask, fetchUserAssignedNotifications } from "../services/notificationService";

interface HeaderProps {
  children?: React.ReactNode;
}

const Header: React.FC<HeaderProps> = ({ children }) => {
  const { user, logout, refreshUser } = useAuthStore();
  const navigate = useNavigate();
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [assignedTasks, setAssignedTasks] = useState<AssignedTask[]>([]);
  const [showPreviousNotifications, setShowPreviousNotifications] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const notificationRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    refreshUser();
  }, [refreshUser]);

  useEffect(() => {
    const loadNotifications = async () => {
      let data: Notification[] = [];

      if (user?.pageAccess === 'Admin') {
        data = await fetchNotifications();
      } else if (user?.employeeName) {
        data = await fetchUserAssignedNotifications(user.employeeName);
      }

      setNotifications(data);

      setNotifications(data);
      if (user?.employeeName) {
        const tasks = await fetchUserAssignedTask(user.employeeName);
        setAssignedTasks(tasks || []);
      }
    };

    loadNotifications();

    // Poll for notifications every minute test
    const interval = setInterval(loadNotifications, 60000);
    return () => clearInterval(interval);
  }, [user]);

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  // Close dropdowns when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsDropdownOpen(false);
      }
      if (notificationRef.current && !notificationRef.current.contains(event.target as Node)) {
        setIsNotificationsOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  const getNotificationIcon = (type: Notification['type']) => {
    switch (type) {
      case 'task_assigned': return <ClipboardList size={16} className="text-blue-500" />;
      case 'task_completed': return <CheckCircle size={16} className="text-green-500" />;
      case 'repair_request': return <Wrench size={16} className="text-orange-500" />;
      case 'user_created': return <UserPlus size={16} className="text-purple-500" />;
      case 'machine_added': return <Monitor size={16} className="text-indigo-500" />;
      default: return <Bell size={16} className="text-gray-500" />;
    }
  };

  const formatTime = (timestamp: string) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diff = now.getTime() - date.getTime();

    if (diff < 60000) return 'Just now';
    if (diff < 3600000) return `${Math.floor(diff / 60000)}m ago`;
    if (diff < 86400000) return `${Math.floor(diff / 3600000)}h ago`;
    return date.toLocaleDateString('en-GB');
  };

  const isSameDay = (d1: Date, d2: Date) => {
    return d1.getDate() === d2.getDate() &&
      d1.getMonth() === d2.getMonth() &&
      d1.getFullYear() === d2.getFullYear();
  };

  return (
    <header className="bg-white border-b border-gray-200 shadow-sm relative z-20">
      <div className="flex justify-between items-center px-4 py-3 sm:px-6">
        <div className="flex items-center gap-4">
          {children}
          <h1 className="text-xl font-light text-gray-900 tracking-tight">
            Maintenance<span className="font-bold text-primary">Pro</span>
          </h1>
        </div>
        <div className="flex items-center space-x-4">

          {/* Notifications */}
          <div className="hidden" ref={notificationRef}>
            <div
              className="relative cursor-pointer p-2 hover:bg-gray-50 rounded-full transition-colors"
              onClick={() => setIsNotificationsOpen(!isNotificationsOpen)}
            >
              <Bell
                size={20}
                className={`transition-colors ${isNotificationsOpen ? 'text-primary' : 'text-gray-500 hover:text-primary'}`}
              />
              {notifications.length > 0 && (
                <span className="absolute top-1.5 right-1.5 w-2.5 h-2.5 bg-red-500 border-2 border-white rounded-full"></span>
              )}
            </div>

            {isNotificationsOpen && (
              <div className="fixed inset-x-4 top-[4.5rem] sm:absolute sm:inset-auto sm:right-0 sm:top-full sm:mt-2 sm:w-96 bg-white rounded-xl shadow-2xl border border-gray-100 overflow-hidden animate-in fade-in zoom-in-95 duration-200 origin-top-right z-50">
                <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100 bg-gray-50/50">
                  <h3 className="font-semibold text-gray-900">Notifications</h3>
                  <button
                    onClick={() => setIsNotificationsOpen(false)}
                    className="text-gray-400 hover:text-gray-600"
                  >
                    <X size={16} />
                  </button>
                </div>

                {/* Pinned Assigned Tasks */}
                {assignedTasks.length > 0 && (
                  <div className="bg-gradient-to-r from-primary/5 to-transparent border-b border-primary/10 max-h-[300px] overflow-y-auto">
                    <div className="px-4 py-2 border-b border-primary/5 bg-white/50 sticky top-0 backdrop-blur-sm z-10">
                      <h4 className="text-xs font-semibold text-primary uppercase tracking-wider flex items-center gap-1">
                        <Pin size={12} className="fill-current" />
                        Today's Tasks ({assignedTasks.length})
                      </h4>
                    </div>

                    {assignedTasks.map((task) => (
                      <div key={task.id} className="px-4 py-3 border-b border-primary/5 last:border-0 hover:bg-white/50 transition-colors">
                        <div className="flex items-start gap-3">
                          <div className="mt-0.5 p-1.5 bg-white rounded-full shadow-sm border border-primary/10 text-primary flex-shrink-0">
                            <Monitor size={14} />
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center justify-between mb-1">
                              <h4 className="text-sm font-medium text-gray-900">
                                {task.title}
                              </h4>
                              {task.dueDate && (
                                <span className="text-[10px] text-gray-500 bg-white px-1.5 py-0.5 rounded-full border border-gray-100 flex-shrink-0">
                                  Task Date: {new Date(task.dueDate).toLocaleDateString('en-GB')}
                                </span>
                              )}
                            </div>

                            <p className="text-xs text-gray-600 mt-0.5">
                              {task.description}
                            </p>
                            {task.workDescription && (
                              <p className="text-xs text-gray-500 mt-0.5 italic border-l-2 border-primary/20 pl-2">
                                "{task.workDescription}"
                              </p>
                            )}

                            <button
                              onClick={() => {
                                navigate(task.link);
                                setIsNotificationsOpen(false);
                              }}
                              className="mt-2 text-xs font-medium text-primary hover:text-primary-dark flex items-center gap-1 transition-colors group"
                            >
                              View Details
                              <ArrowRight size={12} className="group-hover:translate-x-0.5 transition-transform" />
                            </button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                <div className="max-h-[400px] overflow-y-auto">
                  {notifications.length > 0 ? (
                    <div className="divide-y divide-gray-50">
                      {/* Current Notifications (Today) */}
                      {notifications.filter(n => {
                        // Create date from YYYY-MM-DD string as local time if dueDate exists
                        // Otherwise use timestamp (which is ISO/UTC but we want local day comparison)
                        let dateToCheck;
                        if (n.dueDate) {
                          const [y, m, d] = n.dueDate.split('-').map(Number);
                          dateToCheck = new Date(y, m - 1, d);
                        } else {
                          dateToCheck = new Date(n.timestamp);
                        }
                        const today = new Date();
                        return isSameDay(dateToCheck, today);
                      }).map((notification) => (
                        <div
                          key={notification.id}
                          className="px-4 py-3 hover:bg-gray-50 transition-colors cursor-pointer group bg-blue-50/30"
                          onClick={() => {
                            if (notification.link) {
                              navigate(notification.link);
                              setIsNotificationsOpen(false);
                            }
                          }}
                        >
                          <div className="flex gap-3">
                            <div className="mt-1 flex-shrink-0 w-8 h-8 bg-white rounded-full flex items-center justify-center border border-gray-100 group-hover:border-gray-200 transition-colors shadow-sm">
                              {getNotificationIcon(notification.type)}
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="flex justify-between items-start gap-2">
                                <p className="text-sm font-medium text-gray-900">
                                  {notification.title}
                                </p>
                                <span className="text-[10px] font-bold text-blue-600 bg-blue-100 px-1.5 py-0.5 rounded-full uppercase tracking-wider">
                                  New
                                </span>
                              </div>
                              <p className="text-xs text-gray-500 mt-0.5">
                                {notification.description}
                              </p>
                              {notification.workDescription && (
                                <p className="text-xs text-gray-400 mt-0.5 italic pl-1">
                                  {notification.workDescription}
                                </p>
                              )}
                              {notification.assignedTo && (
                                <p className="text-[10px] text-gray-500 mt-1 flex items-center gap-1">
                                  <User size={10} />
                                  Assigned to: <span className="font-medium text-gray-700">{notification.assignedTo}</span>
                                </p>
                              )}
                              <div className="flex items-center gap-2 mt-1.5">
                                <p className="text-[10px] text-gray-400">
                                  {formatTime(notification.timestamp)}
                                </p>
                                {notification.dueDate && (
                                  <span className="text-[10px] text-primary bg-primary/5 px-1.5 rounded border border-primary/10">
                                    Due: {new Date(notification.dueDate).toLocaleDateString()}
                                  </span>
                                )}
                              </div>
                            </div>
                          </div>
                        </div>
                      ))}

                      {/* Previous Notifications Toggle */}
                      {notifications.some(n => {
                        let dateToCheck;
                        if (n.dueDate) {
                          const [y, m, d] = n.dueDate.split('-').map(Number);
                          dateToCheck = new Date(y, m - 1, d);
                        } else {
                          dateToCheck = new Date(n.timestamp);
                        }
                        return !isSameDay(dateToCheck, new Date());
                      }) && (
                          <div
                            onClick={() => setShowPreviousNotifications(!showPreviousNotifications)}
                            className="px-4 py-2 bg-gray-50 flex items-center justify-between cursor-pointer hover:bg-gray-100 transition-colors"
                          >
                            <span className="text-xs font-medium text-gray-500">Previous Notifications</span>
                            {showPreviousNotifications ? <ChevronUp size={14} className="text-gray-400" /> : <ChevronDown size={14} className="text-gray-400" />}
                          </div>
                        )}

                      {/* Previous Notifications List */}
                      {showPreviousNotifications && notifications.filter(n => {
                        let dateToCheck;
                        if (n.dueDate) {
                          const [y, m, d] = n.dueDate.split('-').map(Number);
                          dateToCheck = new Date(y, m - 1, d);
                        } else {
                          dateToCheck = new Date(n.timestamp);
                        }
                        return !isSameDay(dateToCheck, new Date());
                      }).map((notification) => (
                        <div
                          key={notification.id}
                          className="px-4 py-3 hover:bg-gray-50 transition-colors cursor-pointer group opacity-75 hover:opacity-100"
                          onClick={() => {
                            if (notification.link) {
                              navigate(notification.link);
                              setIsNotificationsOpen(false);
                            }
                          }}
                        >
                          <div className="flex gap-3">
                            <div className="mt-1 flex-shrink-0 w-8 h-8 bg-gray-50 rounded-full flex items-center justify-center border border-gray-100 group-hover:border-gray-200 transition-colors">
                              {getNotificationIcon(notification.type)}
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="flex justify-between items-start gap-2">
                                <p className="text-sm font-medium text-gray-900">
                                  {notification.title}
                                </p>
                                {notification.priority && (
                                  <span className={`flex-shrink-0 text-[10px] px-1.5 py-0.5 rounded-full uppercase font-bold tracking-wider ${notification.priority === 'critical' ? 'bg-red-100 text-red-700' :
                                    notification.priority === 'high' ? 'bg-orange-100 text-orange-700' :
                                      'bg-blue-100 text-blue-700'
                                    }`}>
                                    {notification.priority}
                                  </span>
                                )}
                              </div>
                              <p className="text-xs text-gray-500 mt-0.5">
                                {notification.description}
                              </p>
                              {notification.assignedTo && (
                                <p className="text-[10px] text-gray-500 mt-1 flex items-center gap-1">
                                  <User size={10} />
                                  Assigned to: <span className="font-medium text-gray-700">{notification.assignedTo}</span>
                                </p>
                              )}
                              <div className="flex items-center gap-2 mt-1.5">
                                <p className="text-[10px] text-gray-400">
                                  {formatTime(notification.timestamp)}
                                </p>
                              </div>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="px-4 py-8 text-center text-gray-500">
                      <Bell size={32} className="mx-auto mb-2 text-gray-300" />
                      <p className="text-sm">No new notifications</p>
                    </div>
                  )}
                </div>

                {notifications.length > 0 && (
                  <div className="px-4 py-2 border-t border-gray-100 bg-gray-50/50 text-center">
                    <button className="text-xs font-medium text-primary hover:text-primary-dark transition-colors">
                      Mark all as read
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* User Profile */}
          <div className="relative" ref={dropdownRef}>
            <div
              className="flex items-center space-x-2 cursor-pointer hover:bg-gray-50 p-2 rounded-lg transition-colors"
              onClick={() => setIsDropdownOpen(!isDropdownOpen)}
            >
              <div className="flex justify-center items-center w-9 h-9 bg-primary/5 rounded-full overflow-hidden border border-primary/10">
                {user?.profilePicture ? (
                  <img
                    src={user.profilePicture}
                    alt={user.employeeName}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <User size={20} className="text-primary" />
                )}
              </div>
              <div className="hidden md:block text-left">
                <p className="text-sm font-medium text-gray-900">{user?.employeeName || user?.username || "Guest"}</p>
                <p className="text-xs text-gray-500">
                  {user?.pageAccess === "Admin" ? "Administrator" : "Maintenance Team"}
                </p>
              </div>
            </div>

            {/* Dropdown Menu */}
            {isDropdownOpen && (
              <div className="absolute right-0 mt-2 w-48 bg-white rounded-xl shadow-lg border border-gray-100 py-1 animate-in fade-in zoom-in-95 duration-200 z-50">
                <div className="px-4 py-3 border-b border-gray-100 md:hidden">
                  <p className="text-sm font-medium text-gray-900">{user?.employeeName || "Guest"}</p>
                  <p className="text-xs text-gray-500">{user?.pageAccess || "User"}</p>
                </div>

                <button
                  onClick={() => {
                    setIsDropdownOpen(false);
                    navigate("/settings");
                  }}
                  className="w-full text-left px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 hover:text-primary flex items-center gap-2 transition-colors"
                >
                  <Settings size={16} />
                  Settings
                </button>

                <button
                  onClick={handleLogout}
                  className="w-full text-left px-4 py-2.5 text-sm text-primary hover:bg-primary/5 flex items-center gap-2 transition-colors"
                >
                  <LogOut size={16} />
                  Logout
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;