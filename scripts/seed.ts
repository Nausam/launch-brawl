import { config } from "dotenv";
config({ path: ".env.local" });
config();
import { cert, getApps, initializeApp } from "firebase-admin/app";
import { getFirestore } from "firebase-admin/firestore";
import { getFirestoreDatabaseId } from "../src/lib/firebase/admin";
import { categories, demoCampaigns, products, winnerHistory } from "../src/lib/data";
import { brawlBounties, competitiveBrawls, currentSeason, demoDailyPicks, productCompetitiveStats, seasons, seasonStandings } from "../src/lib/gamification-data";

if (process.env.NODE_ENV === "production" || process.env.SEED_DATA !== "1" || process.env.NEXT_PUBLIC_DEMO_MODE !== "true") throw new Error("Refusing to seed. Set NODE_ENV=development, SEED_DATA=1, and NEXT_PUBLIC_DEMO_MODE=true for an explicit development seed.");

function getDb() {
  const projectId = process.env.FIREBASE_PROJECT_ID;
  const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
  const privateKey = process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, "\n");
  if (!projectId || !clientEmail || !privateKey) throw new Error("FIREBASE_PROJECT_ID, FIREBASE_CLIENT_EMAIL, and FIREBASE_PRIVATE_KEY are required.");
  const app = getApps()[0] ?? initializeApp({ credential: cert({ projectId, clientEmail, privateKey }) });
  return getFirestore(app, getFirestoreDatabaseId());
}

async function main() {
  const db = getDb();
  const batch = db.batch();
  const now = new Date();

for (const category of categories) batch.set(db.collection("categories").doc(category.id), { ...category, createdAt: now, updatedAt: now });
for (const product of products) batch.set(db.collection("products").doc(product.id), { ...product, createdAt: now, updatedAt: now });
for (const winner of winnerHistory) batch.set(db.collection("dailyWinners").doc(winner.id), { ...winner, createdAt: now });
for (const campaign of demoCampaigns) batch.set(db.collection("campaigns").doc(campaign.id), { ...campaign, createdAt: now, updatedAt: now });
for (const brawl of competitiveBrawls) batch.set(db.collection("brawls").doc(brawl.id), { ...brawl, productAVotes: brawl.leftVotes, productBVotes: brawl.rightVotes, createdAt: now, updatedAt: now }, { merge: true });
for (const season of seasons) batch.set(db.collection("brawlSeasons").doc(season.id), { ...season, createdAt: new Date(season.createdAt) }, { merge: true });
for (const standing of seasonStandings) batch.set(db.collection("seasonProductStats").doc(standing.id), standing, { merge: true });
for (const [productId, stats] of Object.entries(productCompetitiveStats)) batch.set(db.collection("productCompetitiveStats").doc(productId), stats, { merge: true });
for (const bounty of brawlBounties) batch.set(db.collection("brawlBounties").doc(bounty.id), bounty, { merge: true });
for (const pick of demoDailyPicks) batch.set(db.collection("dailyPicks").doc(pick.id), pick, { merge: true });
batch.set(db.collection("settings").doc("gamification"), { featureFlags: { brawlsEnabled: true, challengesEnabled: true, predictionsEnabled: true, questsEnabled: true, dailyPicksEnabled: true, leaguesEnabled: true, bossBrawlsEnabled: true, bountiesEnabled: true }, currentSeasonId: currentSeason.id, updatedAt: now }, { merge: true });

  await batch.commit();
  console.log(`Seeded ${categories.length} categories, ${products.length} products, ${winnerHistory.length} winners, and ${demoCampaigns.length} campaigns.`);
}

void main().catch((error) => {
  console.error(error instanceof Error ? error.message : "Seed failed.");
  process.exitCode = 1;
});
