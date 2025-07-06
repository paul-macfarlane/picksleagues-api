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
    sequence: 1,
    type: "week",
  },
  {
    label: "Week 2",
    sequence: 2,
    type: "week",
  },
  {
    label: "Week 3",
    sequence: 3,
    type: "week",
  },
  {
    label: "Week 4",
    sequence: 4,
    type: "week",
  },
  {
    label: "Week 5",
    sequence: 5,
    type: "week",
  },
  {
    label: "Week 6",
    sequence: 6,
    type: "week",
  },
  {
    label: "Week 7",
    sequence: 7,
    type: "week",
  },
  {
    label: "Week 8",
    sequence: 8,
    type: "week",
  },
  {
    label: "Week 9",
    sequence: 9,
    type: "week",
  },
  {
    label: "Week 10",
    sequence: 10,
    type: "week",
  },
  {
    label: "Week 11",
    sequence: 11,
    type: "week",
  },
  {
    label: "Week 12",
    sequence: 12,
    type: "week",
  },
  {
    label: "Week 13",
    sequence: 13,
    type: "week",
  },
  {
    label: "Week 14",
    sequence: 14,
    type: "week",
  },
  {
    label: "Week 15",
    sequence: 15,
    type: "week",
  },
  {
    label: "Week 16",
    sequence: 16,
    type: "week",
  },
  {
    label: "Week 17",
    sequence: 17,
    type: "week",
  },
  {
    label: "Week 18",
    sequence: 18,
    type: "week",
  },
  {
    label: "Wild Card",
    sequence: 19,
    type: "week",
  },
  {
    label: "Divisional",
    sequence: 20,
    type: "week",
  },
  {
    label: "Conference Championship",
    sequence: 21,
    type: "week",
  },
  {
    label: "Super Bowl",
    sequence: 22,
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
  for (const phaseTemplate of NFL_PHASE_TEMPLATES) {
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
      sequence: phaseTemplate.sequence,
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
