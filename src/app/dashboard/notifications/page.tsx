import { redirect } from "next/navigation";
import { Bell, Check } from "lucide-react";
import type { Notification } from "@/lib/types";
import { getCurrentAppUser } from "@/lib/integrations/auth";
import { listOwnerNotifications } from "@/lib/repositories/owner";
import { cn, relativeTime } from "@/lib/utils";
import { EmptyPanel } from "@/components/dashboard/EmptyPanel";
import { ChallengeResponseActions } from "@/components/dashboard/ChallengeResponseActions";
import { ProductMemberInvitationActions } from "@/components/dashboard/ProductMemberInvitationActions";
import { DeskHeader, DeskPlaque, padTicket, rankStyle, type RankTone } from "@/components/desk/DeskChrome";

type NoticeTone = Notification["tone"];

function noticeRank(tone: NoticeTone, read: boolean): RankTone {
  if (read) return "rest";
  switch (tone) {
    case "coral":
      return "bronze";
    case "blue":
      return "silver";
    case "green":
      return "gold";
    case "neutral":
      return "rest";
    default: {
      const _exhaustive: never = tone;
      return _exhaustive;
    }
  }
}

export default async function NotificationsPage() {
  const user = await getCurrentAppUser();
  if (!user) redirect("/sign-in");
  const notifications = await listOwnerNotifications(user.id);
  const unread = notifications.filter((item) => !item.read).length;
  return (
    <div>
      <DeskHeader
        kind="owner"
        eyebrow="Inbox tape"
        title={unread ? `${unread} waiting on the tape.` : "Inbox is clear."}
        description="Challenges, Brawl results, streaks, and useful launch activity for this signed-in account."
        icon={Bell}
      />
      <div className="relative mt-8 grid gap-3">
        {notifications.length ? (
          notifications.map((notification, index) => {
            const tone = noticeRank(notification.tone, notification.read);
            const style = rankStyle(tone);
            return (
              <DeskPlaque key={notification.id} tone={tone} className={notification.read ? "opacity-70" : undefined}>
                <div className="flex gap-4">
                  <span className={cn("grid h-11 w-11 shrink-0 place-items-center rounded-[12px] rounded-br-[5px] border text-[11px] font-black", style.medal)}>
                    {padTicket(index)}
                  </span>
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="text-sm font-black text-ink">{notification.title}</p>
                      {!notification.read ? (
                        <span className={cn("inline-flex items-center rounded-[12px] rounded-br-[5px] border px-2 py-1 text-[10px] font-black uppercase tracking-[0.12em]", style.badge)}>
                          New
                        </span>
                      ) : null}
                    </div>
                    <p className="mt-1 text-sm leading-6 text-muted">{notification.body}</p>
                    <p className="mt-2 text-xs text-muted">{relativeTime(notification.timestamp)}</p>
                    {notification.type === "BRAWL_CHALLENGE_RECEIVED" && notification.entityId && !notification.read ? (
                      <div className="mt-4">
                        <ChallengeResponseActions challengeId={notification.entityId} notificationId={notification.id} />
                      </div>
                    ) : null}
                    {notification.type === "PRODUCT_MEMBER_INVITED" && notification.entityId && !notification.read ? <ProductMemberInvitationActions productId={notification.entityId} /> : null}
                  </div>
                  {notification.read ? <Check size={16} className="text-[#3E8E65]" /> : <Bell size={16} className="text-coral" />}
                </div>
              </DeskPlaque>
            );
          })
        ) : (
          <EmptyPanel title="Inbox is clear" body="When someone challenges you, a campaign moves, or a Brawl result lands, it will show up here for this signed-in account." />
        )}
      </div>
      <p className="mt-7 flex items-start gap-3 text-xs leading-5 text-muted">
        <Bell size={15} className="mt-0.5 shrink-0 text-coral" />
        High-value events are written to the notifications collection for your Clerk user ID when Firestore is configured.
      </p>
    </div>
  );
}
