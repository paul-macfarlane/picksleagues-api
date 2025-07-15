import { injectable, inject } from "inversify";
import { TYPES } from "../../lib/inversify.types";
import { DBUser } from "./users.types";
import { UsersRepository } from "./users.repository";
import { db, DBOrTx } from "../../db";

@injectable()
export class UsersQueryService {
  constructor(
    @inject(TYPES.UsersRepository)
    private usersRepository: UsersRepository,
  ) {}

  async findById(id: string, dbOrTx: DBOrTx = db): Promise<DBUser | undefined> {
    return this.usersRepository.findById(id, dbOrTx);
  }
}
