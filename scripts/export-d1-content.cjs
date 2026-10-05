#!/usr/bin/env node

const fs = require("node:fs");
const path = require("node:path");
const { spawnSync } = require("node:child_process");

const TABLE_QUERIES = {
  posts: "SELECT filename,title,content,date,tags,category,created_at,updated_at FROM posts ORDER BY filename;",
  snippets: "SELECT id,title,code,language,tags,created_at,updated_at FROM snippets ORDER BY id;",
  problems: "SELECT id,title,url,platform,status,tags,date,note,analysis,created_at,updated_at FROM problems ORDER BY id;",
  talks: "SELECT id,nickname,content,mood,created_at FROM talks ORDER BY id;",
  checkins: "SELECT id,nickname,content,type,count,note,created_at FROM checkins ORDER BY id;",
  comments: "SELECT id,post_id,nickname,content,status,revision,deleted_at,created_at FROM comments ORDER BY id;",
  likes: "SELECT id,post_id,ip,actor_hash,created_at FROM likes ORDER BY id;",
  oj_daily_stats: "SELECT date,total_delta,updated_at FROM oj_daily_stats ORDER BY date;",
  oj_synced_problems: "SELECT id,title,url,platform,status,tags,date,note,analysis,updated_at,synced_at FROM oj_synced_problems ORDER BY id;",
};

function parseArgs(argv) {
  const options = { database: "", out: "", remote: false };
  for (let index = 0; index < argv.length; index += 1) {
    const arg = argv[index];
    if (arg === "--database" || arg === "--out") {
      const value = argv[++index];
      if (!value || value.startsWith("--")) throw new Error(`${arg} 需要一个值`);
      options[arg.slice(2)] = value;
    } else if (arg === "--remote") options.remote = true;
    else if (arg === "--help" || arg === "-h") {
      console.log("用法：node scripts/export-d1-content.cjs --database <name> --out <json> [--remote]");
      process.exit(0);
    } else throw new Error(`未知参数：${arg}`);
  }
  if (!options.database || !options.out) throw new Error("必须提供 --database 和 --out");
  return options;
}

function execute(database, query, remote) {
  const command = process.execPath;
  const wrangler = path.resolve(__dirname, "..", "node_modules", "wrangler", "bin", "wrangler.js");
  const args = [wrangler, "d1", "execute", database];
  if (remote) args.push("--remote");
  args.push("--command", query, "--json");
  const result = spawnSync(command, args, { encoding: "utf8", windowsHide: true, maxBuffer: 64 * 1024 * 1024 });
  if (result.status !== 0) throw new Error((result.stderr || result.stdout || result.error?.message || `D1 查询失败（退出码 ${result.status}）`).trim());
  try {
    const parsed = JSON.parse(result.stdout);
    if (!Array.isArray(parsed) || !parsed[0]?.results || parsed[0].success !== true) throw new Error("D1 查询结果格式无效");
    return parsed[0].results;
  } catch (error) {
    throw new Error(`无法解析 wrangler JSON 输出：${error.message}`);
  }
}

try {
  const options = parseArgs(process.argv.slice(2));
  const tables = {};
  for (const [table, query] of Object.entries(TABLE_QUERIES)) tables[table] = execute(options.database, query, options.remote);
  const output = path.resolve(options.out);
  fs.mkdirSync(path.dirname(output), { recursive: true });
  fs.writeFileSync(output, `${JSON.stringify({ schemaVersion: 1, database: options.database, exportedAt: new Date().toISOString(), tables }, null, 2)}\n`, "utf8");
  console.log(JSON.stringify({ ok: true, output, tables: Object.fromEntries(Object.entries(tables).map(([name, rows]) => [name, rows.length])) }, null, 2));
} catch (error) {
  console.error(`[export-d1-content] ${error.message}`);
  process.exitCode = 2;
}
