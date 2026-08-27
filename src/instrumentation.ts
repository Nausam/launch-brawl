import { assertProductionEnvironment } from "@/lib/server/env";

export function register() {
  if (process.env.NEXT_RUNTIME === "nodejs" && process.env.NODE_ENV === "production") assertProductionEnvironment();
}
