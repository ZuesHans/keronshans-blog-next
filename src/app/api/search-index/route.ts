import { NextResponse } from "next/server";
import { getSearchSnapshot } from "@/lib/searchSnapshot";

export const dynamic = "force-dynamic";

export async function GET() {
  const { value } = await getSearchSnapshot();

  return NextResponse.json(
    value,
    {
      headers: {
        "Cache-Control": "no-store",
      },
    },
  );
}
