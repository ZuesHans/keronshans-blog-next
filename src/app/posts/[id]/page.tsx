import { getPostById, getAllPosts } from "@/lib/posts";
import { notFound } from "next/navigation";
import Link from "next/link";
import MarkdownRenderer from "@/components/MarkdownRenderer";
import { getCategoryColorClass } from "@/lib/posts";
import PostInteraction from "./PostInteraction";

export const dynamic = "force-dynamic";

export async function generateStaticParams() {
  const posts = getAllPosts();
  return posts.map((post) => ({ id: post.id }));
}

export default async function PostPage({ params }: { params: { id: string } }) {
  const post = getPostById(params.id);
  if (!post) notFound();

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      {/* Back button */}
      <Link href="/posts" className="inline-flex items-center gap-2 text-sm font-mono text-gray-500 dark:text-gray-400 hover:text-neon-pink transition-colors mb-6">
        <span>←</span> 返回文章列表
      </Link>

      {/* Article Header */}
      <header className="mb-8">
        <div className="flex items-center gap-3 mb-3 flex-wrap">
          <span className={`px-2 py-0.5 rounded text-xs font-mono border ${getCategoryColorClass(post.category)}`}>
            {post.category}
          </span>
          {post.tags.map((tag) => (
            <span key={tag} className="text-xs font-mono text-gray-500 dark:text-gray-400">
              #{tag}
            </span>
          ))}
        </div>
        <h1 className="text-3xl sm:text-4xl font-display font-bold mb-3 neon-text">
          {post.title}
        </h1>
        <div className="flex items-center gap-4 text-sm font-mono text-gray-500 dark:text-gray-400">
          <span>{post.date}</span>
          <span className="w-1 h-1 rounded-full bg-neon-pink" />
          <span>Keronshans</span>
        </div>
        <div className="mt-4 h-[1px] bg-gradient-to-r from-neon-pink via-neon-blue to-transparent opacity-40" />
      </header>

      {/* Article Content */}
      <article className="relative">
        <div className="scanline-overlay absolute inset-0 rounded-lg z-10 pointer-events-none" />
        <div className="cyber-card p-6 sm:p-8">
          <MarkdownRenderer content={post.content} />
        </div>
      </article>

      {/* Comments & Likes */}
      <PostInteraction postId={params.id} />

      {/* Footer */}
      <footer className="mt-8 pt-6 border-t border-gray-200 dark:border-cyber-border">
        <Link href="/posts" className="cyber-btn inline-block">
          ← 返回列表
        </Link>
      </footer>
    </div>
  );
}
