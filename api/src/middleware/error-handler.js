import { logger } from "../utils/logger.js";

export default function errorHandler(err, _req, res, _next) {
  logger.error(err);

  if (err.code === "P2002") {
    return res.status(409).json({ error: "Resource already exists" });
  }

  const status = err.status || 500;
  const message = err.status ? err.message : "Internal server error";

  res.status(status).json({ error: message });
}
