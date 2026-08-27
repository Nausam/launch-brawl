import { config } from "dotenv";
config({ path: ".env.local" });
config();
import { cert, getApps, initializeApp } from "firebase-admin/app";
import { getFirestore } from "firebase-admin/firestore";
import { getFirestoreDatabaseId } from "../src/lib/firebase/admin";

if (process.env.NODE_ENV === "production" || process.env.CONFIRM_RESET !== "YES" || process.env.RESET_DATA !== "1") throw new Error("Refusing to reset Firestore. Set NODE_ENV=development, CONFIRM_RESET=YES, and RESET_DATA=1 explicitly.");
const projectId = process.env.FIREBASE_PROJECT_ID;
const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
const privateKey = process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, "\n");
if (!projectId || !clientEmail || !privateKey) throw new Error("FIREBASE_PROJECT_ID, FIREBASE_CLIENT_EMAIL, and FIREBASE_PRIVATE_KEY are required.");
const app = getApps()[0] ?? initializeApp({ credential: cert({ projectId, clientEmail, privateKey }) });

async function main() {
  const db = getFirestore(app, getFirestoreDatabaseId());
  const names = ["categories", "products", "dailyWinners", "campaigns", "bids", "leaderboardRounds", "campaignDailyStats", "productDailyStats", "brawls", "brawlVotes", "brawlChallenges", "brawlPredictions", "brawlSeasons", "seasonProductStats", "leagueStandings", "productCompetitiveStats", "bossReigns", "brawlBounties", "userXpEvents", "userQuestProgress", "dailyQuestInstances", "dailyPicks", "dailyPickResults", "productAchievements", "userAchievements", "activityEvents", "platformRecords", "brawlReports", "brawlRematches"];
  for (const name of names) { const snapshot = await db.collection(name).limit(400).get(); if (snapshot.empty) continue; const batch = db.batch(); snapshot.docs.forEach((doc) => batch.delete(doc.ref)); await batch.commit(); console.log(`Deleted ${snapshot.size} documents from ${name}.`); }
  console.log("Reset complete. Re-run db:seed to restore development data.");
}

void main().catch((error) => {
  console.error(error instanceof Error ? error.message : "Reset failed.");
  process.exitCode = 1;
});
