import apiClient from '../services/apiClient';
import { ENDPOINTS } from '../services/contracts';

export async function getDashboard() {
  const { data } = await apiClient.get(ENDPOINTS.admin.dashboard);
  return data;
}

export async function listUsers({ search, status, page = 1, pageSize = 20 } = {}) {
  const params = { page, page_size: pageSize };
  if (search) params.search = search;
  if (status) params.status = status;
  const { data } = await apiClient.get(ENDPOINTS.admin.users, { params });
  return data;
}

export async function getUser(id) {
  const { data } = await apiClient.get(ENDPOINTS.admin.user(id));
  return data;
}

export async function updateUserStatus(id, status) {
  const { data } = await apiClient.patch(ENDPOINTS.admin.userStatus(id), { status });
  return data;
}

export async function deleteUser(id) {
  await apiClient.delete(ENDPOINTS.admin.user(id));
}

export async function listConsumers() {
  const { data } = await apiClient.get(ENDPOINTS.admin.consumers);
  return data;
}

export async function getConsumer(id) {
  const { data } = await apiClient.get(ENDPOINTS.admin.consumer(id));
  return data;
}

export async function createConsumer(payload) {
  const { data } = await apiClient.post(ENDPOINTS.admin.consumers, payload);
  return data;
}

export async function updateConsumer(id, payload) {
  const { data } = await apiClient.patch(ENDPOINTS.admin.consumer(id), payload);
  return data;
}

export async function deleteConsumer(id) {
  await apiClient.delete(ENDPOINTS.admin.consumer(id));
}

export async function listDatasets() {
  const { data } = await apiClient.get(ENDPOINTS.admin.datasets);
  return data;
}

export async function listAnalyses() {
  const { data } = await apiClient.get(ENDPOINTS.admin.analyses);
  return data;
}

export async function listAnomalies() {
  const { data } = await apiClient.get(ENDPOINTS.admin.anomalies);
  return data;
}

export async function listReports() {
  const { data } = await apiClient.get(ENDPOINTS.admin.reports);
  return data;
}

export async function listActivity() {
  const { data } = await apiClient.get(ENDPOINTS.admin.activity);
  return data;
}

export async function getSystemHealth() {
  const { data } = await apiClient.get(ENDPOINTS.admin.systemHealth);
  return data;
}
