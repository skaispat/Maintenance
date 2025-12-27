import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { fetchPendingApprovalItems, updateChecklistItemStatus } from "../services/machineService";
import {
  CheckCircle,
  Clock,
  ThumbsUp,
  XCircle,
  Eye,
  ArrowUp,
  ArrowDown,
  Loader
} from "lucide-react";
import { toast } from "react-hot-toast";

// Mock tasks removed


const AdminApproval = () => {
  const navigate = useNavigate();
  const [tasks, setTasks] = useState<any[]>([]);
  const [selectedTaskIds, setSelectedTaskIds] = useState<number[]>([]);
  const [activeTab, setActiveTab] = useState("Pending");
  const [sortColumn, setSortColumn] = useState("id");
  const [sortDirection, setSortDirection] = useState("asc");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadTasks();
  }, []);

  const loadTasks = async () => {
    setLoading(true);
    const data = await fetchPendingApprovalItems();
    const mappedTasks = data.map((t: any) => ({
      id: t.id,
      taskNo: t.task_no,
      department: t.department || t.maintenance?.machines?.department || "Unknown",
      description: t.description,
      taskStatus: t.status === 'completed' ? 'Pending' : t.status.charAt(0).toUpperCase() + t.status.slice(1),
      image: t.image_url,
      remarks: t.remarks,
      soundOfMachine: t.sound_of_machine || "N/A",
      temperature: t.temperature || "N/A",
      maintenanceCost: t.maintenance_cost || 0,
      machineName: t.maintenance?.machines?.name || "Unknown Machine",
      maintenanceId: t.maintenance?.id,
      type: 'Checklist Item'
    }));
    setTasks(mappedTasks);
    setLoading(false);
  };

  const filteredTasks = tasks
    .filter((task) => {
      if (activeTab === "Pending") {
        return task.taskStatus === "Pending";
      }
      return task.taskStatus === "Approved" || task.taskStatus === "Rejected";
    })
    .sort((a, b) => {
      const aValue = a[sortColumn];
      const bValue = b[sortColumn];

      if (typeof aValue === "number" && typeof bValue === "number") {
        return sortDirection === "asc" ? aValue - bValue : bValue - aValue;
      }
      if (typeof aValue === "string" && typeof bValue === "string") {
        return sortDirection === "asc"
          ? aValue.localeCompare(bValue)
          : bValue.localeCompare(aValue);
      }
      return 0;
    });

  const handleSelectTask = (taskId: number) => {
    setSelectedTaskIds((prev) =>
      prev.includes(taskId)
        ? prev.filter((id) => id !== taskId)
        : [...prev, taskId]
    );
  };

  const handleSelectAll = () => {
    if (selectedTaskIds.length === filteredTasks.length) {
      setSelectedTaskIds([]);
    } else {
      setSelectedTaskIds(filteredTasks.map((task) => task.id));
    }
  };

  const handleApproveSelected = async () => {
    if (selectedTaskIds.length === 0) {
      toast.error("Please select at least one task to approve.");
      return;
    }

    // Optimistic update
    setTasks((prevTasks) =>
      prevTasks.map((task) =>
        selectedTaskIds.includes(task.id) && task.taskStatus === "Pending"
          ? { ...task, taskStatus: "Approved" }
          : task
      )
    );

    try {
      await Promise.all(selectedTaskIds.map(id =>
        updateChecklistItemStatus(id, 'approved')
      ));
      toast.success("Tasks approved successfully");
    } catch (error) {
      console.error("Error approving tasks:", error);
      toast.error("Failed to approve tasks");
      loadTasks(); // Revert on error
    }

    setSelectedTaskIds([]);
  };

  const handleRejectSelected = async () => {
    if (selectedTaskIds.length === 0) {
      toast.error("Please select at least one task to reject.");
      return;
    }

    // Optimistic update
    setTasks((prevTasks) =>
      prevTasks.map((task) =>
        selectedTaskIds.includes(task.id) && task.taskStatus === "Pending"
          ? { ...task, taskStatus: "Rejected" }
          : task
      )
    );

    try {
      await Promise.all(selectedTaskIds.map(id =>
        updateChecklistItemStatus(id, 'rejected')
      ));
      toast.success("Tasks rejected successfully");
    } catch (error) {
      console.error("Error rejecting tasks:", error);
      toast.error("Failed to reject tasks");
      loadTasks();
    }

    setSelectedTaskIds([]);
  };

  const handleSort = (column) => {
    if (sortColumn === column) {
      setSortDirection(sortDirection === "asc" ? "desc" : "asc");
    } else {
      setSortColumn(column);
      setSortDirection("asc");
    }
  };

  const getSortIcon = (column) => {
    if (sortColumn === column) {
      return sortDirection === "asc" ? (
        <ArrowUp size={14} className="ml-1" />
      ) : (
        <ArrowDown size={14} className="ml-1" />
      );
    }
    return null;
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case "Pending":
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-amber-100 text-amber-800">
            <Clock size={12} className="mr-1" />
            Pending
          </span>
        );
      case "Approved":
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
            <CheckCircle size={12} className="mr-1" />
            Approved
          </span>
        );
      case "Rejected":
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-primary/10 text-primary">
            <XCircle size={12} className="mr-1" />
            Rejected
          </span>
        );
      default:
        return null;
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex justify-center items-center">
        <Loader className="w-8 h-8 text-primary animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="space-y-4 md:space-y-6 p-4 md:p-6 max-w-7xl mx-auto">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <h1 className="text-2xl md:text-3xl font-bold text-gray-800">
            Admin Approval & Cross Verification
          </h1>

          {activeTab === "Pending" && selectedTaskIds.length > 0 && (
            <div className="flex flex-row gap-2 sm:gap-3">
              <button
                onClick={handleApproveSelected}
                className="inline-flex items-center justify-center px-4 py-2 text-sm font-medium rounded-lg shadow-sm text-white bg-green-600 hover:bg-green-700 active:bg-green-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 transition-all"
              >
                <ThumbsUp size={16} className="mr-2" />
                Approve ({selectedTaskIds.length})
              </button>
              <button
                onClick={handleRejectSelected}
                className="inline-flex items-center justify-center px-4 py-2 text-sm font-medium rounded-lg shadow-sm text-white bg-primary hover:bg-primary-dark active:bg-primary focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary transition-all"
              >
                <XCircle size={16} className="mr-2" />
                Reject
              </button>
            </div>
          )}
        </div>

        {/* Tab Navigation and Actions */}
        <div className="flex flex-col space-y-4">
          <div className="flex space-x-2 w-full border-b border-gray-200">
            <button
              onClick={() => setActiveTab("Pending")}
              className={`flex-1 md:flex-none px-3 md:px-6 py-2.5 text-xs md:text-sm font-medium rounded-t-lg transition-all duration-150 ${activeTab === "Pending"
                ? "border-b-2 border-primary text-primary bg-primary/5"
                : "text-gray-500 hover:text-gray-700 hover:bg-gray-50"
                }`}
            >
              <span className="hidden sm:inline">Pending Approvals </span>
              <span className="sm:hidden">Pending </span>
              ({tasks.filter((t) => t.taskStatus === "Pending").length})
            </button>
            <button
              onClick={() => setActiveTab("History")}
              className={`flex-1 md:flex-none px-3 md:px-6 py-2.5 text-xs md:text-sm font-medium rounded-t-lg transition-all duration-150 ${activeTab === "History"
                ? "border-b-2 border-primary text-primary bg-primary/5"
                : "text-gray-500 hover:text-gray-700 hover:bg-gray-50"
                }`}
            >
              <span className="hidden sm:inline">History </span>
              <span className="sm:hidden">History </span>
              ({tasks.filter((t) => t.taskStatus !== "Pending").length})
            </button>
          </div>

          {activeTab === "Pending" && filteredTasks.length > 0 && (
            <div className="flex items-center px-4 py-2 bg-gray-100 rounded-lg">
              <input
                type="checkbox"
                className="w-4 h-4 text-primary border-gray-300 rounded focus:ring-primary"
                checked={selectedTaskIds.length === filteredTasks.length}
                onChange={handleSelectAll}
              />
              <label className="ml-3 text-sm text-gray-700 font-medium">
                Select All Tasks
              </label>
            </div>
          )}
        </div>

        {/* Desktop Table View */}
        <div className="hidden lg:block overflow-hidden bg-white rounded-lg shadow">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  {activeTab === "Pending" && (
                    <th
                      scope="col"
                      className="p-4 text-xs font-medium tracking-wider text-left text-gray-500 uppercase"
                    >
                      <input
                        type="checkbox"
                        className="w-4 h-4 text-primary border-gray-300 rounded focus:ring-primary"
                        checked={selectedTaskIds.length === filteredTasks.length && filteredTasks.length > 0}
                        onChange={handleSelectAll}
                        disabled={filteredTasks.length === 0}
                      />
                    </th>
                  )}
                  {[
                    { label: "Task No", key: "id" },
                    { label: "Department", key: "department" },
                    { label: "Description", key: "description" },
                    { label: "Status", key: "taskstatus" },
                    { label: "Machine", key: "machinename" },
                    { label: "Temperature", key: "temperature" },
                    { label: "Cost", key: "maintenancecost" },
                  ].map((header) => (
                    <th
                      key={header.key}
                      scope="col"
                      className="px-6 py-3 text-xs font-medium tracking-wider text-left text-gray-500 uppercase cursor-pointer hover:bg-gray-100"
                      onClick={() => handleSort(header.key)}
                    >
                      <div className="flex items-center">
                        {header.label}
                        {getSortIcon(header.key)}
                      </div>
                    </th>
                  ))}
                  <th
                    scope="col"
                    className="px-6 py-3 text-xs font-medium tracking-wider text-left text-gray-500 uppercase"
                  >
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredTasks.map((task) => (
                  <tr
                    key={task.id}
                    className={`hover:bg-gray-50 transition-colors ${selectedTaskIds.includes(task.id) && activeTab === "Pending"
                      ? "bg-primary/5"
                      : ""
                      }`}
                  >
                    {activeTab === "Pending" && (
                      <td className="p-4">
                        <input
                          type="checkbox"
                          className="w-4 h-4 text-primary border-gray-300 rounded focus:ring-primary"
                          checked={selectedTaskIds.includes(task.id)}
                          onChange={() => handleSelectTask(task.id)}
                        />
                      </td>
                    )}
                    <td className="px-6 py-4 text-sm font-medium text-gray-900 whitespace-nowrap">
                      {task.taskNo}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-500 whitespace-nowrap">
                      {task.department}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-900">
                      {task.description}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {getStatusBadge(task.taskStatus)}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-500 whitespace-nowrap">
                      {task.machineName}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-500 whitespace-nowrap">
                      {task.temperature}
                    </td>
                    <td className="px-6 py-4 text-sm font-semibold text-gray-700 whitespace-nowrap">
                      ₹{task.maintenanceCost.toFixed(2)}
                    </td>
                    <td className="px-6 py-4 text-sm font-medium whitespace-nowrap">
                      <button
                        onClick={() => navigate(`/tasks/m-${task.maintenanceId}`, { state: { initialTab: 'history' } })}
                        className="text-primary hover:text-primary-dark hover:underline"
                      >
                        View Details
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Mobile Card View */}
        <div className="lg:hidden space-y-4">
          {filteredTasks.map((task) => (
            <div
              key={task.id}
              className={`bg-white rounded-lg shadow-md overflow-hidden transition-all ${selectedTaskIds.includes(task.id) && activeTab === "Pending"
                ? "ring-2 ring-primary"
                : ""
                }`}
            >
              <div className="p-4 space-y-3">
                {/* Header with checkbox and status */}
                <div className="flex items-start justify-between">
                  <div className="flex items-start space-x-3">
                    {activeTab === "Pending" && (
                      <input
                        type="checkbox"
                        className="mt-1 w-5 h-5 text-primary border-gray-300 rounded focus:ring-primary"
                        checked={selectedTaskIds.includes(task.id)}
                        onChange={() => handleSelectTask(task.id)}
                      />
                    )}
                    <div>
                      <div className="text-xs text-gray-500 font-medium">Task #{task.taskNo}</div>
                      <div className="text-sm font-semibold text-gray-900 mt-0.5">
                        {task.machineName}
                      </div>
                    </div>
                  </div>
                  {getStatusBadge(task.taskStatus)}
                </div>

                {/* Department */}
                <div className="flex items-center text-sm">
                  <span className="text-gray-500 font-medium w-24">Department:</span>
                  <span className="text-gray-900">{task.department}</span>
                </div>

                {/* Description */}
                <div className="text-sm">
                  <span className="text-gray-500 font-medium">Description:</span>
                  <p className="text-gray-900 mt-1">{task.description}</p>
                </div>

                {/* Details Grid */}
                <div className="grid grid-cols-2 gap-3 pt-2 border-t border-gray-100">
                  <div>
                    <div className="text-xs text-gray-500 font-medium">Temperature</div>
                    <div className="text-sm text-gray-900 font-semibold mt-0.5">
                      {task.temperature}
                    </div>
                  </div>
                  <div>
                    <div className="text-xs text-gray-500 font-medium">Sound Level</div>
                    <div className="text-sm text-gray-900 font-semibold mt-0.5">
                      {task.soundOfMachine}
                    </div>
                  </div>
                </div>

                {/* Cost and Remarks */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-500 font-medium">Maintenance Cost:</span>
                    <span className="text-lg font-bold text-gray-900">
                      ₹{task.maintenanceCost.toFixed(2)}
                    </span>
                  </div>
                  <div className="text-xs text-gray-600 bg-gray-50 p-2 rounded">
                    <span className="font-medium">Remarks:</span> {task.remarks}
                  </div>
                </div>

                {/* Actions */}
                <div className="flex gap-2 pt-2">
                  <button
                    onClick={() => navigate(`/tasks/m-${task.maintenanceId}`, { state: { initialTab: 'history' } })}
                    className="flex-1 inline-flex items-center justify-center px-3 py-2 text-sm font-medium text-primary bg-primary/5 rounded-lg hover:bg-primary/10 active:bg-primary/20 transition-colors"
                  >
                    <Eye size={16} className="mr-1.5" />
                    View Details
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>

        {filteredTasks.length === 0 && (
          <div className="bg-white rounded-lg shadow p-12 text-center">
            <div className="text-gray-400 mb-4">
              <Clock size={48} className="mx-auto" />
            </div>
            <p className="text-gray-500 text-lg">
              No tasks found in the {activeTab} section.
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminApproval;