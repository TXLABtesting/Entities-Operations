/**
 * SSO Authentication Context
 * Supports Workspace ONE / Omnissa Access via OIDC (react-oidc-context)
 * Falls back to devMode ONLY when VITE_AUTH_ENABLED=false AND VITE_DEMO_AUTH_ENABLED=true
 * Compliant with OWASP Authentication Best Practices
 * SOC 2 Type II - Access Control Requirements
 */
import { createContext, useContext, useCallback, useEffect, useState, type ReactNode } from "react";
import { useAuth as useOidcAuth } from "react-oidc-context";
import { SecurityLogger } from "@/lib/security/auditLogger";
import { SessionManager } from "@/lib/security/sessionManager";
import { authEnabled, demoAuthEnabled } from "@/auth/oidcConfig";
import { mapProfileToRole } from "@/auth/claims";

// ─── Types ───────────────────────────────────────────────────────────────────

export interface SSOConfig {
  provider: "oauth2" | "saml" | "oidc";
  clientId: string;
  authority: string;
  redirectUri: string;
  scopes: string[];
  logoutUri?: string;
  tokenEndpoint?: string;
  userinfoEndpoint?: string;
}

export interface UserProfile {
  id: string;
  email: string;
  name: string;
  nameAr?: string;
  entityId?: string;
  entityName?: string;
  role: UserRole;
  permissions: Permission[];
  avatar?: string;
  lastLogin?: string;
  mfaEnabled?: boolean;
}

export type UserRole = "admin" | "entity_admin" | "coordinator" | "viewer" | "auditor";

export type Permission =
  | "workplan:create"
  | "workplan:edit"
  | "workplan:view"
  | "workplan:delete"
  | "workplan:export"
  | "workplan:approve"
  | "team:manage"
  | "team:view"
  | "admin:users"
  | "admin:settings"
  | "audit:view";

export interface AuthState {
  isAuthenticated: boolean;
  isLoading: boolean;
  user: UserProfile | null;
  accessToken: string | null;
  refreshToken: string | null;
  tokenExpiry: number | null;
  error: string | null;
  sessionId: string | null;
}

interface AuthContextType extends AuthState {
  login: () => Promise<void>;
  logout: () => Promise<void>;
  refreshSession: () => Promise<boolean>;
  hasPermission: (permission: Permission) => boolean;
  hasRole: (role: UserRole) => boolean;
  isSessionValid: () => boolean;
  getAccessToken: () => Promise<string | null>;
}

// ─── Role-Permission Matrix (RBAC) ──────────────────────────────────────────

const ROLE_PERMISSIONS: Record<UserRole, Permission[]> = {
  admin: [
    "workplan:create", "workplan:edit", "workplan:view", "workplan:delete",
    "workplan:export", "workplan:approve", "team:manage", "team:view",
    "admin:users", "admin:settings", "audit:view",
  ],
  entity_admin: [
    "workplan:create", "workplan:edit", "workplan:view", "workplan:delete",
    "workplan:export", "workplan:approve", "team:manage", "team:view", "audit:view",
  ],
  coordinator: [
    "workplan:create", "workplan:edit", "workplan:view",
    "workplan:export", "team:view",
  ],
  viewer: ["workplan:view", "team:view"],
  auditor: ["workplan:view", "team:view", "audit:view"],
};

// ─── Context ─────────────────────────────────────────────────────────────────

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// ─── Provider ────────────────────────────────────────────────────────────────

interface AuthProviderProps {
  children: ReactNode;
  config?: Partial<SSOConfig>;
  /** Set to true for development/demo mode (bypasses SSO) */
  devMode?: boolean;
}

