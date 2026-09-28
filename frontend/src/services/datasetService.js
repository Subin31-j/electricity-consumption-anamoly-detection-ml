import apiClient from './apiClient';
import { ENDPOINTS } from './contracts';

export async function uploadDataset(file) {
  const form = new FormData();
  form.append('file', file);
  const { data } = await apiClient.post(ENDPOINTS.datasets.upload, form, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });
  return data;
}
