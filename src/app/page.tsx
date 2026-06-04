import Link from "next/link";
import type { CSSProperties } from "react";
import { CATEGORY_GROUPS, getAllPosts, getAllTags, getCategoryColorClass } from "@/lib/posts";

const quickLinks = [
  { href: "/snippets", label: "代码片段", desc: "模板、脚本" },
  { href: "/problems", label: "错题题单", desc: "错题回顾" },
  { href: "/talks", label: "说说", desc: "碎片想法和日常记录" },
  { href: "/tools", label: "工具箱", desc: "进制转换、位运算小工具" },
];

export default async function HomePage() {
  const [posts, tags] = await Promise.all([getAllPosts(), getAllTags()]);
  const recentPosts = posts.slice(0, 6);
  const categoryCounts = Object.fromEntries(
    CATEGORY_GROUPS.map((group) => [group.name, posts.filter((post) => post.category === group.name).length])
  );

  return (
    <div className="max-w-6xl mx-auto px-5 sm:px-6 py-10 sm:py-14">
      <section className="mb-10">
        <div className="section-eyebrow mb-5">CP Notebook / CS Learning / Daily</div>
        <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_320px] lg:items-end">
          <div>
            <h1 className="hero-title mb-4">Keronshans</h1>
            <p className="text-lg leading-8 max-w-3xl" style={{ color: "var(--owl-textSecondary)" }}>
              菜菜小猫的窝//ACM 算法竞赛学习...CS 学习笔记...一些碎碎念...
            </p>
          </div>
          <div className="grid grid-cols-3 gap-3">
            <div className="stat-card" style={{ "--stat-color": "var(--neon-accent)" } as CSSProperties}>
              <span className="stat-dot" />
              <div>
                <div className="stat-value">{posts.length}</div>
                <div className="stat-label">文章</div>
              </div>
            </div>
            <div className="stat-card" style={{ "--stat-color": "var(--neon-green)" } as CSSProperties}>
              <span className="stat-dot" />
              <div>
                <div className="stat-value">{categoryCounts["题解复盘"] || 0}</div>
                <div className="stat-label">题解</div>
              </div>
            </div>
            <div className="stat-card" style={{ "--stat-color": "var(--neon-purple)" } as CSSProperties}>
              <span className="stat-dot" />
              <div>
                <div className="stat-value">{tags.length}</div>
                <div className="stat-label">标签</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="mb-10">
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-5">
          {CATEGORY_GROUPS.map((group) => {
            const count = categoryCounts[group.name] || 0;
            const latest = posts.find((post) => post.category === group.name);
            return (
              <Link
                key={group.name}
                href={`/posts?category=${encodeURIComponent(group.name)}`}
                className="dashboard-tile"
                style={{ "--tile-accent": group.accent } as CSSProperties}
              >
                <div className="flex items-center justify-between gap-3 mb-4">
                  <span className={`category-chip ${getCategoryColorClass(group.name)}`}>{group.name}</span>
                  <span className="dashboard-count">{count}</span>
                </div>
                <p className="dashboard-desc">{group.description}</p>
                <div className="dashboard-latest">
                  {latest ? latest.title : "等待填充内容"}
                </div>
              </Link>
            );
          })}
        </div>
      </section>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <section className="lg:col-span-2">
          <div className="flex items-center justify-between mb-5 pb-4" style={{ borderBottom: "1px solid var(--owl-border)" }}>
            <h2 className="text-xs font-semibold tracking-widest uppercase" style={{ color: "var(--owl-textMuted)" }}>
              最近更新
            </h2>
            <Link href="/posts" style={{ color: "var(--neon-accent)" }} className="text-xs hover:opacity-70 transition-opacity">
              查看全部
            </Link>
          </div>
          <div>
            {recentPosts.map((post) => (
              <Link key={post.id} href={`/posts/${post.id}`}>
                <article className="post-list-item group">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1.5 flex-wrap">
                      <span className={`category-chip ${getCategoryColorClass(post.category)}`}>{post.category}</span>
                      <span className="text-xs" style={{ color: "var(--owl-textMuted)" }}>{post.date}</span>
                    </div>
                    <h3 className="post-list-title">{post.title}</h3>
                    <p className="text-sm mt-1 line-clamp-2" style={{ color: "var(--owl-textSecondary)" }}>
                      {post.excerpt}
                    </p>
                  </div>
                </article>
              </Link>
            ))}
          </div>
        </section>

        <aside className="space-y-6">
          <div className="cyber-card p-5">
            <h3 className="text-xs font-semibold tracking-widest uppercase mb-4" style={{ color: "var(--owl-textMuted)" }}>
              快捷入口
            </h3>
            <div className="space-y-2">
              {quickLinks.map((link) => (
                <Link key={link.href} href={link.href} className="quick-link">
                  <span className="quick-link-mark">{link.label.slice(0, 1)}</span>
                  <span>
                    <span className="quick-link-title">{link.label}</span>
                    <span className="quick-link-desc">{link.desc}</span>
                  </span>
                </Link>
              ))}
            </div>
          </div>

          <div className="cyber-card p-5">
            <h3 className="text-xs font-semibold tracking-widest uppercase mb-4" style={{ color: "var(--owl-textMuted)" }}>
              高频标签
            </h3>
            <div className="flex flex-wrap gap-1.5">
              {tags.slice(0, 28).map(({ tag, count }) => (
                <Link key={tag} href={`/search?tag=${encodeURIComponent(tag)}`} className="tag-pill">
                  #{tag} {count}
                </Link>
              ))}
            </div>
          </div>
        </aside>
      </div>
    </div>
  );
}
