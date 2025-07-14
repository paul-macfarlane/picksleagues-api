import { injectable } from "inversify";

@injectable()
export class UsersService {
  constructor() {}

  // This service is intentionally left blank.
  // It will be used for orchestrating complex business logic involving users
  // that spans multiple features, as per our architectural standards.
  // For simple CUD, use UsersMutationService.
  // For reads, use UsersQueryService.
}
