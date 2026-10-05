const fs = require("node:fs");
const path = require("node:path");
const crypto = require("node:crypto");
const matter = require("gray-matter");
const { unified } = require("unified");
const remarkParse = require("remark-parse").default;

const POST_CATEGORIES = new Set(["algorithm", "review", "study", "collection", "journal"]);
const LANGUAGES = new Set(["cpp", "python", "javascript", "typescript", "bash", "plaintext"]);
const POST_FIELDS = new Set(["schemaVersion", "kind", "id", "slug", "status", "title", "date", "updatedAt", "category", "tags", "description", "pinned", "aliases", "cover"]);
const SNIPPET_FIELDS = new Set(["schemaVersion", "kind", "id", "slug", "status", "title", "updatedAt", "tags", "description", "language"]);
const IMAGE_EXTENSIONS = new Set([".png", ".jpg", ".jpeg", ".webp", ".gif", ".avif"]);
const MAX_POST_BYTES = 2 * 1024 * 1024;
const MAX_IMAGE_BYTES = 10 * 1024 * 1024;
const MAX_EXPORT_BYTES = 200 * 1024 * 1024;

function fail(message) { throw new Error(message); }

function assertNoUnknownFields(data, allowed, label) {
  for (const key of Object.keys(data)) if (!allowed.has(key)) fail(`${label}包含未知字段：${key}`);
}

function assertString(value, label, max = Infinity) {
  if (typeof value !== "string" || value.length > max) fail(`${label}无效`);
  return value;
}

function assertList(value, label, maxItems = 20, maxItem = 40) {
  if (!Array.isArray(value) || value.length > maxItems) fail(`${label}无效`);
  const seen = new Set();
  return value.map((item) => {
    assertString(item, `${label}项`, maxItem);
    const normalized = item.normalize("NFC").trim();
    assertString(normalized, `${label}项`, maxItem);
    if (seen.has(normalized)) fail(`${label}存在重复项：${normalized}`);
    seen.add(normalized);
    return normalized;
  });
}

function assertDate(value, label) {
  assertString(value, label);
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value) || Number.isNaN(Date.parse(`${value}T00:00:00Z`))) fail(`${label}必须是有效 YYYY-MM-DD`);
}

function assertUpdatedAt(value) {
  assertString(value, "updatedAt");
  if (!/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d+)?(?:Z|[+-]\d{2}:\d{2})$/.test(value) || Number.isNaN(Date.parse(value))) fail("updatedAt 必须是带时区的 RFC3339 时间");
}

function validateIdentity(data, kind) {
  if (data.schemaVersion !== 1 || data.kind !== kind) fail(`${kind} 必须使用 schemaVersion: 1`);
  if (typeof data.id !== "string" || !/^[a-z0-9][a-z0-9_-]{0,79}$/.test(data.id)) fail(`${kind} id 格式无效：${data.id}`);
  if (typeof data.slug !== "string" || !/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(data.slug) || data.slug.length > 100) fail(`${kind} slug 格式无效：${data.slug}`);
  if (data.status !== "draft" && data.status !== "ready") fail(`${kind} status 只能是 draft 或 ready`);
}

function validatePost(data) {
  assertNoUnknownFields(data, POST_FIELDS, "文章 frontmatter ");
  validateIdentity(data, "post");
  assertString(data.title, "title", 120);
  if (!data.title.trim()) fail("title 不能为空");
  assertDate(data.date, "date");
  assertUpdatedAt(data.updatedAt);
  if (!POST_CATEGORIES.has(data.category)) fail(`category 无效：${data.category}`);
  assertList(data.tags, "tags");
  assertString(data.description, "description", 240);
  if (typeof data.pinned !== "boolean") fail("pinned 必须是 boolean");
  const aliases = assertList(data.aliases, "aliases", 50, 120);
  for (const alias of aliases) if (!/^\/posts\/[a-z0-9][a-z0-9_-]*$/.test(alias)) fail(`alias 必须是历史文章路径：${alias}`);
  if (data.cover !== undefined) assertString(data.cover, "cover", 300);
  return { ...data, tags: assertList(data.tags, "tags"), aliases };
}

