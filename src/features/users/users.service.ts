import { injectable, inject } from "inversify";
import { TYPES } from "../../lib/inversify.types";
import { NotFoundError } from "../../lib/errors";
import { DBUser } from "./users.types";
import { UsersRepository } from "./users.repository";

@injectable()
export class UsersService {
  constructor(
    @inject(TYPES.UsersRepository)
    private usersRepository: UsersRepository,
  ) {}

  async findById(id: string): Promise<DBUser | undefined> {
    return await this.usersRepository.findById(id);
  }

  async getById(id: string): Promise<DBUser> {
    const user = await this.findById(id);
    if (!user) {
      throw new NotFoundError("User not found");
    }

    return user;
  }
}
