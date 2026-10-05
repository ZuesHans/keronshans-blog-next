const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const os = require("node:os");
const path = require("node:path");
const { buildSearchIndex } = require("./build-search-index.cjs");

test("search index is deterministic and bound to snapshotDigest", () => {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), "keronshans-search-"));
  fs.mkdirSync(path.join(root, "posts", "nested"), { recursive: true });
  fs.writeFileSync(path.join(root, "content-manifest.json"), JSON.stringify({ schemaVersion: 1, siteId: "keronshans", snapshotDigest: "a".repeat(64) }));
  const frontmatter = (id, status = "ready") => `---\nschemaVersion: 1\nkind: post\nid: ${id}\nslug: ${id}\nstatus: ${status}\ntitle: ${id}\ndate: '2026-10-03'\nupdatedAt: '2026-10-03T12:00:00+08:00'\ncategory: study\ntags: []\ndescription: ''\npinned: false\naliases: []\n---\n# ${id}\nBody\n`;
  fs.writeFileSync(path.join(root, "posts", "nested", "ready.md"), frontmatter("post_ready"));
  fs.writeFileSync(path.join(root, "posts", "draft.md"), frontmatter("post_draft", "draft"));
  const first = buildSearchIndex(root);
  const second = buildSearchIndex(root);
  assert.equal(first.bytes, second.bytes);
  assert.equal(first.searchDigest, second.searchDigest);
  assert.equal(first.value.snapshotDigest, "a".repeat(64));
  assert.deepEqual(first.value.documents.map((document) => document.id), ["post_ready"]);
});
