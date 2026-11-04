import request from '@/utils/request';

export async function createBowelDiary(data: any) {
  const res = await request.post('/api/bowel-diary', data);
  return res.data;
}

export async function getBowelDiaryRecords(params?: any) {
  const res = await request.get('/api/bowel-diary', { params });
  return res.data;
}

export async function getBowelDiaryTrend(params?: any) {
  const res = await request.get('/api/bowel-diary/trend', { params });
  return res.data;
}
