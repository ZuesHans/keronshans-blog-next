import { generatedContentSnapshot } from "@/generated/contentSnapshot";

export interface SnapshotFile {
  path: string;
  content: string;
}

export function hasGeneratedContentSnapshot(): boolean {
  return process.env.NODE_ENV !== "development" && generatedContentSnapshot.generated;
}

export function getSnapshotFiles(prefix: "posts" | "snippets"): SnapshotFile[] {
  if (!hasGeneratedContentSnapshot()) return [];
  const files: readonly SnapshotFile[] = prefix === "posts" ? generatedContentSnapshot.posts : generatedContentSnapshot.snippets;
  return files.map((file) => ({ path: file.path, content: file.content }));
}

export function getSnapshotFile(relativePath: string): string | null {
  if (!hasGeneratedContentSnapshot()) return null;
  const all: readonly SnapshotFile[] = [...generatedContentSnapshot.posts, ...generatedContentSnapshot.snippets];
  return all.find((file) => file.path === relativePath)?.content || null;
}

export function getSnapshotRegistry(): unknown {
  return hasGeneratedContentSnapshot() ? generatedContentSnapshot.registry : null;
}

export function getSnapshotProblems(): unknown {
  return hasGeneratedContentSnapshot() ? generatedContentSnapshot.problems : null;
}

export function getSnapshotManifestDigest(): string {
  return hasGeneratedContentSnapshot() ? generatedContentSnapshot.snapshotDigest : "dev";
}

export function getSnapshotReleaseId(): string {
  return hasGeneratedContentSnapshot() ? generatedContentSnapshot.releaseId : "dev";
}
export function getSnapshotFrameworkSha(): string {
  return hasGeneratedContentSnapshot() ? (generatedContentSnapshot as { frameworkSha?: string }).frameworkSha || "unknown" : "dev";
}
