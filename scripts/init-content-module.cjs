const fs = require("node:fs");
const path = require("node:path");
const output = path.resolve(__dirname, "../src/generated/contentSnapshot.ts");
if (!fs.existsSync(output)) {
  fs.mkdirSync(path.dirname(output), { recursive: true });
  const empty = { generated: false, frameworkSha: "dev", releaseId: "dev", snapshotDigest: "dev", posts: [], snippets: [], registry: null, problems: [], site: null };
  fs.writeFileSync(output, `// Generated content module. Production builds replace this placeholder.\nexport const generatedContentSnapshot = ${JSON.stringify(empty)} as const;\n`);
}
