import { UserRole } from "@/lib/types";

/** The claim ASP.NET Core writes for ClaimTypes.Role. */
const ROLE_CLAIM = "http://schemas.microsoft.com/ws/2008/06/identity/claims/role";

/**
 * The role baked into a JWT when it was issued. This can lag behind the
 * account: a customer promoted to admin keeps a Customer token until they
 * sign in again, and the API authorizes by the token. Reading the payload
 * here is for UI decisions only; the API still verifies the signature.
 */
export function tokenRole(token: string): UserRole | null {
  try {
    const payload = token.split(".")[1];
    const base64 = payload.replace(/-/g, "+").replace(/_/g, "/").padEnd(Math.ceil(payload.length / 4) * 4, "=");
    const claims = JSON.parse(atob(base64)) as Record<string, unknown>;
    const role = claims[ROLE_CLAIM] ?? claims.role;
    return role === "Admin" || role === "Customer" ? role : null;
  } catch {
    return null;
  }
}
