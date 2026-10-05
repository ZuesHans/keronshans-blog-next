import crypto from "node:crypto";
import fs from "node:fs";
import path from "node:path";
import { getPostSearchDocuments } from "./posts";
import { CONTENT_ROOT } from "./contentRoot";
import { getSnapshotManifestDigest, hasGeneratedContentSnapshot } from "./contentSnapshot";
import type { SearchDocument } from "./search";

export interface SearchSnapshot {
  schemaVersion: 1;
  snapshotDigest: string;
  documents: SearchDocument[];
}

function readSnapshotDigest(): string {
  if (hasGeneratedContentSnapshot()) return getSnapshotManifestDigest();
  const manifestPath = path.join(CONTENT_ROOT, "content-manifest.json");
  if (fs.existsSync(manifestPath)) {
    try {
      const manifest = JSON.parse(fs.readFileSync(manifestPath, "utf8")) as { snapshotDigest?: unknown };
      if (typeof manifest.snapshotDigest === "string" && /^[a-f0-9]{64}$/.test(manifest.snapshotDigest)) return manifest.snapshotDigest;
    } catch {
      // A malformed optional manifest is handled by the content verifier.
    }
  }
  return process.env.NEXT_PUBLIC_SNAPSHOT_DIGEST || "dev";
}

export async function getSearchSnapshot(): Promise<{ value: SearchSnapshot; bytes: string; digest: string }> {
  const documents = (await getPostSearchDocuments()).slice().sort((left, right) => left.id.localeCompare(right.id));
  const value: SearchSnapshot = { schemaVersion: 1, snapshotDigest: readSnapshotDigest(), documents };
  const bytes = JSON.stringify(value);
  const digest = crypto.createHash("sha256").update(bytes, "utf8").digest("hex");
  return { value, bytes, digest };
}
