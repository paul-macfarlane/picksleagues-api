import express, { Request, Response } from "express";
import "dotenv/config";

const app = express();
const port = process.env.EXPRESS_PORT || 3000;

app.use(express.json());

app.get("/health", (_req: Request, res: Response) => {
  res.json({ status: "ok" });
});

app.listen(port, () => {
  console.log(`Server is running at ${process.env.EXPRESS_HOST}${port}`);
});
