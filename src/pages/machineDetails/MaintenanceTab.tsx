import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { User, CheckCircle, Calendar, Clock, AlertTriangle } from "lucide-react";
import { MachineDetails, MaintenanceTask } from "../../models/machineDetailsExtended";
import EditTaskModal from "./EditTaskModal";

interface MaintenanceTabProps {
  machine: MachineDetails;
}

const MaintenanceTab: React.FC<MaintenanceTabProps> = ({ machine }) => {
  console.log("MaintenanceTab received machine data:", machine);
  const navigate = useNavigate();
  const [selectedTask, setSelectedTask] = useState<MaintenanceTask | null>(null);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);

  const handleScheduleMaintenance = () => {
    navigate(`/assign-task?machineId=${machine.id}`);
  };

  const handleView = (taskId: number) => {
    navigate(`/tasks/m-${taskId}`);
  };

  const handleEdit = (task: MaintenanceTask) => {
    setSelectedTask(task);
    setIsEditModalOpen(true);
  };

  const handleTaskUpdated = (updatedTask: MaintenanceTask) => {
    // Ideally we would trigger a refetch here or update local state
    // For now, we'll just reload to simulate a refresh, or we could update the local machine state if we had a setter
    console.log("Task updated:", updatedTask);
    window.location.reload();
  };

  const getTaskStatusBadge = (status: string) => {
    switch (status) {
      case "completed":
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
            <CheckCircle size={12} className="mr-1" />
            Completed
          </span>
        );
      case "scheduled":
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
            <Calendar size={12} className="mr-1" />
            Scheduled
          </span>
        );
      case "in-progress":
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-purple-100 text-purple-800">
            <Clock size={12} className="mr-1" />
            In Progress
          </span>
        );
      case "overdue":
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-primary/10 text-primary">
            <AlertTriangle size={12} className="mr-1" />
            Overdue
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
            Unknown
          </span>
        );
    }
  };

  // Helper function to safely format dates
  const formatDate = (dateString: string | undefined) => {
    if (!dateString) return 'N/A';
    try {
      return new Date(dateString).toLocaleDateString('en-GB');
    } catch (error) {
      console.error('Error formatting date:', error);
      return 'Invalid Date';
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-medium">Maintenance Schedule</h3>
        <button
          onClick={handleScheduleMaintenance}
          className="inline-flex items-center px-4 py-2 text-sm font-medium text-white bg-primary rounded-md border border-transparent shadow-sm hover:bg-primary-dark focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary"
        >
          Schedule Maintenance
        </button>
      </div>

      {/* Maintenance tasks table */}
      <div className="overflow-hidden bg-white rounded-lg border border-gray-200 shadow-sm">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-xs font-medium tracking-wider text-left text-gray-500 uppercase">Task</th>
              <th className="px-6 py-3 text-xs font-medium tracking-wider text-left text-gray-500 uppercase">Type</th>
              <th className="px-6 py-3 text-xs font-medium tracking-wider text-left text-gray-500 uppercase">Due Date</th>
              <th className="px-6 py-3 text-xs font-medium tracking-wider text-left text-gray-500 uppercase">Status</th>
              <th className="px-6 py-3 text-xs font-medium tracking-wider text-left text-gray-500 uppercase">Assigned To</th>
              <th className="px-6 py-3 text-xs font-medium tracking-wider text-right text-gray-500 uppercase">Actions</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {Array.isArray(machine.maintenanceTasks) && machine.maintenanceTasks.map((task: MaintenanceTask) => (
              <tr key={task.id} className="hover:bg-gray-50">
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm font-medium text-gray-900">{task.title}</div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm text-gray-500">{task.type}</div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm text-gray-900">
                    {formatDate(task.dueDate)}
                  </div>
                  {task.completedDate && (
                    <div className="text-xs text-green-600">
                      Completed: {formatDate(task.completedDate)}
                    </div>
                  )}
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  {getTaskStatusBadge(task.status)}
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="flex items-center">
                    <User size={16} className="mr-2 text-gray-400" />
                    <span className="text-sm text-gray-900">{task.assignedTo}</span>
                  </div>
                </td>
                <td className="px-6 py-4 text-sm font-medium text-right whitespace-nowrap">
                  <button
                    onClick={() => handleView(task.id)}
                    className="mr-3 text-primary hover:text-primary-dark"
                  >
                    View
                  </button>
                  <button
                    onClick={() => handleEdit(task)}
                    className="text-primary hover:text-primary-dark"
                  >
                    Edit
                  </button>
                </td>
              </tr>
            ))}
            {(!Array.isArray(machine.maintenanceTasks) || machine.maintenanceTasks.length === 0) && (
              <tr>
                <td colSpan={6} className="px-6 py-4 text-center text-gray-500">
                  No maintenance tasks scheduled
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Maintenance Checklist */}
      <div className="mt-8">
        <h3 className="mb-4 text-lg font-medium">Standard Maintenance Checklist</h3>
        <div className="p-4 bg-white rounded-lg border border-gray-200 shadow-sm">
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            {/* Checklist sections - keep your existing checklist content */}
            <div>
              <h4 className="mb-2 font-medium text-gray-700">Mechanical Components</h4>
              <ul className="space-y-2">
                <li className="flex items-center">
                  <CheckCircle size={16} className="mr-2 text-green-500" />
                  <span>Inspect all moving parts for wear</span>
                </li>
                <li className="flex items-center">
                  <CheckCircle size={16} className="mr-2 text-green-500" />
                  <span>Check lubrication levels</span>
                </li>
                <li className="flex items-center">
                  <CheckCircle size={16} className="mr-2 text-gray-300" />
                  <span>Verify belt tension</span>
                </li>
                <li className="flex items-center">
                  <CheckCircle size={16} className="mr-2 text-gray-300" />
                  <span>Inspect bearings for noise/heat</span>
                </li>
              </ul>
            </div>
            <div>
              <h4 className="mb-2 font-medium text-gray-700">Electrical System</h4>
              <ul className="space-y-2">
                <li className="flex items-center">
                  <CheckCircle size={16} className="mr-2 text-green-500" />
                  <span>Check control panel connections</span>
                </li>
                <li className="flex items-center">
                  <CheckCircle size={16} className="mr-2 text-gray-300" />
                  <span>Inspect motor cables</span>
                </li>
                <li className="flex items-center">
                  <CheckCircle size={16} className="mr-2 text-gray-300" />
                  <span>Test emergency stop functionality</span>
                </li>
                <li className="flex items-center">
                  <CheckCircle size={16} className="mr-2 text-gray-300" />
                  <span>Clean cooling fans and filters</span>
                </li>
              </ul>
            </div>
          </div>
        </div>
      </div>

      {selectedTask && (
        <EditTaskModal
          isOpen={isEditModalOpen}
          onClose={() => setIsEditModalOpen(false)}
          task={selectedTask}
          machineId={machine.id}
          onTaskUpdated={handleTaskUpdated}
        />
      )}
    </div>
  );
};

export default MaintenanceTab;