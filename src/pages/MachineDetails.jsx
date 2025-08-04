import React, { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import {
  ChevronLeft,
  Calendar,
  DollarSign,
  Wrench,
  AlertTriangle,
  CheckCircle,
  FileText,
  Edit,
  Trash2,
  Plus,
  BarChart3,
  Clock,
  User,
  ArrowLeft,
  Thermometer,
} from "lucide-react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  LineChart,
  Line,
} from "recharts";
import axios from "axios";
import { set } from "date-fns";

const MachineDetails = ({ machine, goBack }) => {
  // const { id } = useParams();
  // const [machine] = useState(mockMachine);
  const [activeTab, setActiveTab] = useState("overview");
  const [historyMaitenenceTasks, setHistoryMaitenenceTasks] = useState([]);
  const [historyRepairTasks, setHistoryRepairTasks] = useState([]);
  const [nextMaintenanceDate, setNextMaintenanceDate] = useState(null);
  const [nextRepairDate, setNextRepairDate] = useState(null);
  const [totalMaintenanceCost, setTotalMaintenanceCost] = useState(0);
  const [totalRepairCost, setTotalRepairCost] = useState(0);
  const [totalRepairPurchasePrise, setTotalRepairPurchasePrise] = useState(0);
  const [totalMaintenancePurchasePrise, setTotalMaintenancePurchasePrise] = useState(0);
  const [maintenanceCount, setMaintenanceCount] = useState(0);
  const [repairCount, setRepairCount] = useState(0);
  const [metainanceHealthScore, setMetainanceHealthScore] = useState(0);
  const [repairHealthScore, setRepairHealthScore] = useState(0);
  const [temperatureGraphData, setTemperatureGraphData] = useState([]);
  const [percentRepairToPurchase, setPercentRepairToPurchase] = useState(0);
  const [percentMaintenanceToPurchase, setPercentMaintenanceToPurchase] = useState(0);

  // console.log("historyMaitenenceTasks", historyMaitenenceTasks);
  // console.log("historyRepairTasks", historyRepairTasks);
  // console.log("nextMaintenanceDate",nextMaintenanceDate);

  const { serialNo } = useParams();
  // const [machine, setMachine] = useState(null);
  const [loadingTasks, setLoadingTasks] = useState(false);

  // console.log("serialNo", serialNo);

  const SCRIPT_URL =
    "https://script.google.com/macros/s/AKfycbyh7M7DroVDTtqVFYm0NbkIvN_QBAZOydgsvAxVZJRP8Lj76yZp2MW_P_vW0_LbrxPTaA/exec";
  const SHEET_Id = "1VLbt33JSLW2M9Sq5sLSJD9hlAqDRzrOVP2SMcsj4K9U";

  const fetchMaintenceTasks = async () => {
    setLoadingTasks(true);
    try {
      const HistoryData = await axios.get(
        `${SCRIPT_URL}?sheetId=${SHEET_Id}&sheet=Maitenance%20Task%20Assign`
      );

      // console.log("histr", HistoryData);

      const formattedHistoryData = formatSheetData(
        HistoryData?.data?.table
      ).filter((task) => task["Serial No"] === machine["Serial No"]);

      const taskStartDates = formattedHistoryData
        .map((task) => new Date(task["Task Start Date"]).toLocaleDateString())
        .filter((date) => !!date);

      const temperatureData = formattedHistoryData.map(
        (task) => task["Temperature Status"]
      );

      const temperatureGraphData = taskStartDates.map((date, index) => ({
        time: date,
        temp: Number(temperatureData[index]) || 0, // fallback to 0 if empty or invalid
      }));

      // console.log("temperatureGraphData", temperatureGraphData);

      setTemperatureGraphData(temperatureGraphData);

      // filter tasks for the current machine
      const filteredTasks = formattedHistoryData.filter(
        (task) => task["Actual Date"] !== ""
      );

      setHistoryMaitenenceTasks(filteredTasks);

      


      // total purchase prise
      const totalPriseCost = filteredTasks.reduce((sum, task) => {
        const cost = parseFloat(task["Purchase Price"]) || 0;
        return sum + cost;
      }, 0);

      setTotalMaintenancePurchasePrise(totalPriseCost);

      

      // for next maintenance date
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const upcomingTask = filteredTasks.find((task) => {
        const dateOnlyStr = task["Task Start Date"].split(" ")[0];
        const taskDate = new Date(dateOnlyStr);
        return taskDate > today;
      });

      // console.log("upcomingTask", upcomingTask);
      setNextMaintenanceDate(upcomingTask);

      // total maintenance cost
      const totalCost = filteredTasks.reduce((sum, task) => {
        const cost = parseFloat(task["Maintenace Cost"]) || 0;
        return sum + cost;
      }, 0);

      // console.log("totalCost", totalCost);
      setTotalMaintenanceCost(totalCost);


      // percentage of maintenance cost to purchase price
      const maintenanceToPurchaseRatio = (totalCost * 100) / totalPriseCost;
      setPercentMaintenanceToPurchase(maintenanceToPurchaseRatio);

      //  for Maintenance count
      const maintenanceCount = filteredTasks.length;
      setMaintenanceCount(maintenanceCount);

      // for maintenance health score
      const healthScore = Math.floor(
        (filteredTasks.length * 100) / formattedHistoryData.length
      );
      setMetainanceHealthScore(healthScore);
    } catch (error) {
      console.error("Error fetching tasks:", error);
    } finally {
      setLoadingTasks(false);
    }
  };

  const fetchRepairTasks = async () => {
    setLoadingTasks(true);
    try {
      const HistoryData = await axios.get(
        `${SCRIPT_URL}?sheetId=${SHEET_Id}&sheet=Repair%20Task%20Assign`
      );

      // console.log("histr", HistoryData);

      const formattedHistoryData = formatSheetData(
        HistoryData?.data?.table
      ).filter((task) => task["Serial No"] === machine["Serial No"]);

      // console.log("formattedHistoryData", formattedHistoryData);

      // Filter tasks for the current machine
      const filteredTasks = formattedHistoryData.filter(
        (task) => task["Actual Date"] !== ""
      );

      setHistoryRepairTasks(filteredTasks);

      // for next repair date
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const upcomingTask = filteredTasks.find((task) => {
        const dateOnlyStr = task["Task Start Date"].split(" ")[0];
        const taskDate = new Date(dateOnlyStr);
        return taskDate > today;
      });

      // console.log("upcomingTask", upcomingTask);
      setNextRepairDate(upcomingTask);

      // total repair cost
      const totalCost = filteredTasks.reduce((sum, task) => {
        const cost = parseFloat(task["Repair Cost"]) || 0;
        return sum + cost;
      }, 0);

      // console.log("totalCost", totalCost);
      setTotalRepairCost(totalCost);

      // total purchase prise
      const totalPriseCost = filteredTasks.reduce((sum, task) => {
        const cost = parseFloat(task["Purchase Price"]) || 0;
        return sum + cost;
      }, 0);

      setTotalRepairPurchasePrise(totalPriseCost);

      // percentage of repair cost to purchase price
      const repairToPurchaseRatio = (totalCost * 100) / totalPriseCost;
      setPercentRepairToPurchase(repairToPurchaseRatio);

      //  for Maintenance count
      const maintenanceCount = filteredTasks.length;
      setRepairCount(maintenanceCount);

      // for repair health score
      console.log("formattedHistoryData.length", formattedHistoryData.length);
      console.log("fillteredTasks.length", filteredTasks.length);

      const healthScore = Math.floor(
        (filteredTasks.length * 100) / formattedHistoryData.length
      );
      setRepairHealthScore(healthScore);
    } catch (error) {
      console.error("Error fetching tasks:", error);
    } finally {
      setLoadingTasks(false);
    }
  };

  useEffect(() => {
    fetchMaintenceTasks();
    fetchRepairTasks();
  }, []);

  const getMonthlyRepairCosts = () => {
    const monthlyCosts = {};

    historyRepairTasks.forEach((task) => {
      if (task["Actual Date"] && task["Repair Cost"]) {
        const date = new Date(task["Actual Date"]);
        const month = date.toLocaleString("default", { month: "short" });
        const year = date.getFullYear();
        const monthYear = `${month}-${year}`;

        if (monthlyCosts[monthYear]) {
          monthlyCosts[monthYear] += task["Repair Cost"];
        } else {
          monthlyCosts[monthYear] = task["Repair Cost"];
        }
      }
    });

    // Convert to array format for the chart
    return Object.keys(monthlyCosts).map((monthYear) => ({
      month: monthYear,
      cost: monthlyCosts[monthYear],
    }));
  };


  const getMonthlyMaintenanceCosts = () => {
    const monthlyCosts = {};

    historyMaitenenceTasks.forEach((task) => {
      if (task["Actual Date"] && task["Maintenace Cost"]) {
        const date = new Date(task["Actual Date"]);
        const month = date.toLocaleString("default", { month: "short" });
        const year = date.getFullYear();
        const monthYear = `${month}-${year}`;

        if (monthlyCosts[monthYear]) {
          monthlyCosts[monthYear] += task["Maintenace Cost"];
        } else {
          monthlyCosts[monthYear] = task["Maintenace Cost"];
        }
      }
    });

    // Convert to array format for the chart
    return Object.keys(monthlyCosts).map((monthYear) => ({
      month: monthYear,
      cost: monthlyCosts[monthYear],
    }));
  };

  const monthlyRepairCosts = getMonthlyRepairCosts();
  const monthlyMaintenanceCosts = getMonthlyMaintenanceCosts(); // Assuming same function for maintenance

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

  const formatSheetData = (sheetData) => {
    const columns = sheetData.cols.map((col) => col?.label);
    const rows = sheetData?.rows;

    return rows.map((row) => {
      const obj = {};
      row.c.forEach((cell, i) => {
        obj[columns[i]] = cell?.v || ""; // Use raw value (not formatted version)
      });
      return obj;
    });
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case "operational":
        return (
          <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-green-100 text-green-800">
            <CheckCircle size={16} className="mr-1" />
            Operational
          </span>
        );
      case "maintenance":
        return (
          <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-blue-100 text-blue-800">
            <Wrench size={16} className="mr-1" />
            Maintenance
          </span>
        );
      case "repair":
        return (
          <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-amber-100 text-amber-800">
            <AlertTriangle size={16} className="mr-1" />
            Repair
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-gray-100 text-gray-800">
            Unknown
          </span>
        );
    }
  };

  const getHealthIndicator = (score) => {
    let color = "";
    if (score >= 90) color = "bg-green-500";
    else if (score >= 70) color = "bg-blue-500";
    else if (score >= 50) color = "bg-amber-500";
    else color = "bg-red-500";

    return (
      <div className="flex items-center">
        <div className={`w-3 h-3 rounded-full ${color} mr-2`}></div>
        <span className="font-medium">{score}%</span>
      </div>
    );
  };

  // console.log("machine",machine)

  return (
    <div className="space-y-6">
      <div className="flex items-center mb-6 gap-3">
        <button
          onClick={goBack}
          className="text-indigo-600 hover:text-indigo-800 flex items-center space-x-2"
        >
          <ArrowLeft size={18} />
          <span>Back to Machines</span>
        </button>
        <h1 className="text-2xl font-bold text-gray-800 flex-1">
          {machine["Machine Name"]}
        </h1>
        {/* <div className="flex items-center space-x-2">
          {getStatusBadge(machine?.status)}
          <button className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50">
            <Edit size={16} className="mr-2" />
            Edit
          </button>
        </div> */}
      </div>

      {/* Machine Overview Cards */}

      {activeTab === "maintenance" && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="p-3 rounded-full bg-blue-100 mr-4">
                <Calendar size={24} className="text-blue-600" />
              </div>
              <div>
                <p className="text-sm text-gray-500 font-medium">
                  Next Maintenance
                </p>
                <h3 className="text-lg font-bold text-gray-800">
                  {nextMaintenanceDate?.["Task Start Date"]?.split("T")[0] ||
                    "No upcoming maintenance"}
                </h3>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="p-3 rounded-full bg-green-100 mr-4">
                <DollarSign size={24} className="text-green-600" />
              </div>
              <div>
                <p className="text-sm text-gray-500 font-medium">
                  Total Maintenance Cost
                </p>
                <h3 className="text-lg font-bold text-gray-800">
                  ₹{totalMaintenanceCost || 0}
                </h3>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="p-3 rounded-full bg-amber-100 mr-4">
                <Wrench size={24} className="text-amber-600" />
              </div>
              <div>
                <p className="text-sm text-gray-500 font-medium">
                  Maintenance Count
                </p>
                <h3 className="text-lg font-bold text-gray-800">
                  {maintenanceCount || 0}
                </h3>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="p-3 rounded-full bg-purple-100 mr-4">
                <BarChart3 size={24} className="text-purple-600" />
              </div>
              <div>
                <p className="text-sm text-gray-500 font-medium">
                  Maintenance Health Score
                </p>
                <h3 className="text-lg font-bold text-gray-800">
                  {metainanceHealthScore}
                </h3>
              </div>
            </div>
          </div>
        </div>
      )}

      {activeTab === "repair" && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="p-3 rounded-full bg-blue-100 mr-4">
                <Calendar size={24} className="text-blue-600" />
              </div>
              <div>
                <p className="text-sm text-gray-500 font-medium">Next Repair</p>
                <h3 className="text-lg font-bold text-gray-800">
                  {nextRepairDate?.["Task Start Date"]?.split("T")[0] ||
                    "No upcoming maintenance"}
                </h3>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="p-3 rounded-full bg-green-100 mr-4">
                <DollarSign size={24} className="text-green-600" />
              </div>
              <div>
                <p className="text-sm text-gray-500 font-medium">
                  Total Repair Cost
                </p>
                <h3 className="text-lg font-bold text-gray-800">
                  ₹{totalRepairCost || 0}
                </h3>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="p-3 rounded-full bg-amber-100 mr-4">
                <Wrench size={24} className="text-amber-600" />
              </div>
              <div>
                <p className="text-sm text-gray-500 font-medium">
                  Repair Count
                </p>
                <h3 className="text-lg font-bold text-gray-800">
                  {repairCount || 0}
                </h3>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="p-3 rounded-full bg-purple-100 mr-4">
                <BarChart3 size={24} className="text-purple-600" />
              </div>
              <div>
                <p className="text-sm text-gray-500 font-medium">
                  Health Score
                </p>
                <h3 className="text-lg font-bold text-gray-800">
                  {repairHealthScore}%
                </h3>
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="bg-white rounded-lg shadow overflow-hidden">
        {/* Tabs */}
        <div className="border-b border-gray-200">
          <nav className="flex -mb-px">
            <button
              className={`py-4 px-6 font-medium text-sm border-b-2 ${
                activeTab === "overview"
                  ? "border-indigo-500 text-indigo-600"
                  : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
              }`}
              onClick={() => setActiveTab("overview")}
            >
              <FileText size={16} className="inline mr-2" />
              Overview
            </button>
            <button
              className={`py-4 px-6 font-medium text-sm border-b-2 ${
                activeTab === "maintenance"
                  ? "border-indigo-500 text-indigo-600"
                  : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
              }`}
              onClick={() => setActiveTab("maintenance")}
            >
              <Wrench size={16} className="inline mr-2" />
              Maintenance History
            </button>

            <button
              className={`py-4 px-6 font-medium text-sm border-b-2 ${
                activeTab === "repair"
                  ? "border-indigo-500 text-indigo-600"
                  : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
              }`}
              onClick={() => setActiveTab("repair")}
            >
              <Wrench size={16} className="inline mr-2" />
              Repair History
            </button>

            <button
              className={`py-4 px-6 font-medium text-sm border-b-2 ${
                activeTab === "repair analytics"
                  ? "border-indigo-500 text-indigo-600"
                  : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
              }`}
              onClick={() => setActiveTab("repair analytics")}
            >
              <BarChart3 size={16} className="inline mr-2" />
              Repair Analytics
            </button>

            <button
              className={`py-4 px-6 font-medium text-sm border-b-2 ${
                activeTab === "maintenance analytics"
                  ? "border-indigo-500 text-indigo-600"
                  : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
              }`}
              onClick={() => setActiveTab("maintenance analytics")}
            >
              <BarChart3 size={16} className="inline mr-2" />
              Maintenance Analytics
            </button>
          </nav>
        </div>

        {/* Tab Content */}
        <div className="p-6">

          {activeTab === "overview" && (
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <h3 className="text-lg font-medium mb-4">
                    Machine Information
                  </h3>
                  <div className="space-y-3">
                    <div className="flex gap-10">
                      <span className="text-gray-500">Serial Number:</span>
                      <span className="font-medium">
                        {machine?.["Serial No"]}
                      </span>
                    </div>
                    <div className="flex gap-10">
                      <span className="text-gray-500">Model:</span>
                      <span className="font-medium">
                        {machine?.["Model No"]}
                      </span>
                    </div>
                    <div className="flex gap-10">
                      <span className="text-gray-500">Manufacturer:</span>
                      <span className="font-medium">
                        {machine?.Manufacturer}
                      </span>
                    </div>
                    <div className="flex gap-10">
                      <span className="text-gray-500">Department:</span>
                      <span className="font-medium">{machine?.Department}</span>
                    </div>
                    <div className="flex gap-10">
                      <span className="text-gray-500">Location:</span>
                      <span className="font-medium">{machine?.Location}</span>
                    </div>
                  </div>
                </div>

                <div>
                  <h3 className="text-lg font-medium mb-4">Purchase Details</h3>
                  <div className="space-y-3">
                    <div className="flex gap-10">
                      <span className="text-gray-500">Purchase Date:</span>
                      <span className="font-medium">
                        {new Date(
                          machine?.["Purchase Date"]
                        ).toLocaleDateString()}
                      </span>
                    </div>
                    <div className="flex gap-10">
                      <span className="text-gray-500">Purchase Price:</span>
                      <span className="font-medium">
                        ₹{machine?.["Purchase Price"]?.toLocaleString()}
                      </span>
                    </div>
                    <div className="flex gap-10">
                      <span className="text-gray-500">Vendor:</span>
                      <span className="font-medium">{machine?.Vendor}</span>
                    </div>
                    <div className="flex gap-10">
                      <span className="text-gray-500">Warranty Expires:</span>
                      <span className="font-medium">
                        {new Date(
                          machine?.["Warranty Expiration"]
                        ).toLocaleDateString()}
                      </span>
                    </div>
                    <div className="flex gap-10">
                      <span className="text-gray-500">Last Maintenance:</span>
                      <span className="font-medium">
                        {new Date(
                          machine?.["Initial Maintenance Date"]
                        ).toLocaleDateString()}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              <div className="mt-8">
                <h3 className="text-lg font-medium mb-4 flex items-center">
                  <Thermometer size={20} className="mr-2 text-indigo-600" />
                  Latest Temperature Readings
                </h3>
                <div className="bg-white p-4 rounded-lg border border-gray-200">
                  <div className="h-64">
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart data={temperatureGraphData}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="time" />
                        <YAxis domain={[0, 50]} />
                        <Tooltip />
                        <Legend />
                        <Line
                          type="monotone"
                          dataKey="temp"
                          name="Temperature (°C)"
                          stroke="#4F46E5"
                          strokeWidth={2}
                          dot={{ r: 4 }}
                          activeDot={{ r: 6 }}
                        />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === "maintenance" && (
            <div>
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-lg font-medium">Maintenance History</h3>
                <Link
                  to="/assign-task"
                  className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700"
                >
                  <Plus size={16} className="mr-2" />
                  Schedule Maintenance
                </Link>
              </div>

              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Date
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Type
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Technician
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Cost
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Status
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {historyMaitenenceTasks
                      .filter(
                        (task) => task["Serial No"] === machine["Serial No"]
                      )
                      .map((record) => (
                        <tr
                          key={record["Task No"]}
                          className="hover:bg-gray-50"
                        >
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            {new Date(
                              record["Task Start Date"]
                            ).toLocaleDateString()}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            {record["Task Type"]}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            <div className="flex items-center">
                              <User size={16} className="text-gray-400 mr-2" />
                              {record["Doer Name"]}
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            {record["Maintenace Cost"]}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                              <CheckCircle size={12} className="mr-1" />
                              {record?.status}
                            </span>
                          </td>
                        </tr>
                      ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {activeTab === "repair" && (
            <div>
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-lg font-medium">Repair History</h3>
                <Link
                  to="/assign-task"
                  className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700"
                >
                  <Plus size={16} className="mr-2" />
                  Schedule Maintenance
                </Link>
              </div>

              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Date
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Type
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Technician
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Cost
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Status
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {historyRepairTasks.map((record) => (
                      <tr key={record.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {new Date(
                            record["Task Start Date"]
                          ).toLocaleDateString()}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {record["Task Type"]}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          <div className="flex items-center">
                            <User size={16} className="text-gray-400 mr-2" />
                            {record["Doer Name"]}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          ₹{record["Repair Cost"]?.toLocaleString()}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                            <CheckCircle size={12} className="mr-1" />
                            {record?.status}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {activeTab === "repair analytics" && (
            <div className="space-y-6">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="bg-white border border-gray-200 rounded-lg p-6">
                  <h3 className="text-lg font-medium mb-4">
                    Monthly Repair Costs
                  </h3>
                  <div className="h-80">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={monthlyRepairCosts}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="month" />
                        <YAxis />
                        <Tooltip
                          formatter={(value) => `₹${value.toLocaleString()}`}
                        />
                        <Legend />
                        <Bar dataKey="cost" name="Cost" fill="#4F46E5" />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </div>

                <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                  <h3 className="text-lg font-medium mb-4 flex items-center">
                    <DollarSign size={20} className="mr-2 text-indigo-600" />
                    Cost Analysis
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="bg-gray-50 rounded-lg p-4 flex flex-col items-center justify-center">
                      <p className="text-sm text-gray-500 mb-2">
                        Total Purchase Price
                      </p>
                      <p className="text-2xl font-bold text-gray-800">
                        ${totalRepairPurchasePrise}
                      </p>
                    </div>
                    <div className="bg-gray-50 rounded-lg p-4 flex flex-col items-center justify-center">
                      <p className="text-sm text-gray-500 mb-2">
                        Total Repair Cost
                      </p>
                      <p className="text-2xl font-bold text-gray-800">
                        ${totalRepairCost}
                      </p>
                    </div>
                    <div className="bg-gray-50 rounded-lg p-4 flex flex-col items-center justify-center col-span-2">
                      <p className="text-sm text-gray-500 mb-2">
                        Repair to Purchase Ratio
                      </p>
                      <p className="text-2xl font-bold text-gray-800">
                        {percentRepairToPurchase.toFixed(3)}%
                      </p>
                      <div className="w-full mt-2 bg-gray-200 rounded-full h-2.5">
                        <div
                          className={`h-2.5 rounded-full ${
                            percentRepairToPurchase < 10
                              ? "bg-green-500"
                              : percentRepairToPurchase < 20
                              ? "bg-blue-500"
                              : percentRepairToPurchase < 30
                              ? "bg-amber-500"
                              : "bg-red-500"
                          }`}
                          style={{
                            width: `${Math.min(percentRepairToPurchase, 100)}%`,
                          }}
                        ></div>
                      </div>
                      <p className="mt-2 text-xs text-gray-500">
                        {percentRepairToPurchase < 10
                          ? "Excellent value - low maintenance costs"
                          : percentRepairToPurchase < 20
                          ? "Good value - reasonable maintenance costs"
                          : percentRepairToPurchase < 30
                          ? "Fair value - increasing maintenance costs"
                          : "Poor value - high maintenance costs, consider replacement"}
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              <div className="bg-white border border-gray-200 rounded-lg p-6">
                <h3 className="text-lg font-medium mb-4">
                  Key Performance Indicators
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div className="text-center">
                    <div className="text-3xl font-bold text-green-600">
                      94.5%
                    </div>
                    <div className="text-sm text-gray-500">
                      Average Efficiency
                    </div>
                  </div>
                  <div className="text-center">
                    <div className="text-3xl font-bold text-blue-600">
                      3.3 hrs
                    </div>
                    <div className="text-sm text-gray-500">
                      Average Monthly Downtime
                    </div>
                  </div>
                  <div className="text-center">
                    <div className="text-3xl font-bold text-purple-600">
                      ₹4,520
                    </div>
                    <div className="text-sm text-gray-500">
                      Average Monthly Cost
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}


          {activeTab === "maintenance analytics" && (
            <div className="space-y-6">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="bg-white border border-gray-200 rounded-lg p-6">
                  <h3 className="text-lg font-medium mb-4">
                    Monthly Maintenance Costs
                  </h3>
                  <div className="h-80">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={monthlyMaintenanceCosts}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="month" />
                        <YAxis />
                        <Tooltip
                          formatter={(value) => `₹${value.toLocaleString()}`}
                        />
                        <Legend />
                        <Bar dataKey="cost" name="Cost" fill="#4F46E5" />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </div>

                <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                  <h3 className="text-lg font-medium mb-4 flex items-center">
                    <DollarSign size={20} className="mr-2 text-indigo-600" />
                    Cost Analysis
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="bg-gray-50 rounded-lg p-4 flex flex-col items-center justify-center">
                      <p className="text-sm text-gray-500 mb-2">
                        Total Purchase Price
                      </p>
                      <p className="text-2xl font-bold text-gray-800">
                        ${totalMaintenancePurchasePrise}
                      </p>
                    </div>
                    <div className="bg-gray-50 rounded-lg p-4 flex flex-col items-center justify-center">
                      <p className="text-sm text-gray-500 mb-2">
                        Total Repair Cost
                      </p>
                      <p className="text-2xl font-bold text-gray-800">
                        ${totalRepairCost}
                      </p>
                    </div>
                    <div className="bg-gray-50 rounded-lg p-4 flex flex-col items-center justify-center col-span-2">
                      <p className="text-sm text-gray-500 mb-2">
                        Repair to Purchase Ratio
                      </p>
                      <p className="text-2xl font-bold text-gray-800">
                        {percentMaintenanceToPurchase.toFixed(3)}%
                      </p>
                      <div className="w-full mt-2 bg-gray-200 rounded-full h-2.5">
                        <div
                          className={`h-2.5 rounded-full ${
                            percentMaintenanceToPurchase < 10
                              ? "bg-green-500"
                              : percentMaintenanceToPurchase < 20
                              ? "bg-blue-500"
                              : percentMaintenanceToPurchase < 30
                              ? "bg-amber-500"
                              : "bg-red-500"
                          }`}
                          style={{
                            width: `${Math.min(percentMaintenanceToPurchase, 100)}%`,
                          }}
                        ></div>
                      </div>
                      <p className="mt-2 text-xs text-gray-500">
                        {percentMaintenanceToPurchase < 10
                          ? "Excellent value - low maintenance costs"
                          : percentMaintenanceToPurchase < 20
                          ? "Good value - reasonable maintenance costs"
                          : percentMaintenanceToPurchase < 30
                          ? "Fair value - increasing maintenance costs"
                          : "Poor value - high maintenance costs, consider replacement"}
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              <div className="bg-white border border-gray-200 rounded-lg p-6">
                <h3 className="text-lg font-medium mb-4">
                  Key Performance Indicators
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div className="text-center">
                    <div className="text-3xl font-bold text-green-600">
                      94.5%
                    </div>
                    <div className="text-sm text-gray-500">
                      Average Efficiency
                    </div>
                  </div>
                  <div className="text-center">
                    <div className="text-3xl font-bold text-blue-600">
                      3.3 hrs
                    </div>
                    <div className="text-sm text-gray-500">
                      Average Monthly Downtime
                    </div>
                  </div>
                  <div className="text-center">
                    <div className="text-3xl font-bold text-purple-600">
                      ₹4,520
                    </div>
                    <div className="text-sm text-gray-500">
                      Average Monthly Cost
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

        </div>
      </div>
    </div>
  );
};

export default MachineDetails;
