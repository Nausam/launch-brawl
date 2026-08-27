import { NextResponse } from "next/server";

export function GET() {
  return NextResponse.json({ ok: true, check: "liveness" }, { headers: { "Cache-Control": "no-store" } });
}
