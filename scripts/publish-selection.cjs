#!/usr/bin/env node

const fs = require("node:fs");
const os = require("node:os");
const path = require("node:path");
const crypto = require("node:crypto");
const { spawnSync } = require("node:child_process");
const matter = require("gray-matter");
const { unified } = require("unified");
const remarkParse = require("remark-parse").default;
const { validateMarkdown, sha256 } = require("./content-contract.cjs");

const APP_ROOT = path.resolve(__dirname, "..");
const MANAGED = ["posts", "snippets", "assets", "site.json", "content-registry.json", "content-manifest.json", ".content-export.json", "problems.json"];

function usage() {
  console.log(`用法:
  node scripts/publish-selection.cjs --file <文章.md> --out <内容仓库> [选项]

必需参数:
  --file <路径>             可重复；明确选择要发布的文章
  --out <目录>              独立内容仓库目录

常用参数:
  --workspace <目录>        图片允许读取的根目录，默认使用所选文件的共同父目录
  --kind post|snippet       默认 post
  --target <路径>           输出路径，可重复；默认 posts/<slug>.md
  --commit                  在内容仓库创建 Git 提交
  --push                    提交后推送（同时需要 --ref）
  --ref <分支>              --push 时使用的目标分支
  --expected-parent-sha <SHA>  内容仓库提交前必须仍基于此 SHA
  --message <提交信息>      默认 content: publish selection ...
  --dispatch-repo <仓库>    已停用；先提交框架 release.json 的 content SHA
  --content-repo <仓库>     workflow 的内容仓库名
  --dry-run                 只校验并输出变更预览，不写内容仓库
  --allow-empty             允许公开内容变为空站
  --accept-removals <摘要>  确认撤稿摘要
  --help`);
}

function parseArgs(argv) {
  const options = { files: [], targets: [], kind: "post", dry_run: false, commit: false, push: false };
  const valueArgs = new Set(["--file", "--out", "--workspace", "--kind", "--target", "--ref", "--expected-parent-sha", "--message", "--dispatch-repo", "--content-repo", "--accept-removals"]);
  for (let i = 0; i < argv.length; i += 1) {
    const arg = argv[i];
    if (arg === "--help" || arg === "-h") { usage(); process.exit(0); }
    if (valueArgs.has(arg)) {
      const value = argv[i + 1];
      if (!value || value.startsWith("--")) throw new Error(`${arg} 需要一个值`);
      if (arg === "--file") options.files.push(value);
      else if (arg === "--target") options.targets.push(value);
      else options[arg.slice(2).replaceAll("-", "_")] = value;
      i += 1;
      continue;
    }
    if (arg === "--commit") options.commit = true;
    else if (arg === "--push") options.push = true;
    else if (arg === "--dry-run") options.dry_run = true;
    else if (arg === "--allow-empty") options.allow_empty = true;
    else throw new Error(`未知参数：${arg}`);
  }
  if (!options.files.length || !options.out) throw new Error("必须提供至少一个 --file 和 --out");
  if (!["post", "snippet"].includes(options.kind)) throw new Error("--kind 只能是 post 或 snippet");
  if (options.targets.length > 0 && options.targets.length !== options.files.length) throw new Error("--target 必须与 --file 一一对应");
  if (options.push && !options.ref) throw new Error("--push 必须明确提供 --ref");
  if (options.push) options.commit = true;
  return options;
}

function absoluteFile(value, label) {
  const resolved = path.resolve(value);
  if (!fs.existsSync(resolved)) throw new Error(`${label}不存在：${resolved}`);
  const stat = fs.lstatSync(resolved);
  if (!stat.isFile() || stat.isSymbolicLink()) throw new Error(`${label}必须是普通文件，不能是符号链接或 junction：${resolved}`);
  return resolved;
}

function absoluteDirectory(value, label, mustExist = true) {
  const resolved = path.resolve(value);
  if (!fs.existsSync(resolved)) {
    if (mustExist) throw new Error(`${label}不存在：${resolved}`);
    fs.mkdirSync(resolved, { recursive: true });
  }
  const stat = fs.lstatSync(resolved);
  if (!stat.isDirectory() || stat.isSymbolicLink()) throw new Error(`${label}必须是普通目录，不能是符号链接或 junction：${resolved}`);
  return resolved;
}

function normalizeRelative(value, label = "路径") {
  const normalized = String(value).replaceAll("\\", "/").normalize("NFC");
  if (!normalized || normalized.startsWith("/") || normalized.includes("..") || /[\u0000-\u001f]/.test(normalized)) throw new Error(`${label}不是安全的相对路径：${value}`);
  return normalized;
}

