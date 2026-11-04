import request from '@/utils/request';
import type {
  DashboardResponse,
  PatientListResponse,
  PatientDetailResponse,
} from '@shared/api.interface';

export async function getDoctorPatients(params?: {
  riskLevel?: string;
  diagnosisType?: string;
  keyword?: string;
  page?: number;
  pageSize?: number;
}): Promise<PatientListResponse> {
  const res = await request.get('/api/doctor/patients', { params });
  return res.data;
}

export async function getDoctorPatientDetail(id: string): Promise<PatientDetailResponse> {
  const res = await request.get(`/api/doctor/patients/${id}`);
  return res.data;
}

export async function getDoctorDashboard(): Promise<DashboardResponse> {
  const res = await request.get('/api/doctor/dashboard');
  return res.data;
}

export async function batchSendReminder(data: {
  patientIds: string[];
  template: string;
  message: string;
}): Promise<{ success: number; failed: number }> {
  const res = await request.post('/api/doctor/followup/batch', data);
  return res.data;
}

export async function addFollowupNote(data: {
  childId: string;
  content: string;
  nextFollowupDate?: string;
}): Promise<{ id: string }> {
  const res = await request.post('/api/doctor/followup/note', data);
  return res.data;
}
