import { NextResponse } from "next/server";
import fs from "fs";
import path from "path";
import matter from "gray-matter";

const POSTS_DIR = path.join(process.cwd(), "content", "posts");
const ADMIN_PASSWORD = "zues1";

function authenticate(request: Request): boolean {
  const auth = request.headers.get("x-admin-password");
  return auth === ADMIN_PASSWORD;
}

export async function GET(request: Request) {
  if (!authenticate(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  if (!fs.existsSync(POSTS_DIR)) return NextResponse.json([]);

  const files = fs.readdirSync(POSTS_DIR).filter((f) => f.endsWith(".md"));
  const posts = files.map((filename) => {
    const filePath = path.join(POSTS_DIR, filename);
    const fileContent = fs.readFileSync(filePath, "utf-8");
    const { data, content } = matter(fileContent);
    const excerpt = content.slice(0, 200).replace(/[#*`\[\]]/g, "").trim();
    return {
      filename,
      title: data.title || filename.replace(/\.md$/, ""),
      date: data.date ? String(data.date) : "",
      tags: Array.isArray(data.tags) ? data.tags.map(String) : [],
      category: data.category || inferCategory(filename),
      excerpt,
      size: fs.statSync(filePath).size,
    };
  });

  posts.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  return NextResponse.json(posts);
}

function inferCategory(filename: string): string {
  if (filename.startsWith("KH_")) return "笔记";
  if (filename.startsWith("ZU_")) return "模板";
  if (filename.startsWith("wp_")) return "题解";
  if (filename.startsWith("sp_")) return "专题";
  return "其他";
}

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
    const filePath = path.join(POSTS_DIR, filename);

    const yamlContent = Object.entries(frontmatter || {}).map(([k, v]) => {
      if (Array.isArray(v)) return `${k}:\n${v.map((item) => `  - "${item}"`).join("\n")}`;
      return `${k}: ${typeof v === "string" ? `"${v}"` : v}`;
    }).join("\n");

    const fullContent = `---\n${yamlContent}\n---\n\n${content}`;

    fs.writeFileSync(filePath, fullContent, "utf-8");
    return NextResponse.json({ success: true, filename });
  } catch (error) {
    return NextResponse.json({ error: String(error) }, { status: 500 });
  }
}

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
    if (!fs.existsSync(filePath)) {
      return NextResponse.json({ error: "File not found" }, { status: 404 });
    }

    fs.unlinkSync(filePath);
    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: String(error) }, { status: 500 });
  }
}
