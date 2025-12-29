import React, { useState, useEffect } from "react";
import {
  Calendar,
  CheckCircle,
  Clock,
  AlertCircle,
  Wrench,
  Users,
  TrendingUp,
  Activity,
  Filter,
  User as UserIcon,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import useAuthStore from "../store/authStore";
import { fetchAllMachines, fetchMaintenanceTaskCounts, fetchMaintenanceChecklistItemsPaginated, fetchMachinesWithTasks } from "../services/machineService";
import { fetchUsers, User } from "../services/userService";

// Define types based on your project structure
interface Task {
  id: string;
  title: string;
  description: string;
  status: string;
  machineId?: string;
  machineName?: string;
  assignedTo?: string;
  assignedToName?: string;
  createdAt: string;
  dueDate?: string;
  type: string;
}

interface Machine {
  id: string;
  name: string;
  status: string;
  serial_number?: string;
  assigned_user?: string; // Add optional assigned_user
}

const DailyReport = () => {
  const { user } = useAuthStore();
  const [selectedMachine, setSelectedMachine] = useState<string>("all");
  const [tasks, setTasks] = useState<Task[]>([]);
  const [machines, setMachines] = useState<Machine[]>([]);
  const [dropdownMachines, setDropdownMachines] = useState<{ id: any; name: string }[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [selectedUser, setSelectedUser] = useState<string>("all"); // "all" or user.id
  const [currentPage, setCurrentPage] = useState(1);
  const ITEMS_PER_PAGE = 10;

  /* New State for Server Side Pagination */
  const [totalItems, setTotalItems] = useState(0);

  useEffect(() => {
    setCurrentPage(1);
    // Reset selected machine if user changes (optional, but good practice if dropdown content changes)
    if (selectedMachine !== 'all') {
      // We verify if the selected machine is still valid is handled by user manually, 
      // but resetting to 'all' prevents confusion if the machine disappears from dropdown.
      // However, user might want to persist selection if possible. 
      // Let's safe reset if we change user significantly.
      // Actually, let's keep it simple.
      setSelectedMachine("all");
    }
  }, [selectedUser]);

  useEffect(() => {
    setCurrentPage(1);
  }, [selectedMachine]);

  const today = new Date().toLocaleDateString("en-US", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  /* Fetch Stats (Counts) */
  const [taskStats, setTaskStats] = useState({
    pending: 0,
    completed: 0,
    inProgress: 0,
    total: 0
  });

  useEffect(() => {
    const fetchStats = async () => {
      const uId = user?.pageAccess === "Admin" && selectedUser !== "all"
        ? users.find(u => u.id === Number(selectedUser))?.employeeName
        : (user?.pageAccess === "User" ? (user.employeeName || user.username) : undefined);

      const mName = selectedMachine === "all" ? undefined : selectedMachine;

      const counts = await fetchMaintenanceTaskCounts(uId, mName);
      setTaskStats({
        ...counts,
        total: counts.pending + counts.completed + counts.inProgress
      });
    };

    if (!loading) { // Only fetch stats after initial load or when filters change
      fetchStats();
    }
  }, [selectedUser, selectedMachine, user, loading, users]);

  /* Fetch Table Data (Paginated) */
  useEffect(() => {
    const loadTableData = async () => {
      setLoading(true);
      try {
        const uId = user?.pageAccess === "Admin" && selectedUser !== "all"
          ? users.find(u => u.id === Number(selectedUser))?.employeeName
          : (user?.pageAccess === "User" ? (user.employeeName || user.username) : undefined);

        const mName = selectedMachine === "all" ? undefined : selectedMachine;

        // Fetch Paginated Maintenance Tasks from Server
        const { data: maintenanceData, count } = await fetchMaintenanceChecklistItemsPaginated(
          currentPage,
          ITEMS_PER_PAGE,
          {
            status: 'all', // Show all statuses
            machineName: mName,
            assignedTo: uId
          }
        );

        // Map maintenance tasks
        const maintenanceTasksMapped = maintenanceData.map((item: any) => ({
          id: `mt-${item.id}`,
          title: item.task_no || 'Maintenance Task',
          description: item.description,
          status: item.status,
          machineId: item.maintenance?.machines?.id,
          machineName: item.maintenance?.machines?.name,
          assignedTo: item.maintenance?.assigned_to,
          assignedToName: item.maintenance?.assigned_to,
          createdAt: item.created_at || new Date().toISOString(),
          dueDate: item.maintenance?.due_date || '',
          type: 'Maintenance',
        }));

        // OPTIONAL: Fetch Repairs.
        // For now, we will ONLY show Maintenance Tasks in the paginated table to ensure performance.
        // If repair tasks are critical to be mixed in, we would need a unified backend query.
        // Given the request focused on "maintenance_tasks" (60k items), optimizing this is priority.
        // We will reset tasks to just maintenance tasks.
        setTasks(maintenanceTasksMapped);
        setTotalItems(count || 0);

      } catch (error) {
        console.error("Error loading table data:", error);
      } finally {
        setLoading(false);
      }
    };

    loadTableData();
  }, [currentPage, selectedMachine, selectedUser, user, users]); // Dependencies for refetching

  /* Initial Load for Machines and Users */
  useEffect(() => {
    const fetchBasics = async () => {
      try {
        const [machinesData, usersData] = await Promise.all([
          fetchAllMachines(),
          fetchUsers(),
        ]);
        setMachines(machinesData);
        setUsers(usersData);
      } catch (e) {
        console.error("Error fetching basics:", e);
      }
    };
    fetchBasics();
  }, []);

  /* Fetch Dropdown Machines */
  useEffect(() => {
    const loadDropdownMachines = async () => {
      const uId = user?.pageAccess === "Admin" && selectedUser !== "all"
        ? users.find(u => u.id === Number(selectedUser))?.employeeName
        : (user?.pageAccess === "User" ? (user.employeeName || user.username) : undefined);

      const data = await fetchMachinesWithTasks(uId);
      setDropdownMachines(data);
    };
    loadDropdownMachines();
  }, [selectedUser, user, users]);

  /* 
    Legacy Client Side Filtering logic removed in favor of Server Side Fetching.
    We now render 'tasks' directly as it is already the filtered page.
  */

  // Calculate statistics based on filtered tasks
  // Machine statistics
  // We can calculate machine stats purely from machine list as 'machines' is fully fetched (usually < 1000 items)
  // Filter machines based on User Access
  let relevantMachines = machines;

  if (user?.pageAccess === "Admin" && selectedUser !== "all") {
    const targetUser = users.find(u => u.id === Number(selectedUser));
    // If we want to show machines assigned to this user, we need to know the assignment.
    // In "machines" table, there is 'assigned_user' column or 'task_assigned'.
    // But strictly speaking, DailyReport previously filtered machines based on TASKS the user had.
    // With server side pagination, we don't have all tasks.
    // So we will fallback to showing ALL machines or machines where `assigned_user` matches.
    if (targetUser) {
      relevantMachines = machines.filter(m => m.assigned_user === targetUser.employeeName || m.assigned_user === targetUser.username);
    }
  } else if (user?.pageAccess === "User") {
    const userIdentifier = user.employeeName || user.username;
    relevantMachines = machines.filter(m => m.assigned_user === userIdentifier);
  }

  const activeMachines = relevantMachines.filter((m) => m.status === "operational").length;
  const maintenanceMachines = relevantMachines.filter((m) => m.status === "maintenance").length;
  const downMachines = relevantMachines.filter((m) => m.status === "down").length;

  const stats = [
    {
      title: "Total Tasks",
      value: taskStats.total,
      icon: Activity,
      textColor: "text-blue-600",
      bgColor: "bg-blue-50",
    },
    {
      title: "Completed",
      value: taskStats.completed,
      icon: CheckCircle,
      textColor: "text-green-600",
      bgColor: "bg-green-50",
    },
    {
      title: "In Progress",
      value: taskStats.inProgress,
      icon: Clock,
      textColor: "text-yellow-600",
      bgColor: "bg-yellow-50",
    },
    {
      title: "Pending",
      value: taskStats.pending,
      icon: AlertCircle,
      textColor: "text-orange-600",
      bgColor: "bg-orange-50",
    },
  ];

  const machineStats = [
    {
      title: "Operational",
      value: activeMachines,
      color: "text-green-600",
      bgColor: "bg-green-100",
    },
    {
      title: "Maintenance",
      value: maintenanceMachines,
      color: "text-yellow-600",
      bgColor: "bg-yellow-100",
    },
    {
      title: "Down",
      value: downMachines,
      color: "text-primary",
      bgColor: "bg-primary/10",
    },
  ];

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  // Find selected machine details
  const selectedMachineDetails = machines.find(m => m.name === selectedMachine);

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="bg-white rounded-lg shadow-sm p-6 border border-gray-200">
        <div className="flex items-center justify-between flex-wrap gap-4">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Daily Report</h1>
            <div className="flex items-center gap-2 mt-2 text-gray-600">
              <Calendar className="w-5 h-5" />
              <p className="text-lg">{today}</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2 px-4 py-2 bg-primary/5 rounded-lg">
              <Users className="w-5 h-5 text-primary" />
              <span className="text-sm font-medium text-primary-dark">
                {user?.pageAccess === "Admin"
                  ? "Admin View"
                  : `User View (${user?.employeeName || user?.username || 'Guest'})`}
              </span>
            </div>
          </div>
        </div>

        {/* User Filter - Only show for admin */}
        {user?.pageAccess === "Admin" && (
          <div className="mt-4 pt-4 border-t border-gray-200">
            <div className="flex flex-col sm:flex-row sm:items-center gap-3">
              <div className="flex items-center gap-2 text-gray-700">
                <Filter className="w-5 h-5" />
                <span className="text-sm font-semibold whitespace-nowrap">Filter by User:</span>
              </div>
              <select
                value={selectedUser}
                onChange={(e) => setSelectedUser(e.target.value)}
                className="w-full sm:w-auto px-4 py-2 border-2 border-gray-300 rounded-lg text-sm font-medium text-gray-700 bg-white hover:border-primary/40 focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary transition-all"
              >
                <option value="all">All Users</option>
                {users.map((u) => (
                  <option key={u.id} value={u.id}>
                    {u.employeeName} ({u.username})
                  </option>
                ))}
              </select>
              {selectedUser !== "all" && (
                <span className="self-start sm:self-auto px-3 py-1 bg-primary/10 text-primary rounded-full text-xs font-semibold">
                  Viewing: {users.find(u => u.id === Number(selectedUser))?.employeeName}
                </span>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Task Statistics */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((stat, index) => (
          <div
            key={index}
            className="bg-white rounded-lg shadow-sm p-6 border border-gray-200 hover:shadow-md transition-shadow"
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">{stat.title}</p>
                <p className={`text-3xl font-bold mt-2 ${stat.textColor}`}>
                  {stat.value}
                </p>
              </div>
              <div className={`${stat.bgColor} p-3 rounded-lg`}>
                <stat.icon className={`w-6 h-6 ${stat.textColor}`} />
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Machine Status Overview */}
      <div className="bg-white rounded-lg shadow-sm p-6 border border-gray-200">
        <div className="flex items-center gap-2 mb-4">
          <Wrench className="w-5 h-5 text-primary" />
          <h2 className="text-xl font-bold text-gray-900">
            Machine Status Overview
            {user?.pageAccess === "Admin" && selectedUser !== "all" && (
              <span className="text-sm font-normal text-gray-500 ml-2">
                (Machines assigned to {users.find(u => u.id === Number(selectedUser))?.employeeName})
              </span>
            )}
          </h2>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {machineStats.map((stat, index) => (
            <div
              key={index}
              className={`${stat.bgColor} rounded-lg p-4 border-2 border-transparent hover:border-gray-300 transition-all`}
            >
              <p className="text-sm font-medium text-gray-700">{stat.title}</p>
              <p className={`text-2xl font-bold mt-1 ${stat.color}`}>
                {stat.value}
              </p>
            </div>
          ))}
        </div>
        <div className="mt-4 text-sm text-gray-600">
          Total Machines: <span className="font-semibold">{relevantMachines.length}</span>
        </div>
      </div>

      {/* Today's Tasks List */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200">
        <div className="p-6 border-b border-gray-200 flex flex-wrap items-center justify-between gap-4">
          <div>
            {selectedMachine === "all" ? (
              <h2 className="text-xl font-bold text-gray-900">
                All Tasks
                {user?.pageAccess === "Admin" && selectedUser !== "all" && (
                  <span className="text-sm font-normal text-gray-500 ml-2">
                    for {users.find(u => u.id === Number(selectedUser))?.employeeName}
                  </span>
                )}
              </h2>
            ) : (
              <div className="flex flex-col">
                <h2 className="text-xl font-bold text-gray-900">{selectedMachineDetails?.name}</h2>
                <span className="text-sm text-gray-500 font-medium">
                  Serial No: {selectedMachineDetails?.serial_number || 'N/A'}
                </span>
              </div>
            )}
          </div>
          <div className="flex items-center gap-2">
            <Filter className="w-4 h-4 text-gray-500" />
            <select
              value={selectedMachine}
              onChange={(e) => setSelectedMachine(e.target.value)}
              className="px-3 py-1.5 border border-gray-300 rounded-md text-sm text-gray-700 bg-white hover:border-primary/40 focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary transition-all"
            >
              <option value="all">All Machines</option>
              {dropdownMachines.map(m => (
                <option key={m.id} value={m.name}>{m.name}</option>
              ))}
            </select>
          </div>
        </div>

        {selectedMachine === "all" ? (
          <div className="text-center py-16 bg-white">
            <Wrench className="w-16 h-16 text-gray-200 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900">Select a Machine</h3>
            <p className="text-gray-500 mt-1">Please select a machine from the dropdown to view its tasks.</p>
          </div>
        ) : (
          <div>
            {/* Mobile View - Cards */}
            <div className="block lg:hidden space-y-4 mb-4">
              {tasks.map((task) => (
                <div
                  key={task.id}
                  className={`bg-white border rounded-xl p-4 shadow-sm hover:shadow-md transition-shadow relative overflow-hidden ${task.status === 'completed' ? 'border-l-4 border-l-green-500' :
                    task.status === 'in-progress' ? 'border-l-4 border-l-yellow-500' :
                      'border-l-4 border-l-orange-500'
                    }`}
                >
                  <div className="flex justify-between items-start mb-3">
                    <div className="flex-1 min-w-0 mr-3">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wide bg-gray-100 text-gray-600">
                          {task.type}
                        </span>
                        <span className="text-xs text-gray-400 font-medium">
                          {task.dueDate ? `Due ${new Date(task.dueDate).toLocaleDateString()}` : 'No Due Date'}
                        </span>
                      </div>
                      <h4 className="font-bold text-gray-900 text-base leading-tight">{task.title}</h4>
                    </div>
                    <span className={`px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider rounded-full ${task.status === 'completed' ? 'bg-green-100 text-green-700' :
                      task.status === 'in-progress' ? 'bg-yellow-100 text-yellow-700' :
                        'bg-orange-100 text-orange-700'
                      }`}>
                      {task.status}
                    </span>
                  </div>

                  <div className="mb-4">
                    <p className="text-sm text-gray-600 line-clamp-2 leading-relaxed bg-gray-50 p-2.5 rounded-lg border border-gray-100">
                      {task.description}
                    </p>
                  </div>

                  <div className="grid grid-cols-2 gap-3 pt-3 border-t border-gray-100">
                    <div className="flex items-center gap-2 text-sm text-gray-600">
                      <div className="p-1.5 bg-blue-50 text-blue-600 rounded-md">
                        <Wrench size={14} />
                      </div>
                      <span className="truncate font-medium">{task.machineName || "Unknown"}</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm text-gray-600 justify-end">
                      <div className="p-1.5 bg-purple-50 text-purple-600 rounded-md">
                        <UserIcon size={14} />
                      </div>
                      <span className="truncate font-medium">{task.assignedTo || "Unassigned"}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Desktop View - Table */}
            <div className="hidden lg:block overflow-x-auto border border-gray-200 rounded-lg">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Task Details</th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Machine</th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Description</th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Assigned To</th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Due Date</th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {tasks.map((task) => (
                    <tr key={task.id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-6 py-4">
                        <div className="flex flex-col">
                          <span className="text-sm font-medium text-gray-900">{task.title}</span>
                          <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-gray-100 text-gray-800 mt-1 w-fit">
                            {task.type}
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                        <div className="flex items-center gap-2">
                          <Wrench className="w-4 h-4 text-gray-400" />
                          {task.machineName || "Unknown Machine"}
                        </div>
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-600 max-w-xs truncate" title={task.description}>
                        {task.description}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                        <div className="flex items-center gap-2">
                          <UserIcon className="w-4 h-4 text-gray-400" />
                          {task.assignedTo || "Unassigned"}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                        {task.dueDate ? (
                          <div className="flex items-center gap-2">
                            <Calendar className="w-4 h-4 text-gray-400" />
                            {new Date(task.dueDate).toLocaleDateString()}
                          </div>
                        ) : (
                          <span className="text-gray-400">-</span>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`px-3 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${task.status === 'completed' ? 'bg-green-100 text-green-800' :
                          task.status === 'in-progress' ? 'bg-yellow-100 text-yellow-800' :
                            'bg-orange-100 text-orange-800'
                          }`}>
                          {task.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {tasks.length === 0 ? (
              <div className="text-center py-12 bg-white border border-gray-200 rounded-lg">
                <Activity className="w-12 h-12 text-gray-400 mx-auto mb-3" />
                <p className="text-gray-500 text-lg">
                  {user?.pageAccess === "Admin" && selectedUser !== "all"
                    ? `No tasks assigned to ${users.find(u => u.id === Number(selectedUser))?.employeeName}`
                    : "No tasks found for this machine"}
                </p>
              </div>
            ) : (
              <div className="flex flex-col sm:flex-row items-center justify-between px-4 py-3 border border-gray-200 border-t-0 rounded-b-lg bg-white gap-4 sm:gap-0">
                <div className="text-sm text-gray-500 text-center sm:text-left">
                  Showing <span className="font-medium mx-1">{tasks.length > 0 ? (currentPage - 1) * ITEMS_PER_PAGE + 1 : 0}</span> to <span className="font-medium mx-1">{Math.min(currentPage * ITEMS_PER_PAGE, totalItems)}</span> of <span className="font-medium mx-1">{totalItems}</span> results
                </div>
                <div className="flex items-center space-x-2">
                  <button
                    onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                    disabled={currentPage === 1}
                    className="p-2 rounded-md border hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <ChevronLeft size={16} />
                  </button>
                  <span className="text-sm font-medium text-gray-700">
                    Page {currentPage} of {Math.ceil(totalItems / ITEMS_PER_PAGE) || 1}
                  </span>
                  <button
                    onClick={() => setCurrentPage(prev => Math.min(prev + 1, Math.ceil(totalItems / ITEMS_PER_PAGE)))}
                    disabled={currentPage >= Math.ceil(totalItems / ITEMS_PER_PAGE) || totalItems === 0}
                    className="p-2 rounded-md border hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <ChevronRight size={16} />
                  </button>
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Performance Summary */}
      <div className="bg-gradient-to-br from-primary/5 to-orange-50 rounded-lg shadow-sm p-6 border border-primary/20">
        <div className="flex items-center gap-2 mb-4">
          <TrendingUp className="w-5 h-5 text-primary" />
          <h2 className="text-xl font-bold text-gray-900">Performance Summary</h2>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <p className="text-sm text-gray-600">Task Completion Rate</p>
            <div className="flex items-center gap-2 mt-2">
              <div className="flex-1 bg-gray-200 rounded-full h-3">
                <div
                  className="bg-primary h-3 rounded-full transition-all duration-500"
                  style={{
                    width: `${taskStats.total > 0 ? (taskStats.completed / taskStats.total) * 100 : 0}%`,
                  }}
                ></div>
              </div>
              <span className="text-sm font-bold text-primary">
                {taskStats.total > 0 ? Math.round((taskStats.completed / taskStats.total) * 100) : 0}%
              </span>
            </div>
          </div>
          <div>
            <p className="text-sm text-gray-600">Machine Availability</p>
            <div className="flex items-center gap-2 mt-2">
              <div className="flex-1 bg-gray-200 rounded-full h-3">
                <div
                  className="bg-green-600 h-3 rounded-full transition-all duration-500"
                  style={{
                    width: `${relevantMachines.length > 0 ? (activeMachines / relevantMachines.length) * 100 : 0}%`,
                  }}
                ></div>
              </div>
              <span className="text-sm font-bold text-green-600">
                {relevantMachines.length > 0 ? Math.round((activeMachines / relevantMachines.length) * 100) : 0}%
              </span>
            </div>
          </div>
        </div>
      </div >
    </div >
  );
};

export default DailyReport;