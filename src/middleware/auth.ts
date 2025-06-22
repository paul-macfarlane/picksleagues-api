import { NextFunction, Request, Response } from "express";

// todo: temp user type for testing
type User = {
  id: string;
  name: string;
  email: string;
};

declare module "express" {
  interface Request {
    user?: User;
  }
}

export const authMiddleware = (
  req: Request,
  _res: Response,
  next: NextFunction,
) => {
  // todo: replace with actual auth middleware to validate token in request, and get user from database
  const fakeUser = {
    id: "1",
    name: "John Doe",
    email: "john.doe@example.com",
  };
  req.user = fakeUser;

  next();
};