function inside(root, target) {
  const relative = path.relative(path.resolve(root), path.resolve(target));
  return relative === "" || (relative !== ".." && !relative.startsWith(`..${path.sep}`) && !path.isAbsolute(relative));
}

function assertRealInside(root, target, label) {
  let rootReal;
  let targetReal;
  try {
    rootReal = fs.realpathSync.native(root);
    targetReal = fs.realpathSync.native(target);
  } catch {
    throw new Error(`${label}无法解析：${target}`);
  }
  if (!inside(rootReal, targetReal)) throw new Error(`${label}不能位于工作区之外：${target}`);
}

function commonAncestor(paths) {
  const split = paths.map((item) => path.dirname(path.resolve(item)).split(path.sep));
  const first = split[0];
  let length = first.length;
  for (const parts of split.slice(1)) {
    length = Math.min(length, parts.length);
    for (let i = 0; i < length; i += 1) {
      if (first[i].toLowerCase() !== parts[i].toLowerCase()) { length = i; break; }
    }
  }
  return first.slice(0, length).join(path.sep) || path.parse(first[0]).root;
}

function copyIfExists(source, destination) {
  if (!fs.existsSync(source)) return;
  fs.cpSync(source, destination, { recursive: true, force: true, errorOnExist: false });
}

function walkFiles(root, relative = "") {
  const current = path.join(root, relative);
  if (!fs.existsSync(current)) return [];
  return fs.readdirSync(current, { withFileTypes: true }).flatMap((entry) => {
    const next = path.join(relative, entry.name);
    const absolute = path.join(root, next);
    if (entry.isSymbolicLink()) throw new Error(`内容仓库不允许符号链接或 junction：${next}`);
    return entry.isDirectory() ? walkFiles(root, next) : [{ absolute, relative: next.replaceAll("\\", "/") }];
  });
}

function imageReferences(content) {
  const tree = unified().use(remarkParse).parse(content);
  const references = [];
  const definitions = new Map();
  const collectDefinitions = (node) => {
    if (node.type === "definition") definitions.set(node.identifier.toLowerCase(), node.url);
    if (Array.isArray(node.children)) node.children.forEach(collectDefinitions);
  };
  collectDefinitions(tree);
  const visit = (node) => {
    if (node.type === "image" && typeof node.url === "string") references.push(node.url);
    if (node.type === "imageReference") {
      const target = definitions.get(node.identifier.toLowerCase());
      if (!target) throw new Error(`Missing image definition: ${node.identifier}`);
      references.push(target);
    }
    if (Array.isArray(node.children)) node.children.forEach(visit);
  };
  visit(tree);
  return references;
}

function localImagePath(reference, articleDir, workspace) {
  const value = String(reference).trim();
  if (/^(?:https?:|data:|javascript:|mailto:)/i.test(value)) return null;
  const clean = decodeURIComponent(value.split(/[?#]/, 1)[0]);
  if (!clean || clean.startsWith("/") || /^[A-Za-z]:[\\/]/.test(clean)) throw new Error(`图片引用必须是文章旁的相对文件：${reference}`);
  const absolute = path.resolve(articleDir, clean.replaceAll("/", path.sep));
  if (!inside(workspace, absolute)) throw new Error(`图片不能位于工作区之外：${reference}`);
  if (!fs.existsSync(absolute) || !fs.lstatSync(absolute).isFile() || fs.lstatSync(absolute).isSymbolicLink()) throw new Error(`图片不存在或是符号链接：${absolute}`);
  assertRealInside(workspace, absolute, "图片");
  return absolute;
}

function rewriteImageUrls(content, replacements) {
  const rewrite = (whole, prefix, url, suffix) => {
    const unwrapped = url.startsWith("<") && url.endsWith(">") ? url.slice(1, -1) : url;
    const replacement = replacements.get(unwrapped);
    if (!replacement) return whole;
    return `${prefix}${url.startsWith("<") ? `<${replacement}>` : replacement}${suffix}`;
  };
  return content.replace(/(!\[[^\]]*\]\()(<[^>]+>|[^)\s]+)([^)]*\))/g, rewrite)
    .replace(/^(\s{0,3}\[[^\]]+\]:\s*)(<[^>]+>|\S+)(.*)$/gm, rewrite);
}

