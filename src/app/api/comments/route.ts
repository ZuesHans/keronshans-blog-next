import { NextResponse } from "next/server";

// GET /api/comments?postId=xxx - Get comments for a post
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

    const { results } = await env
      .prepare("SELECT * FROM comments WHERE post_id = ? ORDER BY created_at DESC")
      .bind(postId)
      .all();

    return NextResponse.json(results);
  } catch (error) {
    return NextResponse.json({ error: String(error) }, { status: 500 });
  }
}

// POST /api/comments - Add a comment
export async function POST(request: Request) {
  const env = (process.env as unknown as { DB: D1Database }).DB;
  if (!env) {
    return NextResponse.json({ error: "Database not configured" }, { status: 500 });
  }

  try {
    const { postId, nickname, content } = await request.json();
    if (!postId || !content?.trim()) {
      return NextResponse.json({ error: "postId and content are required" }, { status: 400 });
    }

    await env.prepare(
      "INSERT INTO comments (post_id, nickname, content) VALUES (?, ?, ?)"
    ).bind(postId, (nickname || "匿名").slice(0, 20), content.trim().slice(0, 500)).run();

    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: String(error) }, { status: 500 });
  }
}
