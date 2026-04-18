/**
 * Cloudflare Workers KV storage for blog posts.
 * All post data is stored as JSON in Workers KV.
 * Local content/posts/ files are the source of truth for static generation.
 * Run deploy.ps1 locally to sync KV changes back to local files and redeploy.
 */

const KV_POSTS = "posts"; // JSON array of all posts

export interface KvPost {
  filename: string;
  title: string;
  date: string;
  tags: string[];
  category: string;
  content: string;
  size: number;
  createdAt: string;
  updatedAt: string;
}

export async function getAllPostsFromKV(): Promise<KvPost[]> {
  const { KV } = await import("@opennextjs/cloudflare");
  const value = await KV.get(KV_POSTS);
  if (!value) return [];
  try {
    return JSON.parse(value) as KvPost[];
  } catch {
    return [];
  }
}

export async function saveAllPostsToKV(posts: KvPost[]): Promise<void> {
  const { KV } = await import("@opennextjs/cloudflare");
  await KV.put(KV_POSTS, JSON.stringify(posts));
}
