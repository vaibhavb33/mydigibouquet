/**
 * Environment & operational readiness checks (never returns secret values).
 */

export type StorageBackendMode = "local-sqlite" | "remote-libsql";

export function getDatabaseConfig(): {
  url: string;
  authToken?: string;
  mode: StorageBackendMode;
} {
  const explicitUrl = process.env.DATABASE_URL?.trim();
  const isServerlessReadOnlyRoot =
    Boolean(process.env.VERCEL) || Boolean(process.env.AWS_LAMBDA_FUNCTION_NAME);
  const url =
    explicitUrl ||
    (isServerlessReadOnlyRoot ? "file:/tmp/mydigibouquet.db" : "file:./local.db");
  const authToken = process.env.DATABASE_AUTH_TOKEN?.trim() || undefined;
  const mode: StorageBackendMode =
    url.startsWith("libsql://") || url.startsWith("https://")
      ? "remote-libsql"
      : "local-sqlite";
  return { url, authToken, mode };
}

export function isAnalyticsEnabled(): boolean {
  return process.env.NEXT_PUBLIC_ENABLE_ANALYTICS?.trim().toLowerCase() !== "false";
}

export function isHstsEnabled(): boolean {
  if (process.env.ENABLE_HSTS?.trim().toLowerCase() === "true") return true;
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL?.trim() ?? "";
  return process.env.NODE_ENV === "production" && siteUrl.startsWith("https://");
}

