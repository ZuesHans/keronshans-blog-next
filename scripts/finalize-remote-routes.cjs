const fs = require("node:fs");
const path = require("node:path");
const crypto = require("node:crypto");
const matter = require("gray-matter");
const ts = require("typescript");
const { validatePublishedRoot } = require("./content-contract.cjs");

function finalizeRemoteRoutes(contentRoot, exportPath, reportPath) {
  const legacy = JSON.parse(fs.readFileSync(exportPath, "utf8"));
  const registryPath = path.join(contentRoot, "content-registry.json");
  const registry = JSON.parse(fs.readFileSync(registryPath, "utf8"));
  const module = { exports: {} };
  new Function("module", "exports", ts.transpileModule(fs.readFileSync(path.join(__dirname, "../src/lib/postSlug.ts"), "utf8"), { compilerOptions: { module: ts.ModuleKind.CommonJS } }).outputText)(module, module.exports);
  const owners = new Map(registry.entries.flatMap((e) => [e.canonicalPath, ...e.aliases].map((route) => [route, e.id])));
  const report = [];
  for (const kind of ["posts", "snippets"]) {
    const docs = fs.readdirSync(path.join(contentRoot, kind)).filter((f) => f.endsWith(".md")).map((file) => ({ file, ...matter(fs.readFileSync(path.join(contentRoot, kind, file), "utf8")) }));
    for (const row of legacy.tables[kind]) {
      const key = String(row.filename || row.id);
      const hashId = `content-${crypto.createHash("sha256").update(key).digest("hex").slice(0, 24)}`;
      const byId = docs.filter((d) => d.data.id === key || d.data.id === hashId);
      const matches = byId.length ? byId : docs.filter((d) => d.data.title === row.title);
      if (matches.length !== 1) throw new Error(`Ambiguous remote identity: ${kind}/${key}`);
      const doc = matches[0];
      const entry = registry.entries.find((e) => e.id === doc.data.id && e.kind === (kind === "posts" ? "post" : "snippet"));
      if (!entry || entry.state !== "active") throw new Error(`Missing registry identity: ${key}`);
      const oldId = kind === "posts" ? module.exports.toUrlSafeId(key) : key;
      const oldUrl = `/${kind}/${oldId}`;
      if (owners.has(oldUrl) && owners.get(oldUrl) !== entry.id) throw new Error(`Route conflict: ${oldUrl}`);
      owners.set(oldUrl, entry.id);
      if (oldUrl !== entry.canonicalPath) entry.aliases = [...new Set([...entry.aliases, oldUrl])].sort();
      if (kind === "posts") {
        doc.data.aliases = [...new Set([...doc.data.aliases, ...entry.aliases])].sort();
        fs.writeFileSync(path.join(contentRoot, kind, doc.file), matter.stringify(doc.content, doc.data).replaceAll("\r\n", "\n"));
      }
      report.push({ kind, oldId, oldUrl, targetId: entry.id, canonicalPath: entry.canonicalPath });
    }
  }
  fs.writeFileSync(registryPath, `${JSON.stringify(registry, null, 2)}\n`);
  const contract = validatePublishedRoot(contentRoot);
  fs.writeFileSync(registryPath, `${JSON.stringify(contract.registry, null, 2)}\n`);
  fs.writeFileSync(path.join(contentRoot, "content-manifest.json"), `${JSON.stringify(contract.manifest, null, 2)}\n`);
  fs.writeFileSync(reportPath, `${JSON.stringify(report, null, 2)}\n`);
  return { identities: report.length, snapshotDigest: contract.manifest.snapshotDigest };
}
if (require.main === module) {
  try {
    const [root, source, report] = process.argv.slice(2);
    if (!root || !source || !report) throw new Error("Usage: finalize-remote-routes.cjs <content-root> <d1-export.json> <report.json>");
    console.log(JSON.stringify(finalizeRemoteRoutes(root, source, report)));
  } catch (error) { console.error(error.message); process.exitCode = 1; }
}
module.exports = { finalizeRemoteRoutes };
