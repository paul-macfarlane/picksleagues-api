import { Request, Response, Router } from "express";
import v1Router from "./v1";

const apiRouter = Router();

apiRouter.get("/health", (_req: Request, res: Response) => {
  res.json({ message: "ok" });
});

// this approach only works for mobile, and web but only web web is on the same domain
apiRouter.get("/post-oauth-callback", (_req: Request, res: Response) => {
  res.redirect(`${process.env.WEB_FRONTEND_URL!}/app`);
});

apiRouter.use("/v1", v1Router);

export default apiRouter;
