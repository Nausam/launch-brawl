import { getPlatformSettings } from "@/lib/server/settings";

export async function MaintenanceBanner() {
  const settings = await getPlatformSettings();
  if (!settings.maintenanceMode) return null;
  return <div role="status" className="border-b border-[#e6b42f]/40 bg-butter px-5 py-3 text-center text-xs font-bold text-ink">{settings.maintenanceMessage}</div>;
}
