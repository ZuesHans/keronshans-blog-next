"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Image from "next/image";
import { Search } from "lucide-react";
import { CATEGORY_GROUPS } from "@/lib/categories";
import PostList from "@/components/theme/PostList";

const ALL_CATEGORY = "全部";

interface PostMeta {
  id: string;
  slug: string;
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
  const pageRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const category = params.get("category");
    const tag = params.get("tag");
    if (category) setActiveCategory(category);
    if (tag) setActiveTag(tag);
  }, []);

  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    const animations: Animation[] = [];
    // Wait for URL filters to render before animating the initial rows.
    const frame = window.requestAnimationFrame(() => {
      const rows = pageRef.current?.querySelectorAll(".theme-post-list > a");
      Array.from(rows || []).slice(0, 6).forEach((row, index) => {
        animations.push(row.animate([
          { opacity: 0, transform: "translateY(16px)" },
          { opacity: 1, transform: "translateY(0)" },
        ], {
          duration: 550,
          delay: 100 + index * 65,
          easing: "cubic-bezier(0.22, 1, 0.36, 1)",
          fill: "backwards",
        }));
      });
    });

    return () => {
      window.cancelAnimationFrame(frame);
      animations.forEach((animation) => animation.cancel());
    };
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
    <div ref={pageRef} className="posts-page -mt-16">
      <div className="posts-scenery" aria-hidden="true">
        <Image src="/archive-misty-mountains.png" alt="" width={1750} height={750} sizes="100vw" />
      </div>
      <header className="posts-cover">
        <div className="posts-cover-image" aria-hidden="true">
          <Image src="/archive-misty-mountains.png" alt="" fill priority sizes="100vw" />
        </div>
        <div className="posts-cover-shade" aria-hidden="true" />
        <div className="site-shell posts-cover-content">
          <p>Archive / {initialPosts.length} Posts</p>
          <h1>文章</h1>
        </div>
      </header>

      <div className="posts-reading-band">
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
              <Search size={17} aria-hidden="true" />
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

          <PostList posts={filteredPosts} />
        </div>
      </div>
    </div>
  );
}
