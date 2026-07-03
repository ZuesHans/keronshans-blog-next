import { NextResponse } from "next/server";
import { getCloudflareContext } from "@opennextjs/cloudflare";
import { authenticateAdmin } from "@/lib/adminPassword";
import { checkRateLimit } from "@/lib/rateLimit";

const POST_ID_PATTERN = /^[a-z0-9][a-z0-9_-]{0,119}$/i;
const MAX_COMMENT_LENGTH = 500;
const MAX_NICKNAME_LENGTH = 20;

function isValidPostId(value: unknown): value is string {
  return typeof value === "string" && POST_ID_PATTERN.test(value);
}

function cleanText(value: unknown, maxLength: number): string {
  return typeof value === "string" ? value.trim().slice(0, maxLength) : "";
}

function rateLimited(retryAfter: number) {
  return NextResponse.json(
    { error: "Please wait before posting again" },
    { status: 429, headers: { "Retry-After": String(retryAfter) } },
  );
}

// GET /api/comments?postId=xxx - Get comments for a post
export async function GET(request: Request) {
  try {
    const { env } = await getCloudflareContext({ async: true });
    const { searchParams } = new URL(request.url);
    const postId = searchParams.get("postId");
    if (!isValidPostId(postId)) {
      return NextResponse.json({ error: "Invalid postId" }, { status: 400 });
    }

    const { results } = await env.DB
      .prepare("SELECT * FROM comments WHERE post_id = ? ORDER BY created_at DESC")
      .bind(postId)
      .all();

    return NextResponse.json(results || []);
  } catch {
    return NextResponse.json([]);
  }
}

// POST /api/comments - Add a comment
export async function POST(request: Request) {
  try {
    const { env } = await getCloudflareContext({ async: true });
    const { postId, nickname, content } = await request.json();
    if (!isValidPostId(postId)) {
      return NextResponse.json({ error: "Invalid postId" }, { status: 400 });
    }

    const cleanedContent = cleanText(content, MAX_COMMENT_LENGTH);
    if (!cleanedContent) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    if (typeof content === "string" && content.trim().length > MAX_COMMENT_LENGTH) {
      return NextResponse.json({ error: `Content too long (max ${MAX_COMMENT_LENGTH})` }, { status: 400 });
    }

    const ipLimit = checkRateLimit(request, "comment:create", 8, 60 * 1000);
    if (!ipLimit.allowed) return rateLimited(ipLimit.retryAfter);
    const postLimit = checkRateLimit(request, `comment:post:${postId}`, 20, 5 * 60 * 1000);
    if (!postLimit.allowed) return rateLimited(postLimit.retryAfter);

    const recent = await env.DB
      .prepare("SELECT id FROM comments WHERE post_id = ? AND content = ? AND created_at > datetime('now', '+8 hours', '-30 seconds')")
      .bind(postId, cleanedContent)
      .first();
    if (recent) {
      return NextResponse.json({ error: "Please wait before posting again" }, { status: 429 });
    }

    await env.DB
      .prepare("INSERT INTO comments (post_id, nickname, content) VALUES (?, ?, ?)")
      .bind(postId, cleanText(nickname, MAX_NICKNAME_LENGTH) || "anonymous", cleanedContent)
      .run();

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("POST /api/comments error:", error);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}

// DELETE /api/comments?id=xxx - Delete a comment (admin only)
export async function DELETE(request: Request) {
  try {
    const { env } = await getCloudflareContext({ async: true });
    if (!(await authenticateAdmin(request))) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");
    const numericId = Number(id);
    if (!Number.isInteger(numericId) || numericId < 1) {
      return NextResponse.json({ error: "Invalid id" }, { status: 400 });
    }

    await env.DB.prepare("DELETE FROM comments WHERE id = ?").bind(numericId).run();
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("DELETE /api/comments error:", error);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
