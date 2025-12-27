import { useEffect, useState } from "react";
import { useLocation } from "react-router-dom";
import {
  Pie,
  Cell,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  PieChart,
  LineChart,
  Line,
} from "recharts";
import {
  Clock,
  CheckCircle,
  Wrench,
  DollarSign,
  BarChart2,
  Calendar,
  X,
  Filter,
  Activity,
  User,
  Loader2,
  ArrowUpDown,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import {
  fetchAllMachines,
  fetchAllTasks,
  fetchMaintenanceTaskCounts,
  fetchMaintenanceChecklistItemsPaginated
} from "../services/machineService";
import useAuthStore from "../store/authStore";

const Dashboard = () => {
  const { user } = useAuthStore();
  const COLORS = ["#991B1B", "#EF4444", "#F59E0B", "#10B981", "#6366F1"];
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedCard, setSelectedCard] = useState<string | null>(null);
  const [modalTitle, setModalTitle] = useState("");
  const [filterValue, setFilterValue] = useState("all");
  const [selectedMachine, setSelectedMachine] = useState("all");
  const [tableData, setTableData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [sortConfig, setSortConfig] = useState<{ key: string; direction: 'asc' | 'desc' } | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [isServerSide, setIsServerSide] = useState(false);
  const [totalServerItems, setTotalServerItems] = useState(0);
  const [isTableLoading, setIsTableLoading] = useState(false);
  const itemsPerPage = 10;

  // Real Data State
  const [machines, setMachines] = useState<any[]>([]);
  const [tasks, setTasks] = useState<any[]>([]); // Main tasks (Maintenance + Repair)
  // checklistItems removed as we fetch mostly on demand, except maybe for some logic?
  // Actually we don't need checklistItems array anymore if we rely on server side for the tables.
  const [stats, setStats] = useState({
    totalMachines: 0,
    maintenanceTasks: 0,
    tasksComplete: 0,
    tasksPending: 0,
    tasksInProgress: 0,
    totalCost: 0,
  });

  const location = useLocation();

  useEffect(() => {
    if (location.state?.showSuccessModal) {
      setIsModalOpen(true);
      const timer = setTimeout(() => setIsModalOpen(false), 2000);
      window.history.replaceState({}, document.title);
      return () => clearTimeout(timer);
    }
  }, [location]);

  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      try {
        let taskCounts;
        const userIdentifier = user?.pageAccess === 'User' ? (user.employeeName || user.username) : undefined;

        const [machinesData, tasksData, counts] = await Promise.all([
          fetchAllMachines(),
          fetchAllTasks(),
          fetchMaintenanceTaskCounts(userIdentifier),
        ]);

        taskCounts = counts;

        // Filter data based on user role
        let visibleTasks = tasksData;
        let visibleMachines = machinesData;

        if (userIdentifier) {

          // Filter Repair Tasks
          visibleTasks = tasksData.filter((t: any) =>
            t.assignedTo === userIdentifier || t.doer_name === userIdentifier
          );
        }

        setMachines(visibleMachines);
        setTasks(visibleTasks);

        // Calculate Stats based on VISIBLE data
        const totalMachines = visibleMachines.length;
        const maintenanceTasks = visibleTasks.filter((t: any) => t.type === 'Maintenance').length;

        // Use server-side counts for stats
        const tasksComplete = taskCounts.completed;
        const tasksPending = taskCounts.pending;
        const tasksInProgress = taskCounts.inProgress;

        const totalRepairCost = visibleMachines.reduce((acc: number, m: any) => acc + (m.total_repair_cost || 0), 0);

        setStats({
          totalMachines,
          maintenanceTasks,
          tasksComplete,
          tasksPending,
          tasksInProgress,
          totalCost: totalRepairCost,
        });

      } catch (error) {
        console.error("Error loading dashboard data:", error);
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [user]);

  // Derived Data for Charts
  const repairVsPurchaseData = machines
    .filter(m => m.purchase_date && !isNaN(new Date(m.purchase_date).getTime()))
    .map(m => ({
      name: m.name,
      purchasePrice: m.purchase_price || 0,
      repairCost: m.total_repair_cost || 0,
      status: m.status,
      department: m.department,
      purchaseDate: m.purchase_date,
    }))
    .sort((a, b) => new Date(a.purchaseDate).getTime() - new Date(b.purchaseDate).getTime());

  const departmentCostData = Object.values(machines.reduce((acc: any, m: any) => {
    const dept = m.department || 'Unknown';
    if (!acc[dept]) {
      acc[dept] = { name: dept, cost: 0, machines: 0, tasks: 0 };
    }
    acc[dept].cost += (m.total_repair_cost || 0);
    acc[dept].machines += 1;
    return acc;
  }, {}));

  tasks.forEach((t: any) => {
    const dept = t.department || 'Unknown';
    const found = (departmentCostData as any[]).find(d => d.name === dept);
    if (found) {
      found.tasks += 1;
    }
  });

  /* 
   * Filter machines with repair_count > 0.
   * If there are no such machines, frequentRepairData is empty.
   */
  const frequentRepairData = machines
    .filter(m => m.repair_count > 0)
    .sort((a, b) => b.repair_count - a.repair_count)
    .slice(0, 5)
    .map(m => ({
      name: m.name,
      repairs: m.repair_count,
      lastRepair: m.last_maintenance ? new Date(m.last_maintenance).toLocaleDateString() : 'N/A',
      cost: m.total_repair_cost
    }));

  const isDepartmentDataEmpty = departmentCostData.length === 0 || (departmentCostData as any[]).every(d => d.cost === 0);
  const isRepairsDataEmpty = frequentRepairData.length === 0;

  const taskStatusData = [
    { name: 'Completed', value: stats.tasksComplete, color: '#10B981' },
    { name: 'Pending', value: stats.tasksPending, color: '#F59E0B' },
    { name: 'In-Progress', value: stats.tasksInProgress, color: '#3B82F6' },
  ].filter(d => d.value > 0);

  const handleCardClick = (cardType: string) => {
    setFilterValue("all");
    setSelectedMachine("all");
    setCurrentPage(1);

    switch (cardType) {
      case "machines":
        setTableData(repairVsPurchaseData);
        setSelectedCard("machines");
        setModalTitle("Machine Cost Analysis");
        break;
      case "departments":
        setTableData(departmentCostData as any[]);
        setSelectedCard("departments");
        setModalTitle("Department Overview");
        break;
      case "repairs":
        setTableData(frequentRepairData);
        setSelectedCard("repairs");
        setModalTitle("Repair History");
        break;

      // Task related clicks
      case "tasks_maintenance":
        setTableData(tasks.filter(t => t.type === 'Maintenance'));
        setSelectedCard("task_list");
        setModalTitle("Maintenance Tasks");
        break;
      case "tasks_complete":
        setIsServerSide(true);
        setSelectedCard("checklist_list");
        setModalTitle("Completed Tasks");
        // Initial fetch happens in useEffect dependent on selectedCard/Page
        break;
      case "tasks_pending":
        setIsServerSide(true);
        setSelectedCard("checklist_list");
        setModalTitle("Pending Tasks");
        break;
      case "tasks_in_progress":
        setIsServerSide(true);
        setSelectedCard("checklist_list");
        setModalTitle("In-Progress Tasks");
        break;
      case "all_tasks":
        setIsServerSide(true);
        setSelectedCard("checklist_list");
        setModalTitle("All Tasks Status");
        break;

      default:
        setTableData([]);
        setSelectedCard(null);
    }
  };

  const closeModal = () => {
    setSelectedCard(null);
    setTableData([]);
    setIsServerSide(false);
    setCurrentPage(1);
    setTotalServerItems(0);
    setFilterValue("all");
    setSelectedMachine("all");
  };

  useEffect(() => {
    const fetchServerData = async () => {
      if (!isServerSide || !selectedCard) return;

      setIsTableLoading(true);
      try {
        let statusFilter: any = 'all';
        if (modalTitle === "Pending Tasks") statusFilter = 'pending';
        if (modalTitle === "Completed Tasks") statusFilter = ['completed', 'approved'];
        if (modalTitle === "In-Progress Tasks") statusFilter = 'in_progress';

        const userIdentifier = user?.pageAccess === 'User' ? (user.employeeName || user.username) : undefined;

        const { data, count } = await fetchMaintenanceChecklistItemsPaginated(
          currentPage,
          itemsPerPage,
          {
            status: statusFilter,
            search: filterValue !== 'all' ? filterValue : undefined,
            machineName: selectedMachine,
            assignedTo: userIdentifier
          }
        );

        setTableData(data);
        setTotalServerItems(count);
      } catch (err) {
        console.error("Error fetching paginated data", err);
      } finally {
        setIsTableLoading(false);
      }
    };

    fetchServerData();
  }, [selectedCard, currentPage, isServerSide, modalTitle, filterValue, selectedMachine, user]);

  const getFilteredData = () => {
    let data = [...tableData];

    // For server-side, we rely on the API. But if we want proper filtering for non-server cards:
    if (isServerSide) return data;

    // Filter by Machine if selected
    if (selectedMachine !== "all") {
      data = data.filter(item => {
        // For regular tasks/machines
        if (item.machineName) {
          return item.machineName === selectedMachine;
        }
        if (item.name) {
          return item.name === selectedMachine;
        }
        return false;
      });
    }

    // Filter by Search Text
    if (filterValue !== "all") {
      data = data.filter(item =>
        Object.values(item).some(val =>
          String(val).toLowerCase().includes(filterValue.toLowerCase())
        )
      );
    }

    // Apply Sorting
    if (sortConfig) {
      data.sort((a, b) => {
        if (a[sortConfig.key] < b[sortConfig.key]) {
          return sortConfig.direction === 'asc' ? -1 : 1;
        }
        if (a[sortConfig.key] > b[sortConfig.key]) {
          return sortConfig.direction === 'asc' ? 1 : -1;
        }
        return 0;
      });
    }

    return data;
  };

  const handleSort = (key: string) => {
    let direction: 'asc' | 'desc' = 'asc';
    if (sortConfig && sortConfig.key === key && sortConfig.direction === 'asc') {
      direction = 'desc';
    }
    setSortConfig({ key, direction });
  };

  const renderTableContent = (filteredData: any[]) => {

    if (selectedCard === "machines") {
      return (
        <table className="w-full">
          <thead className="bg-gray-50/50">
            <tr>
              <th
                className="px-4 py-3 text-left text-sm font-semibold text-gray-700 cursor-pointer hover:bg-gray-100 transition-colors"
                onClick={() => handleSort('name')}
              >
                <div className="flex items-center gap-1">
                  Machine
                  <ArrowUpDown size={14} className="text-gray-400" />
                </div>
              </th>
              <th
                className="px-4 py-3 text-left text-sm font-semibold text-gray-700 cursor-pointer hover:bg-gray-100 transition-colors"
                onClick={() => handleSort('purchasePrice')}
              >
                <div className="flex items-center gap-1">
                  Purchase Price
                  <ArrowUpDown size={14} className="text-gray-400" />
                </div>
              </th>
              <th
                className="px-4 py-3 text-left text-sm font-semibold text-gray-700 cursor-pointer hover:bg-gray-100 transition-colors"
                onClick={() => handleSort('repairCost')}
              >
                <div className="flex items-center gap-1">
                  Repair Cost
                  <ArrowUpDown size={14} className="text-gray-400" />
                </div>
              </th>
              <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">Status</th>
              <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">Department</th>
            </tr>
          </thead>
          <tbody>
            {filteredData.map((item, idx) => (
              <tr key={idx} className="border-b border-gray-100 hover:bg-gray-50/50 transition-colors">
                <td className="px-4 py-3 text-sm font-medium text-gray-800">{item.name}</td>
                <td className="px-4 py-3 text-sm text-gray-600">₹{item.purchasePrice.toLocaleString("en-IN")}</td>
                <td className="px-4 py-3 text-sm text-gray-600">₹{item.repairCost.toLocaleString("en-IN")}</td>
                <td className="px-4 py-3 text-sm">
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${item.status === "Active" || item.status === "operational" ? "bg-green-100 text-green-800" :
                    item.status === "Maintenance" ? "bg-yellow-100 text-yellow-800" :
                      "bg-red-100 text-red-800"
                    }`}>
                    {item.status}
                  </span>
                </td>
                <td className="px-4 py-3 text-sm text-gray-600">{item.department}</td>
              </tr>
            ))}
          </tbody>
        </table>
      );
    }

    if (selectedCard === "departments") {
      return (
        <table className="w-full">
          <thead className="bg-gray-50/50">
            <tr>
              <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">Department</th>
              <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">Total Repair Cost</th>
              <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">Machines</th>
              <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">Tasks</th>
            </tr>
          </thead>
          <tbody>
            {filteredData.map((item, idx) => (
              <tr key={idx} className="border-b border-gray-100 hover:bg-gray-50/50 transition-colors">
                <td className="px-4 py-3 text-sm font-medium text-gray-800">{item.name}</td>
                <td className="px-4 py-3 text-sm text-gray-600">₹{item.cost.toLocaleString("en-IN")}</td>
                <td className="px-4 py-3 text-sm text-gray-600">{item.machines}</td>
                <td className="px-4 py-3 text-sm text-gray-600">{item.tasks}</td>
              </tr>
            ))}
          </tbody>
        </table>
      );
    }

    if (selectedCard === "task_list") {
      return (
        <table className="w-full">
          <thead className="bg-gray-50/50">
            <tr>
              <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">Task Title</th>
              <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">Machine</th>
              <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">Priority</th>
              <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">Status</th>
              <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">Due Date</th>
              <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">Assigned To</th>
            </tr>
          </thead>
          <tbody>
            {filteredData.map((item, idx) => (
              <tr key={idx} className="border-b border-gray-100 hover:bg-gray-50/50 transition-colors">
                <td className="px-4 py-3 text-sm font-medium text-gray-800">
                  <div className="flex flex-col">
                    <span>{item.taskTitle || item.description || 'Untitled'}</span>
                    <span className="text-xs text-gray-400">{item.type}</span>
                  </div>
                </td>
                <td className="px-4 py-3 text-sm text-gray-600">{item.machineName}</td>
                <td className="px-4 py-3 text-sm">
                  <span className={`px-2 py-0.5 rounded text-xs font-medium border ${item.priority === 'High' ? 'bg-red-50 text-red-700 border-red-200' :
                    item.priority === 'Medium' ? 'bg-amber-50 text-amber-700 border-amber-200' :
                      'bg-blue-50 text-blue-700 border-blue-200'
                    }`}>
                    {item.priority || 'Normal'}
                  </span>
                </td>
                <td className="px-4 py-3 text-sm">
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${item.status === "completed" || item.status === "approved" ? "bg-green-100 text-green-800" :
                    item.status === "pending" ? "bg-yellow-100 text-yellow-800" :
                      item.status === "in_progress" ? "bg-blue-100 text-blue-800" :
                        "bg-gray-100 text-gray-800"
                    }`}>
                    {item.status === "in_progress" ? "In Progress" : item.status}
                  </span>
                </td>
                <td className="px-4 py-3 text-sm text-gray-600">
                  <div className="flex items-center gap-1">
                    <Calendar size={14} className="text-gray-400" />
                    {new Date(item.dueDate).toLocaleDateString()}
                  </div>
                </td>
                <td className="px-4 py-3 text-sm text-gray-600">
                  <div className="flex items-center gap-1">
                    <User size={14} className="text-gray-400" />
                    {item.assignedToName || item.assignedTo || 'Unassigned'}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      );
    }

    if (selectedCard === "checklist_list") {
      return (
        <table className="w-full">
          <thead className="bg-gray-50/50">
            <tr>
              <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">Task No</th>
              <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">Description</th>
              <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">Machine</th>
              <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">Status</th>
              <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">Assigned To</th>
            </tr>
          </thead>
          <tbody>
            {filteredData.map((item, idx) => (
              <tr key={idx} className="border-b border-gray-100 hover:bg-gray-50/50 transition-colors">
                <td className="px-4 py-3 text-sm font-medium text-gray-800">{item.task_no}</td>
                <td className="px-4 py-3 text-sm text-gray-600 max-w-xs truncate" title={item.description}>{item.description}</td>
                <td className="px-4 py-3 text-sm text-gray-600">
                  {item.maintenance?.machines?.name || 'Unknown'}
                </td>
                <td className="px-4 py-3 text-sm">
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${item.status === "completed" || item.status === "approved" ? "bg-green-100 text-green-800" :
                    item.status === "pending" ? "bg-yellow-100 text-yellow-800" :
                      item.status === "in_progress" ? "bg-blue-100 text-blue-800" :
                        "bg-gray-100 text-gray-800"
                    }`}>
                    {item.status === "in_progress" ? "In Progress" : item.status}
                  </span>
                </td>
                <td className="px-4 py-3 text-sm text-gray-600">
                  <div className="flex items-center gap-1">
                    <User size={14} className="text-gray-400" />
                    {item.maintenance?.assigned_to || 'Unassigned'}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      );
    }

    if (selectedCard === "repairs") {
      return (
        <table className="w-full">
          <thead className="bg-gray-50/50">
            <tr>
              <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">Machine</th>
              <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">Total Repairs</th>
              <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">Last Repair Date</th>
              <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">Total Cost</th>
            </tr>
          </thead>
          <tbody>
            {filteredData.map((item, idx) => (
              <tr key={idx} className="border-b border-gray-100 hover:bg-gray-50/50 transition-colors">
                <td className="px-4 py-3 text-sm font-medium text-gray-800">{item.name}</td>
                <td className="px-4 py-3 text-sm text-gray-600">{item.repairs}</td>
                <td className="px-4 py-3 text-sm text-gray-600">{item.lastRepair}</td>
                <td className="px-4 py-3 text-sm text-gray-600">₹{item.cost.toLocaleString("en-IN")}</td>
              </tr>
            ))}
          </tbody>
        </table>
      );
    }
  };

  const allFilteredData = isServerSide ? tableData : getFilteredData();
  const totalPages = isServerSide
    ? Math.ceil(totalServerItems / itemsPerPage)
    : Math.ceil(allFilteredData.length / itemsPerPage);

  const paginatedData = isServerSide
    ? tableData
    : allFilteredData.slice(
      (currentPage - 1) * itemsPerPage,
      currentPage * itemsPerPage
    );

  if (loading) {
    return (
      <div className="min-h-screen flex justify-center items-center bg-gray-50">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="space-y-6 max-w-7xl mx-auto">
        <div className="flex flex-col md:flex-row justify-between items-center gap-4">
          <div>
            <h1 className="text-3xl font-bold text-gray-800">Dashboard</h1>
            <p className="text-gray-500 mt-1">Overview of your maintenance operations</p>
          </div>
          <div className="flex items-center gap-3">
            <span className="text-sm text-gray-500">Last updated: {new Date().toLocaleTimeString()}</span>
            <select className="px-4 py-2 bg-white rounded-xl border border-gray-200 shadow-sm focus:outline-none focus:ring-2 focus:ring-primary/20 text-gray-700 cursor-pointer hover:border-primary/50 transition-colors">
              <option value="thisMonth">This Month</option>
              <option value="lastMonth">Last Month</option>
              <option value="lastQuarter">Last Quarter</option>
              <option value="thisYear">This Year</option>
            </select>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
          {[
            {
              label: "Total Machines",
              value: stats.totalMachines,
              icon: <Wrench size={20} className="text-blue-600" />,
              color: "bg-blue-50 border-blue-100",
              onClick: () => handleCardClick("machines") // Reusing machines view
            },
            {
              label: "Maintenance Tasks",
              value: stats.maintenanceTasks,
              icon: <Calendar size={20} className="text-primary" />,
              color: "bg-red-50 border-red-100",
              onClick: () => handleCardClick("tasks_maintenance")
            },
            {
              label: "Tasks Complete",
              value: stats.tasksComplete,
              icon: <CheckCircle size={20} className="text-green-600" />,
              color: "bg-green-50 border-green-100",
              onClick: () => handleCardClick("tasks_complete")
            },
            {
              label: "Tasks Pending",
              value: stats.tasksPending,
              icon: <Clock size={20} className="text-amber-600" />,
              color: "bg-amber-50 border-amber-100",
              onClick: () => handleCardClick("tasks_pending")
            },
            {
              label: "Tasks In-Progress",
              value: stats.tasksInProgress,
              icon: <Loader2 size={20} className="text-blue-600 animate-spin-slow" />,
              color: "bg-blue-50 border-blue-100",
              onClick: () => handleCardClick("tasks_in_progress")
            },
            {
              label: "Total Repair Cost",
              value: stats.totalCost,
              prefix: "₹",
              icon: <DollarSign size={20} className="text-purple-600" />,
              color: "bg-purple-50 border-purple-100",
              onClick: () => handleCardClick("departments") // Closest fit for cost breakdown
            },
          ].map((stat, idx) => (
            <div
              key={idx}
              onClick={stat.onClick}
              className={`p-5 rounded-2xl border shadow-sm hover:shadow-md transition-all duration-300 cursor-pointer group ${stat.color} bg-opacity-50 backdrop-blur-sm`}
            >
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">
                    {stat.label}
                  </p>
                  <h3 className="text-2xl font-bold text-gray-800 group-hover:scale-105 transition-transform origin-left">
                    {stat.prefix || ""}{stat.value.toLocaleString("en-IN")}
                  </h3>
                </div>
                <div className="p-2 bg-white rounded-xl shadow-sm group-hover:shadow transition-shadow">
                  {stat.icon}
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Charts Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Repair Cost vs Purchase Price */}
          <div
            onClick={() => handleCardClick("machines")}
            className="p-4 sm:p-6 bg-white rounded-2xl shadow-sm border border-gray-100 cursor-pointer hover:shadow-lg transition-all duration-300 group"
          >
            <div className="flex items-center justify-between mb-6">
              <h2 className="flex items-center text-lg font-bold text-gray-800">
                <div className="p-2 bg-primary/10 rounded-lg mr-3 group-hover:bg-primary/20 transition-colors">
                  <BarChart2 size={20} className="text-primary" />
                </div>
                Repair Cost vs Purchase Price
              </h2>
              <span className="hidden sm:inline-block text-xs font-medium text-gray-400 bg-gray-50 px-2 py-1 rounded-md">All Machines</span>
            </div>
            <div className="h-64 sm:h-80">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={repairVsPurchaseData} margin={{ top: 20, right: 20, bottom: 20, left: 20 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E5E7EB" />
                  <XAxis
                    dataKey="purchaseDate"
                    tickFormatter={(value) => new Date(value).toLocaleDateString(undefined, { month: 'short', year: '2-digit' })}
                    interval="preserveStartEnd"
                    tick={{ fill: '#6B7280', fontSize: 10 }}
                    height={60}
                    angle={-45}
                    textAnchor="end"
                  />
                  <YAxis
                    tickFormatter={(value) => `₹${value / 1000}k`}
                    label={{ value: 'Cost (₹)', angle: -90, position: 'insideLeft', fill: '#6B7280', fontSize: 12 }}
                    tick={{ fill: '#6B7280', fontSize: 11 }}
                  />
                  <Tooltip
                    cursor={{ stroke: '#9CA3AF', strokeWidth: 1, strokeDasharray: '3 3' }}
                    content={({ active, payload }) => {
                      if (active && payload && payload.length) {
                        const data = payload[0].payload;
                        return (
                          <div className="bg-white p-3 border border-gray-100 shadow-lg rounded-xl">
                            <p className="font-semibold text-gray-900 mb-1">{data.name}</p>
                            <p className="text-xs text-gray-500 mb-2">Purchased: {new Date(data.purchaseDate).toLocaleDateString()}</p>
                            <div className="flex flex-col gap-1">
                              <p className="text-xs text-gray-500 flex justify-between gap-4">
                                <span>Purchase Price:</span>
                                <span className="font-medium text-gray-900">₹{data.purchasePrice.toLocaleString()}</span>
                              </p>
                              <p className="text-xs text-gray-500 flex justify-between gap-4">
                                <span>Repair Cost:</span>
                                <span className="font-medium text-red-600">₹{data.repairCost.toLocaleString()}</span>
                              </p>
                            </div>
                          </div>
                        );
                      }
                      return null;
                    }}
                  />
                  <Legend iconType="circle" wrapperStyle={{ paddingTop: '0px' }} />
                  <Line
                    type="monotone"
                    dataKey="purchasePrice"
                    name="Purchase Price"
                    stroke="#94a3b8"
                    strokeWidth={2}
                    dot={{ r: 3 }}
                    activeDot={{ r: 5 }}
                  />
                  <Line
                    type="monotone"
                    dataKey="repairCost"
                    name="Repair Cost"
                    stroke="#EF4444"
                    strokeWidth={2}
                    dot={{ r: 3 }}
                    activeDot={{ r: 5 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Department Cost Analysis */}
          <div
            onClick={() => handleCardClick("departments")}
            className="p-4 sm:p-6 bg-white rounded-2xl shadow-sm border border-gray-100 cursor-pointer hover:shadow-lg transition-all duration-300 group"
          >
            <div className="flex items-center justify-between mb-6">
              <h2 className="flex items-center text-lg font-bold text-gray-800">
                <div className="p-2 bg-primary/10 rounded-lg mr-3 group-hover:bg-primary/20 transition-colors">
                  <DollarSign size={20} className="text-primary" />
                </div>
                Department Cost
              </h2>
            </div>
            <div className="h-64 sm:h-80">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={isDepartmentDataEmpty ? [{ name: 'No Data', value: 1 }] : departmentCostData}
                    dataKey={isDepartmentDataEmpty ? "value" : "cost"}
                    nameKey="name"
                    cx="50%"
                    cy="50%"
                    innerRadius="50%"
                    outerRadius="80%"
                    paddingAngle={isDepartmentDataEmpty ? 0 : 5}
                    label={isDepartmentDataEmpty ? undefined : ({ percent }) => `${(percent * 100).toFixed(0)}%`}
                    labelLine={false}
                  >
                    {isDepartmentDataEmpty ? (
                      <Cell key="cell-empty" fill="#F3F4F6" strokeWidth={0} />
                    ) : (
                      departmentCostData.map((_, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} strokeWidth={0} />
                      ))
                    )}
                  </Pie>
                  {!isDepartmentDataEmpty && (
                    <Tooltip
                      contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)' }}
                      formatter={(value: number) => `₹${value.toLocaleString("en-IN")}`}
                    />
                  )}
                  <Legend
                    iconType="circle"
                    wrapperStyle={{ fontSize: '12px' }}
                    payload={
                      isDepartmentDataEmpty && departmentCostData.length > 0
                        ? departmentCostData.map((item: any, index: number) => ({
                          id: item.name,
                          type: "circle",
                          value: `${item.name}`,
                          color: COLORS[index % COLORS.length]
                        }))
                        : undefined
                    }
                  />
                  {isDepartmentDataEmpty && (
                    <text x="50%" y="50%" textAnchor="middle" dominantBaseline="middle" className="fill-gray-400 text-sm font-medium">
                      No Data Found
                    </text>
                  )}
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Task Status Distribution (Replaces Temperature) */}
          <div
            onClick={() => handleCardClick("all_tasks")}
            className="p-4 sm:p-6 bg-white rounded-2xl shadow-sm border border-gray-100 cursor-pointer hover:shadow-lg transition-all duration-300 group"
          >
            <div className="flex items-center justify-between mb-6">
              <h2 className="flex items-center text-lg font-bold text-gray-800">
                <div className="p-2 bg-primary/10 rounded-lg mr-3 group-hover:bg-primary/20 transition-colors">
                  <Activity size={20} className="text-primary" />
                </div>
                Task Status
              </h2>
            </div>
            <div className="h-64 sm:h-80">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={taskStatusData}
                    dataKey="value"
                    nameKey="name"
                    cx="50%"
                    cy="50%"
                    outerRadius="80%"
                    label={({ value }) => `${value}`}
                    labelLine={false}
                  >
                    {taskStatusData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} strokeWidth={2} stroke="#fff" />
                    ))}
                  </Pie>
                  <Tooltip contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)' }} />
                  <Legend iconType="circle" wrapperStyle={{ fontSize: '12px' }} />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Frequent Repairs */}
          <div
            onClick={() => handleCardClick("repairs")}
            className="p-4 sm:p-6 bg-white rounded-2xl shadow-sm border border-gray-100 cursor-pointer hover:shadow-lg transition-all duration-300 group"
          >
            <div className="flex items-center justify-between mb-6">
              <h2 className="flex items-center text-lg font-bold text-gray-800">
                <div className="p-2 bg-primary/10 rounded-lg mr-3 group-hover:bg-primary/20 transition-colors">
                  <Wrench size={20} className="text-primary" />
                </div>
                Frequent Repairs
              </h2>
              <span className="hidden sm:inline-block text-xs font-medium text-gray-400 bg-gray-50 px-2 py-1 rounded-md">Top 5 Machines</span>
            </div>
            <div className="h-64 sm:h-80 flex flex-col justify-between">
              <div className="flex-1">
                <ResponsiveContainer width="100%" height="100%">
                  {isRepairsDataEmpty ? (
                    <div className="w-full h-full flex flex-col items-center justify-center text-gray-400 bg-gray-50/50 rounded-lg border border-dashed border-gray-200">
                      <Wrench size={48} className="mb-2 opacity-20" />
                      <p className="text-sm font-medium">No Repairs Recorded</p>
                    </div>
                  ) : (
                    <BarChart data={frequentRepairData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E5E7EB" />
                      <XAxis
                        dataKey="name"
                        axisLine={false}
                        tickLine={false}
                        tick={{ fill: '#4B5563', fontSize: 11, fontWeight: 500 }}
                        dy={10}
                        tickFormatter={(value) => value.length > 8 ? `${value.substring(0, 8)}...` : value}
                        interval={0}
                      />
                      <YAxis axisLine={false} tickLine={false} tick={{ fill: '#4B5563', fontSize: 11 }} allowDecimals={false} />
                      <Tooltip
                        cursor={{ fill: '#F3F4F6' }}
                        contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)' }}
                      />
                      <Bar dataKey="repairs" name="Number of Repairs" fill="#EF4444" radius={[4, 4, 0, 0]} barSize={40} />
                    </BarChart>
                  )}
                </ResponsiveContainer>
              </div>
            </div>
          </div>
        </div>

        {/* Success Modal */}
        {isModalOpen && (
          <div className="fixed inset-0 z-50 flex justify-center items-center bg-black/30 backdrop-blur-sm">
            <div className="p-6 mx-4 w-full max-w-sm text-center bg-white rounded-2xl shadow-2xl border border-green-100 transform transition-all scale-100">
              <div className="flex justify-center mb-4">
                <div className="p-3 bg-green-100 rounded-full">
                  <CheckCircle size={32} className="text-green-600" />
                </div>
              </div>
              <h3 className="text-xl font-bold text-gray-800 mb-2">Login Successful!</h3>
              <p className="text-gray-500">Welcome back to MaintenancePro.</p>
            </div>
          </div>
        )}

        {/* Detail Modal */}
        {selectedCard && (
          <div
            className="fixed inset-0 z-50 flex justify-center items-center bg-black/40 backdrop-blur-sm p-4 animate-in fade-in duration-200"
            onClick={closeModal}
          >
            <div
              className="bg-white rounded-2xl shadow-2xl w-full max-w-5xl max-h-[90vh] overflow-hidden flex flex-col"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex justify-between items-center p-6 border-b border-gray-100 bg-gray-50/50">
                <h2 className="text-xl font-bold text-gray-800 flex items-center gap-2">
                  {selectedCard === "machines" && <BarChart2 size={24} className="text-primary" />}
                  {selectedCard === "departments" && <DollarSign size={24} className="text-primary" />}
                  {selectedCard === "task_list" && <Activity size={24} className="text-primary" />}
                  {selectedCard === "checklist_list" && <Activity size={24} className="text-primary" />}
                  {selectedCard === "repairs" && <Wrench size={24} className="text-primary" />}
                  {modalTitle}
                </h2>
                <button
                  onClick={closeModal}
                  className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-full transition-colors"
                >
                  <X size={24} />
                </button>
              </div>

              <div className="p-6 space-y-4 overflow-y-auto flex-1">
                <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
                  <div className="flex gap-2 w-full sm:w-auto">
                    {/* Machine Filter Dropdown */}
                    <div className="relative w-full sm:w-64">
                      <select
                        value={selectedMachine}
                        onChange={(e) => {
                          setSelectedMachine(e.target.value);
                          setCurrentPage(1);
                        }}
                        className="w-full pl-4 pr-10 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all appearance-none cursor-pointer text-gray-700 truncate"
                      >
                        <option value="all">All Machines</option>
                        {machines.map((m) => (
                          <option key={m.id} value={m.name}>
                            {m.name}
                          </option>
                        ))}
                      </select>
                      <div className="absolute right-3 top-1/2 transform -translate-y-1/2 pointer-events-none text-gray-400">
                        <Wrench size={16} />
                      </div>
                    </div>

                    {/* Search Filter */}
                    <div className="relative w-full sm:w-64">
                      <Filter size={18} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                      <input
                        type="text"
                        placeholder="Search..."
                        value={filterValue === "all" ? "" : filterValue}
                        onChange={(e) => {
                          setFilterValue(e.target.value || "all");
                          setCurrentPage(1);
                        }}
                        className="w-full pl-10 pr-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
                      />
                    </div>
                  </div>
                </div>

                <div className="overflow-hidden border border-gray-200 rounded-xl shadow-sm relative min-h-[300px]">
                  {isTableLoading && (
                    <div className="absolute inset-0 bg-white/50 z-10 flex items-center justify-center backdrop-blur-sm">
                      <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-primary"></div>
                    </div>
                  )}
                  <div className="overflow-x-auto">
                    {renderTableContent(paginatedData)}
                  </div>
                </div>

                <div className="flex flex-col gap-4 pt-4">
                  <div className="flex justify-between items-center w-full text-sm">
                    <span className="text-gray-500">
                      Showing {paginatedData.length > 0 ? (currentPage - 1) * itemsPerPage + 1 : 0} to {(currentPage - 1) * itemsPerPage + paginatedData.length} of {isServerSide ? totalServerItems : allFilteredData.length} entries
                    </span>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                        disabled={currentPage === 1}
                        className="p-1 rounded-lg hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed text-gray-500 hover:text-gray-700 transition-colors"
                      >
                        <ChevronLeft size={20} />
                      </button>
                      <span className="font-medium text-gray-700 min-w-[3rem] text-center">
                        {currentPage} / {totalPages || 1}
                      </span>
                      <button
                        onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                        disabled={currentPage === totalPages || totalPages === 0}
                        className="p-1 rounded-lg hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed text-gray-500 hover:text-gray-700 transition-colors"
                      >
                        <ChevronRight size={20} />
                      </button>
                    </div>
                  </div>
                  <div className="flex justify-end">
                    <button
                      onClick={closeModal}
                      className="px-6 py-2.5 bg-gray-100 text-gray-700 font-medium rounded-xl hover:bg-gray-200 transition-colors"
                    >
                      Close View
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Dashboard;