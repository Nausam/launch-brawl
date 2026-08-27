import { ImageResponse } from "next/og";
import { findProductById } from "@/lib/repositories/catalog";
import { getBrawlById } from "@/lib/repositories/competitive";

export const alt = "Launch Brawl matchup";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default async function OpenGraphImage({ params }: { params: Promise<{ round: string }> }) {
  const { round } = await params;
  const brawl = await getBrawlById(round);
  const [left, right] = brawl ? await Promise.all([findProductById(brawl.productAId ?? brawl.leftProductId), findProductById(brawl.productBId ?? brawl.rightProductId)]) : [];
  return new ImageResponse(<div style={{ background: "#fffaf2", color: "#1e2045", display: "flex", flexDirection: "column", height: "100%", justifyContent: "space-between", padding: "70px 80px", width: "100%" }}><div style={{ color: "#f97316", display: "flex", fontSize: 28, fontWeight: 800, letterSpacing: 5 }}>LAUNCH BRAWL</div><div style={{ display: "flex", flexDirection: "column", gap: 22 }}><div style={{ color: "#6e678d", display: "flex", fontSize: 24, fontWeight: 700, textTransform: "uppercase" }}>{brawl?.status === "COMPLETED" ? "Brawl result" : "Product Brawl"}</div><div style={{ display: "flex", fontSize: 70, fontWeight: 900, letterSpacing: -3 }}>{left?.name ?? "Product A"}<span style={{ color: "#f97316", margin: "0 34px" }}>VS</span>{right?.name ?? "Product B"}</div><div style={{ color: "#5b5a7d", display: "flex", fontSize: 28 }}>{brawl?.prompt ?? "Which product would you choose?"}</div></div><div style={{ color: "#6e678d", display: "flex", fontSize: 24 }}>Organic votes · ratings · streaks · reputation</div></div>, { ...size });
}
