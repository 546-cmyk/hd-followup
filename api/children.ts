import request from '@/utils/request';

export async function getMyChild() {
  const res = await request.get('/api/children/mine');
  return res.data;
}

export async function getChildById(childId: string) {
  const res = await request.get(`/api/children/${childId}`);
  return res.data;
}
