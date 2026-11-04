import request from '@/utils/request';

export async function getRintalaQuestions() {
  const res = await request.get('/api/rintala/questions');
  return res.data;
}

export async function submitRintala(childId: string, answers: Record<string, number>) {
  const res = await request.post('/api/rintala/submit', { childId, answers });
  return res.data;
}

export async function getRintalaRecords(childId: string, page = 1, pageSize = 20) {
  const res = await request.get('/api/rintala/records', { params: { childId, page, pageSize } });
  return res.data;
}
