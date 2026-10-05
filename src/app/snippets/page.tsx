"use client";

import { useEffect, useMemo, useState } from "react";

type Snippet = {
  id: string;
  slug: string;
  title: string;
  code?: string;
  language: string;
  tags: string | string[];
  description?: string;
  updated_at: string;
};

function tagsOf(value: string | string[]): string[] {
  if (Array.isArray(value)) return value;
  try { const parsed = JSON.parse(value); return Array.isArray(parsed) ? parsed.map(String) : []; } catch { return []; }
}

export default function SnippetsPage() {
  const [snippets, setSnippets] = useState<Snippet[]>([]);
  const [loaded, setLoaded] = useState(false);
  const [query, setQuery] = useState("");
  const [language, setLanguage] = useState("all");
  const [tag, setTag] = useState("all");
  const [expanded, setExpanded] = useState<string | null>(null);
  const [copied, setCopied] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/snippets").then((response) => response.ok ? response.json() : [])
      .then((value) => setSnippets(Array.isArray(value) ? value : []))
      .catch(() => setSnippets([])).finally(() => setLoaded(true));
  }, []);

  const languages = useMemo(() => Array.from(new Set(snippets.map((snippet) => snippet.language))).sort(), [snippets]);
  const tags = useMemo(() => Array.from(new Set(snippets.flatMap((snippet) => tagsOf(snippet.tags)))).sort(), [snippets]);
  const filtered = useMemo(() => {
    const needle = query.trim().toLowerCase();
    return snippets.filter((snippet) => {
      const snippetTags = tagsOf(snippet.tags);
      if (language !== "all" && snippet.language !== language) return false;
      if (tag !== "all" && !snippetTags.includes(tag)) return false;
      return !needle || [snippet.title, snippet.slug, snippet.language, snippet.description || "", ...snippetTags].join(" ").toLowerCase().includes(needle);
    });
  }, [language, query, snippets, tag]);

  async function loadCode(snippet: Snippet) {
    if (snippet.code !== undefined) return snippet.code;
    const response = await fetch(`/api/snippets?id=${encodeURIComponent(snippet.id)}`);
    if (!response.ok) return "";
    const detail = await response.json() as { code?: string };
    setSnippets((current) => current.map((item) => item.id === snippet.id ? { ...item, code: detail.code || "" } : item));
    return detail.code || "";
  }

  async function copy(snippet: Snippet) {
    const code = await loadCode(snippet);
    try { await navigator.clipboard.writeText(code); } catch { return; }
    setCopied(snippet.id);
    window.setTimeout(() => setCopied((current) => current === snippet.id ? null : current), 1500);
  }

  if (!loaded) return <div className="app-page"><div className="cyber-card p-8 text-center text-gray-500">读取模板快照...</div></div>;

  return (
    <div className="app-page max-w-6xl">
      <div className="app-page-header"><h1>代码模板</h1><p>{snippets.length} 个已发布片段 · Published Vault 只读快照</p></div>
      <div className="cyber-card p-4 mb-6 space-y-3">
        <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="搜索标题、描述、语言或标签" className="cyber-input" />
        <div className="flex flex-wrap gap-2"><span className="text-xs font-mono text-gray-500">语言</span><button onClick={() => setLanguage("all")} className={language === "all" ? "text-neon-pink" : "text-gray-500"}>全部</button>{languages.map((item) => <button key={item} onClick={() => setLanguage(language === item ? "all" : item)} className={language === item ? "text-neon-pink" : "text-gray-500"}>{item}</button>)}</div>
        <div className="flex flex-wrap gap-2"><span className="text-xs font-mono text-gray-500">标签</span><button onClick={() => setTag("all")} className={tag === "all" ? "text-neon-pink" : "text-gray-500"}>全部</button>{tags.map((item) => <button key={item} onClick={() => setTag(tag === item ? "all" : item)} className={tag === item ? "text-neon-pink" : "text-gray-500"}>#{item}</button>)}</div>
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {filtered.map((snippet) => {
          const snippetTags = tagsOf(snippet.tags);
          return <article key={snippet.id} className="cyber-card p-4">
            <div className="flex items-center gap-2 mb-2"><span className="px-2 py-0.5 rounded text-[10px] font-mono bg-neon-pink/10 text-neon-pink border border-neon-pink/30">{snippet.language}</span><h2 className="font-bold text-sm truncate">{snippet.title}</h2></div>
            {snippet.description && <p className="text-xs text-gray-500 mb-3">{snippet.description}</p>}
            <div className="flex items-center justify-between gap-3"><div className="flex flex-wrap gap-1">{snippetTags.map((item) => <span key={item} className="text-[10px] font-mono text-gray-400">#{item}</span>)}</div><div className="flex gap-2"><button onClick={async () => { setExpanded(expanded === snippet.id ? null : snippet.id); await loadCode(snippet); }} className="text-xs text-neon-blue">{expanded === snippet.id ? "收起" : "预览"}</button><button onClick={() => copy(snippet)} className="text-xs text-neon-pink">{copied === snippet.id ? "已复制" : "复制"}</button></div></div>
            {expanded === snippet.id && <pre className="mt-3 bg-gray-900 text-gray-200 rounded p-3 text-xs overflow-auto max-h-64 whitespace-pre-wrap">{snippet.code || "加载中..."}</pre>}
            <div className="text-[10px] font-mono text-gray-500 mt-3">更新: {snippet.updated_at || "未标注"}</div>
          </article>;
        })}
      </div>
      {filtered.length === 0 && <div className="cyber-card p-8 text-center text-gray-500">暂无匹配模板</div>}
    </div>
  );
}
