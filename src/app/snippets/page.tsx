import { getAllSnippets } from "@/lib/snippets";
import SnippetsClient from "./SnippetsClient";

export default function SnippetsPage() {
  const snippets = getAllSnippets();

  // Collect all unique tags
  const tagMap = new Map<string, number>();
  snippets.forEach((s) => s.tags.forEach((t) => tagMap.set(t, (tagMap.get(t) || 0) + 1)));
  const allTags = Array.from(tagMap.entries()).sort((a, b) => b[1] - a[1]);

  // Collect all languages
  const langSet = new Set(snippets.map((s) => s.language));
  const languages = Array.from(langSet).sort();

  return (
    <SnippetsClient
      snippets={snippets.map((s) => ({
        id: s.id,
        title: s.title,
        language: s.language,
        tags: s.tags,
        createdAt: s.createdAt,
        updatedAt: s.updatedAt,
        description: s.description,
        filename: s.filename,
      }))}
      allTags={allTags}
      languages={languages}
    />
  );
}
