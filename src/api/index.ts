import "dotenv/config";

import express, { Request, Response } from "express";
import apiRouter from "./routes";
import { toNodeHandler } from "better-auth/node";
import { auth } from "../lib/auth";

const app = express();
const port = process.env.EXPRESS_PORT || 3001;

// Enable CORS in development only
if (process.env.NODE_ENV !== "production") {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const cors = require("cors");
  app.use(
    cors({
      origin: [process.env.WEB_FRONTEND_URL!],
      methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS", "PATCH"],
      credentials: true,
    }),
  );
  console.log("CORS enabled in development mode");
}

app.all("/api/auth/*splat", toNodeHandler(auth));

app.use(express.json());

app.use("/api", apiRouter);

app.get("/", (_req: Request, res: Response) => {
  res.json({ message: "ok" });
});

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
