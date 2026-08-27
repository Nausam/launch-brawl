import { redirect } from "next/navigation";
import { Bell, KeyRound, UserRound } from "lucide-react";
import { getCurrentAppUser } from "@/lib/integrations/auth";
import { SettingsForm } from "@/components/dashboard/SettingsForm";
import { DeskHeader, DeskPlaque } from "@/components/desk/DeskChrome";

export default async function SettingsPage() {
  const user = await getCurrentAppUser();
  if (!user) redirect("/sign-in");
  return (
    <div>
      <DeskHeader
        kind="owner"
        eyebrow="Maker desk"
        title="Keep the profile honest."
        description="Display name, username, and the notification lamps for this Clerk account."
        icon={UserRound}
      />
      <div className="relative mt-8 grid gap-6 lg:grid-cols-[minmax(0,1fr)_280px]">
        <section>
          <div className="inline-flex items-center gap-2 rounded-[14px] rounded-br-[6px] border border-coral/30 bg-coral/10 px-3 py-1.5 text-[10px] font-black uppercase tracking-[0.16em] text-coral">
            Profile
          </div>
          <h2 className="display mt-3 text-2xl font-black tracking-[-0.04em] text-ink">Who shows up on the board.</h2>
          <div className="mt-5">
            <SettingsForm displayName={user.displayName} username={user.username} email={user.email} website={user.website ?? ""} bio={user.bio ?? ""} imageUrl={user.imageUrl ?? ""} notificationPreferences={user.notificationPreferences} />
          </div>
        </section>
        <aside className="grid gap-3 self-start">
          <DeskPlaque tone="silver">
            <Bell size={18} className="text-coral" />
            <p className="mt-4 text-sm font-black">Notification lamps</p>
            <p className="mt-1 text-xs leading-5 text-muted">Outbid, campaign delivery, winner, and product activity emails use {user.email || "this session"}.</p>
          </DeskPlaque>
          <DeskPlaque tone="rest">
            <KeyRound size={18} className="text-coral" />
            <p className="mt-4 text-sm font-black">Authentication</p>
            <p className="mt-1 text-xs leading-5 text-muted">Clerk handles Google, email, and account security. Launch Brawl never stores a password.</p>
          </DeskPlaque>
        </aside>
      </div>
    </div>
  );
}
