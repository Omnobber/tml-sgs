import axios from "axios";
import { useAuthStore } from "../store/authStore";

const apiBaseURL = import.meta.env.VITE_API_BASE_URL?.replace(/\/$/, "") || "/api";

const http = axios.create({
  baseURL: apiBaseURL
});

http.interceptors.request.use((config) => {
  const token = useAuthStore.getState().accessToken;
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

http.interceptors.response.use(
  (res) => res,
  async (error) => {
    const original = error.config;
    console.error("API request failed:", {
      method: original?.method,
      url: original?.url,
      status: error.response?.status,
      message: error.response?.data?.message || error.response?.data?.error || error.message
    });
    if (error.response?.status === 401 && !original._retry) {
      original._retry = true;
      const store = useAuthStore.getState();
      if (!store.refreshToken) {
        store.clearSession();
        throw error;
      }
      try {
        const { data } = await axios.post(`${apiBaseURL}/auth/refresh`, {
          refreshToken: store.refreshToken
        });
        store.setSession(data);
        original.headers.Authorization = `Bearer ${data.accessToken}`;
        return http(original);
      } catch (refreshErr) {
        store.clearSession();
        throw refreshErr;
      }
    }
    throw error;
  }
);

export default http;
