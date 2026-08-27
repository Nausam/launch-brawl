import { config } from "dotenv";
config({ path: ".env.local" });
config();
import { cert, getApps, initializeApp } from "firebase-admin/app";
import { getFirestore, type DocumentData, type Firestore } from "firebase-admin/firestore";
import { getFirestoreDatabaseId } from "../src/lib/firebase/admin";

function getDb(): Firestore {
  const projectId = process.env.FIREBASE_PROJECT_ID;
  const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
  const privateKey = process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, "\n");
  if (!projectId || !clientEmail || !privateKey) throw new Error("FIREBASE_PROJECT_ID, FIREBASE_CLIENT_EMAIL, and FIREBASE_PRIVATE_KEY are required.");
  const app = getApps()[0] ?? initializeApp({ credential: cert({ projectId, clientEmail, privateKey }) });
  return getFirestore(app, getFirestoreDatabaseId());
}

function mapBrawl(id: string, data: DocumentData): DocumentData {
  const productAId = data.productAId ?? data.leftProductId;
  const productBId = data.productBId ?? data.rightProductId;
  return { ...data, id, productAId, productBId, leftProductId: data.leftProductId ?? productAId, rightProductId: data.rightProductId ?? productBId, productAVotes: data.productAVotes ?? data.leftVotes ?? 0, productBVotes: data.productBVotes ?? data.rightVotes ?? 0, totalVotes: data.totalVotes ?? (data.leftVotes ?? 0) + (data.rightVotes ?? 0), migratedFrom: "battles", migratedAt: new Date() };
}

async function copyCollection(db: Firestore, source: string, target: string, mapper: (id: string, data: DocumentData) => DocumentData, dryRun: boolean): Promise<{ sourceCount: number; targetCount: number; written: number }> {
  const sourceSnapshot = await db.collection(source).limit(5_000).get();
  const targetSnapshot = await db.collection(target).limit(5_000).get();
  if (!dryRun) {
    for (let offset = 0; offset < sourceSnapshot.docs.length; offset += 400) {
      const batch = db.batch();
      sourceSnapshot.docs.slice(offset, offset + 400).forEach((document) => batch.set(db.collection(target).doc(document.id), mapper(document.id, document.data()), { merge: true }));
      await batch.commit();
    }
  }
  return { sourceCount: sourceSnapshot.size, targetCount: targetSnapshot.size, written: dryRun ? 0 : sourceSnapshot.size };
}

const dryRun = process.argv.includes("--dry-run");
async function main() {
  const db = getDb();
  const brawls = await copyCollection(db, "battles", "brawls", mapBrawl, dryRun);
  const votes = await copyCollection(db, "battleVotes", "brawlVotes", (id, data) => ({ ...data, id, brawlId: data.brawlId ?? data.battleId, migratedFrom: "battleVotes", migratedAt: new Date() }), dryRun);
  console.table({ mode: dryRun ? "dry-run" : "applied", battleDocuments: brawls.sourceCount, existingBrawls: brawls.targetCount, brawlDocumentsWritten: brawls.written, battleVotes: votes.sourceCount, existingBrawlVotes: votes.targetCount, brawlVotesWritten: votes.written });
  console.log("No legacy collection was deleted. Re-run without --dry-run only after reviewing the counts.");
}

void main().catch((error) => {
  console.error(error instanceof Error ? error.message : "Migration failed.");
  process.exitCode = 1;
});
