import axios from "axios";

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
export const API_BASE = `${BACKEND_URL}/api`;

export const api = axios.create({ baseURL: API_BASE });

api.interceptors.request.use((config) => {
  const token = localStorage.getItem("tp_token");
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

export function saveAuth(token, user) {
  localStorage.setItem("tp_token", token);
  localStorage.setItem("tp_user", JSON.stringify(user));
}

export function clearAuth() {
  localStorage.removeItem("tp_token");
  localStorage.removeItem("tp_user");
}

export function getStoredUser() {
  try {
    const raw = localStorage.getItem("tp_user");
    return raw ? JSON.parse(raw) : null;
  } catch { return null; }
}
