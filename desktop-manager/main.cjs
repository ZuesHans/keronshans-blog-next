const { app, BrowserWindow, ipcMain, shell, dialog } = require("electron");
const fs = require("fs");
const path = require("path");
const { spawn } = require("child_process");
const matter = require("gray-matter");

const APP_ROOT = path.resolve(__dirname, "..");
const POSTS_DIR = path.join(APP_ROOT, "content", "posts");
const SNIPPETS_DIR = path.join(APP_ROOT, "content", "snippets");
const PROBLEMS_FILE = path.join(APP_ROOT, "content", "problems.json");
const OPEN_NEXT_DIR = path.join(APP_ROOT, ".open-next");

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

function ensureDirs() {
  fs.mkdirSync(POSTS_DIR, { recursive: true });
  fs.mkdirSync(SNIPPETS_DIR, { recursive: true });
  fs.mkdirSync(path.dirname(PROBLEMS_FILE), { recursive: true });
  if (!fs.existsSync(PROBLEMS_FILE)) fs.writeFileSync(PROBLEMS_FILE, "[]\n", "utf-8");
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

function readMarkdownList(dir, kind) {
  if (!fs.existsSync(dir)) return [];
  return fs.readdirSync(dir)
    .filter((filename) => filename.endsWith(".md"))
    .map((filename) => {
      const filePath = path.join(dir, filename);
      const raw = fs.readFileSync(filePath, "utf-8");
      const parsed = matter(raw);
      const stat = fs.statSync(filePath);
      const tags = parseTags(parsed.data.tags);
      if (kind === "snippet") {
        const code = extractCode(parsed.content);
        return {
          kind,
          id: parsed.data.id || filename.replace(/\.md$/, ""),
          filename,
          path: filePath,
          title: parsed.data.title || filename.replace(/\.md$/, ""),
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
        title: parsed.data.title || filename.replace(/\.md$/, ""),
        category: parseCategory(filename, parsed.data),
        pinned: Boolean(parsed.data.pinned),
        tags,
        date: String(parsed.data.date || "").slice(0, 10) || todayText(),
        mtime: stat.mtimeMs,
        summary: parsed.content.replace(/[#*`[\]<>]/g, "").replace(/\s+/g, " ").trim().slice(0, 160),
      };
    })
    .sort((a, b) => b.mtime - a.mtime);
}

function extractCode(content) {
  const match = String(content || "").match(/```[\w#+-]*\n([\s\S]*?)```/);
  return match ? match[1].trimEnd() : String(content || "").trim();
}

function loadProblems() {
  ensureDirs();
  try {
    const data = JSON.parse(fs.readFileSync(PROBLEMS_FILE, "utf-8"));
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

function saveProblems(problems) {
  fs.writeFileSync(PROBLEMS_FILE, `${JSON.stringify(problems, null, 2)}\n`, "utf-8");
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

function getSnapshot() {
  ensureDirs();
  const posts = readMarkdownList(POSTS_DIR, "post");
  const snippets = readMarkdownList(SNIPPETS_DIR, "snippet");
  const problems = loadProblems();
  return {
    root: APP_ROOT,
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

function updateMarkdownMeta(dir, filename, patch) {
  const filePath = path.join(dir, filename);
  if (!fs.existsSync(filePath)) throw new Error(`File not found: ${filename}`);
  const parsed = matter(fs.readFileSync(filePath, "utf-8"));
  const data = { ...parsed.data, ...patch };
  writeMarkdown(filePath, data, parsed.content);
}

function createPost(payload) {
  const title = String(payload.title || "").trim();
  if (!title) throw new Error("请输入文章标题");
  const category = CATEGORY_NAMES.includes(payload.category) ? payload.category : "学习笔记";
  const prefix = CATEGORY_PREFIX[category] || "";
  const filename = uniqueFilename(POSTS_DIR, `${prefix}${slugify(title) || "untitled"}.md`);
  const data = {
    title,
    date: payload.date || todayText(),
    category,
    pinned: Boolean(payload.pinned),
    tags: parseTags(payload.tags),
  };
  writeMarkdown(path.join(POSTS_DIR, filename), data, "\n");
  return filename;
}

function createSnippet(payload) {
  const title = String(payload.title || "").trim();
  if (!title) throw new Error("请输入模板标题");
  const filename = uniqueFilename(SNIPPETS_DIR, `${slugify(title) || "snippet"}.md`);
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
  writeMarkdown(path.join(SNIPPETS_DIR, filename), data, `\`\`\`${language}\n${payload.code || ""}\n\`\`\`\n`);
  return filename;
}

function createProblem(payload) {
  const title = String(payload.title || "").trim();
  if (!title) throw new Error("请输入题目标题");
  const problems = loadProblems();
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
  saveProblems(problems);
  return problem.id;
}

function updateProblem(id, patch) {
  const problems = loadProblems();
  const index = problems.findIndex((item) => item.id === id);
  if (index < 0) throw new Error(`Problem not found: ${id}`);
  problems[index] = {
    ...problems[index],
    ...patch,
    tags: patch.tags !== undefined ? parseTags(patch.tags) : problems[index].tags,
    updated_at: nowText(),
  };
  saveProblems(problems.map(({ kind, ...item }) => item));
}

function renameTag({ from, to }) {
  const oldTag = String(from || "").trim();
  const newTag = String(to || "").trim();
  if (!oldTag || !newTag) throw new Error("请输入原标签和新标签");

  for (const post of readMarkdownList(POSTS_DIR, "post")) {
    const tags = post.tags.map((tag) => (tag === oldTag ? newTag : tag));
    if (JSON.stringify(tags) !== JSON.stringify(post.tags)) updateMarkdownMeta(POSTS_DIR, post.filename, { tags });
  }
  for (const snippet of readMarkdownList(SNIPPETS_DIR, "snippet")) {
    const tags = snippet.tags.map((tag) => (tag === oldTag ? newTag : tag));
    if (JSON.stringify(tags) !== JSON.stringify(snippet.tags)) updateMarkdownMeta(SNIPPETS_DIR, snippet.filename, { tags, updated_at: nowText() });
  }
  const problems = loadProblems().map(({ kind, ...problem }) => ({
    ...problem,
    tags: problem.tags.map((tag) => (tag === oldTag ? newTag : tag)),
    updated_at: problem.tags.includes(oldTag) ? nowText() : problem.updated_at,
  }));
  saveProblems(problems);
}

function resolveItemPath(item) {
  if (!item) return APP_ROOT;
  if (item.kind === "post") return path.join(POSTS_DIR, item.filename);
  if (item.kind === "snippet") return path.join(SNIPPETS_DIR, item.filename);
  if (item.kind === "problem") return PROBLEMS_FILE;
  return APP_ROOT;
}

function openVSCode(targetPath) {
  const candidates = [
    "code",
    path.join(process.env.LOCALAPPDATA || "", "Programs", "Microsoft VS Code", "bin", "code.cmd"),
  ];
  for (const candidate of candidates) {
    try {
      const child = spawn(candidate, [targetPath], { cwd: APP_ROOT, detached: true, stdio: "ignore", shell: candidate === "code" });
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
    return runCommand("build", "npm", ["run", "build"], send);
  }
  if (task === "git") {
    const status = await new Promise((resolve) => {
      const child = spawn("git", ["status", "--short"], { cwd: APP_ROOT, shell: true });
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
    },
  });
  mainWindow.loadFile(path.join(__dirname, "renderer", "index.html"));
}

app.whenReady().then(() => {
  ensureDirs();
  createWindow();
});

app.on("window-all-closed", () => {
  if (previewProcess) previewProcess.kill();
  if (process.platform !== "darwin") app.quit();
});

ipcMain.handle("manager:snapshot", () => getSnapshot());
ipcMain.handle("manager:createPost", (_event, payload) => createPost(payload));
ipcMain.handle("manager:createSnippet", (_event, payload) => createSnippet(payload));
ipcMain.handle("manager:createProblem", (_event, payload) => createProblem(payload));
ipcMain.handle("manager:updatePost", (_event, payload) => updateMarkdownMeta(POSTS_DIR, payload.filename, payload.patch));
ipcMain.handle("manager:updateSnippet", (_event, payload) => updateMarkdownMeta(SNIPPETS_DIR, payload.filename, { ...payload.patch, updated_at: nowText() }));
ipcMain.handle("manager:updateProblem", (_event, payload) => updateProblem(payload.id, payload.patch));
ipcMain.handle("manager:renameTag", (_event, payload) => renameTag(payload));
ipcMain.handle("manager:openProject", () => openVSCode(APP_ROOT));
ipcMain.handle("manager:openItem", (_event, item) => openVSCode(resolveItemPath(item)));
ipcMain.handle("manager:showInFolder", (_event, item) => shell.showItemInFolder(resolveItemPath(item)));
ipcMain.handle("manager:publish", (event, payload) => runPublishTask(payload.task, payload, event));
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
  previewProcess = spawn("npm", ["run", "dev"], { cwd: APP_ROOT, shell: true });
  previewProcess.stdout.on("data", (chunk) => mainWindow?.webContents.send("manager:log", chunk.toString()));
  previewProcess.stderr.on("data", (chunk) => mainWindow?.webContents.send("manager:log", chunk.toString()));
  setTimeout(() => shell.openExternal("http://localhost:3000"), 3500);
  return true;
});
