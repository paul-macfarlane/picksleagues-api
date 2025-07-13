import {
  LEAGUE_TYPE_NAMES,
  LEAGUE_TYPE_SLUGS,
} from "../../features/leagueTypes/leagueTypes.types";
import { SPORT_LEAGUE_NAMES } from "../../features/sportLeagues/sportLeagues.types";
import { LeagueTypesService } from "../../features/leagueTypes/leagueTypes.service";
import { SportLeaguesService } from "../../features/sportLeagues/sportLeagues.service";
import { db, DBOrTx } from "..";

export const seedLeagueTypes = async (
  leagueTypesService: LeagueTypesService,
  sportLeaguesService: SportLeaguesService,
  dbOrTx: DBOrTx = db,
) => {
  const nflSportLeague = await sportLeaguesService.getByName(
    SPORT_LEAGUE_NAMES.NFL,
    dbOrTx,
  );

  const pickemLeagueType = await leagueTypesService.findOrCreateBySlug(
    {
      slug: LEAGUE_TYPE_SLUGS.PICK_EM,
      name: LEAGUE_TYPE_NAMES.PICK_EM,
      description:
        "Compete against your friends to see who can make the most correct picks, either against the spread or straight up.",
      sportLeagueId: nflSportLeague.id,
    },
    dbOrTx,
  );

  console.log(
    `Found or created pick'em league type: ${JSON.stringify(pickemLeagueType)}`,
  );
};
