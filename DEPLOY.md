# Deploying BharathMela

The app is a standard Next.js server with Postgres. The setup below uses services with free or cheap
starting tiers; any equivalent works (the app only needs Postgres, an S3-compatible bucket, and the
email and SMS APIs).

| Piece | Suggested service | Why |
| --- | --- | --- |
| Web app + daily job | **Vercel** | Runs Next.js as is; `vercel.json` schedules `/api/cron/daily` |
| Database | **Neon** or **Supabase** Postgres | Managed Postgres with backups and point-in-time restore |
| Photos | **Cloudflare R2** | S3-compatible, no egress fees; serve through a custom domain |
| Email | **Resend** | Verification codes, messages, quotes, alerts |
| Text messages | **Twilio** | Seller phone verification |
| AI ad writer (optional) | **Anthropic API** | Pro-plan ad drafts |

## 1. Create the services

1. **Postgres**: create a database and copy its connection string (with `?sslmode=require`).
2. **R2**: create a bucket (e.g. `bharathmela-photos`), connect a custom domain such as
   `photos.yourdomain.com` (or enable the public `r2.dev` URL), and create an API token with
   read/write access to that bucket.
3. **Resend**: add and verify your sending domain (it gives you SPF and DKIM DNS records), then create an
   API key. Without a verified domain, emails land in spam.
4. **Twilio**: buy a US number and **register it for A2P 10DLC** (required to text US numbers from an
   app; approval takes a few days).
5. **Vercel**: import the GitHub repository.

## 2. Settings (Vercel → Project → Settings → Environment Variables)

| Variable | Required | Value |
| --- | --- | --- |
| `DATABASE_URL` | yes | Postgres connection string |
| `APP_URL` | yes | `https://yourdomain.com` (used in emails, sitemap, canonical URLs, share cards) |
| `CRON_SECRET` | yes | A long random string (`openssl rand -hex 32`); Vercel Cron sends it automatically |
| `RESEND_API_KEY` | yes | From Resend |
| `EMAIL_FROM` | yes | `BharathMela <no-reply@yourdomain.com>` (a verified domain) |
| `S3_BUCKET`, `S3_ENDPOINT`, `S3_REGION`, `S3_ACCESS_KEY_ID`, `S3_SECRET_ACCESS_KEY` | yes (else photos are lost on redeploy) | From R2: endpoint `https://<account>.r2.cloudflarestorage.com`, region `auto` |
| `S3_PUBLIC_URL` | with S3 | `https://photos.yourdomain.com` |
| `TWILIO_ACCOUNT_SID`, `TWILIO_AUTH_TOKEN`, `TWILIO_FROM` | recommended | From Twilio |
| `PAY_ZELLE`, `PAY_VENMO` | yes | Where sellers send plan payments |
| `SUPPORT_EMAIL` | yes | Where Contact page messages go, and the address shown on Contact, Terms and Privacy (e.g. `support@yourdomain.com`) |
| `EMAIL_FOOTER_ADDRESS` | yes for alerts | Your business mailing address for email footers (CAN-SPAM) |
| `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET` | optional | "Continue with Google" (see below) |
| `APPLE_CLIENT_ID`, `APPLE_TEAM_ID`, `APPLE_KEY_ID`, `APPLE_PRIVATE_KEY` | optional | "Continue with Apple" (see below) |
| `ANTHROPIC_API_KEY` | optional | Turns on the AI ad writer |
| `GOOGLE_SITE_VERIFICATION` | optional | Search Console "HTML tag" code |
| `FOUNDING_SELLERS_PER_CITY` | optional | How many sellers per city get free Pro as founding sellers (default 50; 0 turns it off) |
| `FOUNDING_PRO_DAYS` | optional | How long founding sellers get Pro free (default 90) |

The server logs a `[config]` line at startup for anything missing, and `/api/health` returns 503 until
the required settings and the database are in place.

### Sign in with Google and Apple (optional)

The buttons appear on the login and sign-up pages once a provider's settings are present.

**Google** (free):
1. Google Cloud Console → create a project → **APIs & Services → OAuth consent screen**: External, app name
   BharathMela, your support email, and your domain under authorized domains. Publish it.
