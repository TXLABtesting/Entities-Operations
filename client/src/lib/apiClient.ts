import axios, { AxiosError, InternalAxiosRequestConfig } from "axios";

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "/api";

export const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    "Content-Type": "application/json",
  },
  timeout: 30000,
});

// Request interceptor: attach Bearer token
apiClient.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    // 1. Try oidc-client-ts session storage
    const storageKey = Object.keys(sessionStorage).find((key) =>
      key.startsWith("oidc.user:")
    );
    if (storageKey) {
      try {
        const userData = JSON.parse(sessionStorage.getItem(storageKey) || "{}");
        if (userData.access_token) {
          config.headers.Authorization = `Bearer ${userData.access_token}`;
          return config;
        }
      } catch {
        // Ignore parse errors
      }
    }

    // 2. Fallback: demo token for local development
    const demoToken = localStorage.getItem("demo_token");
    if (demoToken) {
      config.headers.Authorization = `Bearer ${demoToken}`;
    }

    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor: handle 401/403
apiClient.interceptors.response.use(
  (response) => response,
  (error: AxiosError<{ code: string; message: string }>) => {
    if (error.response?.status === 401) {
      // Token expired or invalid - trigger re-login
      const event = new CustomEvent("auth:unauthorized");
      window.dispatchEvent(event);
    }
    return Promise.reject(error);
  }
);

// Typed API helpers
export const api = {
  // Auth
  getMe: () => apiClient.get("/auth/me"),

  // Users
  getUsers: (params?: Record<string, string>) => apiClient.get("/users", { params }),
  getUser: (id: string) => apiClient.get(`/users/${id}`),
  createUser: (data: { email: string; display_name?: string; entity_id?: string; access_enabled?: boolean }) =>
    apiClient.post("/users", data),
  updateUser: (id: string, data: Record<string, unknown>) => apiClient.patch(`/users/${id}`, data),
  enableUser: (id: string) => apiClient.post(`/users/${id}/enable`),
  disableUser: (id: string) => apiClient.post(`/users/${id}/disable`),
  assignRole: (userId: string, roleId: string, entityId?: string) =>
    apiClient.post(`/users/${userId}/roles`, { role_id: roleId, entity_id: entityId }),
  removeRole: (userId: string, roleId: string) => apiClient.delete(`/users/${userId}/roles/${roleId}`),

  // Roles & Permissions
  getRoles: () => apiClient.get("/roles"),
  getPermissions: () => apiClient.get("/permissions"),

  // Entities
  getEntities: () => apiClient.get("/entities"),
  createEntity: (data: { code: string; name_en: string; name_ar?: string }) =>
    apiClient.post("/entities", data),
  updateEntity: (id: string, data: Record<string, unknown>) => apiClient.patch(`/entities/${id}`, data),

  // Tracks
  getTracks: () => apiClient.get("/tracks"),

  // Work Plans
  getWorkPlans: (params?: Record<string, string>) => apiClient.get("/work-plans", { params }),
  getWorkPlan: (id: string) => apiClient.get(`/work-plans/${id}`),
  createWorkPlan: (data: Record<string, unknown>) => apiClient.post("/work-plans", data),
  updateWorkPlan: (id: string, data: Record<string, unknown>) => apiClient.patch(`/work-plans/${id}`, data),
  deleteWorkPlan: (id: string) => apiClient.delete(`/work-plans/${id}`),
  submitWorkPlan: (id: string) => apiClient.post(`/work-plans/${id}/submit`),
  approveWorkPlan: (id: string, comment?: string) => apiClient.post(`/work-plans/${id}/approve`, { comment }),
  rejectWorkPlan: (id: string, comment?: string) => apiClient.post(`/work-plans/${id}/reject`, { comment }),
  returnWorkPlan: (id: string, comment?: string) => apiClient.post(`/work-plans/${id}/return`, { comment }),

  // Initiatives
  getInitiatives: (params?: Record<string, string>) => apiClient.get("/initiatives", { params }),
  createInitiative: (data: Record<string, unknown>) => apiClient.post("/initiatives", data),
  updateInitiative: (id: string, data: Record<string, unknown>) => apiClient.patch(`/initiatives/${id}`, data),
  deleteInitiative: (id: string) => apiClient.delete(`/initiatives/${id}`),

  // Prioritization
  getPrioritization: (params?: Record<string, string>) => apiClient.get("/prioritization", { params }),
  createPrioritization: (data: Record<string, unknown>) => apiClient.post("/prioritization", data),
  updatePrioritization: (id: string, data: Record<string, unknown>) => apiClient.patch(`/prioritization/${id}`, data),
  deletePrioritization: (id: string) => apiClient.delete(`/prioritization/${id}`),

  // Audit
  getAuditLogs: (params?: Record<string, string>) => apiClient.get("/audit-logs", { params }),
};
