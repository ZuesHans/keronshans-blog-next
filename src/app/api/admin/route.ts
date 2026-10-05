import { NextResponse } from "next/server";
import { authenticateAdmin } from "@/lib/adminPassword";
import { getAllPosts } from "@/lib/posts";

// GET /api/admin - list the published snapshot for the authenticated dashboard.
export async function GET(request: Request) {
  if (!(await authenticateAdmin(request))) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const posts = await getAllPosts();
  return NextResponse.json(posts.map((post) => ({
    filename: `${post.slug}.md`,
    id: post.id,
    slug: post.slug,
    title: post.title,
    date: post.date,
    tags: post.tags,
    category: post.category,
    created_at: post.date,
    updated_at: post.updatedAt,
    schemaVersion: post.schemaVersion,
    kind: post.kind,
    legacy: post.legacy,
  })));
}

// Article bodies belong to the Published Vault and are changed through publisher.
export async function POST(request: Request) {
  if (!(await authenticateAdmin(request))) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  return NextResponse.json({ error: "Published content is read-only", code: "CONTENT_SOURCE_READONLY" }, { status: 405, headers: { Allow: "GET" } });
}

// Withdrawals are also content-repository changes, never D1 deletes.
export async function DELETE(request: Request) {
  if (!(await authenticateAdmin(request))) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  return NextResponse.json({ error: "Published content is read-only", code: "CONTENT_SOURCE_READONLY" }, { status: 405, headers: { Allow: "GET" } });
}
