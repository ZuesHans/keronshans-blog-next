import fs from "fs";
import path from "path";
import { CONTENT_ROOT } from "./contentRoot";
import { getSnapshotRegistry, hasGeneratedContentSnapshot } from "./contentSnapshot";

export interface ContentRegistryEntry {
  kind: "post" | "snippet";
  id: string;
  canonicalPath: string;
  aliases: string[];
  state: "active" | "withdrawn";
}

export interface ContentRegistry {
  schemaVersion: 1;
  siteId: "keronshans";
  entries: ContentRegistryEntry[];
}

export function readContentRegistry(): ContentRegistry | null {
  if (hasGeneratedContentSnapshot()) {
    const snapshot = getSnapshotRegistry();
    if (!snapshot || typeof snapshot !== "object") return null;
    const value = snapshot as ContentRegistry;
    if (value.schemaVersion !== 1 || value.siteId !== "keronshans" || !Array.isArray(value.entries)) return null;
    return value;
  }
  const filePath = path.join(CONTENT_ROOT, "content-registry.json");
  if (!fs.existsSync(filePath)) return null;
  try {
    const value = JSON.parse(fs.readFileSync(filePath, "utf8")) as ContentRegistry;
    if (value.schemaVersion !== 1 || value.siteId !== "keronshans" || !Array.isArray(value.entries)) return null;
    return value;
  } catch {
    return null;
  }
}

export function resolveContentRoute(pathname: string) {
  const registry = readContentRegistry();
  if (!registry) return { kind: "not-found" as const, status: 404 as const };
  let normalized = pathname.startsWith("/") ? pathname : `/${pathname}`;
  try { normalized = decodeURIComponent(normalized); } catch { return { kind: "not-found" as const, status: 404 as const }; }
  const entry = registry.entries.find((item) => item.canonicalPath === normalized || item.aliases.includes(normalized));
  if (!entry) return { kind: "not-found" as const, status: 404 as const };
  if (entry.state === "withdrawn") return { kind: "gone" as const, status: 410 as const, contentId: entry.id };
  if (entry.canonicalPath === normalized) return { kind: "canonical" as const, status: 200 as const, contentId: entry.id };
  return { kind: "redirect" as const, status: 308 as const, contentId: entry.id, location: entry.canonicalPath };
}
