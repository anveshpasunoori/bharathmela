# BharathMela

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

- Admin: `admin@bharathmela.test` / value of `SEED_ADMIN_PASSWORD` in `.env`
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

BharathMela is set up as a neutral listing platform. The Terms of Service and Privacy Policy at `/terms` and `/privacy` are **drafts with [placeholders]; have a lawyer review them**.

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

## Room rentals

Rental listings have structured details (`src/lib/rentals.ts`, stored as JSON in `Listing.details`):
- **The space:** type (private room, shared room, paying guest, apartment, condo, townhouse, house, in-law unit), bedrooms and baths for whole units, bathroom, furnishing.
- **Terms:** monthly rent, available-from date, lease length, deposit, utilities.
- **Extras:** parking, laundry, amenities, house rules, and neighborhood or cross streets. The exact address is never posted.
- **Roommate gender preference:** offered only when the poster lives in the home and shares it. Fair-housing rules generally allow sex preferences only for shared living. Every other "who" preference stays blocked.
- **Listing pages:** a scam warning, a facts grid, and an "area on map" link.
- **Filters:** space type, max rent, move-in date, private bath, furnished, pets allowed.
- **Search:** covers rental details too ("attached bath", "PG", "wifi", neighborhood names).

## Weddings & event services (including party rentals)

The `EVENT_SERVICES` category (`src/lib/event-services.ts`) covers photographers, videographers, DJs, bartenders, decorators, makeup, mehndi, dhol, live music, MCs, choreographers, planners, photo booths, catering, cakes, invitations and party rentals.
- **What vendors pick:** services, occasions (weddings, sangeet, haldi/mehndi, receptions, birthdays, baby showers/seemantham, housewarming, corporate…), areas served, languages and self-reported liability insurance.
- **Party rentals** also list rental items (tents, tables and chairs, linens, mandap, jhoola and throne chairs, backdrops, serving gear, dance floors, AV, lights, bounce houses, outfits, generators) and whether they deliver and set up.
- **Required confirmations:**
  - Bartenders: they serve host-provided alcohol to 21+ guests only, or hold a liquor license.
  - Photographers and videographers: their portfolio is their own work, with consent from the people in it.
  - Bounce-house renters: insurance, inspection and trained setup.
- **Buyer filters:** service, rental item, occasion and insured. Search covers terms like "bouncy castle", "jhula rental", "seemantham photographer" and "dhol for baraat".

## Realtors and lawyers

Two licensed-professional categories, `REALTOR` and `LEGAL` (`src/lib/professionals.ts`):
- **Required details:** license number, issuing state, and firm (brokerage or law firm). Sellers also pick services or practice areas (immigration, family, wills, NRI matters and more) and languages (Hindi, Telugu, Tamil and others), and can offer a free consultation.
- **Review:** every listing goes to admin review. The queue shows the license with a lookup link and asks the admin to confirm the name matches.
- **Ad rules:**
  - *Lawyers:* outcome guarantees and "notario" or immigration-consultant offers are blocked; "certified specialist" claims are flagged. Pages carry attorney-advertising disclaimers.
  - *Realtors:* sale or price guarantees are blocked and rebate offers are flagged. Fair-housing screening applies, including steering like "Indian neighborhood".
- **Browse:** filter by service or practice area, language and free consultation. Search understands "attorney", "green card lawyer", "h1b", "real estate agent" and "buy a home".

## "I need a place to live" (room requests)

Renters post what they're looking for at `/rooms-wanted/new`. Owners browse at `/rooms-wanted`, which also appears as a tab under Room Rentals.
- **Who can post:** any verified account, free. Up to 2 active posts per person, each expiring after 60 days and renewable.
- **A post holds:** budget, move-in date, stay length, the kinds of space they'd take, preferred areas, and must-haves (private bath, furnished, parking, has a pet).
- **Owner filters:** "My rent" shows renters whose budget covers it. Owners can also filter by space type and move-in date, and search.
- **Contact without exposing emails:**
  - Owners message renters through the site. The renter gets an email with the owner's address as reply-to, so neither email is shown publicly.
  - Messages asking for wire transfers, gift cards, crypto or payment before viewing are refused.
  - Owners can send 15 messages a day, and one per post per day.
  - Every message is logged (`Message` model).
- **Privacy:** only the renter's first name is shown.
- **Fair housing:** renters may describe themselves, so preference wording isn't held for review. Prohibited items and scam signals still are.
- **Moderation:** posts can be reported (3 reports put a post on hold) and removed by admins.

## Events

Sellers can also post events as organizers at `/vendor/events/new`: concerts, dance performances, festival celebrations, pujas, community events, workshops, kids' events and comedy/film/theatre. Each event can be tagged with a festival (Diwali, Navratri/Garba, Holi, Ganesh Chaturthi and more).
- **Plan limits:** Free gets 1 upcoming event, Basic 3, Pro 10.
- **Moderation:** the same screening as listings. An organizer's first event, and any ticket link outside well-known ticketing sites, go to admin review. Events can be reported, and 3 reports put an event on hold.
- **Browse at `/events`:** filter by date (today, this weekend, next 7 or 30 days), type, festival and free entry, with search.
- **Event pages:** Google Calendar, Apple/Outlook (.ics) and map links.
- **Times:** stored in UTC and shown in each city's time zone (`src/lib/events.ts`).

