import axios from "axios";
import {API_BASE_URL} from "../App/config";

const api = axios.create({
  baseURL: {API_BASE_URL}, // your backend API
  withCredentials: true, // allows sending refreshToken cookies
});

api.interceptors.response.use(
  res => res,
  async err => {
    const originalRequest = err.config;

    if (err.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;

      try {
        const refreshRes = await api.post("/auth/refresh");

        const newAccessToken = refreshRes.data.token;

        // Optionally store token in memory or context
        api.defaults.headers.common["Authorization"] = `Bearer ${newAccessToken}`;
        originalRequest.headers["Authorization"] = `Bearer ${newAccessToken}`;

        return api(originalRequest); // retry failed request
      } catch (refreshErr) {
        console.error("Refresh token failed", refreshErr);
        // Optionally redirect to login
      }
    }

    return Promise.reject(err);
  }
);

export default api;
