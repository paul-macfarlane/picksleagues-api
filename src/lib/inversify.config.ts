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
import { PhaseTemplatesQueryService } from "../features/phaseTemplates/phaseTemplates.query.service";
import { PhaseTemplatesMutationService } from "../features/phaseTemplates/phaseTemplates.mutation.service";
import { UsersRepository } from "../features/users/users.repository";
import { UsersService } from "../features/users/users.service";
import { SeasonsRepository } from "../features/seasons/seasons.repository";
import { SeasonsService } from "../features/seasons/seasons.service";
import { SportLeaguesRepository } from "../features/sportLeagues/sportLeagues.repository";
import { SportLeaguesService } from "../features/sportLeagues/sportLeagues.service";
import { DataSourcesRepository } from "../features/dataSources/dataSources.repository";
import { DataSourcesService } from "../features/dataSources/dataSources.service";
import { EspnService } from "../integrations/espn/espn.service";
import { LeaguesQueryService } from "../features/leagues/leagues.query.service";
import { LeagueTypesQueryService } from "../features/leagueTypes/leagueTypes.query.service";
import { LeagueMembersQueryService } from "../features/leagueMembers/leagueMembers.query.service";
import { LeagueMembersMutationService } from "../features/leagueMembers/leagueMembers.mutation.service";
import { UsersQueryService } from "../features/users/users.query.service";
import { UsersMutationService } from "../features/users/users.mutation.service";
import { LeagueInvitesQueryService } from "../features/leagueInvites/leagueInvites.query.service";
import { LeagueInvitesMutationService } from "../features/leagueInvites/leagueInvites.mutation.service";
import { ProfilesQueryService } from "../features/profiles/profiles.query.service";
import { ProfilesMutationService } from "../features/profiles/profiles.mutation.service";
import { LeaguesMutationService } from "../features/leagues/leagues.mutation.service";
import { PhasesQueryService } from "../features/phases/phases.query.service";
import { PhasesMutationService } from "../features/phases/phases.mutation.service";
import { SeasonsQueryService } from "../features/seasons/seasons.query.service";
import { SeasonsMutationService } from "../features/seasons/seasons.mutation.service";
import { DataSourcesQueryService } from "../features/dataSources/dataSources.query.service";
import { DataSourcesMutationService } from "../features/dataSources/dataSources.mutation.service";
import { SportLeaguesQueryService } from "../features/sportLeagues/sportLeagues.query.service";
import { SportLeaguesMutationService } from "../features/sportLeagues/sportLeagues.mutation.service";

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

// Integrations Bindings
container
  .bind<EspnService>(TYPES.EspnService)
  .to(EspnService)
  .inSingletonScope();

// Query Services
container
  .bind<LeaguesQueryService>(TYPES.LeaguesQueryService)
  .to(LeaguesQueryService)
  .inSingletonScope();
container
  .bind<LeagueTypesQueryService>(TYPES.LeagueTypesQueryService)
  .to(LeagueTypesQueryService)
  .inSingletonScope();
container
  .bind<LeagueMembersQueryService>(TYPES.LeagueMembersQueryService)
  .to(LeagueMembersQueryService)
  .inSingletonScope();
container
  .bind<UsersQueryService>(TYPES.UsersQueryService)
  .to(UsersQueryService)
  .inSingletonScope();
container
  .bind<LeagueInvitesQueryService>(TYPES.LeagueInvitesQueryService)
  .to(LeagueInvitesQueryService)
  .inSingletonScope();
container
  .bind<ProfilesQueryService>(TYPES.ProfilesQueryService)
  .to(ProfilesQueryService)
  .inSingletonScope();
container
  .bind<PhaseTemplatesQueryService>(TYPES.PhaseTemplatesQueryService)
  .to(PhaseTemplatesQueryService)
  .inSingletonScope();
container
  .bind<PhasesQueryService>(TYPES.PhasesQueryService)
  .to(PhasesQueryService)
  .inSingletonScope();
container
  .bind<SeasonsQueryService>(TYPES.SeasonsQueryService)
  .to(SeasonsQueryService)
  .inSingletonScope();
container
  .bind<DataSourcesQueryService>(TYPES.DataSourcesQueryService)
  .to(DataSourcesQueryService)
  .inSingletonScope();
container
  .bind<SportLeaguesQueryService>(TYPES.SportLeaguesQueryService)
  .to(SportLeaguesQueryService)
  .inSingletonScope();

// Mutation Services
container
  .bind<LeagueMembersMutationService>(TYPES.LeagueMembersMutationService)
  .to(LeagueMembersMutationService)
  .inSingletonScope();
container
  .bind<UsersMutationService>(TYPES.UsersMutationService)
  .to(UsersMutationService)
  .inSingletonScope();
container
  .bind<LeagueInvitesMutationService>(TYPES.LeagueInvitesMutationService)
  .to(LeagueInvitesMutationService)
  .inSingletonScope();
container
  .bind<ProfilesMutationService>(TYPES.ProfilesMutationService)
  .to(ProfilesMutationService)
  .inSingletonScope();
container
  .bind<LeaguesMutationService>(TYPES.LeaguesMutationService)
  .to(LeaguesMutationService)
  .inSingletonScope();
container
  .bind<PhaseTemplatesMutationService>(TYPES.PhaseTemplatesMutationService)
  .to(PhaseTemplatesMutationService)
  .inSingletonScope();
container
  .bind<PhasesMutationService>(TYPES.PhasesMutationService)
  .to(PhasesMutationService)
  .inSingletonScope();
container
  .bind<SeasonsMutationService>(TYPES.SeasonsMutationService)
  .to(SeasonsMutationService)
  .inSingletonScope();
container
  .bind<DataSourcesMutationService>(TYPES.DataSourcesMutationService)
  .to(DataSourcesMutationService)
  .inSingletonScope();
container
  .bind<SportLeaguesMutationService>(TYPES.SportLeaguesMutationService)
  .to(SportLeaguesMutationService)
  .inSingletonScope();

// Add other feature bindings here as we migrate them

export { container };
