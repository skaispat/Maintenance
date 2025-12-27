import { supabase } from '../lib/supabase';
import type { MachineDetails, RepairHistoryItem, DocumentItem, MaintenanceTask, StorePurchase, FixedAsset, YearlyRepairCost } from '../models/machineDetailsExtended';
import type { MaintenanceRecord } from '../models/maintenance';
import type { RepairRecord } from '../models/repair';

// Helper to generate serial number
export const generateSerialNumber = async (machineName: string): Promise<string> => {
  const year = new Date().getFullYear();
  // Sanitize machine name for URL/Serial usage if needed, but keeping it simple as requested
  // Format: SN-2025/(Machine Name)/001
  const basePattern = `SN-${year}/${machineName}/`;

  try {
    if (!supabase) throw new Error('Supabase client not initialized');

    // Find the latest serial number matching the pattern
    // We use ilike for case-insensitive matching just in case
    const { data, error } = await supabase
      .from('machines')
      .select('serial_number')
      .ilike('serial_number', `${basePattern}%`)
      .order('serial_number', { ascending: false })
      .limit(1);

    if (error) {
      console.error('Error fetching serial number:', error);
      return `${basePattern}001`; // Fallback
    }

    if (data && data.length > 0) {
      const lastSerial = data[0].serial_number;
      // Extract the number part. Assuming format is consistent.
      const parts = lastSerial.split('/');
      const lastNumStr = parts[parts.length - 1];
      const lastNum = parseInt(lastNumStr, 10);

      if (!isNaN(lastNum)) {
        const nextNum = (lastNum + 1).toString().padStart(3, '0');
        return `${basePattern}${nextNum}`;
      }
    }

    return `${basePattern}001`;
  } catch (err) {
    console.error('Error generating serial number:', err);
    return `${basePattern}001`;
  }
};

// Function to fetch machine details by ID
export const fetchMachineDetails = async (id: string): Promise<MachineDetails | null> => {
  try {
    if (!supabase) {
      throw new Error('Supabase client is not properly initialized');
    }

    // Fetch machine data from the new machines table
    const { data: machineData, error: machineError } = await supabase
      .from('machines')
      .select('*')
      .eq('id', id)
      .single();

    if (machineError) {
      console.error('Error fetching machine data:', machineError);
      throw machineError;
    }

    // Map the new table structure to MachineDetails interface
    // Note: The new table uses JSONB for many related records

    const repairHistory: RepairHistoryItem[] = Array.isArray(machineData.repair_log)
      ? machineData.repair_log.map((item: any, index: number) => ({
        id: item.id || index,
        date: item.date || new Date().toISOString(),
        description: item.description || item.issue || '',
        cost: item.cost || 0,
        technician: item.technician || '',
        status: item.status || 'completed',
        parts: item.parts || []
      }))
      : [];

    const documents: DocumentItem[] = Array.isArray(machineData.documents)
      ? machineData.documents.map((item: any, index: number) => ({
        id: item.id || index,
        name: item.name || 'Untitled',
        type: item.type || 'unknown',
        url: item.url || '',
        uploadedAt: item.uploadedAt || new Date().toISOString()
      }))
      : [];

    // Fetch related maintenance tasks from 'maintenance' table
    const { data: maintenanceRecords, error: maintenanceTasksError } = await supabase
      .from('maintenance')
      .select('*')
      .eq('machine_id', id)
      .order('due_date', { ascending: true });

    if (maintenanceTasksError) console.error('Error fetching maintenance tasks:', maintenanceTasksError);

    const maintenanceTasks: MaintenanceTask[] = (maintenanceRecords || []).map((record: any) => ({
      id: record.id,
      title: record.task_title,
      type: 'Maintenance',
      dueDate: record.due_date,
      completedDate: record.status === 'completed' ? record.updated_at : undefined,
      status: record.status,
      assignedTo: record.assigned_to || 'Unassigned'
    }));

    // maintenanceSchedule (string[]) can be derived from tasks or if needed separately
    const maintenanceSchedule: string[] = maintenanceTasks.map(t => t.title);

    // store_purchases / purchase_history
    const storePurchases: StorePurchase[] = Array.isArray(machineData.purchase_history)
      ? machineData.purchase_history.map((item: any, index: number) => ({
        id: item.id || index,
        purchaseOrder: item.purchaseOrder || '',
        date: item.date || new Date().toISOString(),
        vendor: item.vendor || '',
        items: item.items || [],
        totalAmount: item.totalAmount || 0,
        status: item.status || 'completed',
        // Compatibility fields
        itemName: item.items?.[0]?.name || 'Unknown',
        quantity: item.items?.[0]?.quantity || 0,
        unitPrice: item.items?.[0]?.unitPrice || 0,
        totalPrice: item.totalAmount || 0,
        purchaseDate: item.date || new Date().toISOString(),
        supplier: item.vendor || ''
      }))
      : [];

    // Fetch temperature data from maintenance tasks
    const { data: tempData, error: tempError } = await supabase
      .from('maintenance_tasks')
      .select(`
        temperature,
        created_at,
        maintenance!inner (
          machine_id,
          updated_at,
          due_date
        )
      `)
      .eq('maintenance.machine_id', id)
      .not('temperature', 'is', null)
      .neq('temperature', '')
      .order('created_at', { ascending: false })
      .limit(20);

    if (tempError) console.error('Error fetching temperature data:', tempError);

    const temperatureData = (tempData || [])
      .map((item: any) => {
        // Try to parse temperature, handle potential non-numeric strings
        const tempVal = parseFloat(item.temperature);
        if (isNaN(tempVal)) return null;

        const dateStr = item.created_at || item.maintenance?.updated_at || item.maintenance?.due_date;

        return {
          time: dateStr ? new Date(dateStr).toLocaleDateString('en-GB', { day: '2-digit', month: '2-digit' }) : 'N/A',
          temp: tempVal
        };
      })
      .filter((item: any) => item !== null)
      .reverse(); // Show oldest to newest

    // Construct the object
    const mergedData: MachineDetails = {
      id: machineData.id,
      name: machineData.name,
      serialNumber: machineData.serial_number,
      model: machineData.model,
      manufacturer: machineData.manufacturer,
      department: machineData.department,
      location: machineData.location,
      status: machineData.status,
      purchaseDate: machineData.purchase_date,
      purchasePrice: machineData.purchase_price,
      vendor: machineData.vendor,
      warrantyExpiration: machineData.warranty_expiration,
      lastMaintenance: machineData.last_maintenance,
      nextMaintenance: machineData.next_maintenance,
      maintenanceSchedule: maintenanceSchedule,
      maintenanceParts: machineData.maintenance_parts || [],
      totalRepairCost: Array.isArray(machineData.repair_log)
        ? machineData.repair_log.reduce((acc: number, curr: any) => acc + (Number(curr.cost) || 0), 0)
        : (machineData.total_repair_cost || 0),
      repairCount: Array.isArray(machineData.repair_log) ? machineData.repair_log.length : (machineData.repair_count || 0),
      healthScore: machineData.health_score,
      specifications: machineData.specifications || {},
      temperatureData: temperatureData.length > 0 ? temperatureData : (machineData.telemetry_data?.temperature || []),
      repairHistory: repairHistory,
      documents: documents,
      maintenanceTasks: maintenanceTasks,
      yearlyRepairCosts: Array.isArray(machineData.repair_log)
        ? machineData.repair_log.reduce((acc: YearlyRepairCost[], curr: any) => {
          const year = new Date(curr.date || new Date()).getFullYear();
          const cost = Number(curr.cost) || 0;
          const existing = acc.find(item => item.year === year);
          if (existing) {
            existing.cost += cost;
          } else {
            acc.push({ year, cost });
          }
          return acc.sort((a, b) => a.year - b.year);
        }, [])
        : [],
      storePurchases: storePurchases,
      fixedAssets: Array.isArray(machineData.fixed_assets) ? machineData.fixed_assets : [],
      itemUsageHistory: [],
      imageUrl: machineData.image_url,
      createdAt: machineData.created_at,
      updatedAt: machineData.updated_at
    };

    return mergedData;

  } catch (error) {
    console.error('Error fetching machine details:', error);
    return null;
  }
};

