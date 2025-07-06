import { DBOrTx } from "..";
import {
  getPhaseTemplateBySportLeagueAndLabel,
  insertPhaseTemplate,
} from "../helpers/phaseTemplates";
import { getSportLeagueByName } from "../helpers/sportLeagues";
import { DBPhaseTemplate } from "../schema";

const NFL_PHASE_TEMPLATES = [
  {
    label: "Week 1",
    type: "week",
  },
  {
    label: "Week 2",
    type: "week",
  },
  {
    label: "Week 3",
    type: "week",
  },
  {
    label: "Week 4",
    type: "week",
  },
  {
    label: "Week 5",
    type: "week",
  },
  {
    label: "Week 6",
    type: "week",
  },
  {
    label: "Week 7",
    type: "week",
  },
  {
    label: "Week 8",
    type: "week",
  },
  {
    label: "Week 9",
    type: "week",
  },
  {
    label: "Week 10",
    type: "week",
  },
  {
    label: "Week 11",
    type: "week",
  },
  {
    label: "Week 12",
    type: "week",
  },
  {
    label: "Week 13",
    type: "week",
  },
  {
    label: "Week 14",
    type: "week",
  },
  {
    label: "Week 15",
    type: "week",
  },
  {
    label: "Week 16",
    type: "week",
  },
  {
    label: "Week 17",
    type: "week",
  },
  {
    label: "Week 18",
    type: "week",
  },
  {
    label: "Wild Card",
    type: "week",
  },
  {
    label: "Divisional Round",
    type: "week",
  },
  {
    label: "Conference Championship",
    type: "week",
  },
  {
    label: "Super Bowl",
    type: "week",
  },
];

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
