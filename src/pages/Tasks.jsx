// import React, { useEffect, useState } from "react";
// import { Link } from "react-router-dom";
// import useAuthStore from "../store/authStore";
// import {
//   Search,
//   Filter,
//   Plus,
//   CheckCircle,
//   Clock,
//   AlertTriangle,
//   ArrowUp,
//   ArrowDown,
//   FileText,
//   UserCircle,
// } from "lucide-react";
// import axios from "axios";

// const Tasks = () => {
//   const { user } = useAuthStore();
//   const [searchTerm, setSearchTerm] = useState("");
//   const [sortColumn, setSortColumn] = useState("dueDate");
//   const [sortDirection, setSortDirection] = useState("asc");
//   const [selectedDepartment, setSelectedDepartment] = useState("all");
//   const [selectedStatus, setSelectedStatus] = useState("all");
//   const [selectedLocation, setSelectedLocation] = useState("all");
//   const [maintenanceTasks, setMaintenanceTasks] = useState([]);
//   const [repairTasks, setRepairTasks] = useState([]);
//   const [activeTab, setActiveTab] = useState("maintenance");
//   const [loadingTasks, setLoadingTasks] = useState(false);
//   const [error, setError] = useState(null);
  

//   const SCRIPT_URL =
//     "https://script.google.com/macros/s/AKfycbzWDU77ND7kYIIf__m_v3hlFv74-lF68mgSMjb0OadKnNU4XJFr74zAqnDQG0FARtjd/exec";
//   const SHEET_Id = "1lE5TdGcbmwVcVqbx-jftPIdmoGgg1DApNn4t9jZvGN8";

//   useEffect(() => {
//     const fetchTasks = async () => {
//       setLoadingTasks(true);
//       setError(null);
      
//       try {
//         const [maintenanceRes, repairRes] = await Promise.all([
//           axios.get(
//             `${SCRIPT_URL}?sheetId=${SHEET_Id}&sheet=Maitenance%20Task%20Assign`
//           ),
//           axios.get(
//             `${SCRIPT_URL}?sheetId=${SHEET_Id}&sheet=Repair%20Task%20Assign`
//           ),
//         ]);

//         // Add safety checks for the API responses
//         const maintenanceData = maintenanceRes?.data?.table;
//         const repairData = repairRes?.data?.table;

//         console.log('Maintenance API Response:', maintenanceRes.data);
//         console.log('Repair API Response:', repairRes.data);

//         if (maintenanceData) {
//           const formattedMaintenance = formatSheetData(maintenanceData);
//           if (formattedMaintenance && formattedMaintenance.length > 0) {
//             setMaintenanceTasks(
//               getFirstPendingOrLatestCompletedPerMachineAndSerial(formattedMaintenance)
//             );
//           }
//         } else {
//           console.warn('No maintenance data received from API');
//         }

//         if (repairData) {
//           const formattedRepair = formatSheetData(repairData);
//           if (formattedRepair && formattedRepair.length > 0) {
//             setRepairTasks(
//               getFirstPendingOrLatestCompletedPerMachineAndSerial(formattedRepair)
//             );
//           }
//         } else {
//           console.warn('No repair data received from API');
//         }

//       } catch (error) {
//         console.error("Error fetching tasks:", error);
//         setError(`Failed to load tasks: ${error.message}`);
//       } finally {
//         setLoadingTasks(false);
//       }
//     };

//     fetchTasks();
//   }, []);

//   const formatSheetData = (sheetData) => {
//     console.log('Processing sheet data:', sheetData);
    
//     // Add safety checks
//     if (!sheetData || !sheetData.cols || !sheetData.rows) {
//       console.warn('Invalid sheet data structure:', sheetData);
//       return [];
//     }

//     const columns = sheetData.cols.map((col) => col?.label);
//     const rows = sheetData.rows;

//     if (!columns || columns.length === 0) {
//       console.warn('No columns found in sheet data');
//       return [];
//     }

//     return rows.map((row) => {
//       const obj = {};
//       if (row && row.c) {
//         row.c.forEach((cell, i) => {
//           if (columns[i]) {
//             obj[columns[i]] = cell?.v || "";
//           }
//         });
//       }
//       return obj;
//     }).filter(obj => Object.keys(obj).length > 0); // Filter out empty objects
//   };

//   const handleSort = (column) => {
//     if (sortColumn === column) {
//       setSortDirection(sortDirection === "asc" ? "desc" : "asc");
//     } else {
//       setSortColumn(column);
//       setSortDirection("asc");
//     }
//   };

//     const rawTasks = activeTab === "maintenance" ? maintenanceTasks : repairTasks;

//   const filteredTasks = rawTasks.filter((task) => {
//     if (!task) return false;

//     // Admin can see all
//     if (user?.role !== "admin") {
//       if (
//         task["Doer Name"]?.toLowerCase().trim() !==
//         user?.username?.toLowerCase().trim()
//       ) {
//         return false;
//       }
//     }

//     const departmentMatch =
//       selectedDepartment === "all" ||
//       task["Department"]?.toLowerCase() === selectedDepartment.toLowerCase();

//     const searchMatch =
//       task["Machine Name"]?.toLowerCase().includes(searchTerm.toLowerCase()) ||
//       task["Task Type"]?.toLowerCase().includes(searchTerm.toLowerCase()) ||
//       task["Serial No"]?.toLowerCase().includes(searchTerm.toLowerCase()) ||
//       task["Priority"]?.toLowerCase().includes(searchTerm.toLowerCase()) ||
//       task["Department"]?.toLowerCase().includes(searchTerm.toLowerCase()) ||
//       task["Doer Name"]?.toLowerCase().includes(searchTerm.toLowerCase()) ||
//       task["Location"]
//         ?.toString()
//         .toLowerCase()
//         .includes(searchTerm.toLowerCase());

//     return departmentMatch && searchMatch;
//   });


//   const getFirstPendingOrLatestCompletedPerMachineAndSerial = (tasks) => {
//     if (!tasks || !Array.isArray(tasks)) {
//       console.warn('Invalid tasks array provided to processing function');
//       return [];
//     }

//     const machineSerialMap = new Map();

//     tasks.forEach((task) => {
//       if (!task) return; // Skip null/undefined tasks
      
