import fs from "fs";
import path from "path";
import matter from "gray-matter";
import { getCloudflareContext } from "@opennextjs/cloudflare";

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

function toUrlSafeId(filename: string): string {
  const name = filename.replace(/\.md$/, "");
  const map: Record<string, string> = {
    "三国杀武将": "sanguosha-jiangjiang",
    "对拍写法": "duipai-write",
    "期望DP": "expected-dp",
    "实现合集": "impl-collection",
    "优化算法": "optimize-algo",
    "单调栈单调队列": "monotone-stack-queue",
    "二进制": "binary",
    "计算几何": "computational-geometry",
    "数据结构笔记本": "ds-notebook",
    "图论算法": "graph-algo",
    "奇思妙想小题目": "creative-problems",
    "动态规划": "dynamic-programming",
    "基础算法与杂": "basic-algo-misc",
    "前缀和与差分": "prefix-sum-diff",
    "数据结构": "data-structure",
    "数学": "math",
    "贪心": "greedy",
    "题目多解": "multi-solution",
    "图论与搜索": "graph-search",
    "优化": "optimization",
    "基础算法": "basic-algo",
    "Constructive Algorithms": "constructive-algo",
    "牛客寒假营典题": "nowcoder-winter-camp",
    "Trick": "trick",
    "adhoc": "adhoc",
    "Diary": "diary",
  };
  for (const [cn, en] of Object.entries(map)) {
    if (name.includes(cn)) {
      const prefix = name.split(cn)[0];
      return prefix.toLowerCase().replace(/[^a-z0-9-]/g, "") + "-" + en;
    }
  }
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = ((hash << 5) - hash + name.charCodeAt(i)) | 0;
  }
  return "post-" + Math.abs(hash).toString(36);
}

function parseCategory(filename: string): string {
  if (filename.startsWith("KH_")) return "笔记";
  if (filename.startsWith("ZU_")) return "模板";
  if (filename.startsWith("wp_")) return "题解";
  if (filename.startsWith("sp_")) return "专题";
  if (filename.toLowerCase() === "diary.md") return "日记";
  if (filename === "三国杀武将.md") return "日记";
  return "其他";
}

export function getCategoryColorClass(category: string): string {
  switch (category) {
    case "笔记": return "bg-neon-pink/10 text-neon-pink border-neon-pink/30";
    case "模板": return "bg-neon-blue/10 text-neon-blue border-neon-blue/30";
    case "题解": return "bg-neon-green/10 text-neon-green border-neon-green/30";
    case "专题": return "bg-neon-purple/10 text-neon-purple border-neon-purple/30";
    case "日记": return "bg-neon-yellow/10 text-neon-yellow border-neon-yellow/30";
    default: return "bg-neon-pink/10 text-neon-pink border-neon-pink/30";
  }
}

// D1-first: try Cloudflare D1, fallback to local files
async function getPostsFromD1(): Promise<PostMeta[] | null> {
  try {
    const { env } = await getCloudflareContext({ async: true });
    if (!env?.DB) return null;
    const { results } = await env.DB.prepare(
      "SELECT filename, title, content, date, tags, category FROM posts ORDER BY created_at DESC"
    ).all();
    if (!results || results.length === 0) return null;
    return results.map((row: Record<string, unknown>) => {
      const slug = String(row.filename || "");
      const tags = (() => { try { return JSON.parse(String(row.tags || "[]")); } catch { return []; } })();
      const content = String(row.content || "");
      const excerpt = content.replace(/^---[\s\S]*?---\n/, "").slice(0, 200).replace(/[#*`\[\]]/g, "").trim();
      return {
        id: toUrlSafeId(slug),
        slug,
        title: String(row.title || slug),
        date: String(row.date || ""),
        tags: Array.isArray(tags) ? tags.map(String) : [],
        cover: "",
        excerpt,
        category: String(row.category || parseCategory(slug)),
      };
    });
  } catch {
    return null;
  }
}

function getPostsFromFiles(): PostMeta[] {
  const p = path.join(process.cwd(), "content", "posts");
  if (!fs.existsSync(p)) return [];
  const files = fs.readdirSync(p).filter((f) => f.endsWith(".md"));
  return files.map((filename) => {
    const filePath = path.join(p, filename);
    const fileContent = fs.readFileSync(filePath, "utf-8");
    const { data, content } = matter(fileContent);
    const excerpt = content.replace(/^---[\s\S]*?---/, "").slice(0, 200).replace(/[#*`\[\]]/g, "").trim();
    return {
      id: toUrlSafeId(filename),
      slug: filename.replace(/\.md$/, ""),
      title: data.title || filename.replace(/\.md$/, ""),
      date: data.date ? String(data.date) : "",
      tags: Array.isArray(data.tags) ? data.tags.map((t: unknown) => String(t)) : [],
      cover: data.cover || "",
      excerpt,
      category: parseCategory(filename),
    };
  });
}

// Server Component: async, tries D1 first then local files
export async function getAllPosts(): Promise<PostMeta[]> {
  const d1Posts = await getPostsFromD1();
  if (d1Posts && d1Posts.length > 0) return d1Posts;
  const posts = getPostsFromFiles();
  posts.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  return posts;
}

export async function getPostById(id: string): Promise<PostData | null> {
  const posts = await getAllPosts();
  const post = posts.find((p) => p.id === id);
  if (!post) return null;

  // Try D1 for content first
  try {
    const { env } = await getCloudflareContext({ async: true });
    if (env?.DB) {
      const { results } = await env.DB.prepare(
        "SELECT filename, title, content, date, tags, category FROM posts WHERE filename = ?"
      ).bind(post.slug).all();
      if (results && results.length > 0) {
        const row = results[0] as Record<string, unknown>;
        const tags = (() => { try { return JSON.parse(String(row.tags || "[]")); } catch { return []; } })();
        return {
          id: post.id,
          slug: String(row.filename || post.slug),
          title: String(row.title || post.title),
          date: String(row.date || post.date),
          tags: Array.isArray(tags) ? tags.map(String) : [],
          cover: "",
          excerpt: post.excerpt,
          category: String(row.category || post.category),
          content: String(row.content || ""),
        };
      }
    }
  } catch {}

  // Fallback to local file
  const filePath = path.join(process.cwd(), "content", "posts", `${post.slug}.md`);
  if (!fs.existsSync(filePath)) return null;
  const fileContent = fs.readFileSync(filePath, "utf-8");
  const { data, content } = matter(fileContent);
  return {
    ...post,
    title: data.title || post.slug,
    date: String(data.date || ""),
    tags: Array.isArray(data.tags) ? data.tags.map((t: unknown) => String(t)) : [],
    cover: data.cover || "",
    content,
  };
}

export function getAllTags(): { tag: string; count: number }[] {
  // For sync context (module level), use files only
  const posts = getPostsFromFiles();
  const tagMap = new Map<string, number>();
  posts.forEach((post) => {
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
