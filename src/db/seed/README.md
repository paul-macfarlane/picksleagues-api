# 🏈 Pick'em Leagues Seeding Tool

This tool creates realistic test data for Pick'em leagues across different phases of a football season. It's designed to help you test your application with various scenarios.

> **📖 For a complete overview of seeding strategies, see [SEEDING_STRATEGY.md](./SEEDING_STRATEGY.md)**

## Types of Seeding

This project supports two different seeding approaches:

### 🎯 Mock Data Seeding (This Tool)

- **Purpose**: Generate fictional test data for development and testing
- **Data Source**: Completely generated/mock data
- **Use Case**: Development, unit testing, feature development, demos
- **Speed**: Fast, no external dependencies
- **Command**: `npm run db:seed:pickem`

### 🌐 Real Data Seeding (ESPN Integration)

- **Purpose**: Populate database with actual ESPN data
- **Data Source**: ESPN APIs via cron jobs
- **Use Case**: Production, integration testing, real data scenarios
- **Speed**: Slower, depends on ESPN API availability
- **Command**: `npm run db:seed`

**Choose mock data seeding for most development work. Use real data seeding only when you need to test with actual ESPN data.**

> **💡 Tip**: If you see npm warnings about argument parsing, you can also run the CLI directly: `npx tsx src/db/seed/pickemLeagues.cli.ts <phase> [options]`

## 🧹 Data Cleanup Feature

The seeding tool supports cleaning up existing pick'em data before seeding new data. This ensures a clean slate for each scenario and prevents data conflicts.

### Usage

```bash
# Clean up existing data and seed new preseason data
npm run db:seed:pickem preseason -- --cleanup --leagues 2 --users 5

# Clean up and seed with commissioner user
npm run db:seed:pickem -- inSeason --cleanup --commissioner my-user --leagues 1 --users 3
```

### What Gets Cleaned Up

The cleanup process removes all pick'em related data in the correct order:

1. **Picks** (depends on users, events, teams, leagues)
2. **Live Scores & Outcomes** (depend on events)
3. **Events** (depend on phases, teams)
4. **League Members** (depend on leagues, users)
5. **Leagues** (depend on league types, phase templates)
6. **Phases** (depend on seasons, phase templates)
7. **Teams** (depend on sport leagues)
8. **Users** (preserves commissioner if specified)

### Commissioner User Preservation

When using `--cleanup` with `--commissioner`, the cleanup process will:

- Delete all other users
- Preserve the specified commissioner user
- Reuse the existing commissioner user for the new leagues

This allows you to maintain a consistent test user across different scenarios.

## 👑 Commissioner User Feature

The seeding tool supports designating a specific user as the commissioner of all generated leagues. This is useful for testing purposes, allowing you to log in with a known user ID and see all the seeded data.

### Usage

```bash
# Make user "my-test-user" the commissioner of all leagues
npm run db:seed:pickem -- inSeason --commissioner my-test-user --leagues 2 --users 5

# Use an existing user ID from your database
npm run db:seed:pickem -- preseason --commissioner existing-user-123 --leagues 1 --users 3
```

### How it Works

- **New User**: If the commissioner user ID doesn't exist, a new user will be created with that ID
- **Existing User**: If the commissioner user ID already exists, it will be used as-is (no duplicate creation)
- **Commissioner Role**: The specified user becomes the commissioner of ALL generated leagues
- **User Count**: The commissioner user counts toward the total users per league

## 🎯 Features

- **4 Season Phases**: Offseason, Preseason, In-Season, End of Season
- **Realistic Data**: 12 teams, 60 games (6 per week × 10 weeks), users, leagues, picks
- **Flexible Configuration**: Customize league count, users per league, week simulation
- **League Types**: Support for both ATS (Against The Spread) and Straight Up leagues
- **Dynamic Game States**: Games are scheduled, in-progress, or final based on phase

## 🚀 Quick Start

### Basic Usage

