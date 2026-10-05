import { createRemoteJWKSet, jwtVerify } from "jose";

const verifiers = new Map<string, ReturnType<typeof createRemoteJWKSet>>();

export async function authenticateAccess(request: Request): Promise<boolean> {
  if (process.env.PRODUCTION_ADMIN_ENABLED !== "true") return false;
  const team = process.env.ACCESS_TEAM_DOMAIN || "";
  const audience = process.env.ACCESS_AUD || "";
  const subjects = (process.env.ACCESS_ADMIN_SUBJECTS || "").split(",").map((value) => value.trim()).filter(Boolean);
  if (!/^[a-z0-9-]+\.cloudflareaccess\.com$/.test(team) || !audience || !subjects.length) return false;
  const token = request.headers.get("cf-access-jwt-assertion") ||
    request.headers.get("cookie")?.split(";").map((item) => item.trim()).find((item) => item.startsWith("CF_Authorization="))?.slice("CF_Authorization=".length) || "";
  if (!token || token.length > 16384) return false;
  try {
    if (!verifiers.has(team)) verifiers.set(team, createRemoteJWKSet(new URL(`https://${team}/cdn-cgi/access/certs`), { timeoutDuration: 5000 }));
    const { payload } = await jwtVerify(token, verifiers.get(team)!, { issuer: `https://${team}`, audience, algorithms: ["RS256"], requiredClaims: ["sub", "exp", "iat"] });
    return typeof payload.sub === "string" && subjects.includes(payload.sub);
  } catch { return false; }
}
