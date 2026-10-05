const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const os = require("node:os");
const path = require("node:path");
const { spawnSync } = require("node:child_process");
const { validateMarkdown } = require("./content-contract.cjs");

const script = path.join(__dirname, "publish-content.cjs");

function run(source, out, extra = []) {
  return spawnSync(process.execPath, [script, "--source", source, "--out", out, ...extra], { encoding: "utf8" });
}

test("allow-legacy only bypasses frontmatter with no schema marker", () => {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), "keronshans-contract-"));
  const legacy = path.join(root, "legacy.md");
  const malformedV1 = path.join(root, "malformed-v1.md");
  fs.writeFileSync(legacy, "---\ntitle: Legacy\n---\nbody\n");
  fs.writeFileSync(malformedV1, "---\nschemaVersion: 1\nkind: post\nid: Broken\n---\nbody\n");
  assert.equal(validateMarkdown(legacy, "post", true).legacy, true);
  assert.throws(() => validateMarkdown(malformedV1, "post", true), /id 格式无效/);
});

test("rejects a vault without Published instead of scanning private notes", () => {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), "keronshans-publisher-"));
  fs.writeFileSync(path.join(root, "private.md"), "# private\n");
  const result = run(root, fs.mkdtempSync(path.join(os.tmpdir(), "keronshans-output-")));
  assert.notEqual(result.status, 0);
  assert.match(result.stderr, /Published 目录不存在/);
});

test("rejects a Published junction instead of following an external directory", () => {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), "keronshans-publisher-"));
  const target = fs.mkdtempSync(path.join(os.tmpdir(), "keronshans-published-"));
  for (const directory of ["posts", "snippets", "assets"]) fs.mkdirSync(path.join(target, directory));
  fs.writeFileSync(path.join(target, "site.json"), JSON.stringify({ schemaVersion: 1, siteId: "keronshans", title: "Test", description: "", author: { name: "Test" } }));
  try {
    fs.symlinkSync(target, path.join(root, "Published"), "junction");
  } catch (error) {
    if (process.platform === "win32") throw error;
    return;
  }
  const result = run(root, fs.mkdtempSync(path.join(os.tmpdir(), "keronshans-output-")));
  assert.notEqual(result.status, 0);
  assert.match(result.stderr, /Published 目录不存在或不是目录|符号链接或 junction/);
});

test("exports only the explicit Published tree", () => {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), "keronshans-publisher-"));
  const published = path.join(root, "Published");
  const out = fs.mkdtempSync(path.join(os.tmpdir(), "keronshans-output-"));
  for (const directory of ["posts", "snippets", "assets"]) fs.mkdirSync(path.join(published, directory), { recursive: true });
  fs.writeFileSync(path.join(published, "site.json"), JSON.stringify({ schemaVersion: 1, siteId: "keronshans", title: "Test", description: "", author: { name: "Test" } }));
  fs.writeFileSync(path.join(published, "posts", "ready.md"), "---\nschemaVersion: 1\nkind: post\nid: post_ready\nslug: ready\nstatus: ready\ntitle: Ready\ndate: '2026-10-03'\nupdatedAt: '2026-10-03T12:00:00+08:00'\ncategory: study\ntags: []\ndescription: ''\npinned: false\naliases: []\n---\nbody\n");
  fs.writeFileSync(path.join(root, "private.md"), "# private\n");
  const result = run(root, out);
  assert.equal(result.status, 0, result.stderr);
  assert.equal(fs.existsSync(path.join(out, "posts", "ready.md")), true);
  assert.equal(fs.existsSync(path.join(out, "private.md")), false);
  assert.equal(fs.existsSync(path.join(out, "site.json")), true);
  const verify = spawnSync(process.execPath, [path.join(__dirname, "content-verify.cjs"), out], { encoding: "utf8" });
  assert.equal(verify.status, 0, verify.stderr);
});

test("exports referenced assets and omits unreferenced assets", () => {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), "keronshans-publisher-"));
  const published = path.join(root, "Published");
  const out = fs.mkdtempSync(path.join(os.tmpdir(), "keronshans-output-"));
  for (const directory of ["posts", "snippets", "assets"]) fs.mkdirSync(path.join(published, directory), { recursive: true });
  fs.writeFileSync(path.join(published, "site.json"), JSON.stringify({ schemaVersion: 1, siteId: "keronshans", title: "Test", description: "", author: { name: "Test" } }));
  fs.writeFileSync(path.join(published, "assets", "used.png"), Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]));
  fs.writeFileSync(path.join(published, "assets", "unused.png"), Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]));
  fs.writeFileSync(path.join(published, "posts", "ready.md"), "---\nschemaVersion: 1\nkind: post\nid: post_ready\nslug: ready\nstatus: ready\ntitle: Ready\ndate: '2026-10-03'\nupdatedAt: '2026-10-03T12:00:00+08:00'\ncategory: study\ntags: []\ndescription: ''\npinned: false\naliases: []\n---\n![used](assets/used.png)\n```md\n![code-example](assets/unused.png)\n```\n");
  const result = run(root, out);
  assert.equal(result.status, 0, result.stderr);
  assert.equal(fs.existsSync(path.join(out, "assets", "used.png")), true);
  assert.equal(fs.existsSync(path.join(out, "assets", "unused.png")), false);
});

