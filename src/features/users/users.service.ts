import { injectable, inject } from "inversify";
import { TYPES } from "../../lib/inversify.types";
import { NotFoundError } from "../../lib/errors";
import { DBUser } from "./users.types";
import { UsersRepository } from "./users.repository";
import { db, DBOrTx } from "../../db";

@injectable()
export class UsersService {
  constructor(
    @inject(TYPES.UsersRepository)
    private usersRepository: UsersRepository,
  ) {}

  async findById(id: string, dbOrTx: DBOrTx = db): Promise<DBUser | undefined> {
    return await this.usersRepository.findById(id, dbOrTx);
  }

  async getById(id: string, dbOrTx: DBOrTx = db): Promise<DBUser> {
    const user = await this.findById(id, dbOrTx);
    if (!user) {
      throw new NotFoundError("User not found");
    }

    return user;
  }
}
