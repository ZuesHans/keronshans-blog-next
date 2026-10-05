const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const os = require("node:os");
const path = require("node:path");
const { createRequire } = require("node:module");
const { DatabaseSync } = require("node:sqlite");
const ts = require("typescript");
const { validatePublishedRoot, sha256, jcs } = require("./content-contract.cjs");
const { verifyContent } = require("./content-verify.cjs");
const appRoot = path.resolve(__dirname, "..");

function loader(mocks = {}) {
  const cache = new Map();
  function load(filename) {
    const absolute = path.resolve(appRoot, filename);
    if (cache.has(absolute)) return cache.get(absolute).exports;
    const module = { exports: {} }; cache.set(absolute, module);
    const requireFile = createRequire(absolute);
    const requireTs = (name) => {
      if (name in mocks) return mocks[name];
      const target = name.startsWith("@/") ? path.join(appRoot, "src", name.slice(2)) : name.startsWith(".") ? path.resolve(path.dirname(absolute), name) : null;
      return target && fs.existsSync(`${target}.ts`) ? load(`${target}.ts`) : requireFile(name);
    };
    const compiled = ts.transpileModule(fs.readFileSync(absolute, "utf8"), { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022, esModuleInterop: true } }).outputText;
    new Function("require", "module", "exports", compiled)(requireTs, module, module.exports);
    return module.exports;
  }
  return load;
}

function fixture(t) {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), "blog-runtime-"));
  t.after(() => fs.rmSync(root, { recursive: true, force: true }));
  for (const name of ["posts", "snippets", "assets"]) fs.mkdirSync(path.join(root, name));
  const post = "---\nschemaVersion: 1\nkind: post\nid: stable-id\nslug: new-slug\nstatus: ready\ntitle: Original\ndate: '2026-10-06'\nupdatedAt: '2026-10-06T00:00:00Z'\ncategory: algorithm\ntags: []\ndescription: ''\npinned: false\naliases: []\n---\nBody\n";
  fs.writeFileSync(path.join(root, "posts/article.md"), post);
  fs.writeFileSync(path.join(root, "site.json"), JSON.stringify({ schemaVersion: 1, siteId: "keronshans", title: "Test", description: "", author: { name: "Test" } }));
  return { root, post };
}

test("development reads edited source while production reads the immutable snapshot", async (t) => {
  const { root, post } = fixture(t);
  const previous = process.env.NODE_ENV; t.after(() => { process.env.NODE_ENV = previous; });
  const generated = { generated: true, releaseId: "release", snapshotDigest: "digest", posts: [{ path: "article.md", content: post }], snippets: [], registry: null, problems: [] };
  const read = loader({ "@/generated/contentSnapshot": { generatedContentSnapshot: generated }, "./contentRoot": { CONTENT_ROOT: root, POSTS_DIR: path.join(root, "posts") } });
  const { getAllPosts } = read("src/lib/posts.ts");
  process.env.NODE_ENV = "development";
  fs.writeFileSync(path.join(root, "posts/article.md"), post.replace("title: Original", "title: Edited"));
  assert.equal((await getAllPosts())[0].title, "Edited");
  assert.equal((await getAllPosts())[0].category, "算法学习");
  process.env.NODE_ENV = "production";
  assert.equal((await getAllPosts())[0].title, "Original");
});

test("historical unicode aliases redirect and withdrawal tombstones return Gone", (t) => {
  const { root } = fixture(t);
  const previous = process.env.NODE_ENV; process.env.NODE_ENV = "development"; t.after(() => { process.env.NODE_ENV = previous; });
  fs.writeFileSync(path.join(root, "content-registry.json"), JSON.stringify({ schemaVersion: 1, siteId: "keronshans", entries: [
    { id: "one", kind: "snippet", canonicalPath: "/templates/one", aliases: ["/snippets/并查集"], state: "active" },
    { id: "two", kind: "post", canonicalPath: "/posts/two", aliases: ["/posts/old"], state: "withdrawn" },
  ] }));
  const read = loader({ "@/generated/contentSnapshot": { generatedContentSnapshot: { generated: false } }, "./contentRoot": { CONTENT_ROOT: root } });
  const resolve = read("src/lib/contentRegistry.ts").resolveContentRoute;
  assert.equal(resolve(`/snippets/${encodeURIComponent("并查集")}`).location, "/templates/one");
  assert.equal(resolve("/posts/old").status, 410);
});

test("verifier binds problems to the manifest and rejects unregistered files", (t) => {
  const { root } = fixture(t);
  fs.writeFileSync(path.join(root, "problems.json"), JSON.stringify([{ id: "problem", title: "Problem", url: "https://example.com" }]));
  const result = validatePublishedRoot(root);
  fs.writeFileSync(path.join(root, "content-registry.json"), `${JSON.stringify(result.registry, null, 2)}\n`);
  fs.writeFileSync(path.join(root, "content-manifest.json"), JSON.stringify(result.manifest));
  assert.equal(verifyContent(root).ok, true);
  fs.writeFileSync(path.join(root, "problems.json"), "[]");
  assert.throws(() => verifyContent(root), /hash\/size/);
});

