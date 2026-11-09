/**
 * Where to send the user after signing in. Only same-site paths are allowed,
 * so a crafted `?next=https://evil.example` link can't bounce users off-site.
 */
export function safeRedirectPath(next: string | string[] | undefined): string {
  const value = Array.isArray(next) ? next[0] : next;
  if (!value || !value.startsWith("/") || value.startsWith("//") || value.startsWith("/\\")) {
    return "/";
  }
  return value;
}
