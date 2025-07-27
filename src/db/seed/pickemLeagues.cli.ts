#!/usr/bin/env node

import { db } from "../index.js";
import { seedPickemLeagues, type SeedingPhase } from "./pickemLeagues.js";

const phases: SeedingPhase[] = [
  "offseason",
  "preseason",
  "inSeason",
  "endSeason",
];

function printUsage() {
  console.log(`
🌱 Pick'em Leagues Seeding Tool

Usage: npm run seed:pickem [phase] [options]

Phases:
  ${phases.map((p) => `  ${p}`).join("\n")}

Options:
  --week <number>     Simulate specific week (for inSeason only, default: 5)
  --leagues <number>  Number of leagues to create (default: 2)
  --users <number>    Users per league (default: 10)
  --ats              Include ATS leagues
  --straight-up      Include straight up leagues
  --commissioner <id> User ID to make commissioner of all leagues
  --cleanup          Clean up existing pick'em data before seeding
  --help             Show this help

Examples:
  npm run seed:pickem offseason
  npm run seed:pickem inSeason --week 3 --leagues 4 --users 8
  npm run seed:pickem preseason --ats --straight-up
  npm run seed:pickem inSeason --commissioner user123 --leagues 2 --users 5
  npm run seed:pickem preseason --cleanup --leagues 1 --users 3
`);
}

async function main() {
  const args = process.argv.slice(2);

  if (args.includes("--help") || args.includes("-h")) {
    printUsage();
    process.exit(0);
  }

  const phase = args[0] as SeedingPhase;

  if (!phase || !phases.includes(phase)) {
    console.error(
      "❌ Invalid or missing phase. Please specify one of:",
      phases.join(", "),
    );
    printUsage();
    process.exit(1);
  }

  // Parse options
  const weekIndex = args.indexOf("--week");
  const simulateWeek =
    weekIndex !== -1 ? parseInt(args[weekIndex + 1]) : undefined;

  const leaguesIndex = args.indexOf("--leagues");
  const leagueCount =
    leaguesIndex !== -1 ? parseInt(args[leaguesIndex + 1]) : 2;

  const usersIndex = args.indexOf("--users");
  const usersPerLeague =
    usersIndex !== -1 ? parseInt(args[usersIndex + 1]) : 10;

  const includeATS = args.includes("--ats");
  const includeStraightUp = args.includes("--straight-up");

  // Parse commissioner user ID
  const commissionerIndex = args.indexOf("--commissioner");
  const commissionerUserId =
    commissionerIndex !== -1 ? args[commissionerIndex + 1] : undefined;

  // Parse cleanup flag
  const cleanup = args.includes("--cleanup");

  // Default to both if neither specified
  const finalIncludeATS = includeATS || (!includeATS && !includeStraightUp);
  const finalIncludeStraightUp =
    includeStraightUp || (!includeATS && !includeStraightUp);

  const config = {
    phase,
    simulateWeek,
    leagueCount,
    usersPerLeague,
    includeATS: finalIncludeATS,
    includeStraightUp: finalIncludeStraightUp,
    commissionerUserId,
    cleanup,
  };

  console.log("🎯 Seeding configuration:", config);

  try {
    await db.transaction(async (tx) => {
      const result = await seedPickemLeagues(tx, config);

      console.log("\n📊 Seeding Summary:");
      console.log(`👥 Users: ${result.users.length}`);
      console.log(`🏈 Teams: ${result.teams.length}`);
      console.log(`📅 Phases: ${result.phases.length}`);
      console.log(`🏆 Leagues: ${result.leagues.length}`);
      console.log(`⚽ Events: ${result.events.length}`);

      console.log("\n📅 Created Phases:");
      result.phases.forEach((phase, index) => {
        console.log(
          `  ${index + 1}. Week ${phase.sequence} (${phase.startDate.toLocaleDateString()} - ${phase.endDate.toLocaleDateString()})`,
        );
      });

      console.log("\n🏆 Created Leagues:");
      result.leagues.forEach((league, index) => {
        console.log(`  ${index + 1}. ${league.name} (${league.type})`);
      });

      console.log("\n👥 Sample Users:");
      result.users.slice(0, 5).forEach((user, index) => {
        console.log(`  ${index + 1}. ${user.name} (${user.email})`);
      });

      // Show commissioner user if specified
      if (config.commissionerUserId) {
        const commissioner = result.users.find(
          (u) => u.id === config.commissionerUserId,
        );
        if (commissioner) {
          console.log(
            `  👑 Commissioner: ${commissioner.name} (${commissioner.email})`,
          );
        }
      }

      console.log("\n🏈 Sample Events (Week 1):");
      result.events
        .filter((e) => e.week === 1)
        .slice(0, 3)
        .forEach((event, index) => {
          console.log(`  ${index + 1}. ${event.awayTeam} @ ${event.homeTeam}`);
        });
    });
  } catch (error) {
    console.error("❌ Seeding failed:", error);
    process.exit(1);
  }
}

main().catch((error) => {
  console.error("❌ Unexpected error:", error);
  process.exit(1);
});
