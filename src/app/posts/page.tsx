import { getAllPosts, getAllTags } from "@/lib/posts";
import PostsClient from "./PostsClient";

export default async function PostsPage() {
  // D1 优先读取（Workers 运行时），本地构建时 fallback 到文件系统
  const [posts, tags] = await Promise.all([getAllPosts(), getAllTags()]);
  return <PostsClient initialPosts={posts} initialTags={tags} />;
}
