import { NextResponse } from "next/server";
import { getAllPostsFromKV, saveAllPostsToKV, KvPost } from "./kv";

const ADMIN_PASSWORD = "zues1";

function authenticate(request: Request): boolean {
  return request.headers.get("x-admin-password") === ADMIN_PASSWORD;
}

export async function GET(request: Request) {
  if (!authenticate(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const posts = await getAllPostsFromKV();
    // Sort by date descending
    posts.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    return NextResponse.json(posts);
  } catch (error) {
    return NextResponse.json({ error: "Failed to load posts: " + String(error) }, { status: 500 });
  }
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

    const now = new Date().toISOString();
    const newPost: KvPost = {
      filename,
      title: frontmatter?.title || filename.replace(/\.md$/, ""),
      date: frontmatter?.date ? String(frontmatter.date).slice(0, 10) : now.slice(0, 10),
      tags: Array.isArray(frontmatter?.tags) ? frontmatter.tags.map(String) : [],
      category: frontmatter?.category || inferCategory(filename),
      content,
      size: new Blob([content]).size,
      createdAt: now,
      updatedAt: now,
    };

    const posts = await getAllPostsFromKV();
    // Remove existing post with same filename
    const existing = posts.findIndex(p => p.filename === filename);
    if (existing >= 0) {
      newPost.createdAt = posts[existing].createdAt;
      posts[existing] = newPost;
    } else {
      posts.push(newPost);
    }

    await saveAllPostsToKV(posts);
    return NextResponse.json({ success: true, filename });
  } catch (error) {
    return NextResponse.json({ error: "Failed to save post: " + String(error) }, { status: 500 });
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

    const posts = await getAllPostsFromKV();
    const idx = posts.findIndex(p => p.filename === filename);
    if (idx === -1) {
      return NextResponse.json({ error: "Post not found" }, { status: 404 });
    }

    posts.splice(idx, 1);
    await saveAllPostsToKV(posts);
    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: "Failed to delete post: " + String(error) }, { status: 500 });
  }
}

function inferCategory(filename: string): string {
  if (filename.startsWith("KH_")) return "笔记";
  if (filename.startsWith("ZU_")) return "模板";
  if (filename.startsWith("wp_")) return "题解";
  if (filename.startsWith("sp_")) return "专题";
  return "其他";
}
