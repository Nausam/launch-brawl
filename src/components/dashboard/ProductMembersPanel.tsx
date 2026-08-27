"use client";

import { useState, type FormEvent } from "react";
import type { ProductMember } from "@/lib/types";
import { Button } from "@/components/ui/Button";

type MemberView = ProductMember & { user?: { displayName: string; username: string; email: string } };

export function ProductMembersPanel({ productId, initialMembers }: { productId: string; initialMembers: MemberView[] }) {
  const [members, setMembers] = useState(initialMembers);
  const [identifier, setIdentifier] = useState("");
  const [role, setRole] = useState<"EDITOR" | "VIEWER">("EDITOR");
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);
  const invite = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setBusy(true);
    setMessage("");
    try {
      const response = await fetch(`/api/products/${productId}/members`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ identifier, role }) });
      const result = await response.json().catch(() => ({})) as { error?: string; member?: ProductMember };
      if (!response.ok) { setMessage(result.error ?? "The invitation could not be sent."); return; }
      setMessage("Invitation sent.");
      setIdentifier("");
      if (result.member) setMembers((current) => [...current, result.member!]);
    } catch { setMessage("The member service is unavailable right now."); }
    finally { setBusy(false); }
  };
  const update = async (memberUserId: string, nextRole: "EDITOR" | "VIEWER" | "REMOVED") => {
    setBusy(true);
    setMessage("");
    const response = await fetch(`/api/products/${productId}/members`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ memberUserId, role: nextRole }) });
    const result = await response.json().catch(() => ({})) as { error?: string };
    setMessage(response.ok ? "Member permissions updated." : result.error ?? "The member could not be updated.");
    if (response.ok) setMembers((current) => current.map((member) => member.userId === memberUserId ? { ...member, role: nextRole === "REMOVED" ? "VIEWER" : nextRole, status: nextRole === "REMOVED" ? "REMOVED" : "ACTIVE" } : member));
    setBusy(false);
  };
  return <section className="rounded-[24px] rounded-br-[10px] border-2 border-[#d6e3ef] bg-white/80 p-6"><div className="inline-flex items-center rounded-[14px] rounded-br-[6px] border border-[#b7cfe0] bg-[#eef6fc] px-3 py-1.5 text-[10px] font-black uppercase tracking-[0.16em] text-[#355875]">Ownership and makers</div><h2 className="display mt-3 text-2xl font-black tracking-[-0.04em]">Product team</h2><p className="mt-2 text-xs leading-5 text-muted">Invite a Launch Brawl user by username, email, or Firestore user ID. Ownership transfers remain explicit and auditable.</p><form onSubmit={invite} className="mt-5 flex flex-col gap-2 sm:flex-row"><input required value={identifier} onChange={(event) => setIdentifier(event.target.value)} placeholder="username or email" className="min-w-0 flex-1 border border-line bg-paper-strong/45 px-3 py-2.5 text-sm outline-none focus:border-ink" /><select value={role} onChange={(event) => setRole(event.target.value as "EDITOR" | "VIEWER")} className="border border-line bg-paper px-3 py-2.5 text-xs font-bold"><option value="EDITOR">Editor</option><option value="VIEWER">Viewer</option></select><Button type="submit" variant="primary" size="sm" disabled={busy}>{busy ? "Sending…" : "Invite"}</Button></form><div className="mt-6 border-t border-line">{members.map((member) => <div key={member.id} className="flex flex-wrap items-center gap-3 border-b border-line py-4 last:border-0"><div className="min-w-[180px] flex-1"><p className="text-sm font-black">{member.user?.displayName ?? member.userId}</p><p className="mt-1 text-xs text-muted">{member.user?.username ? `@${member.user.username}` : member.user?.email ?? member.userId}</p></div><span className="text-[10px] font-black uppercase tracking-[0.12em] text-muted">{member.status} · {member.role}</span>{member.role !== "OWNER" && member.status !== "REMOVED" && <div className="flex gap-2"><button type="button" disabled={busy} onClick={() => void update(member.userId, member.role === "EDITOR" ? "VIEWER" : "EDITOR")} className="text-[11px] font-bold text-ink underline decoration-coral">Make {member.role === "EDITOR" ? "viewer" : "editor"}</button><button type="button" disabled={busy} onClick={() => void update(member.userId, "REMOVED")} className="text-[11px] font-bold text-coral underline">Remove</button></div>}</div>)}{!members.length && <p className="py-6 text-sm text-muted">No additional product members yet.</p>}</div>{message && <p className="mt-4 text-xs font-bold text-muted" role="status">{message}</p>}</section>;
}
