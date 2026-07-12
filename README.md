This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.

## Production Database (Epic DB1)

The Prisma datasource is **PostgreSQL** (Neon free tier via the Vercel Marketplace), configured through `DATABASE_URL` in `.env`. The site itself still reads college data from the static `src/data/colleges.json` — Postgres is the system of record that research scripts write to, and the feedback API's persistent store.

**Data flow:** research scripts → Postgres (`DATABASE_URL`) → `scripts/export-db-to-json.ts` → `src/data/colleges.json` (committed) → API routes/components.

`prisma/dev.db` is the **legacy SQLite database**, kept only as the migration source. Do not write to it; all scripts now target Postgres.

### One-time migration (already-provisioned DB)

```bash
npx prisma db push                              # create tables in Postgres
npx tsx scripts/migrate-sqlite-to-postgres.ts   # copy all rows from prisma/dev.db
npx tsx scripts/export-db-to-json.ts            # re-export; git diff should be clean
```

The migration script refuses to run against a non-empty database unless passed `--force` (which wipes and re-copies).

### Environment variables

*   Local `.env`: `DATABASE_URL` — the Neon **direct** connection string (used by Prisma CLI and research scripts).
*   Vercel: the Neon Marketplace integration injects `DATABASE_URL`/`POSTGRES_URL` automatically; the feedback API uses them at runtime (`FEEDBACK_DB_URL` → `POSTGRES_URL` → `DATABASE_URL`, first one set wins). Prefer the **pooled** string on Vercel.

## Feedback System (Epic F1)

This project contains a user feedback collection system that captures bugs, feature suggestions, data corrections, and general feedback directly in the UI.

### Configuration

To enable feedback persistence, configure the following environment variables in `.env`:

*   `FEEDBACK_DB_URL` (or `POSTGRES_URL`): A PostgreSQL connection string (e.g. from Neon or Supabase) where submissions will be persisted. If not set, the app will automatically log feedback to the console and store it in an in-memory cache (great for local testing without database setup). The `feedback` table will be automatically created on the first submission.
*   `ADMIN_TOKEN`: A secret token of your choice used to authenticate access to the retrieved feedback submissions.

### API Endpoints

*   `POST /api/feedback`: Submits a feedback record. Request body schema:
    ```json
    {
      "category": "Bug" | "Feature idea" | "Data is wrong" | "General",
      "message": "Feedback message string (required)",
      "email": "Optional user email",
      "rating": 1 | 2 | 3 | 4 | 5 (Optional rating integer),
      "pagePath": "Current URL path (auto-captured)",
      "userAgent": "User's browser agent (auto-captured)"
    }
    ```
*   `GET /api/feedback`: Retrieves all feedback records (newest first). Requires the header:
    `Authorization: Bearer <ADMIN_TOKEN>`

## College Scorecard Refresh (Epic D1)

This project contains a database structure and utility scripts for linking and updating college data with official federal metrics from the College Scorecard API.

### Database Updates
The `College` schema supports the following Scorecard metrics:
*   `ipedsUnitId`: Federal IPEDS ID (join key).
*   `completionRate`: Overall 150% normal-time graduation rate.
*   `medianEarnings`: Median earnings 10 years after entry.
*   `netPrice0_30k`, `netPrice30_48k`, `netPrice48_75k`, `netPrice75_110k`, `netPrice110kPlus`: Net price averages by household income bracket.

### Refresh Scripts

1.  **Configure API Key**: Ensure `.env` contains `COLLEGE_SCORECARD_API_KEY` with a valid Data.gov key.
2.  **IPEDS Linking**: Match existing database records to IPEDS UnitIDs:
    ```bash
    npx tsx scripts/link-ipeds-ids.ts
    ```
3.  **Dry-run Refresh**: Preview the scorecard API diff without updating the database:
    ```bash
    npx tsx scripts/refresh-scorecard.ts --dry-run
    ```
4.  **Execute Refresh**: Query the Scorecard API in optimized batches of 100 and update the local database:
    ```bash
    npx tsx scripts/refresh-scorecard.ts
    ```
5.  **Majors & Outcomes Refresh (Epic M1)**: Pull field-of-study data (top 10 bachelor's majors per college with median earnings 1/4 yrs after graduation, national medians for the same major, and federal loan debt) from the same Scorecard API:
    ```bash
    npx tsx scripts/refresh-majors.ts --dry-run   # preview
    npx tsx scripts/refresh-majors.ts             # write to Postgres
    ```
6.  **Export to JSON**: Commit database updates to the static JSON payload (`src/data/colleges.json`):
    ```bash
    npx tsx scripts/export-db-to-json.ts
    ```

