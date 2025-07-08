import { PHASE_TYPES } from "../../lib/models/phases";
import { DBOrTx } from "..";
import {
  getPhaseTemplateBySportLeagueAndLabel,
  insertPhaseTemplate,
} from "../helpers/phaseTemplates";
import { getSportLeagueByName } from "../helpers/sportLeagues";
import { DBPhaseTemplate } from "../schema";

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
  type: PHASE_TYPES.WEEK,
}));

export async function seedPhaseTemplates(
  dbOrTx: DBOrTx,
): Promise<DBPhaseTemplate[]> {
  const nflSportLeague = await getSportLeagueByName(dbOrTx, "NFL");
  if (!nflSportLeague) {
    console.warn("NFL sport league not found, skipping phase templates");
    return [];
  }

  const phaseTemplates: DBPhaseTemplate[] = [];
  for (const [index, phaseTemplate] of NFL_PHASE_TEMPLATES.entries()) {
    const existingPhaseTemplate = await getPhaseTemplateBySportLeagueAndLabel(
      dbOrTx,
      nflSportLeague.id,
      phaseTemplate.label,
    );
    if (existingPhaseTemplate) {
      console.log(
        `Phase template ${phaseTemplate.label} already exists, skipping`,
      );
      continue;
    }

    const newPhaseTemplate = await insertPhaseTemplate(dbOrTx, {
      sportLeagueId: nflSportLeague.id,
      label: phaseTemplate.label,
      sequence: index + 1,
      type: phaseTemplate.type,
    });
    console.log(
      `Created phase template ${phaseTemplate.label} as ${JSON.stringify(
        newPhaseTemplate,
      )}`,
    );
    phaseTemplates.push(newPhaseTemplate);
  }

  return phaseTemplates;
}
