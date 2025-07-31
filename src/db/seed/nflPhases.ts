import { PhasesMutationService } from "../../features/phases/phases.mutation.service.js";
import { PhasesQueryService } from "../../features/phases/phases.query.service.js";
import { SeasonsUtilService } from "../../features/seasons/seasons.util.service.js";
import { SportLeaguesQueryService } from "../../features/sportLeagues/sportLeagues.query.service.js";
import { SPORT_LEAGUE_NAMES } from "../../features/sportLeagues/sportLeagues.types.js";
import { db, DBOrTx } from "../index.js";
import { fromZonedTime, toZonedTime } from "date-fns-tz";

/**
 * NFL phase seeding configuration
 * Phases start Tuesday at 2AM ET and end Tuesday at 1:59AM ET
 */
const NFL_PHASE_CONFIG = {
  startDayOfWeek: 2, // Tuesday (0 = Sunday, 1 = Monday, 2 = Tuesday)
  startHour: 2, // 2AM ET
  startMinute: 0,
  endHour: 1, // 1:59AM ET
  endMinute: 59,
  timezone: "America/New_York" as const,
};

/**
 * Calculate the start date for a phase based on the original phase start date
 * @param originalStartDate - The original start date (from ESPN or previous seeding)
 * @returns Date object representing the adjusted phase start date (Tuesday 2AM ET)
 */
function calculatePhaseStartDate(originalStartDate: Date): Date {
  const startDate = new Date(originalStartDate);

  // Find the Tuesday of the week containing the original start date
  // We want to find the Tuesday of the current week, not the next week
  const currentDayOfWeek = startDate.getDay();
  let daysToTuesday;

  if (currentDayOfWeek === NFL_PHASE_CONFIG.startDayOfWeek) {
    // Already Tuesday - no change needed
    daysToTuesday = 0;
  } else if (currentDayOfWeek < NFL_PHASE_CONFIG.startDayOfWeek) {
    // Monday (1) - go forward 1 day to Tuesday
    daysToTuesday = NFL_PHASE_CONFIG.startDayOfWeek - currentDayOfWeek;
  } else {
    // Wednesday (3) through Sunday (0) - go back to Tuesday
    daysToTuesday = NFL_PHASE_CONFIG.startDayOfWeek - currentDayOfWeek;
  }

  const tuesdayOfWeek = new Date(startDate);
  tuesdayOfWeek.setDate(startDate.getDate() + daysToTuesday);

  // Set to 2AM ET
  const easternTime = toZonedTime(tuesdayOfWeek, NFL_PHASE_CONFIG.timezone);
  easternTime.setHours(
    NFL_PHASE_CONFIG.startHour,
    NFL_PHASE_CONFIG.startMinute,
    0,
    0,
  );

  // Convert back to UTC for storage
  return fromZonedTime(easternTime, NFL_PHASE_CONFIG.timezone);
}

/**
 * Calculate the end date for a phase (next Tuesday at 1:59AM ET)
 * @param startDate - The phase start date
 * @returns Date object representing the phase end date
 */
function calculatePhaseEndDate(startDate: Date): Date {
  const endDate = new Date(startDate);
  endDate.setDate(endDate.getDate() + 7); // Next Tuesday

  // Set to 1:59AM ET
  const easternTime = toZonedTime(endDate, NFL_PHASE_CONFIG.timezone);
  easternTime.setHours(
    NFL_PHASE_CONFIG.endHour,
    NFL_PHASE_CONFIG.endMinute,
    0,
    0,
  );

  // Convert back to UTC for storage
  return fromZonedTime(easternTime, NFL_PHASE_CONFIG.timezone);
}

/**
 * Calculate pick lock time for a phase
 * For NFL phases, pick lock is typically Sunday at 1PM ET
 * @param startDate - The phase start date
 * @returns Date object representing the pick lock time
 */
function calculatePickLockTime(startDate: Date): Date {
  const startDateObj = new Date(startDate);

  // Find the next Sunday after the start date
  const daysUntilSunday = (0 - startDateObj.getDay() + 7) % 7;
  const sundayDate = new Date(startDateObj);
  sundayDate.setDate(startDateObj.getDate() + daysUntilSunday);

  // Set to 1PM Eastern Time
  const easternTime = toZonedTime(sundayDate, NFL_PHASE_CONFIG.timezone);
  easternTime.setHours(13, 0, 0, 0); // 1PM ET

  // Convert back to UTC for storage
  return fromZonedTime(easternTime, NFL_PHASE_CONFIG.timezone);
}

export async function seedNflPhases(
  phasesMutationService: PhasesMutationService,
  phasesQueryService: PhasesQueryService,
  seasonsUtilService: SeasonsUtilService,
  sportLeaguesQueryService: SportLeaguesQueryService,
  dbOrTx: DBOrTx = db,
): Promise<void> {
  // Find NFL sport league
  const nflSportLeague = await sportLeaguesQueryService.findByName(
    SPORT_LEAGUE_NAMES.NFL,
    dbOrTx,
  );
  if (!nflSportLeague) {
    console.warn("NFL sport league not found, skipping NFL phases seeding");
    return;
  }

  // Find current or next NFL season
  const season =
    await seasonsUtilService.findCurrentOrLatestSeasonForSportLeagueId(
      nflSportLeague.id,
      dbOrTx,
    );
  if (!season) {
    console.warn(
      "No current or next NFL season found, skipping NFL phases seeding",
    );
    return;
  }

  console.log(
    `Found NFL season: ${season.name} (${season.startDate.toDateString()} - ${season.endDate.toDateString()})`,
  );

  // Get existing phases for this season
  const existingPhases = await phasesQueryService.listBySeasonIds(
    [season.id],
    dbOrTx,
  );
  if (existingPhases.length === 0) {
    console.warn(
      "No existing phases found for NFL season, skipping NFL phases seeding",
    );
    return;
  }

  console.log(`Found ${existingPhases.length} existing phases for NFL season`);

  // Update each existing phase to use Tuesday 2AM ET start times
  for (const phase of existingPhases) {
    // Calculate new start date (Tuesday 2AM ET of the week containing the original start date)
    const newStartDate = calculatePhaseStartDate(phase.startDate);
    const newEndDate = calculatePhaseEndDate(newStartDate);
    const newPickLockTime = calculatePickLockTime(newStartDate);

    // Update the phase
    await phasesMutationService.update(
      phase.id,
      {
        startDate: newStartDate,
        endDate: newEndDate,
        pickLockTime: newPickLockTime,
      },
      dbOrTx,
    );

    console.log(
      `Updated phase ${phase.sequence}: ${newStartDate.toISOString()} to ${newEndDate.toISOString()} (pick lock: ${newPickLockTime.toISOString()})`,
    );
  }

  console.log("NFL phases seeding completed successfully");
}
