import { NextResponse } from "next/server";
import { getCloudflareContext } from "@opennextjs/cloudflare";
import { checkRateLimit } from "@/lib/rateLimit";

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

const MAX_BODY_BYTES = 512 * 1024;
const MAX_DAILY_STATS = 400;
const MAX_PROBLEMS = 500;
const MAX_TAGS = 20;

function getBearerToken(request: Request): string {
  const header = request.headers.get("authorization") || "";
  const match = /^Bearer\s+(.+)$/i.exec(header.trim());
  return match?.[1]?.trim() || "";
}

function timingSafeEqual(a: string, b: string): boolean {
  const length = Math.max(a.length, b.length);
  let diff = a.length ^ b.length;
  for (let i = 0; i < length; i += 1) {
    diff |= (a.charCodeAt(i) || 0) ^ (b.charCodeAt(i) || 0);
  }
  return diff === 0;
}

function isAuthorized(request: Request): boolean {
  const expected = process.env.OJ_SYNC_TOKEN || "";
  if (!expected) return false;
  return timingSafeEqual(getBearerToken(request), expected);
}

function isDateKey(value: unknown): value is string {
  return typeof value === "string" && /^\d{4}-\d{2}-\d{2}$/.test(value);
}

function safeString(value: unknown, fallback = "", maxLength = 200): string {
  return typeof value === "string" ? value.trim().slice(0, maxLength) : fallback;
}

function safeTags(value: unknown): string {
  if (!Array.isArray(value)) return "[]";
  return JSON.stringify(
    value
      .filter((item) => typeof item === "string")
      .map((item) => item.trim().slice(0, 40))
      .filter(Boolean)
      .slice(0, MAX_TAGS),
  );
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
  if (value.length > MAX_DAILY_STATS) throw new Error("Too many daily stats");
  const rows: ValidDailyStat[] = [];
  for (const item of value as SyncDailyStat[]) {
    if (!isDateKey(item.date) || typeof item.totalDelta !== "number" || item.totalDelta < 0) continue;
    rows.push({ date: item.date, totalDelta: Math.floor(item.totalDelta) });
  }
  return rows;
}

function parseProblems(value: unknown, fallbackTime: string): ValidProblem[] {
  if (!Array.isArray(value)) return [];
  if (value.length > MAX_PROBLEMS) throw new Error("Too many problems");
  const rows: ValidProblem[] = [];
  for (const item of value as SyncProblem[]) {
    const id = safeString(item.id, "", 120);
    const title = safeString(item.title, "", 200);
    const url = safeString(item.url, "", 500);
    if (!id || !title || !url) continue;
    rows.push({
      id,
      title,
      url,
      platform: safeString(item.platform, "other", 40),
      status: safeString(item.status, "TODO", 20),
      tags: safeTags(item.tags),
      date: isDateKey(item.date) ? item.date : "",
      note: safeString(item.note, "", 1000),
      analysis: safeString(item.analysis, "", 4000),
      updatedAt: safeIsoTime(item.updated_at, fallbackTime),
    });
  }
  return rows;
}

function tooLarge() {
  return NextResponse.json({ error: "Payload too large" }, { status: 413 });
}

function rateLimited(retryAfter: number) {
  return NextResponse.json(
    { error: "Too many requests" },
    { status: 429, headers: { "Retry-After": String(retryAfter) } },
  );
}

export async function POST(request: Request) {
  const limit = checkRateLimit(request, "oj-sync", 6, 60 * 1000);
  if (!limit.allowed) return rateLimited(limit.retryAfter);

  const contentLength = Number(request.headers.get("content-length") || 0);
  if (Number.isFinite(contentLength) && contentLength > MAX_BODY_BYTES) return tooLarge();

  if (!isAuthorized(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let payload: SyncPayload;
  try {
    const raw = await request.text();
    if (new TextEncoder().encode(raw).byteLength > MAX_BODY_BYTES) return tooLarge();
    payload = JSON.parse(raw) as SyncPayload;
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  try {
    if (payload.schemaVersion !== 1 || payload.app !== "oj_float") {
      return NextResponse.json({ error: "Unsupported payload" }, { status: 400 });
    }

    const { env } = await getCloudflareContext({ async: true });
    const serverSyncedAt = new Date().toISOString();
    let dailyStats: ValidDailyStat[];
    let problems: ValidProblem[];
    try {
      dailyStats = parseDailyStats(payload.dailyStats);
      problems = parseProblems(payload.problems, serverSyncedAt);
    } catch (error) {
      return NextResponse.json({ error: error instanceof Error ? error.message : "Invalid payload" }, { status: 400 });
    }

    await env.DB.batch([
      env.DB.prepare("DELETE FROM oj_daily_stats"),
      env.DB.prepare("DELETE FROM oj_synced_problems"),
      ...dailyStats.map((item) =>
        env.DB.prepare(
          "INSERT INTO oj_daily_stats (date, total_delta, updated_at) VALUES (?, ?, ?)"
        ).bind(item.date, item.totalDelta, serverSyncedAt),
      ),
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
          serverSyncedAt,
        ),
      ),
    ]);

    return NextResponse.json({ success: true });
  } catch {
    console.error("POST /api/oj-sync error: safe server error");
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
