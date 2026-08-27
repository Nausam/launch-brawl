import { CalendarDays, Layers3, Sparkles } from "lucide-react";
import { getNewProducts, listCategories } from "@/lib/repositories/catalog";
import { PageContainer } from "@/components/layout/PageContainer";
import { DirectoryHeader } from "@/components/discovery/DirectoryHeader";
import { LaunchCalendarBoard } from "@/components/discovery/LaunchCalendarBoard";

export const metadata = { title: "Launch calendar" };
export const dynamic = "force-dynamic";

export default async function LaunchesPage() {
  const [products, categories] = await Promise.all([getNewProducts(), listCategories()]);
  const uniqueDays = new Set(products.map((product) => product.launchDate?.slice(0, 10)).filter(Boolean)).size;
  const categoryCount = new Set(products.map((product) => product.categoryId)).size;

  return (
    <>
      <section className="noise relative overflow-hidden border-b border-line bg-paper-strong/45">
        <div className="pointer-events-none absolute -left-[28%] -top-52 h-[500px] w-[156%] rounded-[50%] border-[18px] border-[#eef3f8]" />
        <div className="pointer-events-none absolute left-1/2 top-16 h-72 w-[38rem] -translate-x-1/2 rounded-full bg-[#fff2c9]/45 blur-3xl" />
        <div className="pointer-events-none absolute -right-24 bottom-0 h-64 w-64 rounded-full border-[32px] border-coral/10" />
        <PageContainer className="relative pt-14 pb-3 lg:pt-20 lg:pb-4">
          <DirectoryHeader
            arena
            active="new"
            eyebrow="Launch calendar"
            eyebrowIcon={CalendarDays}
            title="The next wave is landing."
            description="A clear, chronological view of the new products joining the board. Find the early signals before the crowd catches up."
            categories={categories}
            stats={[
              { icon: CalendarDays, value: String(products.length), label: "Launches on deck", tone: "coral" },
              { icon: Layers3, value: String(uniqueDays), label: "Days in motion", tone: "gold" },
              { icon: Sparkles, value: String(categoryCount), label: "Corners represented", tone: "blue" },
            ]}
          />
        </PageContainer>
      </section>
      <LaunchCalendarBoard products={products} categories={categories} />
    </>
  );
}
