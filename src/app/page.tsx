import Link from "next/link";
import { getAllPosts, getAllTags } from "@/lib/posts";

const catCssVarMap: Record<string, string> = {
  "笔记": "var(--neon-pink)",
  "模板": "var(--neon-accent)",
  "题解": "var(--neon-green)",
  "专题": "var(--neon-purple)",
  "日记": "var(--neon-yellow)",
};

export default async function HomePage() {
  const [posts, tags] = await Promise.all([getAllPosts(), getAllTags()]);
  const recentPosts = posts.slice(0, 6);
  const categoryNames = ["笔记", "模板", "题解", "专题", "日记"];
  const catCounts = Object.fromEntries(
    categoryNames.map((cat) => [cat, posts.filter((p) => p.category === cat).length])
  );
  const categories = categoryNames.filter((cat) => catCounts[cat] > 0);

  return (
    <div className="max-w-6xl mx-auto px-6 py-14">

      {/* ===== Hero ===== */}
      <section className="mb-16 max-w-3xl">
        <div className="section-eyebrow mb-5">Notebook · CP · Daily</div>
        <h1 className="hero-title mb-3">
          Keronshans
        </h1>
        <p className="text-lg leading-8 mb-8" style={{ color: "var(--owl-textSecondary)" }}>
          <span style={{ color: "var(--neon-accent)", fontWeight: 600 }}>小猫的窝</span>
          <span className="mx-2">/</span>
          算法模板、题解整理、日常碎片和一点正在长出来的工程感。
        </p>

        {/* Stats */}
        <div className="flex flex-wrap gap-3">
          <div className="stat-card" style={{ "--stat-color": "var(--neon-accent)" } as React.CSSProperties}>
            <span className="stat-dot" />
            <div>
              <div className="stat-value">{posts.length}</div>
              <div className="stat-label">文章</div>
            </div>
          </div>
          <div className="stat-card" style={{ "--stat-color": "var(--neon-purple)" } as React.CSSProperties}>
            <span className="stat-dot" />
            <div>
              <div className="stat-value">{catCounts["模板"] + catCounts["笔记"]}</div>
              <div className="stat-label">模板 & 笔记</div>
            </div>
          </div>
          <div className="stat-card" style={{ "--stat-color": "var(--neon-pink)" } as React.CSSProperties}>
            <span className="stat-dot" />
            <div>
              <div className="stat-value">{tags.length}</div>
              <div className="stat-label">标签</div>
            </div>
          </div>
          <div className="stat-card" style={{ "--stat-color": "var(--neon-green)" } as React.CSSProperties}>
            <span className="stat-dot" />
            <div>
              <div className="stat-value">{catCounts["题解"]}</div>
              <div className="stat-label">题解</div>
            </div>
          </div>
        </div>
      </section>

      {/* ===== Latest Posts + Sidebar ===== */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">

        {/* Recent Posts */}
        <section className="lg:col-span-2">
          <div className="flex items-center justify-between mb-6 pb-4" style={{ borderBottom: "1px solid var(--owl-border)" }}>
            <h2 className="text-xs font-semibold tracking-widest uppercase" style={{ color: "var(--owl-textMuted)" }}>最新文章</h2>
            <Link href="/posts" style={{ color: "var(--neon-accent)" }} className="text-xs hover:opacity-70 transition-opacity">
              查看全部 →
            </Link>
          </div>
          <div>
            {recentPosts.map((post) => (
              <Link key={post.id} href={`/posts/${post.id}`}>
                <article className="post-list-item group">
                  <div className="flex-1 min-w-0">
                    <h3 className="post-list-title">{post.title}</h3>
                    <div className="flex items-center gap-2 mt-1.5 flex-wrap">
                      <span className="text-xs" style={{ color: "var(--owl-textMuted)" }}>{post.date}</span>
                      {post.tags.slice(0, 3).map((tag) => (
                        <span key={tag} className="tag-pill">#{tag}</span>
                      ))}
                    </div>
                  </div>
                  <span className="post-category-badge">{post.category}</span>
                </article>
              </Link>
            ))}
          </div>
        </section>

        {/* Sidebar */}
        <aside className="space-y-8">

          {/* Quick Links */}
          <div className="cyber-card p-5">
            <h3 className="text-xs font-semibold tracking-widest uppercase mb-4" style={{ color: "var(--owl-textMuted)" }}>快捷入口</h3>
            <div className="space-y-1">
              {[
                { href: "/snippets", label: "代码片段", desc: "算法模板" },
                { href: "/problems", label: "题单", desc: "刷题/补题记录" },
                { href: "/checkin", label: "打卡", desc: "每日签到" },
                { href: "/tools", label: "工具箱", desc: "进制转换/位运算" },
                { href: "/talks", label: "说说", desc: "碎碎念" },
                { href: "/about", label: "关于", desc: "关于我" },
              ].map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  className="flex items-center gap-3 py-2.5 transition-colors group"
                  style={{ color: "var(--owl-textSecondary)" }}
                >
                  <span className="w-7 h-7 rounded-lg flex items-center justify-center text-xs font-medium transition-all border border-transparent"
                    style={{ background: "var(--owl-bgSubtle)", color: "var(--neon-accent)" }}
                  >
                    {link.label[0]}
                  </span>
                  <div>
                    <div className="text-sm transition-colors" style={{ color: "var(--owl-textSecondary)" }}>{link.label}</div>
                    <div className="text-xs" style={{ color: "var(--owl-textMuted)" }}>{link.desc}</div>
                  </div>
                </Link>
              ))}
            </div>
          </div>

          {/* Tags */}
          <div className="cyber-card p-5">
            <h3 className="text-xs font-semibold tracking-widest uppercase mb-4" style={{ color: "var(--owl-textMuted)" }}>标签云</h3>
            <div className="flex flex-wrap gap-1.5">
              {tags.map(({ tag }) => (
                <Link
                  key={tag}
                  href={`/search?tag=${encodeURIComponent(tag)}`}
                  className="tag-pill hover:text-neon-blue transition-all"
                  style={{ borderColor: "transparent" }}
                >
                  #{tag}
                </Link>
              ))}
            </div>
          </div>

          {/* Categories */}
          <div className="cyber-card p-5">
            <h3 className="text-xs font-semibold tracking-widest uppercase mb-4" style={{ color: "var(--owl-textMuted)" }}>分类</h3>
            <div className="space-y-1">
              {categories.map((cat) => (
                <Link
                  key={cat}
                  href={`/posts?category=${cat}`}
                  className="flex items-center justify-between py-2 transition-colors group"
                  style={{ color: "var(--owl-textSecondary)" }}
                >
                  <span className="flex items-center gap-2">
                    <span className="cat-dot" style={{ background: catCssVarMap[cat] }} />
                    <span className="text-sm transition-colors">{cat}</span>
                  </span>
                  <span className="text-xs px-2 py-0.5 rounded transition-colors"
                    style={{ background: "var(--owl-tagBg)", color: "var(--owl-textMuted)" }}
                  >
                    {catCounts[cat]}
                  </span>
                </Link>
              ))}
            </div>
          </div>

        </aside>
      </div>
    </div>
  );
}
