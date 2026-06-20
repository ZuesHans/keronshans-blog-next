import Link from "next/link";

const interests = [
  "C++",
  "Python",
  "ACM / XCPC",
  "精神分析",
  "音乐剧爱好者",
  "Hamilton",
  "药理学",
  "中二 / pjsk 入门",
];

export default function AboutPage() {
  return (
    <div className="max-w-5xl mx-auto px-4 py-10">
      <div className="mb-8">
        <div className="page-kicker mb-3">Profile</div>
        <h1 className="page-heading mb-2">关于</h1>
        <p className="text-sm" style={{ color: "var(--owl-textSecondary)" }}>
          一点个人信息、兴趣入口和这个站存在的理由。
        </p>
        <div className="soft-divider" />
      </div>

      <div className="grid gap-6">
        <div className="cyber-card p-6 sm:p-8">
          <div className="grid grid-cols-1 md:grid-cols-[220px_1fr] gap-8 items-center">
            <div className="mx-auto md:mx-0">
              <img
                src="/avatar.jpg"
                alt="Keronshans avatar"
                className="w-44 h-44 sm:w-52 sm:h-52 object-cover rounded-2xl"
                style={{ boxShadow: "var(--owl-shadow)" }}
              />
            </div>

            <div className="text-center md:text-left">
              <h2 className="text-4xl font-display font-semibold mb-2">
                Keronshans
              </h2>
              <p className="font-mono text-sm mb-5" style={{ color: "var(--neon-accent)" }}>@Keronshans@gmail.com</p>
              <div className="space-y-2 text-base leading-7" style={{ color: "var(--owl-textSecondary)" }}>
                <p>大学生 / 中国南方 / ACMer / C++</p>
                <p>这里放算法题解、碎碎念，以及一些还在成型的自我管理系统。</p>
                <p>其实是一只会打字的小猫而已。</p>
              </div>
            </div>
          </div>
        </div>

        <div className="cyber-card p-6">
          <h3 className="text-xl font-display font-semibold mb-4">可能了解</h3>
          <div className="flex flex-wrap gap-3">
            {interests.map((tech) => (
              <span
                key={tech}
                className="px-4 py-2 rounded-lg text-sm font-medium cursor-default"
                style={{ background: "var(--owl-tagBg)", color: "var(--owl-tagText)" }}
              >
                {tech}
              </span>
            ))}
          </div>
        </div>

        {/* Blog Info */}
        <div className="cyber-card p-6">
          <h3 className="text-lg font-display font-semibold mb-4">
            关于窝
          </h3>
          <div className="space-y-3 text-sm font-mono" style={{ color: "var(--owl-textSecondary)" }}>
            <p>文章内容来源于学习笔记和解题记录。</p>
            <p>以后会慢慢把模板、错题、思路和碎碎念整理得更顺手。</p>
          </div>
        </div>
        {/* cp Info */}
        <div className="cyber-card p-6">
          <h3 className="text-lg font-display font-semibold mb-4">
            关于奖项
          </h3>
          <div className="space-y-3 text-sm font-mono" style={{ color: "var(--owl-textSecondary)" }}>
            <p>（只是做个归纳以免忘记了）</p>
            <p>2026年第二十三届腾讯“codebuddy杯”广东省大学生程序设计竞赛 银奖 </p>
            <p>2026年河南省大学生程序设计竞赛 银奖（打星） </p>
            <p>2026年蓝桥杯省赛一等奖 </p>
            <p>2026年蓝桥杯国赛二等奖 </p>
            <p>团体程序设计天梯赛 国三 </p>
          </div>
        </div>

        {/* Links */}
        <div className="cyber-card p-6">
          <h3 className="text-lg font-display font-semibold mb-4">
            关于我的页面链接
          </h3>
          <div className="space-y-2">
            <Link
              href="https://github.com/ZuesHans"
              target="_blank"
              className="flex items-center gap-3 p-3 rounded-lg transition-all group"
            >
              <div>
                <div className="font-mono text-sm transition-colors">GitHub</div>
                <div className="text-xs text-gray-400">github.com/ZuesHans</div>
              </div>
            </Link>

            <Link
              href="https://codeforces.com/profile/zueshans"
              target="_blank"
              className="flex items-center gap-3 p-3 rounded-lg transition-all group"
            >
              <div>
                <div className="font-mono text-sm transition-colors">Codeforces</div>
                <div className="text-xs text-gray-400">codeforces.com/profile/zueshans</div>
              </div>
            </Link>

            <Link
              href="https://x.com/Kerons8"
              target="_blank"
              className="flex items-center gap-3 p-3 rounded-lg transition-all group"
            >
              <div>
                <div className="font-mono text-sm transition-colors">推特</div>
                <div className="text-xs text-gray-400">x.com/Kerons8</div>
              </div>
            </Link>

          </div>
        </div>
      </div>
    </div>
  );
}
