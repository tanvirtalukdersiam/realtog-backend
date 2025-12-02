import swaggerJsdoc from "swagger-jsdoc";
import path from "path";
import { fileURLToPath } from "url";
import { config } from "@config/index.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const options: swaggerJsdoc.Options = {
  definition: {
    openapi: "3.0.0",
    info: {
      title: "Realtog",
      version: "1.0.0",
      description:
        "Production-ready Node.js Backend with TypeScript, Express, MongoDB, and JWT Auth",
      contact: {
        name: "API Support",
      },
    },
    servers: [
      {
        url: `http://localhost:${config.port}`,
        description: "Development server",
      },
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: "http",
          scheme: "bearer",
          bearerFormat: "JWT",
        },
      },
    },
    security: [
      {
        bearerAuth: [],
      },
    ],
  },
  apis: [
    // In production, use .js files from dist folder, in development use .ts files
    path.join(
      __dirname,
      `../modules/**/*.route.${config.nodeEnv === "production" ? "js" : "ts"}`
    ),
    path.join(
      __dirname,
      `../modules/**/*.controller.${
        config.nodeEnv === "production" ? "js" : "ts"
      }`
    ),
  ],
};

export const swaggerSpec = swaggerJsdoc(options);
