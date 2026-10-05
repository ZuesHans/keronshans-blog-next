export type JsonBodyResult =
  | { ok: true; value: unknown }
  | { ok: false; status: 413 | 422; error: string };

export async function readJsonBody(request: Request, maxBytes: number): Promise<JsonBodyResult> {
  const declared = Number(request.headers.get("content-length") || 0);
  if (Number.isFinite(declared) && declared > maxBytes) return { ok: false, status: 413, error: "Request too large" };
  const reader = request.body?.getReader();
  const chunks: Uint8Array[] = [];
  let size = 0;
  if (reader) {
    try {
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        size += value.byteLength;
        if (size > maxBytes) { await reader.cancel(); return { ok: false, status: 413, error: "Request too large" }; }
        chunks.push(value);
      }
    } catch { return { ok: false, status: 422, error: "Invalid request body" }; }
    finally { reader.releaseLock(); }
  }
  const bytes = new Uint8Array(size);
  let offset = 0;
  for (const chunk of chunks) { bytes.set(chunk, offset); offset += chunk.byteLength; }
  const raw = new TextDecoder().decode(bytes);
  try { return { ok: true, value: JSON.parse(raw) }; }
  catch { return { ok: false, status: 422, error: "Invalid JSON" }; }
}
