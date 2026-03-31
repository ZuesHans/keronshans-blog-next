import { NextResponse } from "next/server";
import fs from "fs";
import path from "path";
import matter from "gray-matter";

const POSTS_DIR = path.join(process.cwd(), "content", "posts");
const ADMIN_PASSWORD = "zues1";

function authenticate(request: Request): boolean {
  return request.headers.get("x-admin-password") === ADMIN_PASSWORD;
}

export async function GET(request: Request, { params }: { params: { filename: string } }) {
  if (!authenticate(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const filename = decodeURIComponent(params.filename);
  const filePath = path.join(POSTS_DIR, filename);

  if (!fs.existsSync(filePath)) {
    return NextResponse.json({ error: "File not found" }, { status: 404 });
  }

  const fileContent = fs.readFileSync(filePath, "utf-8");
  const { data, content } = matter(fileContent);

  return NextResponse.json({
    filename,
    frontmatter: data,
    content,
    raw: fileContent,
  });
}

export async function PUT(request: Request, { params }: { params: { filename: string } }) {
  if (!authenticate(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const filename = decodeURIComponent(params.filename);
    const filePath = path.join(POSTS_DIR, filename);

    if (!fs.existsSync(filePath)) {
      return NextResponse.json({ error: "File not found" }, { status: 404 });
    }

    const body = await request.json();
    const { frontmatter, content, newFilename } = body;

    if (newFilename && newFilename !== filename) {
      const newPath = path.join(POSTS_DIR, newFilename);
      fs.renameSync(filePath, newPath);
      const yamlContent = Object.entries(frontmatter || {}).map(([k, v]) => {
        if (Array.isArray(v)) return `${k}:\n${v.map((item) => `  - "${item}"`).join("\n")}`;
        return `${k}: ${typeof v === "string" ? `"${v}"` : v}`;
      }).join("\n");
      fs.writeFileSync(newPath, `---\n${yamlContent}\n---\n\n${content}`, "utf-8");
      return NextResponse.json({ success: true, filename: newFilename });
    }

    const yamlContent = Object.entries(frontmatter || {}).map(([k, v]) => {
      if (Array.isArray(v)) return `${k}:\n${v.map((item) => `  - "${item}"`).join("\n")}`;
      return `${k}: ${typeof v === "string" ? `"${v}"` : v}`;
    }).join("\n");
    fs.writeFileSync(filePath, `---\n${yamlContent}\n---\n\n${content}`, "utf-8");
    return NextResponse.json({ success: true, filename });
  } catch (error) {
    return NextResponse.json({ error: String(error) }, { status: 500 });
  }
}
