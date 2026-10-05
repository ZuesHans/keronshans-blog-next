import { getAllPosts, getAllTags } from "@/lib/posts";
import PostsClient from "./PostsClient";

export default async function PostsPage() {
  const [posts, tags] = await Promise.all([getAllPosts(), getAllTags()]);
  return <PostsClient initialPosts={posts} initialTags={tags} />;
}