test("fails when a ready document references a missing asset", () => {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), "keronshans-publisher-"));
  const published = path.join(root, "Published");
  const out = fs.mkdtempSync(path.join(os.tmpdir(), "keronshans-output-"));
  for (const directory of ["posts", "snippets", "assets"]) fs.mkdirSync(path.join(published, directory), { recursive: true });
  fs.writeFileSync(path.join(published, "site.json"), JSON.stringify({ schemaVersion: 1, siteId: "keronshans", title: "Test", description: "", author: { name: "Test" } }));
  fs.writeFileSync(path.join(published, "posts", "ready.md"), "---\nschemaVersion: 1\nkind: post\nid: post_ready\nslug: ready\nstatus: ready\ntitle: Ready\ndate: '2026-10-03'\nupdatedAt: '2026-10-03T12:00:00+08:00'\ncategory: study\ntags: []\ndescription: ''\npinned: false\naliases: []\n---\n![missing](assets/missing.png)\n");
  const result = run(root, out);
  assert.notEqual(result.status, 0);
  assert.match(result.stderr, /图片引用不存在或未登记/);
});

test("rejects an asset whose extension does not match its file signature", () => {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), "keronshans-publisher-"));
  const published = path.join(root, "Published");
  const out = fs.mkdtempSync(path.join(os.tmpdir(), "keronshans-output-"));
  for (const directory of ["posts", "snippets", "assets"]) fs.mkdirSync(path.join(published, directory), { recursive: true });
  fs.writeFileSync(path.join(published, "site.json"), JSON.stringify({ schemaVersion: 1, siteId: "keronshans", title: "Test", description: "", author: { name: "Test" } }));
  fs.writeFileSync(path.join(published, "assets", "bad.png"), "not an image");
  fs.writeFileSync(path.join(published, "posts", "ready.md"), "---\nschemaVersion: 1\nkind: post\nid: post_ready\nslug: ready\nstatus: ready\ntitle: Ready\ndate: '2026-10-03'\nupdatedAt: '2026-10-03T12:00:00+08:00'\ncategory: study\ntags: []\ndescription: ''\npinned: false\naliases: []\n---\n![bad](assets/bad.png)\n");
  const result = run(root, out);
  assert.notEqual(result.status, 0);
  assert.match(result.stderr, /文件签名与扩展名不匹配/);
});

test("rejects an image containing sensitive location metadata markers", () => {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), "keronshans-publisher-"));
  const published = path.join(root, "Published");
  const out = fs.mkdtempSync(path.join(os.tmpdir(), "keronshans-output-"));
  for (const directory of ["posts", "snippets", "assets"]) fs.mkdirSync(path.join(published, directory), { recursive: true });
  fs.writeFileSync(path.join(published, "site.json"), JSON.stringify({ schemaVersion: 1, siteId: "keronshans", title: "Test", description: "", author: { name: "Test" } }));
  fs.writeFileSync(path.join(published, "assets", "gps.png"), Buffer.concat([Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]), Buffer.from("GPSLatitude") ]));
  fs.writeFileSync(path.join(published, "posts", "ready.md"), "---\nschemaVersion: 1\nkind: post\nid: post_ready\nslug: ready\nstatus: ready\ntitle: Ready\ndate: '2026-10-03'\nupdatedAt: '2026-10-03T12:00:00+08:00'\ncategory: study\ntags: []\ndescription: ''\npinned: false\naliases: []\n---\n![gps](assets/gps.png)\n");
  const result = run(root, out);
  assert.notEqual(result.status, 0);
  assert.match(result.stderr, /敏感位置元数据/);
});

