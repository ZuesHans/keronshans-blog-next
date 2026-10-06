import { Link } from "next-view-transitions";
import { ArrowUpRight } from "lucide-react";
type PostListPost = { id: string; slug: string; title: string; date: string; tags: string[]; excerpt: string; category: string; pinned: boolean };

export default function PostList({ posts }: { posts: readonly PostListPost[] }) {
  if (posts.length === 0) {
    return <div className="theme-surface theme-empty-state">没有匹配的文章。</div>;
  }
  return (
    <div className="theme-post-list">
      {posts.map((post) => (
        <Link key={post.id} href={`/posts/${post.slug}`}>
          <article className="theme-post-list-item">
            <time dateTime={post.date}>{post.date || "未标日期"}</time>
            <div>
              <div className="theme-post-list-meta">
                {post.pinned && <span className="theme-post-pinned">置顶</span>}
                <span>{post.category}</span>
              </div>
              <h2>{post.title}</h2>
              {post.excerpt && <p>{post.excerpt}</p>}
              {post.tags.length > 0 && <div className="theme-post-list-tags">{post.tags.slice(0, 5).map((tag) => <span key={tag}>#{tag}</span>)}</div>}
            </div>
            <span className="theme-post-list-arrow" aria-hidden="true"><ArrowUpRight size={17} /></span>
          </article>
        </Link>
      ))}
    </div>
  );
}
