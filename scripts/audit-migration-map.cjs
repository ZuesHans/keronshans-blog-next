#!/usr/bin/env node

const fs = require("node:fs");
const path = require("node:path");
const crypto = require("node:crypto");

function sha256(buffer) {
  return crypto.createHash("sha256").update(buffer).digest("hex");
}

function parseArgs(argv) {
  const options = { map: "output/migration-map.json", source: "", allowUnresolved: false };
  for (let index = 0; index < argv.length; index += 1) {
    const arg = argv[index];
    if (arg === "--map" || arg === "--source") {
      const value = argv[++index];
      if (!value || value.startsWith("--")) throw new Error(`${arg} 需要一个值`);
      options[arg.slice(2)] = value;
    } else if (arg === "--allow-unresolved") {
      options.allowUnresolved = true;
    } else if (arg === "--help" || arg === "-h") {
      console.log("用法：node scripts/audit-migration-map.cjs [--map <migration-map.json>] [--source <content-root>] [--allow-unresolved]");
      process.exit(0);
    } else {
      throw new Error(`未知参数：${arg}`);
    }
  }
  return options;
}

function fail(message) {
  throw new Error(message);
}

function audit(options) {
  const mapPath = path.resolve(options.map);
  if (!fs.existsSync(mapPath)) fail(`migration-map 不存在：${mapPath}`);
  let map;
  try { map = JSON.parse(fs.readFileSync(mapPath, "utf8")); } catch (error) { fail(`migration-map 不是有效 JSON：${error.message}`); }
  if (map.schemaVersion !== 1 || !Array.isArray(map.entries)) fail("migration-map schema 无效");

  const ids = new Set();
  const routes = new Set();
  const unresolved = [];
  const conflicts = [];
  const statuses = new Set(["approved", "migrated", "draft", "needs-review", "conflict"]);
  const sourceRoot = options.source ? path.resolve(options.source) : null;

  for (const [index, entry] of map.entries.entries()) {
    const label = `entries[${index}]`;
    for (const key of ["kind", "source", "sourceKey", "oldUrl", "targetId", "targetSlug", "contentHash", "conflictStatus"]) {
      if (typeof entry[key] !== "string" || !entry[key].trim()) fail(`${label}.${key} 缺失`);
    }
    if (!new Set(["post", "snippet"]).has(entry.kind)) fail(`${label}.kind 无效：${entry.kind}`);
    if (!/^[a-z0-9][a-z0-9_-]{0,79}$/.test(entry.targetId)) fail(`${label}.targetId 无效：${entry.targetId}`);
    if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(entry.targetSlug) || entry.targetSlug.length > 100) fail(`${label}.targetSlug 无效：${entry.targetSlug}`);
    if (!/^\/(?:posts|templates|snippets)\/[^/\\?#\s\u0000-\u001f]+$/.test(entry.oldUrl) || entry.oldUrl.endsWith("/..") || entry.oldUrl.endsWith("/.")) fail(`${label}.oldUrl 无效：${entry.oldUrl}`);
    if (!/^[a-f0-9]{64}$/.test(entry.contentHash)) fail(`${label}.contentHash 无效：${entry.contentHash}`);
    if (!statuses.has(entry.conflictStatus)) fail(`${label}.conflictStatus 无效：${entry.conflictStatus}`);
    if (ids.has(entry.targetId)) conflicts.push(`${label} 重复 targetId ${entry.targetId}`);
    ids.add(entry.targetId);
    const route = `${entry.kind}:${entry.targetSlug}`;
    if (routes.has(route)) conflicts.push(`${label} 重复 targetSlug ${route}`);
    routes.add(route);
    if (["needs-review", "conflict"].includes(entry.conflictStatus)) unresolved.push({ source: entry.source, status: entry.conflictStatus });

    if (sourceRoot) {
      const absolute = path.resolve(sourceRoot, entry.source);
      const relative = path.relative(sourceRoot, absolute);
      if (!relative || relative.startsWith("..") || path.isAbsolute(relative)) fail(`${label}.source 越界：${entry.source}`);
      if (!fs.existsSync(absolute) || !fs.statSync(absolute).isFile()) fail(`${label}.source 不存在：${entry.source}`);
      const digest = sha256(fs.readFileSync(absolute));
      if (digest !== entry.contentHash) fail(`${label}.contentHash 不匹配：${entry.source}`);
    }
  }

  if (conflicts.length) fail(conflicts.join("；"));
  const result = { ok: unresolved.length === 0 || options.allowUnresolved, map: mapPath, entries: map.entries.length, unresolved: unresolved.length, statuses: Object.fromEntries([...statuses].map((status) => [status, map.entries.filter((entry) => entry.conflictStatus === status).length])) };
  console.log(JSON.stringify(result, null, 2));
  if (unresolved.length > 0 && !options.allowUnresolved) {
    throw new Error(`migration-map 仍有 ${unresolved.length} 条未决记录；必须逐条确认后再进入 G1 退出门禁`);
  }
  return result;
}

try {
  audit(parseArgs(process.argv.slice(2)));
} catch (error) {
  console.error(`[migration-map] ${error.message}`);
  process.exitCode = 2;
}
