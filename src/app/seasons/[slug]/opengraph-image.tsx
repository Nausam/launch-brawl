import { ImageResponse } from "next/og";
import { getSeasonBySlug } from "@/lib/repositories/competitive";

export const runtime = "nodejs";
export const alt = "Launch Brawl season";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default async function SeasonOpenGraphImage({ params }: { params: Promise<{ slug: string }> }) {
  const season = await getSeasonBySlug((await params).slug);
  return new ImageResponse(<div style={{ width: "100%", height: "100%", display: "flex", flexDirection: "column", justifyContent: "space-between", padding: 70, background: "#1e2024", color: "#fffaf2", fontFamily: "Arial" }}><div style={{ display: "flex", fontSize: 26, fontWeight: 800, letterSpacing: 5, color: "#ff7058" }}>LAUNCH BRAWL · SEASON</div><div style={{ display: "flex", flexDirection: "column", gap: 18 }}><div style={{ display: "flex", fontSize: 76, fontWeight: 900 }}>{season?.name ?? "Brawl Season"}</div><div style={{ display: "flex", fontSize: 30, color: "#c5c6c8" }}>{season?.status === "COMPLETED" ? "Champion archived" : "Organic standings are live"}</div></div><div style={{ display: "flex", fontSize: 24, color: "#c5c6c8" }}>Ratings · divisions · category champions</div></div>, { ...size });
}
