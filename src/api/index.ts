import "dotenv/config";

import express, { Request, Response } from "express";
import apiRouter from "./routes";
import { toNodeHandler } from "better-auth/node";
import { auth } from "../lib/auth";
import cors from "cors";

const app = express();
const port = process.env.EXPRESS_PORT || 3001;

app.use(
  cors({
    origin: [process.env.WEB_FRONTEND_URL!],
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS", "PATCH"],
    credentials: true,
  }),
);

app.all("/api/auth/*splat", toNodeHandler(auth));

app.use(express.json());

app.use("/api", apiRouter);

// Redirect all non-API GET requests to the frontend
app.get("*splat", (req: Request, res: Response) => {
  if (!req.path.startsWith("/api")) {
    res.redirect(`${process.env.WEB_FRONTEND_URL}${req.path}`);
  }
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
