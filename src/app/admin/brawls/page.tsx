import Link from "next/link";
import { ArrowUpRight, CalendarClock, CheckCircle2, Swords } from "lucide-react";
import type { BrawlStatus } from "@/lib/types";
import { listBrawlsByStatus } from "@/lib/repositories/competitive";
import { getProductsByIds, listPublishedProducts } from "@/lib/repositories/catalog";
import { cn } from "@/lib/utils";
import { FinalizeBrawlButton } from "@/components/admin/FinalizeBrawlButton";
import { BrawlScheduler } from "@/components/admin/BrawlScheduler";
import { BrawlLifecycleActions } from "@/components/admin/BrawlLifecycleActions";
import { DeskEmpty, DeskHeader, DeskPlaque, padTicket, rankStyle, type RankTone } from "@/components/desk/DeskChrome";

const groups = ["LIVE", "UPCOMING", "SCHEDULED", "COMPLETED", "CANCELLED"] as const;

function statusTone(status: BrawlStatus): RankTone {
  switch (status) {
    case "LIVE":
      return "gold";
    case "UPCOMING":
      return "silver";
    case "SCHEDULED":
      return "rest";
    case "COMPLETED":
      return "rest";
    case "CANCELLED":
      return "bronze";
    default: {
      const _exhaustive: never = status;
      return _exhaustive;
    }
  }
}

function statusCopy(status: BrawlStatus) {
  switch (status) {
    case "LIVE":
      return "Live corridor";
    case "UPCOMING":
      return "Upcoming";
    case "SCHEDULED":
      return "Scheduled";
    case "COMPLETED":
      return "Completed";
    case "CANCELLED":
      return "Cancelled";
    default: {
      const _exhaustive: never = status;
      return _exhaustive;
    }
  }
}

export default async function AdminBrawlsPage() {
  const lists = await Promise.all(groups.map((status) => listBrawlsByStatus(status)));
  const all = lists.flat();
  const [products, publishedProducts] = await Promise.all([getProductsByIds(all.flatMap((brawl) => [brawl.productAId ?? brawl.leftProductId, brawl.productBId ?? brawl.rightProductId, brawl.winnerProductId ?? ""])), listPublishedProducts(200)]);
  const byId = new Map(products.map((product) => [product.id, product]));
  return (
    <div>
      <DeskHeader
        kind="admin"
        eyebrow="Match corridors"
        title="Keep the arena moving."
        description="Inspect scheduled, live, and completed organic matchups. Finalization is guarded and safe to retry."
        icon={Swords}
      />
      <div className="relative mt-8">
        <BrawlScheduler products={publishedProducts} />
      </div>
      {groups.map((status, groupIndex) => {
        const items = lists[groupIndex] ?? [];
        const tone = statusTone(status);
        const style = rankStyle(tone);
        return (
          <section key={status} className="relative mt-8">
            <div className="flex items-center gap-2">
              <span className={cn("inline-flex items-center rounded-[12px] rounded-br-[5px] border px-2 py-1 text-[10px] font-black uppercase tracking-[0.12em]", style.badge)}>{statusCopy(status)}</span>
              <span className="text-xs font-black text-muted">{items.length}</span>
            </div>
            <div className="mt-3 grid gap-3">
              {items.length === 0 ? (
                <DeskEmpty title={`No Brawls in ${statusCopy(status).toLowerCase()}.`} body="This corridor stays empty until a matchup lands in this state." />
              ) : items.map((brawl, index) => {
                const left = byId.get(brawl.productAId ?? brawl.leftProductId);
                const right = byId.get(brawl.productBId ?? brawl.rightProductId);
                return (
                  <DeskPlaque key={brawl.id} tone={tone}>
                    <div className="flex flex-wrap items-center gap-4">
                      <span className={cn("grid h-11 w-11 place-items-center rounded-[12px] rounded-br-[5px] border text-[11px] font-black", style.medal)}>{padTicket(index)}</span>
                      <div className="min-w-[220px] flex-1">
                        <p className="font-black">{left?.name ?? "Product A"} vs {right?.name ?? "Product B"}</p>
                        <p className="mt-1 text-xs text-muted">{brawl.id} · {brawl.prompt}</p>
                      </div>
                      <div className="text-xs font-black text-muted">{brawl.leftVotes.toLocaleString()} — {brawl.rightVotes.toLocaleString()} votes</div>
                      <div className="text-xs font-black text-muted">
                        {status === "LIVE" ? (
                          <span className="inline-flex items-center gap-1"><CalendarClock size={13} />Ends {new Date(brawl.endsAt).toLocaleDateString()}</span>
                        ) : status === "COMPLETED" ? (
                          <span className="inline-flex items-center gap-1 text-[#3E8E65]"><CheckCircle2 size={13} />{brawl.winnerProductId ? byId.get(brawl.winnerProductId)?.name : "Draw"}</span>
                        ) : (
                          "Scheduled"
                        )}
                      </div>
                      <div className="flex items-center gap-2">
                        <Link href={`/brawl/${brawl.id}`} className="inline-flex h-9 w-9 items-center justify-center rounded-[12px] rounded-br-[5px] border border-line text-muted hover:text-coral" aria-label={`Open ${brawl.id}`}>
                          <ArrowUpRight size={14} />
                        </Link>
                        {status === "LIVE" ? <FinalizeBrawlButton brawlId={brawl.id} /> : null}
                        <BrawlLifecycleActions brawlId={brawl.id} status={status} />
                      </div>
                    </div>
                  </DeskPlaque>
                );
              })}
            </div>
          </section>
        );
      })}
    </div>
  );
}
