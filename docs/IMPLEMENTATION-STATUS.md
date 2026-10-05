# v1 发行状态

2026-10-06。当前范围以 [ADR 0004](adr/0004-release-v1-scope.md) 为准；早期完整平台规范的目标不等于实际发行承诺。

| 能力 | 已完成 |
| --- | --- |
| 内容分离 | 独立内容仓库 pin `056ed5c1b959052a2f2d73c54b575f82cb0a54c7`；39 文章、16 模板、29 题目；正文及本地 Worker 状态不进入框架 Git |
| 迁移身份 | 36 本地与 49 D1 来源映射完成；53 历史路径；稳定 ID 保持、旧评论/点赞迁移，无正文 DB 回退 |
| 发布校验 | schema、文件 manifest/hash、路径冲突、AST 图片闭包、文件签名、EXIF 拒绝、撤稿确认；输出 registry 作为下一次基线 |
| 发行 | Next/OpenNext Worker 构建；源码及产物摘要；CI、手动串行发布、产物归档、公网 HTML/RSC/版本健康检查 |
| 安全 | 生产后台默认关闭；生产拒绝密码及旧会话；Access 本地签名/JWKS 测试覆盖 issuer/AUD/sub/RS256/过期；Origin/CSRF；D1 共享限流；流式请求大小上限 |
| 动态互动 | SQLite 合同测试覆盖共享限流、评论幂等和审核 revision、点赞重复与冲突；生产无 Turnstile 时写入关闭 |
| 桌面作者 | 独立工作区、v1 新建、草稿/可发布状态、revision 和备份；Electron 调用 Node publisher 已修正 |
| Worker 烟测 | 39/39 文章 HTML/RSC、16 模板、53 历史地址、静态 JS、搜索/发行摘要、404、生产密码入口关闭 |
| 浏览器 | 1280 和 360 px 主页截图；360 px 无横向溢出、图片无失败；文章、搜索交互验收 |
| 依赖 | Node 24；lint、类型检查及测试；生产依赖 audit 为 0 |

Access 尚未配置，按作者决定生产后台关闭。Turnstile 尚未配置，评论/点赞写入关闭。GitHub 生产 secrets 尚未配置，本版通过本地 Cloudflare OAuth 发行；CI 检查不依赖这些 secrets。

`scripts/release-controller.cjs` 和 `src/lib/release/state.ts` 是未来控制器的领域原型，没有挂载生产 API。正式 v1 发行入口是 npm/GitHub workflow，`/api/deploy` 固定拒绝。

旧 D1 正文表保留为审计/回滚档案；本版不删除它们。最新数据库备份与全部旧分支 bundle 位于项目外 `keronshans-release-backup-2026-10-06`。D1 增量迁移必须先备份；`0002` 含 ALTER 只执行一次；新环境直接应用 `schema.sql`。重跑 `0004/0005` 不重复增列或插入互动。

回滚优先使用 Cloudflare 已保留 Worker version（`wrangler deployments list`、`wrangler rollback <version-id>`），并验证其 version/HTML；或恢复旧框架 commit 和旧 `release.json` pin 重新构建。不要把 D1 正文恢复为运行时读取源。
