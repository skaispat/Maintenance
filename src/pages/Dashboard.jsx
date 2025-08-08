import React, { useEffect, useState } from "react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line,
} from "recharts";
import {
  ArrowUpCircle,
  Clock,
  AlertTriangle,
  CheckCircle,
  Wrench,
  DollarSign,
  BarChart2,
  Calendar,
  ThermometerSun,
} from "lucide-react";
import axios from "axios";

// Mock data for dashboard
const repairVsPurchaseData = [
  { name: "HP-102", purchasePrice: 85000, repairCost: 12450 },
  { name: "CNC-305", purchasePrice: 120000, repairCost: 18700 },
  { name: "CB-201", purchasePrice: 45000, repairCost: 5200 },
  { name: "IM-405", purchasePrice: 95000, repairCost: 3450 },
  { name: "IO-103", purchasePrice: 72000, repairCost: 8900 },
];

const departmentCostData = [
  { name: "Manufacturing", cost: 24500 },
  { name: "Packaging", cost: 12800 },
  { name: "Production", cost: 18200 },
  { name: "Logistics", cost: 8900 },
];

const temperatureReadings = [
  { time: "08:00", HP102: 45, CNC305: 52, CB201: 48 },
  { time: "10:00", HP102: 47, CNC305: 54, CB201: 49 },
  { time: "12:00", HP102: 46, CNC305: 53, CB201: 50 },
  { time: "14:00", HP102: 48, CNC305: 55, CB201: 51 },
  { time: "16:00", HP102: 47, CNC305: 54, CB201: 49 },
];

const frequentRepairData = [
  { name: "CNC-305", repairs: 12 },
  { name: "HP-102", repairs: 8 },
  { name: "IO-103", repairs: 6 },
];

