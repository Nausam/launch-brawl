import { getAdminDb } from "@/lib/firebase/admin";
import type { DailyQuest } from "@/lib/types";

function numberValue(value: unknown) {
  return typeof value === "number" && Number.isFinite(value) ? value : 0;
}

export async function recordQuestProgress(userId: string, type: DailyQuest["type"]) {
  const db = getAdminDb();
  if (!db) return { updated: 0, completed: 0 };
  const date = new Date().toISOString().slice(0, 10);
  const quests = await db.collection("dailyQuestInstances").where("date", "==", date).where("type", "==", type).limit(5).get();
  let updated = 0;
  let completed = 0;
  for (const quest of quests.docs) {
    const data = quest.data();
    const target = Math.max(1, numberValue(data.target));
    const progressRef = db.collection("userQuestProgress").doc(`${date}_${userId}_${type}`);
    const xpRef = db.collection("userXpEvents").doc(`quest_${date}_${userId}_${type}`);
    const ledgerRef = db.collection("xpLedger").doc(`user_${userId}_quest_${date}_${type}`);
    const userStatsRef = db.collection("userGamification").doc(userId);
    const result = await db.runTransaction(async (transaction) => {
      const [progressSnapshot, xpSnapshot, statsSnapshot] = await Promise.all([transaction.get(progressRef), transaction.get(xpRef), transaction.get(userStatsRef)]);
      const current = progressSnapshot.data() ?? {};
      const previousProgress = numberValue(current.progress);
      const nextProgress = Math.min(target, previousProgress + 1);
      const wasCompleted = Boolean(current.completed) || previousProgress >= target;
      const nowCompleted = nextProgress >= target;
      if (!wasCompleted) {
        transaction.set(progressRef, { id: progressRef.id, userId, date, type, questId: quest.id, progress: nextProgress, completed: nowCompleted, ...(nowCompleted ? { completedAt: new Date() } : {}), updatedAt: new Date() }, { merge: true });
      }
      if (nowCompleted && !wasCompleted && !xpSnapshot.exists) {
        const reward = numberValue(data.xpReward);
        const stats = statsSnapshot.data() ?? {};
        transaction.set(xpRef, { id: xpRef.id, userId, type: "DAILY_QUEST_COMPLETED", questType: type, sourceId: quest.id, amount: reward, createdAt: new Date() });
        transaction.set(ledgerRef, { id: ledgerRef.id, subjectType: "USER", subjectId: userId, type: "DAILY_QUEST_COMPLETED", sourceId: quest.id, amount: reward, createdAt: new Date() }, { merge: true });
        transaction.set(userStatsRef, { userId, xp: numberValue(stats.xp) + reward, questsCompleted: numberValue(stats.questsCompleted) + 1, updatedAt: new Date() }, { merge: true });
        return { updated: !wasCompleted, completed: 1 };
      }
      return { updated: !wasCompleted, completed: 0 };
    });
    updated += result.updated ? 1 : 0;
    completed += result.completed;
  }
  return { updated, completed };
}
