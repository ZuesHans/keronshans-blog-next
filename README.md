# Keronshans Blog Next

这是一个 Next.js + Cloudflare Workers/OpenNext 的个人整理站，内容主要放在 `content/`，前端页面和接口放在 `src/`。

## 日常修改

- 改首页：`src/app/page.tsx`
- 改导航：`src/components/Navigation.tsx`
- 改全局配色/卡片/字体：`src/app/globals.css`
- 改关于页：`src/app/about/page.tsx`
- 写文章：`content/posts/*.md`，也可以用后台 `/dashboard`
- 改代码片段：`content/snippets/*.md` 或后台

## 本地预览

```powershell
npm run dev
```

打开终端显示的本地地址，通常是 `http://localhost:3000`。

## 本地桌面管理器

```powershell
npm run manager
```

这个命令会打开 Electron 小窗口。第一版用于管理本地文章、代码片段和题目：

- 文章：`content/posts/*.md`
- 代码片段：`content/snippets/*.md`
- 题目：`content/problems.json`

正文仍然推荐用 VS Code 写。管理器里的“打开当前文件”会直接把对应文件交给 VS Code。

## 发布前检查

```powershell
npm run build
```

只要最后显示构建成功，就可以继续发布。现在构建时可能会看到几行 `Unrecognized Unicode character "∗"`，这是文章内容里的数学符号警告，不影响发布。

## 推到 GitHub 备份

```powershell
git status
git add -A
git commit -m "你的修改说明"
git push origin main
```

GitHub 仓库是 `https://github.com/ZuesHans/keronshans-blog-next`。旧 Hexo 仓库保存在 `hexo-old` remote，不要往那里推这个新项目。

## 发布到 Cloudflare

推荐流程：

```powershell
npm run build
powershell -File deploy.ps1 -SkipGit
```

如果你已经把代码推到 GitHub 了，就用 `-SkipGit`。如果只是想直接部署当前电脑上的版本，也可以用：

```powershell
npx wrangler deploy
```

线上地址：`https://keronshans-blog.3180263779.workers.dev`

## 后台密码

后台密码不再写死在代码里，而是读取环境变量 `ADMIN_PASSWORD`。

本地开发时，新建 `.env.local`：

```env
ADMIN_PASSWORD=换成你的密码
```

Cloudflare 线上环境需要设置 Secret：

```powershell
npx wrangler secret put ADMIN_PASSWORD
```

运行后终端会让你输入密码。不要把真实密码提交到 GitHub，也不要写进代码。

## 已清理的旧静态文件

这个项目现在真正运行的是 Next.js。旧 Hexo 生成出来的根目录 HTML 和静态资源已经清理掉了，比如：

- `index.html`
- `archives/`
- `tags/`
- `page/`
- `Diary/`
- `KH_*`、`wp_*`、`ZU_*`、`sp_*` 这类旧文章 HTML 目录
- `search.xml`
- 根目录的旧 `css/`、`js/`、`assets/`

不要删 `content/`、`src/`、`public/`、`scripts/`、`package.json`、`wrangler.toml`、`deploy.ps1`。这些是现在的 Next 站点真正需要的文件。

## 创建桌面快捷方式

运行一次：

```powershell
powershell -File scripts/create-manager-shortcut.ps1
```

之后桌面会出现 `Keronshans Blog Manager` 图标。双击它会静默启动本地 Electron 管理器，不会额外弹出黑色命令行窗口。