export const createMachine = async (machineData: any) => {
  try {
    if (!supabase) throw new Error('Supabase client not initialized');

    // Generate serial number
    const serialNumber = await generateSerialNumber(machineData.name);

    // Upload image if provided
    let imageUrl = null;
    if (machineData.image_file) {
      const fileExt = machineData.image_file.name.split('.').pop();
      const fileName = `${serialNumber.replace(/\//g, '-')}-main.${fileExt}`;

      const { error: uploadError } = await supabase.storage
        .from('images-pdf')
        .upload(fileName, machineData.image_file);

      if (uploadError) {
        console.error('Error uploading image:', uploadError);
      } else {
        const { data: { publicUrl } } = supabase.storage
          .from('images-pdf')
          .getPublicUrl(fileName);
        imageUrl = publicUrl;
      }
    }

    // Upload documents if provided
    const documents = [];

    if (machineData.user_manual) {
      const fileExt = machineData.user_manual.name.split('.').pop();
      const fileName = `${serialNumber.replace(/\//g, '-')}-manual.${fileExt}`;

      const { error: uploadError } = await supabase.storage
        .from('images-pdf')
        .upload(fileName, machineData.user_manual);

      if (uploadError) {
        console.error('Error uploading user manual:', uploadError);
      } else {
        const { data: { publicUrl } } = supabase.storage
          .from('images-pdf')
          .getPublicUrl(fileName);

        documents.push({
          id: Date.now(),
          name: 'User Manual',
          type: fileExt?.toUpperCase() || 'PDF',
          url: publicUrl,
          uploadedAt: new Date().toISOString()
        });
      }
    }

    if (machineData.specs_sheet) {
      const fileExt = machineData.specs_sheet.name.split('.').pop();
      const fileName = `${serialNumber.replace(/\//g, '-')}-specs.${fileExt}`;

      const { error: uploadError } = await supabase.storage
        .from('images-pdf')
        .upload(fileName, machineData.specs_sheet);

      if (uploadError) {
        console.error('Error uploading specs sheet:', uploadError);
      } else {
        const { data: { publicUrl } } = supabase.storage
          .from('images-pdf')
          .getPublicUrl(fileName);

        documents.push({
          id: Date.now() + 1,
          name: 'Specifications Sheet',
          type: fileExt?.toUpperCase() || 'PDF',
          url: publicUrl,
          uploadedAt: new Date().toISOString()
        });
      }
    }

    // Prepare data for insertion
    // We need to map the form data to the table columns
    const dbData = {
      name: machineData.name,
      serial_number: serialNumber,
      model: machineData.model,
      manufacturer: machineData.manufacturer,
      department: machineData.department,
      location: machineData.location,
      status: machineData.status || 'operational',
      purchase_date: machineData.purchase_date,
      purchase_price: machineData.purchase_price,
      vendor: machineData.vendor,
      warranty_expiration: machineData.warranty_expiration,
      notes: machineData.notes,
      specifications: machineData.specifications || {},
      maintenance_parts: machineData.maintenance_parts || [],
      next_maintenance: machineData.next_maintenance,
      last_maintenance: machineData.last_maintenance,
      health_score: machineData.health_score || 100,
      // repair_count and total_repair_cost are derived from repair_log, which starts empty
      // So we don't need to insert them if the columns don't exist or are optional
      // But if they exist and have defaults, we can skip them.
      // If the user's schema doesn't have repair_count, we MUST NOT send it.
      // total_repair_cost is in schema, so we can send 0 or skip.
      // repair_count is NOT in schema, so we skip.
      task_assigned: machineData.task_assigned || false,
      assigned_user: machineData.assigned_user,
      image_url: imageUrl,
      // Initialize JSONB fields
      repair_log: [],
      documents: documents,
      maintenance_schedule: machineData.maintenance_schedule || [],
      purchase_history: [],
      fixed_assets: [], // Initialize fixed_assets as a top-level column
      telemetry_data: {}
    };

    const { data, error } = await supabase
      .from('machines')
      .insert([dbData])
      .select()
      .single();

    if (error) throw error;

    return data;
  } catch (error) {
    console.error('Error creating machine:', error);
    throw error;
  }
};

