# Keronshans Blog 公网安全审计报告

- 审计日期：2026-09-05
- 审计范围：当前工作区代码、Git 历史中的敏感信息痕迹、依赖树，以及公网部署的基础黑盒检查
- 公网目标：`https://keronshans.top`（同时抽查 `https://keronshans-blog.3180263779.workers.dev`）
- 方式：静态代码审查、未认证 API 请求、默认占位密码/令牌探测、`npm audit --omit=dev`
- 说明：未尝试猜测真实管理员密码、未进行破坏性操作；已修改安全相关源文件并在部署前完成构建验证

## 结论摘要

管理员接口的基本认证链路目前是有效的：未携带会话访问 `/api/admin` 和 `/api/auth/admin` 均返回 `401`；使用示例中的 `change-me` 也未能登录。因此，**目前没有证据表明线上正在使用示例默认密码**。

但仍有以下需要处理的问题：

1. **已修复并待部署验证：会话签名密钥曾回退使用管理员密码。** 已删除回退逻辑、要求独立且至少 32 字节的 `ADMIN_SESSION_SECRET`；当前线上 Secret 已补齐，部署后旧代码路径将不再生效。
2. **高危/中危：生产依赖仍有 2 项审计结果。** 当前已升级 Next.js 到 `15.5.25`、OpenNext Cloudflare 到 `1.20.6`；剩余问题来自 Next.js 所带的 `postcss@8.4.31`，npm 提议的修复会升级到 Next.js 16，需单独评估兼容性后处理。
3. **中高危：登录防爆破能力不足。** 目前仅使用 Worker 实例内存 Map 按 IP 限流，无法在多实例/多地区之间共享，也可通过更换 IP 绕过；没有 MFA、Cloudflare Access 或账号级锁定。
4. **部分修复：管理员 Cookie 已加固。** 生产环境现使用 `__Host-keronshans_admin_session`、HttpOnly、Secure、SameSite=Strict、Path=/；仍没有服务端撤销机制，泄露的会话最长可用 6 小时。
5. **中危：Markdown 渲染启用了原始 HTML，且 CSP 允许 `unsafe-inline`/`unsafe-eval`。** 如果文章内容、数据库内容或依赖链被写入恶意 HTML，存储型 XSS 的防线较弱。
6. **需确认：若打卡、说说、题目备注不是有意公开，存在公开信息泄露。** 公网 GET 接口会返回这些记录的完整字段。

## 详细发现

### K-01：会话密钥回退到管理员密码（高危，已修复）

**历史位置**：`src/lib/adminPassword.ts` 的会话密钥读取逻辑

历史代码曾在缺少独立密钥时回退到管理员密码。当前实现已改为只读取 `ADMIN_SESSION_SECRET`，长度不足 32 个字符时直接拒绝签发/验证会话。当前实现用 HMAC-SHA-256 签发无状态管理员 Cookie，这个思路本身可以工作；已修复的问题后果包括：

- 管理员密码与会话签名密钥耦合；
- 只要密码从日志、终端、浏览器恶意扩展、部署配置或其他渠道泄露，就可能离线伪造有效会话；
- 配置错误不会导致部署失败，而是静默降级到较弱方案；
- 线上无法仅轮换会话密钥来立即废弃已有会话。

**修复方案（优先级最高）**：

- 生产环境强制设置独立、随机、至少 32 字节的 `ADMIN_SESSION_SECRET`；
- 启动/请求时若 `ADMIN_PASSWORD` 或 `ADMIN_SESSION_SECRET` 缺失、过短，直接拒绝管理功能并记录不含秘密的配置错误；
- 已删除 `|| getAdminPassword()` 回退逻辑；
- 修改密码或怀疑泄露时，立即轮换两个 Secret，并清理现有会话；
- 长期建议把 `/dashboard` 放到 Cloudflare Access/Zero Trust 后面，密码登录只作为备用。

示例（本地生成随机值，值不要写入 Git）：

```powershell
$bytes = New-Object byte[] 32
[Security.Cryptography.RandomNumberGenerator]::Fill($bytes)
[Convert]::ToBase64String($bytes)

npx wrangler secret put ADMIN_PASSWORD
npx wrangler secret put ADMIN_SESSION_SECRET
```

### K-02：生产依赖仍有审计结果（高危/中危，部分缓解）

`npm audit --omit=dev` 在 2026-09-05 复核后检出 1 项 high、1 项 moderate：

- `postcss@8.4.31`：由 `next@15.5.25` 引入，存在 source map 路径遍历/文件读取类公告；
- `next@15.5.25`：因上述嵌套 PostCSS 审计结果被标记为 moderate。

