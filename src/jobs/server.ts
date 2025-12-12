import "dotenv/config";

import cron from "node-cron";
import { runPostViewsAggregationJob } from "./processPostViews";
import { logger } from "@/lib/logger";

const CRON_LABEL = "jobs:post-views-cron";
const CRON_EXPRESSION = "* * * * *";
const log = logger.child({ route: CRON_LABEL });

let isRunning = false;

async function executeJob() {
  if (isRunning) {
    log.warn("Previous run still in progress, skipping tick");
    return;
  }

  isRunning = true;
  try {
    log.info("Starting scheduled run");
    await runPostViewsAggregationJob();

    log.info("Run finished");
  } catch (error) {
    log.error({ error }, "Run failed");
  } finally {
    isRunning = false;
  }
}

function bootstrap() {
  const task = cron.schedule(CRON_EXPRESSION, executeJob, {
    timezone: "UTC",
  });

  task.start();
  log.info({ cron: CRON_EXPRESSION, timezone: "UTC" }, "Scheduler started");

  // Run once on startup so we don't wait 5 minutes before the first flush.
  void executeJob();

  const shutdown = () => {
    log.info("Shutting down scheduler");
    task.stop();
    process.exit(0);
  };

  process.on("SIGINT", shutdown);
  process.on("SIGTERM", shutdown);
}

bootstrap();
