import React, { useState, useEffect } from 'react';
import { ChevronDown, Upload } from 'lucide-react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { fetchAllMachines, createMaintenanceRecord, createRepairRecord, getNextTaskNumber } from '../services/machineService';
import { fetchUsers, User } from '../services/userService';
import { toast } from 'react-hot-toast';

export default function TaskAssignmentForm() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const machineIdParam = searchParams.get('machineId');
  const taskTypeParam = searchParams.get('taskType');

  const [machines, setMachines] = useState<any[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(false);
  const [previewTasks, setPreviewTasks] = useState<any[]>([]);
  const [showPreview, setShowPreview] = useState(false);

  // Combined Form Data
  const [formData, setFormData] = useState({
    // Common
    taskType: taskTypeParam || '',
    machineId: machineIdParam || '',
    priority: '',
    givenBy: '', // New field

    // Maintenance Specific
    doerName: '', // Replaces ownerName for consistency
    temperature: '',
    workDescription: '',
    taskStartDate: '',
    taskEndDate: '',
    frequency: '',
    taskStatus: 'scheduled',
    machineArea: '',
    partName: '',
    nextSuggTest: '',
    enableReminder: false,
    requireAttachment: false,

    // Repair Specific
    machineSerialNo: '',
    department: '',
    machinePartName: '',
    problem: '',
    expectedDeliveryDays: '',
    location: '',
    image: null as File | null,
  });

  const departmentOptions = [
    "Rolling Mill", "Furnace", "Slag Crusher", "CCM"
  ];

  const machinePartOptions = [
    "Hydraulic Bearing", "Conveyor Belt", "Spindle Motor", "Tool Turret",
    "Coolant System", "Control Panel", "Gear Box", "Pneumatic Cylinder",
    "Sensors Array", "Drive Shaft", "Electrical Wiring", "Lubrication System"
  ];

  const locationOptions = [
    "Shop Floor A - Bay 3", "Assembly Line 2", "CNC Section - Bay 5",
    "Lathe Section", "Milling Area - Station 3", "Packaging Line 1",
    "Quality Lab", "Maintenance Bay", "Storage Area", "Testing Zone"
  ];

  useEffect(() => {
    const loadData = async () => {
      try {
        const [machinesData, usersData] = await Promise.all([
          fetchAllMachines(),
          fetchUsers()
        ]);
        setMachines(machinesData);
        setUsers(usersData);

        // If machineId is in URL, ensure it's selected and populate serial number
        if (machineIdParam) {
          const selectedMachine = machinesData.find((m: any) => m.id.toString() === machineIdParam);
          setFormData(prev => ({
            ...prev,
            machineId: machineIdParam,
            machineSerialNo: selectedMachine?.serial_number || ''
          }));
        }
      } catch (error) {
        console.error('Error loading data:', error);
        toast.error('Failed to load data');
      }
    };

    loadData();
  }, [machineIdParam]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value, type } = e.target;
    const checked = (e.target as HTMLInputElement).checked;

    // Validation: Given By and Doer Name cannot be the same
    if ((name === 'givenBy' && value === formData.doerName && value !== '') ||
      (name === 'doerName' && value === formData.givenBy && value !== '')) {
      toast.error("Given By and Doer's Name cannot be the same");
      return;
    }

    setFormData(prev => {
      const newData = {
        ...prev,
        [name]: type === 'checkbox' ? checked : value
      };

      // If machineId changes, update serial number
      if (name === 'machineId') {
        const selectedMachine = machines.find(m => m.id.toString() === value);
        newData.machineSerialNo = selectedMachine?.serial_number || '';
      }

      // Auto-calculate End Date based on frequency
      if ((name === 'frequency' || name === 'taskStartDate') && newData.taskStartDate) {
        // Parse as local time to avoid UTC shifting
        const start = new Date(newData.taskStartDate + 'T00:00:00');
        const endDate = new Date(start);

        switch (newData.frequency) {
          case 'daily':
            // Generate 365 Tasks ( 1 year )
            endDate.setDate(start.getDate() + 364);
            newData.taskEndDate = formatDateYYYYMMDD(endDate);
            break;
          case 'weekly':
            // Every week for 1 year
            endDate.setFullYear(start.getFullYear() + 1);
            endDate.setDate(endDate.getDate() - 1);
            newData.taskEndDate = formatDateYYYYMMDD(endDate);
            break;
          case 'monthly':
            // 1 task every month for 12 months
            endDate.setFullYear(start.getFullYear() + 1);
            endDate.setDate(endDate.getDate() - 1);
            newData.taskEndDate = formatDateYYYYMMDD(endDate);
            break;
          case 'quarterly':
            // 1 task every 3 months for 1 year
            endDate.setFullYear(start.getFullYear() + 1);
            endDate.setDate(endDate.getDate() - 1);
            newData.taskEndDate = formatDateYYYYMMDD(endDate);
            break;
          case '15days':
            // 15 tasks from starting date (continuous daily)
            endDate.setDate(start.getDate() + 14);
            newData.taskEndDate = formatDateYYYYMMDD(endDate);
            break;
          case '20days':
            // 20 tasks from starting date (continuous daily)
            endDate.setDate(start.getDate() + 19);
            newData.taskEndDate = formatDateYYYYMMDD(endDate);
            break;
          case '2months':
            // 1 task skipping every 2 month for 1 year
            endDate.setFullYear(start.getFullYear() + 1);
            endDate.setDate(endDate.getDate() - 1);
            newData.taskEndDate = formatDateYYYYMMDD(endDate);
            break;
          case 'yearly':
            // 1 task for a year
            endDate.setFullYear(start.getFullYear() + 1);
            endDate.setDate(endDate.getDate() - 1);
            newData.taskEndDate = formatDateYYYYMMDD(endDate);
            break;
          default:
            // For single tasks or custom, keep existing behavior or do nothing
            break;
        }
      }

      return newData;
    });
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setFormData(prev => ({ ...prev, image: file }));
    }
  };

  const formatDateDDMMYYYY = (date: Date) => {
    const day = date.getDate().toString().padStart(2, '0');
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const year = date.getFullYear();
    return `${day}/${month}/${year}`;
  };

  const formatDateYYYYMMDD = (date: Date) => {
    const year = date.getFullYear();
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const day = date.getDate().toString().padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.machineId) {
      toast.error('Please select a machine');
      return;
    }

    setLoading(true);
    try {
      if (formData.taskType === 'maintenance') {
        const selectedMachine = machines.find(m => m.id.toString() === formData.machineId);
        const machineDepartment = selectedMachine?.department || 'Maintenance';

        // Fetch next task number from DB to ensure uniqueness
        const startSerialNo = await getNextTaskNumber(selectedMachine?.name || '');

        const createChecklistItem = (dateStr?: string, uniqueIdSuffix = 0, serialIndex = 1) => {
          const machineInitials = selectedMachine?.name
            ? selectedMachine.name.split(' ').map((n: string) => n[0]).join('').toUpperCase()
            : 'M';

          const serialNo = serialIndex.toString().padStart(3, '0');

          return {
            id: Date.now() + uniqueIdSuffix,
            taskNo: `${machineInitials}-${serialNo}`,
            department: machineDepartment,
            description: dateStr
              ? `${formData.workDescription || formData.partName || 'Maintenance'} - ${dateStr}`
              : (formData.workDescription || formData.partName || 'Maintenance Task'),
            taskStatus: 'pending',
            remarks: '',
            soundOfMachine: '',
            temperature: '',
            maintenanceCost: '',
            image: null,
            taskDate: dateStr
              ? dateStr.split('/').reverse().join('-')
              : (formData.taskStartDate || new Date().toISOString().split('T')[0])
          };
        };

        if (formData.frequency && formData.taskStartDate && formData.taskEndDate) {
          const generateTaskDates = (startStr: string, frequency: string): Date[] => {
            const start = new Date(startStr + 'T00:00:00');
            const dates: Date[] = [];

            if (frequency === 'daily') {
              for (let i = 0; i < 365; i++) {
                const date = new Date(start);
                date.setDate(start.getDate() + i);
                dates.push(date);
              }
            } else if (frequency === 'weekly') {
              const limitDate = new Date(start);
              limitDate.setFullYear(start.getFullYear() + 1);
              let current = new Date(start);
              while (current < limitDate) {
                dates.push(new Date(current));
                current.setDate(current.getDate() + 7);
              }
            } else if (frequency === 'monthly') {
              for (let i = 0; i < 12; i++) {
                const date = new Date(start);
                date.setMonth(start.getMonth() + i);
                dates.push(date);
              }
            } else if (frequency === 'quarterly') {
              // 4 tasks over a year (0, 3, 6, 9 months)
              for (let i = 0; i < 4; i++) {
                const date = new Date(start);
                date.setMonth(start.getMonth() + (i * 3));
                dates.push(date);
              }
            } else if (frequency === '15days') {
              for (let i = 0; i < 15; i++) {
                const date = new Date(start);
                date.setDate(start.getDate() + i);
                dates.push(date);
              }
            } else if (frequency === '20days') {
              for (let i = 0; i < 20; i++) {
                const date = new Date(start);
                date.setDate(start.getDate() + i);
                dates.push(date);
              }
            } else if (frequency === '2months') {
              // Every 2 months for 1 year (approx 6 tasks)
              for (let i = 0; i < 6; i++) {
                const date = new Date(start);
                date.setMonth(start.getMonth() + (i * 2));
                dates.push(date);
              }
            } else if (frequency === 'yearly') {
              // 1 task for the year
              dates.push(new Date(start));
            } else {
              // Fallback or just the single date
              dates.push(new Date(start));
            }
            return dates;
          };

          const dates = generateTaskDates(formData.taskStartDate, formData.frequency);
          const checklist = dates.map((date, index) => {
            return createChecklistItem(formatDateDDMMYYYY(date), index, startSerialNo + index);
          });

          const start = new Date(formData.taskStartDate);
          const end = new Date(formData.taskEndDate);

          // Create ONE maintenance record with the generated checklist
          const maintenanceData = {
            machine_id: parseInt(formData.machineId),
            task_title: `${formData.partName || formData.workDescription || 'Maintenance Task'} (${formData.frequency.charAt(0).toUpperCase() + formData.frequency.slice(1)}: ${formatDateDDMMYYYY(start)} - ${formatDateDDMMYYYY(end)})`,
            priority: formData.priority,
            due_date: formData.taskEndDate ? formData.taskEndDate : formatDateYYYYMMDD(new Date()),
            start_date: formData.taskStartDate,
            end_date: formData.taskEndDate,
            status: 'scheduled',
            assigned_to: formData.doerName,
            given_by: formData.givenBy,
            description: formData.workDescription,
            frequency: formData.frequency,
            is_temperature_sensitive: formData.temperature === 'yes',
            enable_reminder: formData.enableReminder,
            require_attachment: formData.requireAttachment,
            checklist: checklist,
            serial_number: formData.machineSerialNo
          };

          // @ts-ignore
          const result = await createMaintenanceRecord(maintenanceData);

          if (result) {
            toast.success(`${formData.frequency.charAt(0).toUpperCase() + formData.frequency.slice(1)} maintenance task assigned successfully!`);
            navigate('/tasks');
          } else {
            toast.error('Failed to assign task');
          }

        } else {
          // Single task assignment (No frequency or no end date)
          const maintenanceData = {
            machine_id: parseInt(formData.machineId),
            task_title: formData.partName || formData.workDescription || 'Maintenance Task',
            priority: formData.priority,
            due_date: formData.taskEndDate || formData.taskStartDate || formatDateYYYYMMDD(new Date()),
            start_date: formData.taskStartDate || formatDateYYYYMMDD(new Date()),
            end_date: formData.taskEndDate || formData.taskStartDate || formatDateYYYYMMDD(new Date()),
            status: 'scheduled',
            assigned_to: formData.doerName,
            given_by: formData.givenBy,
            description: formData.workDescription,
            frequency: formData.frequency,
            is_temperature_sensitive: formData.temperature === 'yes',
            enable_reminder: formData.enableReminder,
            require_attachment: formData.requireAttachment,
            checklist: [createChecklistItem(undefined, 0, startSerialNo)],
            serial_number: formData.machineSerialNo
          };

          // @ts-ignore
          const result = await createMaintenanceRecord(maintenanceData);

          if (result) {
            toast.success('Maintenance task assigned successfully!');
            navigate('/tasks');
          } else {
            toast.error('Failed to assign task');
          }
        }
      } else if (formData.taskType === 'repair') {
        const repairData = {
          machine_id: parseInt(formData.machineId),
          machine_serial_no: formData.machineSerialNo,
          doer_name: formData.doerName,
          given_by: formData.givenBy,
          department: formData.department,
          machine_part_name: formData.machinePartName,
          problem_description: formData.problem,
          priority: formData.priority,
          expected_delivery_days: parseInt(formData.expectedDeliveryDays) || 0,
          location: formData.location,
          status: 'pending'
        };

        // @ts-ignore
        const result = await createRepairRecord(repairData, formData.image || undefined);

        if (result) {
          toast.success('Repair request submitted successfully!');
          navigate('/tasks');
        } else {
          toast.error('Failed to submit repair request');
        }
      }
    } catch (error) {
      console.error('Error assigning task:', error);
      toast.error('An error occurred while assigning the task');
    } finally {
      setLoading(false);
    }
  };

  // Auto-generate preview when frequency or start date changes
  useEffect(() => {
    const generatePreview = async () => {
      // Basic validation checks
      if (!formData.machineId || !formData.frequency || !formData.taskStartDate) {
        setPreviewTasks([]);
        setShowPreview(false);
        return;
      }

      if (formData.taskType !== 'maintenance') return;

      try {
        const selectedMachine = machines.find((m: any) => m.id.toString() === formData.machineId);
        const machineDepartment = selectedMachine?.department || 'Maintenance';

        // Fetch next task number from DB
        const startSerialNo = await getNextTaskNumber(selectedMachine?.name || '');

        const createChecklistItem = (dateStr?: string, uniqueIdSuffix = 0, serialIndex = 1) => {
          const machineInitials = selectedMachine?.name
            ? selectedMachine.name.split(' ').map((n: string) => n[0]).join('').toUpperCase()
            : 'M';

          const serialNo = serialIndex.toString().padStart(3, '0');

          return {
            id: Date.now() + uniqueIdSuffix,
            taskNo: `${machineInitials}-${serialNo}`,
            department: machineDepartment,
            description: formData.workDescription || formData.partName || 'Maintenance Task',
            taskStatus: 'pending',
            startDate: dateStr || formatDateDDMMYYYY(new Date(formData.taskStartDate)),
            endDate: dateStr || formatDateDDMMYYYY(new Date(formData.taskStartDate)),
            requireAttachment: formData.requireAttachment ? 'Yes' : 'No',
            enableReminder: formData.enableReminder ? 'Yes' : 'No',
            remarks: '',
            soundOfMachine: '',
            temperature: '',
            maintenanceCost: '',
            image: null,
            taskDate: dateStr
              ? dateStr.split('/').reverse().join('-')
              : (formData.taskStartDate || new Date().toISOString().split('T')[0])
          };
        };

        const checklist = [];

        const generateTaskDates = (startStr: string, frequency: string): Date[] => {
          const start = new Date(startStr + 'T00:00:00');
          const dates: Date[] = [];

          if (frequency === 'daily') {
            for (let i = 0; i < 365; i++) {
              const date = new Date(start);
              date.setDate(start.getDate() + i);
              dates.push(date);
            }
          } else if (frequency === 'weekly') {
            const limitDate = new Date(start);
            limitDate.setFullYear(start.getFullYear() + 1);
            let current = new Date(start);
            while (current < limitDate) {
              dates.push(new Date(current));
              current.setDate(current.getDate() + 7);
            }
          } else if (frequency === 'monthly') {
            for (let i = 0; i < 12; i++) {
              const date = new Date(start);
              date.setMonth(start.getMonth() + i);
              dates.push(date);
            }
          } else if (frequency === 'quarterly') {
            for (let i = 0; i < 4; i++) {
              const date = new Date(start);
              date.setMonth(start.getMonth() + (i * 3));
              dates.push(date);
            }
          } else if (frequency === '15days') {
            for (let i = 0; i < 15; i++) {
              const date = new Date(start);
              date.setDate(start.getDate() + i);
              dates.push(date);
            }
          } else if (frequency === '20days') {
            for (let i = 0; i < 20; i++) {
              const date = new Date(start);
              date.setDate(start.getDate() + i);
              dates.push(date);
            }
          } else if (frequency === '2months') {
            for (let i = 0; i < 6; i++) {
              const date = new Date(start);
              date.setMonth(start.getMonth() + (i * 2));
              dates.push(date);
            }
          } else if (frequency === 'yearly') {
            dates.push(new Date(start));
          } else {
            dates.push(new Date(start));
          }
          return dates;
        };

        if (formData.frequency && formData.taskStartDate) {
          const dates = generateTaskDates(formData.taskStartDate, formData.frequency);
          // Sort dates in ascending order
          dates.sort((a, b) => a.getTime() - b.getTime());

          const checklistItems = dates.map((date, index) => {
            return createChecklistItem(formatDateDDMMYYYY(date), index, startSerialNo + index);
          });
          setPreviewTasks(checklistItems);
        } else {
          // Single task assignment
          checklist.push(createChecklistItem(undefined, 0, startSerialNo));
          setPreviewTasks(checklist);
        }
        setShowPreview(true);
      } catch (error) {
        console.error('Error generating preview:', error);
      }
    };

    const timer = setTimeout(() => {
      generatePreview();
    }, 500);

    return () => clearTimeout(timer);
  }, [
    formData.machineId,
    formData.taskType,
    formData.frequency,
    formData.taskStartDate,
    formData.partName,
    formData.workDescription,
    formData.requireAttachment,
    formData.enableReminder
  ]);

  const adminUsers = users.filter(u => u.pageAccess === 'Admin');

  return (
    <div className="max-w-4xl mx-auto">
      <div className="bg-white rounded-lg shadow-sm">
        <form onSubmit={handleSubmit} className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Task Type */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Task Type
              </label>
              <div className="relative">
                <select
                  name="taskType"
                  value={formData.taskType}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded appearance-none bg-white focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                  required
                >
                  <option value="">Select Type</option>
                  <option value="maintenance">Maintenance</option>
                  <option value="repair">Repair</option>
                </select>
                <ChevronDown className="absolute right-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
              </div>
            </div>

            {/* Machine Name - Common */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Machine Name
              </label>
              <div className="relative">
                <select
                  name="machineId"
                  value={formData.machineId}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded appearance-none bg-white focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                  required
                >
                  <option value="">Select Machine</option>
                  {machines.map(machine => (
                    <option key={machine.id} value={machine.id}>
                      {machine.name}
                    </option>
                  ))}
                </select>
                <ChevronDown className="absolute right-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
              </div>
            </div>
          </div>

          {/* Conditional Rendering based on Task Type */}

          {/* MAINTENANCE FORM FIELDS */}
          {formData.taskType === 'maintenance' && (
            <div className="mt-6 space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Machine Serial No (Read Only) */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Machine Serial No
                  </label>
                  <input
                    type="text"
                    name="machineSerialNo"
                    value={formData.machineSerialNo}
                    readOnly
                    className="w-full px-3 py-2 border border-gray-300 rounded bg-gray-100 focus:outline-none"
                  />
                </div>

                {/* Part Name / Title */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Task Title / Part Name
                  </label>
                  <input
                    type="text"
                    name="partName"
                    value={formData.partName}
                    onChange={handleChange}
                    placeholder="Enter task title..."
                    className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                    required
                  />
                </div>

                {/* Given By */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Given By
                  </label>
                  <div className="relative">
                    <select
                      name="givenBy"
                      value={formData.givenBy}
                      onChange={handleChange}
                      required
                      className="w-full px-3 py-2 border border-gray-300 rounded appearance-none bg-white focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                    >
                      <option value="">Select Admin</option>
                      {adminUsers.map(user => (
                        <option key={user.id} value={user.employeeName}>{user.employeeName}</option>
                      ))}
                    </select>
                    <ChevronDown className="absolute right-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
                  </div>
                </div>

                {/* Doer Name */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Doer's Name
                  </label>
                  <div className="relative">
                    <select
                      name="doerName"
                      value={formData.doerName}
                      onChange={handleChange}
                      required
                      className="w-full px-3 py-2 border border-gray-300 rounded appearance-none bg-white focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                    >
                      <option value="">Select Doer</option>
                      {users.map(user => (
                        <option key={user.id} value={user.employeeName}>{user.employeeName}</option>
                      ))}
                    </select>
                    <ChevronDown className="absolute right-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
                  </div>
                </div>

                {/* Temperature */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Temperature Sensitive?
                  </label>
                  <div className="relative">
                    <select
                      name="temperature"
                      value={formData.temperature}
                      onChange={handleChange}
                      required
                      className="w-full px-3 py-2 border border-gray-300 rounded appearance-none bg-white focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                    >
                      <option value="">Select Option</option>
                      <option value="yes">Yes</option>
                      <option value="no">No</option>
                    </select>
                    <ChevronDown className="absolute right-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
                  </div>
                </div>

                {/* Priority */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Priority
                  </label>
                  <div className="relative">
                    <select
                      name="priority"
                      value={formData.priority}
                      onChange={handleChange}
                      required
                      className="w-full px-3 py-2 border border-gray-300 rounded appearance-none bg-white focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                    >
                      <option value="">Select Priority</option>
                      <option value="low">Low</option>
                      <option value="medium">Medium</option>
                      <option value="high">High</option>
                      <option value="critical">Critical</option>
                    </select>
                    <ChevronDown className="absolute right-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
                  </div>
                </div>
              </div>

              {/* Work Description */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Work Description
                </label>
                <textarea
                  name="workDescription"
                  value={formData.workDescription}
                  onChange={handleChange}
                  required
                  rows={4}
                  placeholder="Enter detailed description..."
                  className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent resize-none"
                />
              </div>

              {/* Task Start Date, Task Time, Frequency */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Task Start Date
                  </label>
                  <input
                    type="date"
                    name="taskStartDate"
                    value={formData.taskStartDate}
                    onChange={handleChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Frequency
                  </label>
                  <div className="relative">
                    <select
                      name="frequency"
                      value={formData.frequency}
                      onChange={handleChange}
                      required
                      className="w-full px-3 py-2 border border-gray-300 rounded appearance-none bg-white focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                    >
                      <option value="">Select Frequency</option>
                      <option value="daily">Daily</option>
                      <option value="weekly">Weekly</option>
                      <option value="15days">15 Days</option>
                      <option value="20days">20 Days</option>
                      <option value="monthly">Monthly</option>
                      <option value="2months">2 Months</option>
                      <option value="quarterly">3 Months (Quarterly)</option>
                      <option value="yearly">Yearly (1/Year)</option>
                    </select>
                    <ChevronDown className="absolute right-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
                  </div>
                </div>
                {!['daily', 'weekly', 'monthly', 'quarterly', '15days', '20days', '2months', 'yearly'].includes(formData.frequency) && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Task End Date
                    </label>
                    <input
                      type="date"
                      name="taskEndDate"
                      value={formData.taskEndDate}
                      onChange={handleChange}
                      required
                      min={formData.taskStartDate}
                      className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                    />
                  </div>
                )}
              </div>

              {/* Additional Options */}
              <div className="space-y-4">
                <h3 className="text-base font-medium text-gray-700">Additional Option</h3>

                <div className="flex items-center justify-between py-2 border-b border-gray-200">
                  <div>
                    <div className="font-medium text-gray-700">Enable Reminder</div>
                    <div className="text-sm text-primary">Send reminder before task due date</div>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      name="enableReminder"
                      checked={formData.enableReminder}
                      onChange={handleChange}
                      className="sr-only peer"
                    />
                    <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary/30 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary"></div>
                  </label>
                </div>

                <div className="flex items-center justify-between py-2">
                  <div>
                    <div className="font-medium text-gray-700">Require Attachment</div>
                    <div className="text-sm text-primary">User must upload a file when completing task</div>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      name="requireAttachment"
                      checked={formData.requireAttachment}
                      onChange={handleChange}
                      className="sr-only peer"
                    />
                    <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary/30 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary"></div>
                  </label>
                </div>
              </div>
            </div>
          )}

          {/* REPAIR FORM FIELDS */}
          {formData.taskType === 'repair' && (
            <div className="mt-6 space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

                {/* Machine Serial No (Read Only or Auto-filled) */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Machine Serial No
                  </label>
                  <input
                    type="text"
                    name="machineSerialNo"
                    value={formData.machineSerialNo}
                    readOnly
                    className="w-full px-3 py-2 border border-gray-300 rounded bg-gray-100 focus:outline-none"
                  />
                </div>

                {/* Given By */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Given By
                  </label>
                  <div className="relative">
                    <select
                      name="givenBy"
                      value={formData.givenBy}
                      onChange={handleChange}
                      required
                      className="w-full px-3 py-2 border border-gray-300 rounded appearance-none bg-white focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                    >
                      <option value="">Select Admin</option>
                      {adminUsers.map(user => (
                        <option key={user.id} value={user.employeeName}>{user.employeeName}</option>
                      ))}
                    </select>
                    <ChevronDown className="absolute right-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
                  </div>
                </div>

                {/* Doer Name */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Doer's Name
                  </label>
                  <div className="relative">
                    <select
                      name="doerName"
                      value={formData.doerName}
                      onChange={handleChange}
                      required
                      className="w-full px-3 py-2 border border-gray-300 rounded appearance-none bg-white focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                    >
                      <option value="">Select Doer</option>
                      {users.map(user => (
                        <option key={user.id} value={user.employeeName}>{user.employeeName}</option>
                      ))}
                    </select>
                    <ChevronDown className="absolute right-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
                  </div>
                </div>

                {/* Department */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Department
                  </label>
                  <div className="relative">
                    <select
                      name="department"
                      value={formData.department}
                      onChange={handleChange}
                      required
                      className="w-full px-3 py-2 border border-gray-300 rounded appearance-none bg-white focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                    >
                      <option value="">Select Department</option>
                      {departmentOptions.map((dept, index) => (
                        <option key={index} value={dept}>{dept}</option>
                      ))}
                    </select>
                    <ChevronDown className="absolute right-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
                  </div>
                </div>

                {/* Machine Part Name */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Machine Part Name
                  </label>
                  <div className="relative">
                    <select
                      name="machinePartName"
                      value={formData.machinePartName}
                      onChange={handleChange}
                      required
                      className="w-full px-3 py-2 border border-gray-300 rounded appearance-none bg-white focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                    >
                      <option value="">Select Part</option>
                      {machinePartOptions.map((part, index) => (
                        <option key={index} value={part}>{part}</option>
                      ))}
                    </select>
                    <ChevronDown className="absolute right-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
                  </div>
                </div>

                {/* Location */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Location
                  </label>
                  <div className="relative">
                    <select
                      name="location"
                      value={formData.location}
                      onChange={handleChange}
                      required
                      className="w-full px-3 py-2 border border-gray-300 rounded appearance-none bg-white focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                    >
                      <option value="">Select Location</option>
                      {locationOptions.map((location, index) => (
                        <option key={index} value={location}>{location}</option>
                      ))}
                    </select>
                    <ChevronDown className="absolute right-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
                  </div>
                </div>

                {/* Priority */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Priority
                  </label>
                  <div className="relative">
                    <select
                      name="priority"
                      value={formData.priority}
                      onChange={handleChange}
                      required
                      className="w-full px-3 py-2 border border-gray-300 rounded appearance-none bg-white focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                    >
                      <option value="">Select Priority</option>
                      <option value="High">High</option>
                      <option value="Medium">Medium</option>
                      <option value="Low">Low</option>
                    </select>
                    <ChevronDown className="absolute right-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
                  </div>
                </div>

                {/* Expected Delivery Days */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Expected Delivery Days
                  </label>
                  <input
                    type="number"
                    name="expectedDeliveryDays"
                    value={formData.expectedDeliveryDays}
                    onChange={handleChange}
                    required
                    min="1"
                    placeholder="e.g., 3"
                    className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                  />
                </div>
              </div>

              {/* Problem */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Problem Description
                </label>
                <textarea
                  name="problem"
                  value={formData.problem}
                  onChange={handleChange}
                  required
                  rows={3}
                  placeholder="Describe the problem in detail..."
                  className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent resize-none"
                />
              </div>

              {/* Image Upload */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Upload Image
                </label>
                <div className="flex items-center justify-center w-full">
                  <label className="flex flex-col items-center justify-center w-full h-32 border-2 border-gray-300 border-dashed rounded-lg cursor-pointer bg-gray-50 hover:bg-gray-100">
                    <div className="flex flex-col items-center justify-center pt-5 pb-6">
                      <Upload className="w-8 h-8 mb-2 text-gray-400" />
                      <p className="mb-2 text-sm text-gray-500">
                        <span className="font-semibold">Click to upload</span> or drag and drop
                      </p>
                      <p className="text-xs text-gray-500">PNG, JPG (MAX. 5MB)</p>
                      {formData.image && (
                        <p className="mt-2 text-sm text-primary font-medium">
                          File selected: {formData.image.name}
                        </p>
                      )}
                    </div>
                    <input
                      type="file"
                      name="image"
                      accept="image/*"
                      onChange={handleFileChange}
                      className="hidden"
                    />
                  </label>
                </div>
              </div>


            </div>
          )}



          {/* Preview Section */}
          {showPreview && previewTasks.length > 0 && (
            <div className="mt-8 border-t pt-6">
              <div className="flex flex-col gap-2 mb-4">
                <div className="flex justify-between items-center">
                  <h3 className="text-lg font-medium text-gray-900">Task Preview</h3>
                  <span className="text-sm text-gray-500">{previewTasks.length} tasks to be generated</span>
                </div>
                {formData.taskStartDate && (
                  <div className="text-sm text-gray-700 bg-blue-50 border border-blue-100 p-3 rounded-md flex gap-6">
                    <div>
                      <span className="font-semibold text-gray-500">Start Date:</span>{' '}
                      <span className="font-medium text-gray-900">{formatDateDDMMYYYY(new Date(formData.taskStartDate))}</span>
                    </div>
                    <div>
                      <span className="font-semibold text-gray-500">End Date:</span>{' '}
                      <span className="font-medium text-gray-900">{formData.taskEndDate ? formatDateDDMMYYYY(new Date(formData.taskEndDate)) : 'N/A'}</span>
                    </div>
                  </div>
                )}
              </div>

              <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
                <div className="overflow-x-auto max-h-96 overflow-y-auto">
                  <table className="min-w-full divide-y divide-gray-200 relative">
                    <thead className="bg-gray-50 sticky top-0 z-10">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider bg-gray-50">
                          Task No
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Task Date
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Description
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Attachment
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Department
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Status
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {previewTasks.map((task, index) => (
                        <tr key={index} className="hover:bg-gray-50">
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            {task.taskNo}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {task.startDate}
                          </td>
                          <td className="px-6 py-4 text-sm text-gray-900">
                            {task.description}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {task.requireAttachment}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {task.department}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {task.taskStatus}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* Submit Button */}
          <div className="mt-8 flex gap-4">
            <button
              type="submit"
              disabled={loading || !formData.taskType}
              className="w-full bg-primary text-white py-3 rounded font-medium hover:bg-primary-dark focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 transition-colors disabled:opacity-50"
            >
              {loading ? 'Processing...' : formData.taskType === 'repair' ? 'Submit Repair' : 'Assign Task'}
            </button>
          </div>

        </form>
      </div >
    </div >
  );
}