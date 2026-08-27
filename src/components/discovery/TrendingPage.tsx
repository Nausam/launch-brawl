import { Flame, Heart, MousePointer2 } from "lucide-react";
import type { Category, Product } from "@/lib/types";
import { formatCompact } from "@/lib/utils";
import { PageContainer } from "@/components/layout/PageContainer";
import { DirectoryHeader } from "@/components/discovery/DirectoryHeader";
import { TrendingProductBoard } from "@/components/discovery/TrendingProductBoard";

export function TrendingPage({ products, categories }: { products: Product[]; categories: Category[] }) {
  const totalVotes = products.reduce((sum, product) => sum + (product.organicVotes ?? product.totalVotes), 0);
  const totalClicks = products.reduce((sum, product) => sum + (product.organicQualifiedClicks ?? 0), 0);

  return (
    <>
      <section className="noise relative overflow-hidden border-b border-line bg-paper-strong/45">
        <div className="pointer-events-none absolute -left-[28%] -top-52 h-[500px] w-[156%] rounded-[50%] border-[18px] border-[#eef3f8]" />
        <div className="pointer-events-none absolute left-1/2 top-16 h-72 w-[38rem] -translate-x-1/2 rounded-full bg-[#fff2c9]/45 blur-3xl" />
        <div className="pointer-events-none absolute -right-24 bottom-0 h-64 w-64 rounded-full border-[32px] border-coral/10" />
        <PageContainer className="relative pt-14 pb-3 lg:pt-20 lg:pb-4">
          <DirectoryHeader
            arena
            active="trending"
            eyebrow="Organic momentum"
            eyebrowIcon={Flame}
            title="The signal is moving."
            description="A living view of the launches people are noticing, opening, voting for, and saving right now."
            categories={categories}
            stats={[
              { icon: Flame, value: String(products.length), label: "Launches in motion", tone: "coral" },
              { icon: Heart, value: formatCompact(totalVotes), label: "Community votes", tone: "gold" },
              { icon: MousePointer2, value: formatCompact(totalClicks), label: "Organic clicks", tone: "blue" },
            ]}
          />
        </PageContainer>
      </section>
      <TrendingProductBoard products={products} categories={categories} />
    </>
  );
}
