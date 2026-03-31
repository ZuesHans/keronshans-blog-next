"use client";

import { useState, useEffect, useCallback } from "react";
import { SITE_PASSWORD, verifyPassword, isAuthenticated, setAuthenticated } from "@/lib/auth";

interface PostItem {
  filename: string;
  title: string;
  date: string;
  tags: string[];
  category: string;
  excerpt: string;
  size: number;
}

const CATEGORY_PREFIXES: Record<string, string> = {
  "笔记": "KH_",
  "模板": "ZU_",
  "题解": "wp_",
  "专题": "sp_",
  "其他": "",
};

export default function DashboardPage() {
  const [authed, setAuthed] = useState(false);
  const [pwd, setPwd] = useState("");
  const [posts, setPosts] = useState<PostItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState("");
  const [view, setView] = useState<"list" | "edit" | "new">("list");
  const [editFile, setEditFile] = useState<string | null>(null);
  const [editTitle, setEditTitle] = useState("");
  const [editDate, setEditDate] = useState(new Date().toISOString().slice(0, 10));
  const [editTags, setEditTags] = useState("");
  const [editCategory, setEditCategory] = useState("笔记");
  const [editContent, setEditContent] = useState("");
  const [editFilename, setEditFilename] = useState("");
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState("");

  const fetchPosts = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/admin", {
        headers: { "x-admin-password": SITE_PASSWORD },
      });
      if (res.ok) setPosts(await res.json());
    } catch {}
    setLoading(false);
  }, []);

  useEffect(() => {
    if (authed) fetchPosts();
  }, [authed, fetchPosts]);

  const handleLogin = () => {
    if (verifyPassword(pwd)) {
      setAuthenticated();
      setAuthed(true);
    } else {
      setMsg("密码错误");
    }
  };

  const filteredPosts = posts.filter(
    (p) =>
      p.title.toLowerCase().includes(search.toLowerCase()) ||
      p.tags.some((t) => t.toLowerCase().includes(search.toLowerCase()))
  );

  const openEditor = async (filename: string) => {
    setMsg("");
    try {
      const res = await fetch(`/api/admin/${encodeURIComponent(filename)}`, {
        headers: { "x-admin-password": SITE_PASSWORD },
      });
      if (!res.ok) return;
      const data = await res.json();
      setEditFile(filename);
      setEditTitle(data.frontmatter.title || "");
      setEditDate(data.frontmatter.date ? String(data.frontmatter.date).slice(0, 10) : "");
      setEditTags((data.frontmatter.tags || []).join(", "));
      setEditCategory(data.frontmatter.category || inferCategory(filename));
      setEditContent(data.content);
      setEditFilename(filename);
      setView("edit");
    } catch {
      setMsg("加载失败");
    }
  };

  const openNew = () => {
    setEditFile(null);
    setEditTitle("");
    setEditDate(new Date().toISOString().slice(0, 10));
    setEditTags("");
    setEditCategory("笔记");
    setEditContent("");
    setEditFilename("");
    setView("new");
    setMsg("");
  };

  const inferCategory = (filename: string): string => {
    if (filename.startsWith("KH_")) return "笔记";
    if (filename.startsWith("ZU_")) return "模板";
    if (filename.startsWith("wp_")) return "题解";
    if (filename.startsWith("sp_")) return "专题";
    return "其他";
  };

  const savePost = async () => {
    if (!editTitle.trim()) { setMsg("标题不能为空"); return; }
    setSaving(true);
    setMsg("");

    const prefix = CATEGORY_PREFIXES[editCategory] || "";
    const filename = editFile || `${prefix}${editTitle.trim()}.md`;
    const frontmatter = {
      title: editTitle.trim(),
      date: editDate,
      tags: editTags.split(",").map((t) => t.trim()).filter(Boolean),
      categories: [editCategory],
    };
    const content = editContent;

    try {
      let res: Response;
      if (editFile) {
        const newFilename = editFile !== filename ? filename : undefined;
        res = await fetch(`/api/admin/${encodeURIComponent(editFile)}`, {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            "x-admin-password": SITE_PASSWORD,
          },
          body: JSON.stringify({ frontmatter, content, newFilename }),
        });
      } else {
        res = await fetch("/api/admin", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "x-admin-password": SITE_PASSWORD,
          },
          body: JSON.stringify({ filename, frontmatter, content }),
        });
      }

      if (res.ok) {
        setMsg("保存成功");
        fetchPosts();
        setTimeout(() => setView("list"), 500);
      } else {
        const data = await res.json();
        setMsg("保存失败: " + data.error);
      }
    } catch {
      setMsg("保存失败: 网络错误");
    }
    setSaving(false);
  };

  const deletePost = async (filename: string) => {
    if (!confirm(`确定删除 ${filename}？此操作不可恢复。`)) return;
    try {
      const res = await fetch(`/api/admin?filename=${encodeURIComponent(filename)}`, {
        method: "DELETE",
        headers: { "x-admin-password": SITE_PASSWORD },
      });
      if (res.ok) {
        setMsg("已删除");
        fetchPosts();
      }
    } catch {}
  };

  // Login screen
  if (!authed) {
    return (
      <div className="max-w-md mx-auto px-4 py-20">
        <div className="cyber-card p-8 text-center">
          <h1 className="text-2xl font-display font-bold mb-2 neon-text">作者仪表盘</h1>
          <p className="text-sm text-gray-500 mb-6">请输入密码以管理文章</p>
          <input
            type="password"
            value={pwd}
            onChange={(e) => setPwd(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleLogin()}
            placeholder="输入密码..."
            className="cyber-input mb-4"
            autoFocus
          />
          <button onClick={handleLogin} className="cyber-btn w-full">
            登录
          </button>
          {msg && <p className="text-red-500 text-sm mt-3">{msg}</p>}
        </div>
      </div>
    );
  }

  // Editor view
  if (view === "edit" || view === "new") {
    return (
      <div className="max-w-5xl mx-auto px-4 py-8">
        <div className="flex items-center justify-between mb-6">
          <button onClick={() => setView("list")} className="cyber-btn text-sm">
            &larr; 返回列表
          </button>
          <h2 className="text-xl font-display font-bold">
            {view === "new" ? "新建文章" : "编辑文章"}
          </h2>
          <button onClick={savePost} disabled={saving} className="cyber-btn-green text-sm">
            {saving ? "保存中..." : "保存"}
          </button>
        </div>

        {msg && (
          <div className={`mb-4 p-3 rounded text-sm font-mono ${msg.includes("成功") ? "bg-green-50 text-green-700 dark:bg-green-900/20 dark:text-green-400 border border-green-200 dark:border-green-800" : "bg-red-50 text-red-700 dark:bg-red-900/20 dark:text-red-400 border border-red-200 dark:border-red-800"}`}>
            {msg}
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-4">
          <div>
            <label className="text-xs font-mono text-gray-500 block mb-1">标题</label>
            <input value={editTitle} onChange={(e) => setEditTitle(e.target.value)} className="cyber-input" placeholder="文章标题" />
          </div>
          <div>
            <label className="text-xs font-mono text-gray-500 block mb-1">日期</label>
            <input type="date" value={editDate} onChange={(e) => setEditDate(e.target.value)} className="cyber-input" />
          </div>
          <div>
            <label className="text-xs font-mono text-gray-500 block mb-1">分类</label>
            <select value={editCategory} onChange={(e) => setEditCategory(e.target.value)} className="cyber-input">
              <option>笔记</option>
              <option>模板</option>
              <option>题解</option>
              <option>专题</option>
              <option>其他</option>
            </select>
          </div>
          <div>
            <label className="text-xs font-mono text-gray-500 block mb-1">标签 (逗号分隔)</label>
            <input value={editTags} onChange={(e) => setEditTags(e.target.value)} className="cyber-input" placeholder="dp, 树形, 线段树" />
          </div>
        </div>

        <div className="cyber-card p-1">
          <textarea
            value={editContent}
            onChange={(e) => setEditContent(e.target.value)}
            className="w-full min-h-[60vh] p-4 bg-transparent font-mono text-sm resize-y focus:outline-none"
            placeholder="在这里写 Markdown 内容..."
          />
        </div>
        <p className="text-xs text-gray-400 font-mono mt-2">
          {"支持 Markdown 语法 | KaTeX 数学公式: $x^2$ 或 $$\\sum_{i=1}^n$$ | 文件: "}{editFile || "(新建)"}
        </p>
      </div>
    );
  }

  // List view
  return (
    <div className="max-w-5xl mx-auto px-4 py-8">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-display font-bold">
          <span className="neon-text">◈</span> 文章管理
        </h1>
        <button onClick={openNew} className="cyber-btn-green">
          + 新建文章
        </button>
      </div>

      <div className="relative mb-4">
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="搜索文章标题或标签..."
          className="cyber-input pl-4"
        />
      </div>

      {msg && (
        <div className="mb-4 p-3 rounded text-sm font-mono bg-green-50 text-green-700 dark:bg-green-900/20 dark:text-green-400 border border-green-200 dark:border-green-800">
          {msg}
        </div>
      )}

      <div className="text-xs font-mono text-gray-500 mb-3">
        共 {filteredPosts.length} 篇文章 | 文章目录: C:\Users\31802\Documents\ZuesHans.github.io\source\_posts
      </div>

      {loading ? (
        <div className="cyber-card p-8 text-center text-gray-500">加载中...</div>
      ) : (
        <div className="space-y-2">
          {filteredPosts.map((post) => (
            <div key={post.filename} className="cyber-card p-4 flex items-center gap-4 group">
              <span className="shrink-0 px-2 py-0.5 rounded text-xs font-mono border border-gray-200 dark:border-cyber-border text-gray-500 dark:text-gray-400">
                {post.category}
              </span>
              <div className="flex-1 min-w-0">
                <div className="font-mono text-sm font-medium truncate">{post.title}</div>
                <div className="flex items-center gap-3 text-xs text-gray-400 mt-0.5">
                  <span>{post.filename}</span>
                  <span>{post.date}</span>
                  <span>{post.tags.slice(0, 3).map((t) => `#${t}`).join(" ")}</span>
                  <span>{(post.size / 1024).toFixed(1)}KB</span>
                </div>
              </div>
              <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                <button onClick={() => openEditor(post.filename)} className="cyber-btn-blue text-xs px-3 py-1">
                  编辑
                </button>
                <button onClick={() => deletePost(post.filename)} className="text-xs px-3 py-1 rounded border border-red-300 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 transition-all">
                  删除
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {filteredPosts.length === 0 && !loading && (
        <div className="cyber-card p-8 text-center text-gray-500">
          {search ? "没有匹配的文章" : "暂无文章"}
        </div>
      )}
    </div>
  );
}
