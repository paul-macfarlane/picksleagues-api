# Seeding Strategy

This document explains the different seeding approaches available in the PicksLeagues API and when to use each one.

## Overview

The PicksLeagues API supports two main types of seeding:

1. **Real Data Seeding** - Uses actual ESPN data via cron jobs
2. **Mock Data Seeding** - Uses generated test data for development/testing

## Real Data Seeding

### Purpose

Populates the database with actual, real-time data from ESPN APIs. This is used for production environments and when you need to work with real sports data.

### How it Works

- Calls ESPN APIs to fetch real team data, game schedules, scores, etc.
- Runs via cron jobs to keep data up-to-date

### When to Use

- **Production environments**
- **Testing with real data**
- **When you need current season information**
- **Integration testing with ESPN APIs**

### Commands

```bash
# Run the full seeding process (includes ESPN data fetching)
npm run db:seed

# Or run individual cron jobs
npm run cron:fetch-teams
npm run cron:fetch-games
npm run cron:fetch-scores
```

### Dependencies

- ESPN API credentials
- Network connectivity
- ESPN API rate limits
- Real-time data availability

## Mock Data Seeding

### Purpose

Generates realistic test data for development, testing, and demonstration purposes. This data is completely fictional but follows realistic patterns.

### How it Works

- Generates fake teams, users, leagues, games, and picks
- Uses predefined templates and randomization
- No external API dependencies
- Fast and reliable execution

### When to Use

- **Development environments**
- **Unit testing**
- **Feature development**
- **Demo environments**
- **When ESPN APIs are unavailable**
- **Testing different scenarios quickly**

### Commands

```bash
# Set up minimal base data (required for mock seeding)
npm run db:seed:base

# Run pick'em league seeding with mock data
npm run db:seed:pickem -- <phase> [options]

# Run with commissioner user
npm run db:seed:pickem -- inSeason --commissioner my-user-id --leagues 2 --users 5

# Run with cleanup for clean testing
npm run db:seed:pickem -- preseason --cleanup --commissioner my-user-id --leagues 1 --users 3

**Important**: When using npm scripts, you must use the `--` separator before your arguments to ensure they are properly passed to the CLI tool.
```

### Features

- **Season Phase Simulation**: Offseason, Preseason, In-Season, End of Season
- **Configurable Data**: League count, users per league, league types
- **Commissioner User**: Designate a specific user as commissioner of all leagues
- **Data Cleanup**: Clean up existing data before seeding for consistent scenarios
- **Realistic Patterns**: Proper game schedules, scores, pick timing
- **Fast Execution**: No API calls, instant results

## Data Types Generated

### Real Data Seeding

- **Teams**: Actual NFL teams from ESPN
- **Games**: Real game schedules and results
- **Scores**: Live and final scores from ESPN
- **Odds**: Real betting odds (if available)
- **Metadata**: Real team stats, player info, etc.

### Mock Data Seeding

- **Teams**: 12 fictional NFL teams (Lions, Bears, Eagles, etc.)
- **Users**: Generated test users with realistic names
- **Leagues**: Configurable number of ATS and Straight Up leagues
- **Phases**: 10 phases (one per week) with proper NFL week structure
- **Phase Templates**: Each phase linked to its corresponding week template (Week 1, Week 2, etc.)
- **Games**: 60 games across 10 weeks, each assigned to its corresponding week phase
- **Game Timing**: All games in a phase happen on the same day (second-to-last day of the phase)
- **Pick Lock Times**: Set to noon on the second-to-last day of each phase
- **Scores**: Generated scores based on season phase
- **Picks**: User picks based on season phase logic
- **Pick Count**: Each user makes exactly 3 picks per week (not picks for every game)
- **Pick Selection**: Randomly selects 3 games from each week's 6 available games
- **Team Selection**: Randomly picks one of the two teams actually playing in each selected game
- **Spread Handling**: For ATS leagues, picks include the correct spread for the selected team
- **Odds Generation**: Realistic NFL odds (spreads, moneylines, totals) generated for all events
- **Spread Values**: Only whole numbers or .5 (e.g., -3, -3.5, +7, +7.5)

## Season Phase Logic

### Offseason

- All games scheduled for future dates
- All picks already made
- No live games or scores

### Preseason

- Games scheduled 1-2 weeks in the future
- No picks made yet
- Leagues ready to start

### In-Season

- **Default**: Week 5 is the current active phase
- **Picks**: Made for weeks 1-4 (completed phases)
- **Current Week**: Week 5 games may be scheduled or in-progress
- **Past Weeks**: Weeks 1-4 have final scores
- **Future Weeks**: Weeks 6-10 are scheduled
- **Custom Week**: Use `--week <number>` to simulate a different current week

### End of Season

- All games have final scores
- Games happened 1-2 weeks ago
- All picks completed
- Standings finalized

## Database Schema Requirements

Both seeding approaches require the same base database schema:

### Required Tables

- `sports_leagues` - Sport league definitions (NFL)
- `seasons` - Season information
- `league_types` - League type definitions (Pick'em)
- `phase_templates` - Phase template definitions
- `teams` - Team information
- `users` - User accounts
- `profiles` - User profile information
- `leagues` - League definitions
- `league_members` - League membership
- `phases` - Season phases
- `events` - Game events
- `live_scores` - Game scores and status
- `outcomes` - Final game outcomes
- `picks` - User picks

### Base Data Requirements

- At least one sport league (NFL)
- At least one season
- At least one league type (Pick'em)
- At least one phase template

## Migration Strategy

### Development Workflow

1. **Start with mock data** for feature development
2. **Test with real data** for integration testing
3. **Use mock data** for unit tests and CI/CD

### Production Workflow

1. **Use real data seeding** for production
2. **Backup with mock data** for disaster recovery
3. **Use mock data** for staging environments

## Troubleshooting

### Real Data Seeding Issues

- **API Rate Limits**: Implement retry logic and rate limiting
- **Network Issues**: Add timeout handling and fallback options
- **Data Inconsistencies**: Validate data before insertion
- **Missing Credentials**: Ensure ESPN API keys are configured

### Mock Data Seeding Issues

- **Missing Base Data**: Run `npm run db:seed:base` first
- **Foreign Key Errors**: Check insertion order and dependencies
- **Schema Mismatches**: Ensure database is migrated to latest schema

## Best Practices

### For Development

1. Use mock data seeding for most development work
2. Only use real data when testing ESPN integrations
3. Keep mock data realistic and varied
4. Document any assumptions in the mock data

### For Testing

1. Use mock data for unit tests
2. Use real data for integration tests
3. Create specific test scenarios with mock data
4. Ensure test data is isolated and repeatable

### For Production

1. Use real data seeding for production
2. Implement proper error handling and monitoring
3. Set up automated backups
4. Monitor API rate limits and costs

## Future Enhancements

### Mock Data Improvements

- More realistic team names and locations
- Better score generation algorithms
- More varied user profiles
- Historical data simulation

### Real Data Improvements

- Multiple data source support
- Better error handling and retry logic
- Real-time data streaming
- Data validation and sanitization

### Hybrid Approach

- Combine real and mock data
- Use real teams with mock games
- Use real schedules with mock scores
- Flexible data source selection