此前报告中的 `js-yaml`、`nanoid`、`sharp` 等旧版本结果已在依赖升级后消除。

**修复方案**：

1. 在独立分支执行 `npm update` 或针对审计结果升级受影响的直接依赖/锁文件；
2. 已把 Next.js 更新到 `15.5.25`，并将 `@opennextjs/cloudflare` 更新到 `1.20.6`；
3. 剩余 PostCSS 修复目前需要 npm 提议的 Next.js 16.3.4，先在隔离分支验证 OpenNext/Cloudflare 兼容性，不直接执行 `npm audit fix --force`；
4. 运行 `npm audit --omit=dev`、`npm run build`、现有测试后再部署；
5. 在 CI 中加入 `npm audit --omit=dev --audit-level=high`，避免以后带漏洞发布。

不要直接在生产环境执行未经测试的 `npm audit fix --force`，因为可能升级 Next/React 大版本并破坏 Cloudflare OpenNext 适配。

### K-03：登录限流不是可靠的公网防爆破控制（中高危）

**位置**：`src/app/api/auth/admin/route.ts:27`、`src/lib/rateLimit.ts:4-39`

当前登录限制为每 IP 10 分钟 8 次，但计数保存在单个 Worker 实例的内存 Map 中：

- Worker 重启、扩容或流量切换后计数会丢失；
- 攻击者可使用多个 IP/代理绕过；
- `cf-connecting-ip` 缺失时全部请求归入 `unknown`，会造成误伤或被用来进行限流拒绝服务；
- 没有用户名/账号维度（目前是单一管理员密码）、MFA、渐进式退避或全局封禁。

**修复方案**：

- 首选 Cloudflare WAF Rate Limiting/Turnstile，或 Cloudflare Access；
- 若继续自建，使用 Durable Object/KV 等共享状态做全局限流，并同时按 IP、设备/挑战结果和登录端点做限流；
- 失败次数采用指数退避，成功登录后保留短期安全窗口；
- 对登录请求限制 body 大小并设置 `Cache-Control: no-store`；
- 管理后台加 MFA，或限制为个人固定 IP/VPN 才可访问。

### K-04：管理员 Cookie 还可以加强（中危）

**位置**：`src/lib/adminPassword.ts:5-6, 98-106`

目前已有较好的属性：`httpOnly`、`sameSite: strict`、根路径和 6 小时过期时间。仍有以下不足：

- Cookie 名称不是 `__Host-` 前缀；
- `secure` 由请求 URL 是否为 HTTPS 决定，最好在生产环境强制为 `true`；
- 会话是无状态签名 Cookie，服务端没有撤销列表；Cookie 被窃取后，在过期前仍然有效；
- 登出只是让浏览器删除 Cookie，并不能使已复制出去的 Cookie 失效。

**修复方案**：

- 改名为 `__Host-keronshans_admin_session`；
- 生产环境固定 `secure: true`，并确认所有管理流量只走 HTTPS；
- 缩短会话有效期到 1–2 小时，加入 `iat`/`jti`；
- 通过 Durable Object/KV 保存会话版本或撤销列表，Secret 轮换时递增版本，立即废弃旧会话；
- 所有管理变更请求校验 `Origin`，只接受本站精确来源。SameSite 是重要缓解措施，但不应作为唯一 CSRF 防线。

### K-05：原始 Markdown HTML + 宽松 CSP（中危）

**位置**：`src/components/MarkdownRenderer.tsx:9, 78`、`next.config.mjs:16-17`

渲染器启用了 `rehypeRaw`，会把文章中的原始 HTML 交给渲染流程；同时 CSP 使用了 `unsafe-inline` 和 `unsafe-eval`。只要文章来源、数据库内容或管理员账号有一次被污染，恶意 HTML 的影响面会更大。

**修复方案**：

- 如果不需要 HTML，删除 `rehypeRaw`；
- 如果需要 HTML，在 `rehypeRaw` 后接 `rehype-sanitize`，使用严格白名单，仅允许安全标签、属性和 `https`/站内链接；
- 禁止事件属性、`javascript:`、任意 iframe、危险 SVG、外链表单等；
- 用 nonce/hash 重写 CSP，生产环境删除 `unsafe-eval`，尽量删除 `unsafe-inline`；
- 对文章内容做长度限制，避免超大内容导致 DoS。

### K-06：部分公开 API 返回完整个人/管理记录（需确认）

公网实测以下接口在未登录时返回 200：

- `/api/checkins`：返回打卡记录字段，包括 `note`、`content`；
- `/api/talks`：返回说说内容；
- `/api/problems`：返回题目、备注和分析；
- `/api/snippets`：返回公开代码片段。

