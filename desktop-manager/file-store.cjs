const fs = require("fs");
const path = require("path");
const matter = require("gray-matter");
const { createHash, randomUUID } = require("node:crypto");

function revisionOf(content) {
  return createHash("sha256").update(content).digest("hex");
}

function assertRevision(content, expectedRevision) {
  if (expectedRevision !== undefined && revisionOf(content) !== expectedRevision) {
    throw new Error("文件已被其他程序修改。请先保留草稿并重新载入文件，再合并修改；本次未覆盖磁盘内容。");
  }
}

function backupFile(filePath, backupRoot, content) {
  if (!backupRoot) return;
  const directory = path.join(backupRoot, revisionOf(path.resolve(filePath)));
  fs.mkdirSync(directory, { recursive: true });
  writeFileAtomic(path.join(directory, `${Date.now()}-${randomUUID()}.json`), JSON.stringify({ path: filePath, content, time: new Date().toISOString() }));
  const files = fs.readdirSync(directory).filter((name) => name.endsWith(".json")).sort().reverse();
  files.slice(20).forEach((name) => fs.unlinkSync(path.join(directory, name)));
}

function readHistory(filePath, backupRoot) {
  const directory = path.join(backupRoot, revisionOf(path.resolve(filePath)));
  if (!fs.existsSync(directory)) return [];
  return fs.readdirSync(directory).filter((name) => name.endsWith(".json")).sort().reverse()
    .map((name) => JSON.parse(fs.readFileSync(path.join(directory, name), "utf8")));
}

function writeFileAtomic(filePath, content) {
  fs.mkdirSync(path.dirname(filePath), { recursive: true });
  const temporaryPath = path.join(
    path.dirname(filePath),
    `.${path.basename(filePath)}.${process.pid}.${Date.now()}.tmp`
  );
  try {
    fs.writeFileSync(temporaryPath, content, "utf-8");
    fs.renameSync(temporaryPath, filePath);
  } finally {
    if (fs.existsSync(temporaryPath)) fs.rmSync(temporaryPath, { force: true });
  }
}

function writeMarkdown(filePath, data, content) {
  const next = matter.stringify(String(content || "").replace(/^\n+/, ""), data);
  writeFileAtomic(filePath, next);
}

function updateMarkdownFile(filePath, patch, options = {}) {
  if (!fs.existsSync(filePath)) throw new Error(`File not found: ${filePath}`);
  const raw = fs.readFileSync(filePath, "utf-8");
  assertRevision(raw, options.expectedRevision);
  const parsed = matter(raw);
  backupFile(filePath, options.backupRoot, raw);
  writeMarkdown(filePath, { ...parsed.data, ...patch }, options.body === undefined ? parsed.content : options.body);
}

module.exports = {
  updateMarkdownFile,
  writeFileAtomic,
  writeMarkdown,
  revisionOf,
  assertRevision,
  backupFile,
  readHistory,
};