export const updateMachine = async (id: string, machineData: any) => {
  try {
    if (!supabase) throw new Error('Supabase client not initialized');

    // Upload image if provided (new image)
    let imageUrl = null;
    if (machineData.image_file) {
      // We might want to use the existing serial number if available, but we don't have it easily here unless passed.
      // We can just use a timestamp based name for updates to avoid collision or fetching.
      const fileExt = machineData.image_file.name.split('.').pop();
      const fileName = `update-${id}-${Date.now()}.${fileExt}`;

      const { error: uploadError } = await supabase.storage
        .from('images-pdf')
        .upload(fileName, machineData.image_file);

      if (uploadError) {
        console.error('Error uploading image:', uploadError);
      } else {
        const { data: { publicUrl } } = supabase.storage
          .from('images-pdf')
          .getPublicUrl(fileName);
        imageUrl = publicUrl;
      }
    }

    // Upload documents if provided (append to existing)
    const newDocuments = [];

    if (machineData.user_manual) {
      const fileExt = machineData.user_manual.name.split('.').pop();
      const fileName = `update-${id}-manual-${Date.now()}.${fileExt}`;

      const { error: uploadError } = await supabase.storage
        .from('images-pdf')
        .upload(fileName, machineData.user_manual);

      if (uploadError) {
        console.error('Error uploading user manual:', uploadError);
      } else {
        const { data: { publicUrl } } = supabase.storage
          .from('images-pdf')
          .getPublicUrl(fileName);

        newDocuments.push({
          id: Date.now(),
          name: 'User Manual',
          type: fileExt?.toUpperCase() || 'PDF',
          url: publicUrl,
          uploadedAt: new Date().toISOString()
        });
      }
    }

    if (machineData.specs_sheet) {
      const fileExt = machineData.specs_sheet.name.split('.').pop();
      const fileName = `update-${id}-specs-${Date.now()}.${fileExt}`;

      const { error: uploadError } = await supabase.storage
        .from('images-pdf')
        .upload(fileName, machineData.specs_sheet);

      if (uploadError) {
        console.error('Error uploading specs sheet:', uploadError);
      } else {
        const { data: { publicUrl } } = supabase.storage
          .from('images-pdf')
          .getPublicUrl(fileName);

        newDocuments.push({
          id: Date.now() + 1,
          name: 'Specifications Sheet',
          type: fileExt?.toUpperCase() || 'PDF',
          url: publicUrl,
          uploadedAt: new Date().toISOString()
        });
      }
    }

    // Prepare data for update
    const dbData: any = {
      name: machineData.name,
      model: machineData.model,
      manufacturer: machineData.manufacturer,
      department: machineData.department,
      location: machineData.location,
      purchase_date: machineData.purchase_date,
      purchase_price: machineData.purchase_price,
      vendor: machineData.vendor,
      warranty_expiration: machineData.warranty_expiration,
      notes: machineData.notes,
      specifications: machineData.specifications || {},
      maintenance_parts: machineData.maintenance_parts || [],
      next_maintenance: machineData.next_maintenance,
      // last_maintenance: machineData.last_maintenance, // Usually we don't update last maintenance on edit unless explicitly changed? 
      // But user might want to correct it. Let's include it if it's in the form.
      // In NewMachine form, last_maintenance is set to purchase_date on create.
      // On edit, we might not want to overwrite it if it has changed via maintenance tasks.
      // However, the form doesn't expose last_maintenance directly for editing, only next_maintenance.
      // So let's NOT update last_maintenance here to avoid resetting it.

      maintenance_schedule: machineData.maintenance_schedule || [],
      updated_at: new Date().toISOString()
    };

    if (imageUrl) {
      dbData.image_url = imageUrl;
    }

    if (newDocuments.length > 0) {
      // We need to fetch existing documents to append
      const { data: currentMachine } = await supabase
        .from('machines')
        .select('documents')
        .eq('id', id)
        .single();

      const currentDocs = currentMachine?.documents || [];
      dbData.documents = [...currentDocs, ...newDocuments];
    }

    const { data, error } = await supabase
      .from('machines')
      .update(dbData)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;

    return data;
  } catch (error) {
    console.error('Error updating machine:', error);
    throw error;
  }
};

