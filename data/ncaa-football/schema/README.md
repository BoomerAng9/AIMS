# NCAA Football Database — Schema Reference

## Core Tables

### conferences.csv
Conference-level metadata, both active and historical.

| Column | Type | Description |
|--------|------|-------------|
| conference_id | string (PK) | Unique identifier (e.g., SEC, BIG_TEN) |
| conference_name | string | Full official name |
| abbreviation | string | Common abbreviation |
| division | string | NCAA division (FBS, FCS, D2, D3) |
| subdivision | string | Current tier (Power 4, Group of 5, Independent) |
| founded_year | int | Year conference was founded |
| headquarters_city | string | HQ city |
| headquarters_state | string | HQ state |
| commissioner | string | Current or last commissioner |
| website | string | Official website |
| tier | string | power / group_of_5 / fcs / other |
| active | bool | Whether conference is currently active |

### teams.csv
School/program-level metadata for every team.

| Column | Type | Description |
|--------|------|-------------|
| team_id | string (PK) | Unique identifier (e.g., ALABAMA, OHIO_ST) |
| school_name | string | Official school name |
| mascot | string | Team mascot/nickname |
| primary_color | string | Primary team color (hex) |
| secondary_color | string | Secondary team color (hex) |
| city | string | School city |
| state | string | School state |
| current_conference_id | string (FK) | Current conference |
| stadium_id | string (FK) | Primary home stadium |
| enrollment | int | Approximate enrollment |
| founded_year | int | Year school was founded |
| football_start_year | int | First year of football program |
| division | string | Current NCAA division |
| subdivision | string | Current subdivision tier |
| ap_poll_appearances | int | All-time AP poll appearances |
| national_championships | int | Claimed national championships |
| conference_championships | int | Conference championship count |
| bowl_appearances | int | All-time bowl game appearances |
| bowl_wins | int | All-time bowl wins |
| all_time_wins | int | All-time win total |
| all_time_losses | int | All-time loss total |
| all_time_ties | int | All-time ties |
| heisman_winners | int | Number of Heisman Trophy winners |

### stadiums.csv
Stadium/venue information.

| Column | Type | Description |
|--------|------|-------------|
| stadium_id | string (PK) | Unique identifier |
| stadium_name | string | Current official name |
| city | string | Stadium city |
| state | string | Stadium state |
| capacity | int | Current seating capacity |
| surface | string | Playing surface type |
| opened_year | int | Year opened |
| renovated_year | int | Most recent major renovation |
| team_id | string (FK) | Primary occupant team |
| former_names | string | Pipe-delimited list of former names |
| elevation_ft | int | Elevation in feet |

### coaches.csv
Head coaching history per program.

| Column | Type | Description |
|--------|------|-------------|
| coach_id | string (PK) | Unique identifier |
| coach_name | string | Full name |
| team_id | string (FK) | Team coached |
| start_year | int | First year as HC |
| end_year | int | Last year as HC (null if current) |
| total_wins | int | Wins at this school |
| total_losses | int | Losses at this school |
| total_ties | int | Ties at this school |
| conference_titles | int | Conference titles won |
| national_titles | int | National titles won |
| bowl_wins | int | Bowl game wins |
| bowl_losses | int | Bowl game losses |
| is_current | bool | Whether currently the head coach |

### seasons.csv
Per-team, per-year season records.

| Column | Type | Description |
|--------|------|-------------|
| season_id | string (PK) | team_id + year composite |
| team_id | string (FK) | Team identifier |
| year | int | Season year |
| conference_id | string (FK) | Conference that season |
| overall_wins | int | Total wins |
| overall_losses | int | Total losses |
| overall_ties | int | Total ties |
| conf_wins | int | Conference wins |
| conf_losses | int | Conference losses |
| conf_ties | int | Conference ties |
| ap_preseason_rank | int | AP preseason ranking (null if unranked) |
| ap_final_rank | int | AP final ranking (null if unranked) |
| coaches_final_rank | int | Coaches poll final ranking |
| cfp_final_rank | int | CFP final ranking (2014+) |
| bowl_game | string | Bowl game name (null if none) |
| bowl_result | string | W/L/T result in bowl |
| bowl_score | string | Bowl score (e.g., "35-28") |
| conference_champion | bool | Won conference title |
| division_champion | bool | Won division title |
| national_champion | bool | Won national championship |
| head_coach | string | Head coach that season |

### games.csv
Individual game results (the big table).

| Column | Type | Description |
|--------|------|-------------|
| game_id | string (PK) | Unique game identifier |
| date | date | Game date (YYYY-MM-DD) |
| season | int | Season year |
| week | int | Week number |
| home_team_id | string (FK) | Home team |
| away_team_id | string (FK) | Away team |
| home_score | int | Home team final score |
| away_score | int | Away team final score |
| neutral_site | bool | Neutral site game |
| venue | string | Game venue/stadium |
| attendance | int | Reported attendance |
| game_type | string | regular_season / conference_championship / bowl / playoff |
| conference_game | bool | Conference matchup |
| overtime | bool | Game went to overtime |
| ot_periods | int | Number of OT periods |
| tv_network | string | Broadcast network |
| notes | string | Notable context |

### bowl_games.csv
Bowl game history.

| Column | Type | Description |
|--------|------|-------------|
| bowl_id | string (PK) | Unique identifier |
| bowl_name | string | Official bowl game name |
| season | int | Season year |
| date | date | Game date |
| city | string | Host city |
| state | string | Host state |
| stadium | string | Stadium name |
| team1_id | string (FK) | First team |
| team1_score | int | First team score |
| team2_id | string (FK) | Second team |
| team2_score | int | Second team score |
| mvp | string | Game MVP |
| attendance | int | Attendance |
| is_cfp | bool | College Football Playoff game |
| is_bcs | bool | BCS game (1998-2013) |
| is_national_championship | bool | National championship game |
| sponsor | string | Title sponsor |

