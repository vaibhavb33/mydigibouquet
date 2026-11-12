import { BouquetSceneV1 } from "@/engine/types";
import { validateAndNormalizeScene } from "@/engine/validation";

export const DRAFT_STORAGE_KEY = "mydigibouquet:draft:v1";

export function loadLocalDraft(allowedSkuIds: ReadonlySet<string>): BouquetSceneV1 | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem(DRAFT_STORAGE_KEY);
    if (!raw) return null;
    const parsedJson = JSON.parse(raw) as unknown;
    const res = validateAndNormalizeScene(parsedJson, allowedSkuIds);
    if (!res.ok) return null;
    return res.scene;
  } catch {
    return null;
  }
}

export function saveLocalDraft(scene: BouquetSceneV1): boolean {
  if (typeof window === "undefined") return false;
  try {
    window.localStorage.setItem(DRAFT_STORAGE_KEY, JSON.stringify(scene));
    return true;
  } catch {
    // Gracefully absorb Safari Private Browsing QuotaExceededError
    return false;
  }
}

export function clearLocalDraft(): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.removeItem(DRAFT_STORAGE_KEY);
  } catch {
    // Ignore storage access restrictions
  }
}

