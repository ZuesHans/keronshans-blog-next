"use client";

import { useState, useMemo, useEffect } from "react";
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
  "笔记": "bg-neon-pink/10 text-neon-pink border-neon-pink/30",
  "模板": "bg-neon-blue/10 text-neon-blue border-neon-blue/30",
  "题解": "bg-neon-green/10 text-neon-green border-neon-green/30",
  "专题": "bg-neon-purple/10 text-neon-purple border-neon-purple/30",
  "日记": "bg-neon-yellow/10 text-neon-yellow border-neon-yellow/30",
  "其他": "bg-neon-pink/10 text-neon-pink border-neon-pink/30",
};

function getCatColorClass(cat: string): string {
  return CAT_COLORS[cat] || CAT_COLORS["其他"];
}

export default function PostsPage() {
  const [posts, setPosts] = useState<PostMeta[]>([]);
  const [tags, setTags] = useState<TagInfo[]>([]);
  const [activeCategory, setActiveCategory] = useState("all");
  const [activeTag, setActiveTag] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [loaded, setLoaded] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    fetch("/api/posts?mode=all")
      .then((res) => res.json())
      .then((data) => {
        setPosts(data.posts || []);
        setTags(data.tags || []);
        setLoaded(true);
      })
      .catch(() => {
        setError("Failed to load posts");
        setLoaded(true);
      });
  }, []);

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

  if (!loaded) {
    return (
      <div className="max-w-6xl mx-auto px-4 py-8">
        <div className="animate-pulse space-y-4">
          <div className="h-10 bg-gray-200 dark:bg-cyber-surface rounded w-48" />
          <div className="h-24 bg-gray-200 dark:bg-cyber-surface rounded" />
          <div className="h-24 bg-gray-200 dark:bg-cyber-surface rounded" />
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-6xl mx-auto px-4 py-8">
        <div className="cyber-card p-8 text-center">
          <p className="text-red-500 font-mono">{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-4xl font-display font-bold mb-2">
          <span className="neon-text">◈</span> 文章列表
        </h1>
        <p className="text-gray-500 dark:text-gray-400 font-mono text-sm">
          &gt; 共 {posts.length} 篇文章 | LAST UPDATED: {new Date().toISOString().split("T")[0]}
        </p>
        <div className="mt-2 h-[1px] bg-gradient-to-r from-neon-pink via-neon-blue to-neon-green opacity-50" />
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
              ? "border-neon-pink bg-neon-pink/10 text-neon-pink"
              : "border-transparent bg-gray-100 dark:bg-cyber-surface text-gray-500 hover:border-neon-pink/30"
          }`}
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
                  : "border-transparent bg-gray-100 dark:bg-cyber-surface text-gray-500 hover:border-gray-300"
              }`}
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
          <span className="px-2 py-0.5 rounded text-xs font-mono bg-neon-blue/10 text-neon-blue border border-neon-blue/30">
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
                ? "bg-neon-blue/10 text-neon-blue border-neon-blue/30"
                : "text-gray-500 dark:text-gray-400 bg-gray-100 dark:bg-cyber-surface border-transparent hover:text-neon-pink hover:border-neon-pink/30"
            }`}
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
                    <span className={`inline-block px-2 py-0.5 rounded text-xs font-mono border ${getCatColorClass(post.category)}`}>
                      {post.category}
                    </span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <h2 className="text-lg font-bold group-hover:text-neon-pink transition-colors mb-1 truncate">
                      {post.title}
                    </h2>
                    <p className="text-sm text-gray-500 dark:text-gray-400 mb-2 line-clamp-2">
                      {post.excerpt}
                    </p>
                    <div className="flex flex-wrap gap-1.5 items-center text-xs text-gray-400 dark:text-gray-500 font-mono">
                      <span>{post.date}</span>
                      <span className="text-neon-pink/50">|</span>
                      {post.tags.length > 0 ? post.tags.map((tag) => (
                        <span key={tag} className="hover:text-neon-blue transition-colors">#{tag}</span>
                      )) : (
                        <span className="italic">无标签</span>
                      )}
                    </div>
                  </div>
                  <div className="shrink-0 self-center text-gray-400 group-hover:text-neon-pink group-hover:translate-x-1 transition-all">
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
