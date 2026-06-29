/**
 * Role/Group Claims Mapping for Workspace ONE / Omnissa Access
 *
 * This file contains the EXPLICIT role mapping from Workspace ONE group claims
 * to internal application roles. NO fuzzy/substring matching is used.
 *
 * When the final Workspace ONE group names are confirmed by the identity team,
 * update the WORKSPACE_ONE_ROLE_MAP below.
 */

import type { UserRole } from "@/contexts/AuthContext";

// ─── Explicit Role Mapping ───────────────────────────────────────────────────
// Keys are the EXACT group/role claim values from Workspace ONE.
// Values are the internal application roles.
// Update these when the identity team provides the final group names.

export const WORKSPACE_ONE_ROLE_MAP: Record<string, UserRole> = {
  "WORK_PLAN_ADMIN": "admin",
  "WORK_PLAN_ENTITY_ADMIN": "entity_admin",
  "WORK_PLAN_COORDINATOR": "coordinator",
  "WORK_PLAN_VIEWER": "viewer",
  "WORK_PLAN_AUDITOR": "auditor",
};

// ─── Claim Names ─────────────────────────────────────────────────────────────
// The claim names where Workspace ONE may send group/role information.
// These are checked in order; the first match wins.

const GROUP_CLAIM_NAMES = ["groups", "group", "roles", "role", "memberOf"];

// ─── Types ───────────────────────────────────────────────────────────────────

type OidcProfile = Record<string, unknown>;

// ─── Public API ──────────────────────────────────────────────────────────────

/**
 * Extract an array-valued claim from the profile.
 * Handles cases where the claim is:
 * - An array of strings
 * - A single string (returns as single-element array)
 * - Missing or undefined (returns empty array)
 */
export function getClaimArray(
  profile: OidcProfile | undefined | null,
  claimName: string
): string[] {
  if (!profile) return [];

  const value = profile[claimName];

  if (Array.isArray(value)) {
    return value.filter((v): v is string => typeof v === "string");
  }

  if (typeof value === "string") {
    return [value];
  }

  return [];
}

/**
 * Map OIDC profile claims to an internal UserRole using EXPLICIT matching only.
 *
 * Returns the matched role, or null if no valid role claim is found.
 * When null is returned, the caller MUST treat the user as unauthorized
 * (fail closed - do NOT default to any elevated role).
 */
export function mapProfileToRole(profile: OidcProfile | undefined | null): UserRole | null {
  if (!profile) return null;

  for (const claimName of GROUP_CLAIM_NAMES) {
    const claims = getClaimArray(profile, claimName);

    for (const claim of claims) {
      const mappedRole = WORKSPACE_ONE_ROLE_MAP[claim];
      if (mappedRole) {
        return mappedRole;
      }
    }
  }

  // No valid role found - fail closed
  return null;
}

/**
 * Get all groups/roles from the profile (for debugging/audit purposes).
 * Merges values from all known group claim names.
 */
export function getAllGroups(
  profile: OidcProfile | undefined | null
): string[] {
  if (!profile) return [];

  const allGroups = new Set<string>();

  for (const claimName of GROUP_CLAIM_NAMES) {
    const groups = getClaimArray(profile, claimName);
    groups.forEach((g) => allGroups.add(g));
  }

  return Array.from(allGroups);
}

/**
 * Check if the user belongs to a specific group (exact match).
 */
export function hasGroup(
  profile: OidcProfile | undefined | null,
  groupName: string
): boolean {
  if (!profile) return false;

  for (const claimName of GROUP_CLAIM_NAMES) {
    const groups = getClaimArray(profile, claimName);
    if (groups.includes(groupName)) {
      return true;
    }
  }

  return false;
}
