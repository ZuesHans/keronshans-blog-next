import Link from "next/link";
import type { CSSProperties } from "react";
import { CATEGORY_GROUPS, getAllPosts, getCategoryColorClass } from "@/lib/posts";

export default async function HomePage() {
  const posts = await getAllPosts();
  const featuredPosts = posts.slice(0, 4);
  const visibleCategories = CATEGORY_GROUPS.slice(0, 5);
  const categoryCounts = Object.fromEntries(
    CATEGORY_GROUPS.map((group) => [group.name, posts.filter((post) => post.category === group.name).length])
  );

  return (
    <div className="home-page -mt-16">
      <section className="home-cover" aria-labelledby="homeTitle">
        <div className="home-cover-shade" aria-hidden="true" />
        <div className="site-shell home-cover-content">
          <h1 id="homeTitle">Keronshans</h1>
          <p>菜菜小猫的窝</p>
          <div className="home-cover-actions">
            <Link href="/posts" className="primary-command">
              浏览文章 <span aria-hidden="true">→</span>
            </Link>
            <Link href="/about" className="secondary-command">关于我</Link>
          </div>
        </div>
      </section>

      <section className="home-content-band" aria-labelledby="latestTitle">
        <div className="site-shell">
          <header className="home-band-heading">
            <div>
              <span>Recently updated</span>
              <h2 id="latestTitle">最近更新</h2>
            </div>
            <Link href="/posts">全部文章 <span aria-hidden="true">↗</span></Link>
          </header>

          <div className="home-post-grid">
            {featuredPosts.map((post) => (
              <Link key={post.id} href={`/posts/${post.id}`} className="home-post-card">
                <article>
                  <div className="home-post-meta">
                    {post.pinned && <span className="pinned-label">置顶</span>}
                    <span className={`category-chip ${getCategoryColorClass(post.category)}`}>{post.category}</span>
                    <time>{post.date}</time>
                  </div>
                  <h3>{post.title}</h3>
                  {post.excerpt && <p>{post.excerpt}</p>}
                  <div className="home-post-foot">
                    <span>{post.tags.slice(0, 4).map((tag) => `#${tag}`).join("  ")}</span>
                    <span aria-hidden="true">↗</span>
                  </div>
                </article>
              </Link>
            ))}
          </div>
        </div>
      </section>

      <section className="home-category-band" aria-labelledby="categoryTitle">
        <div className="site-shell home-category-layout">
          <div>
            <h2 id="categoryTitle">沿着分类继续看</h2>
          </div>
          <div className="home-category-grid">
            {visibleCategories.map((group) => (
              <Link
                key={group.name}
                href={`/posts?category=${encodeURIComponent(group.name)}`}
                className="home-category-link"
                style={{ "--tile-accent": group.accent } as CSSProperties}
              >
                <span>{group.name}</span>
                <strong>{categoryCounts[group.name] || 0}</strong>
              </Link>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}