test("empty asset directories need not be tracked in a Git content checkout", (t) => {
  const { root } = fixture(t);
  fs.rmdirSync(path.join(root, "assets"));
  assert.equal(validatePublishedRoot(root).assets.length, 0);
});

test("JSON body limits stop chunked requests before decoding an oversized body", async () => {
  const { readJsonBody } = loader()("src/lib/request.ts");
  const request = new Request("https://example.com", { method: "POST", body: new ReadableStream({ start(controller) { controller.enqueue(new Uint8Array(100)); controller.close(); } }), duplex: "half" });
  assert.equal((await readJsonBody(request, 20)).status, 413);
});

test("production authentication rejects old sessions and password bypasses", async (t) => {
  const original = process.env.NODE_ENV; process.env.NODE_ENV = "production"; t.after(() => { process.env.NODE_ENV = original; });
  const auth = loader({ "./access": { authenticateAccess: async () => false } })("src/lib/adminPassword.ts");
  assert.equal(await auth.verifyAdminPassword("anything"), false);
  assert.equal(await auth.authenticateAdmin(new Request("https://example.com", { headers: { "x-admin-password": "anything", cookie: "keronshans_admin_session=legacy" } })), false);
  const access = loader({ jose: { createRemoteJWKSet() { throw new Error("Must fail before JWKS"); } } })("src/lib/access.ts");
  assert.equal(await access.authenticateAccess(new Request("https://example.com")), false);
  const mutation = loader()("src/lib/mutation.ts");
  const secret = process.env.TURNSTILE_SECRET_KEY; delete process.env.TURNSTILE_SECRET_KEY;
  t.after(() => { if (secret === undefined) delete process.env.TURNSTILE_SECRET_KEY; else process.env.TURNSTILE_SECRET_KEY = secret; });
  assert.equal(await mutation.verifyChallenge("fake-token", new Request("https://example.com")), false);
});

test("Access JWT validation checks signatures, issuer, audience, expiry and subject", async (t) => {
  const jose = await import("jose");
  const keys = await jose.generateKeyPair("RS256");
  const publicKey = await jose.exportJWK(keys.publicKey);
  const env = { PRODUCTION_ADMIN_ENABLED: "true", ACCESS_TEAM_DOMAIN: "fixture.cloudflareaccess.com", ACCESS_AUD: "fixture-audience", ACCESS_ADMIN_SUBJECTS: "admin-subject" };
  const before = Object.fromEntries(Object.keys(env).map((key) => [key, process.env[key]]));
  Object.assign(process.env, env);
  t.after(() => { for (const [key, value] of Object.entries(before)) { if (value === undefined) delete process.env[key]; else process.env[key] = value; } });
  const access = loader({ jose: { ...jose, createRemoteJWKSet: () => jose.createLocalJWKSet({ keys: [publicKey] }) } })("src/lib/access.ts");
  const token = async (changes = {}, signingKey = keys.privateKey) => new jose.SignJWT({ sub: "admin-subject", aud: "fixture-audience", iss: "https://fixture.cloudflareaccess.com", iat: Math.floor(Date.now() / 1000), exp: Math.floor(Date.now() / 1000) + 300, ...changes }).setProtectedHeader({ alg: "RS256" }).sign(signingKey);
  const accepts = async (jwt) => access.authenticateAccess(new Request("https://example.com", { headers: { "cf-access-jwt-assertion": jwt } }));
  assert.equal(await accepts(await token()), true);
  for (const claim of [{ sub: "outsider" }, { aud: "wrong" }, { iss: "https://other.cloudflareaccess.com" }, { exp: 1 }]) assert.equal(await accepts(await token(claim)), false);
  const forged = await jose.generateKeyPair("RS256");
  assert.equal(await accepts(await token({}, forged.privateKey)), false);
});

test("binary EXIF metadata and reference-style missing images are rejected", (t) => {
  const { root, post } = fixture(t);
  fs.writeFileSync(path.join(root, "assets/gps.jpg"), Buffer.from([255, 216, 255, 225, 0, 16, 69, 120, 105, 102, 0, 0, 73, 73, 42, 0]));
  fs.writeFileSync(path.join(root, "posts/article.md"), `${post}\n![gps][image]\n\n[image]: /assets/gps.jpg\n`);
  assert.throws(() => validatePublishedRoot(root), /位置元数据/);
  fs.writeFileSync(path.join(root, "posts/article.md"), `${post}\n![missing][image]\n\n[image]: /assets/missing.png\n`);
  assert.throws(() => validatePublishedRoot(root), /图片引用不存在/);
});

