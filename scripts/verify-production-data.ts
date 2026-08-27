import { verifyProductionData } from "./production-data";

void verifyProductionData().then((report) => { console.log(JSON.stringify(report, null, 2)); if (!report.ok) process.exitCode = 1; }).catch((error) => { console.error(error instanceof Error ? error.message : "Production data verification failed."); process.exitCode = 1; });
