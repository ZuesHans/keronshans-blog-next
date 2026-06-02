const { spawn } = require("child_process");
const path = require("path");

const [command, ...args] = process.argv.slice(2);

if (!command) {
  console.error("Usage: node scripts/with-wrangler-env.cjs <command> [...args]");
  process.exit(1);
}

const isWindows = process.platform === "win32";
const executable = isWindows ? process.env.ComSpec || "cmd.exe" : command;
const spawnArgs = isWindows ? ["/d", "/s", "/c", [command, ...args].join(" ")] : args;

const child = spawn(executable, spawnArgs, {
  stdio: "inherit",
  windowsVerbatimArguments: isWindows,
  env: {
    ...process.env,
    WRANGLER_LOG_PATH: process.env.WRANGLER_LOG_PATH || path.join(process.cwd(), ".wrangler", "logs"),
  },
});

child.on("exit", (code, signal) => {
  if (signal) {
    process.kill(process.pid, signal);
    return;
  }
  process.exit(code ?? 1);
});
