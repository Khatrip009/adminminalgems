import { apiFetch } from "../lib/apiClient";

export interface ExportLog {
  id: string;
  user_id: string;
  user_name?: string;
  export_type: string;
  status: string;
  filters: any;
  file_size: number;
  created_at: string;
}

export async function getExportLogs() {
  return apiFetch<{ ok: boolean; logs: ExportLog[] }>("/exports/logs");
}
