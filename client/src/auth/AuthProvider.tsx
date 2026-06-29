import { type ReactNode } from "react";
import { AuthProvider as OidcAuthProvider } from "react-oidc-context";
import { authEnabled, oidcConfig, oidcConfigError } from "./oidcConfig";

interface AppAuthProviderProps {
  children: ReactNode;
}

/**
 * Conditional OIDC Auth Provider.
 *
 * When authEnabled is false, children render without any auth wrapper.
 * When authEnabled is true:
 *   - If required config is missing, shows a configuration error page.
 *   - Otherwise wraps children with the OIDC AuthProvider configured for
 *     Workspace ONE / Omnissa Access.
 */
export function AppAuthProvider({ children }: AppAuthProviderProps) {
  if (!authEnabled) {
    return <>{children}</>;
  }

  // Show config error if required OIDC variables are missing
  if (oidcConfigError) {
    return <OidcConfigErrorPage error={oidcConfigError} />;
  }

  return (
    <OidcAuthProvider
      {...oidcConfig}
      onSigninCallback={() => {
        // Remove OIDC query params from the URL after callback processing
        // Then redirect to the originally requested route
        const returnTo = sessionStorage.getItem("auth_return_to") || "/";
        sessionStorage.removeItem("auth_return_to");
        window.history.replaceState({}, document.title, returnTo);
      }}
    >
      {children}
    </OidcAuthProvider>
  );
}

// ─── Config Error Page ──────────────────────────────────────────────────────

function OidcConfigErrorPage({ error }: { error: { missing: string[]; message: string } }) {
  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <div className="max-w-lg w-full bg-card rounded-2xl shadow-lg p-8 text-center space-y-6 border border-destructive/30">
        <div className="w-16 h-16 bg-destructive/10 rounded-full flex items-center justify-center mx-auto">
          <svg className="w-8 h-8 text-destructive" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-2.694-.833-3.464 0L3.34 16.5c-.77.833.192 2.5 1.732 2.5z" />
          </svg>
        </div>
        <div className="space-y-2">
          <h2 className="text-xl font-bold text-foreground">خطأ في إعدادات المصادقة</h2>
          <p className="text-muted-foreground text-sm">
            المصادقة مفعّلة ولكن الإعدادات المطلوبة غير مكتملة.
          </p>
        </div>
        <div className="text-right bg-muted/50 rounded-lg p-4 space-y-2">
          <p className="text-xs font-medium text-foreground">المتغيرات المفقودة:</p>
          <ul className="text-xs text-muted-foreground font-mono space-y-1">
            {error.missing.map((v) => (
              <li key={v} className="text-destructive">• {v}</li>
            ))}
          </ul>
        </div>
        <p className="text-xs text-muted-foreground">
          يرجى التواصل مع فريق DevOps لإضافة المتغيرات المطلوبة في ملف .env قبل بناء التطبيق.
        </p>
      </div>
    </div>
  );
}
