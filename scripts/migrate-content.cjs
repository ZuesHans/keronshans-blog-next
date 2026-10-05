#!/usr/bin/env node

const fs = require("node:fs");
const path = require("node:path");
const crypto = require("node:crypto");
const matter = require("gray-matter");

function urlSafeId(filename) {
  const name = filename.replace(/\.md$/i, "");
  const knownNames = { Diary: "diary", Trick: "trick", adhoc: "adhoc", "Constructive Algorithms": "constructive-algo", "三国杀武将": "sanguosha", 对拍写法: "duipai-write", 期望DP: "expected-dp", 实现合集: "impl-collection", 优化算法: "optimize-algo", 单调栈单调队列: "monotone-stack-queue", 二进制: "binary", 计算几何: "computational-geometry", 数据结构笔记本: "ds-notebook", 数据结构: "data-structure", 图论算法: "graph-algo", 图论与搜索: "graph-search", 奇思妙想小题目: "creative-problems", 动态规划: "dynamic-programming", 基础算法与杂: "basic-algo-misc", 基础算法: "basic-algo", 前缀和与差分: "prefix-sum-diff", 数学: "math", 贪心: "greedy", 题目多解: "multi-solution", 优化: "optimization", 牛客寒假营典题: "nowcoder-winter-camp" };
  for (const [label, value] of Object.entries(knownNames)) if (name.includes(label)) {
    const prefix = name.split(label)[0].toLowerCase().replace(/[^a-z0-9-]/g, "");
    return `${prefix ? `${prefix}-` : ""}${value}`;
  }
  let hash = 0;
  for (let i = 0; i < name.length; i += 1) hash = ((hash << 5) - hash + name.charCodeAt(i)) | 0;
  return `post-${Math.abs(hash).toString(36)}`;
}

function slug(value, fallback) {
  const result = String(value || fallback).toLowerCase().normalize("NFKD").replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "").slice(0, 100);
  return result || fallback;
}

function date(value) {
  if (!value) return "";
  const parsed = new Date(String(value));
  return Number.isNaN(parsed.getTime()) ? String(value).slice(0, 10) : parsed.toISOString().slice(0, 10);
}

function category(value, filename) {
  const aliases = { 算法板子: "algorithm", 算法学习: "algorithm", 题解: "review", 题解复盘: "review", 专题: "collection", 专题集合: "collection", 碎碎念: "journal", 日记: "journal", 笔记: "study", 学习笔记: "study" };
  if (aliases[String(value)]) return aliases[String(value)];
  if (/^(KH|ZU_)/i.test(filename)) return "algorithm";
  if (/^wp_/i.test(filename)) return "review";
  if (/^sp_/i.test(filename)) return "collection";
  if (/diary/i.test(filename)) return "journal";
  return "study";
}

function files(root, directory) {
  const absolute = path.join(root, directory);
  if (!fs.existsSync(absolute)) return [];
  return fs.readdirSync(absolute, { withFileTypes: true }).flatMap((entry) => {
    const relative = path.join(directory, entry.name);
    if (entry.isDirectory()) return files(root, relative);
    if (entry.isSymbolicLink() || !entry.name.endsWith(".md")) return [];
    return [relative];
  });
}

function migrate(source, output) {
  const rows = [];
  const ids = new Set();
  const slugs = new Set();
  for (const kind of ["post", "snippet"]) {
    for (const relative of files(source, kind === "post" ? "posts" : "snippets")) {
      const absolute = path.join(source, relative);
      const raw = fs.readFileSync(absolute);
      const parsed = matter(raw.toString("utf8"));
      const filename = path.basename(relative);
      const oldId = typeof parsed.data.id === "string" ? parsed.data.id : "";
      const legalOldId = /^[a-z0-9][a-z0-9_-]{0,79}$/.test(oldId);
      const targetId = legalOldId ? oldId : kind === "post" ? urlSafeId(filename) : `snippet_${crypto.createHash("sha256").update(relative).digest("hex").slice(0, 32)}`;
      // IDs may retain an underscore for legacy identity, but public slugs use
      // the stricter URL grammar from schema v1.
      const targetSlug = slug(parsed.data.slug, targetId);
      const conflictStatus = ids.has(targetId) || slugs.has(targetSlug) ? "conflict" : parsed.data.status === "draft" || parsed.data.draft === true ? "draft" : "needs-review";
      ids.add(targetId); slugs.add(targetSlug);
      rows.push({ kind, source: relative.replaceAll("\\", "/"), sourceKey: relative.replaceAll("\\", "/"), oldUrl: kind === "post" ? `/posts/${targetId}` : `/snippets/${targetId}`, oldPostId: oldId || null, targetId, targetSlug, contentHash: crypto.createHash("sha256").update(raw).digest("hex"), conflictStatus, proposed: { schemaVersion: 1, kind, id: targetId, slug: targetSlug, status: parsed.data.draft === true ? "draft" : "ready", title: String(parsed.data.title || filename.replace(/\.md$/, "")), date: date(parsed.data.date), updatedAt: "REVIEW_REQUIRED", category: kind === "post" ? category(parsed.data.category, filename) : undefined, tags: Array.isArray(parsed.data.tags) ? parsed.data.tags.map(String) : [], description: String(parsed.data.description || parsed.data.excerpt || ""), pinned: Boolean(parsed.data.pinned), aliases: [] } });
    }
  }
  rows.sort((a, b) => a.targetId.localeCompare(b.targetId));
  fs.writeFileSync(output, `${JSON.stringify({ schemaVersion: 1, generatedBy: "migrate-content", sourceRoot: path.basename(source), entries: rows }, null, 2)}\n`, "utf8");
  return rows;
}

try {
  const args = process.argv.slice(2);
  const sourceIndex = args.indexOf("--source");
  const outIndex = args.indexOf("--out");
  if (sourceIndex < 0 || outIndex < 0 || !args[sourceIndex + 1] || !args[outIndex + 1]) throw new Error("用法：node scripts/migrate-content.cjs --source <Published> --out <migration-map.json>");
  const source = path.resolve(args[sourceIndex + 1]);
  const output = path.resolve(args[outIndex + 1]);
  if (!fs.existsSync(source) || !fs.statSync(source).isDirectory()) throw new Error(`source 不是目录：${source}`);
  const rows = migrate(source, output);
  console.log(JSON.stringify({ ok: true, output, entries: rows.length, conflicts: rows.filter((row) => row.conflictStatus === "conflict").length, needsReview: rows.filter((row) => row.conflictStatus === "needs-review").length }, null, 2));
} catch (error) {
  console.error(`[content-migrate] ${error.message}`);
  process.exitCode = 2;
}
