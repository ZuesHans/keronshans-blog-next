import { NextResponse } from "next/server";
import { getCloudflareContext } from "@opennextjs/cloudflare";
import { authenticateAdmin } from "@/lib/adminPassword";

// GET /api/comments?postId=xxx - Get comments for a post
export async function GET(request: Request) {
  try {
    const { env } = await getCloudflareContext({ async: true });
    const { searchParams } = new URL(request.url);
    const postId = searchParams.get("postId");
    if (!postId) {
      return NextResponse.json({ error: "postId is required" }, { status: 400 });
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

    if (!postId || !content?.trim()) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    if (content.trim().length > 500) {
      return NextResponse.json({ error: "Content too long (max 500)" }, { status: 400 });
    }

    // Anti-spam: check if same content posted within last 10s
    const recent = await env.DB
      .prepare("SELECT id FROM comments WHERE post_id = ? AND content = ? AND created_at > datetime('now', '+8 hours', '-10 seconds')")
      .bind(postId, content.trim())
      .first();
    if (recent) {
      return NextResponse.json({ error: "Please wait before posting again" }, { status: 429 });
    }

    await env.DB
      .prepare("INSERT INTO comments (post_id, nickname, content) VALUES (?, ?, ?)")
      .bind(postId, (nickname || "anonymous").slice(0, 20), content.trim().slice(0, 500))
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
    if (!authenticateAdmin(request)) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");
    if (!id) {
      return NextResponse.json({ error: "id is required" }, { status: 400 });
    }

    await env.DB.prepare("DELETE FROM comments WHERE id = ?").bind(Number(id)).run();
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("DELETE /api/comments error:", error);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
