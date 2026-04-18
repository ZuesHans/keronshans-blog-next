import Link from "next/link";
import { getAllPosts, getAllTags, getCategoryColorClass } from "@/lib/posts";

const catColorMap: Record<string, string> = {
  "笔记": "bg-neon-blue",
  "模板": "bg-neon-purple",
  "题解": "bg-neon-green",
  "专题": "bg-neon-yellow",
  "日记": "bg-neon-pink",
};

const catCssVarMap: Record<string, string> = {
  "笔记": "var(--neon-blue)",
  "模板": "var(--neon-purple)",
  "题解": "var(--neon-green)",
  "专题": "var(--neon-yellow)",
  "日记": "var(--neon-pink)",
};

export default async function HomePage() {
  const [posts, tags] = await Promise.all([getAllPosts(), getAllTags()]);
  const recentPosts = posts.slice(0, 6);
  const catCounts = Object.fromEntries(
    ["笔记", "模板", "题解", "专题", "日记"].map((cat) => [cat, posts.filter((p) => p.category === cat).length])
  );
  const categories = ["笔记", "模板", "题解", "专题", "日记"].filter((cat) => catCounts[cat] > 0);

  return (
    <div className="max-w-6xl mx-auto px-6 py-12">

      {/* ===== Hero ===== */}
      <section className="mb-16">
        <div className="section-eyebrow mb-5">算法 · 笔记 · 模板</div>
        <h1 className="hero-title mb-3">
          Keronshans
        </h1>
        <p className="text-lg font-light text-owl-textSecondary mb-8 tracking-wide">
          <span className="text-neon-blue font-medium">技术博客</span>
          {" · "}算法竞赛{" · "}错题整理
        </p>

        {/* Stats */}
        <div className="flex flex-wrap gap-3">
          <div className="stat-card" style={{ "--stat-color": "var(--neon-blue)" } as React.CSSProperties}>
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
          <div className="flex items-center justify-between mb-6 pb-4 border-b border-gray-100 dark:border-owl-border">
            <h2 className="text-xs font-semibold tracking-widest uppercase text-owl-textMuted">最新文章</h2>
            <Link href="/posts" className="text-xs text-neon-blue hover:opacity-70 transition-opacity">
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
                      <span className="text-xs text-owl-textMuted">{post.date}</span>
                      {post.tags.slice(0, 3).map((tag) => (
                        <span key={tag} className="tag-pill">#{tag}</span>
                      ))}
                    </div>
                  </div>
                  <span className="post-category-badge text-owl-textMuted">{post.category}</span>
                </article>
              </Link>
            ))}
          </div>
        </section>

        {/* Sidebar */}
        <aside className="space-y-8">

          {/* Quick Links */}
          <div className="cyber-card p-5">
            <h3 className="text-xs font-semibold tracking-widest uppercase text-owl-textMuted mb-4">快捷入口</h3>
            <div className="space-y-1">
              {[
                { href: "/snippets", label: "代码片段", desc: "ACM算法模板" },
                { href: "/problems", label: "题单", desc: "刷题/补题记录" },
                { href: "/checkin", label: "打卡", desc: "每日刷题签到" },
                { href: "/tools", label: "工具箱", desc: "进制转换/位运算" },
                { href: "/talks", label: "说说", desc: "碎碎念" },
                { href: "/about", label: "关于", desc: "关于我" },
              ].map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  className="flex items-center gap-3 py-2.5 hover:text-neon-blue transition-colors group"
                >
                  <span className="w-7 h-7 rounded-lg bg-owl-tagBg dark:bg-owl-bgCard flex items-center justify-center text-xs font-medium text-owl-textMuted group-hover:bg-owl-bgCard group-hover:text-neon-blue transition-all border border-transparent group-hover:border-owl-borderHover">
                    {link.label[0]}
                  </span>
                  <div>
                    <div className="text-sm text-owl-textSecondary group-hover:text-owl-text transition-colors">{link.label}</div>
                    <div className="text-xs text-owl-textMuted">{link.desc}</div>
                  </div>
                </Link>
              ))}
            </div>
          </div>

          {/* Tags */}
          <div className="cyber-card p-5">
            <h3 className="text-xs font-semibold tracking-widest uppercase text-owl-textMuted mb-4">标签云</h3>
            <div className="flex flex-wrap gap-1.5">
              {tags.map(({ tag }) => (
                <Link
                  key={tag}
                  href={`/search?tag=${encodeURIComponent(tag)}`}
                  className="tag-pill hover:text-neon-blue hover:border-owl-borderHover transition-all"
                >
                  #{tag}
                </Link>
              ))}
            </div>
          </div>

          {/* Categories */}
          <div className="cyber-card p-5">
            <h3 className="text-xs font-semibold tracking-widest uppercase text-owl-textMuted mb-4">分类</h3>
            <div className="space-y-1">
              {categories.map((cat) => (
                <Link
                  key={cat}
                  href={`/posts?category=${cat}`}
                  className="flex items-center justify-between py-2 hover:text-neon-blue transition-colors group"
                >
                  <span className="flex items-center gap-2">
                    <span className="cat-dot" style={{ background: catCssVarMap[cat] }} />
                    <span className="text-sm text-owl-textSecondary group-hover:text-owl-text transition-colors">{cat}</span>
                  </span>
                  <span className="text-xs text-owl-textMuted bg-owl-tagBg dark:bg-owl-bgCard px-2 py-0.5 rounded group-hover:text-neon-blue transition-colors">
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
