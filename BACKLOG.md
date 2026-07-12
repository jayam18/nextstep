# NextStep — Product Backlog

**Product goal:** A simple site that is the *first stop* for families exploring colleges — before they visit any college website. Parents get tuition, grants, and scholarship-path clarity; students get campus life, vibe, and program offerings. Value proposition = trustworthy, comparable, sourced data in one place.

**Current state (July 2026):** 300 colleges served from static `src/data/colleges.json` (exported from local Prisma/SQLite via `scripts/export-db-to-json.ts`). Search + geolocation-curated homepage, fit quiz, college detail modal. No auth, no analytics, no feedback channel, no data provenance. Much of the detail data (GPA, snippets, special programs) is LLM-generated and unsourced.

---

## How to use this backlog with subagents

Every item is scoped to be independently executable. Before dispatching a subagent, give it:

1. **The item's full text** (description, acceptance criteria, files).
2. **These project constraints** (non-negotiable):
   - This repo uses a Next.js version with breaking changes vs. training data. **Read the relevant guide in `node_modules/next/dist/docs/` before writing any code.**
   - Production data flow is: research scripts → Prisma/SQLite (`prisma/dev.db`) → `scripts/export-db-to-json.ts` → `src/data/colleges.json` → API routes/components. Schema changes must ripple through all four stages.
   - The site deploys to Vercel. **The filesystem is read-only at runtime** — any feature that *writes* data (feedback, analytics events, scraped reviews) needs an external store, not SQLite.
   - UI follows the existing dark "glass" aesthetic (see `src/app/globals.css`, `Navbar.tsx`): `glass` class, `border-white/10`, blue/purple gradients, lucide-react icons, framer-motion transitions.
3. **Dependency check**: items list what they depend on. Don't dispatch an item before its dependencies are merged.

Suggested dispatch order: **F1 → A1 → D1 → T1 → T2 → (G1, S1 in parallel) → R1 → everything else.**

---

## Priority overview

| ID | Epic | Priority | Type | Depends on |
|----|------|----------|------|------------|
| F1 | Feedback button & pilot-user feedback capture | P0 | Feature | — |
| A1 | Vercel analytics (phase 1: page views) | P0 | Feature | — |
| A2 | Custom event analytics (drill-down) | P1 | Feature | A1 |
| T1 | In-state / out-of-state tuition breakdown | P1 | Feature + data | D1 (partial) |
| T2 | Tuition reciprocity & neighbor-state discounts | P1 | Feature + research | T1 |
| D1 | Authoritative data source integration (College Scorecard) | P1 | Data infra | — |
| G1 | Grants & scholarships catalog (with sources) | P2 | Feature + research | D1 |
| S1 | Special programs & constituent-college prominence | P2 | Feature + research | — |
| M1 | Major-level insight: outcomes & program rankings per major | P2 | Feature + data + research | D1 |
| R1 | Parent/student review ingestion pipeline | P2 | Data infra | DB1 |
| A3 | Analytics insights dashboard ("what are users looking for") | P3 | Feature | A2 |
| DB1 | Production database (tech debt, unblocks F1/R1 at scale) | P1 | Infra | — |
| X1 | Data provenance layer (every fact has a source) | P1 | Infra | D1 |
| X2 | TypeScript models (kill the `any`s) | P2 | Tech debt | — |
| C1 | College compare view (parent+student value prop) | P3 | Feature | T1, G1 |
| C2 | Dedicated college profile pages (/college/[slug]) | P2 | Feature | — |
| F2 | Real search filters (state, public/private, tuition ceiling, vibe) | P2 | Feature | — |

---

## F1 — Feedback button (pilot user feedback)

**Goal:** Collect feedback from pilot users on which features add value, directly in the UI.

**What to build:**
- A "Feedback" button in `src/components/Navbar.tsx`, placed immediately left of the "Sign In" button (same row, `MessageSquarePlus` or similar lucide icon, secondary styling so Sign In stays the primary CTA).
- Clicking opens a lightweight modal (reuse the framer-motion modal pattern from `CollegeModal.tsx`):
  - Category select: `Bug` / `Feature idea` / `Data is wrong` / `General`.
  - Free-text message (required), optional email.
  - Optional 1–5 "how valuable is this site so far?" rating.
  - Auto-captured context: current page path, timestamp, user agent.
- `POST /api/feedback` route that persists the submission.

**Storage decision (pick per phase):**
- *Pilot (now):* a free external store — Vercel Postgres/Neon free tier, or Supabase table. Do **not** use SQLite (read-only FS on Vercel). If DB1 is done, use that database.
- Add a `.env` var for the connection string; document in README.

