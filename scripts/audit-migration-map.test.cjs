const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const os = require("node:os");
const path = require("node:path");
const crypto = require("node:crypto");
const { spawnSync } = require("node:child_process");

const script = path.join(__dirname, "audit-migration-map.cjs");

function writeFixture(status = "approved") {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), "keronshans-map-"));
  const source = path.join(root, "source");
  fs.mkdirSync(path.join(source, "posts"), { recursive: true });
  const relative = "posts/example.md";
  const content = "# Example\n";
  fs.writeFileSync(path.join(source, relative), content);
  const hash = crypto.createHash("sha256").update(content).digest("hex");
  const map = {
    schemaVersion: 1,
    entries: [{ kind: "post", source: relative, sourceKey: relative, oldUrl: "/posts/example", oldPostId: null, targetId: "post_example", targetSlug: "example", contentHash: hash, conflictStatus: status }],
  };
  const mapPath = path.join(root, "migration-map.json");
  fs.writeFileSync(mapPath, JSON.stringify(map));
  return { source, mapPath };
}

test("migration audit verifies source hash and approved entries", () => {
  const fixture = writeFixture();
  const result = spawnSync(process.execPath, [script, "--map", fixture.mapPath, "--source", fixture.source], { encoding: "utf8" });
  assert.equal(result.status, 0, result.stderr);
  assert.match(result.stdout, /"unresolved": 0/);
});

test("migration audit blocks unresolved entries unless explicitly allowed", () => {
  const fixture = writeFixture("needs-review");
  const blocked = spawnSync(process.execPath, [script, "--map", fixture.mapPath, "--source", fixture.source], { encoding: "utf8" });
  assert.equal(blocked.status, 2);
  assert.match(blocked.stderr, /仍有 1 条未决记录/);
  const allowed = spawnSync(process.execPath, [script, "--map", fixture.mapPath, "--source", fixture.source, "--allow-unresolved"], { encoding: "utf8" });
  assert.equal(allowed.status, 0, allowed.stderr);
});

test("migration audit rejects a legacy underscore slug", () => {
  const fixture = writeFixture();
  const map = JSON.parse(fs.readFileSync(fixture.mapPath, "utf8"));
  map.entries[0].targetSlug = "legacy_slug";
  fs.writeFileSync(fixture.mapPath, JSON.stringify(map));
  const result = spawnSync(process.execPath, [script, "--map", fixture.mapPath], { encoding: "utf8" });
  assert.equal(result.status, 2);
  assert.match(result.stderr, /targetSlug 无效/);
});
