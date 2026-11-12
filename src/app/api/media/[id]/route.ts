import { NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { db, ensureDbReady } from "@/db";
import { mediaAttachments } from "@/db/schema";

const SAFE_ID_RE = /^[A-Za-z0-9_-]{8,64}$/;

export async function GET(
  req: Request,
  context: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await context.params;
    if (!SAFE_ID_RE.test(id)) {
      return NextResponse.json({ error: "Invalid media identifier" }, { status: 400 });
    }

    await ensureDbReady();
    const rows = await db
      .select()
      .from(mediaAttachments)
      .where(eq(mediaAttachments.id, id))
      .limit(1);

    const row = rows[0];
    if (!row) {
      return NextResponse.json({ error: "Media not found" }, { status: 404 });
    }

    const buf = Buffer.from(row.dataBase64, "base64");
    const totalLength = buf.byteLength;
    const rangeHeader = req.headers.get("range");

    const baseHeaders: Record<string, string> = {
      "Content-Type": row.mimeType,
      "Accept-Ranges": "bytes",
      "X-Content-Type-Options": "nosniff",
      "X-Robots-Tag": "noindex, nofollow",
      "Content-Security-Policy": "default-src 'none'",
      "Cache-Control": "private, max-age=31536000, immutable",
    };

    if (rangeHeader && rangeHeader.startsWith("bytes=")) {
      const [startStr, endStr] = rangeHeader.replace("bytes=", "").split("-");
      const start = Math.max(0, Number(startStr || 0));
      const end = endStr ? Math.min(totalLength - 1, Number(endStr)) : totalLength - 1;
      if (Number.isFinite(start) && Number.isFinite(end) && start <= end && start < totalLength) {
        const chunk = buf.subarray(start, end + 1);
        return new NextResponse(chunk, {
          status: 206,
          headers: {
            ...baseHeaders,
            "Content-Range": `bytes ${start}-${end}/${totalLength}`,
            "Content-Length": String(chunk.byteLength),
          },
        });
      }
    }

    return new NextResponse(buf, {
      status: 200,
      headers: {
        ...baseHeaders,
        "Content-Length": String(totalLength),
      },
    });
  } catch (err) {
    console.error("GET /api/media/[id] error", err);
    return NextResponse.json({ error: "Failed to load media" }, { status: 500 });
  }
}

