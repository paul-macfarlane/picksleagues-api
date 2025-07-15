import { injectable, inject } from "inversify";
import { TYPES } from "../../lib/inversify.types";
import { UsersRepository } from "./users.repository";

@injectable()
export class UsersMutationService {
  constructor(
    @inject(TYPES.UsersRepository)
    private usersRepository: UsersRepository,
  ) {}

  // This service is intentionally left blank for now.
  // It will be used for CUD operations on the users entity.
}
