import apiClient from './apiClient';
import { ENDPOINTS } from './contracts';

export async function createAnalysis(datasetId, models) {
  const { data } = await apiClient.post(ENDPOINTS.analysis.create, {
    dataset_id: datasetId,
    models: models || ['isolation_forest', 'kmeans', 'lof'],
  });
  return data;
}

export async function getResults(analysisId) {
  const { data } = await apiClient.get(ENDPOINTS.analysis.results(analysisId));
  return data;
}

export async function getAnomalies(analysisId) {
  const { data } = await apiClient.get(ENDPOINTS.analysis.anomalies(analysisId));
  return data;
}

export async function getHistory() {
  const { data } = await apiClient.get(ENDPOINTS.history);
  return data;
}

export async function createReport(analysisId) {
  const { data } = await apiClient.post(`/api/analysis/${analysisId}/report`);
  return data;
}

export async function getReport(reportId) {
  const { data } = await apiClient.get(ENDPOINTS.reports.get(reportId));
  return data;
}
