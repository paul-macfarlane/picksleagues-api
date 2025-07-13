import { DBUser } from "../features/users/users.types";

declare global {
  namespace Express {
    export interface Request {
      user?: DBUser;
    }
  }
}
