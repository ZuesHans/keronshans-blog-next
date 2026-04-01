import Link from "next/link";
import { getAllPosts, getAllTags, getPostsByCategory, getCategoryColorClass } from "@/lib/posts";
import HeroSubtitle from "@/components/HeroSubtitle";

// 首页使用静态生成（build 时读取文章），不要 force-dynamic
// 因为 Cloudflare Worker 运行时无法使用 fs 模块读取本地文件

const catColorMap: Record<string, string> = {
  "笔记": "bg-neon-pink",
  "模板": "bg-neon-blue",
  "题解": "bg-neon-green",
  "专题": "bg-neon-purple",
  "日记": "bg-neon-yellow",
};

export default function HomePage() {
  const posts = getAllPosts();
  const tags = getAllTags();
  const recentPosts = posts.slice(0, 6);
  const categories = ["笔记", "模板", "题解", "专题", "日记"].filter(
    (cat) => getPostsByCategory(cat).length > 0
  );

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      {/* Hero Section */}
      <section className="relative mb-12">
        <div className="relative overflow-hidden rounded-2xl border border-gray-200 dark:border-cyber-border bg-gradient-to-br from-gray-50 to-white dark:from-cyber-darker dark:to-cyber-card p-8 sm:p-12">
          <div className="absolute inset-0 bg-grid-pattern bg-grid opacity-50 dark:opacity-100" />
          <div className="absolute inset-0 scanline-overlay" />

          <div className="relative z-10 text-center sm:text-left">
            <div className="flex items-center justify-center sm:justify-start gap-2 mb-4 font-mono text-xs text-gray-500 dark:text-gray-400">
              <span className="w-2 h-2 rounded-full bg-neon-green animate-pulse" />
              SYSTEM ONLINE
            </div>

            <h1 className="text-5xl sm:text-6xl lg:text-7xl font-display font-black mb-2 leading-tight">
              <span className="glitch" data-text="Keronshans's little bag">Keronshans's little bag</span>
            </h1>
            <div className="mb-6">
              <HeroSubtitle />
            </div>

            <div className="flex flex-wrap justify-center sm:justify-start gap-3">
              <Link href="/posts" className="cyber-btn text-base px-6 py-2.5">
                浏览文章
              </Link>
              <Link href="/snippets" className="cyber-btn-blue text-base px-6 py-2.5">
                代码片段
              </Link>
              <Link href="/tools" className="cyber-btn-green text-base px-6 py-2.5">
                工具箱
              </Link>
            </div>
          </div>

          <div className="absolute top-4 right-4 text-xs font-mono text-gray-300 dark:text-gray-600">
            {posts.length} POSTS LOADED
          </div>
          <div className="absolute bottom-4 right-4 text-xs font-mono text-neon-pink/40">
            v1.0.0 // CYBERPUNK EDITION
          </div>
        </div>
      </section>

      {/* Stats Bar */}
      <section className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-10">
        {[
          { label: "文章", value: posts.length, icon: "◈", colorClass: "text-neon-pink" },
          { label: "模板", value: getPostsByCategory("模板").length + getPostsByCategory("笔记").length, icon: "◻", colorClass: "text-neon-blue" },
          { label: "标签", value: tags.length, icon: "#", colorClass: "text-neon-green" },
          { label: "题解", value: getPostsByCategory("题解").length, icon: "◈", colorClass: "text-neon-purple" },
        ].map((stat) => (
          <div key={stat.label} className="cyber-card p-4 text-center">
            <div className={`text-2xl font-display font-bold ${stat.colorClass}`}>
              <span className="text-lg">{stat.icon}</span> {stat.value}
            </div>
            <div className="text-xs font-mono text-gray-500 dark:text-gray-400 mt-1">{stat.label}</div>
          </div>
        ))}
      </section>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Recent Posts */}
        <section className="lg:col-span-2">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-display font-bold">
              <span className="neon-text">◈</span> 最新文章
            </h2>
            <Link href="/posts" className="text-sm font-mono text-gray-500 hover:text-neon-pink transition-colors">
              查看全部 →
            </Link>
          </div>
          <div className="space-y-3">
            {recentPosts.map((post) => (
              <Link key={post.id} href={`/posts/${post.id}`}>
                <article className="cyber-card p-4 group cursor-pointer">
                  <div className="flex items-start gap-3">
                    <span className={`shrink-0 px-2 py-0.5 rounded text-xs font-mono border ${getCategoryColorClass(post.category)}`}>
                      {post.category}
                    </span>
                    <div className="flex-1 min-w-0">
                      <h3 className="font-bold group-hover:text-neon-pink transition-colors truncate">
                        {post.title}
                      </h3>
                      <p className="text-sm text-gray-500 dark:text-gray-400 line-clamp-1 mt-0.5">
                        {post.excerpt}
                      </p>
                      <div className="flex items-center gap-2 mt-1 text-xs text-gray-400 font-mono">
                        <span>{post.date}</span>
                        {post.tags.slice(0, 3).map((tag) => (
                          <span key={tag}>#{tag}</span>
                        ))}
                      </div>
                    </div>
                  </div>
                </article>
              </Link>
            ))}
          </div>
        </section>

        {/* Sidebar */}
        <aside className="space-y-6">
          {/* Quick Links */}
          <div className="cyber-card p-5">
            <h3 className="font-display font-bold mb-3 text-neon-purple">快捷入口</h3>
            <div className="space-y-2">
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
                  className="flex items-center gap-3 py-2 hover:text-neon-pink transition-colors group"
                >
                  <span className="w-8 h-8 rounded bg-gray-100 dark:bg-cyber-surface flex items-center justify-center text-xs font-mono group-hover:bg-neon-pink/10 group-hover:text-neon-pink transition-all">
                    {link.label[0]}
                  </span>
                  <div>
                    <div className="text-sm font-mono">{link.label}</div>
                    <div className="text-xs text-gray-400">{link.desc}</div>
                  </div>
                </Link>
              ))}
            </div>
          </div>

          {/* Tags Cloud */}
          <div className="cyber-card p-5">
            <h3 className="font-display font-bold mb-3 text-neon-green">标签云</h3>
            <div className="flex flex-wrap gap-1.5">
              {tags.map(({ tag, count }) => (
                <Link
                  key={tag}
                  href={`/search?tag=${encodeURIComponent(tag)}`}
                  className="px-2 py-0.5 rounded text-xs font-mono text-gray-500 dark:text-gray-400 bg-gray-100 dark:bg-cyber-surface hover:text-neon-pink hover:bg-neon-pink/10 hover:border-neon-pink/30 border border-transparent transition-all"
                >
                  #{tag}
                </Link>
              ))}
            </div>
          </div>

          {/* Categories */}
          <div className="cyber-card p-5">
            <h3 className="font-display font-bold mb-3 text-neon-blue">分类</h3>
            <div className="space-y-2">
              {categories.map((cat) => {
                const count = getPostsByCategory(cat).length;
                return (
                  <Link
                    key={cat}
                    href={`/posts?category=${cat}`}
                    className="flex items-center justify-between py-1.5 hover:text-neon-pink transition-colors group"
                  >
                    <span className="flex items-center gap-2">
                      <span className={`w-2 h-2 rounded-full ${catColorMap[cat] || "bg-neon-pink"}`} />
                      <span className="text-sm font-mono">{cat}</span>
                    </span>
                    <span className="text-xs font-mono text-gray-400 bg-gray-100 dark:bg-cyber-surface px-2 py-0.5 rounded group-hover:text-neon-pink">
                      {count}
                    </span>
                  </Link>
                );
              })}
            </div>
          </div>
        </aside>
      </div>
    </div>
  );
}
