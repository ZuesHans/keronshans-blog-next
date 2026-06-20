import { getAllPosts, getCategoryColorClass, getPostById } from "@/lib/posts";
import { notFound } from "next/navigation";
import Link from "next/link";
import MarkdownRenderer from "@/components/MarkdownRenderer";
import PostInteraction from "./PostInteraction";
import TableOfContents from "@/components/TableOfContents";

export async function generateStaticParams() {
  const posts = await getAllPosts();
  return posts.map((post) => ({ id: post.id }));
}

function estimateReadingTime(content: string): number {
  const chineseChars = (content.match(/[\u4e00-\u9fff]/g) || []).length;
  const words = content.replace(/[\u4e00-\u9fff]/g, " ").trim().split(/\s+/).filter(Boolean).length;
  return Math.max(1, Math.ceil((chineseChars + words) / 450));
}

export default async function PostPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const post = await getPostById(id);
  if (!post) notFound();

  const readingTime = estimateReadingTime(post.content);

  return (
    <div className="article-shell max-w-6xl mx-auto px-5 sm:px-6 py-10 sm:py-14">
      <Link href="/posts" className="article-back-link">
        <span aria-hidden="true">←</span>
        返回文章库
      </Link>

      <div className="article-layout">
        <main className="min-w-0">
          <header className="article-header">
            <h1 className="article-title">{post.title}</h1>
            <div className="article-meta">
              <span>{post.date || "未标日期"}</span>
              <span className="meta-dot" />
              <span>{readingTime} 分钟阅读</span>
              <span className="meta-dot" />
              <span>Keronshans</span>
            </div>
            <div className="article-taxonomy">
              <Link href={`/posts?category=${encodeURIComponent(post.category)}`}>{post.category}</Link>
              {post.tags.map((tag) => (
                <Link key={tag} href={`/search?tag=${encodeURIComponent(tag)}`}>
                  #{tag}
                </Link>
              ))}
            </div>
          </header>

          <article className="reader-card">
            <MarkdownRenderer content={post.content} />
          </article>

          <PostInteraction postId={id} />

          <footer className="mt-8 pt-6" style={{ borderTop: "1px solid var(--owl-border)" }}>
            <Link href="/posts" className="cyber-btn inline-flex items-center gap-2">
              <span aria-hidden="true">←</span>
              返回文章库
            </Link>
          </footer>
        </main>

        <aside className="hidden xl:block sticky top-24">
          <TableOfContents />
        </aside>
      </div>
    </div>
  );
}
