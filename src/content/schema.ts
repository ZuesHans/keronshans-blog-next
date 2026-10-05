/**
 * Public content contract. This module intentionally has no framework or
 * filesystem dependency so the publisher and the web runtime can share it.
 */
export const POST_CATEGORIES = ["algorithm", "review", "study", "collection", "journal"] as const;
export type PostCategory = (typeof POST_CATEGORIES)[number];
export type ContentStatus = "draft" | "ready";

export interface PostFrontmatterV1 {
  schemaVersion: 1;
  kind: "post";
  id: string;
  slug: string;
  status: ContentStatus;
  title: string;
  date: string;
  updatedAt: string;
  category: PostCategory;
  tags: string[];
  description: string;
  pinned: boolean;
  aliases: string[];
  cover?: string;
}

export interface SnippetFrontmatterV1 {
  schemaVersion: 1;
  kind: "snippet";
  id: string;
  slug: string;
  status: ContentStatus;
  title: string;
  updatedAt: string;
  tags: string[];
  description: string;
  language: "cpp" | "python" | "javascript" | "typescript" | "bash" | "plaintext";
}

const ID_RE = /^[a-z0-9][a-z0-9_-]{0,79}$/;
const SLUG_RE = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

export function isPostCategory(value: unknown): value is PostCategory {
  return typeof value === "string" && (POST_CATEGORIES as readonly string[]).includes(value);
}

export function validatePostFrontmatter(value: Record<string, unknown>): PostFrontmatterV1 {
  const required = ["schemaVersion", "kind", "id", "slug", "status", "title", "date", "updatedAt", "category", "tags", "description", "pinned", "aliases"];
  for (const key of required) if (!(key in value)) throw new Error(`文章缺少字段：${key}`);
  if (value.schemaVersion !== 1 || value.kind !== "post") throw new Error("文章必须使用 schemaVersion: 1 / kind: post");
  if (typeof value.id !== "string" || !ID_RE.test(value.id)) throw new Error("文章 id 格式无效");
  if (typeof value.slug !== "string" || !SLUG_RE.test(value.slug) || value.slug.length > 100) throw new Error("文章 slug 格式无效");
  if (value.status !== "draft" && value.status !== "ready") throw new Error("文章 status 只能是 draft 或 ready");
  if (typeof value.title !== "string" || !value.title.trim() || value.title.length > 120) throw new Error("文章 title 无效");
  if (typeof value.date !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(value.date) || Number.isNaN(Date.parse(`${value.date}T00:00:00Z`))) throw new Error("文章 date 无效");
  if (typeof value.updatedAt !== "string" || Number.isNaN(Date.parse(value.updatedAt))) throw new Error("文章 updatedAt 无效");
  if (!isPostCategory(value.category)) throw new Error("文章 category 无效");
  if (!Array.isArray(value.tags) || value.tags.some((tag) => typeof tag !== "string")) throw new Error("文章 tags 无效");
  if (typeof value.description !== "string" || value.description.length > 240) throw new Error("文章 description 无效");
  if (typeof value.pinned !== "boolean") throw new Error("文章 pinned 必须是 boolean");
  if (!Array.isArray(value.aliases) || value.aliases.some((alias) => typeof alias !== "string")) throw new Error("文章 aliases 无效");
  return value as unknown as PostFrontmatterV1;
}
