import "dotenv/config";

import express, { Request, Response } from "express";
import cors from "cors";
import apiRouter from "./routes";
import { toNodeHandler } from "better-auth/node";
import { auth } from "./lib/auth";

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

// this approach only works for mobile, and web but only web web is on the same domain
app.get("/post-oauth-callback", (req: Request, res: Response) => {
  res.redirect(`${process.env.WEB_FRONTEND_URL!}/app`);
});

app.listen(port, () => {
  console.log(`Server is running at ${process.env.EXPRESS_HOST}:${port}`);
});
