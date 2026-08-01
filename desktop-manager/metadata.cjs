const path = require("path");

const CATEGORY_PREFIX = {
  "算法学习": "KH_",
  "题目复盘": "wp_",
  "学习笔记": "",
  "专题集合": "sp_",
  "碎碎念": "",
};

const CATEGORY_ALIASES = {
  "算法板子": "算法学习",
  "题解复盘": "题目复盘",
  "专题训练": "专题集合",
};

const CATEGORY_NAMES = Object.keys(CATEGORY_PREFIX);

function normalizeCategory(value) {
  const category = String(value || "").trim();
  const normalized = CATEGORY_ALIASES[category] || category;
  return CATEGORY_NAMES.includes(normalized) ? normalized : "";
}

function parseCategory(filename, frontmatter = {}) {
  const explicit = normalizeCategory(frontmatter.category);
  if (explicit) return explicit;
  if (filename.startsWith("KH") || filename.startsWith("ZU_")) return "算法学习";
  if (filename.startsWith("wp_")) return "题目复盘";
  if (filename.startsWith("sp_")) return "专题集合";
  if (filename.toLowerCase() === "diary.md") return "碎碎念";
  return "学习笔记";
}

function normalizeDescription(value) {
  return String(value || "").replace(/\s+/g, " ").trim().slice(0, 240);
}

function inferMarkdownKindFromData(filePath, data = {}) {
  const parentName = path.basename(path.dirname(filePath)).toLowerCase();
  if (parentName.includes("snippet") || parentName.includes("template")) return "snippet";

  const hasSnippetLifecycle = Boolean(data.created_at || data.updated_at);
  const hasSnippetLanguage = Boolean(data.language);
  const hasSnippetId = Boolean(data.id && !data.date && !data.category);
  if (hasSnippetLifecycle || hasSnippetLanguage || hasSnippetId) return "snippet";
  return "post";
}

function postSummary(description, content) {
  const explicit = normalizeDescription(description);
  if (explicit) return explicit;
  return String(content || "")
    .replace(/[#*`[\]<>]/g, "")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, 160);
}

module.exports = {
  CATEGORY_NAMES,
  CATEGORY_PREFIX,
  inferMarkdownKindFromData,
  normalizeCategory,
  normalizeDescription,
  parseCategory,
  postSummary,
};
