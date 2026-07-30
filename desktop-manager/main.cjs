const { app, BrowserWindow, ipcMain, shell, dialog } = require("electron");
const fs = require("fs");
const path = require("path");
const { spawn } = require("child_process");
const matter = require("gray-matter");

const APP_ROOT = path.resolve(__dirname, "..");
const DEFAULT_CONTENT_ROOT = path.join(APP_ROOT, "content");
const OPEN_NEXT_DIR = path.join(APP_ROOT, ".open-next");
const WORKSPACE_CONFIG_FILE = "manager-workspace.json";

const CATEGORY_PREFIX = {
  "算法板子": "KH_",
  "题解复盘": "wp_",
  "学习笔记": "",
  "专题训练": "sp_",
  "碎碎念": "",
};

const CATEGORY_NAMES = Object.keys(CATEGORY_PREFIX);

let mainWindow = null;
let previewProcess = null;
let workspaceInput = APP_ROOT;
let activeWorkspace = null;

function ensureDefaultDirs() {
  const postsDir = path.join(DEFAULT_CONTENT_ROOT, "posts");
  const snippetsDir = path.join(DEFAULT_CONTENT_ROOT, "snippets");
  const problemsFile = path.join(DEFAULT_CONTENT_ROOT, "problems.json");
  fs.mkdirSync(postsDir, { recursive: true });
  fs.mkdirSync(snippetsDir, { recursive: true });
  fs.mkdirSync(path.dirname(problemsFile), { recursive: true });
  if (!fs.existsSync(problemsFile)) fs.writeFileSync(problemsFile, "[]\n", "utf-8");
}

function configPath() {
  return path.join(app.getPath("userData"), WORKSPACE_CONFIG_FILE);
}

function loadWorkspaceInput() {
  try {
    const data = JSON.parse(fs.readFileSync(configPath(), "utf-8"));
    if (typeof data.workspace === "string" && fs.existsSync(data.workspace)) return data.workspace;
  } catch {}
  return APP_ROOT;
}

function saveWorkspaceInput(input) {
  try {
    fs.mkdirSync(path.dirname(configPath()), { recursive: true });
    fs.writeFileSync(configPath(), `${JSON.stringify({ workspace: input }, null, 2)}\n`, "utf-8");
  } catch {}
}

function nowText() {
  return new Date().toISOString().replace("T", " ").slice(0, 19);
}

function todayText() {
  return new Date().toISOString().slice(0, 10);
}

