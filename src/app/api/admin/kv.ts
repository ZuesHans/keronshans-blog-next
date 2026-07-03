import { getCloudflareContext } from "@opennextjs/cloudflare";

/**
 * Optional Cloudflare Workers KV storage for blog posts.
 * Local content/posts/ files are still the source of truth for static generation.
 */

const KV_POSTS = "posts"; // JSON array of all posts

interface PostsKVBinding {
  get(key: string): Promise<string | null>;
  put(key: string, value: string): Promise<void>;
}

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

async function getPostsKV(): Promise<PostsKVBinding | null> {
  const { env } = await getCloudflareContext({ async: true });
  return env.POSTS_KV ?? env.KV ?? null;
}

export async function getAllPostsFromKV(): Promise<KvPost[]> {
  const kv = await getPostsKV();
  if (!kv) return [];
  const value = await kv.get(KV_POSTS);
  if (!value) return [];
  try {
    return JSON.parse(value) as KvPost[];
  } catch {
    return [];
  }
}

export async function saveAllPostsToKV(posts: KvPost[]): Promise<void> {
  const kv = await getPostsKV();
  if (!kv) {
    throw new Error("Cloudflare KV binding POSTS_KV or KV is not configured.");
  }
  await kv.put(KV_POSTS, JSON.stringify(posts));
}
