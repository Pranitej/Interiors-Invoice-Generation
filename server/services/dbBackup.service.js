// server/services/dbBackup.service.js
// Runs mongodump as a child process and cleans up backups older than retentionDays.
// Only active when BACKUP_ENABLED=true in .env.
import { exec } from "child_process";
import fs from "fs/promises";
import path from "path";
import { promisify } from "util";
import config from "../config.js";
import logger from "../utils/logger.js";

const execAsync = promisify(exec);

export async function runDbBackup() {
  const { enabled, dir, retentionDays, mongoUri } = config.backup;

  if (!enabled) {
    return { skipped: true, reason: "BACKUP_ENABLED is not set to true" };
  }

  const dateStr = new Date().toISOString().slice(0, 10); // YYYY-MM-DD
  const outDir = path.join(dir, dateStr);

  await fs.mkdir(outDir, { recursive: true });

  const { stderr } = await execAsync(
    `mongodump --uri="${mongoUri}" --out="${outDir}"`,
  );
  if (stderr) logger.warn(`[DbBackup] mongodump stderr: ${stderr}`);

  const cleaned = await cleanOldBackups(dir, retentionDays);

  return { date: dateStr, outDir, cleaned };
}

async function cleanOldBackups(dir, retentionDays) {
  const cutoff = Date.now() - retentionDays * 24 * 60 * 60 * 1000;
  let cleaned = 0;

  let entries;
  try {
    entries = await fs.readdir(dir, { withFileTypes: true });
  } catch {
    return cleaned;
  }

  for (const entry of entries) {
    if (!entry.isDirectory()) continue;
    const ts = new Date(entry.name).getTime();
    if (!isNaN(ts) && ts < cutoff) {
      await fs.rm(path.join(dir, entry.name), { recursive: true, force: true });
      cleaned++;
    }
  }

  return cleaned;
}
