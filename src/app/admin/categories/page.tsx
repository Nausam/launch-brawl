import { Tags } from "lucide-react";
import { listCategories } from "@/lib/repositories/catalog";
import { cn } from "@/lib/utils";
import { CategoryForm } from "@/components/admin/CategoryForm";
import { DeskEmpty, DeskHeader, DeskPlaque, DeskStat, padTicket, rankStyle, type RankTone } from "@/components/desk/DeskChrome";

export const dynamic = "force-dynamic";

function categoryTone(index: number, active: boolean): RankTone {
  if (!active) return "rest";
  if (index === 0) return "gold";
  if (index === 1) return "silver";
  if (index === 2) return "bronze";
  return "rest";
}

export default async function AdminCategoriesPage() {
  const categories = await listCategories();
  const active = categories.filter((category) => category.active).length;
  return (
    <div>
      <DeskHeader
        kind="admin"
        eyebrow="Taxonomy wall"
        title="Name the corners of the floor."
        description="Categories are centralized in Firestore and shared by discovery, search, product submission, and leagues."
        icon={Tags}
      />
      <div className="relative mt-6 flex flex-wrap gap-3">
        <DeskStat icon={Tags} value={String(categories.length)} label="On the wall" tone="blue" />
        <DeskStat icon={Tags} value={String(active)} label="Active" tone="mint" />
      </div>
      <div className="relative mt-8 grid gap-8 lg:grid-cols-[minmax(280px,.72fr)_minmax(0,1.28fr)]">
        <CategoryForm />
        <section>
          <div className="inline-flex items-center rounded-[14px] rounded-br-[6px] border border-[#b7cfe0] bg-[#eef6fc] px-3 py-1.5 text-[10px] font-black uppercase tracking-[0.16em] text-[#355875]">
            Live catalog
          </div>
          <h2 className="display mt-3 text-2xl font-black tracking-[-0.04em] text-ink">Available categories</h2>
          <div className="mt-4 grid gap-3">
            {categories.length ? categories.map((category, index) => {
              const tone = categoryTone(index, category.active);
              const style = rankStyle(tone);
              return (
                <DeskPlaque key={category.id} tone={tone}>
                  <div className="flex items-center gap-3">
                    <span className={cn("grid h-11 w-11 place-items-center rounded-[12px] rounded-br-[5px] border text-[11px] font-black", style.medal)}>{padTicket(index)}</span>
                    <span className="grid h-11 w-11 place-items-center rounded-[12px] rounded-br-[5px] text-white" style={{ backgroundColor: category.accent }}>{category.icon}</span>
                    <div className="min-w-0 flex-1">
                      <p className="font-black">{category.name}</p>
                      <p className="mt-1 text-xs text-muted">/{category.slug}</p>
                    </div>
                    <span className={cn("text-[10px] font-black uppercase tracking-[0.12em]", category.active ? "text-[#3E8E65]" : "text-muted")}>{category.active ? "Active" : "Inactive"}</span>
                  </div>
                </DeskPlaque>
              );
            }) : <DeskEmpty title="No active categories yet." body="Add the first one using the form on the left." />}
          </div>
        </section>
      </div>
    </div>
  );
}
