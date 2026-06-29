import { useAuth } from "react-oidc-context";
import { authEnabled } from "./oidcConfig";

export interface CurrentUser {
  isAuthenticated: boolean;
  name?: string;
  email?: string;
  claims?: Record<string, unknown>;
}

/**
 * Hook to get the current authenticated user's normalized profile.
 *
 * When auth is disabled, returns { isAuthenticated: false }.
 * When auth is enabled, reads from the OIDC user profile defensively.
 */
export function useCurrentUser(): CurrentUser {
  if (!authEnabled) {
    return { isAuthenticated: false };
  }

  // eslint-disable-next-line react-hooks/rules-of-hooks
  return useCurrentUserInternal();
}

function useCurrentUserInternal(): CurrentUser {
  const auth = useAuth();

  if (!auth.isAuthenticated || !auth.user) {
    return { isAuthenticated: false };
  }

  const profile = auth.user.profile;

  // Resolve name defensively from standard OIDC claims
  const name =
    (profile.name as string) ||
    (profile.given_name as string) ||
    (profile.preferred_username as string) ||
    (profile.email as string) ||
    (profile.sub as string) ||
    undefined;

  const email = (profile.email as string) || undefined;

  return {
    isAuthenticated: true,
    name,
    email,
    claims: profile as unknown as Record<string, unknown>,
  };
}
