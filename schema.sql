-- 博客文章
CREATE TABLE IF NOT EXISTS posts (
  filename TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  content TEXT NOT NULL DEFAULT '',
  date TEXT NOT NULL DEFAULT '',
  tags TEXT NOT NULL DEFAULT '[]',
  category TEXT NOT NULL DEFAULT '笔记',
  created_at TEXT NOT NULL DEFAULT (datetime('now', '+8 hours')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now', '+8 hours'))
);

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
  created_at TEXT NOT NULL DEFAULT (datetime('now', '+8 hours'))
);

-- 点赞（针对文章）
CREATE TABLE IF NOT EXISTS likes (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  post_id TEXT NOT NULL,
  ip TEXT NOT NULL DEFAULT '',
  created_at TEXT NOT NULL DEFAULT (datetime('now', '+8 hours'))
);

-- 代码片段
CREATE TABLE IF NOT EXISTS snippets (
  id TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  code TEXT NOT NULL DEFAULT '',
  language TEXT NOT NULL DEFAULT 'C++',
  tags TEXT NOT NULL DEFAULT '[]',
  created_at TEXT NOT NULL DEFAULT (datetime('now', '+8 hours')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now', '+8 hours'))
);

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
