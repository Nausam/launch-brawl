import { config } from "dotenv";
config({ path: ".env.local" });
config();
import { getAdminDb } from "../src/lib/firebase/admin";
import { defaultFeatureFlags, defaultPlatformSettings, productionDefaultFeatureFlags } from "../src/lib/server/settings";
import { defaultDailyQuestTemplates, getAchievementDefinitions, getDailyQuestInstances } from "../src/lib/server/gamification";

async function main() {
  const db = getAdminDb();
  if (!db) throw new Error("Firestore is not configured.");
  const now = new Date();
  const platformRef = db.collection("settings").doc("platform");
  const gamificationRef = db.collection("settings").doc("gamification");
  await db.runTransaction(async (transaction) => {
    const [platform, gamification] = await Promise.all([transaction.get(platformRef), transaction.get(gamificationRef)]);
    if (!platform.exists) transaction.create(platformRef, { ...defaultPlatformSettings, createdAt: now, updatedAt: now });
    if (!gamification.exists) transaction.create(gamificationRef, { featureFlags: process.env.NODE_ENV === "production" ? productionDefaultFeatureFlags : defaultFeatureFlags, createdAt: now, updatedAt: now });
  });
  const batch = db.batch();
  for (const definition of getAchievementDefinitions()) batch.set(db.collection("achievementDefinitions").doc(definition.id), { ...definition, updatedAt: now }, { merge: true });
  for (const template of defaultDailyQuestTemplates) batch.set(db.collection("questTemplates").doc(template.id), { ...template, updatedAt: now }, { merge: true });
  for (const quest of getDailyQuestInstances()) batch.set(db.collection("dailyQuestInstances").doc(quest.id), { ...quest, createdAt: now }, { merge: true });
  await batch.commit();
  console.log("Initialized platform settings, gamification flags, achievement definitions, and today's quest instances.");
}

void main().catch((error) => {
  console.error(error instanceof Error ? error.message : "Initialization failed.");
  process.exitCode = 1;
});
