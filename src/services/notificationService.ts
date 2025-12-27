import { supabase } from '../lib/supabase';

export interface Notification {
    id: string;
    type: 'task_assigned' | 'task_completed' | 'task_updated' | 'user_created' | 'machine_added' | 'repair_request';
    title: string;
    description: string;
    timestamp: string;
    read: boolean;
    link?: string;
    machineName?: string;
    priority?: string;
    status?: string;
    dueDate?: string;
    workDescription?: string;
    assignedTo?: string;
}


const extractDateFromDescription = (description: string): string | undefined => {
    if (!description) return undefined;
    // Regex to match dates in format DD/MM/YYYY, DD-MM-YYYY, or DD.MM.YYYY
    const dateRegex = /(\d{2})[\/.-](\d{2})[\/.-](\d{4})/;
    const match = description.match(dateRegex);

    if (match) {
        // Convert to YYYY-MM-DD for consistency
        const [_, day, month, year] = match;
        return `${year}-${month}-${day}`;
    }
    return undefined;
}

export const fetchNotifications = async (): Promise<Notification[]> => {
    try {
        if (!supabase) throw new Error('Supabase client not initialized');

        const notifications: Notification[] = [];

        // 1. Fetch Maintenance Tasks
        // Fetch all pending maintenance tasks (Admin sees all)
        const { data: pendingMaintenance, error: pendingMaintenanceError } = await supabase
            .from('maintenance')
            .select('*, machines:machine_id(name)')
            .neq('status', 'completed')
            .order('created_at', { ascending: false });

        if (!pendingMaintenanceError && pendingMaintenance) {
            pendingMaintenance.forEach((task: any) => {
                notifications.push({
                    id: `m-create-${task.id}`,
                    type: 'task_assigned',
                    title: task.machines?.name || 'Unknown Machine',
                    description: task.task_title,
                    timestamp: task.created_at,
                    read: false,
                    link: `/tasks/m-${task.id}`,
                    dueDate: extractDateFromDescription(task.description) || task.due_date,
                    status: task.status,
                    workDescription: task.description,
                    assignedTo: task.assigned_to
                });
            });
        }

        // Fetch recent completed maintenance tasks
        const { data: completedMaintenance, error: completedMaintenanceError } = await supabase
            .from('maintenance')
            .select('*')
            .eq('status', 'completed')
            .order('updated_at', { ascending: false })
            .limit(10);

        if (!completedMaintenanceError && completedMaintenance) {
            completedMaintenance.forEach((task: any) => {
                notifications.push({
                    id: `m-complete-${task.id}`,
                    type: 'task_completed',
                    title: task.machines?.name || 'Unknown Machine',
                    description: `Completed: ${task.task_title}`,
                    timestamp: task.updated_at,
                    read: false,
                    link: `/tasks/m-${task.id}`
                });
            });
        }

        // 2. Fetch Repairs
        // Fetch all pending repairs
        const { data: pendingRepairs, error: pendingRepairError } = await supabase
            .from('repairs')
            .select('*, machines:machine_id(name)')
            .neq('status', 'completed')
            .order('created_at', { ascending: false });

        if (!pendingRepairError && pendingRepairs) {
            pendingRepairs.forEach((repair: any) => {
                notifications.push({
                    id: `r-create-${repair.id}`,
                    type: 'repair_request',
                    title: repair.machines?.name || 'Unknown Machine',
                    description: repair.issue_description,
                    timestamp: repair.created_at,
                    read: false,
                    link: `/tasks/r-${repair.id}`,
                    priority: repair.priority,
                    status: repair.status,
                    assignedTo: repair.doer_name
                });
            });
        }

        // Fetch recent completed repairs
        const { data: completedRepairs, error: completedRepairError } = await supabase
            .from('repairs')
            .select('*')
            .eq('status', 'completed')
            .order('updated_at', { ascending: false })
            .limit(10);

        if (!completedRepairError && completedRepairs) {
            completedRepairs.forEach((repair: any) => {
                notifications.push({
                    id: `r-complete-${repair.id}`,
                    type: 'task_completed',
                    title: repair.machines?.name || 'Unknown Machine',
                    description: `Completed Repair: ${repair.issue_description}`,
                    timestamp: repair.updated_at,
                    read: false,
                    link: `/tasks/r-${repair.id}`
                });
            });
        }

        // 3. Fetch recent Users
        const { data: userData, error: userError } = await supabase
            .from('users')
            .select('*')
            .order('created_at', { ascending: false })
            .limit(5);

        if (!userError && userData) {
            userData.forEach((user: any) => {
                notifications.push({
                    id: `u-create-${user.id}`,
                    type: 'user_created',
                    title: 'New User Created',
                    description: `${user.employee_name} (${user.page_access}) joined the team`,
                    timestamp: user.created_at,
                    read: false,
                    link: '/settings'
                });
            });
        }

        // 4. Fetch recent Machines
        const { data: machineData, error: machineError } = await supabase
            .from('machines')
            .select('*')
            .order('created_at', { ascending: false })
            .limit(5);

        if (!machineError && machineData) {
            machineData.forEach((machine: any) => {
                notifications.push({
                    id: `mac-create-${machine.id}`,
                    type: 'machine_added',
                    title: 'New Machine Added',
                    description: `${machine.name} added to ${machine.department}`,
                    timestamp: machine.created_at,
                    read: false,
                    link: `/machines/${machine.id}`
                });
            });
        }

        // Sort by timestamp descending
        return notifications.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());

    } catch (error) {
        console.error('Error fetching notifications:', error);
        return [];
    }
};

