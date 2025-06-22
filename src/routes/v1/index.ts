import { Router } from "express";
import profileV1Router from "./profile";

const v1Router = Router();

v1Router.use("/me", profileV1Router);

export default v1Router;
