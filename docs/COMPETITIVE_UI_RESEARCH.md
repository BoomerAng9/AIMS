# Per|Form Competitive UI Research
## Sports Data Platform Analysis — Feb 2025

---

## 1. ESPN

### What They Do Well
- **Cross-platform visual consistency** — unified branding across TV, streaming, social, and digital
- **Fantasy integration** — deep stat overlays, projected arrows, FAAB bids
- **ESPN Analytics models** — NBA/NFL draft models, schedule analysis, visual representations
- **IBM Watson partnership** — AI-generated billions of fantasy insights combining expert opinions, injury reports, stats

### What Users Hate (Reddit Feedback)
- "One of the worst redesigns ever" — excessive scrolling for stats, oversized fonts
- Clunky UX, crashes, slow loading
- **Only shows betting lines and injury reports** — lacks detailed in-game stats
- Unskippable ads before replays
- Users switching to Sleeper, Fantrax for fantasy
- $30/mo deemed "ridiculous"

### Design Takeaway for Per|Form
> **DO**: Bold broadcast-style stat cards, cross-platform consistency
> **DON'T**: Bury stats behind scroll, oversized fonts, ad-heavy UI

---

## 2. On3

### What They Do Well
- **NIL Valuation algorithm** — proprietary, dynamically updated weekly
- Combines "Roster Value" (school/collective compensation) + "NIL Value" (market licensing/sponsorship)
- **Industry Comparison tool** — view rankings across multiple major sites side-by-side
- Dedicated NIL news section
- **Athlete Network** — athletes claim profiles, track deals, understand value drivers
- Social media follower counts integrated into valuation
- Filterable by sport, position, state, transfer portal

### What Users Hate
- Mobile app freezes, page loading failures
- Ads despite $100+/year subscription
- Support ticket submission broken
- In-app purchase problems

### Design Takeaway for Per|Form
> **DO**: NIL valuation display, industry comparison tool, claimable athlete profiles
> **DON'T**: Break mobile, show ads to paying subscribers

---

## 3. MaxPreps

### What They Do Well
- **Comprehensive athlete profiles** — bio, photos, videos, game-by-game stats, career stats
- **Multi-sport integration** — single career page across all sports
- Career timeline/activity feed with articles, galleries, awards
- Academic info (GPA, classes) for recruiting
- Club team affiliations
- "Claim" and "Follow" CTAs
- Left-nav tabbed editing for profile management

### What Users Want More Of
- Better highlight reel integration
- More detailed stat breakdowns
- Easier profile claiming process

### Design Takeaway for Per|Form
> **DO**: Multi-sport career pages, timeline feeds, academic + athletic data blend
> **DON'T**: Make profiles hard to claim or edit

---

## 4. 247Sports

### What They Do Well
- **Star rating system** (5-star, 4-star, etc.) — universally understood
- **Composite rating** — aggregates rankings from multiple services
- **Crystal Ball** predictions — easier to follow than On3's prediction machine
- National, positional, and state rankings (multi-axis)
- Historical ranking progression tracking
- Commitment status and offer lists

### What Users Hate
- Website quality has "tanked" — broken threads, unreliable notifications
- Mobile app rated 1.7/5 on iOS (wrong sport content!)
- "Predatory" subscription/cancellation policies
- Drop-down menus break with ad blockers

### Design Takeaway for Per|Form
> **DO**: Star ratings, composite scores, Crystal Ball-style predictions, multi-axis rankings
> **DON'T**: Neglect mobile, use predatory billing, let basic site features break

---

## 5. PFF (Pro Football Focus)

### What They Do Well
- **Grades every player on every play** — 0-100 scale from -2 to +2 per snap
- **Facet grades** — passing, rushing, receiving, run blocking, pass-rushing, coverage
- **200+ data fields per play** — deepest analytical layer in football
- Historical data back to 2006 (NFL), 2014 (college)
- In-Game Grading — real-time grades during live games
- Filterable by position, team, week, situational aspects
- Premium Stats platform for power users

### What Users Hate
- Grading is **subjective** — analysts don't know play calls or assignments
- "Pushes narratives" — grade adjustments to fit storylines
- QB grading scale is "broken" and inconsistent
- NFL scouts/coaches say PFF grades are "meaningless" vs internal evals
- Data accessibility — users want downloadable play-by-play data

### Design Takeaway for Per|Form
> **DO**: Granular grading scales, facet breakdowns, situational filters, historical depth
> **DON'T**: Present subjective grades as objective truth, lock data behind opaque walls

---

## 6. The Athletic

### What They Do Well
- **Deepest editorial layer** — real journalism, no clickbait
- Ad-free reading experience (historically)
- **Player Roles analysis** — categorizes players beyond traditional positions based on statistical output and playing style
- Sleek, reader-focused, personalized UI
- Team-specific content feeds
- Constructive comment sections
- Live scores + in-depth reporting paired together
- Podcast integration per team

### What Users Love (Reddit)
- "Reminds me of real journalism"
- Best comment sections in sports media
- Following multiple teams is seamless
- In-depth analysis unmatched

### What Users Dislike
- Mobile app "dire" since NYT acquisition
- Podcast UI is "awful"
- No comment notifications
- Price vs value debate at full cost

### Design Takeaway for Per|Form
> **DO**: Deep editorial + data fusion, player role categorization, clean personalized feeds, constructive community
> **DON'T**: Let acquisition/migration break UX, neglect podcast/audio experience

---

## SYNTHESIS: What Per|Form Should Be

### Core Principles (Derived from Market Research)
1. **Data Depth without Clutter** — PFF-level granularity, ESPN-level visual clarity
2. **NIL + Performance Fusion** — On3's valuation engine meets PFF's grading system
3. **Multi-Axis Athlete Profiles** — MaxPreps career pages + 247's composite ratings + The Athletic's role analysis
4. **Mobile-First, Always** — every competitor fails here; this is the biggest opportunity
5. **Editorial + Data Storytelling** — The Athletic's journalism depth applied to data visualization
6. **Transparency** — show methodology, let users download data, avoid "narrative pushing"
7. **Clean, Ad-Minimal Experience** — users will PAY to avoid ads; respect that

### UI Patterns to Implement
| Feature | Inspired By | Per|Form Version |
|---------|------------|-----------------|
| Star Rating + Composite Score | 247Sports | Multi-source composite with transparency |
| NIL Valuation Badge | On3 | Integrated into athlete card header |
| Facet Grades (radar chart) | PFF | Visual radar for passing/rushing/blocking/etc. |
| Career Timeline | MaxPreps | Interactive scrollable timeline with stats + media |
| Player Role Tags | The Athletic | AI-generated role classification badges |
| Stat Cards (broadcast style) | ESPN/Fox | Bold, high-contrast data blocks |
| Industry Comparison | On3 | Side-by-side ranking comparison tool |
| Game Log Table | PFF/ESPN | Sortable, filterable per-game stats |
| Prediction Engine | 247 Crystal Ball | AI-powered draft/transfer predictions |

### Color & Design Direction
- **Light mode primary** (requested by user — no dark CSS)
- Bold sport-specific accent colors (crimson, navy, forest green)
- Large, confident typography (condensed sans-serif for stats)
- Clean white/light grey backgrounds
- Data-dense but visually organized (grid-based, card-based)
- Magazine-editorial polish (The Athletic influence)
