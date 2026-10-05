-- 说说/留言
CREATE TABLE IF NOT EXISTS talks (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  nickname TEXT NOT NULL DEFAULT 'Keronshans',
  content TEXT NOT NULL,
  mood TEXT DEFAULT '😄',
  created_at TEXT NOT NULL DEFAULT (datetime('now', '+8 hours'))
);

-- 打卡
CREATE TABLE IF NOT EXISTS checkins (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  nickname TEXT NOT NULL DEFAULT 'Keronshans',
  content TEXT DEFAULT '',
  type TEXT DEFAULT 'practice',
  count INTEGER DEFAULT 1,
  note TEXT DEFAULT '',
  created_at TEXT NOT NULL DEFAULT (datetime('now', '+8 hours'))
);

-- 评论（针对文章）
CREATE TABLE IF NOT EXISTS comments (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  post_id TEXT NOT NULL,
  nickname TEXT NOT NULL DEFAULT '匿名',
  content TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'approved',
  revision INTEGER NOT NULL DEFAULT 1,
  deleted_at TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now', '+8 hours'))
);

CREATE INDEX IF NOT EXISTS idx_comments_post_created_at ON comments(post_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_comments_recent_dedupe ON comments(post_id, content, created_at);

-- 点赞（针对文章）
CREATE TABLE IF NOT EXISTS likes (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  post_id TEXT NOT NULL,
  ip TEXT NOT NULL DEFAULT '',
  actor_hash TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now', '+8 hours'))
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_likes_post_ip_unique ON likes(post_id, ip);
CREATE INDEX IF NOT EXISTS idx_likes_post_id ON likes(post_id);
CREATE UNIQUE INDEX IF NOT EXISTS idx_likes_post_actor_hash ON likes(post_id, actor_hash);

CREATE TABLE IF NOT EXISTS interaction_mutations (
  site_id TEXT NOT NULL,
  kind TEXT NOT NULL,
  mutation_id TEXT NOT NULL,
  request_hash TEXT NOT NULL,
  resource_id TEXT NOT NULL,
  response_json TEXT NOT NULL,
  created_at TEXT NOT NULL DEFAULT (datetime('now', '+8 hours')),
  PRIMARY KEY (site_id, kind, mutation_id)
);
CREATE INDEX IF NOT EXISTS idx_interaction_mutations_created_at ON interaction_mutations(created_at);

-- 题目收集
CREATE TABLE IF NOT EXISTS problems (
  id TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  url TEXT NOT NULL DEFAULT '',
  platform TEXT NOT NULL DEFAULT 'cf',
  status TEXT NOT NULL DEFAULT 'AC',
  tags TEXT NOT NULL DEFAULT '[]',
  date TEXT NOT NULL DEFAULT '',
  note TEXT NOT NULL DEFAULT '',
  analysis TEXT NOT NULL DEFAULT '',
  created_at TEXT NOT NULL DEFAULT (datetime('now', '+8 hours')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now', '+8 hours'))
);

-- OJ Float webhook public projection: daily solved totals only.
CREATE TABLE IF NOT EXISTS oj_daily_stats (
  date TEXT PRIMARY KEY,
  total_delta INTEGER NOT NULL DEFAULT 0,
  updated_at TEXT NOT NULL DEFAULT (datetime('now', '+8 hours'))
);

-- OJ Float webhook public projection: synced problem book rows.
-- note and analysis are optional and only present if the desktop user opts in.
CREATE TABLE IF NOT EXISTS oj_synced_problems (
  id TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  url TEXT NOT NULL DEFAULT '',
  platform TEXT NOT NULL DEFAULT 'other',
  status TEXT NOT NULL DEFAULT 'TODO',
  tags TEXT NOT NULL DEFAULT '[]',
  date TEXT NOT NULL DEFAULT '',
  note TEXT NOT NULL DEFAULT '',
  analysis TEXT NOT NULL DEFAULT '',
  updated_at TEXT NOT NULL DEFAULT (datetime('now', '+8 hours')),
  synced_at TEXT NOT NULL DEFAULT (datetime('now', '+8 hours'))
);

CREATE TABLE IF NOT EXISTS rate_limit_buckets (
  bucket_key TEXT PRIMARY KEY,
  count INTEGER NOT NULL,
  reset_at INTEGER NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_rate_limit_expiry ON rate_limit_buckets(reset_at);
