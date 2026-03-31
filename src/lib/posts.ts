import fs from "fs";
import path from "path";
import matter from "gray-matter";

// 兼容 Cloudflare Worker 环境：process.cwd() 可能不对，fallback 到 __dirname
function getPostsDir(): string {
  const p = path.join(process.cwd(), "content", "posts");
  if (fs.existsSync(p)) return p;
  // fallback: 尝试 __dirname 上两级
  const p2 = path.join(__dirname, "..", "..", "content", "posts");
  if (fs.existsSync(p2)) return p2;
  // fallback: 尝试 server-functions 下的相对路径
  const p3 = path.join(process.cwd(), "content", "posts");
  return p3;
}

const POSTS_DIR = getPostsDir();

export interface PostMeta {
  id: string;          // URL-safe id (e.g. "kh-dui-pai-xie-fa")
  slug: string;        // original filename without .md (e.g. "KH_对拍写法")
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
  // Transliterate common Chinese characters for algorithm terms
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
      const prefix = name.split(cn)[0]; // e.g. "KH_"
      return prefix.toLowerCase().replace(/[^a-z0-9-]/g, "") + "-" + en;
    }
  }
  // Fallback: use a hash-based id
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

function getCategoryColor(category: string): string {
  switch (category) {
    case "笔记": return "neon-pink";
    case "模板": return "neon-blue";
    case "题解": return "neon-green";
    case "专题": return "neon-purple";
    case "日记": return "neon-yellow";
    default: return "neon-pink";
  }
}

export function getAllPosts(): PostMeta[] {
  if (!fs.existsSync(POSTS_DIR)) return [];
  const files = fs.readdirSync(POSTS_DIR).filter((f) => f.endsWith(".md"));
  const posts = files.map((filename) => {
    const filePath = path.join(POSTS_DIR, filename);
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

  posts.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  return posts;
}

export function getPostById(id: string): PostData | null {
  const posts = getAllPosts();
  const post = posts.find((p) => p.id === id);
  if (!post) return null;
  const filePath = path.join(POSTS_DIR, `${post.slug}.md`);
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
  const posts = getAllPosts();
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
  return getAllPosts().filter((post) => post.category === category);
}

export function getCategoryColorClass(category: string): string {
  const color = getCategoryColor(category);
  switch (color) {
    case "neon-pink": return "bg-neon-pink/10 text-neon-pink border-neon-pink/30";
    case "neon-blue": return "bg-neon-blue/10 text-neon-blue border-neon-blue/30";
    case "neon-green": return "bg-neon-green/10 text-neon-green border-neon-green/30";
    case "neon-purple": return "bg-neon-purple/10 text-neon-purple border-neon-purple/30";
    case "neon-yellow": return "bg-neon-yellow/10 text-neon-yellow border-neon-yellow/30";
    default: return "bg-neon-pink/10 text-neon-pink border-neon-pink/30";
  }
}

export { getCategoryColor };
