import { getAllPosts, getAllTags } from "@/lib/posts";
import Link from "next/link";
import { getCategoryColorClass } from "@/lib/posts";

export const dynamic = "force-dynamic";

export default async function SearchPage({ searchParams }: { searchParams: Promise<{ q?: string; tag?: string }> }) {
  const params = await searchParams;
  const query = params.q || "";
  const tag = params.tag || "";
  const [allPosts, allTags] = await Promise.all([getAllPosts(), getAllTags()]);

  let filteredPosts = allPosts;
  if (tag) {
    filteredPosts = allPosts.filter((p) => p.tags.includes(tag));
  } else if (query) {
    const q = query.toLowerCase();
    filteredPosts = allPosts.filter(
      (p) =>
        p.title.toLowerCase().includes(q) ||
        p.excerpt.toLowerCase().includes(q) ||
        p.tags.some((t) => t.toLowerCase().includes(q)) ||
        p.category.toLowerCase().includes(q)
    );
  }

  return (
    <div className="max-w-6xl mx-auto px-4 py-10">
      <div className="mb-8">
        <div className="page-kicker mb-3">Search</div>
        <h1 className="page-heading mb-2">搜索</h1>
        <p className="text-sm" style={{ color: "var(--owl-textSecondary)" }}>
          {tag ? `标签：#${tag}` : query ? `关键词：“${query}”` : "全部文章"}，找到 {filteredPosts.length} 个结果
      </p>
        <div className="soft-divider" />
      </div>

      {/* Search Results */}
      <div className="grid gap-4">
        {filteredPosts.length === 0 ? (
          <div className="cyber-card p-8 text-center">
            <div className="text-4xl mb-4">∅</div>
            <p className="text-gray-500 dark:text-gray-400 font-mono">未找到匹配的内容</p>
          </div>
        ) : (
          filteredPosts.map((post) => (
            <Link key={post.id} href={`/posts/${post.id}`}>
              <article className="cyber-card p-5 group cursor-pointer">
                <div className="flex items-start gap-4">
                  <div className="shrink-0">
                    <span className={`category-chip ${getCategoryColorClass(post.category)}`}>
                      {post.category}
                    </span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <h2 className="text-lg font-semibold transition-colors mb-1" style={{ color: "var(--owl-text)" }}>
                      {post.title}
                    </h2>
                    <p className="text-sm line-clamp-2" style={{ color: "var(--owl-textSecondary)" }}>{post.excerpt}</p>
                    <div className="flex flex-wrap gap-1.5 mt-2 text-xs font-mono" style={{ color: "var(--owl-textMuted)" }}>
                      <span>{post.date}</span>
                      {post.tags.map((t) => (
                        <span key={t}>#{t}</span>
                      ))}
                    </div>
                  </div>
                </div>
              </article>
            </Link>
          ))
        )}
      </div>

      {/* Popular Tags */}
      <div className="mt-8 cyber-card p-6">
        <h3 className="font-display font-semibold mb-3">热门标签</h3>
        <div className="flex flex-wrap gap-2">
          {allTags.slice(0, 20).map(({ tag, count }) => (
            <Link
              key={tag}
              href={`/search?tag=${encodeURIComponent(tag)}`}
              className="tag-pill text-sm"
            >
              #{tag} ({count})
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
