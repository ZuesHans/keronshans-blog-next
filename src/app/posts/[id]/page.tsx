import { getAllPosts, getPostById } from "@/lib/posts";
import { notFound, permanentRedirect } from "next/navigation";
import { Link } from "next-view-transitions";
import MarkdownRenderer from "@/components/MarkdownRenderer";
import PostInteraction from "./PostInteraction";
import TableOfContents from "@/components/TableOfContents";
import SearchHighlight from "@/components/SearchHighlight";
import type { Metadata } from "next";

// Posts are shipped as static pages so an unavailable D1 record cannot make an
// already-published article return a 404 at runtime.
export const dynamic = "force-static";
// Legacy ID aliases redirect to the current slug; new content is part of the
// immutable published snapshot.
export const dynamicParams = true;

export async function generateStaticParams() {
  const posts = await getAllPosts();
  return posts.map((post) => ({ id: post.slug }));
}

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }): Promise<Metadata> {
  const { id } = await params;
  const post = await getPostById(id);
  if (!post) return { title: "文章不存在 | Keronshans" };
  const description = post.excerpt || `${post.title}，Keronshans 的公开笔记。`;
  const canonical = `/posts/${post.slug}`;
  return {
    title: `${post.title} | Keronshans`,
    description,
    alternates: { canonical },
    openGraph: { title: post.title, description, type: "article", publishedTime: post.date || undefined, url: canonical },
  };
}

function estimateReadingTime(content: string): number {
  const chineseChars = (content.match(/[\u4e00-\u9fff]/g) || []).length;
  const words = content.replace(/[\u4e00-\u9fff]/g, " ").trim().split(/\s+/).filter(Boolean).length;
  return Math.max(1, Math.ceil((chineseChars + words) / 450));
}

export default async function PostPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const post = await getPostById(id);
  if (!post) notFound();
  if (post.slug !== id) permanentRedirect(`/posts/${post.slug}`);

  const readingTime = estimateReadingTime(post.content);

  return (
    <div className="article-page -mt-16">
      <header className="article-cover">
        <div className="article-cover-shade" aria-hidden="true" />
        <div className="site-shell article-cover-content">
          <Link href="/posts" className="article-back-link"><span aria-hidden="true">←</span>返回文章</Link>
          <p>{post.category}</p>
          <h1 className="article-title">{post.title}</h1>
          <div className="article-meta">
            <span>{post.date || "未标日期"}</span>
            <span className="meta-dot" />
            <span>{readingTime} 分钟阅读</span>
            <span className="meta-dot" />
            <span>Keronshans</span>
          </div>
        </div>
      </header>

      <div className="site-shell article-shell">
        <div className="article-layout">
          <div className="article-main-column">
            <div className="article-taxonomy">
              <Link href={`/posts?category=${encodeURIComponent(post.category)}`}>{post.category}</Link>
              {post.tags.map((tag) => (
                <Link key={tag} href={`/search?tag=${encodeURIComponent(tag)}`}>#{tag}</Link>
              ))}
            </div>

            <article className="reader-card">
              <MarkdownRenderer content={post.content} />
              <SearchHighlight />
            </article>

            <PostInteraction postId={post.id} />

            <footer className="article-end-links">
              <Link href="/posts"><span aria-hidden="true">←</span>返回文章列表</Link>
              <a href="#"><span>回到顶部</span><span aria-hidden="true">↑</span></a>
            </footer>
          </div>

          <aside className="article-toc-column">
            <TableOfContents />
          </aside>
        </div>
      </div>
    </div>
  );
}
