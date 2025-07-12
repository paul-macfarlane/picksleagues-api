import { Router } from "express";
import v1Router from "./v1";
import cronRouter from "./crons";

const apiRouter = Router();

apiRouter.use("/crons", cronRouter);
apiRouter.use("/v1", v1Router);

export default apiRouter;
