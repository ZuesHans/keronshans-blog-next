import fs from "fs";
import path from "path";
import matter from "gray-matter";
import { getCloudflareContext } from "@opennextjs/cloudflare";
import { CATEGORY_GROUPS, getCategoryColorClass } from "./categories";
import { toUrlSafeId } from "./postSlug";

export interface PostMeta {
  id: string;
  slug: string;
  title: string;
  date: string;
  tags: string[];
  cover: string;
  excerpt: string;
  category: string;
}

export interface PostData extends PostMeta {
  content: string;
}

function parseCategory(filename: string): string {
  if (filename.startsWith("KH") || filename.startsWith("ZU_")) return "算法板子";
  if (filename.startsWith("wp_")) return "题解复盘";
  if (filename.startsWith("sp_")) return "专题训练";
  if (filename.toLowerCase() === "diary.md") return "碎碎念";
  if (filename === "三国杀武将.md") return "碎碎念";
  return "学习笔记";
}

function normalizeCategory(value: unknown, filename: string): string {
  const category = String(value || "").trim();
  if (CATEGORY_GROUPS.some((group) => group.name === category)) return category;
  return parseCategory(filename);
}

function formatDate(value: unknown): string {
  if (!value) return "";
  const date = value instanceof Date ? value : new Date(String(value));
  if (!Number.isNaN(date.getTime())) return date.toISOString().slice(0, 10);
  return String(value).slice(0, 10);
}

function makeExcerpt(content: string): string {
  return content
    .replace(/^---[\s\S]*?---\n?/, "")
    .replace(/[#*`[\]<>]/g, "")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, 180);
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

async function getPostsFromD1(): Promise<PostMeta[] | null> {
  try {
    const { env } = await getCloudflareContext({ async: true });
    if (!env?.DB) return null;
    const { results } = await env.DB.prepare(
      "SELECT filename, title, content, date, tags, category FROM posts ORDER BY created_at DESC"
    ).all();
    if (!results || results.length === 0) return null;

    return results.map((row: Record<string, unknown>) => {
      const filename = String(row.filename || "");
      const content = String(row.content || "");
      return {
        id: toUrlSafeId(filename),
        slug: filename,
        title: String(row.title || filename),
        date: formatDate(row.date),
        tags: parseTags(row.tags),
        cover: "",
        excerpt: makeExcerpt(content),
        category: normalizeCategory(row.category, filename),
      };
    });
  } catch {
    return null;
  }
}

function getPostsFromFiles(): PostMeta[] {
  const postsPath = path.join(process.cwd(), "content", "posts");
  if (!fs.existsSync(postsPath)) return [];

  return fs
    .readdirSync(postsPath)
    .filter((filename) => filename.endsWith(".md"))
    .map((filename) => {
      const filePath = path.join(postsPath, filename);
      const fileContent = fs.readFileSync(filePath, "utf-8");
      const { data, content } = matter(fileContent);
      return {
        id: toUrlSafeId(filename),
        slug: filename.replace(/\.md$/, ""),
        title: String(data.title || filename.replace(/\.md$/, "")),
        date: formatDate(data.date),
        tags: parseTags(data.tags),
        cover: "",
        excerpt: makeExcerpt(content),
        category: normalizeCategory(data.category, filename),
      };
    });
}

export async function getAllPosts(): Promise<PostMeta[]> {
  const d1Posts = await getPostsFromD1();
  const posts = d1Posts && d1Posts.length > 0 ? d1Posts : getPostsFromFiles();
  return posts.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
}

export async function getPostById(id: string): Promise<PostData | null> {
  const posts = await getAllPosts();
  const post = posts.find((item) => item.id === id);
  if (!post) return null;

  try {
    const { env } = await getCloudflareContext({ async: true });
    if (env?.DB) {
      const { results } = await env.DB.prepare(
        "SELECT filename, title, content, date, tags, category FROM posts WHERE filename = ?"
      )
        .bind(post.slug)
        .all();
      if (results && results.length > 0) {
        const row = results[0] as Record<string, unknown>;
        const filename = String(row.filename || post.slug);
        return {
          id: post.id,
          slug: filename,
          title: String(row.title || post.title),
          date: formatDate(row.date || post.date),
          tags: parseTags(row.tags),
          cover: "",
          excerpt: post.excerpt,
          category: normalizeCategory(row.category, filename),
          content: String(row.content || ""),
        };
      }
    }
  } catch {}

  const filePath = path.join(process.cwd(), "content", "posts", `${post.slug}.md`);
  if (!fs.existsSync(filePath)) return null;

  const fileContent = fs.readFileSync(filePath, "utf-8");
  const { data, content } = matter(fileContent);
  return {
    ...post,
    title: String(data.title || post.slug),
    date: formatDate(data.date || post.date),
    tags: parseTags(data.tags),
    cover: "",
    category: normalizeCategory(data.category, `${post.slug}.md`),
    content,
  };
}

export function getAllTags(): { tag: string; count: number }[] {
  const tagMap = new Map<string, number>();
  getPostsFromFiles().forEach((post) => {
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
