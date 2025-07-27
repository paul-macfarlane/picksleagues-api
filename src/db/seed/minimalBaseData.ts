import { db } from "../index.js";
import {
  leagueTypesTable,
  sportsLeaguesTable,
  seasonsTable,
  phaseTemplatesTable,
} from "../schema.js";
import {
  LEAGUE_TYPE_NAMES,
  LEAGUE_TYPE_SLUGS,
} from "../../features/leagueTypes/leagueTypes.types.js";
import { PHASE_TEMPLATE_TYPES } from "../../features/phaseTemplates/phaseTemplates.types.js";
import { randomUUID } from "crypto";

export async function insertMinimalBaseData() {
  console.log("🔧 Inserting minimal base data...");

  await db.transaction(async (tx) => {
    // Clean up existing data first
    console.log("🧹 Cleaning up existing base data...");
    await tx.delete(phaseTemplatesTable);
    await tx.delete(leagueTypesTable);
    await tx.delete(seasonsTable);
    await tx.delete(sportsLeaguesTable);
    console.log("✅ Cleanup completed!");
    // Insert sport league (NFL)
    const sportLeagueId = randomUUID();
    await tx.insert(sportsLeaguesTable).values({
      id: sportLeagueId,
      name: "NFL",
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    // Insert season
    const seasonId = randomUUID();
    await tx.insert(seasonsTable).values({
      id: seasonId,
      name: "2024 NFL Season",
      year: "2024",
      sportLeagueId: sportLeagueId,
    });

    // Insert league type
    const leagueTypeId = randomUUID();
    await tx.insert(leagueTypesTable).values({
      id: leagueTypeId,
      name: LEAGUE_TYPE_NAMES.PICK_EM,
      slug: LEAGUE_TYPE_SLUGS.PICK_EM,
      description: "Standard pick'em league",
      sportLeagueId: sportLeagueId,
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    // Insert phase templates for each week (Week 1 through Week 10)
    const phaseTemplateIds = [];
    for (let week = 1; week <= 10; week++) {
      const phaseTemplateId = randomUUID();
      await tx.insert(phaseTemplatesTable).values({
        id: phaseTemplateId,
        label: `Week ${week}`,
        sportLeagueId: sportLeagueId,
        sequence: week,
        type: PHASE_TEMPLATE_TYPES.WEEK,
        createdAt: new Date(),
        updatedAt: new Date(),
      });
      phaseTemplateIds.push(phaseTemplateId);
    }

    console.log("✅ Minimal base data inserted successfully!");
  });
}

// Run if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  insertMinimalBaseData()
    .then(() => {
      console.log("🎉 Base data setup complete!");
      process.exit(0);
    })
    .catch((error) => {
      console.error("❌ Failed to insert base data:", error);
      process.exit(1);
    });
}
