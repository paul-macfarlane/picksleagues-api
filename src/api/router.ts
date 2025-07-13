import { Router } from "express";
import v1Router from "./v1.router";
import cronRouter from "./crons.router";

const apiRouter = Router();

apiRouter.use("/crons", cronRouter);
apiRouter.use("/v1", v1Router);

export default apiRouter;