//       const machineName = task["Machine Name"];
//       const serialNo = task["Serial No"];
//       const actualDate = task["Actual Date"];
      
//       // Skip tasks without essential data
//       if (!machineName || !serialNo) return;
      
//       // Create unique key combining machine name and serial number
//       const uniqueKey = `${machineName}|${serialNo}`;

//       if (!machineSerialMap.has(uniqueKey)) {
//         if (!actualDate) {
//           // If not completed (pending), keep the first pending
//           machineSerialMap.set(uniqueKey, task);
//         } else {
//           // Temporarily store the first completed
//           machineSerialMap.set(uniqueKey, { ...task, __isCompleted: true });
//         }
//       } else {
//         const existing = machineSerialMap.get(uniqueKey);

//         // If we already have a pending one, skip
//         if (!existing["Actual Date"]) return;

//         // If existing is completed but current is pending, replace it
//         if (actualDate === "") {
//           machineSerialMap.set(uniqueKey, task);
//         }
//       }
//     });

//     return Array.from(machineSerialMap.values());
//   };

//   // Get unique departments for filter
//   const departments = [...new Set(rawTasks.map(task => task["Department"]).filter(Boolean))];

//   return (
//     <div className="space-y-6">
//       <div className="flex items-center justify-between">
//         <h1 className="text-2xl font-bold text-gray-800">Maintenance Tasks</h1>
//       </div>

//       {/* Error Message */}
//       {error && (
//         <div className="bg-red-50 border border-red-200 rounded-lg p-4">
//           <div className="flex items-center">
//             <AlertTriangle className="text-red-500 mr-2" size={20} />
//             <span className="text-red-800">{error}</span>
//           </div>
//         </div>
//       )}

//       {/* Filter and Search */}
//       <div className="bg-white p-4 rounded-lg shadow flex flex-col md:flex-row md:items-center md:justify-between space-y-4 md:space-y-0 md:space-x-4">
//         <div className="flex flex-1 max-w-md">
//           <div className="relative w-full">
//             <input
//               type="text"
//               placeholder="Search tasks..."
//               className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
//               value={searchTerm}
//               onChange={(e) => setSearchTerm(e.target.value)}
//             />
//             <Search
//               size={20}
//               className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400"
//             />
//           </div>
//         </div>
//         <div className="flex flex-wrap gap-2">
//           <div className="flex items-center space-x-2">
//             <Filter size={16} className="text-gray-500" />
//             <select
//               className="border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500"
//               value={selectedDepartment}
//               onChange={(e) => setSelectedDepartment(e.target.value)}
//             >
//               <option value="all">All Departments</option>
//               {departments.map(dept => (
//                 <option key={dept} value={dept}>{dept}</option>
//               ))}
//             </select>
//           </div>
//         </div>
//       </div>

//       <div className="flex space-x-4 mb-4">
//         <button
//           className={`px-4 py-2 rounded-md ${
//             activeTab === "maintenance"
//               ? "bg-indigo-600 text-white"
//               : "bg-gray-200 text-gray-700"
//           }`}
//           onClick={() => setActiveTab("maintenance")}
//         >
//           Maintenance ({maintenanceTasks.length})
//         </button>
//         {/* Repair button hidden as requested */}
//       </div>

//       {/* Task List */}
//       <div className="bg-white rounded-lg shadow overflow-hidden">
//         <div className="overflow-x-auto">
//           <table className="min-w-full divide-y divide-gray-200">
//             {/* Table heading - fixed */}
//             <thead className="bg-gray-50">
//               <tr>
//                 <th
//                   scope="col"
//                   className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer min-w-[200px]"
//                   onClick={() => handleSort("machineName")}
//                 >
//                   <div className="flex items-center">
//                     Machine & Task
//                     {sortColumn === "machineName" &&
//                       (sortDirection === "asc" ? (
//                         <ArrowUp size={14} className="ml-1" />
//                       ) : (
//                         <ArrowDown size={14} className="ml-1" />
//                       ))}
//                   </div>
//                 </th>

//                 <th
//                   scope="col"
//                   className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer min-w-[120px]"
//                   onClick={() => handleSort("serialNo")}
//                 >
//                   <div className="flex items-center">
//                     Serial No
//                     {sortColumn === "serialNo" &&
//                       (sortDirection === "asc" ? (
//                         <ArrowUp size={14} className="ml-1" />
//                       ) : (
//                         <ArrowDown size={14} className="ml-1" />
//                       ))}
//                   </div>
//                 </th>

//                 <th
//                   scope="col"
//                   className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer min-w-[150px]"
//                   onClick={() => handleSort("department")}
//                 >
//                   <div className="flex items-center">
//                     Department
//                     {sortColumn === "department" &&
//                       (sortDirection === "asc" ? (
//                         <ArrowUp size={14} className="ml-1" />
//                       ) : (
//                         <ArrowDown size={14} className="ml-1" />
//                       ))}
//                   </div>
//                 </th>

//                 <th
//                   scope="col"
//                   className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider min-w-[120px]"
//                 >
//                   Priority
//                 </th>

//                 <th
//                   scope="col"
//                   className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer min-w-[180px]"
//                   onClick={() => handleSort("assignedTo")}
//                 >
//                   <div className="flex items-center">
//                     Assigned To
//                     {sortColumn === "assignedTo" &&
//                       (sortDirection === "asc" ? (
//                         <ArrowUp size={14} className="ml-1" />
//                       ) : (
//                         <ArrowDown size={14} className="ml-1" />
//                       ))}
//                   </div>
//                 </th>

//                 <th
//                   scope="col"
//                   className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider min-w-[200px]"
//                 >
//                   Location
//                 </th>

//                 <th
//                   scope="col"
//                   className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider min-w-[100px]"
//                 >
//                   Actions
//                 </th>
//               </tr>
//             </thead>

//             {/* Table body with scroll */}
//             <tbody className="bg-white divide-y divide-gray-200">
//               {filteredTasks.map((task, ind) => (
//                 <tr key={`${task["Machine Name"]}-${task["Serial No"]}-${ind}`} className="hover:bg-gray-50">
//                   <td className="px-6 py-4 min-w-[200px]">
//                     <div className="text-sm font-medium text-gray-900">
//                       {task["Machine Name"] || "N/A"}
//                     </div>
//                     <div className="text-xs text-gray-500 mt-1">
//                       {task["Task Type"] || "N/A"}
//                     </div>
//                   </td>