export interface AssignedTask {
    id: string;
    title: string;
    description: string;
    dueDate?: string;
    priority?: string;
    type: 'maintenance' | 'repair';
    status: string;
    link: string;
    machineName?: string;
    workDescription?: string;
}

export const fetchUserAssignedTask = async (employeeName: string): Promise<AssignedTask[]> => {
    try {
        if (!supabase) throw new Error('Supabase client not initialized');
        if (!employeeName) return [];

        const tasks: AssignedTask[] = [];

        // 1. Check for Maintenance Tasks
        const { data: maintenanceTasks, error: maintenanceError } = await supabase
            .from('maintenance')
            .select('*, machines:machine_id(name)')
            .eq('assigned_to', employeeName)
            .neq('status', 'completed')
            .order('due_date', { ascending: true }); // Urgent first

        if (!maintenanceError && maintenanceTasks) {
            maintenanceTasks.forEach((maintenanceTask: any) => {
                tasks.push({
                    id: `m-${maintenanceTask.id}`,
                    title: maintenanceTask.machines?.name || 'Unknown Machine',
                    description: maintenanceTask.task_title,
                    dueDate: extractDateFromDescription(maintenanceTask.description) || maintenanceTask.due_date,
                    type: 'maintenance',
                    status: maintenanceTask.status,
                    link: `/tasks/m-${maintenanceTask.id}`,
                    workDescription: maintenanceTask.description
                });
            });
        }

        // 2. Check for Repairs
        const { data: repairTasks, error: repairError } = await supabase
            .from('repairs')
            .select('*, machines:machine_id(name)')
            .eq('doer_name', employeeName)
            .neq('status', 'completed')
            .order('created_at', { ascending: true }); // Oldest first (FIFO)

        if (!repairError && repairTasks) {
            repairTasks.forEach((repairTask: any) => {
                tasks.push({
                    id: `r-${repairTask.id}`,
                    title: repairTask.machines?.name || 'Unknown Machine',
                    description: repairTask.problem_description,
                    priority: repairTask.priority,
                    type: 'repair',
                    status: repairTask.status,
                    link: `/tasks/r-${repairTask.id}`,
                });
            });
        }

        return tasks;


    } catch (error) {
        console.error('Error fetching assigned task:', error);
        return [];
    }
};

