# 内容发布架构

> v1 范围见 [ADR 0004](adr/0004-release-v1-scope.md)。内容固定到 `release.json` 的完整 SHA；发行入口是 npm 和 GitHub 手动 workflow。

目标是让文章可以在电脑上的任意目录编辑，再由作者明确选择要发布的文件。运行时的文章、模板和搜索正文只读取构建快照；生产内容仓库已完成首次合并发布，后续发布继续使用同一流程。

正文和代码模板的管理 API 是只读快照：认证后台可以查看当前发布内容，但 `POST`、`PUT`、`DELETE` 会返回 `405 CONTENT_SOURCE_READONLY`。正文修改回到本地编辑目录，经 publisher 生成内容提交后，更新框架 `release.json`、构建、校验、发行。评论、点赞和审核记录属于动态 D1。生产后台按作者决定暂时关闭。

## 推荐发布策略

内容仓库是 Git 版本库，每次发布对应一个提交。发布器只把选中的 Markdown 和它实际引用的图片加入候选快照，然后比较内容仓库当前文件：只改一个逗号时，通常只有文章正文、manifest/registry 等元数据发生变化，未变图片仍复用原来的 Git blob。不会在 Git 中保存重复 zip、`.next` 或整站发布包。

稳定 `id` 用来识别同一篇文章的多个版本；slug 变化会把旧地址保留为 alias。回滚直接重新构建旧的内容提交。图片量很大之前不需要 Git LFS 或 R2；达到媒体仓库规模后再单独迁移资产存储。

## 正常流程：任意目录选文发布

文章可以这样放置，目录名和图片目录不受项目限制：

```text
C:\Notes\算法\二分查找.md
C:\Notes\算法\images\diagram.png
```

先预览变更（`--file` 可以重复）：

```powershell
npm run content:publish-selection -- `
  --workspace "C:\Notes" `
  --file "C:\Notes\算法\二分查找.md" `
  --out "C:\Users\me\Documents\keronshans-blog-content" `
  --dry-run
```

确认预览后提交：

```powershell
npm run content:publish-selection -- `
  --workspace "C:\Notes" `
  --file "C:\Notes\算法\二分查找.md" `
  --out "C:\Users\me\Documents\keronshans-blog-content" `
  --expected-parent-sha "<预览中的 SHA>" `
  --commit
```

Markdown 图片使用相对路径，例如 `![图](images/diagram.png)`。发布器会检查图片确实位于 workspace 内，将其放到 `assets/articles/<stable-id>/...`，并把正文引用改写成站点绝对路径 `/assets/articles/<stable-id>/...`；未引用图片不会发布。缺图、越界路径、符号链接和不安全格式会在写入内容仓库前失败。

桌面管理器中的“选择文章发布”按钮会打开文件选择器和内容仓库选择器，显示变更列表，确认后执行同一套命令。

## 兼容输入：Published Vault

`Published/` 仍可作为迁移期或批量导出的输入，但不是日常使用要求。它适合一次性整理完整快照，不能替代上面的任意目录选文流程。

```text
Keronshans-Notes/             # Obsidian Vault，单独保存和备份
  00-Inbox/
  10-Notes/
  Published/
    posts/*.md
    snippets/*.md
    assets/*
    site.json
    content-registry.json       # 可选输入；发布器维护撤稿墓碑
    problems.json

keronshans-blog-content/      # 由发布器维护的公开内容仓库
  posts/*.md
  snippets/*.md
  assets/*
  site.json
  content-registry.json
  content-manifest.json
  problems.json

keronshans_blogsorce/         # 本仓库，只保存博客框架
```

`Published/posts`、`Published/snippets`、`Published/assets` 和 `Published/site.json` 必须存在；缺失会失败，不会回退扫描 Vault 根目录。Markdown 可以嵌套目录，但只能使用 `.md`。

迁移盘点完成后，用 `npm run content:migration-audit -- --map <migration-map.json> --source <content-root>` 校验每条 source hash、稳定 ID、slug 和旧 URL。默认遇到 `needs-review` 或 `conflict` 会非零退出；`--allow-unresolved` 只用于盘点报告，不能作为 G1 退出或正式发布门禁。

## 导出内容

先预检，不写输出：

```powershell
npm run content:check -- `
  --source "C:\Users\31802\Documents\Keronshans-Notes" `
  --published Published
```

生成候选并验证：

```powershell
npm run content:publish -- `
  --source "C:\Users\31802\Documents\Keronshans-Notes" `
  --out "C:\Users\31802\Documents\keronshans-blog-content" `
  --dry-run
```

确认后发布：

```powershell
npm run content:publish -- `
  --source "C:\Users\31802\Documents\Keronshans-Notes" `
  --out "C:\Users\31802\Documents\keronshans-blog-content" `
  --expected-parent-sha "<当前内容仓库 HEAD>" `
  --ref "main" `
  --commit --push
```

发布器会先写旁路候选目录，复核 ready 文档、站点配置、已引用资源和 `problems.json` 的源文件 size/hash，再替换受管输出；源文件或 Git 基线变化时保留上一份输出并失败。检测到撤稿时，首次执行使用 `--dry-run` 取得 `removalDigest`，正式执行必须同时提供 `--accept-removals <digest>`；已有内容全部撤下还必须提供 `--allow-empty`。draft 不进入 manifest，连续相同内容使用同一 snapshotDigest。正式内容必须使用 schemaVersion 1；`--allow-legacy` 只用于迁移盘点。

从已发布快照生成确定性全文索引：

```powershell
npm run content:search -- `
  --content-root "C:\Users\31802\Documents\keronshans-blog-content" `
  --out "C:\Users\31802\Documents\search.json"
```

索引字节包含 `schemaVersion`、`snapshotDigest` 和纯文本 documents；命令输出 `searchDigest`，可作为 `/_content/<searchDigest>/search.json` 的 immutable 地址。

## GitHub Actions

框架仓库的 Cloudflare workflow 支持从独立内容仓库检出内容。需要在框架仓库设置：

- 在 `release.json` 提交 `contentRepository` 和精确 40 位 `contentSha`；允许的生产仓库为 `ZuesHans/keronshans-blog-content`
- Repository variable `PRODUCTION_URL`：`https://keronshans.top`
- Repository secret `CONTENT_REPO_TOKEN`：内容仓库为私有仓库时使用，至少需要读取权限
- Repository secrets `CLOUDFLARE_API_TOKEN` 和 `CLOUDFLARE_ACCOUNT_ID`

内容仓库推送后，提交框架的 `release.json` 新 pin，然后手动运行 main 的 workflow。`--dispatch-repo` 已停用，避免未提交的 payload 改变生产输入。没有 secrets 时手动发行明确失败，本地 OAuth 可使用相同 npm 入口发行。

## 迁移顺序

1. 创建独立的内容仓库，并把现有 `content/` 复制到 Vault 的 `Published/`。
2. 用发布器导出到内容仓库，检查文章列表和图片链接。
3. 更新 `release.json` 和按需配置 GitHub Actions 的 secrets。
4. 当前内容 pin 为 `056ed5c1b959052a2f2d73c54b575f82cb0a54c7`；旧 `content/` 留在本机和项目外备份，已从框架 Git 移除。

框架构建只使用独立 `.content/` checkout；开发编辑使用独立作者工作区。图片必须移除 EXIF 元数据后再发布，校验器保守拒绝所有 EXIF。publisher 使用同一输出的排他锁并在替换异常时恢复旧文件；跨机器远端竞争仍由 expected-parent 和 fast-forward push 拒绝，失败后保留本地提交便于人工合并。