export function AuthProvider({ children, config: _config, devMode = false }: AuthProviderProps) {
  // OIDC auth enabled → always use OIDC provider (never demo)
  if (authEnabled) {
    return <OidcBackedAuthProvider>{children}</OidcBackedAuthProvider>;
  }

  // Auth disabled + demo explicitly enabled → use demo provider
  if (devMode && demoAuthEnabled) {
    return <DevModeAuthProvider>{children}</DevModeAuthProvider>;
  }

  // Auth disabled + demo not enabled → no auth, pass through
  return <NoAuthProvider>{children}</NoAuthProvider>;
}

// ─── OIDC-Backed Auth Provider ──────────────────────────────────────────────

function OidcBackedAuthProvider({ children }: { children: ReactNode }) {
  const oidc = useOidcAuth();

  const [state, setState] = useState<AuthState>({
    isAuthenticated: false,
    isLoading: true,
    user: null,
    accessToken: null,
    refreshToken: null,
    tokenExpiry: null,
    error: null,
    sessionId: null,
  });

  // Sync OIDC state to our AuthState
  useEffect(() => {
    if (oidc.isLoading) {
      setState(prev => ({ ...prev, isLoading: true }));
      return;
    }

    if (oidc.error) {
      setState(prev => ({
        ...prev,
        isLoading: false,
        error: oidc.error?.message || "Authentication error",
      }));
      return;
    }

    if (oidc.isAuthenticated && oidc.user) {
      const profile = oidc.user.profile as Record<string, unknown>;

      // Map role using EXPLICIT mapping only - fail closed
      const mappedRole = mapProfileToRole(profile);

      if (!mappedRole) {
        // No valid role claim found - FAIL CLOSED
        // User is authenticated by Workspace ONE but has no valid application role
        SecurityLogger.log("access_denied", {
          reason: "no_valid_role_claim",
          userId: profile.sub,
          claims: JSON.stringify(profile),
        });

        setState({
          isAuthenticated: true,
          isLoading: false,
          user: null,
          accessToken: oidc.user.access_token,
          refreshToken: null,
          tokenExpiry: null,
          error: "unauthorized_no_role",
          sessionId: null,
        });
        return;
      }

      // Valid role found - create user profile
      const userProfile: UserProfile = {
        id: (profile.sub as string) || "unknown",
        email: (profile.email as string) || "",
        name: (profile.name as string) || (profile.given_name as string) || (profile.preferred_username as string) || (profile.email as string) || (profile.sub as string) || "",
        nameAr: (profile.name_ar as string) || undefined,
        entityId: (profile.entity_id as string) || undefined,
        entityName: (profile.entity_name as string) || undefined,
        role: mappedRole,
        permissions: ROLE_PERMISSIONS[mappedRole],
        avatar: (profile.picture as string) || undefined,
        lastLogin: new Date().toISOString(),
        mfaEnabled: false,
      };

      const tokenExpiry = oidc.user.expires_at
        ? oidc.user.expires_at * 1000
        : Date.now() + 3600000;

      const sessionId = SessionManager.createSession(
        userProfile,
        oidc.user.access_token,
        null,
        tokenExpiry
      );

      setState({
        isAuthenticated: true,
        isLoading: false,
        user: userProfile,
        accessToken: oidc.user.access_token,
        refreshToken: null,
        tokenExpiry,
        error: null,
        sessionId,
      });

      SecurityLogger.log("login_success", { userId: userProfile.id, provider: "oidc", role: mappedRole });
    } else {
      setState(prev => ({
        ...prev,
        isAuthenticated: false,
        isLoading: false,
        user: null,
        accessToken: null,
      }));
    }
  }, [oidc.isAuthenticated, oidc.isLoading, oidc.error, oidc.user]);

  const login = useCallback(async () => {
    SecurityLogger.log("login_initiated", { provider: "oidc" });
    await oidc.signinRedirect();
  }, [oidc]);

  const logout = useCallback(async () => {
    SecurityLogger.log("logout", { userId: state.user?.id });
    SessionManager.destroySession();
    await oidc.signoutRedirect();
  }, [oidc, state.user]);

  const refreshSession = useCallback(async (): Promise<boolean> => {
    try {
      await oidc.signinSilent();
      return true;
    } catch {
      return false;
    }
  }, [oidc]);

  const hasPermission = useCallback((permission: Permission): boolean => {
    if (!state.user) return false;
    return state.user.permissions.includes(permission);
  }, [state.user]);

  const hasRole = useCallback((role: UserRole): boolean => {
    if (!state.user) return false;
    const roleHierarchy: Record<UserRole, number> = {
      admin: 5, entity_admin: 4, coordinator: 3, auditor: 2, viewer: 1,
    };
    return roleHierarchy[state.user.role] >= roleHierarchy[role];
  }, [state.user]);

  const isSessionValid = useCallback((): boolean => {
    if (!state.tokenExpiry) return false;
    return Date.now() < state.tokenExpiry;
  }, [state.tokenExpiry]);

  const getAccessToken = useCallback(async (): Promise<string | null> => {
    if (!state.accessToken) return null;
    if (!isSessionValid()) {
      const refreshed = await refreshSession();
      if (!refreshed) return null;
    }
    return state.accessToken;
  }, [state.accessToken, isSessionValid, refreshSession]);

  // If user is authenticated but has no valid role → show access denied
  if (state.error === "unauthorized_no_role") {
    return (
      <AuthContext.Provider value={{
        ...state,
        isAuthenticated: false,
        login,
        logout,
        refreshSession,
        hasPermission: () => false,
        hasRole: () => false,
        isSessionValid: () => false,
        getAccessToken: async () => null,
      }}>
        <UnauthorizedPage onLogout={logout} />
      </AuthContext.Provider>
    );
  }

  return (
    <AuthContext.Provider value={{
      ...state,
      login,
      logout,
      refreshSession,
      hasPermission,
      hasRole,
      isSessionValid,
      getAccessToken,
    }}>
      {children}
    </AuthContext.Provider>
  );
}

