import fs from "fs";
import path from "path";
import matter from "gray-matter";

const SNIPPETS_DIR = path.join(process.cwd(), "content", "snippets");

export interface SnippetMeta {
  filename: string;
  id: string;
  title: string;
  language: string;
  tags: string[];
  createdAt: string;
  updatedAt: string;
  description?: string;
}

export interface SnippetData extends SnippetMeta {
  code: string;
}

export function getAllSnippets(): SnippetMeta[] {
  if (!fs.existsSync(SNIPPETS_DIR)) return [];
  const files = fs.readdirSync(SNIPPETS_DIR).filter((f) => f.endsWith(".md"));
  const snippets = files.map((filename) => {
    const filePath = path.join(SNIPPETS_DIR, filename);
    const fileContent = fs.readFileSync(filePath, "utf-8");
    const { data, content } = matter(fileContent);
    const code = extractCodeBlock(content);
    return {
      filename,
      id: data.id || filename.replace(/\.md$/, ""),
      title: data.title || filename.replace(/\.md$/, ""),
      language: data.language || "C++",
      tags: Array.isArray(data.tags) ? data.tags.map(String) : [],
      createdAt: data.created_at || "",
      updatedAt: data.updated_at || "",
      description: data.description || code.slice(0, 100).trim(),
    };
  });
  snippets.sort(
    (a, b) =>
      new Date(b.updatedAt || b.createdAt).getTime() -
      new Date(a.updatedAt || a.createdAt).getTime()
  );
  return snippets;
}

export function getSnippetById(id: string): SnippetData | null {
  const snippets = getAllSnippets();
  const snippet = snippets.find((s) => s.id === id || s.filename === id);
  if (!snippet) return null;
  const filePath = path.join(SNIPPETS_DIR, snippet.filename);
  if (!fs.existsSync(filePath)) return null;
  const fileContent = fs.readFileSync(filePath, "utf-8");
  const { data, content } = matter(fileContent);
  return {
    ...snippet,
    code: extractCodeBlock(content),
    title: data.title || snippet.title,
    language: data.language || snippet.language,
    tags: Array.isArray(data.tags) ? data.tags.map(String) : snippet.tags,
    createdAt: data.created_at || snippet.createdAt,
    updatedAt: data.updated_at || snippet.updatedAt,
    description: data.description || "",
  };
}

export function getSnippetByFilename(filename: string): SnippetData | null {
  const filePath = path.join(SNIPPETS_DIR, filename);
  if (!fs.existsSync(filePath)) return null;
  const fileContent = fs.readFileSync(filePath, "utf-8");
  const { data, content } = matter(fileContent);
  return {
    filename,
    id: data.id || filename.replace(/\.md$/, ""),
    title: data.title || filename.replace(/\.md$/, ""),
    language: data.language || "C++",
    tags: Array.isArray(data.tags) ? data.tags.map(String) : [],
    code: extractCodeBlock(content),
    createdAt: data.created_at || "",
    updatedAt: data.updated_at || "",
    description: data.description || "",
  };
}

export function createSnippet(data: {
  title: string;
  language: string;
  code: string;
  tags: string[];
  description?: string;
}): string {
  if (!fs.existsSync(SNIPPETS_DIR)) {
    fs.mkdirSync(SNIPPETS_DIR, { recursive: true });
  }
  const now = new Date().toISOString().replace("T", " ").slice(0, 19);
  const id = slugify(data.title);
  const filename = `${id}.md`;

  // Avoid overwriting
  let finalFilename = filename;
  let counter = 1;
  while (fs.existsSync(path.join(SNIPPETS_DIR, finalFilename))) {
    finalFilename = `${id}_${counter}.md`;
    counter++;
  }

  const md = buildMarkdown({
    id: finalFilename.replace(/\.md$/, ""),
    title: data.title,
    language: data.language,
    tags: data.tags,
    description: data.description,
    created_at: now,
    updated_at: now,
    code: data.code,
  });

  fs.writeFileSync(path.join(SNIPPETS_DIR, finalFilename), md, "utf-8");
  return finalFilename;
}

export function updateSnippet(
  filename: string,
  data: {
    title: string;
    language: string;
    code: string;
    tags: string[];
    description?: string;
  }
): string | null {
  const filePath = path.join(SNIPPETS_DIR, filename);
  if (!fs.existsSync(filePath)) return null;

  const fileContent = fs.readFileSync(filePath, "utf-8");
  const { data: frontmatter } = matter(fileContent);
  const now = new Date().toISOString().replace("T", " ").slice(0, 19);

  const md = buildMarkdown({
    id: frontmatter.id || filename.replace(/\.md$/, ""),
    title: data.title,
    language: data.language,
    tags: data.tags,
    description: data.description,
    created_at: frontmatter.created_at || now,
    updated_at: now,
    code: data.code,
  });

  fs.writeFileSync(filePath, md, "utf-8");
  return filename;
}

export function deleteSnippet(filename: string): boolean {
  const filePath = path.join(SNIPPETS_DIR, filename);
  if (!fs.existsSync(filePath)) return false;
  fs.unlinkSync(filePath);
  return true;
}

// Internal helpers

function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/[\s]+/g, "-")
    .replace(/[^a-z0-9\u4e00-\u9fa5\-_]/g, "")
    .slice(0, 60);
}

function extractCodeBlock(content: string): string {
  // Find the first fenced code block
  const match = content.match(/```[\w]*\n([\s\S]*?)```/);
  if (match) return match[1].trimEnd();
  // If no code fence, return raw content (stripped of any leading description)
  return content.trim();
}

function buildMarkdown(data: {
  id: string;
  title: string;
  language: string;
  tags: string[];
  description?: string;
  created_at: string;
  updated_at: string;
  code: string;
}): string {
  const lines = [
    "---",
    `id: "${data.id}"`,
    `title: "${data.title}"`,
    `language: "${data.language}"`,
  ];
  if (data.tags.length > 0) {
    lines.push("tags:");
    data.tags.forEach((t) => lines.push(`  - "${t}"`));
  } else {
    lines.push("tags: []");
  }
  if (data.description) {
    lines.push(`description: "${data.description}"`);
  }
  lines.push(`created_at: "${data.created_at}"`);
  lines.push(`updated_at: "${data.updated_at}"`);
  lines.push("---", "");

  // Add description as text above code block if provided
  if (data.description) {
    lines.push(data.description, "");
  }

  lines.push(`\`\`\`${data.language}`);
  lines.push(data.code);
  lines.push("```");
  lines.push("");
  return lines.join("\n");
}
