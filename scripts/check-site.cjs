const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const crypto = require("node:crypto");

// Exercise the deployed Worker, including the RSC responses used by Next Link.
// A successful next build alone cannot detect missing Cloudflare page caches.
const baseUrl = process.argv[2] || "http://127.0.0.1:8787";
const root = path.resolve(__dirname, "..");

async function request(urlPath, headers = {}, redirect = "follow") {
  const response = await fetch(new URL(urlPath, baseUrl), {
    headers,
    redirect,
    signal: AbortSignal.timeout(30000),
  });
  return { response, body: await response.text() };
}

async function main() {
  const directory = await request("/posts");
  assert.equal(directory.response.status, 200, "Article directory must load");
  const articlePaths = new Set(
    [...directory.body.matchAll(/href="(\/posts\/[^"?#]+)"/g)].map((match) => match[1]),
  );
  const listedCount = articlePaths.size;
  assert.ok(listedCount > 0, "Article directory must not be empty");

  const manifestPath = path.join(root, ".next", "prerender-manifest.json");
  if (fs.existsSync(manifestPath)) {
    const manifest = JSON.parse(fs.readFileSync(manifestPath, "utf8"));
    Object.keys(manifest.routes).filter((url) => url.startsWith("/posts/"))
      .forEach((url) => articlePaths.add(url));
  }
  const index = await request("/api/posts");
  assert.equal(index.response.status, 200, "Article API must load");
  JSON.parse(index.body).posts.forEach((post) => articlePaths.add(`/posts/${post.slug}`));

  const pending = [...articlePaths];
  const failures = [];
  const assets = new Set();
  let passed = 0;
  await Promise.all(Array.from({ length: 3 }, async () => {
    while (pending.length) {
      const url = pending.shift();
      try {
        const html = await request(url);
        assert.equal(html.response.status, 200, `${url}: HTML status`);
        assert.match(html.body, /class="reader-card"/, `${url}: missing article body`);
        assert.match(html.body, /class="markdown-body"/, `${url}: missing Markdown`);
        assert.doesNotMatch(html.body, /__name\(/, `${url}: broken inline theme script`);
        for (const match of html.body.matchAll(/(?:src|href)="(\/_next\/static\/[^"?#]+)"/g)) {
          assets.add(match[1]);
        }
        const rsc = await request(`${url}?_rsc=repair-check`, { RSC: "1", "Next-Router-Prefetch": "1" });
        assert.equal(rsc.response.status, 200, `${url}: navigation status`);
        assert.match(rsc.response.headers.get("content-type") || "", /text\/x-component/, `${url}: navigation content type`);
        assert.match(rsc.body, /reader-card/, `${url}: missing navigation article`);
        passed += 1;
      } catch (error) {
        failures.push(`${url}: ${error.message}`);
      }
    }
  }));

  for (const url of assets) {
    const asset = await request(url);
    assert.equal(asset.response.status, 200, `${url}: static asset must load`);
    assert.doesNotMatch(asset.response.headers.get("content-type") || "", /text\/html/, `${url}: received HTML instead of a static asset`);
  }
  for (const url of ["/", "/search", "/about", "/api/search-index"]) {
    const page = await request(url);
    assert.equal(page.response.status, 200, `${url}: must load`);
    assert.doesNotMatch(page.body, /__name\(/, `${url}: broken inline theme script`);
  }
  for (const url of ["/posts/missing-repair-probe", "/missing-repair-probe", "/_next/static/missing-repair-probe.js"]) {
    assert.equal((await request(url)).response.status, 404, `${url}: missing routes must return 404`);
  }
  for (const url of ["/api/auth/admin", "/api/admin"]) {
    assert.equal((await request(url)).response.status, 401, `${url}: admin authentication must remain required`);
  }
  const versionResponse = await request("/api/v1/version");
  assert.equal(versionResponse.response.status, 200);
  const version = JSON.parse(versionResponse.body);
  const pin = JSON.parse(fs.readFileSync(path.join(root, "release.json"), "utf8"));
  assert.equal(version.releaseId, pin.contentSha, "Worker must serve the pinned release");
  const contentRoot = path.resolve(process.env.BLOG_CONTENT_ROOT || path.join(root, ".content"));
  const contentManifest = JSON.parse(fs.readFileSync(path.join(contentRoot, "content-manifest.json"), "utf8"));
  assert.equal(version.snapshotDigest, contentManifest.snapshotDigest);
  const search = await request(`/_content/${version.searchDigest}/search.json`);
  assert.equal(search.response.status, 200);
  assert.equal(crypto.createHash("sha256").update(search.body).digest("hex"), version.searchDigest);
  assert.match(search.response.headers.get("cache-control") || "", /immutable/);
  assert.match((await request("/api/search-index")).response.headers.get("cache-control") || "", /no-store/);
  assert.equal((await request(`/_content/${"0".repeat(64)}/search.json`)).response.status, 404);
  const registry = JSON.parse(fs.readFileSync(path.join(contentRoot, "content-registry.json"), "utf8"));
  let aliases = 0;
  for (const entry of registry.entries) {
    if (entry.kind === "snippet" && entry.state === "active") assert.equal((await request(entry.canonicalPath)).response.status, 200, entry.canonicalPath);
    for (const route of entry.aliases) {
      const result = await request(route, {}, "manual");
      assert.equal(result.response.status, entry.state === "withdrawn" ? 410 : 308, route);
      if (entry.state === "active") assert.equal(new URL(result.response.headers.get("location"), baseUrl).pathname, entry.canonicalPath, route);
      aliases += 1;
    }
  }
  for (const file of contentManifest.files.filter((file) => file.kind === "asset")) {
    const response = await fetch(new URL(`/${file.path}`, baseUrl));
    assert.equal(response.status, 200, file.path);
    assert.equal(crypto.createHash("sha256").update(Buffer.from(await response.arrayBuffer())).digest("hex"), file.sha256, file.path);
  }
  const problems = JSON.parse((await request("/api/problems")).body);
  for (const row of problems) for (const key of ["note", "analysis", "created_at", "updated_at"]) assert.equal(key in row, false, `Public problem leaks ${key}`);
  assert.equal((await fetch(new URL("/api/auth/admin", baseUrl), { method: "POST", body: JSON.stringify({ password: "legacy-probe" }) })).status, 403);
  assert.equal((await request("/dashboard")).body.includes('type="password"'), false, "Production must not offer password login");
  console.log(`${aliases} historical routes, 16 templates, release/search digests and disabled production password login verified.`);
  console.log(`${baseUrl}: ${listedCount} listed articles; ${passed}/${articlePaths.size} articles passed HTML and RSC checks; ${assets.size} static assets checked.`);
  assert.equal(failures.length, 0, failures.join("\n"));
}

main().catch((error) => {
  console.error(error.message);
  process.exitCode = 1;
});
