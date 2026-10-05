const api = window.managerApi;

const state = {
  view: "posts",
  query: "",
  filter: "all",
  sort: "updated",
  selected: null,
  snapshot: null,
  dirty: false,
  saving: false,
  publishBusy: false,
  warningSignature: "",
};

const el = {
  rootPath: document.querySelector("#rootPath"),
  navItems: document.querySelectorAll(".nav-item"),
  search: document.querySelector("#searchInput"),
  viewTitle: document.querySelector("#viewTitle"),
  viewHint: document.querySelector("#viewHint"),
  filters: document.querySelector("#filters"),
  items: document.querySelector("#items"),
  resultCount: document.querySelector("#resultCount"),
  sortSelect: document.querySelector("#sortSelect"),
  listColumns: document.querySelector("#listColumns"),
  newBtn: document.querySelector("#newBtn"),
  empty: document.querySelector("#emptyState"),
  detailForm: document.querySelector("#detailForm"),
  tagPanel: document.querySelector("#tagPanel"),
  detailHeading: document.querySelector("#detailHeading"),
  fieldTitle: document.querySelector("#fieldTitle"),
  fieldCategory: document.querySelector("#fieldCategory"),
  fieldPinned: document.querySelector("#fieldPinned"),
  fieldDate: document.querySelector("#fieldDate"),
  fieldLanguage: document.querySelector("#fieldLanguage"),
  fieldPlatform: document.querySelector("#fieldPlatform"),
  fieldStatus: document.querySelector("#fieldStatus"),
  fieldPublishStatus: document.querySelector("#fieldPublishStatus"),
  fieldUrl: document.querySelector("#fieldUrl"),
  fieldTags: document.querySelector("#fieldTags"),
  fieldDescription: document.querySelector("#fieldDescription"),
  fieldNote: document.querySelector("#fieldNote"),
  fieldAnalysis: document.querySelector("#fieldAnalysis"),
  descriptionCount: document.querySelector("#descriptionCount"),
  metaLine: document.querySelector("#metaLine"),
  saveButton: document.querySelector("#saveMetaBtn"),
  saveStatus: document.querySelector("#saveStatus"),
  tagCloud: document.querySelector("#tagCloud"),
  log: document.querySelector("#logOutput"),
  taskStatus: document.querySelector("#taskStatus"),
};

const viewMeta = {
  posts: { title: "近期题解", hint: "管理 content/posts/*.md · 正文在 VS Code 编辑" },
  snippets: { title: "模板片段", hint: "管理 content/snippets/*.md" },
  problems: { title: "题目", hint: "管理 content/problems.json" },
  tags: { title: "标签", hint: "聚合文章、模板和题目的标签" },
};

function canCreateCurrentView() {
  if (!state.snapshot || state.view === "tags") return false;
  if (state.view === "posts") return Boolean(state.snapshot.canCreate?.posts);
  if (state.view === "snippets") return Boolean(state.snapshot.canCreate?.snippets);
  if (state.view === "problems") return Boolean(state.snapshot.canCreate?.problems);
  return false;
}

function tagsFromText(text) {
  return String(text || "")
    .split(/[，,]/)
    .map((tag) => tag.trim())
    .filter(Boolean);
}

function tagsText(tags) {
  return Array.isArray(tags) ? tags.join(", ") : "";
}

function log(text) {
  if (el.taskStatus) {
    const clean = String(text || "").trim().split("\n").filter(Boolean).pop();
    if (clean) el.taskStatus.textContent = clean.replace(/^===|===$/g, "").trim();
  }
  if (!el.log) return;
  el.log.textContent += text;
  el.log.scrollTop = el.log.scrollHeight;
}

function errorText(error) {
  return error?.message || String(error || "未知错误");
}

function updateDescriptionCount() {
  el.descriptionCount.textContent = `${el.fieldDescription.value.length} / 240`;
}

function setDirty(dirty, message = dirty ? "有未保存修改" : "已同步") {
  state.dirty = dirty;
  el.detailForm.classList.toggle("is-dirty", dirty);
  el.saveStatus.textContent = message;
  el.saveStatus.classList.toggle("is-dirty", dirty);
}

