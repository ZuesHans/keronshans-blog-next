import path from "path";

// The framework can build with an exported content repository checked out at
// ./content, while local tools may point at another generated content folder.
export const CONTENT_ROOT = path.resolve(
  process.env.BLOG_CONTENT_ROOT || path.join(process.cwd(), ".content"),
);

export const POSTS_DIR = path.join(CONTENT_ROOT, "posts");
export const SNIPPETS_DIR = path.join(CONTENT_ROOT, "snippets");
export const PROBLEMS_FILE = path.join(CONTENT_ROOT, "problems.json");
