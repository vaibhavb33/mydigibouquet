import { randomUUID } from "node:crypto";
import { NextResponse } from "next/server";
import { db, ensureDbReady } from "@/db";
import { contactMessages } from "@/db/schema";
import { sanitizeTextInput } from "@/engine/validation";
import { assertSameOrigin, checkRateLimit } from "@/lib/request-security";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
const ALLOWED_TOPICS = ["general", "feedback", "bug", "moderation", "partnership"] as const;

export async function POST(req: Request) {
  const originErr = assertSameOrigin(req);
  if (originErr) return originErr;

  const rateErr = checkRateLimit(req, { bucket: "contact-submit", limit: 10, windowMs: 60_000 });
  if (rateErr) return rateErr;

  try {
    const body = (await req.json()) as {
      name?: unknown;
      email?: unknown;
      topic?: unknown;
      bouquetRef?: unknown;
      message?: unknown;
    };

    const name = sanitizeTextInput(typeof body.name === "string" ? body.name : "", 80, 160);
    const email = sanitizeTextInput(typeof body.email === "string" ? body.email : "", 160, 200);
    const rawTopic = typeof body.topic === "string" ? body.topic.trim() : "general";
    const topic = ALLOWED_TOPICS.includes(rawTopic as (typeof ALLOWED_TOPICS)[number])
      ? rawTopic
      : "general";
    const bouquetRef = sanitizeTextInput(
      typeof body.bouquetRef === "string" ? body.bouquetRef : "",
      160,
      240,
    );
    const message = sanitizeTextInput(typeof body.message === "string" ? body.message : "", 1500, 3000);

    if (name.length < 2) {
      return NextResponse.json({ error: "Please enter your name (at least 2 characters)." }, { status: 400 });
    }
    if (!EMAIL_RE.test(email)) {
      return NextResponse.json({ error: "Please provide a valid email address." }, { status: 400 });
    }
    if (message.length < 10) {
      return NextResponse.json(
        { error: "Please share at least a short note (10+ characters) so we can help." },
        { status: 400 },
      );
    }

    await ensureDbReady();
    const id = randomUUID();
    const now = new Date().toISOString();

    await db.insert(contactMessages).values({
      id,
      name,
      email,
      topic,
      bouquetRef: bouquetRef || null,
      message,
      createdAt: now,
    });

    return NextResponse.json(
      {
        received: true,
        id,
        createdAt: now,
      },
      { status: 201 },
    );
  } catch (error) {
    console.error("POST /api/contact error", error);
    return NextResponse.json({ error: "Unable to submit message right now." }, { status: 500 });
  }
}

