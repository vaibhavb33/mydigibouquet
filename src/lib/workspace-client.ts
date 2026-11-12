import type { BouquetSceneV1, OccasionSlug } from "@/engine/types";

export const WORKSPACE_TOKEN_KEY = "mydigibouquet:workspace:v1";

export type SavedProjectSummary = {
  id: string;
  title: string;
  occasionTag: OccasionSlug | null;
  stemCount: number;
  publishedSlug: string | null;
  createdAt: string;
  updatedAt: string;
};

export type SavedProjectFull = SavedProjectSummary & {
  scene: BouquetSceneV1;
};

let memoryFallbackToken: string | null = null;

function generateWorkspaceToken(): string {
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
    return `${crypto.randomUUID()}-${crypto.randomUUID()}`.replace(/[^A-Za-z0-9_-]/g, "");
  }
  return `ws_${Math.random().toString(36).slice(2)}_${Date.now().toString(36)}_atelier`;
}

export function getWorkspaceToken(): string {
  if (typeof window === "undefined") return "";
  try {
    const existing = window.localStorage.getItem(WORKSPACE_TOKEN_KEY);
    if (existing && /^[A-Za-z0-9_-]{16,128}$/.test(existing)) {
      return existing;
    }
    const created = generateWorkspaceToken();
    window.localStorage.setItem(WORKSPACE_TOKEN_KEY, created);
    return created;
  } catch {
    if (!memoryFallbackToken) {
      memoryFallbackToken = generateWorkspaceToken();
    }
    return memoryFallbackToken;
  }
}

export function workspaceHeaders(): Record<string, string> {
  const token = getWorkspaceToken();
  return token ? { "x-workspace-token": token } : {};
}

