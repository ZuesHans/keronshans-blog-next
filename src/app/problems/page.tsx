"use client";

import React, { useState, useEffect, useCallback, useMemo } from "react";

interface ProblemRecord {
  id: string;
  title: string;
  url: string;
  platform: string;
  status: "AC" | "WA" | "TLE" | "RE" | "REVIEW" | "TODO";
  tags: string[];
  date: string;
  note: string;
  analysis: string;  // analysis notes for the problem
}

const PLATFORMS: Record<string, { label: string; icon: string; base: string }> = {
  cf: { label: "Codeforces", icon: "⚔️", base: "https://codeforces.com/problemset/problem/" },
  atcoder: { label: "AtCoder", icon: "🟠", base: "https://atcoder.jp/contests/" },
  hd: { label: "HDU", icon: "🎈", base: "https://acm.hdu.edu.cn/contests/contest_list.php" },
  lg: { label: "洛谷", icon: "📖", base: "https://www.luogu.com.cn/problem/" },
  poj: { label: "POJ", icon: "🟢", base: "http://poj.org/problem?id=" },
  uva: { label: "UVA", icon: "🟡", base: "https://onlinejudge.org/index.php?option=com_onlinejudge&Itemid=8&category=24&page=show_problem&problem=" },
  nc: { label: "牛客", icon: "🐂", base: "https://ac.nowcoder.com/acm/problem/" },
  spoj: { label: "SPOJ", icon: "🔵", base: "https://www.spoj.com/problems/" },
  lccn: { label: "力扣", icon: "🟡", base: "https://leetcode.cn/problems/" },
  other: { label: "其他", icon: "🔗", base: "" },
};

const STATUSES: Record<string, { label: string; color: string }> = {
  AC: { label: "AC", color: "#10b981" },
  WA: { label: "WA", color: "#ef4444" },
  TLE: { label: "TLE", color: "#f59e0b" },
  RE: { label: "RE", color: "#8b5cf6" },
  REVIEW: { label: "待复习", color: "#6366f1" },
  TODO: { label: "待做", color: "#64748b" },
};

const STORAGE_KEY = "keronshans_problems";
const AUTH_KEY = "keronshans_auth";

const DEFAULT_TAGS = ["贪心", "DP", "图论", "数据结构", "数学", "数论", "博弈", "字符串", "搜索", "构造", "网络流", "计算几何", "交互"];

