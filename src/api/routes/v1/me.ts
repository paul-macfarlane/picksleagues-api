import { Request, Response, Router } from "express";

const meV1Router = Router();

meV1Router.get("/", (_req: Request, res: Response) => {
  res.send("Hello Me!");
});

export default meV1Router;
