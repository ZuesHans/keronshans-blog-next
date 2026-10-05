import { NextResponse } from "next/server";
import { getSearchSnapshot } from "@/lib/searchSnapshot";
import { getSnapshotReleaseId, getSnapshotFrameworkSha } from "@/lib/contentSnapshot";

export const dynamic = "force-dynamic";

export async function GET() {
  const { digest: searchDigest, value: searchSnapshot } = await getSearchSnapshot();
  return NextResponse.json({
    releaseId: getSnapshotReleaseId(),
    frameworkSha: getSnapshotFrameworkSha(),
    snapshotDigest: searchSnapshot.snapshotDigest,
    searchDigest,
    createdAt: process.env.NEXT_PUBLIC_BUILD_CREATED_AT || null,
  }, { headers: { "Cache-Control": "no-store" } });
}