export const fetchUserAssignedNotifications = async (employeeName: string): Promise<Notification[]> => {
    try {
        if (!supabase) throw new Error('Supabase client not initialized');
        if (!employeeName) return [];

        const notifications: Notification[] = [];

        // 1. Fetch Assigned Maintenance Tasks (Pending)
        const { data: maintenanceTasks, error: maintenanceError } = await supabase
            .from('maintenance')
            .select('*, machines:machine_id(name)')
            .eq('assigned_to', employeeName)
            .neq('status', 'completed')
            .order('due_date', { ascending: true }); // Urgent first

        if (!maintenanceError && maintenanceTasks) {
            maintenanceTasks.forEach((task: any) => {
                notifications.push({
                    id: `m-assign-${task.id}`,
                    type: 'task_assigned',
                    title: task.machines?.name || 'Unknown Machine',
                    description: task.task_title,
                    link: `/tasks/m-${task.id}`,
                    dueDate: extractDateFromDescription(task.description) || task.due_date,
                    status: task.status,
                    timestamp: task.created_at,
                    read: false,
                    assignedTo: task.assigned_to
                });
            });
        }

        // 2. Fetch Assigned Maintenance Tasks (Completed History)
        const { data: completedMaintenance, error: completedMaintenanceError } = await supabase
            .from('maintenance')
            .select('*, machines:machine_id(name)')
            .eq('assigned_to', employeeName)
            .eq('status', 'completed')
            .order('updated_at', { ascending: false })
            .limit(5);

        if (!completedMaintenanceError && completedMaintenance) {
            completedMaintenance.forEach((task: any) => {
                notifications.push({
                    id: `m-complete-${task.id}`,
                    type: 'task_completed',
                    title: task.machines?.name || 'Unknown Machine',
                    description: `Completed: ${task.task_title}`,
                    link: `/tasks/m-${task.id}`,
                    dueDate: extractDateFromDescription(task.description) || task.due_date,
                    status: task.status,
                    timestamp: task.updated_at,
                    read: true,
                    assignedTo: task.assigned_to
                });
            });
        }

        // 3. Fetch Assigned Repairs (Pending)
        const { data: repairTasks, error: repairError } = await supabase
            .from('repairs')
            .select('*, machines:machine_id(name)')
            .eq('doer_name', employeeName)
            .neq('status', 'completed')
            .order('created_at', { ascending: false });

        if (!repairError && repairTasks) {
            repairTasks.forEach((repair: any) => {
                notifications.push({
                    id: `r-assign-${repair.id}`,
                    type: 'repair_request',
                    title: repair.machines?.name || 'Unknown Machine',
                    description: repair.issue_description,
                    timestamp: repair.created_at,
                    read: false,
                    link: `/tasks/r-${repair.id}`,
                    priority: repair.priority,
                    status: repair.status
                });
            });
        }

        // 4. Fetch Assigned Repairs (Completed History)
        const { data: completedRepairs, error: completedRepairError } = await supabase
            .from('repairs')
            .select('*, machines:machine_id(name)')
            .eq('doer_name', employeeName)
            .eq('status', 'completed')
            .order('updated_at', { ascending: false })
            .limit(5);

        if (!completedRepairError && completedRepairs) {
            completedRepairs.forEach((repair: any) => {
                notifications.push({
                    id: `r-complete-${repair.id}`,
                    type: 'task_completed',
                    title: repair.machines?.name || 'Unknown Machine',
                    description: `Completed: ${repair.issue_description}`,
                    timestamp: repair.updated_at,
                    read: true,
                    link: `/tasks/r-${repair.id}`,
                    priority: repair.priority,
                    status: repair.status
                });
            });
        }

        return notifications.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());

    } catch (error) {
        console.error('Error fetching user assigned notifications:', error);
        return [];
    }
};
