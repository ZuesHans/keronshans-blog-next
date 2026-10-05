import fs from "fs";
import path from "path";
import matter from "gray-matter";
import { CATEGORY_GROUPS, getCategoryColorClass } from "./categories";
import { normalizeSearchContent, type SearchDocument } from "./search";
import { POSTS_DIR } from "./contentRoot";
import { readContentRegistry } from "./contentRegistry";
import { getSnapshotFiles, hasGeneratedContentSnapshot } from "./contentSnapshot";
import { validatePostFrontmatter } from "@/content/schema";

export interface PostMeta {
  schemaVersion?: 1;
  kind?: "post";
  legacy: boolean;
  id: string;
  slug: string;
  status: "draft" | "ready";
  updatedAt: string;
  aliases: string[];
  title: string;
  date: string;
  tags: string[];
  cover: string;
  excerpt: string;
  category: string;
  pinned: boolean;
}

export interface PostData extends PostMeta {
  content: string;
}

function parseCategory(filename: string): string {
  if (filename.startsWith("KH") || filename.startsWith("ZU_")) return "算法学习";
  if (filename.startsWith("wp_")) return "题目复盘";
  if (filename.startsWith("sp_")) return "专题集合";
  if (filename.toLowerCase() === "diary.md") return "碎碎念";
  if (filename === "三国杀武将.md") return "碎碎念";
  return "学习笔记";
}

function normalizeCategory(value: unknown, filename: string): string {
  const category = String(value || "").trim();
  const aliases: Record<string, string> = {
    algorithm: "算法学习",
    review: "题目复盘",
    study: "学习笔记",
    collection: "专题集合",
    journal: "碎碎念",
    算法板子: "算法学习",
    题解复盘: "题目复盘",
    专题训练: "专题集合",
  };
  if (aliases[category]) return aliases[category];
  if (CATEGORY_GROUPS.some((group) => group.name === category)) return category;
  return parseCategory(filename);
}

function formatDate(value: unknown): string {
  if (!value) return "";
  const date = value instanceof Date ? value : new Date(String(value));
  if (!Number.isNaN(date.getTime())) return date.toISOString().slice(0, 10);
  return String(value).slice(0, 10);
}

function explicitExcerpt(value: unknown): string {
  return String(value || "").trim().slice(0, 240);
}

function stringList(value: unknown): string[] {
  return Array.isArray(value) ? value.map(String).map((item) => item.trim()).filter(Boolean) : [];
}

function readFilePost(filePath: string, filename: string, snapshotContent?: string): PostMeta & { content?: string } | null {
  const fileContent = snapshotContent ?? fs.readFileSync(filePath, "utf-8");
  const { data, content } = matter(fileContent);
  validatePostFrontmatter(data);
  const status = data.status === "draft" || data.draft === true || data.published === false ? "draft" : "ready";
  if (status === "draft") return null;
  const id = String(data.id);
  const slug = String(data.slug);
  const updatedAt = String(data.updatedAt || data.updated_at || data.date || "");
  return {
    ...(data.schemaVersion === 1 && data.kind === "post" ? { schemaVersion: 1 as const, kind: "post" as const } : {}),
    legacy: !(data.schemaVersion === 1 && data.kind === "post"),
    id,
    slug,
    status,
    updatedAt,
    aliases: stringList(data.aliases),
    title: String(data.title || filename.replace(/\.md$/, "")),
    date: formatDate(data.date),
    tags: parseTags(data.tags),
    cover: String(data.cover || ""),
    excerpt: explicitExcerpt(data.description || data.excerpt),
    category: normalizeCategory(data.category, path.basename(filename)),
    pinned: data.pinned === true,
    content,
  };
}

function parseTags(value: unknown): string[] {
  if (Array.isArray(value)) return value.map((tag) => String(tag));
  if (typeof value === "string") {
    try {
      const parsed = JSON.parse(value);
      return Array.isArray(parsed) ? parsed.map((tag) => String(tag)) : [];
    } catch {
      return value
        .split(",")
        .map((tag) => tag.trim())
        .filter(Boolean);
    }
  }
  return [];
}

function listLocalPostFiles(directory = POSTS_DIR, root = POSTS_DIR): { filePath: string; relative: string }[] {
  if (!fs.existsSync(directory)) return [];
  return fs.readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
    const filePath = path.join(directory, entry.name);
    if (entry.isSymbolicLink()) throw new Error(`不允许在文章目录中使用符号链接：${filePath}`);
    if (entry.isDirectory()) return listLocalPostFiles(filePath, root);
    if (!entry.isFile() || !entry.name.endsWith(".md")) return [];
    return [{ filePath, relative: path.relative(root, filePath).replaceAll(path.sep, "/") }];
  });
}