function confirmDiscard() {
  return !state.dirty || window.confirm("当前元数据还没有保存，确定放弃这些修改吗？");
}

function setPublishBusy(busy) {
  state.publishBusy = busy;
  document.querySelectorAll(".publish-action").forEach((button) => {
    button.disabled = busy;
  });
}

async function runPublish(task, button, label, payload = {}) {
  if (state.publishBusy) return;
  setPublishBusy(true);
  const oldText = button.textContent;
  button.textContent = `${label}中...`;
  log(`\n=== 开始：${label} ===\n`);
  try {
    const ok = await api.publish({ task, ...payload });
    log(ok ? `\n=== ${label}成功 ===\n` : `\n=== ${label}失败，请看上面的最后一段错误 ===\n`);
  } catch (error) {
    log(`\n=== ${label}异常：${errorText(error)} ===\n`);
  } finally {
    button.textContent = oldText;
    setPublishBusy(false);
  }
}

function currentCollection() {
  if (!state.snapshot) return [];
  if (state.view === "posts") return state.snapshot.posts;
  if (state.view === "snippets") return state.snapshot.snippets;
  if (state.view === "problems") return state.snapshot.problems;
  return [];
}

function itemKey(item) {
  return item.kind === "problem" ? item.id : item.filename;
}

function itemMatches(item) {
  const q = state.query.toLowerCase();
  const tags = tagsText(item.tags).toLowerCase();
  if (state.filter !== "all") {
    if (state.view === "posts" && state.filter === "recent") return item.mtime >= Date.now() - 7 * 24 * 3600 * 1000;
    if (state.view === "posts" && state.filter === "pinned") return Boolean(item.pinned);
    if (state.view === "posts" && !["recent", "pinned"].includes(state.filter) && item.category !== state.filter) return false;
    if (state.view === "problems" && item.status !== state.filter) return false;
    if (state.view === "snippets" && item.language !== state.filter) return false;
  }
  if (!q) return true;
  return [
    item.title,
    item.filename,
    item.category,
    item.language,
    item.status,
    item.platform,
    item.description,
    item.note,
    item.summary,
    tags,
  ]
    .filter(Boolean)
    .some((value) => String(value).toLowerCase().includes(q));
}

function renderFilters() {
  el.filters.replaceChildren();
  if (state.view === "tags") return;
  const options = [{ id: "all", label: "全部" }];
  if (state.view === "posts") {
    options.push({ id: "recent", label: "最近 7 天" }, { id: "pinned", label: "已置顶" });
    state.snapshot.categories.forEach((category) => options.push({ id: category, label: category }));
  } else if (state.view === "snippets") {
    [...new Set(state.snapshot.snippets.map((item) => item.language || "text"))].forEach((language) => options.push({ id: language, label: language }));
  } else if (state.view === "problems") {
    ["AC", "WA", "TLE", "RE", "REVIEW", "TODO"].forEach((status) => options.push({ id: status, label: status }));
  }
  options.forEach((option) => {
    const btn = document.createElement("button");
    btn.className = `filter-chip ${state.filter === option.id ? "active" : ""}`;
    btn.textContent = option.label;
    btn.addEventListener("click", () => {
      if (!confirmDiscard()) return;
      state.filter = option.id;
      render();
    });
    el.filters.appendChild(btn);
  });
}