```bash
# Seed offseason data (completed season)
npm run db:seed:pickem -- offseason

# Seed preseason data (upcoming season)
npm run db:seed:pickem -- preseason

# Seed in-season data (week 5 of current season)
npm run db:seed:pickem -- inSeason

# Seed end-of-season data (just finished)
npm run db:seed:pickem -- endSeason
```

### Advanced Usage

```bash
# Custom week simulation (in-season only)
npm run db:seed:pickem -- inSeason --week 3

# Multiple leagues with custom user count
npm run db:seed:pickem -- inSeason --leagues 4 --users 8

# Specific league types
npm run db:seed:pickem -- preseason --ats --straight-up

# Combine options
npm run db:seed:pickem -- inSeason --week 7 --leagues 3 --users 12 --ats
```

## 📊 Data Generated

### Teams (12 total)

- Detroit Lions, Chicago Bears, Philadelphia Eagles, etc.
- Each team has proper location and abbreviation

### Phases (10 total)

- One phase per week (Week 1 through Week 10)
- Each phase represents a single NFL week
- Each phase is linked to its corresponding phase template (Week 1, Week 2, etc.)
- **Pick lock time**: Set to noon on the second-to-last day of each phase
- Proper start/end dates (7 days per phase)
- Sequential numbering (1-10)

### Games (60 total)

- 6 games per week × 10 weeks
- Each game is assigned to its corresponding week phase
- **All games in a phase happen on the same day** (second-to-last day of the phase)
- Games are scheduled at 12 PM, 1 PM, 2 PM, etc. on that day
- Realistic scheduling (no team plays twice in same week)
- Dynamic start times based on phase

### Users & Leagues

- Configurable number of users per league
- Mix of ATS and Straight Up leagues
- League settings follow `PickEmLeagueSettingsSchema`:
  - `picksPerPhase`: Number of picks per week (default: 3)
  - `pickType`: Either "spread" (ATS) or "straight-up"
- League members with proper roles (commissioner/member)

### Picks & Results

- Picks generated based on phase and week
- Realistic scores for completed games
- Live scores for in-progress games

## 🎭 Season Phases

### Offseason

- All games marked as `final` with scores
- Games happened 3-4 months ago
- All picks completed
- Archived leagues with full results

### Preseason

- All games `scheduled` for 1-2 weeks from now
- No picks made yet
- Leagues ready to start soon

### In-Season

- Current week games may be `scheduled` or `in_progress`
- Past weeks have `final` scores
- Future weeks are `scheduled`
- Picks made up to current week

### End of Season

- All games `final` with scores
- Games happened 1-2 weeks ago
- All picks completed
- Standings finalized

## ⚙️ Configuration Options

| Option           | Description                                   | Default  | Example                  |
| ---------------- | --------------------------------------------- | -------- | ------------------------ |
| `phase`          | Season phase                                  | Required | `inSeason`               |
| `--week`         | Simulate specific week (in-season only)       | 5        | `--week 3`               |
| `--leagues`      | Number of leagues to create                   | 2        | `--leagues 4`            |
| `--users`        | Users per league                              | 10       | `--users 8`              |
| `--ats`          | Include ATS leagues                           | true     | `--ats`                  |
| `--straight-up`  | Include Straight Up leagues                   | true     | `--straight-up`          |
| `--commissioner` | User ID to make commissioner of all leagues   | None     | `--commissioner user123` |
| `--cleanup`      | Clean up existing pick'em data before seeding | false    | `--cleanup`              |

## 🔧 Prerequisites

Before running the **mock data seeding tool**, ensure you have:

1. **Database setup**: Run migrations first

   ```bash
   npm run db:migrate
   ```

