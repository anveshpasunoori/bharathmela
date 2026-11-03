# DesiBazaar

A local marketplace for Indian home businesses in US cities: home kitchens, tutors, pujaris, artists and sellers. Buyers browse free. **Vendors pay the platform** for a monthly plan and for featured ads.

## Run locally

```bash
npm install
cp .env.example .env
npm run db:migrate
npm run db:seed
npm run dev
```

Open http://localhost:3000. Seeded logins (dev only):

- Admin: `admin@desibazaar.test` / value of `SEED_ADMIN_PASSWORD` in `.env`
- Sample vendors: see `prisma/seed.ts`

## Revenue model

Configured in `src/lib/plans.ts`.

| Plan  | Price / 30 days | Active listings | Extras |
|-------|-----------------|-----------------|--------|
| Free  | $0              | 1               |        |
| Basic | $9.99           | 5               |        |
| Pro   | $24.99          | 25              | "Pro seller" badge, ranked above Free/Basic |

**Featured ads:** $5 for 7 days or $15 for 30 days per listing. Featured listings are pinned to the top of their city and category.

## How vendor payments work (for now)

There is no payment processor yet. Payments are confirmed by hand:

1. A vendor picks a plan or ad, pays you by Zelle/Venmo (handles set in `.env`), and enters the transaction reference.
2. This creates a `PENDING` `Payment` along with its `Subscription` or `AdBoost`.
3. An admin confirms the money arrived and clicks **Approve** in `/admin`. The plan or ad starts right away. **Reject** records a reason the vendor can see.

Same-plan renewals extend the current period, and featured ads stack. Expired plans and ads are cleaned up lazily on page loads (`syncExpirations` in `src/lib/billing.ts`). Listings above a vendor's new limit are hidden automatically.

**Adding Stripe later:** replace `PaymentFields` with a Stripe Checkout redirect, and have the Stripe webhook call `approvePayment()`. The data model stays the same.

## Liability protections

DesiBazaar is set up as a neutral listing platform. The Terms of Service and Privacy Policy at `/terms` and `/privacy` are **drafts with [placeholders]; have a lawyer review them**.

- Sellers must accept the Terms at signup (`termsVersion` / `termsAcceptedAt` on `User`), and must confirm each listing follows the rules.
- Category rules (`src/lib/legal.ts`) are shown when posting and to buyers (Fair Housing for rentals, food permits, domestic help).
- Platform disclaimer in the footer and on every listing; anyone can report a listing; admins remove listings from `/admin`.

## Guardrails

**Listings**
- Automatic screening (`src/lib/moderation.ts`). Discriminatory preferences are blocked in rentals and domestic help ("Indians only", "no kids", "prefer Hindu cook"). Prohibited items are blocked everywhere: weapons, drugs, alcohol, tobacco, counterfeits, adult services, fireworks, fake documents.
- Scam signals are flagged instead of blocked: wire transfers, gift cards, crypto, "out of the country" landlords, MLM pitches, cure claims, links.
- These go to the admin review queue before going live: a seller's first listing, every rental and domestic-help listing, anything flagged, and edits to rejected listings.
- A listing with 3 open reports is taken down until an admin reviews it. Admin-removed listings can't be restored by the seller.

**Accounts**
- Buyers and sellers both verify their email with a code. Throwaway email domains are rejected.
- Weak passwords are rejected. Changing a password signs out other devices.
- Rate limits cover login, signup, reports, ratings, listings and payments (`src/lib/rate-limit.ts`, in memory: use Redis when running more than one server).
- Admins can suspend users: they're signed out, can't log in, and their listings and ratings are hidden.
- Users can delete their own account at `/account`. Profile data is anonymized and payment records are kept.

**Ratings**
- Only buyers with a verified email can rate, and only once per seller. Accounts must be 10 minutes old.
- Each rating needs an honesty confirmation. Links, phone numbers and emails are blocked in comments.
- Sellers can reply publicly but can't delete ratings.

**Payments**
- A transaction ID can't be submitted twice. Admins see a warning when a reference repeats.

**Admin**
- Tabs for payments and reports, listings to review, users, and an activity log that records every admin decision.

**Security headers**
- Content Security Policy, no framing, nosniff, a strict referrer policy and a permissions policy, plus HSTS in production (`next.config.ts`).

## Dietary markers (food)

Food listings can carry Vegetarian, Vegan, Jain, Eggless, Gluten-free, Dairy-free, Nut-free, Organic and Halal markers (`DIET_TAGS` in `src/lib/constants.ts`). Vegan also marks Vegetarian, Eggless and Dairy-free, and Jain also marks Vegetarian. Buyers can filter food by any combination of markers. Markers are the seller's own claims: sellers see rules about cross-contact and USDA organic certification, and buyers see a "not verified" note. The AI writer only adds markers the seller stated.

## AI ad writer (Pro plan)

Pro sellers describe their idea and Claude drafts the title, description and price (`src/lib/ai.ts`). The writer is told to drop discriminatory preferences. It needs `ANTHROPIC_API_KEY`; without one it shows "not set up". The limit is 20 drafts per seller per day (`AI_DAILY_LIMIT`).

## Ratings

Buyers sign up at `/signup` and must verify their email with a 6-digit code before rating. Throwaway email providers and domains that can't receive mail are rejected. Each buyer can rate each seller once (posting again updates the rating). Codes are emailed through Resend when `RESEND_API_KEY` is set; otherwise they are printed to the server log. Admins can hide fake or abusive reviews.

## Code layout

- `prisma/schema.prisma`: User, Session, VendorProfile, Listing, Subscription, AdBoost, Payment
- `src/lib/billing.ts`: current plan, listing limits, approve/reject, expiry
- `src/app/actions/`: server actions (auth, vendor, admin)
- `src/app/`: pages (`/`, `/listing/[id]`, `/pricing`, `/vendor/*`, `/admin`)
