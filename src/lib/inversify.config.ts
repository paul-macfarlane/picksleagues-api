import "reflect-metadata";
import { Container } from "inversify";
import { TYPES } from "./inversify.types.js";
import { ProfilesService } from "../features/profiles/profiles.service.js";
import { ProfilesRepository } from "../features/profiles/profiles.repository.js";
import { LeagueMembersRepository } from "../features/leagueMembers/leagueMembers.repository.js";
import { LeagueMembersService } from "../features/leagueMembers/leagueMembers.service.js";
import { LeagueInvitesRepository } from "../features/leagueInvites/leagueInvites.repository.js";
import { LeagueInvitesService } from "../features/leagueInvites/leagueInvites.service.js";
import { LeagueTypesRepository } from "../features/leagueTypes/leagueTypes.repository.js";
import { LeagueTypesService } from "../features/leagueTypes/leagueTypes.service.js";
import { LeaguesRepository } from "../features/leagues/leagues.repository.js";
import { LeaguesService } from "../features/leagues/leagues.service.js";
import { LeaguesMutationService } from "../features/leagues/leagues.mutation.service.js";
import { PhasesRepository } from "../features/phases/phases.repository.js";
import { PhasesService } from "../features/phases/phases.service.js";
import { PhaseTemplatesRepository } from "../features/phaseTemplates/phaseTemplates.repository.js";
import { PhaseTemplatesService } from "../features/phaseTemplates/phaseTemplates.service.js";
import { PhaseTemplatesQueryService } from "../features/phaseTemplates/phaseTemplates.query.service.js";
import { PhaseTemplatesMutationService } from "../features/phaseTemplates/phaseTemplates.mutation.service.js";
import { UsersRepository } from "../features/users/users.repository.js";
import { UsersService } from "../features/users/users.service.js";
import { SeasonsRepository } from "../features/seasons/seasons.repository.js";
import { SeasonsService } from "../features/seasons/seasons.service.js";
import { SportLeaguesRepository } from "../features/sportLeagues/sportLeagues.repository.js";
import { SportLeaguesService } from "../features/sportLeagues/sportLeagues.service.js";
import { DataSourcesRepository } from "../features/dataSources/dataSources.repository.js";
import { DataSourcesService } from "../features/dataSources/dataSources.service.js";
import { EspnService } from "../integrations/espn/espn.service.js";
import { LeaguesQueryService } from "../features/leagues/leagues.query.service.js";
import { LeagueTypesQueryService } from "../features/leagueTypes/leagueTypes.query.service.js";
import { LeagueMembersQueryService } from "../features/leagueMembers/leagueMembers.query.service.js";
import { LeagueMembersMutationService } from "../features/leagueMembers/leagueMembers.mutation.service.js";
import { UsersQueryService } from "../features/users/users.query.service.js";
import { UsersMutationService } from "../features/users/users.mutation.service.js";
import { LeagueInvitesQueryService } from "../features/leagueInvites/leagueInvites.query.service.js";
import { LeagueInvitesMutationService } from "../features/leagueInvites/leagueInvites.mutation.service.js";
import { ProfilesQueryService } from "../features/profiles/profiles.query.service.js";
import { ProfilesMutationService } from "../features/profiles/profiles.mutation.service.js";
import { PhasesQueryService } from "../features/phases/phases.query.service.js";
import { PhasesMutationService } from "../features/phases/phases.mutation.service.js";
import { SeasonsQueryService } from "../features/seasons/seasons.query.service.js";
import { SeasonsMutationService } from "../features/seasons/seasons.mutation.service.js";
import { DataSourcesQueryService } from "../features/dataSources/dataSources.query.service.js";
import { DataSourcesMutationService } from "../features/dataSources/dataSources.mutation.service.js";
import { SportLeaguesQueryService } from "../features/sportLeagues/sportLeagues.query.service.js";
import { SportLeaguesMutationService } from "../features/sportLeagues/sportLeagues.mutation.service.js";
import { LeaguesUtilService } from "../features/leagues/leagues.util.service.js";
import { AccountsRepository } from "../features/accounts/accounts.repository.js";
import { AccountsMutationService } from "../features/accounts/accounts.mutation.service.js";
import { SessionsRepository } from "../features/sessions/sessions.repository.js";
import { SessionsMutationService } from "../features/sessions/sessions.mutation.service.js";
import { VerificationsRepository } from "../features/verifications/verifications.repository.js";
import { VerificationsMutationService } from "../features/verifications/verifications.mutation.service.js";
import { TeamsQueryService } from "../features/teams/teams.query.service.js";
import { TeamsRepository } from "../features/teams/teams.repository.js";
import { TeamsService } from "../features/teams/teams.service.js";
import { TeamsMutationService } from "../features/teams/teams.mutation.service.js";
import { EventsRepository } from "../features/events/events.repository.js";
import { EventsService } from "../features/events/events.service.js";
import { EventsQueryService } from "../features/events/events.query.service.js";
import { EventsMutationService } from "../features/events/events.mutation.service.js";
import { SeasonsUtilService } from "../features/seasons/seasons.util.service.js";
import { OddsRepository } from "../features/odds/odds.repository.js";
import { OddsQueryService } from "../features/odds/odds.query.service.js";
import { OddsMutationService } from "../features/odds/odds.mutation.service.js";
import { SportsbooksRepository } from "../features/sportsbooks/sportsbooks.repository.js";
import { SportsbooksQueryService } from "../features/sportsbooks/sportsbooks.query.service.js";
import { SportsbooksMutationService } from "../features/sportsbooks/sportsbooks.mutation.service.js";
import { LiveScoresRepository } from "../features/liveScores/liveScores.repository.js";
import { LiveScoresQueryService } from "../features/liveScores/liveScores.query.service.js";
import { LiveScoresMutationService } from "../features/liveScores/liveScores.mutation.service.js";
import { OutcomesRepository } from "../features/outcomes/outcomes.repository.js";
import { OutcomesQueryService } from "../features/outcomes/outcomes.query.service.js";
import { OutcomesMutationService } from "../features/outcomes/outcomes.mutation.service.js";
import { PicksRepository } from "../features/picks/picks.repository.js";
import { PicksQueryService } from "../features/picks/picks.query.service.js";
import { PicksService } from "../features/picks/picks.service.js";
import { PhasesUtilService } from "../features/phases/phases.util.service.js";