### awards.csv
Individual player/coach awards.

| Column | Type | Description |
|--------|------|-------------|
| award_id | string (PK) | Unique identifier |
| award_name | string | Award name (Heisman, Biletnikoff, etc.) |
| year | int | Year awarded |
| player_name | string | Recipient name |
| team_id | string (FK) | Recipient's team |
| position | string | Player position |
| class_year | string | FR/SO/JR/SR |
| notes | string | Additional context |

### draft_picks.csv
NFL Draft history by school.

| Column | Type | Description |
|--------|------|-------------|
| pick_id | string (PK) | Unique identifier |
| year | int | Draft year |
| round | int | Draft round |
| overall_pick | int | Overall pick number |
| nfl_team | string | NFL team that drafted |
| player_name | string | Player name |
| team_id | string (FK) | College team |
| position | string | Position |
| notes | string | Additional context |

### conference_membership.csv
Historical conference realignment tracking.

| Column | Type | Description |
|--------|------|-------------|
| membership_id | string (PK) | Unique identifier |
| team_id | string (FK) | Team |
| conference_id | string (FK) | Conference |
| join_year | int | Year joined |
| leave_year | int | Year left (null if current) |
| is_current | bool | Currently a member |
| notes | string | Context for the move |

### rosters.csv
Per-team, per-year roster data.

| Column | Type | Description |
|--------|------|-------------|
| roster_id | string (PK) | Unique identifier |
| team_id | string (FK) | Team |
| season | int | Season year |
| player_name | string | Player full name |
| jersey_number | int | Jersey number |
| position | string | Position (QB, RB, WR, TE, OL, DL, LB, DB, K, P, etc.) |
| class_year | string | FR/SO/JR/SR/GR (graduate) |
| height | string | Height (e.g., "6-2") |
| weight | int | Weight in lbs |
| hometown | string | Hometown |
| home_state | string | Home state |
| high_school | string | High school name |
| stars | int | Recruiting star rating (2-5, null if unavailable) |
| redshirt | bool | Redshirt status |
| transfer | bool | Transfer student |
| transfer_from | string | Previous school if transfer |

### player_season_stats.csv
Individual player statistics per season.

| Column | Type | Description |
|--------|------|-------------|
| stat_id | string (PK) | Unique identifier |
| team_id | string (FK) | Team |
| season | int | Season year |
| player_name | string | Player full name |
| position | string | Position |
| games_played | int | Games played |
| games_started | int | Games started |
| pass_completions | int | Pass completions |
| pass_attempts | int | Pass attempts |
| pass_yards | int | Passing yards |
| pass_td | int | Passing touchdowns |
| pass_int | int | Interceptions thrown |
| rush_attempts | int | Rush attempts |
| rush_yards | int | Rushing yards |
| rush_td | int | Rushing touchdowns |
| receptions | int | Receptions |
| rec_yards | int | Receiving yards |
| rec_td | int | Receiving touchdowns |
| total_tackles | int | Total tackles |
| solo_tackles | int | Solo tackles |
| tackles_for_loss | int | Tackles for loss |
| sacks | float | Sacks |
| interceptions | int | Interceptions (defensive) |
| pass_defended | int | Passes defended |
| forced_fumbles | int | Forced fumbles |
| fumble_recoveries | int | Fumble recoveries |
| fg_made | int | Field goals made |
| fg_attempted | int | Field goals attempted |
| fg_long | int | Longest field goal |
| extra_points_made | int | Extra points made |
| extra_points_attempted | int | Extra points attempted |
| punts | int | Punts |
| punt_yards | int | Punt yards |
| punt_long | int | Longest punt |
| kick_return_yards | int | Kick return yards |
| kick_return_td | int | Kick return TDs |
| punt_return_yards | int | Punt return yards |
| punt_return_td | int | Punt return TDs |

### team_season_stats.csv
Aggregate team statistics per season.

| Column | Type | Description |
|--------|------|-------------|
| stat_id | string (PK) | Unique identifier |
| team_id | string (FK) | Team |
| season | int | Season year |
| points_scored | int | Total points scored |
| points_allowed | int | Total points allowed |
| total_offense_ypg | float | Total offense yards per game |
| rush_offense_ypg | float | Rush offense yards per game |
| pass_offense_ypg | float | Pass offense yards per game |
| total_defense_ypg | float | Total defense yards per game allowed |
| rush_defense_ypg | float | Rush defense yards per game allowed |
| pass_defense_ypg | float | Pass defense yards per game allowed |
| turnovers_gained | int | Turnovers gained |
| turnovers_lost | int | Turnovers lost |
| turnover_margin | int | Turnover margin |
| penalties | int | Total penalties |
| penalty_yards | int | Total penalty yards |
| first_downs | int | Total first downs |
| third_down_pct | float | Third down conversion pct |
| fourth_down_pct | float | Fourth down conversion pct |
| red_zone_pct | float | Red zone scoring pct |
| time_of_possession_avg | string | Avg time of possession (MM:SS) |
| sacks_made | int | Sacks recorded |
| sacks_allowed | int | Sacks allowed |

## Data Conventions
- All IDs use UPPER_SNAKE_CASE (e.g., OHIO_ST, BIG_TEN)
- Dates in ISO 8601 format (YYYY-MM-DD)
- Null values represented as empty strings in CSV
- Boolean values: true/false
- Colors in hex format (#RRGGBB)
- Scores as integers, not strings
- Conference membership tracks every move historically
