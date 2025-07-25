import { Router } from "express";
import v1Router from "./v1.router.js";
import cronRouter from "./crons.router.js";

const apiRouter = Router();

apiRouter.use("/crons", cronRouter);
apiRouter.use("/v1", v1Router);

export default apiRouter;