**Acceptance criteria:**
- Button visible on desktop and mobile widths.
- Submitting shows a success state and closes; failures show an inline error, never lose the typed text.
- Submissions retrievable (simple `GET /api/feedback` behind an admin token env var, or read directly from the DB console).
- No feedback data is written to the repo/filesystem.

---

## A1 — Analytics phase 1: Vercel Web Analytics

**Goal:** Know traffic basics (visitors, page views, referrers, countries, devices) with near-zero code.

**What to build:**
- `npm install @vercel/analytics` and add `<Analytics />` to `src/app/layout.tsx` (check `node_modules/next/dist/docs/` for the correct layout conventions in this Next version).
- Optionally add `@vercel/speed-insights` (`<SpeedInsights />`) in the same PR — free perf data.
- Enable Web Analytics in the Vercel project dashboard (manual step — note it in the PR description).

**Acceptance criteria:** deploy shows events flowing in the Vercel Analytics tab; no console errors; no layout shift.

## A2 — Analytics phase 2: custom events (drill-down on what users seek)

**Goal:** Answer "what are most users looking for?" — the queries, colleges, and features they touch.

**What to build** (using `track()` from `@vercel/analytics`; note custom events need a Vercel Pro plan — if staying on Hobby, swap in PostHog free tier with the same event taxonomy):
- `search_performed` — { query, resultCount } (debounced, fire once per settled query, in `SearchDashboard.tsx`).
- `college_viewed` — { collegeName, ranking } (modal open).
- `college_website_clicked` — { collegeName } (outbound click in `CollegeModal.tsx` — the strongest "we were the first stop" signal).
- `quiz_started` / `quiz_completed` — { topMatch }.
- `state_curated_shown` — { state } (geolocation homepage).
- `feedback_submitted` — { category } (ties into F1).
- Define the taxonomy in one module, e.g. `src/lib/analytics.ts`, so event names/props stay consistent and future events have one home.

**Acceptance criteria:** events visible in the provider dashboard with properties; no PII in event payloads (no emails, no raw IP-derived location beyond state).

## A3 — Analytics phase 3: insights review (later)

Periodic (monthly) review process or small internal dashboard answering: top search terms with zero results (content gaps), most-viewed colleges vs. most-clicked-out colleges, quiz completion rate. Backlog placeholder — design after A2 has ~4 weeks of data.

---

## T1 — In-state / out-of-state tuition breakdown

**Goal:** Parents' #1 question. Replace the single `tuition` field with an honest cost picture.

**Schema changes** (`prisma/schema.prisma` → migrate → re-export JSON):
```prisma
tuitionInState     Int?   // published in-state tuition + fees
tuitionOutOfState  Int?   // published out-of-state tuition + fees
avgNetPrice        Int?   // average net price after aid (what tuition currently pretends to be)
tuitionSourceUrl   String?
tuitionYear        String? // e.g. "2025-26"
```
Keep `tuition` temporarily as a deprecated fallback until all 300 rows are populated, then remove.

**Data population:** College Scorecard API (see D1) provides `latest.cost.tuition.in_state`, `latest.cost.tuition.out_of_state`, `latest.cost.avg_net_price.overall` keyed by IPEDS unit ID. Private colleges: in-state == out-of-state; UI should show a single "Tuition" number for them rather than two identical ones.

**UI changes:**
- `CollegeModal.tsx` Quick Stats: fix the current mislabel (the `tuition` field is shown as "Net Price"). Show "In-State Tuition" and "Out-of-State Tuition" (or single "Tuition" for privates) plus "Avg Net Price" with a one-line explainer ("what families actually pay after aid, on average").
- `CollegeCard.tsx`: show the figure relevant to the visitor — the app already detects the user's state via `ipapi.co` in `SearchDashboard.tsx`; pass it down and display in-state price when the college is in the user's state, out-of-state otherwise, with an "in-state"/"out-of-state" chip.
- Bonus for A2: this personalization is a great differentiator — track how often in-state pricing is shown.

**Acceptance criteria:** all 300 colleges have both figures with `tuitionYear` and source URL; UI never shows a raw unlabeled dollar figure; search/quiz APIs still work.

---

## T2 — Tuition reciprocity & neighbor-state discounts

**Goal:** Out-of-state sticker price is often a lie for specific state pairs. If a visitor from Illinois looks at Indiana State, they should see the reciprocity rate (150% of in-state), not the full out-of-state figure. Capture this for **every public college**, per eligible state.

