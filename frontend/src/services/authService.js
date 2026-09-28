import apiClient from './apiClient';
import { ENDPOINTS } from './contracts';

export async function login(email, password) {
  const { data } = await apiClient.post(ENDPOINTS.auth.login, { email, password });
  return data;
}

export async function register(name, email, password) {
  const { data } = await apiClient.post(ENDPOINTS.auth.register, { name, email, password });
  return data;
}

export async function fetchMe() {
  const { data } = await apiClient.get(ENDPOINTS.auth.me);
  return data;
}