function validateSnippet(data, body) {
  assertNoUnknownFields(data, SNIPPET_FIELDS, "模板 frontmatter ");
  validateIdentity(data, "snippet");
  assertString(data.title, "title", 120);
  if (!data.title.trim()) fail("title 不能为空");
  assertUpdatedAt(data.updatedAt);
  const tags = assertList(data.tags, "tags");
  assertString(data.description, "description", 240);
  if (typeof data.language !== "string" || !LANGUAGES.has(data.language.toLowerCase())) fail(`模板 language 无效：${data.language}`);
  const blocks = [...body.matchAll(/^```([^\r\n`]*)\r?\n[\s\S]*?^```\s*$/gm)];
  if (blocks.length !== 1 || !LANGUAGES.has(String(blocks[0][1]).trim().toLowerCase())) fail("模板必须恰好包含一个已标记的 fenced code block");
  if (String(data.language).toLowerCase() !== String(blocks[0][1]).trim().toLowerCase()) fail("模板 language 与代码块标记不一致");
  return { ...data, tags };
}

function validateMarkdown(filePath, kind, allowLegacy = false) {
  const raw = fs.readFileSync(filePath);
  if (raw.length > MAX_POST_BYTES) fail(`${kind} 超过 2 MiB：${filePath}`);
  if (raw[0] === 0xef && raw[1] === 0xbb && raw[2] === 0xbf) fail(`文本包含 BOM：${filePath}`);
  const text = raw.toString("utf8");
  if (/\r\n/.test(text)) fail(`文本必须使用 LF 换行：${filePath}`);
  const parsed = matter(text);
  if (parsed.content.includes("[[") || /!\[\[/.test(parsed.content)) fail(`不支持 Obsidian 双链或嵌入：${filePath}`);
  const markdownTree = unified().use(remarkParse).parse(parsed.content);
  if (containsRawHtml(markdownTree)) fail(`不支持原始 HTML：${filePath}`);
  validateMarkdownLinks(markdownTree, filePath);
  if (/!\[[^\]]*\]\(([^)]+)\)/g.test(parsed.content)) {
    for (const match of parsed.content.matchAll(/!\[[^\]]*\]\(([^)]+)\)/g)) {
      const target = match[1].trim().split(/\s+/)[0];
      if (/^(?:https?:|data:|javascript:)/i.test(target)) fail(`图片必须使用站内资源：${filePath}`);
    }
  }
  const looksLegacy = parsed.data.schemaVersion === undefined && parsed.data.kind === undefined;
  if (looksLegacy && allowLegacy) return { data: null, content: parsed.content, bytes: raw.length, legacy: true };
  try {
    if (kind === "post") return { data: validatePost(parsed.data), content: parsed.content, bytes: raw.length };
    return { data: validateSnippet(parsed.data, parsed.content), content: parsed.content, bytes: raw.length };
  } catch (error) {
    throw new Error(`${filePath}: ${error.message}`);
  }
}

function validateSite(sitePath) {
  let site;
  try { site = JSON.parse(fs.readFileSync(sitePath, "utf8")); } catch (error) { fail(`site.json 无效：${error.message}`); }
  const allowed = new Set(["schemaVersion", "siteId", "title", "description", "author", "navigation", "socialLinks"]);
  assertNoUnknownFields(site, allowed, "site.json ");
  if (site.schemaVersion !== 1 || site.siteId !== "keronshans") fail("site.json schemaVersion/siteId 无效");
  assertString(site.title, "site.title", 80);
  assertString(site.description, "site.description", 240);
  if (!site.author || typeof site.author !== "object" || Array.isArray(site.author)) fail("site.author 无效");
  assertNoUnknownFields(site.author, new Set(["name", "avatar"]), "site.author ");
  assertString(site.author.name, "site.author.name", 80);
  if (site.author.avatar !== undefined) assertString(site.author.avatar, "site.author.avatar", 300);
  validateSiteLinks(site.navigation, "navigation", 12);
  validateSiteLinks(site.socialLinks, "socialLinks", 8);
  return site;
}

function isAllowedLink(value) {
  if (/^[a-z][a-z0-9+.-]*:/i.test(value)) return /^(?:https:\/\/|mailto:)/i.test(value);
  return !value.startsWith("//") && !value.includes("\u0000");
}

function validateSiteLinks(value, label, maxItems) {
  if (value === undefined) return;
  if (!Array.isArray(value) || value.length > maxItems) fail(`site.${label} 无效`);
  for (const item of value) {
    if (!item || typeof item !== "object" || Array.isArray(item)) fail(`site.${label} 项无效`);
    assertNoUnknownFields(item, new Set(["label", "href"]), `site.${label} `);
    assertString(item.label, `site.${label}.label`, 30);
    assertString(item.href, `site.${label}.href`, 500);
    if (!isAllowedLink(item.href)) fail(`site.${label}.href 协议不受支持：${item.href}`);
  }
}

function containsRawHtml(node) {
  if (node.type === "html") return true;
  return Array.isArray(node.children) && node.children.some(containsRawHtml);
}

function validateMarkdownLinks(tree, filePath) {
  const visit = (node) => {
    if (node.type === "link" && typeof node.url === "string" && !isAllowedLink(node.url)) fail(`链接协议不受支持：${filePath}`);
    if (Array.isArray(node.children)) node.children.forEach(visit);
  };
  visit(tree);
}

function safeRelativePath(relative) {
  const normalized = relative.replaceAll("\\", "/").normalize("NFC");
  if (!normalized || normalized.startsWith("/") || normalized.includes("../") || normalized.includes("..\\") || /[\u0000-\u001f]/.test(normalized)) fail(`非法相对路径：${relative}`);
  return normalized;
}

function walkFiles(root, relative = "") {
  const directory = path.join(root, relative);
  if (!relative && !fs.existsSync(directory)) return [];
  if (!relative && isLinkedDirectory(directory)) fail(`不允许符号链接或 junction：${directory}`);
  return fs.readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
    const next = path.join(relative, entry.name);
    const absolute = path.join(root, next);
    if (entry.isSymbolicLink() || isLinkedDirectory(absolute)) fail(`不允许符号链接或 junction：${next}`);
    return entry.isDirectory() ? walkFiles(root, next) : [{ absolute: path.join(root, next), relative: safeRelativePath(next) }];
  });
}

function isLinkedDirectory(directory) {
  if (!fs.existsSync(directory)) return false;
  const absolute = path.resolve(directory);
  let real;
  try { real = path.resolve(fs.realpathSync.native(directory)); } catch { return false; }
  const normalize = (value) => process.platform === "win32" ? value.toLowerCase() : value;
  return normalize(absolute) !== normalize(real);
}

function sha256(buffer) { return crypto.createHash("sha256").update(buffer).digest("hex"); }

function hasImageSignature(relative, buffer) {
  const extension = path.extname(relative).toLowerCase();
  if (extension === ".png") return buffer.subarray(0, 8).equals(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]));
  if (extension === ".jpg" || extension === ".jpeg") return buffer.length >= 3 && buffer[0] === 0xff && buffer[1] === 0xd8 && buffer[2] === 0xff;
  if (extension === ".gif") return buffer.subarray(0, 6).toString("ascii") === "GIF87a" || buffer.subarray(0, 6).toString("ascii") === "GIF89a";
  if (extension === ".webp") return buffer.subarray(0, 4).toString("ascii") === "RIFF" && buffer.subarray(8, 12).toString("ascii") === "WEBP";
  if (extension === ".avif") return buffer.length >= 12 && buffer.subarray(4, 8).toString("ascii") === "ftyp" && ["avif", "avis"].includes(buffer.subarray(8, 12).toString("ascii"));
  return false;
}

function hasSensitiveImageMetadata(buffer) {
  const text = buffer.toString("latin1").toLowerCase();
  // Binary EXIF GPS tags need not contain human-readable field names.
  return ["exif", "gpslatitude", "gpslongitude", "gpsinfo", "geotag", "latitude", "longitude"].some((marker) => text.includes(marker));
}

function fileSnapshot(file, publicPath) {
  const buffer = fs.readFileSync(file.absolute);
  return { path: publicPath, size: buffer.length, sha256: sha256(buffer) };
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
      if (!target) fail(`图片引用缺少定义：${node.identifier}`);
      references.push(target);
    }
    if (Array.isArray(node.children)) node.children.forEach(visit);
  };
  visit(tree);
  return references.map((reference) => reference.replaceAll("\\", "/").replace(/^\//, ""));
}

function assetReference(value) {
  if (typeof value !== "string") return null;
  const reference = value.replaceAll("\\", "/").replace(/^\//, "");
  if (/^(?:https?:|data:|javascript:)/i.test(reference)) fail(`资源必须使用站内路径：${value}`);
  return reference.replace(/^assets\//, "");
}

function jcs(value) {
  if (Array.isArray(value)) return `[${value.map(jcs).join(",")}]`;
  if (value && typeof value === "object") return `{${Object.keys(value).sort().map((key) => `${JSON.stringify(key)}:${jcs(value[key])}`).join(",")}}`;
  return JSON.stringify(value);
}

function validatePublishedRoot(published, { allowLegacy = false, previousRegistry = null } = {}) {
  if (isLinkedDirectory(published)) fail(`Published 不允许符号链接或 junction：${published}`);
  // Git does not preserve empty directories in an otherwise valid snapshot.
  for (const required of ["posts", "snippets", "assets", "site.json"]) {
    const target = path.join(published, required);
    if (required === "site.json" && !fs.existsSync(target)) fail(`Published 缺少必需的 ${required}`);
    if (isLinkedDirectory(target)) fail(`Published 不允许符号链接或 junction：${required}`);
  }
  const site = validateSite(path.join(published, "site.json"));
  const posts = walkFiles(path.join(published, "posts")).filter((file) => path.extname(file.relative).toLowerCase() === ".md");
  const snippets = walkFiles(path.join(published, "snippets")).filter((file) => path.extname(file.relative).toLowerCase() === ".md");
  const assets = walkFiles(path.join(published, "assets"));
  const entries = [];
  const registryEntries = [];
  const readyPosts = [];
  const readySnippets = [];
  const assetReferences = new Set();
  const identities = new Map();
  const routes = new Map();
  const addIdentity = (item, file, kind) => {
    if (!item) return;
    if (identities.has(item.id)) fail(`重复内容 ID：${item.id}`);
    identities.set(item.id, { kind, file });
    const canonical = kind === "post" ? `/posts/${item.slug}` : `/templates/${item.slug}`;
    for (const route of [canonical, ...(item.aliases || [])]) {
      if (routes.has(route)) fail(`重复路由或别名：${route}`);
      routes.set(route, { id: item.id, kind, canonical });
    }
    const registryEntry = { kind, id: item.id, canonicalPath: canonical, aliases: item.aliases || [], state: "active" };
    registryEntries.push(registryEntry);
    entries.push(registryEntry);
  };
  for (const file of posts) {
    const parsed = validateMarkdown(file.absolute, "post", allowLegacy);
    if (parsed.data?.status === "draft" || parsed.legacy) continue;
    readyPosts.push(file);
    imageReferences(parsed.content).forEach((reference) => assetReferences.add(assetReference(reference)));
    if (parsed.data?.cover) assetReferences.add(assetReference(parsed.data.cover));
    addIdentity(parsed.data, file.relative, "post");
  }
  for (const file of snippets) {
    const parsed = validateMarkdown(file.absolute, "snippet", allowLegacy);
    if (parsed.data?.status === "draft" || parsed.legacy) continue;
    readySnippets.push(file);
    imageReferences(parsed.content).forEach((reference) => assetReferences.add(assetReference(reference)));
    addIdentity(parsed.data, file.relative, "snippet");
  }
  if (typeof site.author.avatar === "string") assetReferences.add(assetReference(site.author.avatar));
  const assetMap = new Map(assets.map((file) => [file.relative, file]));
  const selectedAssets = [];
  for (const reference of assetReferences) {
    const file = assetMap.get(reference);
    if (!file) fail(`图片引用不存在或未登记：${reference}`);
    selectedAssets.push(file);
  }
  let totalBytes = 0;
  const addFiles = (files, kind, prefix) => {
    for (const file of files) {
      const stat = fs.statSync(file.absolute);
      if (kind === "asset") {
        if (stat.size > MAX_IMAGE_BYTES) fail(`资源超过 10 MiB：${file.relative}`);
        if (!IMAGE_EXTENSIONS.has(path.extname(file.relative).toLowerCase())) fail(`资源扩展名不受支持：${file.relative}`);
        const bytes = fs.readFileSync(file.absolute);
        if (!hasImageSignature(file.relative, bytes)) fail(`资源文件签名与扩展名不匹配：${file.relative}`);
        if (hasSensitiveImageMetadata(bytes)) fail(`资源包含敏感位置元数据：${file.relative}`);
      }
      totalBytes += stat.size;
      entries.push({ path: `${prefix}/${file.relative}`, kind, size: stat.size, sha256: sha256(fs.readFileSync(file.absolute)) });
    }
  };
  addFiles(readyPosts, "post", "posts");
  addFiles(readySnippets, "snippet", "snippets");
  addFiles(selectedAssets, "asset", "assets");
  if (totalBytes > MAX_EXPORT_BYTES) fail("公开内容总量超过 200 MiB");
  const activeRegistryEntries = registryEntries.slice().sort((a, b) => a.id.localeCompare(b.id));
  const registryPath = path.join(published, "content-registry.json");
  let previousEntries = [];
  if (previousRegistry || fs.existsSync(registryPath)) {
    let previous;
    try { previous = previousRegistry || JSON.parse(fs.readFileSync(registryPath, "utf8")); } catch (error) { fail(`content-registry.json 无效：${error.message}`); }
    if (previous.schemaVersion !== 1 || previous.siteId !== site.siteId || !Array.isArray(previous.entries)) fail("content-registry.json schema 无效");
    previousEntries = previous.entries;
    const previousIds = new Set();
    const previousRoutes = new Set();
    for (const entry of previousEntries) {
      if (!["post", "snippet"].includes(entry.kind) || !["active", "withdrawn"].includes(entry.state) || typeof entry.id !== "string" || !/^[a-z0-9][a-z0-9_-]{0,79}$/.test(entry.id) || !Array.isArray(entry.aliases) || previousIds.has(entry.id)) fail("content-registry.json 条目无效或重复");
      previousIds.add(entry.id);
      for (const route of [entry.canonicalPath, ...entry.aliases]) {
        if (typeof route !== "string" || !/^\/(?:posts|templates|snippets)\/[^/\\?#\s\u0000-\u001f]+$/.test(route) || route.endsWith("/..") || route.endsWith("/.") || previousRoutes.has(route)) fail(`registry 路由无效或重复：${route}`);
        previousRoutes.add(route);
        const current = routes.get(route);
        if (current && current.id !== entry.id) fail(`历史路由与其他内容冲突：${route}`);
      }
    }
    for (const oldEntry of previousEntries) {
      if (!activeRegistryEntries.some((entry) => entry.id === oldEntry.id)) activeRegistryEntries.push({ kind: oldEntry.kind, id: oldEntry.id, canonicalPath: oldEntry.canonicalPath, aliases: oldEntry.aliases || [], state: "withdrawn" });
    }
  }
  for (const current of registryEntries) {
    const previous = previousEntries.find((entry) => entry.id === current.id);
    if (!previous) continue;
    const historicalRoutes = [previous.canonicalPath, ...(previous.aliases || [])];
    for (const route of historicalRoutes) {
      if (route === current.canonicalPath || current.aliases.includes(route)) continue;
      const conflict = routes.get(route);
      if (conflict && conflict.id !== current.id) fail(`历史路由与其他内容冲突：${route}`);
      current.aliases.push(route);
      routes.set(route, { id: current.id, kind: current.kind, canonical: current.canonicalPath });
    }
    current.aliases = [...new Set(current.aliases)].sort((a, b) => a.localeCompare(b));
  }
  const currentActiveIds = new Set(registryEntries.map((entry) => entry.id));
  const removedIds = previousEntries
    .filter((entry) => entry.state !== "withdrawn" && !currentActiveIds.has(entry.id))
    .map((entry) => entry.id)
    .sort((a, b) => a.localeCompare(b));
  const registry = { schemaVersion: 1, siteId: site.siteId, entries: activeRegistryEntries.sort((a, b) => a.id.localeCompare(b.id)) };
  const registryBytes = Buffer.from(`${JSON.stringify(registry, null, 2)}\n`, "utf8");
  const manifestFiles = [
    { path: "site.json", kind: "site", size: fs.statSync(path.join(published, "site.json")).size, sha256: sha256(fs.readFileSync(path.join(published, "site.json"))) },
    { path: "content-registry.json", kind: "registry", size: registryBytes.length, sha256: sha256(registryBytes) },
    ...entries.filter((entry) => entry.path).map(({ path: filePath, kind, size, sha256: digest }) => ({ path: filePath, kind, size, sha256: digest })),
  ].sort((a, b) => a.path.localeCompare(b.path));
  const manifestCore = { schemaVersion: 1, siteId: site.siteId, files: manifestFiles };
  const problemsPath = path.join(published, "problems.json");
  if (fs.existsSync(problemsPath)) {
    const problems = JSON.parse(fs.readFileSync(problemsPath, "utf8"));
    if (!Array.isArray(problems)) fail("problems.json 必须是数组");
    const ids = new Set();
    for (const row of problems) {
      if (!row || typeof row.id !== "string" || !row.id || ids.has(row.id) || typeof row.title !== "string" || typeof row.url !== "string") fail("problems.json 条目无效或重复");
      ids.add(row.id);
    }
    manifestFiles.push({ ...fileSnapshot({ absolute: problemsPath }, "problems.json"), kind: "problems" });
    manifestFiles.sort((a, b) => a.path.localeCompare(b.path));
  }
  const sourceSnapshot = [
    fileSnapshot({ absolute: path.join(published, "site.json") }, "site.json"),
    ...readyPosts.map((file) => fileSnapshot(file, `posts/${file.relative}`)),
    ...readySnippets.map((file) => fileSnapshot(file, `snippets/${file.relative}`)),
    ...selectedAssets.map((file) => fileSnapshot(file, `assets/${file.relative}`)),
  ].sort((a, b) => a.path.localeCompare(b.path));
  return { site, posts, snippets, assets: selectedAssets, readyPosts, readySnippets, removedIds, previousActiveIds: previousEntries.filter((entry) => entry.state !== "withdrawn").map((entry) => entry.id), sourceSnapshot, registry, manifest: { ...manifestCore, snapshotDigest: sha256(jcs(manifestCore)) } };
}

module.exports = { MAX_EXPORT_BYTES, validatePublishedRoot, validateMarkdown, validateSite, sha256, jcs, imageReferences };
