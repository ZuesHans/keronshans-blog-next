"use client";

import { useEffect, useMemo, useState } from "react";
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
  pinned: boolean;
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

  const categorySummaries = useMemo(
    () => CATEGORY_GROUPS.map((group) => ({
      ...group,
      count: initialPosts.filter((post) => post.category === group.name).length,
    })),
    [initialPosts]
  );

  const filteredPosts = useMemo(() => {
    const query = searchQuery.trim().toLocaleLowerCase();
    return initialPosts.filter((post) => {
      if (activeCategory !== ALL_CATEGORY && post.category !== activeCategory) return false;
      if (activeTag && !post.tags.includes(activeTag)) return false;
      if (!query) return true;
      return [post.title, post.excerpt, ...post.tags]
        .join(" ")
        .toLocaleLowerCase()
        .includes(query);
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
    <div className="posts-page -mt-16">
      <header className="posts-cover">
        <div className="posts-cover-shade" aria-hidden="true" />
        <div className="site-shell posts-cover-content">
          <p>Archive / {initialPosts.length} Posts</p>
          <h1>文章</h1>
        </div>
      </header>

      <div className="site-shell posts-content">
        <section className="posts-category-tabs" aria-label="文章分类">
          <button type="button" onClick={() => selectCategory(ALL_CATEGORY)} className={activeCategory === ALL_CATEGORY ? "is-active" : ""}>
            全部 <span>{initialPosts.length}</span>
          </button>
          {categorySummaries.map((group) => (
            <button key={group.name} type="button" onClick={() => selectCategory(group.name)} className={activeCategory === group.name ? "is-active" : ""}>
              {group.name} <span>{group.count}</span>
            </button>
          ))}
        </section>

        <section className="posts-control-bar">
          <label className="posts-search-field">
            <span className="sr-only">筛选文章</span>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
              <circle cx="11" cy="11" r="8" />
              <path d="m21 21-4.3-4.3" />
            </svg>
            <input type="search" value={searchQuery} onChange={(event) => setSearchQuery(event.target.value)} placeholder="筛选标题或标签" className="cyber-input" />
          </label>
          <button type="button" onClick={clearFilters} className="cyber-btn">清除筛选</button>
        </section>

        {initialTags.length > 0 && (
          <details className="posts-tag-disclosure" open={Boolean(activeTag) || undefined}>
            <summary>标签 <span>{initialTags.length}</span></summary>
            <div className="posts-tag-cloud">
              {initialTags.map(({ tag, count }) => (
                <button key={tag} type="button" onClick={() => selectTag(tag)} className={activeTag === tag ? "is-active" : ""}>
                  #{tag} <span>{count}</span>
                </button>
              ))}
            </div>
          </details>
        )}

        <div className="active-filter-bar">
          <span>当前显示 <strong>{filteredPosts.length}</strong> 篇</span>
          {activeTag && <span className="tag-pill">#{activeTag}</span>}
        </div>

        <section className="posts-directory">
          {filteredPosts.length === 0 ? (
            <div className="cyber-card p-10 text-center" style={{ color: "var(--owl-textSecondary)" }}>
              没有匹配的文章。
            </div>
          ) : (
            filteredPosts.map((post) => (
              <Link key={post.id} href={`/posts/${post.id}`}>
                <article className="posts-directory-item">
                  <time>{post.date}</time>
                  <div className="posts-directory-body">
                    <div className="posts-directory-meta">
                      {post.pinned && <em>置顶</em>}
                      <span className={`category-chip ${getCategoryColorClass(post.category)}`}>{post.category}</span>
                    </div>
                    <h2>{post.title}</h2>
                    {post.excerpt && <p>{post.excerpt}</p>}
                    {post.tags.length > 0 && (
                      <div className="posts-directory-tags">
                        {post.tags.slice(0, 5).map((tag) => <span key={tag}>#{tag}</span>)}
                      </div>
                    )}
                  </div>
                  <span className="posts-directory-arrow" aria-hidden="true">→</span>
                </article>
              </Link>
            ))
          )}
        </section>
      </div>
    </div>
  );
}
