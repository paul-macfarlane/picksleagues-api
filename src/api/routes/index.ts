import { Request, Response, Router } from "express";
import v1Router from "./v1";

const apiRouter = Router();

// this approach only works for mobile, and web but only web web is on the same domain
apiRouter.get("/post-oauth-callback", (_req: Request, res: Response) => {
  res.redirect(`${process.env.WEB_FRONTEND_URL!}/app`);
});

apiRouter.get("/hello", (_req: Request, res: Response) => {
  res.json({ message: "hello" });
});

apiRouter.use("/v1", v1Router);

export default apiRouter;
