import { getAllPosts, getAllTags } from "@/lib/posts";
import PostsClient from "./PostsClient";

// 服务端静态生成，build 时读取所有文章
const posts = getAllPosts();
const tags = getAllTags();

export default function PostsPage() {
  return <PostsClient initialPosts={posts} initialTags={tags} />;
}
