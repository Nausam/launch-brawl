import { cache } from "react";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { findUserByUsername, getUserGamification, listOwnerPublishedProducts, listUserAchievements, listUserActivity } from "@/lib/repositories/competitive";
import { MakerProfile } from "@/components/profile/MakerProfile";
import { siteConfig } from "@/config/site";

export const dynamic = "force-dynamic";

const loadMaker = cache(async (username: string) => findUserByUsername(username.toLowerCase()));

export async function generateMetadata({ params }: { params: Promise<{ username: string }> }): Promise<Metadata> {
  const { username } = await params;
  const user = await loadMaker(username);
  if (!user) return { title: "Profile" };
  const description = user.bio || `${user.displayName}'s launches on Launch Brawl`;
  return {
    title: `@${user.username}`,
    description,
    openGraph: {
      title: `${user.displayName} (@${user.username})`,
      description,
      ...(user.imageUrl ? { images: [{ url: user.imageUrl }] } : {}),
    },
  };
}

export default async function ProfilePage({ params }: { params: Promise<{ username: string }> }) {
  const { username } = await params;
  const user = await loadMaker(username);
  if (!user) notFound();

  const [products, activity, stats, achievements] = await Promise.all([
    listOwnerPublishedProducts(user.id),
    listUserActivity(user.id),
    getUserGamification(user.id),
    listUserAchievements(user.id),
  ]);

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Person",
    name: user.displayName,
    url: `${siteConfig.url}/profile/${user.username}`,
    image: user.imageUrl,
    description: user.bio,
  };

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <MakerProfile user={user} products={products} activity={activity} stats={stats} achievements={achievements} />
    </>
  );
}
