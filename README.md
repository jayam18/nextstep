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

