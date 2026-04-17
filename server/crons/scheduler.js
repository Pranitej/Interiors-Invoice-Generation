// server/crons/scheduler.js
// Runs two daily jobs:
//   1. Auto-expire subscriptions whose expiryDate has passed
//   2. Permanently delete trashed invoices older than the retention window
import cron from "node-cron";
import config from "../config.js";
import { runExpiryCheck, runTrashCleanup } from "../services/subscription.service.js";

const { dailySchedule, timezone } = config.cron;

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

export function startScheduler() {
  cron.schedule(dailySchedule, wrap("ExpiryCheck", runExpiryCheck), {
    timezone,
    scheduled: true,
  });

  cron.schedule(dailySchedule, wrap("TrashCleanup", runTrashCleanup), {
    timezone,
    scheduled: true,
  });

  console.log(
    `[Cron] Scheduler started — running daily at midnight (${timezone})`
  );
}
