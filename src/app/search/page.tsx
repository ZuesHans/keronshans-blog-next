import { getAllPosts, getAllTags } from "@/lib/posts";
import Link from "next/link";
import { getCategoryColorClass } from "@/lib/posts";

export const dynamic = "force-dynamic";

export default async function SearchPage({ searchParams }: { searchParams: { q?: string; tag?: string } }) {
  const query = searchParams.q || "";
  const tag = searchParams.tag || "";
  const allPosts = getAllPosts();
  const allTags = getAllTags();

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
    <div className="max-w-6xl mx-auto px-4 py-8">
      <h1 className="text-4xl font-display font-bold mb-2">
        <span className="neon-text-blue">⚡</span> 搜索
      </h1>
      <p className="text-gray-500 dark:text-gray-400 font-mono text-sm mb-6">
        &gt; {tag ? `标签: #${tag}` : query ? `关键词: "${query}"` : "全部文章"} | 找到 {filteredPosts.length} 个结果
      </p>

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
                    <span className={`inline-block px-2 py-0.5 rounded text-xs font-mono border ${getCategoryColorClass(post.category)}`}>
                      {post.category}
                    </span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <h2 className="text-lg font-bold group-hover:text-neon-pink transition-colors mb-1">
                      {post.title}
                    </h2>
                    <p className="text-sm text-gray-500 dark:text-gray-400 line-clamp-2">{post.excerpt}</p>
                    <div className="flex flex-wrap gap-1.5 mt-2 text-xs text-gray-400 font-mono">
                      <span>{post.date}</span>
                      {post.tags.map((t) => (
                        <span key={t} className="hover:text-neon-blue">#{t}</span>
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
        <h3 className="font-display font-bold mb-3 text-neon-blue">热门标签</h3>
        <div className="flex flex-wrap gap-2">
          {allTags.slice(0, 20).map(({ tag, count }) => (
            <Link
              key={tag}
              href={`/search?tag=${encodeURIComponent(tag)}`}
              className={`px-3 py-1 rounded-full text-xs font-mono border transition-all ${
                tag === tag
                  ? "bg-neon-blue/10 text-neon-blue border-neon-blue/30"
                  : "bg-gray-100 dark:bg-cyber-surface text-gray-500 dark:text-gray-400 border-transparent hover:border-neon-blue/30 hover:text-neon-blue"
              }`}
            >
              #{tag} ({count})
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
