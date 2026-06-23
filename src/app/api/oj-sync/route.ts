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
  dailyStats?: unknown;
  problems?: unknown;
}

interface ValidDailyStat {
  date: string;
  totalDelta: number;
}

interface ValidProblem {
  id: string;
  title: string;
  url: string;
  platform: string;
  status: string;
  tags: string;
  date: string;
  note: string;
  analysis: string;
  updatedAt: string;
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

function safeIsoTime(value: unknown, fallback: string): string {
  if (typeof value !== "string") return fallback;
  const time = Date.parse(value);
  const fallbackTime = Date.parse(fallback);
  if (!Number.isFinite(time)) return fallback;
  if (Number.isFinite(fallbackTime) && time > fallbackTime) return fallback;
  return new Date(time).toISOString();
}

function parseDailyStats(value: unknown): ValidDailyStat[] {
  if (!Array.isArray(value)) return [];
  const rows: ValidDailyStat[] = [];
  for (const item of value as SyncDailyStat[]) {
    if (!isDateKey(item.date) || typeof item.totalDelta !== "number" || item.totalDelta < 0) continue;
    rows.push({ date: item.date, totalDelta: Math.floor(item.totalDelta) });
  }
  return rows;
}

function parseProblems(value: unknown, fallbackTime: string): ValidProblem[] {
  if (!Array.isArray(value)) return [];
  const rows: ValidProblem[] = [];
  for (const item of value as SyncProblem[]) {
    const id = safeString(item.id);
    const title = safeString(item.title);
    const url = safeString(item.url);
    if (!id || !title || !url) continue;
    rows.push({
      id,
      title,
      url,
      platform: safeString(item.platform, "other"),
      status: safeString(item.status, "TODO"),
      tags: safeTags(item.tags),
      date: isDateKey(item.date) ? item.date : "",
      note: safeString(item.note),
      analysis: safeString(item.analysis),
      updatedAt: safeIsoTime(item.updated_at, fallbackTime),
    });
  }
  return rows;
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
    const serverSyncedAt = new Date().toISOString();
    const dailyStats = parseDailyStats(payload.dailyStats);
    const problems = parseProblems(payload.problems, serverSyncedAt);

    await env.DB.batch([
      env.DB.prepare("DELETE FROM oj_daily_stats"),
      ...dailyStats.map((item) =>
        env.DB.prepare(
          "INSERT INTO oj_daily_stats (date, total_delta, updated_at) VALUES (?, ?, ?)"
        ).bind(item.date, item.totalDelta, serverSyncedAt)
      ),
      env.DB.prepare("DELETE FROM oj_synced_problems"),
      ...problems.map((item) =>
        env.DB.prepare(
          `INSERT OR REPLACE INTO oj_synced_problems
            (id, title, url, platform, status, tags, date, note, analysis, updated_at, synced_at)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
        ).bind(
          item.id,
          item.title,
          item.url,
          item.platform,
          item.status,
          item.tags,
          item.date,
          item.note,
          item.analysis,
          item.updatedAt,
          serverSyncedAt
        )
      ),
    ]);

    return NextResponse.json({ success: true });
  } catch {
    console.error("POST /api/oj-sync error: safe server error");
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
