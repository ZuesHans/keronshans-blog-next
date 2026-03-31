import { NextResponse } from "next/server";

// GET /api/likes?postId=xxx - Get like count for a post
export async function GET(request: Request) {
  const env = (process.env as unknown as { DB: D1Database }).DB;
  if (!env) {
    return NextResponse.json({ error: "Database not configured" }, { status: 500 });
  }

  try {
    const { searchParams } = new URL(request.url);
    const postId = searchParams.get("postId");
    if (!postId) {
      return NextResponse.json({ error: "postId is required" }, { status: 400 });
    }

    const { count } = await env
      .prepare("SELECT COUNT(*) as count FROM likes WHERE post_id = ?")
      .bind(postId)
      .first<{ count: number }>();

    return NextResponse.json({ likes: count || 0 });
  } catch (error) {
    return NextResponse.json({ error: String(error) }, { status: 500 });
  }
}

// POST /api/likes - Like a post
export async function POST(request: Request) {
  const env = (process.env as unknown as { DB: D1Database }).DB;
  if (!env) {
    return NextResponse.json({ error: "Database not configured" }, { status: 500 });
  }

  try {
    const { postId, ip } = await request.json();
    if (!postId) {
      return NextResponse.json({ error: "postId is required" }, { status: 400 });
    }

    // Check if already liked (same post_id + ip, or just post_id)
    const existing = await env
      .prepare("SELECT id FROM likes WHERE post_id = ? AND ip = ?")
      .bind(postId, ip || "unknown")
      .first();

    if (existing) {
      return NextResponse.json({ error: "Already liked" }, { status: 409 });
    }

    await env.prepare(
      "INSERT INTO likes (post_id, ip) VALUES (?, ?)"
    ).bind(postId, ip || "unknown").run();

    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: String(error) }, { status: 500 });
  }
}
