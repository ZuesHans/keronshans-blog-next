import { NextResponse } from "next/server";
import { getPostById } from "@/lib/posts";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const post = await getPostById(id);
  if (!post) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json({
    id: post.id,
    slug: post.slug,
    title: post.title,
    status: post.status,
    date: post.date,
    updatedAt: post.updatedAt,
    category: post.category,
    tags: post.tags,
    description: post.excerpt,
    pinned: post.pinned,
    aliases: post.aliases,
    legacy: post.legacy,
    content: post.content,
  }, { headers: { "Cache-Control": "no-store" } });
}
