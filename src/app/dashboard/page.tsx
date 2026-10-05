"use client";

import { useEffect, useMemo, useState } from "react";
import { getCsrfToken, restoreAuthenticatedPassword, setAdminPassword, setAuthenticated, verifyPassword } from "@/lib/auth";

type PostRow = {
  id: string; slug: string; title: string; date: string; tags: string[]; category: string;
  updated_at: string; legacy?: boolean;
};
type SnippetRow = {
  id: string; slug: string; title: string; language: string; tags: string | string[];
  updated_at: string; legacy?: boolean;
};
type Detail = { title: string; content?: string; code?: string; legacy?: boolean };
type PendingComment = { id: number; postId: string; nickname: string; content: string; revision: number; createdAt: string };

function parseTags(value: string | string[] | undefined): string[] {
  if (Array.isArray(value)) return value;
  if (!value) return [];
  try {
    const parsed = JSON.parse(value);
    return Array.isArray(parsed) ? parsed.map(String) : [];
  } catch { return []; }
}

export default function DashboardPage() {
  const [authed, setAuthed] = useState(false);
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState("");
  const [tab, setTab] = useState<"posts" | "snippets" | "comments">("posts");
  const [comments, setComments] = useState<PendingComment[]>([]);
  const [moderatingId, setModeratingId] = useState<number | null>(null);
  const [query, setQuery] = useState("");
  const [posts, setPosts] = useState<PostRow[]>([]);
  const [snippets, setSnippets] = useState<SnippetRow[]>([]);
  const [detail, setDetail] = useState<Detail | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    let cancelled = false;
    restoreAuthenticatedPassword().then((stored) => {
      if (!cancelled && stored) { setAdminPassword(stored); setAuthed(true); }
    });
    return () => { cancelled = true; };
  }, []);

  useEffect(() => {
    if (!authed) return;
    let cancelled = false;
    setLoading(true);
    Promise.all([
      fetch("/api/admin").then((response) => response.ok ? response.json() : []),
      fetch("/api/snippets").then((response) => response.ok ? response.json() : []),
      fetch("/api/comments?moderation=pending").then((response) => { if (!response.ok) throw new Error("Moderation unavailable"); return response.json(); }),
    ]).then(([postRows, snippetRows, pendingComments]) => {
      if (cancelled) return;
      setPosts(Array.isArray(postRows) ? postRows : []);
      setSnippets(Array.isArray(snippetRows) ? snippetRows : []);
      setComments(Array.isArray(pendingComments) ? pendingComments : []);
    }).catch(() => { if (!cancelled) setMessage("无法读取当前内容快照"); })
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, [authed]);

  const filteredPosts = useMemo(() => {
    const needle = query.trim().toLowerCase();
    return !needle ? posts : posts.filter((post) => [post.title, post.slug, post.category, ...post.tags].join(" ").toLowerCase().includes(needle));
  }, [posts, query]);
  const filteredSnippets = useMemo(() => {
    const needle = query.trim().toLowerCase();
    return !needle ? snippets : snippets.filter((snippet) => [snippet.title, snippet.slug, snippet.language, ...parseTags(snippet.tags)].join(" ").toLowerCase().includes(needle));
  }, [snippets, query]);

  async function login() {
    if (!(await verifyPassword(password))) { setMessage("密码错误"); return; }
    setAuthenticated(); setAdminPassword(password); setPassword(""); setMessage(""); setAuthed(true);
  }
  async function moderate(comment: PendingComment, status: "approved" | "rejected") {
    setModeratingId(comment.id);
    try {
      const response = await fetch("/api/comments", { method: "PUT", headers: { "Content-Type": "application/json", "X-CSRF-Token": getCsrfToken() }, body: JSON.stringify({ id: comment.id, revision: comment.revision, status }) });
      if (!response.ok) throw new Error(response.status === 409 ? "评论已变更，请刷新后重试" : "审核失败");
      setComments((rows) => rows.filter((row) => row.id !== comment.id));
    } catch (error) { setMessage(error instanceof Error ? error.message : "审核失败"); }
    finally { setModeratingId(null); }
  }
  async function openPost(post: PostRow) {
    const response = await fetch(`/api/admin/${encodeURIComponent(post.slug)}`);
    if (!response.ok) { setMessage("无法读取文章详情"); return; }
    setDetail(await response.json());
  }
  async function openSnippet(snippet: SnippetRow) {
    const response = await fetch(`/api/snippets?id=${encodeURIComponent(snippet.id)}`);
    if (!response.ok) { setMessage("无法读取模板详情"); return; }
    setDetail(await response.json());
  }

  if (!authed) return (
    <div className="app-page max-w-md py-20"><div className="cyber-card p-8 text-center">
      <h1 className="text-2xl font-display font-bold mb-2 neon-text">作者仪表盘</h1>
      <p className="text-sm text-gray-500 mb-6">查看已发布内容和发布状态</p>
      {process.env.NODE_ENV !== "production" ? <><input type="password" value={password} onChange={(event) => setPassword(event.target.value)} onKeyDown={(event) => event.key === "Enter" && login()} placeholder="输入密码..." className="cyber-input mb-4" autoFocus /><button onClick={login} className="cyber-btn w-full">登录</button></> : <p className="text-sm text-gray-500">后台访问暂未开放</p>}
      {message && <p className="text-red-500 text-sm mt-3">{message}</p>}
    </div></div>
  );

  return (
    <div className="app-page max-w-5xl">
      <div className="flex items-center gap-4 mb-6">
        <button onClick={() => { setTab("posts"); setQuery(""); }} className={tab === "posts" ? "text-lg font-display font-bold neon-text" : "text-lg font-display font-bold text-gray-400"}>文章审核</button>
        <button onClick={() => { setTab("snippets"); setQuery(""); }} className={tab === "snippets" ? "text-lg font-display font-bold neon-text-blue" : "text-lg font-display font-bold text-gray-400"}>模板审核</button>
        <button onClick={() => { setTab("comments"); setQuery(""); }} className={tab === "comments" ? "text-lg font-display font-bold neon-text" : "text-lg font-display font-bold text-gray-400"}>评论审核 ({comments.length})</button>
        <span className="ml-auto text-xs font-mono text-gray-500">只读内容快照</span>
      </div>
      {message && <div className="mb-4 p-3 rounded text-sm font-mono border border-yellow-300 text-yellow-700 bg-yellow-50 dark:bg-yellow-900/20 dark:text-yellow-400">{message}</div>}
      <div className="cyber-card p-4 mb-4"><p className="text-sm text-gray-600 dark:text-gray-300">公开正文由 Published Vault 和 publisher 管理。此页面只显示当前构建快照，修改必须生成明确的 content SHA 后走发布流程。</p></div>
      <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder={tab === "posts" ? "搜索标题、slug 或标签" : "搜索标题、slug、语言或标签"} className="cyber-input mb-4" />
      {loading ? <div className="cyber-card p-8 text-center text-gray-500">读取中...</div> : tab === "comments" ? <div className="space-y-2">{comments.map((comment) => <article key={comment.id} className="cyber-card p-4"><div className="text-xs text-gray-500">{comment.nickname} · {comment.postId} · {comment.createdAt}</div><p className="my-3 whitespace-pre-wrap break-words">{comment.content}</p><div className="flex gap-4"><button disabled={moderatingId !== null} onClick={() => moderate(comment, "approved")} className="cyber-btn-blue text-xs px-3 py-1">通过</button><button disabled={moderatingId !== null} onClick={() => moderate(comment, "rejected")} className="text-red-500 text-xs">拒绝</button></div></article>)}{comments.length === 0 && <p className="py-8 text-center text-gray-500">暂无待审核评论</p>}</div> : tab === "posts" ? (
        <div className="space-y-2">{filteredPosts.map((post) => (
          <div key={post.id} className="cyber-card p-4 flex items-center gap-4"><span className="shrink-0 px-2 py-0.5 rounded text-xs font-mono border border-gray-200 dark:border-cyber-border text-gray-500">{post.category}</span><div className="flex-1 min-w-0"><div className="font-mono text-sm font-medium truncate">{post.title}</div><div className="text-xs text-gray-400 mt-1">/posts/{post.slug} · {post.updated_at || post.date}{post.legacy ? " · legacy" : ""}</div></div><button onClick={() => openPost(post)} className="cyber-btn-blue text-xs px-3 py-1">查看</button></div>
        ))}{filteredPosts.length === 0 && <div className="cyber-card p-8 text-center text-gray-500">暂无匹配文章</div>}</div>
      ) : (
        <div className="space-y-2">{filteredSnippets.map((snippet) => (
          <div key={snippet.id} className="cyber-card p-4 flex items-center gap-4"><span className="shrink-0 px-2 py-0.5 rounded text-xs font-mono bg-neon-blue/10 text-neon-blue border border-neon-blue/30">{snippet.language}</span><div className="flex-1 min-w-0"><div className="font-mono text-sm font-medium truncate">{snippet.title}</div><div className="text-xs text-gray-400 mt-1">/templates/{snippet.slug} · {snippet.updated_at}{snippet.legacy ? " · legacy" : ""}</div></div><button onClick={() => openSnippet(snippet)} className="cyber-btn-blue text-xs px-3 py-1">查看</button></div>
        ))}{filteredSnippets.length === 0 && <div className="cyber-card p-8 text-center text-gray-500">暂无匹配模板</div>}</div>
      )}
      {detail && <div className="fixed inset-0 z-50 bg-black/50 p-4 flex items-center justify-center" onClick={() => setDetail(null)}><section className="bg-white dark:bg-cyber-surface border border-cyber-border rounded-lg p-5 max-w-4xl w-full max-h-[85vh] overflow-auto" onClick={(event) => event.stopPropagation()}><div className="flex items-center justify-between gap-4 mb-4"><h2 className="text-lg font-display font-bold">{detail.title}</h2><button onClick={() => setDetail(null)} className="text-gray-500" aria-label="关闭">×</button></div>{detail.legacy && <p className="text-xs text-yellow-600 mb-3">此条目仍是迁移期 legacy frontmatter，不能作为 schema v1 发布。</p>}<pre className="bg-gray-900 text-gray-200 rounded p-4 overflow-auto whitespace-pre-wrap text-sm">{detail.content || detail.code || ""}</pre></section></div>}
    </div>
  );
}
