import { useEffect, type ReactNode } from "react";
import { useAuth } from "react-oidc-context";
import { authEnabled } from "./oidcConfig";

interface RequireAuthProps {
  children: ReactNode;
}

/**
 * Protected route wrapper.
 *
 * - If auth is disabled (VITE_AUTH_ENABLED=false), renders children directly.
 * - If auth is enabled and user is authenticated, renders children.
 * - If auth is loading, shows a loading indicator.
 * - If there is an auth error, shows a safe error message.
 * - If user is not authenticated, automatically redirects to Workspace ONE login
 *   after storing the current path for post-login redirect.
 */
export function RequireAuth({ children }: RequireAuthProps) {
  if (!authEnabled) {
    return <>{children}</>;
  }

  return <AuthGate>{children}</AuthGate>;
}

function AuthGate({ children }: { children: ReactNode }) {
  const auth = useAuth();

  // Auto-redirect to login when not authenticated
  useEffect(() => {
    if (!auth.isLoading && !auth.isAuthenticated && !auth.activeNavigator && !auth.error) {
      // Store the originally requested path for post-login redirect
      const returnTo = window.location.pathname + window.location.search;
      if (returnTo !== "/callback" && returnTo !== "/auth/callback") {
        sessionStorage.setItem("auth_return_to", returnTo);
      }
      auth.signinRedirect();
    }
  }, [auth.isLoading, auth.isAuthenticated, auth.activeNavigator, auth.error]);

  if (auth.isLoading || auth.activeNavigator) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-background">
        <div className="text-center space-y-4">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto" />
          <p className="text-muted-foreground text-sm">جاري التحقق من الهوية...</p>
        </div>
      </div>
    );
  }

  if (auth.error) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-background">
        <div className="text-center space-y-4 max-w-md px-4">
          <div className="text-destructive text-lg font-semibold">خطأ في المصادقة</div>
          <p className="text-muted-foreground text-sm">
            حدث خطأ أثناء عملية تسجيل الدخول. يرجى المحاولة مرة أخرى.
          </p>
          <p className="text-xs text-muted-foreground/70 font-mono break-all">
            {auth.error.message}
          </p>
          <button
            onClick={() => auth.signinRedirect()}
            className="inline-flex items-center justify-center rounded-md bg-primary px-6 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 transition-colors"
          >
            إعادة المحاولة
          </button>
        </div>
      </div>
    );
  }

  if (!auth.isAuthenticated) {
    // Redirect is in progress (triggered by useEffect above)
    return (
      <div className="flex items-center justify-center min-h-screen bg-background">
        <div className="text-center space-y-4">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto" />
          <p className="text-muted-foreground text-sm">جاري التوجيه لتسجيل الدخول...</p>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
