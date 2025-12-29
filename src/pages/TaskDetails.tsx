import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import {
  ChevronLeft,
  Clock,
  CheckCircle,
  FileText,
  Wrench,
  Calendar,
  AlertTriangle,
  Camera,
  Paperclip,
  Save,
  Loader,
  UserCircle,
  Search,
  ChevronRight
} from "lucide-react";
import { toast } from "react-hot-toast";
import { useParams, useLocation } from "react-router-dom";
import { fetchTaskDetails, updateMaintenanceRecord } from "../services/machineService";
import { supabase } from "../lib/supabase";

const TaskDetails = () => {
  const { id } = useParams<{ id: string }>();
  const location = useLocation();

  const formatDate = (dateString: string | Date) => {
    if (!dateString) return '-';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-GB', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
  };
  const [task, setTask] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("details");

  useEffect(() => {
    if ((location.state as any)?.initialTab) {
      setActiveTab((location.state as any).initialTab);
    }
  }, [location.state]);

  const [checklistItems, setChecklistItems] = useState<any[]>([]);
  const [selectedRows, setSelectedRows] = useState<any[]>([]);
  const [history, setHistory] = useState<any[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const ITEMS_PER_PAGE = 10;

  useEffect(() => {
    setCurrentPage(1);
    setSearchQuery("");
  }, [activeTab]);


  useEffect(() => {
    const loadTask = async () => {
      if (!id) return;
      setLoading(true);
      const data = await fetchTaskDetails(id);
      if (data) {
        setTask(data);
        setChecklistItems(data.checklistItems || []);
        setChecklistItems(data.checklistItems || []);
        // Initialize history from detailsData (task_logs) for maintenance
        if (data.type === 'Maintenance') {
          setHistory(data.detailsData || []);
        }
      }
      setLoading(false);
    };
    loadTask();
  }, [id]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex justify-center items-center">
        <Loader className="w-8 h-8 text-primary animate-spin" />
      </div>
    );
  }

  if (!task) {
    return (
      <div className="min-h-screen bg-gray-50 flex justify-center items-center">
        <div className="text-gray-500">Task not found</div>
      </div>
    );
  }

  const handleRowSelect = (id: number) => {
    setSelectedRows((prev) =>
      prev.includes(id) ? prev.filter((rowId) => rowId !== id) : [...prev, id]
    );
  };

  const visibleChecklistItems = checklistItems.filter(item => !item.isSubmitted);

  // Filter and Pagination Logic
  const getFilteredData = (data: any[], type: 'details' | 'checklist' | 'history') => {
    if (!searchQuery) return data;
    const lowerQuery = searchQuery.toLowerCase();

    return data.filter(item => {
      if (type === 'history') {
        return (
          item.taskNo?.toLowerCase().includes(lowerQuery) ||
          item.description?.toLowerCase().includes(lowerQuery) ||
          item.remarks?.toLowerCase().includes(lowerQuery) ||
          item.entryUser?.toLowerCase().includes(lowerQuery)
        );
      }
      return (
        item.taskNo?.toLowerCase().includes(lowerQuery) ||
        item.description?.toLowerCase().includes(lowerQuery) ||
        item.department?.toLowerCase().includes(lowerQuery) ||
        item.taskStatus?.toLowerCase().includes(lowerQuery)
      );
    });
  };

  const getPaginatedData = (data: any[]) => {
    const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
    return data.slice(startIndex, startIndex + ITEMS_PER_PAGE);
  };

  const PaginationControls = ({ totalItems }: { totalItems: number }) => {
    const totalPages = Math.ceil(totalItems / ITEMS_PER_PAGE);
    if (totalPages <= 1) return null;

    return (
      <div className="flex flex-col sm:flex-row items-center justify-between px-4 py-3 border-t bg-white gap-4 sm:gap-0">
        <div className="text-sm text-gray-500 text-center sm:text-left">
          Showing <span className="font-medium mx-1">{Math.min((currentPage - 1) * ITEMS_PER_PAGE + 1, totalItems)}</span> to <span className="font-medium mx-1">{Math.min(currentPage * ITEMS_PER_PAGE, totalItems)}</span> of <span className="font-medium mx-1">{totalItems}</span> results
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
            Page {currentPage} of {totalPages}
          </span>
          <button
            onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
            disabled={currentPage === totalPages}
            className="p-2 rounded-md border hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <ChevronRight size={16} />
          </button>
        </div>
      </div>
    );
  };

  // Prepare data for each tab
  const detailsData = task?.type === 'Maintenance' ? checklistItems : (task?.detailsData || []);
  const filteredDetails = getFilteredData(detailsData, 'details');
  const paginatedDetails = getPaginatedData(filteredDetails);

  const filteredChecklist = getFilteredData(visibleChecklistItems, 'checklist');
  const paginatedChecklist = getPaginatedData(filteredChecklist);

  const flattenedHistory = history.flatMap((entry: any) =>
    entry.items.map((item: any) => ({
      ...item,
      entryDate: entry.date,
      entryUser: entry.user,
      entryId: entry.id
    }))
  );
  const filteredHistory = getFilteredData(flattenedHistory, 'history');
  const paginatedHistory = getPaginatedData(filteredHistory);

  const handleSelectAll = () => {
    // Select all currently visible (filtered & paginated) items
    const currentIds = paginatedChecklist.map(item => item.id);
    const allSelected = currentIds.every(id => selectedRows.includes(id));

    if (allSelected) {
      setSelectedRows(prev => prev.filter(id => !currentIds.includes(id)));
    } else {
      setSelectedRows(prev => [...new Set([...prev, ...currentIds])]);
    }
  };

  const handleChecklistUpdate = (id: number, field: string, value: any) => {
    setChecklistItems((prev) =>
      prev.map((item) =>
        item.id === id ? { ...item, [field]: value } : item
      )
    );
  };

  const handleImageUpload = async (id: number, e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      try {
        if (!supabase) throw new Error("Supabase client not initialized");

        const fileExt = file.name.split('.').pop();
        const fileName = `${Date.now()}_${Math.random().toString(36).substring(7)}.${fileExt}`;
        const filePath = `checklist-images/${fileName}`;

        const { error: uploadError } = await supabase.storage
          .from('images-pdf')
          .upload(filePath, file);

        if (uploadError) {
          throw uploadError;
        }

        const { data: { publicUrl } } = supabase.storage
          .from('images-pdf')
          .getPublicUrl(filePath);

        handleChecklistUpdate(id, "image", publicUrl);
      } catch (error) {
        console.error('Error uploading image:', error);
        toast.error('Failed to upload image. Please try again.');
      }
    }
  };

  const handleCompleteChecklistItem = async (itemId: number) => {
    let taskNo = "";
    const updatedChecklistItems = checklistItems.map(item => {
      if (item.id === itemId) {
        taskNo = item.taskNo;
        return { ...item, taskStatus: 'completed', isSubmitted: true };
      }
      return item;
    });
    setChecklistItems(updatedChecklistItems);

    const updatedHistory = history.map((entry: any) => ({
      ...entry,
      items: entry.items.map((item: any) =>
        item.taskNo === taskNo ? { ...item, taskStatus: 'completed' } : item
      )
    }));
    setHistory(updatedHistory);

    try {
      if (task.type === 'Maintenance') {
        const allCompleted = updatedChecklistItems.every(item => item.taskStatus === 'completed');
        await updateMaintenanceRecord(task.originalId, {
          checklist: updatedChecklistItems,
          task_logs: updatedHistory,
          ...(allCompleted ? { status: 'completed' } : {})
        });
        toast.success("Task marked as completed!");
      }
    } catch (error) {
      console.error('Error updating task:', error);
      toast.error("Failed to update task");
    }
  };

  const handleCompleteHistoryItem = async (entryId: number, itemTaskNo: string) => {
    const updatedHistory = history.map((entry: any) => {
      if (entry.id === entryId) {
        return {
          ...entry,
          items: entry.items.map((item: any) =>
            item.taskNo === itemTaskNo ? { ...item, taskStatus: 'completed' } : item
          )
        };
      }
      return entry;
    });
    setHistory(updatedHistory);

    const updatedChecklistItems = checklistItems.map(item =>
      item.taskNo === itemTaskNo ? { ...item, taskStatus: 'completed', isSubmitted: true } : item
    );
    setChecklistItems(updatedChecklistItems);

    try {
      if (task.type === 'Maintenance') {
        const allCompleted = updatedChecklistItems.every(item => item.taskStatus === 'completed');
        await updateMaintenanceRecord(task.originalId, {
          checklist: updatedChecklistItems,
          task_logs: updatedHistory,
          ...(allCompleted ? { status: 'completed' } : {})
        });
        toast.success("Task marked as completed!");
      }
    } catch (error) {
      console.error('Error updating task:', error);
      toast.error("Failed to update task");
    }
  };

  const submitItems = async (itemsToSubmit: any[]) => {
    if (itemsToSubmit.length === 0) {
      toast.error("Please select at least one checklist item to submit");
      return;
    }

    // Check for required attachment
    if (task.requireAttachment) {
      const missingImages = itemsToSubmit.some(item => !item.image);
      if (missingImages) {
        toast.error("Attachment is required for this task. Please upload an image for all selected items.");
        return;
      }
    }

    // Check for required temperature if temperature sensitive
    if (task.isTemperatureSensitive) {
      const missingTemp = itemsToSubmit.some(item => !item.temperature);
      if (missingTemp) {
        toast.error("This task is Temperature Sensitive. Please enter the temperature for all selected items.");
        return;
      }
    }

    const newHistoryEntry = {
      id: Date.now(),
      date: new Date().toISOString(),
      user: task.assigned_to || task.assignedTo || "Current User",
      action: "Checklist submitted",
      items: itemsToSubmit.map((item) => ({
        taskNo: item.taskNo,
        department: item.department,
        description: item.description,
        taskStatus: item.taskStatus, // Force status to completed in history
        remarks: item.remarks,
        soundOfMachine: item.soundOfMachine,
        temperature: item.temperature,
        maintenanceCost: item.maintenanceCost,
        image: item.image,
      })),
    };

    const updatedHistory = [newHistoryEntry, ...history];
    setHistory(updatedHistory);

    // Mark items as submitted in the main checklist
    const idsToSubmit = itemsToSubmit.map(i => i.id);
    const updatedChecklistItems = checklistItems.map(item =>
      idsToSubmit.includes(item.id)
        ? { ...item, isSubmitted: true, taskStatus: item.taskStatus }
        : item
    );

    setChecklistItems(updatedChecklistItems);
    setSelectedRows(prev => prev.filter(id => !idsToSubmit.includes(id)));

    try {
      if (task.type === 'Maintenance') {
        const allCompleted = updatedChecklistItems.every(item => item.taskStatus === 'completed');
        await updateMaintenanceRecord(task.originalId, {
          checklist: updatedChecklistItems,
          task_logs: updatedHistory, // Persist the history
          ...(allCompleted ? { status: 'completed' } : {})
        });
      } else {
        // Handle Repair task updates if needed
      }
      toast.success("Checklist submitted successfully!");
      if (updatedChecklistItems.every(item => item.isSubmitted)) {
        setActiveTab("history");
      }
    } catch (error) {
      console.error('Error saving checklist:', error);
      toast.error("Failed to save checklist submission");
    }
  };

  const handleSubmitChecklist = async () => {
    const selectedItems = checklistItems.filter((item) =>
      selectedRows.includes(item.id)
    );
    await submitItems(selectedItems);
  };

  const handleSingleSubmit = async (item: any) => {
    await submitItems([item]);
  };



  const getStatusBadge = (status: string) => {
    const badges: Record<string, string> = {
      completed: "bg-green-100 text-green-800",
      pending: "bg-blue-100 text-blue-800",
      "in-progress": "bg-purple-100 text-purple-800",
      overdue: "bg-primary/10 text-primary",
    };
    return (
      <span className={`inline-flex items-center px-3 py-1 text-sm font-medium rounded-full ${badges[status] || 'bg-gray-100 text-gray-800'}`}>
        {status === "completed" && <CheckCircle size={16} className="mr-1" />}
        {status === "pending" && <Clock size={16} className="mr-1" />}
        {status === "in-progress" && <Clock size={16} className="mr-1" />}
        {status === "overdue" && <AlertTriangle size={16} className="mr-1" />}
        {status.charAt(0).toUpperCase() + status.slice(1).replace("-", " ")}
      </span>
    );
  };

  const getPriorityBadge = (priority: string) => {
    const badges: Record<string, string> = {
      critical: "bg-primary/10 text-primary border-primary/30",
      high: "bg-amber-100 text-amber-800",
      medium: "bg-blue-100 text-blue-800",
      low: "bg-green-100 text-green-800",
    };
    return (
      <span className={`inline-flex items-center px-3 py-1 text-sm font-medium rounded-full ${badges[priority] || 'bg-gray-100 text-gray-800'}`}>
        {priority.charAt(0).toUpperCase() + priority.slice(1)}
      </span>
    );
  };

  return (
    <div className="min-h-screen bg-gray-50 p-4 md:p-6 flex flex-col">
      <div className="max-w-7xl mx-auto w-full flex flex-col space-y-6">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center gap-4">
          <Link
            to="/tasks"
            className="flex items-center text-primary hover:text-primary-dark"
          >
            <ChevronLeft size={20} />
            <span>Back to Tasks</span>
          </Link>
          <h1 className="flex-1 text-xl md:text-2xl font-bold text-gray-800">
            {task.type} - {task.machineName}
          </h1>
          <div className="flex flex-wrap items-center gap-2">
            {getStatusBadge(task.status)}
            {getPriorityBadge(task.priority)}
          </div>
        </div>

        {/* Task Header Card */}
        <div className="bg-white rounded-lg shadow flex flex-col">
          <div className="p-4 md:p-6 border-b">
            <div className="flex flex-col md:flex-row justify-between gap-4 mb-4">
              <div>
                <h2 className="text-xl font-semibold">
                  {task.machineName}
                  {task.machineSerialNo && <span className="ml-2 text-primary text-lg font-normal">({task.machineSerialNo})</span>}
                </h2>
                <p className="text-gray-500">{task.department} Department</p>
              </div>
              <div className="w-full md:w-64">
                <div className="flex justify-between text-sm mb-1">
                  <span className="text-gray-600 font-medium">Task Progress</span>
                  <span className="text-primary font-bold">
                    {checklistItems.length > 0
                      ? Math.floor((checklistItems.filter((i: any) => i.taskStatus === 'completed').length / checklistItems.length) * 100)
                      : 0}%
                  </span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2.5 flex overflow-hidden">
                  <div
                    className="bg-green-500 h-2.5 transition-all duration-500"
                    style={{
                      width: `${checklistItems.length > 0
                        ? (checklistItems.filter((i: any) => i.taskStatus === 'completed').length / checklistItems.length) * 100
                        : 0}%`
                    }}
                  ></div>
                  <div
                    className="bg-blue-500 h-2.5 transition-all duration-500"
                    style={{
                      width: `${checklistItems.length > 0
                        ? (checklistItems.filter((i: any) => i.taskStatus === 'in-progress').length / checklistItems.length) * 100
                        : 0}%`
                    }}
                  ></div>
                  <div
                    className="bg-primary h-2.5 transition-all duration-500"
                    style={{
                      width: `${checklistItems.length > 0
                        ? (checklistItems.filter((i: any) => i.taskStatus === 'pending').length / checklistItems.length) * 100
                        : 0}%`
                    }}
                  ></div>
                </div>
                <div className="flex justify-between text-xs text-gray-500 mt-1">
                  <span className="text-green-600">Completed: {checklistItems.filter((i: any) => i.taskStatus === 'completed').length}</span>
                  <span className="text-blue-600">In-Progress: {checklistItems.filter((i: any) => i.taskStatus === 'in-progress').length}</span>
                  <span className="text-primary">Pending: {checklistItems.filter((i: any) => i.taskStatus === 'pending').length}</span>
                </div>
              </div>
            </div>

            <div className="bg-gray-50 rounded-lg border border-gray-100">
              <div className="grid grid-cols-1 lg:grid-cols-3 divide-y lg:divide-y-0 lg:divide-x divide-gray-200">
                {/* Task Title */}
                <div className="p-3">
                  <h3 className="text-xs font-medium text-gray-500 mb-1 uppercase tracking-wider">Task Title</h3>
                  <div className="flex items-start">
                    <FileText size={16} className="mr-2 text-primary mt-0.5 flex-shrink-0" />
                    <span className="text-sm font-semibold text-gray-900">{task.taskTitle || task.type}</span>
                  </div>
                </div>

                {/* Work Description */}
                <div className="p-3">
                  <h3 className="text-xs font-medium text-gray-500 mb-1 uppercase tracking-wider">Work Description</h3>
                  <div className="flex items-start">
                    <Wrench size={16} className="mr-2 text-primary mt-0.5 flex-shrink-0" />
                    <span className="text-sm font-semibold text-gray-900">{task.description || 'No description provided'}</span>
                  </div>
                </div>

                {/* Start Date */}
                <div className="p-3">
                  <h3 className="text-xs font-medium text-gray-500 mb-1 uppercase tracking-wider">Start Date</h3>
                  <div className="flex items-center">
                    <Calendar size={16} className="mr-2 text-primary flex-shrink-0" />
                    <span className="text-sm font-semibold text-gray-900">{formatDate(task.startDate)}</span>
                  </div>
                </div>

                {/* End Date */}
                <div className="p-3">
                  <h3 className="text-xs font-medium text-gray-500 mb-1 uppercase tracking-wider">End Date</h3>
                  <div className="flex items-center">
                    <Calendar size={16} className="mr-2 text-primary flex-shrink-0" />
                    <span className="text-sm font-semibold text-gray-900">{formatDate(task.endDate || task.dueDate)}</span>
                  </div>
                </div>

                {/* Assigned To */}
                <div className="p-3 border-t lg:border-t-0">
                  <h3 className="text-xs font-medium text-gray-500 mb-1 uppercase tracking-wider">Assigned To</h3>
                  <div className="flex items-center">
                    <UserCircle size={16} className="mr-2 text-primary flex-shrink-0" />
                    <span className="text-sm font-semibold text-gray-900">{task.assignedTo || task.assignedToName || '-'}</span>
                  </div>
                </div>

                {/* Given By */}
                <div className="p-3 border-t lg:border-t-0">
                  <h3 className="text-xs font-medium text-gray-500 mb-1 uppercase tracking-wider">Given By</h3>
                  <div className="flex items-center">
                    <UserCircle size={16} className="mr-2 text-primary flex-shrink-0" />
                    <span className="text-sm font-semibold text-gray-900">{task.givenBy || '-'}</span>
                  </div>
                </div>

                {/* Estimated Cost */}
                <div className="p-3 border-t lg:border-t-0">
                  <h3 className="text-xs font-medium text-gray-500 mb-1 uppercase tracking-wider">Estimated Cost</h3>
                  <div className="flex items-center">
                    <span className="mr-2 text-primary font-sans text-base font-bold flex-shrink-0">₹</span>
                    <span className="text-sm font-semibold text-gray-900">
                      {task.type === 'Maintenance'
                        ? (history.reduce((acc, entry) => acc + (entry.items?.reduce((sum: number, item: any) => {
                          const val = Number(item.maintenanceCost);
                          return sum + (isNaN(val) ? 0 : val);
                        }, 0) || 0), 0)).toLocaleString()
                        : (task.detailsData?.reduce((acc: number, detail: any) => {
                          const val = Number(detail.cost);
                          return acc + (isNaN(val) ? 0 : val);
                        }, 0) || 0).toLocaleString()
                      }
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Tabs */}
          <div className="border-b border-gray-200 overflow-x-auto">
            <nav className="flex -mb-px min-w-max">
              {["details", "checklist", "history", "documents"].map((tab) => (
                <button
                  key={tab}
                  className={`py-4 px-4 md:px-6 font-medium text-sm border-b-2 whitespace-nowrap ${activeTab === tab
                    ? "border-primary text-primary"
                    : "border-transparent text-gray-500 hover:text-gray-700"
                    }`}
                  onClick={() => setActiveTab(tab)}
                >
                  {tab === "details" && <FileText size={16} className="inline mr-2" />}
                  {tab === "checklist" && <CheckCircle size={16} className="inline mr-2" />}
                  {tab === "history" && <Clock size={16} className="inline mr-2" />}
                  {tab === "documents" && <Paperclip size={16} className="inline mr-2" />}
                  {tab.charAt(0).toUpperCase() + tab.slice(1)}
                </button>
              ))}
            </nav>
          </div >

          {/* Tab Content */}
          <div className="p-4 md:p-6 flex flex-col">
            {/* Details Tab */}
            {
              activeTab === "details" && (
                <div className="flex flex-col border rounded-lg bg-white">
                  <div className="p-4 border-b">
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
                      <input
                        type="text"
                        placeholder="Search details..."
                        value={searchQuery}
                        onChange={(e) => { setSearchQuery(e.target.value); setCurrentPage(1); }}
                        className="w-full pl-10 pr-4 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
                      />
                    </div>
                  </div>
                  <div className="flex-1">
                    {/* Mobile View */}
                    <div className="block lg:hidden space-y-4 p-4">
                      {paginatedDetails.length > 0 ? (
                        paginatedDetails.map((item: any) => (
                          <div key={item.id} className="bg-white border rounded-lg p-4 shadow-sm">
                            <div className="flex justify-between items-start mb-3">
                              <div>
                                <span className="text-xs font-medium text-gray-500 uppercase">Task No</span>
                                <p className="font-medium text-gray-900">{item.taskNo || '-'}</p>
                              </div>
                              <span className={`px-2 py-1 text-xs font-medium rounded-full ${item.taskStatus === 'completed' ? 'bg-green-100 text-green-800' :
                                item.taskStatus === 'in-progress' ? 'bg-orange-100 text-orange-800' :
                                  item.taskStatus === 'pending' ? 'bg-primary/10 text-primary' : 'bg-gray-100 text-gray-800'
                                }`}>
                                {item.taskStatus === 'completed' ? 'Done' :
                                  item.taskStatus === 'in-progress' ? 'In Progress' :
                                    item.taskStatus === 'pending' ? 'Pending' : item.taskStatus || item.status}
                              </span>
                            </div>

                            <div className="space-y-3">
                              <div>
                                <span className="text-xs font-medium text-gray-500 uppercase">Description</span>
                                <p className="text-sm text-gray-700 mt-1">
                                  {item.description?.match(/\s-\s(\d{2}\/\d{2}\/\d{4})$/)
                                    ? item.description.replace(item.description.match(/\s-\s(\d{2}\/\d{2}\/\d{4})$/)[0], '')
                                    : item.description || item.problem_description}
                                </p>
                              </div>

                              <div className="grid grid-cols-2 gap-4">
                                <div>
                                  <span className="text-xs font-medium text-gray-500 uppercase">Date</span>
                                  <p className="text-sm text-gray-700">
                                    {item.description?.match(/\s-\s(\d{2}\/\d{2}\/\d{4})$/)
                                      ? item.description.match(/\s-\s(\d{2}\/\d{2}\/\d{4})$/)[1]
                                      : formatDate(item.updatedAt || item.date || task.createdAt)}
                                  </p>
                                </div>
                                <div>
                                  <span className="text-xs font-medium text-gray-500 uppercase">Sound</span>
                                  <p className="text-sm text-gray-700">{item.soundOfMachine || item.soundTest || '-'}</p>
                                </div>
                                <div>
                                  <span className="text-xs font-medium text-gray-500 uppercase">Temp</span>
                                  <p className="text-sm text-gray-700">{item.temperature || '-'}</p>
                                </div>
                                <div>
                                  <span className="text-xs font-medium text-gray-500 uppercase">Image</span>
                                  <div className="mt-1">
                                    {(item.image || item.image_url) ? (
                                      <a href={item.image || item.image_url} target="_blank" rel="noopener noreferrer" className="inline-block">
                                        <img src={item.image || item.image_url} alt="Evidence" className="h-10 w-10 object-cover rounded border" />
                                      </a>
                                    ) : <span className="text-sm text-gray-500">-</span>}
                                  </div>
                                </div>
                              </div>

                              {(item.taskStatus === 'in-progress' || item.taskStatus === 'pending') && item.isSubmitted && (
                                <div className="pt-2 border-t mt-2">
                                  <button
                                    onClick={() => handleCompleteChecklistItem(item.id)}
                                    className="w-full py-2 text-center text-primary border border-primary rounded-md hover:bg-primary/5 text-sm font-medium"
                                  >
                                    Mark as Complete
                                  </button>
                                </div>
                              )}
                            </div>
                          </div>
                        ))
                      ) : (
                        <div className="text-center py-8 text-gray-500 bg-white rounded-lg border border-dashed">
                          No details found.
                        </div>
                      )}
                    </div>

                    {/* Desktop View */}
                    <div className="hidden lg:block">
                      <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50 sticky top-0 z-10">
                          <tr>
                            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Task No</th>
                            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Task Date</th>
                            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Description</th>
                            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Task Sound Test</th>
                            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Task Temperature</th>
                            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Image</th>
                            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                          </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                          {task.type === 'Maintenance' ? (
                            paginatedDetails.length > 0 ? (
                              paginatedDetails.map((item: any) => (
                                <tr key={item.id} className="hover:bg-gray-50">
                                  <td className="px-4 py-3 text-sm font-medium text-gray-900 whitespace-nowrap">{item.taskNo}</td>
                                  <td className="px-4 py-3 text-sm text-gray-500">
                                    {item.description?.match(/\s-\s(\d{2}\/\d{2}\/\d{4})$/)
                                      ? item.description.match(/\s-\s(\d{2}\/\d{2}\/\d{4})$/)[1]
                                      : formatDate(item.updatedAt || task.createdAt)}
                                  </td>
                                  <td className="px-4 py-3 text-sm text-gray-500">
                                    {item.description?.match(/\s-\s(\d{2}\/\d{2}\/\d{4})$/)
                                      ? item.description.replace(item.description.match(/\s-\s(\d{2}\/\d{2}\/\d{4})$/)[0], '')
                                      : item.description}
                                  </td>
                                  <td className="px-4 py-3 text-sm text-gray-500">{item.soundOfMachine || '-'}</td>
                                  <td className="px-4 py-3 text-sm text-gray-500">{item.temperature || '-'}</td>
                                  <td className="px-4 py-3 text-sm text-gray-500">
                                    {item.image ? (
                                      <a href={item.image} target="_blank" rel="noopener noreferrer" className="inline-block">
                                        <img src={item.image} alt="Evidence" className="h-10 w-10 object-cover rounded border hover:scale-150 transition-transform" />
                                      </a>
                                    ) : '-'}
                                  </td>
                                  <td className={`px-4 py-3 text-sm font-medium ${item.taskStatus === 'completed' ? 'text-green-600' :
                                    item.taskStatus === 'in-progress' ? 'text-orange-600' :
                                      item.taskStatus === 'pending' ? 'text-primary' : 'text-gray-500'
                                    }`}>
                                    {item.taskStatus === 'completed' ? 'Done' :
                                      item.taskStatus === 'in-progress' ? 'In Progress' :
                                        item.taskStatus === 'pending' ? 'Pending' : item.taskStatus}
                                    {(item.taskStatus === 'in-progress' || item.taskStatus === 'pending') && item.isSubmitted && (
                                      <button
                                        onClick={() => handleCompleteChecklistItem(item.id)}
                                        className="ml-2 text-primary hover:text-primary-dark text-xs font-semibold underline"
                                      >
                                        Complete
                                      </button>
                                    )}
                                  </td>
                                </tr>
                              ))
                            ) : (
                              <tr>
                                <td colSpan={7} className="px-4 py-8 text-center text-gray-500">
                                  No details found.
                                </td>
                              </tr>
                            )
                          ) : (
                            paginatedDetails.map((detail: any) => (
                              <tr key={detail.id} className="hover:bg-gray-50">
                                <td className="px-4 py-3 text-sm font-medium text-gray-900">{detail.taskNo || '-'}</td>
                                <td className="px-4 py-3 text-sm text-gray-500">{formatDate(detail.date)}</td>
                                <td className="px-4 py-3 text-sm text-gray-500">{detail.description || detail.problem_description}</td>
                                <td className="px-4 py-3 text-sm text-gray-500">{detail.soundTest || '-'}</td>
                                <td className="px-4 py-3 text-sm text-gray-500">{detail.temperature || '-'}</td>
                                <td className="px-4 py-3 text-sm text-gray-500">
                                  {detail.image_url || detail.image ? (
                                    <a href={detail.image_url || detail.image} target="_blank" rel="noopener noreferrer" className="inline-block">
                                      <img src={detail.image_url || detail.image} alt="Evidence" className="h-10 w-10 object-cover rounded border hover:scale-150 transition-transform" />
                                    </a>
                                  ) : '-'}
                                </td>
                                <td className="px-4 py-3 text-sm text-green-600 font-medium">
                                  {detail.status === 'completed' ? 'Done' : detail.status}
                                </td>
                              </tr>
                            ))
                          )}
                          {task.type === 'Maintenance' && history.length === 0 && (
                            <tr>
                              <td colSpan={6} className="px-4 py-8 text-center text-gray-500">
                                No details available yet. Submit a checklist to see details.
                              </td>
                            </tr>
                          )}
                        </tbody>
                      </table>
                    </div>
                  </div>
                  <PaginationControls totalItems={filteredDetails.length} />
                </div>
              )
            }

            {/* Checklist Tab */}
            {
              activeTab === "checklist" && (
                task.status === 'completed' ? (
                  <div className="flex flex-col items-center justify-center py-12 text-gray-500">
                    <CheckCircle size={48} className="text-green-500 mb-4" />
                    <h3 className="text-lg font-medium text-gray-900">Task Completed</h3>
                    <p className="mt-2 text-center max-w-md">
                      This task has been marked as completed. The checklist is no longer editable.
                      You can view the submitted details in the History or Details tab.
                    </p>
                  </div>
                ) : (
                  <div className="space-y-4 flex flex-col">
                    <div className="flex flex-col sm:flex-row justify-between gap-2">
                      <div className="flex-1 relative">
                        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
                        <input
                          type="text"
                          placeholder="Search checklist..."
                          value={searchQuery}
                          onChange={(e) => { setSearchQuery(e.target.value); setCurrentPage(1); }}
                          className="w-full pl-10 pr-4 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
                        />
                      </div>
                      <button
                        onClick={handleSelectAll}
                        className="hidden lg:block px-4 py-2 text-sm text-primary border border-primary rounded-md hover:bg-primary/5 whitespace-nowrap"
                      >
                        {paginatedChecklist.length > 0 && paginatedChecklist.every(item => selectedRows.includes(item.id)) ? "Deselect Page" : "Select Page"}
                      </button>
                      <button
                        onClick={handleSubmitChecklist}
                        disabled={selectedRows.length === 0}
                        className="hidden lg:flex px-4 py-2 text-sm text-white bg-primary rounded-md hover:bg-primary-dark disabled:bg-gray-400 items-center justify-center"
                      >
                        <Save size={16} className="mr-2" />
                        Submit Checklist ({selectedRows.length})
                      </button>
                    </div>

                    {/* Mobile View */}
                    <div className="block lg:hidden space-y-4 pr-1">
                      {paginatedChecklist.length === 0 ? (
                        <div className="text-center py-8 text-gray-500">
                          No checklist items found.
                        </div>
                      ) : (
                        paginatedChecklist.map((item) => (
                          <div key={item.id} className={`border rounded-xl p-4 shadow-sm transition-all ${selectedRows.includes(item.id) ? "bg-primary/5 border-primary/30 ring-1 ring-primary/30" : "bg-white border-gray-200"}`}>
                            <div className="flex items-start gap-3 mb-4">
                              <input
                                type="checkbox"
                                checked={selectedRows.includes(item.id)}
                                onChange={() => handleRowSelect(item.id)}
                                className="mt-1.5 h-5 w-5 text-primary rounded border-gray-300 focus:ring-primary"
                              />
                              <div className="flex-1 min-w-0">
                                <div className="flex justify-between items-start">
                                  <h4 className="font-semibold text-gray-900 text-base">{item.taskNo}</h4>
                                  <span className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded-full whitespace-nowrap ml-2">
                                    {item.description?.match(/\s-\s(\d{2}\/\d{2}\/\d{4})$/)
                                      ? item.description.match(/\s-\s(\d{2}\/\d{2}\/\d{4})$/)[1]
                                      : formatDate(task.dueDate || task.createdAt || new Date())}
                                  </span>
                                </div>
                                <p className="text-sm text-gray-600 mt-1 leading-relaxed">
                                  {item.description?.match(/\s-\s(\d{2}\/\d{2}\/\d{4})$/)
                                    ? item.description.replace(item.description.match(/\s-\s(\d{2}\/\d{2}\/\d{4})$/)[0], '')
                                    : item.description}
                                </p>
                              </div>
                            </div>

                            <div className={`space-y-4 ${!selectedRows.includes(item.id) ? 'opacity-50 pointer-events-none grayscale-[0.5]' : ''}`}>
                              <div>
                                <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5">Department</label>
                                <input
                                  type="text"
                                  value={item.department}
                                  readOnly
                                  disabled={!selectedRows.includes(item.id)}
                                  className="w-full px-3 py-2.5 text-sm border border-gray-200 rounded-lg bg-gray-50 text-gray-600 focus:outline-none"
                                />
                              </div>

                              <div className="grid grid-cols-2 gap-4">
                                <div>
                                  <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5">Status</label>
                                  <select
                                    value={item.taskStatus}
                                    onChange={(e) => handleChecklistUpdate(item.id, "taskStatus", e.target.value)}
                                    disabled={!selectedRows.includes(item.id)}
                                    className="w-full px-3 py-2.5 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-primary bg-white disabled:bg-gray-100"
                                  >
                                    <option value="pending">Pending</option>
                                    <option value="in-progress">In Progress</option>
                                    <option value="completed">Completed</option>
                                  </select>
                                </div>

                                <div>
                                  <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5">Sound</label>
                                  <select
                                    value={item.soundOfMachine}
                                    onChange={(e) => handleChecklistUpdate(item.id, "soundOfMachine", e.target.value)}
                                    disabled={!selectedRows.includes(item.id)}
                                    className="w-full px-3 py-2.5 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-primary bg-white disabled:bg-gray-100"
                                  >
                                    <option value="">Select...</option>
                                    <option value="Ok">Ok</option>
                                    <option value="Good">Good</option>
                                    <option value="Bad">Bad</option>
                                    <option value="Need Repair">Repair</option>
                                  </select>
                                </div>
                              </div>

                              <div className="grid grid-cols-2 gap-4">
                                <div>
                                  <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5">Temp</label>
                                  <input
                                    type="text"
                                    value={item.temperature}
                                    onChange={(e) => handleChecklistUpdate(item.id, "temperature", e.target.value)}
                                    disabled={!selectedRows.includes(item.id)}
                                    placeholder="e.g. 45°C"
                                    className="w-full px-3 py-2.5 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-primary disabled:bg-gray-100"
                                  />
                                </div>

                                <div>
                                  <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5">Cost</label>
                                  <div className="relative rounded-lg shadow-sm">
                                    <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                                      <span className="text-gray-500 sm:text-sm">₹</span>
                                    </div>
                                    <input
                                      type="number"
                                      value={item.maintenanceCost}
                                      onChange={(e) => handleChecklistUpdate(item.id, "maintenanceCost", e.target.value)}
                                      disabled={!selectedRows.includes(item.id)}
                                      placeholder="0"
                                      className="w-full pl-7 px-3 py-2.5 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-primary disabled:bg-gray-100"
                                    />
                                  </div>
                                </div>
                              </div>

                              <div>
                                <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5">Remarks</label>
                                <textarea
                                  value={item.remarks}
                                  onChange={(e) => handleChecklistUpdate(item.id, "remarks", e.target.value)}
                                  disabled={!selectedRows.includes(item.id)}
                                  rows={2}
                                  className="w-full px-3 py-2.5 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-primary resize-none disabled:bg-gray-100"
                                  placeholder="Add any remarks..."
                                />
                              </div>

                              <div>
                                <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5">Image</label>
                                <div className="flex items-center gap-3">
                                  <label className={`flex-1 flex items-center justify-center px-4 py-2.5 text-sm font-medium text-primary border border-primary border-dashed rounded-lg hover:bg-primary/5 transition-colors ${!selectedRows.includes(item.id) ? 'cursor-not-allowed opacity-50' : 'cursor-pointer'}`}>
                                    <Camera size={18} className="mr-2" />
                                    {item.image ? "Change Image" : "Upload Image"}
                                    <input
                                      type="file"
                                      accept="image/*"
                                      onChange={(e) => handleImageUpload(item.id, e)}
                                      disabled={!selectedRows.includes(item.id)}
                                      className="hidden"
                                    />
                                  </label>
                                  {item.image && (
                                    <a href={item.image} target="_blank" rel="noopener noreferrer" className="flex-shrink-0">
                                      <img src={item.image} alt="Preview" className="h-10 w-10 object-cover rounded-lg border border-gray-200" />
                                    </a>
                                  )}
                                </div>
                              </div>

                              <div className="pt-3 border-t border-gray-100">
                                <button
                                  onClick={() => handleSingleSubmit(item)}
                                  disabled={!selectedRows.includes(item.id)}
                                  className="w-full flex justify-center items-center px-4 py-3 bg-primary text-white text-sm font-semibold rounded-lg hover:bg-primary-dark active:bg-primary transition-colors shadow-sm disabled:bg-gray-300 disabled:cursor-not-allowed"
                                >
                                  <Save size={18} className="mr-2" />
                                  Submit Task
                                </button>
                              </div>
                            </div>
                          </div>
                        ))
                      )}
                    </div>

                    {/* Desktop View */}
                    <div className="hidden lg:block border rounded-lg overflow-x-auto">
                      <table className="min-w-[1500px] divide-y divide-gray-200 table-fixed">
                        <thead className="bg-gray-50 sticky top-0 z-10">
                          <tr>
                            <th className="px-4 py-3 text-left w-12">
                              <input
                                type="checkbox"
                                checked={paginatedChecklist.length > 0 && paginatedChecklist.every(item => selectedRows.includes(item.id))}
                                onChange={handleSelectAll}
                                className="h-4 w-4 text-primary rounded"
                              />
                            </th>
                            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase w-32">Task No</th>
                            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase w-32">Date</th>
                            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase w-64">Description</th>
                            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase w-40">Department</th>
                            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase w-32">Task Status</th>
                            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase w-32">Image</th>
                            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase w-32">Temp</th>
                            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase w-48">Remarks</th>
                            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase w-48">Sound</th>
                            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase w-32">Cost</th>
                          </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                          {paginatedChecklist.length === 0 ? (
                            <tr>
                              <td colSpan={11} className="px-4 py-8 text-center text-gray-500">
                                No checklist items found.
                              </td>
                            </tr>
                          ) : (
                            paginatedChecklist.map((item) => (
                              <tr key={item.id} className={selectedRows.includes(item.id) ? "bg-primary/5" : "hover:bg-gray-50"}>
                                <td className="px-4 py-3">
                                  <input
                                    type="checkbox"
                                    checked={selectedRows.includes(item.id)}
                                    onChange={() => handleRowSelect(item.id)}
                                    className="h-4 w-4 text-primary rounded"
                                  />
                                </td>
                                <td className="px-4 py-3 text-sm font-medium text-gray-900 whitespace-nowrap">{item.taskNo}</td>
                                <td className="px-4 py-3 text-sm text-gray-500 whitespace-nowrap">
                                  {item.description?.match(/\s-\s(\d{2}\/\d{2}\/\d{4})$/)
                                    ? item.description.match(/\s-\s(\d{2}\/\d{2}\/\d{4})$/)[1]
                                    : formatDate(task.dueDate || task.createdAt || new Date())}
                                </td>
                                <td className="px-4 py-3 text-sm text-gray-500 break-words whitespace-normal">
                                  {item.description?.match(/\s-\s(\d{2}\/\d{2}\/\d{4})$/)
                                    ? item.description.replace(item.description.match(/\s-\s(\d{2}\/\d{2}\/\d{4})$/)[0], '')
                                    : item.description}
                                </td>
                                <td className="px-4 py-3 text-sm text-gray-500 break-words">{item.department}</td>
                                <td className="px-4 py-3 text-sm">
                                  <select
                                    value={item.taskStatus}
                                    onChange={(e) => handleChecklistUpdate(item.id, "taskStatus", e.target.value)}
                                    className="px-2 py-1 text-sm border rounded"
                                    disabled={!selectedRows.includes(item.id)}
                                  >
                                    <option value="pending">Pending</option>
                                    <option value="in-progress">In Progress</option>
                                    <option value="completed">Completed</option>
                                  </select>
                                </td>
                                <td className="px-4 py-3">
                                  <label className={`flex items-center gap-2 cursor-pointer ${!selectedRows.includes(item.id) ? 'opacity-50 pointer-events-none' : ''}`}>
                                    <Camera size={16} className="text-primary" />
                                    <input
                                      type="file"
                                      accept="image/*"
                                      onChange={(e) => handleImageUpload(item.id, e)}
                                      className="hidden"
                                      disabled={!selectedRows.includes(item.id)}
                                    />
                                    {item.image && <img src={item.image} alt="Preview" className="h-8 w-8 object-cover rounded" />}
                                  </label>
                                </td>
                                <td className="px-4 py-3">
                                  <div className="flex items-center gap-1">
                                    <input
                                      type="text"
                                      value={item.temperature || ''}
                                      onChange={(e) => handleChecklistUpdate(item.id, "temperature", e.target.value)}
                                      className="px-2 py-1.5 text-sm border border-gray-300 rounded-md focus:ring-primary focus:border-primary w-full"
                                      placeholder="00°C"
                                      disabled={!selectedRows.includes(item.id)}
                                    />
                                  </div>
                                </td>
                                <td className="px-4 py-3">
                                  <textarea
                                    value={item.remarks}
                                    onChange={(e) => handleChecklistUpdate(item.id, "remarks", e.target.value)}
                                    rows={1}
                                    className="px-2 py-1 text-sm border rounded w-full"
                                    disabled={!selectedRows.includes(item.id)}
                                  />
                                </td>
                                <td className="px-4 py-3">
                                  <select
                                    value={item.soundOfMachine}
                                    onChange={(e) => handleChecklistUpdate(item.id, "soundOfMachine", e.target.value)}
                                    className="px-3 py-1.5 text-sm border border-gray-300 rounded-md focus:ring-primary focus:border-primary w-full"
                                    disabled={!selectedRows.includes(item.id)}
                                  >
                                    <option value="">Select...</option>
                                    <option value="Ok">Ok</option>
                                    <option value="Good">Good</option>
                                    <option value="Bad">Bad</option>
                                    <option value="Need Repair">Need Repair</option>
                                  </select>
                                </td>
                                <td className="px-4 py-3">
                                  <div className="relative rounded-md shadow-sm">
                                    <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-2">
                                      <span className="text-gray-500 sm:text-sm">₹</span>
                                    </div>
                                    <input
                                      type="number"
                                      value={item.maintenanceCost || ''}
                                      onChange={(e) => handleChecklistUpdate(item.id, "maintenanceCost", e.target.value)}
                                      className="block w-full rounded-md border-gray-300 pl-6 py-1.5 text-sm focus:border-primary focus:ring-primary"
                                      placeholder="0"
                                      disabled={!selectedRows.includes(item.id)}
                                    />
                                  </div>
                                </td>

                              </tr>
                            ))
                          )}
                        </tbody>
                      </table>
                    </div>
                    <PaginationControls totalItems={filteredChecklist.length} />
                  </div>
                )
              )
            }


            {/* History Tab */}
            {
              activeTab === "history" && (
                <div className="flex flex-col border rounded-lg bg-white">
                  <div className="p-4 border-b">
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
                      <input
                        type="text"
                        placeholder="Search history..."
                        value={searchQuery}
                        onChange={(e) => { setSearchQuery(e.target.value); setCurrentPage(1); }}
                        className="w-full pl-10 pr-4 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
                      />
                    </div>
                  </div>
                  {paginatedHistory.length === 0 ? (
                    <div className="text-center py-8 text-gray-500">
                      No history found.
                    </div>
                  ) : (
                    <div className="flex-1">
                      {/* Mobile View */}
                      <div className="block lg:hidden space-y-4 p-4">
                        {paginatedHistory.map((item: any, idx: number) => (
                          <div key={`${item.entryId}-${idx}`} className="bg-white border rounded-lg p-4 shadow-sm">
                            <div className="flex justify-between items-start mb-3">
                              <div>
                                <span className="text-xs font-medium text-gray-500 uppercase">Task No</span>
                                <p className="font-medium text-gray-900">{item.taskNo}</p>
                              </div>
                              <span className={`px-2 py-1 text-xs font-medium rounded-full ${item.taskStatus === 'completed' ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}`}>
                                {item.taskStatus === 'completed' ? 'Done' : item.taskStatus}
                              </span>
                            </div>

                            <div className="space-y-3">
                              <div>
                                <span className="text-xs font-medium text-gray-500 uppercase">Description</span>
                                <p className="text-sm text-gray-700 mt-1">
                                  {item.description?.match(/\s-\s(\d{2}\/\d{2}\/\d{4})$/)
                                    ? item.description.replace(item.description.match(/\s-\s(\d{2}\/\d{2}\/\d{4})$/)[0], '')
                                    : item.description}
                                </p>
                              </div>

                              <div className="grid grid-cols-2 gap-4">
                                <div>
                                  <span className="text-xs font-medium text-gray-500 uppercase">Date</span>
                                  <p className="text-sm text-gray-700">
                                    {item.description?.match(/\s-\s(\d{2}\/\d{2}\/\d{4})$/)
                                      ? item.description.match(/\s-\s(\d{2}\/\d{2}\/\d{4})$/)[1]
                                      : formatDate(item.entryDate)}
                                  </p>
                                </div>
                                <div>
                                  <span className="text-xs font-medium text-gray-500 uppercase">User</span>
                                  <p className="text-sm text-gray-700">{item.entryUser || 'Unknown User'}</p>
                                </div>
                                <div>
                                  <span className="text-xs font-medium text-gray-500 uppercase">Sound</span>
                                  <p className="text-sm text-gray-700">{item.soundOfMachine || "-"}</p>
                                </div>
                                <div>
                                  <span className="text-xs font-medium text-gray-500 uppercase">Temp</span>
                                  <p className="text-sm text-gray-700">{item.temperature || "-"}</p>
                                </div>
                                <div>
                                  <span className="text-xs font-medium text-gray-500 uppercase">Cost</span>
                                  <p className="text-sm text-gray-700">₹{item.maintenanceCost || "0"}</p>
                                </div>
                                <div>
                                  <span className="text-xs font-medium text-gray-500 uppercase">Image</span>
                                  <div className="mt-1">
                                    {item.image ? (
                                      <a href={item.image} target="_blank" rel="noopener noreferrer" className="text-primary flex items-center text-sm">
                                        <Paperclip size={14} className="mr-1" /> View
                                      </a>
                                    ) : <span className="text-sm text-gray-500">-</span>}
                                  </div>
                                </div>
                              </div>

                              {item.remarks && (
                                <div>
                                  <span className="text-xs font-medium text-gray-500 uppercase">Remarks</span>
                                  <p className="text-sm text-gray-700 bg-gray-50 p-2 rounded mt-1">{item.remarks}</p>
                                </div>
                              )}

                              {(item.taskStatus === 'in-progress' || item.taskStatus === 'pending') && (
                                <div className="pt-2 border-t mt-2">
                                  <button
                                    onClick={() => handleCompleteHistoryItem(item.entryId, item.taskNo)}
                                    className="w-full py-2 text-center text-primary border border-primary rounded-md hover:bg-primary/5 text-sm font-medium"
                                  >
                                    Mark as Complete
                                  </button>
                                </div>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>

                      {/* Desktop View */}
                      <div className="hidden lg:block overflow-x-auto">
                        <table className="min-w-full divide-y divide-gray-200 table-fixed">
                          <thead className="bg-gray-50 sticky top-0 z-10">
                            <tr>
                              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase w-24">Task No</th>
                              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase w-24">Date</th>
                              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase w-32">Department</th>
                              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase w-64">Description</th>
                              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase w-32">User</th>
                              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase w-24">Status</th>
                              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase w-24">Sound</th>
                              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase w-24">Temp</th>
                              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase w-24">Cost</th>
                              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase w-40">Remarks</th>
                              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase w-24">Image</th>
                            </tr>
                          </thead>
                          <tbody className="bg-white divide-y divide-gray-200">
                            {paginatedHistory.map((item: any, idx: number) => (
                              <tr key={`${item.entryId}-${idx}`} className="hover:bg-gray-50">
                                <td className="px-4 py-3 text-sm font-medium text-gray-900 break-words">{item.taskNo}</td>
                                <td className="px-4 py-3 text-sm text-gray-500 break-words">
                                  {item.description?.match(/\s-\s(\d{2}\/\d{2}\/\d{4})$/)
                                    ? item.description.match(/\s-\s(\d{2}\/\d{2}\/\d{4})$/)[1]
                                    : formatDate(item.entryDate)}
                                </td>
                                <td className="px-4 py-3 text-sm text-gray-500 break-words">{item.department}</td>
                                <td className="px-4 py-3 text-sm text-gray-500 break-words">
                                  {item.description?.match(/\s-\s(\d{2}\/\d{2}\/\d{4})$/)
                                    ? item.description.replace(item.description.match(/\s-\s(\d{2}\/\d{2}\/\d{4})$/)[0], '')
                                    : item.description}
                                </td>
                                <td className="px-4 py-3 text-sm text-gray-500 break-words">{item.entryUser || 'Unknown User'}</td>
                                <td className="px-4 py-3 text-sm break-words">
                                  <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${item.taskStatus === 'completed' ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}`}>
                                    {item.taskStatus === 'completed' ? 'Done' : item.taskStatus}
                                  </span>
                                  {(item.taskStatus === 'in-progress' || item.taskStatus === 'pending') && (
                                    <button
                                      onClick={() => handleCompleteHistoryItem(item.entryId, item.taskNo)}
                                      className="ml-2 text-primary hover:text-primary-dark text-xs font-semibold underline"
                                    >
                                      Complete
                                    </button>
                                  )}
                                </td>
                                <td className="px-4 py-3 text-sm text-gray-500 break-words">{item.soundOfMachine || "-"}</td>
                                <td className="px-4 py-3 text-sm text-gray-500 break-words">{item.temperature || "-"}</td>
                                <td className="px-4 py-3 text-sm text-gray-500 break-words">₹{item.maintenanceCost || "0"}</td>
                                <td className="px-4 py-3 text-sm text-gray-500 break-words" title={item.remarks}>{item.remarks || "-"}</td>
                                <td className="px-4 py-3 text-sm text-gray-500 break-words">
                                  {item.image ? (
                                    <a href={item.image} target="_blank" rel="noopener noreferrer" className="text-primary hover:text-primary-dark flex items-center">
                                      <Paperclip size={14} className="mr-1" /> View
                                    </a>
                                  ) : "-"}
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  )}
                  <PaginationControls totalItems={filteredHistory.length} />
                </div>
              )
            }

            {/* Documents Tab */}
            {
              activeTab === "documents" && (
                <div>


                  {/* Checklist Images Table */}
                  {checklistItems.some((item: any) => item.image) && (
                    <div>
                      {/* Mobile View */}
                      <div className="block lg:hidden space-y-4">
                        {checklistItems.filter((item: any) => item.image).map((item: any) => (
                          <div key={item.id} className="bg-white border rounded-lg p-4 shadow-sm">
                            <div className="flex justify-between items-start mb-3">
                              <div>
                                <span className="text-xs font-medium text-gray-500 uppercase">Task No</span>
                                <p className="font-medium text-gray-900">{item.taskNo}</p>
                              </div>
                              <a href={item.image} target="_blank" rel="noopener noreferrer" className="text-primary bg-primary/5 p-2 rounded-full">
                                <Paperclip size={16} />
                              </a>
                            </div>

                            <div className="space-y-3">
                              <div>
                                <span className="text-xs font-medium text-gray-500 uppercase">Description</span>
                                <p className="text-sm text-gray-700 mt-1">{item.description}</p>
                              </div>

                              <div className="grid grid-cols-2 gap-4">
                                <div>
                                  <span className="text-xs font-medium text-gray-500 uppercase">Uploaded By</span>
                                  <p className="text-sm text-gray-700">
                                    {history.find((e: any) => e.items.some((i: any) => i.taskNo === item.taskNo))?.user || task.assigned_to || 'Admin'}
                                  </p>
                                </div>
                                <div>
                                  <span className="text-xs font-medium text-gray-500 uppercase">Date</span>
                                  <p className="text-sm text-gray-700">{formatDate(item.updatedAt || task.createdAt)}</p>
                                </div>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>

                      {/* Desktop View */}
                      <div className="hidden lg:block overflow-hidden border rounded-lg">
                        <table className="min-w-full divide-y divide-gray-200">
                          <thead className="bg-gray-50">
                            <tr>
                              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Task No</th>
                              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Description</th>
                              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Uploaded By</th>
                              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Date</th>
                              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
                            </tr>
                          </thead>
                          <tbody className="bg-white divide-y divide-gray-200">
                            {checklistItems.filter((item: any) => item.image).map((item: any) => (
                              <tr key={item.id} className="hover:bg-gray-50">
                                <td className="px-6 py-4 text-sm font-medium text-gray-900 whitespace-nowrap">{item.taskNo}</td>
                                <td className="px-6 py-4 text-sm text-gray-500">{item.description}</td>
                                <td className="px-6 py-4 text-sm text-gray-500">
                                  {history.find((e: any) => e.items.some((i: any) => i.taskNo === item.taskNo))?.user || task.assigned_to || 'Admin'}
                                </td>
                                <td className="px-6 py-4 text-sm text-gray-500">{formatDate(item.updatedAt || task.createdAt)}</td>
                                <td className="px-6 py-4 text-sm text-gray-500">
                                  <a href={item.image} target="_blank" rel="noopener noreferrer" className="text-primary hover:text-primary-dark flex items-center">
                                    <Paperclip size={16} className="mr-1" />
                                    View
                                  </a>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  )}
                </div>
              )
            }
          </div >
        </div >
      </div >


    </div >
  );
};

export default TaskDetails;