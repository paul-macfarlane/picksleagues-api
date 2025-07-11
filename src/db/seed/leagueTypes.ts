import { DBOrTx } from "..";
import { getLeagueTypeBySlug, insertLeagueType } from "../helpers/leagueTypes";
import { getSportLeagueByName } from "../helpers/sportLeagues";
import {
  LEAGUE_TYPE_NAMES,
  LEAGUE_TYPE_SLUGS,
} from "../../lib/models/leagueTypes/constants";
import { SPORT_LEAGUE_NAMES } from "../../lib/models/sportLeagues/constants";

export const seedLeagueTypes = async (dbOrTx: DBOrTx) => {
  const nflSportLeague = await getSportLeagueByName(
    dbOrTx,
    SPORT_LEAGUE_NAMES.NFL,
  );
  if (!nflSportLeague) {
    console.warn("NFL sport league not found");
    return;
  }

  let pickemLeagueType = await getLeagueTypeBySlug(
    dbOrTx,
    LEAGUE_TYPE_SLUGS.PICK_EM,
  );
  if (!pickemLeagueType) {
    pickemLeagueType = await insertLeagueType(dbOrTx, {
      slug: LEAGUE_TYPE_SLUGS.PICK_EM,
      name: LEAGUE_TYPE_NAMES.PICK_EM,
      description:
        "Compete against your friends to see who can make the most correct picks, either against the spread or straight up.",
      sportLeagueId: nflSportLeague.id,
    });

    console.log(
      `Inserted pick'em league type: ${JSON.stringify(pickemLeagueType)}`,
    );
  } else {
    console.log(
      `Pick'em league type already exists: ${JSON.stringify(pickemLeagueType)}`,
    );
  }
};
