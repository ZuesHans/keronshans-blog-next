interface AppBindings {
  DB: D1Database;
  ADMIN_PASSWORD?: string;
  ADMIN_SESSION_SECRET?: string;
  ACCESS_TEAM_DOMAIN?: string;
  ACCESS_AUD?: string;
  ACCESS_ADMIN_SUBJECTS?: string;
  PUBLIC_IDENTITY_SECRET?: string;
  OJ_SYNC_TOKEN?: string;
  SEARCH_API_URL?: string;
  SEARCH_API_TOKEN?: string;
  PRODUCTION_ADMIN_ENABLED?: string;
  TURNSTILE_SECRET_KEY?: string;
  TURNSTILE_HOSTNAME?: string;
}

declare global {
  interface CloudflareEnv extends AppBindings {}
}

export interface Env extends AppBindings {}
