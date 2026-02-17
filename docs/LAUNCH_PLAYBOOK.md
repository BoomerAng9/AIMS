# A.I.M.S. Launch Playbook — How the Pros Do It

> Experienced companies follow a phased approach to launch. Here's the playbook.

---

## Phase 1 — Build (where we are)

| Milestone | Status | Notes |
|---|---|---|
| Core product functional and tested | In progress | Frontend (Next.js 15), UEF Gateway, ACHEEVY orchestrator, Boomer\_Ang agents |
| Internal QA / dogfooding | In progress | Security audit complete (Feb 2026), middleware hardened, rate limiting live |
| Private beta with 5–20 users | Not started | Target: invite-only access via `plugmein.cloud` with existing auth flow |

### What "done" looks like for Phase 1

- All critical paths work end-to-end: sign up, chat with ACHEEVY, deploy a Boomer\_Ang, view dashboard
- No P0 bugs in core flows (chat, auth, payments, agent dispatch)
- 3-6-9 pricing model wired to Stripe and tested with test cards
- VPS deployment stable (`deploy.sh --domain plugmein.cloud --landing-domain aimanagedsolutions.cloud`)
- `aimanagedsolutions.cloud` (father site) serving the landing page with SSL
- `plugmein.cloud` (functional app) serving the full application
- 5–20 beta users actively using the product and providing feedback

---

## Phase 2 — Pre-Launch (2–4 weeks before)

### Changelog

For v1, the changelog IS the feature list. Document what the product **does**, not what changed.

Write a single page that answers:
- What is A.I.M.S.?
- What can ACHEEVY do for me?
- What are Boomer\_Angs and how do they work?
- What does pricing look like?

Format: `/changelog` page on `plugmein.cloud` or a Notion/blog post linked from the landing page.

### Landing Page

We have this — `aimanagedsolutions.cloud` serves the Hero with:
- Value prop: "I'm ACHEEVY, at your service. What will we deploy today?"
- DO section: Chat, Automate Everything, Deploy Your Apps
- EXPLORE section: Book of V.I.B.E., Gallery, Merch
- Floating chat widget (ACHEEVY)

**Pre-launch polish checklist:**
- [ ] Pricing CTA on landing page (link to `/pricing` on `plugmein.cloud`)
- [ ] Waitlist / early access signup form (email capture)
- [ ] Social proof section (testimonials, beta user logos — even if placeholder for now)
- [ ] Demo video or GIF in hero showing ACHEEVY in action
- [ ] OpenGraph / social share images set for both domains

### Press Kit

Prepare and host at `/press` or as a downloadable ZIP:

