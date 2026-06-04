const { spawn } = require("child_process");
const fs = require("fs");
const path = require("path");

const [command, ...args] = process.argv.slice(2);

if (!command) {
  console.error("Usage: node scripts/with-wrangler-env.cjs <command> [...args]");
  process.exit(1);
}

function loadEnvFile(filePath) {
  if (!fs.existsSync(filePath)) return {};
  return fs.readFileSync(filePath, "utf-8")
    .split(/\r?\n/)
    .reduce((env, line) => {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith("#")) return env;
      const index = trimmed.indexOf("=");
      if (index < 0) return env;
      const key = trimmed.slice(0, index).trim();
      let value = trimmed.slice(index + 1).trim();
      if ((value.startsWith('"') && value.endsWith('"')) || (value.startsWith("'") && value.endsWith("'"))) {
        value = value.slice(1, -1);
      }
      env[key] = value;
      return env;
    }, {});
}

function resolveLocalCommand(name) {
  const binDir = path.join(process.cwd(), "node_modules", ".bin");
  const candidates = process.platform === "win32"
    ? [path.join(binDir, `${name}.cmd`), path.join(binDir, name)]
    : [path.join(binDir, name)];
  return candidates.find((candidate) => fs.existsSync(candidate)) || name;
}

function quoteArg(value) {
  const text = String(value);
  if (!/[\s&()^|<>"]/g.test(text)) return text;
  return `"${text.replace(/"/g, '\\"')}"`;
}

const isWindows = process.platform === "win32";
const resolvedCommand = resolveLocalCommand(command);
const executable = isWindows ? process.env.ComSpec || "cmd.exe" : resolvedCommand;
const spawnArgs = isWindows ? ["/d", "/s", "/c", [resolvedCommand, ...args].map(quoteArg).join(" ")] : args;
const env = {
  ...process.env,
  ...loadEnvFile(path.join(process.cwd(), ".env")),
  ...loadEnvFile(path.join(process.cwd(), ".env.local")),
  WRANGLER_LOG_PATH: process.env.WRANGLER_LOG_PATH || path.join(process.cwd(), ".wrangler", "logs"),
};

const child = spawn(executable, spawnArgs, {
  stdio: "inherit",
  windowsVerbatimArguments: isWindows,
  env,
});

child.on("exit", (code, signal) => {
  if (signal) {
    process.kill(process.pid, signal);
    return;
  }
  process.exit(code ?? 1);
});
