export interface MaintenanceRecord {
    id?: number;
    machine_id: number;
    task_title: string;
    priority: string;
    due_date: string;
    status: string;
    assigned_to: string;
    given_by: string;
    description: string;
    frequency: string;
    is_temperature_sensitive: boolean;
    enable_reminder: boolean;
    require_attachment: boolean;
    checklist?: any[];
    updated_at?: string;
    created_at?: string;
    start_date?: string;
    end_date?: string;
}