test("rejects unsafe markdown link protocols", () => {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), "keronshans-publisher-"));
  const published = path.join(root, "Published");
  const out = fs.mkdtempSync(path.join(os.tmpdir(), "keronshans-output-"));
  for (const directory of ["posts", "snippets", "assets"]) fs.mkdirSync(path.join(published, directory), { recursive: true });
  fs.writeFileSync(path.join(published, "site.json"), JSON.stringify({ schemaVersion: 1, siteId: "keronshans", title: "Test", description: "", author: { name: "Test" } }));
  fs.writeFileSync(path.join(published, "posts", "ready.md"), "---\nschemaVersion: 1\nkind: post\nid: post_ready\nslug: ready\nstatus: ready\ntitle: Ready\ndate: '2026-10-03'\nupdatedAt: '2026-10-03T12:00:00+08:00'\ncategory: study\ntags: []\ndescription: ''\npinned: false\naliases: []\n---\n[unsafe](javascript:alert(1))\n");
  const result = run(root, out);
  assert.notEqual(result.status, 0);
  assert.match(result.stderr, /链接协议不受支持/);
});

test("drafts are excluded from the registry and manifest", () => {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), "keronshans-publisher-"));
  const published = path.join(root, "Published");
  const out = fs.mkdtempSync(path.join(os.tmpdir(), "keronshans-output-"));
  for (const directory of ["posts", "snippets", "assets"]) fs.mkdirSync(path.join(published, directory), { recursive: true });
  fs.writeFileSync(path.join(published, "site.json"), JSON.stringify({ schemaVersion: 1, siteId: "keronshans", title: "Test", description: "", author: { name: "Test" } }));
  const frontmatter = (status, id, slug) => `---\nschemaVersion: 1\nkind: post\nid: ${id}\nslug: ${slug}\nstatus: ${status}\ntitle: ${id}\ndate: '2026-10-03'\nupdatedAt: '2026-10-03T12:00:00+08:00'\ncategory: study\ntags: []\ndescription: ''\npinned: false\naliases: []\n---\nbody\n`;
  fs.writeFileSync(path.join(published, "posts", "ready.md"), frontmatter("ready", "post_ready", "ready"));
  fs.writeFileSync(path.join(published, "posts", "draft.md"), frontmatter("draft", "post_draft", "draft"));
  const result = run(root, out);
  assert.equal(result.status, 0, result.stderr);
  const manifest = JSON.parse(fs.readFileSync(path.join(out, "content-manifest.json"), "utf8"));
  const registry = JSON.parse(fs.readFileSync(path.join(out, "content-registry.json"), "utf8"));
  assert.equal(fs.existsSync(path.join(out, "posts", "draft.md")), false);
  assert.equal(manifest.files.some((file) => file.path.endsWith("draft.md")), false);
  assert.deepEqual(registry.entries.map((entry) => entry.id), ["post_ready"]);
});

test("duplicate IDs fail before output is changed", () => {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), "keronshans-publisher-"));
  const published = path.join(root, "Published");
  const out = fs.mkdtempSync(path.join(os.tmpdir(), "keronshans-output-"));
  for (const directory of ["posts", "snippets", "assets"]) fs.mkdirSync(path.join(published, directory), { recursive: true });
  fs.writeFileSync(path.join(published, "site.json"), JSON.stringify({ schemaVersion: 1, siteId: "keronshans", title: "Test", description: "", author: { name: "Test" } }));
  const body = "---\nschemaVersion: 1\nkind: post\nid: post_same\nslug: one\nstatus: ready\ntitle: One\ndate: '2026-10-03'\nupdatedAt: '2026-10-03T12:00:00+08:00'\ncategory: study\ntags: []\ndescription: ''\npinned: false\naliases: []\n---\nbody\n";
  fs.writeFileSync(path.join(published, "posts", "one.md"), body);
  fs.writeFileSync(path.join(published, "posts", "two.md"), body.replace("slug: one", "slug: two"));
  fs.writeFileSync(path.join(out, "sentinel.txt"), "keep");
  const result = run(root, out);
  assert.notEqual(result.status, 0);
  assert.equal(fs.readFileSync(path.join(out, "sentinel.txt"), "utf8"), "keep");
});

