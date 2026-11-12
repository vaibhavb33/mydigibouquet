#!/usr/bin/env node
/**
 * Consistent hot backup utility for local SQLite databases (`file:./local.db`).
 * Creates a point-in-time snapshot using SQLite's native `.backup` command and verifies integrity.
 */
import fs from "node:fs";
import path from "node:path";
import { execFileSync } from "node:child_process";

const dbUrl = process.env.DATABASE_URL?.trim() || "file:./local.db";
if (!dbUrl.startsWith("file:")) {
  console.error(
    "Remote LibSQL/Turso URL detected. Use `turso db shell <db> .dump` or Turso Point-in-Time Recovery.",
  );
  process.exit(1);
}

const relPath = dbUrl.replace(/^file:/, "");
const dbPath = path.resolve(process.cwd(), relPath);
if (!fs.existsSync(dbPath)) {
  console.error(`Source SQLite database not found at ${dbPath}`);
  process.exit(1);
}

const backupDir = path.resolve(process.cwd(), "backups");
fs.mkdirSync(backupDir, { recursive: true, mode: 0o700 });

const stamp = new Date().toISOString().replace(/[:.]/g, "-");
const outFile = path.join(backupDir, `petal-prose-${stamp}.db`);

execFileSync("sqlite3", [dbPath, `.backup '${outFile}'`], { stdio: "inherit" });
fs.chmodSync(outFile, 0o600);

const integrity = execFileSync("sqlite3", [outFile, "PRAGMA integrity_check;"], {
  encoding: "utf8",
}).trim();

if (integrity !== "ok") {
  console.error(`Backup integrity check failed: ${integrity}`);
  process.exit(1);
}

const bytes = fs.statSync(outFile).size;
console.log(`Verified SQLite backup (${bytes} bytes, PRAGMA integrity_check=ok): ${outFile}`);

