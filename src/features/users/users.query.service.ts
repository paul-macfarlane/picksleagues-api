import { injectable, inject } from "inversify";
import { TYPES } from "../../lib/inversify.types.js";
import { DBUser } from "./users.types.js";
import { UsersRepository } from "./users.repository.js";
import { DBOrTx } from "../../db/index.js";

@injectable()
export class UsersQueryService {
  constructor(
    @inject(TYPES.UsersRepository)
    private usersRepository: UsersRepository,
  ) {}

  async findById(id: string, dbOrTx?: DBOrTx): Promise<DBUser | undefined> {
    return this.usersRepository.findById(id, dbOrTx);
  }
}