//                   <td className="px-6 py-4 min-w-[120px]">
//                     <div className="text-sm text-gray-900">
//                       {task["Serial No"] || "N/A"}
//                     </div>
//                   </td>

//                   <td className="px-6 py-4 min-w-[150px]">
//                     <div className="text-sm text-gray-900">
//                       {task["Department"] || "N/A"}
//                     </div>
//                   </td>

//                   <td className="px-6 py-4 min-w-[120px]">
//                     <div className="flex flex-col space-y-1">
//                       {task["Priority"] || "N/A"}
//                     </div>
//                   </td>

//                   <td className="px-6 py-4 min-w-[180px]">
//                     <div className="flex items-center">
//                       <UserCircle size={20} className="text-gray-400 mr-2" />
//                       <span className="text-sm text-gray-900">
//                         {task["Doer Name"] || "Unassigned"}
//                       </span>
//                     </div>
//                   </td>

//                   <td className="px-6 py-4 min-w-[200px]">
//                     <div className="text-sm text-gray-900 break-words">
//                       {task["Location"] || "N/A"}
//                     </div>
//                     {task.vendor && (
//                       <div className="text-xs text-gray-500 break-words">
//                         {task.vendor}
//                       </div>
//                     )}
//                   </td>

//                   <td className="px-6 py-4 min-w-[100px]">
//                     <div className="flex justify-end space-x-2">
//                       <Link
//                         to={`/tasks/${encodeURIComponent(
//                           task["Task No"] || "unknown"
//                         )}/${encodeURIComponent(task["Serial No"] || "unknown")}/${encodeURIComponent(task["Task Type"] || "unknown")}`}
//                         className="text-indigo-600 hover:text-indigo-900 p-1 rounded hover:bg-indigo-50"
//                       >
//                         <FileText size={18} />
//                       </Link>
//                     </div>
//                   </td>
//                 </tr>
//               ))}
//             </tbody>
//           </table>
//         </div>

//         {loadingTasks ? (
//           <div className="flex justify-center py-8 flex-col items-center text-gray-600 text-sm">
//             <div className="w-6 h-6 border-4 border-blue-500 border-dashed rounded-full animate-spin mb-2"></div>
//             Loading tasks...
//           </div>
//         ) : filteredTasks.length === 0 && !error ? (
//           <div className="px-6 py-12 text-center">
//             <p className="text-gray-500">
//               No tasks found matching your criteria.
//             </p>
//           </div>
//         ) : null}
//       </div>
//     </div>
//   );
// };

// export default Tasks;

















// import React, { useEffect, useState, useRef } from "react";
// import { Link } from "react-router-dom";
// import useAuthStore from "../store/authStore";
// import {
//   Search,
//   Filter,
//   Plus,
//   CheckCircle,
//   Clock,
//   AlertTriangle,
//   ArrowUp,
//   ArrowDown,
//   FileText,
//   UserCircle,
// } from "lucide-react";
// import axios from "axios";

// const Tasks = () => {
//   const { user } = useAuthStore();
//   const [searchTerm, setSearchTerm] = useState("");
//   const [sortColumn, setSortColumn] = useState("dueDate");
//   const [sortDirection, setSortDirection] = useState("asc");
//   const [selectedDepartment, setSelectedDepartment] = useState("all");
//   const [selectedStatus, setSelectedStatus] = useState("all");
//   const [selectedLocation, setSelectedLocation] = useState("all");
//   const [maintenanceTasks, setMaintenanceTasks] = useState([]);
//   const [repairTasks, setRepairTasks] = useState([]);
//   const [activeTab, setActiveTab] = useState("maintenance");
//   const [loadingTasks, setLoadingTasks] = useState(false);
//   const [error, setError] = useState(null);

//   // Pagination state
//   const [currentPage, setCurrentPage] = useState(1);
//   const [totalPages, setTotalPages] = useState(1);
//   const [totalRows, setTotalRows] = useState(0);
//   const [loadingMore, setLoadingMore] = useState(false);
//   const [hasMore, setHasMore] = useState(true);
//   const tableContainerRef = useRef(null);

//   const SCRIPT_URL =
//     "https://script.google.com/macros/s/AKfycbzWDU77ND7kYIIf__m_v3hlFv74-lF68mgSMjb0OadKnNU4XJFr74zAqnDQG0FARtjd/exec";
//   const SHEET_Id = "1lE5TdGcbmwVcVqbx-jftPIdmoGgg1DApNn4t9jZvGN8";

//   // Fetch tasks function moved outside useEffect
//  const fetchTasks = async (page = 1, isLoadMore = false) => {
//   if (!isLoadMore) {
//     setLoadingTasks(true);
//   } else {
//     setLoadingMore(true);
//   }
//   setError(null);

//   try {
//     console.log(`📡 Fetching tasks for page ${page}`, { isLoadMore });

//     // 🔗 Build URLs
//     const maintenanceURL = `${SCRIPT_URL}?sheetId=${SHEET_Id}&sheet=Maitenance%20Task%20Assign&page=${page}&pageSize=1000`;
//     const repairURL = `${SCRIPT_URL}?sheetId=${SHEET_Id}&sheet=Repair%20Task%20Assign&page=${page}&pageSize=1000`;

//     // 🕵️ Debug URLs
//     console.log("🔗 Maintenance URL:", maintenanceURL);
//     console.log("🔗 Repair URL:", repairURL);

//     // 🌐 Fetch data
//     const [maintenanceRes, repairRes] = await Promise.all([
//       axios.get(maintenanceURL),
//       axios.get(repairURL),
//     ]);

//     // 📝 Debug API responses
//     console.log("🔧 Maintenance API Meta:", {
//       success: maintenanceRes.data.success,
//       rowCount: maintenanceRes.data.rowCount,
//       page: maintenanceRes.data.page,
//       pageSize: maintenanceRes.data.pageSize,
//       totalPages: maintenanceRes.data.totalPages,
//     });

