export const TYPES = {
  // Repositories
  ProfilesRepository: Symbol.for("ProfilesRepository"),
  LeagueTypesRepository: Symbol.for("LeagueTypesRepository"),
  LeaguesRepository: Symbol.for("LeaguesRepository"),
  LeagueMembersRepository: Symbol.for("LeagueMembersRepository"),
  LeagueInvitesRepository: Symbol.for("LeagueInvitesRepository"),
  PhasesRepository: Symbol.for("PhasesRepository"),
  PhaseTemplatesRepository: Symbol.for("PhaseTemplatesRepository"),
  DataSourcesRepository: Symbol.for("DataSourcesRepository"),
  SportLeaguesRepository: Symbol.for("SportLeaguesRepository"),
  SeasonsRepository: Symbol.for("SeasonsRepository"),
  UsersRepository: Symbol.for("UsersRepository"),

  // Services
  ProfilesService: Symbol.for("ProfilesService"),
  LeagueTypesService: Symbol.for("LeagueTypesService"),
  LeaguesService: Symbol.for("LeaguesService"),
  LeagueMembersService: Symbol.for("LeagueMembersService"),
  LeagueInvitesService: Symbol.for("LeagueInvitesService"),
  PhasesService: Symbol.for("PhasesService"),
  PhaseTemplatesService: Symbol.for("PhaseTemplatesService"),
  UsersService: Symbol.for("UsersService"),
  DataSourcesService: Symbol.for("DataSourcesService"),
  SportLeaguesService: Symbol.for("SportLeaguesService"),
  SeasonsService: Symbol.for("SeasonsService"),

  // Query Services
  LeaguesQueryService: Symbol.for("LeaguesQueryService"),
  LeagueTypesQueryService: Symbol.for("LeagueTypesQueryService"),
  LeagueMembersQueryService: Symbol.for("LeagueMembersQueryService"),
  UsersQueryService: Symbol.for("UsersQueryService"),
  LeagueInvitesQueryService: Symbol.for("LeagueInvitesQueryService"),
  ProfilesQueryService: Symbol.for("ProfilesQueryService"),
  PhaseTemplatesQueryService: Symbol.for("PhaseTemplatesQueryService"),

  // Mutation Services
  LeagueMembersMutationService: Symbol.for("LeagueMembersMutationService"),
  UsersMutationService: Symbol.for("UsersMutationService"),
  LeagueInvitesMutationService: Symbol.for("LeagueInvitesMutationService"),
  ProfilesMutationService: Symbol.for("ProfilesMutationService"),
  LeaguesMutationService: Symbol.for("LeaguesMutationService"),
  PhaseTemplatesMutationService: Symbol.for("PhaseTemplatesMutationService"),

  // External Services
  EspnService: Symbol.for("EspnService"),
};