function renderItems() {
  el.items.replaceChildren();
  const items = currentCollection().filter(itemMatches).sort((a, b) => {
    if (state.sort === "title") return String(a.title).localeCompare(String(b.title), "zh-CN");
    if (state.sort === "date") return String(b.date || "").localeCompare(String(a.date || ""));
    return (b.mtime || 0) - (a.mtime || 0);
  });
  el.resultCount.textContent = `${items.length} 项`;
  if (!items.length) {
    const empty = document.createElement("div");
    empty.className = "list-empty";
    empty.innerHTML = `<strong>没有匹配的内容</strong><span>试试清空搜索或切换分类筛选</span>`;
    el.items.appendChild(empty);
    return;
  }
  items.forEach((item) => {
    const row = document.createElement("article");
    row.className = `item-row ${state.selected && itemKey(state.selected) === itemKey(item) && state.selected.kind === item.kind ? "active" : ""}`;
    row.tabIndex = 0;
    const meta = item.kind === "post"
      ? `${item.pinned ? "置顶 · " : ""}${item.category || "未分类"}`
      : item.kind === "snippet"
        ? `${item.language} · 模板片段`
        : `${item.platform} · ${item.status}`;
    const main = document.createElement("div"); main.className = "item-main";
    main.appendChild(textNode("div", "item-title", item.title || "(未命名)"));
    main.appendChild(textNode("div", "item-meta", meta));
    row.appendChild(main);
    const summary = textNode("div", "item-summary", item.description || item.summary || item.note || "暂无摘要");
    row.appendChild(summary);
    row.appendChild(textNode("div", "item-date", item.date || "未标日期"));

    const tags = document.createElement("div");
    tags.className = "item-tags";
    (item.tags || []).slice(0, 3).forEach((tag) => {
      tags.appendChild(textNode("span", "badge", `#${tag}`));
    });
    row.appendChild(tags);

    const actions = document.createElement("div"); actions.className = "item-actions";
    const open = document.createElement("button"); open.className = "row-action"; open.textContent = "VS Code"; open.title = "在 VS Code 中打开正文";
    open.addEventListener("click", (event) => { event.stopPropagation(); api.openItem(item); });
    actions.appendChild(open); row.appendChild(actions);

    const select = () => {
      if (!confirmDiscard()) return;
      state.selected = item;
      renderDetail();
      renderItems();
    };
    row.addEventListener("click", select);
    row.addEventListener("keydown", (event) => { if (event.key === "Enter" || event.key === " ") { event.preventDefault(); select(); } });
    el.items.appendChild(row);
  });
}

function textNode(tagName, className, text) {
  const node = document.createElement(tagName);
  node.className = className;
  node.textContent = String(text || "");
  return node;
}

function escapeHtml(text) {
  return String(text || "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");
}

function setFieldsVisibility(kind) {
  document.querySelectorAll(".post-only").forEach((node) => node.classList.toggle("hidden", kind !== "post"));
  document.querySelectorAll(".snippet-only").forEach((node) => node.classList.toggle("hidden", kind !== "snippet"));
  document.querySelectorAll(".problem-only").forEach((node) => node.classList.toggle("hidden", kind !== "problem"));
  document.querySelectorAll(".markdown-only").forEach((node) => node.classList.toggle("hidden", kind === "problem"));
}

function renderDetail() {
  if (state.view === "tags") {
    renderTags();
    return;
  }
  const item = state.selected;
  el.empty.classList.toggle("hidden", Boolean(item));
  el.detailForm.classList.toggle("hidden", !item);
  el.tagPanel.classList.add("hidden");
  if (!item) return;
  setFieldsVisibility(item.kind);
  el.detailHeading.textContent = item.kind === "post" ? "文章元数据" : item.kind === "snippet" ? "模板元数据" : "题目元数据";
  el.fieldTitle.value = item.title || "";
  el.fieldCategory.value = item.category || "学习笔记";
  el.fieldPinned.checked = Boolean(item.pinned);
  el.fieldDate.value = item.date || "";
  el.fieldLanguage.value = item.language || "C++";
  el.fieldPlatform.value = item.platform || "cf";
  el.fieldStatus.value = item.status || "AC";
  el.fieldPublishStatus.value = item.status === "ready" ? "ready" : "draft";
  el.fieldUrl.value = item.url || "";
  el.fieldTags.value = tagsText(item.tags);
  el.fieldDescription.value = item.description || "";
  updateDescriptionCount();
  el.fieldNote.value = item.note || "";
  el.fieldAnalysis.value = item.analysis || "";
  el.metaLine.textContent = item.kind === "problem" ? `id: ${item.id}` : `file: ${item.filename}`;
  setDirty(false);
}

