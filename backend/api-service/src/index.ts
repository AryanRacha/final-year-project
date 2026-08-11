import { Hono } from "hono";
import { cors } from "hono/cors";
import { logger } from "hono/logger";
import { env } from "./configs/env";
import apiRouter from "./routes";

const app = new Hono();

// ---------------------------------------------------------------------------
// Global Middleware
// ---------------------------------------------------------------------------

app.use("*", logger());
app.use(
  "*",
  cors({
    origin: [env.FRONTEND_URL, "http://localhost:3000"],
    allowHeaders: ["Content-Type", "Authorization"],
    allowMethods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    credentials: true,
  }),
);

// ---------------------------------------------------------------------------
// Health Check
// ---------------------------------------------------------------------------

app.get("/health", (c) => {
  return c.json({
    status: "ok",
    service: "api-service",
    timestamp: new Date().toISOString(),
  });
});

app.get("/", (c) => {
  return c.json({
    message: "Sentinel API Service",
    docs: "/health",
    version: "2.0.0",
  });
});

// ---------------------------------------------------------------------------
// API Routes
// ---------------------------------------------------------------------------

app.route("/api", apiRouter);

// ---------------------------------------------------------------------------
// Error Handling
// ---------------------------------------------------------------------------

app.onError((err, c) => {
  console.error("Unhandled API Error:", err);
  return c.json({ error: err.message || "Internal Server Error" }, 500);
});

app.notFound((c) => {
  return c.json({ error: "Route Not Found" }, 404);
});

// ---------------------------------------------------------------------------
// Server Export
// ---------------------------------------------------------------------------

export default app;
