import { NextResponse } from "next/server";
import { getAllPosts, getAllTags, getPostsByCategory, getCategoryColorClass } from "@/lib/posts";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const mode = searchParams.get("mode") || "all";

  if (mode === "all") {
    return NextResponse.json({ posts: getAllPosts(), tags: getAllTags() });
  }
  if (mode === "category") {
    const cat = searchParams.get("cat") || "";
    return NextResponse.json({ posts: getPostsByCategory(cat) });
  }
  return NextResponse.json({ posts: getAllPosts(), tags: getAllTags() });
}
