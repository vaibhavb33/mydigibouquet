/**
 * Cookieless, PII-free, Do-Not-Track / GPC-respecting aggregate telemetry.
 * Strictly avoids IP logging, cookies, session IDs, user-agents, recipient names, or slugs.
 */

export const ALLOWED_ANALYTICS_EVENTS = [
  "studio_opened",
  "preset_applied",
  "occasion_applied",
  "ai_assistant_used",
  "export_png",
  "export_jpg",
  "bouquet_published",
  "bouquet_unboxed",
] as const;

export type AnalyticsEventName = (typeof ALLOWED_ANALYTICS_EVENTS)[number];

export function shouldRespectPrivacyOptOut(): boolean {
  if (typeof window === "undefined") return true;
  if (process.env.NEXT_PUBLIC_ENABLE_ANALYTICS === "false") return true;

  const nav = window.navigator as Navigator & {
    globalPrivacyControl?: boolean;
  };
  const win = window as Window & { doNotTrack?: string };
  const dnt = nav.doNotTrack ?? win.doNotTrack ?? "";
  if (dnt === "1" || dnt === "yes") return true;
  if (nav.globalPrivacyControl === true) return true;

  return false;
}

export function trackPrivacySafeEvent(event: AnalyticsEventName): void {
  if (shouldRespectPrivacyOptOut()) return;

  const body = JSON.stringify({ event });
  try {
    if (typeof navigator !== "undefined" && typeof navigator.sendBeacon === "function") {
      const blob = new Blob([body], { type: "application/json" });
      if (navigator.sendBeacon("/api/analytics", blob)) {
        return;
      }
    }
    void fetch("/api/analytics", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body,
      keepalive: true,
    });
  } catch {
    // Telemetry must never interrupt creative workflows
  }
}

