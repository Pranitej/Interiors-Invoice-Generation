// client/src/api/api.js
import axios from "axios";

const API = axios.create({
  baseURL: `${import.meta.env.VITE_API_BASE || "http://localhost:5000"}/api`,
  timeout: 10000,
});

// Attach JWT token to every request
API.interceptors.request.use((config) => {
  const token = localStorage.getItem("token");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// On 401, clear storage and redirect to login — except for the login call itself,
// where a 401 just means wrong credentials and should surface as an inline error.
API.interceptors.response.use(
  (response) => response,
  (error) => {
    const isLoginCall = error.config?.url?.includes("/auth/login");
    if (error.response?.status === 401 && !isLoginCall) {
      localStorage.removeItem("user");
      localStorage.removeItem("token");
      localStorage.removeItem("company");
      window.location.href = "/";
    }
    return Promise.reject(error);
  }
);

export default API;
