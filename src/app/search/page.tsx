import Link from "next/link";
import SearchMatchText from "@/components/SearchMatchText";
import {
  getAllPosts,
  getAllTags,
  getCategoryColorClass,
  getPostSearchDocuments,
  type PostMeta,
} from "@/lib/posts";
import { normalizeSearchQuery, searchDocuments, type SearchResult } from "@/lib/search";

export const dynamic = "force-dynamic";

function highlightedHref(url: string, query: string) {
  return `${url}?${new URLSearchParams({ highlight: query }).toString()}`;
}

function FullTextResult({ result, query }: { result: SearchResult; query: string }) {
  return (
    <Link href={highlightedHref(result.document.url, query)}>
      <article className="cyber-card p-5 group cursor-pointer">
        <div className="flex items-start gap-4">
          <div className="shrink-0">
            <span className={`category-chip ${getCategoryColorClass(result.document.category)}`}>
              {result.document.category}
            </span>
          </div>
          <div className="min-w-0 flex-1">
            <h2 className="mb-1 text-lg font-semibold transition-colors" style={{ color: "var(--owl-text)" }}>
              <SearchMatchText parts={result.titleParts} />
            </h2>
            {result.snippetParts.length > 0 && (
              <p className="search-page-snippet">
                {result.snippetHasLeadingEllipsis && "..."}
                <SearchMatchText parts={result.snippetParts} />
                {result.snippetHasTrailingEllipsis && "..."}
              </p>
            )}
            <div className="mt-2 flex flex-wrap gap-1.5 text-xs font-mono" style={{ color: "var(--owl-textMuted)" }}>
              {result.document.date && <span>{result.document.date}</span>}
              {result.document.tags.map((tag) => (
                <span key={tag}>#{tag}</span>
              ))}
            </div>
          </div>
        </div>
      </article>
    </Link>
  );
}

function PostResult({ post }: { post: PostMeta }) {
  return (
    <Link href={`/posts/${post.id}`}>
      <article className="cyber-card p-5 group cursor-pointer">
        <div className="flex items-start gap-4">
          <div className="shrink-0">
            <span className={`category-chip ${getCategoryColorClass(post.category)}`}>{post.category}</span>
          </div>
          <div className="min-w-0 flex-1">
            <h2 className="mb-1 text-lg font-semibold transition-colors" style={{ color: "var(--owl-text)" }}>
              {post.title}
            </h2>
            <div className="mt-2 flex flex-wrap gap-1.5 text-xs font-mono" style={{ color: "var(--owl-textMuted)" }}>
              <span>{post.date}</span>
              {post.tags.map((tag) => (
                <span key={tag}>#{tag}</span>
              ))}
            </div>
          </div>
        </div>
      </article>
    </Link>
  );
}

export default async function SearchPage({ searchParams }: { searchParams: Promise<{ q?: string; tag?: string }> }) {
  const params = await searchParams;
  const query = normalizeSearchQuery(params.q || "");
  const tag = String(params.tag || "").trim();
  const [allPosts, documents] = await Promise.all([
    getAllPosts(),
    query && !tag ? getPostSearchDocuments() : Promise.resolve([]),
  ]);
  const allTags = getAllTags();
  const fullTextResults = query && !tag ? searchDocuments(documents, query) : [];
  const filteredPosts = tag ? allPosts.filter((post) => post.tags.includes(tag)) : query ? [] : allPosts;
  const resultCount = query && !tag ? fullTextResults.length : filteredPosts.length;

  return (
    <div className="app-page">
      <div className="app-page-header">
        <div className="page-kicker mb-3">Search</div>
        <h1 className="page-heading mb-2">搜索</h1>
        <p className="text-sm" style={{ color: "var(--owl-textSecondary)" }}>
          {tag ? `标签：#${tag}` : query ? `关键词：“${query}”` : "全部文章"}，找到 {resultCount} 个结果
        </p>
      </div>

      <div className="grid gap-4">
        {resultCount === 0 ? (
          <div className="cyber-card p-8 text-center">
            <div className="text-4xl mb-4">∅</div>
            <p className="text-gray-500 dark:text-gray-400 font-mono">未找到匹配的内容</p>
          </div>
        ) : query && !tag ? (
          fullTextResults.map((result) => (
            <FullTextResult key={result.document.id} result={result} query={query} />
          ))
        ) : (
          filteredPosts.map((post) => <PostResult key={post.id} post={post} />)
        )}
      </div>

      <div className="mt-8 cyber-card p-6">
        <h3 className="font-display font-semibold mb-3">热门标签</h3>
        <div className="flex flex-wrap gap-2">
          {allTags.slice(0, 20).map(({ tag: itemTag, count }) => (
            <Link
              key={itemTag}
              href={`/search?tag=${encodeURIComponent(itemTag)}`}
              className="tag-pill text-sm"
            >
              #{itemTag} ({count})
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
