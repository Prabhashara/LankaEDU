import axios from "axios";
import { clearAuthSession, getAuthToken } from "./authStorage";
import { normalizeApiError, shouldShowGlobalApiError } from "./errorService";

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || "/api",
  headers: {
    "Content-Type": "application/json"
  },
  timeout: 20000
});

api.interceptors.request.use((config) => {
  const token = getAuthToken();

  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }

  return config;
});

api.interceptors.response.use(
  response => response,
  error => {
    const normalizedError = normalizeApiError(error);
    const status = normalizedError.status;
    const url = error.config?.url || "";
    const isAuthEndpoint = url.includes("/auth/login") || url.includes("/auth/register");
    const isPublicEndpoint = url.includes("/public/");

    if (status === 401 && !isAuthEndpoint && !isPublicEndpoint) {
      clearAuthSession();
      window.dispatchEvent(new CustomEvent("online-exam:session-expired"));
      if (!window.location.pathname.includes("/login")) {
        window.location.assign("/login");
      }
    }

    if (shouldShowGlobalApiError(normalizedError) && !isPublicEndpoint) {
      window.dispatchEvent(new CustomEvent("online-exam:api-error", {
        detail: {
          message: normalizedError.userMessage,
          requestId: normalizedError.requestId,
          status: normalizedError.status
        }
      }));
    }

    return Promise.reject(normalizedError);
  }
);

export default api;