// ─── No Auth Provider (auth disabled, demo disabled) ────────────────────────

function NoAuthProvider({ children }: { children: ReactNode }) {
  const [state] = useState<AuthState>({
    isAuthenticated: true,
    isLoading: false,
    user: null,
    accessToken: null,
    refreshToken: null,
    tokenExpiry: null,
    error: null,
    sessionId: null,
  });

  const noop = useCallback(async () => {}, []);
  const noopBool = useCallback(async () => false, []);

  return (
    <AuthContext.Provider value={{
      ...state,
      login: noop,
      logout: noop,
      refreshSession: noopBool,
      hasPermission: () => true,
      hasRole: () => true,
      isSessionValid: () => true,
      getAccessToken: async () => null,
    }}>
      {children}
    </AuthContext.Provider>
  );
}

// ─── Dev Mode Auth Provider ─────────────────────────────────────────────────

function DevModeAuthProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<AuthState>({
    isAuthenticated: false,
    isLoading: true,
    user: null,
    accessToken: null,
    refreshToken: null,
    tokenExpiry: null,
    error: null,
    sessionId: null,
  });

  useEffect(() => {
    initializeDevAuth();
  }, []);

  async function initializeDevAuth() {
    try {
      // Check for existing session
      const existingSession = SessionManager.getSession();

      if (existingSession && SessionManager.isSessionValid(existingSession)) {
        setState(prev => ({
          ...prev,
          isAuthenticated: true,
          isLoading: false,
          user: existingSession.user,
          accessToken: existingSession.accessToken,
          refreshToken: existingSession.refreshToken,
          tokenExpiry: existingSession.tokenExpiry,
          sessionId: existingSession.sessionId,
        }));
        SecurityLogger.log("session_restored", { userId: existingSession.user.id });
        return;
      }

      // Dev mode - auto-authenticate with demo user (ONLY when explicitly enabled)
      const demoUser: UserProfile = {
        id: "demo-user-001",
        email: "demo@gov.ae",
        name: "Demo User",
        nameAr: "مستخدم تجريبي",
        entityId: "entity-001",
        entityName: "وزارة المالية",
        role: "entity_admin",
        permissions: ROLE_PERMISSIONS["entity_admin"],
        lastLogin: new Date().toISOString(),
        mfaEnabled: false,
      };

      const sessionId = SessionManager.createSession(demoUser, "demo-token", null, Date.now() + 3600000);
      setState({
        isAuthenticated: true,
        isLoading: false,
        user: demoUser,
        accessToken: "demo-token",
        refreshToken: null,
        tokenExpiry: Date.now() + 3600000,
        error: null,
        sessionId,
      });
    } catch (error) {
      SecurityLogger.log("auth_error", { error: String(error) });
      setState(prev => ({
        ...prev,
        isLoading: false,
        error: "فشل في تهيئة المصادقة",
      }));
    }
  }

  const login = useCallback(async () => {
    await initializeDevAuth();
  }, []);

  const logout = useCallback(async () => {
    SecurityLogger.log("logout", { userId: state.user?.id });
    SessionManager.destroySession();
    setState({
      isAuthenticated: false,
      isLoading: false,
      user: null,
      accessToken: null,
      refreshToken: null,
      tokenExpiry: null,
      error: null,
      sessionId: null,
    });
  }, [state.user]);

  const refreshSession = useCallback(async (): Promise<boolean> => {
    return false;
  }, []);

  const hasPermission = useCallback((permission: Permission): boolean => {
    if (!state.user) return false;
    return state.user.permissions.includes(permission);
  }, [state.user]);

  const hasRole = useCallback((role: UserRole): boolean => {
    if (!state.user) return false;
    const roleHierarchy: Record<UserRole, number> = {
      admin: 5, entity_admin: 4, coordinator: 3, auditor: 2, viewer: 1,
    };
    return roleHierarchy[state.user.role] >= roleHierarchy[role];
  }, [state.user]);

  const isSessionValid = useCallback((): boolean => {
    if (!state.tokenExpiry) return false;
    return Date.now() < state.tokenExpiry;
  }, [state.tokenExpiry]);

  const getAccessToken = useCallback(async (): Promise<string | null> => {
    return state.accessToken;
  }, [state.accessToken]);

  return (
    <AuthContext.Provider value={{
      ...state,
      login,
      logout,
      refreshSession,
      hasPermission,
      hasRole,
      isSessionValid,
      getAccessToken,
    }}>
      {children}
    </AuthContext.Provider>
  );
}