**Two kinds of discounts to catalog:**
1. **Regional exchange programs** (structured, enumerable — start here):
   - **MSEP** (Midwest Student Exchange Program): caps tuition at ≤150% of in-state for residents of member states (IL, IN, KS, MN, MO, NE, ND, OH, WI). *This is the Indiana State / Illinois example.*
   - **WUE** (Western Undergraduate Exchange): ≤150% of in-state across 16 western states/territories.
   - **Academic Common Market** (SREB, southern states): in-state rates, but only for majors not offered in the student's home state.
   - **NEBHE Tuition Break** (New England): discounted rate, also major-restricted.
   - Each program publishes member institutions and terms — these lists are the primary source and cover most of the matrix cheaply.
2. **Institution-specific discounts** (long tail, needs per-college research): unilateral neighbor-state rates (e.g., border-county programs, "Midwest rate" at some publics), automatic merit that effectively waives the out-of-state premium (e.g., Alabama, Ole Miss style full-tuition-for-stats awards — coordinate with G1 to avoid double-cataloging: G1 owns merit scholarships, T2 owns residency-based rates), and D.C. TAG-style portable grants.

**Data model** (new table, mirrors into JSON export):
```prisma
model TuitionReciprocity {
  id            String  @id @default(cuid())
  collegeId     String
  program       String   // "MSEP" | "WUE" | "ACM" | "NEBHE" | "institutional"
  eligibleStates String  // comma-separated: "IL,MO,WI" (or "*" for any out-of-state)
  rateType      String   // "pct-of-instate" | "flat" | "instate-rate"
  rateValue     Int?     // 150 (for pct), or dollar amount (for flat)
  conditions    String?  // "majors not offered in home state", "min 3.0 GPA", "limited slots"
  sourceUrl     String   // REQUIRED
  retrievedAt   DateTime
  college       College @relation(...)
}
```

**Research pipeline:**
1. Bulk pass: pull member-institution lists from msep.mhec.org, wiche.edu/wue, sreb.org (ACM), nebhe.org — join to our colleges by name/IPEDS ID. One subagent, one afternoon, covers ~60% of value.
2. Per-college pass (batchable): check each public university's tuition/residency page for unilateral neighbor-state or regional rates; capture conditions and `sourceUrl`. Skip privates (no residency pricing) unless they advertise regional awards.
3. Compute an effective price: `effectiveTuition = min(outOfState, applicable reciprocity rate)` given the visitor's state.

**UI:**
- `CollegeCard.tsx` / `CollegeModal.tsx`: the app already knows the visitor's state (T1 personalization). When a reciprocity match exists, show the discounted figure with a badge — e.g., "**$13,750** for IL residents · MSEP rate (150% of in-state)" — with strikethrough on the sticker out-of-state price and the source link.
- If conditions apply (major-restricted, GPA floor), show the price with a "conditions apply" marker and the one-liner from `conditions`.
- Make reciprocity searchable/filterable eventually: "colleges with IL tuition discounts" is a killer parent query (feeds A2 event: `reciprocity_shown` — { program, state }).

**Acceptance criteria:** every public college in the dataset has either ≥1 reciprocity row or an explicit "checked, none found" marker (so absence means verified-absent, not not-researched); 100% of rows have `sourceUrl` + `retrievedAt`; an Illinois visitor viewing Indiana State sees the 150% MSEP rate, not $21k+ sticker; rates never render for the college's own home-state visitors (they already get in-state).

---

## D1 — Authoritative data source integration (College Scorecard)

**Goal:** Foundation item. Replace LLM-guessed numbers with federal data, keyed properly, refreshable.

**What to build:**
- Add `ipedsUnitId Int?` to the College model — the join key to all federal datasets. Populate for all 300 via the Scorecard name-search endpoint (script: `scripts/link-ipeds-ids.ts`, manual-review CSV for ambiguous matches).
- `scripts/refresh-scorecard.ts`: pulls per-college from the **College Scorecard API** (`api.data.gov/ed/collegescorecard/v1/schools`, free API key) and updates: acceptance rate, enrollment, SAT/ACT midpoints, tuition (T1 fields), avg net price, **net price by income bracket** (feeds G1), completion rate, median earnings 10yr after entry.
- Record `dataSource` + `retrievedAt` per refreshed field group (feeds X1).
- Document the refresh procedure in README (run locally → re-export JSON → commit), until DB1 makes it a cron.

**Acceptance criteria:** script is idempotent and re-runnable; a `--dry-run` prints a diff of changed values; every field it writes is traceable to a Scorecard field name in code comments.

---

## G1 — Grants & scholarships catalog

