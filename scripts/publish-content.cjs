#!/usr/bin/env node

const fs = require("node:fs");
const path = require("node:path");
const crypto = require("node:crypto");
const { spawnSync } = require("node:child_process");
const matter = require("gray-matter");
const { validatePublishedRoot, sha256, jcs } = require("./content-contract.cjs");

function usage() {
  console.log(`用法:
  node scripts/publish-content.cjs --source <Obsidian Vault> --out <content repo>

可选参数:
  --published <目录>       已发布目录名，默认 Published
  --clean                  兼容旧调用；输出始终由候选快照完整重建
  --commit                 在内容仓库创建提交
  --push                   提交后推送内容仓库
  --dispatch-repo <仓库>   已停用；先更新框架 release.json，再手动发布
  --content-repo <仓库>    传给 workflow 的内容仓库名，默认从 origin 推断
  --ref <分支>             --push 时使用的内容仓库目标分支（或 CONTENT_BRANCH）
  --expected-parent-sha <SHA>  内容仓库提交前必须仍基于此 SHA
  --accept-removals <digest>   确认本次撤稿摘要
  --allow-empty                允许已有公开内容全部撤下
  --message <提交信息>     默认 "content: publish ..."
  --allow-legacy           仅迁移期允许旧 frontmatter；旧文件不会进入 v1 registry
  --dry-run                只校验并输出摘要，不写输出目录
  --help`);
}

function parseArgs(argv) {
  const options = { published: "Published", clean: false, commit: false, push: false, allow_legacy: false, dry_run: false, allow_empty: false };
  for (let index = 0; index < argv.length; index += 1) {
    const arg = argv[index];
    if (arg === "--help" || arg === "-h") {
      usage();
      process.exit(0);
    }
  if (["--source", "--out", "--published", "--dispatch-repo", "--content-repo", "--ref", "--message", "--expected-parent-sha", "--accept-removals"].includes(arg)) {
      const value = argv[index + 1];
      if (!value || value.startsWith("--")) throw new Error(`${arg} 需要一个值`);
      options[arg.slice(2).replaceAll("-", "_")] = value;
      index += 1;
      continue;
    }
    if (arg === "--clean") options.clean = true;
    else if (arg === "--allow-legacy") options.allow_legacy = true;
    else if (arg === "--dry-run") options.dry_run = true;
    else if (arg === "--allow-empty") options.allow_empty = true;
    else if (arg === "--commit") options.commit = true;
    else if (arg === "--push") options.push = true;
    else throw new Error(`未知参数：${arg}`);
  }
  if (!options.source || !options.out) throw new Error("必须提供 --source 和 --out");
  if (options.dispatch_repo) throw new Error("自动内容 dispatch 已停用；请先提交 release.json 的精确 content SHA，再运行发行 workflow");
  if (options.push) options.commit = true;
  return options;
}

function absoluteExistingDirectory(value, label) {
  const resolved = path.resolve(value);
  const stat = fs.existsSync(resolved) ? fs.lstatSync(resolved) : null;
  if (stat?.isSymbolicLink()) throw new Error(`${label}不允许符号链接或 junction：${resolved}`);
  if (!stat || !stat.isDirectory() || stat.isSymbolicLink()) {
    throw new Error(`${label}不存在或不是目录：${resolved}`);
  }
  return resolved;
}

function listMarkdown(directory, root = directory) {
  if (!fs.existsSync(directory)) throw new Error(`发布目录不存在：${directory}`);
  const entries = fs.readdirSync(directory, { withFileTypes: true });
  const files = [];
  for (const entry of entries) {
    const entryPath = path.join(directory, entry.name);
    if (entry.isSymbolicLink()) throw new Error(`不允许在发布目录中使用符号链接：${entryPath}`);
    if (entry.isDirectory()) {
      files.push(...listMarkdown(entryPath, root));
      continue;
    }
    if (/\.md$/i.test(entry.name)) files.push({ absolute: entryPath, relative: path.relative(root, entryPath) });
  }
  return files.sort((left, right) => left.relative.localeCompare(right.relative));
}

function readPublishedRoot(source, publishedName) {
  const candidate = path.join(source, publishedName);
  const stat = fs.existsSync(candidate) ? fs.lstatSync(candidate) : null;
  if (stat?.isSymbolicLink()) throw new Error(`Published 不允许符号链接或 junction：${candidate}`);
  if (!stat || !stat.isDirectory()) {
    throw new Error(`Published 目录不存在：${candidate}；禁止回退扫描 Vault 根目录`);
  }
  for (const required of ["posts", "snippets", "assets", "site.json"]) {
    const target = path.join(candidate, required);
    if (!fs.existsSync(target)) throw new Error(`Published 缺少必需的 ${required}`);
  }
  return candidate;
}