const container = new Container();

// Accounts Bindings
container
  .bind<AccountsRepository>(TYPES.AccountsRepository)
  .to(AccountsRepository)
  .inSingletonScope();
container
  .bind<AccountsMutationService>(TYPES.AccountsMutationService)
  .to(AccountsMutationService)
  .inSingletonScope();

// Sessions Bindings
container
  .bind<SessionsRepository>(TYPES.SessionsRepository)
  .to(SessionsRepository)
  .inSingletonScope();
container
  .bind<SessionsMutationService>(TYPES.SessionsMutationService)
  .to(SessionsMutationService)
  .inSingletonScope();

// Verifications Bindings
container
  .bind<VerificationsRepository>(TYPES.VerificationsRepository)
  .to(VerificationsRepository)
  .inSingletonScope();
container
  .bind<VerificationsMutationService>(TYPES.VerificationsMutationService)
  .to(VerificationsMutationService)
  .inSingletonScope();

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

// Teams Bindings
container
  .bind<TeamsRepository>(TYPES.TeamsRepository)
  .to(TeamsRepository)
  .inSingletonScope();
container
  .bind<TeamsService>(TYPES.TeamsService)
  .to(TeamsService)
  .inSingletonScope();

// Events Bindings
container
  .bind<EventsRepository>(TYPES.EventsRepository)
  .to(EventsRepository)
  .inSingletonScope();
container
  .bind<EventsService>(TYPES.EventsService)
  .to(EventsService)
  .inSingletonScope();

// Odds Bindings
container
  .bind<OddsRepository>(TYPES.OddsRepository)
  .to(OddsRepository)
  .inSingletonScope();

// Sportsbooks Bindings
container
  .bind<SportsbooksRepository>(TYPES.SportsbooksRepository)
  .to(SportsbooksRepository)
  .inSingletonScope();

// Live Scores Bindings
container
  .bind<LiveScoresRepository>(TYPES.LiveScoresRepository)
  .to(LiveScoresRepository)
  .inSingletonScope();

// Outcomes Bindings
container
  .bind<OutcomesRepository>(TYPES.OutcomesRepository)
  .to(OutcomesRepository)
  .inSingletonScope();

// Picks Bindings
container
  .bind<PicksRepository>(TYPES.PicksRepository)
  .to(PicksRepository)
  .inSingletonScope();
container
  .bind<PicksQueryService>(TYPES.PicksQueryService)
  .to(PicksQueryService)
  .inSingletonScope();
container
  .bind<PicksService>(TYPES.PicksService)
  .to(PicksService)
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
container
  .bind<TeamsQueryService>(TYPES.TeamsQueryService)
  .to(TeamsQueryService)
  .inSingletonScope();
container
  .bind<EventsQueryService>(TYPES.EventsQueryService)
  .to(EventsQueryService)
  .inSingletonScope();
container
  .bind<OddsQueryService>(TYPES.OddsQueryService)
  .to(OddsQueryService)
  .inSingletonScope();
container
  .bind<SportsbooksQueryService>(TYPES.SportsbooksQueryService)
  .to(SportsbooksQueryService)
  .inSingletonScope();
container
  .bind<LiveScoresQueryService>(TYPES.LiveScoresQueryService)
  .to(LiveScoresQueryService)
  .inSingletonScope();
container
  .bind<OutcomesQueryService>(TYPES.OutcomesQueryService)
  .to(OutcomesQueryService)
  .inSingletonScope();

// Util Services
container
  .bind<LeaguesUtilService>(TYPES.LeaguesUtilService)
  .to(LeaguesUtilService)
  .inSingletonScope();
container
  .bind<SeasonsUtilService>(TYPES.SeasonsUtilService)
  .to(SeasonsUtilService)
  .inSingletonScope();
container
  .bind<PhasesUtilService>(TYPES.PhasesUtilService)
  .to(PhasesUtilService)
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
container
  .bind<TeamsMutationService>(TYPES.TeamsMutationService)
  .to(TeamsMutationService)
  .inSingletonScope();
container
  .bind<EventsMutationService>(TYPES.EventsMutationService)
  .to(EventsMutationService)
  .inSingletonScope();
container
  .bind<OddsMutationService>(TYPES.OddsMutationService)
  .to(OddsMutationService)
  .inSingletonScope();
container
  .bind<SportsbooksMutationService>(TYPES.SportsbooksMutationService)
  .to(SportsbooksMutationService)
  .inSingletonScope();
container
  .bind<LiveScoresMutationService>(TYPES.LiveScoresMutationService)
  .to(LiveScoresMutationService)
  .inSingletonScope();
container
  .bind<OutcomesMutationService>(TYPES.OutcomesMutationService)
  .to(OutcomesMutationService)
  .inSingletonScope();

// Add other feature bindings here as we migrate them

export { container };
