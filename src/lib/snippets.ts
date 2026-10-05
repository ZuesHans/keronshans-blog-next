import fs from "fs";
import path from "path";
import matter from "gray-matter";
import { SNIPPETS_DIR } from "./contentRoot";
import { getSnapshotFiles, hasGeneratedContentSnapshot } from "./contentSnapshot";
import { readContentRegistry } from "./contentRegistry";

export interface SnippetMeta {
  schemaVersion: 1;
  kind: "snippet";
  status: "ready";
  slug: string;
  legacy: false;
  filename: string;
  id: string;
  title: string;
  language: string;
  tags: string[];
  createdAt: string;
  updatedAt: string;
  description: string;
}
export interface SnippetData extends SnippetMeta { code: string }

function localFiles(directory = SNIPPETS_DIR, root = SNIPPETS_DIR): { path: string; content: string }[] {
  if (!fs.existsSync(directory)) return [];
  return fs.readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
    const absolute = path.join(directory, entry.name);
    if (entry.isSymbolicLink()) throw new Error("Content must not contain symbolic links");
    if (entry.isDirectory()) return localFiles(absolute, root);
    return entry.isFile() && entry.name.endsWith(".md")
      ? [{ path: path.relative(root, absolute).replaceAll(path.sep, "/"), content: fs.readFileSync(absolute, "utf8") }]
      : [];
  });
}

function readSnippets(): SnippetData[] {
  const files = hasGeneratedContentSnapshot() ? getSnapshotFiles("snippets") : localFiles();
  return files.flatMap((file): SnippetData[] => {
    const { data, content } = matter(file.content);
    if (data.schemaVersion !== 1 || data.kind !== "snippet" || !data.id || !data.slug || !data.updatedAt) throw new Error(`Invalid snippet schema: ${file.path}`);
    if (data.status !== "ready") return [];
    const block = content.match(/^```[^\r\n`]*\r?\n([\s\S]*?)^```\s*$/m);
    if (!block) throw new Error(`Missing snippet code block: ${file.path}`);
    return [{ schemaVersion: 1, kind: "snippet", status: "ready", legacy: false, filename: file.path,
      id: data.id, slug: data.slug, title: data.title, language: data.language,
      tags: data.tags, createdAt: data.updatedAt, updatedAt: data.updatedAt,
      description: data.description, code: block[1].trimEnd() }];
  }).sort((a, b) => Date.parse(b.updatedAt) - Date.parse(a.updatedAt) || a.id.localeCompare(b.id));
}

export function getAllSnippets(): SnippetMeta[] {
  return readSnippets().map(({ code: _code, ...metadata }) => metadata);
}
export function getSnippetById(identifier: string): SnippetData | null {
  const entry = readContentRegistry()?.entries.find((item) => item.kind === "snippet" &&
    (item.id === identifier || item.canonicalPath === `/templates/${identifier}` || item.aliases.includes(`/snippets/${identifier}`) || item.aliases.includes(`/templates/${identifier}`)));
  if (entry?.state === "withdrawn") return null;
  return readSnippets().find((item) => item.id === identifier || item.slug === identifier || item.filename === identifier || item.id === entry?.id) || null;
}
export const getSnippetByFilename = getSnippetById;