export const fetchAllMachines = async () => {
  try {
    if (!supabase) throw new Error('Supabase client not initialized');

    const { data, error } = await supabase
      .from('machines')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) throw error;

    // Map to Machine interface (simplified version of MachineDetails)
    return data.map((item: any) => ({
      id: item.id,
      name: item.name,
      serial_number: item.serial_number,
      department: item.department,
      status: item.status,
      last_maintenance: item.last_maintenance,
      next_maintenance: item.next_maintenance,
      purchase_date: item.purchase_date,
      purchase_price: item.purchase_price,
      total_repair_cost: Array.isArray(item.repair_log)
        ? item.repair_log.reduce((acc: number, curr: any) => acc + (Number(curr.cost) || 0), 0)
        : (item.total_repair_cost || 0),
      repair_count: Array.isArray(item.repair_log) ? item.repair_log.length : (item.repair_count || 0),
      health_score: item.health_score,
      image_url: item.image_url,
      task_assigned: item.task_assigned,
      assigned_user: item.assigned_user,
      maintenance_parts: item.maintenance_parts,
      model: item.model,
      manufacturer: item.manufacturer,
      vendor: item.vendor,
      created_at: item.created_at,
      updated_at: item.updated_at
    }));
  } catch (error) {
    console.error('Error fetching all machines:', error);
    return [];
  }
};

export const createMaintenanceTask = async (taskData: {
  machineId: number;
  title: string;
  type: string;
  dueDate: string;
  status: string;
  assignedTo: string;
  completedDate?: string;
}) => {
  try {
    if (!supabase) throw new Error('Supabase client not initialized');

    // 1. Fetch current maintenance schedule
    const { data: machine, error: fetchError } = await supabase
      .from('machines')
      .select('maintenance_schedule')
      .eq('id', taskData.machineId)
      .single();

    if (fetchError) throw fetchError;

    const currentSchedule = Array.isArray(machine.maintenance_schedule) ? machine.maintenance_schedule : [];

    // 2. Add new task
    const newTask = {
      id: Date.now(),
      title: taskData.title,
      type: taskData.type,
      dueDate: taskData.dueDate,
      status: taskData.status,
      assignedTo: taskData.assignedTo,
      completedDate: taskData.completedDate
    };

    const updatedSchedule = [...currentSchedule, newTask];

    // 3. Update machine
    const { error: updateError } = await supabase
      .from('machines')
      .update({ maintenance_schedule: updatedSchedule })
      .eq('id', taskData.machineId);

    if (updateError) throw updateError;

    return true;
  } catch (error) {
    console.error('Error creating maintenance task:', error);
    return false;
  }
};

export const updateMaintenanceTask = async (taskId: number, updates: Partial<MaintenanceTask>, machineId: number) => {
  try {
    if (!supabase) throw new Error('Supabase client not initialized');

    // 1. Fetch current maintenance schedule
    const { data: machine, error: fetchError } = await supabase
      .from('machines')
      .select('maintenance_schedule')
      .eq('id', machineId)
      .single();

    if (fetchError) throw fetchError;

    const currentSchedule = Array.isArray(machine.maintenance_schedule) ? machine.maintenance_schedule : [];

    // 2. Find and update task
    const taskIndex = currentSchedule.findIndex((t: any) => (t.id || 0) === taskId);
    if (taskIndex === -1) return false;

    const updatedTask = { ...currentSchedule[taskIndex], ...updates };
    const updatedSchedule = [...currentSchedule];
    updatedSchedule[taskIndex] = updatedTask;

    // 3. Update machine
    const { error: updateError } = await supabase
      .from('machines')
      .update({ maintenance_schedule: updatedSchedule })
      .eq('id', machineId);

    if (updateError) throw updateError;

    return true;
  } catch (error) {
    console.error('Error updating maintenance task:', error);
    return false;
  }
};

export const addFixedAsset = async (machineId: number, asset: FixedAsset) => {
  try {
    if (!supabase) throw new Error('Supabase client not initialized');

    // 1. Fetch current fixed assets
    const { data: machine, error: fetchError } = await supabase
      .from('machines')
      .select('fixed_assets') // Select the fixed_assets column directly
      .eq('id', machineId)
      .single();

    if (fetchError) throw fetchError;

    // Ensure fixed_assets is an array, default to empty if null/undefined
    const currentFixedAssets = Array.isArray(machine.fixed_assets) ? machine.fixed_assets : [];

    // 2. Add new asset
    const newAsset = { ...asset, id: Date.now() }; // Ensure ID
    const updatedFixedAssets = [...currentFixedAssets, newAsset];

    // 3. Update machine
    const { error: updateError } = await supabase
      .from('machines')
      .update({ fixed_assets: updatedFixedAssets }) // Update the fixed_assets column directly
      .eq('id', machineId);

    if (updateError) throw updateError;

    return true;
  } catch (error) {
    console.error('Error adding fixed asset:', error);
    return false;
  }
};

