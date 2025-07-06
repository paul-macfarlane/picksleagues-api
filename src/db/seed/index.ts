import { db } from "..";
import { seedDataSources } from "./dataSources";
import { seedPhaseTemplates } from "./phaseTemplates";

export async function seed() {
  await db.transaction(async (tx) => {
    await seedDataSources(tx);
    await seedPhaseTemplates(tx);
  });
}

void seed();
