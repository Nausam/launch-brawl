import { CalendarDays } from "lucide-react";
import type { Category, Product } from "@/lib/types";
import { cn } from "@/lib/utils";
import { PageContainer } from "@/components/layout/PageContainer";
import { ProductBoardCard } from "@/components/products/ProductBoardCard";
import { ButtonLink } from "@/components/ui/Button";

type CalendarWindow = "today" | "week" | "upcoming" | "recent";

type CalendarEntry = {
  product: Product;
  category?: Category;
};

type CalendarGroup = {
  key: CalendarWindow;
  title: string;
  description: string;
  entries: CalendarEntry[];
};

function parseLaunchDate(value: string) {
  const date = new Date(`${value.slice(0, 10)}T00:00:00Z`);
  return Number.isNaN(date.getTime()) ? undefined : date;
}

function windowForLaunch(launch: number | undefined, today: number): CalendarWindow {
  if (launch === undefined || !Number.isFinite(launch)) return "upcoming";
  if (launch === today) return "today";
  if (launch > today && launch < today + 7 * 86_400_000) return "week";
  if (launch >= today + 7 * 86_400_000) return "upcoming";
  return "recent";
}

function windowMeta(window: CalendarWindow) {
  switch (window) {
    case "today":
      return { title: "Launching today", description: "Products making their first impression right now." };
    case "week":
      return { title: "This week", description: "The next seven days of launches and early signals." };
    case "upcoming":
      return { title: "Upcoming", description: "Products with a launch date still ahead." };
    case "recent":
      return { title: "Recently launched", description: "Fresh products still building their first wave of attention." };
    default: {
      const _exhaustive: never = window;
      return _exhaustive;
    }
  }
}

function windowPill(window: CalendarWindow) {
  switch (window) {
    case "today":
      return "border-coral/30 bg-coral/10 text-coral";
    case "week":
      return "border-[#c58a0a]/35 bg-[linear-gradient(100deg,#ffdc7c,#f5c44b)] text-[#4d3a14]";
    case "upcoming":
      return "border-[#b7cfe0] bg-[#eef6fc] text-[#355875]";
    case "recent":
      return "border-[#b7cfe0] bg-[#eef6fc] text-[#355875]";
    default: {
      const _exhaustive: never = window;
      return _exhaustive;
    }
  }
}

function buildCalendarGroups(products: Product[], categories: Category[]) {
  const categoryById = new Map(categories.map((category) => [category.id, category]));
  const order: CalendarWindow[] = ["today", "week", "upcoming", "recent"];
  const groups = new Map<CalendarWindow, CalendarGroup>(
    order.map((key) => [key, { key, ...windowMeta(key), entries: [] }]),
  );
  const now = new Date();
  const today = Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate());

  for (const product of products) {
    const date = parseLaunchDate(product.launchDate);
    const key = windowForLaunch(date?.getTime(), today);
    groups.get(key)!.entries.push({ product, category: categoryById.get(product.categoryId) });
  }

  return order.map((key) => groups.get(key)!).filter((group) => group.entries.length);
}

export function LaunchCalendarBoard({ products, categories }: { products: Product[]; categories: Category[] }) {
  const groups = buildCalendarGroups(products, categories);

  return (
    <section className="relative overflow-hidden pt-5 pb-14 lg:pt-6 lg:pb-16">
      <div className="pointer-events-none absolute -left-24 top-24 h-72 w-72 rounded-full bg-[#fff0c8]/45 blur-3xl" />
      <div className="pointer-events-none absolute -right-28 bottom-16 h-80 w-80 rounded-full bg-[#e6f1fb]/55 blur-3xl" />
      <PageContainer className="relative py-0 lg:py-0">
        <div className="relative flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
          <div className="min-w-0">
            <div className="inline-flex items-center gap-2 rounded-[14px] rounded-br-[6px] border border-coral/30 bg-coral/10 px-3 py-1.5 text-[10px] font-black uppercase tracking-[0.16em] text-coral sm:text-xs">
              Release calendar
              <span className="grid h-6 w-6 place-items-center rounded-[8px] rounded-br-[4px] border border-white/30 bg-coral text-white">
                <CalendarDays size={13} />
              </span>
            </div>
            <h2 className="display mt-3 text-4xl font-black tracking-[-0.05em] text-ink sm:text-5xl">New ideas, one day at a time.</h2>
            <p className="mt-3 max-w-xl text-sm leading-6 text-muted">See the newest launches in order, catch the early signal, and give makers a useful first impression while the story is still forming.</p>
          </div>
          <span className="inline-flex items-center gap-2 self-start rounded-[14px] rounded-br-[6px] border border-line bg-paper px-3 py-2 text-xs font-bold text-muted sm:self-end">
            <span className="h-2 w-2 animate-pulse-soft rounded-full bg-coral" />
            Chronological board
          </span>
        </div>

        {groups.length ? (
          <div className="relative mt-8 grid gap-8">
            {groups.map((group) => (
              <section key={group.key}>
                <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
                  <div>
                    <div className={cn("inline-flex items-center gap-2 rounded-[14px] rounded-br-[6px] border px-3 py-1.5 text-[10px] font-black uppercase tracking-[0.16em]", windowPill(group.key))}>
                      {group.title}
                    </div>
                    <p className="mt-2 text-xs text-muted">{group.description}</p>
                  </div>
                  <span className="text-xs font-bold text-muted">
                    {group.entries.length} {group.entries.length === 1 ? "launch" : "launches"}
                  </span>
                </div>
                <div className="mt-4 grid gap-3">
                  {group.entries.map((entry, index) => (
                    <ProductBoardCard
                      key={entry.product.id}
                      product={entry.product}
                      category={entry.category}
                      index={index}
                      plaque="date"
                    />
                  ))}
                </div>
              </section>
            ))}
          </div>
        ) : (
          <div className="relative mt-8 rounded-[24px] rounded-br-[10px] border-2 border-dashed border-line bg-paper px-5 py-12 text-center">
            <div className="eyebrow text-coral">The calendar is open</div>
            <p className="mt-3 text-lg font-bold text-ink">No launches are on deck yet.</p>
            <p className="mt-2 text-sm text-muted">Be the first maker to add a product and give the board something new to discover.</p>
            <ButtonLink href="/submit" variant="dark" size="md" arrow className="mt-6">List a launch</ButtonLink>
          </div>
        )}

        <div className="relative mt-6 flex flex-wrap items-center justify-between gap-3 border-t border-line/70 pt-5 text-xs text-muted">
          <span className="inline-flex items-center gap-2"><span className="h-2 w-2 rounded-full bg-coral" />Dates are the launch day, not paid rank</span>
          <span className="inline-flex items-center gap-2"><span className="h-2 w-2 rounded-full bg-[#75a8cf]" />Newest ideas land here first</span>
        </div>
      </PageContainer>
    </section>
  );
}
