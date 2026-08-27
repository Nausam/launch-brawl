import type { Metadata } from "next";
import { Search, ShieldCheck } from "lucide-react";
import { listAdminAuditLogs } from "@/lib/repositories/admin";
import { cn, relativeTime } from "@/lib/utils";
import { DeskEmpty, DeskHeader, DeskPlaque, padTicket, rankStyle, type RankTone } from "@/components/desk/DeskChrome";

export const metadata: Metadata = { title: "Audit logs", robots: { index: false, follow: false } };

function auditTone(index: number): RankTone {
  if (index === 0) return "gold";
  if (index === 1) return "silver";
  if (index === 2) return "bronze";
  return "rest";
}

export default async function AdminAuditPage({ searchParams }: { searchParams: Promise<{ q?: string }> }) {
  const query = (await searchParams).q ?? "";
  const logs = await listAdminAuditLogs(150, query);
  return (
    <div>
      <DeskHeader
        kind="admin"
        eyebrow="Ink tape"
        title="Every operator action, stamped."
        description="Every moderation, financial, lifecycle, settings, and repair action should be traceable to an operator."
        icon={ShieldCheck}
      />
      <form className="relative mt-7 flex max-w-xl gap-2" action="/admin/audit">
        <label className="relative flex-1">
          <Search size={15} className="absolute left-3 top-3.5 text-muted" />
          <input name="q" defaultValue={query} placeholder="Filter by actor, action, entity, or ID" className="w-full rounded-[16px] rounded-br-[7px] border border-line bg-paper px-9 py-3 text-sm outline-none focus:border-ink" />
        </label>
        <button className="rounded-[16px] rounded-br-[7px] border border-ink bg-ink px-5 py-3 text-xs font-black text-white">Filter</button>
      </form>
      <div className="relative mt-7 grid gap-3">
        {logs.length ? logs.map((log, index) => {
          const tone = auditTone(index);
          const style = rankStyle(tone);
          return (
            <DeskPlaque key={log.id} tone={tone}>
              <div className="grid gap-3 sm:grid-cols-[auto_160px_minmax(0,1fr)_140px] sm:items-center">
                <span className={cn("grid h-11 w-11 place-items-center rounded-[12px] rounded-br-[5px] border text-[11px] font-black", style.medal)}>{padTicket(index)}</span>
                <p className="text-xs text-muted">{relativeTime(log.createdAt)}</p>
                <div>
                  <p className="font-black">{log.action}</p>
                  <p className="mt-1 text-xs text-muted">{log.entityType} {log.entityId}</p>
                </div>
                <div className="text-xs">
                  <p className="font-black">{log.actorId}</p>
                  <p className="mt-1 font-mono text-[10px] text-muted">{log.requestId || "—"}</p>
                </div>
              </div>
            </DeskPlaque>
          );
        }) : <DeskEmpty title="No audit records match this filter." body="Widen the query or wait for the next operator action to stamp the tape." />}
      </div>
    </div>
  );
}
