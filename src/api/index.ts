import "dotenv/config.js";
import "./instrument.js";
import * as Sentry from "@sentry/node";
import "reflect-metadata";
import express, { Request, Response } from "express";
import apiRouter from "./router.js";
import staticRouter from "./static.router.js";
import { toNodeHandler } from "better-auth/node";
import { auth } from "../lib/auth.js";
import cors from "cors";
import path from "path";
import { fileURLToPath } from "url";
import expressLayouts from "express-ejs-layouts";
import { errorMiddleware } from "../lib/errors.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const port = process.env.EXPRESS_PORT || 3001;

// Set up EJS as the view engine
app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "../../views"));
app.set("layout", "layouts/main");
app.use(expressLayouts);

app.use(
  cors({
    origin: [process.env.WEB_FRONTEND_URL!],
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS", "PATCH"],
    credentials: true,
  }),
);

// Serve static assets (css, js, images) from public directory
app.use(
  express.static(path.join(__dirname, "../../public"), {
    index: false, // Disable automatic serving of index.html
  }),
);

app.all("/api/auth/*splat", toNodeHandler(auth));

app.use(express.json());

// Handle API routes
app.use("/api", apiRouter);

// Handle static page routes
app.use("/", staticRouter);

// Redirect all other routes to frontend
app.get("*splat", (req: Request, res: Response) => {
  if (!req.path.startsWith("/api")) {
    res.redirect(`${process.env.WEB_FRONTEND_URL}${req.path}`);
  }
});

// The error handler must be registered before any other error middleware and after all controllers
Sentry.setupExpressErrorHandler(app);

// Register the error middleware
// This must be the last app.use() call
app.use(errorMiddleware);

// For local development
if (process.env.NODE_ENV !== "production") {
  app.listen(port, () => {
    console.log(
      `Server is running on port ${process.env.EXPRESS_HOST}:${port}`,
    );
  });
}

// Export for Vercel
export default app;
