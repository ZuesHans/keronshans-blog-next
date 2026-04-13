import { NextResponse } from "next/server";
import { getCloudflareContext } from "@opennextjs/cloudflare";

const ADMIN_PASSWORD = "zues1";

function authenticate(request: Request): boolean {
  return request.headers.get("x-admin-password") === ADMIN_PASSWORD;
}

function inferCategory(filename: string): string {
  if (filename.startsWith("KH_")) return "笔记";
  if (filename.startsWith("ZU_")) return "模板";
  if (filename.startsWith("wp_")) return "题解";
  if (filename.startsWith("sp_")) return "专题";
  return "其他";
}

// GET /api/admin/[filename] - get single post
export async function GET(request: Request, { params }: { params: Promise<{ filename: string }> }) {
  if (!authenticate(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { env } = await getCloudflareContext({ async: true });
    const { filename: rawFilename } = await params;
    const filename = decodeURIComponent(rawFilename).replace(/\.md$/, "");
    const { results } = await env.DB.prepare(
      "SELECT filename, title, content, date, tags, category, created_at, updated_at FROM posts WHERE filename = ?"
    ).bind(filename).all();

    if (!results || results.length === 0) {
      return NextResponse.json({ error: "Post not found" }, { status: 404 });
    }

    const post = results[0];
    let tags: unknown[] = [];
    try { tags = JSON.parse(String(post.tags || "[]")); } catch {}
    let parsedCategory = post.category;
    if (!parsedCategory || parsedCategory === "") {
      parsedCategory = inferCategory(String(post.filename));
    }

    return NextResponse.json({
      filename: post.filename,
      frontmatter: {
        title: post.title || post.filename,
        date: post.date || "",
        tags,
        category: parsedCategory,
      },
      content: post.content || "",
    });
  } catch (error) {
    console.error("GET /api/admin/[filename] error:", error);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}

// PUT /api/admin/[filename] - update post
export async function PUT(request: Request, { params }: { params: Promise<{ filename: string }> }) {
  if (!authenticate(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { env } = await getCloudflareContext({ async: true });
    const { filename: rawFilename } = await params;
    const filename = decodeURIComponent(rawFilename).replace(/\.md$/, "");
    const { title, content, date, tags, category, newFilename } = await request.json();

    const now = new Date().toISOString().replace("T", " ").slice(0, 19);
    const postDate = date || now.slice(0, 10);
    const postTags = JSON.stringify(Array.isArray(tags) ? tags : []);
    const postCategory = category || inferCategory(filename);

    const targetFilename = newFilename ? newFilename.replace(/\.md$/, "") : filename;

    // If renaming, delete old and insert new
    if (newFilename && newFilename.replace(/\.md$/, "") !== filename) {
      await env.DB.prepare("DELETE FROM posts WHERE filename = ?").bind(filename).run();
    }

    await env.DB.prepare(`
      INSERT OR REPLACE INTO posts (filename, title, content, date, tags, category, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, ?, COALESCE((SELECT created_at FROM posts WHERE filename = ?), ?), ?)
    `).bind(
      targetFilename,
      title || targetFilename,
      content || "",
      postDate,
      postTags,
      postCategory,
      targetFilename,
      now,
      now
    ).run();

    return NextResponse.json({ success: true, filename: targetFilename });
  } catch (error) {
    console.error("PUT /api/admin/[filename] error:", error);
    return NextResponse.json({ error: "Failed to update post: " + String(error) }, { status: 500 });
  }
}
