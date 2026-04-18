// Global password configuration for Keronshans blog
// Change this password to update all password-protected features at once

export const SITE_PASSWORD = "zues1";
export const AUTH_SESSION_KEY = "keronshans_auth";

export function verifyPassword(input: string): boolean {
  return input === SITE_PASSWORD;
}

export function isAuthenticated(): boolean {
  if (typeof window === "undefined") return false;
  return sessionStorage.getItem(AUTH_SESSION_KEY) === "true";
}

export function setAuthenticated(): void {
  sessionStorage.setItem(AUTH_SESSION_KEY, "true");
}
