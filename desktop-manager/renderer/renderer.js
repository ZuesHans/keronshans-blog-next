const api = window.managerApi;

const state = {
  view: "posts",
  query: "",
  filter: "all",
  selected: null,
  snapshot: null,
};

const el = {
  rootPath: document.querySelector("#rootPath"),
  navItems: document.querySelectorAll(".nav-item"),
  search: document.querySelector("#searchInput"),
  viewTitle: document.querySelector("#viewTitle"),
  viewHint: document.querySelector("#viewHint"),
  filters: document.querySelector("#filters"),
  items: document.querySelector("#items"),
  newBtn: document.querySelector("#newBtn"),
  empty: document.querySelector("#emptyState"),
  detailForm: document.querySelector("#detailForm"),
  tagPanel: document.querySelector("#tagPanel"),
  detailHeading: document.querySelector("#detailHeading"),
  fieldTitle: document.querySelector("#fieldTitle"),
  fieldCategory: document.querySelector("#fieldCategory"),
  fieldDate: document.querySelector("#fieldDate"),
  fieldLanguage: document.querySelector("#fieldLanguage"),
  fieldPlatform: document.querySelector("#fieldPlatform"),
  fieldStatus: document.querySelector("#fieldStatus"),
  fieldUrl: document.querySelector("#fieldUrl"),
  fieldTags: document.querySelector("#fieldTags"),
  fieldDescription: document.querySelector("#fieldDescription"),
  fieldNote: document.querySelector("#fieldNote"),
  fieldAnalysis: document.querySelector("#fieldAnalysis"),
  metaLine: document.querySelector("#metaLine"),
  tagCloud: document.querySelector("#tagCloud"),
  log: document.querySelector("#logOutput"),
};

const viewMeta = {
  posts: { title: "文章", hint: "管理 content/posts/*.md" },
  snippets: { title: "模板片段", hint: "管理 content/snippets/*.md" },
  problems: { title: "题目", hint: "管理 content/problems.json" },
  tags: { title: "标签", hint: "聚合文章、模板和题目的标签" },
};

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
  el.log.textContent += text;
  el.log.scrollTop = el.log.scrollHeight;
}

async function runPublish(task, button, label) {
  button.disabled = true;
  const oldText = button.textContent;
  button.textContent = `${label}中...`;
  log(`\n=== 开始：${label} ===\n`);
  try {
    const ok = await api.publish({ task });
    log(ok ? `\n=== ${label}成功 ===\n` : `\n=== ${label}失败，请看上面的最后一段错误 ===\n`);
  } catch (error) {
    log(`\n=== ${label}异常：${error.message || error} ===\n`);
  } finally {
    button.disabled = false;
    button.textContent = oldText;
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
    if (state.view === "posts" && item.category !== state.filter) return false;
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
    item.note,
    item.summary,
    tags,
  ]
    .filter(Boolean)
    .some((value) => String(value).toLowerCase().includes(q));
}

function renderFilters() {
  el.filters.innerHTML = "";
  if (state.view === "tags") return;
  const options = [{ id: "all", label: "全部" }];
  if (state.view === "posts") {
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
      state.filter = option.id;
      render();
    });
    el.filters.appendChild(btn);
  });
}

function renderItems() {
  el.items.innerHTML = "";
  const items = currentCollection().filter(itemMatches);
  items.forEach((item) => {
    const btn = document.createElement("button");
    btn.className = `item ${state.selected && itemKey(state.selected) === itemKey(item) && state.selected.kind === item.kind ? "active" : ""}`;
    const tags = (item.tags || []).slice(0, 4).map((tag) => `<span class="badge">#${tag}</span>`).join("");
    const meta = item.kind === "post"
      ? `${item.category} · ${item.date} · ${item.filename}`
      : item.kind === "snippet"
        ? `${item.language} · ${item.date || "未标日期"} · ${item.filename}`
        : `${item.platform} · ${item.status} · ${item.date || "未标日期"}`;
    btn.innerHTML = `
      <div class="item-title">${escapeHtml(item.title || "(未命名)")}</div>
      <div class="item-meta">${escapeHtml(meta)}</div>
      <div class="item-summary">${escapeHtml(item.summary || item.note || item.url || "")}</div>
      <div>${tags}</div>
    `;
    btn.addEventListener("click", () => {
      state.selected = item;
      renderDetail();
      renderItems();
    });
    el.items.appendChild(btn);
  });
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
  el.fieldDate.value = item.date || "";
  el.fieldLanguage.value = item.language || "C++";
  el.fieldPlatform.value = item.platform || "cf";
  el.fieldStatus.value = item.status || "AC";
  el.fieldUrl.value = item.url || "";
  el.fieldTags.value = tagsText(item.tags);
  el.fieldDescription.value = item.description || "";
  el.fieldNote.value = item.note || "";
  el.fieldAnalysis.value = item.analysis || "";
  el.metaLine.textContent = item.kind === "problem" ? `id: ${item.id}` : `file: ${item.filename}`;
}

