"use client";

import { useState, useEffect } from "react";
import { getAdminPassword, setAdminPassword } from "@/lib/auth";

interface Talk {
  id: number;
  nickname: string;
  content: string;
  mood: string;
  created_at: string;
}

const MOODS = [
  { emoji: "😄", label: "开心" },
  { emoji: "😤", label: "生气" },
  { emoji: "🤔", label: "思考" },
  { emoji: "😴", label: "困倦" },
  { emoji: "🔥", label: "兴奋" },
  { emoji: "💔", label: "悲伤" },
  { emoji: "🤯", label: "震惊" },
  { emoji: "😎", label: "酷" },
  { emoji: "🙃", label: "无语" },
  { emoji: "😇", label: "飞升" },
  { emoji: "😅", label: "没招" },
  { emoji: "😋", label: "嘿嘿" },
  { emoji: "🥲", label: "伤心心" },
  { emoji: "🤡", label: "joker" },
];

const AUTH_KEY = "keronshans_auth";

export default function TalksPage() {
  const [talks, setTalks] = useState<Talk[]>([]);
  const [content, setContent] = useState("");
  const [mood, setMood] = useState("😄");
  const [isAuth, setIsAuth] = useState(false);
  const [password, setPassword] = useState("");
  const [adminPassword, setAdminPasswordState] = useState("");
  const [error, setError] = useState("");
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    fetch("/api/talks")
      .then((r) => r.json())
      .then((data) => {
        if (Array.isArray(data)) setTalks(data);
        setLoaded(true);
      })
      .catch(() => setLoaded(true));

    if (sessionStorage.getItem(AUTH_KEY) === "true") {
      setIsAuth(true);
      setAdminPasswordState(getAdminPassword());
    }
  }, []);

  const handleLogin = () => {
    if (password.trim()) {
      setIsAuth(true);
      sessionStorage.setItem(AUTH_KEY, "true");
      setAdminPassword(password);
      setAdminPasswordState(password);
      setError("");
      setPassword("");
    } else {
      setError("密码错误，拒绝访问");
    }
  };

  const handlePublish = async () => {
    if (!content.trim()) return;
    try {
      const res = await fetch("/api/talks", {
        method: "POST",
        headers: { "Content-Type": "application/json", "x-admin-password": adminPassword },
        body: JSON.stringify({ content: content.trim(), mood }),
      });
      if (res.ok) {
        const data = await fetch("/api/talks").then((r) => r.json());
        if (Array.isArray(data)) setTalks(data);
        setContent("");
        setMood("😄");
      }
    } catch {
      setError("发布失败");
    }
  };

  const handleDelete = async (id: number) => {
    try {
      const res = await fetch(`/api/talks?id=${id}`, {
        method: "DELETE",
        headers: { "x-admin-password": adminPassword },
      });
      if (res.ok) {
        setTalks(talks.filter((t) => t.id !== id));
      }
    } catch {}
  };

  const formatTime = (dateStr: string) => {
    try {
      return new Date(dateStr).toLocaleString("zh-CN", {
        year: "numeric", month: "2-digit", day: "2-digit",
        hour: "2-digit", minute: "2-digit",
      });
    } catch {
      return dateStr;
    }
  };

  if (!loaded) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-8">
        <div className="animate-pulse space-y-4">
          <div className="h-10 bg-gray-200 dark:bg-cyber-surface rounded w-48" />
          <div className="h-24 bg-gray-200 dark:bg-cyber-surface rounded" />
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-4xl font-display font-bold mb-2">
          <span className="neon-text-green">◇</span> 说说
        </h1>
        <p className="text-gray-500 dark:text-gray-400 font-mono text-sm">
          &gt; Keronshans 的碎碎念 | {talks.length} 条说说
        </p>
        <div className="mt-2 h-[1px] bg-gradient-to-r from-neon-green via-neon-blue to-neon-pink opacity-50" />
      </div>

      {/* Auth / Publish */}
      <div className="cyber-card neon-border-green p-5 mb-6">
        {!isAuth ? (
          <div className="space-y-3">
            <p className="text-sm font-mono text-gray-500 dark:text-gray-400">
              &gt; 需要密码才能发表说说
            </p>
            <div className="flex gap-2">
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleLogin()}
                placeholder="输入访问密码..."
                className="cyber-input flex-1"
              />
              <button onClick={handleLogin} className="cyber-btn-green">
                验证身份
              </button>
            </div>
            {error && <p className="text-sm text-red-500 font-mono">{error}</p>}
          </div>
        ) : (
          <div className="space-y-3">
            <div className="flex items-center gap-2 mb-2">
              <span className="text-sm font-mono text-neon-green">心情:</span>
              <div className="flex gap-1">
                {MOODS.map((m) => (
                  <button
                    key={m.emoji}
                    onClick={() => setMood(m.emoji)}
                    className={`w-8 h-8 rounded text-lg flex items-center justify-center transition-all ${mood === m.emoji
                      ? "bg-neon-green/20 border border-neon-green/50 scale-110"
                      : "hover:bg-gray-100 dark:hover:bg-cyber-surface"
                      }`}
                    title={m.label}
                  >
                    {m.emoji}
                  </button>
                ))}
              </div>
            </div>
            <textarea
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="说点什么吧..."
              rows={3}
              className="cyber-input resize-none"
            />
            <div className="flex justify-between items-center">
              <span className="text-xs font-mono text-gray-400">{content.length}/500</span>
              <button
                onClick={handlePublish}
                disabled={!content.trim() || content.length > 500}
                className="cyber-btn-green disabled:opacity-30 disabled:cursor-not-allowed"
              >
                发布说说
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Talks List */}
      <div className="space-y-4">
        {talks.length === 0 ? (
          <div className="cyber-card p-8 text-center">
            <div className="text-4xl mb-4">Listening...</div>
            <p className="text-gray-500 dark:text-gray-400 font-mono">还没有说说，说点什么吧</p>
          </div>
        ) : (
          talks.map((talk, index) => (
            <div key={talk.id} className="cyber-card p-5 group">
              <div className="flex items-start gap-3">
                <div className="shrink-0 w-10 h-10 rounded-full bg-gradient-to-br from-neon-green to-neon-blue flex items-center justify-center text-xl">
                  {talk.mood || "😄"}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-sm text-gray-500 dark:text-gray-400 font-mono mb-2">
                    <span className="text-neon-green">#{talks.length - index}</span>
                    {" · "}
                    {formatTime(talk.created_at)}
                  </div>
                  <p className="text-gray-800 dark:text-gray-200 whitespace-pre-wrap leading-relaxed">
                    {talk.content}
                  </p>
                </div>
                {isAuth && (
                  <button
                    onClick={() => handleDelete(talk.id)}
                    className="shrink-0 opacity-0 group-hover:opacity-100 text-gray-400 hover:text-red-500 transition-all text-sm p-1"
                    title="删除"
                  >
                    ✕
                  </button>
                )}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
