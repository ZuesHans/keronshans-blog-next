import { getSearchSnapshot } from "@/lib/searchSnapshot";

export const dynamic = "force-dynamic";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ digest: string }> },
) {
  const { bytes, digest } = await getSearchSnapshot();
  const { digest: requested } = await params;
  if (requested !== digest) return new Response("Not Found", { status: 404 });
  return new Response(bytes, {
    status: 200,
    headers: {
      "Cache-Control": "public, max-age=31536000, immutable",
      "Content-Type": "application/json; charset=utf-8",
      ETag: `"${digest}"`,
    },
  });
}
