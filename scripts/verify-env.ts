import { config } from "dotenv";
config({ path: ".env.local" });
config();
import { inspectEnvironment } from "../src/lib/server/env";

const production = process.argv.includes("--production");
const report = inspectEnvironment({ ...process.env, NODE_ENV: production ? "production" : process.env.NODE_ENV ?? "development" });
console.log(JSON.stringify({ valid: report.valid, errors: report.errors, productionMissing: report.productionMissing, integrations: report.integrations }, null, 2));
if (!report.valid) process.exitCode = 1;
