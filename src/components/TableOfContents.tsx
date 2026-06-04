"use client";

import { useEffect, useState } from "react";

interface Heading {
  id: string;
  text: string;
  level: number;
}

function slugifyHeading(text: string, index: number): string {
  const slug = text
    .trim()
    .toLowerCase()
    .replace(/[^\p{Letter}\p{Number}]+/gu, "-")
    .replace(/^-+|-+$/g, "");
  return slug || `heading-${index}`;
}

export default function TableOfContents() {
  const [activeId, setActiveId] = useState("");
  const [headings, setHeadings] = useState<Heading[]>([]);
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    const article = document.querySelector(".markdown-body");
    if (!article) return;

    const seen = new Map<string, number>();
    const items = Array.from(article.querySelectorAll("h2, h3")).map((heading, index) => {
      const htmlHeading = heading as HTMLElement;
      const text = htmlHeading.textContent || "";
      const baseId = slugifyHeading(text, index);
      const count = seen.get(baseId) || 0;
      seen.set(baseId, count + 1);
      htmlHeading.id = count === 0 ? baseId : `${baseId}-${count + 1}`;
      return {
        id: htmlHeading.id,
        text,
        level: Number(htmlHeading.tagName.slice(1)),
      };
    });

    setHeadings(items);
  }, []);

  useEffect(() => {
    if (headings.length === 0) return;

    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries
          .filter((entry) => entry.isIntersecting)
          .sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top);
        if (visible[0]) setActiveId(visible[0].target.id);
      },
      { rootMargin: "-96px 0px -70% 0px", threshold: 0 }
    );

    headings.forEach((heading) => {
      const element = document.getElementById(heading.id);
      if (element) observer.observe(element);
    });

    return () => observer.disconnect();
  }, [headings]);

  useEffect(() => {
    const onScroll = () => {
      const article = document.querySelector(".markdown-body");
      if (!article) return;
      const rect = article.getBoundingClientRect();
      const total = Math.max(1, rect.height - window.innerHeight);
      const scrolled = Math.min(total, Math.max(0, -rect.top));
      setProgress((scrolled / total) * 100);
    };

    window.addEventListener("scroll", onScroll, { passive: true });
    onScroll();
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const scrollTo = (id: string) => {
    const element = document.getElementById(id);
    if (!element) return;
    window.scrollTo({
      top: element.getBoundingClientRect().top + window.scrollY - 86,
      behavior: "smooth",
    });
  };

  if (headings.length === 0) return null;

  return (
    <div className="toc-panel">
      <div className="toc-progress" aria-hidden="true">
        <span style={{ width: `${progress}%` }} />
      </div>
      <div className="toc-title">目录</div>
      <nav className="toc-list" aria-label="文章目录">
        {headings.map((heading) => (
          <button
            type="button"
            key={heading.id}
            onClick={() => scrollTo(heading.id)}
            className={`toc-link ${heading.level === 3 ? "is-sub" : ""} ${activeId === heading.id ? "is-active" : ""}`}
          >
            {heading.text}
          </button>
        ))}
      </nav>
    </div>
  );
}
