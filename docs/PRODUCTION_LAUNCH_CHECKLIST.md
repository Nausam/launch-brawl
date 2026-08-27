# Launch Brawl production launch checklist

This is the release gate for the Firestore-backed Launch Brawl app. A green TypeScript build is not a substitute for the external credential, webhook, and payment checks below.

## 1. Release candidate

- [ ] Review the current diff and confirm no demo mode is enabled in the production deployment.
- [ ] Run `npm.cmd run typecheck`, `npm.cmd run lint`, `npm.cmd test`, and `npm.cmd run build`.
- [ ] Run `npm.cmd run verify:env -- --production`; it must exit 0.
- [ ] Confirm `GET /api/health` returns HTTP 200 with `ok: true` from the deployed origin.
- [ ] Confirm the production origin is HTTPS and `NEXT_PUBLIC_APP_URL` has no trailing path.

## 2. Firestore and data

- [ ] Use the intended production Firebase project and database ID.
- [ ] Deploy `firestore.rules` and `firestore.indexes.json`.
- [ ] Confirm client reads and writes remain denied; all domain mutations use the Admin SDK.
- [ ] Run `npm.cmd run db:init` once. It is idempotent and creates platform defaults, feature flags, achievement definitions, and quest templates.
- [ ] Run `npm.cmd run migrate:production-data -- --dry-run` against staging, review the field and collection counts, then run it with `--apply`.
- [ ] Confirm the migration creates a current season and deterministic `seasonProductStats` records when the existing project has no season yet.
- [ ] Run `npm.cmd run verify:production-data` and keep the JSON report with the release artifact. Use `npm.cmd run repair:production-data -- --apply` only after reviewing a failed verification.
- [ ] Run `npm.cmd run verify:db` and record the baseline counts.
- [ ] Import or review real categories, published products, owners, rounds, seasons, and settings before opening public traffic.
- [ ] Never run `db:seed` or `db:reset` against production. The scripts refuse production; keep that guard intact.

## 3. Clerk

- [ ] Configure the production Clerk instance with the expected sign-in/sign-up URLs.
- [ ] Set `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` and `CLERK_SECRET_KEY`.
- [ ] Point the Clerk webhook to `/api/webhooks/clerk` and set `CLERK_WEBHOOK_SIGNING_SECRET`.
- [ ] Deliver signed `user.created`, `user.updated`, and `user.deleted` test events.
- [ ] Verify `users/{clerkUserId}`, `usernames/{username}`, and `clerkWebhookEvents/{eventId}` are written once and a replay returns `duplicate: true`.
- [ ] Verify an admin ID in `ADMIN_USER_IDS` receives `ADMIN` only through the server-side bootstrap path.

## 4. Freemius and campaigns

- [ ] Set live `FREEMIUS_PRODUCT_ID`, `FREEMIUS_API_KEY`, `FREEMIUS_SECRET_KEY`, `FREEMIUS_PUBLIC_KEY`, and `FREEMIUS_PLAN_ID_SPONSORED_REACH`; never expose the secret key to the client.
- [ ] Set `FREEMIUS_SANDBOX=false` only for production and configure `https://YOUR_DOMAIN/api/freemius/webhook` in the Freemius product.
- [ ] Configure the Freemius checkout success redirect to `https://YOUR_DOMAIN/api/bid/freemius`.
- [ ] Enable `license.created`, `license.cancelled`, `license.deleted`, and `license.expired` events.
- [ ] Keep `/api/cron/brawls` scheduled at least every minute; it reconciles pending Freemius licenses when a webhook or checkout redirect is delayed.
- [ ] Use Freemius sandbox first: create a supported bid package, complete the sandbox checkout, verify the webhook/redirect, replay the event, then complete a Freemius refund and verify license reconciliation.
- [ ] Verify the Freemius license mapping, bid, campaign, round revenue, winner, and refund state are transactionally consistent.
- [ ] Verify a stale/outbid bid is rejected without allocating campaign inventory.
- [ ] Verify a repeated checkout event does not double-create a campaign or increment round revenue twice.
- [ ] Verify a refunded leader selects the next active bid and does not leave paid ranking data in the organic Brawl systems.
- [ ] Confirm sponsored positions are visibly labeled and paid data is not used for ratings, XP, leagues, or achievements.