export const updateFixedAsset = async (machineId: number, assetId: number, updates: Partial<FixedAsset>) => {
  try {
    if (!supabase) throw new Error('Supabase client not initialized');

    // 1. Fetch current fixed assets
    const { data: machine, error: fetchError } = await supabase
      .from('machines')
      .select('fixed_assets')
      .eq('id', machineId)
      .single();

    if (fetchError) throw fetchError;

    const currentFixedAssets = Array.isArray(machine.fixed_assets) ? machine.fixed_assets : [];

    // 2. Find and update asset
    const assetIndex = currentFixedAssets.findIndex((a: any) => (a.id || 0) === assetId);
    if (assetIndex === -1) return false;

    const updatedAsset = { ...currentFixedAssets[assetIndex], ...updates };
    const updatedFixedAssets = [...currentFixedAssets];
    updatedFixedAssets[assetIndex] = updatedAsset;

    // 3. Update machine
    const { error: updateError } = await supabase
      .from('machines')
      .update({ fixed_assets: updatedFixedAssets })
      .eq('id', machineId);

    if (updateError) throw updateError;

    return true;
  } catch (error) {
    console.error('Error updating fixed asset:', error);
    return false;
  }
};

// New functions for separate tables

export const createMaintenanceRecord = async (data: MaintenanceRecord) => {
  try {
    if (!supabase) throw new Error('Supabase client not initialized');

    // Separate checklist from the main record
    // @ts-ignore
    const { checklist, ...mainData } = data;

    const { data: result, error } = await supabase
      .from('maintenance')
      .insert([mainData])
      .select()
      .single();

    if (error) throw error;

    // Insert Maintenance Tasks (Checklist Items)
    if (checklist && checklist.length > 0) {
      const tasksToInsert = checklist.map((item: any) => ({
        maintenance_id: result.id,
        task_no: item.taskNo,
        description: item.description,
        status: item.taskStatus || 'pending',
        remarks: item.remarks || '',
        sound_of_machine: item.soundOfMachine || '',
        temperature: item.temperature || '',
        maintenance_cost: item.maintenanceCost || 0,
        image_url: item.image || null,
        department: item.department || '',
        is_submitted: false,
        serial_number: (mainData as any).serial_number || ''
      }));

      const { error: tasksError } = await supabase
        .from('maintenance_tasks')
        .insert(tasksToInsert);

      if (tasksError) {
        console.error('Error creating maintenance tasks:', tasksError);
      }
    }

    return result;
  } catch (error) {
    console.error('Error creating maintenance record:', error);
    return null;
  }
};

export const createBulkMaintenanceRecords = async (data: MaintenanceRecord[]) => {
  // This function was removed from usage but kept in file. 
  // If used, it needs similar logic, but for bulk it's harder.
  // For now, leaving as is or removing if unused.
  // The user removed the import in AssignTask, so it's likely unused.
  try {
    if (!supabase) throw new Error('Supabase client not initialized');

    const { data: result, error } = await supabase
      .from('maintenance')
      .insert(data)
      .select();

    if (error) throw error;
    return result;
  } catch (error) {
    console.error('Error creating bulk maintenance records:', error);
    return null;
  }
};

export const createRepairRecord = async (data: RepairRecord, imageFile?: File) => {
  try {
    if (!supabase) throw new Error('Supabase client not initialized');

    let imageUrl = data.image_url;

    // Upload image if provided
    if (imageFile) {
      const fileExt = imageFile.name.split('.').pop();
      const fileName = `repair-${data.machine_id}-${Date.now()}.${fileExt}`;

      const { error: uploadError } = await supabase.storage
        .from('images-pdf')
        .upload(fileName, imageFile);

      if (uploadError) {
        console.error('Error uploading repair image:', uploadError);
      } else {
        const { data: { publicUrl } } = supabase.storage
          .from('images-pdf')
          .getPublicUrl(fileName);
        imageUrl = publicUrl;
      }
    }

    const recordToInsert = {
      ...data,
      image_url: imageUrl
    };

    const { data: result, error } = await supabase
      .from('repairs')
      .insert([recordToInsert])
      .select()
      .single();

    if (error) throw error;
    return result;
  } catch (error) {
    console.error('Error creating repair record:', error);
    return null;
  }
};

export const updateMaintenanceRecord = async (id: number, updates: any) => {
  try {
    if (!supabase) throw new Error('Supabase client not initialized');

    const { checklist, ...mainUpdates } = updates;

    // 1. Update Main Record
    let data = null;
    if (Object.keys(mainUpdates).length > 0) {
      const { data: res, error } = await supabase
        .from('maintenance')
        .update(mainUpdates)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      data = res;
    }

    // 2. Update Checklist Items (if provided)
    if (checklist && Array.isArray(checklist)) {
      const tasksToUpsert = checklist.map((item: any) => ({
        id: item.id, // Use existing ID to update
        maintenance_id: id,
        task_no: item.taskNo,
        description: item.description,
        status: item.taskStatus,
        remarks: item.remarks,
        sound_of_machine: item.soundOfMachine,
        temperature: item.temperature,
        maintenance_cost: item.maintenanceCost,
        image_url: item.image,
        department: item.department,
        is_submitted: item.isSubmitted
      }));

      const { error: tasksError } = await supabase
        .from('maintenance_tasks')
        .upsert(tasksToUpsert);

      if (tasksError) throw tasksError;
    }

    return data;
  } catch (error) {
    console.error('Error updating maintenance record:', error);
    return null;
  }
};

