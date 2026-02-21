# NCAA Football Database

Internal database for NCAA football historical and reference data. Designed to be the foundation for a sports data MCP server.

## Current Coverage

### Teams (68 total)
- **SEC** (16): Alabama, Arkansas, Auburn, Florida, Georgia, Kentucky, LSU, Mississippi State, Missouri, Oklahoma, Ole Miss, South Carolina, Tennessee, Texas, Texas A&M, Vanderbilt
- **Big Ten** (18): Illinois, Indiana, Iowa, Maryland, Michigan, Michigan State, Minnesota, Nebraska, Northwestern, Ohio State, Oregon, Penn State, Purdue, Rutgers, UCLA, USC, Washington, Wisconsin
- **Big 12** (16): Arizona, Arizona State, Baylor, BYU, Cincinnati, Colorado, Houston, Iowa State, Kansas, Kansas State, Oklahoma State, TCU, Texas Tech, UCF, Utah, West Virginia
- **ACC** (17): Boston College, Cal, Clemson, Duke, Florida State, Georgia Tech, Louisville, Miami, NC State, North Carolina, Pitt, SMU, Stanford, Syracuse, Virginia, Virginia Tech, Wake Forest
- **Independent** (1): Notre Dame

### Data Files

| File | Rows | Description |
|------|------|-------------|
| `conferences.csv` | 20 | Active and historical conferences (FBS + select FCS) |
| `teams.csv` | 68 | Power 4 + Notre Dame team metadata |
| `stadiums.csv` | 68 | Stadium info for all current teams |
| `awards.csv` | 90 | Complete Heisman Trophy history (1935-2024) |
| `conference_membership.csv` | 100+ | Historical conference realignment tracking |
| `coaches.csv` | Headers only | Head coaching history (to be populated) |
| `seasons.csv` | Headers only | Per-team season records (to be populated) |
| `games.csv` | Headers only | Individual game results (to be populated) |
| `bowl_games.csv` | Headers only | Bowl game history (to be populated) |
| `draft_picks.csv` | Headers only | NFL Draft history by school (to be populated) |
| `rosters.csv` | Headers only | Per-team, per-year rosters (to be populated) |
| `player_season_stats.csv` | Headers only | Individual player stats (to be populated) |
| `team_season_stats.csv` | Headers only | Aggregate team stats (to be populated) |
| `national_championships.csv` | Headers only | Detailed championship claims (to be populated) |

### Schema Documentation
See `schema/README.md` for complete field definitions, data types, and conventions.

## Data Conventions
- Team IDs: `UPPER_SNAKE_CASE` (e.g., `OHIO_ST`, `TEXAS_AM`)
- Conference IDs: `UPPER_SNAKE_CASE` (e.g., `BIG_TEN`, `BIG_12`)
- Dates: ISO 8601 (`YYYY-MM-DD`)
- Colors: Hex format (`#RRGGBB`)
- Booleans: `true`/`false`
- Null values: empty string

## Data Sources
All data was researched and verified from:
- Official university athletics websites
- Official university brand guidelines (for colors)
- Wikipedia (cross-referenced with primary sources)
- Sports Reference / College Football Reference
- Heisman Trust official records
- NCAA official records

## Roadmap

### Phase 1 — Reference Data (Current)
- [x] Conferences (active + historical)
- [x] Teams (Power 4 + Notre Dame)
- [x] Stadiums
- [x] Awards (Heisman Trophy complete history)
- [x] Conference membership history / realignment
- [ ] Coaches (head coaching histories)
- [ ] National championships (detailed with selectors)

### Phase 2 — Historical Season Data
- [ ] Season records (team-by-team, going back as far as possible)
- [ ] Bowl game history
- [ ] NFL Draft picks by school

### Phase 3 — Game-Level Data
- [ ] Individual game results
- [ ] Rosters
- [ ] Player season statistics
- [ ] Team season statistics

### Phase 4 — Expansion
- [ ] Group of 5 conferences (AAC, Sun Belt, Mountain West, MAC, C-USA)
- [ ] FBS Independents (Army, Navy, UConn, UMass)
- [ ] FCS programs
- [ ] Division II / Division III

### Phase 5 — MCP Server
- [ ] Build MCP server to query this data
- [ ] API endpoints for team lookups, historical comparisons, stats queries
- [ ] Integration with AIMS platform
