import { DBUser } from "../features/users/users.types.js";

declare global {
  namespace Express {
    export interface Request {
      user?: DBUser;
    }
  }
}
