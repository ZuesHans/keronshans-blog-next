const posts = [
  {
    id: "post-206sza",
    title: "KH_网络流",
    date: "2026-07-01",
    category: "算法学习",
    tags: ["C++", "图论", "网络流"],
    excerpt: "Dinic、最小割与费用流的模板、思路和易错点整理。",
    pinned: true,
  },
  {
    id: "kh-optimize-algo",
    title: "KH_优化算法",
    date: "2026-06-20",
    category: "算法学习",
    tags: ["C++", "Trick", "优化"],
    excerpt: "莫队与常用复杂度优化方法，记录容易被忽略的实现细节。",
  },
  {
    id: "kh-graph-algo",
    title: "KH图论",
    date: "2026-06-20",
    category: "算法学习",
    tags: ["C++", "图论", "拓扑排序"],
    excerpt: "从拓扑排序开始整理图论算法的模型、模板与使用条件。",
  },
  {
    id: "hdu-math",
    title: "HDU_赛马数学证明",
    date: "2026-06-04",
    category: "题目复盘",
    tags: ["数学", "证明"],
    excerpt: "从二进制中的 popcount 出发，整理 Legendre 公式对应的证明过程。",
  },
  {
    id: "kh-data-structure",
    title: "KH_数据结构",
    date: "2026-06-04",
    category: "算法学习",
    tags: ["C++", "数据结构", "并查集"],
    excerpt: "带权并查集、单调栈等数据结构的使用场景与实现笔记。",
  },
  {
    id: "kh-expected-dp",
    title: "KH_期望DP与概率论",
    date: "2026-06-04",
    category: "学习笔记",
    tags: ["DP", "数学", "概率"],
    excerpt: "期望 DP 的状态设计与概率论基础，按题型持续补充。",
  },
  {
    id: "kh-computational-geometry",
    title: "KH_计算几何模板",
    date: "2026-06-04",
    category: "算法学习",
    tags: ["计算几何", "模板"],
    excerpt: "点、向量、叉积和常用几何判断的可复用实现。",
  },
  {
    id: "wp-math",
    title: "wp_数学",
    date: "2026-06-04",
    category: "题目复盘",
    tags: ["数学", "题解"],
    excerpt: "比赛中遇到的数学题目与关键转化，按模型集中复盘。",
  },
  {
    id: "wp-data-structure",
    title: "wp_数据结构",
    date: "2026-05-26",
    category: "题目复盘",
    tags: ["数据结构", "题解"],
    excerpt: "数据结构题的做法、误区和更合适的维护方式。",
  },
  {
    id: "wp-dynamic-programming",
    title: "wp_动态规划",
    date: "2026-05-18",
    category: "题目复盘",
    tags: ["DP", "题解"],
    excerpt: "从状态含义出发复盘动态规划题目，记录转移中的关键限制。",
  },
  {
    id: "post-gbhr07",
    title: "线代复习",
    date: "2026-04-28",
    category: "学习笔记",
    tags: ["线性代数", "复习"],
    excerpt: "线性代数概念、公式与常见题型的复习提纲。",
  },
  {
    id: "diary",
    title: "Diary日记",
    date: "2025-11-05",
    category: "碎碎念",
    tags: ["日记", "杂谈"],
    excerpt: "一些比赛、学习和生活里临时冒出来的想法。",
  },
];

const categoryTheme = {
  算法学习: { accent: "var(--accent)", bg: "var(--accent-soft)", color: "var(--accent-strong)" },
  题目复盘: { accent: "var(--moss)", bg: "var(--moss-soft)", color: "var(--moss)" },
  学习笔记: { accent: "var(--violet)", bg: "var(--violet-soft)", color: "var(--violet)" },
  碎碎念: { accent: "var(--coral)", bg: "var(--coral-soft)", color: "var(--coral)" },
};

const root = document.documentElement;
const storageKey = "keronshans-firefly-demo-theme";

function setTheme(theme) {
  root.dataset.theme = theme;
  localStorage.setItem(storageKey, theme);
  const toggle = document.querySelector("[data-theme-toggle]");
  if (!toggle) return;

  const dark = theme === "dark";
  toggle.setAttribute("aria-label", dark ? "切换浅色模式" : "切换深色模式");
  toggle.setAttribute("title", dark ? "切换浅色模式" : "切换深色模式");
  toggle.innerHTML = `<i data-lucide="${dark ? "sun" : "moon"}" aria-hidden="true"></i>`;
  window.lucide?.createIcons();
}

function initializeTheme() {
  const saved = localStorage.getItem(storageKey);
  const preferred = window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
  setTheme(saved || preferred);
}

