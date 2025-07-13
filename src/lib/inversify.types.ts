const TYPES = {
  // Profiles
  ProfilesRepository: Symbol.for("ProfilesRepository"),
  ProfilesService: Symbol.for("ProfilesService"),

  LeagueTypesRepository: Symbol.for("LeagueTypesRepository"),
  LeagueTypesService: Symbol.for("LeagueTypesService"),

  LeaguesRepository: Symbol.for("LeaguesRepository"),
  LeaguesService: Symbol.for("LeaguesService"),

  LeagueMembersRepository: Symbol.for("LeagueMembersRepository"),
  LeagueMembersService: Symbol.for("LeagueMembersService"),

  PhasesRepository: Symbol.for("PhasesRepository"),
  PhasesService: Symbol.for("PhasesService"),

  PhaseTemplatesRepository: Symbol.for("PhaseTemplatesRepository"),
  PhaseTemplatesService: Symbol.for("PhaseTemplatesService"),

  UsersService: Symbol.for("UsersService"),
  UsersRepository: Symbol.for("UsersRepository"),

  SeasonsRepository: Symbol.for("SeasonsRepository"),
  SeasonsService: Symbol.for("SeasonsService"),

  LeagueInvitesService: Symbol.for("LeagueInvitesService"),
  LeagueInvitesRepository: Symbol.for("LeagueInvitesRepository"),

  SportLeaguesRepository: Symbol.for("SportLeaguesRepository"),
  SportLeaguesService: Symbol.for("SportLeaguesService"),

  DataSourcesService: Symbol.for("DataSourcesService"),
  DataSourcesRepository: Symbol.for("DataSourcesRepository"),
};

export { TYPES };
