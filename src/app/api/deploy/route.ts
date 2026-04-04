import { NextResponse } from "next/server";
import { execSync } from "child_process";
import path from "path";

const ADMIN_PASSWORD = "zues1";

export async function POST(request: Request) {
  const auth = request.headers.get("x-admin-password");
  if (auth !== ADMIN_PASSWORD) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Prevent concurrent deploys
  const lockFile = path.join(process.cwd(), ".deploying");
  try {
    const fs = await import("fs");
    if (fs.existsSync(lockFile)) {
      return NextResponse.json({ error: "部署正在进行中，请稍后重试" }, { status: 409 });
    }
    fs.writeFileSync(lockFile, Date.now().toString());

    // Run deploy in background
    const blogRoot = process.cwd();
    const deployScript = path.join(blogRoot, "deploy.ps1");

    // Execute deploy.ps1 synchronously (PowerShell)
    const result = execSync(
      `powershell -NoProfile -ExecutionPolicy Bypass -File "${deployScript}"`,
      {
        cwd: blogRoot,
        timeout: 300000, // 5 min timeout
        encoding: "utf-8",
        windowsHide: true,
      }
    );

    // Clean up lock
    try { fs.unlinkSync(lockFile); } catch {}

    return NextResponse.json({
      success: true,
      output: result.slice(-500), // Last 500 chars of output
    });
  } catch (error: unknown) {
    // Clean up lock
    try {
      const fs = await import("fs");
      try { fs.unlinkSync(lockFile); } catch {}
    } catch {}

    const msg = error instanceof Error ? error.message : String(error);
    return NextResponse.json({
      error: "部署失败",
      detail: msg.slice(-500),
    }, { status: 500 });
  }
}
