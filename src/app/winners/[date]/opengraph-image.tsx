import { ImageResponse } from "next/og";
import { findWinnerByDate } from "@/lib/repositories/catalog";

export const runtime = "nodejs";
export const alt = "Launch Brawl winner";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default async function WinnerOpenGraphImage({ params }: { params: Promise<{ date: string }> }) {
  const winner = await findWinnerByDate((await params).date);
  return new ImageResponse(<div style={{ width: "100%", height: "100%", display: "flex", flexDirection: "column", justifyContent: "space-between", padding: 70, background: "#fffaf2", color: "#1e2024", fontFamily: "Arial" }}><div style={{ display: "flex", fontSize: 26, fontWeight: 800, letterSpacing: 5, color: "#ff7058" }}>LAUNCH BRAWL · WINNER</div><div style={{ display: "flex", flexDirection: "column", gap: 18 }}><div style={{ display: "flex", fontSize: 76, fontWeight: 900 }}>{winner?.productName ?? "Brawl winner"}</div><div style={{ display: "flex", fontSize: 30, color: "#5c626b" }}>{winner ? `${winner.category} · ${winner.date}` : "Organic result archive"}</div></div><div style={{ display: "flex", fontSize: 24, color: "#5c626b" }}>A result earned in the arena.</div></div>, { ...size });
}
