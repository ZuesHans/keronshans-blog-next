# Keronshans Blog 项目导览

这份文档是给“刚开始接触工程化前端”的你看的。它不追求把每个细节都讲完，而是先帮你建立地图感：哪些文件重要，内容从哪里来，改东西时应该先找哪里。

## 1. 这个项目是什么

这是一个基于 Next.js 的个人博客/算法内容管理网站，主要功能包括：

- 展示文章、题解、模板、日记等 Markdown 内容
- 展示代码片段和题单
- 有一个 `/dashboard` 管理后台，用来新增/编辑文章和代码片段
- 支持 Cloudflare Workers + D1 数据库部署

项目里同时保留了旧博客生成出来的静态 HTML 文件，例如根目录的 `index.html`、`archives/`、`tags/`、很多中文分类目录等。真正正在开发的新版应用主要在 `src/`、`content/`、`public/`、配置文件这些位置。

## 2. 你最需要认识的目录

```txt
src/
  app/                  Next.js 页面和 API
  components/           可复用组件，例如导航栏、Markdown 渲染器
  lib/                  数据读取、鉴权等逻辑

content/
  posts/                文章 Markdown 文件
  snippets/             代码片段 Markdown 文件

public/                 Next.js 静态资源

img/ assets/ css/ js/   旧静态博客遗留资源

archives/ tags/ page/
KH_* wp_* ZU_*          旧静态博客生成出来的页面目录

package.json            项目脚本和依赖
next.config.js          Next.js 配置
wrangler.toml           Cloudflare Workers/D1 部署配置
schema.sql              D1 数据库表结构
deploy.ps1             Windows 部署脚本
```

## 3. 运行方式

常用命令在 `package.json` 里：

```bash
npm run dev       # 本地开发
npm run build     # 生产构建
npm run deploy    # 构建并部署到 Cloudflare
```

本地开发时通常打开：

```txt
http://localhost:3000
```

如果端口被占用，Next.js 可能会自动换到 3001、3002。

## 4. 页面在哪里改

Next.js App Router 的规则是：`src/app/某路径/page.tsx` 对应网站上的 `/某路径`。

```txt
src/app/page.tsx                 首页 /
src/app/posts/page.tsx           文章列表 /posts
src/app/posts/[id]/page.tsx      文章详情 /posts/xxx
src/app/search/page.tsx          搜索 /search
src/app/snippets/page.tsx        代码片段 /snippets
src/app/problems/page.tsx        题单 /problems
src/app/tools/page.tsx           工具 /tools
src/app/talks/page.tsx           说说 /talks
src/app/checkin/page.tsx         打卡 /checkin
src/app/about/page.tsx           关于 /about
src/app/dashboard/page.tsx       管理后台 /dashboard
```

全站共同的外壳在：

```txt
src/app/layout.tsx
```

导航栏在：

```txt
src/components/Navigation.tsx
```

全局样式在：

```txt
src/app/globals.css
tailwind.config.ts
```

## 5. 文章数据从哪里来

核心文件：

```txt
src/lib/posts.ts
```

它的策略是：

1. 在线上 Cloudflare 环境里，优先读 D1 数据库。
2. 如果没有 D1，就读本地 `content/posts/*.md` 文件。

所以你会看到两套数据来源：

```txt
content/posts/       本地 Markdown
Cloudflare D1        线上数据库
```

这也是项目复杂度上升的原因之一：它不是纯静态 Markdown 博客，也不是纯数据库 CMS，而是两者混合。

## 6. 分类规则

目前分类主要靠文件名前缀判断：

```txt
KH_    笔记
ZU_    模板
wp_    题解
sp_    专题
Diary  日记
```

相关逻辑在：

```txt
src/lib/posts.ts
src/app/dashboard/page.tsx
```

如果你以后想改分类，应该优先改这里，而不是到处手动替换页面文字。

## 7. Markdown 渲染

文章详情页会用这个组件渲染 Markdown：

```txt
src/components/MarkdownRenderer.tsx
```

它支持：

- GFM 表格、列表等
- 数学公式 KaTeX
- 原始 HTML
- 代码块折叠

文章详情页入口：

```txt
src/app/posts/[id]/page.tsx
```

## 8. 管理后台

后台页面：

```txt
src/app/dashboard/page.tsx
```

后台相关 API：

