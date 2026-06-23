import { NextResponse } from "next/server";
import { getCloudflareContext } from "@opennextjs/cloudflare";

export async function GET() {
  try {
    const { env } = await getCloudflareContext({ async: true });
    const { results } = await env.DB.prepare(
      `SELECT id, title, url, platform, status, tags, date, note, analysis,
              synced_at AS created_at, updated_at, synced_at,
              'oj_float' AS source
         FROM oj_synced_problems
        ORDER BY updated_at DESC`
    ).all();
    return NextResponse.json(results || []);
  } catch {
    return NextResponse.json([]);
  }
}
