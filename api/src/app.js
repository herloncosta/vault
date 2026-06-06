import express from "express";
import helmet from "helmet";
import cors from "cors";
import rateLimit from "express-rate-limit";
import cookieParser from "cookie-parser";
import swaggerUi from "swagger-ui-express";
import errorHandler from "./middleware/error-handler.js";
import env from "./config/env.js";
import swaggerSpec from "./config/swagger.js";
import authRoutes from "./modules/auth/auth-routes.js";
import userRoutes from "./modules/users/users-routes.js";
import transactionRoutes from "./modules/transactions/transactions-routes.js";
import recurringExpenseRoutes from "./modules/recurring-expenses/recurring-expenses-routes.js";
import installmentExpenseRoutes from "./modules/installment-expenses/installment-expenses-routes.js";
import categoryRoutes from "./modules/categories/categories-routes.js";

const app = express();

app.use(helmet());
app.use(cors({
  origin: env.corsOrigin.split(","),
  credentials: true,
}));
app.use(express.json({ limit: "10kb" }));
app.use(cookieParser());

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

app.use("/api-docs", swaggerUi.serve, swaggerUi.setup(swaggerSpec));
app.use("/api/auth", authRoutes);
app.use("/api/users", userRoutes);
app.use("/api/transactions", transactionRoutes);
app.use("/api/recurring-expenses", recurringExpenseRoutes);
app.use("/api/installment-expenses", installmentExpenseRoutes);
app.use("/api/categories", categoryRoutes);

app.use(errorHandler);

export default app;
