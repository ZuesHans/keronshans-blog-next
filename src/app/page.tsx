import Link from "next/link";
import type { CSSProperties } from "react";
import { CATEGORY_GROUPS, getAllPosts } from "@/lib/posts";
import PostCard from "@/components/theme/PostCard";

export const dynamic = "force-static";

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
          <div className="home-intro">
            <p className="home-kicker"><span aria-hidden="true" /> PERSONAL DEV LOG / EST. 2026</p>
            <h1 id="homeTitle">Keronshans<span className="home-title-caret" aria-hidden="true">_</span></h1>
            <p className="home-lede">把算法、代码和生活中的灵感，写成可以反复翻阅的笔记。</p>
            <div className="home-cover-actions">
              <Link href="/posts" className="primary-command">
                浏览文章 <span aria-hidden="true">↗</span>
              </Link>
              <Link href="/about" className="secondary-command">认识我 <span aria-hidden="true">→</span></Link>
            </div>
            <div className="home-hero-stats" aria-label="站点内容概览">
              <span><strong>{posts.length}</strong> 篇公开文章</span>
              <span><strong>{CATEGORY_GROUPS.length}</strong> 个主题分类</span>
              <span>持续更新中<span className="home-status-dot" aria-hidden="true" /></span>
            </div>
          </div>

          <div className="home-terminal" aria-hidden="true">
            <div className="home-terminal-head">
              <div className="home-terminal-dots"><i /><i /><i /></div>
              <span>~/keronshans/about.ts</span>
              <span>⌘</span>
            </div>
            <div className="home-terminal-body">
              <div><span>01</span><code><em>type</em> Note = <b>&quot;算法&quot;</b> | <b>&quot;模板&quot;</b> | <b>&quot;日常&quot;</b>;</code></div>
              <div><span>02</span><code /></div>
              <div><span>03</span><code><em>const</em> notebook = {'{'}</code></div>
              <div><span>04</span><code>  owner: <b>&quot;Keronshans&quot;</b>,</code></div>
              <div><span>05</span><code>  focus: [<b>&quot;ACM / XCPC&quot;</b>, <b>&quot;C++&quot;</b>],</code></div>
              <div><span>06</span><code>  status: <b>&quot;keep learning&quot;</b>,</code></div>
              <div><span>07</span><code>{'}'};</code></div>
              <div><span>08</span><code /></div>
              <div><span>09</span><code><em>export default</em> notebook;</code></div>
            </div>
            <div className="home-terminal-foot"><span><i /> All systems online</span><span>TypeScript · UTF-8</span></div>
          </div>
        </div>
      </section>

      <section className="home-content-band" aria-labelledby="latestTitle">
        <div className="site-shell">
          <header className="home-band-heading">
            <div>
              <span>01 / RECENT WRITING</span>
              <h2 id="latestTitle">最近更新</h2>
            </div>
            <Link href="/posts">全部文章 <span aria-hidden="true">↗</span></Link>
          </header>

          <div className="home-post-grid">
            {featuredPosts.map((post) => <PostCard key={post.id} post={post} />)}
          </div>
        </div>
      </section>

      <section className="home-category-band" aria-labelledby="categoryTitle">
        <div className="site-shell home-category-layout">
          <div>
            <span>02 / EXPLORE</span>
            <h2 id="categoryTitle">沿着分类继续看</h2>
            <p>从解题笔记到日常记录，挑一个感兴趣的方向继续逛。</p>
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