//     console.log("🔨 Repair API Meta:", {
//       success: repairRes.data.success,
//       rowCount: repairRes.data.rowCount,
//       page: repairRes.data.page,
//       pageSize: repairRes.data.pageSize,
//       totalPages: repairRes.data.totalPages,
//     });

//     // ========== Maintenance ==========
//     if (maintenanceRes.data.success && maintenanceRes.data.table) {
//       const formattedMaintenance = formatSheetData(maintenanceRes.data.table);
//       console.log(`📊 Formatted ${formattedMaintenance.length} maintenance records`);

//       const processedMaintenance =
//         getFirstPendingOrLatestCompletedPerMachineAndSerial(formattedMaintenance);
//       console.log(`⚡ Processed to ${processedMaintenance.length} unique maintenance tasks`);

//       if (isLoadMore) {
//         setMaintenanceTasks((prev) => {
//           console.log(`📈 Adding ${processedMaintenance.length} to existing ${prev.length} maintenance tasks`);
//           return [...prev, ...processedMaintenance];
//         });
//       } else {
//         setMaintenanceTasks(processedMaintenance);
//         console.log(`🆕 Set ${processedMaintenance.length} initial maintenance tasks`);
//       }

//       // Update pagination info
//       setTotalRows(maintenanceRes.data.rowCount || 0);
//       setTotalPages(maintenanceRes.data.totalPages || 1);
//       setCurrentPage(page);
//       setHasMore(page < (maintenanceRes.data.totalPages || 1));

//       console.log(
//         `📄 Pagination Update - Page: ${page}, Total Pages: ${maintenanceRes.data.totalPages}, Has More: ${
//           page < (maintenanceRes.data.totalPages || 1)
//         }`
//       );
//     } else {
//       console.warn("⚠️ No maintenance data received from API");
//     }

//     // ========== Repair ==========
//     if (repairRes.data.success && repairRes.data.table) {
//       const formattedRepair = formatSheetData(repairRes.data.table);
//       console.log(`📊 Formatted ${formattedRepair.length} repair records`);

//       const processedRepair =
//         getFirstPendingOrLatestCompletedPerMachineAndSerial(formattedRepair);
//       console.log(`⚡ Processed to ${processedRepair.length} unique repair tasks`);

//       if (isLoadMore) {
//         setRepairTasks((prev) => {
//           console.log(`📈 Adding ${processedRepair.length} to existing ${prev.length} repair tasks`);
//           return [...prev, ...processedRepair];
//         });
//       } else {
//         setRepairTasks(processedRepair);
//         console.log(`🆕 Set ${processedRepair.length} initial repair tasks`);
//       }
//     } else {
//       console.warn("⚠️ No repair data received from API");
//     }
//   } catch (error) {
//     console.error("❌ Error fetching tasks:", error);
//     setError(`Failed to load tasks: ${error.message}`);
//   } finally {
//     if (!isLoadMore) {
//       setLoadingTasks(false);
//     } else {
//       setLoadingMore(false);
//     }
//     console.log(`✅ Fetch completed for page ${page}`);
//   }
// };


//   // Load more tasks function
//   const loadMoreTasks = async () => {
//     if (loadingMore || !hasMore) {
//       console.log('🚫 Load more blocked:', { loadingMore, hasMore });
//       return;
//     }
    
//     const nextPage = currentPage + 1;
//     console.log(`🔄 Loading more tasks - Page ${nextPage}`);
//     await fetchTasks(nextPage, true);
//   };

//   // Scroll detection function
//   const handleScroll = () => {
//     const container = tableContainerRef.current;
//     if (!container) return;
    
//     const { scrollTop, scrollHeight, clientHeight } = container;
//     const isNearBottom = scrollTop + clientHeight >= scrollHeight - 100;
    
//     console.log('📜 Scroll Detection:', {
//       scrollTop: Math.round(scrollTop),
//       scrollHeight,
//       clientHeight,
//       isNearBottom,
//       hasMore,
//       loadingMore,
//       currentPage,
//       bottomDistance: scrollHeight - (scrollTop + clientHeight)
//     });
    
//     if (isNearBottom && hasMore && !loadingMore) {
//       console.log('🚀 Triggering load more...');
//       loadMoreTasks();
//     }
//   };

//   // Initial fetch
//   useEffect(() => {
//     console.log('🎬 Component mounted, fetching initial data');
//     fetchTasks(1, false);
//   }, []);

//   // Scroll listener
//   useEffect(() => {
//     const container = tableContainerRef.current;
//     if (container) {
//       console.log('🎧 Adding scroll listener');
//       container.addEventListener('scroll', handleScroll);
//       return () => {
//         console.log('🔇 Removing scroll listener');
//         container.removeEventListener('scroll', handleScroll);
//       };
//     }
//   }, [hasMore, loadingMore, currentPage]);

//   const formatSheetData = (sheetData) => {
//     console.log('🔄 Processing sheet data:', sheetData);
    
//     // Add safety checks
//     if (!sheetData || !sheetData.cols || !sheetData.rows) {
//       console.warn('⚠️ Invalid sheet data structure:', sheetData);
//       return [];
//     }

//     const columns = sheetData.cols.map((col) => col?.label);
//     const rows = sheetData.rows;

//     if (!columns || columns.length === 0) {
//       console.warn('⚠️ No columns found in sheet data');
//       return [];
//     }

//     console.log(`📋 Found ${columns.length} columns and ${rows.length} rows`);

//     return rows.map((row) => {
//       const obj = {};
//       if (row && row.c) {
//         row.c.forEach((cell, i) => {
//           if (columns[i]) {
//             obj[columns[i]] = cell?.v || "";
//           }
//         });
//       }
//       return obj;
//     }).filter(obj => Object.keys(obj).length > 0); // Filter out empty objects
//   };

//   const handleSort = (column) => {
//     if (sortColumn === column) {
//       setSortDirection(sortDirection === "asc" ? "desc" : "asc");
//     } else {
//       setSortColumn(column);
//       setSortDirection("asc");
//     }
//   };

//   const rawTasks = activeTab === "maintenance" ? maintenanceTasks : repairTasks;

//   console.log("rawTasks",rawTasks);