export default function ProblemsPage() {
  const [problems, setProblems] = useState<ProblemRecord[]>([]);
  const [loaded, setLoaded] = useState(false);
  const [isAuth, setIsAuth] = useState(false);
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [showAdd, setShowAdd] = useState(false);
  const [filterStatus, setFilterStatus] = useState<string>("all");
  const [filterPlatform, setFilterPlatform] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedTag, setSelectedTag] = useState<string>("all");
  const [expandedId, setExpandedId] = useState<string | null>(null); // which problem's analysis is expanded
  const [editingAnalysisId, setEditingAnalysisId] = useState<string | null>(null);
  const [editAnalysisText, setEditAnalysisText] = useState("");

  // Form state
  const [formTitle, setFormTitle] = useState("");
  const [formUrl, setFormUrl] = useState("");
  const [formPlatform, setFormPlatform] = useState("cf");
  const [formStatus, setFormStatus] = useState<ProblemRecord["status"]>("AC");
  const [formTags, setFormTags] = useState<string[]>([]);
  const [formNote, setFormNote] = useState("");
  const [formTagInput, setFormTagInput] = useState("");
  const [formAnalysis, setFormAnalysis] = useState("");

  useEffect(() => {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) setProblems(JSON.parse(stored));
    if (sessionStorage.getItem(AUTH_KEY) === "true") setIsAuth(true);
    setLoaded(true);
  }, []);

  const saveProblems = useCallback((newProblems: ProblemRecord[]) => {
    setProblems(newProblems);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(newProblems));
  }, []);

  const handleLogin = () => {
    if (password === "keronshans666") {
      setIsAuth(true);
      sessionStorage.setItem(AUTH_KEY, "true");
      setError("");
    } else {
      setError("密码错误");
    }
  };

  const handleAdd = () => {
    if (!formTitle.trim() || !formUrl.trim()) return;
    const newProblem: ProblemRecord = {
      id: Date.now().toString(36) + Math.random().toString(36).slice(2),
      title: formTitle.trim(),
      url: formUrl.trim(),
      platform: formPlatform,
      status: formStatus,
      tags: formTags,
      date: new Date().toISOString().split("T")[0],
      note: formNote.trim(),
      analysis: formAnalysis.trim(),
    };
    saveProblems([newProblem, ...problems]);
    resetForm();
    setShowAdd(false);
  };

  const handleDelete = (id: string) => {
    saveProblems(problems.filter((p) => p.id !== id));
  };

  const handleStatusChange = (id: string, newStatus: ProblemRecord["status"]) => {
    saveProblems(problems.map((p) => (p.id === id ? { ...p, status: newStatus } : p)));
  };

  const resetForm = () => {
    setFormTitle(""); setFormUrl(""); setFormPlatform("cf"); setFormStatus("AC");
    setFormTags([]); setFormNote(""); setFormTagInput(""); setFormAnalysis("");
  };

  const addTag = (tag: string) => {
    if (tag && !formTags.includes(tag)) {
      setFormTags([...formTags, tag]);
    }
    setFormTagInput("");
  };

  const removeTag = (tag: string) => {
    setFormTags(formTags.filter((t) => t !== tag));
  };

  // Filter
  const filteredProblems = problems.filter((p) => {
    if (filterStatus !== "all" && p.status !== filterStatus) return false;
    if (filterPlatform !== "all" && p.platform !== filterPlatform) return false;
    if (selectedTag !== "all" && !p.tags.includes(selectedTag)) return false;
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      if (!p.title.toLowerCase().includes(q) && !p.note.toLowerCase().includes(q) && !p.tags.some((t) => t.toLowerCase().includes(q))) return false;
    }
    return true;
  });

  // Archive by month
  const archive = useMemo(() => {
    const map = new Map<string, ProblemRecord[]>();
    filteredProblems.forEach((p) => {
      const month = p.date.slice(0, 7);
      if (!map.has(month)) map.set(month, []);
      map.get(month)!.push(p);
    });
    return Array.from(map.entries()).sort((a, b) => b[0].localeCompare(a[0]));
  }, [filteredProblems]);

  // All tags
  const allTags = useMemo(() => {
    const tagMap = new Map<string, number>();
    problems.forEach((p) => p.tags.forEach((t) => tagMap.set(t, (tagMap.get(t) || 0) + 1)));
    return Array.from(tagMap.entries()).sort((a, b) => b[1] - a[1]);
  }, [problems]);

  const handleSaveAnalysis = (id: string) => {
    saveProblems(problems.map((p) => (p.id === id ? { ...p, analysis: editAnalysisText } : p)));
    setEditingAnalysisId(null);
  };

  if (!loaded) {
    return <div className="max-w-6xl mx-auto px-4 py-8"><div className="animate-pulse h-10 bg-gray-200 dark:bg-cyber-surface rounded w-48" /></div>;
  }

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-4xl font-display font-bold mb-2">
            <span className="neon-text-blue">◉</span> 题目收集
          </h1>
          <p className="text-gray-500 dark:text-gray-400 font-mono text-sm">
            &gt; PROBLEM.TRACKER | {problems.length} 道题目
          </p>
          <div className="mt-2 h-[1px] bg-gradient-to-r from-neon-blue via-neon-purple to-neon-green opacity-50" />
        </div>
        {isAuth && (
          <button onClick={() => setShowAdd(!showAdd)} className="cyber-btn-blue flex items-center gap-2">
            <span className="text-lg leading-none">+</span> 添加题目
          </button>
        )}
      </div>

      {/* Auth */}
      {!isAuth && (
        <div className="cyber-card neon-border-blue p-5 mb-6">
          <p className="text-sm font-mono text-gray-500 mb-3">&gt; 需要密码才能添加/管理题目</p>
          <div className="flex gap-2">
            <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} onKeyDown={(e) => e.key === "Enter" && handleLogin()} placeholder="输入密码..." className="cyber-input flex-1" />
            <button onClick={handleLogin} className="cyber-btn-blue">验证</button>
          </div>
          {error && <p className="text-sm text-red-500 font-mono mt-2">{error}</p>}
        </div>
      )}

      {/* Add Form */}
      {showAdd && isAuth && (
        <div className="cyber-card neon-border-blue p-6 mb-6 space-y-4">
          <h3 className="text-lg font-display font-bold text-neon-blue">添加新题目</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-mono text-gray-500 mb-1 block">题目名称 *</label>
              <input type="text" value={formTitle} onChange={(e) => setFormTitle(e.target.value)} placeholder="例: CF 1799A" className="cyber-input" />
            </div>
            <div>
              <label className="text-xs font-mono text-gray-500 mb-1 block">题目链接 *</label>
              <input type="text" value={formUrl} onChange={(e) => setFormUrl(e.target.value)} placeholder="https://..." className="cyber-input" />
            </div>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-mono text-gray-500 mb-1 block">OJ平台</label>
              <div className="flex flex-wrap gap-1.5">
                {Object.entries(PLATFORMS).map(([key, val]) => (
                  <button key={key} onClick={() => setFormPlatform(key)} className={`px-2.5 py-1 rounded text-xs font-mono transition-all border ${formPlatform === key ? "border-neon-blue bg-neon-blue/10 text-neon-blue" : "border-transparent bg-gray-50 dark:bg-cyber-surface text-gray-500 hover:border-neon-blue/30"}`}>
                    {val.icon} {val.label}
                  </button>
                ))}
              </div>
            </div>
            <div>
              <label className="text-xs font-mono text-gray-500 mb-1 block">状态</label>
              <div className="flex flex-wrap gap-1.5">
                {Object.entries(STATUSES).map(([key, val]) => (
                  <button key={key} onClick={() => setFormStatus(key as ProblemRecord["status"])} className={`px-2.5 py-1 rounded text-xs font-mono transition-all border ${formStatus === key ? "border-opacity-50 text-white" : "border-transparent text-gray-500 hover:opacity-80"}`} style={formStatus === key ? { backgroundColor: val.color + "40", borderColor: val.color + "80", color: val.color } : {}}>
                    {val.label}
                  </button>
                ))}
              </div>
            </div>
          </div>
          <div>
            <label className="text-xs font-mono text-gray-500 mb-1 block">标签</label>
            <div className="flex flex-wrap gap-1 mb-2">
              {formTags.map((tag) => (
                <span key={tag} className="px-2 py-0.5 rounded-full text-xs font-mono bg-neon-blue/10 text-neon-blue border border-neon-blue/20 flex items-center gap-1">
                  {tag} <button onClick={() => removeTag(tag)} className="hover:text-red-400">✕</button>
                </span>
              ))}
            </div>
            <div className="flex gap-2">
              <input type="text" value={formTagInput} onChange={(e) => setFormTagInput(e.target.value)} onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); addTag(formTagInput); } }} placeholder="输入标签后回车..." className="cyber-input flex-1" />
            </div>
            <div className="flex flex-wrap gap-1 mt-2">
              {DEFAULT_TAGS.map((tag) => (
                <button key={tag} onClick={() => addTag(tag)} className="px-1.5 py-0.5 rounded text-[10px] font-mono text-gray-400 bg-gray-50 dark:bg-cyber-surface hover:text-neon-blue hover:bg-neon-blue/10 transition-all">
                  +{tag}
                </button>
              ))}
            </div>
          </div>
          <div>
            <label className="text-xs font-mono text-gray-500 mb-1 block">备注</label>
            <input type="text" value={formNote} onChange={(e) => setFormNote(e.target.value)} placeholder="可选备注..." className="cyber-input" maxLength={200} />
          </div>
          <div>
            <label className="text-xs font-mono text-gray-500 mb-1 block">
              题解笔记 <span className="text-gray-400">(思路分析、做法总结，不支持代码)</span>
            </label>
            <textarea
              value={formAnalysis}
              onChange={(e) => setFormAnalysis(e.target.value)}
              placeholder="写下你对这道题的分析..."
              rows={5}
              className="cyber-input resize-y text-sm"
              maxLength={2000}
            />
          </div>
          <div className="flex gap-2 justify-end">
            <button onClick={() => { resetForm(); setShowAdd(false); }} className="px-4 py-2 rounded font-mono text-sm text-gray-500 hover:text-gray-700 transition-all">取消</button>
            <button onClick={handleAdd} disabled={!formTitle.trim() || !formUrl.trim()} className="cyber-btn-blue disabled:opacity-30 disabled:cursor-not-allowed">添加</button>
          </div>
        </div>
      )}

      {/* Filters */}
      <div className="cyber-card p-4 mb-6 space-y-3">
        {/* Search */}
        <div className="relative">
          <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="11" cy="11" r="8" /><path d="m21 21-4.3-4.3" />
          </svg>
          <input type="text" value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} placeholder="搜索题目名称、标签、备注..." className="cyber-input pl-9" />
        </div>
        <div className="flex flex-wrap gap-2 items-center">
          <span className="text-xs font-mono text-gray-500">状态:</span>
          <button onClick={() => setFilterStatus("all")} className={`px-2 py-0.5 rounded text-xs font-mono transition-all ${filterStatus === "all" ? "bg-neon-blue/10 text-neon-blue" : "text-gray-400 hover:text-gray-600"}`}>全部</button>
          {Object.entries(STATUSES).map(([key, val]) => (
            <button key={key} onClick={() => setFilterStatus(key)} className={`px-2 py-0.5 rounded text-xs font-mono transition-all ${filterStatus === key ? "text-white" : "text-gray-400 hover:opacity-80"}`} style={filterStatus === key ? { backgroundColor: val.color + "30", color: val.color } : {}}>
              {val.label}
            </button>
          ))}
          <span className="mx-2 w-px h-4 bg-gray-200 dark:bg-cyber-border" />
          <span className="text-xs font-mono text-gray-500">平台:</span>
          <button onClick={() => setFilterPlatform("all")} className={`px-2 py-0.5 rounded text-xs font-mono transition-all ${filterPlatform === "all" ? "bg-neon-blue/10 text-neon-blue" : "text-gray-400 hover:text-gray-600"}`}>全部</button>
          {Object.entries(PLATFORMS).slice(0, 6).map(([key, val]) => (
            <button key={key} onClick={() => setFilterPlatform(key)} className={`px-2 py-0.5 rounded text-xs font-mono transition-all ${filterPlatform === key ? "bg-neon-blue/10 text-neon-blue" : "text-gray-400 hover:text-gray-600"}`}>
              {val.icon} {val.label}
            </button>
          ))}
        </div>
        {/* Tag filter */}
        {allTags.length > 0 && (
          <div className="flex flex-wrap gap-1.5">
            <button onClick={() => setSelectedTag("all")} className={`px-2 py-0.5 rounded text-xs font-mono transition-all ${selectedTag === "all" ? "bg-neon-blue/10 text-neon-blue" : "text-gray-400"}`}>全部标签</button>
            {allTags.slice(0, 15).map(([tag, count]) => (
              <button key={tag} onClick={() => setSelectedTag(selectedTag === tag ? "all" : tag)} className={`px-2 py-0.5 rounded text-xs font-mono transition-all ${selectedTag === tag ? "bg-neon-blue/10 text-neon-blue" : "text-gray-400"}`}>
                #{tag}({count})
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Problem Cards by Archive */}
      <div className="space-y-8">
        {archive.length === 0 ? (
          <div className="cyber-card p-12 text-center">
            <div className="text-5xl mb-4">📋</div>
            <p className="text-gray-400 font-mono">暂无题目记录</p>
            <p className="text-gray-500 font-mono text-sm mt-1">点击右上角 &quot;添加题目&quot; 开始记录</p>
          </div>
        ) : (
          archive.map(([month, monthProblems]) => (
            <div key={month}>
              <div className="flex items-center gap-3 mb-3">
                <h2 className="text-lg font-display font-bold text-neon-blue">{month}</h2>
                <span className="text-xs font-mono text-gray-400">{monthProblems.length} 题</span>
                <div className="flex-1 h-px bg-gray-200 dark:bg-cyber-border" />
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                {monthProblems.map((problem) => {
                  const platform = PLATFORMS[problem.platform] || PLATFORMS.other;
                  const status = STATUSES[problem.status];
                  return (
                    <div key={problem.id} className="cyber-card neon-border-blue group">
                      <div className="p-4">
                        <div className="flex items-start justify-between gap-2 mb-2">
                          <div className="flex items-center gap-2 shrink-0">
                            <span className="text-sm">{platform.icon}</span>
                            <span
                              className="px-1.5 py-0.5 rounded text-[10px] font-mono font-bold text-white"
                              style={{ backgroundColor: status.color + "80" }}
                            >
                              {status.label}
                            </span>
                            {problem.analysis && (
                              <span className="px-1.5 py-0.5 rounded text-[10px] font-mono bg-neon-purple/20 text-neon-purple border border-neon-purple/30">
                                有笔记
                              </span>
                            )}
                          </div>
                          <div className="flex items-center gap-1 shrink-0">
                            {isAuth && (
                              <>
                                <button
                                  onClick={(e) => { e.stopPropagation(); setEditingAnalysisId(editingAnalysisId === problem.id ? null : problem.id); setEditAnalysisText(problem.analysis); }}
                                  className="opacity-0 group-hover:opacity-100 text-gray-400 hover:text-neon-purple text-sm p-0.5 transition-all"
                                  title="编辑笔记"
                                >
                                  ✎
                                </button>
                                <select
                                  value={problem.status}
                                  onChange={(e) => handleStatusChange(problem.id, e.target.value as ProblemRecord["status"])}
                                  className="text-[10px] bg-transparent border border-transparent focus:border-neon-blue/30 rounded px-1 py-0.5 font-mono text-gray-400 opacity-0 group-hover:opacity-100 transition-opacity"
                                  onClick={(e) => e.stopPropagation()}
                                >
                                  {Object.entries(STATUSES).map(([key, val]) => (
                                    <option key={key} value={key}>{val.label}</option>
                                  ))}
                                </select>
                              </>
                            )}
                            <button
                              onClick={(e) => { e.stopPropagation(); handleDelete(problem.id); }}
                              className="opacity-0 group-hover:opacity-100 text-gray-400 hover:text-red-500 text-sm p-0.5 transition-all"
                            >
                              ✕
                            </button>
                          </div>
                        </div>
                        <a href={problem.url} target="_blank" rel="noopener noreferrer" className="block">
                          <h3 className="font-bold text-sm group-hover:text-neon-blue transition-colors mb-1 line-clamp-1">
                            {problem.title}
                          </h3>
                        </a>
                        <div className="flex flex-wrap gap-1 mb-2">
                          {problem.tags.map((tag) => (
                            <span key={tag} className="px-1.5 py-0.5 rounded text-[10px] font-mono bg-neon-blue/5 text-gray-400 border border-gray-100 dark:border-cyber-border">
                              {tag}
                            </span>
                          ))}
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-[10px] font-mono text-gray-400">{problem.date}</span>
                          <div className="flex items-center gap-3">
                            {problem.analysis && (
                              <button
                                onClick={(e) => { e.stopPropagation(); setExpandedId(expandedId === problem.id ? null : problem.id); }}
                                className="text-[10px] font-mono text-neon-purple hover:underline flex items-center gap-0.5"
                              >
                                {expandedId === problem.id ? "收起笔记 ▲" : "查看笔记 ▼"}
                              </button>
                            )}
                            <a
                              href={problem.url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-[10px] font-mono text-neon-blue hover:underline flex items-center gap-0.5"
                            >
                              访问原题 ↗
                            </a>
                          </div>
                        </div>
                        {problem.note && (
                          <p className="text-[10px] font-mono text-gray-400 mt-1 truncate">{problem.note}</p>
                        )}

                        {/* Expanded analysis */}
                        {expandedId === problem.id && problem.analysis && (
                          <div className="mt-3 pt-3 border-t border-gray-100 dark:border-cyber-border">
                            <div className="text-xs font-mono text-gray-400 mb-1.5">{"// 题解笔记"}</div>
                            <div className="text-sm text-gray-700 dark:text-gray-300 whitespace-pre-wrap leading-relaxed font-mono bg-gray-50 dark:bg-black/30 rounded p-3 max-h-60 overflow-y-auto">
                              {problem.analysis}
                            </div>
                          </div>
                        )}

                        {/* Inline edit analysis */}
                        {editingAnalysisId === problem.id && (
                          <div className="mt-3 pt-3 border-t border-gray-100 dark:border-cyber-border space-y-2">
                            <textarea
                              value={editAnalysisText}
                              onChange={(e) => setEditAnalysisText(e.target.value)}
                              placeholder="编辑题解笔记..."
                              rows={4}
                              className="cyber-input resize-y text-sm"
                              maxLength={2000}
                            />
                            <div className="flex gap-2 justify-end">
                              <button onClick={() => setEditingAnalysisId(null)} className="px-3 py-1 rounded text-xs font-mono text-gray-500 hover:text-gray-700 transition-all">取消</button>
                              <button onClick={() => handleSaveAnalysis(problem.id)} className="cyber-btn-blue text-xs px-3 py-1">保存</button>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}


