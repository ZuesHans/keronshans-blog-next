import Link from "next/link";

export default function AboutPage() {
  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-4xl font-display font-bold mb-2">
          <span className="neon-text">◉</span> 关于
        </h1>
        <p className="text-gray-500 dark:text-gray-400 font-mono text-sm">
          &gt; SYSTEM.PROFILE.INIT
        </p>
        <div className="mt-2 h-[1px] bg-gradient-to-r from-neon-pink via-neon-blue to-neon-green opacity-50" />
      </div>

      <div className="grid gap-6">
        {/* Profile Card */}
        <div className="cyber-card neon-border p-6 sm:p-8">
          <div className="flex flex-col sm:flex-row items-center sm:items-start gap-6">
            {/* Avatar */}
            <div className="shrink-0">
              <div className="w-28 h-28 rounded-full bg-gradient-to-br from-neon-pink via-neon-blue to-neon-green p-[2px] animate-border-glow">
                <div className="w-full h-full rounded-full bg-white dark:bg-cyber-card flex items-center justify-center">
                  <span className="text-5xl font-display font-bold neon-text">K</span>
                </div>
              </div>
            </div>

            {/* Info */}
            <div className="flex-1 text-center sm:text-left">
              <h2 className="text-3xl font-display font-bold mb-1">
                <span className="glitch" data-text="Keronshans">Keronshans</span>
              </h2>
              <p className="text-neon-blue font-mono text-sm mb-4">@Keronshans@gmail.com</p>
              <div className="space-y-2 text-sm text-gray-600 dark:text-gray-400">
                <p className="font-mono">
                  <span className="text-neon-pink">&gt;</span> 大学生 / 中国南方
                </p>
                <p className="font-mono">
                  <span className="text-neon-blue">&gt;</span> ACMer / C++
                </p>
                <p className="font-mono">
                  <span className="text-neon-green">&gt;</span> nootropics实践中...
                </p>
                <p className="font-mono">
                  <span className="text-neon-purple">&gt;</span> 其实是一只会打字的小猫而已
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          {[
            { label: "文章数", value: "27", color: "neon-pink" },
            { label: "模板数", value: "10+", color: "neon-blue" },
            { label: "标签数", value: "8+", color: "neon-green" },
            { label: "说说数", value: "∞", color: "neon-purple" },
          ].map((stat) => (
            <div key={stat.label} className="cyber-card p-4 text-center">
              <div className={`text-2xl font-display font-bold text-${stat.color}`}>{stat.value}</div>
              <div className="text-xs font-mono text-gray-500 dark:text-gray-400 mt-1">{stat.label}</div>
            </div>
          ))}
        </div>

        {/* Tech Stack */}
        <div className="cyber-card neon-border-blue p-6">
          <h3 className="text-lg font-display font-bold mb-4 text-neon-blue">
            {"// 可能了解"}
          </h3>
          <div className="flex flex-wrap gap-2">
            {[
              "C++", "Python", "ACM/XCPC", "图论", "动态规划",
              "精神分析", "音乐剧", "Hamilton (both f1 and musical)",
              "药理学", "三国杀", "中二|pjsk 入门...",
            ].map((tech) => (
              <span
                key={tech}
                className="px-3 py-1 rounded-full text-xs font-mono bg-neon-blue/10 text-neon-blue border border-neon-blue/20 hover:bg-neon-blue/20 transition-all cursor-default"
              >
                {tech}
              </span>
            ))}
          </div>
        </div>

        {/* Blog Info */}
        <div className="cyber-card neon-border-green p-6">
          <h3 className="text-lg font-display font-bold mb-4 text-neon-green">
            {"// 关于窝"}
          </h3>
          <div className="space-y-3 text-sm text-gray-600 dark:text-gray-400 font-mono">
            <p>
              <span className="text-neon-green">&gt;</span> 文章内容来源于个人学习笔记和解题记录
            </p>
            <p>
              <span className="text-neon-green">&gt;</span> github:https://github.com/ZuesHans
            </p>
            <p>
              <span className="text-neon-green">&gt;</span>
            </p>
            <p>
              <span className="text-neon-green">&gt;</span>
            </p>
            <p>
              <span className="text-neon-green">&gt;</span>
            </p>
          </div>
        </div>

        {/* Links */}
        <div className="cyber-card p-6">
          <h3 className="text-lg font-display font-bold mb-4 text-neon-purple">
            {"// 友情链接"}
          </h3>
          <div className="space-y-2">
            <Link
              href="https://github.com/ZuesHans"
              target="_blank"
              className="flex items-center gap-3 p-3 rounded-lg hover:bg-gray-50 dark:hover:bg-cyber-surface transition-all group"
            >
              <span className="text-xl">🐙</span>
              <div>
                <div className="font-mono text-sm group-hover:text-neon-pink transition-colors">GitHub</div>
                <div className="text-xs text-gray-400">github.com/ZuesHans</div>
              </div>
            </Link>

            {/* <Link
              href="https://你的链接"
              target="_blank"
              className="flex items-center gap-3 p-3 rounded-lg hover:bg-gray-50 dark:hover:bg-cyber-surface transition-all group"
            >
              <span className="text-xl">🔗</span>
              <div>
                <div className="font-mono text-sm group-hover:text-neon-pink transition-colors">博客园</div>
                <div className="text-xs text-gray-400">cnblogs.com/xxx</div>
              </div>
            </Link> */}

          </div>
        </div>
      </div>
    </div>
  );
}
