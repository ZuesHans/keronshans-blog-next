import { NextResponse } from "next/server";
import { getCloudflareContext } from "@opennextjs/cloudflare";
import { checkRateLimit } from "@/lib/rateLimit";
import { getClientActorHash } from "@/lib/publicIdentity";
import { MUTATION_ID_PATTERN, requestHash, verifyChallenge } from "@/lib/mutation";
import { readJsonBody } from "@/lib/request";
import { getAllPosts } from "@/lib/posts";

const POST_ID_PATTERN = /^[a-z0-9][a-z0-9_-]{0,119}$/i;

function isValidPostId(value: unknown): value is string {
  return typeof value === "string" && POST_ID_PATTERN.test(value);
}

function rateLimited(retryAfter: number) {
  return NextResponse.json(
    { error: "Too many requests" },
    { status: 429, headers: { "Retry-After": String(retryAfter) } },
  );
}

// GET /api/likes?postId=xxx - Get like count for a post
export async function GET(request: Request) {
  try {
    const { env } = await getCloudflareContext({ async: true });
    const { searchParams } = new URL(request.url);
    const postId = searchParams.get("postId");
    if (!isValidPostId(postId)) {
      return NextResponse.json({ error: "Invalid postId" }, { status: 400 });
    }

    if (!(await getAllPosts()).some((post) => post.id === postId)) return NextResponse.json({ error: "Post not found" }, { status: 404 });
    const row = await env.DB
      .prepare("SELECT COUNT(*) as count FROM likes WHERE post_id = ?")
      .bind(postId)
      .first<{ count: number }>();

    return NextResponse.json({ likes: row?.count || 0 }, { headers: { "Cache-Control": "no-store" } });
  } catch {
    return NextResponse.json({ error: "Interaction service unavailable" }, { status: 503, headers: { "Cache-Control": "no-store" } });
  }
}

// POST /api/likes - Like a post
export async function POST(request: Request) {
  try {
    const { env } = await getCloudflareContext({ async: true });
    const bodyResult = await readJsonBody(request, 4096);
    if (!bodyResult.ok) return NextResponse.json({ error: bodyResult.error }, { status: bodyResult.status });
    const body = bodyResult.value;
    if (!body || typeof body !== "object" || Array.isArray(body) || Object.keys(body).some((key) => !["postId", "challengeToken", "clientMutationId"].includes(key))) return NextResponse.json({ error: "Invalid fields" }, { status: 422 });
    const { postId, challengeToken, clientMutationId } = body && typeof body === "object" && !Array.isArray(body)
      ? body as { postId?: unknown; challengeToken?: unknown; clientMutationId?: unknown }
      : {};
    if (!isValidPostId(postId)) {
      return NextResponse.json({ error: "Invalid postId" }, { status: 400 });
    }
    if (typeof clientMutationId !== "string" || !MUTATION_ID_PATTERN.test(clientMutationId)) return NextResponse.json({ error: "Invalid clientMutationId" }, { status: 422 });
    if (!(await verifyChallenge(challengeToken, request))) return NextResponse.json({ error: "Challenge required" }, { status: 403 });

    const actorHash = await getClientActorHash(request);
    if (!actorHash) return NextResponse.json({ error: "Service is not configured" }, { status: 503 });
    const mutationHash = await requestHash({ postId, actorHash });
    const existingMutation = await env.DB.prepare("SELECT request_hash, response_json FROM interaction_mutations WHERE site_id = 'keronshans' AND kind = 'like' AND mutation_id = ?").bind(clientMutationId).first<{ request_hash: string; response_json: string }>();
    if (existingMutation) {
      if (existingMutation.request_hash !== mutationHash) return NextResponse.json({ error: "clientMutationId payload conflict" }, { status: 409 });
      return NextResponse.json(JSON.parse(existingMutation.response_json));
    }
    if (!(await getAllPosts()).some((post) => post.id === postId)) return NextResponse.json({ error: "Post not found" }, { status: 404 });
    const limit = await checkRateLimit(request, "like:create", 30, 60 * 1000);
    if (!limit.available) return NextResponse.json({ error: "Interaction service unavailable" }, { status: 503 });
    if (!limit.allowed) return rateLimited(limit.retryAfter);
    const response = { success: true };
    await env.DB.batch([
      env.DB.prepare("INSERT OR IGNORE INTO interaction_mutations (site_id, kind, mutation_id, request_hash, resource_id, response_json) VALUES ('keronshans', 'like', ?, ?, ?, ?)").bind(clientMutationId, mutationHash, postId, JSON.stringify(response)),
      env.DB.prepare("INSERT OR IGNORE INTO likes (post_id, ip, actor_hash) SELECT ?, ?, ? WHERE changes() = 1").bind(postId, actorHash, actorHash),
    ]);
    const mutation = await env.DB.prepare("SELECT request_hash FROM interaction_mutations WHERE site_id = 'keronshans' AND kind = 'like' AND mutation_id = ?").bind(clientMutationId).first<{ request_hash: string }>();
    if (!mutation || mutation.request_hash !== mutationHash) return NextResponse.json({ error: "clientMutationId payload conflict" }, { status: 409 });
    return NextResponse.json(response);
  } catch (error) {
    console.error("POST /api/likes error:", error);
    return NextResponse.json({ error: "Interaction service unavailable" }, { status: 503 });
  }
}
