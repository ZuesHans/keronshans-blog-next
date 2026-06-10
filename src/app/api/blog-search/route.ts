import { NextResponse } from "next/server";
import { getCloudflareContext } from "@opennextjs/cloudflare";

interface SearchEnv {
  SEARCH_API_URL?: string;
  SEARCH_API_TOKEN?: string;
}

function normalizeTopK(value: string | null): string {
  const parsed = Number.parseInt(value || "5", 10);
  if (!Number.isFinite(parsed)) return "5";
  return String(Math.min(Math.max(parsed, 1), 10));
}

function errorResponse(message: string, status: number) {
  return NextResponse.json({ error: message }, { status });
}

export async function GET(request: Request) {
  const env = await getSearchEnv();
  const searchApiUrl = env.SEARCH_API_URL;
  const searchApiToken = env.SEARCH_API_TOKEN;

  if (!searchApiUrl || !searchApiToken) {
    return errorResponse("Search API is not configured.", 500);
  }

  const { searchParams } = new URL(request.url);
  const query = searchParams.get("q")?.trim();
  const topK = normalizeTopK(searchParams.get("top_k"));

  if (!query) {
    return errorResponse("q is required.", 400);
  }

  try {
    const upstreamUrl = new URL(searchApiUrl);
    upstreamUrl.searchParams.set("q", query);
    upstreamUrl.searchParams.set("top_k", topK);

    const upstreamResponse = await fetch(upstreamUrl, {
      headers: {
        Authorization: `Bearer ${searchApiToken}`,
      },
    });

    const contentType = upstreamResponse.headers.get("content-type") || "";
    const body = contentType.includes("application/json")
      ? await upstreamResponse.json()
      : { error: await upstreamResponse.text() };

    if (!upstreamResponse.ok) {
      return NextResponse.json(
        { error: "Search service request failed.", detail: body },
        { status: upstreamResponse.status },
      );
    }

    return NextResponse.json(body);
  } catch (error) {
    console.error("GET /api/blog-search error:", error);
    return errorResponse("Search service is temporarily unavailable.", 502);
  }
}

async function getSearchEnv(): Promise<SearchEnv> {
  try {
    const { env } = await getCloudflareContext({ async: true });
    const searchEnv = env as SearchEnv;
    return {
      SEARCH_API_URL: searchEnv.SEARCH_API_URL || process.env.SEARCH_API_URL,
      SEARCH_API_TOKEN: searchEnv.SEARCH_API_TOKEN || process.env.SEARCH_API_TOKEN,
    };
  } catch {
    return {
      SEARCH_API_URL: process.env.SEARCH_API_URL,
      SEARCH_API_TOKEN: process.env.SEARCH_API_TOKEN,
    };
  }
}