const Dashboard = () => {
  const [sheetDate, setSheetData] = useState([]);

  const SCRIPT_URL =
    "https://script.google.com/macros/s/AKfycbzWDU77ND7kYIIf__m_v3hlFv74-lF68mgSMjb0OadKnNU4XJFr74zAqnDQG0FARtjd/exec";
  const SHEET_NAME = "FormResponses";
  const SHEET_Id = "1lE5TdGcbmwVcVqbx-jftPIdmoGgg1DApNn4t9jZvGN8";

  const [loaderSheetData, setLoaderSheetData] = useState(false);
  const [loadingTasks, setLoadingTasks] = useState(false);
  const [maintenanceTasks, setMaintenanceTasks] = useState([]);
  const [repairTasks, setRepairTasks] = useState([]);
  const [totalMaintenanceTasksCompleted, setTotalMaintenanceTasksCompleted] =
    useState(0);
  const [totalMaintenanceTasksOverdue, setTotalMaintenanceTasksOverdue] =
    useState(0);
  const [totalRepairTasksCompleted, setTotalRepairTasksCompleted] = useState(0);
  const [totalRepairTasksOverdue, setTotalRepairTasksOverdue] = useState(0);
  const [repairCompletedTasks, setRepairCompletedTasks] = useState([]);
  const [maintenanceCompletedTasks, setMaintenanceCompletedTasks] = useState(
    []
  );

  // console.log("sheetData", sheetDate);
  console.log("repairCompletedTasks", repairCompletedTasks);
  console.log("maintenanceCompletedTasks", maintenanceCompletedTasks);
  // console.log("totalMaintenanceTasksCompleted", totalMaintenanceTasksCompleted);
  // console.log("totalRepairTasksCompleted", totalRepairTasksCompleted);

  const fetchSheetData = async () => {
    try {
      setLoaderSheetData(true);
      const res = await fetch(
        `${SCRIPT_URL}?sheetId=${SHEET_Id}&sheet=${SHEET_NAME}`
      );
      const result = await res.json();

      // console.log("data", result);

      if (result.success && result.table) {
        const headers = result.table.cols.map((col) => col.label); // Extract headers
        const rows = result.table.rows;

        // Transform rows into objects with key-value pairs
        const formattedRows = rows.map((rowObj) => {
          const row = rowObj.c;
          const rowData = {};
          row.forEach((cell, i) => {
            rowData[headers[i]] = cell.v; // you can also use `cell.f` if you want formatted version
          });
          return rowData;
        });

        setSheetData(formattedRows); // Set formatted data into state
      } else {
        console.error("Server error:", result.message || result.error);
      }
    } catch (err) {
      console.error("Fetch error:", err);
    } finally {
      setLoaderSheetData(false);
    }
  };

  useEffect(() => {
    fetchSheetData();
  }, []);

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

        // console.log( "formattedRepair", formattedRepair);

        setMaintenanceTasks(formattedMaintenance);
        setRepairTasks(formattedRepair);

        // Calculate total completed tasks
        const maintenanceCompleted = formattedMaintenance.filter(
          (task) => task["Actual Date"] !== ""
        );
        setTotalMaintenanceTasksCompleted(maintenanceCompleted.length);
        setMaintenanceCompletedTasks(maintenanceCompleted);

        const repairCompleted = formattedRepair.filter(
          (task) => task["Actual Date"] !== ""
        );
        setTotalRepairTasksCompleted(repairCompleted.length);
        setRepairCompletedTasks(repairCompleted);

        // Overdue tasks logic
        const today = new Date();
        const maintenanceOverdue = formattedMaintenance.filter((task) => {
          const dueDate = new Date(task["Due Date"]);
          return !task["Actual Date"] && dueDate < today;
        }).length;
        setTotalMaintenanceTasksOverdue(maintenanceOverdue);

        const repairOverdue = formattedRepair.filter((task) => {
          const dueDate = new Date(task["Due Date"]);
          return !task["Actual Date"] && dueDate < today;
        }).length;
        setTotalRepairTasksOverdue(repairOverdue);
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

  const getRepairVsPurchaseData = () => {
    // Create a map of machine names to their total repair costs
    const repairCostsByMachine = {};
    repairCompletedTasks.forEach((task) => {
      if (task["Serial No"] && task["Repair Cost"]) {
        const machineName = task["Serial No"];
        const repairCost = task["Repair Cost"] || 0;

        if (repairCostsByMachine[machineName]) {
          repairCostsByMachine[machineName] += repairCost;
        } else {
          repairCostsByMachine[machineName] = repairCost;
        }
      }
    });

    // Create a map of machine names to their total maintenance costs
    const maintenanceCostsByMachine = {};
    maintenanceCompletedTasks.forEach((task) => {
      if (task["Serial No"] && task["Maintenace Cost"]) {
        const machineName = task["Serial No"];
        const maintenanceCost = task["Maintenace Cost"] || 0;

        if (maintenanceCostsByMachine[machineName]) {
          maintenanceCostsByMachine[machineName] += maintenanceCost;
        } else {
          maintenanceCostsByMachine[machineName] = maintenanceCost;
        }
      }
    });

    // Find common machine names between both sets
    const commonMachineNames = Object.keys(repairCostsByMachine).filter(
      (name) => maintenanceCostsByMachine.hasOwnProperty(name)
    );

    // Create the final array with combined data
    return commonMachineNames.map((name) => ({
      name: name,
      maintenanceCost: maintenanceCostsByMachine[name],
      repairCost: repairCostsByMachine[name],
    }));
  };

  const repairVsPurchaseData = getRepairVsPurchaseData();
  // console.log("repairVsPurchaseData", repairVsPurchaseData);

  // First, create a map to accumulate costs by department
const departmentCostMap = {};

// Process repair tasks
repairCompletedTasks.forEach(task => {
  const department = task.Department;
  const cost = task['Repair Cost'] || 0;
  
  if (!departmentCostMap[department]) {
    departmentCostMap[department] = 0;
  }
  departmentCostMap[department] += cost;
});

// Process maintenance tasks
maintenanceCompletedTasks.forEach(task => {
  const department = task.Department;
  const cost = task['Maintenace Cost'] || 0; // Note the typo in the field name
  
  if (!departmentCostMap[department]) {
    departmentCostMap[department] = 0;
  }
  departmentCostMap[department] += cost;
});

// Convert the map to the desired array format
const departmentCostData = Object.keys(departmentCostMap).map(department => ({
  name: department,
  cost: departmentCostMap[department]
}));

// console.log('departmentCostData', departmentCostData);

// Initialize an object to store counts for each frequency type
const frequencyCounts = {
  "one-time": 0,
  "daily": 0,
  "weekly": 0,
  "monthly": 0,
  "quarterly": 0,
  "half-yearly": 0,
  "yearly": 0
};

// Count the occurrences of each frequency in maintenanceCompletedTasks
maintenanceCompletedTasks.forEach(task => {
  const frequency = task.Frequency;
  if (frequencyCounts.hasOwnProperty(frequency)) {
    frequencyCounts[frequency]++;
  }
});

// Convert to the desired array format
const frequentRepairData = Object.keys(frequencyCounts).map(frequency => ({
  name: frequency,
  repairs: frequencyCounts[frequency]
}));

console.log('frequencyData', frequentRepairData);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-800">Dashboard</h1>
        {/* <div className="flex space-x-2">
          <select className="px-4 py-2 bg-white border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500">
            <option value="thisMonth">This Month</option>
            <option value="lastMonth">Last Month</option>
            <option value="lastQuarter">Last Quarter</option>
            <option value="thisYear">This Year</option>
          </select>
        </div> */}
      </div>

      {/* Summary Stats for maintenance */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-6">
        <div className="bg-white rounded-xl shadow p-6 flex items-start">
          <div className="p-3 rounded-full bg-blue-100 mr-4">
            <Wrench size={24} className="text-blue-600" />
          </div>
          <div>
            <p className="text-sm text-gray-500 font-medium">Total Machines</p>
            <h3 className="text-2xl font-bold text-gray-800">
              {sheetDate?.length}
            </h3>
            {/* <p className="text-xs text-green-600 flex items-center mt-1">
              <ArrowUpCircle size={14} className="mr-1" />
              <span>+12 this month</span>
            </p> */}
          </div>
        </div>

        <div className="bg-white rounded-xl shadow p-6 flex items-start">
          <div className="p-3 rounded-full bg-indigo-100 mr-4">
            <Calendar size={24} className="text-indigo-600" />
          </div>
          <div>
            <p className="text-sm text-gray-500 font-medium">
              Total Maintenance Tasks
            </p>
            <h3 className="text-2xl font-bold text-gray-800">
              {maintenanceTasks?.length}
            </h3>
            {/* <p className="text-xs text-amber-600 flex items-center mt-1">
              <Clock size={14} className="mr-1" />
              <span>42 scheduled today</span>
            </p> */}
          </div>
        </div>

        <div className="bg-white rounded-xl shadow p-6 flex items-start">
          <div className="p-3 rounded-full bg-green-100 mr-4">
            <CheckCircle size={24} className="text-green-600" />
          </div>
          <div>
            <p className="text-sm text-gray-500 font-medium">
              Total Maintenance Tasks Complete
            </p>
            <h3 className="text-2xl font-bold text-gray-800">
              {totalMaintenanceTasksCompleted}
            </h3>
            {/* <p className="text-xs text-green-600 flex items-center mt-1">
              <ArrowUpCircle size={14} className="mr-1" />
              <span>+23% from last month</span>
            </p> */}
          </div>
        </div>

        <div className="bg-white rounded-xl shadow p-6 flex items-start">
          <div className="p-3 rounded-full bg-amber-100 mr-4">
            <Clock size={24} className="text-amber-600" />
          </div>
          <div>
            <p className="text-sm text-gray-500 font-medium">
              Total Maintenance Tasks Pending
            </p>
            <h3 className="text-2xl font-bold text-gray-800">
              {maintenanceTasks.length - totalMaintenanceTasksCompleted}
            </h3>
            {/* <p className="text-xs text-amber-600 flex items-center mt-1">
              <AlertTriangle size={14} className="mr-1" />
              <span>8 due today</span>
            </p> */}
          </div>
        </div>

        <div className="bg-white rounded-xl shadow p-6 flex items-start">
          <div className="p-3 rounded-full bg-red-100 mr-4">
            <AlertTriangle size={24} className="text-red-600" />
          </div>
          <div>
            <p className="text-sm text-gray-500 font-medium">
              Total Maintenance Tasks Overdue
            </p>
            <h3 className="text-2xl font-bold text-gray-800">
              {totalMaintenanceTasksOverdue}
            </h3>
            {/* <p className="text-xs text-red-600 flex items-center mt-1">
              <ArrowUpCircle size={14} className="mr-1 transform rotate-180" />
              <span>+5 this week</span>
            </p> */}
          </div>
        </div>

        <div className="bg-white rounded-xl shadow p-6 flex items-start">
          <div className="p-3 rounded-full bg-purple-100 mr-4">
            <DollarSign size={24} className="text-purple-600" />
          </div>
          <div>
            <p className="text-sm text-gray-500 font-medium">Total Cost</p>
            <h3 className="text-2xl font-bold text-gray-800">₹36,450</h3>
            {/* <p className="text-xs text-red-600 flex items-center mt-1">
              <ArrowUpCircle size={14} className="mr-1 transform rotate-180" />
              <span>-5% vs budget</span>
            </p> */}
          </div>
        </div>
      </div>

      {/* Summary Stats for repair */}
      {/* <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-6">
        
       
        <div className="bg-white rounded-xl shadow p-6 flex items-start">
          <div className="p-3 rounded-full bg-indigo-100 mr-4">
            <Calendar size={24} className="text-indigo-600" />
          </div>
          <div>
            <p className="text-sm text-gray-500 font-medium">
              Total Repair Tasks
            </p>
            <h3 className="text-2xl font-bold text-gray-800">{repairTasks?.length}</h3>
            <p className="text-xs text-amber-600 flex items-center mt-1">
              <Clock size={14} className="mr-1" />
              <span>42 scheduled today</span>
            </p>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow p-6 flex items-start">
          <div className="p-3 rounded-full bg-green-100 mr-4">
            <CheckCircle size={24} className="text-green-600" />
          </div>
          <div>
            <p className="text-sm text-gray-500 font-medium">Total Repair Tasks Complete</p>
            <h3 className="text-2xl font-bold text-gray-800">{totalRepairTasksCompleted}</h3>
            <p className="text-xs text-green-600 flex items-center mt-1">
              <ArrowUpCircle size={14} className="mr-1" />
              <span>+23% from last month</span>
            </p>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow p-6 flex items-start">
          <div className="p-3 rounded-full bg-amber-100 mr-4">
            <Clock size={24} className="text-amber-600" />
          </div>
          <div>
            <p className="text-sm text-gray-500 font-medium">Total Repair Tasks Pending</p>
            <h3 className="text-2xl font-bold text-gray-800">{repairTasks.length - totalMaintenanceTasksCompleted}</h3>
            <p className="text-xs text-amber-600 flex items-center mt-1">
              <AlertTriangle size={14} className="mr-1" />
              <span>8 due today</span>
            </p>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow p-6 flex items-start">
          <div className="p-3 rounded-full bg-red-100 mr-4">
            <AlertTriangle size={24} className="text-red-600" />
          </div>
          <div>
            <p className="text-sm text-gray-500 font-medium">Total Repair Tasks Overdue</p>
            <h3 className="text-2xl font-bold text-gray-800">{totalRepairTasksOverdue}</h3>
            <p className="text-xs text-red-600 flex items-center mt-1">
              <ArrowUpCircle size={14} className="mr-1 transform rotate-180" />
              <span>+5 this week</span>
            </p>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow p-6 flex items-start">
          <div className="p-3 rounded-full bg-purple-100 mr-4">
            <DollarSign size={24} className="text-purple-600" />
          </div>
          <div>
            <p className="text-sm text-gray-500 font-medium">Total Cost</p>
            <h3 className="text-2xl font-bold text-gray-800">₹36,450</h3>
            <p className="text-xs text-red-600 flex items-center mt-1">
              <ArrowUpCircle size={14} className="mr-1 transform rotate-180" />
              <span>-5% vs budget</span>
            </p>
          </div>
        </div>
      </div> */}

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-xl shadow p-6">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-lg font-bold text-gray-800 flex items-center">
              <BarChart2 size={20} className="mr-2 text-indigo-600" />
              Repair Cost vs Maintenance Cost
            </h2>
          </div>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={repairVsPurchaseData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip formatter={(value) => `₹${value.toLocaleString()}`} />
                <Legend />
                <Bar
                  dataKey="maintenanceCost"
                  name="Maintenance Cost"
                  fill="#4F46E5"
                />
                <Bar dataKey="repairCost" name="Repair Cost" fill="#F59E0B" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow p-6">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-lg font-bold text-gray-800 flex items-center">
              <DollarSign size={20} className="mr-2 text-indigo-600" />
              Department Cost Analysis
            </h2>
          </div>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={departmentCostData}
                  dataKey="cost"
                  nameKey="name"
                  cx="50%"
                  cy="50%"
                  outerRadius={100}
                  label={({ name, percent }) =>
                    `${name} ${(percent * 100).toFixed(0)}%`
                  }
                >
                  {departmentCostData.map((entry, index) => (
                    <Cell
                      key={`cell-${index}`}
                      fill={
                        ["#4F46E5", "#60A5FA", "#F59E0B", "#10B981"][index % 4]
                      }
                    />
                  ))}
                </Pie>
                <Tooltip formatter={(value) => `₹${value.toLocaleString()}`} />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow p-6">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-lg font-bold text-gray-800 flex items-center">
              <ThermometerSun size={20} className="mr-2 text-indigo-600" />
              Temperature Readings
            </h2>
          </div>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={temperatureReadings}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="time" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Line
                  type="monotone"
                  dataKey="HP102"
                  name="HP-102"
                  stroke="#4F46E5"
                />
                <Line
                  type="monotone"
                  dataKey="CNC305"
                  name="CNC-305"
                  stroke="#F59E0B"
                />
                <Line
                  type="monotone"
                  dataKey="CB201"
                  name="CB-201"
                  stroke="#10B981"
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow p-6">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-lg font-bold text-gray-800 flex items-center">
              <Wrench size={20} className="mr-2 text-indigo-600" />
              Frequent Repairs
            </h2>
          </div>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={frequentRepairData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Bar
                  dataKey="repairs"
                  name="Number of Repairs"
                  fill="#EF4444"
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Recent Activity */}
      {/* <div className="bg-white rounded-xl shadow p-6">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-lg font-bold text-gray-800">
            Recent Maintenance Activities
          </h2>
          <button className="text-indigo-600 hover:text-indigo-800 text-sm font-medium">
            View All
          </button>
        </div>
        <div className="space-y-4">
          {[1, 2, 3, 4, 5].map((item) => (
            <div
              key={item}
              className="flex items-start pb-4 border-b border-gray-100"
            >
              <div className="h-10 w-10 rounded-full bg-blue-100 flex items-center justify-center mr-3 flex-shrink-0">
                <Wrench size={20} className="text-blue-600" />
              </div>
              <div className="flex-1">
                <div className="flex justify-between">
                  <p className="text-sm font-medium text-gray-900">
                    Hydraulic Press #HP-{item + 100} Maintenance
                  </p>
                  <span className="text-xs text-gray-500">2h ago</span>
                </div>
                <p className="text-sm text-gray-500 mt-1">
                  Scheduled maintenance completed by John Doe
                </p>
                <div className="mt-2 flex items-center">
                  <span className="px-2 py-1 text-xs rounded-full bg-green-100 text-green-800">
                    Completed
                  </span>
                  <span className="ml-2 text-xs text-gray-500">Cost: ₹420</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div> */}
    </div>
  );
};

export default Dashboard;
