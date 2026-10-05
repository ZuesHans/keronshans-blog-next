const fs = require("node:fs");
const path = require("node:path");
const crypto = require("node:crypto");
const matter = require("gray-matter");
const ts = require("typescript");
const { validatePublishedRoot } = require("./content-contract.cjs");

// Resolve each legacy source against the already published schema-v1 documents.
// This preserves published identities instead of assigning a second set of IDs.
function finalize(legacyRoot, contentRoot, reportPath, migrationMapPath = "") {
  const hash = (value) => crypto.createHash("sha256").update(value).digest("hex");
  const module = { exports: {} };
  new Function("module", "exports", ts.transpileModule(fs.readFileSync(path.join(__dirname, "../src/lib/postSlug.ts"), "utf8"), { compilerOptions: { module: ts.ModuleKind.CommonJS } }).outputText)(module, module.exports);
  const toUrlSafeId = module.exports.toUrlSafeId;
  const registryPath = path.join(contentRoot, "content-registry.json");
  const registry = JSON.parse(fs.readFileSync(registryPath, "utf8"));
  const migration = { schemaVersion: 1, sourceRoot: legacyRoot, entries: [] };
  const mapValue = migrationMapPath && fs.existsSync(migrationMapPath) ? JSON.parse(fs.readFileSync(migrationMapPath, "utf8")) : [];
  const migrationMap = new Map((Array.isArray(mapValue) ? mapValue : mapValue.entries || []).map((entry) => [entry.source.replaceAll("\\", "/"), entry]));
  const routeOwners = new Map(registry.entries.flatMap((entry) => [entry.canonicalPath, ...entry.aliases].map((route) => [route, entry.id])));
  for (const kind of ["post", "snippet"]) {
    const directory = kind === "post" ? "posts" : "snippets";
    const published = fs.readdirSync(path.join(contentRoot, directory)).filter((file) => file.endsWith(".md")).map((file) => {
      const absolute = path.join(contentRoot, directory, file);
      const parsed = matter(fs.readFileSync(absolute, "utf8"));
      return { absolute, ...parsed };
    });
    for (const filename of fs.readdirSync(path.join(legacyRoot, directory)).filter((file) => file.endsWith(".md"))) {
      const source = `${directory}/${filename}`;
      const raw = fs.readFileSync(path.join(legacyRoot, source));
      const legacy = matter(raw.toString("utf8"));
      const mapped = migrationMap.get(source);
      const mappedMatches = mapped?.targetId ? published.filter((item) => item.data.id === mapped.targetId) : [];
      const candidateIds = [legacy.data.id, `content-${hash(filename.replace(/\.md$/, "")).slice(0, 24)}`, `content-${hash(source).slice(0, 24)}`].filter(Boolean);
      const matches = mappedMatches.length ? mappedMatches : published.filter((item) =>
        (legacy.data.title && item.data.title === legacy.data.title) || candidateIds.includes(item.data.id) || item.content.trim().replaceAll("\r\n", "\n") === legacy.content.trim().replaceAll("\r\n", "\n"));
      if (matches.length !== 1) throw new Error(`Ambiguous migration source: ${source} (${matches.length} matches)`);
      const target = matches[0];
      const entry = registry.entries.find((item) => item.id === target.data.id && item.kind === kind);
      if (!entry || entry.state !== "active") throw new Error(`Missing active registry identity: ${source}`);
      const oldId = kind === "post" ? String(legacy.data.id || toUrlSafeId(filename)) : String(legacy.data.id || filename.replace(/\.md$/, ""));
      const oldUrl = `/${directory}/${oldId}`;
      const oldRoutes = [oldUrl];
      if (kind === "post") oldRoutes.push(`/posts/${toUrlSafeId(filename)}`);
      for (const route of oldRoutes) {
        if (route === entry.canonicalPath) continue;
        if (routeOwners.has(route) && routeOwners.get(route) !== entry.id) throw new Error(`Historical URL conflict: ${route}`);
        routeOwners.set(route, entry.id);
        entry.aliases = [...new Set([...entry.aliases, route])].sort();
      }
      if (kind === "post") {
        target.data.aliases = [...new Set([...(target.data.aliases || []), ...entry.aliases])].sort();
        fs.writeFileSync(target.absolute, matter.stringify(target.content, target.data).replaceAll("\r\n", "\n"));
      }
      migration.entries.push({ kind, source, sourceKey: source, oldUrl, oldPostId: oldId, targetId: target.data.id, targetSlug: target.data.slug, contentHash: hash(raw), conflictStatus: "migrated", resolvedUpdatedAt: target.data.updatedAt, targetBodyHash: hash(target.content), resolution: "Matched unique title/ID to published v1 content; preserved published identity and restored historical routes" });
    }
  }
  fs.writeFileSync(registryPath, `${JSON.stringify(registry, null, 2)}\n`);
  const contract = validatePublishedRoot(contentRoot);
  fs.writeFileSync(registryPath, `${JSON.stringify(contract.registry, null, 2)}\n`);
  fs.writeFileSync(path.join(contentRoot, "content-manifest.json"), `${JSON.stringify(contract.manifest, null, 2)}\n`);
  fs.writeFileSync(reportPath, `${JSON.stringify(migration, null, 2)}\n`);
  return { entries: migration.entries.length, snapshotDigest: contract.manifest.snapshotDigest };
}

if (require.main === module) {
  try {
    const [legacy, content, report, migrationMap] = process.argv.slice(2);
    if (!legacy || !content || !report) throw new Error("Usage: finalize-content-migration.cjs <legacy-root> <content-root> <report.json> [migration-map.json]");
    console.log(JSON.stringify(finalize(path.resolve(legacy), path.resolve(content), path.resolve(report), migrationMap ? path.resolve(migrationMap) : ""), null, 2));
  } catch (error) { console.error(error.message); process.exitCode = 1; }
}
module.exports = { finalize };
