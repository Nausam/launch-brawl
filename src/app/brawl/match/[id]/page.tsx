import { permanentRedirect } from "next/navigation";

export default async function LegacyBrawlMatchPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  permanentRedirect(`/brawl/${id}`);
}
