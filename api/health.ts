import request from '@/utils/request';

export async function getHealthArticles(params?: any) {
  const res = await request.get('/api/health/articles', { params });
  return res.data;
}

export async function getHealthArticleDetail(id: string) {
  const res = await request.get(`/api/health/articles/${id}`);
  return res.data;
}

export async function getHealthReminders() {
  const res = await request.get('/api/health/reminders');
  return res.data;
}
