import { Tags } from "lucide-react";
import type { Deal } from "@/lib/types";
import { listAdminDeals } from "@/lib/repositories/admin";
import { listPublishedProducts } from "@/lib/repositories/catalog";
import { cn } from "@/lib/utils";
import { DealForm } from "@/components/admin/DealForm";
import { DeskEmpty, DeskHeader, DeskPlaque, DeskStat, padTicket, rankStyle, type RankTone } from "@/components/desk/DeskChrome";

export const dynamic = "force-dynamic";

function dealTone(status: Deal["status"]): RankTone {
  switch (status) {
    case "ACTIVE":
      return "gold";
    case "DRAFT":
      return "silver";
    case "EXPIRED":
      return "bronze";
    case "ARCHIVED":
      return "rest";
    default: {
      const _exhaustive: never = status;
      return _exhaustive;
    }
  }
}

export default async function AdminDealsPage() {
  const [deals, products] = await Promise.all([listAdminDeals(), listPublishedProducts(200)]);
  const byId = new Map(products.map((product) => [product.id, product]));
  const live = deals.filter((deal) => deal.status === "ACTIVE").length;
  return (
    <div>
      <DeskHeader
        kind="admin"
        eyebrow="Offer counter"
        title="Maker deals, never rank."
        description="Create, edit, expire, and archive maker offers without turning them into paid rank."
        icon={Tags}
      />
      <div className="relative mt-6 flex flex-wrap gap-3">
        <DeskStat icon={Tags} value={String(deals.length)} label="Offers" tone="blue" />
        <DeskStat icon={Tags} value={String(live)} label="Live" tone="gold" />
      </div>
      <div className="relative mt-8 grid gap-8 lg:grid-cols-[minmax(280px,.72fr)_minmax(0,1.28fr)]">
        <DealForm products={products} />
        <section>
          <div className="inline-flex items-center rounded-[14px] rounded-br-[6px] border border-[#b7cfe0] bg-[#eef6fc] px-3 py-1.5 text-[10px] font-black uppercase tracking-[0.16em] text-[#355875]">
            Offer inventory
          </div>
          <h2 className="display mt-3 text-2xl font-black tracking-[-0.04em] text-ink">Configured deals</h2>
          <div className="mt-4 grid gap-3">
            {deals.length ? deals.map((deal, index) => {
              const tone = dealTone(deal.status);
              const style = rankStyle(tone);
              return (
                <DeskPlaque key={deal.id} tone={tone}>
                  <div className="flex flex-wrap items-center gap-3">
                    <span className={cn("grid h-11 w-11 place-items-center rounded-[12px] rounded-br-[5px] border text-[11px] font-black", style.medal)}>{padTicket(index)}</span>
                    <div className="min-w-[220px] flex-1">
                      <p className="font-black">{byId.get(deal.productId)?.name ?? "Unknown product"}</p>
                      <p className="mt-1 text-xs text-muted">{deal.title}{deal.expiresAt ? ` · expires ${new Date(deal.expiresAt).toLocaleDateString()}` : ""}</p>
                    </div>
                    <span className={cn("inline-flex items-center rounded-[12px] rounded-br-[5px] border px-2 py-1 text-[10px] font-black uppercase tracking-[0.12em]", style.badge)}>{deal.status}</span>
                  </div>
                </DeskPlaque>
              );
            }) : <DeskEmpty title="No deals are configured yet." body="Use the dark offer console to stamp the first maker deal." />}
          </div>
        </section>
      </div>
    </div>
  );
}
