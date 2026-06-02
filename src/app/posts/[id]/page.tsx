import { getPostById, getAllPosts } from "@/lib/posts";
import { notFound } from "next/navigation";
import Link from "next/link";
import MarkdownRenderer from "@/components/MarkdownRenderer";
import { getCategoryColorClass } from "@/lib/posts";
import PostInteraction from "./PostInteraction";
import TableOfContents from "@/components/TableOfContents";

export async function generateStaticParams() {
  const posts = await getAllPosts();
  return posts.map((post) => ({ id: post.id }));
}

export default async function PostPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const post = await getPostById(id);
  if (!post) notFound();

  return (
    <div className="max-w-4xl mx-auto px-4 py-10">
      {/* Back button */}
      <Link href="/posts" className="inline-flex items-center gap-2 text-sm font-mono transition-colors mb-8" style={{ color: "var(--owl-textMuted)" }}>
        <span>←</span> 返回文章列表
      </Link>

      {/* Article Header */}
      <header className="mb-8">
        <div className="flex items-center gap-3 mb-3 flex-wrap">
          <span className={`category-chip ${getCategoryColorClass(post.category)}`}>
            {post.category}
          </span>
          {post.tags.map((tag) => (
            <span key={tag} className="tag-pill">
              #{tag}
            </span>
          ))}
        </div>
        <h1 className="page-heading mb-4">
          {post.title}
        </h1>
        <div className="flex items-center gap-4 text-sm font-mono" style={{ color: "var(--owl-textMuted)" }}>
          <span>{post.date}</span>
          <span className="w-1 h-1 rounded-full" style={{ background: "var(--owl-textMuted)" }} />
          <span>Keronshans</span>
        </div>
        <div className="soft-divider" />
      </header>

      {/* Article Content */}
      <article className="relative">
        <div className="cyber-card p-6 sm:p-8">
          <MarkdownRenderer content={post.content} />
        </div>
      </article>

      {/* Table of Contents */}
      <TableOfContents />

      {/* Comments & Likes */}
      <PostInteraction postId={id} />

      {/* Footer */}
      <footer className="mt-8 pt-6" style={{ borderTop: "1px solid var(--owl-border)" }}>
        <Link href="/posts" className="cyber-btn inline-block">
          ← 返回列表
        </Link>
      </footer>
    </div>
  );
}
