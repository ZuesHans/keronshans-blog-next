import { NextResponse } from "next/server";
import { getAllPosts, getAllTags, getCategoryColorClass } from "@/lib/posts";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const mode = searchParams.get("mode") || "all";

  if (mode === "category") {
    const cat = searchParams.get("cat") || "";
    const posts = await getAllPosts();
    return NextResponse.json({ posts: posts.filter((p) => p.category === cat) });
  }

  const [posts, tags] = await Promise.all([getAllPosts(), getAllTags()]);
  return NextResponse.json({ posts, tags });
}
