import { NextResponse } from "next/server";
import {
  getAllSnippets,
  getSnippetByFilename,
  createSnippet,
  updateSnippet,
  deleteSnippet,
} from "@/lib/snippets";

const ADMIN_PASSWORD = "zues1";

function authenticate(request: Request): boolean {
  return request.headers.get("x-admin-password") === ADMIN_PASSWORD;
}

// GET /api/snippets - List all snippets (public)
// GET /api/snippets?filename=xxx - Get single snippet (auth required)
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const filename = searchParams.get("filename");

  if (filename) {
    if (!authenticate(request)) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const snippet = getSnippetByFilename(filename);
    if (!snippet) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }
    return NextResponse.json(snippet);
  }

  return NextResponse.json(getAllSnippets());
}

// POST /api/snippets - Create new snippet (auth required)
export async function POST(request: Request) {
  if (!authenticate(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { title, language, code, tags, description } = await request.json();
    if (!title?.trim() || !code?.trim()) {
      return NextResponse.json(
        { error: "title and code are required" },
        { status: 400 }
      );
    }
    const filename = createSnippet({
      title: title.trim(),
      language: language || "C++",
      code,
      tags: tags || [],
      description: description || "",
    });
    return NextResponse.json({ success: true, filename });
  } catch (error) {
    return NextResponse.json({ error: String(error) }, { status: 500 });
  }
}

// PUT /api/snippets - Update snippet (auth required)
export async function PUT(request: Request) {
  if (!authenticate(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { filename, title, language, code, tags, description } =
      await request.json();
    if (!filename) {
      return NextResponse.json(
        { error: "filename is required" },
        { status: 400 }
      );
    }
    const result = updateSnippet(filename, {
      title: title.trim(),
      language: language || "C++",
      code,
      tags: tags || [],
      description: description || "",
    });
    if (!result) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }
    return NextResponse.json({ success: true, filename: result });
  } catch (error) {
    return NextResponse.json({ error: String(error) }, { status: 500 });
  }
}

// DELETE /api/snippets?filename=xxx (auth required)
export async function DELETE(request: Request) {
  if (!authenticate(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { searchParams } = new URL(request.url);
    const filename = searchParams.get("filename");
    if (!filename) {
      return NextResponse.json(
        { error: "filename is required" },
        { status: 400 }
      );
    }
    const ok = deleteSnippet(filename);
    if (!ok) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }
    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: String(error) }, { status: 500 });
  }
}
