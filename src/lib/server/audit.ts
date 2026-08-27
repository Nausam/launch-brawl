import { getAdminDb } from "@/lib/firebase/admin";

export async function recordAdminAuditLog(input: { actorId: string; action: string; entityType: string; entityId?: string; requestId?: string; metadata?: Record<string, string | number | boolean> }) {
  const db = getAdminDb();
  if (!db) return { recorded: false };
  try {
    const ref = db.collection("adminAuditLogs").doc(`${Date.now()}_${crypto.randomUUID()}`);
    await ref.set({ id: ref.id, actorId: input.actorId, action: input.action, entityType: input.entityType, entityId: input.entityId ?? "", requestId: input.requestId ?? "", metadata: input.metadata ?? {}, createdAt: new Date() });
    return { recorded: true, id: ref.id };
  } catch {
    return { recorded: false };
  }
}
