# Readable business URLs

New seller signups and existing buyers becoming sellers now reserve a persistent `/city-state/business-name` URL in the same transaction as profile creation. City/state comes from the saved town, with ZIP and metro fallbacks for older records. IDs remain internal. Duplicate names in a city receive `-2`, `-3`, etc.; reservations are serialized with a transaction advisory lock and protected by a unique database index.

Saved paths stay stable across profile name and location edits. Both `/seller/<id>` and `/seller/<id>-<name>` permanently redirect to the saved address. Suspended/deleted accounts remain hidden. Business cards, messages, quotes, sharing/QR links, canonical metadata, structured data and sitemap entries all use the shared path helper.

## Deployment

1. Apply the additive migration before starting the updated application: `npm run db:deploy`.
2. Generate the Prisma client: `npx prisma generate` (also run by install).
3. With `DATABASE_URL` configured, run `npm run db:backfill-seller-urls` before publishing the updated sitemap. This assigns paths to existing businesses, oldest first, in batches. It is safe to resume and does not overwrite assigned paths.
4. Deploy the application and verify a new signup, an existing ID link redirect, and a new clean URL.

Until the backfill finishes, existing internal links retain their legacy address and assign a path when visited. New signups always receive clean URLs immediately. No database migration or backfill was run from the development checkout because it has no configured database connection.

Checks: `npm run test:seller-urls`, `npx tsc --noEmit`, and ESLint on changed source files. Database concurrency and HTTP redirects should also be checked against a migrated test database.
