import Link from "next/link";
import type { PostMeta } from "@/lib/posts";

export default function PostCard({ post }: { post: PostMeta }) {
  return (
    <Link href={`/posts/${post.slug}`} className="theme-post-card">
      <article>
        <div className="theme-post-meta">
          {post.pinned && <span className="theme-post-pinned">置顶</span>}
          <span>{post.category}</span>
          <time dateTime={post.date}>{post.date || "未标日期"}</time>
        </div>
        <h2>{post.title}</h2>
        {post.excerpt && <p>{post.excerpt}</p>}
        <div className="theme-post-footer">
          <span>{post.tags.slice(0, 4).map((tag) => `#${tag}`).join("  ")}</span>
          <span aria-hidden="true">↗</span>
        </div>
      </article>
    </Link>
  );
}
