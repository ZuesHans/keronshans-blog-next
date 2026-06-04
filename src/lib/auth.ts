export const AUTH_SESSION_KEY = "keronshans_auth";
export const AUTH_PASSWORD_KEY = "keronshans_admin_password";

export function verifyPassword(input: string): boolean {
  return input.trim().length > 0;
}

export function isAuthenticated(): boolean {
  if (typeof window === "undefined") return false;
  return sessionStorage.getItem(AUTH_SESSION_KEY) === "true";
}

export function setAuthenticated(): void {
  sessionStorage.setItem(AUTH_SESSION_KEY, "true");
}

export function setAdminPassword(password: string): void {
  sessionStorage.setItem(AUTH_PASSWORD_KEY, password);
}

export function getAdminPassword(): string {
  if (typeof window === "undefined") return "";
  return sessionStorage.getItem(AUTH_PASSWORD_KEY) || "";
}
