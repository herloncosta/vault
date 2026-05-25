import express from "express";
import helmet from "helmet";
import cors from "cors";
import rateLimit from "express-rate-limit";
import errorHandler from "./middleware/error-handler.js";
import env from "./config/env.js";

const app = express();

app.use(helmet());
app.use(cors(env.corsOrigin === "*" ? undefined : { origin: env.corsOrigin.split(",") }));
app.use(express.json());

app.use(
  rateLimit({
    windowMs: env.rateLimitWindowMs,
    max: env.rateLimitMax,
    standardHeaders: true,
    legacyHeaders: false,
  }),
);

app.get("/health", (_req, res) => {
  res.json({ status: "ok" });
});

app.use(errorHandler);

export default app;
