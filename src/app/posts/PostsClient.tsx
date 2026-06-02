"use client";

import { useState, useMemo } from "react";
import Link from "next/link";

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

const CATEGORIES = ["笔记", "模板", "题解", "专题", "日记", "其他"];

const CAT_COLORS: Record<string, string> = {
  "笔记": "category-chip category-note",
  "模板": "category-chip category-template",
  "题解": "category-chip category-solution",
  "专题": "category-chip category-topic",
  "日记": "category-chip category-diary",
  "其他": "category-chip",
};

function getCatColorClass(cat: string): string {
  return CAT_COLORS[cat] || CAT_COLORS["其他"];
}

export default function PostsClient({
  initialPosts,
  initialTags,
}: {
  initialPosts: PostMeta[];
  initialTags: TagInfo[];
}) {
  const [posts] = useState<PostMeta[]>(initialPosts);
  const [tags] = useState<TagInfo[]>(initialTags);
  const [activeCategory, setActiveCategory] = useState("all");
  const [activeTag, setActiveTag] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");

  const filteredPosts = useMemo(() => {
    return posts.filter((post) => {
      if (activeCategory !== "all" && post.category !== activeCategory) return false;
      if (activeTag && !post.tags.includes(activeTag)) return false;
      if (searchQuery) {
        const q = searchQuery.toLowerCase();
        if (
          !post.title.toLowerCase().includes(q) &&
          !post.excerpt.toLowerCase().includes(q) &&
          !post.tags.some((t) => t.toLowerCase().includes(q))
        )
          return false;
      }
      return true;
    });
  }, [posts, activeCategory, activeTag, searchQuery]);

  const categoryCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    posts.forEach((p) => { counts[p.category] = (counts[p.category] || 0) + 1; });
    return counts;
  }, [posts]);

  return (
    <div className="max-w-6xl mx-auto px-4 py-10">
      {/* Header */}
      <div className="mb-8">
        <div className="page-kicker mb-3">Archive</div>
        <h1 className="page-heading mb-2">
          文章列表
        </h1>
        <p className="text-sm" style={{ color: "var(--owl-textSecondary)" }}>
          共 {posts.length} 篇文章，最近整理于 {new Date().toISOString().split("T")[0]}
        </p>
        <div className="soft-divider" />
      </div>

      {/* Search */}
      <div className="relative mb-6">
        <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <circle cx="11" cy="11" r="8" /><path d="m21 21-4.3-4.3" />
        </svg>
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="搜索文章标题、标签..."
          className="cyber-input pl-9"
        />
      </div>

      {/* Category Filter */}
      <div className="flex flex-wrap gap-2 mb-4">
        <button
          onClick={() => setActiveCategory("all")}
          className={`px-3 py-1 rounded-full text-xs font-mono border transition-all ${
            activeCategory === "all"
              ? "border-transparent text-white"
              : "border-transparent text-gray-500"
          }`}
          style={activeCategory === "all" ? { background: "var(--neon-accent)" } : { background: "var(--owl-tagBg)" }}
        >
          全部 ({posts.length})
        </button>
        {CATEGORIES.map((cat) => {
          const count = categoryCounts[cat] || 0;
          if (count === 0) return null;
          return (
            <button
              key={cat}
              onClick={() => setActiveCategory(activeCategory === cat ? "all" : cat)}
              className={`px-3 py-1 rounded-full text-xs font-mono border transition-all ${
                activeCategory === cat
                  ? getCatColorClass(cat)
                  : "border-transparent text-gray-500 hover:border-gray-300"
              }`}
              style={activeCategory === cat ? undefined : { background: "var(--owl-tagBg)" }}
            >
              {cat} ({count})
            </button>
          );
        })}
      </div>

      {/* Active tag indicator */}
      {activeTag && (
        <div className="mb-4 flex items-center gap-2">
          <span className="text-xs font-mono text-gray-400">筛选标签:</span>
          <span className="tag-pill">
            #{activeTag}
          </span>
          <button
            onClick={() => setActiveTag(null)}
            className="text-xs font-mono text-gray-400 hover:text-red-400 transition-colors"
          >
            ✕ 清除
          </button>
        </div>
      )}

      {/* Tags */}
      <div className="flex flex-wrap gap-2 mb-8">
        {tags.map(({ tag, count }) => (
          <button
            key={tag}
            onClick={() => setActiveTag(activeTag === tag ? null : tag)}
            className={`px-2 py-0.5 rounded text-xs font-mono border transition-all ${
              activeTag === tag
                ? "text-white border-transparent"
                : "text-gray-500 dark:text-gray-400 border-transparent"
            }`}
            style={activeTag === tag ? { background: "var(--neon-accent)" } : { background: "var(--owl-tagBg)" }}
          >
            #{tag} ({count})
          </button>
        ))}
      </div>

      {/* Post Grid */}
      <div className="grid gap-4">
        {filteredPosts.length === 0 ? (
          <div className="cyber-card p-12 text-center">
            <div className="text-5xl mb-4">∅</div>
            <p className="text-gray-400 font-mono">没有匹配的文章</p>
          </div>
        ) : (
          filteredPosts.map((post) => (
            <Link key={post.id} href={`/posts/${post.id}`}>
              <article className="cyber-card p-5 group cursor-pointer">
                <div className="flex flex-col sm:flex-row sm:items-start gap-4">
                  <div className="shrink-0">
                    <span className={getCatColorClass(post.category)}>
                      {post.category}
                    </span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <h2 className="text-lg font-semibold transition-colors mb-1 truncate" style={{ color: "var(--owl-text)" }}>
                      {post.title}
                    </h2>
                    <p className="text-sm mb-2 line-clamp-2" style={{ color: "var(--owl-textSecondary)" }}>
                      {post.excerpt}
                    </p>
                    <div className="flex flex-wrap gap-1.5 items-center text-xs font-mono" style={{ color: "var(--owl-textMuted)" }}>
                      <span>{post.date}</span>
                      <span>|</span>
                      {post.tags.length > 0 ? post.tags.map((tag) => (
                        <span key={tag} className="transition-colors">#{tag}</span>
                      )) : (
                        <span className="italic">无标签</span>
                      )}
                    </div>
                  </div>
                  <div className="shrink-0 self-center text-gray-400 group-hover:translate-x-1 transition-all">
                    →
                  </div>
                </div>
              </article>
            </Link>
          ))
        )}
      </div>
    </div>
  );
}
