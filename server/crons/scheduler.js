// server/crons/scheduler.js
// Runs two daily jobs:
//   1. Auto-expire subscriptions whose expiryDate has passed
//   2. Permanently delete trashed invoices older than the retention window
import cron from "node-cron";
import config from "../config.js";
import { runExpiryCheck, runTrashCleanup } from "../services/subscription.service.js";

const { dailySchedule, timezone } = config.cron;

function wrap(name, fn) {
  return async () => {
    const start = Date.now();
    try {
      const result = await fn();
      console.log(`[Cron:${name}] completed in ${Date.now() - start}ms`, result);
    } catch (err) {
      console.error(`[Cron:${name}] failed:`, err.message);
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