这不一定是漏洞，可能是网站设计。但如果其中任何字段本来只应供管理员或本人查看，就属于信息泄露。

**修复方案**：

- 公开接口只返回必要字段，特别是隐藏 `note`、`analysis`、内部 ID、创建时间等；
- 管理列表单独使用已认证 API；
- 为“公开内容”和“私人内容”增加明确字段/表级权限；
- 对已有内容做一次敏感信息清理。

## 已验证项目

- `GET https://keronshans.top/api/auth/admin`：`401 Unauthorized`；
- `GET https://keronshans.top/api/admin`：`401 Unauthorized`；
- 使用 `.env.example` 中的 `change-me` 作为管理员密码：登录失败，返回 `401`；
- 使用 `change-me` 作为 OJ 同步令牌：未授权，未发现示例令牌可用；
- 线上响应包含 `X-Frame-Options: DENY`、`X-Content-Type-Options: nosniff`、`Referrer-Policy` 和 `Permissions-Policy`；
- 根目录和当前 Git 历史未发现真实 `.env`、私钥或明显的 GitHub/服务 API Token；仓库中只看到示例占位符。该结论不能替代 GitHub Secret、Cloudflare Secret 和历史构建产物的后台检查。

## 建议修复顺序

### 立即处理

1. ✅ 已确认 Cloudflare Secret 中同时存在独立的 `ADMIN_PASSWORD` 和 `ADMIN_SESSION_SECRET`；
2. ✅ 已在代码中移除会话密钥回退，并对缺失/过短配置 fail closed；
3. ✅ 已升级 Next.js/OpenNext 依赖并完成构建；
4. ⏳ 部署修复版本并做公网回归验证；
5. 查看 Cloudflare/GitHub 部署日志、访问日志，确认没有异常登录或部署调用。

### 一周内处理

1. 使用 Cloudflare Access/WAF/Turnstile 或共享状态限流；
2. 改用 `__Host-` Cookie、强制 Secure、增加 Origin 校验和会话撤销；
3. 为 Markdown 加 sanitize，并收紧 CSP；
4. 明确所有 GET API 的公开/私有数据边界。

### 后续增强

- 管理员 MFA；
- Secret 定期轮换与最小权限；
- CI 自动依赖审计和构建安全检查；
- 对登录失败、会话创建、管理写操作接入告警；
- 定期检查 GitHub Actions、Cloudflare Workers、D1/KV 的访问权限。

## 风险评级说明

本报告中的 K-01 历史风险已通过独立会话密钥、fail closed 校验和 Cookie 加固完成代码修复；2026-09-05 已确认 Cloudflare Secret 列表包含 `ADMIN_SESSION_SECRET`。在修复版本完成部署并通过公网回归验证前，仍应将线上视为处于旧版本风险窗口。公网黑盒测试未尝试猜测真实管理员密码或进行压力测试。

## 2026-09-05 追加复核：线上 Secret 配置实测结果

本次通过已登录的 Wrangler 只读取 Secret **名称**，没有读取或输出任何 Secret 值。结果如下：

| Secret | 线上是否存在 | 结论 |
|---|---:|---|
| `ADMIN_PASSWORD` | 是 | 管理员密码已配置，但无法通过 Cloudflare API 读取其值 |
| `ADMIN_SESSION_SECRET` | **是** | **已补齐独立会话签名密钥；部署后不再回退使用 `ADMIN_PASSWORD`** |
| `OJ_SYNC_TOKEN` | 是 | OJ 同步令牌已配置 |
| `SEARCH_API_TOKEN` | 是 | 搜索服务令牌已配置 |
| `DEPLOY_CONFIRM_TOKEN` | 否 | 当前代码中它是可选项；建议部署接口也设置独立确认令牌，或直接移除线上部署 API |

因此，Cloudflare Worker `keronshans-blog` 当前已配置独立的 `ADMIN_SESSION_SECRET`。代码也已禁止在该 Secret 缺失时回退到 `ADMIN_PASSWORD`；在修复版本部署完成前，公网仍可能运行旧代码。示例密码 `change-me` 登录失败，未发现线上使用示例默认密码。

### 已执行与待执行

```powershell
# 生成 32 字节随机会话密钥
$bytes = New-Object byte[] 32
[Security.Cryptography.RandomNumberGenerator]::Fill($bytes)
$sessionSecret = [Convert]::ToBase64String($bytes)
$sessionSecret | npx wrangler secret put ADMIN_SESSION_SECRET --name keronshans-blog
```

