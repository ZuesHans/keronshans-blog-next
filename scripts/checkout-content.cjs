const fs = require("node:fs");
const path = require("node:path");
const { spawnSync } = require("node:child_process");

const root = path.resolve(__dirname, "..");
const pin = JSON.parse(fs.readFileSync(path.join(root, "release.json"), "utf8"));
const repository = process.env.CONTENT_REPO || pin.contentRepository;
const sha = process.env.CONTENT_SHA || pin.contentSha;
const destination = path.resolve(process.env.BLOG_CONTENT_ROOT || path.join(root, ".content"));
function git(args) {
  const result = spawnSync("git", args, { encoding: "utf8", stdio: ["ignore", "pipe", "pipe"] });
  if (result.status !== 0) throw new Error(result.stderr.trim() || "Content checkout failed");
  return result.stdout.trim();
}
try {
  if (!/^[A-Za-z0-9_.-]+\/[A-Za-z0-9_.-]+$/.test(repository) || !/^[a-f0-9]{40}$/.test(sha)) throw new Error("release.json requires a repository and exact content commit SHA");
  if (!fs.existsSync(destination)) git(["-c", "core.autocrlf=false", "clone", `https://github.com/${repository}.git`, destination]);
  if (git(["-C", destination, "rev-parse", "--show-toplevel"]).toLowerCase() !== destination.replaceAll("\\", "/").toLowerCase()) throw new Error("BLOG_CONTENT_ROOT must be an independent content Git checkout");
  if (git(["-C", destination, "status", "--porcelain"])) throw new Error("Content checkout has uncommitted edits; commit or publish them before switching the release pin");
  git(["-C", destination, "config", "core.autocrlf", "false"]);
  if (git(["-C", destination, "rev-parse", "HEAD"]) !== sha) {
    git(["-C", destination, "fetch", "origin", sha]);
    git(["-C", destination, "checkout", "--detach", sha]);
  }
  console.log(`Content pinned to ${repository}@${sha}`);
} catch (error) {
  console.error(error.message);
  process.exitCode = 1;
}
