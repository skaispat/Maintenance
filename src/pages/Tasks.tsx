import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import useAuthStore from '../store/authStore';
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
  Loader,
  Edit,
  Trash2,
  X
} from 'lucide-react';
import {
  fetchAllTasks,
  deleteMaintenanceTask,
  updateMaintenanceRecord,
  updateRepairRecord
} from '../services/machineService';
import {
  updateMaintenanceTaskItem,
  fetchMaintenanceTaskItemsByMaintenanceId
} from '../services/maintenanceTaskService';
import { toast } from 'react-hot-toast';



const Tasks: React.FC = () => {
  const { user } = useAuthStore();
  const [tasks, setTasks] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [sortColumn, setSortColumn] = useState('dueDate');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');
  const [selectedDepartment, setSelectedDepartment] = useState('all');
  const [selectedMachine, setSelectedMachine] = useState('all');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  // Tab State
  const [activeTab, setActiveTab] = useState<'tasks' | 'manage'>('tasks');
  const [manageSelectedMachine, setManageSelectedMachine] = useState('');
  const [selectedMaintenanceId, setSelectedMaintenanceId] = useState<number | null>(null);
  const [maintenanceChecklistItems, setMaintenanceChecklistItems] = useState<any[]>([]); // Items for specific maintenance record
  const [editingTask, setEditingTask] = useState<any | null>(null);
  const [formData, setFormData] = useState<any>({});
  const [processingId, setProcessingId] = useState<string | null>(null);
  const [checklistPage, setChecklistPage] = useState(1);

  // Confirmation Modal State
  const [confirmationModal, setConfirmationModal] = useState<{
    isOpen: boolean;
    type: 'edit' | 'delete';
    title: string;
    message: React.ReactNode;
    onConfirm: () => void;
  }>({
    isOpen: false,
    type: 'edit',
    title: '',
    message: '',
    onConfirm: () => { }
  });
  const [manageMachineSearch, setManageMachineSearch] = useState('');
  // const [allMachines, setAllMachines] = useState<string[]>([]); // Removed: derived from tasks now

  useEffect(() => {
    const loadTasks = async () => {
      setLoading(true);
      const data = await fetchAllTasks();
      setTasks(data);
      setLoading(false);
    };
    loadTasks();
  }, []);

  // Reset page when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, selectedDepartment, selectedMachine]);

  // No longer needed to fetch all machines separately if we derive from tasks
  // But if tasks list is incomplete (e.g. pagination or filtering), we might miss some.
  // Assuming 'tasks' contains all tasks for now as per current implementation.

  // Calculate machines with counts from 'tasks'
  const machinesWithCounts = React.useMemo(() => {
    const counts: { [key: string]: number } = {};
    tasks.forEach(task => {
      if (task.type === 'Maintenance') {
        const name = task.machineName || 'Unknown Machine';
        counts[name] = (counts[name] || 0) + 1;
      }
    });

    return Object.entries(counts)
      .map(([name, count]) => ({ name, count }))
      .sort((a, b) => a.name.localeCompare(b.name));
  }, [tasks]);

  // Fetch checklist items when maintenance ID is selected
  useEffect(() => {
    const loadChecklistItems = async () => {
      setChecklistPage(1);
      if (selectedMaintenanceId) {
        setLoading(true);
        const data = await fetchMaintenanceTaskItemsByMaintenanceId(selectedMaintenanceId);
        setMaintenanceChecklistItems(data);
        setLoading(false);
      } else {
        setMaintenanceChecklistItems([]);
      }
    };
    loadChecklistItems();
  }, [selectedMaintenanceId]);

  // Derive maintenance jobs for selected machine
  const maintenanceJobs = React.useMemo(() => {
    if (!manageSelectedMachine) return [];
    return tasks.filter(t => t.machineName === manageSelectedMachine && t.type === 'Maintenance');
  }, [manageSelectedMachine, tasks]);

  const uniqueMachines = React.useMemo(() => {
    // If a department is selected, first filter tasks by that department
    let filtered = tasks;
    if (selectedDepartment !== 'all') {
      filtered = tasks.filter(t => t.department === selectedDepartment);
    }
    const names = filtered.map(t => t.machineName).filter(Boolean);
    return Array.from(new Set(names)).sort();
  }, [tasks, selectedDepartment]);



  const handleSort = (column: string) => {
    if (sortColumn === column) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortColumn(column);
      setSortDirection('asc');
    }
  };

  const filteredTasks = tasks
    .filter(task => {
      // For regular user, only show tasks assigned to them
      // For admin, show all tasks
      // Check against both user.username and user.id for compatibility
      if (user?.pageAccess === 'User') {
        const userIdentifier = user.employeeName || user.username || 'user';
        if (task.assignedTo !== userIdentifier) {
          return false;
        }
      }

      // Exclude repair tasks
      if (task.type === 'Repair') {
        return false;
      }

      const matchesSearch = task.machineName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        task.description.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesDepartment = selectedDepartment === 'all' || task.department === selectedDepartment;
      const matchesMachine = selectedMachine === 'all' || task.machineName === selectedMachine;
      return matchesSearch && matchesDepartment && matchesMachine;
    })
    .sort((a, b) => {
      const aValue = a[sortColumn as keyof typeof a];
      const bValue = b[sortColumn as keyof typeof b];

      if (typeof aValue === 'string' && typeof bValue === 'string') {
        return sortDirection === 'asc'
          ? aValue.localeCompare(bValue)
          : bValue.localeCompare(aValue);
      }

      return 0;
    });

  const totalPages = Math.ceil(filteredTasks.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const currentTasks = filteredTasks.slice(startIndex, endIndex);

  // Checklist Pagination Calculation
  const totalChecklistPages = Math.ceil(maintenanceChecklistItems.length / itemsPerPage);
  const startChecklistIndex = (checklistPage - 1) * itemsPerPage;
  const endChecklistIndex = startChecklistIndex + itemsPerPage;
  const currentChecklistItems = maintenanceChecklistItems.slice(startChecklistIndex, endChecklistIndex);

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'completed':
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
            <CheckCircle size={12} className="mr-1" />
            Completed
          </span>
        );
      case 'pending':
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
            <Clock size={12} className="mr-1" />
            Pending
          </span>
        );
      case 'in-progress':
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-purple-100 text-purple-800">
            <Clock size={12} className="mr-1" />
            In Progress
          </span>
        );
      case 'overdue':
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-primary/10 text-primary">
            <AlertTriangle size={12} className="mr-1" />
            Overdue
          </span>
        );
      default:
        return null;
    }
  };

  const getPriorityBadge = (priority: string) => {
    switch (priority) {
      case 'critical':
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-primary/10 text-primary border border-primary/30">
            Critical
          </span>
        );
      case 'high':
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-amber-100 text-amber-800">
            High
          </span>
        );
      case 'medium':
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
            Medium
          </span>
        );
      case 'low':
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
            Low
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
            Normal
          </span>
        );
    }
  };


  const handleTabChange = (tab: 'tasks' | 'manage') => {
    setActiveTab(tab);
    if (tab === 'manage') {
      setManageSelectedMachine('');
      setManageMachineSearch('');
      setSelectedMaintenanceId(null);
      setEditingTask(null);
    }
  };

  // getManageTasks and getTaskGroups removed/replaced by new logic

  const handleSelectMaintenanceJob = (job: any) => {
    setSelectedMaintenanceId(job.originalId); // use originalId (integer) from the task object
    setEditingTask(null);
  };

  const startEditTask = (task: any) => {
    setEditingTask(task);
    setFormData({
      description: task.description,
      priority: task.priority,
      status: task.status,
      dueDate: task.dueDate ? new Date(task.dueDate).toISOString().split('T')[0] : '', // Keep for backward compat or Repair
      startDate: task.startDate ? new Date(task.startDate).toISOString().split('T')[0] : '',
      endDate: task.endDate ? new Date(task.endDate).toISOString().split('T')[0] : '',
      taskDate: task.taskDate ? new Date(task.taskDate).toISOString().split('T')[0] : '',
      assignedTo: task.assignedTo || ''
    });
  };

  const cancelEdit = () => {
    setEditingTask(null);
    setFormData({});
  };

  const handleSaveTask = async () => {
    if (!editingTask) return;
    setProcessingId(editingTask.id);

    try {
      if (editingTask.maintenanceId) {
        // It's a maintenance task item (checklist item) from maintenance_tasks table
        const updates = {
          description: formData.description,
          status: formData.status,
          task_date: formData.taskDate
        };
        await updateMaintenanceTaskItem(editingTask.id, updates);

        // Refresh checklist items
        if (selectedMaintenanceId) {
          const data = await fetchMaintenanceTaskItemsByMaintenanceId(selectedMaintenanceId);
          setMaintenanceChecklistItems(data);
        }
      } else if (editingTask.type === 'Maintenance') {
        const updates = {
          description: formData.description,
          priority: formData.priority,
          status: formData.status,
          start_date: formData.startDate,
          end_date: formData.endDate,
          assigned_to: formData.assignedTo
        };
        await updateMaintenanceRecord(editingTask.originalId, updates);
        // Refresh main list
        const res = await fetchAllTasks();
        setTasks(res);
      } else {
        // Repair or others
        const updates = {
          problem_description: formData.description,
          priority: formData.priority,
          status: formData.status,
          assigned_to: formData.assignedTo
        };
        await updateRepairRecord(editingTask.originalId, updates);
        // Refresh main list
        const res = await fetchAllTasks();
        setTasks(res);
      }
      setEditingTask(null);
    } catch (error) {
      console.error('Error updating task:', error);
      alert('Failed to update task');
    } finally {
      setProcessingId(null);
    }
  };

  const requestEditSave = () => {
    setConfirmationModal({
      isOpen: true,
      type: 'edit',
      title: 'Confirm Edit',
      message: 'These data is being edited do you want to edit this fields',
      onConfirm: () => {
        handleSaveTask();
        setConfirmationModal(prev => ({ ...prev, isOpen: false }));
      }
    });
  };

  const requestDeleteJob = async (job: any) => {
    // Show loading state or immediate feedback if needed, but here we just fetch first
    let associatedTasks: any[] = [];
    try {
      associatedTasks = await fetchMaintenanceTaskItemsByMaintenanceId(job.originalId);
    } catch (error) {
      console.error('Error fetching associated tasks:', error);
    }

    const messageContent = (
      <div className="space-y-4">
        <div className="bg-red-50 p-4 rounded-lg flex items-start gap-3">
          <div className="bg-red-100 p-2 rounded-full shrink-0">
            <AlertTriangle className="w-5 h-5 text-red-600" />
          </div>
          <div>
            <h4 className="font-semibold text-red-900">Delete Maintenance Job</h4>
            <p className="text-sm text-red-800 mt-1">
              You are about to delete <strong>{job.taskTitle || job.description}</strong>. This action is irreversible.
            </p>
          </div>
        </div>

        {associatedTasks.length > 0 && (
          <div className="space-y-2">
            <p className="text-sm font-medium text-gray-700">
              The following {associatedTasks.length} associated checklist items will also be permanently deleted:
            </p>
            <div className="bg-gray-50 rounded-md border border-gray-200 max-h-48 overflow-y-auto">
              <ul className="divide-y divide-gray-100">
                {associatedTasks.map((task: any, index: number) => (
                  <li key={task.id} className="px-3 py-2 text-sm text-gray-600 flex items-start gap-2 hover:bg-white transition-colors">
                    <span className="text-gray-400 font-mono text-xs mt-0.5">{(index + 1).toString().padStart(2, '0')}</span>
                    <span>{task.description}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        )}

        <div className="flex items-center gap-2 text-xs text-gray-500 bg-gray-50 px-3 py-2 rounded">
          <AlertTriangle size={12} />
          <span>This will remove all data associated with this maintenance record including detailed checklist logs.</span>
        </div>
      </div>
    );

    setConfirmationModal({
      isOpen: true,
      type: 'delete',
      title: 'Confirm Delete',
      message: messageContent,
      onConfirm: async () => {
        setProcessingId(job.originalId);
        try {
          // Delete generic maintenance task (parent)
          await deleteMaintenanceTask(job.originalId);
          toast.success(`Task "${job.taskTitle || job.description}" and associated items deleted successfully`);
          // Refresh main list
          const res = await fetchAllTasks();
          setTasks(res);
          // Also clear selection if the deleted one was selected
          if (selectedMaintenanceId === job.originalId) {
            setSelectedMaintenanceId(null);
          }
        } catch (error) {
          console.error('Error deleting task:', error);
          toast.error('Failed to delete task');
        } finally {
          setProcessingId(null);
          setConfirmationModal(prev => ({ ...prev, isOpen: false }));
        }
      }
    });
  };

  return (
    <div className="space-y-6">
      {/* Confirmation Modal */}
      {confirmationModal.isOpen && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black bg-opacity-50 p-4">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-md p-6 animate-in fade-in zoom-in duration-200">
            <h3 className="text-lg font-bold text-gray-900 mb-2">{confirmationModal.title}</h3>
            <div className="mb-6">{confirmationModal.message}</div>
            <div className="flex justify-end space-x-3">
              <button
                onClick={() => setConfirmationModal(prev => ({ ...prev, isOpen: false }))}
                className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 font-medium"
              >
                Cancel
              </button>
              <button
                onClick={confirmationModal.onConfirm}
                className={`px-4 py-2 rounded-md text-white font-medium ${confirmationModal.type === 'delete' ? 'bg-red-600 hover:bg-red-700' : 'bg-primary hover:bg-primary-dark'
                  }`}
              >
                {confirmationModal.type === 'delete' ? 'Delete' : 'Confirm'}
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="flex flex-col sm:flex-row justify-between items-center bg-white p-4 rounded-lg shadow mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">
            {activeTab === 'tasks' ? 'Maintenance Tasks' : 'Manage Tasks'}
          </h1>
          {activeTab === 'tasks' && user?.pageAccess === 'User' && (
            <p className="text-sm text-gray-500 mt-1">Showing tasks assigned to you</p>
          )}
        </div>

        <div className="flex items-center gap-4 mt-4 sm:mt-0">
          {user?.pageAccess === 'Admin' && activeTab === 'tasks' && (
            <Link
              to="/assign-task?taskType=maintenance"
              className="inline-flex items-center px-4 py-2 text-sm font-medium text-white bg-primary rounded-md border border-transparent shadow-sm hover:bg-primary-dark focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary"
            >
              <Plus size={16} className="mr-2" />
              Create Task
            </Link>
          )}

          <div className="flex bg-gray-100 p-1 rounded-lg">
            <button
              onClick={() => handleTabChange('tasks')}
              className={`px-4 py-2 text-sm font-medium rounded-md transition-all ${activeTab === 'tasks'
                ? 'bg-white text-primary shadow-sm'
                : 'text-gray-600 hover:text-gray-900'
                }`}
            >
              Maintenance Task
            </button>
            <button
              onClick={() => handleTabChange('manage')}
              className={`px-4 py-2 text-sm font-medium rounded-md transition-all ${activeTab === 'manage'
                ? 'bg-white text-primary shadow-sm'
                : 'text-gray-600 hover:text-gray-900'
                }`}
            >
              Manage Tasks
            </button>
          </div>
        </div>
      </div>

      {/* Manage Tasks Tab Content */}
      {!loading && activeTab === 'manage' && (
        <div className="bg-white rounded-lg shadow-xl w-full h-[80vh] flex flex-col overflow-hidden animate-in fade-in zoom-in duration-200 border border-gray-200 mt-6">

          <div className="flex-1 overflow-hidden flex flex-col md:flex-row">
            {/* Sidebar / Topbar for Machine Selection */}
            <div className="w-full md:w-72 bg-gray-50 p-4 border-r overflow-y-auto">
              <label className="block text-sm font-medium text-gray-700 mb-2">Select Machine</label>

              {/* Machine Search Input */}
              <div className="relative mb-3">
                <input
                  type="text"
                  placeholder="Search machines..."
                  value={manageMachineSearch}
                  onChange={(e) => setManageMachineSearch(e.target.value)}
                  className="w-full pl-8 pr-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary"
                />
                <Search className="absolute left-2.5 top-2.5 text-gray-400" size={14} />
              </div>

              <div className="space-y-2">
                {machinesWithCounts
                  .filter(({ name }) => name.toLowerCase().includes(manageMachineSearch.toLowerCase()))
                  .map(({ name, count }) => (
                    <button
                      key={name}
                      onClick={() => {
                        setManageSelectedMachine(name);
                        setSelectedMaintenanceId(null);
                        setEditingTask(null);
                      }}
                      className={`w-full text-left px-3 py-2 rounded-md text-sm transition-colors flex justify-between items-center ${manageSelectedMachine === name
                        ? 'bg-primary text-white shadow-sm'
                        : 'hover:bg-gray-200 text-gray-700'
                        }`}
                    >
                      <span className="truncate mr-2">{name}</span>
                      <span className={`text-xs px-2 py-0.5 rounded-full ${manageSelectedMachine === name ? 'bg-white/20 text-white' : 'bg-gray-200 text-gray-600'}`}>
                        {count} Tasks
                      </span>
                    </button>
                  ))}
                {machinesWithCounts.length === 0 && (
                  <p className="text-sm text-gray-400 italic">No machines with tasks found.</p>
                )}
              </div>
            </div>

            {/* Main Content Area */}
            <div className="flex-1 flex flex-col overflow-hidden bg-white">
              {!manageSelectedMachine ? (
                <div className="flex-1 flex items-center justify-center text-gray-500">
                  Select a machine to view its tasks
                </div>
              ) : (
                <div className="flex-1 flex flex-col h-full">
                  <div className="p-4 bg-gray-50 border-b flex justify-between items-center">
                    <h3 className="font-semibold text-lg flex items-center">
                      {selectedMaintenanceId ? (
                        <button
                          onClick={() => setSelectedMaintenanceId(null)}
                          className="mr-2 hover:bg-gray-200 p-1 rounded-full transition-colors"
                        >
                          <ArrowUp className="transform -rotate-90 text-gray-600" size={20} />
                        </button>
                      ) : null}
                      {manageSelectedMachine}
                      {!selectedMaintenanceId && (
                        <span className="ml-2 text-sm font-normal text-gray-500">
                          ({maintenanceJobs.length} Maintenance Jobs)
                        </span>
                      )}
                      {selectedMaintenanceId && (
                        <span className="ml-2 text-sm font-normal text-gray-500">
                          / Task Checklist ({maintenanceChecklistItems.length} Tasks)
                        </span>
                      )}
                    </h3>
                  </div>

                  <div className="flex-1 overflow-y-auto p-4">
                    {editingTask ? (
                      <div className="max-w-3xl mx-auto bg-white p-8 rounded-xl shadow-sm border border-gray-100">
                        <div className="flex justify-between items-center mb-6">
                          <h4 className="text-2xl font-bold text-gray-800">Edit Task</h4>
                          <button onClick={cancelEdit} className="text-gray-400 hover:text-gray-600">
                            <X size={24} />
                          </button>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                          <div className="col-span-1 md:col-span-2">
                            <label className="block text-sm font-semibold text-gray-700 mb-1">Description / Task</label>
                            <textarea
                              value={formData.description}
                              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                              className="w-full rounded-lg border-gray-300 shadow-sm focus:border-primary focus:ring focus:ring-primary focus:ring-opacity-50 p-3 border transition-all resize-none h-24"
                              placeholder="Enter task description..."
                            />
                          </div>

                          <div className="space-y-6">
                            <div>
                              <label className="block text-sm font-semibold text-gray-700 mb-1">Status</label>
                              <select
                                value={formData.status}
                                onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                                className="w-full rounded-lg border-gray-300 shadow-sm focus:border-primary focus:ring focus:ring-primary focus:ring-opacity-50 p-2.5 border bg-white"
                              >
                                <option value="pending">Pending</option>
                                <option value="in-progress">In Progress</option>
                                <option value="completed">Completed</option>
                                <option value="overdue">Overdue</option>
                              </select>
                            </div>

                            {editingTask.maintenanceId ? (
                              <div>
                                <label className="block text-sm font-semibold text-gray-700 mb-1">Task Date</label>
                                <input
                                  type="date"
                                  value={formData.taskDate}
                                  onChange={(e) => setFormData({ ...formData, taskDate: e.target.value })}
                                  className="w-full rounded-lg border-gray-300 shadow-sm focus:border-primary focus:ring focus:ring-primary focus:ring-opacity-50 p-2.5 border"
                                />
                              </div>
                            ) : editingTask.type === 'Maintenance' ? (
                              <>
                                <div>
                                  <label className="block text-sm font-semibold text-gray-700 mb-1">Start Date</label>
                                  <input
                                    type="date"
                                    value={formData.startDate}
                                    onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
                                    className="w-full rounded-lg border-gray-300 shadow-sm focus:border-primary focus:ring focus:ring-primary focus:ring-opacity-50 p-2.5 border"
                                  />
                                </div>
                                <div>
                                  <label className="block text-sm font-semibold text-gray-700 mb-1">End Date</label>
                                  <input
                                    type="date"
                                    value={formData.endDate}
                                    onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
                                    className="w-full rounded-lg border-gray-300 shadow-sm focus:border-primary focus:ring focus:ring-primary focus:ring-opacity-50 p-2.5 border"
                                  />
                                </div>
                              </>
                            ) : (
                              <div>
                                <label className="block text-sm font-semibold text-gray-700 mb-1">Due Date</label>
                                <input
                                  type="date"
                                  value={formData.dueDate}
                                  onChange={(e) => setFormData({ ...formData, dueDate: e.target.value })}
                                  className="w-full rounded-lg border-gray-300 shadow-sm focus:border-primary focus:ring focus:ring-primary focus:ring-opacity-50 p-2.5 border"
                                />
                              </div>
                            )}
                          </div>
                        </div>

                        <div className="flex justify-end space-x-4 mt-8 pt-6 border-t">
                          <button
                            onClick={cancelEdit}
                            className="px-6 py-2.5 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
                          >
                            Cancel
                          </button>
                          <button
                            onClick={requestEditSave}
                            disabled={!!processingId}
                            className="px-6 py-2.5 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-primary hover:bg-primary-dark focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary disabled:opacity-50 transition-all flex items-center"
                          >
                            {processingId ? <Loader size={16} className="animate-spin mr-2" /> : 'Save Changes'}
                          </button>
                        </div>
                      </div>
                    ) : (
                      <>
                        {!selectedMaintenanceId ? (
                          // List of Maintenance Jobs
                          <div className="overflow-x-auto bg-white rounded-lg border border-gray-200 shadow-sm">
                            <table className="min-w-full divide-y divide-gray-200">
                              <thead className="bg-gray-50">
                                <tr>
                                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Title/Description</th>
                                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Start Date</th>
                                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">End Date</th>

                                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Assigned To</th>
                                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                                </tr>
                              </thead>
                              <tbody className="bg-white divide-y divide-gray-200">
                                {maintenanceJobs.map(job => (
                                  <tr key={job.id} className="hover:bg-gray-50 transition-colors cursor-pointer" onClick={() => handleSelectMaintenanceJob(job)}>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 font-medium">
                                      {job.taskTitle || job.description}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                      {job.startDate ? new Date(job.startDate).toLocaleDateString('en-GB') : '-'}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                      {job.endDate ? new Date(job.endDate).toLocaleDateString('en-GB') : '-'}
                                    </td>

                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                      {job.assignedToName || '-'}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                      <div className="flex items-center justify-end space-x-2">
                                        <button
                                          onClick={(e) => {
                                            e.stopPropagation();
                                            handleSelectMaintenanceJob(job);
                                          }}
                                          className="text-primary hover:text-primary-dark font-medium mr-2"
                                        >
                                          View Tasks
                                        </button>
                                        <button
                                          onClick={(e) => {
                                            e.stopPropagation();
                                            requestDeleteJob(job);
                                          }}
                                          className="text-red-600 hover:text-red-900 font-medium p-1 hover:bg-red-50 rounded"
                                          title="Delete Job"
                                        >
                                          <Trash2 size={18} />
                                        </button>
                                      </div>
                                    </td>
                                  </tr>
                                ))}
                                {maintenanceJobs.length === 0 && (
                                  <tr>
                                    <td colSpan={5} className="px-6 py-4 text-center text-gray-500 italic">
                                      No maintenance jobs found for this machine.
                                    </td>
                                  </tr>
                                )}
                              </tbody>
                            </table>
                          </div>
                        ) : (
                          <>
                            {/* List of Checklist Items for Selected Job */}
                            <div className="overflow-x-auto bg-white rounded-lg border border-gray-200 shadow-sm">
                              <table className="min-w-full divide-y divide-gray-200">
                                <thead className="bg-gray-50">
                                  <tr>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Task No</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Description</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Task Date</th>
                                  </tr>
                                </thead>
                                <tbody className="bg-white divide-y divide-gray-200">
                                  {currentChecklistItems.map(item => (
                                    <tr key={item.id} className="hover:bg-gray-50 transition-colors">
                                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                        {item.taskNo || '-'}
                                      </td>
                                      <td className="px-6 py-4 text-sm text-gray-900">
                                        {item.description}
                                      </td>
                                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                        {item.taskDate ? new Date(item.taskDate).toLocaleDateString('en-GB') : '-'}
                                      </td>
                                    </tr>
                                  ))}
                                  {maintenanceChecklistItems.length === 0 && (
                                    <tr>
                                      <td colSpan={5} className="px-6 py-4 text-center text-gray-500 italic">
                                        No tasks found for this maintenance job.
                                      </td>
                                    </tr>
                                  )}
                                </tbody>
                              </table>
                            </div>

                            {/* Checklist Pagination */}
                            {maintenanceChecklistItems.length > itemsPerPage && (
                              <div className="flex justify-between items-center mt-4 px-2">
                                <div className="text-sm text-gray-500">
                                  Showing {startChecklistIndex + 1} to {Math.min(endChecklistIndex, maintenanceChecklistItems.length)} of {maintenanceChecklistItems.length} tasks
                                </div>
                                <div className="flex space-x-2">
                                  <button
                                    onClick={() => setChecklistPage(prev => Math.max(prev - 1, 1))}
                                    disabled={checklistPage === 1}
                                    className={`px-3 py-1 rounded-md text-sm font-medium border ${checklistPage === 1 ? 'bg-gray-100 text-gray-400 cursor-not-allowed' : 'bg-white text-gray-700 hover:bg-gray-50'}`}
                                  >
                                    Previous
                                  </button>
                                  <button
                                    onClick={() => setChecklistPage(prev => Math.min(prev + 1, totalChecklistPages))}
                                    disabled={checklistPage === totalChecklistPages}
                                    className={`px-3 py-1 rounded-md text-sm font-medium border ${checklistPage === totalChecklistPages ? 'bg-gray-100 text-gray-400 cursor-not-allowed' : 'bg-white text-gray-700 hover:bg-gray-50'}`}
                                  >
                                    Next
                                  </button>
                                </div>
                              </div>
                            )}
                          </>
                        )}
                      </>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )
      }

      {
        loading ? (
          <div className="flex justify-center items-center h-64">
            <Loader className="w-8 h-8 text-primary animate-spin" />
          </div>
        ) : (
          <>


            {activeTab === 'tasks' && (
              <>

                {/* Filter and Search */}
                <div className="flex flex-col p-4 space-y-4 bg-white rounded-lg shadow md:flex-row md:items-center md:justify-between md:space-y-0 md:space-x-4">
                  <div className="flex flex-1 max-w-md">
                    <div className="relative w-full">
                      <input
                        type="text"
                        placeholder="Search tasks..."
                        className="py-2 pr-4 pl-10 w-full rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-primary"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                      />
                      <Search
                        size={20}
                        className="absolute left-3 top-1/2 text-gray-400 transform -translate-y-1/2"
                      />
                    </div>
                  </div>
                  <div className="flex flex-wrap gap-2 md:gap-4">
                    <div className="flex items-center space-x-2">
                      <Filter size={16} className="text-gray-500" />
                      <select
                        className="px-3 py-2 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-primary"
                        value={selectedDepartment}
                        onChange={(e) => {
                          setSelectedDepartment(e.target.value);
                          setSelectedMachine('all'); // Reset machine selection
                        }}
                      >
                        <option value="all">All Departments</option>
                        <option value="Rolling Mill">Rolling Mill</option>
                        <option value="Furnace">Furnace</option>
                        <option value="Slag Crusher">Slag Crusher</option>
                        <option value="CCM">CCM</option>
                      </select>
                    </div>
                    <div className="flex items-center space-x-2">
                      <select
                        className="px-3 py-2 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-primary"
                        value={selectedMachine}
                        onChange={(e) => setSelectedMachine(e.target.value)}
                      >
                        <option value="all">All Machines</option>
                        {uniqueMachines.map(name => (
                          <option key={name} value={name}>{name}</option>
                        ))}
                      </select>
                    </div>
                  </div>
                </div>

                {/* Task List Table for Desktop */}
                <div className="hidden overflow-hidden bg-white rounded-lg shadow md:block min-h-[600px] flex flex-col">
                  <div className="overflow-x-auto flex-grow">
                    <table className="min-w-full divide-y divide-gray-200">
                      <thead className="bg-gray-50 sticky top-0 z-10">
                        <tr>
                          <th scope="col" className="px-6 py-3 text-xs font-medium tracking-wider text-left text-gray-500 uppercase w-16">
                            Actions
                          </th>
                          <th
                            scope="col"
                            className="px-6 py-3 text-xs font-medium tracking-wider text-left text-gray-500 uppercase cursor-pointer"
                            onClick={() => handleSort('machineName')}
                          >
                            <div className="flex items-center">
                              Machine
                              {sortColumn === 'machineName' && (
                                sortDirection === 'asc' ? <ArrowUp size={14} className="ml-1" /> : <ArrowDown size={14} className="ml-1" />
                              )}
                            </div>
                          </th>
                          <th
                            scope="col"
                            className="px-6 py-3 text-xs font-medium tracking-wider text-left text-gray-500 uppercase"
                          >
                            Serial Number
                          </th>
                          <th
                            scope="col"
                            className="px-6 py-3 text-xs font-medium tracking-wider text-left text-gray-500 uppercase"
                          >
                            Description
                          </th>
                          <th
                            scope="col"
                            className="px-6 py-3 text-xs font-medium tracking-wider text-left text-gray-500 uppercase cursor-pointer"
                            onClick={() => handleSort('department')}
                          >
                            <div className="flex items-center">
                              Department
                              {sortColumn === 'department' && (
                                sortDirection === 'asc' ? <ArrowUp size={14} className="ml-1" /> : <ArrowDown size={14} className="ml-1" />
                              )}
                            </div>
                          </th>
                          <th
                            scope="col"
                            className="px-6 py-3 text-xs font-medium tracking-wider text-left text-gray-500 uppercase"
                          >
                            <div className="flex items-center">
                              Priority
                            </div>
                          </th>
                          <th
                            scope="col"
                            className="px-6 py-3 text-xs font-medium tracking-wider text-left text-gray-500 uppercase cursor-pointer"
                            onClick={() => handleSort('startDate')}
                          >
                            <div className="flex items-center">
                              Start Date
                              {sortColumn === 'startDate' && (
                                sortDirection === 'asc' ? <ArrowUp size={14} className="ml-1" /> : <ArrowDown size={14} className="ml-1" />
                              )}
                            </div>
                          </th>
                          <th
                            scope="col"
                            className="px-6 py-3 text-xs font-medium tracking-wider text-left text-gray-500 uppercase cursor-pointer"
                            onClick={() => handleSort('dueDate')}
                          >
                            <div className="flex items-center">
                              End Date
                              {sortColumn === 'dueDate' && (
                                sortDirection === 'asc' ? <ArrowUp size={14} className="ml-1" /> : <ArrowDown size={14} className="ml-1" />
                              )}
                            </div>
                          </th>
                          <th
                            scope="col"
                            className="px-6 py-3 text-xs font-medium tracking-wider text-left text-gray-500 uppercase cursor-pointer"
                            onClick={() => handleSort('assignedToName')}
                          >
                            <div className="flex items-center">
                              Assigned To
                              {sortColumn === 'assignedToName' && (
                                sortDirection === 'asc' ? <ArrowUp size={14} className="ml-1" /> : <ArrowDown size={14} className="ml-1" />
                              )}
                            </div>
                          </th>
                          <th
                            scope="col"
                            className="px-6 py-3 text-xs font-medium tracking-wider text-left text-gray-500 uppercase cursor-pointer"
                            onClick={() => handleSort('givenBy')}
                          >
                            <div className="flex items-center">
                              Given By
                              {sortColumn === 'givenBy' && (
                                sortDirection === 'asc' ? <ArrowUp size={14} className="ml-1" /> : <ArrowDown size={14} className="ml-1" />
                              )}
                            </div>
                          </th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-200">
                        {currentTasks.map((task) => (
                          <tr key={task.id} className="hover:bg-gray-50">
                            <td className="px-6 py-4 text-sm font-medium whitespace-nowrap">
                              <Link
                                to={`/tasks/${task.id}`}
                                className="p-1 text-primary hover:text-primary-dark hover:bg-primary/5 inline-block rounded"
                                title="View Details"
                              >
                                <FileText size={18} />
                              </Link>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="text-sm font-medium text-gray-900">{task.machineName}</div>
                              <div className="mt-1 text-xs text-gray-500">{task.type}</div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="text-xs font-mono bg-gray-100 text-gray-600 px-2 py-0.5 rounded w-fit">
                                {task.machineSerialNo || 'N/A'}
                              </div>
                            </td>
                            <td className="px-6 py-4">
                              <div className="text-sm text-gray-700 w-full min-w-[300px] max-w-xl whitespace-normal break-words">
                                {task.description || 'No description provided'}
                              </div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="text-sm text-gray-900">{task.department}</div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="flex flex-col space-y-1">
                                {getStatusBadge(task.status)}
                                {getPriorityBadge(task.priority)}
                              </div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="text-sm text-gray-900">{task.startDate ? new Date(task.startDate).toLocaleDateString('en-GB') : '-'}</div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="text-sm text-gray-900">{new Date(task.endDate || task.dueDate).toLocaleDateString('en-GB')}</div>
                              {task.completedDate && (
                                <div className="text-xs text-green-600">
                                  Completed: {new Date(task.completedDate).toLocaleDateString('en-GB')}
                                </div>
                              )}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="flex items-center">
                                <UserCircle size={20} className="mr-2 text-gray-400" />
                                <span className="text-sm text-gray-900">{task.assignedToName}</span>
                              </div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="flex items-center">
                                <UserCircle size={20} className="mr-2 text-gray-400" />
                                <span className="text-sm text-gray-900">{task.givenBy || '-'}</span>
                              </div>
                            </td>

                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                  {/* Empty State or Filler Rows could go here to maintain height if needed, 
            but min-h on container handles the main jump. */}
                  {filteredTasks.length === 0 && (
                    <div className="px-6 py-12 text-center">
                      <p className="text-gray-500">No tasks found matching your criteria.</p>
                    </div>
                  )}
                </div>



                {/* Pagination Controls */}
                {filteredTasks.length > 0 && (
                  <div className="flex flex-col items-center justify-between p-4 bg-white rounded-lg shadow sm:flex-row">
                    <div className="text-sm text-gray-500 mb-4 sm:mb-0">
                      Showing <span className="font-medium">{startIndex + 1}</span> to{' '}
                      <span className="font-medium">
                        {Math.min(endIndex, filteredTasks.length)}
                      </span>{' '}
                      of <span className="font-medium">{filteredTasks.length}</span> tasks
                    </div>
                    <div className="flex space-x-2">
                      <button
                        onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
                        disabled={currentPage === 1}
                        className={`px-3 py-1 rounded-md text-sm font-medium ${currentPage === 1
                          ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                          : 'bg-white text-gray-700 hover:bg-gray-50 border border-gray-300'
                          }`}
                      >
                        Previous
                      </button>

                      {/* Page Numbers (Simplified for robustness) */}
                      <div className="flex space-x-1">
                        {Array.from({ length: totalPages }, (_, i) => i + 1)
                          .filter(page => {
                            // Show first, last, current, and neighbors
                            return page === 1 || page === totalPages || Math.abs(page - currentPage) <= 1;
                          })
                          .map((page, index, array) => {
                            const showDots = index > 0 && page - array[index - 1] > 1;
                            return (
                              <React.Fragment key={page}>
                                {showDots && <span className="px-2 py-1 text-gray-400">...</span>}
                                <button
                                  onClick={() => setCurrentPage(page)}
                                  className={`px-3 py-1 rounded-md text-sm font-medium ${currentPage === page
                                    ? 'bg-primary text-white'
                                    : 'bg-white text-gray-700 hover:bg-gray-50 border border-gray-300'
                                    }`}
                                >
                                  {page}
                                </button>
                              </React.Fragment>
                            );
                          })}
                      </div>

                      <button
                        onClick={() => setCurrentPage((prev) => Math.min(prev + 1, totalPages))}
                        disabled={currentPage === totalPages}
                        className={`px-3 py-1 rounded-md text-sm font-medium ${currentPage === totalPages
                          ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                          : 'bg-white text-gray-700 hover:bg-gray-50 border border-gray-300'
                          }`}
                      >
                        Next
                      </button>
                    </div>
                  </div>
                )}

                {/* Task Cards for Mobile */}
                <div className="block space-y-4 md:hidden">
                  {filteredTasks.length === 0 ? (
                    <div className="p-6 text-center bg-white rounded-lg shadow">
                      <p className="text-gray-500">No tasks found matching your criteria.</p>
                    </div>
                  ) : (
                    currentTasks.map((task) => (
                      <div key={task.id} className="p-4 bg-white rounded-lg shadow">
                        <div className="flex justify-between items-start">
                          <div className="flex-1">
                            <h3 className="text-lg font-semibold text-gray-900">
                              {task.machineName}
                            </h3>
                            <p className="text-sm text-gray-500">{task.type}</p>
                            <p className="text-xs text-gray-400 mt-1">
                              {task.description?.length > 60 ? `${task.description.substring(0, 60)}...` : task.description}
                            </p>
                            <div className="flex flex-wrap gap-2 mt-2">
                              {getStatusBadge(task.status)}
                              {getPriorityBadge(task.priority)}
                            </div>
                          </div>
                          <Link
                            to={`/tasks/${task.id}`}
                            className="p-2 text-primary rounded hover:text-primary-dark hover:bg-primary/5"
                          >
                            <FileText size={20} />
                          </Link>
                        </div>
                        <div className="grid grid-cols-2 gap-4 mt-4 text-sm">
                          <div>
                            <span className="font-medium text-gray-500">Department:</span>
                            <p className="text-gray-900">{task.department}</p>
                          </div>
                          <div>
                            <span className="font-medium text-gray-500">Start Date:</span>
                            <p className="text-gray-900">
                              {task.startDate ? new Date(task.startDate).toLocaleDateString('en-GB') : '-'}
                            </p>
                          </div>
                          <div>
                            <span className="font-medium text-gray-500">End Date:</span>
                            <p className="text-gray-900">
                              {new Date(task.endDate || task.dueDate).toLocaleDateString('en-GB')}
                            </p>
                          </div>
                          <div>
                            <span className="font-medium text-gray-500">Assigned To:</span>
                            <p className="text-gray-900">{task.assignedToName}</p>
                          </div>
                        </div>
                        {task.completedDate && (
                          <div className="mt-2 text-xs text-green-600">
                            Completed: {new Date(task.completedDate).toLocaleDateString('en-GB')}
                          </div>
                        )}
                      </div>
                    ))
                  )}
                </div>

              </>
            )}
          </>
        )
      }
    </div >
  );
};

export default Tasks;