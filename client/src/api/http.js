import axios from "axios";
import { useAuthStore } from "../store/authStore";

const http = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || "http://localhost:4000/api"
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
    if (error.response?.status === 401 && !original._retry) {
      original._retry = true;
      const store = useAuthStore.getState();
      if (!store.refreshToken) {
        store.clearSession();
        throw error;
      }
      try {
        const { data } = await axios.post(`${http.defaults.baseURL}/auth/refresh`, {
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
