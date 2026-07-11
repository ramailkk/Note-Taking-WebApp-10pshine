// utils/api.js
import axios from "axios";

// In production (Vercel), the frontend and API share the same domain,
// so /api is a relative path. For local dev, set REACT_APP_API_BASE_URL
// in frontend/.env.local to http://localhost:5000
const api = axios.create({
  baseURL: process.env.REACT_APP_API_BASE_URL || "/api",
  withCredentials: true,
});

// Token stored in memory or localStorage
let token = localStorage.getItem("token");

// Set token in header for all requests
api.interceptors.request.use((config) => {
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Handle 401 by refreshing token
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;

      try {
        const res = await axios.post(
          "http://localhost:5000/auth/refresh",
          {},
          { withCredentials: true }
        );

        const newToken = res.data.token;
        localStorage.setItem("token", newToken);
        token = newToken;

        originalRequest.headers.Authorization = `Bearer ${newToken}`;
        return api(originalRequest); // retry original request
      } catch (err) {
        localStorage.removeItem("token");
        return Promise.reject(err);
      }
    }

    return Promise.reject(error);
  }
);

export default api;
