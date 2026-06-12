"use client";

import Link from "next/link";
import { FormEvent, useState } from "react";
import { toUrlSafeId } from "@/lib/postSlug";

interface BlogSearchResult {
  title?: string;
  url?: string;
  score?: number;
  snippet?: string;
  source_file?: string;
}

interface BlogSearchResponse {
  query?: string;
  results?: BlogSearchResult[];
  error?: string;
  detail?: unknown;
}

function formatScore(score?: number) {
  if (typeof score !== "number" || Number.isNaN(score)) return "-";
  return score.toFixed(4);
}

function getErrorMessage(data: BlogSearchResponse, fallback: string) {
  if (data.error) return data.error;
  if (typeof data.detail === "string") return data.detail;
  return fallback;
}

function filenameFromPath(value?: string) {
  if (!value) return "";
  return value.split(/[\\/]/).pop() || "";
}

function normalizeResultHref(result: BlogSearchResult) {
  const sourceFilename = filenameFromPath(result.source_file);
  if (sourceFilename.endsWith(".md")) {
    return `/posts/${toUrlSafeId(sourceFilename)}`;
  }

  if (result.url) {
    try {
      const pathname = result.url.startsWith("http")
        ? new URL(result.url).pathname
        : result.url;
      const rawId = decodeURIComponent(pathname.split("/").filter(Boolean).pop() || "");
      if (rawId) return `/posts/${toUrlSafeId(`${rawId}.md`)}`;
    } catch {}
  }

  return "#";
}

export default function BlogSearchLabPage() {
  const [query, setQuery] = useState("");
  const [topK, setTopK] = useState("5");
  const [results, setResults] = useState<BlogSearchResult[]>([]);
  const [searchedQuery, setSearchedQuery] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const runSearch = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const q = query.trim();
    if (!q) {
      setError("先输入想搜索的内容。");
      setResults([]);
      return;
    }

    setLoading(true);
    setError("");
    setSearchedQuery(q);

    try {
      const params = new URLSearchParams({
        q,
        top_k: topK || "5",
      });
      const response = await fetch(`/api/blog-search?${params.toString()}`);
      const data = (await response.json()) as BlogSearchResponse;

      if (!response.ok) {
        setResults([]);
        setError(getErrorMessage(data, "搜索暂时失败，请稍后再试。"));
        return;
      }

      setResults(Array.isArray(data.results) ? data.results : []);
    } catch {
      setResults([]);
      setError("搜索服务暂时连接不上，请稍后再试。");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-5xl mx-auto px-5 sm:px-6 py-10">
      <header className="mb-8">
        <div className="page-kicker mb-3">Semantic Search</div>
        <h1 className="page-heading mb-3">语义搜索实验室</h1>
        <p className="max-w-2xl text-sm leading-7" style={{ color: "var(--owl-textSecondary)" }}>
          输入自然语言问题，搜索会返回语义相关的博客片段。它更适合查“这个知识点在哪里讲过”，不是聊天问答。
        </p>
        <div className="soft-divider" />
      </header>

      <form onSubmit={runSearch} className="cyber-card p-4 sm:p-5 mb-6">
        <div className="grid gap-3 lg:grid-cols-[minmax(0,1fr)_120px_120px]">
          <label>
            <span className="mb-1 block text-xs font-medium" style={{ color: "var(--owl-textMuted)" }}>
              搜索内容
            </span>
            <input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              className="cyber-input"
              placeholder="例如：线段树懒标记为什么要 pushdown"
            />
          </label>

          <label>
            <span className="mb-1 block text-xs font-medium" style={{ color: "var(--owl-textMuted)" }}>
              结果数
            </span>
            <select value={topK} onChange={(event) => setTopK(event.target.value)} className="cyber-input">
              {[3, 5, 8, 10].map((value) => (
                <option key={value} value={value}>
                  Top {value}
                </option>
              ))}
            </select>
          </label>

          <div className="flex items-end">
            <button type="submit" disabled={loading} className="cyber-btn-blue w-full disabled:opacity-60">
              {loading ? "搜索中..." : "搜索"}
            </button>
          </div>
        </div>
      </form>

      {error && (
        <div className="cyber-card p-4 mb-6" style={{ color: "var(--neon-pink)" }}>
          {error}
        </div>
      )}

      {!loading && !error && searchedQuery && results.length === 0 && (
        <div className="cyber-card p-8 text-center" style={{ color: "var(--owl-textSecondary)" }}>
          没有找到相关内容。
        </div>
      )}

      {results.length > 0 && (
        <section className="grid gap-4">
          <div className="text-sm" style={{ color: "var(--owl-textSecondary)" }}>
            “{searchedQuery}” 找到 {results.length} 条结果
          </div>
          {results.map((result, index) => {
            const href = normalizeResultHref(result);
            return (
              <Link key={`${result.url || result.title || index}-${index}`} href={href}>
                <article className="archive-item">
                  <div className="archive-main">
                    <div className="mb-2 flex flex-wrap items-center gap-2">
                      <span className="tag-pill">score {formatScore(result.score)}</span>
                      {result.source_file && (
                        <span className="truncate text-xs" style={{ color: "var(--owl-textMuted)" }}>
                          {result.source_file}
                        </span>
                      )}
                    </div>
                    <h2>{result.title || "未命名结果"}</h2>
                    <p>{result.snippet || "这个结果没有返回片段。"}</p>
                  </div>
                  <span className="archive-arrow">→</span>
                </article>
              </Link>
            );
          })}
        </section>
      )}
    </div>
  );
}