function renderTags() {
  el.empty.classList.add("hidden");
  el.detailForm.classList.add("hidden");
  el.tagPanel.classList.remove("hidden");
  el.listColumns.classList.add("hidden");
  el.items.replaceChildren();
  el.resultCount.textContent = `${state.snapshot.tags.length} 项`;
  el.tagCloud.replaceChildren();
  state.snapshot.tags.forEach(({ tag, count }) => {
    const chip = document.createElement("button");
    chip.className = "tag-chip";
    chip.textContent = `#${tag} ${count}`;
    chip.addEventListener("click", () => {
      document.querySelector("#oldTagInput").value = tag;
    });
    el.tagCloud.appendChild(chip);
  });
}

function render() {
  const meta = viewMeta[state.view];
  el.viewTitle.textContent = meta.title;
  el.viewHint.textContent = state.snapshot?.pathHints?.[state.view] || meta.hint;
  document.querySelector("#newBtn").classList.toggle("hidden", state.view === "tags");
  document.querySelector("#newBtn").disabled = !canCreateCurrentView();
  document.querySelector("#openItemBtn").disabled = !state.selected;
  document.querySelector("#showInFolderBtn").disabled = !state.selected;
  document.querySelector("#editBodyBtn").disabled = !state.selected || state.selected.kind === "problem";
  el.listColumns.classList.toggle("hidden", state.view === "tags");
  document.querySelectorAll(".nav-item").forEach((node) => node.classList.toggle("active", node.dataset.view === state.view));
  renderFilters();
  if (state.view === "tags") renderTags();
  else {
    renderItems();
    renderDetail();
  }
}

async function refresh() {
  try {
    state.snapshot = await api.snapshot();
    el.rootPath.textContent = `${state.snapshot.workspaceLabel}\n${state.snapshot.input}`;
    replaceOptions(el.fieldCategory, state.snapshot.categories);
    replaceOptions(document.querySelector("#newCategory"), state.snapshot.categories);
    if (state.selected) {
      const next = currentCollection().find((item) => itemKey(item) === itemKey(state.selected) && item.kind === state.selected.kind);
      state.selected = next || null;
    }
    const warnings = state.snapshot.warnings || [];
    const warningSignature = JSON.stringify(warnings);
    if (warnings.length && warningSignature !== state.warningSignature) {
      log(`\n读取内容时跳过了 ${warnings.length} 个损坏文件：\n`);
      warnings.forEach((warning) => log(`- ${warning.path}: ${warning.message}\n`));
    }
    state.warningSignature = warningSignature;
    render();
  } catch (error) {
    log(`刷新失败：${errorText(error)}\n`);
    throw error;
  }
}

function replaceOptions(select, values) {
  select.replaceChildren();
  values.forEach((value) => {
    const option = document.createElement("option");
    option.value = value;
    option.textContent = value;
    select.appendChild(option);
  });
}

async function saveMeta() {
  const item = state.selected;
  if (!item || state.saving) return;
  const title = el.fieldTitle.value.trim();
  if (!title) {
    el.fieldTitle.focus();
    setDirty(true, "标题不能为空");
    return;
  }

  state.saving = true;
  el.saveButton.disabled = true;
  const oldText = el.saveButton.textContent;
  el.saveButton.textContent = "保存中...";
  el.saveStatus.textContent = "正在写入文件";
  let saved = false;
  try {
    if (item.kind === "post") {
      await api.updatePost({
        item,
        filename: item.filename,
        patch: {
          title,
          category: el.fieldCategory.value,
          status: el.fieldPublishStatus.value,
          pinned: el.fieldPinned.checked,
          date: el.fieldDate.value,
          tags: tagsFromText(el.fieldTags.value),
          description: el.fieldDescription.value.trim(),
          expectedRevision: item.revision,
        },
      });
    } else if (item.kind === "snippet") {
      await api.updateSnippet({
        item,
        filename: item.filename,
        patch: {
          title,
          language: el.fieldLanguage.value.trim() || "C++",
          status: el.fieldPublishStatus.value,
          tags: tagsFromText(el.fieldTags.value),
          description: el.fieldDescription.value.trim(),
          expectedRevision: item.revision,
        },
      });
    } else if (item.kind === "problem") {
      await api.updateProblem({
        id: item.id,
        patch: {
          title,
          url: el.fieldUrl.value.trim(),
          platform: el.fieldPlatform.value,
          status: el.fieldStatus.value,
          date: el.fieldDate.value,
          tags: tagsFromText(el.fieldTags.value),
          note: el.fieldNote.value,
          analysis: el.fieldAnalysis.value,
        },
      });
    }
    saved = true;
    log(`已保存：${title}\n`);
    setDirty(false, "保存成功");
    await refresh();
  } catch (error) {
    if (saved) {
      setDirty(false, "已保存，刷新失败");
      log(`文件已保存，但列表刷新失败：${errorText(error)}\n`);
    } else {
      setDirty(true, `保存失败：${errorText(error)}`);
      log(`保存失败：${errorText(error)}\n`);
    }
  } finally {
    state.saving = false;
    el.saveButton.disabled = false;
    el.saveButton.textContent = oldText;
  }
}

