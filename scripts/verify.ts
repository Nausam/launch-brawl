import { config } from "dotenv";
config({ path: ".env.local" });
config();
import { cert, getApps, initializeApp } from "firebase-admin/app";
import { getFirestore } from "firebase-admin/firestore";
import { getFirestoreDatabaseId } from "../src/lib/firebase/admin";

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
  const [categories, products, rounds, campaigns] = await Promise.all([db.collection("categories").count().get(), db.collection("products").count().get(), db.collection("leaderboardRounds").count().get(), db.collection("campaigns").count().get()]);
  console.table({ categories: categories.data().count, products: products.data().count, leaderboardRounds: rounds.data().count, campaigns: campaigns.data().count });
}

void main().catch((error) => {
  console.error(error instanceof Error ? error.message : "Verification failed.");
  process.exitCode = 1;
});
