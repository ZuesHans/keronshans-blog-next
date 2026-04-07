import { NextResponse } from "next/server";
import { readFile, writeFile, rename, unlink } from "fs/promises";
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

  for (const line of yamlStr.split(/\r?\n/)) {
    const colonIdx = line.indexOf(":");
    if (colonIdx === -1) continue;
    const key = line.slice(0, colonIdx).trim();
    let value: unknown = line.slice(colonIdx + 1).trim();

    if ((value as string).startsWith('"') && (value as string).endsWith('"')) {
      value = (value as string).slice(1, -1);
    } else if ((value as string).startsWith("'") && (value as string).endsWith("'")) {
      value = (value as string).slice(1, -1);
    }

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

// GET /api/admin/[filename] - get single post
export async function GET(request: Request, { params }: { params: { filename: string } }) {
  if (!authenticate(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const filename = decodeURIComponent(params.filename);
    const filePath = path.join(POSTS_DIR, filename);
    const content = await readFile(filePath, "utf-8");
    const { frontmatter, body } = parseFrontmatter(content);

    return NextResponse.json({
      filename,
      frontmatter: {
        title: frontmatter.title || filename.replace(/\.md$/, ""),
        date: frontmatter.date || "",
        tags: Array.isArray(frontmatter.tags) ? frontmatter.tags.map(String) : [],
        category: frontmatter.category || inferCategory(filename),
      },
      content: body,
    });
  } catch {
    return NextResponse.json({ error: "Post not found" }, { status: 404 });
  }
}

// PUT /api/admin/[filename] - update post
export async function PUT(request: Request, { params }: { params: { filename: string } }) {
  if (!authenticate(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const filename = decodeURIComponent(params.filename);
    const body = await request.json();
    const { frontmatter, content, newFilename } = body;

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

    const fullContent = yamlLines + (content || "");
    const oldPath = path.join(POSTS_DIR, filename);
    const targetFilename = newFilename && newFilename !== filename ? newFilename : filename;
    const newPath = path.join(POSTS_DIR, targetFilename);

    if (newFilename && newFilename !== filename) {
      // Rename: write to new file, delete old
      await writeFile(newPath, fullContent, "utf-8");
      try { await unlink(oldPath); } catch { /* old might not exist */ }
    } else {
      await writeFile(oldPath, fullContent, "utf-8");
    }

    return NextResponse.json({ success: true, filename: targetFilename });
  } catch (error) {
    return NextResponse.json({ error: "Failed to update post: " + String(error) }, { status: 500 });
  }
}
