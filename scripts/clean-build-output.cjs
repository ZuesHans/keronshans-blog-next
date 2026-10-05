const fs = require("node:fs");
const path = require("node:path");
const directory = path.resolve(__dirname, "../.open-next");
if (fs.existsSync(directory)) {
  function writable(target) {
    const stat = fs.lstatSync(target);
    if (stat.isSymbolicLink()) return;
    fs.chmodSync(target, 0o755);
    if (stat.isDirectory()) for (const name of fs.readdirSync(target)) writable(path.join(target, name));
  }
  writable(directory);
  try { fs.rmSync(directory, { recursive: true, force: true, maxRetries: 5, retryDelay: 300 }); }
  catch (error) { throw new Error(`Close the local Worker preview before rebuilding: ${error.message}`); }
}
