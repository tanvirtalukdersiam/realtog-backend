import express, { Application, Request, Response } from "express";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import session from "express-session";
import cors from "cors";
import swaggerUi from "swagger-ui-express";
import { swaggerSpec } from "./swagger/swagger.config.js";
import { requestLoggerMiddleware } from "./middlewares/requestLogger.middleware.js";
import { errorMiddleware } from "./middlewares/error.middleware.js";
import passport from "./config/passport.config.js";
import authRoutes from "./modules/auth/auth.route.js";
import otpRoutes from "./modules/otp/otp.route.js";
import logsRoutes from "./modules/logs/logs.route.js";
import userRoutes from "./modules/user/user.route.js";
import pricingRoutes from "./modules/pricing/pricing.route.js";
import orderRoutes from "./modules/order/order.route.js";
import messageRoutes from "./modules/message/message.route.js";
import logger from "./utils/logger.js";
import { config } from "./config/index.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app: Application = express();

// CORS configuration
const corsOptions = {
  origin: function (
    origin: string | undefined,
    callback: (err: Error | null, allow?: boolean) => void
  ) {
    // Allow requests with no origin (like mobile apps or curl requests)
    if (!origin) return callback(null, true);

    const allowedOrigins = [
      config.frontendURL,
      "http://localhost:3000",
      "http://localhost:3001",
      "http://localhost:5173", // Vite default
      "http://localhost:5174",
      process.env.FRONTEND_URL,
    ].filter(Boolean) as string[];

    if (allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      // In development, allow all origins
      if (config.nodeEnv === "development") {
        callback(null, true);
      } else {
        callback(new Error("Not allowed by CORS"));
      }
    }
  },
  credentials: true,
  methods: ["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization"],
};

// middlewares
app.use(cors(corsOptions));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// session middleware (required for passport, but we use JWT for auth)
app.use(
  session({
    secret:
      process.env.SESSION_SECRET || "your-session-secret-change-in-production",
    resave: false,
    saveUninitialized: false,
    cookie: {
      secure: process.env.NODE_ENV === "production",
      httpOnly: true,
      maxAge: 24 * 60 * 60 * 1000, // 24 hours
    },
  })
);

// passport middleware
app.use(passport.initialize());
app.use(passport.session());

// request logger middleware
app.use(requestLoggerMiddleware);

// health check route
app.get("/health", (req: Request, res: Response) => {
  res.json({ status: "ok", timestamp: new Date().toISOString() });
});

// AsyncAPI documentation
app.get("/api-docs/websocket", (req: Request, res: Response) => {
  try {
    const asyncApiFile = path.join(__dirname, "docs", "asyncapi.yaml");
    const asyncApiContent = fs.readFileSync(asyncApiFile, "utf8");

    const html = `
<!DOCTYPE html>
<html>
  <head>
    <title>Realtog WebSocket API Documentation</title>
    <link rel="stylesheet" href="https://unpkg.com/@asyncapi/react-component@next/styles/default.min.css">
    <style>
      body { margin: 0; padding: 0; }
    </style>
  </head>
  <body>
    <div id="asyncapi"></div>
    <script src="https://unpkg.com/@asyncapi/react-component@next/browser/standalone/index.js"></script>
    <script>
      const schema = ${JSON.stringify(asyncApiContent)};
      AsyncApiStandalone.render({
        schema: schema,
        config: {
          show: {
            sidebar: true,
          }
        },
      }, document.getElementById('asyncapi'));
    </script>
  </body>
</html>
    `;
    res.send(html);
  } catch (error) {
    logger.error("Failed to serve AsyncAPI docs", error);
    res.status(500).send("Error loading documentation");
  }
});

// WebSocket Test Client
app.get("/test-socket", (req: Request, res: Response) => {
  try {
    const testClientFile = path.join(__dirname, "docs", "test-client.html");
    res.sendFile(testClientFile);
  } catch (error) {
    logger.error("Failed to serve test client", error);
    res.status(500).send("Error loading test client");
  }
});

// swagger documentation
app.use("/api-docs", swaggerUi.serve, swaggerUi.setup(swaggerSpec));

// logs viewer routes (only in development)
if (process.env.NODE_ENV !== "production") {
  app.use("/logs", logsRoutes);
}

// api routes
app.use("/auth", authRoutes);
app.use("/otp", otpRoutes);
app.use("/users", userRoutes);
app.use("/pricing", pricingRoutes);
app.use("/orders", orderRoutes);
app.use("/messages", messageRoutes);

// 404 handler
app.use((req: Request, res: Response) => {
  res.status(404).json({
    success: false,
    message: "Route not found",
  });
});

// error handler middleware (must be last)
app.use(errorMiddleware);

logger.info("App initialized");

export default app;
