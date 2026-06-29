// Shared types between frontend and backend

export interface ApiUser {
  id: string;
  email: string;
  displayName: string;
  username: string | null;
  entityId: string | null;
  status: "pending" | "active" | "disabled";
  accessEnabled: boolean;
  roles: string[];
  permissions: string[];
}

export interface ApiEntity {
  id: string;
  code: string;
  name_en: string;
  name_ar: string | null;
  is_active: boolean;
}

export interface ApiTrack {
  id: string;
  code: string;
  name_en: string;
  name_ar: string | null;
  description_en: string | null;
  description_ar: string | null;
  sort_order: number;
}

export interface ApiWorkPlan {
  id: string;
  entity_id: string;
  track_id: string;
  title_en: string;
  title_ar: string | null;
  description_en: string | null;
  description_ar: string | null;
  status: "draft" | "submitted" | "approved" | "rejected";
  year: number | null;
  entity_name?: string;
  track_name?: string;
}

export interface ApiInitiative {
  id: string;
  work_plan_id: string;
  entity_id: string;
  track_id: string | null;
  name_en: string;
  name_ar: string | null;
  status: string;
  priority: string | null;
  progress: number;
}

export interface ApiRole {
  id: string;
  code: string;
  name: string;
  description: string | null;
  is_system: boolean;
  permissions: { id: string; code: string; description: string }[];
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
}

export interface ApiError {
  code: string;
  message: string;
  details?: unknown[];
}
