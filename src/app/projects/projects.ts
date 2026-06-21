export type ProjectLink = {
  label: string;
  href: string;
};

export type Project = {
  id: string;
  title: string;
  category: string;
  period: string;
  status: string;
  summary: string;
  tags: string[];
  links: ProjectLink[];
  thread: string[];
};

export const projects: Project[] = [
  {
    id: "keronshans-blog-next",
    title: "这个博客站",
    category: "站点",
    period: "2026",
    status: "更新中",
    summary: "就是这个博客本身呀！现在看到的视觉版本是我还能接受的了",
    tags: ["Next.js", "Markdown", "Cloudflare"],
    links: [
      { label: "博客", href: "/" },
      { label: "文章", href: "/posts" },
    ],
    thread: [
      "从hexo博客框架开始,连github都不会用到能进行日常维护,到弄出一个比较稳定的视觉风格,一点点改成现在这个更自由的页面结构。",
      "核心目标是让题解、模板、错题和想法能被自己重新找到。接下来会继续补搜索、分类和更舒服的写作整理流程。",
      "实验性的展示项目可能会加在这里，可以尽情探索喵",
    ],
  },
  {
    id: "ZuesHans.github.io",
    title: "github Page 站点",
    category: "站点",
    period: "2026",
    status: "更新中",
    summary: "可以说是博客的\"旧站\"但实际上目前和这个站点时同步更新文章的",
    tags: ["Hexo", "Markdown"],
    links: [{ label: "访问", href: "https://zueshans.github.io/" }],
    thread: [
      "第一次产生建立博客想法的时候问gemini一步一步在电脑上搭建环境下载依赖做的。虽然时用了框架但是从零到一都是我掌控的内容。所以其实更喜欢访问这个网站",
      "没有花里胡哨的功能，配色比较纯净。搜索框比较方便。其实访问这个也能展示出想要展示的",
      "目前这个是一个更纯净的笔记本和浏览帖子的入口",
    ],
  },
  {
    id: "Semantic Blog Search",
    title: "博客内容语义化搜索",
    category: "工具",
    period: "2026",
    status: "可用",
    summary: "给个人博客做的本地语义搜索实验：把 Markdown 文章切成片段，生成 embedding，写入 Qdrant，再通过命令行或 API 找回相关博客内容。",
    tags: ["Python", "Qdrant", "Semantic Search"],
    links: [
      {
        label: "仓库",
        href: "https://github.com/ZuesHans/semantic-blog-search",
      },
      {
        label: "搜索实验",
        href: "/blog-search-lab",
      },
    ],
    thread: [
      "一开始的问题很朴素：博客文章越来越多以后，只靠目录和标签很难把过去写过的东西捞回来。",
      "所以它先做了一个清晰的 MVP：解析 Markdown，按标题和段落切成 chunk，生成向量后写入 Qdrant local mode。",
      "搜索时不是只靠语义相似度，而是加了一层轻量混合排序，让算法博客里的精确术语、标题和标签也能参与加分。",
      "后来又补了增量索引：新增、修改、删除文章时只处理变化的 Markdown，避免每次都重新 embedding 全量文章。",
      "现在它还能作为本地 API 服务常驻运行，再通过 Cloudflare Tunnel 接到网站后台，前端不用直接暴露搜索服务和 token。",
    ],
  },
  {
    id: "oj-desktop-widget",
    title: "OJ Float",
    category: "工具",
    period: "2026",
    status: "测试",
    summary: "一个 Windows 桌面悬浮 OJ 做题统计工具，用来集中查看多个 Online Judge 账号的通过题数变化和每日训练进度。",
    tags: ["Flutter", "Dart"],
    links: [
      {
        label: "仓库",
        href: "https://github.com/ZuesHans/oj-desktop-widget",
      },
    ],
    thread: [
      "这个项目的起点很直接：刷题平台太分散了，今天到底有没有推进、各平台题数有没有变化，不应该每次都手动打开一堆网页确认。",
      "所以它做成了一个小型 Windows 悬浮窗，把 Codeforces、LeetCode、AtCoder、洛谷、牛客这些账号的通过题数集中到桌面上。",
      "它会定时刷新，也支持手动刷新；单个平台抓取失败不会拖垮其他平台，适合长期挂着当训练反馈面板。",
      "数据侧用本地快照记录变化，再按“当天最后快照 - 当天首次快照”生成每日总结，热力图和连续记录也能看出训练有没有断掉。",
      "目前自用尚可，但是感觉不够稳固。ui方面vibe出来的调的不好，欢迎尝试，欢迎反馈。目前有重构项目的想法...",
    ],
  },
];

export const projectCategories = Array.from(
  new Set(projects.map((project) => project.category)),
);