function getPostsFromFiles(): PostMeta[] {
  const postsPath = POSTS_DIR;
  if (hasGeneratedContentSnapshot()) {
    return getSnapshotFiles("posts")
      .map(({ path: relative, content }) => readFilePost(path.join(postsPath, relative), relative, content))
      .filter((post): post is PostMeta => Boolean(post));
  }
  if (!fs.existsSync(postsPath)) return [];

  return listLocalPostFiles()
    .map(({ filePath, relative }) => readFilePost(filePath, relative))
    .filter((post): post is PostMeta => Boolean(post));
}

function findLocalPostPath(post: PostMeta): string | null {
  for (const { filePath, relative } of listLocalPostFiles()) {
    try {
      const { data } = matter(fs.readFileSync(filePath, "utf8"));
      if (String(data.id) === post.id || String(data.slug || "") === post.slug) return filePath;
    } catch {
      // The content contract reports malformed source files during publishing.
    }
  }
  const fallback = path.join(POSTS_DIR, `${post.slug}.md`);
  return fs.existsSync(fallback) ? fallback : null;
}

function getSearchDocumentsFromFiles(): SearchDocument[] {
  const postsPath = POSTS_DIR;
  const files = hasGeneratedContentSnapshot()
    ? getSnapshotFiles("posts").map(({ path: relative, content }) => ({ filePath: path.join(postsPath, relative), relative, content }))
    : listLocalPostFiles().map(({ filePath, relative }) => ({ filePath, relative, content: undefined }));
  if (!hasGeneratedContentSnapshot() && !fs.existsSync(postsPath)) return [];

  return files
    .map(({ filePath, relative, content }) => {
      const post = readFilePost(filePath, relative, content);
      if (!post) return null;
      return {
        id: post.id,
        url: `/posts/${post.slug}`,
        title: post.title,
        content: normalizeSearchContent(post.content || ""),
        date: post.date,
        tags: post.tags,
        category: post.category,
        updatedAt: post.updatedAt,
      };
    }).filter((post): post is SearchDocument => Boolean(post))
    .sort((left, right) => new Date(right.updatedAt).getTime() - new Date(left.updatedAt).getTime());
}

export async function getAllPosts(): Promise<PostMeta[]> {
  const filePosts = getPostsFromFiles();
  return filePosts.sort((a, b) => Number(b.pinned) - Number(a.pinned) || new Date(b.updatedAt || b.date).getTime() - new Date(a.updatedAt || a.date).getTime() || a.id.localeCompare(b.id));
}

export async function getPostSearchDocuments(): Promise<SearchDocument[]> {
  return getSearchDocumentsFromFiles();
}

export async function getPostById(id: string): Promise<PostData | null> {
  const posts = await getAllPosts();
  const registry = readContentRegistry();
  const registryEntry = registry?.entries.find((entry) => entry.kind === "post" && (entry.id === id || entry.canonicalPath === `/posts/${id}` || entry.aliases.includes(`/posts/${id}`)));
  if (registryEntry?.state === "withdrawn") return null;
  const post = posts.find((item) => item.id === id || item.slug === id || item.slug === registryEntry?.canonicalPath.replace(/^\/posts\//, ""));
  if (!post) return null;

  const snapshotFile = hasGeneratedContentSnapshot()
    ? getSnapshotFiles("posts").find(({ path: relative, content }) => {
      try {
        const { data } = matter(content);
        return String(data.id) === post.id || String(data.slug || "") === post.slug;
      } catch {
        return false;
      }
    })
    : null;
  const filePath = snapshotFile ? null : findLocalPostPath(post);
  const fileContent = snapshotFile?.content || (filePath ? fs.readFileSync(filePath, "utf-8") : null);
  if (fileContent !== null) {
    const { data, content } = matter(fileContent);
    return {
      ...post,
      ...(data.schemaVersion === 1 && data.kind === "post" ? { schemaVersion: 1 as const, kind: "post" as const } : {}),
      legacy: !(data.schemaVersion === 1 && data.kind === "post"),
      title: String(data.title || post.slug),
      date: formatDate(data.date || post.date),
      tags: parseTags(data.tags),
      cover: "",
      category: normalizeCategory(data.category, path.basename(snapshotFile?.path || filePath || post.slug)),
      pinned: Boolean(data.pinned),
      status: post.status,
      updatedAt: String(data.updatedAt || data.updated_at || post.updatedAt),
      aliases: stringList(data.aliases),
      content,
    };
  }

  return null;
}

export async function getAllTags(): Promise<{ tag: string; count: number }[]> {
  const tagMap = new Map<string, number>();
  (await getAllPosts()).forEach((post) => {
    post.tags.forEach((tag) => {
      tagMap.set(tag, (tagMap.get(tag) || 0) + 1);
    });
  });

  return Array.from(tagMap.entries())
    .map(([tag, count]) => ({ tag, count }))
    .sort((a, b) => b.count - a.count);
}

export function getPostsByCategory(category: string): PostMeta[] {
  return getPostsFromFiles().filter((post) => post.category === category);
}

export { getCategoryColorClass as getCategoryColor };
export { CATEGORY_GROUPS, getCategoryColorClass };