// ─── Unauthorized Page ──────────────────────────────────────────────────────

function UnauthorizedPage({ onLogout }: { onLogout: () => void }) {
  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <div className="max-w-md w-full bg-card rounded-2xl shadow-lg p-8 text-center space-y-6 border border-destructive/30">
        <div className="w-16 h-16 bg-destructive/10 rounded-full flex items-center justify-center mx-auto">
          <svg className="w-8 h-8 text-destructive" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636" />
          </svg>
        </div>
        <div className="space-y-2">
          <h2 className="text-xl font-bold text-foreground">غير مصرح بالوصول</h2>
          <p className="text-muted-foreground text-sm">
            تم تسجيل دخولك بنجاح ولكن حسابك لا يملك الصلاحيات المطلوبة للوصول إلى هذا التطبيق.
          </p>
          <p className="text-muted-foreground text-xs">
            يرجى التواصل مع مسؤول النظام لإضافة المجموعة المناسبة لحسابك في Workspace ONE.
          </p>
        </div>
        <button
          onClick={onLogout}
          className="w-full px-6 py-3 bg-muted text-muted-foreground rounded-xl font-medium hover:bg-muted/80 transition-colors"
        >
          تسجيل الخروج
        </button>
      </div>
    </div>
  );
}

// ─── Hook ────────────────────────────────────────────────────────────────────

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
