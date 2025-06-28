import { Router } from "express";
import meV1Router from "./me";

const v1Router = Router();

v1Router.use("/me", meV1Router);

export default v1Router;
