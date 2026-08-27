import { ShieldCheck, Users } from "lucide-react";
import type { AppUserRole } from "@/lib/types";
import { listAdminUsers } from "@/lib/repositories/admin";
import { cn } from "@/lib/utils";
import { DeskEmpty, DeskHeader, DeskPlaque, DeskStat, padTicket, rankStyle, type RankTone } from "@/components/desk/DeskChrome";

export const dynamic = "force-dynamic";

function roleTone(role: AppUserRole): RankTone {
  switch (role) {
    case "ADMIN":
      return "gold";
    case "MODERATOR":
      return "silver";
    case "USER":
      return "rest";
    default: {
      const _exhaustive: never = role;
      return _exhaustive;
    }
  }
}

export default async function AdminUsersPage() {
  const users = await listAdminUsers();
  const admins = users.filter((user) => user.role === "ADMIN").length;
  return (
    <div>
      <DeskHeader
        kind="admin"
        eyebrow="Roster plaques"
        title="Who holds a key."
        description="Clerk-backed accounts and their server-side Firestore roles."
        icon={Users}
      />
      <div className="relative mt-6 flex flex-wrap gap-3">
        <DeskStat icon={Users} value={String(users.length)} label="Accounts" tone="blue" />
        <DeskStat icon={ShieldCheck} value={String(admins)} label="Admins" tone="gold" />
      </div>
      <div className="relative mt-8 grid gap-3">
        {users.length ? users.map((user, index) => {
          const tone = roleTone(user.role);
          const style = rankStyle(tone);
          return (
            <DeskPlaque key={user.id} tone={tone}>
              <div className="flex flex-wrap items-center gap-4">
                <span className={cn("grid h-11 w-11 place-items-center rounded-[12px] rounded-br-[5px] border text-[11px] font-black", style.medal)}>{padTicket(index)}</span>
                <div className="min-w-[220px] flex-1">
                  <p className="font-black">{user.displayName}</p>
                  <p className="mt-1 text-xs text-muted">@{user.username} · {user.email || "No email on record"}</p>
                </div>
                <span className={cn("inline-flex items-center gap-1 rounded-[12px] rounded-br-[5px] border px-2 py-1 text-[10px] font-black uppercase tracking-[0.12em]", style.badge)}>
                  {user.role === "ADMIN" ? <ShieldCheck size={12} /> : null}
                  {user.role}
                </span>
              </div>
            </DeskPlaque>
          );
        }) : <DeskEmpty title="No persisted users are available." body="Clerk sessions write a Firestore user record on first sign-in." />}
      </div>
    </div>
  );
}