export const updateRepairRecord = async (id: number, updates: any) => {
  try {
    if (!supabase) throw new Error('Supabase client not initialized');

    const { data, error } = await supabase
      .from('repairs')
      .update(updates)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return data;
  } catch (error) {
    console.error('Error updating repair record:', error);
    return null;
  }
};


export const fetchAllTasks = async () => {
  try {
    if (!supabase) throw new Error('Supabase client not initialized');

    // 1. Fetch machines lookup map first
    const { data: machinesData, error: machinesError } = await supabase
      .from('machines')
      .select('id, name, department, location');

    if (machinesError) console.error('Error fetching machines for tasks:', machinesError);

    // Create a map for quick lookup:  machineId -> { name, department, location }
    const machinesMap = new Map();
    if (machinesData) {
      machinesData.forEach((m: any) => {
        machinesMap.set(m.id, {
          name: m.name,
          department: m.department,
          location: m.location,
          serial_number: m.serial_number // Include serial_number in map
        });
      });
    }

    // 2. Fetch Maintenance Tasks (no join)
    const { data: maintenanceData, error: maintenanceError } = await supabase
      .from('maintenance')
      .select('*, machines(serial_number)') // Select serial_number from joined machines table
      .order('created_at', { ascending: false });

    if (maintenanceError) throw maintenanceError;

    // 3. Fetch Repair Tasks (no join)
    const { data: repairData, error: repairError } = await supabase
      .from('repairs')
      .select('*')
      .order('created_at', { ascending: false });

    if (repairError) throw repairError;

    // 4. Transform and combine
    const maintenanceTasks = maintenanceData.map((item: any) => {
      const machine = machinesMap.get(item.machine_id) || {};
      return {
        id: `m-${item.id}`,
        originalId: item.id,
        machineId: item.machine_id,
        machineName: machine.name || 'Unknown Machine',
        department: machine.department || 'Maintenance',
        type: 'Maintenance',
        status: item.status,
        dueDate: item.due_date,
        startDate: item.start_date,
        endDate: item.end_date,
        assignedTo: item.assigned_to,
        assignedToName: item.assigned_to, // Assuming username
        givenBy: item.given_by,
        priority: item.priority,
        location: machine.location || 'On-site',
        vendor: '',
        description: item.description,
        taskTitle: item.task_title,
        frequency: item.frequency,
        isTemperatureSensitive: item.is_temperature_sensitive,
        createdAt: item.created_at,
        machineSerialNo: item.serial_number || item.machines?.serial_number || machine.serial_number || 'N/A'
      };
    });

    const repairTasks = repairData.map((item: any) => {
      const machine = machinesMap.get(item.machine_id) || {};

      return {
        id: `r-${item.id}`,
        originalId: item.id,
        machineId: item.machine_id,
        machineName: machine.name || item.machine_part_name || 'Unknown Machine',
        department: item.department || machine.department,
        type: 'Repair',
        status: item.status,
        dueDate: new Date(new Date(item.created_at).setDate(new Date(item.created_at).getDate() + item.expected_delivery_days)).toISOString(),
        assignedTo: item.doer_name,
        assignedToName: item.doer_name,
        givenBy: item.given_by,
        priority: item.priority,
        location: item.location || machine.location,
        vendor: '',
        description: item.problem_description,
        machinePartName: item.machine_part_name,
        imageUrl: item.image_url,
        createdAt: item.created_at,
        machineSerialNo: item.machine_serial_no || machine.serial_number || 'N/A'
      };
    });

    return [...maintenanceTasks, ...repairTasks].sort((a, b) =>
      new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );

  } catch (error) {
    console.error('Error fetching all tasks:', error);
    return [];
  }
};