**Status (July 2026):** Foundation implemented — `CollegeAid` model, `scripts/populate-aid.ts` (1,025 rows, avg 3.4/college, 100% with `sourceUrl`), and a "Paying for It" modal section (below Special Programs) with net-price-by-income header, grouped by pledge/state/federal. Seeded tiers: federal aid for all 300 (Pell $740–$7,395 for 2026-27, FSEOG, Work-Study — studentaid.gov); state grants for the 10 biggest states in the dataset (CA TX NY OH NC IL MA PA MI FL — amounts verified against each state agency, public-only programs filtered correctly); 7 verified institutional affordability pledges (Harvard/MIT ≤$200k tuition-free, Stanford ≤$150k, Princeton ≤$150k full ride, Illinois Commitment ≤$75k, Go Blue ≤$125k, Texas Advance ≤$100k). **Remaining:** per-college institutional/departmental scholarships and CDS Section H data (the research pipeline below — batch 20–30 colleges per subagent) to reach the ≥5 avg entries target; remaining 40 state programs.

**Goal:** For each college, catalog every kind of grant/scholarship offered, the typical award, and **the source of that claim**. This is the parent-facing crown jewel.

**Data model** (new table; also mirrors into JSON export as a nested array per college):
```prisma
model CollegeAid {
  id            String  @id @default(cuid())
  collegeId     String
  name          String   // "Grainger Engineering Scholarship", "Pell Grant", "MAP Grant"
  kind          String   // need-based | merit | federal | state | institutional | departmental
  typicalAwardMin Int?
  typicalAwardMax Int?
  awardNote     String?  // "full tuition", "renewable 4 yrs if GPA ≥ 3.0"
  eligibility   String?  // one-liner: income threshold, GPA/test floor, major, residency
  howToApply    String?  // "automatic with application" | "separate app, due Dec 1" | "FAFSA"
  sourceUrl     String   // REQUIRED — the page this was found on
  sourceName    String   // "UIUC Office of Student Financial Aid"
  retrievedAt   DateTime
  college       College @relation(...)
}
```

**Research pipeline (subagent-friendly — batch 20–30 colleges per agent):**
1. For each college: fetch its financial-aid pages (`/admissions/aid`, `/financial-aid`, `/scholarships`) and its **Common Data Set** (search "`<college name>` common data set" — Section H has institutional aid totals and average awards).
2. Extract institutional/departmental awards; always include the universal federal (Pell: ~$7,395 max, FSEOG) and the college's state grant (e.g., Illinois MAP, Cal Grant, NY TAP) tagged by residency.
3. Cross-check typical award amounts against Scorecard net-price-by-income-bracket (D1) — flag colleges where the story doesn't add up for manual review.
4. **Every row must have `sourceUrl`.** No source, no row — an unsourced grant claim is worse than none.

**UI:** new "Paying for It" section in `CollegeModal.tsx` (left column, below Academic Requirements): grouped by kind, showing name, typical award range, eligibility one-liner, and a small source link icon. Header shows avg net price by income bracket if available ("Families earning <$75k typically pay $X/yr").

**Acceptance criteria:** ≥5 aid entries per college on average; 100% of entries have `sourceUrl` + `retrievedAt`; modal renders gracefully for colleges with zero entries.

---

## S1 — Special programs & constituent-college prominence

