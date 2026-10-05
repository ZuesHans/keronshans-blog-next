import { NextResponse } from "next/server";
import { authenticateAdminMutation } from "@/lib/adminPassword";
import { getAllSnippets, getSnippetByFilename } from "@/lib/snippets";

function getLocalSnippetRows() {
  return getAllSnippets().map((snippet) => ({
    id: snippet.id,
    title: snippet.title,
    language: snippet.language,
    tags: JSON.stringify(snippet.tags),
    created_at: snippet.createdAt,
    updated_at: snippet.updatedAt,
    schemaVersion: snippet.schemaVersion,
    kind: snippet.kind,
    status: snippet.status,
    slug: snippet.slug,
    description: snippet.description || "",
    legacy: snippet.legacy,
  }));
}

// GET /api/snippets - list all snippets (public)
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const id = searchParams.get("id") || searchParams.get("filename");
  if (id) {
    const snippet = getSnippetByFilename(id);
    if (!snippet) return NextResponse.json({ error: "Not found" }, { status: 404 });
    return NextResponse.json({
      id: snippet.id,
      slug: snippet.slug,
      title: snippet.title,
      status: snippet.status,
      language: snippet.language,
      tags: snippet.tags,
      description: snippet.description || "",
      createdAt: snippet.createdAt,
      updatedAt: snippet.updatedAt,
      legacy: snippet.legacy,
      code: snippet.code,
    }, { headers: { "Cache-Control": "no-store" } });
  }

  return NextResponse.json(getLocalSnippetRows());
}

// POST /api/snippets - create a snippet (auth required)
export async function POST(request: Request) {
  if (!(await authenticateAdminMutation(request))) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  return NextResponse.json({ error: "Published content is read-only", code: "CONTENT_SOURCE_READONLY" }, { status: 405, headers: { Allow: "GET" } });
}

// PUT /api/snippets - update a snippet (auth required)
export async function PUT(request: Request) {
  if (!(await authenticateAdminMutation(request))) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  return NextResponse.json({ error: "Published content is read-only", code: "CONTENT_SOURCE_READONLY" }, { status: 405, headers: { Allow: "GET" } });
}

// DELETE /api/snippets?id=xxx - delete a snippet (auth required)
export async function DELETE(request: Request) {
  if (!(await authenticateAdminMutation(request))) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  return NextResponse.json({ error: "Published content is read-only", code: "CONTENT_SOURCE_READONLY" }, { status: 405, headers: { Allow: "GET" } });
}