test("expectedParentSha conflict leaves the existing output unchanged", () => {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), "keronshans-publisher-"));
  const published = path.join(root, "Published");
  const out = fs.mkdtempSync(path.join(os.tmpdir(), "keronshans-output-"));
  for (const directory of ["posts", "snippets", "assets"]) fs.mkdirSync(path.join(published, directory), { recursive: true });
  fs.writeFileSync(path.join(published, "site.json"), JSON.stringify({ schemaVersion: 1, siteId: "keronshans", title: "Test", description: "", author: { name: "Test" } }));
  fs.writeFileSync(path.join(published, "posts", "ready.md"), "---\nschemaVersion: 1\nkind: post\nid: post_ready\nslug: ready\nstatus: ready\ntitle: Ready\ndate: '2026-10-03'\nupdatedAt: '2026-10-03T12:00:00+08:00'\ncategory: study\ntags: []\ndescription: ''\npinned: false\naliases: []\n---\nbody\n");
  fs.writeFileSync(path.join(out, "sentinel.txt"), "keep");
  spawnSync("git", ["-C", out, "init", "-q"], { encoding: "utf8" });
  spawnSync("git", ["-C", out, "config", "user.email", "test@example.invalid"], { encoding: "utf8" });
  spawnSync("git", ["-C", out, "config", "user.name", "Publisher Test"], { encoding: "utf8" });
  spawnSync("git", ["-C", out, "add", "sentinel.txt"], { encoding: "utf8" });
  spawnSync("git", ["-C", out, "commit", "-qm", "baseline"], { encoding: "utf8" });
  const result = run(root, out, ["--expected-parent-sha", "0000000000000000000000000000000000000000"]);
  assert.notEqual(result.status, 0);
  assert.match(result.stderr, /内容仓库基线发生变化/);
  assert.equal(fs.readFileSync(path.join(out, "sentinel.txt"), "utf8"), "keep");
});

test("withdrawals require a matching removal digest and dry-run reports it", () => {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), "keronshans-publisher-"));
  const published = path.join(root, "Published");
  const out = fs.mkdtempSync(path.join(os.tmpdir(), "keronshans-output-"));
  for (const directory of ["posts", "snippets", "assets"]) fs.mkdirSync(path.join(published, directory), { recursive: true });
  fs.writeFileSync(path.join(published, "site.json"), JSON.stringify({ schemaVersion: 1, siteId: "keronshans", title: "Test", description: "", author: { name: "Test" } }));
  const frontmatter = "---\nschemaVersion: 1\nkind: post\nid: post_old\nslug: old\nstatus: ready\ntitle: Old\ndate: '2026-10-03'\nupdatedAt: '2026-10-03T12:00:00+08:00'\ncategory: study\ntags: []\ndescription: ''\npinned: false\naliases: []\n---\nbody\n";
  fs.writeFileSync(path.join(published, "posts", "old.md"), frontmatter);
  const first = run(root, out);
  assert.equal(first.status, 0, first.stderr);
  fs.rmSync(path.join(published, "posts", "old.md"));
  const dryRun = run(root, out, ["--dry-run"]);
  assert.equal(dryRun.status, 0, dryRun.stderr);
  const summary = JSON.parse(dryRun.stdout);
  assert.deepEqual(summary.removedIds, ["post_old"]);
  assert.match(summary.removalDigest, /^[a-f0-9]{64}$/);
  const rejected = run(root, out, ["--allow-empty"]);
  assert.notEqual(rejected.status, 0);
  assert.match(rejected.stderr, /必须先 dry-run 并使用 --accept-removals/);
  const accepted = run(root, out, ["--allow-empty", "--accept-removals", summary.removalDigest]);
  assert.equal(accepted.status, 0, accepted.stderr);
  const registry = JSON.parse(fs.readFileSync(path.join(out, "content-registry.json"), "utf8"));
  assert.equal(registry.entries.find((entry) => entry.id === "post_old").state, "withdrawn");
});

test("slug changes preserve the previous canonical route as an alias", () => {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), "keronshans-publisher-"));
  const published = path.join(root, "Published");
  const out = fs.mkdtempSync(path.join(os.tmpdir(), "keronshans-output-"));
  for (const directory of ["posts", "snippets", "assets"]) fs.mkdirSync(path.join(published, directory), { recursive: true });
  fs.writeFileSync(path.join(published, "site.json"), JSON.stringify({ schemaVersion: 1, siteId: "keronshans", title: "Test", description: "", author: { name: "Test" } }));
  const frontmatter = (slug) => `---\nschemaVersion: 1\nkind: post\nid: post_stable\nslug: ${slug}\nstatus: ready\ntitle: Stable\ndate: '2026-10-03'\nupdatedAt: '2026-10-03T12:00:00+08:00'\ncategory: study\ntags: []\ndescription: ''\npinned: false\naliases: []\n---\nbody\n`;
  fs.writeFileSync(path.join(published, "posts", "stable.md"), frontmatter("old-slug"));
  let result = run(root, out);
  assert.equal(result.status, 0, result.stderr);
  fs.writeFileSync(path.join(published, "posts", "stable.md"), frontmatter("new-slug"));
  result = run(root, out);
  assert.equal(result.status, 0, result.stderr);
  const registry = JSON.parse(fs.readFileSync(path.join(out, "content-registry.json"), "utf8"));
  const entry = registry.entries.find((item) => item.id === "post_stable");
  assert.equal(entry.canonicalPath, "/posts/new-slug");
  assert.deepEqual(entry.aliases, ["/posts/old-slug"]);
});
