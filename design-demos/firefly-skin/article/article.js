function initializeMath() {
  const article = document.querySelector(".markdown-body");
  if (!article || typeof window.renderMathInElement !== "function") return;

  window.renderMathInElement(article, {
    delimiters: [
      { left: "$$", right: "$$", display: true },
      { left: "$", right: "$", display: false },
    ],
    throwOnError: false,
  });
}

function initializeCodePanel() {
  const panel = document.querySelector("[data-code-panel]");
  if (!panel) return;

  const pre = panel.querySelector("pre");
  const code = panel.querySelector("code");
  const toggle = panel.querySelector("[data-code-toggle]");
  const copy = panel.querySelector("[data-copy-code]");

  toggle?.addEventListener("click", () => {
    const collapsed = pre.classList.toggle("is-collapsed");
    toggle.textContent = collapsed ? "展开 31 行" : "收起";
  });

  copy?.addEventListener("click", async () => {
    try {
      await navigator.clipboard.writeText(code.textContent || "");
      copy.textContent = "已复制";
      window.setTimeout(() => {
        copy.textContent = "复制";
      }, 1200);
    } catch {
      copy.textContent = "复制失败";
    }
  });
}

function initializeToc() {
  const toc = document.querySelector("[data-toc]");
  const article = document.querySelector(".markdown-body");
  if (!toc || !article) return;

  const toggle = toc.querySelector("[data-toc-toggle]");
  const links = Array.from(toc.querySelectorAll("[data-toc-target]"));
  const progress = toc.querySelector("[data-toc-progress]");
  const targets = links
    .map((link) => document.getElementById(link.dataset.tocTarget))
    .filter(Boolean);

  toggle?.addEventListener("click", () => {
    const collapsed = toc.classList.toggle("is-collapsed");
    toggle.setAttribute("aria-expanded", String(!collapsed));
    const icon = toggle.querySelector("i, svg");
    if (icon) icon.setAttribute("data-lucide", collapsed ? "panel-right-open" : "panel-right-close");
    window.lucide?.createIcons();
  });

  links.forEach((link) => {
    link.addEventListener("click", () => {
      const target = document.getElementById(link.dataset.tocTarget);
      target?.scrollIntoView({ behavior: "smooth", block: "start" });
    });
  });

  const update = () => {
    const articleRect = article.getBoundingClientRect();
    const total = Math.max(1, articleRect.height - window.innerHeight);
    const scrolled = Math.min(total, Math.max(0, -articleRect.top + 96));
    progress.style.width = `${(scrolled / total) * 100}%`;

    let active = targets[0]?.id || "";
    targets.forEach((target) => {
      if (target.getBoundingClientRect().top <= 150) active = target.id;
    });
    links.forEach((link) => link.classList.toggle("is-active", link.dataset.tocTarget === active));
  };

  window.addEventListener("scroll", update, { passive: true });
  update();
}

function initializeInteraction() {
  const like = document.querySelector("[data-like-button]");
  const likeCount = document.querySelector("[data-like-count]");
  const form = document.querySelector("[data-comment-form]");
  const list = document.querySelector("[data-comment-list]");
  const commentCount = document.querySelector("[data-comment-count]");

  like?.addEventListener("click", () => {
    const pressed = like.getAttribute("aria-pressed") === "true";
    like.setAttribute("aria-pressed", String(!pressed));
    likeCount.textContent = String(Number(likeCount.textContent) + (pressed ? -1 : 1));
  });

  form?.addEventListener("submit", (event) => {
    event.preventDefault();
    const data = new FormData(form);
    const content = String(data.get("content") || "").trim();
    if (!content) return;

    const comment = document.createElement("article");
    comment.className = "comment-item";
    const header = document.createElement("header");
    const author = document.createElement("strong");
    const time = document.createElement("time");
    const body = document.createElement("p");
    author.textContent = String(data.get("nickname") || "").trim() || "Anonymous";
    time.textContent = "刚刚";
    body.textContent = content;
    header.append(author, time);
    comment.append(header, body);
    list.prepend(comment);
    commentCount.textContent = String(Number(commentCount.textContent) + 1);
    form.reset();
  });
}

document.addEventListener("DOMContentLoaded", () => {
  initializeMath();
  initializeCodePanel();
  initializeToc();
  initializeInteraction();
});
