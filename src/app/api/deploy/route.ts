import { NextResponse } from "next/server";

const ADMIN_PASSWORD = "zues1";

export async function POST(request: Request) {
  const auth = request.headers.get("x-admin-password");
  if (auth !== ADMIN_PASSWORD) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Cloudflare Workers cannot run PowerShell scripts or access the filesystem.
  // The deploy.ps1 script MUST be run locally on your machine.
  // We return clear instructions instead of failing.
  return NextResponse.json({
    success: false,
    error: "deploy_locally",
    message: "构建部署需要在本地运行脚本",
    instructions: "请在本地运行以下命令完成部署：",
    commands: [
      "cd C:\\Users\\31802\\Documents\\keronshans_blogsorce",
      "powershell -File deploy.ps1"
    ],
    note: "保存文章/代码片段后，运行上面的命令即可将更改部署到 keronshans.top"
  });
}
