import { NextFunction, Request, Response } from "express";
import { fromNodeHeaders } from "better-auth/node";
import { auth } from "./auth.js";
import { UnauthorizedError } from "./errors.js";
import { DBUser } from "../features/users/users.types.js";

export const requireAuth = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  const session = (await auth.api.getSession({
    headers: fromNodeHeaders(req.headers),
  })) as { user: DBUser };

  if (!session) {
    return next(new UnauthorizedError());
  }

  req.user = session.user;
  next();
};
