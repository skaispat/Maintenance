import React from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { 
  LayoutDashboard, 
  Wrench, 
  ClipboardList, 
  BarChart3,
  LogOut,
  X,
  User,
  Bell
} from 'lucide-react';
import useAuthStore from '../store/authStore';

const Sidebar = ({ onClose }) => {
  const { user, logout } = useAuthStore();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center justify-between p-5 border-b border-indigo-800">
        <h1 className="text-xl font-bold flex items-center gap-2 text-white">
          <Wrench size={24} />
          <span>MaintenancePro</span>
        </h1>
        {onClose && (
          <button
            onClick={onClose}
            className="lg:hidden p-2 rounded-md text-indigo-200 hover:text-white focus:outline-none focus:ring-2 focus:ring-inset focus:ring-white"
          >
            <span className="sr-only">Close sidebar</span>
            <X className="h-6 w-6" />
          </button>
        )}
      </div>
      
      <nav className="flex-1 py-4 px-2 space-y-1 overflow-y-auto">
        <NavLink 
          to="/" 
          className={({ isActive }) => 
            `flex items-center py-2.5 px-4 rounded-lg transition-colors ${
              isActive 
                ? 'bg-indigo-800 text-white' 
                : 'text-indigo-100 hover:bg-indigo-800 hover:text-white'
            }`
          }
          onClick={onClose}
        >
          <LayoutDashboard className="mr-3" size={20} />
          <span>Dashboard</span>
        </NavLink>

        {user?.role === 'admin' && (
          <>
            <NavLink 
              to="/machines" 
              className={({ isActive }) => 
                `flex items-center py-2.5 px-4 rounded-lg transition-colors ${
                  isActive 
                    ? 'bg-indigo-800 text-white' 
                    : 'text-indigo-100 hover:bg-indigo-800 hover:text-white'
                }`
              }
              onClick={onClose}
            >
              <Wrench className="mr-3" size={20} />
              <span>Machines</span>
            </NavLink>

            <NavLink 
              to="/assign-task" 
              className={({ isActive }) => 
                `flex items-center py-2.5 px-4 rounded-lg transition-colors ${
                  isActive 
                    ? 'bg-indigo-800 text-white' 
                    : 'text-indigo-100 hover:bg-indigo-800 hover:text-white'
                }`
              }
              onClick={onClose}
            >
              <ClipboardList className="mr-3" size={20} />
              <span>Assign Task</span>
            </NavLink>
          </>
        )}

        <NavLink 
          to="/tasks" 
          className={({ isActive }) => 
            `flex items-center py-2.5 px-4 rounded-lg transition-colors ${
              isActive 
                ? 'bg-indigo-800 text-white' 
                : 'text-indigo-100 hover:bg-indigo-800 hover:text-white'
            }`
          }
          onClick={onClose}
        >
          <ClipboardList className="mr-3" size={20} />
          <span>Tasks</span>
        </NavLink>

        <NavLink 
          to="/reports" 
          className={({ isActive }) => 
            `flex items-center py-2.5 px-4 rounded-lg transition-colors ${
              isActive 
                ? 'bg-indigo-800 text-white' 
                : 'text-indigo-100 hover:bg-indigo-800 hover:text-white'
            }`
          }
          onClick={onClose}
        >
          <BarChart3 className="mr-3" size={20} />
          <span>Reports</span>
        </NavLink>
      </nav>

      <div className="p-4 border-t border-indigo-800">
        <div className="flex items-center space-x-4 mb-4">
          {/* <div className="relative">
            <Bell size={20} className="text-gray-500 cursor-pointer hover:text-indigo-600" />
            <span className="absolute top-0 right-0 h-2 w-2 rounded-full bg-red-500"></span>
          </div> */}
          <div className="flex items-center space-x-2 cursor-pointer">
            <div className="w-9 h-9 rounded-full bg-indigo-100 flex items-center justify-center">
              <User size={20} className="text-indigo-600" />
            </div>
            <div className="hidden md:block">
              <p className="text-sm font-medium text-white">{user?.id || 'Guest'}</p>
              <p className="text-xs text-white">{user?.role === 'admin' ? 'Administrator' : 'Maintenance Team'}</p>
            </div>
          </div>
        </div>
        <button
          onClick={() => {
            handleLogout();
            onClose?.();
          }}
          className="flex items-center py-2.5 px-4 rounded-lg text-indigo-100 hover:bg-indigo-800 hover:text-white cursor-pointer transition-colors w-full"
        >
          <LogOut className="mr-3" size={20} />
          <span>Logout</span>
        </button>
      </div>
    </div>
  );
};

export default Sidebar;