//   const filteredTasks = rawTasks.filter((task) => {
//     if (!task) return false;

//     // Admin can see all
//     if (user?.role !== "admin") {
//       if (
//         task["Doer Name"]?.toLowerCase().trim() !==
//         user?.username?.toLowerCase().trim()
//       ) {
//         return false;
//       }
//     }

//     const departmentMatch =
//       selectedDepartment === "all" ||
//       task["Department"]?.toLowerCase() === selectedDepartment.toLowerCase();

//     const searchMatch =
//       task["Machine Name"]?.toLowerCase().includes(searchTerm.toLowerCase()) ||
//       task["Task Type"]?.toLowerCase().includes(searchTerm.toLowerCase()) ||
//       task["Serial No"]?.toLowerCase().includes(searchTerm.toLowerCase()) ||
//       task["Priority"]?.toLowerCase().includes(searchTerm.toLowerCase()) ||
//       task["Department"]?.toLowerCase().includes(searchTerm.toLowerCase()) ||
//       task["Doer Name"]?.toLowerCase().includes(searchTerm.toLowerCase()) ||
//       task["Location"]
//         ?.toString()
//         .toLowerCase()
//         .includes(searchTerm.toLowerCase());

//     return departmentMatch && searchMatch;
//   });

//   const getFirstPendingOrLatestCompletedPerMachineAndSerial = (tasks) => {
//     if (!tasks || !Array.isArray(tasks)) {
//       console.warn('⚠️ Invalid tasks array provided to processing function');
//       return [];
//     }

//     console.log(`🔍 Processing ${tasks.length} tasks for unique machine-serial combinations`);
//     const machineSerialMap = new Map();

//     tasks.forEach((task) => {
//       if (!task) return; // Skip null/undefined tasks
      
//       const machineName = task["Machine Name"];
//       const serialNo = task["Serial No"];
//       const actualDate = task["Actual Date"];
      
//       // Skip tasks without essential data
//       if (!machineName || !serialNo) return;
      
//       // Create unique key combining machine name and serial number
//       const uniqueKey = `${machineName}|${serialNo}`;

//       if (!machineSerialMap.has(uniqueKey)) {
//         if (!actualDate) {
//           // If not completed (pending), keep the first pending
//           machineSerialMap.set(uniqueKey, task);
//         } else {
//           // Temporarily store the first completed
//           machineSerialMap.set(uniqueKey, { ...task, __isCompleted: true });
//         }
//       } else {
//         const existing = machineSerialMap.get(uniqueKey);

//         // If we already have a pending one, skip
//         if (!existing["Actual Date"]) return;

//         // If existing is completed but current is pending, replace it
//         if (actualDate === "") {
//           machineSerialMap.set(uniqueKey, task);
//         }
//       }
//     });

//     const result = Array.from(machineSerialMap.values());
//     console.log(`✨ Processed to ${result.length} unique tasks`);
//     return result;
//   };

//   // Get unique departments for filter
//   const departments = [...new Set(rawTasks.map(task => task["Department"]).filter(Boolean))];

//   return (
//     <div className="space-y-6">
//       <div className="flex items-center justify-between">
//         <h1 className="text-2xl font-bold text-gray-800">Maintenance Tasks</h1>
//       </div>

//       {/* Error Message */}
//       {error && (
//         <div className="bg-red-50 border border-red-200 rounded-lg p-4">
//           <div className="flex items-center">
//             <AlertTriangle className="text-red-500 mr-2" size={20} />
//             <span className="text-red-800">{error}</span>
//           </div>
//         </div>
//       )}

//       {/* Filter and Search */}
//       <div className="bg-white p-4 rounded-lg shadow flex flex-col md:flex-row md:items-center md:justify-between space-y-4 md:space-y-0 md:space-x-4">
//         <div className="flex flex-1 max-w-md">
//           <div className="relative w-full">
//             <input
//               type="text"
//               placeholder="Search tasks..."
//               className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
//               value={searchTerm}
//               onChange={(e) => setSearchTerm(e.target.value)}
//             />
//             <Search
//               size={20}
//               className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400"
//             />
//           </div>
//         </div>
//         <div className="flex flex-wrap gap-2">
//           <div className="flex items-center space-x-2">
//             <Filter size={16} className="text-gray-500" />
//             <select
//               className="border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500"
//               value={selectedDepartment}
//               onChange={(e) => setSelectedDepartment(e.target.value)}
//             >
//               <option value="all">All Departments</option>
//               {departments.map(dept => (
//                 <option key={dept} value={dept}>{dept}</option>
//               ))}
//             </select>
//           </div>
//         </div>
//       </div>

//       <div className="flex space-x-4 mb-4">
//         <button
//           className={`px-4 py-2 rounded-md ${
//             activeTab === "maintenance"
//               ? "bg-indigo-600 text-white"
//               : "bg-gray-200 text-gray-700"
//           }`}
//           onClick={() => setActiveTab("maintenance")}
//         >
//           Maintenance ({maintenanceTasks.length})
//         </button>
//         {/* Repair button hidden as requested */}
//       </div>

//       {/* Task List */}
//       <div className="bg-white rounded-lg shadow overflow-hidden">
//         <div 
//           ref={tableContainerRef}
//           className="overflow-x-auto max-h-[600px] overflow-y-auto"
//           style={{ scrollBehavior: 'smooth' }}
//         >
//           <table className="min-w-full divide-y divide-gray-200">
//             {/* Table heading - fixed */}
//             <thead className="bg-gray-50">
//               <tr>
//                 <th
//                   scope="col"
//                   className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer min-w-[200px]"
//                   onClick={() => handleSort("machineName")}
//                 >
//                   <div className="flex items-center">
//                     Machine & Task
//                     {sortColumn === "machineName" &&
//                       (sortDirection === "asc" ? (
//                         <ArrowUp size={14} className="ml-1" />
//                       ) : (
//                         <ArrowDown size={14} className="ml-1" />
//                       ))}
//                   </div>
//                 </th>

//                 <th
//                   scope="col"
//                   className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer min-w-[120px]"
//                   onClick={() => handleSort("serialNo")}
//                 >
//                   <div className="flex items-center">
//                     Serial No
//                     {sortColumn === "serialNo" &&
//                       (sortDirection === "asc" ? (
//                         <ArrowUp size={14} className="ml-1" />
//                       ) : (
//                         <ArrowDown size={14} className="ml-1" />
//                       ))}
//                   </div>
//                 </th>

