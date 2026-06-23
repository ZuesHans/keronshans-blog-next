import { NextResponse } from "next/server";
import { getCloudflareContext } from "@opennextjs/cloudflare";

export async function GET() {
  try {
    const { env } = await getCloudflareContext({ async: true });
    const { results } = await env.DB.prepare(
      "SELECT date, total_delta AS totalDelta FROM oj_daily_stats ORDER BY date DESC"
    ).all();
    return NextResponse.json(results || []);
  } catch {
    return NextResponse.json([]);
  }
}