**Status (July 2026):** Implemented for the top 100 colleges (by ranking) — `CollegeProgram` model, `scripts/populate-programs.ts` seed, modal jewel/compact UI, and program-aware search are live. Remaining: the other 200 colleges (rankings 101+), and per-program deep source URLs (most rows currently fall back to the college's main website pending X1).

**Goal:** Replace the one-sentence `specialPrograms` blurb with structured, distinctive intel: what makes *this* college unique, and which schools/colleges within the university are its jewels (e.g., **Grainger College of Engineering at UIUC**, Wharton at Penn, Ross at Michigan, SFS at Georgetown).

**Data model:**
```prisma
model CollegeProgram {
  id          String @id @default(cuid())
  collegeId   String
  name        String  // "Grainger College of Engineering"
  type        String  // constituent-school | honors-college | co-op | research | accelerated | study-abroad | other
  prominence  Int     // 1 = flagship jewel, 2 = notable, 3 = solid
  description String  // 1-2 sentences on why it matters
  knownFor    String? // comma-separated: "CS, ECE, Aerospace"
  sourceUrl   String?
  college     College @relation(...)
}
```

**Research pipeline (batchable per subagent):** for each college identify (a) named constituent schools/colleges and which 1–2 carry the institution's reputation (rankings by school, endowed names, admission selectivity deltas — e.g., separate/harder admission to Grainger CS than to UIUC overall is exactly the kind of fact families need); (b) signature programs: honors colleges, co-op programs (Northeastern, Drexel, Cincinnati), BS/MD programs, guaranteed research, notable study-abroad. Sources: the university's own "colleges & schools" page, US News graduate/undergrad program rankings, Wikipedia constituent-college pages. Catalog `sourceUrl`.

**Pre-med paths (added July 2026):** captured as a taxonomy convention on CollegeProgram — tier 1 direct BS/MD = `type: 'accelerated'` with `knownFor` containing BS/MD or BA/MD; tier 2 early assurance = `type: 'pre-med'`, prominence 2 (seed: `scripts/populate-premed.ts`; detection helper: `src/lib/premed.ts`). 15 top-100 rows covered, all source-verified (Rutgers and Georgetown skipped — no clean primary source). Cards show a rose "Direct Med Path" / "Med Early Assurance" chip for tiers 1–2 only; tier 3 (standard pre-health advising, true nearly everywhere) is deliberately unbadged — capturing it honestly requires the per-college committee-letter research pass, which remains open. "pre-med", "BS/MD", "early assurance" are searchable.

**UI:** redesign the Special Programs section of `CollegeModal.tsx`: prominence-1 entries get a highlighted "🏛 Jewel of the university" card with `knownFor` chips; others listed compactly by type. Make program names searchable — add them to the search index in `src/app/api/search/route.ts` so "Grainger" or "co-op" finds the right colleges.

**Acceptance criteria:** every college has ≥1 program entry; the ~50 large universities each identify their flagship school(s); "Wharton", "Grainger", "co-op" as search terms return the right colleges.

---

## M1 — Major-level insight: outcomes & program rankings per major

**Status (July 2026):** Layers 1–2 implemented for all 289 colleges with usable IPEDS IDs — `CollegeMajor` model, `scripts/refresh-majors.ts` (top 10 bachelor's majors by degrees awarded, with 1/4-yr median earnings, national median/p25/p75 for the same CIP, and federal loan debt; 92% of majors have 4-yr earnings), "Top Majors & What Graduates Earn" modal section with vs-national chips and suppression fallback, and major-name search. The national baseline turned out to ship inside the field-of-study payload (`overall_median_earnings_national`) — no separate sweep needed. Layer 3 partially seeded: `scripts/populate-major-rankings.ts` holds 15 verified 2026 placements (16 rows incl. dataset duplicates) across 11 colleges — each verified against a primary source (school announcement or rankings page) and stored as an attributed single fact with source link, never a reproduced list. Stanford/Berkeley intentionally absent (no clean primary source found for exact 2026 numbers — do not add from memory). Modal shows rank badges plus an "Also nationally ranked" strip for ranked majors outside the top-5-by-popularity (e.g., UIUC CS #7). Remaining: broaden coverage college-by-college via each school's own rankings/news page. UI update: dollar figures (earnings/debt) are hover-only; the always-visible signal is a computed national-standing badge per major ("Top 25% nationally · grad earnings" when the program's 4-yr median ≥ the national p75 for the same CIP) — owned data, no licensing. College `aliases` field added for nickname search (Caltech, UIUC, WashU…), seeded via `scripts/populate-aliases.ts`.

**Goal:** Replace the generic "Top 5 Most Popular Majors" list (currently just degree-share percentages, e.g. "Engineering (21.6%)") with targeted, decision-grade insight per major: what graduates of *this major at this college* actually earn and owe, and how the *program* ranks nationally — which is often very different from the school's overall ranking (e.g., a #37 school with a #5 CS program, or a #10 school with a middling nursing program). This is the question families actually ask: "is it good *for what my kid wants to study*?"

**Why the current section is weak:** `topMajors` comes from Scorecard `latest.academics.program_percentage` — 2-digit CIP *family* shares. It says what's popular, not what's good, uses vague labels ("Social Sciences"), and carries no outcome or quality signal. Popularity ≠ strength: a college's best-ranked program is frequently *not* in its top-5 by enrollment.

**Three layers of enhancement (in value order):**

1. **Outcomes by major (authoritative, free, automatable — do first).** The same College Scorecard API used in D1 has a *field-of-study* dataset: per institution × 4-digit CIP × credential, it reports median earnings 1 and 4 years after completion, median debt at graduation, monthly payment, and completer counts. Accessible in the existing API via the nested `latest.programs.cip_4_digit` object (`&all_programs_nested=true`). This turns "7.8% study Computer Science" into "CS grads here: median $X at 4 years, median debt $Y" — per college, sourced, refreshable by extending `scripts/refresh-scorecard.ts`.
2. **National context per major.** Pair each major's earnings with a national baseline for that CIP (computed across all institutions in the field-of-study file, or from BLS/Census ACS data) so we can render "vs $Z national median" — an honest, non-licensed "ranking substitute" we can compute ourselves (e.g., percentile of this program's earnings among all programs in the same CIP).
3. **Program rankings & quality markers (research + licensing care).**
   - **US News undergraduate program rankings** now cover CS, engineering (+ specialties), business (+ specialties), nursing, psychology, economics, data science, etc. These capture exactly the "school #37 / major #5" gap. **Licensed content** — per the appendix policy, store the placement as a cited fact ("#5 Undergraduate CS — U.S. News 2026") with attribution + link, never reproduce lists; flag for a licensing sanity check before launch.
   - **Open alternatives:** CSRankings (csrankings.org, publication-based, open methodology) for CS; Brown's CS Open Rankings meta-ranking; discipline societies' recognitions.
   - **Accreditation as a verifiable quality floor:** ABET (engineering/CS), AACSB (business), CCNE/ACEN (nursing), NAAB (architecture) — free, authoritative, binary, and parents understand "accredited".
   - Cross-link S1: a prominence-1 constituent school (Grainger, Wharton) usually implies its majors are the ranked ones — `CollegeProgram.knownFor` and `CollegeMajor` should reference each other.

**Data model:**
```prisma
model CollegeMajor {
  id                 String  @id @default(cuid())
  collegeId          String
  cipCode            String   // 4-digit CIP, e.g. "11.07"
  name               String   // human label: "Computer Science"
  credential         String   // "bachelors"
  degreeShare        Float?   // % of degrees awarded (existing program_percentage)
  completerCount     Int?     // from field-of-study data
  medianEarnings1yr  Int?
  medianEarnings4yr  Int?
  medianDebt         Int?
  nationalMedianEarnings Int? // baseline for same CIP across all institutions
  earningsPercentile Int?     // this program vs all programs in same CIP
  sourceUrl          String
  retrievedAt        DateTime
  rankings           MajorRanking[]
  college            College @relation(...)
}

model MajorRanking {
  id             String  @id @default(cuid())
  collegeMajorId String
  source         String   // "US News Undergrad CS" | "CSRankings" | "ABET accredited"
  year           String   // "2026"
  rank           Int?     // null for binary markers like accreditation
  scope          String?  // "national", "public universities", specialty name
  sourceUrl      String   // REQUIRED
  retrievedAt    DateTime
  major          CollegeMajor @relation(...)
}
```

**UI (CollegeModal "Top 5 Most Popular Majors" → "Majors & Outcomes"):**
- Keep top-5-by-share rows but enrich each: median earnings chip, debt chip, rank badge when one exists ("#5 nationally · U.S. News" with link), share moved to secondary text.
- Add a "Nationally ranked programs" strip *above* the popularity list for ranked majors that aren't in the top 5 by enrollment — this is precisely the school-rank ≠ major-rank story.
- Every number gets a source affordance (feeds X1); suppressed/missing data renders as "not reported" rather than blank.
- Make major names searchable (extend `/api/search` the same way S1 did for programs).

**Research tasks (do these before building — each verifies a load-bearing assumption):**
1. **Scorecard field-of-study API**: confirm exact nested field names and availability of 4-year earnings in the current release; confirm `&all_programs_nested=true` behavior and rate limits (1,000 req/hr default). Docs: https://collegescorecard.ed.gov/data/api-documentation/ and the Field of Study Data Documentation PDF: https://collegescorecard.ed.gov/assets/FieldOfStudyDataDocumentation.pdf. Pilot: pull UIUC + one small private end-to-end.
2. **Suppression coverage**: field-of-study earnings are privacy-suppressed for small cohorts — measure what % of our 300 colleges' top-5 majors have usable earnings (known caveats write-ups: https://ticas.org/accountability/data-evidence-and-information/takeaways-from-new-program-level-data-on-the-college-scorecard/ and https://www.forbes.com/sites/michaeltnietzel/2019/11/21/six-caveats-when-using-the-college-scorecards-new-program-of-study-data/). Decide fallback display when suppressed.
3. **CIP mapping**: build/verify a 2-digit-family ↔ 4-digit CIP ↔ friendly-name mapping (NCES CIP 2020 taxonomy, https://nces.ed.gov/ipeds/cipcode/) so today's `topMajors` families join cleanly to field-of-study rows.
4. **US News program rankings**: enumerate which undergrad program rankings exist in the 2026 edition (https://www.usnews.com/best-colleges/rankings, e.g. CS: https://www.usnews.com/best-colleges/rankings/computer-science-overall) and how many of our top-100 colleges appear; confirm the attribution-not-reproduction approach with the licensing policy in the appendix.
5. **Open rankings**: assess CSRankings (https://csrankings.org/) and CS Open Rankings (https://drafty.cs.brown.edu/csopenrankings/) for CS; identify equivalents for business/engineering/nursing or accept accreditation-only for those.
6. **Accreditation datasets**: confirm bulk-downloadable program lists from ABET (https://www.abet.org), AACSB, CCNE — join by institution + program.
7. **National baselines**: decide between computing CIP-level national medians from the Scorecard field-of-study file itself (self-consistent, free) vs BLS/Census ACS by degree field; prototype both for CS + Business + Psychology.
8. **IPEDS Completions** (optional depth): degrees-conferred counts by 6-digit CIP (https://nces.ed.gov/ipeds/use-the-data) enable "one of the largest aerospace programs in the country" claims; assess whether completer counts from #1 suffice instead.

**Acceptance criteria:** every college's majors section shows ≥1 outcome figure (earnings or debt) with source + year, or an explicit "not reported for this program"; the school-rank ≠ major-rank case is visible (a ranked-program badge can appear on a college regardless of overall rank); 100% of ranking rows have `sourceUrl` + `retrievedAt` + attribution; no US News list is reproduced wholesale; search finds colleges by major name.

**Dependencies:** D1 (Scorecard plumbing, IPEDS IDs — done), X1 alignment for provenance display; pairs naturally with S1 (constituent-school ↔ ranked-major cross-references) and feeds C1 compare view.

---

## R1 — Parent & student review ingestion (periodic accuracy loop)

**Goal:** Periodically gather what parents and students actually say, to (a) surface authentic voice on college pages and (b) flag where our presented data seems wrong or stale.

**Approach — prefer APIs and licensed feeds over scraping:**
- **Reddit** (official API, free tier): r/ApplyingToCollege, r/Parents_of_College, and each college's subreddit (r/UIUC, r/berkeley…). Pull top/new threads mentioning cost, aid, dorms, safety, workload.
- **College Confidential**: has public forums; check `robots.txt`/ToS before fetching; if disallowed, skip.
- **Niche / Unigo / RateMyProfessors:** ToS generally prohibit scraping — **do not scrape**; treat as manual-research references only, or pursue data licensing later.
- **Google Maps reviews** (Places API, paid but cheap at 300 colleges): star ratings + review snippets for campuses.

**Pipeline (needs DB1 for storage; scheduler = Vercel Cron hitting an API route, or a GitHub Action on a monthly schedule):**
1. Fetcher per source → raw items stored with URL, author-type guess (parent vs. student), date.
2. LLM summarization pass (Claude API — see `claude-api` conventions): per college, produce (a) 3–5 quote-backed themes, (b) a **data-discrepancy report**: claims in reviews that contradict our stored fields ("everyone says real cost with fees is $4k higher"), routed to a review queue, never auto-applied.
3. UI: "What students & parents say" section in the modal — themes with source links and a freshness date ("based on discussions through June 2026").

**Guardrails:** respect robots.txt and API ToS; store source URLs for every quote; never present scraped opinion as fact — visually separate "community voice" from sourced data.

**Acceptance criteria:** pipeline runs on a schedule without manual steps; each college page shows ≥3 themes or an honest "not enough recent discussion"; discrepancy queue exists and is documented.

---

## DB1 — Production database (infrastructure)

**Status (July 2026):** Done. Prisma datasource switched to Postgres (Neon free tier via the Vercel Marketplace, `DATABASE_URL` in `.env`); all 4,707 rows migrated from SQLite via `scripts/migrate-sqlite-to-postgres.ts` with content verified identical; `colleges.json` remains the runtime read path; export script made deterministic (stable tiebreakers); feedback API persists to the same database (`src/lib/pg.ts` falls back to `DATABASE_URL`). `prisma/dev.db` is retained as the legacy migration source only. Unblocks R1 and F1-at-scale. Remaining nicety: set `ADMIN_TOKEN` in Vercel to read feedback via `GET /api/feedback` (or read rows in the Neon console).

**Why:** Feedback (F1), review ingestion (R1), and eventually user accounts all need writable storage; the static-JSON model also makes every data refresh a redeploy. **Recommendation:** Vercel Postgres (Neon) free tier + switch Prisma datasource to it; keep `src/data/colleges.json` as the read path initially (it's fast and free), migrate reads later only if freshness demands it. Update `scripts/export-db-to-json.ts` to read from Postgres.

## X1 — Data provenance layer

**Why:** The site's core promise is trust. Today `avgGpa`, snippets, and specialPrograms are unlabeled LLM estimates. Add per-field-group provenance (`source: scorecard | cds | college-website | llm-estimate | community`, `sourceUrl`, `retrievedAt`), render a subtle source indicator in the modal (tooltip/footnote), and visually mark LLM-estimated fields as estimates until replaced by D1/G1/S1 data. This is also your legal/credibility shield.

## X2 — TypeScript models (tech debt)

Define a `College` interface (and Aid/Program types) in `src/types/`; remove the `college: any` props in `CollegeCard.tsx`, `CollegeModal.tsx`, `SearchDashboard.tsx`, and API routes. Do this before the schema grows in T1/G1/S1 — every later item gets cheaper.

## C2 — Dedicated college profile pages

**Why:** The college modal has outgrown "quick look" — it now carries costs, reciprocity, aid (G1), majors with outcomes (M1), programs (S1), and campus content: ~25 blocks. July 2026 mitigations (headline-first sections with expanders, sticky jump chips, federal-aid one-liner) buy time, but the structural fix is a dedicated page.

**What to build:** `/college/[slug]` route (static-generated from `colleges.json`; check `node_modules/next/dist/docs/` for current SSG conventions) with a sticky section nav; the modal becomes a light preview (stats, jewel program, aid pledge, top 3 majors) with "View full profile →". Slugs need a stable scheme (name-derived, handle dataset duplicates).

**Payoffs:** solves modal density properly; **shareable URLs** (parents send links — the natural growth loop); SEO for a "first stop" product (300 indexed data-rich pages); natural home for C1 compare entry points and A2 per-college analytics.

**Acceptance criteria:** every college has a canonical URL; modal preview links to it; page renders all modal content plus room to grow; Lighthouse SEO basics (title/description/OG tags per college).

## F2 — Real search filters

**Why:** The hero's "Filters" button was decorative (no handler) and was removed in July 2026 rather than ship dead UI. When built for real: filter panel over the existing search — state, public/private, tuition ceiling (state-aware effective tuition), acceptance-rate band, vibe chips, pre-med path, "has aid pledge". The search API already carries all these fields; the work is UI + query params + A2 events (`filter_applied`). Pairs with the "Showing top 12 of N matches" indicator, which creates the demand for narrowing.

## C1 — Compare view (future)

Side-by-side comparison of 2–3 colleges on exactly the parent/student split: costs & aid (T1+G1) on one axis, vibe & programs (S1 + vibes) on the other. Strong "first stop" feature; design after T1/G1 land.

---

## Appendix: Data source research (for the goal review)

**Reviewed against the goal** — "simple, first stop before the college website; parents: tuition/grants/scholarship path; students: college life and offerings" — the build is strong on student-side vibe data and weak on parent-side money data (single unlabeled tuition number, zero aid data, no sources). D1 → T1 → G1 is the critical path. The second gap is trust: nothing on the site says where a number came from (X1).

**Authoritative (money & outcomes) — use first:**
| Source | What it gives | Access |
|---|---|---|
| College Scorecard API | Tuition in/out-of-state, net price (overall + by income bracket), admission rate, SAT/ACT, completion, median earnings, debt | Free API key (api.data.gov) |
| IPEDS / NCES | Everything Scorecard has plus finance detail, grants/scholarship dollars by type (institutional/state/federal), room & board | Free bulk CSVs |
| Common Data Set (per college) | Section C (admissions detail), Section H (financial aid: % receiving aid, avg award by type) | Free PDFs/XLS on each college's institutional-research page |
| Federal Student Aid (studentaid.gov) | Pell/FSEOG/loan program rules and maxima | Free, public |
| State grant agencies (ISAC, CSAC, HESC…) | State grant programs, amounts, residency rules | Free, public |
| Regional exchange compacts (MHEC/MSEP, WICHE/WUE, SREB/ACM, NEBHE) | Member institutions + reciprocity tuition rates and conditions (feeds T2) | Free, public lists |
| Clery Act campus safety data (ope.ed.gov) | Reported campus crime stats — upgrade for `safetySnippet` | Free |

**Institutional (programs & aid specifics):** college financial-aid and scholarships pages, "colleges & schools" pages, net price calculators (spot-check net price claims), honors college pages.

**Community voice (student life):** Reddit API (college subreddits, r/ApplyingToCollege), Google Places reviews (paid API), College Confidential (ToS permitting). Niche/RateMyProfessors: reference only, no scraping.

**Rankings context:** US News/WSJ/Forbes rankings are licensed content — cite category placements sparingly with attribution rather than reproducing lists.

**Verification tasks for a research subagent:** confirm current Scorecard API field names & rate limits; confirm Vercel custom-events plan requirements; confirm Reddit API free-tier limits; pull one college's CDS (UIUC) end-to-end as a pilot for the G1 pipeline.
