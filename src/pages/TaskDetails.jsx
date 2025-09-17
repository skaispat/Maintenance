import React, { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import {
  ChevronLeft,
  Clock,
  CheckCircle,
  FileText,
  User,
  Wrench,
  DollarSign,
  Calendar,
  AlertTriangle,
  Upload,
  MessageSquare,
  Paperclip,
  Send,
  X,
} from "lucide-react";
import toast from "react-hot-toast";
import axios from "axios";
import useAuthStore from "../store/authStore";
const mockTask = {
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
  description:
    "Send control unit for recalibration and firmware update. The machine has been showing inconsistent precision measurements over the past month. The vendor needs to perform a full diagnostic, recalibration, and update the firmware to the latest version to address known issues with the control system.",
  estimatedCost: 2800,
  checklist: [
    { id: 1, text: "Disconnect power and tag out machine", completed: true },
    { id: 2, text: "Remove control unit from housing", completed: true },
    {
      id: 3,
      text: "Pack for shipping with appropriate padding",
      completed: true,
    },
    { id: 4, text: "Complete shipping documentation", completed: true },
    { id: 5, text: "Send to vendor's service center", completed: true },
    { id: 6, text: "Vendor: Run diagnostic tests", completed: true },
    { id: 7, text: "Vendor: Update firmware to v4.2.1", completed: false },
    { id: 8, text: "Vendor: Recalibrate axis alignment", completed: false },
    { id: 9, text: "Vendor: Complete performance tests", completed: false },
    { id: 10, text: "Return shipping to factory", completed: false },
    { id: 11, text: "Reinstall and test operation", completed: false },
  ],
  history: [
    {
      id: 1,
      date: "2024-03-01",
      user: "John Smith",
      action: "Created maintenance task",
      notes: "Scheduled based on detection of precision issues",
    },
    {
      id: 2,
      date: "2024-03-05",
      user: "Sarah Johnson",
      action: "Updated task priority to High",
      notes: "Production schedule requires this to be fixed ASAP",
    },
    {
      id: 3,
      date: "2024-03-10",
      user: "Mike Anderson",
      action: "Prepared for shipping",
      notes: "Disconnected and packed the control unit for shipping",
    },
    {
      id: 4,
      date: "2024-03-12",
      user: "Mike Anderson",
      action: "Shipped to vendor",
      notes: "Tracking #: SHIP12345678",
    },
    {
      id: 5,
      date: "2024-03-15",
      user: "Vendor: Tech Support",
      action: "Received unit",
      notes: "Initial inspection shows no physical damage",
    },
    {
      id: 6,
      date: "2024-03-17",
      user: "Vendor: Tech Support",
      action: "Diagnostic complete",
      notes: "Found memory corruption and alignment drift issues",
    },
  ],
  comments: [
    {
      id: 1,
      user: "John Smith",
      timestamp: "2024-03-01T10:30:00",
      text: "Please make sure to document all firmware versions before and after the update.",
    },
    {
      id: 2,
      user: "Sarah Johnson",
      timestamp: "2024-03-02T14:15:00",
      text: "I've added this to the priority list. We need this back in operation by month end for the new production run.",
    },
    {
      id: 3,
      user: "Vendor: Tech Support",
      timestamp: "2024-03-17T09:45:00",
      text: "We've identified the issue. The control board has a corrupted memory sector and the Z-axis calibration is out of spec. We'll need to replace one chip and recalibrate all axes. This should be covered under your service agreement.",
    },
  ],
  documents: [
    {
      id: 1,
      name: "Service Request Form.pdf",
      type: "PDF",
      uploadedBy: "John Smith",
      date: "2024-03-01",
    },
    {
      id: 2,
      name: "Shipping Documentation.pdf",
      type: "PDF",
      uploadedBy: "Mike Anderson",
      date: "2024-03-12",
    },
    {
      id: 3,
      name: "Initial Diagnostic Report.pdf",
      type: "PDF",
      uploadedBy: "Vendor: Tech Support",
      date: "2024-03-17",
    },
  ],
};

const TaskDetails = () => {
   const { user } = useAuthStore(); 
  const { taskNo, serialNo, taskType } = useParams();
  const [allRelatedTasks, setAllRelatedTasks] = useState([]);
  const [machineName, setMachineName] = useState("");
  const [loading, setLoading] = useState(true);
  const [taskView, setTaskView] = useState("Todays Tasks");
  const [checkedItems, setCheckedItems] = useState({});
  const [taskStatuses, setTaskStatuses] = useState({});
  const [remarks, setRemarks] = useState({});
  const [imageFiles, setImageFiles] = useState({});
  const [submittingTasks, setSubmittingTasks] = useState({});
  const [task] = useState(mockTask);
  const [activeTab, setActiveTab] = useState("details");
  const [commentText, setCommentText] = useState("");
  const [showUpdateForm, setShowUpdateForm] = useState(false);
  const [updateStatus, setUpdateStatus] = useState(task.status);
  const [checklist, setChecklist] = useState(task.checklist);
  const [completedTasks, setCompletedTasks] = useState([]);
  const [pendingTasks, setPendingTasks] = useState([]);
  const [repairCosts, setRepairCosts] = useState({});
  const [soundStatuses, setSoundStatuses] = useState({});
  const [temperatures, setTemperatures] = useState({});
  const [taskProgress, setTaskProgress] = useState(0);

  // console.log("pendingTasks", pendingTasks);

  const SCRIPT_URL =
    "https://script.google.com/macros/s/AKfycbzWDU77ND7kYIIf__m_v3hlFv74-lF68mgSMjb0OadKnNU4XJFr74zAqnDQG0FARtjd/exec";
  const SHEET_ID = "1lE5TdGcbmwVcVqbx-jftPIdmoGgg1DApNn4t9jZvGN8";
  const FOLDER_ID = "1KTGZSyhcps7Vv8unxJKTDR68PBGQtCfH";

  const fetchMachineRelatedTasks = async () => {
    setLoading(true);
    try {
      const sheetName = taskNo.startsWith("TM")
        ? "Maitenance Task Assign"
        : "Repair Task Assign";

      // Use same URL format as Tasks.js with filtering parameters
      const baseParams = new URLSearchParams({
        sheetId: SHEET_ID,
        page: "1",
        pageSize: "1000",
        search: "",
        department: "all",
        status: "all", 
        location: "all",
        userRole: user?.role || "",
        username: user?.username || ""
      });

      const apiUrl = `${SCRIPT_URL}?${baseParams}&sheet=${encodeURIComponent(sheetName)}`;
      
      console.log("🔗 TaskDetails API URL:", apiUrl);

      const res = await axios.get(apiUrl);

      console.log("📡 TaskDetails API Response:", res.data);

      // Check if response has valid structure
      if (!res.data.success || !res.data.table || !res.data.table.cols) {
        console.error("❌ Invalid API response structure:", res.data);
        
        // Fallback: try old format without pagination
        const fallbackUrl = `${SCRIPT_URL}?sheetId=${SHEET_ID}&sheet=${encodeURIComponent(sheetName)}`;
        console.log("🔄 Trying fallback URL:", fallbackUrl);
        
        const fallbackRes = await axios.get(fallbackUrl);
        console.log("📡 Fallback API Response:", fallbackRes.data);
        
        if (!fallbackRes.data.table || !fallbackRes.data.table.cols) {
          console.error("❌ Fallback also failed");
          setAllRelatedTasks([]);
          setCompletedTasks([]);
          setPendingTasks([]);
          return;
        }
        
        // Use fallback response
        res.data = fallbackRes.data;
      }

      const columns = res.data.table.cols.map((col) => col?.label || "");
      const rows = res.data.table.rows || [];

      console.log(`📋 Found ${columns.length} columns and ${rows.length} rows`);

      const formattedData = rows.map((row) => {
        const obj = {};
        if (row && row.c) {
          row.c.forEach((cell, i) => {
            if (columns[i]) {
              obj[columns[i]] = cell?.v || "";
            }
          });
        }
        return obj;
      }).filter(obj => Object.keys(obj).length > 0);

      console.log(`📊 Formatted ${formattedData.length} records`);
      console.log("Looking for serialNo:", serialNo);
      console.log("Looking for taskNo:", taskNo);

      // Frontend filtering for additional security
      let userFilteredData = formattedData;
      
      console.log(`👤 User role: ${user?.role}, Username: ${user?.username}`);
      
      if (user?.role === 'user') {
        // Regular user को सिर्फ उसके assigned tasks दिखाएं
        userFilteredData = formattedData.filter(task => 
          task["Doer Name"]?.toLowerCase() === user.username?.toLowerCase()
        );
        console.log(`🔒 User filtering: ${formattedData.length} → ${userFilteredData.length} records`);
      } else if (user?.role === 'admin') {
        // Admin को सभी tasks दिखाएं (no filtering)
        userFilteredData = formattedData;
        console.log(`🔓 Admin access: showing all ${formattedData.length} records`);
      } else {
        // Unknown role - show all by default
        console.log(`⚠️ Unknown role: ${user?.role}, showing all records`);
        userFilteredData = formattedData;
      }

      // First find the specific task we're looking at
      const currentTask = userFilteredData.find(
        (row) => row["Serial No"] === serialNo || row["Task No"] === taskNo
      );

      console.log("Current task found:", currentTask);

      if (!currentTask) {
        console.warn("⚠️ No matching task found for serialNo:", serialNo, "or taskNo:", taskNo);
        setAllRelatedTasks([]);
        setCompletedTasks([]);
        setPendingTasks([]);
        return;
      }

      const currentMachineName = currentTask["Machine Name"];
      const currentSerialNo = currentTask["Serial No"];
      setMachineName(currentMachineName);

      console.log("Machine Name:", currentMachineName);
      console.log("Serial No:", currentSerialNo);

      // Debug: Check all machine names in the data
      console.log("🔍 All Machine Names in data:", 
        [...new Set(userFilteredData.map(row => `"${row["Machine Name"]}"`))]
      );
      
      // Debug: Check all Serial Numbers in the data  
      console.log("🔍 All Serial Numbers in data:",
        [...new Set(userFilteredData.map(row => `"${row["Serial No"]}"`))]
      );

      // Filter tasks by Machine Name pattern matching
      // "Conveyor Rolls" के सभी variants ढूंढने के लिए
      const machineBaseName = currentMachineName?.trim().toLowerCase();
      
      console.log("🔍 Current base machine type:", machineBaseName);

      // Check if current machine contains keywords
      const isConveyorMachine = machineBaseName.includes("conveyor");
      const isRollsMachine = machineBaseName.includes("rolls");
      const isCraneMachine = machineBaseName.includes("crane");
      const isPumpMachine = machineBaseName.includes("pump");
      const isStandMachine = machineBaseName.includes("stand");

      // Filter tasks by keyword matching
      let relatedTasks;
      
      if (user?.role === 'admin') {
        // Admin को सभी machines के tasks दिखाएं
        relatedTasks = userFilteredData;
        console.log(`🔓 Admin: showing all tasks from all machines: ${relatedTasks.length}`);
      } else {
        // User को सिर्फ related machine type के tasks दिखाएं
        relatedTasks = userFilteredData.filter((row) => {
          const rowMachineName = row["Machine Name"]?.trim().toLowerCase() || "";
          
          // Exact match first
          if (rowMachineName === machineBaseName) {
            return true;
          }
          
          // Keyword-based matching for similar machine types
          if (isConveyorMachine && rowMachineName.includes("conveyor")) {
            return true; // All "conveyor" machines together
          }
          
          if (isRollsMachine && rowMachineName.includes("rolls")) {
            return true; // All "rolls" machines together
          }
          
          if (isCraneMachine && rowMachineName.includes("crane")) {
            return true; // All "crane" machines together
          }
          
          if (isPumpMachine && rowMachineName.includes("pump")) {
            return true; // All "pump" machines together  
          }
          
          if (isStandMachine && rowMachineName.includes("stand")) {
            return true; // All "stand" machines together
          }
          
          return false;
        });
        console.log(`👤 User: showing related machine tasks: ${relatedTasks.length}`);
      }

      console.log(`🔍 All tasks for machine type with similar keywords: ${relatedTasks.length}`);
      
      // Show all machine names that matched
      const matchedMachineNames = [...new Set(relatedTasks.map(task => task["Machine Name"]))];
      console.log("🔍 Matched machine names:", matchedMachineNames);
      
      // Show all serial numbers for matched machines
      const machineSerialNumbers = [...new Set(relatedTasks.map(task => task["Serial No"]))];
      console.log(`🔍 Serial numbers for these machines: ${machineSerialNumbers.length}`, machineSerialNumbers);

      // Filter pending tasks (for details tab) - same machine के सभी pending tasks
      const pendingTaskss = relatedTasks.filter(
        (item) => (!item["Actual Date"] || item["Actual Date"].trim() === "")
      );

      setPendingTasks(pendingTaskss);
      console.log(`📋 Pending tasks: ${pendingTaskss.length}`);

      // Active tasks (empty Actual Date) for checklist tab
      const activeTasks = relatedTasks.filter(
        (row) => !row["Actual Date"] || row["Actual Date"].trim() === ""
      );

      // Completed tasks (has Actual Date) for history tab
      const completedTasks = relatedTasks.filter(
        (row) => row["Actual Date"] && row["Actual Date"].trim() !== ""
      );

      setAllRelatedTasks(activeTasks);
      setCompletedTasks(completedTasks);

      console.log(`✅ Active tasks: ${activeTasks.length}`);
      console.log(`🏁 Completed tasks: ${completedTasks.length}`);

      const totalTasks = activeTasks.length + completedTasks.length;
      const precent = totalTasks > 0 ? Math.floor((completedTasks.length * 100) / totalTasks) : 0;
      setTaskProgress(precent);

      // Initialize states only for active tasks
      const initialCheckedItems = {};
      const initialTaskStatuses = {};
      const initialRemarks = {};

      activeTasks.forEach((task) => {
        const taskNo = task["Task No"];
        initialCheckedItems[taskNo] = false;
        initialTaskStatuses[taskNo] = task["Task Status"] || "";
        initialRemarks[taskNo] = task["Remarks"] || "";
      });

      setCheckedItems(initialCheckedItems);
      setTaskStatuses(initialTaskStatuses);
      setRemarks(initialRemarks);
      setImageFiles({});
      
    } catch (error) {
      console.error("❌ Error fetching tasks:", error);
      // Handle error gracefully
      setAllRelatedTasks([]);
      setCompletedTasks([]);
      setPendingTasks([]);
    } finally {
      setLoading(false);
    }
  };
  useEffect(() => {
    fetchMachineRelatedTasks();
  }, [taskNo, serialNo]);

  // const getTasksByView = (view) => {
  //   const today = new Date();
  //   today.setHours(0, 0, 0, 0);

  //   return allRelatedTasks.filter((task) => {
  //     if (task["Actual Date"]) return false;

  //     const taskDate = new Date(task["Task Start Date"]);
  //     taskDate.setHours(0, 0, 0, 0);

  //     switch (view) {
  //       case "Todays Tasks":
  //         return taskDate.getTime() === today.getTime();
  //       case "Upcoming Tasks":
  //         return taskDate > today;
  //       case "Overdue Tasks":
  //         return taskDate < today;
  //       default:
  //         return true;
  //     }
  //   });
  // };

  // const getFrequencyColor = (frequency) => {
  //   switch (frequency) {
  //     case "weekly":
  //       return "bg-blue-100 text-blue-800";
  //     case "monthly":
  //       return "bg-purple-100 text-purple-800";
  //     case "daily":
  //       return "bg-green-100 text-green-800";
  //     default:
  //       return "bg-gray-100 text-gray-800";
  //   }
  // };

  const handleCheckboxChange = (taskNo) => {
    setCheckedItems((prev) => ({
      ...prev,
      [taskNo]: !prev[taskNo],
    }));

    if (checkedItems[taskNo]) {
      setTaskStatuses((prev) => {
        const newStatuses = { ...prev };
        delete newStatuses[taskNo];
        return newStatuses;
      });
      setRemarks((prev) => {
        const newRemarks = { ...prev };
        delete newRemarks[taskNo];
        return newRemarks;
      });
      setImageFiles((prev) => {
        const newFiles = { ...prev };
        delete newFiles[taskNo];
        return newFiles;
      });
    }
  };

  const handleStatusChange = (taskNo, value) => {
    setTaskStatuses((prev) => ({
      ...prev,
      [taskNo]: value,
    }));
  };

  const handleRemarksChange = (taskNo, value) => {
    setRemarks((prev) => ({
      ...prev,
      [taskNo]: value,
    }));
  };

  const handleImageUpload = (taskNo, file) => {
    setImageFiles((prev) => ({
      ...prev,
      [taskNo]: file,
    }));
  };

  const handleRepairCostChange = (taskNo, value) => {
    setRepairCosts((prev) => ({
      ...prev,
      [taskNo]: value,
    }));
  };

  const handleSoundStatusChange = (taskNo, value) => {
    setSoundStatuses((prev) => ({
      ...prev,
      [taskNo]: value,
    }));
  };

  const handleTemperatureChange = (taskNo, value) => {
    setTemperatures((prev) => ({
      ...prev,
      [taskNo]: value,
    }));
  };

  const uploadFileToDrive = async (file) => {
    const reader = new FileReader();

    return new Promise((resolve, reject) => {
      reader.onload = async () => {
        const base64Data = reader.result;

        // console.log("base64Data", base64Data);
        // console.log("file.name", file.name);
        // console.log("file.type", file.type);
        // console.log("FOLDER_ID", FOLDER_ID);

        try {
          const res = await fetch(SCRIPT_URL, {
            method: "POST",
            headers: {
              "Content-Type": "application/x-www-form-urlencoded",
            },
            body: new URLSearchParams({
              action: "uploadFile",
              base64Data: base64Data,
              fileName: file.name,
              mimeType: file.type,
              folderId: FOLDER_ID,
            }).toString(),
          });

          const data = await res.json();

          console.log("FileUploadData", data);

          if (data.success && data.fileUrl) {
            resolve(data.fileUrl);
          } else {
            toast.error("❌ File upload failed");
            resolve("");
          }
        } catch (err) {
          console.error("Upload error:", err);
          toast.error("❌ Upload failed due to network error");
          resolve("");
        }
      };

      reader.onerror = () => {
        reject("❌ Failed to read file");
      };

      reader.readAsDataURL(file);
    });
  };

  const handleSubmit = async (taskNo) => {
    setSubmittingTasks((prev) => ({ ...prev, [taskNo]: true }));

    try {
      const task = allRelatedTasks.find((t) => t["Task No"] === taskNo);
      if (!task) {
        toast.error("Task not found");
        return;
      }

      // Handle image upload if exists
      let imgRes = "";
      let fileName = "";
      let fileType = "";
      if (imageFiles[taskNo]) {
        imgRes = await uploadFileToDrive(imageFiles[taskNo]);
        fileName = imageFiles[taskNo].name;
        fileType = fileName.split(".").pop().toLowerCase(); // Get file extension
      }

      const payload =
        taskType === "Maintence"
          ? {
              sheetId: SHEET_ID,
              sheetName: taskNo.startsWith("TM")
                ? "Maitenance Task Assign"
                : "Repair Task Assign",
              action: "update",
              taskNo: taskNo,
              "Task Status": taskStatuses[taskNo],
              Remarks: remarks[taskNo] || "",
              "Maintenace Cost": repairCosts[taskNo] || "",
              "Sound Status": soundStatuses[taskNo] || "",
              "Temperature Status": temperatures[taskNo] || "",
              ...(imgRes && {
                "Image Link": imgRes,
                "File Name": fileName,
                "File Type": fileType,
              }),
            }
          : {
              sheetId: SHEET_ID,
              sheetName: taskNo.startsWith("TM")
                ? "Maitenance Task Assign"
                : "Repair Task Assign",
              action: "update",
              taskNo: taskNo,
              "Task Status": taskStatuses[taskNo],
              Remarks: remarks[taskNo] || "",
              "Repair Cost": repairCosts[taskNo] || "",
              "Sound Status": soundStatuses[taskNo] || "",
              "Temperature Status": temperatures[taskNo] || "",
              ...(imgRes && {
                "Image Link": imgRes,
                "File Name": fileName,
                "File Type": fileType,
              }),
            };

      // Only add Actual Date if status is "Yes"
      if (taskStatuses[taskNo] === "Yes") {
        payload["Actual Date"] = new Date().toISOString().split("T")[0];
      }

      // Send the update request
      const response = await axios.post(SCRIPT_URL, payload, {
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
        },
      });

      // console.log("response",response);

      if (response.data.success) {
        toast.success("Task updated successfully");

        // if (taskStatuses[taskNo] === "Yes") {
          // If task is marked as completed, remove it from active tasks
          // setAllRelatedTasks((prev) =>
          //   prev.filter((t) => t["Task No"] !== taskNo)
          // );
          // setPendingTasks((prev) =>
          //   prev.filter((t) => t["Task No"] !== taskNo)
          // );
        // }
        fetchMachineRelatedTasks();

        // Reset the form state for this item
        setCheckedItems((prev) => {
          const newChecked = { ...prev };
          delete newChecked[taskNo];
          return newChecked;
        });
        setTaskStatuses((prev) => {
          const newStatuses = { ...prev };
          delete newStatuses[taskNo];
          return newStatuses;
        });
        setRemarks((prev) => {
          const newRemarks = { ...prev };
          delete newRemarks[taskNo];
          return newRemarks;
        });
        setImageFiles((prev) => {
          const newFiles = { ...prev };
          delete newFiles[taskNo];
          return newFiles;
        });
        setRepairCosts((prev) => {
          const newCosts = { ...prev };
          delete newCosts[taskNo];
          return newCosts;
        });
        setSoundStatuses((prev) => {
          const newSounds = { ...prev };
          delete newSounds[taskNo];
          return newSounds;
        });
        setTemperatures((prev) => {
          const newTemps = { ...prev };
          delete newTemps[taskNo];
          return newTemps;
        });
      } else {
        toast.error(response.data.error || "Failed to update task");
      }
    } catch (error) {
      console.error("Error submitting task:", error);
      toast.error(error.response?.data?.error || "Error updating task");
    } finally {
      setSubmittingTasks((prev) => {
        const newState = { ...prev };
        delete newState[taskNo];
        return newState;
      });
    }
  };

  const handleChecklistItemToggle = (itemId) => {
    setChecklist((prev) =>
      prev.map((item) =>
        item.id === itemId ? { ...item, completed: !item.completed } : item
      )
    );
  };

  const handleCommentSubmit = (e) => {
    e.preventDefault();
    if (commentText.trim()) {
      toast.success("Comment added successfully");
      setCommentText("");
    }
  };

  const handleStatusUpdate = (e) => {
    e.preventDefault();
    toast.success(`Status updated to ${updateStatus}`);
    setShowUpdateForm(false);
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case "completed":
        return (
          <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-green-100 text-green-800">
            <CheckCircle size={16} className="mr-1" />
            Completed
          </span>
        );
      case "pending":
        return (
          <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-blue-100 text-blue-800">
            <Clock size={16} className="mr-1" />
            Pending
          </span>
        );
      case "in-progress":
        return (
          <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-purple-100 text-purple-800">
            <Clock size={16} className="mr-1" />
            In Progress
          </span>
        );
      case "overdue":
        return (
          <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-red-100 text-red-800">
            <AlertTriangle size={16} className="mr-1" />
            Overdue
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

  const getPriorityBadge = (priority) => {
    switch (priority) {
      case "critical":
        return (
          <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-red-100 text-red-800 border border-red-300">
            Critical
          </span>
        );
      case "high":
        return (
          <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-amber-100 text-amber-800">
            High
          </span>
        );
      case "medium":
        return (
          <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-blue-100 text-blue-800">
            Medium
          </span>
        );
      case "low":
        return (
          <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-green-100 text-green-800">
            Low
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-gray-100 text-gray-800">
            Normal
          </span>
        );
    }
  };

  const completedItems = checklist.filter((item) => item.completed).length;

  return (
    <div className="space-y-6">
      <div className="flex items-center mb-6">
        <Link
          to="/tasks"
          className="text-indigo-600 hover:text-indigo-900 mr-4 flex items-center"
        >
          <ChevronLeft size={20} />
          <span>Back to Tasks</span>
        </Link>
        <h1 className="text-2xl font-bold text-gray-800 flex-1">
          {task.type} - {task.machineName}
        </h1>
        {/* <div className="flex items-center space-x-2">
          {getStatusBadge(task.status)}
          {getPriorityBadge(task.priority)}
        </div> */}
      </div>

      <div className="bg-white rounded-lg shadow overflow-hidden">
        {/* Header Section */}
        <div className="p-6 border-b">
          <div className="flex flex-col md:flex-row md:items-center justify-between mb-4">
            <div className="">
              <h2 className="text-xl font-semibold">
                {machineName}{" "}
                <span className="text-blue-600">({serialNo})</span>
              </h2>
              <p className="text-gray-500">
                {" "}
                Task Type <span className="text-blue-600">({taskType})</span>
              </p>
            </div>

            <div className="w-1/2">
              <h3 className="text-sm font-medium text-gray-500 mb-2">
                Completion Progress
              </h3>
              <div className="w-full bg-gray-200 rounded-full h-2.5">
                <div
                  className="bg-indigo-600 h-2.5 rounded-full"
                  style={{ width: `${taskProgress}%` }}
                ></div>
              </div>
              <div className="text-xs text-gray-500">
                {taskProgress}% Complete
              </div>
            </div>
          </div>

          {/* <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div>
              <h3 className="text-sm font-medium text-gray-500 mb-1">
                Assignment
              </h3>
              <div className="flex items-center">
                <User size={16} className="text-gray-400 mr-2" />
                <span>{task.assignedTo}</span>
              </div>
            </div>
            <div>
              <h3 className="text-sm font-medium text-gray-500 mb-1">
                Location
              </h3>
              <div className="flex items-center">
                <Wrench size={16} className="text-gray-400 mr-2" />
                <span>{task.location}</span>
                {task.vendor && (
                  <span className="ml-1 text-gray-500">({task.vendor})</span>
                )}
              </div>
            </div>
            <div>
              <h3 className="text-sm font-medium text-gray-500 mb-1">
                Due Date
              </h3>
              <div className="flex items-center">
                <Calendar size={16} className="text-gray-400 mr-2" />
                <span>{new Date(task.dueDate).toLocaleDateString()}</span>
              </div>
            </div>
            <div>
              <h3 className="text-sm font-medium text-gray-500 mb-1">
                Estimated Cost
              </h3>
              <div className="flex items-center">
                <DollarSign size={16} className="text-gray-400 mr-2" />
                <span>₹{task.estimatedCost.toLocaleString()}</span>
              </div>
            </div>
            <div className="md:col-span-2">
              <h3 className="text-sm font-medium text-gray-500 mb-1">
                Completion Progress
              </h3>
              <div className="w-full bg-gray-200 rounded-full h-2.5">
                <div
                  className="bg-indigo-600 h-2.5 rounded-full"
                  style={{ width: `${completionPercentage}%` }}
                ></div>
              </div>
              <div className="text-xs text-gray-500 mt-1 text-right">
                {completionPercentage}% Complete
              </div>
            </div>
          </div> */}

          {/* Task Progress Section */}
        </div>

        <div className="border-b border-gray-200">
          <nav className="flex -mb-px">
            <button
              className={`py-4 px-6 font-medium text-sm border-b-2 ${
                activeTab === "details"
                  ? "border-indigo-500 text-indigo-600"
                  : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
              }`}
              onClick={() => setActiveTab("details")}
            >
              <FileText size={16} className="inline mr-2" />
              Description
            </button>
            <button
              className={`py-4 px-6 font-medium text-sm border-b-2 ${
                activeTab === "checklist"
                  ? "border-indigo-500 text-indigo-600"
                  : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
              }`}
              onClick={() => setActiveTab("checklist")}
            >
              <CheckCircle size={16} className="inline mr-2" />
              Checklist
            </button>
            <button
              className={`py-4 px-6 font-medium text-sm border-b-2 ${
                activeTab === "history"
                  ? "border-indigo-500 text-indigo-600"
                  : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
              }`}
              onClick={() => setActiveTab("history")}
            >
              <Clock size={16} className="inline mr-2" />
              History
            </button>
            <button
              className={`py-4 px-6 font-medium text-sm border-b-2 ${
                activeTab === "documents"
                  ? "border-indigo-500 text-indigo-600"
                  : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
              }`}
              onClick={() => setActiveTab("documents")}
            >
              <Paperclip size={16} className="inline mr-2" />
              Documents
            </button>
          </nav>
        </div>

        {/* Bellow section */}

        {loading ? (
          <div className="flex justify-center py-8 flex-col items-center text-gray-600 text-sm">
            <div className="w-6 h-6 border-4 border-blue-500 border-dashed rounded-full animate-spin mb-2"></div>
            Loading tasks...
          </div>
        ) : (
          <div className="p-2">
            {/* Details Tab */}
   {/* Details Tab */}
            <div className="overflow-x-auto" style={{ maxHeight: "400px", overflowY: "auto" }}>
              {activeTab === "details" && (
                <div>
                  <table className="min-w-full border border-gray-300 text-sm">
                    <thead className="bg-gray-50 sticky top-0 z-10">
                      <tr>
                        <th className="border px-4 py-3 text-left font-medium text-gray-700">
                          Task No
                        </th>
                        <th className="border px-4 py-3 text-left font-medium text-gray-700">
                          Task Date
                        </th>
                        <th className="border px-4 py-3 text-left font-medium text-gray-700">
                          Description
                        </th>
                        <th className="border px-4 py-3 text-left font-medium text-gray-700">
                          Task Sound Test
                        </th>
                        <th className="border px-4 py-3 text-left font-medium text-gray-700">
                          Task Temperature
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {pendingTasks.map((pendingTask, indx) => (
                        <tr key={indx} className="hover:bg-gray-50">
                          <td className="border px-4 py-3 font-medium text-blue-600">
                            {pendingTask["Task No"]}
                          </td>
                          <td className="border px-4 py-3 text-gray-900">
                            {new Date(pendingTask["Task Start Date"]).toLocaleDateString("en-IN", {
                              year: "numeric",
                              month: "short",
                              day: "numeric",
                            })}
                          </td>
                          <td className="border px-4 py-3 text-gray-700 max-w-md">
                            <div className="line-clamp-3 break-words">
                              {pendingTask["Description"]}
                            </div>
                          </td>
                          <td className="border px-4 py-3 text-center">
                            <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                              pendingTask["Need Sound Test"] === "Yes" 
                                ? "bg-green-100 text-green-800" 
                                : "bg-gray-100 text-gray-800"
                            }`}>
                              {pendingTask["Need Sound Test"] === "Yes" ? "Yes" : "No"}
                            </span>
                          </td>
                          <td className="border px-4 py-3 text-center">
                            <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                              pendingTask["Temperature"] === "Yes" 
                                ? "bg-blue-100 text-blue-800" 
                                : "bg-gray-100 text-gray-800"
                            }`}>
                              {pendingTask["Temperature"] === "Yes" ? "Yes" : "No"}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                  
                  {pendingTasks.length === 0 && (
                    <div className="text-center py-8 text-gray-500">
                      No pending tasks found for this machine.
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* CheckList Tab */}

            <div
              className="overflow-x-auto"
              style={{ maxHeight: "400px", overflowY: "auto" }}
            >
              {activeTab === "checklist" && (
                <div>
                  <table className="min-w-full border border-gray-300 text-sm">
                    <thead className="bg-gray-50 sticky top-0 z-10">
                      <tr>
                        <th className="border px-2 py-1"></th>
                        <th className="border px-2 py-1 text-blue-700">
                          Task No
                        </th>
                        <th className="border px-2 py-1 text-blue-700">
                          Department
                        </th>
                        <th className="border px-2 py-1 text-blue-700">
                          Description
                        </th>
                        <th className="border px-2 py-1 text-blue-700">
                          Task Status
                        </th>
                        <th className="border px-2 py-1 text-blue-700">
                          Image
                        </th>
                        <th className="border px-2 py-1 text-blue-700">
                          Remarks
                        </th>

                        <th className="border px-2 py-1 text-blue-700">
                          Sound Of Machine
                        </th>
                        <th className="border px-2 py-1 text-blue-700">
                          Temperature
                        </th>
                        <th className="border px-2 py-1 text-blue-700">
                          {taskType === "Maintence"
                            ? "Maintenace Cost"
                            : "Repair Cost"}
                        </th>
                        <th className="border px-2 py-1 text-blue-700">
                          Submit
                        </th>
                      </tr>
                    </thead>

                    <tbody className="bg-white divide-y divide-gray-200">
                      {allRelatedTasks.map((task) => {
                        const taskNo = task["Task No"];
                        const isChecked = checkedItems[taskNo] || false;
                        const taskStatus = taskStatuses[taskNo] || "";
                        const canSubmit =
                          isChecked &&
                          (taskStatus === "Yes" || taskStatus === "No");
                        const isDone = !!task["Actual Date"];

                        return (
                          <tr
                            key={taskNo}
                            className={`${
                              isDone
                                ? "bg-green-50 border-green-200 text-gray-500 line-through"
                                : "bg-white border-gray-200 text-gray-900"
                            }`}
                          >
                            <td className="border px-2 py-1 text-center">
                              <input
                                type="checkbox"
                                checked={isChecked}
                                onChange={() => handleCheckboxChange(taskNo)}
                                disabled={isDone}
                                className="h-5 w-5 text-indigo-600 rounded focus:ring-indigo-500"
                              />
                            </td>
                            <td className="border px-2 py-1 text-center">
                              {taskNo}
                            </td>
                            <td className="border px-2 py-1 text-center">
                              {task["Department"]}
                            </td>
                            <td className="border px-2 py-1 text-left max-w-xs">
                              <div className="truncate" title={task["Description"]}>
                                {task["Description"]}
                              </div>
                            </td>

                            <td className="border px-2 py-1 text-center">
                              <select
                                value={taskStatus}
                                onChange={(e) =>
                                  handleStatusChange(taskNo, e.target.value)
                                }
                                disabled={!isChecked || isDone}
                                className="border rounded px-2 py-1 w-full"
                              >
                                <option value="">Select</option>
                                <option value="Yes">Yes</option>
                                <option value="No">No</option>
                              </select>
                            </td>

                            <td className="border px-2 py-1 text-center">
                              <label
                                className={`cursor-pointer ${
                                  !isChecked || isDone
                                    ? "text-gray-400"
                                    : "text-blue-600 hover:underline"
                                } ${
                                  task["Require Attachment"] === "Yes" &&
                                  "text-red-600"
                                }`}
                              >
                                Upload
                                <input
                                  type="file"
                                  className="hidden"
                                  disabled={!isChecked || isDone}
                                  onChange={(e) =>
                                    handleImageUpload(taskNo, e.target.files[0])
                                  }
                                />
                                {imageFiles[taskNo] && (
                                  <span className="ml-1 text-xs">
                                    ({imageFiles[taskNo].name})
                                  </span>
                                )}
                              </label>
                            </td>

                            <td className="border px-2 py-1 text-center">
                              <input
                                type="text"
                                value={remarks[taskNo] || ""}
                                onChange={(e) =>
                                  handleRemarksChange(taskNo, e.target.value)
                                }
                                disabled={!isChecked || isDone}
                                placeholder="Enter remarks"
                                className="outline-none border px-1 py-1 rounded-md w-full"
                              />
                            </td>

                            <td className="border px-2 py-1 text-center">
                              <select
                                value={soundStatuses[taskNo] || ""}
                                onChange={(e) =>
                                  handleSoundStatusChange(
                                    taskNo,
                                    e.target.value
                                  )
                                }
                                disabled={!isChecked || isDone}
                                className="border rounded px-2 py-1 w-full"
                              >
                                <option value="">Select</option>
                                <option value="Good">Good</option>
                                <option value="Bad">Bad</option>
                                <option value="Need Repair">Need Repair</option>
                                <option value="Ok">Ok</option>
                              </select>
                            </td>

                            <td className="border px-2 py-1 text-center">
                              <input
                                type="number"
                                value={temperatures[taskNo] || ""}
                                onChange={(e) =>
                                  handleTemperatureChange(
                                    taskNo,
                                    e.target.value
                                  )
                                }
                                disabled={!isChecked || isDone}
                                placeholder="Temperature"
                                className="outline-none border px-1 py-1 rounded-md w-full"
                              />
                            </td>

                            <td className="border px-2 py-1 text-center">
                              <input
                                type="number"
                                value={repairCosts[taskNo] || ""}
                                onChange={(e) =>
                                  handleRepairCostChange(taskNo, e.target.value)
                                }
                                disabled={!isChecked || isDone}
                                placeholder={
                                  taskType === "Maintence"
                                    ? "Maintenace Cost"
                                    : "Repair Cost"
                                }
                                className="outline-none border px-1 py-1 rounded-md w-full"
                              />
                            </td>

                            <td className="border px-2 py-1 text-center">
                              <button
                                className={`px-2 py-1 rounded ${
                                  canSubmit &&
                                  (task["Require Attachment"] !== "Yes" ||
                                    imageFiles[taskNo])
                                    ? "bg-indigo-600 text-white hover:bg-indigo-700"
                                    : "bg-gray-300 text-gray-500 cursor-not-allowed"
                                }`}
                                disabled={
                                  !canSubmit ||
                                  isDone ||
                                  submittingTasks[taskNo] ||
                                  (task["Require Attachment"] === "Yes" &&
                                    !imageFiles[taskNo])
                                }
                                onClick={() => handleSubmit(taskNo)}
                              >
                                {submittingTasks[taskNo]
                                  ? "Submitting..."
                                  : "Submit"}
                              </button>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </div>

            {/* History Tab */}

            <div
              className="overflow-x-auto"
              style={{ maxHeight: "400px", overflowY: "auto" }}
            >
              {activeTab === "history" && (
                <div>
                  <div className="relative">
                    <div className="absolute top-0 bottom-0 left-3.5 w-0.5 bg-gray-200"></div>

                    <ul className="space-y-6">
                      {[...completedTasks].reverse().map((task) => (
                        <li key={task["Task No"]} className="relative pl-10">
                          <div className="absolute left-0 top-1.5 h-7 w-7 rounded-full border-2 border-indigo-500 bg-white flex items-center justify-center">
                            <div className="h-3 w-3 rounded-full bg-indigo-500"></div>
                          </div>
                          <div className="bg-white p-4 rounded-lg border border-gray-200 shadow-sm">
                            <div className="flex justify-between items-start">
                              <div className="font-medium">
                                {task["Task Type"]} completed{" "}
                                <span className="text-blue-600">
                                  ({task["Task No"]})
                                </span>
                              </div>
                              <div className="text-sm text-gray-500 mt-1">
                                Completed by:{" "}
                                <span className="text-blue-600">
                                  ({task["Doer Name"]})
                                </span>
                              </div>
                              <div className="text-sm text-gray-500 flex gap-10">
                                <h1 className="text-green-600 font-bold">
                                  {new Date(
                                    task["Task Start Date"]
                                  ).toLocaleDateString()}
                                </h1>
                                <h1 className="text-red-600 font-bold">
                                  {new Date(
                                    task["Actual Date"]
                                  ).toLocaleDateString()}
                                </h1>
                              </div>
                            </div>

                            {task["Remarks"] && (
                              <div className="text-sm bg-gray-50 rounded">
                                Remarks: {task["Remarks"]}
                              </div>
                            )}
                            <div className="text-sm bg-gray-50 rounded">
                              Description:-{" "}
                              <span className="text-blue-600">
                                ({task["Description"]})
                              </span>
                            </div>
                          </div>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              )}
            </div>

            {/* Documents Tab */}

            <div
              className="overflow-x-auto"
              style={{ maxHeight: "400px", overflowY: "auto" }}
            >
              {activeTab === "documents" && (
                <div>
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50 sticky top-0 z-10">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Task No
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Document Name
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Type
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Uploaded By
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Date
                        </th>
                        <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Actions
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {[...completedTasks].reverse().map((task) => {
                        const fileName = task["File Name"] || "Document";
                        const fileType = task["File Type"]?.toUpperCase();

                        return (
                          <tr
                            key={task["Task No"]}
                            className="hover:bg-gray-50"
                          >
                            <td className="px-6 py-3 whitespace-nowrap text-sm font-medium text-indigo-600">
                              {task["Task No"]}
                            </td>
                            <td className="px-6 py-3 whitespace-nowrap text-sm font-medium text-indigo-600">
                              {fileName.length > 10 ? `${fileName.slice(0, 10)}...` : fileName}
                            </td>
                            <td className="px-6 py-3 whitespace-nowrap text-sm text-gray-500">
                              {fileType}
                            </td>
                            <td className="px-6 py-3 whitespace-nowrap text-sm text-gray-500">
                              {task["Doer Name"]}
                            </td>
                            <td className="px-6 py-3 whitespace-nowrap text-sm text-gray-500">
                              {new Date(
                                task["Task Start Date"]
                              ).toLocaleDateString()}
                            </td>
                            <td className="px-6 py-3 whitespace-nowrap text-right text-sm font-medium">
                              <a
                                href={task["Image Link"]}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-indigo-600 hover:text-indigo-900"
                              >
                                Download
                              </a>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>

                  {completedTasks.filter((task) => task["Image Link"])
                    .length === 0 && (
                    <div className="text-center py-8 text-gray-500">
                      No documents attached to this task.
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default TaskDetails;