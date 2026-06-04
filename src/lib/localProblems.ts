import fs from "fs";
import path from "path";

export interface LocalProblemRecord {
  id: string;
  title: string;
  url: string;
  platform: string;
  status: string;
  tags: string[];
  date: string;
  note: string;
  analysis: string;
  created_at: string;
  updated_at: string;
}

const PROBLEMS_FILE = path.join(process.cwd(), "content", "problems.json");

function normalizeProblem(item: Partial<LocalProblemRecord>): LocalProblemRecord {
  const now = new Date().toISOString().replace("T", " ").slice(0, 19);
  return {
    id: String(item.id || Date.now().toString(36)),
    title: String(item.title || ""),
    url: String(item.url || ""),
    platform: String(item.platform || "cf"),
    status: String(item.status || "AC"),
    tags: Array.isArray(item.tags) ? item.tags.map(String) : [],
    date: String(item.date || ""),
    note: String(item.note || ""),
    analysis: String(item.analysis || ""),
    created_at: String(item.created_at || now),
    updated_at: String(item.updated_at || now),
  };
}

export function getLocalProblems(): Array<Omit<LocalProblemRecord, "tags"> & { tags: string }> {
  if (!fs.existsSync(PROBLEMS_FILE)) return [];
  try {
    const raw = fs.readFileSync(PROBLEMS_FILE, "utf-8");
    const data = JSON.parse(raw);
    if (!Array.isArray(data)) return [];
    return data.map((item) => {
      const problem = normalizeProblem(item);
      return {
        ...problem,
        tags: JSON.stringify(problem.tags),
      };
    });
  } catch {
    return [];
  }
}
