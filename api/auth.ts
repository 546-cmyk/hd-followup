import request from '@/utils/request';

export async function parentLogin(phone: string, password: string) {
  const res = await request.post('/api/auth/parent/login', { phone, password });
  return res.data;
}

export async function parentRegister(data: {
  phone: string;
  password: string;
  childName: string;
  surgeryDate: string;
  diagnosisType: string;
  contactName: string;
}) {
  const res = await request.post('/api/auth/parent/register', data);
  return res.data;
}

export async function doctorLogin(phone: string, password: string) {
  const res = await request.post('/api/auth/doctor/login', { phone, password });
  return res.data;
}
