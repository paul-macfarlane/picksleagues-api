import { Request, Response, Router } from "express";
import { authMiddleware } from "../../middleware/auth";

const profileV1Router = Router();

profileV1Router.use(authMiddleware);

profileV1Router.get("/", (_req: Request, res: Response) => {
  res.send("Hello Me!");
});

export default profileV1Router;
