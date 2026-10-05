import { NextResponse } from "next/server";
import { getCloudflareContext } from "@opennextjs/cloudflare";
import { authenticateAdmin, authenticateAdminMutation } from "@/lib/adminPassword";
import { checkRateLimit } from "@/lib/rateLimit";
import { getAllPosts } from "@/lib/posts";
import { MUTATION_ID_PATTERN, requestHash, verifyChallenge } from "@/lib/mutation";
import { readJsonBody } from "@/lib/request";

const POST_ID_PATTERN = /^[a-z0-9][a-z0-9_-]{0,119}$/i;
const MAX_COMMENT_LENGTH = 500;
const MAX_NICKNAME_LENGTH = 40;
const MAX_REQUEST_BYTES = 8192;

function isValidPostId(value: unknown): value is string {
  return typeof value === "string" && POST_ID_PATTERN.test(value);
}

function cleanText(value: unknown, maxLength: number): string {
  return typeof value === "string" ? value.trim().slice(0, maxLength) : "";
}

function rateLimited(retryAfter: number) {
  return NextResponse.json(
    { error: "Please wait before posting again" },
    { status: 429, headers: { "Retry-After": String(retryAfter) } },
  );
}

// GET /api/comments?postId=xxx - Get comments for a post
export async function GET(request: Request) {
  try {
    const { env } = await getCloudflareContext({ async: true });
    const { searchParams } = new URL(request.url);
    const postId = searchParams.get("postId");
    const moderation = searchParams.get("moderation") === "pending";
    if (moderation) {
      if (!(await authenticateAdmin(request))) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
      const { results } = await env.DB.prepare("SELECT id, post_id AS postId, nickname, content, revision, created_at AS createdAt FROM comments WHERE status = 'pending' AND deleted_at IS NULL ORDER BY created_at LIMIT 100").all();
      return NextResponse.json(results || [], { headers: { "Cache-Control": "no-store" } });
    }
    if (!isValidPostId(postId)) {
      return NextResponse.json({ error: "Invalid postId" }, { status: 400 });
    }
    if (!(await getAllPosts()).some((post) => post.id === postId)) return NextResponse.json({ error: "Post not found" }, { status: 404 });

    const requestedLimit = Number(searchParams.get("limit") || 20);
    const limit = Number.isFinite(requestedLimit) ? Math.min(50, Math.max(1, Math.floor(requestedLimit))) : 20;
    const { results } = await env.DB
      .prepare("SELECT id, nickname, content, created_at FROM comments WHERE post_id = ? AND status = 'approved' AND deleted_at IS NULL ORDER BY created_at DESC LIMIT ?")
      .bind(postId, limit)
      .all();

    return NextResponse.json((results || []).map((row: Record<string, unknown>) => ({ id: row.id, nickname: row.nickname, content: row.content, createdAt: row.created_at })), { headers: { "Cache-Control": "no-store" } });
  } catch {
    return NextResponse.json({ error: "Interaction service unavailable" }, { status: 503, headers: { "Cache-Control": "no-store" } });
  }
}

