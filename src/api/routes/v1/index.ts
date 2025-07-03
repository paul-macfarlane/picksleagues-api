import { Router } from "express";
import profileRouter from "./profile";

const router = Router();

router.use("/profile", profileRouter);

export default router;
