import Link from "next/link";
import type { CSSProperties } from "react";
import { CATEGORY_GROUPS, getAllPosts, getAllTags, getCategoryColorClass } from "@/lib/posts";

export default async function HomePage() {
  const [posts, tags] = await Promise.all([getAllPosts(), getAllTags()]);
  const featuredPosts = posts.slice(0, 3);
  const visibleCategories = CATEGORY_GROUPS.slice(0, 5);
  const categoryCounts = Object.fromEntries(
    CATEGORY_GROUPS.map((group) => [group.name, posts.filter((post) => post.category === group.name).length])
  );

  return (
    <div className="max-w-5xl mx-auto px-5 sm:px-6 py-12 sm:py-16">
      <section className="mb-12 sm:mb-16">
        <div className="section-eyebrow mb-5">CP Notebook / CS Learning / Daily</div>
        <h1 className="hero-title mb-5">Keronshans</h1>
        <p className="text-lg leading-8 max-w-3xl" style={{ color: "var(--owl-textSecondary)" }}>
          菜菜小猫的窝//ACM 算法竞赛学习...CS 学习笔记...一些碎碎念...
        </p>
        <div className="home-intro-meta mt-8">
          <span>{posts.length} 篇文章</span>
          <span>{categoryCounts["题目复盘"] || 0} 篇题解</span>
          <span>{tags.length} 个标签</span>
        </div>
      </section>

      <section className="home-feature-grid mb-12">
        <div className="home-panel">
          <div className="home-section-head mb-2">
            <h2>最近更新</h2>
            <Link href="/posts" style={{ color: "var(--neon-accent)" }} className="text-xs hover:opacity-70 transition-opacity">
              查看全部
            </Link>
          </div>
          <div>
            {featuredPosts.map((post) => (
              <Link key={post.id} href={`/posts/${post.id}`}>
                <article className="post-list-item group">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1.5 flex-wrap">
                      {post.pinned && <span className="pinned-label">置顶</span>}
                      <span className={`category-chip ${getCategoryColorClass(post.category)}`}>{post.category}</span>
                      <span className="text-xs" style={{ color: "var(--owl-textMuted)" }}>{post.date}</span>
                    </div>
                    <h3 className="post-list-title">{post.title}</h3>
                  </div>
                </article>
              </Link>
            ))}
          </div>
        </div>

        <aside className="home-panel">
          <div className="home-section-head mb-2">
            <h2>文章分类</h2>
            <Link href="/posts" style={{ color: "var(--neon-accent)" }} className="text-xs hover:opacity-70 transition-opacity">
              全部
            </Link>
          </div>
          <div className="home-category-list">
            {visibleCategories.map((group) => {
              const count = categoryCounts[group.name] || 0;
              return (
                <Link
                  key={group.name}
                  href={`/posts?category=${encodeURIComponent(group.name)}`}
                  className="home-category-row"
                  style={{ "--tile-accent": group.accent } as CSSProperties}
                >
                  <span>{group.name}</span>
                  <strong>{count}</strong>
                </Link>
              );
            })}
          </div>
        </aside>
      </section>

      <section className="home-tag-tree">
        <div className="home-section-head mb-4">
          <h2>标签树</h2>
          <Link href="/posts" style={{ color: "var(--neon-accent)" }} className="text-xs hover:opacity-70 transition-opacity">
            浏览文章
          </Link>
        </div>
        <div className="flex flex-wrap gap-2">
          {tags.slice(0, 36).map(({ tag, count }) => (
            <Link key={tag} href={`/search?tag=${encodeURIComponent(tag)}`} className="tag-pill">
              #{tag} {count}
            </Link>
          ))}
        </div>
      </section>
    </div>
  );
}
