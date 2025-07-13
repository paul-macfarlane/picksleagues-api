import "reflect-metadata";
import { Container } from "inversify";
import { TYPES } from "./inversify.types";
import { ProfilesService } from "../features/profiles/profiles.service";
import { ProfilesRepository } from "../features/profiles/profiles.repository";
import { LeagueMembersRepository } from "../features/leagueMembers/leagueMembers.repository";
import { LeagueMembersService } from "../features/leagueMembers/leagueMembers.service";
import { LeagueInvitesRepository } from "../features/leagueInvites/leagueInvites.repository";
import { LeagueInvitesService } from "../features/leagueInvites/leagueInvites.service";
import { LeagueTypesRepository } from "../features/leagueTypes/leagueTypes.repository";
import { LeagueTypesService } from "../features/leagueTypes/leagueTypes.service";
import { LeaguesRepository } from "../features/leagues/leagues.repository";
import { LeaguesService } from "../features/leagues/leagues.service";
import { PhasesRepository } from "../features/phases/phases.repository";
import { PhasesService } from "../features/phases/phases.service";
import { PhaseTemplatesRepository } from "../features/phaseTemplates/phaseTemplates.repository";
import { PhaseTemplatesService } from "../features/phaseTemplates/phaseTemplates.service";
import { UsersRepository } from "../features/users/users.repository";
import { UsersService } from "../features/users/users.service";
import { SeasonsRepository } from "../features/seasons/seasons.repository";
import { SeasonsService } from "../features/seasons/seasons.service";
import { SportLeaguesRepository } from "../features/sportLeagues/sportLeagues.repository";
import { SportLeaguesService } from "../features/sportLeagues/sportLeagues.service";
import { DataSourcesRepository } from "../features/dataSources/dataSources.repository";
import { DataSourcesService } from "../features/dataSources/dataSources.service";

const container = new Container();

// Profiles Bindings
container
  .bind<ProfilesRepository>(TYPES.ProfilesRepository)
  .to(ProfilesRepository)
  .inSingletonScope();
container
  .bind<ProfilesService>(TYPES.ProfilesService)
  .to(ProfilesService)
  .inSingletonScope();

// League Members Bindings
container
  .bind<LeagueMembersRepository>(TYPES.LeagueMembersRepository)
  .to(LeagueMembersRepository)
  .inSingletonScope();
container
  .bind<LeagueMembersService>(TYPES.LeagueMembersService)
  .to(LeagueMembersService)
  .inSingletonScope();

// League Invites Bindings
container
  .bind<LeagueInvitesRepository>(TYPES.LeagueInvitesRepository)
  .to(LeagueInvitesRepository)
  .inSingletonScope();
container
  .bind<LeagueInvitesService>(TYPES.LeagueInvitesService)
  .to(LeagueInvitesService)
  .inSingletonScope();

// League Types Bindings
container
  .bind<LeagueTypesRepository>(TYPES.LeagueTypesRepository)
  .to(LeagueTypesRepository)
  .inSingletonScope();
container
  .bind<LeagueTypesService>(TYPES.LeagueTypesService)
  .to(LeagueTypesService)
  .inSingletonScope();

// Leagues Bindings
container
  .bind<LeaguesRepository>(TYPES.LeaguesRepository)
  .to(LeaguesRepository)
  .inSingletonScope();
container
  .bind<LeaguesService>(TYPES.LeaguesService)
  .to(LeaguesService)
  .inSingletonScope();

// Phases Bindings
container
  .bind<PhasesRepository>(TYPES.PhasesRepository)
  .to(PhasesRepository)
  .inSingletonScope();
container
  .bind<PhasesService>(TYPES.PhasesService)
  .to(PhasesService)
  .inSingletonScope();

// Phase Templates Bindings
container
  .bind<PhaseTemplatesRepository>(TYPES.PhaseTemplatesRepository)
  .to(PhaseTemplatesRepository)
  .inSingletonScope();
container
  .bind<PhaseTemplatesService>(TYPES.PhaseTemplatesService)
  .to(PhaseTemplatesService)
  .inSingletonScope();

// Users Bindings
container
  .bind<UsersRepository>(TYPES.UsersRepository)
  .to(UsersRepository)
  .inSingletonScope();
container
  .bind<UsersService>(TYPES.UsersService)
  .to(UsersService)
  .inSingletonScope();

// Seasons Bindings
container
  .bind<SeasonsRepository>(TYPES.SeasonsRepository)
  .to(SeasonsRepository)
  .inSingletonScope();
container
  .bind<SeasonsService>(TYPES.SeasonsService)
  .to(SeasonsService)
  .inSingletonScope();

// Sport Leagues Bindings
container
  .bind<SportLeaguesRepository>(TYPES.SportLeaguesRepository)
  .to(SportLeaguesRepository)
  .inSingletonScope();
container
  .bind<SportLeaguesService>(TYPES.SportLeaguesService)
  .to(SportLeaguesService)
  .inSingletonScope();

// Data Sources Bindings
container
  .bind<DataSourcesRepository>(TYPES.DataSourcesRepository)
  .to(DataSourcesRepository)
  .inSingletonScope();
container
  .bind<DataSourcesService>(TYPES.DataSourcesService)
  .to(DataSourcesService)
  .inSingletonScope();

// Add other feature bindings here as we migrate them

export { container };
