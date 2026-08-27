import { applyMutations, collectProductionMigrationPlan, getDb, summarizeMutations } from "./production-data";

const apply = process.argv.includes("--apply");

async function main() {
  const db = getDb();
  const mutations = await collectProductionMigrationPlan(db);
  console.table(summarizeMutations(mutations));
  if (!apply) { console.log(`Repair dry run only: ${mutations.length} idempotent writes planned. Use --apply to commit.`); return; }
  await applyMutations(db, mutations);
  console.log(`Applied ${mutations.length} repair writes.`);
}

void main().catch((error) => { console.error(error instanceof Error ? error.message : "Production data repair failed."); process.exitCode = 1; });
