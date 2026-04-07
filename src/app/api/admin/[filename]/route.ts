import { NextResponse } from "next/server";
import { getAllPostsFromKV, saveAllPostsToKV, KvPost } from "../kv";

const ADMIN_PASSWORD = "zues1";

function authenticate(request: Request): boolean {
  return request.headers.get("x-admin-password") === ADMIN_PASSWORD;
}

export async function GET(request: Request, { params }: { params: { filename: string } }) {
  if (!authenticate(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const filename = decodeURIComponent(params.filename);
    const posts = await getAllPostsFromKV();
    const post = posts.find(p => p.filename === filename);

    if (!post) {
      return NextResponse.json({ error: "Post not found" }, { status: 404 });
    }

    // Return in the format the dashboard expects
    return NextResponse.json({
      filename,
      frontmatter: {
        title: post.title,
        date: post.date,
        tags: post.tags,
        category: post.category,
      },
      content: post.content,
    });
  } catch (error) {
    return NextResponse.json({ error: "Failed to load post: " + String(error) }, { status: 500 });
  }
}

export async function PUT(request: Request, { params }: { params: { filename: string } }) {
  if (!authenticate(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const filename = decodeURIComponent(params.filename);
    const posts = await getAllPostsFromKV();
    const idx = posts.findIndex(p => p.filename === filename);

    if (idx === -1) {
      return NextResponse.json({ error: "Post not found" }, { status: 404 });
    }

    const body = await request.json();
    const { frontmatter, content, newFilename } = body;

    const now = new Date().toISOString();
    const updatedPost: KvPost = {
      ...posts[idx],
      filename: newFilename && newFilename !== filename ? newFilename : filename,
      title: frontmatter?.title || posts[idx].title,
      date: frontmatter?.date ? String(frontmatter.date).slice(0, 10) : posts[idx].date,
      tags: Array.isArray(frontmatter?.tags) ? frontmatter.tags.map(String) : posts[idx].tags,
      category: frontmatter?.category || posts[idx].category,
      content,
      size: new Blob([content]).size,
      updatedAt: now,
    };

    if (newFilename && newFilename !== filename) {
      // Remove old filename entry, add with new filename
      posts.splice(idx, 1);
      posts.push(updatedPost);
    } else {
      posts[idx] = updatedPost;
    }

    await saveAllPostsToKV(posts);
    return NextResponse.json({ success: true, filename: updatedPost.filename });
  } catch (error) {
    return NextResponse.json({ error: "Failed to update post: " + String(error) }, { status: 500 });
  }
}
