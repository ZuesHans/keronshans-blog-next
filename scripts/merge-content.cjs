#!/usr/bin/env node

const fs = require("node:fs");
const path = require("node:path");
const crypto = require("node:crypto");
const matter = require("gray-matter");

const POST_CATEGORIES = new Set(["algorithm", "review", "study", "collection", "journal"]);
const LANGUAGES = new Set(["cpp", "python", "javascript", "typescript", "bash", "plaintext"]);

function sha256(value) { return crypto.createHash("sha256").update(value).digest("hex"); }
function normalize(value) { return String(value || "").replaceAll("\r\n", "\n").replaceAll("\r", "\n"); }
function slugify(value, fallback) {
  const source = String(value || fallback);
  const result = source.toLowerCase().normalize("NFKD").replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "").slice(0, 100);
  const fallbackSlug = String(fallback || "content").toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "").slice(0, 100) || `content-${sha256(source).slice(0, 24)}`;
  // A Chinese title such as "KH_树" normalizes to the same short prefix as
  // many other titles. Use the stable fallback rather than overwriting files.
  if (/[^\x00-\x7f]/.test(source)) return fallbackSlug;
  return result || fallbackSlug;
}
function stableId(value, fallback) {
  const source = String(value || fallback);
  const normalized = source.toLowerCase().replace(/[^a-z0-9_-]+/g, "-").replace(/^-+|-+$/g, "").slice(0, 80);
  if (!normalized || /[^\x00-\x7f]/.test(source)) {
    return `content-${sha256(source).slice(0, 24)}`;
  }
  return normalized;
}
function parseList(value) {
  if (Array.isArray(value)) return value.map(String).map((item) => item.trim()).filter(Boolean);
  if (typeof value === "string") {
    try { const parsed = JSON.parse(value); return Array.isArray(parsed) ? parsed.map(String).map((item) => item.trim()).filter(Boolean) : []; } catch {}
    return value.split(",").map((item) => item.trim()).filter(Boolean);
  }
  return [];
}
function isoDate(value, fallback) {
  const date = value ? new Date(String(value)) : new Date(String(fallback || ""));
  if (!Number.isNaN(date.getTime())) return date.toISOString();
  return new Date(0).toISOString();
}
function day(value, fallback) { return isoDate(value, fallback).slice(0, 10); }
function category(value, filename) {
  const aliases = { 算法板子: "algorithm", 算法学习: "algorithm", 题解: "review", 题解复盘: "review", 专题: "collection", 专题集合: "collection", 碎碎念: "journal", 日记: "journal", 笔记: "study", 学习笔记: "study" };
  if (aliases[String(value)]) return aliases[String(value)];
  if (POST_CATEGORIES.has(String(value))) return String(value);
  if (/^(KH|ZU_)/i.test(filename)) return "algorithm";
  if (/^wp_/i.test(filename)) return "review";
  if (/^sp_/i.test(filename)) return "collection";
  if (/diary/i.test(filename)) return "journal";
  return "study";
}
function language(value) {
  const normalized = String(value || "").toLowerCase().trim();
  const aliases = { "c++": "cpp", "cxx": "cpp", "cc": "cpp", "shell": "bash", "sh": "bash", "js": "javascript", "ts": "typescript", "text": "plaintext", "plain text": "plaintext" };
  return aliases[normalized] || (LANGUAGES.has(normalized) ? normalized : "plaintext");
}

function parseArgs(argv) {
  const options = { d1: "", local: "", out: "", migration: "", report: "", previous_registry: "", apply: false };
  for (let index = 0; index < argv.length; index += 1) {
    const arg = argv[index];
    if (["--d1", "--local", "--out", "--migration", "--report", "--previous-registry"].includes(arg)) {
      const value = argv[++index];
      if (!value || value.startsWith("--")) throw new Error(`${arg} 需要一个值`);
      options[arg.slice(2).replaceAll("-", "_")] = value;
    } else if (arg === "--apply") options.apply = true;
    else if (arg === "--help" || arg === "-h") {
      console.log("用法：node scripts/merge-content.cjs --d1 <export.json> --local <content> --out <candidate> [--migration <map.json>] [--previous-registry <registry.json>] [--report <report.json>] [--apply]");
      process.exit(0);
    } else throw new Error(`未知参数：${arg}`);
  }
  if (!options.d1 || !options.local) throw new Error("必须提供 --d1 和 --local");
  return options;
}

