"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import { SITE_PASSWORD, verifyPassword, isAuthenticated, setAuthenticated } from "@/lib/auth";

// ====== Types ======
interface PostItem {
  filename: string;
  title: string;
  date: string;
  tags: string[];
  category: string;
  size: number;
  content?: string;
  createdAt?: string;
  updatedAt?: string;
}

interface SnippetItem {
  id: string;
  title: string;
  language: string;
  tags: string | string[];
  created_at: string;
  updated_at: string;
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

// ====== Shared components ======
function MsgBanner({ msg }: { msg: string }) {
  if (!msg) return null;
  const isOk = msg.includes("成功") || msg.includes("已删除") || msg.includes("部署");
  return (
    <div className={`mb-4 p-3 rounded text-sm font-mono ${
      isOk
        ? "bg-green-50 text-green-700 dark:bg-green-900/20 dark:text-green-400 border border-green-200 dark:border-green-800"
        : "bg-red-50 text-red-700 dark:bg-red-900/20 dark:text-red-400 border border-red-200 dark:border-red-800"
    }`}>
      {msg}
    </div>
  );
}

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
  const [snippetEditId, setSnippetEditId] = useState<string | null>(null);
  const [snippetTitle, setSnippetTitle] = useState("");
  const [snippetLang, setSnippetLang] = useState("C++");
  const [snippetCode, setSnippetCode] = useState("");
  const [snippetTags, setSnippetTags] = useState<string[]>([]);
  const [snippetTagInput, setSnippetTagInput] = useState("");
  const [snippetSaving, setSnippetSaving] = useState(false);

  function parseSnippetTags(tags: string | string[]): string[] {
    if (Array.isArray(tags)) return tags;
    try { return JSON.parse(tags); } catch { return []; }
  }

  // ====== Deploy ======
  const [deploying, setDeploying] = useState(false);
  const [deployLog, setDeployLog] = useState("");
  const [showDeployHelp, setShowDeployHelp] = useState(false);

