import request from '@/utils/request';

export async function getRedFlagQuestions() {
  const res = await request.get('/api/red-flag/questions');
  return res.data;
}

export async function submitRedFlag(childId: string, answers: Record<string, boolean>) {
  const res = await request.post('/api/red-flag/submit', { childId, answers });
  return res.data;
}

export async function getRedFlagRecords(childId: string, page = 1, pageSize = 10) {
  const res = await request.get('/api/red-flag/records', { params: { childId, page, pageSize } });
  return res.data;
}
