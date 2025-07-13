import { PhaseTemplatesService } from "../../features/phaseTemplates/phaseTemplates.service";
import { SPORT_LEAGUE_NAMES } from "../../features/sportLeagues/sportLeagues.types";
import { SportLeaguesService } from "../../features/sportLeagues/sportLeagues.service";
import { db, DBOrTx } from "..";
import { PHASE_TEMPLATE_TYPES } from "../../features/phaseTemplates/phaseTemplates.types";

const NFL_WEEK_PHASE_LABELS = [
  "Week 1",
  "Week 2",
  "Week 3",
  "Week 4",
  "Week 5",
  "Week 6",
  "Week 7",
  "Week 8",
  "Week 9",
  "Week 10",
  "Week 11",
  "Week 12",
  "Week 13",
  "Week 14",
  "Week 15",
  "Week 16",
  "Week 17",
  "Week 18",
  "Wild Card",
  "Divisional Round",
  "Conference Championship",
  "Super Bowl",
];

const NFL_PHASE_TEMPLATES = NFL_WEEK_PHASE_LABELS.map((label) => ({
  label,
  type: PHASE_TEMPLATE_TYPES.WEEK,
}));

export async function seedPhaseTemplates(
  phaseTemplatesService: PhaseTemplatesService,
  sportLeaguesService: SportLeaguesService,
  dbOrTx: DBOrTx = db,
): Promise<void> {
  const nflSportLeague = await sportLeaguesService.getByName(
    SPORT_LEAGUE_NAMES.NFL,
    dbOrTx,
  );

  for (const [index, phaseTemplate] of NFL_PHASE_TEMPLATES.entries()) {
    const newPhaseTemplate = await phaseTemplatesService.findOrCreate(
      {
        sportLeagueId: nflSportLeague.id,
        label: phaseTemplate.label,
        sequence: index + 1,
        type: phaseTemplate.type,
      },
      dbOrTx,
    );
    console.log(
      `Found or created phase template ${
        phaseTemplate.label
      } as ${JSON.stringify(newPhaseTemplate)}`,
    );
  }
}
