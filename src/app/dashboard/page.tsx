"use client";

import { useState, useEffect, useCallback } from "react";
import { SITE_PASSWORD, verifyPassword, isAuthenticated, setAuthenticated } from "@/lib/auth";

// ====== Types ======
interface PostItem {
  filename: string;
  title: string;
  date: string;
  tags: string[];
  category: string;
  excerpt: string;
  size: number;
}

interface SnippetItem {
  filename: string;
  id: string;
  title: string;
  language: string;
  tags: string[];
  createdAt: string;
  updatedAt: string;
  description?: string;
}

const CATEGORY_PREFIXES: Record<string, string> = {
  "笔记": "KH_",
  "模板": "ZU_",
  "题解": "wp_",
  "专题": "sp_",
  "其他": "",
};

const LANGUAGES = ["C++", "C", "Python", "Java", "JavaScript", "TypeScript", "Go", "Rust", "Shell", "SQL", "Other"];

const SNIPPET_TAGS = [
  "图论", "DP", "数据结构", "数学", "数论", "字符串",
  "网络流", "计算几何", "博弈", "搜索", "贪心", "暴力",
  "STL", "位运算", "前缀和", "并查集", "线段树", "树状数组", "对拍", "调试",
];

// ====== Component ======
export default function DashboardPage() {
  const [authed, setAuthed] = useState(false);
  const [pwd, setPwd] = useState("");
  const [msg, setMsg] = useState("");
  // Tab: "posts" or "snippets"
  const [tab, setTab] = useState<"posts" | "snippets">("posts");

  // ====== Posts state ======
  const [posts, setPosts] = useState<PostItem[]>([]);
  const [postsLoading, setPostsLoading] = useState(false);
  const [postSearch, setPostSearch] = useState("");
  const [postView, setPostView] = useState<"list" | "edit" | "new">("list");
  const [editFile, setEditFile] = useState<string | null>(null);
  const [editTitle, setEditTitle] = useState("");
  const [editDate, setEditDate] = useState(new Date().toISOString().slice(0, 10));
  const [editTags, setEditTags] = useState("");
  const [editCategory, setEditCategory] = useState("笔记");
  const [editContent, setEditContent] = useState("");
  const [saving, setSaving] = useState(false);

  // ====== Snippets state ======
  const [snippets, setSnippets] = useState<SnippetItem[]>([]);
  const [snippetsLoading, setSnippetsLoading] = useState(false);
  const [snippetSearch, setSnippetSearch] = useState("");
  const [snippetView, setSnippetView] = useState<"list" | "edit" | "new">("list");
  const [snippetFile, setSnippetFile] = useState<string | null>(null);
  const [snippetTitle, setSnippetTitle] = useState("");
  const [snippetLang, setSnippetLang] = useState("C++");
  const [snippetCode, setSnippetCode] = useState("");
  const [snippetTags, setSnippetTags] = useState<string[]>([]);
  const [snippetTagInput, setSnippetTagInput] = useState("");
  const [snippetDesc, setSnippetDesc] = useState("");
  const [snippetSaving, setSnippetSaving] = useState(false);

  // ====== Auth ======
  const handleLogin = () => {
    if (verifyPassword(pwd)) {
      setAuthenticated();
      setAuthed(true);
    } else {
      setMsg("密码错误");
    }
  };

  // ====== Posts CRUD ======
  const fetchPosts = useCallback(async () => {
    setPostsLoading(true);
    try {
      const res = await fetch("/api/admin", { headers: { "x-admin-password": SITE_PASSWORD } });
      if (res.ok) setPosts(await res.json());
    } catch {}
    setPostsLoading(false);
  }, []);

  useEffect(() => { if (authed) fetchPosts(); }, [authed, fetchPosts]);

  const filteredPosts = posts.filter(
    (p) => p.title.toLowerCase().includes(postSearch.toLowerCase()) || p.tags.some((t) => t.toLowerCase().includes(postSearch.toLowerCase()))
  );

  const openPostEditor = async (filename: string) => {
    setMsg("");
    try {
      const res = await fetch(`/api/admin/${encodeURIComponent(filename)}`, { headers: { "x-admin-password": SITE_PASSWORD } });
      if (!res.ok) return;
      const data = await res.json();
      setEditFile(filename);
      setEditTitle(data.frontmatter.title || "");
      setEditDate(data.frontmatter.date ? String(data.frontmatter.date).slice(0, 10) : "");
      setEditTags((data.frontmatter.tags || []).join(", "));
      setEditCategory(data.frontmatter.category || inferCategory(filename));
      setEditContent(data.content);
      setPostView("edit");
    } catch { setMsg("加载失败"); }
  };

  const openNewPost = () => {
    setEditFile(null); setEditTitle(""); setEditDate(new Date().toISOString().slice(0, 10));
    setEditTags(""); setEditCategory("笔记"); setEditContent(""); setPostView("new"); setMsg("");
  };

  const inferCategory = (f: string) => {
    if (f.startsWith("KH_")) return "笔记"; if (f.startsWith("ZU_")) return "模板";
    if (f.startsWith("wp_")) return "题解"; if (f.startsWith("sp_")) return "专题"; return "其他";
  };

  const savePost = async () => {
    if (!editTitle.trim()) { setMsg("标题不能为空"); return; }
    setSaving(true); setMsg("");
    const prefix = CATEGORY_PREFIXES[editCategory] || "";
    const filename = editFile || `${prefix}${editTitle.trim()}.md`;
    const frontmatter = { title: editTitle.trim(), date: editDate, tags: editTags.split(",").map(t => t.trim()).filter(Boolean), categories: [editCategory] };
    try {
      let res: Response;
      if (editFile) {
        res = await fetch(`/api/admin/${encodeURIComponent(editFile)}`, {
          method: "PUT", headers: { "Content-Type": "application/json", "x-admin-password": SITE_PASSWORD },
          body: JSON.stringify({ frontmatter, content: editContent, newFilename: editFile !== filename ? filename : undefined }),
        });
      } else {
        res = await fetch("/api/admin", {
          method: "POST", headers: { "Content-Type": "application/json", "x-admin-password": SITE_PASSWORD },
          body: JSON.stringify({ filename, frontmatter, content: editContent }),
        });
      }
      if (res.ok) { setMsg("保存成功"); fetchPosts(); setTimeout(() => setPostView("list"), 500); }
      else { const d = await res.json(); setMsg("保存失败: " + d.error); }
    } catch { setMsg("保存失败: 网络错误"); }
    setSaving(false);
  };

  const deletePost = async (filename: string) => {
    if (!confirm(`确定删除 ${filename}？此操作不可恢复。`)) return;
    try {
      const res = await fetch(`/api/admin?filename=${encodeURIComponent(filename)}`, { method: "DELETE", headers: { "x-admin-password": SITE_PASSWORD } });
      if (res.ok) { setMsg("已删除"); fetchPosts(); }
    } catch {}
  };

  // ====== Snippets CRUD ======
  const fetchSnippets = useCallback(async () => {
    setSnippetsLoading(true);
    try {
      const res = await fetch("/api/snippets");
      if (res.ok) setSnippets(await res.json());
    } catch {}
    setSnippetsLoading(false);
  }, []);

  useEffect(() => { if (authed && tab === "snippets") fetchSnippets(); }, [authed, tab, fetchSnippets]);

  const filteredSnippets = snippets.filter(
    (s) => s.title.toLowerCase().includes(snippetSearch.toLowerCase()) || s.tags.some((t) => t.toLowerCase().includes(snippetSearch.toLowerCase()))
  );

  const openSnippetEditor = async (filename: string) => {
    setMsg("");
    try {
      const res = await fetch(`/api/snippets?filename=${encodeURIComponent(filename)}`, { headers: { "x-admin-password": SITE_PASSWORD } });
      if (!res.ok) return;
      const data = await res.json();
      setSnippetFile(data.filename);
      setSnippetTitle(data.title);
      setSnippetLang(data.language);
      setSnippetCode(data.code);
      setSnippetTags(data.tags);
      setSnippetDesc(data.description || "");
      setSnippetTagInput("");
      setSnippetView("edit");
    } catch { setMsg("加载失败"); }
  };

  const openNewSnippet = () => {
    setSnippetFile(null); setSnippetTitle(""); setSnippetLang("C++"); setSnippetCode("");
    setSnippetTags([]); setSnippetTagInput(""); setSnippetDesc("");
    setSnippetView("new"); setMsg("");
  };

  const addSnippetTag = (tag: string) => {
    if (tag && !snippetTags.includes(tag)) setSnippetTags([...snippetTags, tag]);
    setSnippetTagInput("");
  };
  const removeSnippetTag = (tag: string) => setSnippetTags(snippetTags.filter(t => t !== tag));

  const saveSnippet = async () => {
    if (!snippetTitle.trim() || !snippetCode.trim()) { setMsg("标题和代码不能为空"); return; }
    setSnippetSaving(true); setMsg("");
    try {
      let res: Response;
      if (snippetFile) {
        res = await fetch("/api/snippets", {
          method: "PUT", headers: { "Content-Type": "application/json", "x-admin-password": SITE_PASSWORD },
          body: JSON.stringify({ filename: snippetFile, title: snippetTitle.trim(), language: snippetLang, code: snippetCode, tags: snippetTags, description: snippetDesc.trim() }),
        });
      } else {
        res = await fetch("/api/snippets", {
          method: "POST", headers: { "Content-Type": "application/json", "x-admin-password": SITE_PASSWORD },
          body: JSON.stringify({ title: snippetTitle.trim(), language: snippetLang, code: snippetCode, tags: snippetTags, description: snippetDesc.trim() }),
        });
      }
      if (res.ok) { setMsg("保存成功"); fetchSnippets(); setTimeout(() => setSnippetView("list"), 500); }
      else { const d = await res.json(); setMsg("保存失败: " + d.error); }
    } catch { setMsg("保存失败: 网络错误"); }
    setSnippetSaving(false);
  };

  const deleteSnippet = async (filename: string) => {
    if (!confirm(`确定删除代码片段 "${filename}"？`)) return;
    try {
      const res = await fetch(`/api/snippets?filename=${encodeURIComponent(filename)}`, { method: "DELETE", headers: { "x-admin-password": SITE_PASSWORD } });
      if (res.ok) { setMsg("已删除"); fetchSnippets(); }
    } catch {}
  };

  // ====== Render ======
  // Login
  if (!authed) {
    return (
      <div className="max-w-md mx-auto px-4 py-20">
        <div className="cyber-card p-8 text-center">
          <h1 className="text-2xl font-display font-bold mb-2 neon-text">作者仪表盘</h1>
          <p className="text-sm text-gray-500 mb-6">请输入密码以管理博客内容</p>
          <input type="password" value={pwd} onChange={(e) => setPwd(e.target.value)} onKeyDown={(e) => e.key === "Enter" && handleLogin()} placeholder="输入密码..." className="cyber-input mb-4" autoFocus />
          <button onClick={handleLogin} className="cyber-btn w-full">登录</button>
          {msg && <p className="text-red-500 text-sm mt-3">{msg}</p>}
        </div>
      </div>
    );
  }

  // Posts Editor
  if (tab === "posts" && (postView === "edit" || postView === "new")) {
    return (
      <div className="max-w-5xl mx-auto px-4 py-8">
        <div className="flex items-center justify-between mb-6">
          <button onClick={() => setPostView("list")} className="cyber-btn text-sm">&larr; 返回列表</button>
          <h2 className="text-xl font-display font-bold">{postView === "new" ? "新建文章" : "编辑文章"}</h2>
          <button onClick={savePost} disabled={saving} className="cyber-btn-green text-sm">{saving ? "保存中..." : "保存"}</button>
        </div>
        {msg && <MsgBanner msg={msg} />}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-4">
          <div><label className="text-xs font-mono text-gray-500 block mb-1">标题</label><input value={editTitle} onChange={(e) => setEditTitle(e.target.value)} className="cyber-input" placeholder="文章标题" /></div>
          <div><label className="text-xs font-mono text-gray-500 block mb-1">日期</label><input type="date" value={editDate} onChange={(e) => setEditDate(e.target.value)} className="cyber-input" /></div>
          <div><label className="text-xs font-mono text-gray-500 block mb-1">分类</label><select value={editCategory} onChange={(e) => setEditCategory(e.target.value)} className="cyber-input"><option>笔记</option><option>模板</option><option>题解</option><option>专题</option><option>其他</option></select></div>
          <div><label className="text-xs font-mono text-gray-500 block mb-1">标签 (逗号分隔)</label><input value={editTags} onChange={(e) => setEditTags(e.target.value)} className="cyber-input" placeholder="dp, 树形, 线段树" /></div>
        </div>
        <div className="cyber-card p-1"><textarea value={editContent} onChange={(e) => setEditContent(e.target.value)} className="w-full min-h-[60vh] p-4 bg-transparent font-mono text-sm resize-y focus:outline-none" placeholder="在这里写 Markdown 内容..." /></div>
        <p className="text-xs text-gray-400 font-mono mt-2">支持 Markdown 语法 | 文件: {editFile || "(新建)"}</p>
      </div>
    );
  }

  // Snippets Editor
  if (tab === "snippets" && (snippetView === "edit" || snippetView === "new")) {
    return (
      <div className="max-w-5xl mx-auto px-4 py-8">
        <div className="flex items-center justify-between mb-6">
          <button onClick={() => setSnippetView("list")} className="cyber-btn text-sm">&larr; 返回列表</button>
          <h2 className="text-xl font-display font-bold">{snippetView === "new" ? "新建代码片段" : "编辑代码片段"}</h2>
          <button onClick={saveSnippet} disabled={snippetSaving} className="cyber-btn-green text-sm">{snippetSaving ? "保存中..." : "保存"}</button>
        </div>
        {msg && <MsgBanner msg={msg} />}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
          <div><label className="text-xs font-mono text-gray-500 block mb-1">标题 *</label><input value={snippetTitle} onChange={(e) => setSnippetTitle(e.target.value)} className="cyber-input" placeholder="例: 线段树模板" /></div>
          <div>
            <label className="text-xs font-mono text-gray-500 block mb-1">语言</label>
            <select value={snippetLang} onChange={(e) => setSnippetLang(e.target.value)} className="cyber-input">
              {LANGUAGES.map(l => <option key={l}>{l}</option>)}
            </select>
          </div>
          <div><label className="text-xs font-mono text-gray-500 block mb-1">描述</label><input value={snippetDesc} onChange={(e) => setSnippetDesc(e.target.value)} className="cyber-input" placeholder="简短描述（可选）" /></div>
        </div>
        <div className="mb-4">
          <label className="text-xs font-mono text-gray-500 block mb-1">标签</label>
          <div className="flex flex-wrap gap-1 mb-2">
            {snippetTags.map(tag => (
              <span key={tag} className="px-2 py-0.5 rounded-full text-xs font-mono bg-neon-pink/10 text-neon-pink border border-neon-pink/20 flex items-center gap-1">{tag} <button onClick={() => removeSnippetTag(tag)} className="hover:text-red-400">&times;</button></span>
            ))}
          </div>
          <input type="text" value={snippetTagInput} onChange={(e) => setSnippetTagInput(e.target.value)} onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); addSnippetTag(snippetTagInput); } }} placeholder="输入标签后回车..." className="cyber-input mb-2" />
          <div className="flex flex-wrap gap-1">{SNIPPET_TAGS.map(tag => <button key={tag} onClick={() => addSnippetTag(tag)} className="px-1.5 py-0.5 rounded text-[10px] font-mono text-gray-400 bg-gray-50 dark:bg-cyber-surface hover:text-neon-pink hover:bg-neon-pink/10 transition-all">+{tag}</button>)}</div>
        </div>
        <div className="cyber-card p-1"><textarea value={snippetCode} onChange={(e) => setSnippetCode(e.target.value)} className="w-full min-h-[50vh] p-4 bg-gray-900 dark:bg-black font-mono text-sm text-gray-200 resize-y focus:outline-none" placeholder="粘贴代码..." spellCheck={false} /></div>
        <p className="text-xs text-gray-400 font-mono mt-2">代码将保存为 Markdown 文件: {snippetFile || "(新建)"}</p>
      </div>
    );
  }

  // Main List View with Tabs
  return (
    <div className="max-w-5xl mx-auto px-4 py-8">
      {/* Tab Switcher */}
      <div className="flex items-center gap-4 mb-6">
        <button onClick={() => setTab("posts")} className={`text-lg font-display font-bold transition-all ${tab === "posts" ? "neon-text" : "text-gray-400 hover:text-gray-600"}`}>
          <span className="mr-1">◈</span> 文章管理
        </button>
        <button onClick={() => setTab("snippets")} className={`text-lg font-display font-bold transition-all ${tab === "snippets" ? "neon-text-blue" : "text-gray-400 hover:text-gray-600"}`}>
          <span className="mr-1">{"{ }"}</span> 代码片段
        </button>
        <div className="flex-1" />
      </div>

      {msg && <MsgBanner msg={msg} />}

      {/* ====== Posts Tab ====== */}
      {tab === "posts" && (
        <>
          <div className="flex items-center justify-between mb-4">
            <div className="flex-1 mr-4"><input type="text" value={postSearch} onChange={(e) => setPostSearch(e.target.value)} placeholder="搜索文章标题或标签..." className="cyber-input" /></div>
            <button onClick={openNewPost} className="cyber-btn-green">+ 新建文章</button>
          </div>
          <div className="text-xs font-mono text-gray-500 mb-3">共 {filteredPosts.length} 篇文章 | 文件目录: content/posts/</div>
          {postsLoading ? <div className="cyber-card p-8 text-center text-gray-500">加载中...</div> : (
            <div className="space-y-2">
              {filteredPosts.map(post => (
                <div key={post.filename} className="cyber-card p-4 flex items-center gap-4 group">
                  <span className="shrink-0 px-2 py-0.5 rounded text-xs font-mono border border-gray-200 dark:border-cyber-border text-gray-500">{post.category}</span>
                  <div className="flex-1 min-w-0">
                    <div className="font-mono text-sm font-medium truncate">{post.title}</div>
                    <div className="flex items-center gap-3 text-xs text-gray-400 mt-0.5"><span>{post.filename}</span><span>{post.date}</span><span>{post.tags.slice(0, 3).map(t => `#${t}`).join(" ")}</span><span>{(post.size / 1024).toFixed(1)}KB</span></div>
                  </div>
                  <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button onClick={() => openPostEditor(post.filename)} className="cyber-btn-blue text-xs px-3 py-1">编辑</button>
                    <button onClick={() => deletePost(post.filename)} className="text-xs px-3 py-1 rounded border border-red-300 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 transition-all">删除</button>
                  </div>
                </div>
              ))}
              {filteredPosts.length === 0 && <div className="cyber-card p-8 text-center text-gray-500">{postSearch ? "没有匹配的文章" : "暂无文章"}</div>}
            </div>
          )}
        </>
      )}

      {/* ====== Snippets Tab ====== */}
      {tab === "snippets" && (
        <>
          <div className="flex items-center justify-between mb-4">
            <div className="flex-1 mr-4"><input type="text" value={snippetSearch} onChange={(e) => setSnippetSearch(e.target.value)} placeholder="搜索代码片段..." className="cyber-input" /></div>
            <button onClick={openNewSnippet} className="cyber-btn-blue">+ 新建片段</button>
          </div>
          <div className="text-xs font-mono text-gray-500 mb-3">共 {filteredSnippets.length} 个片段 | 文件目录: content/snippets/</div>
          {snippetsLoading ? <div className="cyber-card p-8 text-center text-gray-500">加载中...</div> : (
            <div className="space-y-2">
              {filteredSnippets.map(snippet => (
                <div key={snippet.filename} className="cyber-card p-4 flex items-center gap-4 group">
                  <span className="shrink-0 px-2 py-0.5 rounded text-xs font-mono bg-neon-blue/10 text-neon-blue border border-neon-blue/30">{snippet.language}</span>
                  <div className="flex-1 min-w-0">
                    <div className="font-mono text-sm font-medium truncate">{snippet.title}</div>
                    <div className="flex items-center gap-3 text-xs text-gray-400 mt-0.5">
                      <span>{snippet.filename}</span>
                      <span>{snippet.updatedAt || snippet.createdAt}</span>
                      <span>{snippet.tags.slice(0, 4).map(t => `#${t}`).join(" ")}</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button onClick={() => openSnippetEditor(snippet.filename)} className="cyber-btn text-xs px-3 py-1">编辑</button>
                    <button onClick={() => deleteSnippet(snippet.filename)} className="text-xs px-3 py-1 rounded border border-red-300 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 transition-all">删除</button>
                  </div>
                </div>
              ))}
              {filteredSnippets.length === 0 && <div className="cyber-card p-8 text-center text-gray-500">{snippetSearch ? "没有匹配的片段" : "暂无代码片段"}</div>}
            </div>
          )}
        </>
      )}
    </div>
  );
}

// Shared message banner
function MsgBanner({ msg }: { msg: string }) {
  const isOk = msg.includes("成功") || msg.includes("已删除");
  return (
    <div className={`mb-4 p-3 rounded text-sm font-mono ${isOk ? "bg-green-50 text-green-700 dark:bg-green-900/20 dark:text-green-400 border border-green-200 dark:border-green-800" : "bg-red-50 text-red-700 dark:bg-red-900/20 dark:text-red-400 border border-red-200 dark:border-red-800"}`}>
      {msg}
    </div>
  );
}
