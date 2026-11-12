import { hashEditToken } from "@/db";
import { OCCASION_TEMPLATES } from "@/engine/occasions";
import type { BouquetSceneV1 } from "@/engine/types";
import { sanitizeTextInput } from "@/engine/validation";

const WORKSPACE_TOKEN_RE = /^[A-Za-z0-9_-]{16,128}$/;

export function isValidWorkspaceToken(token: string | null | undefined): token is string {
  return typeof token === "string" && WORKSPACE_TOKEN_RE.test(token);
}

export function extractWorkspaceTokenHash(req: Request): string | null {
  const raw = req.headers.get("x-workspace-token")?.trim();
  if (!isValidWorkspaceToken(raw)) return null;
  return hashEditToken(raw);
}

export function deriveProjectTitle(scene: BouquetSceneV1, explicitTitle?: string | null): string {
  if (explicitTitle && explicitTitle.trim().length > 0) {
    return sanitizeTextInput(explicitTitle, 80, 160);
  }
  if (scene.card.recipientName.trim().length > 0) {
    return sanitizeTextInput(`For ${scene.card.recipientName.trim()}`, 80, 160);
  }
  if (scene.occasionTag && scene.occasionTag in OCCASION_TEMPLATES) {
    return `${OCCASION_TEMPLATES[scene.occasionTag].label} Bouquet`;
  }
  return "Untitled Arrangement";
}