// POST /api/comments - Add a comment
export async function POST(request: Request) {
  try {
    const { env } = await getCloudflareContext({ async: true });
    const bodyResult = await readJsonBody(request, MAX_REQUEST_BYTES);
    if (!bodyResult.ok) return NextResponse.json({ error: bodyResult.error }, { status: bodyResult.status });
    const body = bodyResult.value;
    if (!body || typeof body !== "object" || Object.keys(body).some((key) => !["postId", "nickname", "content", "challengeToken", "clientMutationId"].includes(key))) return NextResponse.json({ error: "Invalid fields" }, { status: 422 });
    const { postId, nickname, content, challengeToken, clientMutationId } = body as { postId?: unknown; nickname?: unknown; content?: unknown; challengeToken?: unknown; clientMutationId?: unknown };
    if (!isValidPostId(postId)) {
      return NextResponse.json({ error: "Invalid postId" }, { status: 400 });
    }
    if (!(await getAllPosts()).some((post) => post.id === postId)) return NextResponse.json({ error: "Post not found" }, { status: 404 });

    if (typeof content !== "string" || content.trim().length > MAX_COMMENT_LENGTH || /<[^>]+>|(?:javascript|data):/i.test(content)) {
      return NextResponse.json({ error: "Invalid content" }, { status: 422 });
    }
    if (typeof nickname !== "undefined" && (typeof nickname !== "string" || nickname.trim().length > MAX_NICKNAME_LENGTH || /<[^>]+>/i.test(nickname))) return NextResponse.json({ error: "Invalid nickname" }, { status: 422 });
    const cleanedContent = cleanText(content, MAX_COMMENT_LENGTH);
    if (!cleanedContent) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }
    if (typeof clientMutationId !== "string" || !MUTATION_ID_PATTERN.test(clientMutationId)) return NextResponse.json({ error: "Invalid clientMutationId" }, { status: 422 });
    if (!(await verifyChallenge(challengeToken, request))) return NextResponse.json({ error: "Challenge required" }, { status: 403 });

    const mutationHash = await requestHash({ postId, nickname: cleanText(nickname, MAX_NICKNAME_LENGTH) || "anonymous", content: cleanedContent });
    const existingMutation = await env.DB.prepare("SELECT request_hash, response_json FROM interaction_mutations WHERE site_id = 'keronshans' AND kind = 'comment' AND mutation_id = ?").bind(clientMutationId).first<{ request_hash: string; response_json: string }>();
    if (existingMutation) {
      if (existingMutation.request_hash !== mutationHash) return NextResponse.json({ error: "clientMutationId payload conflict" }, { status: 409 });
      return NextResponse.json(JSON.parse(existingMutation.response_json), { status: 202 });
    }

    const ipLimit = await checkRateLimit(request, "comment:create", 8, 60 * 1000);
    if (!ipLimit.available) return NextResponse.json({ error: "Interaction service unavailable" }, { status: 503 });
    if (!ipLimit.allowed) return rateLimited(ipLimit.retryAfter);
    const postLimit = await checkRateLimit(request, `comment:post:${postId}`, 20, 5 * 60 * 1000);
    if (!postLimit.available) return NextResponse.json({ error: "Interaction service unavailable" }, { status: 503 });
    if (!postLimit.allowed) return rateLimited(postLimit.retryAfter);

    const recent = await env.DB
      .prepare("SELECT id FROM comments WHERE post_id = ? AND content = ? AND created_at > datetime('now', '+8 hours', '-30 seconds')")
      .bind(postId, cleanedContent)
      .first();
    if (recent) {
      return NextResponse.json({ error: "Please wait before posting again" }, { status: 429 });
    }

    // D1 batch is transactional: reserve the mutation before creating a comment.
    await env.DB.batch([
      env.DB.prepare("INSERT OR IGNORE INTO interaction_mutations (site_id, kind, mutation_id, request_hash, resource_id, response_json) VALUES ('keronshans', 'comment', ?, ?, '', '')").bind(clientMutationId, mutationHash),
      env.DB.prepare("INSERT INTO comments (post_id, nickname, content, status, revision) SELECT ?, ?, ?, 'pending', 1 WHERE changes() = 1").bind(postId, cleanText(nickname, MAX_NICKNAME_LENGTH) || "anonymous", cleanedContent),
      env.DB.prepare("UPDATE interaction_mutations SET resource_id = CAST(last_insert_rowid() AS TEXT), response_json = json_object('commentId', last_insert_rowid(), 'status', 'pending') WHERE site_id = 'keronshans' AND kind = 'comment' AND mutation_id = ? AND response_json = '' AND request_hash = ?").bind(clientMutationId, mutationHash),
    ]);
    const mutation = await env.DB.prepare("SELECT request_hash, response_json FROM interaction_mutations WHERE site_id = 'keronshans' AND kind = 'comment' AND mutation_id = ?").bind(clientMutationId).first<{ request_hash: string; response_json: string }>();
    if (!mutation || mutation.request_hash !== mutationHash) return NextResponse.json({ error: "clientMutationId payload conflict" }, { status: 409 });
    const response = JSON.parse(mutation.response_json);
    return NextResponse.json(response, { status: 202 });
  } catch (error) {
    console.error("POST /api/comments error:", error);
    return NextResponse.json({ error: "Interaction service unavailable" }, { status: 503 });
  }
}

export async function PUT(request: Request) {
  if (!(await authenticateAdminMutation(request))) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const body = await readJsonBody(request, 4096);
  if (!body.ok) return NextResponse.json({ error: body.error }, { status: body.status });
  const value = body.value as { id?: unknown; revision?: unknown; status?: unknown } | null;
  if (!value || !Number.isInteger(value.id) || Number(value.id) < 1 || !Number.isInteger(value.revision) || !["approved", "rejected"].includes(String(value.status))) return NextResponse.json({ error: "Invalid moderation request" }, { status: 422 });
  try {
    const { env } = await getCloudflareContext({ async: true });
    const result = await env.DB.prepare("UPDATE comments SET status = ?, revision = revision + 1 WHERE id = ? AND revision = ? AND deleted_at IS NULL").bind(value.status, value.id, value.revision).run();
    return result.meta.changes ? NextResponse.json({ success: true }) : NextResponse.json({ error: "Comment changed; reload before moderating" }, { status: 409 });
  } catch { return NextResponse.json({ error: "Interaction service unavailable" }, { status: 503 }); }
}

// DELETE /api/comments?id=xxx - Delete a comment (admin only)
export async function DELETE(request: Request) {
  try {
    const { env } = await getCloudflareContext({ async: true });
    if (!(await authenticateAdminMutation(request))) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");
    const numericId = Number(id);
    if (!Number.isInteger(numericId) || numericId < 1) {
      return NextResponse.json({ error: "Invalid id" }, { status: 400 });
    }

    await env.DB.prepare("UPDATE comments SET status = 'rejected', deleted_at = datetime('now', '+8 hours'), revision = revision + 1 WHERE id = ?").bind(numericId).run();
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("DELETE /api/comments error:", error);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
