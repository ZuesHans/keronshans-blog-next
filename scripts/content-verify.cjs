#!/usr/bin/env node

const fs = require("node:fs");
const path = require("node:path");
const { sha256, jcs, validatePublishedRoot } = require("./content-contract.cjs");

function walk(root, relative = "") {
  const directory = path.join(root, relative);
  if (!fs.existsSync(directory)) return [];
  return fs.readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
    const next = path.join(relative, entry.name);
    if (entry.isSymbolicLink()) throw new Error(`manifest 输出不允许符号链接：${next}`);
    if (entry.isDirectory() && entry.name === ".git") return [];
    return entry.isDirectory() ? walk(root, next) : [next.replaceAll("\\", "/")];
  });
}

function verifyContent(root) {
  const manifestPath = path.join(root, "content-manifest.json");
  if (!fs.existsSync(manifestPath)) throw new Error(`缺少 content-manifest.json：${root}`);
  const manifest = JSON.parse(fs.readFileSync(manifestPath, "utf8"));
  if (manifest.schemaVersion !== 1 || manifest.siteId !== "keronshans" || !Array.isArray(manifest.files)) throw new Error("manifest schema 无效");
  const expected = new Map();
  for (const file of manifest.files) {
    if (typeof file.path !== "string" || file.path.startsWith("/") || file.path.includes("\\") || file.path.split("/").some((segment) => !segment || segment === "." || segment === "..") || expected.has(file.path)) throw new Error("Invalid or duplicate manifest path");
    if (!Number.isInteger(file.size) || file.size < 0 || !/^[a-f0-9]{64}$/.test(file.sha256)) throw new Error("Invalid manifest file hash/size");
    expected.set(file.path, file);
  }
  const allowedSidecars = new Set(["content-manifest.json", ".content-export.json", "README.md", ".gitattributes", ".gitignore"]);
  const actual = walk(root).filter((file) => !allowedSidecars.has(file));
  for (const file of actual) {
    const expectedFile = expected.get(file);
    if (!expectedFile) throw new Error(`manifest 漏列文件：${file}`);
    const buffer = fs.readFileSync(path.join(root, file));
    if (buffer.length !== expectedFile.size || sha256(buffer) !== expectedFile.sha256) throw new Error(`manifest hash/size 不匹配：${file}`);
  }
  for (const file of expected.keys()) if (!actual.includes(file)) throw new Error(`manifest 包含不存在文件：${file}`);
  const core = { schemaVersion: manifest.schemaVersion, siteId: manifest.siteId, files: [...manifest.files].sort((a, b) => a.path.localeCompare(b.path)) };
  const digest = sha256(jcs(core));
  if (digest !== manifest.snapshotDigest) throw new Error(`snapshotDigest 不匹配：${manifest.snapshotDigest} != ${digest}`);
  const contract = validatePublishedRoot(root);
  if (contract.manifest.snapshotDigest !== manifest.snapshotDigest) throw new Error("Manifest disagrees with content schema, registry or referenced assets");
  return { ok: true, siteId: manifest.siteId, files: actual.length, snapshotDigest: digest };
}

if (require.main === module) {
  try { console.log(JSON.stringify(verifyContent(path.resolve(process.argv[2] || ".content")), null, 2)); }
  catch (error) { console.error(`[content-verify] ${error.message}`); process.exitCode = 8; }
}
module.exports = { verifyContent };
