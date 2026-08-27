import { Sparkles } from "lucide-react";
import { getAdminDb } from "@/lib/firebase/admin";
import { cn } from "@/lib/utils";
import { QuestAdminForm } from "@/components/admin/GamificationAdminControls";
import { DeskEmpty, DeskHeader, DeskPlaque, DeskStat, padTicket, rankStyle, type RankTone } from "@/components/desk/DeskChrome";

export default async function AdminQuestsPage() {
  const db = getAdminDb();
  const templates = db ? (await db.collection("questTemplates").limit(100).get()).docs.map((document) => ({ id: document.id, data: document.data() })) : [];
  const active = templates.filter((template) => template.data.active !== false).length;
  return (
    <div>
      <DeskHeader
        kind="admin"
        eyebrow="Quest board"
        title="Daily objectives, versioned."
        description="Version and activate daily quest templates. The minute-level maintenance job creates deterministic daily instances from active templates."
        icon={Sparkles}
      />
      <div className="relative mt-6 flex flex-wrap gap-3">
        <DeskStat icon={Sparkles} value={String(templates.length)} label="Templates" tone="gold" />
        <DeskStat icon={Sparkles} value={String(active)} label="Active" tone="mint" />
      </div>
      <div className="relative mt-8 grid gap-6 lg:grid-cols-[.8fr_1.2fr]">
        <QuestAdminForm />
        <section>
          <div className="inline-flex items-center rounded-[14px] rounded-br-[6px] border border-[#c58a0a]/35 bg-[linear-gradient(100deg,#ffdc7c,#f5c44b)] px-3 py-1.5 text-[10px] font-black uppercase tracking-[0.16em] text-[#4d3a14]">
            Configured templates
          </div>
          <h2 className="display mt-3 text-2xl font-black tracking-[-0.04em] text-ink">What the job will stamp today.</h2>
          <div className="mt-4 grid gap-3">
            {templates.length ? templates.map((template, index) => {
              const tone: RankTone = template.data.active === false ? "rest" : "gold";
              const style = rankStyle(tone);
              return (
                <DeskPlaque key={template.id} tone={tone}>
                  <div className="flex flex-wrap items-center gap-3">
                    <span className={cn("grid h-11 w-11 place-items-center rounded-[12px] rounded-br-[5px] border text-[11px] font-black", style.medal)}>{padTicket(index)}</span>
                    <div className="min-w-0 flex-1">
                      <p className="font-black">{String(template.data.title ?? template.id)}</p>
                      <p className="mt-1 text-xs text-muted">{template.id} · {String(template.data.type ?? "DISCOVER_PRODUCTS")} · target {String(template.data.target ?? 1)}</p>
                    </div>
                    <span className={cn("inline-flex items-center rounded-[12px] rounded-br-[5px] border px-2 py-1 text-[10px] font-black uppercase tracking-[0.12em]", style.badge)}>
                      {template.data.active === false ? "Inactive" : "Active"}
                    </span>
                  </div>
                </DeskPlaque>
              );
            }) : <DeskEmpty title="No custom templates yet." body="The built-in defaults remain active until you stamp a new one." />}
          </div>
        </section>
      </div>
    </div>
  );
}
