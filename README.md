# Keronshans Blog 1.0

Next.js 15 App Router + React 19，经 OpenNext 部署为 Cloudflare Worker。公开正文来自独立私有 Git 内容仓库，框架仓库不再保存正文、数据库文件或生成产物。当前架构见 [PROJECT_MAP](docs/PROJECT_MAP.md)，发行范围见 [ADR](docs/adr/0004-release-v1-scope.md)。

## 本地运行

需要 Node.js 24、npm、Git，以及独立内容仓库的读取权限。

```powershell
npm ci
npm run check
npm run dev
```

`release.json` 固定内容仓库和完整 commit SHA。`content:checkout` 创建只读 `.content/` checkout，拒绝覆盖未提交修改；Windows 禁用换行转换以保证 manifest 字节摘要。开发服务启动时生成资源和路由快照。作者编辑应放在独立工作区，不能直接改发行 checkout。

## 发行

```powershell
npm run content:verify
npm run build:cloudflare
npm run preview:built -- --port 8787
npm run check:site -- http://127.0.0.1:8787
# 关闭预览后部署同一产物
npm run deploy:built
npm run check:site -- https://keronshans.top
```

构建生成 `.open-next/release-artifact.json`，部署前核对源码和产物摘要。源码或产物变化必须重建。`deploy.ps1` 使用相同 npm 入口，不会自动提交工作区。

GitHub 每次 main push/PR 无条件运行检查。生产 workflow 只接受 main 的手动触发，使用仓库中提交的 pin，串行发布并归档产物、验证公网健康。首次使用需要配置 `CONTENT_REPO_TOKEN`（只读内容仓库）、`CLOUDFLARE_API_TOKEN`、`CLOUDFLARE_ACCOUNT_ID` secrets 和 `PRODUCTION_URL` variable。未配置时手动发布明确失败；本地 Cloudflare OAuth 可以独立发行。

## 内容与安全

选择式 publisher 只导出明确选中的 schema v1 Markdown 和图片引用闭包；整库 publisher 仅扫描 `Published/`。先 dry-run 再创建内容提交，随后在框架 `release.json` 更新 SHA。稳定 ID 不随 slug 改变，旧地址 308，撤稿地址 410。正文 API 只读，D1 仅用于互动和运行数据。详见 [CONTENT-PUBLISHING](docs/CONTENT-PUBLISHING.md)。

生产后台默认关闭：`PRODUCTION_ADMIN_ENABLED=false`，旧密码和 HMAC 会话不再用于生产认证。后续启用必须配置 Access 的 team domain、AUD、管理员 sub，并显式开启。密码仅用于本地开发。无 Turnstile 配置时生产评论/点赞写入关闭；已有评论和计数仍可读取。

桌面管理器：`npm run manager`。默认作者目录在 Documents/keronshans-author/Published，支持草稿/可发布状态、稳定 ID、并发修改检测和本地备份。发布到独立内容仓库后再更新发行 pin。

未来的平台完整规划保留在 [PLATFORM-REBUILD-SPEC](docs/PLATFORM-REBUILD-SPEC.md)，其中独立 controller、GitHub App/OIDC 和外部封存存储属于后续范围，不能视为本版已上线功能。