2. **Credentials → Create credentials → OAuth client ID** → Web application. Authorized redirect URI:
   `https://yourdomain.com/api/auth/google/callback`.
3. Put the client ID and secret in `GOOGLE_CLIENT_ID` and `GOOGLE_CLIENT_SECRET`.

**Apple** (needs an Apple Developer account, $99 a year):
1. Certificates, Identifiers & Profiles → **Identifiers → App ID** with "Sign in with Apple" enabled.
2. **Identifiers → Services ID** (e.g. `com.yourdomain.web`) → enable Sign in with Apple → configure:
   domain `yourdomain.com`, return URL `https://yourdomain.com/api/auth/apple/callback`. This is `APPLE_CLIENT_ID`.
3. **Keys → +** → Sign in with Apple → download the `.p8` file once. Its Key ID is `APPLE_KEY_ID`; paste the
   whole file (with the BEGIN/END lines) into `APPLE_PRIVATE_KEY`. Your Team ID (top right) is `APPLE_TEAM_ID`.

People who sign in this way get an account with their email already verified; someone who already has an
account with that email is signed into it. Add Google and Apple to the processors in the Privacy Policy.

## 3. Build and first deploy

- **Build command:** `npm run db:deploy && npm run build` (applies database migrations, then builds).
- Deploy, then create your admin account once, from your machine, against the production database:

  ```bash
  DATABASE_URL="<production url>" ADMIN_EMAIL=you@yourdomain.com ADMIN_PASSWORD='a long passphrase' npm run create-admin
  ```

  Never run `npm run db:seed` in production; it loads sample listings and refuses to run there.
- Check `https://yourdomain.com/api/health` returns `{"ok":true}`.

## 4. After it's live

- **Search engines:** add the site to Google Search Console and Bing Webmaster Tools, verify it, and
  submit `https://yourdomain.com/sitemap.xml`. Test a listing and an event page with Google's Rich
  Results Test.
- **Uptime:** point an uptime monitor (Better Stack, UptimeRobot) at `/api/health`.
- **Daily job:** confirm it ran in Vercel → Cron Jobs; it expires listings, sends reminders and saved-search
  alerts, and cleans up old sessions and counters.
- **Backups:** turn on point-in-time restore in your Postgres provider and enable R2 bucket versioning.
- **Errors:** request errors are logged as one JSON line each (Vercel → Logs). Add Sentry later if you want
  alerts.
- **Analytics:** in Vercel → your project → Analytics, click **Enable** (Web Analytics; free on Hobby, no
  cookies). Sign-ups by source, referrals and founding sellers are under **Admin → Growth**.

## Growth tools built in

- **Tagged links:** add `?utm_source=<where>&utm_campaign=<what>` to any link you post (e.g.
  `?utm_source=telugu-assoc&utm_campaign=jax-launch`); sign-ups from it show under Admin → Growth.
  Share buttons and QR posters tag themselves.
- **Sellers:** "Share & earn free Pro" on the seller dashboard has their page link, share buttons, a QR code
  and a printable poster, and their referral link (a free Pro month for each referred seller who posts a
  listing, up to 12 a year).
- **Founding sellers:** the first `FOUNDING_SELLERS_PER_CITY` verified sellers in each city get Pro free.
- **Emails from the daily job:** "how was it?" review requests 3 days after a buyer messages a seller, and
  on the 1st of each month the "new in your city" email to people who opted in.

## 5. Before inviting the public (not code)

- [ ] Have a lawyer review the Terms of Service and Privacy Policy, especially for housing (Fair Housing
      Act), domestic help, legal, tax and food listings, and the platform-only disclaimer.
- [ ] Update the Privacy Policy to name your processors: hosting, database, Resend, Twilio, Cloudflare, and
      Anthropic if the AI writer is on.
- [ ] Set up a support inbox and put it in `SUPPORT_EMAIL` (it then shows on Contact, Terms and Privacy).
- [ ] Fill in the legal entity name and address placeholders on the Terms and Privacy pages.
- [ ] Decide who reviews the admin queue (held listings, reports, payments) and how often.
- [ ] Payments are confirmed by hand (Zelle/Venmo) until Stripe is added.
