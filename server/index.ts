import { env } from "./config/env.js";
import { logger } from "./config/logger.js";
import { checkDatabaseConnection } from "./db/pool.js";
import { runMigrations } from "./db/migrate.js";
import { createApp, appState } from "./app.js";

async function main() {
  logger.info({ env: env.NODE_ENV }, "Starting AIGP Backend");

  // 1. Validate environment
  logger.info("Environment validated");

  // 2. Connect to database
  await checkDatabaseConnection();

  // 3. Run migrations
  if (env.RUN_MIGRATIONS_ON_STARTUP) {
    logger.info("Running migrations...");
    await runMigrations();
    logger.info("Migrations completed");
  }

  // Mark migrations as completed
  appState.migrationsCompleted = true;

  // 4. Start Express server
  const app = createApp();
  app.listen(env.PORT, () => {
    logger.info({ port: env.PORT }, "AIGP Backend is running");
  });
}

main().catch((err) => {
  logger.fatal({ err }, "Failed to start backend");
  process.exit(1);
});
