import { NextResponse } from "next/server";
import { getPostById } from "@/lib/posts";

export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  const post = getPostById(params.id);
  if (!post) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json(post);
}
