"use client";

import { useEffect, useMemo, useState } from "react";
import type { CSSProperties } from "react";
import Link from "next/link";
import { CATEGORY_GROUPS, getCategoryColorClass } from "@/lib/categories";

const ALL_CATEGORY = "全部";

interface PostMeta {
  id: string;
  title: string;
  date: string;
  tags: string[];
  excerpt: string;
  category: string;
}

interface TagInfo {
  tag: string;
  count: number;
}

export default function PostsClient({
  initialPosts,
  initialTags,
}: {
  initialPosts: PostMeta[];
  initialTags: TagInfo[];
}) {
  const [activeCategory, setActiveCategory] = useState(ALL_CATEGORY);
  const [activeTag, setActiveTag] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const category = params.get("category");
    const tag = params.get("tag");
    if (category) setActiveCategory(category);
    if (tag) setActiveTag(tag);
  }, []);

  const categorySummaries = useMemo(() => {
    const grouped = new Map<string, PostMeta[]>();
    initialPosts.forEach((post) => {
      grouped.set(post.category, [...(grouped.get(post.category) || []), post]);
    });

    return CATEGORY_GROUPS.map((group) => {
      const posts = grouped.get(group.name) || [];
      return {
        ...group,
        count: posts.length,
        latest: posts[0],
      };
    }).filter((group) => group.count > 0);
  }, [initialPosts]);

  const filteredPosts = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return initialPosts.filter((post) => {
      if (activeCategory !== ALL_CATEGORY && post.category !== activeCategory) return false;
      if (activeTag && !post.tags.includes(activeTag)) return false;
      if (!q) return true;
      return (
        post.title.toLowerCase().includes(q) ||
        post.excerpt.toLowerCase().includes(q) ||
        post.tags.some((tag) => tag.toLowerCase().includes(q))
      );
    });
  }, [activeCategory, activeTag, initialPosts, searchQuery]);

  const updateUrl = (nextCategory: string, nextTag: string | null) => {
    const params = new URLSearchParams();
    if (nextCategory !== ALL_CATEGORY) params.set("category", nextCategory);
    if (nextTag) params.set("tag", nextTag);
    const query = params.toString();
    window.history.replaceState(null, "", query ? `/posts?${query}` : "/posts");
  };

  const selectCategory = (category: string) => {
    setActiveCategory(category);
    updateUrl(category, activeTag);
  };

  const selectTag = (tag: string) => {
    const nextTag = activeTag === tag ? null : tag;
    setActiveTag(nextTag);
    updateUrl(activeCategory, nextTag);
  };

  const clearFilters = () => {
    setActiveCategory(ALL_CATEGORY);
    setActiveTag(null);
    setSearchQuery("");
    window.history.replaceState(null, "", "/posts");
  };

  return (
    <div className="posts-shell max-w-6xl mx-auto px-5 sm:px-6 py-10">
      <header className="posts-hero">
        <div className="page-kicker mb-3">Archive</div>
        <h1 className="page-heading mb-3">文章分类</h1>
        <p>
          这里按照类型分类，比如这是美味的小鱼干，这是美味的三文鱼刺身...😋
        </p>
        <div className="soft-divider" />
      </header>

      <section className="category-shelf" aria-label="文章分类">
        <button
          onClick={() => selectCategory(ALL_CATEGORY)}
          className={`category-shelf-card ${activeCategory === ALL_CATEGORY ? "is-active" : ""}`}
          style={{ "--shelf-accent": "var(--owl-text)" } as CSSProperties}
        >
          <div className="category-shelf-top">
            <span className="category-shelf-name">全部文章</span>
            <strong className="category-shelf-count">{initialPosts.length}</strong>
          </div>
          <p className="category-shelf-desc">完整索引，适合直接搜索标题、摘要或标签。</p>
          <span className="category-shelf-latest">查看所有内容</span>
        </button>

        {categorySummaries.map((group) => (
          <button
            key={group.name}
            onClick={() => selectCategory(group.name)}
            className={`category-shelf-card ${activeCategory === group.name ? "is-active" : ""}`}
            style={{ "--shelf-accent": group.accent } as CSSProperties}
          >
            <div className="category-shelf-top">
              <span className="category-shelf-name">{group.name}</span>
              <strong className="category-shelf-count">{group.count}</strong>
            </div>
            <p className="category-shelf-desc">{group.description}</p>
            <span className="category-shelf-latest">
              最近：{group.latest?.title || "还在整理中"}
            </span>
          </button>
        ))}
      </section>

      <section className="posts-control-bar">
        <div className="relative">
          <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ color: "var(--owl-textMuted)" }}>
            <circle cx="11" cy="11" r="8" />
            <path d="m21 21-4.3-4.3" />
          </svg>
          <input
            type="text"
            value={searchQuery}
            onChange={(event) => setSearchQuery(event.target.value)}
            placeholder="搜索标题、摘要、标签..."
            className="cyber-input pl-9"
          />
        </div>
        <button onClick={clearFilters} className="cyber-btn">
          清除筛选
        </button>
      </section>

      <section className="tag-cloud" aria-label="标签筛选">
        <div className="flex flex-wrap gap-2">
          {initialTags.map(({ tag, count }) => (
            <button
              key={tag}
              onClick={() => selectTag(tag)}
              className={`tag-filter ${activeTag === tag ? "is-active" : ""}`}
            >
              #{tag} {count}
            </button>
          ))}
        </div>
      </section>

      <div className="active-filter-bar">
        <span>
          当前显示 <strong>{filteredPosts.length}</strong> 篇
          {activeCategory !== ALL_CATEGORY ? ` · ${activeCategory}` : " · 全部分类"}
        </span>
        {activeTag && <span className="tag-pill">#{activeTag}</span>}
      </div>

      <section className="grid gap-4">
        {filteredPosts.length === 0 ? (
          <div className="cyber-card p-10 text-center" style={{ color: "var(--owl-textSecondary)" }}>
            没有匹配的文章喵🙁，换个分类或关键词试试吧。
          </div>
        ) : (
          filteredPosts.map((post) => (
            <Link key={post.id} href={`/posts/${post.id}`}>
              <article className="archive-item">
                <div className="archive-main">
                  <div className="flex items-center gap-2 flex-wrap mb-2">
                    <span className={`category-chip ${getCategoryColorClass(post.category)}`}>{post.category}</span>
                    <span className="text-xs" style={{ color: "var(--owl-textMuted)" }}>{post.date}</span>
                  </div>
                  <h2>{post.title}</h2>
                  <p>{post.excerpt}</p>
                  <div className="flex flex-wrap gap-1.5 mt-3">
                    {post.tags.length > 0 ? (
                      post.tags.map((tag) => <span key={tag} className="tag-pill">#{tag}</span>)
                    ) : (
                      <span className="text-xs" style={{ color: "var(--owl-textMuted)" }}>无标签</span>
                    )}
                  </div>
                </div>
                <span className="archive-arrow">→</span>
              </article>
            </Link>
          ))
        )}
      </section>
    </div>
  );
}