//                 <th
//                   scope="col"
//                   className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer min-w-[150px]"
//                   onClick={() => handleSort("department")}
//                 >
//                   <div className="flex items-center">
//                     Department
//                     {sortColumn === "department" &&
//                       (sortDirection === "asc" ? (
//                         <ArrowUp size={14} className="ml-1" />
//                       ) : (
//                         <ArrowDown size={14} className="ml-1" />
//                       ))}
//                   </div>
//                 </th>

//                 <th
//                   scope="col"
//                   className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider min-w-[120px]"
//                 >
//                   Priority
//                 </th>

//                 <th
//                   scope="col"
//                   className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer min-w-[180px]"
//                   onClick={() => handleSort("assignedTo")}
//                 >
//                   <div className="flex items-center">
//                     Assigned To
//                     {sortColumn === "assignedTo" &&
//                       (sortDirection === "asc" ? (
//                         <ArrowUp size={14} className="ml-1" />
//                       ) : (
//                         <ArrowDown size={14} className="ml-1" />
//                       ))}
//                   </div>
//                 </th>

//                 <th
//                   scope="col"
//                   className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider min-w-[200px]"
//                 >
//                   Location
//                 </th>

//                 <th
//                   scope="col"
//                   className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider min-w-[100px]"
//                 >
//                   Actions
//                 </th>
//               </tr>
//             </thead>

//             {/* Table body with scroll */}
//             <tbody className="bg-white divide-y divide-gray-200">
//               {filteredTasks.map((task, ind) => (
//                 <tr key={`${task["Machine Name"]}-${task["Serial No"]}-${ind}`} className="hover:bg-gray-50">
//                   <td className="px-6 py-4 min-w-[200px]">
//                     <div className="text-sm font-medium text-gray-900">
//                       {task["Machine Name"] || "N/A"}
//                     </div>
//                     <div className="text-xs text-gray-500 mt-1">
//                       {task["Task Type"] || "N/A"}
//                     </div>
//                   </td>

//                   <td className="px-6 py-4 min-w-[120px]">
//                     <div className="text-sm text-gray-900">
//                       {task["Serial No"] || "N/A"}
//                     </div>
//                   </td>

//                   <td className="px-6 py-4 min-w-[150px]">
//                     <div className="text-sm text-gray-900">
//                       {task["Department"] || "N/A"}
//                     </div>
//                   </td>

//                   <td className="px-6 py-4 min-w-[120px]">
//                     <div className="flex flex-col space-y-1">
//                       {task["Priority"] || "N/A"}
//                     </div>
//                   </td>

//                   <td className="px-6 py-4 min-w-[180px]">
//                     <div className="flex items-center">
//                       <UserCircle size={20} className="text-gray-400 mr-2" />
//                       <span className="text-sm text-gray-900">
//                         {task["Doer Name"] || "Unassigned"}
//                       </span>
//                     </div>
//                   </td>

//                   <td className="px-6 py-4 min-w-[200px]">
//                     <div className="text-sm text-gray-900 break-words">
//                       {task["Location"] || "N/A"}
//                     </div>
//                     {task.vendor && (
//                       <div className="text-xs text-gray-500 break-words">
//                         {task.vendor}
//                       </div>
//                     )}
//                   </td>

//                   <td className="px-6 py-4 min-w-[100px]">
//                     <div className="flex justify-end space-x-2">
//                       <Link
//                         to={`/tasks/${encodeURIComponent(
//                           task["Task No"] || "unknown"
//                         )}/${encodeURIComponent(task["Serial No"] || "unknown")}/${encodeURIComponent(task["Task Type"] || "unknown")}`}
//                         className="text-indigo-600 hover:text-indigo-900 p-1 rounded hover:bg-indigo-50"
//                       >
//                         <FileText size={18} />
//                       </Link>
//                     </div>
//                   </td>
//                 </tr>
//               ))}
//             </tbody>
//           </table>
//         </div>

//         {/* Loading More Indicator */}
//         {loadingMore && (
//           <div className="flex justify-center py-4 bg-gray-50 border-t">
//             <div className="flex items-center text-gray-600 text-sm">
//               <div className="w-4 h-4 border-2 border-blue-500 border-dashed rounded-full animate-spin mr-2"></div>
//               Loading more tasks...
//             </div>
//           </div>
//         )}

//         {/* Pagination Info */}
//         {!loadingTasks && totalRows > 0 && (
//           <div className="px-6 py-3 bg-gray-50 border-t text-sm text-gray-600">
//             Showing {filteredTasks.length} tasks {hasMore ? `(${totalRows} total available)` : '(all loaded)'}
//             {hasMore && (
//               <button 
//                 onClick={loadMoreTasks}
//                 disabled={loadingMore}
//                 className="ml-4 text-indigo-600 hover:text-indigo-800 disabled:opacity-50"
//               >
//                 {loadingMore ? 'Loading...' : 'Load More'}
//               </button>
//             )}
//           </div>
//         )}

//         {loadingTasks ? (
//           <div className="flex justify-center py-8 flex-col items-center text-gray-600 text-sm">
//             <div className="w-6 h-6 border-4 border-blue-500 border-dashed rounded-full animate-spin mb-2"></div>
//             Loading tasks...
//           </div>
//         ) : filteredTasks.length === 0 && !error ? (
//           <div className="px-6 py-12 text-center">
//             <p className="text-gray-500">
//               No tasks found matching your criteria.
//             </p>
//           </div>
//         ) : null}
//       </div>
//     </div>
//   );
// };

// export default Tasks;



































