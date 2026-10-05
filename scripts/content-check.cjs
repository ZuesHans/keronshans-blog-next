#!/usr/bin/env node

const fs = require("node:fs");
const path = require("node:path");
const { validatePublishedRoot } = require("./content-contract.cjs");

function parseArgs(argv) {
  const options = { published: "Published", allowLegacy: false };
  for (let i = 0; i < argv.length; i += 1) {
    const arg = argv[i];
    if (arg === "--source" || arg === "--published") {
      const value = argv[++i];
      if (!value || value.startsWith("--")) throw new Error(`${arg} 需要一个值`);
      if (arg === "--source") options.source = value;
      else options.published = value;
    } else if (arg === "--allow-legacy") options.allowLegacy = true;
    else if (arg === "--help" || arg === "-h") {
      console.log("用法：node scripts/content-check.cjs --source <Vault> [--published Published] [--allow-legacy]");
      process.exit(0);
    } else throw new Error(`未知参数：${arg}`);
  }
  if (!options.source) throw new Error("必须提供 --source");
  return options;
}

try {
  const options = parseArgs(process.argv.slice(2));
  const source = path.resolve(options.source);
  const published = path.resolve(source, options.published);
  if (!fs.existsSync(source) || !fs.statSync(source).isDirectory()) throw new Error(`source 不是目录：${source}`);
  if (!fs.existsSync(published) || !fs.statSync(published).isDirectory()) throw new Error(`Published 目录不存在：${published}`);
  const result = validatePublishedRoot(published, { allowLegacy: options.allowLegacy });
  console.log(JSON.stringify({ ok: true, siteId: result.site.siteId, readyPosts: result.registry.entries.filter((entry) => entry.kind === "post" && entry.state === "active").length, readySnippets: result.registry.entries.filter((entry) => entry.kind === "snippet" && entry.state === "active").length, assets: result.assets.length, snapshotDigest: result.manifest.snapshotDigest }, null, 2));
} catch (error) {
  console.error(`[content-check] ${error.message}`);
  process.exitCode = 3;
}
