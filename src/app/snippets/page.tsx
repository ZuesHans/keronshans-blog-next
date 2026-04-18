"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import { SITE_PASSWORD, verifyPassword, isAuthenticated, setAuthenticated } from "@/lib/auth";

interface Snippet {
  id: string;
  title: string;
  code: string;
  language: string;
  tags: string | string[];
  created_at: string;
  updated_at: string;
}

const LANGUAGES = [
  "C++", "C", "Python", "Java", "JavaScript", "TypeScript",
  "Go", "Rust", "Shell", "SQL", "Other",
];

const DEFAULT_TAGS = [
  "图论", "DP", "数据结构", "数学", "数论", "字符串",
  "网络流", "计算几何", "博弈", "搜索", "贪心", "暴力",
  "STL", "位运算", "前缀和", "并查集", "线段树", "树状数组",
];

function parseTags(tags: string | string[]): string[] {
  if (Array.isArray(tags)) return tags;
  try { return JSON.parse(tags); } catch { return []; }
}

export default function SnippetsPage() {
  const [snippets, setSnippets] = useState<Snippet[]>([]);
  const [loaded, setLoaded] = useState(false);
  const [isAuth, setIsAuth] = useState(false);
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  const [searchQuery, setSearchQuery] = useState("");
  const [filterLang, setFilterLang] = useState("all");
  const [selectedTag, setSelectedTag] = useState("all");

  const [showAdd, setShowAdd] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formTitle, setFormTitle] = useState("");
  const [formCode, setFormCode] = useState("");
  const [formLang, setFormLang] = useState("C++");
  const [formTags, setFormTags] = useState<string[]>([]);
  const [formTagInput, setFormTagInput] = useState("");
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const fetchSnippets = useCallback(async () => {
    try {
      const res = await fetch("/api/snippets");
      if (res.ok) {
        const data = await res.json();
        if (Array.isArray(data)) setSnippets(data);
      }
    } catch {
      console.error("Failed to fetch snippets");
    }
    setLoaded(true);
  }, []);

  useEffect(() => {
    fetchSnippets();
    if (isAuthenticated()) setIsAuth(true);
  }, [fetchSnippets]);

  const handleLogin = () => {
    if (verifyPassword(password)) {
      setAuthenticated();
      setIsAuth(true);
      setError("");
    } else {
      setError("密码错误");
    }
  };

  const resetForm = () => {
    setFormTitle(""); setFormCode(""); setFormLang("C++");
    setFormTags([]); setFormTagInput(""); setEditingId(null);
  };

  const openAdd = () => { resetForm(); setShowAdd(true); };

  const openEdit = (s: Snippet) => {
    setEditingId(s.id);
    setFormTitle(s.title);
    setFormCode(s.code);
    setFormLang(s.language);
    setFormTags(parseTags(s.tags));
    setFormTagInput("");
    setShowAdd(true);
  };

  const handleSave = async () => {
    if (!formTitle.trim() || !formCode.trim()) return;
    setSaving(true);
    setError("");

    const tags = formTags;
    const genId = () => Date.now().toString(36) + Math.random().toString(36).slice(2);

    try {
      let res: Response;
      if (editingId) {
        res = await fetch("/api/snippets", {
          method: "PUT",
          headers: { "Content-Type": "application/json", "x-admin-password": SITE_PASSWORD },
          body: JSON.stringify({ id: editingId, title: formTitle.trim(), code: formCode, language: formLang, tags }),
        });
      } else {
        res = await fetch("/api/snippets", {
          method: "POST",
          headers: { "Content-Type": "application/json", "x-admin-password": SITE_PASSWORD },
          body: JSON.stringify({ id: genId(), title: formTitle.trim(), code: formCode, language: formLang, tags }),
        });
      }
      if (res.ok) {
        await fetchSnippets();
        resetForm();
        setShowAdd(false);
      } else {
        setError("保存失败");
      }
    } catch { setError("网络错误"); }
    setSaving(false);
  };

  const handleDelete = async (id: string) => {
    try {
      const res = await fetch(`/api/snippets?id=${id}`, {
        method: "DELETE",
        headers: { "x-admin-password": SITE_PASSWORD },
      });
      if (res.ok) setSnippets(snippets.filter(s => s.id !== id));
    } catch {}
  };

  const handleCopy = async (snippet: Snippet) => {
    try {
      await navigator.clipboard.writeText(snippet.code);
      setCopiedId(snippet.id);
      setTimeout(() => setCopiedId(null), 2000);
    } catch {
      const ta = document.createElement("textarea");
      ta.value = snippet.code;
      document.body.appendChild(ta);
      ta.select();
      document.execCommand("copy");
      document.body.removeChild(ta);
      setCopiedId(snippet.id);
      setTimeout(() => setCopiedId(null), 2000);
    }
  };

  const addTag = (tag: string) => {
    if (tag && !formTags.includes(tag)) setFormTags([...formTags, tag]);
    setFormTagInput("");
  };
  const removeTag = (tag: string) => setFormTags(formTags.filter(t => t !== tag));

  const filtered = useMemo(() => {
    return snippets.filter(s => {
      const tags = parseTags(s.tags);
      if (filterLang !== "all" && s.language !== filterLang) return false;
      if (selectedTag !== "all" && !tags.includes(selectedTag)) return false;
      if (searchQuery) {
        const q = searchQuery.toLowerCase();
        if (!s.title.toLowerCase().includes(q) && !s.code.toLowerCase().includes(q) && !tags.some(t => t.toLowerCase().includes(q))) return false;
      }
      return true;
    });
  }, [snippets, filterLang, selectedTag, searchQuery]);

  const allTags = useMemo(() => {
    const m = new Map<string, number>();
    snippets.forEach(s => parseTags(s.tags).forEach(t => m.set(t, (m.get(t) || 0) + 1)));
    return Array.from(m.entries()).sort((a, b) => b[1] - a[1]);
  }, [snippets]);

  if (!loaded) {
    return <div className="max-w-6xl mx-auto px-4 py-8"><div className="animate-pulse h-10 bg-gray-200 dark:bg-cyber-surface rounded w-48" /></div>;
  }

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
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
        {isAuth ? (
          <button onClick={openAdd} className="cyber-btn-pink flex items-center gap-2">
            <span className="text-lg leading-none">+</span> 新建片段
          </button>
        ) : (
          <button onClick={() => {}} className="cyber-btn-pink opacity-50 cursor-not-allowed" title="需要密码">
            <span className="text-lg leading-none">+</span> 新建片段
          </button>
        )}
      </div>

      {!isAuth && (
        <div className="cyber-card neon-border-pink p-5 mb-6">
          <p className="text-sm font-mono text-gray-500 mb-3">&gt; 需要密码才能新建/编辑/删除代码片段</p>
          <div className="flex gap-2">
            <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} onKeyDown={(e) => e.key === "Enter" && handleLogin()} placeholder="输入密码..." className="cyber-input flex-1" />
            <button onClick={handleLogin} className="cyber-btn-pink">验证</button>
          </div>
          {error && <p className="text-sm text-red-500 font-mono mt-2">{error}</p>}
        </div>
      )}

      {showAdd && isAuth && (
        <div className="cyber-card neon-border-pink p-6 mb-6 space-y-4">
          <h3 className="text-lg font-display font-bold text-neon-pink">
            {editingId ? "编辑片段" : "新建片段"}
          </h3>
          <div>
            <label className="text-xs font-mono text-gray-500 mb-1 block">标题 *</label>
            <input type="text" value={formTitle} onChange={(e) => setFormTitle(e.target.value)} placeholder="例: 线段树模板" className="cyber-input" />
          </div>
          <div>
            <label className="text-xs font-mono text-gray-500 mb-1 block">语言</label>
            <div className="flex flex-wrap gap-1.5">
              {LANGUAGES.map(lang => (
                <button key={lang} onClick={() => setFormLang(lang)} className={`px-2.5 py-1 rounded text-xs font-mono transition-all border ${formLang === lang ? "border-neon-pink bg-neon-pink/10 text-neon-pink" : "border-transparent bg-gray-50 dark:bg-cyber-surface text-gray-500 hover:border-neon-pink/30"}`}>
                  {lang}
                </button>
              ))}
            </div>
          </div>
          <div>
            <label className="text-xs font-mono text-gray-500 mb-1 block">代码 *</label>
            <textarea value={formCode} onChange={(e) => setFormCode(e.target.value)} placeholder="粘贴你的代码片段..." rows={12} className="cyber-input resize-y font-mono text-sm" style={{ tabSize: 2 }} spellCheck={false} />
          </div>
          <div>
            <label className="text-xs font-mono text-gray-500 mb-1 block">标签</label>
            <div className="flex flex-wrap gap-1 mb-2">
              {formTags.map(tag => (
                <span key={tag} className="px-2 py-0.5 rounded-full text-xs font-mono bg-neon-pink/10 text-neon-pink border border-neon-pink/20 flex items-center gap-1">
                  {tag} <button onClick={() => removeTag(tag)} className="hover:text-red-400">✕</button>
                </span>
              ))}
            </div>
            <input type="text" value={formTagInput} onChange={(e) => setFormTagInput(e.target.value)} onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); addTag(formTagInput); } }} placeholder="输入标签后回车..." className="cyber-input flex-1 mb-2" />
            <div className="flex flex-wrap gap-1">
              {DEFAULT_TAGS.map(tag => (
                <button key={tag} onClick={() => addTag(tag)} className="px-1.5 py-0.5 rounded text-[10px] font-mono text-gray-400 bg-gray-50 dark:bg-cyber-surface hover:text-neon-pink hover:bg-neon-pink/10 transition-all">
                  +{tag}
                </button>
              ))}
            </div>
          </div>
          <div className="flex gap-2 justify-end">
            <button onClick={() => { resetForm(); setShowAdd(false); }} className="px-4 py-2 rounded font-mono text-sm text-gray-500 hover:text-gray-700 transition-all">取消</button>
            <button onClick={handleSave} disabled={!formTitle.trim() || !formCode.trim() || saving} className="cyber-btn-pink disabled:opacity-30 disabled:cursor-not-allowed">
              {saving ? "保存中..." : editingId ? "保存修改" : "创建片段"}
            </button>
          </div>
        </div>
      )}

      <div className="cyber-card p-4 mb-6 space-y-3">
        <div className="relative">
          <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="11" cy="11" r="8" /><path d="m21 21-4.3-4.3" />
          </svg>
          <input type="text" value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} placeholder="搜索标题、代码、标签..." className="cyber-input pl-9" />
        </div>
        <div className="flex flex-wrap gap-2 items-center">
          <span className="text-xs font-mono text-gray-500">语言:</span>
          <button onClick={() => setFilterLang("all")} className={`px-2 py-0.5 rounded text-xs font-mono transition-all ${filterLang === "all" ? "bg-neon-pink/10 text-neon-pink" : "text-gray-400 hover:text-gray-600"}`}>全部</button>
          {LANGUAGES.slice(0, 8).map(lang => (
            <button key={lang} onClick={() => setFilterLang(filterLang === lang ? "all" : lang)} className={`px-2 py-0.5 rounded text-xs font-mono transition-all ${filterLang === lang ? "bg-neon-pink/10 text-neon-pink" : "text-gray-400 hover:text-gray-600"}`}>
              {lang}
            </button>
          ))}
        </div>
        {allTags.length > 0 && (
          <div className="flex flex-wrap gap-1.5">
            <button onClick={() => setSelectedTag("all")} className={`px-2 py-0.5 rounded text-xs font-mono transition-all ${selectedTag === "all" ? "bg-neon-pink/10 text-neon-pink" : "text-gray-400"}`}>全部标签</button>
            {allTags.slice(0, 15).map(([tag, count]) => (
              <button key={tag} onClick={() => setSelectedTag(selectedTag === tag ? "all" : tag)} className={`px-2 py-0.5 rounded text-xs font-mono transition-all ${selectedTag === tag ? "bg-neon-pink/10 text-neon-pink" : "text-gray-400"}`}>
                #{tag}({count})
              </button>
            ))}
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {filtered.length === 0 ? (
          <div className="col-span-full cyber-card p-12 text-center">
            <div className="text-5xl mb-4">{"{ }"}</div>
            <p className="text-gray-400 font-mono">暂无代码片段</p>
            <p className="text-gray-500 font-mono text-sm mt-1">点击右上角 &quot;新建片段&quot; 开始添加</p>
          </div>
        ) : (
          filtered.map(snippet => {
            const tags = parseTags(snippet.tags);
            return (
              <div key={snippet.id} className="cyber-card neon-border-pink group">
                <div className="p-4">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-neon-pink/10 text-neon-pink border border-neon-pink/30">
                        {snippet.language}
                      </span>
                      <h3 className="font-bold text-sm group-hover:text-neon-pink transition-colors truncate">
                        {snippet.title}
                      </h3>
                    </div>
                    <div className="flex items-center gap-1 shrink-0">
                      {isAuth && (
                        <>
                          <button onClick={() => openEdit(snippet)} className="opacity-0 group-hover:opacity-100 text-gray-400 hover:text-neon-blue text-sm p-1 transition-all" title="编辑">✎</button>
                          <button onClick={() => handleDelete(snippet.id)} className="opacity-0 group-hover:opacity-100 text-gray-400 hover:text-red-500 text-sm p-1 transition-all" title="删除">✕</button>
                        </>
                      )}
                    </div>
                  </div>
                  <pre className="bg-gray-900 dark:bg-black rounded-lg p-4 text-sm font-mono text-gray-300 overflow-x-auto max-h-60 overflow-y-auto mb-3 scrollbar-thin">
                    <code>{snippet.code}</code>
                  </pre>
                  <div className="flex items-center justify-between">
                    <div className="flex flex-wrap gap-1">
                      {tags.map(tag => (
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
                  <div className="text-[10px] font-mono text-gray-500 mt-2">
                    创建: {snippet.created_at ? new Date(snippet.created_at).toLocaleString("zh-CN") : ""}
                    {snippet.updated_at !== snippet.created_at && ` · 更新: ${snippet.updated_at ? new Date(snippet.updated_at).toLocaleString("zh-CN") : ""}`}
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