export const fetchTaskDetails = async (taskId: string) => {
  try {
    if (!supabase) throw new Error('Supabase client not initialized');

    const type = taskId.startsWith('m-') ? 'maintenance' : 'repair';
    const id = parseInt(taskId.split('-')[1]);

    if (type === 'maintenance') {
      const { data, error } = await supabase
        .from('maintenance')
        .select('*')
        .eq('id', id)
        .single();

      if (error) throw error;

      // Fetch machine details manually
      let machine: any = {};
      if (data.machine_id) {
        const { data: machineData, error: machineError } = await supabase
          .from('machines')
          .select('name, department, location, serial_number')
          .eq('id', data.machine_id)
          .single();

        if (!machineError && machineData) {
          machine = machineData;
        }
      }

      // Fetch maintenance tasks (checklist items)
      const { data: tasksData, error: tasksError } = await supabase
        .from('maintenance_tasks')
        .select('*')
        .eq('maintenance_id', id)
        .order('id', { ascending: true });

      if (tasksError) console.error('Error fetching maintenance tasks:', tasksError);

      const checklistItems = tasksData ? tasksData.map((t: any) => ({
        id: t.id,
        taskNo: t.task_no,
        department: t.department,
        description: t.description,
        taskStatus: t.status,
        remarks: t.remarks,
        soundOfMachine: t.sound_of_machine,
        temperature: t.temperature,
        maintenanceCost: t.maintenance_cost,
        image: t.image_url,
        isSubmitted: t.is_submitted,
        updatedAt: t.updated_at
      })) : [];

      return {
        id: `m-${data.id}`,
        originalId: data.id,
        machineId: data.machine_id,
        machineName: machine.name,
        machineSerialNo: data.serial_number || machine.serial_number,
        department: machine.department,
        type: 'Maintenance',
        status: data.status,
        dueDate: data.due_date,
        startDate: data.start_date,
        endDate: data.end_date,
        assignedTo: data.assigned_to,
        givenBy: data.given_by,
        priority: data.priority,
        location: machine.location,
        description: data.description,
        taskTitle: data.task_title,
        frequency: data.frequency,
        isTemperatureSensitive: data.is_temperature_sensitive,
        enableReminder: data.enable_reminder,
        requireAttachment: data.require_attachment,
        createdAt: data.created_at,
        estimatedCost: data.estimated_cost || 0,
        detailsData: data.task_logs || [],
        checklistItems: checklistItems,
        documents: data.documents || []
      };
    } else {
      const { data, error } = await supabase
        .from('repairs')
        .select('*')
        .eq('id', id)
        .single();

      if (error) throw error;

      // Fetch machine details manually
      let machine: any = {};
      if (data.machine_id) {
        const { data: machineData, error: machineError } = await supabase
          .from('machines')
          .select('name, serial_number, department, location')
          .eq('id', data.machine_id)
          .single();

        if (!machineError && machineData) {
          machine = machineData;
        }
      }

      return {
        id: `r-${data.id}`,
        originalId: data.id,
        machineId: data.machine_id,
        machineName: machine.name,
        machineSerialNo: data.machine_serial_no || machine.serial_number,
        department: data.department || machine.department,
        type: 'Repair',
        status: data.status,
        dueDate: new Date(new Date(data.created_at).setDate(new Date(data.created_at).getDate() + (data.expected_delivery_days || 0))).toISOString(),
        assignedTo: data.doer_name,
        givenBy: data.given_by,
        priority: data.priority,
        location: data.location || machine.location,
        description: data.problem_description,
        machinePartName: data.machine_part_name,
        imageUrl: data.image_url,
        createdAt: data.created_at,
        estimatedCost: data.estimated_cost || 0,
        detailsData: data.repair_logs || [],
        checklistItems: data.checklist || [],
        documents: data.documents || []
      };
    }
  } catch (error) {
    console.error('Error fetching task details:', error);
    return null;
  }
};

export const fetchPendingApprovalItems = async () => {
  try {
    if (!supabase) throw new Error('Supabase client not initialized');

    const { data, error } = await supabase
      .from('maintenance_tasks')
      .select(`
        *,
        maintenance:maintenance_id (
          id,
          machines (
            name,
            department
          )
        )
      `)
      .in('status', ['completed', 'approved', 'rejected'])
      .order('updated_at', { ascending: false });

    if (error) throw error;
    return data || [];
  } catch (error) {
    console.error('Error fetching pending approval items:', error);
    return [];
  }
};

export const fetchAllMaintenanceChecklistItems = async () => {
  try {
    if (!supabase) throw new Error('Supabase client not initialized');

    const { data, error } = await supabase
      .from('maintenance_tasks')
      .select(`
        *,
        maintenance:maintenance_id (
          id,
          assigned_to,
          given_by,
          priority,
          due_date,
          machines (
            id,
            name,
            department,
            location
          )
        )
      `)
      .order('id', { ascending: false });

    if (error) throw error;
    return data || [];
  } catch (error) {
    console.error('Error fetching all maintenance checklist items:', error);
    return [];
  }
};

export const fetchMaintenanceChecklistItemsPaginated = async (page: number, itemsPerPage: number, filters?: { status?: string | string[], search?: string, machineName?: string, assignedTo?: string }) => {
  try {
    if (!supabase) throw new Error('Supabase client not initialized');

    // Use !inner to ensure we can filter by nested machine name strictly
    let query = supabase
      .from('maintenance_tasks')
      .select(`
        *,
        maintenance:maintenance_id!inner (
          id,
          assigned_to,
          given_by,
          priority,
          due_date,
          machines!inner (
            id,
            name,
            department,
            location
          )
        )
      `, { count: 'exact' });

    // Apply Status Filter
    if (filters?.status) {
      if (Array.isArray(filters.status)) {
        query = query.in('status', filters.status);
      } else if (filters.status !== 'all') {
        query = query.eq('status', filters.status);
      }
    }

    // Apply Machine Filter
    if (filters?.machineName && filters.machineName !== 'all') {
      query = query.eq('maintenance.machines.name', filters.machineName);
    }

    // Apply User Filter
    if (filters?.assignedTo) {
      query = query.eq('maintenance.assigned_to', filters.assignedTo);
    }

    // Apply Search Filter (search on task_no or description)
    if (filters?.search) {
      query = query.or(`task_no.ilike.%${filters.search}%,description.ilike.%${filters.search}%`);
    }

    const { data, count, error } = await query
      .order('id', { ascending: false })
      .range((page - 1) * itemsPerPage, page * itemsPerPage - 1);

    if (error) throw error;

    return { data: data || [], count: count || 0 };
  } catch (error) {
    console.error('Error fetching paginated maintenance checklist items:', error);
    return { data: [], count: 0 };
  }
};

