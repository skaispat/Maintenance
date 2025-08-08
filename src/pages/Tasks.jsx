import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import useAuthStore from "../store/authStore";
import {
  Search,
  Filter,
  Plus,
  CheckCircle,
  Clock,
  AlertTriangle,
  ArrowUp,
  ArrowDown,
  FileText,
  UserCircle,
} from "lucide-react";
import axios from "axios";

// Mock data for tasks
const mockTasks = [
  {
    id: 1,
    machineId: 1,
    machineName: "Hydraulic Press HP-102",
    department: "Manufacturing",
    type: "Quarterly Maintenance",
    status: "pending",
    dueDate: "2024-03-15",
    assignedTo: "John Smith",
    priority: "medium",
    location: "On-site",
    description:
      "Perform quarterly maintenance check on hydraulic press components and fluid levels.",
  },
  {
    id: 2,
    machineId: 3,
    machineName: "Conveyor Belt CB-201",
    department: "Packaging",
    type: "Repair",
    status: "completed",
    dueDate: "2024-03-05",
    completedDate: "2024-03-05",
    assignedTo: "Sarah Johnson",
    priority: "high",
    location: "On-site",
    description: "Replace worn-out belt segments and alignment check.",
    cost: {
      labor: 350,
      parts: 1200,
      vendor: 0,
      total: 1550,
    },
  },
  {
    id: 3,
    machineId: 2,
    machineName: "CNC Machine CNC-305",
    department: "Manufacturing",
    type: "Off-site Service",
    status: "in-progress",
    dueDate: "2024-03-22",
    assignedTo: "External Vendor",
    priority: "high",
    location: "Off-site",
    vendor: "Precision Machines Inc.",
    description: "Send control unit for recalibration and firmware update.",
    estimatedCost: 2800,
  },
  {
    id: 4,
    machineId: 5,
    machineName: "Industrial Oven IO-103",
    department: "Production",
    type: "Monthly Maintenance",
    status: "pending",
    dueDate: "2024-03-20",
    assignedTo: "Mike Anderson",
    priority: "low",
    location: "On-site",
    description: "Check temperature sensors and verify calibration.",
  },
  {
    id: 5,
    machineId: 4,
    machineName: "Injection Molder IM-405",
    department: "Manufacturing",
    type: "Emergency Repair",
    status: "overdue",
    dueDate: "2024-03-01",
    assignedTo: "Emily Clark",
    priority: "critical",
    location: "On-site",
    description:
      "Investigate hydraulic pressure loss and repair affected components.",
  },
];

const mockRepairTasks = [
  {
    id: 101,
    machineId: 10,
    machineName: "Cooling System CS-501",
    department: "Cooling",
    type: "Emergency Repair",
    status: "completed",
    dueDate: "2024-02-10",
    completedDate: "2024-02-11",
    assignedTo: "Paul Rees",
    priority: "high",
    location: "On-site",
    description: "Replace coolant pump and test pressure system.",
  },
  {
    id: 102,
    machineId: 11,
    machineName: "Pumping Unit PU-307",
    department: "Hydraulics",
    type: "Repair",
    status: "pending",
    dueDate: "2024-03-28",
    assignedTo: "Alice Morgan",
    priority: "medium",
    location: "Off-site",
    description: "Investigate noise issue and repair faulty valve.",
  },
];