function rewriteSelected(filePath, kind, targetRelative, workspace, assetRoot) {
  const raw = fs.readFileSync(filePath, "utf8");
  const parsed = validateMarkdown(filePath, kind);
  const document = matter(raw);
  const articleId = parsed.data.id;
  const replacements = new Map();
  const assetFiles = [];
  for (const reference of imageReferences(document.content)) {
    const absolute = localImagePath(reference, path.dirname(filePath), workspace);
    if (!absolute) continue;
    const relativeToArticle = path.relative(path.dirname(filePath), absolute).replaceAll("\\", "/");
    const assetRelative = normalizeRelative(`articles/${articleId}/${relativeToArticle}`, "图片输出路径");
    replacements.set(reference, `/assets/${assetRelative}`);
    assetFiles.push({ absolute, relative: assetRelative });
  }
  if (typeof document.data.cover === "string" && !/^(?:https?:|data:)/i.test(document.data.cover)) {
    const coverFile = localImagePath(document.data.cover, path.dirname(filePath), workspace);
    if (coverFile) {
      const relativeToArticle = path.relative(path.dirname(filePath), coverFile).replaceAll("\\", "/");
      const assetRelative = normalizeRelative(`articles/${articleId}/${relativeToArticle}`, "封面输出路径");
      replacements.set(document.data.cover, `/assets/${assetRelative}`);
      assetFiles.push({ absolute: coverFile, relative: assetRelative });
      document.data.cover = `assets/${assetRelative}`;
    }
  }
  document.content = rewriteImageUrls(document.content, replacements);
  const output = matter.stringify(document.content, document.data);
  const destination = path.join(assetRoot, targetRelative);
  fs.mkdirSync(path.dirname(destination), { recursive: true });
  fs.writeFileSync(destination, output.replaceAll("\r\n", "\n"), "utf8");
  for (const asset of assetFiles) {
    const target = path.join(assetRoot, "assets", asset.relative);
    fs.mkdirSync(path.dirname(target), { recursive: true });
    fs.copyFileSync(asset.absolute, target);
  }
  return { id: articleId, slug: parsed.data.slug, targetRelative, assets: [...new Map(assetFiles.map((item) => [item.relative, item])).values()] };
}

function removeExistingId(published, kind, id) {
  const directory = path.join(published, kind === "post" ? "posts" : "snippets");
  for (const file of walkFiles(directory).filter((item) => /\.md$/i.test(item.relative))) {
    try {
      const parsed = matter(fs.readFileSync(file.absolute, "utf8"));
      if (parsed.data.id === id) fs.rmSync(file.absolute);
    } catch {}
  }
}

function ensureSite(published, out) {
  if (fs.existsSync(path.join(published, "site.json"))) return;
  const candidate = path.join(out, "site.json");
  if (fs.existsSync(candidate)) { copyIfExists(candidate, path.join(published, "site.json")); return; }
  fs.writeFileSync(path.join(published, "site.json"), `${JSON.stringify({ schemaVersion: 1, siteId: "keronshans", title: "Keronshans' Blog", description: "个人技术博客", author: { name: "Keronshans" } }, null, 2)}\n`);
}

function gitHead(directory) {
  const result = spawnSync("git", ["-C", directory, "rev-parse", "HEAD"], { encoding: "utf8" });
  return result.status === 0 ? result.stdout.trim() : "";
}

function runPublisher(source, out, options, dryRun = false) {
  const args = [path.join(__dirname, "publish-content.cjs"), "--source", source, "--out", out];
  if (dryRun) args.push("--dry-run");
  if (options.commit && !dryRun) args.push("--commit");
  if (options.push && !dryRun) args.push("--push", "--ref", options.ref);
  for (const [flag, key] of [["--expected-parent-sha", "expected_parent_sha"], ["--message", "message"], ["--dispatch-repo", "dispatch_repo"], ["--content-repo", "content_repo"], ["--accept-removals", "accept_removals"]]) {
    if (options[key]) args.push(flag, options[key]);
  }
  if (options.allow_empty) args.push("--allow-empty");
  const result = spawnSync(process.execPath, args, { encoding: "utf8" });
  if (result.status !== 0) throw new Error((result.stderr || result.stdout || "选择式发布失败").trim());
  return { stdout: result.stdout.trim(), stderr: result.stderr.trim() };
}

function snapshotTree(root) {
  const result = new Map();
  for (const file of walkFiles(root)) {
    const relative = file.relative.replaceAll("\\", "/");
    if (!MANAGED.some((name) => relative === name || relative.startsWith(`${name}/`))) continue;
    result.set(relative, sha256(fs.readFileSync(file.absolute)));
  }
  return result;
}