export const fetchMaintenanceTaskCounts = async (assignedTo?: string, machineName?: string) => {
  try {
    if (!supabase) throw new Error('Supabase client not initialized');

    // Helper to build query
    const buildQuery = (statusFilter: any) => {
      // Use !inner for strict filtering if filtering by related tables
      let query = supabase!.from('maintenance_tasks')
        .select(`
          *,
          maintenance:maintenance_id!inner(
            assigned_to,
            machines!inner(name)
          )
        `, { count: 'exact', head: true });

      if (Array.isArray(statusFilter)) {
        query = query.in('status', statusFilter);
      } else {
        query = query.eq('status', statusFilter);
      }

      if (assignedTo) {
        query = query.eq('maintenance.assigned_to', assignedTo);
      }

      if (machineName && machineName !== 'all') {
        query = query.eq('maintenance.machines.name', machineName);
      }

      return query;
    };

    const pendingPromise = buildQuery('pending');
    const completedPromise = buildQuery(['completed', 'approved']);
    const inProgressPromise = buildQuery('in_progress');

    const [pending, completed, inProgress] = await Promise.all([pendingPromise, completedPromise, inProgressPromise]);

    return {
      pending: pending.count || 0,
      completed: completed.count || 0,
      inProgress: inProgress.count || 0
    };
  } catch (error) {
    console.error('Error fetching task counts:', error);
    return { pending: 0, completed: 0, inProgress: 0 };
  }
}

export const updateChecklistItemStatus = async (id: number, status: string) => {
  try {
    if (!supabase) throw new Error('Supabase client not initialized');

    const { data, error } = await supabase
      .from('maintenance_tasks')
      .update({ status })
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return data;
  } catch (error) {
    console.error('Error updating checklist item status:', error);
    return null;
  }
};

export const getNextTaskNumber = async (machineName: string): Promise<number> => {
  try {
    if (!supabase) throw new Error('Supabase client not initialized');

    const machineInitials = machineName
      ? machineName.split(' ').map((n: string) => n[0]).join('').toUpperCase()
      : 'M';

    // find all task_no starting with machineInitials
    // Order by ID descending to get the most recently created one
    const { data, error } = await supabase
      .from('maintenance_tasks')
      .select('task_no')
      .ilike('task_no', `${machineInitials}-%`)
      .order('id', { ascending: false })
      .limit(1);

    if (error) {
      console.error('Error fetching next task number:', error);
      return 1;
    }

    if (data && data.length > 0) {
      const lastTaskNo = data[0].task_no;
      // Extract number part (assuming format INITIALS-XXX)
      const parts = lastTaskNo.split('-');
      if (parts.length > 1) {
        // Get the last part
        const lastPart = parts[parts.length - 1];
        const lastNum = parseInt(lastPart, 10);

        if (!isNaN(lastNum)) {
          return lastNum + 1;
        }
      }
    }

    return 1; // Default starting number if no previous tasks found
  } catch (error) {
    console.error('Error calculating next task number:', error);
    return 1; // Fallback
  }
};

export const fetchMachinesWithTasks = async (assignedTo?: string) => {
  try {
    if (!supabase) throw new Error('Supabase client not initialized');

    // We want machines that have at least one maintenance_task.
    // We go through maintenance table.
    // machines -> maintenance -> maintenance_tasks
    let query = supabase
      .from('machines')
      .select(`
        id,
        name,
        maintenance!inner (
          id,
          assigned_to,
          maintenance_tasks!inner (
            id
          )
        )
      `)
      .order('name');

    if (assignedTo) {
      // Filter maintenance records by assignedTo
      query = query.eq('maintenance.assigned_to', assignedTo);
    }

    const { data, error } = await query;

    if (error) throw error;

    // The result is a list of machines. Because of !inner joins, 
    // it only includes machines that have matching maintenance & tasks.
    // Supabase returns unique rows for the parent table ('machines') 
    // even if multiple child records match.

    return data.map((m: any) => ({
      id: m.id,
      name: m.name
    }));
  } catch (error) {
    console.error('Error fetching machines with tasks:', error);
    return [];
  }
};

export const deleteMaintenanceTask = async (id: number) => {
  try {
    if (!supabase) throw new Error('Supabase client not initialized');

    // First delete related maintenance_tasks (checklist items) due to foreign key constraints if not cascading
    const { error: tasksError } = await supabase
      .from('maintenance_tasks')
      .delete()
      .eq('maintenance_id', id);

    if (tasksError) console.error('Error deleting related checklist items:', tasksError);

    const { error } = await supabase
      .from('maintenance')
      .delete()
      .eq('id', id);

    if (error) throw error;
    return true;
  } catch (error) {
    console.error('Error deleting maintenance task:', error);
    return false;
  }
};

export const deleteRepairTask = async (id: number) => {
  try {
    if (!supabase) throw new Error('Supabase client not initialized');

    const { error } = await supabase
      .from('repairs')
      .delete()
      .eq('id', id);

    if (error) throw error;
    return true;
  } catch (error) {
    console.error('Error deleting repair task:', error);
    return false;
  }
};