```txt
src/app/api/admin/route.ts
src/app/api/admin/[filename]/route.ts
src/app/api/snippets/route.ts
src/app/api/deploy/route.ts
```

当前后台密码写在源码里：

```txt
src/lib/auth.ts
src/app/api/admin/route.ts
```

这对个人小站可以临时用，但从工程习惯看，后面最好改成环境变量。

## 9. 当前主要问题

### 9.1 新旧项目混在一起

根目录里有大量旧静态博客生成物：

```txt
index.html
archives/
tags/
page/
KH_*
wp_*
ZU_*
css/
js/
```

新版 Next.js 应用在：

```txt
src/
content/
package.json
next.config.js
wrangler.toml
```

建议先不要急着删旧文件。先确认线上实际部署入口是 Next.js/Cloudflare Workers 之后，再单独清理遗留静态文件。

### 9.2 PowerShell 默认显示可能造成“乱码错觉”

在 PowerShell 里如果不用 UTF-8 读取，中文源码可能显示成乱码。用下面这种方式读取会正常：

```powershell
Get-Content -Encoding utf8 src\app\page.tsx
```

项目已经补了 `.editorconfig`，要求编辑器按 UTF-8 保存文件。后面如果 VS Code 右下角不是 `UTF-8`，优先切回 UTF-8。

之前重点检查过这些核心文件：

```txt
src/app/page.tsx
src/app/layout.tsx
src/lib/posts.ts
```

这些文件本身目前可以按 UTF-8 正常读取。仍然有一些文章内容可能包含从题面复制来的特殊数学符号，构建时会被 KaTeX 警告，但不阻塞构建。

### 9.3 构建配置有环境问题

当前 `npm run build` 报错，Next.js 把工作区根目录误判到了：

```txt
C:\Users\31802
```

然后因为权限问题无法读取，导致构建失败。提示里说检测到了多个 `package-lock.json`。可以通过清理上层多余 lockfile，或在 `next.config.js` 设置 `outputFileTracingRoot` 来处理。

### 9.4 生产构建被配置成忽略错误

`next.config.js` 里现在有：

```js
eslint: {
  ignoreDuringBuilds: true,
},
typescript: {
  ignoreBuildErrors: true,
},
```

这会让很多代码问题在构建时被跳过。短期能省事，长期会让 bug 藏起来。等项目稳定后，建议逐步打开检查。

### 9.5 密码硬编码

后台密码现在直接写在源码里。更稳妥的方式是用环境变量，比如：

```txt
ADMIN_PASSWORD
```

然后本地 `.env.local` 和 Cloudflare secret 分别配置。

## 10. 建议你的学习/整理路线

第一阶段：只改内容

- 学会编辑 `content/posts/*.md`
- 理解 Markdown frontmatter
- 会跑 `npm run dev`
- 会从 `/posts` 和 `/posts/[id]` 看效果

第二阶段：改页面文案和结构

- 改 `src/app/page.tsx`
- 改 `src/components/Navigation.tsx`
- 改 `src/app/about/page.tsx`

第三阶段：理解数据流

- 读 `src/lib/posts.ts`
- 读 `src/app/posts/page.tsx`
- 读 `src/app/posts/PostsClient.tsx`
- 读 `src/app/posts/[id]/page.tsx`

第四阶段：整理工程

- 修复乱码文件
- 修复 build 根目录误判
- 把密码改成环境变量
- 给项目补 README
- 决定旧静态博客文件是否归档

## 11. 改东西时的速查表

```txt
我要改导航栏             src/components/Navigation.tsx
我要改首页               src/app/page.tsx
我要改文章列表           src/app/posts/PostsClient.tsx
我要改文章详情样式       src/app/posts/[id]/page.tsx
我要改 Markdown 显示     src/components/MarkdownRenderer.tsx
我要改全局颜色/卡片      src/app/globals.css
我要加一篇文章           content/posts/xxx.md 或 /dashboard
我要改分类规则           src/lib/posts.ts
我要改后台               src/app/dashboard/page.tsx
我要改后台 API           src/app/api/*
我要改部署               wrangler.toml / deploy.ps1
```

## 12. 最推荐先做的三件事

1. 把后台密码从源码改成环境变量。
2. 逐步打开 TypeScript 和 ESLint 检查。
3. 决定旧静态博客文件是否归档。

做完这三件事之后，这个项目会从“能跑但难接手”变成“可以慢慢维护”的状态。