function changedFiles(before, after) {
  const paths = [...new Set([...before.keys(), ...after.keys()])].sort();
  return paths.filter((item) => before.get(item) !== after.get(item)).map((item) => ({ path: item, change: before.has(item) ? (after.has(item) ? "changed" : "removed") : "added" }));
}

function buildPublished(out, options, workspace) {
  const tempRoot = fs.mkdtempSync(path.join(os.tmpdir(), `keronshans-selection-${process.pid}-`));
  const published = path.join(tempRoot, "Published");
  for (const name of MANAGED) copyIfExists(path.join(out, name), path.join(published, name));
  for (const directory of ["posts", "snippets", "assets"]) fs.mkdirSync(path.join(published, directory), { recursive: true });
  ensureSite(published, out);
  const selected = [];
  const selectedIds = new Set();
  for (let i = 0; i < options.files.length; i += 1) {
    const filePath = absoluteFile(options.files[i], "选中文件");
    if (!inside(workspace, filePath)) throw new Error(`选中文件不在工作区内：${filePath}`);
    assertRealInside(workspace, filePath, "选中文件");
    const parsed = matter(fs.readFileSync(filePath, "utf8"));
    if (parsed.data.kind && parsed.data.kind !== options.kind) throw new Error(`文件 kind 与 --kind 不一致：${filePath}`);
    if (selectedIds.has(parsed.data.id)) throw new Error(`同一批次不能重复选择内容 ID：${parsed.data.id}`);
    selectedIds.add(parsed.data.id);
    const target = options.targets[i] || `${options.kind === "post" ? "posts" : "snippets"}/${parsed.data.slug}.md`;
    const targetRelative = normalizeRelative(target, "--target");
    const expectedPrefix = options.kind === "post" ? "posts/" : "snippets/";
    if (!targetRelative.startsWith(expectedPrefix) || !targetRelative.endsWith(".md")) throw new Error(`--target 必须位于 ${expectedPrefix} 下：${targetRelative}`);
    const targetPath = path.join(published, targetRelative);
    if (fs.existsSync(targetPath) && matter(fs.readFileSync(targetPath, "utf8")).data.id !== parsed.data.id) throw new Error(`目标文件属于其他内容 ID：${targetRelative}`);
    removeExistingId(published, options.kind, parsed.data.id);
    selected.push(rewriteSelected(filePath, options.kind, targetRelative, workspace, published));
  }
  return { tempRoot, published, selected };
}

async function main() {
  const options = parseArgs(process.argv.slice(2));
  const files = options.files.map((file) => absoluteFile(file, "选中文件"));
  const workspace = absoluteDirectory(options.workspace || commonAncestor(files), "工作区");
  const out = absoluteDirectory(options.out, "内容仓库");
  const expectedParentSha = options.expected_parent_sha || gitHead(out);
  const before = snapshotTree(out);
  const assembled = buildPublished(out, options, workspace);
  try {
    const candidateOut = fs.mkdtempSync(path.join(os.tmpdir(), `keronshans-selection-out-${process.pid}-`));
    try {
      runPublisher(assembled.tempRoot, candidateOut, { ...options, commit: false, push: false, dispatch_repo: "", content_repo: "", expected_parent_sha: "" }, false);
      const afterCandidate = snapshotTree(candidateOut);
      const changes = changedFiles(before, afterCandidate);
      let drySummary = {};
      try { drySummary = JSON.parse(fs.readFileSync(path.join(candidateOut, "content-manifest.json"), "utf8")); } catch {}
      const summary = {
        ok: true,
        mode: options.dry_run ? "dry-run" : (options.commit ? "commit" : "validate"),
        selected: assembled.selected.map((item) => ({ id: item.id, slug: item.slug, path: item.targetRelative })),
        referencedAssets: [...new Set(assembled.selected.flatMap((item) => item.assets.map((asset) => `assets/${asset.relative}`)))].sort(),
        changedFiles: changes,
        changedFileCount: changes.length,
        expectedParentSha: expectedParentSha || null,
        snapshotDigest: drySummary.snapshotDigest || null,
      };
      if (options.dry_run) { console.log(JSON.stringify(summary, null, 2)); return; }
      runPublisher(assembled.tempRoot, out, { ...options, expected_parent_sha: expectedParentSha }, false);
      const result = { ...summary, commitSha: gitHead(out) || null };
      console.log(JSON.stringify(result, null, 2));
    } finally {
      fs.rmSync(candidateOut, { recursive: true, force: true });
    }
  } finally {
    fs.rmSync(assembled.tempRoot, { recursive: true, force: true });
  }
}

main().catch((error) => { console.error(`[publish-selection] ${error.message}`); process.exitCode = 1; });
