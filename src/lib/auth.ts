export const AUTH_SESSION_KEY = "keronshans_auth";

export async function verifyPassword(input: string): Promise<boolean> {
  const password = input.trim();
  if (!password || typeof window === "undefined") return false;

  try {
    const res = await fetch("/api/auth/admin", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ password }),
      cache: "no-store",
    });
    return res.ok;
  } catch {
    return false;
  }
}

async function verifySession(): Promise<boolean> {
  if (typeof window === "undefined") return false;
  try {
    const res = await fetch("/api/auth/admin", { cache: "no-store" });
    return res.ok;
  } catch {
    return false;
  }
}

export function isAuthenticated(): boolean {
  if (typeof window === "undefined") return false;
  return sessionStorage.getItem(AUTH_SESSION_KEY) === "true";
}

export function setAuthenticated(): void {
  sessionStorage.setItem(AUTH_SESSION_KEY, "true");
}

export function clearAuthenticated(): void {
  if (typeof window === "undefined") return;
  sessionStorage.removeItem(AUTH_SESSION_KEY);
}

export function setAdminPassword(_password: string): void {
  // Passwords are intentionally not persisted client-side.
}

export function getAdminPassword(): string {
  return "";
}

export async function restoreAuthenticatedPassword(): Promise<string> {
  if (!isAuthenticated()) return "";

  if (await verifySession()) return "session";

  clearAuthenticated();
  return "";
}

export async function logoutAdmin(): Promise<void> {
  clearAuthenticated();
  try {
    await fetch("/api/auth/admin", { method: "DELETE", cache: "no-store" });
  } catch {}
}