function d1(t) {
  const database = new DatabaseSync(":memory:"); t.after(() => database.close());
  database.exec(fs.readFileSync(path.join(appRoot, "schema.sql"), "utf8"));
  function prepare(sql) {
    let params = [];
    return { bind(...args) { params = args; return this; },
      async first() { return database.prepare(sql).get(...params) || null; },
      async all() { return { results: database.prepare(sql).all(...params) }; },
      async run() { const result = database.prepare(sql).run(...params); return { meta: { changes: Number(result.changes), last_row_id: Number(result.lastInsertRowid) } }; } };
  }
  return { database, DB: { prepare, async batch(statements) {
    database.exec("BEGIN");
    try { const results = []; for (const statement of statements) results.push(await statement.run()); database.exec("COMMIT"); return results; }
    catch (error) { database.exec("ROLLBACK"); throw error; }
  } } };
}

test("rate limit counts are shared across independent runtime instances and fail closed", async (t) => {
  const { DB } = d1(t);
  const mocks = { "@opennextjs/cloudflare": { getCloudflareContext: async () => ({ env: { DB } }) } };
  const first = loader(mocks)("src/lib/rateLimit.ts");
  const second = loader(mocks)("src/lib/rateLimit.ts");
  const request = new Request("http://localhost/action");
  assert.equal((await first.checkRateLimit(request, "test", 2, 60000)).allowed, true);
  assert.equal((await second.checkRateLimit(request, "test", 2, 60000)).allowed, true);
  assert.equal((await first.checkRateLimit(request, "test", 2, 60000)).allowed, false);
  const broken = loader({ "@opennextjs/cloudflare": { getCloudflareContext: async () => { throw new Error("Unavailable"); } } })("src/lib/rateLimit.ts");
  assert.equal((await broken.checkRateLimit(request, "test", 2, 60000)).available, false);
});

test("comment retries are transactional, conflict on changed payload, and support moderation", async (t) => {
  const { DB, database } = d1(t);
  const mocks = {
    "@opennextjs/cloudflare": { getCloudflareContext: async () => ({ env: { DB } }) },
    "@/lib/posts": { getAllPosts: async () => [{ id: "stable-id" }] },
    "@/lib/adminPassword": { authenticateAdmin: async () => true, authenticateAdminMutation: async () => true },
    "@/lib/mutation": { MUTATION_ID_PATTERN: /^[a-z0-9-]+$/, requestHash: async (value) => sha256(jcs(value)), verifyChallenge: async () => true },
    "@/lib/rateLimit": { checkRateLimit: async () => ({ available: true, allowed: true }) },
  };
  const route = loader(mocks)("src/app/api/comments/route.ts");
  const post = (content, id = "mutation-1") => route.POST(new Request("https://example.com/api/comments", { method: "POST", body: JSON.stringify({ postId: "stable-id", content, clientMutationId: id }) }));
  const initial = await post("Hello"); assert.equal(initial.status, 202);
  assert.deepEqual(await (await post("Hello")).json(), await initial.json());
  assert.equal((await post("Changed")).status, 409);
  assert.equal(database.prepare("SELECT count(*) AS count FROM comments").get().count, 1);
  assert.equal((await route.GET(new Request("https://example.com/api/comments?moderation=pending"))).status, 200);
  const id = database.prepare("SELECT id FROM comments").get().id;
  assert.equal((await route.PUT(new Request("https://example.com/api/comments", { method: "PUT", body: JSON.stringify({ id, revision: 1, status: "approved" }) }))).status, 200);
  assert.equal((await route.PUT(new Request("https://example.com/api/comments", { method: "PUT", body: JSON.stringify({ id, revision: 1, status: "rejected" }) }))).status, 409);
});

test("like retries do not inflate counts and reject mutation payload conflicts", async (t) => {
  const { DB, database } = d1(t);
  const route = loader({
    "@opennextjs/cloudflare": { getCloudflareContext: async () => ({ env: { DB } }) },
    "@/lib/posts": { getAllPosts: async () => [{ id: "stable-id" }, { id: "other-id" }] },
    "@/lib/publicIdentity": { getClientActorHash: async () => "actor-hash" },
    "@/lib/mutation": { MUTATION_ID_PATTERN: /^[a-z0-9-]+$/, requestHash: async (value) => sha256(jcs(value)), verifyChallenge: async () => true },
    "@/lib/rateLimit": { checkRateLimit: async () => ({ available: true, allowed: true }) },
  })("src/app/api/likes/route.ts");
  const post = (id, postId = "stable-id") => route.POST(new Request("https://example.com/api/likes", { method: "POST", body: JSON.stringify({ postId, clientMutationId: id }) }));
  assert.equal((await post("retry")).status, 200);
  assert.equal((await post("retry")).status, 200);
  assert.equal((await post("another")).status, 200);
  assert.equal((await post("retry", "other-id")).status, 409);
  assert.equal(database.prepare("SELECT count(*) AS count FROM likes").get().count, 1);
  assert.deepEqual(await (await route.GET(new Request("https://example.com/api/likes?postId=stable-id"))).json(), { likes: 1 });
});