function setupEvents() {
  api.onLog(log);
  el.detailForm.addEventListener("input", () => {
    if (!state.selected) return;
    updateDescriptionCount();
    setDirty(true);
  });
  el.navItems.forEach((btn) => {
    btn.addEventListener("click", () => {
      if (!confirmDiscard()) return;
      state.view = btn.dataset.view;
      state.filter = "all";
      state.selected = null;
      setDirty(false);
      render();
    });
  });
  el.search.addEventListener("input", (event) => {
    state.query = event.target.value;
    renderItems();
  });
  document.querySelector("#saveMetaBtn").addEventListener("click", saveMeta);
  document.querySelector("#editBodyBtn").addEventListener("click", () => state.selected && api.openItem(state.selected));
  document.querySelector("#openItemBtn").addEventListener("click", () => state.selected && api.openItem(state.selected));
  document.querySelector("#showInFolderBtn").addEventListener("click", () => state.selected && api.showInFolder(state.selected));
  document.querySelector("#openProjectBtn").addEventListener("click", () => api.openProject());
  document.querySelector("#emptyOpenProjectBtn").addEventListener("click", () => api.openProject());
  document.querySelector("#selectWorkspaceBtn").addEventListener("click", async () => {
    if (!confirmDiscard()) return;
    try {
      const snapshot = await api.selectWorkspace();
      if (!snapshot) return;
      state.snapshot = snapshot;
      state.selected = null;
      state.filter = "all";
      setDirty(false);
      log(`已切换工作区：${snapshot.input}\n`);
      await refresh();
    } catch (error) {
      log(`切换工作区失败：${errorText(error)}\n`);
    }
  });
  el.sortSelect.addEventListener("change", (event) => {
    state.sort = event.target.value;
    renderItems();
  });
  document.querySelector("#resetWorkspaceBtn").addEventListener("click", async () => {
    if (!confirmDiscard()) return;
    try {
      state.snapshot = await api.resetWorkspace();
      state.selected = null;
      state.filter = "all";
      setDirty(false);
      log("已回到博客项目工作区。\n");
      await refresh();
    } catch (error) {
      log(`恢复默认工作区失败：${errorText(error)}\n`);
    }
  });
  document.querySelector("#previewBtn").addEventListener("click", () => {
    api.preview().catch((error) => log(`预览启动失败：${errorText(error)}\n`));
  });
  document.querySelector("#refreshBtn").addEventListener("click", async () => {
    if (!confirmDiscard()) return;
    try {
      setDirty(false);
      await refresh();
      log("内容已刷新。\n");
    } catch {}
  });
  document.querySelector("#buildBtn").addEventListener("click", (event) => runPublish("build", event.currentTarget, "构建检查"));
  document.querySelector("#selectionPublishBtn").addEventListener("click", (event) => runPublish("contentSelection", event.currentTarget, "选择文章发布"));
  document.querySelector("#deployBtn").addEventListener("click", (event) => runPublish("deploy", event.currentTarget, "发布 Cloudflare"));
  document.querySelector("#cleanupBtn")?.addEventListener("click", async () => {
    try {
      if (await api.cleanupOpenNext()) log("已清理 .open-next。\n");
    } catch (error) {
      log(`清理失败：${errorText(error)}\n`);
    }
  });
  document.querySelector("#clearLogBtn")?.addEventListener("click", () => {
    el.log.textContent = "";
  });
  document.querySelector("#confirmGitBtn").addEventListener("click", (event) => {
    event.preventDefault();
    document.querySelector("#gitDialog").close();
    runPublish("git", document.querySelector("#gitBtn"), "GitHub 备份", {
      message: document.querySelector("#commitMessage").value,
    });
  });
  document.querySelector("#newBtn").addEventListener("click", openNewDialog);
  document.querySelector("#confirmNewBtn").addEventListener("click", createNewItem);
  document.querySelector("#renameTagBtn").addEventListener("click", async () => {
    try {
      await api.renameTag({
        from: document.querySelector("#oldTagInput").value,
        to: document.querySelector("#newTagInput").value,
      });
      log("标签已批量重命名。\n");
      await refresh();
    } catch (error) {
      log(`标签重命名失败：${errorText(error)}\n`);
    }
  });
  document.addEventListener("keydown", (event) => {
    if (event.key === "/" && document.activeElement?.tagName !== "INPUT" && document.activeElement?.tagName !== "TEXTAREA") {
      event.preventDefault(); el.search.focus();
    }
    if (event.key === "Escape" && document.activeElement === el.search) { el.search.value = ""; state.query = ""; renderItems(); }
    if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === "s" && state.selected) {
      event.preventDefault();
      saveMeta();
    }
  });
  window.addEventListener("beforeunload", (event) => {
    if (!state.dirty) return;
    event.preventDefault();
    event.returnValue = "";
  });
}

