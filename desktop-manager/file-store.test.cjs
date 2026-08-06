const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const os = require("node:os");
const path = require("node:path");
const matter = require("gray-matter");
const { updateMarkdownFile, writeMarkdown } = require("./file-store.cjs");

test("updates description atomically without changing article content", (t) => {
  const directory = fs.mkdtempSync(path.join(os.tmpdir(), "blog-manager-"));
  t.after(() => fs.rmSync(directory, { recursive: true, force: true }));
  const filePath = path.join(directory, "sample.md");
  const body = "# 标题\n\n正文里的公式 $a+b$ 和代码保持不变。\n";

  writeMarkdown(filePath, {
    title: "测试文章",
    category: "算法学习",
    description: "原始摘要",
    tags: ["测试"],
  }, body);
  updateMarkdownFile(filePath, { description: "更新后的手写摘要" });

  const parsed = matter(fs.readFileSync(filePath, "utf-8"));
  assert.equal(parsed.data.description, "更新后的手写摘要");
  assert.deepEqual(parsed.data.tags, ["测试"]);
  assert.equal(parsed.content, body);
  assert.deepEqual(fs.readdirSync(directory).filter((name) => name.endsWith(".tmp")), []);
});
