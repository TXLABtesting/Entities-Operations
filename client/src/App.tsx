import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/NotFound";
import { Route, Switch, Router as WouterRouter } from "wouter";
import ErrorBoundary from "./components/ErrorBoundary";
import { ThemeProvider } from "./contexts/ThemeContext";
import { AuthProvider } from "./contexts/AuthContext";
import { RequireAuth } from "@/auth/RequireAuth";
import { authEnabled, demoAuthEnabled } from "@/auth/oidcConfig";
import Home from "./pages/Home";
import Tracks from "./pages/Tracks";
import TracksList from "./pages/TracksList";
import WorkPlan from "./pages/WorkPlan";
import ReviewEdit from "./pages/ReviewEdit";
import { AdminLayout, UsersManagement, EntitiesManagement, RolesManagement, AuditLogs } from "./pages/admin";
import { RequireAdmin } from "@/components/security/RequireAdmin";

/**
 * OIDC callback route - remains public.
 * Shows loading while react-oidc-context processes the authorization code.
 * After processing, onSigninCallback in AppAuthProvider handles the redirect.
 */
function OidcCallback() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <div className="text-center space-y-4">
        <div className="w-12 h-12 border-4 border-primary/30 border-t-primary rounded-full animate-spin mx-auto" />
        <p className="text-muted-foreground text-sm">جاري تسجيل الدخول...</p>
      </div>
    </div>
  );
}

/**
 * All application routes wrapped in a single RequireAuth gate.
 * When VITE_AUTH_ENABLED=true, ALL routes require Workspace ONE login.
 * Only /callback and /auth/callback remain public (handled outside this wrapper).
 */
function ProtectedRoutes() {
  return (
    <RequireAuth>
      <Switch>
        <Route path={"/"} component={Home} />
        <Route path={"/tracks"} component={Tracks} />
        <Route path={"/tracks-list"} component={TracksList} />
        <Route path={"/workplan/:trackId"} component={WorkPlan} />
        <Route path={"/review/:trackId"} component={ReviewEdit} />
        <Route path={"/admin/users"}>{() => <RequireAdmin><AdminLayout><UsersManagement /></AdminLayout></RequireAdmin>}</Route>
        <Route path={"/admin/entities"}>{() => <RequireAdmin><AdminLayout><EntitiesManagement /></AdminLayout></RequireAdmin>}</Route>
        <Route path={"/admin/roles"}>{() => <RequireAdmin><AdminLayout><RolesManagement /></AdminLayout></RequireAdmin>}</Route>
        <Route path={"/admin/audit"}>{() => <RequireAdmin><AdminLayout><AuditLogs /></AdminLayout></RequireAdmin>}</Route>
        <Route path={"/admin"}>{() => <RequireAdmin><AdminLayout><UsersManagement /></AdminLayout></RequireAdmin>}</Route>
        <Route path={"/404"} component={NotFound} />
        <Route component={NotFound} />
      </Switch>
    </RequireAuth>
  );
}

function Router() {
  return (
    <Switch>
      {/* Public routes: OIDC callback endpoints */}
      <Route path={"/callback"} component={OidcCallback} />
      <Route path={"/auth/callback"} component={OidcCallback} />
      {/* All other routes are protected */}
      <Route>{() => <ProtectedRoutes />}</Route>
    </Switch>
  );
}

function App() {
  return (
    <ErrorBoundary>
      <ThemeProvider defaultTheme="light" switchable={false}>
        <AuthProvider devMode={!authEnabled && demoAuthEnabled}>
          <TooltipProvider>
            <Toaster />
            <WouterRouter base={import.meta.env.BASE_URL.replace(/\/$/, "")}>
              <Router />
            </WouterRouter>
          </TooltipProvider>
        </AuthProvider>
      </ThemeProvider>
    </ErrorBoundary>
  );
}

export default App;