2. **Required base data**: The tool needs:
   - League types (Pick'em)
   - Sport leagues (NFL)
   - Seasons
   - Phase templates

### Setting up Base Data

If you encounter "Required base data not found" errors, you can set up minimal base data using:

```bash
npm run db:seed:base
```

This will create the minimum required data for the pick'em seeding to work.

### Alternative: Real Data Seeding

If you want to use real ESPN data instead of mock data:

```bash
npm run db:seed
```

**Note**:

- The real data seeding requires ESPN API credentials and may fail if dependencies are missing
- For development and testing, the mock data approach (`npm run db:seed:base` + `npm run db:seed:pickem`) is recommended
- See [SEEDING_STRATEGY.md](./SEEDING_STRATEGY.md) for detailed comparison

## 📝 Example Output

```
🎯 Seeding configuration: {
  phase: "inSeason",
  simulateWeek: 5,
  leagueCount: 2,
  usersPerLeague: 10,
  includeATS: true,
  includeStraightUp: true
}

🌱 Seeding Pick'em leagues for phase: inSeason
📊 Generated 12 teams
👥 Generated 20 users
🏈 Generated 60 games across 10 weeks
✅ Seeding completed successfully!
📈 Created 2 leagues with 20 users
🏈 Generated 60 events with 1200 picks

📊 Seeding Summary:
👥 Users: 20
🏈 Teams: 12
🏆 Leagues: 2
⚽ Events: 60

🏆 Created Leagues:
  1. inSeason League 1 (ATS)
  2. inSeason League 2 (Straight Up)

👥 Sample Users:
  1. Test User 1 (user1@test.com)
  2. Test User 2 (user2@test.com)
  3. Test User 3 (user3@test.com)
  4. Test User 4 (user4@test.com)
  5. Test User 5 (user5@test.com)

🏈 Sample Events (Week 1):
  1. Team 3 (Eagles) @ Team 1 (Lions)
  2. Team 5 (Ravens) @ Team 2 (Bears)
  3. Team 7 (Panthers) @ Team 4 (Falcons)
```

## 🚀 Quick Reference

### Which Seeding Approach Should I Use?

| Scenario                 | Use This  | Command                                                        |
| ------------------------ | --------- | -------------------------------------------------------------- |
| **Development/Testing**  | Mock Data | `npm run db:seed:base` then `npm run db:seed:pickem`           |
| **Production/Real Data** | Real Data | `npm run db:seed`                                              |
| **Quick Demo**           | Mock Data | `npm run db:seed:base` then `npm run db:seed:pickem preseason` |
| **Integration Testing**  | Real Data | `npm run db:seed`                                              |
| **Unit Testing**         | Mock Data | `npm run db:seed:pickem offseason`                             |

### Common Workflows

**For New Developers:**

```bash
npm run db:migrate
npm run db:seed:base
npm run db:seed:pickem -- inSeason --leagues 2 --users 5
```

**For Feature Development:**

```bash
npm run db:seed:pickem -- preseason --leagues 1 --users 3
```

**For Testing with Known User:**

```bash
npm run db:seed:pickem -- inSeason --commissioner my-test-user --leagues 2 --users 5
```

**For Clean Testing (Recommended):**

```bash
npm run db:seed:pickem -- preseason --cleanup --commissioner my-test-user --leagues 1 --users 3
```

**Important**: When using npm scripts, you must use the `--` separator before your arguments to ensure they are properly passed to the CLI tool.

**For Production Setup:**

```bash
npm run db:migrate
npm run db:seed  # Requires ESPN API credentials
```

## 🐛 Troubleshooting

### "Required base data not found"

For mock data seeding, run:

```bash
npm run db:seed:base
```

For real data seeding, run:

```bash
npm run db:seed
```

### Database connection issues

Ensure your database is running and environment variables are set correctly.

### Type errors

Make sure you're using the latest version of the codebase and all dependencies are installed.

## 🤝 Contributing

To add new seeding scenarios or modify existing ones:

1. Edit `src/db/seed/pickemLeagues.ts`
2. Update the CLI options in `src/db/seed/pickemLeagues.cli.ts`
3. Test with different configurations
4. Update this README if needed

## 📚 Related Files

- `src/db/seed/pickemLeagues.ts` - Main seeding logic
- `src/db/seed/pickemLeagues.cli.ts` - CLI interface
- `src/db/seed/minimalBaseData.ts` - Minimal base data setup
- `SEEDING_STRATEGY.md` - Complete seeding strategy documentation
- `SEEDING.md` - Original seeding plan
- `src/db/schema.ts` - Database schema