import React, { useEffect, useState, useRef } from "react";
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
  const [error, setError] = useState(null);

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalRows, setTotalRows] = useState(0);
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const tableContainerRef = useRef(null);

  const SCRIPT_URL =
    "https://script.google.com/macros/s/AKfycbzWDU77ND7kYIIf__m_v3hlFv74-lF68mgSMjb0OadKnNU4XJFr74zAqnDQG0FARtjd/exec";
  const SHEET_Id = "1lE5TdGcbmwVcVqbx-jftPIdmoGgg1DApNn4t9jZvGN8";

  // Fetch tasks function moved outside useEffect
  const fetchTasks = async (page = 1, isLoadMore = false) => {
    if (!isLoadMore) {
      setLoadingTasks(true);
    } else {
      setLoadingMore(true);
    }
    setError(null);

    try {
      console.log(`📡 Fetching tasks for page ${page}`, { isLoadMore });

      // Build URLs with filter parameters
      const baseParams = new URLSearchParams({
        sheetId: SHEET_Id,
        page: page.toString(),
        pageSize: "1000",
        search: searchTerm,
        department: selectedDepartment,
        status: selectedStatus,
        location: selectedLocation,
        userRole: user?.role || "",
        username: user?.username || ""
      });

      const maintenanceURL = `${SCRIPT_URL}?${baseParams}&sheet=Maitenance%20Task%20Assign`;
      const repairURL = `${SCRIPT_URL}?${baseParams}&sheet=Repair%20Task%20Assign`;

      // 🕵️ Debug URLs
      console.log("🔗 Maintenance URL:", maintenanceURL);
      console.log("🔗 Repair URL:", repairURL);

      // 🌐 Fetch data
      const [maintenanceRes, repairRes] = await Promise.all([
        axios.get(maintenanceURL),
        axios.get(repairURL),
      ]);

      // 📝 Debug API responses
      console.log("🔧 Maintenance API Meta:", {
        success: maintenanceRes.data.success,
        rowCount: maintenanceRes.data.rowCount,
        page: maintenanceRes.data.page,
        pageSize: maintenanceRes.data.pageSize,
        totalPages: maintenanceRes.data.totalPages,
      });

      console.log("🔨 Repair API Meta:", {
        success: repairRes.data.success,
        rowCount: repairRes.data.rowCount,
        page: repairRes.data.page,
        pageSize: repairRes.data.pageSize,
        totalPages: repairRes.data.totalPages,
      });

      // ========== Maintenance ==========
      if (maintenanceRes.data.success && maintenanceRes.data.table) {
        const formattedMaintenance = formatSheetData(maintenanceRes.data.table);
        console.log(`📊 Received ${formattedMaintenance.length} maintenance records from backend`);

        if (isLoadMore) {
          setMaintenanceTasks((prev) => {
            console.log(`📈 Adding ${formattedMaintenance.length} to existing ${prev.length} maintenance tasks`);
            return [...prev, ...formattedMaintenance];
          });
        } else {
          setMaintenanceTasks(formattedMaintenance);
          console.log(`🆕 Set ${formattedMaintenance.length} initial maintenance tasks`);
        }

        // Update pagination info
        setTotalRows(maintenanceRes.data.rowCount || 0);
        setTotalPages(maintenanceRes.data.totalPages || 1);
        setCurrentPage(page);
        setHasMore(page < (maintenanceRes.data.totalPages || 1));

        console.log(
          `📄 Pagination Update - Page: ${page}, Total Pages: ${maintenanceRes.data.totalPages}, Has More: ${
            page < (maintenanceRes.data.totalPages || 1)
          }`
        );
      } else {
        console.warn("⚠️ No maintenance data received from API");
      }

      // ========== Repair ==========
      if (repairRes.data.success && repairRes.data.table) {
        const formattedRepair = formatSheetData(repairRes.data.table);
        console.log(`📊 Received ${formattedRepair.length} repair records from backend`);

        if (isLoadMore) {
          setRepairTasks((prev) => {
            console.log(`📈 Adding ${formattedRepair.length} to existing ${prev.length} repair tasks`);
            return [...prev, ...formattedRepair];
          });
        } else {
          setRepairTasks(formattedRepair);
          console.log(`🆕 Set ${formattedRepair.length} initial repair tasks`);
        }
      } else {
        console.warn("⚠️ No repair data received from API");
      }
    } catch (error) {
      console.error("❌ Error fetching tasks:", error);
      setError(`Failed to load tasks: ${error.message}`);
    } finally {
      if (!isLoadMore) {
        setLoadingTasks(false);
      } else {
        setLoadingMore(false);
      }
      console.log(`✅ Fetch completed for page ${page}`);
    }
  };

  // Load more tasks function
  const loadMoreTasks = async () => {
    if (loadingMore || !hasMore) {
      console.log('🚫 Load more blocked:', { loadingMore, hasMore });
      return;
    }
    
    const nextPage = currentPage + 1;
    console.log(`🔄 Loading more tasks - Page ${nextPage}`);
    await fetchTasks(nextPage, true);
  };

  // Scroll detection function
  const handleScroll = () => {
    const container = tableContainerRef.current;
    if (!container) return;
    
    const { scrollTop, scrollHeight, clientHeight } = container;
    const isNearBottom = scrollTop + clientHeight >= scrollHeight - 100;
    
    console.log('📜 Scroll Detection:', {
      scrollTop: Math.round(scrollTop),
      scrollHeight,
      clientHeight,
      isNearBottom,
      hasMore,
      loadingMore,
      currentPage,
      bottomDistance: scrollHeight - (scrollTop + clientHeight)
    });
    
    if (isNearBottom && hasMore && !loadingMore) {
      console.log('🚀 Triggering load more...');
      loadMoreTasks();
    }
  };

  // Initial fetch
  useEffect(() => {
    console.log('🎬 Component mounted, fetching initial data');
    fetchTasks(1, false);
  }, []);

  // Refetch when filters change
  useEffect(() => {
    console.log('🔄 Filters changed, refetching data');
    setCurrentPage(1);
    setMaintenanceTasks([]);
    setRepairTasks([]);
    setHasMore(true);
    fetchTasks(1, false);
  }, [searchTerm, selectedDepartment, selectedStatus, selectedLocation]);

  // Scroll listener
  useEffect(() => {
    const container = tableContainerRef.current;
    if (container) {
      console.log('🎧 Adding scroll listener');
      container.addEventListener('scroll', handleScroll);
      return () => {
        console.log('🔇 Removing scroll listener');
        container.removeEventListener('scroll', handleScroll);
      };
    }
  }, [hasMore, loadingMore, currentPage]);

  const formatSheetData = (sheetData) => {
    console.log('🔄 Processing sheet data:', sheetData);
    
    // Add safety checks
    if (!sheetData || !sheetData.cols || !sheetData.rows) {
      console.warn('⚠️ Invalid sheet data structure:', sheetData);
      return [];
    }

    const columns = sheetData.cols.map((col) => col?.label);
    const rows = sheetData.rows;

    if (!columns || columns.length === 0) {
      console.warn('⚠️ No columns found in sheet data');
      return [];
    }

    console.log(`📋 Found ${columns.length} columns and ${rows.length} rows`);

    return rows.map((row) => {
      const obj = {};
      if (row && row.c) {
        row.c.forEach((cell, i) => {
          if (columns[i]) {
            obj[columns[i]] = cell?.v || "";
          }
        });
      }
      return obj;
    }).filter(obj => Object.keys(obj).length > 0); // Filter out empty objects
  };

  const handleSort = (column) => {
    if (sortColumn === column) {
      setSortDirection(sortDirection === "asc" ? "desc" : "asc");
    } else {
      setSortColumn(column);
      setSortDirection("asc");
    }
  };

  // Tasks are now pre-filtered by the backend
  const rawTasks = activeTab === "maintenance" ? maintenanceTasks : repairTasks;
  const filteredTasks = rawTasks; // No frontend filtering needed anymore

  console.log("rawTasks", rawTasks);

  // Get unique departments for filter (from all tasks for UI purposes)
  const departments = [...new Set(rawTasks.map(task => task["Department"]).filter(Boolean))];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-800">Maintenance Tasks</h1>
      </div>

      {/* Error Message */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <div className="flex items-center">
            <AlertTriangle className="text-red-500 mr-2" size={20} />
            <span className="text-red-800">{error}</span>
          </div>
        </div>
      )}

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
              {departments.map(dept => (
                <option key={dept} value={dept}>{dept}</option>
              ))}
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
          Maintenance ({maintenanceTasks.length})
        </button>
        {/* Repair button hidden as requested */}
      </div>

      {/* Task List */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div 
          ref={tableContainerRef}
          className="overflow-x-auto max-h-[600px] overflow-y-auto"
          style={{ scrollBehavior: 'smooth' }}
        >
          <table className="min-w-full divide-y divide-gray-200">
            {/* Table heading - fixed */}
            <thead className="bg-gray-50">
              <tr>
                <th
                  scope="col"
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer min-w-[200px]"
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
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer min-w-[120px]"
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
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer min-w-[150px]"
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
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider min-w-[120px]"
                >
                  Priority
                </th>

                <th
                  scope="col"
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer min-w-[180px]"
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
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider min-w-[200px]"
                >
                  Location
                </th>

                <th
                  scope="col"
                  className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider min-w-[100px]"
                >
                  Actions
                </th>
              </tr>
            </thead>

            {/* Table body with scroll */}
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredTasks.map((task, ind) => (
                <tr key={`${task["Machine Name"]}-${task["Serial No"]}-${ind}`} className="hover:bg-gray-50">
                  <td className="px-6 py-4 min-w-[200px]">
                    <div className="text-sm font-medium text-gray-900">
                      {task["Machine Name"] || "N/A"}
                    </div>
                    <div className="text-xs text-gray-500 mt-1">
                      {task["Task Type"] || "N/A"}
                    </div>
                  </td>

                  <td className="px-6 py-4 min-w-[120px]">
                    <div className="text-sm text-gray-900">
                      {task["Serial No"] || "N/A"}
                    </div>
                  </td>

                  <td className="px-6 py-4 min-w-[150px]">
                    <div className="text-sm text-gray-900">
                      {task["Department"] || "N/A"}
                    </div>
                  </td>

                  <td className="px-6 py-4 min-w-[120px]">
                    <div className="flex flex-col space-y-1">
                      {task["Priority"] || "N/A"}
                    </div>
                  </td>

                  <td className="px-6 py-4 min-w-[180px]">
                    <div className="flex items-center">
                      <UserCircle size={20} className="text-gray-400 mr-2" />
                      <span className="text-sm text-gray-900">
                        {task["Doer Name"] || "Unassigned"}
                      </span>
                    </div>
                  </td>

                  <td className="px-6 py-4 min-w-[200px]">
                    <div className="text-sm text-gray-900 break-words">
                      {task["Location"] || "N/A"}
                    </div>
                    {task.vendor && (
                      <div className="text-xs text-gray-500 break-words">
                        {task.vendor}
                      </div>
                    )}
                  </td>

                  <td className="px-6 py-4 min-w-[100px]">
                    <div className="flex justify-end space-x-2">
                      <Link
                        to={`/tasks/${encodeURIComponent(
                          task["Task No"] || "unknown"
                        )}/${encodeURIComponent(task["Serial No"] || "unknown")}/${encodeURIComponent(task["Task Type"] || "unknown")}`}
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

        {/* Loading More Indicator */}
        {loadingMore && (
          <div className="flex justify-center py-4 bg-gray-50 border-t">
            <div className="flex items-center text-gray-600 text-sm">
              <div className="w-4 h-4 border-2 border-blue-500 border-dashed rounded-full animate-spin mr-2"></div>
              Loading more tasks...
            </div>
          </div>
        )}

        {/* Pagination Info */}
        {!loadingTasks && totalRows > 0 && (
          <div className="px-6 py-3 bg-gray-50 border-t text-sm text-gray-600">
            Showing {filteredTasks.length} tasks {hasMore ? `(${totalRows} total available)` : '(all loaded)'}
            {hasMore && (
              <button 
                onClick={loadMoreTasks}
                disabled={loadingMore}
                className="ml-4 text-indigo-600 hover:text-indigo-800 disabled:opacity-50"
              >
                {loadingMore ? 'Loading...' : 'Load More'}
              </button>
            )}
          </div>
        )}

        {loadingTasks ? (
          <div className="flex justify-center py-8 flex-col items-center text-gray-600 text-sm">
            <div className="w-6 h-6 border-4 border-blue-500 border-dashed rounded-full animate-spin mb-2"></div>
            Loading tasks...
          </div>
        ) : filteredTasks.length === 0 && !error ? (
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