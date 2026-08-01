import assert from "node:assert/strict";
import test from "node:test";
import {
  getSearchKeywords,
  normalizeSearchContent,
  normalizeSearchQuery,
  searchDocuments,
  type SearchDocument,
} from "./search.ts";

function document(overrides: Partial<SearchDocument>): SearchDocument {
  return {
    id: "post",
    url: "/posts/post",
    title: "测试文章",
    content: "",
    date: "2026-07-31",
    tags: [],
    category: "算法学习",
    updatedAt: "2026-07-31T00:00:00.000Z",
    ...overrides,
  };
}

test("empty queries return no results and input is capped at 80 characters", () => {
  assert.deepEqual(searchDocuments([document({})], "   "), []);
  assert.equal(normalizeSearchQuery("a".repeat(100)).length, 80);
});

test("search is case insensitive for English and preserves the displayed text", () => {
  const results = searchDocuments(
    [document({ title: "PushDown 与线段树", content: "Lazy propagation" })],
    "pushdown",
  );

  assert.equal(results.length, 1);
  assert.deepEqual(
    results[0].titleParts.filter((part) => part.highlighted).map((part) => part.text),
    ["PushDown"],
  );
});

test("multiple keywords rank by included keywords and then total hits", () => {
  const results = searchDocuments(
    [
      document({ id: "one", title: "线段树", content: "线段树基础" }),
      document({ id: "two", title: "区间数据结构", content: "线段树需要 pushdown，pushdown 很重要" }),
      document({ id: "three", title: "另一篇", content: "pushdown" }),
    ],
    "线段树 pushdown",
  );

  assert.deepEqual(results.map((result) => result.document.id), ["two", "one", "three"]);
  assert.equal(results[0].includedKeywordCount, 2);
  assert.equal(results[0].hitCount, 3);
});

test("equal matches keep the source order supplied by the newest-first index", () => {
  const results = searchDocuments(
    [
      document({ id: "newer", content: "线段树" }),
      document({ id: "older", content: "线段树" }),
    ],
    "线段树",
  );

  assert.deepEqual(results.map((result) => result.document.id), ["newer", "older"]);
});

test("content results expose one bounded context slice with safe highlight parts", () => {
  const content = `${"前".repeat(40)}线段树${"后".repeat(140)}`;
  const [result] = searchDocuments([document({ content })], "线段树");

  assert.equal(result.snippetHasLeadingEllipsis, true);
  assert.equal(result.snippetHasTrailingEllipsis, true);
  assert.equal(result.snippetParts.filter((part) => part.highlighted)[0].text, "线段树");
  assert.ok(result.snippetParts.map((part) => part.text).join("").length <= 120);
});

test("overlapping keywords prefer the longest visible highlight without duplicate markup", () => {
  const [result] = searchDocuments([document({ title: "线段树", content: "" })], "线段 线段树");
  const highlighted = result.titleParts.filter((part) => part.highlighted);

  assert.equal(result.includedKeywordCount, 2);
  assert.deepEqual(highlighted.map((part) => part.text), ["线段树"]);
});

test("literal special characters are searched without regular expressions", () => {
  const [result] = searchDocuments([document({ title: "C++ 常用模板" })], "c++");
  assert.equal(result.titleParts.find((part) => part.highlighted)?.text, "C++");
  assert.deepEqual(getSearchKeywords(" C++  C++ "), ["c++"]);
});

test("markdown normalization removes presentation syntax but retains fenced code", () => {
  const normalized = normalizeSearchContent(`
# 标题

[线段树资料](https://example.com) 和 **重点**

\`\`\`cpp
vector<int> tree;
if (value < limit) pushdown();
\`\`\`
`);

  assert.equal(normalized.includes("```"), false);
  assert.equal(normalized.includes("https://example.com"), false);
  assert.equal(normalized.includes("线段树资料 和 重点"), true);
  assert.equal(normalized.includes("vector<int> tree;"), true);
  assert.equal(normalized.includes("pushdown();"), true);
});