function slugify(text) {
  return String(text || "")
    .trim()
    .toLowerCase()
    .replace(/\s+/g, "-")
    .replace(/[\\/:*?"<>|]/g, "")
    .replace(/[^\w\-\u4e00-\u9fa5]/g, "")
    .slice(0, 70);
}

function parseTags(value) {
  if (Array.isArray(value)) return value.map(String).filter(Boolean);
  if (typeof value === "string") {
    try {
      const parsed = JSON.parse(value);
      if (Array.isArray(parsed)) return parsed.map(String).filter(Boolean);
    } catch {}
    return value.split(",").map((tag) => tag.trim()).filter(Boolean);
  }
  return [];
}

function parseCategory(filename, frontmatter = {}) {
  if (CATEGORY_NAMES.includes(frontmatter.category)) return frontmatter.category;
  if (filename.startsWith("KH") || filename.startsWith("ZU_")) return "算法板子";
  if (filename.startsWith("wp_")) return "题解复盘";
  if (filename.startsWith("sp_")) return "专题训练";
  if (filename.toLowerCase() === "diary.md") return "碎碎念";
  return "学习笔记";
}

function isMarkdownFile(filePath) {
  return [".md", ".mdx"].includes(path.extname(filePath).toLowerCase());
}

function extractCode(content) {
  const match = String(content || "").match(/```[\w#+-]*\n([\s\S]*?)```/);
  return match ? match[1].trimEnd() : String(content || "").trim();
}

function inferMarkdownKind(filePath) {
  const parentName = path.basename(path.dirname(filePath)).toLowerCase();
  if (parentName.includes("snippet") || parentName.includes("template")) return "snippet";
  try {
    const parsed = matter(fs.readFileSync(filePath, "utf-8"));
    if (parsed.data.language || parsed.data.description || parsed.data.created_at || parsed.data.updated_at) {
      return "snippet";
    }
  } catch {}
  return "post";
}

function uniqueFilename(dir, base) {
  const ext = path.extname(base) || ".md";
  const stem = path.basename(base, ext);
  let filename = `${stem}${ext}`;
  let index = 2;
  while (fs.existsSync(path.join(dir, filename))) {
    filename = `${stem}-${index}${ext}`;
    index += 1;
  }
  return filename;
}

function hasAny(paths) {
  return paths.some((item) => fs.existsSync(item));
}

function buildWorkspace(inputPath) {
  const input = path.resolve(String(inputPath || APP_ROOT));
  if (!fs.existsSync(input)) throw new Error(`路径不存在：${input}`);
  const stat = fs.statSync(input);
  if (stat.isFile()) return buildFileWorkspace(input);
  if (stat.isDirectory()) return buildFolderWorkspace(input);
  throw new Error(`不支持的工作区路径：${input}`);
}

function buildFileWorkspace(filePath) {
  const dir = path.dirname(filePath);
  const ext = path.extname(filePath).toLowerCase();
  if (isMarkdownFile(filePath)) {
    const kind = inferMarkdownKind(filePath);
    const label = kind === "snippet" ? "单个模板文件" : "单篇文章文件";
    return {
      mode: `single-${kind}`,
      input: filePath,
      root: dir,
      openPath: filePath,
      contentRoot: dir,
      postsDir: dir,
      snippetsDir: dir,
      problemsFile: path.join(dir, "problems.json"),
      singleFile: { kind, path: filePath },
      includePosts: kind === "post",
      includeSnippets: kind === "snippet",
      includeProblems: false,
      canCreate: { posts: false, snippets: false, problems: false },
      label,
    };
  }
  if (ext === ".json") {
    return {
      mode: "single-problems",
      input: filePath,
      root: dir,
      openPath: filePath,
      contentRoot: dir,
      postsDir: dir,
      snippetsDir: dir,
      problemsFile: filePath,
      singleFile: { kind: "problem", path: filePath },
      includePosts: false,
      includeSnippets: false,
      includeProblems: true,
      canCreate: { posts: false, snippets: false, problems: true },
      label: "单个题目 JSON",
    };
  }
  throw new Error("请选择 Markdown 文件、problems.json 或文件夹");
}

function buildFolderWorkspace(dir) {
  const basename = path.basename(dir).toLowerCase();
  const nestedContent = path.join(dir, "content");
  const hasNestedContent = hasAny([
    path.join(nestedContent, "posts"),
    path.join(nestedContent, "snippets"),
    path.join(nestedContent, "problems.json"),
  ]);
  const hasDirectContent = hasAny([
    path.join(dir, "posts"),
    path.join(dir, "snippets"),
    path.join(dir, "problems.json"),
  ]);

  if (hasNestedContent) {
    return folderWorkspace({
      mode: "project",
      label: "博客项目",
      input: dir,
      root: dir,
      openPath: dir,
      contentRoot: nestedContent,
      postsDir: path.join(nestedContent, "posts"),
      snippetsDir: path.join(nestedContent, "snippets"),
      problemsFile: path.join(nestedContent, "problems.json"),
      canCreate: { posts: true, snippets: true, problems: true },
    });
  }

  if (basename === "content" || hasDirectContent) {
    return folderWorkspace({
      mode: "content",
      label: "content 目录",
      input: dir,
      root: path.dirname(dir),
      openPath: dir,
      contentRoot: dir,
      postsDir: path.join(dir, "posts"),
      snippetsDir: path.join(dir, "snippets"),
      problemsFile: path.join(dir, "problems.json"),
      canCreate: { posts: true, snippets: true, problems: true },
    });
  }

  if (basename === "posts") {
    return folderWorkspace({
      mode: "posts-folder",
      label: "文章文件夹",
      input: dir,
      root: dir,
      openPath: dir,
      contentRoot: path.dirname(dir),
      postsDir: dir,
      snippetsDir: path.join(path.dirname(dir), "snippets"),
      problemsFile: path.join(path.dirname(dir), "problems.json"),
      includeSnippets: false,
      includeProblems: false,
      canCreate: { posts: true, snippets: false, problems: false },
    });
  }

  if (basename === "snippets") {
    return folderWorkspace({
      mode: "snippets-folder",
      label: "模板文件夹",
      input: dir,
      root: dir,
      openPath: dir,
      contentRoot: path.dirname(dir),
      postsDir: path.join(path.dirname(dir), "posts"),
      snippetsDir: dir,
      problemsFile: path.join(path.dirname(dir), "problems.json"),
      includePosts: false,
      includeProblems: false,
      canCreate: { posts: false, snippets: true, problems: false },
    });
  }

  return folderWorkspace({
    mode: "loose-folder",
    label: "普通文件夹",
    input: dir,
    root: dir,
    openPath: dir,
    contentRoot: dir,
    postsDir: dir,
    snippetsDir: dir,
    problemsFile: path.join(dir, "problems.json"),
    mixedMarkdownDir: dir,
    canCreate: { posts: true, snippets: true, problems: true },
  });
}

function folderWorkspace(config) {
  return {
    includePosts: true,
    includeSnippets: true,
    includeProblems: true,
    ...config,
  };
}

function currentWorkspace() {
  if (!activeWorkspace) activeWorkspace = buildWorkspace(workspaceInput);
  return activeWorkspace;
}

function setWorkspace(input) {
  activeWorkspace = buildWorkspace(input);
  workspaceInput = activeWorkspace.input;
  saveWorkspaceInput(workspaceInput);
  return activeWorkspace;
}

function readMarkdownFile(filePath, kind) {
  const raw = fs.readFileSync(filePath, "utf-8");
  const parsed = matter(raw);
  const stat = fs.statSync(filePath);
  const filename = path.basename(filePath);
  const tags = parseTags(parsed.data.tags);
  const basename = filename.replace(/\.mdx?$/, "");
  if (kind === "snippet") {
    const code = extractCode(parsed.content);
    return {
      kind,
      id: parsed.data.id || basename,
      filename,
      path: filePath,
      title: parsed.data.title || basename,
      language: parsed.data.language || "C++",
      description: parsed.data.description || "",
      tags,
      date: String(parsed.data.updated_at || parsed.data.created_at || "").slice(0, 10),
      mtime: stat.mtimeMs,
      summary: code.slice(0, 160),
    };
  }
  return {
    kind,
    filename,
    path: filePath,
    title: parsed.data.title || basename,
    category: parseCategory(filename, parsed.data),
    pinned: Boolean(parsed.data.pinned),
    tags,
    date: String(parsed.data.date || "").slice(0, 10) || todayText(),
    mtime: stat.mtimeMs,
    summary: parsed.content.replace(/[#*`[\]<>]/g, "").replace(/\s+/g, " ").trim().slice(0, 160),
  };
}

function listMarkdownFiles(dir) {
  if (!fs.existsSync(dir)) return [];
  return fs.readdirSync(dir)
    .map((filename) => path.join(dir, filename))
    .filter((filePath) => fs.statSync(filePath).isFile() && isMarkdownFile(filePath));
}

function readMarkdownList(dir, kind) {
  return listMarkdownFiles(dir)
    .map((filePath) => readMarkdownFile(filePath, kind))
    .sort((a, b) => b.mtime - a.mtime);
}

function readMixedMarkdownList(dir, kind) {
  return listMarkdownFiles(dir)
    .filter((filePath) => inferMarkdownKind(filePath) === kind)
    .map((filePath) => readMarkdownFile(filePath, kind))
    .sort((a, b) => b.mtime - a.mtime);
}

function readWorkspaceMarkdown(ws, kind) {
  if (ws.singleFile) {
    return ws.singleFile.kind === kind ? [readMarkdownFile(ws.singleFile.path, kind)] : [];
  }
  if (kind === "post" && !ws.includePosts) return [];
  if (kind === "snippet" && !ws.includeSnippets) return [];
  if (ws.mixedMarkdownDir) return readMixedMarkdownList(ws.mixedMarkdownDir, kind);
  return readMarkdownList(kind === "post" ? ws.postsDir : ws.snippetsDir, kind);
}

function loadProblems(filePath = currentWorkspace().problemsFile) {
  if (!fs.existsSync(filePath)) return [];
  try {
    const data = JSON.parse(fs.readFileSync(filePath, "utf-8"));
    if (!Array.isArray(data)) return [];
    return data.map((item) => ({
      id: String(item.id || Date.now().toString(36)),
      title: String(item.title || ""),
      url: String(item.url || ""),
      platform: String(item.platform || "cf"),
      status: String(item.status || "AC"),
      tags: parseTags(item.tags),
      date: String(item.date || ""),
      note: String(item.note || ""),
      analysis: String(item.analysis || ""),
      created_at: String(item.created_at || nowText()),
      updated_at: String(item.updated_at || nowText()),
      kind: "problem",
    }));
  } catch {
    return [];
  }
}

function saveProblems(problems, filePath = currentWorkspace().problemsFile) {
  fs.mkdirSync(path.dirname(filePath), { recursive: true });
  fs.writeFileSync(filePath, `${JSON.stringify(problems, null, 2)}\n`, "utf-8");
}

function collectTags(posts, snippets, problems) {
  const map = new Map();
  [...posts, ...snippets, ...problems].forEach((item) => {
    parseTags(item.tags).forEach((tag) => map.set(tag, (map.get(tag) || 0) + 1));
  });
  return Array.from(map.entries())
    .map(([tag, count]) => ({ tag, count }))
    .sort((a, b) => b.count - a.count || a.tag.localeCompare(b.tag, "zh-CN"));
}

function workspacePathHints(ws) {
  const markdownHint = (dir) => `${dir}${path.sep}*.md`;
  return {
    posts: ws.singleFile?.kind === "post"
      ? ws.singleFile.path
      : ws.includePosts ? markdownHint(ws.postsDir) : "当前工作区未启用文章",
    snippets: ws.singleFile?.kind === "snippet"
      ? ws.singleFile.path
      : ws.includeSnippets ? markdownHint(ws.snippetsDir) : "当前工作区未启用模板片段",
    problems: ws.includeProblems ? ws.problemsFile : "当前工作区未启用题目 JSON",
    tags: "聚合当前工作区内已解析内容的标签",
  };
}

function getSnapshot() {
  const ws = currentWorkspace();
  const posts = readWorkspaceMarkdown(ws, "post");
  const snippets = readWorkspaceMarkdown(ws, "snippet");
  const problems = ws.includeProblems ? loadProblems(ws.problemsFile) : [];
  return {
    root: ws.root,
    input: ws.input,
    openPath: ws.openPath,
    mode: ws.mode,
    workspaceLabel: ws.label,
    paths: {
      contentRoot: ws.contentRoot,
      postsDir: ws.postsDir,
      snippetsDir: ws.snippetsDir,
      problemsFile: ws.problemsFile,
    },
    pathHints: workspacePathHints(ws),
    canCreate: ws.canCreate,
    posts,
    snippets,
    problems,
    tags: collectTags(posts, snippets, problems),
    categories: CATEGORY_NAMES,
  };
}

function writeMarkdown(filePath, data, content) {
  const next = matter.stringify(String(content || "").replace(/^\n+/, ""), data);
  fs.writeFileSync(filePath, next, "utf-8");
}

function resolveInside(root, target) {
  const rootPath = path.resolve(root);
  const resolved = path.resolve(rootPath, String(target || ""));
  const relative = path.relative(rootPath, resolved);
  if (relative && (relative.startsWith("..") || path.isAbsolute(relative))) {
    throw new Error("Path is outside the managed workspace");
  }
  return resolved;
}

function resolveManagedMarkdownPath(kind, itemOrFilename) {
  const ws = currentWorkspace();
  if (ws.singleFile) {
    if (ws.singleFile.kind !== kind) throw new Error("当前工作区不是这个内容类型");
    return ws.singleFile.path;
  }
  if (itemOrFilename && typeof itemOrFilename === "object" && itemOrFilename.path) {
    return resolveInside(ws.root, itemOrFilename.path);
  }
  if (kind === "post" && !ws.includePosts) throw new Error("当前工作区未启用文章");
  if (kind === "snippet" && !ws.includeSnippets) throw new Error("当前工作区未启用模板片段");
  return resolveInside(kind === "post" ? ws.postsDir : ws.snippetsDir, itemOrFilename);
}

function updateMarkdownFile(filePath, patch) {
  if (!fs.existsSync(filePath)) throw new Error(`File not found: ${filePath}`);
  const parsed = matter(fs.readFileSync(filePath, "utf-8"));
  const data = { ...parsed.data, ...patch };
  writeMarkdown(filePath, data, parsed.content);
}

function updateMarkdownMeta(kind, filename, patch) {
  updateMarkdownFile(resolveManagedMarkdownPath(kind, filename), patch);
}

function createPost(payload) {
  const ws = currentWorkspace();
  if (!ws.canCreate.posts) throw new Error("当前工作区不能新建文章");
  const title = String(payload.title || "").trim();
  if (!title) throw new Error("请输入文章标题");
  fs.mkdirSync(ws.postsDir, { recursive: true });
  const category = CATEGORY_NAMES.includes(payload.category) ? payload.category : "学习笔记";
  const prefix = CATEGORY_PREFIX[category] || "";
  const filename = uniqueFilename(ws.postsDir, `${prefix}${slugify(title) || "untitled"}.md`);
  const data = {
    title,
    date: payload.date || todayText(),
    category,
    pinned: Boolean(payload.pinned),
    tags: parseTags(payload.tags),
  };
  writeMarkdown(path.join(ws.postsDir, filename), data, "\n");
  return path.join(ws.postsDir, filename);
}

function createSnippet(payload) {
  const ws = currentWorkspace();
  if (!ws.canCreate.snippets) throw new Error("当前工作区不能新建模板片段");
  const title = String(payload.title || "").trim();
  if (!title) throw new Error("请输入模板标题");
  fs.mkdirSync(ws.snippetsDir, { recursive: true });
  const filename = uniqueFilename(ws.snippetsDir, `${slugify(title) || "snippet"}.md`);
  const id = filename.replace(/\.md$/, "");
  const language = payload.language || "C++";
  const data = {
    id,
    title,
    language,
    tags: parseTags(payload.tags),
    description: payload.description || "",
    created_at: nowText(),
    updated_at: nowText(),
  };
  writeMarkdown(path.join(ws.snippetsDir, filename), data, `\`\`\`${language}\n${payload.code || ""}\n\`\`\`\n`);
  return path.join(ws.snippetsDir, filename);
}

function createProblem(payload) {
  const ws = currentWorkspace();
  if (!ws.canCreate.problems) throw new Error("当前工作区不能新建题目");
  const title = String(payload.title || "").trim();
  if (!title) throw new Error("请输入题目标题");
  const problems = loadProblems(ws.problemsFile);
  const now = nowText();
  const problem = {
    id: payload.id || `${Date.now().toString(36)}${Math.random().toString(36).slice(2, 8)}`,
    title,
    url: String(payload.url || ""),
    platform: payload.platform || "cf",
    status: payload.status || "AC",
    tags: parseTags(payload.tags),
    date: payload.date || todayText(),
    note: payload.note || "",
    analysis: payload.analysis || "",
    created_at: now,
    updated_at: now,
  };
  problems.unshift(problem);
  saveProblems(problems, ws.problemsFile);
  return problem.id;
}

function updateProblem(id, patch) {
  const ws = currentWorkspace();
  if (!ws.includeProblems) throw new Error("当前工作区未启用题目 JSON");
  const problems = loadProblems(ws.problemsFile);
  const index = problems.findIndex((item) => item.id === id);
  if (index < 0) throw new Error(`Problem not found: ${id}`);
  problems[index] = {
    ...problems[index],
    ...patch,
    tags: patch.tags !== undefined ? parseTags(patch.tags) : problems[index].tags,
    updated_at: nowText(),
  };
  saveProblems(problems.map(({ kind, ...item }) => item), ws.problemsFile);
}

function renameTag({ from, to }) {
  const oldTag = String(from || "").trim();
  const newTag = String(to || "").trim();
  if (!oldTag || !newTag) throw new Error("请输入原标签和新标签");

  const ws = currentWorkspace();
  for (const post of readWorkspaceMarkdown(ws, "post")) {
    const tags = post.tags.map((tag) => (tag === oldTag ? newTag : tag));
    if (JSON.stringify(tags) !== JSON.stringify(post.tags)) updateMarkdownFile(post.path, { tags });
  }
  for (const snippet of readWorkspaceMarkdown(ws, "snippet")) {
    const tags = snippet.tags.map((tag) => (tag === oldTag ? newTag : tag));
    if (JSON.stringify(tags) !== JSON.stringify(snippet.tags)) updateMarkdownFile(snippet.path, { tags, updated_at: nowText() });
  }
  if (ws.includeProblems) {
    const problems = loadProblems(ws.problemsFile).map(({ kind, ...problem }) => ({
      ...problem,
      tags: problem.tags.map((tag) => (tag === oldTag ? newTag : tag)),
      updated_at: problem.tags.includes(oldTag) ? nowText() : problem.updated_at,
    }));
    saveProblems(problems, ws.problemsFile);
  }
}

function resolveItemPath(item) {
  const ws = currentWorkspace();
  if (!item) return ws.openPath;
  if (item.kind === "post") return resolveManagedMarkdownPath("post", item.filename || path.basename(item.path || ""));
  if (item.kind === "snippet") return resolveManagedMarkdownPath("snippet", item.filename || path.basename(item.path || ""));
  if (item.kind === "problem") return ws.problemsFile;
  return ws.openPath;
}

function openVSCode(targetPath) {
  const localCode = path.join(process.env.LOCALAPPDATA || "", "Programs", "Microsoft VS Code", "bin", "code.cmd");
  const candidates = process.platform === "win32"
    ? [localCode].filter((candidate) => fs.existsSync(candidate))
    : ["code"];
  for (const candidate of candidates) {
    try {
      const child = spawn(candidate, [targetPath], { cwd: APP_ROOT, detached: true, stdio: "ignore", shell: false });
      child.unref();
      return true;
    } catch {}
  }
  shell.openPath(targetPath);
  return false;
}

function runCommand(label, command, args, onLog) {
  return new Promise((resolve) => {
    onLog(`\n$ ${[command, ...args].join(" ")}\n`);
    const child = spawn(command, args, { cwd: APP_ROOT, shell: false });
    child.stdout.on("data", (chunk) => onLog(chunk.toString()));
    child.stderr.on("data", (chunk) => onLog(chunk.toString()));
    child.on("close", (code) => {
      onLog(`\n[${label}] exited with code ${code}\n`);
      resolve(code === 0);
    });
    child.on("error", (error) => {
      onLog(`\n[${label}] ${error.message}\n`);
      resolve(false);
    });
  });
}

async function runPublishTask(task, payload, event) {
  const send = (text) => event.sender.send("manager:log", text);
  if (task === "build") {
    const npmCommand = process.platform === "win32" ? "npm.cmd" : "npm";
    return runCommand("build", npmCommand, ["run", "build"], send);
  }
  if (task === "git") {
    const status = await new Promise((resolve) => {
      const child = spawn("git", ["status", "--short"], { cwd: APP_ROOT, shell: false });
      let output = "";
      child.stdout.on("data", (chunk) => (output += chunk.toString()));
      child.on("close", () => resolve(output.trim()));
    });
    if (!status) {
      send("工作区没有需要提交的改动。\n");
      return true;
    }
    send(`待提交改动:\n${status}\n`);
    const message = String(payload?.message || "").trim() || `chore: update blog ${nowText()}`;
    if (!(await runCommand("git add", "git", ["add", "-A"], send))) return false;
    const committed = await runCommand("git commit", "git", ["commit", "-m", message], send);
    if (!committed) return false;
    return runCommand("git push", "git", ["push", "origin", "main"], send);
  }
  if (task === "deploy") {
    if (previewProcess && !previewProcess.killed) {
      send("Stopping local preview before deploy...\n");
      previewProcess.kill();
      previewProcess = null;
    }
    return runCommand("deploy", "powershell.exe", ["-NoProfile", "-ExecutionPolicy", "Bypass", "-File", "deploy.ps1", "-SkipGit"], send);
  }
  if (task === "syncSearchIndex") {
    return runCommand("sync search index", "powershell.exe", ["-NoProfile", "-ExecutionPolicy", "Bypass", "-File", path.join("scripts", "sync-search-index.ps1")], send);
  }
  throw new Error(`Unknown task: ${task}`);
}

async function selectWorkspace() {
  const choice = await dialog.showMessageBox(mainWindow, {
    type: "question",
    buttons: ["选择文件夹", "选择文件", "取消"],
    defaultId: 0,
    cancelId: 2,
    title: "切换工作区",
    message: "你想管理一个文件夹，还是单个 Markdown/JSON 文件？",
  });
  if (choice.response === 2) return null;
  const openDirectory = choice.response === 0;
  const result = await dialog.showOpenDialog(mainWindow, {
    title: openDirectory ? "选择要管理的文件夹" : "选择要管理的文件",
    defaultPath: currentWorkspace().openPath,
    properties: [openDirectory ? "openDirectory" : "openFile"],
    filters: [
      { name: "Markdown / JSON", extensions: ["md", "mdx", "json"] },
      { name: "All Files", extensions: ["*"] },
    ],
  });
  if (result.canceled || !result.filePaths[0]) return null;
  setWorkspace(result.filePaths[0]);
  return getSnapshot();
}

function resetWorkspace() {
  setWorkspace(APP_ROOT);
  ensureDefaultDirs();
  return getSnapshot();
}

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1220,
    height: 780,
    minWidth: 980,
    minHeight: 620,
    title: "Keronshans Blog Manager",
    backgroundColor: "#f7faf7",
    webPreferences: {
      preload: path.join(__dirname, "preload.cjs"),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: true,
    },
  });
  mainWindow.loadFile(path.join(__dirname, "renderer", "index.html"));
}

app.whenReady().then(() => {
  ensureDefaultDirs();
  workspaceInput = loadWorkspaceInput();
  try {
    currentWorkspace();
  } catch {
    workspaceInput = APP_ROOT;
    activeWorkspace = null;
    currentWorkspace();
  }
  createWindow();
});

app.on("window-all-closed", () => {
  if (previewProcess) previewProcess.kill();
  if (process.platform !== "darwin") app.quit();
});

ipcMain.handle("manager:snapshot", () => getSnapshot());
ipcMain.handle("manager:selectWorkspace", () => selectWorkspace());
ipcMain.handle("manager:resetWorkspace", () => resetWorkspace());
ipcMain.handle("manager:createPost", (_event, payload) => createPost(payload));
ipcMain.handle("manager:createSnippet", (_event, payload) => createSnippet(payload));
ipcMain.handle("manager:createProblem", (_event, payload) => createProblem(payload));
ipcMain.handle("manager:updatePost", (_event, payload) => updateMarkdownMeta("post", payload.item || payload.filename, payload.patch));
ipcMain.handle("manager:updateSnippet", (_event, payload) => updateMarkdownMeta("snippet", payload.item || payload.filename, { ...payload.patch, updated_at: nowText() }));
ipcMain.handle("manager:updateProblem", (_event, payload) => updateProblem(payload.id, payload.patch));
ipcMain.handle("manager:renameTag", (_event, payload) => renameTag(payload));
ipcMain.handle("manager:openProject", () => openVSCode(currentWorkspace().openPath));
ipcMain.handle("manager:openItem", (_event, item) => openVSCode(resolveItemPath(item)));
ipcMain.handle("manager:showInFolder", (_event, item) => shell.showItemInFolder(resolveItemPath(item)));
ipcMain.handle("manager:publish", (event, payload) => runPublishTask(String(payload?.task || ""), payload, event));
ipcMain.handle("manager:cleanupOpenNext", async () => {
  const result = await dialog.showMessageBox(mainWindow, {
    type: "warning",
    buttons: ["取消", "只删除 .open-next"],
    defaultId: 0,
    cancelId: 0,
    title: "清理 .open-next",
    message: "这会删除 Cloudflare/OpenNext 的本地构建输出目录，不会删除文章或源码。",
  });
  if (result.response !== 1) return false;
  if (fs.existsSync(OPEN_NEXT_DIR)) fs.rmSync(OPEN_NEXT_DIR, { recursive: true, force: true });
  return true;
});
ipcMain.handle("manager:preview", () => {
  if (previewProcess && !previewProcess.killed) {
    shell.openExternal("http://localhost:3000");
    return true;
  }
  const npmCommand = process.platform === "win32" ? "npm.cmd" : "npm";
  previewProcess = spawn(npmCommand, ["run", "dev"], { cwd: APP_ROOT, shell: false });
  previewProcess.stdout.on("data", (chunk) => mainWindow?.webContents.send("manager:log", chunk.toString()));
  previewProcess.stderr.on("data", (chunk) => mainWindow?.webContents.send("manager:log", chunk.toString()));
  setTimeout(() => shell.openExternal("http://localhost:3000"), 3500);
  return true;
});
