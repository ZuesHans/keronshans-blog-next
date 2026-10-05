import fs from "fs";
import { PROBLEMS_FILE } from "./contentRoot";
import { getSnapshotProblems, hasGeneratedContentSnapshot } from "./contentSnapshot";

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

function normalizeProblem(item: Partial<LocalProblemRecord>): LocalProblemRecord {
  const now = new Date().toISOString().replace("T", " ").slice(0, 19);
  return {
    id: String(item.id || Date.now().toString(36)),
    title: String(item.title || ""),
    url: String(item.url || ""),
    platform: String(item.platform || "cf"),
    status: String(item.status || "AC"),
    tags: parseTags(item.tags),
    date: String(item.date || ""),
    note: String(item.note || ""),
    analysis: String(item.analysis || ""),
    created_at: String(item.created_at || now),
    updated_at: String(item.updated_at || now),
  };
}

function parseTags(value: unknown): string[] {
  if (Array.isArray(value)) return value.map(String);
  if (typeof value === "string") {
    try { const parsed = JSON.parse(value); return Array.isArray(parsed) ? parsed.map(String) : []; } catch { return []; }
  }
  return [];
}

export function getLocalProblems() {
  const publicFields = (item: Partial<LocalProblemRecord>) => {
    const { id, title, url, platform, status, tags, date } = normalizeProblem(item);
    return { id, title, url, platform, status, tags: JSON.stringify(tags), date };
  };
  if (hasGeneratedContentSnapshot()) {
    const data = getSnapshotProblems();
    if (!Array.isArray(data)) return [];
    return data.map((item) => publicFields(item as Partial<LocalProblemRecord>));
  }
  if (!fs.existsSync(PROBLEMS_FILE)) return [];
  try {
    const raw = fs.readFileSync(PROBLEMS_FILE, "utf-8");
    const data = JSON.parse(raw);
    if (!Array.isArray(data)) return [];
    return data.map(publicFields);
  } catch {
    return [];
  }
}
