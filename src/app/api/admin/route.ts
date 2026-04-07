import { NextResponse } from "next/server";
import { readdir, readFile, writeFile, unlink } from "fs/promises";
import path from "path";

const ADMIN_PASSWORD = "zues1";
const POSTS_DIR = path.join(process.cwd(), "content", "posts");

function authenticate(request: Request): boolean {
  return request.headers.get("x-admin-password") === ADMIN_PASSWORD;
}

function parseFrontmatter(content: string): { frontmatter: Record<string, unknown>; body: string } {
  const match = content.match(/^---\r?\n([\s\S]*?)\r?\n---\r?\n([\s\S]*)$/);
  if (!match) return { frontmatter: {}, body: content };

  const yamlStr = match[1];
  const body = match[2];
  const frontmatter: Record<string, unknown> = {};

  // Simple YAML parser
  for (const line of yamlStr.split(/\r?\n/)) {
    const colonIdx = line.indexOf(":");
    if (colonIdx === -1) continue;
    const key = line.slice(0, colonIdx).trim();
    let value: unknown = line.slice(colonIdx + 1).trim();

    // Remove surrounding quotes
    if ((value as string).startsWith('"') && (value as string).endsWith('"')) {
      value = (value as string).slice(1, -1);
    } else if ((value as string).startsWith("'") && (value as string).endsWith("'")) {
      value = (value as string).slice(1, -1);
    }

    // Parse arrays: [a, b, c] or - item
    if ((value as string).startsWith("[")) {
      try {
        value = JSON.parse((value as string).replace(/'/g, '"'));
      } catch {
        value = [];
      }
    }

    frontmatter[key] = value;
  }

  return { frontmatter, body };
}

function inferCategory(filename: string): string {
  if (filename.startsWith("KH_")) return "笔记";
  if (filename.startsWith("ZU_")) return "模板";
  if (filename.startsWith("wp_")) return "题解";
  if (filename.startsWith("sp_")) return "专题";
  return "其他";
}

// GET /api/admin - list all posts
export async function GET(request: Request) {
  if (!authenticate(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const files = await readdir(POSTS_DIR);
    const posts = [];

    for (const file of files) {
      if (!file.endsWith(".md")) continue;
      try {
        const content = await readFile(path.join(POSTS_DIR, file), "utf-8");
        const { frontmatter } = parseFrontmatter(content);
        posts.push({
          filename: file,
          title: String(frontmatter.title || file.replace(/\.md$/, "")),
          date: String(frontmatter.date || ""),
          tags: Array.isArray(frontmatter.tags) ? frontmatter.tags.map(String) : [],
          category: String(frontmatter.category || inferCategory(file)),
          size: Buffer.byteLength(content, "utf-8"),
          excerpt: content.replace(/^---[\s\S]*?---\n/, "").slice(0, 120),
        });
      } catch {
        // skip unreadable files
      }
    }

    // Sort by date descending
    posts.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    return NextResponse.json(posts);
  } catch (error) {
    return NextResponse.json({ error: "Failed to load posts: " + String(error) }, { status: 500 });
  }
}

// POST /api/admin - create new post
export async function POST(request: Request) {
  if (!authenticate(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await request.json();
    let { filename, frontmatter, content } = body;

    if (!filename || !content) {
      return NextResponse.json({ error: "filename and content are required" }, { status: 400 });
    }

    if (!filename.endsWith(".md")) filename = filename + ".md";

    // Build YAML frontmatter string
    const tags = Array.isArray(frontmatter?.tags) ? frontmatter.tags : [];
    const yamlLines = [
      "---",
      `title: "${(frontmatter?.title || filename.replace(/\.md$/, "")).replace(/"/g, '\\"')}"`,
      `date: "${frontmatter?.date || new Date().toISOString().slice(0, 10)}"`,
      `tags: [${tags.map((t: unknown) => `"${String(t).replace(/"/g, '\\"')}"`).join(", ")}]`,
      `category: "${frontmatter?.category || inferCategory(filename)}"`,
      "---",
      "",
    ].join("\n");

    const fullContent = yamlLines + content;
    const filePath = path.join(POSTS_DIR, filename);
    await writeFile(filePath, fullContent, "utf-8");

    return NextResponse.json({ success: true, filename });
  } catch (error) {
    return NextResponse.json({ error: "Failed to save post: " + String(error) }, { status: 500 });
  }
}

// DELETE /api/admin?filename=xxx - delete post
export async function DELETE(request: Request) {
  if (!authenticate(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { searchParams } = new URL(request.url);
    const filename = searchParams.get("filename");
    if (!filename) {
      return NextResponse.json({ error: "filename is required" }, { status: 400 });
    }

    const filePath = path.join(POSTS_DIR, filename);
    await unlink(filePath);
    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: "Failed to delete post: " + String(error) }, { status: 500 });
  }
}
