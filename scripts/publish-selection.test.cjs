const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const os = require("node:os");
const path = require("node:path");
const { spawnSync } = require("node:child_process");

const script = path.join(__dirname, "publish-selection.cjs");
const png = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);

function run(file, out, extra = []) {
  return spawnSync(process.execPath, [script, "--file", file, "--out", out, ...extra], { encoding: "utf8" });
}

function post(id, slug, body) {
  return `---\nschemaVersion: 1\nkind: post\nid: ${id}\nslug: ${slug}\nstatus: ready\ntitle: ${slug}\ndate: '2026-10-03'\nupdatedAt: '2026-10-03T12:00:00+08:00'\ncategory: study\ntags: []\ndescription: ''\npinned: false\naliases: []\n---\n${body}\n`;
}

function initGit(directory) {
  for (const args of [["init", "-q"], ["config", "user.email", "test@example.invalid"], ["config", "user.name", "Selection Test"]]) {
    assert.equal(spawnSync("git", ["-C", directory, ...args], { encoding: "utf8" }).status, 0);
  }
  fs.writeFileSync(path.join(directory, "README.md"), "content repo\n");
  for (const args of [["add", "README.md"], ["commit", "-qm", "baseline"]]) assert.equal(spawnSync("git", ["-C", directory, ...args], { encoding: "utf8" }).status, 0);
}

test("publishes a selected article and only its referenced local images", (t) => {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), "selection-publish-"));
  t.after(() => fs.rmSync(root, { recursive: true, force: true }));
  const workspace = path.join(root, "notes");
  const articleDir = path.join(workspace, "算法");
  const out = path.join(root, "content");
  fs.mkdirSync(path.join(articleDir, "images"), { recursive: true });
  fs.mkdirSync(out);
  fs.writeFileSync(path.join(articleDir, "images", "used.png"), png);
  fs.writeFileSync(path.join(articleDir, "images", "unused.png"), png);
  const file = path.join(articleDir, "二分.md");
  fs.writeFileSync(file, post("post_binary", "binary-search", "![图](images/used.png)\n\n正文。"));
  initGit(out);

  const preview = run(file, out, ["--dry-run"]);
  assert.equal(preview.status, 0, preview.stderr);
  const summary = JSON.parse(preview.stdout);
  assert.equal(summary.mode, "dry-run");
  assert.deepEqual(summary.referencedAssets, ["assets/articles/post_binary/images/used.png"]);
  assert.equal(summary.changedFiles.some((item) => item.path.includes("unused")), false);
  assert.equal(fs.existsSync(path.join(out, "posts", "binary-search.md")), false);

  const published = run(file, out, ["--commit"]);
  assert.equal(published.status, 0, published.stderr);
  assert.equal(fs.existsSync(path.join(out, "posts", "binary-search.md")), true);
  assert.equal(fs.existsSync(path.join(out, "assets", "articles", "post_binary", "images", "used.png")), true);
  assert.equal(fs.existsSync(path.join(out, "assets", "articles", "post_binary", "images", "unused.png")), false);
  assert.match(fs.readFileSync(path.join(out, "posts", "binary-search.md"), "utf8"), /\/assets\/articles\/post_binary\/images\/used\.png/);
});

test("a one-character revision does not rewrite unchanged assets", (t) => {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), "selection-revision-"));
  t.after(() => fs.rmSync(root, { recursive: true, force: true }));
  const workspace = path.join(root, "notes");
  const articleDir = path.join(workspace, "draft");
  const out = path.join(root, "content");
  fs.mkdirSync(path.join(articleDir, "images"), { recursive: true });
  fs.mkdirSync(out);
  const image = path.join(articleDir, "images", "diagram.png");
  fs.writeFileSync(image, png);
  const file = path.join(articleDir, "article.md");
  fs.writeFileSync(file, post("post_revision", "revision", "![图](images/diagram.png)\n\n正文。"));
  initGit(out);
  assert.equal(run(file, out, ["--workspace", workspace, "--commit"]).status, 0);
  const assetHash = require("node:crypto").createHash("sha256").update(fs.readFileSync(image)).digest("hex");
  fs.writeFileSync(file, post("post_revision", "revision", "![图](images/diagram.png)\n\n正文，"));
  const result = run(file, out, ["--workspace", workspace, "--commit"]);
  assert.equal(result.status, 0, result.stderr);
  const assets = fs.readdirSync(path.join(out, "assets", "articles", "post_revision", "images"));
  assert.deepEqual(assets, ["diagram.png"]);
  assert.equal(require("node:crypto").createHash("sha256").update(fs.readFileSync(image)).digest("hex"), assetHash);
  const changed = JSON.parse(result.stdout).changedFiles.map((item) => item.path);
  assert.equal(changed.some((item) => item.includes("assets/articles/post_revision")), false);
  assert.equal(changed.includes("posts/revision.md"), true);
});

test("rejects an image outside the selected workspace before touching output", (t) => {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), "selection-boundary-"));
  t.after(() => fs.rmSync(root, { recursive: true, force: true }));
  const workspace = path.join(root, "notes");
  const out = path.join(root, "content");
  const outside = path.join(root, "private.png");
  fs.mkdirSync(workspace, { recursive: true });
  fs.mkdirSync(out);
  fs.writeFileSync(outside, png);
  const file = path.join(workspace, "article.md");
  fs.writeFileSync(file, post("post_boundary", "boundary", "![x](../private.png)"));
  initGit(out);
  const result = run(file, out, ["--workspace", workspace, "--dry-run"]);
  assert.notEqual(result.status, 0);
  assert.match(result.stderr, /工作区之外/);
  assert.equal(fs.existsSync(path.join(out, "posts")), false);
});

test("rejects a missing referenced image before touching output", (t) => {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), "selection-missing-"));
  t.after(() => fs.rmSync(root, { recursive: true, force: true }));
  const workspace = path.join(root, "notes");
  const out = path.join(root, "content");
  fs.mkdirSync(workspace, { recursive: true });
  fs.mkdirSync(out);
  const file = path.join(workspace, "article.md");
  fs.writeFileSync(file, post("post_missing", "missing", "![x](images/nope.png)"));
  initGit(out);
  const result = run(file, out, ["--workspace", workspace, "--dry-run"]);
  assert.notEqual(result.status, 0);
  assert.match(result.stderr, /图片不存在/);
  assert.equal(fs.existsSync(path.join(out, "posts")), false);
});
