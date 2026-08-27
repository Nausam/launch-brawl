import { config } from "dotenv";
config({ path: ".env.local" });
config();
import { cert, getApps, initializeApp } from "firebase-admin/app";
import { getFirestore, type Firestore } from "firebase-admin/firestore";
import { getFirestoreDatabaseId } from "../src/lib/firebase/admin";

function getDb(): Firestore {
  const projectId = process.env.FIREBASE_PROJECT_ID;
  const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
  const privateKey = process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, "\n");
  if (!projectId || !clientEmail || !privateKey) throw new Error("FIREBASE_PROJECT_ID, FIREBASE_CLIENT_EMAIL, and FIREBASE_PRIVATE_KEY are required.");
  const app = getApps()[0] ?? initializeApp({ credential: cert({ projectId, clientEmail, privateKey }) });
  return getFirestore(app, getFirestoreDatabaseId());
}

async function main() {
  const db = getDb();
  const [brawls, votes, stats, seasons, predictions, xpEvents] = await Promise.all([db.collection("brawls").count().get(), db.collection("brawlVotes").count().get(), db.collection("productCompetitiveStats").count().get(), db.collection("brawlSeasons").count().get(), db.collection("brawlPredictions").count().get(), db.collection("userXpEvents").count().get()]);
  const brawlSnapshot = await db.collection("brawls").limit(5_000).get();
  const issues: string[] = [];
  for (const document of brawlSnapshot.docs) {
    const data = document.data();
    const left = Number(data.productAVotes ?? data.leftVotes ?? 0);
    const right = Number(data.productBVotes ?? data.rightVotes ?? 0);
    if (Number(data.totalVotes ?? left + right) !== left + right) issues.push(`${document.id}: totalVotes does not match side totals`);
    if (!data.productAId && !data.leftProductId) issues.push(`${document.id}: missing product A`);
    if (!data.productBId && !data.rightProductId) issues.push(`${document.id}: missing product B`);
  }
  console.table({ brawls: brawls.data().count, brawlVotes: votes.data().count, productCompetitiveStats: stats.data().count, brawlSeasons: seasons.data().count, brawlPredictions: predictions.data().count, userXpEvents: xpEvents.data().count, issues: issues.length });
  if (issues.length) { console.log(issues.slice(0, 50).join("\n")); process.exitCode = 1; }
}

void main().catch((error) => {
  console.error(error instanceof Error ? error.message : "Brawl verification failed.");
  process.exitCode = 1;
});
