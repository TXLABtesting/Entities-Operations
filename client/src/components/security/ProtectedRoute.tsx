/**
 * Protected Route Component
 * OWASP Access Control Best Practices
 * SOC 2 - Logical Access Controls
 * 
 * Features:
 * - Route-level authentication enforcement
 * - Role-Based Access Control (RBAC)
 * - Permission-based rendering
 * - Audit logging for access attempts
 */

import { type ReactNode } from "react";
import { useAuth, type Permission, type UserRole } from "@/contexts/AuthContext";
import { SecurityLogger } from "@/lib/security/auditLogger";
import { Shield, Lock, AlertTriangle } from "lucide-react";

interface ProtectedRouteProps {
  children: ReactNode;
  /** Required permission to access this route */
  requiredPermission?: Permission;
  /** Required minimum role */
  requiredRole?: UserRole;
  /** Custom fallback component for unauthorized access */
  fallback?: ReactNode;
  /** Whether to show loading state */
  showLoading?: boolean;
}

/**
 * Wrap routes that require authentication/authorization
 */
export function ProtectedRoute({
  children,
  requiredPermission,
  requiredRole,
  fallback,
  showLoading = true,
}: ProtectedRouteProps) {
  const { isAuthenticated, isLoading, user, hasPermission, hasRole, login } = useAuth();

  // Loading state
  if (isLoading && showLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center space-y-4">
          <div className="w-12 h-12 border-4 border-primary/30 border-t-primary rounded-full animate-spin mx-auto" />
          <p className="text-muted-foreground text-sm">جاري التحقق من الصلاحيات...</p>
        </div>
      </div>
    );
  }

  // Not authenticated
  if (!isAuthenticated) {
    SecurityLogger.log("access_denied", {
      reason: "not_authenticated",
      path: window.location.pathname,
    });

    if (fallback) return <>{fallback}</>;

    return (
      <div className="min-h-screen flex items-center justify-center bg-background p-4">
        <div className="max-w-md w-full bg-card rounded-2xl shadow-lg p-8 text-center space-y-6 border">
          <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto">
            <Lock className="w-8 h-8 text-primary" />
          </div>
          <div className="space-y-2">
            <h2 className="text-xl font-bold text-foreground">تسجيل الدخول مطلوب</h2>
            <p className="text-muted-foreground text-sm">
              يجب تسجيل الدخول للوصول إلى هذه الصفحة
            </p>
          </div>
          <button
            onClick={() => login()}
            className="w-full px-6 py-3 bg-primary text-primary-foreground rounded-xl font-medium hover:bg-primary/90 transition-colors"
          >
            تسجيل الدخول عبر SSO
          </button>
        </div>
      </div>
    );
  }

  // Check role
  if (requiredRole && !hasRole(requiredRole)) {
    SecurityLogger.log("access_denied", {
      reason: "insufficient_role",
      userId: user?.id,
      requiredRole,
      userRole: user?.role,
      path: window.location.pathname,
    });

    if (fallback) return <>{fallback}</>;

    return <AccessDenied reason="role" requiredRole={requiredRole} />;
  }

  // Check permission
  if (requiredPermission && !hasPermission(requiredPermission)) {
    SecurityLogger.log("access_denied", {
      reason: "insufficient_permission",
      userId: user?.id,
      requiredPermission,
      userPermissions: user?.permissions,
      path: window.location.pathname,
    });

    if (fallback) return <>{fallback}</>;

    return <AccessDenied reason="permission" requiredPermission={requiredPermission} />;
  }

  // Authorized - render children
  return <>{children}</>;
}

// ─── Access Denied Component ─────────────────────────────────────────────────

function AccessDenied({
  reason,
  requiredRole,
  requiredPermission,
}: {
  reason: "role" | "permission";
  requiredRole?: UserRole;
  requiredPermission?: Permission;
}) {
  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <div className="max-w-md w-full bg-card rounded-2xl shadow-lg p-8 text-center space-y-6 border">
        <div className="w-16 h-16 bg-destructive/10 rounded-full flex items-center justify-center mx-auto">
          <Shield className="w-8 h-8 text-destructive" />
        </div>
        <div className="space-y-2">
          <h2 className="text-xl font-bold text-foreground">غير مصرح بالوصول</h2>
          <p className="text-muted-foreground text-sm">
            {reason === "role"
              ? `هذه الصفحة تتطلب صلاحية "${getRoleLabel(requiredRole!)}" أو أعلى`
              : `ليس لديك الإذن المطلوب: ${getPermissionLabel(requiredPermission!)}`}
          </p>
        </div>
        <div className="flex items-center gap-2 p-3 bg-amber-50 rounded-lg border border-amber-200">
          <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />
          <p className="text-xs text-amber-700 text-right">
            تم تسجيل محاولة الوصول هذه. إذا كنت تعتقد أن هذا خطأ، يرجى التواصل مع مسؤول النظام.
          </p>
        </div>
        <button
          onClick={() => window.history.back()}
          className="w-full px-6 py-3 bg-muted text-muted-foreground rounded-xl font-medium hover:bg-muted/80 transition-colors"
        >
          العودة للصفحة السابقة
        </button>
      </div>
    </div>
  );
}

// ─── Permission-Based Rendering ──────────────────────────────────────────────

interface PermissionGateProps {
  children: ReactNode;
  permission: Permission;
  fallback?: ReactNode;
}

/**
 * Conditionally render content based on user permission
 * Use for hiding/showing UI elements (buttons, sections)
 */
export function PermissionGate({ children, permission, fallback }: PermissionGateProps) {
  const { hasPermission } = useAuth();

  if (!hasPermission(permission)) {
    return fallback ? <>{fallback}</> : null;
  }

  return <>{children}</>;
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

function getRoleLabel(role: UserRole): string {
  const labels: Record<UserRole, string> = {
    admin: "مسؤول النظام",
    entity_admin: "مسؤول الجهة",
    coordinator: "منسق",
    viewer: "مشاهد",
    auditor: "مدقق",
  };
  return labels[role] || role;
}

function getPermissionLabel(permission: Permission): string {
  const labels: Record<Permission, string> = {
    "workplan:create": "إنشاء خطة عمل",
    "workplan:edit": "تعديل خطة عمل",
    "workplan:view": "عرض خطة عمل",
    "workplan:delete": "حذف خطة عمل",
    "workplan:export": "تصدير خطة عمل",
    "workplan:approve": "اعتماد خطة عمل",
    "team:manage": "إدارة الفرق",
    "team:view": "عرض الفرق",
    "admin:users": "إدارة المستخدمين",
    "admin:settings": "إعدادات النظام",
    "audit:view": "عرض سجل التدقيق",
  };
  return labels[permission] || permission;
}
