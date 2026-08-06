const fs = require("fs");
const path = require("path");
const matter = require("gray-matter");

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

function updateMarkdownFile(filePath, patch) {
  if (!fs.existsSync(filePath)) throw new Error(`File not found: ${filePath}`);
  const parsed = matter(fs.readFileSync(filePath, "utf-8"));
  writeMarkdown(filePath, { ...parsed.data, ...patch }, parsed.content);
}

module.exports = {
  updateMarkdownFile,
  writeFileAtomic,
  writeMarkdown,
};