function initializeNavigation() {
  const toggle = document.querySelector("[data-menu-toggle]");
  const menu = document.querySelector("[data-mobile-menu]");
  if (!toggle || !menu) return;

  toggle.addEventListener("click", () => {
    const open = menu.classList.toggle("open");
    toggle.setAttribute("aria-expanded", String(open));
    toggle.setAttribute("aria-label", open ? "关闭导航" : "打开导航");
    document.body.classList.toggle("menu-open", open);
  });

  menu.addEventListener("click", (event) => {
    if (!event.target.closest("a")) return;
    menu.classList.remove("open");
    toggle.setAttribute("aria-expanded", "false");
    document.body.classList.remove("menu-open");
  });
}

function postUrl(post) {
  if (post.id === "post-206sza") {
    return "http://127.0.0.1:4173/design-demos/firefly-skin/article/";
  }
  return `http://127.0.0.1:3000/posts/${encodeURIComponent(post.id)}`;
}

function themeStyle(post) {
  const theme = categoryTheme[post.category] || categoryTheme["算法学习"];
  return `--card-accent:${theme.accent};--badge-bg:${theme.bg};--badge-color:${theme.color}`;
}

function renderHomePosts() {
  const container = document.querySelector("[data-home-posts]");
  if (!container) return;

  container.innerHTML = posts
    .slice(0, 4)
    .map(
      (post) => `
        <a class="home-post-card" href="${postUrl(post)}" target="_blank" rel="noreferrer" style="${themeStyle(post)}">
          <div>
            <div class="post-card-meta">
              ${post.pinned ? '<span class="pinned-badge">置顶</span>' : ""}
              <span class="category-badge">${post.category}</span>
              <time datetime="${post.date}">${post.date}</time>
            </div>
            <h3>${post.title}</h3>
            <p>${post.excerpt}</p>
          </div>
          <div class="post-card-foot">
            <span>${post.tags.map((tag) => `#${tag}`).join("  ")}</span>
            <i data-lucide="arrow-up-right" aria-hidden="true"></i>
          </div>
        </a>
      `
    )
    .join("");
}

function renderArchivePost(post) {
  return `
    <a class="archive-post" href="${postUrl(post)}" target="_blank" rel="noreferrer" style="${themeStyle(post)}">
      <time class="archive-post-date" datetime="${post.date}">${post.date.replaceAll("-", ".")}</time>
      <div class="archive-post-body">
        <div class="archive-post-meta">
          ${post.pinned ? '<span class="pinned-badge">置顶</span>' : ""}
          <span class="category-badge">${post.category}</span>
        </div>
        <h2>${post.title}</h2>
        <p class="archive-post-excerpt">${post.excerpt}</p>
        <div class="archive-post-tags">${post.tags.map((tag) => `<span class="tag">#${tag}</span>`).join("")}</div>
      </div>
      <span class="archive-post-arrow" aria-hidden="true"><i data-lucide="arrow-right"></i></span>
    </a>
  `;
}

function initializeArchive() {
  const list = document.querySelector("[data-post-list]");
  if (!list) return;

  const tabs = Array.from(document.querySelectorAll("[data-category]"));
  const search = document.querySelector("[data-post-search]");
  const count = document.querySelector("[data-result-count]");
  const clear = document.querySelector("[data-clear-filter]");
  const empty = document.querySelector("[data-empty-state]");
  const params = new URLSearchParams(window.location.search);
  const requestedCategory = params.get("category");
  let activeCategory = tabs.some((tab) => tab.dataset.category === requestedCategory) ? requestedCategory : "全部";

  function render() {
    const query = search.value.trim().toLocaleLowerCase();
    const visible = posts.filter((post) => {
      const categoryMatch = activeCategory === "全部" || post.category === activeCategory;
      const text = [post.title, post.category, post.excerpt, ...post.tags].join(" ").toLocaleLowerCase();
      return categoryMatch && (!query || text.includes(query));
    });

    list.innerHTML = visible.map(renderArchivePost).join("");
    count.textContent = String(visible.length);
    empty.hidden = visible.length !== 0;
    window.lucide?.createIcons();
  }

  function selectCategory(category) {
    activeCategory = category;
    tabs.forEach((tab) => {
      const selected = tab.dataset.category === category;
      tab.classList.toggle("active", selected);
      tab.setAttribute("aria-selected", String(selected));
    });
    render();
  }

  tabs.forEach((tab) => tab.addEventListener("click", () => selectCategory(tab.dataset.category)));
  search.addEventListener("input", render);
  clear.addEventListener("click", () => {
    search.value = "";
    selectCategory("全部");
  });

  selectCategory(activeCategory);
}

document.addEventListener("DOMContentLoaded", () => {
  initializeTheme();
  initializeNavigation();
  renderHomePosts();
  initializeArchive();
  window.lucide?.createIcons();

  document.querySelector("[data-theme-toggle]")?.addEventListener("click", () => {
    setTheme(root.dataset.theme === "dark" ? "light" : "dark");
  });
});
