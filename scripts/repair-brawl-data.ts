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

const apply = process.argv.includes("--apply");
async function main() {
  const db = getDb();
  const snapshot = await db.collection("brawls").limit(5_000).get();
  let repairs = 0;
  for (let offset = 0; offset < snapshot.docs.length; offset += 400) {
    const batch = db.batch();
    let batchRepairs = 0;
    for (const document of snapshot.docs.slice(offset, offset + 400)) {
      const data = document.data();
      const left = Number(data.productAVotes ?? data.leftVotes ?? 0);
      const right = Number(data.productBVotes ?? data.rightVotes ?? 0);
      if (Number(data.totalVotes ?? left + right) !== left + right) { batch.update(document.ref, { totalVotes: left + right, updatedAt: new Date() }); batchRepairs += 1; }
    }
    if (apply && batchRepairs) await batch.commit();
    repairs += batchRepairs;
  }
  console.log(`${apply ? "Applied" : "Planned"} ${repairs} Brawl aggregate repairs. Use --apply only after reviewing verify:brawl-data output.`);
}

void main().catch((error) => {
  console.error(error instanceof Error ? error.message : "Brawl repair failed.");
  process.exitCode = 1;
});
