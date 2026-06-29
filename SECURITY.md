# Security Architecture - Work Plan Portal

## Overview

This document outlines the security architecture implemented in the Work Plan Portal, aligned with **OWASP Top 10 (2021)**, **SOC 2 Type II**, and **UAE Information Assurance Standards (IAS)**.

---

## SSO Integration

The portal supports enterprise Single Sign-On (SSO) via OAuth 2.1 with PKCE (Proof Key for Code Exchange).

### Configuration

Set the following environment variables for SSO integration:

| Variable | Description | Example |
|----------|-------------|---------|
| `VITE_SSO_CLIENT_ID` | OAuth2 Client ID | `workplan-portal-prod` |
| `VITE_SSO_AUTHORITY` | Identity Provider URL | `https://login.microsoftonline.com/{tenant}` |
| `VITE_SSO_REDIRECT_URI` | Callback URL | `https://portal.gov.ae/auth/callback` |
| `VITE_SSO_LOGOUT_URI` | Post-logout redirect | `https://portal.gov.ae/` |
| `VITE_SSO_TOKEN_ENDPOINT` | Token endpoint | `https://login.microsoftonline.com/{tenant}/oauth2/v2.0/token` |
| `VITE_SSO_USERINFO_ENDPOINT` | User info endpoint | `https://graph.microsoft.com/v1.0/me` |

### Supported Providers

The SSO module is designed to work with:

- **Microsoft Entra ID** (Azure AD) - Recommended for UAE government entities
- **Okta** / **Auth0** - Enterprise identity platforms
- **Keycloak** - Open-source identity management
- **Custom OIDC** - Any OpenID Connect compliant provider

### Authentication Flow

1. User clicks "تسجيل الدخول عبر SSO"
2. PKCE code verifier and challenge are generated client-side
3. Browser redirects to Identity Provider with code challenge
4. User authenticates (with MFA if configured)
5. IdP redirects back with authorization code
6. Client exchanges code + verifier for tokens (no client secret exposed)
7. Access token used for API calls; refresh token for silent renewal
8. Session created with encrypted storage and fingerprinting

### Dev Mode

Set `devMode={true}` in `AuthProvider` (App.tsx) to bypass SSO during development. A demo user with `entity_admin` role is automatically created.

---

## OWASP Top 10 Coverage

### A01: Broken Access Control

**Implementation:** Role-Based Access Control (RBAC) with five roles:

| Role | Arabic | Permissions |
|------|--------|-------------|
| `admin` | مسؤول النظام | Full system access |
| `entity_admin` | مسؤول الجهة | Full entity access + approval |
| `coordinator` | منسق | Create/edit/view work plans |
| `viewer` | مشاهد | View-only access |
| `auditor` | مدقق | View + audit log access |

**Components:**
- `ProtectedRoute` - Route-level access enforcement
- `PermissionGate` - Component-level conditional rendering
- `useAuth().hasPermission()` - Programmatic permission checks

### A02: Cryptographic Failures

**Implementation:** AES-256 encryption for sensitive localStorage data via `SecureStorage`:
- All session data encrypted at rest
- HMAC-SHA256 integrity verification prevents tampering
- Browser fingerprint-derived encryption keys
- No sensitive data in URL parameters

### A03: Injection (XSS/SQLi)

**Implementation:** Multi-layer input sanitization via `InputSanitizer`:
- DOMPurify for HTML content sanitization
- Pattern-based XSS detection (15+ attack vectors)
- SQL injection pattern detection
- Input length enforcement
- Null byte and control character stripping
- Arabic text preserved while blocking malicious content

### A04: Insecure Design

**Implementation:** Security-by-default architecture:
- All routes protected by default (explicit public routes only)
- Input validation at component level
- Rate limiting on sensitive actions
- Secure defaults for all configuration

### A05: Security Misconfiguration

**Implementation:** Content Security Policy (CSP) + Security Headers:
- `Content-Security-Policy` - Restricts resource loading
- `X-Frame-Options: DENY` - Prevents clickjacking
- `X-Content-Type-Options: nosniff` - Prevents MIME sniffing
- `Referrer-Policy: strict-origin-when-cross-origin`
- `Permissions-Policy` - Disables unused browser APIs

### A07: Identification and Authentication Failures

**Implementation:** Enterprise-grade session management:
- OAuth 2.1 with PKCE (no implicit flow)
- Automatic token refresh before expiry
- 30-minute idle session timeout
- 8-hour absolute session timeout
- Session fingerprinting (anti-hijack)
- Concurrent session detection
- Secure session storage with encryption

### A08: Software and Data Integrity Failures

**Implementation:** Data integrity verification:
- HMAC-SHA256 on all stored data
- Tamper detection with automatic invalidation
- Audit trail for all data modifications
- Subresource Integrity (SRI) support for external resources

### A09: Security Logging and Monitoring Failures

**Implementation:** Comprehensive audit logging via `SecurityLogger`:
- All authentication events logged
- Access control decisions recorded
- Data access/modification tracked
- Security incidents flagged with severity levels
- Log retention policy (90 days)
- Export capability for compliance reporting

---

## SOC 2 Type II Controls

| Control | Requirement | Implementation |
|---------|-------------|----------------|
| CC6.1 | Logical Access | RBAC + ProtectedRoute |
| CC6.2 | Authentication | SSO + PKCE + MFA support |
| CC6.3 | Authorization | Permission matrix + role hierarchy |
| CC6.6 | Encryption | AES-256 at rest, TLS in transit |
| CC7.1 | Monitoring | Audit Logger with severity classification |
| CC7.2 | Detection | Pattern-based threat detection |
| CC7.3 | Response | Auto-logout + session invalidation |
| CC8.1 | Change Management | Audit trail for data changes |

---

## File Structure

```
client/src/
├── contexts/
│   └── AuthContext.tsx          # SSO authentication + RBAC
├── components/
│   └── security/
│       └── ProtectedRoute.tsx   # Route protection + PermissionGate
└── lib/
    └── security/
        ├── index.ts             # Central exports
        ├── auditLogger.ts       # SOC 2 audit trail
        ├── sessionManager.ts    # Secure session handling
        ├── secureStorage.ts     # Encrypted localStorage
        ├── inputSanitizer.ts    # XSS/SQLi prevention
        └── cspConfig.ts         # CSP + security headers
```

---

## Production Deployment Checklist

1. Set `devMode={false}` in AuthProvider
2. Configure all `VITE_SSO_*` environment variables
3. Replace CSP `'unsafe-inline'` with nonce-based script loading
4. Enable server-side security headers (not just meta tags)
5. Configure CORS whitelist on API server
6. Enable MFA requirement on Identity Provider
7. Set up log forwarding to SIEM (e.g., Splunk, Azure Sentinel)
8. Schedule regular dependency vulnerability scans
9. Configure session timeout values per security policy
10. Enable rate limiting on authentication endpoints

---

## Testing Security

```bash
# Run OWASP ZAP scan
docker run -t owasp/zap2docker-stable zap-baseline.py -t https://your-portal-url

# Check CSP headers
curl -I https://your-portal-url | grep -i "content-security"

# Verify security headers
npx is-website-vulnerable https://your-portal-url
```
