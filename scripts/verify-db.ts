import { config } from "dotenv";
config({ path: ".env.local" });
config();
import { getAdminDb, getFirestoreDatabaseId } from "../src/lib/firebase/admin";

async function main() {
  const db = getAdminDb();
  if (!db) {
    console.error("Firestore is not configured. Set the Firebase Admin environment variables first.");
    process.exitCode = 1;
    return;
  }
  try {
    const [settings, categories, products, rounds, brawls, users] = await Promise.all([
      db.collection("settings").doc("platform").get(),
      db.collection("categories").count().get(),
      db.collection("products").count().get(),
      db.collection("leaderboardRounds").count().get(),
      db.collection("brawls").count().get(),
      db.collection("users").count().get(),
    ]);
    console.table({ database: getFirestoreDatabaseId(), settingsPlatform: settings.exists, categories: categories.data().count, products: products.data().count, leaderboardRounds: rounds.data().count, brawls: brawls.data().count, users: users.data().count });
  } catch (error) {
    console.error(error instanceof Error ? error.message : "Firestore verification failed.");
    process.exitCode = 1;
  }
}

void main();
