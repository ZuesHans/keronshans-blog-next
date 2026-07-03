interface PostsKVBinding {
  get(key: string): Promise<string | null>;
  put(key: string, value: string): Promise<void>;
}

interface AppBindings {
  DB: D1Database;
  KV?: PostsKVBinding;
  POSTS_KV?: PostsKVBinding;
  OJ_SYNC_TOKEN?: string;
  SEARCH_API_URL?: string;
  SEARCH_API_TOKEN?: string;
}

declare global {
  interface CloudflareEnv extends AppBindings {}
}

export interface Env extends AppBindings {}
