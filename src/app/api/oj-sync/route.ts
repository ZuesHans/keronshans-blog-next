import { NextResponse } from "next/server";
import { getCloudflareContext } from "@opennextjs/cloudflare";

interface SyncDailyStat {
  date?: unknown;
  totalDelta?: unknown;
}

interface SyncProblem {
  id?: unknown;
  title?: unknown;
  url?: unknown;
  platform?: unknown;
  status?: unknown;
  tags?: unknown;
  date?: unknown;
  note?: unknown;
  analysis?: unknown;
  updated_at?: unknown;
}

interface SyncPayload {
  schemaVersion?: unknown;
  app?: unknown;
  syncedAt?: unknown;
  dailyStats?: unknown;
  problems?: unknown;
}

function getBearerToken(request: Request): string {
  const header = request.headers.get("authorization") || "";
  const match = /^Bearer\s+(.+)$/i.exec(header.trim());
  return match?.[1]?.trim() || "";
}

function isAuthorized(request: Request): boolean {
  const expected = process.env.OJ_SYNC_TOKEN || "";
  if (!expected) return false;
  return getBearerToken(request) === expected;
}

function isDateKey(value: unknown): value is string {
  return typeof value === "string" && /^\d{4}-\d{2}-\d{2}$/.test(value);
}

function safeString(value: unknown, fallback = ""): string {
  return typeof value === "string" ? value.trim() : fallback;
}

function safeTags(value: unknown): string {
  if (!Array.isArray(value)) return "[]";
  return JSON.stringify(value.filter((item) => typeof item === "string").map((item) => item.trim()).filter(Boolean));
}

export async function POST(request: Request) {
  if (!isAuthorized(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const payload = (await request.json()) as SyncPayload;
    if (payload.schemaVersion !== 1 || payload.app !== "oj_float") {
      return NextResponse.json({ error: "Unsupported payload" }, { status: 400 });
    }

    const { env } = await getCloudflareContext({ async: true });
    const syncedAt = safeString(payload.syncedAt, new Date().toISOString());

    if (Array.isArray(payload.dailyStats)) {
      for (const item of payload.dailyStats as SyncDailyStat[]) {
        if (!isDateKey(item.date) || typeof item.totalDelta !== "number" || item.totalDelta < 0) continue;
        await env.DB.prepare(
          "INSERT OR REPLACE INTO oj_daily_stats (date, total_delta, updated_at) VALUES (?, ?, ?)"
        ).bind(item.date, Math.floor(item.totalDelta), syncedAt).run();
      }
    }

    if (Array.isArray(payload.problems)) {
      for (const item of payload.problems as SyncProblem[]) {
        const id = safeString(item.id);
        const title = safeString(item.title);
        const url = safeString(item.url);
        if (!id || !title || !url) continue;
        await env.DB.prepare(
          `INSERT OR REPLACE INTO oj_synced_problems
            (id, title, url, platform, status, tags, date, note, analysis, updated_at, synced_at)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
        ).bind(
          id,
          title,
          url,
          safeString(item.platform, "other"),
          safeString(item.status, "TODO"),
          safeTags(item.tags),
          isDateKey(item.date) ? item.date : "",
          safeString(item.note),
          safeString(item.analysis),
          safeString(item.updated_at, syncedAt),
          syncedAt
        ).run();
      }
    }

    return NextResponse.json({ success: true });
  } catch {
    console.error("POST /api/oj-sync error: safe server error");
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