const Tasks = () => {
  const { user } = useAuthStore();
  const [searchTerm, setSearchTerm] = useState("");
  const [sortColumn, setSortColumn] = useState("dueDate");
  const [sortDirection, setSortDirection] = useState("asc");
  const [selectedDepartment, setSelectedDepartment] = useState("all");
  const [selectedStatus, setSelectedStatus] = useState("all");
  const [selectedLocation, setSelectedLocation] = useState("all");
  const [maintenanceTasks, setMaintenanceTasks] = useState([]);
  const [repairTasks, setRepairTasks] = useState([]);

  const [activeTab, setActiveTab] = useState("maintenance");

  const [loadingTasks, setLoadingTasks] = useState(false);

  // console.log("maintenanceTasks", maintenanceTasks);
  // console.log("repairTasks", repairTasks);

  const SCRIPT_URL =
    "https://script.google.com/macros/s/AKfycbzWDU77ND7kYIIf__m_v3hlFv74-lF68mgSMjb0OadKnNU4XJFr74zAqnDQG0FARtjd/exec";
  const SHEET_Id = "1lE5TdGcbmwVcVqbx-jftPIdmoGgg1DApNn4t9jZvGN8";

  useEffect(() => {
    const fetchTasks = async () => {
      setLoadingTasks(true);
      try {
        const [maintenanceRes, repairRes] = await Promise.all([
          axios.get(
            `${SCRIPT_URL}?sheetId=${SHEET_Id}&sheet=Maitenance%20Task%20Assign`
          ),
          axios.get(
            `${SCRIPT_URL}?sheetId=${SHEET_Id}&sheet=Repair%20Task%20Assign`
          ),
        ]);

        const formattedMaintenance = formatSheetData(maintenanceRes.data.table);
        const formattedRepair = formatSheetData(repairRes.data.table);

        setMaintenanceTasks(
          getFirstPendingOrLatestCompletedPerMachine(formattedMaintenance)
        );
        setRepairTasks(
          getFirstPendingOrLatestCompletedPerMachine(formattedRepair)
        );
      } catch (error) {
        console.error("Error fetching tasks:", error);
      } finally {
        setLoadingTasks(false);
      }
    };

    fetchTasks();
  }, []);

  const formatSheetData = (sheetData) => {
    const columns = sheetData.cols.map((col) => col.label);
    const rows = sheetData.rows;

    return rows.map((row) => {
      const obj = {};
      row.c.forEach((cell, i) => {
        obj[columns[i]] = cell?.v || ""; // Use raw value (not formatted version)
      });
      return obj;
    });
  };

  const handleSort = (column) => {
    if (sortColumn === column) {
      setSortDirection(sortDirection === "asc" ? "desc" : "asc");
    } else {
      setSortColumn(column);
      setSortDirection("asc");
    }
  };

  const rawTasks = activeTab === "maintenance" ? maintenanceTasks : repairTasks;

  const filteredTasks = rawTasks.filter((task) => {
    console.log("task", task);
    const departmentMatch =
      selectedDepartment === "all" ||
      task["Department"]?.toLowerCase() === selectedDepartment.toLowerCase();

    const searchMatch =
      task["Machine Name"]?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      task["Task Type"]?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      task["Serial No"]?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      task["Priority"]?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      task["Department"]?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      task["Doer Name"]?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      task["Location"]
        ?.toString()
        .toLowerCase()
        .includes(searchTerm.toLowerCase());

    return departmentMatch && searchMatch;
  });

  const getFirstPendingOrLatestCompletedPerMachine = (tasks) => {
    const machineMap = new Map();

    tasks.forEach((task) => {
      const machineName = task["Machine Name"];
      const actualDate = task["Actual Date"];

      if (!machineMap.has(machineName)) {
        if (!actualDate) {
          // If not completed (pending), keep the first pending
          machineMap.set(machineName, task);
        } else {
          // Temporarily store the first completed
          machineMap.set(machineName, { ...task, __isCompleted: true });
        }
      } else {
        const existing = machineMap.get(machineName);

        // If we already have a pending one, skip
        if (!existing["Actual Date"]) return;

        // If existing is completed but current is pending, replace it
        if (actualDate === "") {
          machineMap.set(machineName, task);
        }
      }
    });

    return Array.from(machineMap.values());
  };

  

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-800">Maintenance Tasks</h1>
        {/* <button className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500">
          <Plus size={16} className="mr-2" />
          Create Task
        </button> */}
      </div>

      {/* Filter and Search */}
      <div className="bg-white p-4 rounded-lg shadow flex flex-col md:flex-row md:items-center md:justify-between space-y-4 md:space-y-0 md:space-x-4">
        <div className="flex flex-1 max-w-md">
          <div className="relative w-full">
            <input
              type="text"
              placeholder="Search tasks..."
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
            <Search
              size={20}
              className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400"
            />
          </div>
        </div>
        <div className="flex flex-wrap gap-2">
          <div className="flex items-center space-x-2">
            <Filter size={16} className="text-gray-500" />
            <select
              className="border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              value={selectedDepartment}
              onChange={(e) => setSelectedDepartment(e.target.value)}
            >
              <option value="all">All Departments</option>
              <option value="Manufacturing">Manufacturing</option>
              <option value="Packaging">Packaging</option>
              <option value="Production">Production</option>
            </select>
          </div>
        </div>
      </div>

      <div className="flex space-x-4 mb-4">
        <button
          className={`px-4 py-2 rounded-md ${
            activeTab === "maintenance"
              ? "bg-indigo-600 text-white"
              : "bg-gray-200 text-gray-700"
          }`}
          onClick={() => setActiveTab("maintenance")}
        >
          Maintenance
        </button>
        <button
          className={`px-4 py-2 rounded-md ${
            activeTab === "repair"
              ? "bg-indigo-600 text-white"
              : "bg-gray-200 text-gray-700"
          }`}
          onClick={() => setActiveTab("repair")}
        >
          Repair
        </button>
      </div>

      {/* Task List */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200 ">
            {/* Table heading - fixed */}
            <thead className="bg-gray-50 table w-full">
              <tr className="table-fixed w-full">
                <th
                  scope="col"
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer"
                  onClick={() => handleSort("machineName")}
                >
                  <div className="flex items-center">
                    Machine & Task
                    {sortColumn === "machineName" &&
                      (sortDirection === "asc" ? (
                        <ArrowUp size={14} className="ml-1" />
                      ) : (
                        <ArrowDown size={14} className="ml-1" />
                      ))}
                  </div>
                </th>

                <th
                  scope="col"
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer"
                  onClick={() => handleSort("serialNo")}
                >
                  <div className="flex items-center">
                    Serial No
                    {sortColumn === "serialNo" &&
                      (sortDirection === "asc" ? (
                        <ArrowUp size={14} className="ml-1" />
                      ) : (
                        <ArrowDown size={14} className="ml-1" />
                      ))}
                  </div>
                </th>

                <th
                  scope="col"
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer"
                  onClick={() => handleSort("department")}
                >
                  <div className="flex items-center">
                    Department
                    {sortColumn === "department" &&
                      (sortDirection === "asc" ? (
                        <ArrowUp size={14} className="ml-1" />
                      ) : (
                        <ArrowDown size={14} className="ml-1" />
                      ))}
                  </div>
                </th>

                <th
                  scope="col"
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                >
                  Priority
                </th>

                <th
                  scope="col"
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer"
                  onClick={() => handleSort("assignedTo")}
                >
                  <div className="flex items-center">
                    Assigned To
                    {sortColumn === "assignedTo" &&
                      (sortDirection === "asc" ? (
                        <ArrowUp size={14} className="ml-1" />
                      ) : (
                        <ArrowDown size={14} className="ml-1" />
                      ))}
                  </div>
                </th>

                <th
                  scope="col"
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                >
                  Location
                </th>

                <th
                  scope="col"
                  className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider"
                >
                  Actions
                </th>
              </tr>
            </thead>

            {/* Table body with scroll */}
            <tbody className="bg-white divide-y divide-gray-200 block overflow-auto max-h-[400px] w-full">
              {filteredTasks.map((task) => (
                <tr
                  key={task["SN-2025/laptop/001"]}
                  className="hover:bg-gray-50 table table-fixed w-full"
                >
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-gray-900">
                      {task["Machine Name"]}
                    </div>
                    <div className="text-xs text-gray-500 mt-1">
                      {task["Task Type"]}
                    </div>
                  </td>

                  <td className="px-6 py-4 whitespace-nowrap text-center">
                    <div className="text-sm text-gray-900">
                      {task["Serial No"]}
                    </div>
                  </td>

                  <td className="px-6 py-4 whitespace-nowrap text-center">
                    <div className="text-sm text-gray-900">
                      {task["Department"]}
                    </div>
                  </td>

                  <td className="px-6 py-4 whitespace-nowrap text-center">
                    <div className="flex flex-col space-y-1">
                      {task["Priority"]}
                    </div>
                  </td>

                  <td className="px-6 py-4 whitespace-nowrap text-center">
                    <div className="flex items-center">
                      <UserCircle size={20} className="text-gray-400 mr-2" />
                      <span className="text-sm text-gray-900">
                        {task["Doer Name"]}
                      </span>
                    </div>
                  </td>

                  <td className="px-6 py-4 whitespace-nowrap text-center">
                    <div className="text-sm text-gray-900">
                      {task["Location"]}
                    </div>
                    {task.vendor && (
                      <div className="text-xs text-gray-500">{task.vendor}</div>
                    )}
                  </td>

                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <div className="flex justify-end space-x-2">
                      <Link
                        to={`/tasks/${encodeURIComponent(
                          task["Task No"]
                        )}/${encodeURIComponent(task["Serial No"])}/${encodeURIComponent(task["Task Type"])}`}
                        className="text-indigo-600 hover:text-indigo-900 p-1 rounded hover:bg-indigo-50"
                      >
                        <FileText size={18} />
                      </Link>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {loadingTasks ? (
          <div className="flex justify-center py-8 flex-col items-center text-gray-600 text-sm">
            <div className="w-6 h-6 border-4 border-blue-500 border-dashed rounded-full animate-spin mb-2"></div>
            Loading tasks...
          </div>
        ) : filteredTasks.length === 0 ? (
          <div className="px-6 py-12 text-center">
            <p className="text-gray-500">
              No tasks found matching your criteria.
            </p>
          </div>
        ) : null}
      </div>
    </div>
  );
};

export default Tasks;