function walkMarkdown(root, relative = "") {
  const current = path.join(root, relative);
  if (!fs.existsSync(current)) return [];
  return fs.readdirSync(current, { withFileTypes: true }).flatMap((entry) => {
    const next = path.join(relative, entry.name);
    if (entry.isSymbolicLink()) throw new Error(`本地内容不允许符号链接：${next}`);
    if (entry.isDirectory()) return walkMarkdown(root, next);
    if (!entry.isFile() || !entry.name.endsWith(".md")) return [];
    return [{ relative: next.replaceAll(path.sep, "/"), absolute: path.join(root, next), raw: fs.readFileSync(path.join(root, next), "utf8") }];
  });
}
function readMap(file) {
  if (!file || !fs.existsSync(file)) return new Map();
  const value = JSON.parse(fs.readFileSync(file, "utf8"));
  const entries = Array.isArray(value) ? value : (value.entries || []);
  return new Map(entries.map((entry) => [entry.source.replaceAll("\\", "/"), entry]));
}
function parseLocal(root) {
  const rows = [];
  for (const kind of ["post", "snippet"]) {
    const directory = kind === "post" ? "posts" : "snippets";
    for (const file of walkMarkdown(root, directory)) {
      const parsed = matter(file.raw);
      const body = normalize(parsed.content);
      rows.push({ kind, source: file.relative, file, data: parsed.data, body, bodyHash: sha256(body) });
    }
  }
  return rows;
}
function parseD1(file) {
  const value = JSON.parse(fs.readFileSync(file, "utf8"));
  const tables = value.tables || {};
  return {
    posts: (tables.posts || []).map((row) => ({ kind: "post", key: String(row.filename), row, body: normalize(row.content), bodyHash: sha256(normalize(row.content)) })),
    snippets: (tables.snippets || []).map((row) => ({ kind: "snippet", key: String(row.id), row, body: normalize(row.code), bodyHash: sha256(normalize(row.code)) })),
    problems: tables.problems || [],
  };
}
function indexPosts(rows) { return new Map(rows.map((row) => [row.source.replace(/^posts\//, "").replace(/\.md$/i, ""), row])); }
function snippetCode(localBody) {
  const match = localBody.match(/^```[^\r\n`]*\n([\s\S]*?)^```\s*$/m);
  return match ? match[1].replace(/\s+$/, "") : localBody.trim();
}

function normalizeLegacyDetails(body) {
  return body.replace(
    /<details>\s*<summary>([\s\S]*?)<\/summary>\s*([\s\S]*?)\s*<\/details>/gi,
    (_match, summary, inner) => `### ${String(summary).trim()}\n\n${String(inner).trim()}\n`,
  );
}
function normalizeMissingImages(body, sourceRoot, sourceKey, repairs) {
  return body.replace(/!\[([^\]]*)\]\(([^)\s]+)(?:\s+[^)]*)?\)/g, (match, alt, target) => {
    if (/^(?:https?:|data:|javascript:)/i.test(target)) return match;
    const relative = target.replaceAll("\\", "/").replace(/^\/+/, "");
    const candidates = [
      path.join(sourceRoot, relative),
      path.join(sourceRoot, "assets", relative),
      path.join(sourceRoot, "posts", relative),
    ];
    if (candidates.some((candidate) => fs.existsSync(candidate) && fs.statSync(candidate).isFile())) return match;
    repairs.push({ source: sourceKey, target: relative, action: "replaced-missing-image-with-text" });
    return `[原文图片缺失：${String(alt || relative).trim()}（${relative}）]`;
  });
}
function findSnippetMatch(localRows, remote) {
  const codeHash = sha256(snippetCode(remote.body));
  return localRows.find((row) => sha256(snippetCode(row.body)) === codeHash)
    || localRows.find((row) => String(row.data.title || "").trim() && String(row.data.title).trim() === String(remote.row.title).trim())
    || null;
}
function timestamp(data, fallback) { return new Date(String(data?.updatedAt || data?.updated_at || data?.date || fallback || "")).getTime() || 0; }
function choose(local, remote) {
  if (!local) return { source: "remote", reason: "remote-only" };
  if (!remote) return { source: "local", reason: "local-only" };
  if (local.bodyHash === remote.bodyHash) return { source: "local", reason: "same-body" };
  const localTime = timestamp(local.data, fs.statSync(local.file.absolute).mtime.toISOString());
  const remoteTime = timestamp(remote.row, remote.row.updated_at);
  if (localTime >= remoteTime) return { source: "local", reason: "conflict-local-newer-or-equal" };
  return { source: "remote", reason: "conflict-remote-newer" };
}
function aliases(entry, slug, kind) {
  const result = Array.isArray(entry?.proposed?.aliases) ? entry.proposed.aliases.filter(Boolean) : [];
  const old = entry?.oldUrl;
  const prefix = kind === "post" ? "/posts/" : "/snippets/";
  if (typeof old === "string" && old.startsWith(prefix) && old !== `${prefix}${slug}`) result.push(old);
  return [...new Set(result)];
}
function postDocument(local, remote, mapEntry, source, slugOverride = "", sourceRoot = process.cwd(), repairs = []) {
  const data = source === "local" ? (local?.data || {}) : {};
  const row = remote?.row || {};
  const fallbackId = stableId(data.id || row.filename, `${remote?.key || local?.source || "post"}`);
  const id = mapEntry?.targetId || (String(data.id || "").match(/^[a-z0-9][a-z0-9_-]{0,79}$/) ? data.id : fallbackId);
  const slug = slugOverride || mapEntry?.targetSlug || slugify(data.slug || row.filename || id, id);
  const updatedAt = isoDate(data.updatedAt || data.updated_at, row.updated_at || row.created_at || data.date);
  const sourceKey = remote?.key || local?.source || id;
  const raw = normalizeMissingImages(
    normalizeLegacyDetails(source === "local" ? local.body : remote.body),
    sourceRoot,
    sourceKey,
    repairs,
  );
  const value = {
    schemaVersion: 1, kind: "post", id, slug, status: "ready",
    title: String(data.title || row.title || id).slice(0, 120),
    date: day(data.date || row.date, updatedAt), updatedAt,
    category: category(data.category || row.category, local?.source || row.filename || ""),
    tags: parseList(data.tags ?? row.tags),
    description: String(data.description || data.excerpt || "").slice(0, 240),
    pinned: data.pinned === true, aliases: aliases(mapEntry, slug, "post"),
  };
  if (data.cover) value.cover = String(data.cover);
  return matter.stringify(raw.replace(/^\s+/, "\n"), value).replaceAll("\r\n", "\n");
}
function snippetDocument(local, remote, source) {
  const data = source === "local" ? (local?.data || {}) : {};
  const row = remote?.row || {};
  const localId = String(data.id || "");
  const validLocalId = /^[a-z0-9][a-z0-9_-]{0,79}$/.test(localId) ? localId : "";
  const id = validLocalId || (String(row.id || "").match(/^[a-z0-9][a-z0-9_-]{0,79}$/) ? String(row.id) : stableId(row.title, remote?.key || local?.source || "snippet"));
  const slug = slugify(data.slug || data.id || row.title || id, id);
  const lang = language(data.language || row.language);
  const code = source === "local" ? snippetCode(local.body) : remote.body.trimEnd();
  const description = String(data.description || "").slice(0, 240);
  const body = `${description ? `${description}\n\n` : ""}` + "```" + `${lang}\n${code}\n` + "```\n";
  const value = { schemaVersion: 1, kind: "snippet", id, slug, status: "ready", title: String(data.title || row.title || id).slice(0, 120), updatedAt: isoDate(data.updatedAt || data.updated_at, row.updated_at || row.created_at), tags: parseList(data.tags ?? row.tags), description, language: lang };
  return matter.stringify(body, value).replaceAll("\r\n", "\n");
}

function merge(options) {
  const localRoot = path.resolve(options.local);
  const d1 = parseD1(path.resolve(options.d1));
  const map = readMap(options.migration ? path.resolve(options.migration) : "");
  const local = parseLocal(localRoot);
  const localPosts = indexPosts(local.filter((row) => row.kind === "post"));
  const localSnippets = local.filter((row) => row.kind === "snippet");
  const report = { schemaVersion: 1, localRoot, d1Export: path.resolve(options.d1), generatedAt: new Date().toISOString(), posts: [], snippets: [], repairs: [], problems: { localCount: 0, remoteCount: d1.problems.length, mergedCount: d1.problems.length }, summary: {} };
  const postRows = [];
  const seenLocalPosts = new Set();
  for (const remote of d1.posts) {
    const localRow = localPosts.get(remote.key) || localPosts.get(path.basename(remote.key));
    const entry = map.get(`posts/${remote.key}.md`) || map.get(`posts/${remote.key}`);
    const decision = choose(localRow, remote);
    report.posts.push({ key: remote.key, local: Boolean(localRow), remote: true, localHash: localRow?.bodyHash || null, remoteHash: remote.bodyHash, state: decision.reason, chosen: decision.source, targetId: entry?.targetId || null, targetSlug: entry?.targetSlug || null });
    if (localRow) seenLocalPosts.add(localRow.source);
    postRows.push({ local: localRow, remote, entry, decision });
  }
  for (const localRow of local.filter((row) => row.kind === "post" && !seenLocalPosts.has(row.source))) {
    const key = localRow.source.replace(/^posts\//, "").replace(/\.md$/i, "");
    const entry = map.get(localRow.source);
    const decision = choose(localRow, null);
    report.posts.push({ key, local: true, remote: false, localHash: localRow.bodyHash, remoteHash: null, state: decision.reason, chosen: decision.source, targetId: entry?.targetId || null, targetSlug: entry?.targetSlug || null });
    postRows.push({ local: localRow, remote: null, entry, decision });
  }
  const usedLocalSnippets = new Set();
  const snippetRows = [];
  for (const remote of d1.snippets) {
    const localRow = findSnippetMatch(localSnippets.filter((row) => !usedLocalSnippets.has(row.source)), remote);
    if (localRow) usedLocalSnippets.add(localRow.source);
    const decision = choose(localRow, remote);
    report.snippets.push({ key: remote.key, local: Boolean(localRow), remote: true, localSource: localRow?.source || null, localHash: localRow?.bodyHash || null, remoteHash: remote.bodyHash, state: decision.reason, chosen: decision.source });
    snippetRows.push({ local: localRow, remote, decision });
  }
  for (const localRow of localSnippets.filter((row) => !usedLocalSnippets.has(row.source))) {
    const decision = choose(localRow, null);
    report.snippets.push({ key: localRow.source, local: true, remote: false, localSource: localRow.source, localHash: localRow.bodyHash, remoteHash: null, state: decision.reason, chosen: decision.source });
    snippetRows.push({ local: localRow, remote: null, decision });
  }
  report.summary = {
    posts: Object.fromEntries(["same-body", "conflict-local-newer-or-equal", "conflict-remote-newer", "local-only", "remote-only"].map((state) => [state, report.posts.filter((row) => row.state === state).length])),
    snippets: Object.fromEntries(["same-body", "conflict-local-newer-or-equal", "conflict-remote-newer", "local-only", "remote-only"].map((state) => [state, report.snippets.filter((row) => row.state === state).length])),
  };
  if (options.report) {
    fs.mkdirSync(path.dirname(path.resolve(options.report)), { recursive: true });
    fs.writeFileSync(path.resolve(options.report), `${JSON.stringify(report, null, 2)}\n`, "utf8");
  }
  if (options.apply) {
    const output = path.resolve(options.out || path.join(path.dirname(localRoot), "merged-content"));
    fs.mkdirSync(path.join(output, "posts"), { recursive: true });
    fs.mkdirSync(path.join(output, "snippets"), { recursive: true });
    fs.mkdirSync(path.join(output, "assets"), { recursive: true });
    const postSlugs = new Set();
    for (const row of postRows) {
      const chosen = row.decision.source;
      const sourceKey = row.remote?.key || row.local?.source || "post";
      let slug = row.entry?.targetSlug || slugify((chosen === "local" ? row.local.data.slug : row.remote.row.filename), stableId(sourceKey, "post"));
      while (postSlugs.has(slug)) slug = `${slug.slice(0, 92)}-${sha256(sourceKey).slice(0, 7)}`;
      postSlugs.add(slug);
      const doc = postDocument(row.local, row.remote, row.entry, chosen, slug, localRoot, report.repairs);
      fs.writeFileSync(path.join(output, "posts", `${slug}.md`), doc, "utf8");
    }
    const snippetNames = new Set();
    for (const row of snippetRows) {
      const chosen = row.decision.source;
      const doc = snippetDocument(row.local, row.remote, chosen);
      const id = String((chosen === "local" ? row.local.data.id || row.local.data.slug : row.remote.row.id) || "snippet");
      let slug = slugify(chosen === "local" ? row.local.data.slug || id : row.remote.row.title || id, stableId(id, id));
      while (snippetNames.has(slug)) slug = `${slug}-${sha256(id).slice(0, 6)}`;
      snippetNames.add(slug);
      fs.writeFileSync(path.join(output, "snippets", `${slug}.md`), doc, "utf8");
    }
    fs.writeFileSync(path.join(output, "problems.json"), `${JSON.stringify(d1.problems, null, 2)}\n`, "utf8");
    fs.writeFileSync(path.join(output, "site.json"), `${JSON.stringify({ schemaVersion: 1, siteId: "keronshans", title: "Keronshans' Blog", description: "个人技术博客", author: { name: "Keronshans" } }, null, 2)}\n`, "utf8");
    if (options.previous_registry) {
      const previous = JSON.parse(fs.readFileSync(path.resolve(options.previous_registry), "utf8"));
      if (previous.schemaVersion !== 1 || previous.siteId !== "keronshans" || !Array.isArray(previous.entries)) throw new Error("previous registry 无效");
      fs.writeFileSync(path.join(output, "content-registry.json"), `${JSON.stringify(previous, null, 2)}\n`, "utf8");
    }
    report.output = output;
    if (options.report) fs.writeFileSync(path.resolve(options.report), `${JSON.stringify(report, null, 2)}\n`, "utf8");
  }
  return report;
}

try {
  const report = merge(parseArgs(process.argv.slice(2)));
  console.log(JSON.stringify(report, null, 2));
} catch (error) {
  console.error(`[merge-content] ${error.message}`);
  process.exitCode = 2;
}
