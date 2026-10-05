import Link from "next/link";
import { notFound, permanentRedirect } from "next/navigation";
import { getAllSnippets, getSnippetByFilename } from "@/lib/snippets";

export const dynamic = "force-static";
export const dynamicParams = true;

export function generateStaticParams() {
  return getAllSnippets().map((snippet) => ({ slug: snippet.slug }));
}

export default async function TemplatePage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const snippet = getSnippetByFilename(slug);
  if (!snippet) notFound();
  if (snippet.slug !== slug) permanentRedirect(`/templates/${snippet.slug}`);
  return (
    <div className="app-page max-w-5xl">
      <Link href="/templates" className="text-sm text-neon-blue">← 返回模板</Link>
      <header className="mt-5 mb-6">
        <p className="text-xs font-mono text-gray-500">{snippet.language} · {snippet.updatedAt || "未标注更新时间"}</p>
        <h1 className="text-3xl font-display font-bold mt-2">{snippet.title}</h1>
        {snippet.description && <p className="text-gray-500 mt-2">{snippet.description}</p>}
      </header>
      <pre className="bg-gray-900 text-gray-200 rounded-lg p-5 overflow-auto whitespace-pre-wrap text-sm"><code>{snippet.code}</code></pre>
    </div>
  );
}
