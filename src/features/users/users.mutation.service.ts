import { injectable, inject } from "inversify";
import { TYPES } from "../../lib/inversify.types";
import { UsersRepository } from "./users.repository";
import { db, DBOrTx } from "../../db";
import { DBUserUpdate } from "./users.types";

@injectable()
export class UsersMutationService {
  constructor(
    @inject(TYPES.UsersRepository)
    private usersRepository: UsersRepository,
  ) {}

  async update(
    id: string,
    data: DBUserUpdate,
    dbOrTx: DBOrTx = db,
  ): Promise<void> {
    await this.usersRepository.update(id, data, dbOrTx);
  }
}
