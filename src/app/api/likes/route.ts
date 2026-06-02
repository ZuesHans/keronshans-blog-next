import { NextResponse } from "next/server";
import { getCloudflareContext } from "@opennextjs/cloudflare";

// GET /api/likes?postId=xxx - Get like count for a post
export async function GET(request: Request) {
  try {
    const { env } = await getCloudflareContext({ async: true });
    const { searchParams } = new URL(request.url);
    const postId = searchParams.get("postId");
    if (!postId) {
      return NextResponse.json({ error: "postId is required" }, { status: 400 });
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
    if (!postId) {
      return NextResponse.json({ error: "postId is required" }, { status: 400 });
    }

    // Use CF-Connecting-IP header for real IP, fallback to X-Forwarded-For, then "unknown"
    // Access via env.ASSETS is not available; use request headers directly
    const cfIP = request.headers.get("cf-connecting-ip");
    const forwardedIP = request.headers.get("x-forwarded-for");
    const ip = cfIP || (forwardedIP ? forwardedIP.split(",")[0].trim() : "unknown");

    // Check duplicate
    const existing = await env.DB
      .prepare("SELECT id FROM likes WHERE post_id = ? AND ip = ?")
      .bind(postId, ip)
      .first();

    if (existing) {
      return NextResponse.json({ error: "Already liked" }, { status: 409 });
    }

    await env.DB
      .prepare("INSERT INTO likes (post_id, ip) VALUES (?, ?)")
      .bind(postId, ip)
      .run();

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("POST /api/likes error:", error);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
