export function getAdminPassword(): string {
  return process.env.ADMIN_PASSWORD || "";
}

export function authenticateAdmin(request: Request): boolean {
  const password = getAdminPassword();
  if (!password) return false;
  return request.headers.get("x-admin-password") === password;
}
