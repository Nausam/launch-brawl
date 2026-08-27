import { ImageResponse } from "next/og";
import { findProductBySlug } from "@/lib/repositories/catalog";

export const runtime = "nodejs";
export const alt = "Launch Brawl product";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default async function ProductOpenGraphImage({ params }: { params: Promise<{ slug: string }> }) {
  const product = await findProductBySlug((await params).slug);
  return new ImageResponse(<div style={{ width: "100%", height: "100%", display: "flex", flexDirection: "column", justifyContent: "space-between", padding: 64, background: "#F5F0E8", color: "#1E2024", fontFamily: "Arial" }}><div style={{ display: "flex", fontSize: 24, fontWeight: 700, color: "#FF7058" }}>LAUNCH BRAWL</div><div style={{ display: "flex", flexDirection: "column", gap: 20 }}><div style={{ display: "flex", fontSize: 72, fontWeight: 800, letterSpacing: -3 }}>{product?.name ?? "Product"}</div><div style={{ display: "flex", fontSize: 30, color: "#5C626B" }}>{product?.shortDescription ?? "Discover the next product worth talking about."}</div></div><div style={{ display: "flex", fontSize: 22, color: "#5C626B" }}>Fight for attention. Earn the spotlight.</div></div>, { ...size });
}
