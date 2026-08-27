import { Calculator, Database, KeyRound, SlidersHorizontal } from "lucide-react";
import { calculateCampaignImpressions } from "@/lib/utils";
import { GAMIFICATION_CONFIG } from "@/lib/server/gamification";
import { FeatureFlagPanel } from "@/components/admin/FeatureFlagPanel";
import { PlatformSettingsPanel } from "@/components/admin/PlatformSettingsPanel";
import { getPlatformSettings } from "@/lib/server/settings";
import { DeskHeader, DeskPlaque } from "@/components/desk/DeskChrome";

export default async function AdminSettingsPage() {
  const settings = await getPlatformSettings();
  return (
    <div>
      <DeskHeader
        kind="admin"
        eyebrow="Control desk"
        title="Pause a system without taking the site down."
        description="Commercial formulas and competitive policies are centralized so organic systems can be paused safely without changing payment logic."
        icon={SlidersHorizontal}
      />
      <div className="relative mt-8 grid gap-6 lg:grid-cols-2">
        <PlatformSettingsPanel settings={settings} />
        <section>
          <div className="inline-flex items-center rounded-[14px] rounded-br-[6px] border border-[#b7cfe0] bg-[#eef6fc] px-3 py-1.5 text-[10px] font-black uppercase tracking-[0.16em] text-[#355875]">
            Organic rules
          </div>
          <h2 className="display mt-3 text-2xl font-black tracking-[-0.04em] text-ink">Read-only policy lamps</h2>
          <div className="mt-4 grid gap-3">
            <DeskPlaque tone="silver">
              <p className="text-[10px] font-black uppercase tracking-[0.14em] text-muted">Elo K factor</p>
              <p className="mt-2 text-2xl font-black">{GAMIFICATION_CONFIG.rating.kFactor} <span className="text-xs font-bold text-muted">rating</span></p>
            </DeskPlaque>
            <DeskPlaque tone="rest">
              <p className="text-[10px] font-black uppercase tracking-[0.14em] text-muted">Close Brawl threshold</p>
              <p className="mt-2 text-2xl font-black">{GAMIFICATION_CONFIG.brawls.closeMarginPercent} <span className="text-xs font-bold text-muted">percent</span></p>
            </DeskPlaque>
            <p className="flex items-start gap-3 text-xs leading-5 text-muted">
              <Calculator size={15} className="mt-0.5 shrink-0 text-coral" />
              At 50 USD, the current formula creates {calculateCampaignImpressions(5000, settings.promoImpressionsPerDollar).toLocaleString()} promotional impressions. That commercial value never enters Brawl Rating or league placement.
            </p>
          </div>
        </section>
        <div className="grid gap-3 lg:col-span-2 lg:grid-cols-3">
          <DeskPlaque tone="gold">
            <Database size={18} className="text-[#7f570b]" />
            <p className="mt-4 text-sm font-black">Firestore</p>
            <p className="mt-1 text-xs leading-5 text-muted">Server-side Admin SDK, deterministic IDs, transaction-backed activation, and aggregate competitive stats.</p>
            <p className="mt-3 text-[10px] font-black uppercase tracking-[0.12em] text-muted">{process.env.FIREBASE_PROJECT_ID ? "Configured" : "Needs credentials"}</p>
          </DeskPlaque>
          <DeskPlaque tone="silver">
            <KeyRound size={18} className="text-[#355875]" />
            <p className="mt-4 text-sm font-black">Payments & auth</p>
            <p className="mt-1 text-xs leading-5 text-muted">Freemius hosted checkout/webhooks and Clerk authentication remain separate from organic competition.</p>
            <p className="mt-3 text-[10px] font-black uppercase tracking-[0.12em] text-muted">{process.env.FREEMIUS_SECRET_KEY ? "Configured" : "Needs credentials"}</p>
          </DeskPlaque>
          <DeskPlaque tone="rest">
            <SlidersHorizontal size={18} className="text-coral" />
            <p className="mt-4 text-sm font-black">Integrity policy</p>
            <p className="mt-1 text-xs leading-5 text-muted">Votes, predictions, XP, achievements, Boss changes, and season points are server-validated and idempotent.</p>
            <p className="mt-3 text-[10px] font-black uppercase tracking-[0.12em] text-muted">Active</p>
          </DeskPlaque>
        </div>
      </div>
      <div className="mt-6"><FeatureFlagPanel initialFlags={settings.featureFlags} /></div>
    </div>
  );
}