function ensureNoDuplicateNames(files) {
  const names = new Set();
  for (const filePath of files) {
    const filename = filePath.relative.toLocaleLowerCase();
    if (names.has(filename)) throw new Error(`发布文件重名：${filename}`);
    names.add(filename);
  }
}

function validatePost(filePath, kind) {
  const raw = fs.readFileSync(filePath, "utf8");
  const parsed = matter(raw);
  if (parsed.data.status === "draft" || parsed.data.draft === true || parsed.data.published === false) return false;
  if (!String(parsed.data.title || "").trim()) {
    console.warn(`[warning] ${kind}/${path.basename(filePath)} 没有 title，将使用文件名`);
  }
  if (/!\[\[|\[\[[^\]]+\]\]/.test(parsed.content)) {
    console.warn(`[warning] ${kind}/${path.basename(filePath)} 包含 Obsidian 双向链接，博客渲染器不会自动解析`);
  }
  return true;
}

function copyFiles(files, destination, kind) {
  fs.mkdirSync(destination, { recursive: true });
  const included = [];
  for (const file of files) {
    if (!validatePost(file.absolute, kind)) continue;
    const target = path.join(destination, file.relative);
    fs.mkdirSync(path.dirname(target), { recursive: true });
    fs.copyFileSync(file.absolute, target);
    included.push(file.relative);
  }
  return included;
}

function copyAssets(source, out, selected = []) {
  fs.mkdirSync(out, { recursive: true });
  for (const file of selected) {
    const relative = typeof file === "string" ? file : file.relative;
    const input = path.join(source, relative);
    const target = path.join(out, relative);
    if (!fs.existsSync(input) || !fs.lstatSync(input).isFile()) throw new Error(`资源不存在：${relative}`);
    fs.mkdirSync(path.dirname(target), { recursive: true });
    fs.copyFileSync(input, target);
  }
}

function validateProblems(filePath) {
  if (!fs.existsSync(filePath)) return;
  const raw = fs.readFileSync(filePath, "utf8");
  if (!raw.trim()) return [];
  let value;
  try {
    value = JSON.parse(raw);
  } catch (error) {
    throw new Error(`problems.json 不是有效 JSON：${error.message}`);
  }
  if (!Array.isArray(value)) throw new Error("problems.json 必须是数组");
  return value;
}

function removeGeneratedOutput(out) {
  for (const name of ["posts", "snippets", "assets", "site.json", "content-registry.json", "content-manifest.json", "problems.json", ".content-export.json"]) {
    const target = path.join(out, name);
    if (fs.existsSync(target)) fs.rmSync(target, { recursive: true, force: true });
  }
}

function assertSourceUnchanged(published, snapshot) {
  for (const expected of snapshot) {
    const relative = expected.path.replace(/^site\.json$/, "site.json");
    const absolute = path.join(published, relative);
    if (!fs.existsSync(absolute) || !fs.lstatSync(absolute).isFile()) throw new Error(`源文件在导出期间消失：${expected.path}`);
    const buffer = fs.readFileSync(absolute);
    const actual = { size: buffer.length, sha256: crypto.createHash("sha256").update(buffer).digest("hex") };
    if (actual.size !== expected.size || actual.sha256 !== expected.sha256) throw new Error(`源文件在导出期间发生变化：${expected.path}`);
  }
}

function runGit(out, args) {
  const result = spawnSync("git", ["-C", out, ...args], { encoding: "utf8" });
  if (result.status !== 0) throw new Error((result.stderr || result.stdout || "git 命令失败").trim());
  return result.stdout.trim();
}

function gitHead(out) {
  try { return runGit(out, ["rev-parse", "HEAD"]); } catch { return ""; }
}

function assertExpectedParent(out, expected, label) {
  if (!expected) return;
  const actual = gitHead(out);
  if (!actual || actual !== expected) throw new Error(`${label}发生变化：expectedParentSha=${expected}，当前=${actual || "无 Git HEAD"}`);
}

function remoteRepository(out) {
  try {
    const remote = runGit(out, ["remote", "get-url", "origin"]);
    return remote
      .replace(/^git@github\.com:/, "")
      .replace(/^https?:\/\/github\.com\//, "")
      .replace(/\.git$/, "")
      .trim();
  } catch {
    return "";
  }
}

async function dispatch(options) {
  if (!options.dispatch_repo) return;
  const token = process.env.GITHUB_TOKEN;
  if (!token) throw new Error("触发 GitHub workflow 需要 GITHUB_TOKEN 环境变量");
  const contentRepo = options.content_repo || process.env.CONTENT_REPO || remoteRepository(options.out);
  const contentSha = gitHead(options.out);
  if (!/^[0-9a-f]{40}$/.test(contentSha)) throw new Error("dispatch 需要内容仓库的 40 位 commit SHA");
  const response = await fetch(`https://api.github.com/repos/${options.dispatch_repo}/dispatches`, {
    method: "POST",
    headers: {
      Accept: "application/vnd.github+json",
      Authorization: `Bearer ${token}`,
      "X-GitHub-Api-Version": "2022-11-28",
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      event_type: "content-published",
      client_payload: { content_repo: contentRepo, content_sha: contentSha },
    }),
  });
  if (!response.ok) throw new Error(`GitHub dispatch 失败：${response.status} ${await response.text()}`);
  console.log(`[publish] 已触发 ${options.dispatch_repo} 的 content-published workflow`);
}

async function publish(options) {
  const source = absoluteExistingDirectory(options.source, "Obsidian Vault");
  const out = absoluteExistingDirectory(options.out, "输出目录");
  if (options.commit) {
    const gitRoot = runGit(out, ["rev-parse", "--show-toplevel"]);
    if (path.resolve(gitRoot).toLowerCase() !== out.toLowerCase()) throw new Error("--commit 输出必须是独立内容仓库根目录");
    if (runGit(out, ["status", "--porcelain"])) throw new Error("内容仓库有未提交改动，请先处理后再发布");
    runGit(out, ["config", "core.autocrlf", "false"]);
  }
  const initialParentSha = gitHead(out);
  const expectedParentSha = options.expected_parent_sha || initialParentSha;
  const relativeOutput = path.relative(source, out);
  if (!relativeOutput || (!relativeOutput.startsWith("..") && !path.isAbsolute(relativeOutput))) {
    throw new Error("--out 不能是 Vault 本身或 Vault 内的目录");
  }
  const published = readPublishedRoot(source, options.published);
  const baselineRegistry = path.join(out, "content-registry.json");
  const contract = validatePublishedRoot(published, { allowLegacy: options.allow_legacy,
    previousRegistry: fs.existsSync(baselineRegistry) ? JSON.parse(fs.readFileSync(baselineRegistry, "utf8")) : null });
  const postsSource = path.join(published, "posts");
  const snippetsSource = path.join(published, "snippets");
  const postFiles = listMarkdown(postsSource);
  const snippetFiles = listMarkdown(snippetsSource);
  ensureNoDuplicateNames(postFiles);
  ensureNoDuplicateNames(snippetFiles);
  const problemsSource = path.join(published, "problems.json");
  const problems = validateProblems(problemsSource);
  const sourceSnapshot = [...contract.sourceSnapshot];
  if (fs.existsSync(problemsSource)) {
    const buffer = fs.readFileSync(problemsSource);
    sourceSnapshot.push({ path: "problems.json", size: buffer.length, sha256: crypto.createHash("sha256").update(buffer).digest("hex") });
  }
  const removalDigest = sha256(jcs({
    expectedParentSha,
    nextSnapshotDigest: contract.manifest.snapshotDigest,
    removedIds: contract.removedIds,
  }));
  if (options.dry_run) {
    console.log(JSON.stringify({
      ok: true,
      readyPosts: contract.readyPosts.length,
      readySnippets: contract.readySnippets.length,
      assets: contract.assets.length,
      removedIds: contract.removedIds,
      removalDigest: contract.removedIds.length > 0 ? removalDigest : null,
      snapshotDigest: contract.manifest.snapshotDigest,
    }, null, 2));
    return;
  }
  if (contract.removedIds.length > 0 && contract.readyPosts.length === 0 && contract.readySnippets.length === 0 && !options.allow_empty) {
    throw new Error("公开内容将变为空站；必须显式提供 --allow-empty");
  }
  if (contract.removedIds.length > 0 && options.accept_removals !== removalDigest) {
    throw new Error(`本次包含撤稿，必须先 dry-run 并使用 --accept-removals ${removalDigest}`);
  }

  // Build a complete candidate beside the current output. The existing output
  // is left untouched until all source hashes pass a second verification.
  const stage = fs.mkdtempSync(path.join(path.dirname(out), `.content-stage-${process.pid}-`));
  try {
    assertExpectedParent(out, expectedParentSha, "内容仓库基线");
    const exportedPosts = copyFiles(contract.readyPosts, path.join(stage, "posts"), "posts");
    const exportedSnippets = copyFiles(contract.readySnippets, path.join(stage, "snippets"), "snippets");
    fs.copyFileSync(path.join(published, "site.json"), path.join(stage, "site.json"));
    copyAssets(path.join(published, "assets"), path.join(stage, "assets"), contract.assets);
    fs.writeFileSync(path.join(stage, "content-registry.json"), `${JSON.stringify(contract.registry, null, 2)}\n`, "utf8");
  if (fs.existsSync(problemsSource)) {
    fs.copyFileSync(problemsSource, path.join(stage, "problems.json"));
  }

    const manifest = {
    ...contract.manifest,
    posts: exportedPosts,
    snippets: exportedSnippets,
    assets: contract.assets.map((file) => file.relative),
  };
  manifest.snapshotDigest = crypto.createHash("sha256").update(JSON.stringify(manifest)).digest("hex");
    fs.writeFileSync(path.join(stage, ".content-export.json"), `${JSON.stringify(manifest, null, 2)}\n`, "utf8");
    fs.writeFileSync(path.join(stage, "content-manifest.json"), `${JSON.stringify(contract.manifest, null, 2)}\n`, "utf8");
    assertSourceUnchanged(published, sourceSnapshot);
    assertExpectedParent(out, expectedParentSha, "内容仓库基线");

    // A candidate is a complete snapshot. Rebuilding managed paths on every run
    // prevents deleted/drafted files from surviving in the next export.
    const managed = ["posts", "snippets", "assets", "site.json", "content-registry.json", "content-manifest.json", "problems.json", ".content-export.json"];
    const rollback = fs.mkdtempSync(path.join(path.dirname(out), ".content-rollback-"));
    try {
      for (const name of managed) if (fs.existsSync(path.join(out, name))) fs.cpSync(path.join(out, name), path.join(rollback, name), { recursive: true });
      try {
        removeGeneratedOutput(out);
        for (const name of managed) if (fs.existsSync(path.join(stage, name))) fs.cpSync(path.join(stage, name), path.join(out, name), { recursive: true });
        require("./content-verify.cjs").verifyContent(out);
      } catch (error) {
        removeGeneratedOutput(out);
        for (const name of managed) if (fs.existsSync(path.join(rollback, name))) fs.cpSync(path.join(rollback, name), path.join(out, name), { recursive: true });
        throw error;
      }
    } finally { fs.rmSync(rollback, { recursive: true, force: true }); }
    console.log(`[publish] 导出完成：${exportedPosts.length} 篇文章，${exportedSnippets.length} 个片段`);

  if (options.commit) {
    assertExpectedParent(out, expectedParentSha, "内容仓库基线");
    const message = options.message || `content: publish ${new Date().toISOString().slice(0, 10)}`;
    const gitPaths = ["posts", "snippets", "assets", "site.json", "content-registry.json", "content-manifest.json", ".content-export.json"];
    if (fs.existsSync(path.join(out, "problems.json"))) gitPaths.push("problems.json");
    runGit(out, ["add", ...gitPaths]);
    const status = runGit(out, ["status", "--porcelain"]);
    if (status) {
      runGit(out, ["commit", "-m", message]);
      console.log(`[publish] 已提交：${message}`);
    } else {
      console.log("[publish] 内容没有变化，跳过提交");
    }
  }
  if (options.push) {
    const ref = options.ref || process.env.CONTENT_BRANCH || "";
    if (!ref) throw new Error("--push 必须明确提供 --ref 或 CONTENT_BRANCH");
    const remote = remoteRepository(out) ? "origin" : null;
    if (remote) {
      const fetch = spawnSync("git", ["-C", out, "fetch", "--quiet", remote, ref], { encoding: "utf8" });
      if (fetch.status !== 0) throw new Error((fetch.stderr || fetch.stdout || "无法获取远端基线").trim());
      const remoteHead = runGit(out, ["rev-parse", `${remote}/${ref}`]);
      if (expectedParentSha && remoteHead !== expectedParentSha) throw new Error(`远端分支已前进：expectedParentSha=${expectedParentSha}，远端=${remoteHead}`);
      runGit(out, ["push", remote, `HEAD:${ref}`]);
    } else {
      runGit(out, ["push"]);
    }
    console.log("[publish] 已推送内容仓库");
  }
    await dispatch(options);
  } finally {
    fs.rmSync(stage, { recursive: true, force: true });
  }
}

async function main() {
  const options = parseArgs(process.argv.slice(2));
  const out = absoluteExistingDirectory(options.out, "输出目录");
  const lockPath = path.join(path.dirname(out), `.content-publish-${sha256(out.toLowerCase()).slice(0, 16)}.lock`);
  let lock;
  try { lock = fs.openSync(lockPath, "wx"); }
  catch { throw new Error(`内容发布已锁定：${lockPath}；若进程异常退出，请先确认没有发布任务再移除此锁`); }
  try { fs.writeFileSync(lock, JSON.stringify({ pid: process.pid, out, createdAt: new Date().toISOString() })); await publish(options); }
  finally { fs.closeSync(lock); fs.unlinkSync(lockPath); }
}

main().catch((error) => {
  console.error(`[publish] ${error.message}`);
  process.exitCode = 1;
});
