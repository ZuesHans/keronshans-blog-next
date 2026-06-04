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
    <div className="max-w-7xl mx-auto px-5 sm:px-6 py-10">
      <Link href="/posts" className="inline-flex items-center gap-2 text-sm transition-colors mb-8" style={{ color: "var(--owl-textMuted)" }}>
        <span aria-hidden="true">←</span>
        返回文章库
      </Link>

      <div className="grid gap-8 xl:grid-cols-[minmax(0,1fr)_280px] xl:items-start">
        <main className="min-w-0 max-w-4xl">
          <header className="mb-8">
            <div className="flex items-center gap-2 mb-4 flex-wrap">
              <span className={`category-chip ${getCategoryColorClass(post.category)}`}>{post.category}</span>
              {post.tags.map((tag) => (
                <Link key={tag} href={`/search?tag=${encodeURIComponent(tag)}`} className="tag-pill">
                  #{tag}
                </Link>
              ))}
            </div>
            <h1 className="page-heading mb-4">{post.title}</h1>
            <div className="flex items-center gap-3 text-sm flex-wrap" style={{ color: "var(--owl-textMuted)" }}>
              <span>{post.date || "未标日期"}</span>
              <span className="meta-dot" />
              <span>{readingTime} 分钟阅读</span>
              <span className="meta-dot" />
              <span>Keronshans</span>
            </div>
            <div className="soft-divider" />
          </header>

          <div className="xl:hidden mb-6">
            <TableOfContents />
          </div>

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

        <aside className="hidden xl:block sticky top-24 space-y-4">
          <div className="article-side-card">
            <div className="text-xs font-semibold tracking-widest uppercase mb-3" style={{ color: "var(--owl-textMuted)" }}>
              当前文章
            </div>
            <div className="text-sm font-medium mb-2" style={{ color: "var(--owl-text)" }}>{post.title}</div>
            <div className="text-xs leading-5" style={{ color: "var(--owl-textMuted)" }}>
              {post.category} · {readingTime} 分钟
            </div>
          </div>
          <TableOfContents />
        </aside>
      </div>
    </div>
  );
}
