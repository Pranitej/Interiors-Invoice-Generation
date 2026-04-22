// server/crons/scheduler.js
// Runs three daily jobs (also once immediately on server start):
//   1. Auto-expire subscriptions whose expiryDate has passed
//   2. Permanently delete trashed invoices older than the retention window
//   3. Delete orphaned image files not linked to any model
// Runs one backup-only job (NOT on startup — scheduled only):
//   4. mongodump backup at 2am (only when BACKUP_ENABLED=true)
import cron from "node-cron";
import config from "../config.js";
import { runExpiryCheck, runTrashCleanup } from "../services/subscription.service.js";
import { runImageCleanup } from "../services/imageCleanup.service.js";
import { runDbBackup } from "../services/dbBackup.service.js";

const { dailySchedule, backupSchedule, timezone } = config.cron;

function wrap(name, fn, retries = 3) {
  return async () => {
    const start = Date.now();
    for (let attempt = 1; attempt <= retries; attempt++) {
      try {
        const result = await fn();
        console.log(`[Cron:${name}] completed in ${Date.now() - start}ms`, result);
        return;
      } catch (err) {
        console.error(`[Cron:${name}] attempt ${attempt}/${retries} failed:`, err.message);
        if (attempt < retries) {
          await new Promise((r) => setTimeout(r, attempt * 5000));
        } else {
          console.error(`[Cron:${name}] all ${retries} attempts failed — skipping this run`);
        }
      }
    }
  };
}

const jobs = [
  { name: "ExpiryCheck", fn: runExpiryCheck },
  { name: "TrashCleanup", fn: runTrashCleanup },
  { name: "ImageCleanup", fn: runImageCleanup },
];

export async function startScheduler() {
  for (const { name, fn } of jobs) {
    cron.schedule(dailySchedule, wrap(name, fn), { timezone, scheduled: true });
  }

  // Backup runs on its own schedule and never on startup (avoids backup on every restart)
  cron.schedule(backupSchedule, wrap("DbBackup", runDbBackup, 1), { timezone, scheduled: true });

  console.log(`[Cron] Scheduler started — running daily at midnight (${timezone})`);

  await Promise.allSettled(jobs.map(({ name, fn }) => wrap(name, fn)()));
}
