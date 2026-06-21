import Link from "next/link";

const interests = [
  "C++",
  "Python",
  "ACM / XCPC",
  "算法题解",
  "数据结构",
  "音乐剧",
  "Hamilton",
  "音游|中二 pjsk",
];

const awards = [
  "2026 第 23 届腾讯 CodeBuddy 杯广东省大学生程序设计竞赛 银奖",
  "2026 河南省大学生程序设计竞赛 银奖",
  "2026 蓝桥杯省赛 一等奖",
  "2026 蓝桥杯国赛 二等奖",
  "团体程序设计天梯赛 国三",
];

const links = [
  {
    title: "GitHub",
    href: "https://github.com/ZuesHans",
    label: "github.com/ZuesHans",
  },
  {
    title: "Codeforces",
    href: "https://codeforces.com/profile/zueshans",
    label: "codeforces.com/profile/zueshans",
  },
  {
    title: "X",
    href: "https://x.com/Kerons8",
    label: "x.com/Kerons8",
  },
];

export default function AboutPage() {
  return (
    <div className="about-page -mt-16">
      <section className="relative min-h-[100svh] overflow-hidden">
        <img
          src="/about-summer-solstice.png"
          alt="夏至荷塘背景"
          className="absolute inset-0 h-full w-full object-cover"
        />
        <div className="absolute inset-0 bg-[linear-gradient(90deg,rgba(8,24,24,0.72),rgba(8,24,24,0.26)_48%,rgba(8,24,24,0.62)),linear-gradient(180deg,rgba(8,24,24,0.18),rgba(8,24,24,0.84))]" />

        <div className="relative z-10 mx-auto flex min-h-[100svh] max-w-6xl flex-col justify-end px-5 pb-12 pt-28 sm:px-6 lg:pb-16">
          <div className="max-w-3xl">
            <div className="mb-6 flex items-end gap-5">
              <img
                src="/avatar.jpg"
                alt="Keronshans avatar"
                className="h-24 w-24 rounded-md border object-cover shadow-2xl sm:h-32 sm:w-32"
                style={{ borderColor: "rgba(255,255,255,0.62)" }}
              />
              <div className="pb-1 text-white">
                <div className="mb-2 text-xs font-semibold uppercase tracking-[0.24em] text-white/72">
                  Profile
                </div>
                <h1 className="font-display text-5xl font-medium leading-none sm:text-7xl">
                  Keronshans
                </h1>
              </div>
            </div>

            <p className="max-w-2xl text-base leading-8 text-white/86 sm:text-lg">
              ACMer / CS 新生 || 这里是我的题解、模板、笔记和碎碎念的归档处 | 一点点把生活和学习重新排版的地方。
            </p>

            <div className="mt-7 flex flex-wrap gap-3 text-sm text-white/82">
              <span className="rounded-md border border-white/28 bg-white/10 px-3 py-1.5 backdrop-blur">
                tp : 广州
              </span>
              <span className="rounded-md border border-white/28 bg-white/10 px-3 py-1.5 backdrop-blur">
                Keronshans@gmail.com
              </span>
              {/* <span className="rounded-md border border-white/28 bg-white/10 px-3 py-1.5 backdrop-blur">

              </span> */}
            </div>
          </div>

          <a
            href="#about-content"
            className="mt-12 inline-flex w-fit items-center gap-2 text-sm font-medium text-white/78 transition hover:text-white"
          >
            往下有小猫粮~
            <span aria-hidden="true">↓</span>
          </a>
        </div>
      </section>

      <section id="about-content" className="mx-auto max-w-6xl px-5 py-14 sm:px-6 sm:py-16">
        <div className="grid gap-10 lg:grid-cols-[minmax(0,1fr)_320px]">
          <main className="space-y-10">
            <div>
              <div className="page-kicker mb-3">About</div>
              <h2 className="page-heading mb-4">关于这个博客，也关于我</h2>
              <p className="max-w-3xl text-base leading-8" style={{ color: "var(--owl-textSecondary)" }}>
                这个站点更像是我的笔记本大合集。高中的时候就一直喜欢用一本活页本同时做笔记本,规划本,草稿本,传小纸条专用(bushi)和日记本... 现在上了大学有时间捯饬了,加上codex的大力协助,有了第一个便于管理的赛博笔记本(骄傲脸)。
                不过...虽然大部分入门都是vibe出来的,这个网站还是花了我很多心血,毕竟ai不是万能的。也在这过程中我学习了很多。从一开始简陋的hexo框架到现在这个看起来更加自由的页面...
                一直都是一个比较内向不被人在意人类,所以能看到这个博客的都是真爱,太感动了喵呜呜。
                目前还是一个初学者,能写的内容也就是acm错题了(其实cp也是苦手555).不过目前在努力学习中,争取产出更高效的内容
              </p>
              <div className="soft-divider" />
            </div>

            <section className="border-y py-7" style={{ borderColor: "var(--owl-border)" }}>
              <div className="mb-5 flex items-center justify-between gap-4">
                <h3 className="text-sm font-semibold uppercase tracking-widest" style={{ color: "var(--owl-text)" }}>
                  Interests
                </h3>
                <span className="text-xs" style={{ color: "var(--owl-textMuted)" }}>
                  可能了解
                </span>
              </div>
              <div className="flex flex-wrap gap-2.5">
                {interests.map((interest) => (
                  <span key={interest} className="tag-pill cursor-default px-3 py-1.5 text-sm">
                    {interest}
                  </span>
                ))}
              </div>
            </section>

            <section>
              <div className="mb-5 flex items-center justify-between gap-4">
                <h3 className="text-sm font-semibold uppercase tracking-widest" style={{ color: "var(--owl-text)" }}>
                  Awards
                </h3>
                <span className="text-xs" style={{ color: "var(--owl-textMuted)" }}>
                  竞赛记录
                </span>
              </div>
              <div className="space-y-3">
                {awards.map((award) => (
                  <div
                    key={award}
                    className="flex gap-3 border-b pb-3 text-sm leading-7 last:border-b-0"
                    style={{ borderColor: "var(--owl-border)", color: "var(--owl-textSecondary)" }}
                  >
                    <span className="mt-3 h-1.5 w-1.5 shrink-0 rounded-full" style={{ background: "var(--neon-accent)" }} />
                    <span>{award}</span>
                  </div>
                ))}
              </div>
            </section>
          </main>

          <aside className="space-y-6 lg:pt-16">
            <section className="cyber-card p-5">
              <h3 className="mb-4 text-sm font-semibold uppercase tracking-widest" style={{ color: "var(--owl-text)" }}>
                Links
              </h3>
              <div className="space-y-2">
                {links.map((link) => (
                  <Link
                    key={link.href}
                    href={link.href}
                    target="_blank"
                    className="quick-link"
                  >
                    <span className="quick-link-mark">{link.title.slice(0, 1)}</span>
                    <span className="min-w-0">
                      <span className="quick-link-title">{link.title}</span>
                      <span className="quick-link-desc truncate">{link.label}</span>
                    </span>
                  </Link>
                ))}
              </div>
            </section>

            <section className="cyber-card p-5">
              <h3 className="mb-3 text-base font-semibold" style={{ color: "var(--owl-text)" }}>
                项目陈列室
              </h3>
              <p className="mb-5 text-sm leading-7" style={{ color: "var(--owl-textSecondary)" }}>
                一个小小的仓库,放搓出来的各种玩具喵
              </p>
              <Link href="/projects" className="cyber-btn inline-flex items-center gap-2">
                查看项目
                <span aria-hidden="true">→</span>
              </Link>
            </section>
          </aside>
        </div>
      </section>
    </div>
  );
}