## 5. Cron and operations

- [ ] Set a high-entropy `CRON_SECRET` and configure the scheduler to send `Authorization: Bearer <secret>`.
- [ ] Run `POST /api/cron/brawls` manually in staging and confirm a JSON result for Brawls, rounds, maintenance, and seasons.
- [ ] Schedule it at least every minute; lifecycle work is idempotent and can be retried.
- [ ] Monitor failures for Brawl finalization, round rollover, campaign expiry, challenge expiry, quest rotation, Daily Picks settlement, bounty expiry, and season rollover.
- [ ] Configure `RESEND_API_KEY` and `RESEND_FROM_EMAIL`; in-app notifications remain authoritative and the notification delivery job retries email asynchronously.
- [ ] Configure Redis before enabling any production mutation. Without Redis, production rate limits fail closed.

## 6. Security

- [ ] Confirm `NEXT_PUBLIC_DEMO_MODE=false` (or unset) in production.
- [ ] Confirm CSP, HSTS, referrer policy, frame, MIME, and permissions headers on the deployed origin.
- [ ] Confirm unsafe cross-origin API mutations are rejected and webhook/cron routes are separately signature/secret protected.
- [ ] Verify submitted website/logo URLs accept only public HTTP(S), reject credentials/private IPs, and that preview redirects are revalidated after DNS resolution.
- [ ] Verify `/go/{productId}` validates the stored URL, rate-limits by source, records the event, and never accepts an arbitrary redirect target.
- [ ] Review admin audit logs after a product, settings, feature-flag, finalization, and refund action.
- [ ] Confirm private dashboard/admin routes are noindex and robots rules do not expose API/private surfaces.
- [ ] Review legal, privacy, advertising, retention, and support copy for the operating jurisdiction before taking live money.

## 7. Manual smoke test

- [ ] Anonymous visitor: home, discover, category, product, Brawls, leagues, seasons, picks, quests, tastemakers, Hall of Fame, legal pages.
- [ ] Signed-in maker: profile save, product submit, ownership enforcement, product edit, publish/moderation transition, archive.
- [ ] Signed-in community user: one vote, one prediction, duplicate rejection, challenge/rematch authorization, notification read state.
- [ ] Admin: product/user/Brawl/campaign/bid/settings/analytics screens show Firestore state and empty states, not fixtures.
- [ ] Campaign: qualified impression, duplicate impression rejection, outbound click attribution, daily aggregate counters.
- [ ] SEO: sitemap includes published products and completed Brawls/seasons; private routes are not indexed.

## 8. Rollback

- [ ] Keep the previous application artifact available for rollback.
- [ ] Disable new sponsored rounds or set new campaigns paused if payment/campaign reconciliation is degraded.
- [ ] Do not delete Firestore events or ledger documents during rollback; replay idempotent webhooks/jobs after recovery.
- [ ] Record the incident, affected Freemius event/license IDs, round IDs, campaign IDs, and any manual reconciliation.

## Known limitations

- External Clerk, Freemius, Resend, Redis, Firebase, scheduler, and object-storage credentials are not available in this checkout, so live delivery and payment reconciliation cannot be claimed as externally verified here.
- User media uploads use signed S3-compatible PUT URLs and `uploadRecords`; object-storage lifecycle, malware scanning, and CDN policy still need to be configured by the hosting operator.
- Fraud controls are deterministic deduplication, visibility qualification, ownership validation, SSRF checks, and rate limiting. A full bot/identity-risk provider and human moderation queue still require an operating decision.