function openNewDialog() {
  const title = state.view === "posts" ? "新建文章" : state.view === "snippets" ? "新建模板片段" : "新建题目";
  document.querySelector("#newDialogTitle").textContent = title;
  document.querySelector("#newTitle").value = "";
  document.querySelector("#newTags").value = "";
  document.querySelector("#newUrl").value = "";
  document.querySelector("#newLanguage").value = "C++";
  document.querySelector("#newDescription").value = "";
  document.querySelectorAll(".new-post-only").forEach((node) => node.classList.toggle("hidden", state.view !== "posts"));
  document.querySelectorAll(".new-snippet-only").forEach((node) => node.classList.toggle("hidden", state.view !== "snippets"));
  document.querySelectorAll(".new-problem-only").forEach((node) => node.classList.toggle("hidden", state.view !== "problems"));
  document.querySelectorAll(".new-markdown-only").forEach((node) => node.classList.toggle("hidden", state.view === "problems"));
  document.querySelector("#newDialog").showModal();
  document.querySelector("#newTitle").focus();
}

async function createNewItem(event) {
  event.preventDefault();
  const payload = {
    title: document.querySelector("#newTitle").value.trim(),
    tags: tagsFromText(document.querySelector("#newTags").value),
    description: document.querySelector("#newDescription").value.trim(),
  };
  if (!payload.title) return;
  const button = document.querySelector("#confirmNewBtn");
  const oldText = button.textContent;
  button.disabled = true;
  button.textContent = "创建中...";
  try {
    let result = null;
    if (state.view === "posts") {
      result = await api.createPost({ ...payload, category: document.querySelector("#newCategory").value });
    } else if (state.view === "snippets") {
      result = await api.createSnippet({ ...payload, language: document.querySelector("#newLanguage").value, code: "" });
    } else if (state.view === "problems") {
      result = await api.createProblem({ ...payload, url: document.querySelector("#newUrl").value });
    }
    document.querySelector("#newDialog").close();
    log(`已创建：${result}\n`);
    await refresh();
  } catch (error) {
    log(`创建失败：${errorText(error)}\n`);
  } finally {
    button.disabled = false;
    button.textContent = oldText;
  }
}

setupEvents();
refresh().catch((error) => log(`启动失败：${error.message}\n`));
