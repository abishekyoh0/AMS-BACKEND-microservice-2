
export interface WorkerAssignmentDto {
  _id: string;
  complaint_id: string;
  worker_id: string;
  worker_name: string;
  status: string;
  assigned_date: Date;

  complaint: {
    complaint_number: string;
    title: string;
    category: string;
    priority: string;
    status: string;
    unit_number: string;
    block: string;
    floor: string;
    resident_name: string;
  } | null;
}