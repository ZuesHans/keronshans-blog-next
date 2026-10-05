#!/usr/bin/env node

const fs = require("node:fs");
const path = require("node:path");
const crypto = require("node:crypto");
const matter = require("gray-matter");

function normalizeSearchContent(content) {
  let insideFence = false;
  return String(content || "").replace(/\r\n?/g, "\n").split("\n").map((line) => {
    if (/^\s*(```|~~~)/.test(line)) { insideFence = !insideFence; return ""; }
    if (insideFence) return line;
    return line.replace(/<!--.*?-->/g, " ").replace(/!\[([^\]]*)\]\([^)]*\)/g, "$1").replace(/\[([^\]]+)\]\([^)]*\)/g, "$1").replace(/<[^>]+>/g, " ").replace(/^\s{0,3}#{1,6}\s+/, "").replace(/^\s*>\s?/, "").replace(/^\s*(?:[-+*]|\d+[.)])\s+/, "").replace(/[*_~`]+/g, "");
  }).join(" ").replace(/\s+/g, " ").trim();
}

function walk(root, directory = root) {
  if (!fs.existsSync(directory)) return [];
  return fs.readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
    const absolute = path.join(directory, entry.name);
    if (entry.isDirectory()) return walk(root, absolute);
    if (!entry.isFile() || !entry.name.endsWith(".md")) return [];
    return [{ absolute, relative: path.relative(root, absolute).replaceAll(path.sep, "/") }];
  });
}

function buildSearchIndex(contentRoot) {
  const manifestPath = path.join(contentRoot, "content-manifest.json");
  if (!fs.existsSync(manifestPath)) throw new Error(`缺少 content-manifest.json：${contentRoot}`);
  const manifest = JSON.parse(fs.readFileSync(manifestPath, "utf8"));
  if (manifest.schemaVersion !== 1 || typeof manifest.snapshotDigest !== "string") throw new Error("content-manifest.json schema 无效");
  const postsRoot = path.join(contentRoot, "posts");
  const documents = walk(postsRoot).map(({ absolute, relative }) => {
    const parsed = matter(fs.readFileSync(absolute, "utf8"));
    if (parsed.data.status === "draft") return null;
    const slug = String(parsed.data.slug || relative.replace(/\.md$/i, "").replace(/[^a-z0-9]+/gi, "-").replace(/^-+|-+$/g, "").toLowerCase());
    return { id: String(parsed.data.id || slug), url: `/posts/${slug}`, title: String(parsed.data.title || slug), content: normalizeSearchContent(parsed.content), date: String(parsed.data.date || "").slice(0, 10), tags: Array.isArray(parsed.data.tags) ? parsed.data.tags.map(String) : [], category: String(parsed.data.category || "study"), updatedAt: String(parsed.data.updatedAt || parsed.data.date || "") };
  }).filter(Boolean).sort((left, right) => left.id.localeCompare(right.id));
  const value = { schemaVersion: 1, snapshotDigest: manifest.snapshotDigest, documents };
  const bytes = JSON.stringify(value);
  const searchDigest = crypto.createHash("sha256").update(bytes, "utf8").digest("hex");
  return { value, bytes, searchDigest };
}

if (require.main === module) {
  try {
    const args = process.argv.slice(2);
    const rootIndex = args.indexOf("--content-root");
    const outIndex = args.indexOf("--out");
    if (rootIndex < 0 || outIndex < 0 || !args[rootIndex + 1] || !args[outIndex + 1]) throw new Error("用法：node scripts/build-search-index.cjs --content-root <content> --out <search.json>");
    const result = buildSearchIndex(path.resolve(args[rootIndex + 1]));
    const output = path.resolve(args[outIndex + 1]);
    fs.mkdirSync(path.dirname(output), { recursive: true });
    fs.writeFileSync(output, `${result.bytes}\n`, "utf8");
    console.log(JSON.stringify({ ok: true, output, searchDigest: result.searchDigest, snapshotDigest: result.value.snapshotDigest, documents: result.value.documents.length }, null, 2));
  } catch (error) {
    console.error(`[build-search-index] ${error.message}`);
    process.exitCode = 2;
  }
}

module.exports = { buildSearchIndex, normalizeSearchContent };
