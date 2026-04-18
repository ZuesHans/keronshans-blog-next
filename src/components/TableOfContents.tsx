"use client";

import { useState, useEffect, useMemo } from "react";

interface Heading {
  id: string;
  text: string;
  level: number;
}

export default function TableOfContents() {
  const [open, setOpen] = useState(() => {
    if (typeof window === "undefined") return true;
    return localStorage.getItem("toc_open") !== "false";
  });
  const [activeId, setActiveId] = useState("");
  const [headings, setHeadings] = useState<Heading[]>([]);

  useEffect(() => {
    localStorage.setItem("toc_open", String(open));
  }, [open]);

  useEffect(() => {
    const article = document.querySelector(".markdown-body");
    if (!article) return;

    // Collect h2, h3, h4 headings and assign ids
    const els = article.querySelectorAll("h2, h3, h4");
    const items: Heading[] = [];
    els.forEach((el, i) => {
      const htmlEl = el as HTMLElement;
      if (!htmlEl.id) htmlEl.id = `heading-${i}`;
      items.push({
        id: htmlEl.id,
        text: htmlEl.textContent || "",
        level: parseInt(htmlEl.tagName[1]),
      });
    });
    setHeadings(items);
  }, []);

  // Track active heading on scroll
  useEffect(() => {
    if (headings.length === 0) return;

    const observer = new IntersectionObserver(
      (entries) => {
        // Find the first heading that is intersecting from top
        const visible = entries
          .filter((e) => e.isIntersecting)
          .sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top);
        if (visible.length > 0) {
          setActiveId(visible[0].target.id);
        }
      },
      { rootMargin: "-80px 0px -70% 0px", threshold: 0 }
    );

    const ids = headings.map((h) => h.id);
    ids.forEach((id) => {
      const el = document.getElementById(id);
      if (el) observer.observe(el);
    });

    return () => observer.disconnect();
  }, [headings]);

  // Reading progress
  const [progress, setProgress] = useState(0);
  useEffect(() => {
    const onScroll = () => {
      const article = document.querySelector(".markdown-body");
      if (!article) return;
      const rect = article.getBoundingClientRect();
      const total = rect.height - window.innerHeight;
      if (total <= 0) { setProgress(0); return; }
      const scrolled = -rect.top;
      setProgress(Math.min(100, Math.max(0, (scrolled / total) * 100)));
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    onScroll();
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const scrollTo = (id: string) => {
    const el = document.getElementById(id);
    if (el) {
      const top = el.getBoundingClientRect().top + window.scrollY - 80;
      window.scrollTo({ top, behavior: "smooth" });
    }
  };

  const getIndent = (level: number) => {
    if (level === 2) return "pl-0";
    if (level === 3) return "pl-3";
    return "pl-5";
  };

  const getWeight = (level: number) => {
    if (level === 2) return "font-medium";
    return "font-normal";
  };

  const getSize = (level: number) => {
    if (level === 2) return "text-xs";
    return "text-[11px]";
  };

  if (headings.length === 0) return null;

  return (
    <>
      {/* Progress bar at top */}
      <div className="fixed top-0 left-0 right-0 z-[60] h-[2px]">
        <div
          className="h-full bg-gradient-to-r from-neon-pink via-neon-blue to-neon-green transition-[width] duration-100"
          style={{ width: `${progress}%` }}
        />
      </div>

      {/* TOC sidebar */}
      <div
        className={`fixed right-4 top-20 z-50 transition-all duration-300 ${
          open ? "translate-x-0 opacity-100" : "translate-x-[calc(100%+1rem)] opacity-0"
        }`}
      >
        {/* Toggle button */}
        <button
          onClick={() => setOpen(!open)}
          className="absolute -left-8 top-0 w-7 h-7 rounded-md bg-white/90 dark:bg-cyber-card/90 backdrop-blur border border-gray-200 dark:border-cyber-border flex items-center justify-center text-gray-400 hover:text-neon-pink hover:border-neon-pink/30 transition-all shadow-sm cursor-pointer text-xs"
          title={open ? "关闭目录" : "打开目录"}
        >
          {open ? "›" : "‹"}
        </button>

        {/* TOC content */}
        <div className="w-52 bg-white/90 dark:bg-cyber-card/90 backdrop-blur-xl border border-gray-200 dark:border-cyber-border rounded-lg shadow-lg shadow-black/5 dark:shadow-neon-pink/5 p-3 max-h-[70vh] overflow-y-auto scrollbar-thin">
          <div className="text-[10px] font-mono text-gray-400 dark:text-gray-500 mb-2 tracking-wider uppercase">
            目录 {headings.length}
          </div>
          <nav className="space-y-0.5">
            {headings.map((h) => (
              <button
                key={h.id}
                onClick={() => scrollTo(h.id)}
                className={`block w-full text-left px-2 py-1 rounded transition-all cursor-pointer truncate ${getIndent(h.level)} ${getWeight(h.level)} ${getSize(h.level)} ${
                  activeId === h.id
                    ? "text-neon-pink bg-neon-pink/10"
                    : "text-gray-500 dark:text-gray-400 hover:text-neon-pink hover:bg-gray-100 dark:hover:bg-cyber-surface"
                }`}
              >
                {h.text}
              </button>
            ))}
          </nav>
        </div>
      </div>
    </>
  );
}
