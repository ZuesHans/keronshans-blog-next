import { NextResponse } from "next/server";
import { getCloudflareContext } from "@opennextjs/cloudflare";
import { authenticateAdmin } from "@/lib/adminPassword";

// GET /api/admin - list all posts
export async function GET(request: Request) {
  if (!authenticateAdmin(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { env } = await getCloudflareContext({ async: true });
    const { results } = await env.DB.prepare(
      "SELECT filename, title, date, tags, category, created_at, updated_at FROM posts ORDER BY created_at DESC"
    ).all();
    // Parse tags JSON string to array for frontend compatibility
    const posts = results.map((r: Record<string, unknown>) => ({
      ...r,
      tags: (() => {
        try { return JSON.parse(r.tags as string); } catch { return []; }
      })(),
    }));
    return NextResponse.json(posts);
  } catch (error) {
    console.error("GET /api/admin error:", error);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}

// POST /api/admin - create new post
export async function POST(request: Request) {
  if (!authenticateAdmin(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { env } = await getCloudflareContext({ async: true });
    const { filename, frontmatter, content } = await request.json();
    const { title, date, tags, category } = frontmatter || {};

    if (!filename || !content) {
      return NextResponse.json({ error: "filename and content are required" }, { status: 400 });
    }

    // Strip .md if provided
    const slug = filename.replace(/\.md$/, "");
    const now = new Date().toISOString().replace("T", " ").slice(0, 19);
    const postDate = (date || now.slice(0, 10)).toString().slice(0, 10);
    const postTags = JSON.stringify(Array.isArray(tags) ? tags : []);
    const postCategory = category || inferCategory(slug);

    await env.DB.prepare(`
      INSERT OR REPLACE INTO posts (filename, title, content, date, tags, category, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `).bind(slug, title || slug, content, postDate, postTags, postCategory, now, now).run();

    return NextResponse.json({ success: true, filename: slug });
  } catch (error) {
    console.error("POST /api/admin error:", error);
    return NextResponse.json({ error: "Failed to save post: " + String(error) }, { status: 500 });
  }
}

// DELETE /api/admin?filename=xxx - delete post
export async function DELETE(request: Request) {
  if (!authenticateAdmin(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { env } = await getCloudflareContext({ async: true });
    const { searchParams } = new URL(request.url);
    const filename = searchParams.get("filename");
    if (!filename) {
      return NextResponse.json({ error: "filename is required" }, { status: 400 });
    }

    const slug = filename.replace(/\.md$/, "");
    await env.DB.prepare("DELETE FROM posts WHERE filename = ?").bind(slug).run();
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("DELETE /api/admin error:", error);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}

function inferCategory(filename: string): string {
  if (filename.startsWith("KH_")) return "笔记";
  if (filename.startsWith("ZU_")) return "模板";
  if (filename.startsWith("wp_")) return "题解";
  if (filename.startsWith("sp_")) return "专题";
  return "其他";
}