| Asset | Format | Description |
|---|---|---|
| Logo pack | SVG + PNG (light/dark/icon) | A.I.M.S. wordmark, ACHEEVY helmet, Boomer\_Ang icon |
| Screenshots | PNG (1280x720 min) | Chat with ACHEEVY, Dashboard, Agent deployment, Pricing page |
| Founder bio | Text (150 words) | Who built this and why |
| One-pager PDF | PDF | Single page: what it is, who it's for, pricing, contact |
| Brand colors | Text | Ink (#0A0A0C), Gold (#D4AF37), system palette |

### Social Warm-Up (2–4 weeks before launch)

Building in public generates anticipation and early followers.

**Week 1–2:**
- "Building in public" posts showing real development progress
- Behind-the-scenes of V.I.B.E. universe lore and character design
- Short teaser videos: ACHEEVY chat in action (15–30s screen recordings)

**Week 3–4:**
- Waitlist launch: "Early access spots open"
- Countdown posts
- Preview of pricing / LTD (Lifetime Deal) tiers

**Platforms:** Twitter/X (primary), LinkedIn, relevant Discord servers, indie hacker communities

### Influencer / Reviewer Seeding

Send early access to 10–20 people who cover your niche:

| Niche | Who to target |
|---|---|
| AI tools / SaaS reviewers | YouTube channels, newsletter writers covering AI SaaS |
| No-code / low-code community | Creators who review automation tools |
| Indie hackers | People who cover solo founder launches |
| Dev tools | Reviewers who cover developer productivity tools |

**What to send:**
- Free Pro tier access (3 months)
- One-pager PDF + press kit
- Personal note explaining what makes A.I.M.S. different (managed AI agents, not just another chatbot)
- Ask for honest feedback first, review second

---

## Phase 3 — Launch Day

### Product Hunt

**Cost: $0** — biggest visibility bang for zero budget.

**Prep (do this 1 week before):**
- [ ] Create maker profile, link social accounts
- [ ] Write tagline (under 60 chars): "Your AI executive team — deploy agents, not prompts"
- [ ] Prepare 5 screenshots + 1 demo video (under 2 min)
- [ ] Write description (what it does, who it's for, what makes it different)
- [ ] Line up 5–10 supporters to comment and upvote authentically on launch day
- [ ] Schedule launch for 12:01 AM PT (Product Hunt resets daily at midnight PT)

**Launch day:**
- Post goes live at 12:01 AM PT
- Respond to every comment within 1 hour
- Share the PH link on all social channels
- Send email to waitlist: "We're live on Product Hunt"

### Hacker News — Show HN

**Cost: $0**

- Title format: `Show HN: A.I.M.S. – Managed AI agents that deploy and run your workflows`
- Keep the post factual, technical, no hype
- Be ready to answer hard technical questions (architecture, security, how agents work)
- Link to `plugmein.cloud`, not the landing page — HN users want the product, not marketing

### Reddit

**Cost: $0** — but be authentic, not spammy.

| Subreddit | Approach |
|---|---|
| r/SaaS | "I built an AI-managed platform — here's what I learned" (founder story) |
| r/startups | Launch announcement, focus on business model |
| r/artificial | Technical deep-dive on agent orchestration |
| r/nocode | "Deploy apps by talking to an AI" angle |
| r/webdev | Technical architecture post (Next.js 15 + agent system) |
| r/selfhosted | VPS deployment story, Docker Compose setup |

**Rules:** No direct self-promo in most subs. Frame as a story, lessons learned, or ask for feedback. Link in comments, not title.

### Twitter/X Thread

**Cost: $0**

Structure:
1. Hook: "I've been building an AI platform that manages itself. Today it's live."
2. Problem: "Most AI tools make you the operator. A.I.M.S. makes AI the operator."
3. Demo: Embedded video or GIF (30–60s)
4. Architecture: 1–2 tweets on the tech (agents, orchestration, edge security)
5. Pricing: "Starts at $9/mo. Lifetime deals available."
6. CTA: Link to `plugmein.cloud`

### Press Release

Only if you have real traction or a real hook. Most startups skip this for v1.

**When it makes sense:**
- You have 100+ beta users
- You've raised funding
- You have a notable partnership or integration
- You have a genuinely unique technical angle worth covering

**If you do it:** Use a free wire service or pitch directly to 5–10 journalists who cover AI/SaaS. Personal emails beat press releases.

### AppSumo Listing

For the LTD (Lifetime Deal) tiers — already planned in the pricing model.

| LTD Tier | One-Time Price | Maps To | Includes |
|---|---|---|---|
| Tier 1 | ~$59 | Starter | Basic agent access, limited monthly runs |
| Tier 2 | ~$149 | Pro | Full agent suite, higher limits |
| Tier 3 | ~$299 | Enterprise | Priority support, custom agents, highest limits |

**AppSumo takes 60–70% of revenue** but provides massive exposure to deal-seeking early adopters. Treat it as a marketing channel, not a revenue channel.

---

## Phase 4 — Post-Launch (Weeks 1–4)

### Week 1: Stabilize

| Task | Cadence |
|---|---|
| Monitor errors and uptime | Continuous (circuit-metrics dashboard) |
| Ship fixes | Daily deploys via `deploy.sh` |
| Respond to user feedback | Same-day (email, chat, PH comments, Reddit) |
| Track key metrics | Daily — signups, activations, first agent deployment |

### Week 2: Learn

| Task | Detail |
|---|---|
| Collect testimonials | Ask happy beta users for a 1–2 sentence quote |
| Analyze onboarding drop-off | Where do users stop? Chat? Dashboard? Agent config? |
| Identify top 3 friction points | Fix them this week |

### Week 3–4: Iterate

| Task | Detail |
|---|---|
| Ship onboarding improvements | Based on drop-off data |
| Publish case studies | "How [user] deployed X with ACHEEVY" |
| Second-wave outreach | Follow up with reviewers who got early access |
| Plan v1.1 | Based on real user feedback, not assumptions |

---

## Typical Budget

| Category | DIY / Bootstrap | With Budget |
|---|---|---|
| **Domain & Hosting** | $50–100/yr (domains) + $20–50/mo (VPS) | Same |
| **SSL Certificates** | $0 (Let's Encrypt) | $0 |
| **Product Hunt** | $0 | $0 |
| **Hacker News** | $0 | $0 |
| **Reddit / Twitter** | $0 (organic) | $200–500/mo (promoted posts) |
| **Press Kit Design** | $0 (DIY with Figma/Canva) | $500–1,000 (designer) |
| **Demo Video** | $0 (screen recording + free editor) | $1,000–3,000 (professional) |
| **Influencer Seeding** | $0 (free tier access) | $500–2,000 (paid reviews) |
| **AppSumo** | $0 upfront (revenue share) | $0 upfront |
| **Email Marketing** | $0 (free tier: Resend, Mailchimp) | $30–100/mo |
| **Total (Month 1)** | **~$50–150** | **$2,000–7,000** |

### Where NOT to spend money early

- Paid Google/Meta ads (too expensive for cold traffic before product-market fit)
- PR agencies (not worth it until you have traction)
- Premium analytics tools (free tiers of PostHog, Plausible, or even basic server logs are enough)
- Swag/merchandise (wait until you have fans who want it)

### Where to invest if you have budget

1. **Demo video** — highest ROI asset. A 60-second video showing ACHEEVY in action converts better than any copy.
2. **Designer for press kit** — first impressions matter when reaching out to reviewers.
3. **Paid influencer reviews** — 2–3 authentic reviews from trusted voices in the AI/SaaS space.

---

## A.I.M.S.-Specific Launch Checklist

### Technical Readiness

- [ ] `plugmein.cloud` — full app deployed, SSL active, all routes working
- [ ] `aimanagedsolutions.cloud` — landing page deployed, SSL active, CORS configured
- [ ] `demo.plugmein.cloud` — sandbox demo mode working (no auth required)
- [ ] Stripe integration tested (test mode → live mode cutover)
- [ ] Rate limiting and security middleware verified in production
- [ ] Error monitoring in place (circuit-metrics dashboard)
- [ ] Backup and recovery plan documented

### Content Readiness

- [ ] Landing page polished (hero, value prop, pricing CTA)
- [ ] Pricing page finalized with 3-6-9 tiers
- [ ] Changelog / feature list published
- [ ] Press kit assembled (logos, screenshots, one-pager)
- [ ] Demo video recorded
- [ ] Social accounts created and warmed up

### Launch Day Readiness

- [ ] Product Hunt listing drafted and reviewed
- [ ] Show HN post written
- [ ] Reddit posts drafted (one per subreddit, different angles)
- [ ] Twitter/X thread written
- [ ] Email to waitlist ready
- [ ] AppSumo listing submitted (if using LTD channel)
- [ ] All team members briefed on launch day duties (monitoring, responding, fixing)

---

*This is a living document. Update it as phases complete and plans evolve.*
