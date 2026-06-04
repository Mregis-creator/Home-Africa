# HOME AFRICA

## Local development

1. Install dependencies:

   ```bash
   npm install
   ```

2. Start a local hybrid dev server (requires Vercel login):

   ```bash
   npm run dev
   ```

   This uses Vercel Dev to serve the static site and API functions together.

   If you are not logged in, run:

   ```bash
   npx vercel login
   npm run dev
   ```

3. If you only want to run the static frontend locally without Vercel dev:

   ```bash
   npm run local
   ```

   This starts a plain static server on port 3000.

## Environment variables

Create a `.env` file from `.env.example`, and set:

- `SUPABASE_URL`
- `SUPABASE_ANON_KEY`
- `RESEND_API_KEY`
- `FROM_EMAIL`
- `SITE_URL`

Vercel Dev will load the `.env` file locally, and Vercel will use the project environment variables in production.

## Serverless functions

### `/api/supabase-config`

- Injects `SUPABASE_URL` and `SUPABASE_ANON_KEY` into the browser.
- Protects your application from hard-coded keys in committed source.

### `/api/send-email`

- Sends email through Resend using `RESEND_API_KEY`.
- Expected request body:

```json
{
  "to": "user@example.com",
  "subject": "Hello from HOME AFRICA",
  "html": "<p>This is a test email.</p>",
  "text": "This is a test email."
}
```

## Notes

- The app remains primarily static, with a minimal dynamic API layer.
- `npm run dev` is the recommended local workflow for developing both static pages and Vercel functions.
