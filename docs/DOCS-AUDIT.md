# 文档审查记录

审查日期：2026-10-03

## 审查范围

本次检查了 `docs/PLATFORM-REBUILD-SPEC.md`、`docs/CONTENT-PUBLISHING.md`、`docs/PROJECT_MAP.md`、`docs/IMPLEMENTATION-STATUS.md` 和 `docs/adr/`。代码行为以当前工作区为准；文档中的生产域名、Cloudflare 资源、Access 策略和 GitHub 凭据仍是待配置项。

## 结果

| 文档 | 职责 | 结果 |
| --- | --- | --- |
| `PLATFORM-REBUILD-SPEC.md` | 目标架构、契约、验收和迁移退出条件 | 保留为设计基线；不把规范条目当成上线事实 |
| `CONTENT-PUBLISHING.md` | publisher 使用说明和内容仓库边界 | 已同步任意目录选文、AST 图片闭包、增量 Git 提交、Published 兼容输入和撤稿确认参数 |
| `PROJECT_MAP.md` | 当前工程入口、数据流和模块索引 | 作为代码导航；生产边界以实施状态表为准 |
| `IMPLEMENTATION-STATUS.md` | 逐项证据和未完成门禁 | 作为当前状态唯一汇总；已区分本地验证和真实环境验证 |
| `adr/ADR-001-nightowl-content-boundaries.md` | Nightowl 主题和内容边界决策 | 与 schema、publisher、主题组件保持一致 |

## 已消除的文档矛盾

- 选择式发布器接受任意本地 Markdown 文件，按稳定 ID 组装候选快照；Published 模式仍不回退扫描 Vault 根目录，且要求 `Published/posts`、`snippets`、`assets`、`site.json` 全部存在。
- 发布器只输出 AST 实际引用的资源，代码块中的示例图片不会被误判；常见图片格式还会进行文件签名检查。
- 发布器先生成旁路候选，再复核源文件 hash；`expectedParentSha` 变化时不覆盖旧输出。
- 撤稿需要先 `--dry-run` 获取 `removalDigest`，再用 `--accept-removals` 确认；全部撤稿另需 `--allow-empty`。
- 同一稳定 ID 改 slug 时，旧 canonical 路径自动进入 aliases；搜索索引按 `searchDigest` 生成 immutable URL，并核对 `snapshotDigest`。
- README 不再把已经存在的本地命令和接口描述成纯待实现目标。
- 依赖审计已重新执行：生产依赖 `npm audit --omit=dev` 为 0；Next/ESLint 对齐到 15.5.27，Next 使用 PostCSS 8.5.28 override。全量 audit 仍报告 Tailwind 3 开发链的 braces advisory，升级 Tailwind 4 需单独验证主题迁移。
- 后台正文写入旁路已关闭：文章和模板 API 只读当前快照，写入/删除返回 `405 CONTENT_SOURCE_READONLY`；内容修改路径统一回到任意目录选文 → publisher → release-controller。
- `/dashboard` 和 `/snippets` 已收敛为只读审核/浏览界面；模板详情使用稳定的 `/templates/<slug>`，页面不再提供必然失败的正文写入控件。
- GitHub Actions 检出独立内容仓库时必须提供 40 位 `CONTENT_SHA`；workflow 不再把分支名或默认 `main` 当作构建身份。
- 增加 `content:migration-audit` 门禁和 fixture 测试；它会对 source hash、稳定 ID、slug、旧 URL 和 `needs-review` 状态做可重复审查。当前 `output/migration-map.json` 的 36 条记录仍是 `needs-review`，因此文档明确保留 G1 未退出状态。
- 运行时文章/模板/搜索正文的 D1 fallback 已退役，README 不再声称后台可写正文或 D1 优先。旧 D1 表与生产独有内容尚未清理，仍需在正式切换前对账和归档。
- 动态管理入口统一按请求字节上限解析 JSON；checkins/talks 等互动读取在 binding 不可用时返回 503，不再把故障伪装成空集合。

## 当前仍需外部证据

- Access JWT/JWKS、OIDC、GitHub App、Service Binding 和真实入口隔离。
- Cloudflare preview/production 上传、版本对账、R2 产物封存和回滚演练。
- 真实 D1 迁移、备份恢复、Durable Object/WAF 共享限流和 Turnstile secret 验证。
- withdrawn 页面实际返回 410、历史 migration-map 全量审查，以及 360/768/1280 键盘和减弱动效验收。

本轮已补充本地 Playwright 探针：360/768/1280 CSS px 首页与文章页无横向溢出，文章容器存在，减弱动效和浅色模式媒体查询生效。评论/点赞在未配置动态服务时返回 503，属于 fail-closed 配置行为；键盘、公式/表格/TOC 和搜索命中仍需固定内容矩阵。

这些项目已在 `IMPLEMENTATION-STATUS.md` 中列出，不应仅凭本地测试或代码文件存在标记为完成。

## 复核命令

```powershell
npm run check
npm run build
npm run content:verify -- C:\path\to\blog-content
git diff --check
```
