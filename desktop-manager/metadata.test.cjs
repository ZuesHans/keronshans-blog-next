const test = require("node:test");
const assert = require("node:assert/strict");
const path = require("node:path");
const {
  inferMarkdownKindFromData,
  normalizeCategory,
  normalizeDescription,
  parseCategory,
  postSummary,
} = require("./metadata.cjs");

test("normalizes legacy categories to the current site taxonomy", () => {
  assert.equal(normalizeCategory("算法板子"), "算法学习");
  assert.equal(normalizeCategory("专题训练"), "专题集合");
  assert.equal(parseCategory("wp_round.md", {}), "题目复盘");
});

test("description alone does not turn a post into a snippet", () => {
  const filePath = path.join("workspace", "articles", "network-flow.md");
  assert.equal(inferMarkdownKindFromData(filePath, { description: "网络流学习笔记" }), "post");
  assert.equal(inferMarkdownKindFromData(filePath, { language: "C++" }), "snippet");
});

test("normalizes and limits descriptions for homepage cards", () => {
  const longText = `  第一行\n第二行 ${"a".repeat(260)}  `;
  const description = normalizeDescription(longText);
  assert.equal(description.startsWith("第一行 第二行"), true);
  assert.equal(description.length, 240);
});

test("post summary prefers the handwritten description", () => {
  assert.equal(postSummary("手写摘要", "# 正文标题\n正文内容"), "手写摘要");
  assert.equal(postSummary("", "# 正文标题\n正文内容"), "正文标题 正文内容");
});
