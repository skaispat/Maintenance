export interface RepairRecord {
    id?: number;
    machine_id: number;
    machine_serial_no: string;
    doer_name: string;
    given_by: string;
    department: string;
    machine_part_name: string;
    problem_description: string;
    priority: string;
    expected_delivery_days: number;
    location: string;
    status: string;
    image_url?: string;
    created_at?: string;
    updated_at?: string;
}