已设置独立 Secret，并已修改代码删除回退逻辑。下一步必须部署修复版本；如果以后 Secret 被误删，修复后的代码会拒绝管理员登录，而不会降级使用管理员密码。

### GitHub Actions 复核

- 当前 GitHub 仓库没有发现仓库级 Actions Secret；
- `CLOUDFLARE_DEPLOY_ENABLED` 仓库变量也没有发现；
- 最近的 Cloudflare 部署工作流运行结果为 `skipped`；
- 这说明当前自动部署工作流没有正常启用，实际部署更可能是通过本地 Wrangler/部署脚本完成。

### 公网接口复核

未登录访问管理员接口仍然返回 `401`，但以下接口未登录返回 `200` 并公开数据：

```text
/api/checkins   595 bytes
/api/talks      2676 bytes
/api/problems   8414 bytes
/api/snippets   25720 bytes
```

这部分是否属于漏洞取决于你的设计意图；如果备注、分析或说说内容不希望公开，应立即拆分公开字段和管理员字段。

## 修复执行记录

- `ADMIN_SESSION_SECRET`：已生成随机值并写入 Cloudflare Worker `keronshans-blog`；本报告、日志和 Git 中没有记录 Secret 值。
- `src/lib/adminPassword.ts`：已移除会话密钥回退，要求密钥至少 32 个字符，生产 Cookie 改为 `__Host-keronshans_admin_session` 并强制 Secure。
- `src/types/env.d.ts`：已补充管理员相关环境变量类型。
- 依赖：Next.js `15.5.14 → 15.5.25`，`@opennextjs/cloudflare` `1.18.0 → 1.20.6`。
- `npm run build`：已成功完成；部署已成功完成，首个修复版本 ID 为 `999a16e3-ad3a-4fe6-997c-85ba551724ab`；后续安全响应头加固版本 ID 为 `ca5b60f3-0357-46cc-b956-ce45ae2bd41a`。

## 2026-09-05 部署后回归验证

修复版本已于 2026-09-05 部署到 Cloudflare Worker `keronshans-blog`，绑定域名仍为 `https://keronshans.top`。部署命令未执行 Git 提交或推送。

公网验证结果：

- `GET https://keronshans.top/api/auth/admin`：`401 Unauthorized`；
- `GET https://keronshans.top/api/admin`：`401 Unauthorized`；
- 使用示例密码 `change-me` 对 `POST /api/auth/admin`：`401 Unauthorized`，且未下发 Cookie；
- 线上 Secret 名称包含 `ADMIN_PASSWORD`、`ADMIN_SESSION_SECRET`、`OJ_SYNC_TOKEN`、`SEARCH_API_TOKEN`；只读取名称，未读取或输出任何 Secret 值。

因此，管理员接口的未认证访问和示例默认密码回归结果符合预期。真实管理员密码未被要求、未被读取，也未进行猜测；生产 Cookie 的 `__Host-`、`Secure`、`HttpOnly`、`SameSite=Strict` 属性已通过代码审查确认，真实登录后可由管理员在浏览器开发者工具中再次确认。

部署输出还有两个非阻断警告：OpenNext 在 Windows 上兼容性不如 WSL，以及打包产物包含 bundler 的 `direct eval`。它们不是本次管理员密码修复失败的证据，但建议后续在 WSL/CI 中部署并评估相关依赖。


验证补充：

- `npm run test:manager`：5/5 通过；
- `npm run test:search`：8/8 通过；
- `git diff --check`：通过；
- 未发现 `.env`、`.env.local`、`.env.production`、`.dev.vars` 或私钥文件被加入当前工作区变更。


## 2026-09-05 第二轮加固

在管理员认证修复基础上又完成并部署了以下低风险加固：

- 生产 CSP 移除 `unsafe-eval`，仅开发环境保留；
- 增加 `Strict-Transport-Security: max-age=31536000; includeSubDomains`；
- 增加 `Cross-Origin-Opener-Policy: same-origin`；
- 增加 `Cross-Origin-Resource-Policy: same-origin`；
- `/api/admin` 保存失败时不再把底层异常字符串返回给客户端，仅保留服务端日志。

部署后从公网 `https://keronshans.top/` 实测确认上述安全响应头已返回；管理员接口仍为未授权 `401`，示例密码 `change-me` 仍为 `401` 且不下发 Cookie。

当前仍保留的待处理项：登录限流跨 Worker 实例不共享；`/api/checkins`、`/api/talks`、`/api/problems`、`/api/snippets` 的公开数据边界需要根据站长意图决定；npm audit 剩余 PostCSS 问题需要在隔离分支评估 Next.js 16 兼容性。
