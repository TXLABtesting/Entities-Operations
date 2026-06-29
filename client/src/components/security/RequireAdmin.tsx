/**
 * RequireAdmin - Protects admin routes based on user permissions.
 * Only users with 'admin:users' or 'admin:settings' permission can access admin pages.
 * Others see an access denied page.
 */
import { useAuth } from "@/contexts/AuthContext";
import { useLocation } from "wouter";
import { ShieldX } from "lucide-react";
import { Button } from "@/components/ui/button";

interface RequireAdminProps {
  children: React.ReactNode;
}

export function RequireAdmin({ children }: RequireAdminProps) {
  const { user, hasPermission, hasRole } = useAuth();
  const [, setLocation] = useLocation();

  // Allow access if user has admin permissions or admin/entity_admin role
  const isAdmin = hasPermission("admin:users") || hasPermission("admin:settings") || hasRole("admin");

  if (!isAdmin) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background p-4" dir="rtl">
        <div className="max-w-md w-full bg-card rounded-2xl shadow-lg p-8 text-center space-y-6 border border-destructive/20">
          <div className="w-16 h-16 bg-destructive/10 rounded-full flex items-center justify-center mx-auto">
            <ShieldX className="w-8 h-8 text-destructive" />
          </div>
          <div className="space-y-2">
            <h2 className="text-xl font-bold text-foreground">غير مصرح بالوصول</h2>
            <p className="text-muted-foreground text-sm">
              ليس لديك الصلاحيات المطلوبة للوصول إلى لوحة الإدارة.
            </p>
            {user && (
              <p className="text-xs text-muted-foreground mt-2">
                الدور الحالي: <span className="font-mono bg-muted px-1.5 py-0.5 rounded">{user.role}</span>
              </p>
            )}
          </div>
          <Button onClick={() => setLocation("/")} variant="outline" className="w-full">
            العودة للرئيسية
          </Button>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
