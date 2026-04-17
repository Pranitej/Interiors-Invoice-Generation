// client/src/api/api.js
import axios from "axios";

const API = axios.create({
  baseURL: `${import.meta.env.VITE_API_BASE || "http://localhost:5000"}/api`,
  timeout: 10000,
  withCredentials: true,
});

API.interceptors.response.use(
  (response) => response,
  (error) => {
    const isLoginCall = error.config?.url?.includes("/auth/login");
    if (error.response?.status === 401 && !isLoginCall) {
      localStorage.removeItem("user");
      localStorage.removeItem("company");
      window.location.href = "/";
    }
    return Promise.reject(error);
  }
);

export default API;
