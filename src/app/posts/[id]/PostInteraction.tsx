"use client";

import { useState, useEffect, useCallback } from "react";

interface Comment {
  id: number;
  post_id: string;
  nickname: string;
  content: string;
  created_at: string;
}

export default function PostInteraction({ postId }: { postId: string }) {
  const [comments, setComments] = useState<Comment[]>([]);
  const [likes, setLikes] = useState(0);
  const [liked, setLiked] = useState(false);
  const [nickname, setNickname] = useState("");
  const [commentContent, setCommentContent] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [loaded, setLoaded] = useState(false);

  const fetchComments = useCallback(async () => {
    try {
      const res = await fetch(`/api/comments?postId=${postId}`);
      const data = await res.json();
      if (Array.isArray(data)) setComments(data);
    } catch {}
  }, [postId]);

  const fetchLikes = useCallback(async () => {
    try {
      const res = await fetch(`/api/likes?postId=${postId}`);
      const data = await res.json();
      setLikes(data.likes || 0);
      // Check if already liked via localStorage
      const likedPosts = JSON.parse(localStorage.getItem("keronshans_liked_posts") || "[]");
      if (likedPosts.includes(postId)) setLiked(true);
    } catch {}
  }, [postId]);

  useEffect(() => {
    Promise.all([fetchComments(), fetchLikes()]).finally(() => setLoaded(true));
  }, [fetchComments, fetchLikes]);

  const handleLike = async () => {
    if (liked) return;
    try {
      const res = await fetch("/api/likes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ postId, ip: "local" }),
      });
      if (res.ok) {
        setLiked(true);
        setLikes((l) => l + 1);
        const likedPosts = JSON.parse(localStorage.getItem("keronshans_liked_posts") || "[]");
        likedPosts.push(postId);
        localStorage.setItem("keronshans_liked_posts", JSON.stringify(likedPosts));
      }
    } catch {}
  };

  const handleComment = async () => {
    if (!commentContent.trim() || submitting) return;
    setSubmitting(true);
    try {
      const res = await fetch("/api/comments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ postId, nickname: nickname || "匿名", content: commentContent.trim() }),
      });
      if (res.ok) {
        setCommentContent("");
        await fetchComments();
      }
    } catch {} finally {
      setSubmitting(false);
    }
  };

  const formatTime = (dateStr: string) => {
    try {
      return new Date(dateStr).toLocaleString("zh-CN", {
        month: "2-digit", day: "2-digit", hour: "2-digit", minute: "2-digit",
      });
    } catch {
      return dateStr;
    }
  };

  if (!loaded) {
    return (
      <div className="mt-8 animate-pulse">
        <div className="h-20 bg-gray-200 dark:bg-cyber-surface rounded" />
      </div>
    );
  }

  return (
    <div className="mt-8 space-y-6">
      {/* Like Button */}
      <div className="flex items-center gap-4">
        <button
          onClick={handleLike}
          disabled={liked}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg font-mono text-sm transition-all border ${
            liked
              ? "bg-pink-500/10 border-pink-500/30 text-pink-500 cursor-default"
              : "bg-gray-50 dark:bg-cyber-surface border-gray-200 dark:border-cyber-border hover:border-neon-pink hover:text-neon-pink text-gray-500"
          }`}
        >
          {liked ? "♥" : "♡"} {likes}
        </button>
        <span className="text-sm font-mono text-gray-400">
          {comments.length} 条评论
        </span>
      </div>

      {/* Comment Form */}
      <div className="cyber-card p-5">
        <div className="flex gap-3 mb-3">
          <input
            type="text"
            value={nickname}
            onChange={(e) => setNickname(e.target.value)}
            placeholder="昵称（可选）"
            maxLength={20}
            className="cyber-input w-32"
          />
        </div>
        <div className="flex gap-3">
          <input
            type="text"
            value={commentContent}
            onChange={(e) => setCommentContent(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleComment()}
            placeholder="写下你的评论..."
            maxLength={500}
            className="cyber-input flex-1"
          />
          <button
            onClick={handleComment}
            disabled={!commentContent.trim() || submitting}
            className="cyber-btn-pink disabled:opacity-30 disabled:cursor-not-allowed"
          >
            {submitting ? "..." : "发送"}
          </button>
        </div>
      </div>

      {/* Comments List */}
      <div className="space-y-3">
        {comments.length === 0 ? (
          <p className="text-center text-gray-400 font-mono text-sm py-4">
            暂无评论，来写第一条吧
          </p>
        ) : (
          comments.map((comment) => (
            <div key={comment.id} className="cyber-card p-4">
              <div className="flex items-center gap-2 mb-2">
                <span className="text-sm font-mono font-bold text-neon-blue">
                  {comment.nickname}
                </span>
                <span className="text-xs font-mono text-gray-400">
                  {formatTime(comment.created_at)}
                </span>
              </div>
              <p className="text-sm text-gray-700 dark:text-gray-300 whitespace-pre-wrap">
                {comment.content}
              </p>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
