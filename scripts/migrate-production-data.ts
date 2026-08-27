import { applyMutations, collectProductionMigrationPlan, getDb, summarizeMutations } from "./production-data";

const apply = process.argv.includes("--apply");

async function main() {
  const db = getDb();
  const mutations = await collectProductionMigrationPlan(db);
  console.table(summarizeMutations(mutations));
  if (!apply) {
    console.log(`Dry run only: ${mutations.length} idempotent writes planned. Re-run with --apply after reviewing the staging report.`);
    return;
  }
  await applyMutations(db, mutations);
  console.log(`Applied ${mutations.length} idempotent production-data migration writes.`);
}

void main().catch((error) => { console.error(error instanceof Error ? error.message : "Production data migration failed."); process.exitCode = 1; });
