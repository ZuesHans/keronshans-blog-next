"use client";

import { useState, useMemo } from "react";

interface SnippetCard {
  id: string;
  title: string;
  language: string;
  tags: string[];
  createdAt: string;
  updatedAt: string;
  description?: string;
  filename: string;
}

interface SnippetsClientProps {
  snippets: SnippetCard[];
  allTags: [string, number][];
  languages: string[];
}

export default function SnippetsClient({ snippets, allTags, languages }: SnippetsClientProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [filterLang, setFilterLang] = useState("all");
  const [selectedTag, setSelectedTag] = useState("all");
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const filtered = useMemo(() => {
    return snippets.filter((s) => {
      if (filterLang !== "all" && s.language !== filterLang) return false;
      if (selectedTag !== "all" && !s.tags.includes(selectedTag)) return false;
      if (searchQuery) {
        const q = searchQuery.toLowerCase();
        if (!s.title.toLowerCase().includes(q) && !s.tags.some((t) => t.toLowerCase().includes(q)) && !(s.description || "").toLowerCase().includes(q)) return false;
      }
      return true;
    });
  }, [snippets, filterLang, selectedTag, searchQuery]);

  const handleCopy = async (snippet: SnippetCard) => {
    // Fetch the full snippet data for code
    try {
      const res = await fetch(`/api/snippets?filename=${encodeURIComponent(snippet.filename)}`, {
        headers: { "x-admin-password": "zues1" },
      });
      if (res.ok) {
        const data = await res.json();
        await navigator.clipboard.writeText(data.code);
      }
    } catch {
      // fallback: just copy the description
      try {
        await navigator.clipboard.writeText(snippet.description || snippet.title);
      } catch {}
    }
    setCopiedId(snippet.id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const toggleExpand = (id: string) => {
    setExpandedId(expandedId === id ? null : id);
  };

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-4xl font-display font-bold mb-2">
            <span className="neon-text-pink">◈</span> 代码片段
          </h1>
          <p className="text-gray-500 dark:text-gray-400 font-mono text-sm">
            &gt; SNIPPET.LIBRARY | {snippets.length} 个片段
          </p>
          <div className="mt-2 h-[1px] bg-gradient-to-r from-neon-pink via-neon-blue to-neon-green opacity-50" />
        </div>
      </div>

      {/* Filters */}
      <div className="cyber-card p-4 mb-6 space-y-3">
        <div className="relative">
          <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="11" cy="11" r="8" /><path d="m21 21-4.3-4.3" />
          </svg>
          <input type="text" value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} placeholder="搜索标题、描述、标签..." className="cyber-input pl-9" />
        </div>
        <div className="flex flex-wrap gap-2 items-center">
          <span className="text-xs font-mono text-gray-500">语言:</span>
          <button onClick={() => setFilterLang("all")} className={`px-2 py-0.5 rounded text-xs font-mono transition-all ${filterLang === "all" ? "bg-neon-pink/10 text-neon-pink" : "text-gray-400 hover:text-gray-600"}`}>全部</button>
          {languages.slice(0, 10).map((lang) => (
            <button key={lang} onClick={() => setFilterLang(filterLang === lang ? "all" : lang)} className={`px-2 py-0.5 rounded text-xs font-mono transition-all ${filterLang === lang ? "bg-neon-pink/10 text-neon-pink" : "text-gray-400 hover:text-gray-600"}`}>{lang}</button>
          ))}
        </div>
        {allTags.length > 0 && (
          <div className="flex flex-wrap gap-1.5">
            <button onClick={() => setSelectedTag("all")} className={`px-2 py-0.5 rounded text-xs font-mono transition-all ${selectedTag === "all" ? "bg-neon-pink/10 text-neon-pink" : "text-gray-400"}`}>全部标签</button>
            {allTags.slice(0, 15).map(([tag, count]) => (
              <button key={tag} onClick={() => setSelectedTag(selectedTag === tag ? "all" : tag)} className={`px-2 py-0.5 rounded text-xs font-mono transition-all ${selectedTag === tag ? "bg-neon-pink/10 text-neon-pink" : "text-gray-400"}`}>#{tag}({count})</button>
            ))}
          </div>
        )}
      </div>

      {/* Snippet Cards */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {filtered.length === 0 ? (
          <div className="col-span-full cyber-card p-12 text-center">
            <div className="text-5xl mb-4">{"{ }"}</div>
            <p className="text-gray-400 font-mono">{snippets.length === 0 ? "暂无代码片段" : "没有匹配的代码片段"}</p>
            <p className="text-gray-500 font-mono text-sm mt-1">前往管理后台添加代码片段</p>
          </div>
        ) : (
          filtered.map((snippet) => (
            <div key={snippet.id} className="cyber-card neon-border-pink group">
              <div className="p-4">
                {/* Header */}
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-neon-pink/10 text-neon-pink border border-neon-pink/30">
                      {snippet.language}
                    </span>
                    <h3 className="font-bold text-sm group-hover:text-neon-pink transition-colors truncate">
                      {snippet.title}
                    </h3>
                  </div>
                </div>

                {/* Description */}
                {snippet.description && (
                  <p className="text-xs text-gray-500 dark:text-gray-400 mb-3 line-clamp-2">{snippet.description}</p>
                )}

                {/* Expand/Collapse for preview */}
                <button onClick={() => toggleExpand(snippet.id)} className="text-xs text-neon-blue hover:text-neon-blue/80 font-mono mb-2">
                  {expandedId === snippet.id ? "收起预览 ▲" : "展开预览 ▼"}
                </button>
                {expandedId === snippet.id && (
                  <SnippetPreview filename={snippet.filename} />
                )}

                {/* Footer */}
                <div className="flex items-center justify-between mt-2">
                  <div className="flex flex-wrap gap-1">
                    {snippet.tags.map((tag) => (
                      <span key={tag} className="px-1.5 py-0.5 rounded text-[10px] font-mono bg-neon-pink/5 text-gray-400 border border-gray-100 dark:border-cyber-border">{tag}</span>
                    ))}
                  </div>
                  <button
                    onClick={() => handleCopy(snippet)}
                    className={`px-3 py-1 rounded text-xs font-mono transition-all border ${copiedId === snippet.id ? "border-neon-green bg-neon-green/10 text-neon-green" : "border-neon-pink/30 text-neon-pink hover:bg-neon-pink/10"}`}
                  >
                    {copiedId === snippet.id ? "✓ 已复制" : "复制代码"}
                  </button>
                </div>

                {/* Timestamp */}
                <div className="text-[10px] font-mono text-gray-500 mt-2">
                  更新: {snippet.updatedAt || snippet.createdAt}
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}

// Lazy-loaded snippet preview
function SnippetPreview({ filename }: { filename: string }) {
  const [code, setCode] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const loadCode = async () => {
    if (code !== null || loading) return;
    setLoading(true);
    try {
      const res = await fetch(`/api/snippets?filename=${encodeURIComponent(filename)}`, {
        headers: { "x-admin-password": "zues1" },
      });
      if (res.ok) {
        const data = await res.json();
        setCode(data.code || "（空代码）");
      } else {
        setCode("（加载失败）");
      }
    } catch {
      setCode("（加载失败）");
    }
    setLoading(false);
  };

  // Auto-load when rendered
  if (code === null && !loading) loadCode();

  return (
    <pre className="bg-gray-900 dark:bg-black rounded-lg p-4 text-sm font-mono text-gray-300 overflow-x-auto max-h-60 overflow-y-auto mb-2 scrollbar-thin">
      {loading ? <span className="text-gray-500">加载中...</span> : (code || "加载中...")}
    </pre>
  );
}
