import apiClient from './apiClient';
import { ENDPOINTS } from './contracts';

export async function verifyConsumer(consumerNumber) {
  const { data } = await apiClient.post(ENDPOINTS.consumers.verify, {
    consumer_number: consumerNumber,
  });
  return data;
}

export async function getConsumption(consumerId) {
  const { data } = await apiClient.get(ENDPOINTS.consumers.consumption(consumerId));
  return data;
}

export async function analyzeConsumer(consumerId, models) {
  const { data } = await apiClient.post(ENDPOINTS.consumers.analyze(consumerId), {
    models: models || ['isolation_forest', 'kmeans', 'lof'],
  });
  return data;
}
