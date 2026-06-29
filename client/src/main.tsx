import { createRoot } from "react-dom/client";
import { AppAuthProvider } from "@/auth/AuthProvider";
import App from "./App";
import "./index.css";
import { applySecurityHeaders } from "@/lib/security/cspConfig";

// Initialize security headers (OWASP CSP + X-Frame-Options + Referrer-Policy)
applySecurityHeaders();

createRoot(document.getElementById("root")!).render(
  <AppAuthProvider>
    <App />
  </AppAuthProvider>
);
