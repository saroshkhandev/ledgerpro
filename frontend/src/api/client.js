import axios from "axios";
import { Capacitor } from "@capacitor/core";

const SESSION_STORAGE_KEY = "ledger.sid";
const isNative = Capacitor.isNativePlatform();
const apiBaseUrl =
  import.meta.env.VITE_API_BASE_URL || (isNative ? "http://localhost:4000/api" : "/api");

const api = axios.create({
  baseURL: apiBaseUrl,
  withCredentials: !isNative,
});

api.interceptors.request.use((config) => {
  const sid = localStorage.getItem(SESSION_STORAGE_KEY);
  if (sid) {
    config.headers = config.headers || {};
    config.headers["X-Session-Id"] = sid;
  }
  return config;
});

api.interceptors.response.use(
  (response) => {
    const url = String(response.config?.url || "");
    if ((url.includes("/auth/login") || url.includes("/auth/register")) && response.data?.sid) {
      localStorage.setItem(SESSION_STORAGE_KEY, response.data.sid);
    }
    if (url.includes("/auth/logout")) {
      localStorage.removeItem(SESSION_STORAGE_KEY);
    }
    return response;
  },
  (error) => {
    if (error?.response?.status === 401) {
      localStorage.removeItem(SESSION_STORAGE_KEY);
    }
    return Promise.reject(error);
  }
);

export default api;
