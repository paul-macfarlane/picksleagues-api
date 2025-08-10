import { describe, it, expect, beforeEach, vi } from "vitest";
import { mock, MockProxy } from "vitest-mock-extended";
import { ProfilesService } from "./profiles.service.js";
import { ProfilesQueryService } from "./profiles.query.service.js";
import { ProfilesMutationService } from "./profiles.mutation.service.js";
import {
  ANONYMOUS_USERNAME,
  DBProfile,
  DBProfileUpdate,
} from "./profiles.types.js";
import {
  ConflictError,
  ForbiddenError,
  NotFoundError,
  ValidationError,
} from "../../lib/errors.js";

// Mock the database transaction helper to execute synchronously
vi.mock("../../db/index.js", () => ({
  db: {
    transaction: vi.fn((callback) => callback()),
  },
}));

describe("ProfilesService.update", () => {
  let profilesService: ProfilesService;
  let profilesQueryService: MockProxy<ProfilesQueryService>;
  let profilesMutationService: MockProxy<ProfilesMutationService>;

  const userId = "user-1";

  beforeEach(() => {
    profilesQueryService = mock<ProfilesQueryService>();
    profilesMutationService = mock<ProfilesMutationService>();

    profilesService = new ProfilesService(
      profilesQueryService,
      profilesMutationService,
    );
  });

  it("throws ForbiddenError when acting user differs from target", async () => {
    await expect(
      profilesService.update("acting-user", userId, {} as DBProfileUpdate),
    ).rejects.toThrow(ForbiddenError);

    expect(profilesQueryService.findByUserId).not.toHaveBeenCalled();
    expect(profilesMutationService.update).not.toHaveBeenCalled();
  });

  it("throws ValidationError for reserved anonymous username", async () => {
    await expect(
      profilesService.update(userId, userId, {
        username: ANONYMOUS_USERNAME,
      }),
    ).rejects.toThrow(ValidationError);
  });

  it("throws NotFoundError when profile does not exist", async () => {
    profilesQueryService.findByUserId.mockResolvedValue(null);

    await expect(
      profilesService.update(userId, userId, { firstName: "John" }),
    ).rejects.toThrow(NotFoundError);
  });

  it("throws ConflictError when new username is already taken", async () => {
    const existing: DBProfile = {
      userId,
      username: "old-username",
      firstName: "Old",
      lastName: "Name",
      avatarUrl: null,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    profilesQueryService.findByUserId.mockResolvedValue(existing);
    profilesQueryService.isUsernameTaken.mockResolvedValue(true);

    await expect(
      profilesService.update(userId, userId, { username: "new-username" }),
    ).rejects.toThrow(ConflictError);
  });

  it("updates successfully when username unchanged", async () => {
    const existing: DBProfile = {
      userId,
      username: "same",
      firstName: "Old",
      lastName: "Name",
      avatarUrl: null,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    const updates: DBProfileUpdate = { firstName: "New" };
    const updated: DBProfile = { ...existing, firstName: "New" };

    profilesQueryService.findByUserId.mockResolvedValue(existing);
    profilesMutationService.update.mockResolvedValue(updated);

    const result = await profilesService.update(userId, userId, updates);

    expect(result).toEqual(updated);
    expect(profilesQueryService.isUsernameTaken).not.toHaveBeenCalled();
    expect(profilesMutationService.update).toHaveBeenCalledWith(
      userId,
      updates,
      undefined,
    );
  });

  it("updates successfully when new username is available", async () => {
    const existing: DBProfile = {
      userId,
      username: "old-username",
      firstName: "Old",
      lastName: "Name",
      avatarUrl: null,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    const updates: DBProfileUpdate = {
      username: "new-username",
      lastName: "Doe",
    };
    const updated: DBProfile = {
      ...existing,
      username: "new-username",
      lastName: "Doe",
    } as DBProfile;

    profilesQueryService.findByUserId.mockResolvedValue(existing);
    profilesQueryService.isUsernameTaken.mockResolvedValue(false);
    profilesMutationService.update.mockResolvedValue(updated);

    const result = await profilesService.update(userId, userId, updates);

    expect(result).toEqual(updated);
    expect(profilesQueryService.isUsernameTaken).toHaveBeenCalledWith(
      "new-username",
      undefined,
    );
    expect(profilesMutationService.update).toHaveBeenCalledWith(
      userId,
      updates,
      undefined,
    );
  });
});
