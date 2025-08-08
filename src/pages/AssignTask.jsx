import { set } from "date-fns";
import { Loader2Icon, LoaderIcon } from "lucide-react";
import React, { useEffect, useState } from "react";
import toast from "react-hot-toast";

function AssignTask() {
  const [time, setTime] = useState("09:00");
  const [accordionOpen, setAccordionOpen] = useState(false);
  const [sheetData, setSheetData] = useState([]);
  const [doerName, setDoerName] = useState([]);
  const [giveByData, setGivenByData] = useState([]);
  const [taskStatusData, setTaskStatusData] = useState([]);
  const [priorityData, setPriorityData] = useState([]);

  const [selectedMachine, setSelectedMachine] = useState("");
  const [filteredSerials, setFilteredSerials] = useState([]);

  const [startDate, setStartDate] = useState("");
  const [startTime, setStartTime] = useState("");
  const [endTime, setEndTime] = useState("");
  const [endDate, setEndDate] = useState("");
  const [endTaskDate, setEndTaskDate] = useState("");
  const [availableFrequencies, setAvailableFrequencies] = useState([]);

  const [selectedSerialNo, setSelectedSerialNo] = useState("");
  const [selectedGivenBy, setSelectedGivenBy] = useState("");
  const [selectedDoerName, setSelectedDoerName] = useState("");
  const [selectedTaskType, setSelectedTaskType] = useState("Select Task Type");
  const [needSoundTask, setNeedSoundTask] = useState("");
  const [temperature, setTemperature] = useState("");
  const [selectedPriority, setSelectedPriority] = useState("");
  const [description, setWorkDescription] = useState("");
  const [machineArea, setMachineArea] = useState("");
  const [partName, setPartName] = useState("");
  const [taskList, setTaskList] = useState([]);

  const [loaderSheetData, setLoaderSheetData] = useState(false);
  const [loaderWorkingDayData, setLoaderWorkingDayData] = useState(false);
  const [loaderSubmit, setLoaderSubmit] = useState(false);
  const [loaderMasterSheetData, setLoaderMasterSheetData] = useState(false);
  const [generatedTasks, setGeneratedTasks] = useState([]);
  const [showTaskPreview, setShowTaskPreview] = useState(false);
  const [frequency, setFrequency] = useState("");
  const [workingDaysData, setWorkingDaysData] = useState([]);

  const [enableReminder, setEnableReminder] = useState(false);
  const [requireAttachment, setRequireAttachment] = useState(false);

  // console.log("enableReminder", enableReminder);
  // console.log("requireAttachment", requireAttachment);

  const SCRIPT_URL =
    "https://script.google.com/macros/s/AKfycbzWDU77ND7kYIIf__m_v3hlFv74-lF68mgSMjb0OadKnNU4XJFr74zAqnDQG0FARtjd/exec";
  const SHEET_Id = "1lE5TdGcbmwVcVqbx-jftPIdmoGgg1DApNn4t9jZvGN8";

  // Fetch working days calendar data
  const fetchWorkingDaysCalendar = async () => {
    try {
      const SHEET_NAME = "Working Day Calendar";
      const res = await fetch(
        `${SCRIPT_URL}?sheetId=${SHEET_Id}&&sheet=${SHEET_NAME}`
      );
      const result = await res.json();

      if (result.success && result.table) {
        const headers = result.table.cols.map((col) => col.label);
        const rows = result.table.rows.map((rowObj) => {
          const row = rowObj.c;
          const rowData = {};
          row.forEach((cell, i) => {
            // Use formatted value (f) if available, otherwise raw value (v)
            rowData[headers[i]] = cell?.f || cell?.v || "";
          });
          return rowData;
        });

        // Filter out empty rows and set working days data
        const validRows = rows.filter((row) => row["Working Dates"]);
        setWorkingDaysData(validRows);

        // Set endDate to the last working date if available
        if (validRows.length > 0) {
          const lastWorkingDate =
            validRows[validRows.length - 1]["Working Dates"];
          if (lastWorkingDate) {
            // Handle different date formats
            let formattedDate;
            if (lastWorkingDate.match(/^\d{2}\/\d{2}\/\d{4}$/)) {
              // DD/MM/YYYY format
              const [day, month, year] = lastWorkingDate.split("/");
              formattedDate = `${year}-${month.padStart(2, "0")}-${day.padStart(
                2,
                "0"
              )}`;
            } else if (lastWorkingDate.match(/^\d{4}-\d{2}-\d{2}$/)) {
              // Already in YYYY-MM-DD format
              formattedDate = lastWorkingDate;
            }

            if (formattedDate) {
              setEndDate(formattedDate);
            }
          }
        }
      }
    } catch (error) {
      console.error("Failed to fetch working days calendar", error);
      toast.error("Failed to load working days calendar");
    }
  };

  const fetchAllTasks = async () => {
    console.log("slectedfdf", selectedTaskType);
    try {
      const SHEET_NAME_TASK =
        selectedTaskType === "Repair"
          ? "Repair Task Assign"
          : "Maitenance Task Assign";
      const res = await fetch(
        `${SCRIPT_URL}?sheetId=${SHEET_Id}&&sheet=${SHEET_NAME_TASK}`
      );
      const result = await res.json();
      if (result.success && result.table) {
        const headers = result.table.cols.map((col) => col.label);
        const rows = result.table.rows.map((rowObj) => {
          const row = rowObj.c;
          const rowData = {};
          row.forEach((cell, i) => {
            rowData[headers[i]] = cell?.v || "";
          });
          return rowData;
        });
        console.log("taskResult", rows);
        setTaskList(rows);
      }
    } catch (error) {
      console.error("Failed to fetch tasks for Task No generation", error);
    }
  };

  useEffect(() => {
    // console.log("endTaskDate", endTaskDate);
    selectedTaskType === "Repair"
      ? setEndDate(endTaskDate)
      : fetchWorkingDaysCalendar();
  }, [selectedTaskType, endTaskDate]);
  // console.log("Task List", taskList);

  useEffect(() => {
    fetchAllTasks();
  }, [selectedTaskType]);

  const fetchSheetData = async () => {
    const SHEET_NAME = "FormResponses";
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

  const fetchMasterSheetData = async () => {
    const SHEET_NAME = "Master";
    try {
      setLoaderMasterSheetData(true);
      const res = await fetch(
        `${SCRIPT_URL}?sheetId=${SHEET_Id}&&sheet=${SHEET_NAME}`
      );
      const result = await res.json();

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
        const DoerNameData = formattedRows.map((item) => item["Doer Name"]);
        setDoerName(DoerNameData);
        const giveBy = formattedRows.map((item) => item["Given By"]);
        setGivenByData(giveBy);
        const taskStatus = formattedRows.map((item) => item["Task Status"]);
        setTaskStatusData(taskStatus);
        const priority = formattedRows.map((item) => item["Priority"]);
        setPriorityData(priority);
      } else {
        console.error("Server error:", result.message || result.error);
      }
    } catch (err) {
      console.error("Fetch error:", err);
    } finally {
      setLoaderMasterSheetData(false);
    }
  };

  useEffect(() => {
    fetchSheetData();
    fetchMasterSheetData();
  }, []);

  useEffect(() => {
    if (startDate && endDate) {
      const start = new Date(startDate);
      const end = new Date(endDate);
      const diffInDays = (end - start) / (1000 * 60 * 60 * 24);

      let frequencies = [];
      if (diffInDays >= 365) {
        frequencies = [
          "one-time",
          "Daily",
          "Weekly",
          "Monthly",
          "Quarterly",
          "Half Yearly",
          "Yearly",
        ];
      } else if (diffInDays >= 180) {
        frequencies = [
          "one-time",
          "Daily",
          "Weekly",
          "Monthly",
          "Quarterly",
          "Half Yearly",
        ];
      } else if (diffInDays >= 90) {
        frequencies = ["one-time", "Daily", "Weekly", "Monthly", "Quarterly"];
      } else if (diffInDays >= 30) {
        frequencies = ["one-time", "Daily", "Weekly", "Monthly"];
      } else if (diffInDays >= 7) {
        frequencies = ["one-time", "Daily", "Weekly"];
      } else if (diffInDays > 0) {
        frequencies = ["one-time", "Daily"];
      }

      setAvailableFrequencies(frequencies);
    } else {
      setAvailableFrequencies([]);
    }
  }, [startDate, endDate]);

  // NEW: Function to combine date and time into DD/MM/YYYY HH:MM:SS format
  const formatDateTimeForStorage = (date, time) => {
    if (!date || !time) return "";

    const d = new Date(date);
    const day = d.getDate().toString().padStart(2, "0");
    const month = (d.getMonth() + 1).toString().padStart(2, "0");
    const year = d.getFullYear();

    // Time is already in HH:MM format, just add :00 for seconds
    const timeWithSeconds = time + ":00";

    return `${day}/${month}/${year} ${timeWithSeconds}`;
  };

  // UPDATED: Date formatting function to return DD/MM/YYYY format (for working days comparison)
  const formatDateToDDMMYYYY = (date) => {
    const d = new Date(date);
    const day = d.getDate().toString().padStart(2, "0");
    const month = (d.getMonth() + 1).toString().padStart(2, "0");
    const year = d.getFullYear();
    return `${day}/${month}/${year}`;
  };

  // NEW: Helper function to find next working day for a given date
  const findNextWorkingDay = (targetDate, workingDays) => {
    const targetDateStr = formatDateToDDMMYYYY(targetDate);

    // If target date is already a working day, return it
    if (workingDays.includes(targetDateStr)) {
      return targetDateStr;
    }

    // Otherwise, find the next working day
    let checkDate = new Date(targetDate);
    for (let i = 1; i <= 30; i++) {
      // Check up to 30 days ahead
      checkDate = addDays(targetDate, i);
      const checkDateStr = formatDateToDDMMYYYY(checkDate);
      if (workingDays.includes(checkDateStr)) {
        return checkDateStr;
      }
    }

    // If no working day found in 30 days, return the original target date
    return targetDateStr;
  };

  const addDays = (date, days) => {
    const newDate = new Date(date);
    newDate.setDate(newDate.getDate() + days);
    return newDate;
  };

  const addMonths = (date, months) => {
    const newDate = new Date(date);
    newDate.setMonth(newDate.getMonth() + months);
    return newDate;
  };

  const addYears = (date, years) => {
    const newDate = new Date(date);
    newDate.setFullYear(newDate.getFullYear() + years);
    return newDate;
  };

  const fetchWorkingDays = async () => {
    try {
      const SCRIPT_URL =
        "https://script.google.com/macros/s/AKfycbzWDU77ND7kYIIf__m_v3hlFv74-lF68mgSMjb0OadKnNU4XJFr74zAqnDQG0FARtjd/exec";
      const SHEET_NAME = "Working Day Calendar";

      const response = await fetch(
        `${SCRIPT_URL}?sheetId=${SHEET_Id}&sheet=${SHEET_NAME}`
      );
      if (!response.ok) {
        throw new Error(`Failed to fetch working days: ${response.status}`);
      }

      const text = await response.text();
      const jsonStart = text.indexOf("{");
      const jsonEnd = text.lastIndexOf("}");
      const jsonString = text.substring(jsonStart, jsonEnd + 1);
      const data = JSON.parse(jsonString);

      console.log("Data", data);

      if (!data.table || !data.table.rows) {
        console.log("No working day data found");
        return [];
      }

      // ✅ Extract dates from column A using the formatted value (f)
      const workingDays = [];
      data.table.rows.forEach((row) => {
        if (row.c && row.c[0] && row.c[0].f) {
          let dateValue = row.c[0].f; // ✅ Use formatted string like "01/04/2025"

          if (
            typeof dateValue === "string" &&
            dateValue.match(/^\d{2}\/\d{2}\/\d{4}$/) // DD/MM/YYYY pattern
          ) {
            workingDays.push(dateValue);
          }
        }
      });

      console.log(`Fetched ${workingDays.length} working days`);
      console.log("Sample dates:", workingDays.slice(0, 5)); // optional debug
      return workingDays;
    } catch (error) {
      console.error("Error fetching working days:", error);
      return []; // Return empty array if fetch fails
    }
  };

  const generateTasks = async () => {
    // Validate required fields
    if (
      !startDate ||
      !endDate ||
      !startTime ||
      (selectedTaskType === "Maintence" ? !frequency : !endTaskDate)
    ) {
      toast.error(
        "Please fill in all required fields including date range, time and frequency"
      );
      return;
    }

    const startDateObj = new Date(startDate);
    const endDateObj = new Date(endDate);

    // Validate date range
    if (startDateObj > endDateObj) {
      toast.error("End date must be after start date");
      return;
    }

    // Fetch working days
    setLoaderWorkingDayData(true);
    const workingDays = await fetchWorkingDays();
    setLoaderWorkingDayData(false);
    if (workingDays.length === 0) {
      toast.error("Could not retrieve working days calendar");
      return;
    }

    const tasks = [];

    // For one-time tasks
    if (frequency === "one-time") {
      const taskDate = findNextWorkingDay(startDateObj, workingDays);
      if (!taskDate) {
        toast.error("No working days found in the selected date range");
        return;
      }

      tasks.push({
        description,
        givenBy: selectedGivenBy,
        doer: selectedDoerName,
        dueDate: formatDateTimeForStorage(
          new Date(taskDate.split("/").reverse().join("-")),
          time
        ),
        status: "pending",
        frequency,
      });
    }
    // For recurring tasks
    else {
      let currentDate = new Date(startDateObj);
      let taskCount = 0;
      const maxTasks = 1000; // Safety limit

      while (currentDate <= endDateObj && taskCount < maxTasks) {
        const currentDateStr = formatDateToDDMMYYYY(currentDate);

        if (workingDays.includes(currentDateStr)) {
          tasks.push({
            description,
            givenBy: selectedGivenBy,
            doer: selectedDoerName,
            dueDate: formatDateTimeForStorage(currentDate, time),
            status: "pending",
            frequency,
          });
          taskCount++;
        }

        // Calculate next date based on frequency
        switch (frequency.toLowerCase()) {
          case "daily":
            currentDate = addDays(currentDate, 1);
            break;
          case "weekly":
            currentDate = addDays(currentDate, 7);
            break;
          case "monthly":
            currentDate = addMonths(currentDate, 1);
            break;
          case "quarterly":
            currentDate = addMonths(currentDate, 3);
            break;
          case "half yearly":
          case "half-yearly":
            currentDate = addMonths(currentDate, 6);
            break;
          case "yearly":
            currentDate = addYears(currentDate, 1);
            break;
          default:
            currentDate = addDays(currentDate, 1); // Default to daily
            break;
        }
      }
    }

    // Show results
    if (tasks.length === 0) {
      toast.error(
        "No tasks generated - check your date range and working days"
      );
      return;
    }

    setGeneratedTasks(tasks);
    setShowTaskPreview(true);
    toast.success(
      `Generated ${tasks.length} tasks between ${formatDateToDDMMYYYY(
        startDateObj
      )} and ${formatDateToDDMMYYYY(endDateObj)}`
    );
  };

  const handleSubmitForm = async (e) => {
    e.preventDefault();



    if (selectedTaskType === "Maintence" && generatedTasks.length === 0) {
      toast.error("❌ No generated tasks to assign. Please preview first.");
      return;
    }

    try {
      setLoaderSubmit(true);

      const formPayload = new FormData();
      formPayload.append(
        "sheetName",
        selectedTaskType === "Repair"
          ? "Repair Task Assign"
          : "Maitenance Task Assign"
      );

      if (selectedTaskType === "Repair") {
        // Get last task number safely
        const lastTaskNo =
          taskList
            .filter((task) => task["Task No"]?.startsWith("TR-"))
            .map((task) => parseInt(task["Task No"].replace("TR-", ""), 10))
            .filter((num) => !isNaN(num))
            .sort((a, b) => b - a)[0] || 0;

            console.log("lastTaskNoTr", lastTaskNo);

        // For Repair tasks, send as single insert
        formPayload.append("action", "insert");

        // Prepare single task data
        const taskData = {
          "Time Stemp": new Date().toLocaleString("en-IN", {
            timeZone: "Asia/Kolkata",
          }),
          "Task No": `TR-${String(lastTaskNo + 1).padStart(3, "0")}`,
          "Serial No": selectedSerialNo,
          "Machine Name": selectedMachine,
          "Given By": selectedGivenBy,
          "Doer Name": selectedDoerName,
          "Task Type": selectedTaskType,
          "Enable Reminders": enableReminder ? "Yes" : "No",
          "Require Attachment": requireAttachment ? "Yes" : "No",
          "Task Start Date": `${startDate} ${startTime}:00`,
          "Ending Date": `${endTaskDate} ${endTime}:00`,
          Description: description,
          Priority: selectedPriority,
        };

        // Append all fields individually to formData
        Object.entries(taskData).forEach(([key, value]) => {
          formPayload.append(key, value);
        });
      } else {
        // For Maintenance tasks, keep the existing batch insert logic
        console.log("taskList.length", taskList.length);
        console.log("generatedTasks", generatedTasks);

        // Get last task number safely
        const lastTaskNo =
          taskList
            .filter((task) => task["Task No"]?.startsWith("TM-"))
            .map((task) => parseInt(task["Task No"].replace("TM-", ""), 10))
            .filter((num) => !isNaN(num))
            .sort((a, b) => b - a)[0] || 0;

            console.log("lastTaskNoTM", lastTaskNo);

        formPayload.append("batchInsert", "true");
        formPayload.append(
          "rowData",
          JSON.stringify(
            generatedTasks.map((task, idx) => ({
              "Time Stemp": new Date().toLocaleString("en-IN", {
                timeZone: "Asia/Kolkata",
              }),
              "Task No": `TM-${String(lastTaskNo + idx + 1).padStart(3, "0")}`,
              "Serial No": selectedSerialNo,
              "Machine Name": selectedMachine,
              "Given By": selectedGivenBy,
              "Doer Name": selectedDoerName,
              "Task Type": selectedTaskType,
              "Machine Area": machineArea,
              "Part Name": partName,
              "Need Sound Test": needSoundTask,
              Temperature: temperature,
              "Enable Reminders": enableReminder ? "Yes" : "No",
              "Require Attachment": requireAttachment ? "Yes" : "No",
              "Task Start Date": `${
                task.dueDate.split(" ")[0]
              } ${startTime}:00`,
              Frequency: frequency,
              Description: description,
              Priority: selectedPriority,
            }))
          )
        );
      }

      await fetch(SCRIPT_URL, {
        method: "POST",
        body: formPayload,
        mode: "no-cors",
      });

      toast.success("✅ Task assigned successfully!");
      // Clear form state
      setSelectedSerialNo("");
      setSelectedMachine("");
      setSelectedGivenBy("");
      setSelectedDoerName("");
      setSelectedTaskType("Select Task Type");
      setStartDate("");
      setEndDate("");
      setFrequency("");
      setWorkDescription("");
      setSelectedPriority("");
      setShowTaskPreview(false);
      setStartTime("");
      setEndTime("");
      setEnableReminder(false);
      setRequireAttachment(false);
      setMachineArea("");
      setPartName("");
      setNeedSoundTask("");
      setTemperature("");
    } catch (error) {
      console.error("❌ Submission failed:", error);
      toast.error("❌ Something went wrong during submission.");
    } finally {
      setLoaderSubmit(false);
    }
  };

  

  return (
    <div className="p-2">
      <h1 className="text-2xl font-bold mb-6 text-center">Assign Task</h1>
      <div className="flex justify-center">
        <div className="bg-white rounded-lg shadow p-6 w-[90vw]">
          <form className="space-y-4" onSubmit={handleSubmitForm}>
            {/* Task Type */}
            <div className="">
              <label
                htmlFor="taskType"
                className="block text-sm font-medium text-gray-700 mb-2"
              >
                Task Type
              </label>
              <select
                id="taskType"
                onChange={(e) => setSelectedTaskType(e.target.value)}
                className="w-full rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="">Select Task Type</option>
                <option value="Maintence">Maintence</option>
                <option value="Repair">Repair</option>
              </select>
            </div>

            {selectedTaskType === "Maintence" && (
              <>
                {" "}
                <div className="flex justify-between">
                  {/* left */}
                  <div className="w-[45%] space-y-4">
                    {/* Machine Name Dropdown */}
                    <div>
                      <label
                        htmlFor="machineName"
                        className="block text-sm font-medium text-gray-700 mb-1"
                      >
                        Machine Name
                      </label>
                      <select
                        id="machineName"
                        value={selectedMachine}
                        onChange={(e) => {
                          const selected = e.target.value;
                          setSelectedMachine(selected);
                          const serials = sheetData
                            .filter((item) => item["Machine Name"] === selected)
                            .map((item) => item["Serial No"]);
                          setFilteredSerials(serials);
                        }}
                        className="w-full py-2 rounded-md border border-gray-300 shadow-sm px-4 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      >
                        <option value="">Select Machine</option>
                        {loaderMasterSheetData ? (
                          <option className="flex gap-5 items-center justify-center">
                            <Loader2Icon className="animate-spin text-red-500" />
                            <h1>Wait Please...</h1>
                          </option>
                        ) : (
                          <>
                            {[
                              ...new Set(
                                sheetData.map((item) => item["Machine Name"])
                              ),
                            ]
                              .filter(Boolean)
                              .map((machineName, index) => (
                                <option key={index} value={machineName}>
                                  {machineName}
                                </option>
                              ))}
                          </>
                        )}
                      </select>
                    </div>
                    {/* Serial No Dropdown (after selecting Machine Name) */}

                    {selectedMachine && !loaderSheetData && (
                      <div className="">
                        <label
                          htmlFor="serialNo"
                          className="block text-sm font-medium text-gray-700 mb-1"
                        >
                          Serial Number
                        </label>
                        <select
                          id="serialNo"
                          onChange={(e) => setSelectedSerialNo(e.target.value)}
                          className="py-2 w-full rounded-md border border-gray-300 shadow-sm px-4 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        >
                          <option value="">Select Serial No</option>
                          {filteredSerials.map((serial, idx) => (
                            <option key={idx} value={serial}>
                              {serial}
                            </option>
                          ))}
                        </select>
                      </div>
                    )}

                    {/* Given By */}
                    <div>
                      <label
                        htmlFor="taskType"
                        className="block text-sm font-medium text-gray-700 mb-1"
                      >
                        Given By
                      </label>
                      <select
                        id="taskType"
                        onChange={(e) => setSelectedGivenBy(e.target.value)}
                        className="py-2 w-full rounded-md border border-gray-300 shadow-sm px-4 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      >
                        <option value="">Select Given By</option>
                        {loaderMasterSheetData ? (
                          <>
                            <option className="flex gap-5 items-center justify-center">
                              <Loader2Icon className="animate-spin text-red-500" />
                              <h1>Wait Please...</h1>
                            </option>
                          </>
                        ) : (
                          giveByData.map(
                            (item, index) =>
                              item && (
                                <option key={index} value={item}>
                                  {item}
                                </option>
                              )
                          )
                        )}
                      </select>
                    </div>
                    {/* Doer's Name */}
                    <div>
                      <label
                        htmlFor="taskType"
                        className="block text-sm font-medium text-gray-700 mb-1"
                      >
                        Doer's Name
                      </label>
                      <select
                        id="taskType"
                        onChange={(e) => setSelectedDoerName(e.target.value)}
                        className="py-2 rounded-md w-full border border-gray-300 shadow-sm px-4 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      >
                        <option value="">Select Doer Name</option>
                        {loaderMasterSheetData ? (
                          <option className="flex gap-5 items-center justify-center">
                            <Loader2Icon className="animate-spin text-red-500" />
                            <h1>Wait Please...</h1>
                          </option>
                        ) : (
                          doerName.map(
                            (item, index) =>
                              item && (
                                <option key={index} value={item}>
                                  {item}
                                </option>
                              )
                          )
                        )}
                      </select>
                    </div>

                    {/* Task Temperature */}
                    <div>
                      <label
                        htmlFor="temperature"
                        className="block text-sm font-medium text-gray-700 mb-1"
                      >
                        Temperature
                      </label>
                      <select
                        id="temperature"
                        onChange={(e) => setTemperature(e.target.value)}
                        className="w-full rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      >
                        <option value="">Select Temperature</option>
                        <option value="Yes">Yes</option>
                        <option value="No">No</option>
                      </select>
                    </div>
                  </div>

                  {/* right */}
                  <div className="w-[45%] space-y-4">
                    {/* Task Status */}
                    <div>
                      <label
                        htmlFor="taskType"
                        className="block text-sm font-medium text-gray-700 mb-1"
                      >
                        Task Status
                      </label>
                      <select
                        id="taskType"
                        className="py-2 w-full rounded-md border border-gray-300 shadow-sm px-4 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      >
                        <option value="">Select Task Status</option>
                        {loaderMasterSheetData ? (
                          <option className="flex gap-5 items-center justify-center">
                            <Loader2Icon className="animate-spin text-red-500" />
                            <h1>Wait Please...</h1>
                          </option>
                        ) : (
                          taskStatusData.map(
                            (item, index) =>
                              item && (
                                <option key={index} value={item}>
                                  {item}
                                </option>
                              )
                          )
                        )}
                      </select>
                    </div>
                    {/* Machine Area */}
                    <div>
                      <label
                        htmlFor="description"
                        className="block text-sm font-medium text-gray-700 mb-1"
                      >
                        Machine Area
                      </label>
                      <input
                        id="description"
                        onChange={(e) => setMachineArea(e.target.value)}
                        value={machineArea}
                        rows={4}
                        className="py-2 w-full rounded-md border border-gray-300 shadow-sm px-4 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        placeholder="Enter task description..."
                      />
                    </div>

                    {/* Part Name */}
                    <div>
                      <label
                        htmlFor="description"
                        className="block text-sm font-medium text-gray-700 mb-1"
                      >
                        Part Name
                      </label>
                      <input
                        id="description"
                        onChange={(e) => setPartName(e.target.value)}
                        value={partName}
                        rows={4}
                        className="py-2 w-full rounded-md border border-gray-300 shadow-sm px-4 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        placeholder="Enter task description..."
                      />
                    </div>
                    {/* Task Type */}
                    <div>
                      <label
                        htmlFor="needSoundTest"
                        className="block text-sm font-medium text-gray-700 mb-1"
                      >
                        Need Sound Test
                      </label>
                      <select
                        id="needSoundTest"
                        onChange={(e) => setNeedSoundTask(e.target.value)}
                        className="w-full rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      >
                        <option value="">Select Need Sound Test</option>
                        <option value="Yes">Yes</option>
                        <option value="No">No</option>
                      </select>
                    </div>

                    {/* Priority */}
                    <div>
                      <label
                        htmlFor="priority"
                        className="block text-sm font-medium text-gray-700 mb-1"
                      >
                        Priority
                      </label>
                      <select
                        id="priority"
                        onChange={(e) => setSelectedPriority(e.target.value)}
                        className="w-full rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      >
                        <option value="">Select Priority</option>
                        {loaderMasterSheetData ? (
                          <option className="flex gap-5 items-center justify-center">
                            <Loader2Icon className="animate-spin text-red-500" />
                            <h1>Wait Please...</h1>
                          </option>
                        ) : (
                          priorityData.map(
                            (item, index) =>
                              item && (
                                <option key={index} value={item}>
                                  {item}
                                </option>
                              )
                          )
                        )}
                      </select>
                    </div>
                  </div>
                </div>
                {/*Work Description */}
                <div>
                  <label
                    htmlFor="description"
                    className="block text-sm font-medium text-gray-700 mb-1"
                  >
                    Work Description
                  </label>
                  <textarea
                    id="description"
                    onChange={(e) => setWorkDescription(e.target.value)}
                    value={description}
                    rows={4}
                    className="w-full rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="Enter task description..."
                  />
                </div>
                {/* Start Date */}
                <div className="flex space-x-10">
                  <div>
                    <label
                      htmlFor="startDate"
                      className="block text-sm font-medium text-gray-700"
                    >
                      Task Start Date
                    </label>
                    <input
                      type="date"
                      id="startDate"
                      value={startDate}
                      onChange={(e) => setStartDate(e.target.value)}
                      className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm border p-2"
                    />
                  </div>

                  {/* Task Time */}
                  <div>
                    <label
                      htmlFor="startDate"
                      className="block text-sm font-medium text-gray-700"
                    >
                      Task Time
                    </label>
                    <input
                      type="time"
                      id="startTime"
                      value={startTime}
                      onChange={(e) => setStartTime(e.target.value)}
                      className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm border p-2"
                    />
                  </div>

                  {/* Frequency */}

                  <div>
                    <label
                      htmlFor="frequency"
                      className="block text-sm font-medium text-gray-700 mb-1"
                    >
                      Frequency
                    </label>
                    <select
                      id="frequency"
                      onChange={(e) => setFrequency(e.target.value)}
                      className="w-full rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      disabled={availableFrequencies.length === 0}
                    >
                      <option value="">Select Frequency</option>
                      {availableFrequencies.map((freq, idx) => (
                        <option key={idx} value={freq.toLowerCase()}>
                          {freq}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
                {/* Preview Generated */}
                <button
                  type="button"
                  disabled={loaderWorkingDayData}
                  onClick={generateTasks}
                  className={`w-full flex items-center justify-center gap-2 mb-4 px-4 py-2 text-sm bg-blue-100 border border-blue-400 text-blue-700 rounded hover:bg-blue-200 ${
                    loaderWorkingDayData ? "opacity-50 cursor-not-allowed" : ""
                  }`}
                >
                  {loaderWorkingDayData && (
                    <LoaderIcon className="animate-spin w-4 h-4" />
                  )}
                  Preview Generated Tasks
                </button>
                {showTaskPreview && (
                  <div className="bg-blue-50 border border-blue-300 p-4 rounded-lg">
                    <div className="text-blue-800 font-semibold mb-2">
                      {generatedTasks.length} Tasks Generated (Will be stored in
                      Checklist sheet)
                    </div>
                    <div className="max-h-[300px] overflow-y-auto space-y-3">
                      {generatedTasks.slice(0, 10).map((task, idx) => (
                        <div
                          key={idx}
                          className="bg-white rounded p-3 shadow-sm border border-blue-200"
                        >
                          <div className="text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded inline-block mb-1">
                            Reminders
                          </div>
                          <div className="text-sm">{task.description}</div>
                          <div className="text-xs text-gray-600">
                            Due: {task.due} | Department: {task.department}
                          </div>
                        </div>
                      ))}
                      {generatedTasks.length > 10 && (
                        <div className="text-xs text-blue-600 italic">
                          ...and {generatedTasks.length - 10} more tasks
                        </div>
                      )}
                    </div>
                  </div>
                )}
                {/* Additional Info */}
                <div className="w-full">
                  <h1 className="text-[1.4rem] text-blue-700 mb-5">
                    Additional Option
                  </h1>
                  <div className="space-y-5">
                    <div className="flex justify-between">
                      <div>
                        <h1 className="text-[1.2rem] text-blue-600">
                          Enable Reminder
                        </h1>
                        <h1 className="text-[1rem] text-blue-500">
                          Send remiders before task due date
                        </h1>
                      </div>
                      <div
                        onClick={() => setEnableReminder((prev) => !prev)}
                        className={`w-11 h-6 rounded-full relative cursor-pointer transition-colors ${
                          enableReminder ? "bg-blue-600" : "bg-gray-200"
                        }`}
                      >
                        <div
                          className={`absolute top-1 left-1 w-4 h-4 bg-white rounded-full transition-transform ${
                            enableReminder ? "translate-x-5" : "translate-x-0"
                          }`}
                        ></div>
                      </div>
                    </div>

                    <div className="flex justify-between">
                      <div>
                        <h1 className="text-[1.2rem] text-blue-600">
                          Require Attachment
                        </h1>
                        <h1 className="text-[1rem] text-blue-500">
                          User must upload a file when completing task
                        </h1>
                      </div>
                      <div
                        onClick={() => setRequireAttachment((prev) => !prev)}
                        className={`w-11 h-6 rounded-full relative cursor-pointer transition-colors ${
                          requireAttachment ? "bg-blue-600" : "bg-gray-200"
                        }`}
                      >
                        <div
                          className={`absolute top-1 left-1 w-4 h-4 bg-white rounded-full transition-transform ${
                            requireAttachment
                              ? "translate-x-5"
                              : "translate-x-0"
                          }`}
                        ></div>
                      </div>
                    </div>
                  </div>
                </div>
                {/* submit button */}
                <div className="pt-4">
                  <button
                    type="submit"
                    disabled={loaderSubmit}
                    className={`w-full flex items-center justify-center gap-2 bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 ${
                      loaderSubmit ? "opacity-50 cursor-not-allowed" : ""
                    }`}
                  >
                    {loaderSubmit && (
                      <LoaderIcon className="animate-spin w-4 h-4" />
                    )}
                    {loaderSubmit ? "Assigning..." : "Assign Task"}
                  </button>
                </div>
              </>
            )}

            {selectedTaskType === "Repair" && (
              <>
                {" "}
                <div className="flex justify-between">
                  {/* left */}
                  <div className="w-[45%] space-y-4">
                    {/* Machine Name Dropdown */}
                    <div>
                      <label
                        htmlFor="machineName"
                        className="block text-sm font-medium text-gray-700 mb-1"
                      >
                        Machine Name
                      </label>
                      <select
                        id="machineName"
                        value={selectedMachine}
                        onChange={(e) => {
                          const selected = e.target.value;
                          setSelectedMachine(selected);
                          const serials = sheetData
                            .filter((item) => item["Machine Name"] === selected)
                            .map((item) => item["Serial No"]);
                          setFilteredSerials(serials);
                        }}
                        className="w-full rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      >
                        <option value="">Select Machine</option>
                        {loaderMasterSheetData ? (
                          <option className="flex gap-5 items-center justify-center">
                            <Loader2Icon className="animate-spin text-red-500" />
                            <h1>Wait Please...</h1>
                          </option>
                        ) : (
                          <>
                            {[
                              ...new Set(
                                sheetData.map((item) => item["Machine Name"])
                              ),
                            ]
                              .filter(Boolean)
                              .map((machineName, index) => (
                                <option key={index} value={machineName}>
                                  {machineName}
                                </option>
                              ))}
                          </>
                        )}
                      </select>
                    </div>
                    {/* Serial No Dropdown (after selecting Machine Name) */}
                    {selectedMachine && !loaderSheetData && (
                      <div className="mt-4">
                        <label
                          htmlFor="serialNo"
                          className="block text-sm font-medium text-gray-700 mb-1"
                        >
                          Serial Number
                        </label>
                        <select
                          id="serialNo"
                          onChange={(e) => setSelectedSerialNo(e.target.value)}
                          className="w-full rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        >
                          <option value="">Select Serial No</option>
                          {filteredSerials.map((serial, idx) => (
                            <option key={idx} value={serial}>
                              {serial}
                            </option>
                          ))}
                        </select>
                      </div>
                    )}
                    {/* Given By */}
                    <div>
                      <label
                        htmlFor="taskType"
                        className="block text-sm font-medium text-gray-700 mb-1"
                      >
                        Given By
                      </label>
                      <select
                        id="taskType"
                        onChange={(e) => setSelectedGivenBy(e.target.value)}
                        className="w-full rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      >
                        <option value="">Select Given By</option>
                        {loaderMasterSheetData ? (
                          <>
                            <option className="flex gap-5 items-center justify-center">
                              <Loader2Icon className="animate-spin text-red-500" />
                              <h1>Wait Please...</h1>
                            </option>
                          </>
                        ) : (
                          giveByData.map(
                            (item, index) =>
                              item && (
                                <option key={index} value={item}>
                                  {item}
                                </option>
                              )
                          )
                        )}
                      </select>
                    </div>
                  </div>

                  {/* right */}
                  <div className="w-[45%] space-y-4">
                    {/* Doer's Name */}
                    <div>
                      <label
                        htmlFor="taskType"
                        className="block text-sm font-medium text-gray-700 mb-1"
                      >
                        Doer's Name
                      </label>
                      <select
                        id="taskType"
                        onChange={(e) => setSelectedDoerName(e.target.value)}
                        className="w-full rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      >
                        <option value="">Select Doer Name</option>
                        {loaderMasterSheetData ? (
                          <option className="flex gap-5 items-center justify-center">
                            <Loader2Icon className="animate-spin text-red-500" />
                            <h1>Wait Please...</h1>
                          </option>
                        ) : (
                          doerName.map(
                            (item, index) =>
                              item && (
                                <option key={index} value={item}>
                                  {item}
                                </option>
                              )
                          )
                        )}
                      </select>
                    </div>

                    {/* Task Status */}
                    <div>
                      <label
                        htmlFor="taskType"
                        className="block text-sm font-medium text-gray-700 mb-1"
                      >
                        Task Status
                      </label>
                      <select
                        id="taskType"
                        className="w-full rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      >
                        <option value="">Select Task Status</option>
                        {loaderMasterSheetData ? (
                          <option className="flex gap-5 items-center justify-center">
                            <Loader2Icon className="animate-spin text-red-500" />
                            <h1>Wait Please...</h1>
                          </option>
                        ) : (
                          taskStatusData.map(
                            (item, index) =>
                              item && (
                                <option key={index} value={item}>
                                  {item}
                                </option>
                              )
                          )
                        )}
                      </select>
                    </div>

                    {/* Priority */}
                    <div>
                      <label
                        htmlFor="priority"
                        className="block text-sm font-medium text-gray-700 mb-1"
                      >
                        Priority
                      </label>
                      <select
                        id="priority"
                        onChange={(e) => setSelectedPriority(e.target.value)}
                        className="w-full rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      >
                        <option value="">Select Priority</option>
                        {loaderMasterSheetData ? (
                          <option className="flex gap-5 items-center justify-center">
                            <Loader2Icon className="animate-spin text-red-500" />
                            <h1>Wait Please...</h1>
                          </option>
                        ) : (
                          priorityData.map(
                            (item, index) =>
                              item && (
                                <option key={index} value={item}>
                                  {item}
                                </option>
                              )
                          )
                        )}
                      </select>
                    </div>
                  </div>
                </div>
                {/* Description */}
                <div>
                  <label
                    htmlFor="description"
                    className="block text-sm font-medium text-gray-700 mb-1"
                  >
                    Description
                  </label>
                  <textarea
                    id="description"
                    onChange={(e) => setWorkDescription(e.target.value)}
                    value={description}
                    rows={4}
                    className="w-full rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="Enter task description..."
                  />
                </div>
                {/* Start Date */}
                <div className="flex space-x-10">
                  <div>
                    <label
                      htmlFor="startDate"
                      className="block text-sm font-medium text-gray-700"
                    >
                      Task Start Date
                    </label>
                    <input
                      type="date"
                      id="startDate"
                      value={startDate}
                      onChange={(e) => setStartDate(e.target.value)}
                      className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm border p-2"
                    />
                  </div>

                  {/* Task Time */}
                  <div>
                    <label
                      htmlFor="startDate"
                      className="block text-sm font-medium text-gray-700"
                    >
                      Task Start Time
                    </label>
                    <input
                      type="time"
                      id="startTime"
                      value={startTime}
                      onChange={(e) => setStartTime(e.target.value)}
                      className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm border p-2"
                    />
                  </div>

                  <div>
                    <label
                      htmlFor="frequency"
                      className="block text-sm font-medium text-gray-700 mb-1"
                    >
                      Task End Date
                    </label>
                    <input
                      type="date"
                      id="startDate"
                      value={endTaskDate}
                      onChange={(e) => setEndTaskDate(e.target.value)}
                      className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm border p-2"
                    />
                  </div>

                  {/* Task Time */}
                  <div>
                    <label
                      htmlFor="startDate"
                      className="block text-sm font-medium text-gray-700"
                    >
                      Task End Time
                    </label>
                    <input
                      type="time"
                      id="startTime"
                      value={endTime}
                      onChange={(e) => setEndTime(e.target.value)}
                      className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm border p-2"
                    />
                  </div>
                </div>
                {/* Preview Generated
                <button
                  type="button"
                  disabled={loaderWorkingDayData}
                  onClick={generateTasks}
                  className={`w-full flex items-center justify-center gap-2 mb-4 px-4 py-2 text-sm bg-blue-100 border border-blue-400 text-blue-700 rounded hover:bg-blue-200 ${
                    loaderWorkingDayData ? "opacity-50 cursor-not-allowed" : ""
                  }`}
                >
                  {loaderWorkingDayData && (
                    <LoaderIcon className="animate-spin w-4 h-4" />
                  )}
                  Preview Generated Tasks
                </button>
                {showTaskPreview && (
                  <div className="bg-blue-50 border border-blue-300 p-4 rounded-lg">
                    <div className="text-blue-800 font-semibold mb-2">
                      {generatedTasks.length} Tasks Generated (Will be stored in
                      Checklist sheet)
                    </div>
                    <div className="max-h-[300px] overflow-y-auto space-y-3">
                      {generatedTasks.slice(0, 10).map((task, idx) => (
                        <div
                          key={idx}
                          className="bg-white rounded p-3 shadow-sm border border-blue-200"
                        >
                          <div className="text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded inline-block mb-1">
                            Reminders
                          </div>
                          <div className="text-sm">{task.description}</div>
                          <div className="text-xs text-gray-600">
                            Due: {task.due} | Department: {task.department}
                          </div>
                        </div>
                      ))}
                      {generatedTasks.length > 10 && (
                        <div className="text-xs text-blue-600 italic">
                          ...and {generatedTasks.length - 10} more tasks
                        </div>
                      )}
                    </div>
                  </div>
                )} */}
                {/* Additional Information */}
                <div className="w-full">
                  <h1 className="text-[1.4rem] text-blue-700 mb-5">
                    Additional Option
                  </h1>
                  <div className="space-y-5">
                    <div className="flex justify-between">
                      <div>
                        <h1 className="text-[1.2rem] text-blue-600">
                          Enable Reminder
                        </h1>
                        <h1 className="text-[1rem] text-blue-500">
                          Send remiders before task due date
                        </h1>
                      </div>
                      <div
                        onClick={() => setEnableReminder((prev) => !prev)}
                        className={`w-11 h-6 rounded-full relative cursor-pointer transition-colors ${
                          enableReminder ? "bg-blue-600" : "bg-gray-200"
                        }`}
                      >
                        <div
                          className={`absolute top-1 left-1 w-4 h-4 bg-white rounded-full transition-transform ${
                            enableReminder ? "translate-x-5" : "translate-x-0"
                          }`}
                        ></div>
                      </div>
                    </div>

                    <div className="flex justify-between">
                      <div>
                        <h1 className="text-[1.2rem] text-blue-600">
                          Require Attachment
                        </h1>
                        <h1 className="text-[1rem] text-blue-500">
                          User must upload a file when completing task
                        </h1>
                      </div>
                      <div
                        onClick={() => setRequireAttachment((prev) => !prev)}
                        className={`w-11 h-6 rounded-full relative cursor-pointer transition-colors ${
                          requireAttachment ? "bg-blue-600" : "bg-gray-200"
                        }`}
                      >
                        <div
                          className={`absolute top-1 left-1 w-4 h-4 bg-white rounded-full transition-transform ${
                            requireAttachment
                              ? "translate-x-5"
                              : "translate-x-0"
                          }`}
                        ></div>
                      </div>
                    </div>
                  </div>
                </div>
                {/* submit button */}
                <div className="pt-4">
                  <button
                    type="submit"
                    disabled={loaderSubmit}
                    className={`w-full flex items-center justify-center gap-2 bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 ${
                      loaderSubmit ? "opacity-50 cursor-not-allowed" : ""
                    }`}
                  >
                    {loaderSubmit && (
                      <LoaderIcon className="animate-spin w-4 h-4" />
                    )}
                    {loaderSubmit ? "Assigning..." : "Assign Task"}
                  </button>
                </div>
              </>
            )}
          </form>
        </div>
      </div>
    </div>
  );
}

export default AssignTask;
