
import { supabase } from '../lib/supabase';
import type { MaintenanceTask } from '../models/machineDetailsExtended';

// ... existing imports

export const fetchMaintenanceTaskItemsByMachine = async (machineName: string) => {
    try {
        if (!supabase) throw new Error('Supabase client not initialized');

        // We join maintenance_tasks -> maintenance -> machines
        // We filter by machines.name
        const { data, error } = await supabase
            .from('maintenance_tasks')
            .select(`
        *,
        maintenance:maintenance_id!inner (
          id,
          due_date,
          status,
          priority,
          assigned_to,
          machines!inner (
            name,
            serial_number
          )
        )
      `)
            .eq('maintenance.machines.name', machineName)
            .order('created_at', { ascending: false });

        if (error) throw error;

        return data.map((item: any) => ({
            id: item.id,
            maintenanceId: item.maintenance_id,
            description: item.description, // maximize grouping by this
            status: item.status,
            remarks: item.remarks,
            dueDate: item.maintenance?.due_date,
            priority: item.maintenance?.priority,
            assignedTo: item.maintenance?.assigned_to,
            machineName: item.maintenance?.machines?.name,
            tasks_no: item.task_no,
            created_at: item.created_at
        }));
    } catch (error) {
        console.error('Error fetching maintenance tasks items:', error);
        return [];
    }
};

export const fetchMaintenanceTaskItemsByMaintenanceId = async (maintenanceId: number) => {
    try {
        if (!supabase) throw new Error('Supabase client not initialized');

        const { data, error } = await supabase
            .from('maintenance_tasks')
            .select('*')
            .eq('maintenance_id', maintenanceId)
            .order('task_no', { ascending: true });

        if (error) throw error;

        return data.map((item: any) => ({
            id: item.id,
            maintenanceId: item.maintenance_id,
            description: item.description,
            status: item.status,
            remarks: item.remarks,
            taskNo: item.task_no,
            soundOfMachine: item.sound_of_machine,
            temperature: item.temperature,
            maintenanceCost: item.maintenance_cost,
            image: item.image_url,
            isSubmitted: item.is_submitted,
            taskDate: item.task_date,
            created_at: item.created_at
        }));
    } catch (error) {
        console.error('Error fetching maintenance tasks items by ID:', error);
        return [];
    }
};

export const updateMaintenanceTaskItem = async (id: number, updates: any) => {
    try {
        if (!supabase) throw new Error('Supabase client not initialized');

        // We are updating the maintenance_tasks table directly
        const { data, error } = await supabase
            .from('maintenance_tasks')
            .update(updates)
            .eq('id', id)
            .select()
            .single();

        if (error) throw error;
        return data;
    } catch (error) {
        console.error('Error updating maintenance task item:', error);
        return null;
    }
};

export const deleteMaintenanceTaskItem = async (id: number) => {
    try {
        if (!supabase) throw new Error('Supabase client not initialized');

        const { error } = await supabase
            .from('maintenance_tasks')
            .delete()
            .eq('id', id);

        if (error) throw error;
        return true;
    } catch (error) {
        console.error('Error deleting maintenance task item:', error);
        return false;
    }
};