  const triggerDeploy = useCallback(async () => {
    setDeploying(true);
    setDeployLog("正在请求部署...");
    try {
      const res = await fetch("/api/deploy", {
        method: "POST",
        headers: { "x-admin-password": SITE_PASSWORD },
      });
      const data = await res.json();
      if (data.success) {
        setDeployLog("部署成功! 网站已更新");
        setTimeout(() => setDeployLog(""), 8000);
      } else if (data.hint === "running_deploy_script") {
        setDeployLog(""); // clear the brief message, show modal instead
        setShowDeployHelp(true);
      } else if (data.error === "deploy_locally") {
        setShowDeployHelp(true);
      } else {
        setDeployLog("部署失败: " + (data.error || "未知错误"));
      }
    } catch {
      setDeployLog("部署失败: 网络错误");
    }
    setDeploying(false);
  }, []);

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
    const frontmatter = { title: editTitle.trim(), date: editDate, tags: editTags.split(",").map(t => t.trim()).filter(Boolean), category: editCategory };
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
      if (res.ok) { setMsg("保存成功，正在部署..."); fetchPosts(); setTimeout(() => setPostView("list"), 500); triggerDeploy(); }
      else { const d = await res.json(); setMsg("保存失败: " + d.error); }
    } catch { setMsg("保存失败: 网络错误"); }
    setSaving(false);
  };

  const deletePost = async (filename: string) => {
    if (!confirm(`确定删除 ${filename}？此操作不可恢复。`)) return;
    try {
      const res = await fetch(`/api/admin?filename=${encodeURIComponent(filename)}`, { method: "DELETE", headers: { "x-admin-password": SITE_PASSWORD } });
      if (res.ok) { setMsg("已删除，正在部署..."); fetchPosts(); triggerDeploy(); }
    } catch {}
  };

  // ====== Snippets CRUD ======
  const fetchSnippets = useCallback(async () => {
    setSnippetsLoading(true);
    try {
      const res = await fetch("/api/snippets");
      if (res.ok) {
        const data = await res.json();
        if (Array.isArray(data)) setSnippets(data);
      }
    } catch {}
    setSnippetsLoading(false);
  }, []);

  useEffect(() => { if (authed && tab === "snippets") fetchSnippets(); }, [authed, tab, fetchSnippets]);

  const filteredSnippets = useMemo(() => {
    return snippets.filter(s => {
      const q = snippetSearch.toLowerCase();
      if (!q) return true;
      const tags = parseSnippetTags(s.tags);
      return s.title.toLowerCase().includes(q) || tags.some(t => t.toLowerCase().includes(q));
    });
  }, [snippets, snippetSearch]);

  const openSnippetEditor = async (id: string) => {
    setMsg("");
    try {
      const snippet = snippets.find(s => s.id === id);
      if (!snippet) { setMsg("未找到片段"); return; }
      setSnippetEditId(id);
      setSnippetTitle(snippet.title);
      setSnippetLang(snippet.language);
      setSnippetCode(snippet.code);
      setSnippetTags(parseSnippetTags(snippet.tags));
      setSnippetTagInput("");
      setSnippetView("edit");
    } catch { setMsg("加载失败"); }
  };

  const openNewSnippet = () => {
    setSnippetEditId(null); setSnippetTitle(""); setSnippetLang("C++"); setSnippetCode("");
    setSnippetTags([]); setSnippetTagInput(""); setSnippetView("new"); setMsg("");
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
      if (snippetEditId) {
        res = await fetch("/api/snippets", {
          method: "PUT", headers: { "Content-Type": "application/json", "x-admin-password": SITE_PASSWORD },
          body: JSON.stringify({ id: snippetEditId, title: snippetTitle.trim(), language: snippetLang, code: snippetCode, tags: snippetTags }),
        });
      } else {
        const newId = Date.now().toString(36) + Math.random().toString(36).slice(2);
        res = await fetch("/api/snippets", {
          method: "POST", headers: { "Content-Type": "application/json", "x-admin-password": SITE_PASSWORD },
          body: JSON.stringify({ id: newId, title: snippetTitle.trim(), language: snippetLang, code: snippetCode, tags: snippetTags }),
        });
      }
      if (res.ok) { setMsg("保存成功，正在部署..."); fetchSnippets(); setTimeout(() => setSnippetView("list"), 500); triggerDeploy(); }
      else { const d = await res.json(); setMsg("保存失败: " + d.error); }
    } catch { setMsg("保存失败: 网络错误"); }
    setSnippetSaving(false);
  };

  const deleteSnippet = async (id: string) => {
    if (!confirm(`确定删除代码片段？此操作不可恢复。`)) return;
    try {
      const res = await fetch(`/api/snippets?id=${encodeURIComponent(id)}`, { method: "DELETE", headers: { "x-admin-password": SITE_PASSWORD } });
      if (res.ok) { setMsg("已删除，正在部署..."); fetchSnippets(); triggerDeploy(); }
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
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
          <div><label className="text-xs font-mono text-gray-500 block mb-1">标题 *</label><input value={snippetTitle} onChange={(e) => setSnippetTitle(e.target.value)} className="cyber-input" placeholder="例: 线段树模板" /></div>
          <div>
            <label className="text-xs font-mono text-gray-500 block mb-1">语言</label>
            <select value={snippetLang} onChange={(e) => setSnippetLang(e.target.value)} className="cyber-input">
              {LANGUAGES.map(l => <option key={l}>{l}</option>)}
            </select>
          </div>
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
        <p className="text-xs text-gray-400 font-mono mt-2">ID: {snippetEditId || "(新建)"}</p>
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
        <button
          onClick={triggerDeploy}
          disabled={deploying}
          className="px-3 py-1.5 rounded text-xs font-mono border border-gray-200 dark:border-cyber-border text-gray-500 hover:text-neon-green hover:border-neon-green/30 transition-all disabled:opacity-50 cursor-pointer"
          title="手动触发构建部署"
        >
          {deploying ? "..." : "Deploy"}
        </button>
      </div>

      {/* Deploy Help Modal */}
      {showDeployHelp && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50" onClick={() => setShowDeployHelp(false)}>
          <div className="bg-white dark:bg-cyber-surface border border-cyber-border rounded-lg p-6 max-w-md shadow-xl" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-display font-bold neon-text">部署到 keronshans.top</h3>
              <button onClick={() => setShowDeployHelp(false)} className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 text-xl">&times;</button>
            </div>
            <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
              文章已保存到本地文件。需要运行以下命令将更改同步到线上：
            </p>
            <div className="bg-gray-900 dark:bg-black rounded p-4 font-mono text-sm text-green-400 mb-4 overflow-x-auto">
              <div className="mb-1"># 1. 进入项目目录</div>
              <div className="mb-3">cd C:\Users\31802\Documents\keronshans_blogsorce</div>
              <div className="mb-1"># 2. 运行部署脚本</div>
              <div>powershell -File deploy.ps1</div>
            </div>
            <p className="text-xs text-gray-400 mb-4">
              部署脚本会自动构建、部署到 Cloudflare，并推送到 GitHub。
            </p>
            <div className="border-t border-gray-200 dark:border-cyber-border pt-4">
              <p className="text-sm font-medium mb-2">自动化部署（推荐）</p>
              <p className="text-xs text-gray-500 mb-3">
                在 GitHub 仓库设置以下 Secrets 后，每次 push 到 main 分支会自动部署：
              </p>
              <ul className="text-xs text-gray-400 font-mono space-y-1">
                <li>• CLOUDFLARE_API_TOKEN</li>
                <li>• CLOUDFLARE_ACCOUNT_ID</li>
              </ul>
            </div>
            <button onClick={() => setShowDeployHelp(false)} className="cyber-btn w-full mt-4">好的</button>
          </div>
        </div>
      )}

      {msg && <MsgBanner msg={msg} />}

      {/* Deploy status */}
      {(deploying || deployLog) && (
        <div className={`mb-4 p-3 rounded text-sm font-mono flex items-center gap-3 ${
          deploying
            ? "bg-yellow-50 text-yellow-700 dark:bg-yellow-900/20 dark:text-yellow-400 border border-yellow-200 dark:border-yellow-800"
            : deployLog.includes("成功")
            ? "bg-green-50 text-green-700 dark:bg-green-900/20 dark:text-green-400 border border-green-200 dark:border-green-800"
            : "bg-red-50 text-red-700 dark:bg-red-900/20 dark:text-red-400 border border-red-200 dark:border-red-800"
        }`}>
          {deploying && (
            <svg className="animate-spin h-4 w-4 shrink-0" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" /><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" /></svg>
          )}
          <span>{deploying ? "部署中..." : deployLog}</span>
        </div>
      )}

      {/* Manual deploy button */}
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
              {filteredSnippets.map(snippet => {
                const tags = parseSnippetTags(snippet.tags);
                return (
                <div key={snippet.id} className="cyber-card p-4 flex items-center gap-4 group">
                  <span className="shrink-0 px-2 py-0.5 rounded text-xs font-mono bg-neon-blue/10 text-neon-blue border border-neon-blue/30">{snippet.language}</span>
                  <div className="flex-1 min-w-0">
                    <div className="font-mono text-sm font-medium truncate">{snippet.title}</div>
                    <div className="flex items-center gap-3 text-xs text-gray-400 mt-0.5">
                      <span>{snippet.updated_at}</span>
                      <span>{tags.slice(0, 4).map(t => `#${t}`).join(" ")}</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button onClick={() => openSnippetEditor(snippet.id)} className="cyber-btn text-xs px-3 py-1">编辑</button>
                    <button onClick={() => deleteSnippet(snippet.id)} className="text-xs px-3 py-1 rounded border border-red-300 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 transition-all">删除</button>
                  </div>
                </div>
                );
              })}
              {filteredSnippets.length === 0 && <div className="cyber-card p-8 text-center text-gray-500">{snippetSearch ? "没有匹配的片段" : "暂无代码片段"}</div>}
            </div>
          )}
        </>
      )}
    </div>
  );
}


