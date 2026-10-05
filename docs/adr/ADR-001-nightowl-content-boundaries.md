# ADR-001：Nightowl 主题与内容边界

- 状态：已实施（本地重构）
- 日期：2026-10-03
- 范围：公开 web、内容读取、publisher

## 决策

第一套主题使用工程内编译时注册的 `nightowl`，组件只消费 `theme-*` 语义类和类型化文章数据。内容契约放在 `src/content/schema.ts`，不依赖 Next.js、Cloudflare 或文件系统。

publisher 只接受 Vault 下明确的 `Published` 目录，且要求 `posts`、`snippets`、`assets`、`site.json` 四个入口都存在。输出由这棵公开树完整重建，草稿不进入输出，模板请求通过已登记 ID 解析，禁止把请求参数直接拼进文件路径。

## 取舍与后续

当前历史文章仍允许旧 frontmatter 在 web 读取器中兼容；迁移器需要逐篇补齐 schemaVersion 1、稳定 id、slug、status 和 updatedAt。运行时 D1 正文回退已退役；正式生产切换仍以 D1 独有正文逐条对账、归档和 migration-map 全部批准为前置门禁。

## 验证

- `npm run lint`
- `npm run build`
- `npm run test:publisher`（Published 缺失、junction 越界、私有文件不导出）
- 内置浏览器检查首页、文章目录、长代码文章的窄屏宽度和 Nightowl 明暗切换
