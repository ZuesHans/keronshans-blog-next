import { NextResponse } from "next/server";

const ADMIN_PASSWORD = "zues1";

export async function POST(request: Request) {
  const password = request.headers.get("x-admin-password");
  if (password !== ADMIN_PASSWORD) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Try to trigger GitHub Actions workflow if GITHUB_TOKEN is available as env var
  // In Cloudflare Workers, this won't work directly, but we return helpful info
  const githubToken = process.env.GITHUB_TOKEN;
  const githubRepo = process.env.GITHUB_REPO || "ZuesHans/ZuesHans.github.io";

  if (githubToken) {
    try {
      const res = await fetch(
        `https://api.github.com/repos/${githubRepo}/actions/workflows/deploy.yml/dispatches`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${githubToken}`,
            "Content-Type": "application/json",
            Accept: "application/vnd.github+json",
          },
          body: JSON.stringify({ ref: "main" }),
        }
      );
      if (res.status === 204 || res.status === 200) {
        return NextResponse.json({
          success: true,
          message: "已触发 GitHub Actions 部署，请等待 2-3 分钟",
        });
      }
    } catch {
      // Fall through to local deploy
    }
  }

  // Return clear local deploy instructions
  return NextResponse.json(
    {
      success: false,
      error: "deploy_locally",
      instructions: `请在本地运行以下命令进行部署：

1. 打开 PowerShell：
   cd C:\\Users\\31802\\Documents\\keronshans_blogsorce

2. 运行部署脚本：
   powershell -File deploy.ps1

3. 如果想自动化部署，请设置以下 GitHub Secrets：
   - CLOUDFLARE_API_TOKEN: 你的 Cloudflare API Token
   - CLOUDFLARE_ACCOUNT_ID: 你的 Cloudflare Account ID
   设置后，每次推送到 GitHub main 分支会自动部署。
`,
      hint: "running_deploy_script",
    },
    { status: 200 }
  );
}
