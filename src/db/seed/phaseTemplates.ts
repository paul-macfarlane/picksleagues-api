import { PhaseTemplatesService } from "../../features/phaseTemplates/phaseTemplates.service.js";
import { SPORT_LEAGUE_NAMES } from "../../features/sportLeagues/sportLeagues.types.js";
import { db, DBOrTx } from "../index.js";
import { PHASE_TEMPLATE_TYPES } from "../../features/phaseTemplates/phaseTemplates.types.js";
import { SportLeaguesQueryService } from "../../features/sportLeagues/sportLeagues.query.service.js";

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
  sportLeaguesQueryService: SportLeaguesQueryService,
  dbOrTx: DBOrTx = db,
): Promise<void> {
  const nflSportLeague = await sportLeaguesQueryService.findByName(
    SPORT_LEAGUE_NAMES.NFL,
    dbOrTx,
  );
  if (!nflSportLeague) {
    console.warn("NFL sport league not found, skipping phase templates");
    return;
  }

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
