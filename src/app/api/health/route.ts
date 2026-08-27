import { NextResponse } from "next/server";
import { authIsConfigured } from "@/lib/integrations/auth";
import { getAdminDb, getFirestoreDatabaseId } from "@/lib/firebase/admin";
import { freemiusIsConfigured } from "@/lib/integrations/freemius";
import { inspectEnvironment } from "@/lib/server/env";

export async function GET(request: Request) {
  const url = new URL(request.url);
  const check = url.searchParams.get("check") === "liveness" ? "liveness" : "readiness";
  if (check === "liveness") return NextResponse.json({ ok: true, check: "liveness" });
  const production = process.env.NODE_ENV === "production";
  const environment = inspectEnvironment();
  let firestoreReady = false;
  try {
    const db = getAdminDb();
    if (db) {
      await db.collection("settings").doc("platform").get();
      firestoreReady = true;
    }
  } catch {
    firestoreReady = false;
  }
  let redisReady = Boolean(process.env.UPSTASH_REDIS_REST_URL && process.env.UPSTASH_REDIS_REST_TOKEN);
  if (production && redisReady) {
    try {
      const redisUrl = process.env.UPSTASH_REDIS_REST_URL!.replace(/\/$/, "");
      const response = await fetch(`${redisUrl}/ping`, { headers: { Authorization: `Bearer ${process.env.UPSTASH_REDIS_REST_TOKEN}` }, cache: "no-store", signal: AbortSignal.timeout(1_500) });
      redisReady = response.ok;
    } catch {
      redisReady = false;
    }
  }
  const integrations = {
    firestore: firestoreReady,
    firestoreDatabase: getFirestoreDatabaseId(),
    clerk: authIsConfigured(),
    freemius: freemiusIsConfigured(),
    resend: Boolean(process.env.RESEND_API_KEY && process.env.RESEND_FROM_EMAIL),
    redis: redisReady,
    storage: environment.integrations.storage,
  };
  const requiredReady = integrations.firestore && integrations.clerk && integrations.freemius && integrations.resend && integrations.redis && integrations.storage;
  const ok = !production || (environment.valid && requiredReady);
  return NextResponse.json({
    ok,
    mode: production ? "production" : "development",
    ...(production && !ok ? { missing: [...environment.errors, ...environment.productionMissing] } : {}),
    integrations,
  }, { status: ok ? 200 : 503, headers: { "Cache-Control": "no-store" } });
}
