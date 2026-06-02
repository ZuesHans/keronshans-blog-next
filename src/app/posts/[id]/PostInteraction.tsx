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
  const [error, setError] = useState("");
  const [deletingId, setDeletingId] = useState<number | null>(null);
  const [showAdminPanel, setShowAdminPanel] = useState(false);
  const [adminPassword, setAdminPassword] = useState("");
  const [isAdmin, setIsAdmin] = useState(false);
  const [likeError, setLikeError] = useState("");

  const fetchComments = useCallback(async () => {
    try {
      const res = await fetch(`/api/comments?postId=${postId}`);
      if (!res.ok) {
        return;
      }
      const data = await res.json();
      if (Array.isArray(data)) setComments(data);
    } catch {}
  }, [postId]);

  const fetchLikes = useCallback(async () => {
    try {
      const res = await fetch(`/api/likes?postId=${postId}`);
      if (!res.ok) return;
      const data = await res.json();
      setLikes(data.likes || 0);
      const likedPosts = JSON.parse(localStorage.getItem("keronshans_liked_posts") || "[]");
      if (likedPosts.includes(postId)) setLiked(true);
    } catch {}
  }, [postId]);

  useEffect(() => {
    Promise.all([fetchComments(), fetchLikes()]).finally(() => setLoaded(true));
  }, [fetchComments, fetchLikes]);

  const handleLike = async () => {
    if (liked) return;
    setLikeError("");
    try {
      const res = await fetch("/api/likes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ postId }),
      });
      if (res.ok) {
        setLiked(true);
        setLikes((l) => l + 1);
        const likedPosts = JSON.parse(localStorage.getItem("keronshans_liked_posts") || "[]");
        likedPosts.push(postId);
        localStorage.setItem("keronshans_liked_posts", JSON.stringify(likedPosts));
      } else if (res.status === 409) {
        setLikeError("You already liked this post");
        setLiked(true);
      } else {
        setLikeError("Failed to like");
      }
    } catch {
      setLikeError("Network error");
    }
  };

  const handleComment = async () => {
    if (!commentContent.trim() || submitting) return;
    setError("");
    setSubmitting(true);
    try {
      const res = await fetch("/api/comments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          postId,
          nickname: nickname || "",
          content: commentContent.trim(),
        }),
      });
      if (res.ok) {
        setCommentContent("");
        await fetchComments();
      } else {
        const data = await res.json().catch(() => ({}));
        setError(data.error || "Failed to post comment");
      }
    } catch {
      setError("Network error");
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteComment = async (commentId: number) => {
    setDeletingId(commentId);
    try {
      const res = await fetch(`/api/comments?id=${commentId}`, {
        method: "DELETE",
        headers: { "x-admin-password": adminPassword },
      });
      if (res.ok) {
        setComments((prev) => prev.filter((c) => c.id !== commentId));
      } else {
        setError("Failed to delete comment");
      }
    } catch {
      setError("Network error");
    } finally {
      setDeletingId(null);
    }
  };

  const handleAdminLogin = () => {
    if (adminPassword === "zues1") {
      setIsAdmin(true);
      setShowAdminPanel(false);
    } else {
      setError("Wrong password");
    }
  };

  const formatTime = (dateStr: string) => {
    try {
      return new Date(dateStr).toLocaleString("zh-CN", {
        month: "2-digit",
        day: "2-digit",
        hour: "2-digit",
        minute: "2-digit",
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
      {/* Like Section */}
      <div className="flex items-center gap-4">
        <button
          onClick={handleLike}
          disabled={liked}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg font-mono text-sm transition-all border ${
            liked
              ? "cursor-default"
              : "cursor-pointer"
          }`}
          style={liked ? {
            background: "color-mix(in srgb, var(--neon-pink) 12%, var(--owl-bgCard))",
            borderColor: "color-mix(in srgb, var(--neon-pink) 35%, var(--owl-border))",
            color: "var(--neon-pink)",
          } : {
            background: "var(--owl-bgCard)",
            borderColor: "var(--owl-border)",
            color: "var(--owl-textMuted)",
          }}
        >
          {liked ? "\u2665" : "\u2661"} {likes}
        </button>
        <span className="text-sm font-mono" style={{ color: "var(--owl-textMuted)" }}>
          {comments.length} 条评论
        </span>
        {likeError && (
          <span className="text-xs font-mono text-red-400">{likeError}</span>
        )}
      </div>

      {/* Error Message */}
      {error && (
        <div className="flex items-center justify-between rounded-lg border border-red-500/30 bg-red-500/5 px-4 py-2">
          <span className="text-sm font-mono text-red-400">{error}</span>
          <button onClick={() => setError("")} className="text-red-400 hover:text-red-300 text-xs ml-2">
            DISMISS
          </button>
        </div>
      )}

      {/* Comment Form */}
      <div className="cyber-card p-5">
        <div className="flex flex-col sm:flex-row gap-3 mb-3">
          <input
            type="text"
            value={nickname}
            onChange={(e) => setNickname(e.target.value)}
            placeholder="Nickname (optional)"
            maxLength={20}
            className="cyber-input w-full sm:w-40"
          />
        </div>
        <div className="flex gap-3">
          <input
            type="text"
            value={commentContent}
            onChange={(e) => setCommentContent(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && !e.shiftKey && handleComment()}
            placeholder="Write a comment..."
            maxLength={500}
            className="cyber-input flex-1"
          />
          <button
            onClick={handleComment}
            disabled={!commentContent.trim() || submitting}
            className="px-4 py-2 rounded-lg font-mono text-sm border border-neon-pink bg-neon-pink/10 text-neon-pink hover:bg-neon-pink/20 transition-all disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer"
          >
            {submitting ? "..." : "发送"}
          </button>
        </div>
        {commentContent.length > 400 && (
          <p className="text-xs font-mono text-gray-400 mt-1 text-right">
            {commentContent.length}/500
          </p>
        )}
      </div>

      {/* Admin Login (small link) */}
      {!isAdmin && (
        <div className="flex justify-end">
          <button
            onClick={() => setShowAdminPanel(!showAdminPanel)}
            className="text-xs font-mono text-gray-500 hover:text-neon-pink transition-colors cursor-pointer"
          >
            {showAdminPanel ? "取消" : "管理"}
          </button>
        </div>
      )}

      {/* Admin Panel */}
      {showAdminPanel && !isAdmin && (
        <div className="cyber-card p-4">
          <div className="flex gap-3 items-center">
            <input
              type="password"
              value={adminPassword}
              onChange={(e) => setAdminPassword(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleAdminLogin()}
              placeholder="Admin password"
              className="cyber-input flex-1"
            />
            <button
              onClick={handleAdminLogin}
              className="cyber-btn text-xs px-3 py-2 cursor-pointer"
            >
              登录
            </button>
          </div>
        </div>
      )}

      {/* Comments List */}
      <div className="space-y-3">
        {comments.length === 0 ? (
          <p className="text-center text-gray-400 font-mono text-sm py-4">
            暂时还没有评论。
          </p>
        ) : (
          comments.map((comment) => (
            <div key={comment.id} className="cyber-card p-4 relative group">
              <div className="flex items-center gap-2 mb-2">
                <span className="text-sm font-mono font-bold text-neon-blue">
                  {comment.nickname || "Anonymous"}
                </span>
                <span className="text-xs font-mono text-gray-400">
                  {formatTime(comment.created_at)}
                </span>
                {/* Admin delete button */}
                {isAdmin && (
                  <button
                    onClick={() => {
                      if (confirm("Delete this comment?")) handleDeleteComment(comment.id);
                    }}
                    disabled={deletingId === comment.id}
                    className="ml-auto text-xs font-mono text-gray-400 hover:text-red-400 transition-colors opacity-0 group-hover:opacity-100 cursor-pointer disabled:opacity-50"
                  >
                    {deletingId === comment.id ? "..." : "DELETE"}
                  </button>
                )}
              </div>
              <p className="text-sm text-gray-700 dark:text-gray-300 whitespace-pre-wrap break-words">
                {comment.content}
              </p>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
