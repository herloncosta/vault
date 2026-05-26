import app from "./app.js";
import env from "./config/env.js";
import prisma from "./config/database.js";
import { logger } from "./utils/logger.js";
import { cleanupExpiredTokens } from "./modules/auth/auth-service.js";

async function main() {
  await prisma.$connect();
  logger.info("Connected to database");

  setInterval(
    () => {
      cleanupExpiredTokens().catch((err) =>
        logger.error(err, "Token cleanup failed"),
      );
    },
    60 * 60 * 1000,
  );

  app.listen(env.port, () => {
    logger.info(`Server running on port ${env.port}`);
  });
}

main().catch((err) => {
  logger.error(err, "Failed to start server");
  process.exit(1);
});
