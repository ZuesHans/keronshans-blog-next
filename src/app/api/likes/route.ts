import { NextResponse } from "next/server";
import { getCloudflareContext } from "@opennextjs/cloudflare";
import { checkRateLimit, getClientIp } from "@/lib/rateLimit";

const POST_ID_PATTERN = /^[a-z0-9][a-z0-9_-]{0,119}$/i;

function isValidPostId(value: unknown): value is string {
  return typeof value === "string" && POST_ID_PATTERN.test(value);
}

function rateLimited(retryAfter: number) {
  return NextResponse.json(
    { error: "Too many requests" },
    { status: 429, headers: { "Retry-After": String(retryAfter) } },
  );
}

// GET /api/likes?postId=xxx - Get like count for a post
export async function GET(request: Request) {
  try {
    const { env } = await getCloudflareContext({ async: true });
    const { searchParams } = new URL(request.url);
    const postId = searchParams.get("postId");
    if (!isValidPostId(postId)) {
      return NextResponse.json({ error: "Invalid postId" }, { status: 400 });
    }

    const { count } = await env.DB
      .prepare("SELECT COUNT(*) as count FROM likes WHERE post_id = ?")
      .bind(postId)
      .first<{ count: number }>();

    return NextResponse.json({ likes: count || 0 });
  } catch {
    return NextResponse.json({ likes: 0 });
  }
}

// POST /api/likes - Like a post
export async function POST(request: Request) {
  try {
    const { env } = await getCloudflareContext({ async: true });
    const { postId } = await request.json();
    if (!isValidPostId(postId)) {
      return NextResponse.json({ error: "Invalid postId" }, { status: 400 });
    }

    const limit = checkRateLimit(request, "like:create", 30, 60 * 1000);
    if (!limit.allowed) return rateLimited(limit.retryAfter);

    const ip = getClientIp(request);
    const result = await env.DB
      .prepare("INSERT OR IGNORE INTO likes (post_id, ip) VALUES (?, ?)")
      .bind(postId, ip)
      .run();
    const changes = (result.meta as { changes?: number } | undefined)?.changes;
    if (changes === 0) {
      return NextResponse.json({ error: "Already liked" }, { status: 409 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("POST /api/likes error:", error);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
