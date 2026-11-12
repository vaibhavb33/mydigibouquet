import crypto from "node:crypto";
import { NextResponse } from "next/server";
import { db, ensureDbReady } from "@/db";
import { mediaAttachments } from "@/db/schema";
import {
  MAX_AUDIO_BYTES,
  MAX_PHOTO_BYTES,
  MAX_VOICE_DURATION_SEC,
  detectAudioMimeFromBytes,
  detectPhotoMimeFromBytes,
} from "@/lib/media-validation";
import { assertSameOrigin, checkRateLimit } from "@/lib/request-security";

export async function POST(req: Request) {
  const originErr = assertSameOrigin(req);
  if (originErr) return originErr;

  const rateErr = checkRateLimit(req, { bucket: "media-upload", limit: 30, windowMs: 60_000 });
  if (rateErr) return rateErr;

  try {
    await ensureDbReady();
    const formData = await req.formData();
    const kindRaw = formData.get("kind");
    const fileEntry = formData.get("file");
    const durationRaw = formData.get("durationSec");

    const kind = kindRaw === "voice" ? "voice" : kindRaw === "photo" ? "photo" : null;
    if (!kind) {
      return NextResponse.json({ error: "Invalid media kind" }, { status: 400 });
    }

    if (!(fileEntry instanceof File) || fileEntry.size <= 0) {
      return NextResponse.json({ error: "No media file uploaded" }, { status: 400 });
    }

    const maxBytes = kind === "photo" ? MAX_PHOTO_BYTES : MAX_AUDIO_BYTES;
    if (fileEntry.size > maxBytes) {
      return NextResponse.json(
        {
          error:
            kind === "photo"
              ? "Cropped photo exceeds 4 MB limit."
              : "Voice recording exceeds 5 MB limit.",
        },
        { status: 413 },
      );
    }

    const bytes = new Uint8Array(await fileEntry.arrayBuffer());
    const verifiedMime =
      kind === "photo"
        ? detectPhotoMimeFromBytes(bytes)
        : detectAudioMimeFromBytes(bytes, fileEntry.type);

    if (!verifiedMime) {
      return NextResponse.json(
        {
          error:
            kind === "photo"
              ? "Unsupported or invalid photo format. Please upload JPEG, PNG, or WebP."
              : "Unsupported or invalid audio format. Please record or upload WebM, OGG, M4A, MP3, or WAV.",
        },
        { status: 415 },
      );
    }

    const parsedDuration =
      typeof durationRaw === "string" && durationRaw.trim() !== ""
        ? Math.max(0, Math.min(MAX_VOICE_DURATION_SEC, Math.round(Number(durationRaw) || 0)))
        : null;

    const id = crypto.randomBytes(12).toString("base64url");
    const now = new Date().toISOString();

    await db.insert(mediaAttachments).values({
      id,
      kind,
      mimeType: verifiedMime,
      sizeBytes: bytes.byteLength,
      durationSec: kind === "voice" ? parsedDuration : null,
      dataBase64: Buffer.from(bytes).toString("base64"),
      createdAt: now,
    });

    return NextResponse.json(
      {
        id,
        url: `/api/media/${id}`,
        kind,
        mimeType: verifiedMime,
        sizeBytes: bytes.byteLength,
        durationSec: kind === "voice" ? parsedDuration ?? 0 : undefined,
      },
      { status: 201 },
    );
  } catch (err) {
    console.error("POST /api/media error", err);
    return NextResponse.json({ error: "Failed to store media upload" }, { status: 500 });
  }
}

