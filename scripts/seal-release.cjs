const fs = require("node:fs");
const path = require("node:path");
const crypto = require("node:crypto");
const root = path.resolve(__dirname, "..");
const output = path.join(root, ".open-next");
const manifestFile = path.join(output, "release-artifact.json");
const hash = (bytes) => crypto.createHash("sha256").update(bytes).digest("hex");
function files(directory) {
  if (!fs.existsSync(directory)) return [];
  return fs.readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
    const target = path.join(directory, entry.name);
    if (entry.isSymbolicLink()) throw new Error(`Release cannot contain symlinks: ${target}`);
    return entry.isDirectory() ? files(target) : [target];
  });
}
function sourceDigest() {
  const inputs = [...files(path.join(root, "src")), ...files(path.join(root, "public")), ...files(path.join(root, "scripts")),
    ...["package.json", "package-lock.json", "next.config.mjs", "open-next.config.ts", "wrangler.toml", "release.json"].map((file) => path.join(root, file))];
  return hash(JSON.stringify(inputs.sort().map((file) => {
    const bytes = fs.readFileSync(file);
    const normalized = /\.(png|jpe?g|gif|webp|avif|ico|woff2?)$/i.test(file) ? bytes : Buffer.from(bytes.toString("utf8").replaceAll("\r\n", "\n"));
    return [path.relative(root, file).replaceAll("\\", "/"), hash(normalized)];
  })));
}
function artifactFiles() {
  return files(output).filter((file) => file !== manifestFile).sort().map((file) => ({ path: path.relative(output, file).replaceAll("\\", "/"), sha256: hash(fs.readFileSync(file)) }));
}
try {
  const pin = JSON.parse(fs.readFileSync(path.join(root, "release.json"), "utf8"));
  if (process.argv.includes("--verify")) {
    const sealed = JSON.parse(fs.readFileSync(manifestFile, "utf8"));
    if (sealed.contentSha !== pin.contentSha || sealed.sourceDigest !== sourceDigest()) throw new Error("Source changed since build; rebuild before deployment");
    if (sealed.artifactDigest !== hash(JSON.stringify(artifactFiles()))) throw new Error("Artifact changed since build; rebuild before deployment");
    console.log(`Verified sealed release ${sealed.artifactDigest}`);
  } else {
    if (!fs.existsSync(path.join(output, "worker.js"))) throw new Error("Missing Worker build");
    const frameworkSha = require("node:child_process").execFileSync("git", ["rev-parse", "HEAD"], { cwd: root, encoding: "utf8" }).trim();
    const manifest = { schemaVersion: 1, ...pin, frameworkSha, sourceDigest: sourceDigest(), artifactDigest: hash(JSON.stringify(artifactFiles())), createdAt: new Date().toISOString() };
    fs.writeFileSync(manifestFile, `${JSON.stringify(manifest, null, 2)}\n`);
    console.log(`Sealed release ${manifest.artifactDigest}`);
  }
} catch (error) { console.error(error.message); process.exitCode = 1; }