function renderTags() {
  el.empty.classList.add("hidden");
  el.detailForm.classList.add("hidden");
  el.tagPanel.classList.remove("hidden");
  el.items.innerHTML = "";
  el.tagCloud.innerHTML = "";
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
  el.viewHint.textContent = meta.hint;
  document.querySelector("#newBtn").classList.toggle("hidden", state.view === "tags");
  document.querySelectorAll(".nav-item").forEach((node) => node.classList.toggle("active", node.dataset.view === state.view));
  renderFilters();
  if (state.view === "tags") renderTags();
  else {
    renderItems();
    renderDetail();
  }
}

async function refresh() {
  state.snapshot = await api.snapshot();
  el.rootPath.textContent = state.snapshot.root;
  el.fieldCategory.innerHTML = state.snapshot.categories.map((category) => `<option value="${category}">${category}</option>`).join("");
  document.querySelector("#newCategory").innerHTML = state.snapshot.categories.map((category) => `<option value="${category}">${category}</option>`).join("");
  if (state.selected) {
    const next = currentCollection().find((item) => itemKey(item) === itemKey(state.selected) && item.kind === state.selected.kind);
    state.selected = next || null;
  }
  render();
}

async function saveMeta() {
  const item = state.selected;
  if (!item) return;
  if (item.kind === "post") {
    await api.updatePost({
      filename: item.filename,
      patch: {
        title: el.fieldTitle.value.trim(),
        category: el.fieldCategory.value,
        date: el.fieldDate.value,
        tags: tagsFromText(el.fieldTags.value),
      },
    });
  } else if (item.kind === "snippet") {
    await api.updateSnippet({
      filename: item.filename,
      patch: {
        title: el.fieldTitle.value.trim(),
        language: el.fieldLanguage.value.trim() || "C++",
        tags: tagsFromText(el.fieldTags.value),
        description: el.fieldDescription.value.trim(),
      },
    });
  } else if (item.kind === "problem") {
    await api.updateProblem({
      id: item.id,
      patch: {
        title: el.fieldTitle.value.trim(),
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
  log(`已保存：${item.title}\n`);
  await refresh();
}

function setupEvents() {
  api.onLog(log);
  el.navItems.forEach((btn) => {
    btn.addEventListener("click", () => {
      state.view = btn.dataset.view;
      state.filter = "all";
      state.selected = null;
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
  document.querySelector("#previewBtn").addEventListener("click", () => api.preview());
  document.querySelector("#buildBtn").addEventListener("click", (event) => runPublish("build", event.currentTarget, "构建检查"));
  document.querySelector("#deployBtn").addEventListener("click", (event) => runPublish("deploy", event.currentTarget, "发布 Cloudflare"));
  document.querySelector("#cleanupBtn").addEventListener("click", async () => {
    if (await api.cleanupOpenNext()) log("已清理 .open-next。\n");
  });
  document.querySelector("#clearLogBtn").addEventListener("click", () => {
    el.log.textContent = "";
  });
  document.querySelector("#gitBtn").addEventListener("click", () => document.querySelector("#gitDialog").showModal());
  document.querySelector("#confirmGitBtn").addEventListener("click", (event) => {
    event.preventDefault();
    document.querySelector("#gitDialog").close();
    log("\n=== 开始：GitHub 备份 ===\n");
    api.publish({ task: "git", message: document.querySelector("#commitMessage").value })
      .then((ok) => log(ok ? "\n=== GitHub 备份成功 ===\n" : "\n=== GitHub 备份失败，请看上面的最后一段错误 ===\n"))
      .catch((error) => log(`\n=== GitHub 备份异常：${error.message || error} ===\n`));
  });
  document.querySelector("#newBtn").addEventListener("click", openNewDialog);
  document.querySelector("#confirmNewBtn").addEventListener("click", createNewItem);
  document.querySelector("#renameTagBtn").addEventListener("click", async () => {
    await api.renameTag({
      from: document.querySelector("#oldTagInput").value,
      to: document.querySelector("#newTagInput").value,
    });
    log("标签已批量重命名。\n");
    await refresh();
  });
}

function openNewDialog() {
  const title = state.view === "posts" ? "新建文章" : state.view === "snippets" ? "新建模板片段" : "新建题目";
  document.querySelector("#newDialogTitle").textContent = title;
  document.querySelector("#newTitle").value = "";
  document.querySelector("#newTags").value = "";
  document.querySelector("#newUrl").value = "";
  document.querySelector("#newLanguage").value = "C++";
  document.querySelectorAll(".new-post-only").forEach((node) => node.classList.toggle("hidden", state.view !== "posts"));
  document.querySelectorAll(".new-snippet-only").forEach((node) => node.classList.toggle("hidden", state.view !== "snippets"));
  document.querySelectorAll(".new-problem-only").forEach((node) => node.classList.toggle("hidden", state.view !== "problems"));
  document.querySelector("#newDialog").showModal();
}

async function createNewItem(event) {
  event.preventDefault();
  const payload = {
    title: document.querySelector("#newTitle").value.trim(),
    tags: tagsFromText(document.querySelector("#newTags").value),
  };
  if (!payload.title) return;
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
}

setupEvents();
refresh().catch((error) => log(`启动失败：${error.message}\n`));