## Location

Location is app-wide and lives in the top bar ("📍 Fremont, CA ▾") on every page.
- **Picked up automatically:**
  - On the first visit, the city comes from the hosting platform's IP headers (`x-vercel-ip-latitude/longitude` on Vercel, `cf-iplatitude/longitude` on Cloudflare). No prompt and no outside service.
  - The browser is then asked once for the precise location (`AutoLocate`). If the visitor allows it, the app switches to their real city with "near you" distances. If they decline, it never asks again.
  - A city the visitor picks by hand always wins over these guesses.
- **The panel:** "Use my current location", a ZIP code, or a city from the list.
- **What's stored:**
  - A precise location keeps city, ZIP and coordinates rounded to about 1 km in an httpOnly cookie for 6 months.
  - A picked city keeps only the metro.
  - Nothing goes in the database (`src/lib/user-location.ts`, `src/lib/geo.ts`).
- **Overrides:** a `?metro=` in the URL (e.g. "Found in other cities" links) wins for that page.
- **Near-you browsing:** with a precise location, home and category pages browse within 5/10/25/50/100 miles across metros, sort by distance and label "N mi away". "All of <metro>" switches back to metro browsing; it's only offered when that metro is within 60 miles (`LOCAL_MILES`).
- **Far from every metro:** pages say so plainly ("BharathMela isn't in Billings, MT yet. Showing Denver, CO, our nearest city (454 mi away)") instead of passing the nearest metro off as local.
- **Metros:** 25 cities in `src/lib/metros.ts`, including Jacksonville, Orlando, Tampa Bay and Miami. Add a city there with its center and time zone.

## Buyer experience

- **Home:** search, a one-line location ("📍 Fremont, CA · within 25 mi · Change"), category tiles with live counts, then upcoming events. Listings appear after picking a category or searching.
- **Category pages:** a compact header and scrollable category and dietary chips on phones. Sort by Recommended, Nearest, price (both directions), Top rated or Newest.
- **Paid placement:** labeled "Sponsored" (featured ads) or "Pro" (paid plan), with a note that Recommended order includes paid placement.
- **Listing pages:**
  - A photo gallery, plus Share (the phone's share sheet or a copied link) and Save (♡, shortlist at `/saved`).
  - Distance from the buyer.
  - "Ask the seller a question": a message relayed by email with the buyer as reply-to, rate-limited and logged.
  - On phones, a sticky Call/Text/WhatsApp bar.
- **Prices:** shown as "From $2,500" for starting prices.

## Trust and freshness (gaps found on Sulekha)

- **Freshness:** listings show for 90 days (`LISTING_DAYS`). Sellers get one reminder email a week before expiry and can renew in one click, and editing also renews. Expired listings are hidden from buyers. Cards show "Updated 3 days ago", and listing pages show the posted date.
- **Sponsored cap:** at most 2 sponsored listings are pinned per results page. When more have paid, they rotate hourly.
- **Duplicates** (`src/lib/duplicates.ts`): reposting your own ad is blocked ("edit that one instead"). Text that closely matches another seller's ad goes to review as a possible copy.
- **Seller badges:** "Active today / this week / this month" (from their last visit), "Phone verified" (texted code via Twilio, or the server log in development) and "Email verified".
- **Typical rent:** room listings show the median rent for the same space type within 15 miles, once there are 5+ comparable listings. Rent under half of typical gets a scam warning.

## Listing photos

Sellers can add up to 6 photos per listing (`src/lib/photos.ts`).
- **Accepted files:** the image data must be JPEG, PNG or WebP, at least 300 px, up to 8 MB.
- **Processing:** photos are resized to 1600 px plus a 600×450 thumbnail, converted to WebP, and stripped of all metadata, including GPS.
- **Moderation:** admins see photos in the review queue. New photos from sellers under 30 days old send a live listing back to review. "Inappropriate or stolen photo" is a report reason.
- **Storage:** files live under `public/uploads/` for local development. **Move storage to S3 or Cloudflare R2 before production.**
- **iPhones:** HEIC photos are converted to JPEG by the phone when uploading to the site.

## Search

`src/lib/search.ts` ranks one city's listings in memory:
- **Spelling variants and synonyms** for desi terms: biriyani/biryani, pooja/puja, "meal box" → tiffin, "priest" → pandit, "housewarming" → griha pravesh.
- **Matching:** plurals, typos (1 letter from 5-letter words, 2 from 8+), and half-typed words of 4+ letters.
- **Price limits** like "under $20" or "over $100".
- **Ranking:** title, diet markers and business name count more than the description. A category the query hints at gets a boost, and so do featured and Pro listings.
- **When results are thin:** "Did you mean" suggestions built from words in real listings, and result counts in other cities when yours has none.

Add spelling variants to `SYNONYMS` as you see real searches. `npm test` runs the search and listing-screening checks.

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
