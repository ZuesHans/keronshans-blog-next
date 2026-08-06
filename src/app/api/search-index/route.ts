import { NextResponse } from "next/server";
import { getPostSearchDocuments } from "@/lib/posts";

export const dynamic = "force-dynamic";

export async function GET() {
  const documents = await getPostSearchDocuments();

  return NextResponse.json(
    { version: 1, documents },
    {
      headers: {
        "Cache-Control": "public, max-age=60, s-maxage=60, stale-while-revalidate=300",
      },
    },
  );
}
