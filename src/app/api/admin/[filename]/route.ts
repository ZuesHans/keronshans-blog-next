import { NextResponse } from "next/server";
import { authenticateAdmin, authenticateAdminMutation } from "@/lib/adminPassword";
import { getPostById } from "@/lib/posts";

// GET /api/admin/[filename] - get single post
export async function GET(request: Request, { params }: { params: Promise<{ filename: string }> }) {
  if (!(await authenticateAdmin(request))) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { filename: rawFilename } = await params;
  const filename = decodeURIComponent(rawFilename).replace(/\.md$/, "");
  const post = await getPostById(filename);
  if (!post) return NextResponse.json({ error: "Post not found" }, { status: 404 });
  return NextResponse.json({
    filename: `${post.slug}.md`,
    id: post.id,
    slug: post.slug,
    frontmatter: {
      ...(post.schemaVersion === 1 ? { schemaVersion: 1 } : {}),
      ...(post.kind ? { kind: post.kind } : {}),
      id: post.id,
      slug: post.slug,
      status: post.status,
      title: post.title,
      date: post.date,
      updatedAt: post.updatedAt,
      tags: post.tags,
      category: post.category,
      pinned: post.pinned,
      aliases: post.aliases,
      ...(post.legacy ? { legacy: true } : {}),
    },
    content: post.content,
  });
}

// PUT /api/admin/[filename] - update post
export async function PUT(request: Request, { params }: { params: Promise<{ filename: string }> }) {
  if (!(await authenticateAdminMutation(request))) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  return NextResponse.json({ error: "Published content is read-only", code: "CONTENT_SOURCE_READONLY" }, { status: 405, headers: { Allow: "GET" } });
}
