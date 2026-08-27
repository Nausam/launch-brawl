# Launch Brawl

Launch Brawl is a transparent product discovery platform where launches compete for attention. The free directory and organic surfaces stay separate from the paid 24-hour sponsored leaderboard. A successful bid buys a labeled position plus a configurable promotional impression allocation; being outbid changes the position, not the campaign allocation.

## Stack

- Next.js 16 App Router, React 19, TypeScript strict mode
- Tailwind CSS v4 through `@tailwindcss/postcss`
- Firestore through the Firebase Admin SDK (database only; client reads/writes are denied)
- Clerk for Google/email authentication and signed user webhooks
- Freemius hosted checkout plus transaction-backed license webhooks for bidding and campaign allocation
- Resend, Upstash Redis, object storage, and Sentry integrations via environment variables
- Vitest, Testing Library, and Playwright

## Local setup

```powershell
npm.cmd install
Copy-Item .env.example .env.local
npm.cmd run dev
```

Open [http://localhost:3000](http://localhost:3000). Production and normal development read Firestore and show honest empty/error states when it has no records. For an explicit local demo only, set `NEXT_PUBLIC_DEMO_MODE=true` and run the guarded seed command below; demo data is never enabled in production.

Useful checks:

```powershell
npm.cmd run typecheck
npm.cmd run lint
npm.cmd test
npm.cmd run build
npm.cmd run test:e2e
```

## Environment variables

Copy `.env.example` to `.env.local` and set only what you have:

- `NEXT_PUBLIC_APP_URL`, `NEXT_PUBLIC_DEMO_MODE`
- Clerk: `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY`, `CLERK_SECRET_KEY`, `CLERK_SIGN_IN_URL`, `CLERK_SIGN_UP_URL`
- Firestore: `FIREBASE_PROJECT_ID`, `FIRESTORE_DATABASE_ID` (`launch-brawl`, not `(default)`), `FIREBASE_CLIENT_EMAIL`, `FIREBASE_PRIVATE_KEY`
- Freemius: `FREEMIUS_PRODUCT_ID`, `FREEMIUS_API_KEY`, `FREEMIUS_SECRET_KEY`, `FREEMIUS_PUBLIC_KEY`, `FREEMIUS_PLAN_ID_SPONSORED_REACH`, `FREEMIUS_SANDBOX`
- Email: `RESEND_API_KEY`, `RESEND_FROM_EMAIL`
- Redis (required in production): `UPSTASH_REDIS_REST_URL`, `UPSTASH_REDIS_REST_TOKEN`
- Object storage (required in production): `STORAGE_ENDPOINT`, `STORAGE_BUCKET`, `STORAGE_ACCESS_KEY_ID`, `STORAGE_SECRET_ACCESS_KEY`, `STORAGE_PUBLIC_URL`
- Operations: `CRON_SECRET`, `ADMIN_USER_IDS`, optional `SENTRY_DSN`

Never put Firebase Admin credentials in a `NEXT_PUBLIC_*` variable. The private key parser accepts escaped newlines.

## Firestore setup

1. Create a Firebase project and enable Firestore in production mode.
2. Create a server service account and put its project ID, client email, and private key in `.env.local`.
3. Deploy the deny-by-default rules and indexes after reviewing them:

```powershell
firebase deploy --only firestore:rules,firestore:indexes
```

4. Initialize production-safe defaults (settings, flags, achievement definitions, and today’s quest instances):

```powershell
npm.cmd run db:init
npm.cmd run verify:env -- --production
npm.cmd run verify:db
```

5. Seed development data only when explicitly requested:

```powershell
$env:NEXT_PUBLIC_DEMO_MODE="true"
$env:SEED_DATA="1"
npm.cmd run db:seed
npm.cmd run verify:db
```

The seed writes development fixtures only. `db:reset` is intentionally destructive and requires `CONFIRM_RESET=YES` plus `RESET_DATA=1`; use it only against a development Firebase project. `verify:env` and `verify:db` are read-only checks.

For an existing Firestore project, normalize the production data contract additively:

```powershell
npm.cmd run migrate:production-data -- --dry-run
npm.cmd run migrate:production-data -- --apply
npm.cmd run verify:production-data
```

The migration never deletes legacy documents and deliberately does not guess whether unclassified historical paid clicks were organic.

Collections and service seams include `users`, `products`, `categories`, `productMakers`, `productClaims`, `productMembers`, `productDrafts`, `launchEvents`, `uploadRecords`, `votes`, `favorites`, `leaderboardRounds`, `bids`, `campaigns`, `campaignDailyStats`, `campaignDailyPlacementStats`, `productDailyStats`, `brawlVoteWindows`, `dailyWinners`, `impressions`, `clicks`, `notifications`, `notificationDeliveries`, `brawls`, `brawlSeasons`, `seasonAwards`, `bossReigns`, `platformRecords`, `productAchievements`, `userAchievements`, `activityEvents`, `deals`, `adminAuditLogs`, `xpLedger`, `questTemplates`, and `settings`. Normal development and production use Firestore; an unavailable or empty Firestore instance produces an honest error/empty state. Typed fixtures are available only after explicitly enabling non-production demo mode.

Use deterministic IDs for uniqueness-sensitive records such as `votes/{userId_productId}`, `favorites/{userId_productId}`, webhook events, and daily aggregate stats. Bid activation, refund reconciliation, user webhooks, Brawl finalization, and round rollover are transaction-backed and safe to retry.

## Clerk

Create a Clerk application with Google and email sign-in enabled. Add the publishable and secret keys, configure the Clerk webhook endpoint at `/api/webhooks/clerk`, and set `CLERK_WEBHOOK_SIGNING_SECRET`. Clerk middleware protects dashboard/admin routes; server-side identity and Firestore role checks protect mutations and admin actions. The local UI can be inspected without Clerk, but authenticated systems correctly require sign-in.

## Freemius

Launch Brawl uses Freemius hosted checkout for the one-off Sponsored Reach plan. Bids are recalculated and validated on the server; browser amounts are not trusted. The supported package quotas are configured in `src/lib/bidding-pricing.ts` and must stay aligned with the Freemius bulk pricing tiers.

Checkout is created by `POST /api/bid`. The pending bid is recorded before the hosted checkout opens, and each checkout receives a unique bid record. Successful purchases are matched to the signed-in account and activate through a verified Freemius license webhook or signed checkout redirect. The protected `/api/cron/brawls` job and owner dashboard also reconcile pending Freemius licenses, so a delayed callback can recover without manual database edits.

Configure this webhook endpoint on the Freemius product:

```text
https://YOUR_DOMAIN/api/freemius/webhook
```

Enable license events for `license.created`, `license.cancelled`, `license.deleted`, and `license.expired`. Configure the checkout success redirect to:

```text
https://YOUR_DOMAIN/api/bid/freemius
```

Keep `FREEMIUS_SANDBOX=true` while verifying the sandbox flow. Set it to `false` only after a sandbox purchase, webhook delivery, signed redirect, stale-bid rejection, replay, and refund/license-revocation reconciliation have been verified. Freemius refunds are completed in Freemius Payments; the admin action records the request and the license webhook reconciles the local bid.

## Authentication and admin setup

`ADMIN_USER_IDS` is the bootstrap allowlist. Set it to Clerk user IDs, separated by commas; the signed Clerk user webhook preserves existing roles and bootstraps those IDs as `ADMIN`. Never create a hardcoded admin password. Every admin page and mutation re-checks the server-side role.

## Campaign measurement

`calculateCampaignImpressions(amountCents)` is centralized in `src/lib/utils.ts` and defaults to 20 impressions per dollar through the server bidding settings. Qualified impression events should be sent only after an `IntersectionObserver` confirms at least 50% visibility for at least one second. The event pipeline uses deterministic event IDs, Redis-backed rate limits in production, visibility-qualified impressions, ownership/campaign validation, and daily aggregates before incrementing counters. Review the remaining fraud signals in the launch checklist before opening inventory broadly.

Outbound product traffic uses `/go/[productId]`. The server validates the stored URL, records attribution metadata, and redirects only to `http`/`https` URLs. Do not accept arbitrary redirect targets from the browser.

## Deployment

The project includes a standalone-compatible `Dockerfile`:

```powershell
docker build -t launchbrawl .
docker run --env-file .env.local -p 3000:3000 launchbrawl
```

Deploy the standalone Docker image to a Docker-compatible Node host. Set `NEXT_PUBLIC_APP_URL` to the public HTTPS origin, configure the environment variables in the host, expose only the application port, and configure the load balancer health checks as follows:

- `GET /api/health/live` is the liveness check and stays available during dependency outages.
- `GET /api/health/ready` is the readiness check and returns 503 when required production integrations are unavailable.
- `GET /api/health` returns the same readiness report with integration details and no-store caching.

Use a separate external scheduler to call `POST /api/cron/brawls` with `Authorization: Bearer $CRON_SECRET` at least every minute. It runs Brawl lifecycle, sponsored-round lifecycle, maintenance, notification delivery, Daily Picks settlement, bounty expiry, payment reconciliation, and season rollover. Keep the narrower `/api/cron/round`, `/api/cron/maintenance`, and `/api/cron/seasons` routes available for isolated recovery jobs.

Keep the previous Docker image digest available for rollback. During an incident, set the platform maintenance/read-only flag before replaying jobs; never delete ledger, webhook, notification, audit, or activity documents.

## Production launch checklist

Use [docs/PRODUCTION_LAUNCH_CHECKLIST.md](docs/PRODUCTION_LAUNCH_CHECKLIST.md) as the release gate. It covers environment verification, Firestore initialization, Clerk and Freemius webhooks, cron, security, indexes, manual payment tests, rollback, and the known external limitations of this checkout.

## Launch Brawl Competitive Systems

The competitive layer extends the existing directory without changing the paid sponsored lane. It is Firestore-backed in normal development and production; only an explicitly enabled non-production demo mode may use typed fixtures.

### Brawl lifecycle

`SCHEDULED`/`UPCOMING` Brawls become `LIVE` through the lifecycle job and become `COMPLETED` only through the authoritative finalization service. Votes are accepted only for a valid product pair, once per signed-in user, through `brawlVotes/{brawlId}_{userId}`. Public pages show aggregate percentages; individual votes stay private.

Completed Brawls calculate Elo-style Brawl Rating (`1000` starting rating, configurable `K = 32`), win/loss/draw records, win rate, win streaks, upset score, close-Brawl detection, momentum, a data-driven Brawl Report, season points, product XP, and rivalry history. Finalization is guarded by the completed status and deterministic report/activity IDs so retrying a job is safe.

### Competitive progression

- Product competitive aggregates live in `productCompetitiveStats/{productId}` and expose level/title, rating, record, streak, division, season points, Boss state, and Brawl Power components.
- User progression lives in `userGamification/{userId}` and `userXpEvents`; XP is awarded from verified events, not browser-provided amounts.
- Daily quests use deterministic date/template IDs. Predictions are separate from votes, lock in the final stretch, and draws are voided without breaking a streak.
- Tastemaker Score uses organic growth and early-support signals only. Sponsored placement is not an input.
- Daily Picks are three free selections scored by organic outcomes; they do not accept money, wagers, or paid entries.
- Achievements use rarity definitions and feed product/user Trophy Cabinet surfaces. Season standings, category leagues, divisions, promotion/relegation rules, Boss reigns, bounties, Hall of Fame records, and launch-day activity are persisted in Firestore. Empty collections render empty states rather than invented records.

### Firestore collections

The Admin SDK uses `brawls`, `brawlVotes`, `brawlChallenges`, `brawlPredictions`, `brawlReports`, `brawlRematches`, `brawlSeasons`, `seasonProductStats`, `productCompetitiveStats`, `leagueStandings`, `bossReigns`, `seasonAwards`, `brawlBounties`, `userXpEvents`, `xpLedger`, `userQuestProgress`, `dailyQuestInstances`, `questTemplates`, `dailyPicks`, `dailyPickResults`, `productAchievements`, `userAchievements`, `activityEvents`, `platformRecords`, `notificationDeliveries`, `uploadRecords`, `launchEvents`, and `settings/gamification` alongside the existing collections. Without explicit demo mode, missing or empty Firestore data produces an empty/error state rather than a fixture fallback.

### Jobs and maintenance

Schedule `POST /api/cron/brawls` to run the complete lifecycle and maintenance sweep, or schedule the narrower cron endpoints independently. Every route requires `Authorization: Bearer $CRON_SECRET` and is safe to retry.

Battle-to-Brawl migration is additive and preserves legacy IDs and collections until reviewed:

```powershell
npm.cmd run migrate:battles-to-brawls -- --dry-run
npm.cmd run migrate:battles-to-brawls
npm.cmd run verify:brawl-data
npm.cmd run repair:brawl-data       # dry-run by default
npm.cmd run repair:brawl-data -- --apply
```

Canonical public routes are `/brawls`, `/brawl/[id]`, `/leagues`, `/league/[slug]`, `/seasons`, `/seasons/[slug]`, `/quests`, `/picks`, `/tastemakers`, and `/hall-of-fame`. `/battles`, `/battle/[id]`, and the previous `/brawl/match/[id]` route permanently redirect to the Brawl routes.

Tournament brackets, Season Passes, product cosmetics, paid votes, paid predictions, gambling, and money-influenced organic outcomes are deliberately not implemented.
